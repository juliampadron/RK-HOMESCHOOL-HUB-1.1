import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ts from 'typescript';

// Exercise the real page's hooks and handlers. Supabase transport, Next query
// params, audio, and timers are mocked; database authorization is tested in SQL.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const require = createRequire(import.meta.url);
const A='20000000-0000-0000-0000-000000000001';
const B='20000000-0000-0000-0000-000000000002';
let student=A, allowed=true, onlineScore=7, loadError=null, saveError=null, sessionError=null;
let loadWait=null, saveWait=null, onAuth, reloads=0;
const saves=[], sessions=[], cache=new Map([['rk_tutorialSeen','true'],['rk_solfegeScore','999']]);
const localStorage={getItem:key=>cache.get(key)??null,setItem:(key,value)=>cache.set(key,value)};
const client={
  auth:{
    getSession:async()=>({data:{session:{user:{id:'parent-A'}}},error:null}),
    onAuthStateChange:callback=>{onAuth=callback;return {data:{subscription:{unsubscribe(){}}}}},
  },
  rpc:async(name,payload)=>{
    if(name==='can_access_game_student') return {data:allowed,error:null};
    assert.equal(name,'save_game_progress');
    saves.push(payload);
    if(saveWait) await saveWait;
    return {error:saveError};
  },
  from:table=>{
    if(table==='game_sessions') return {insert:async payload=>{sessions.push(payload);return {error:sessionError}}};
    assert.equal(table,'student_game_progress');
    const query={select(){return this},eq(){return this},async maybeSingle(){
      if(loadWait) await loadWait;
      return {data:onlineScore===null?null:{score:onlineScore},error:loadError};
    }};
    return query;
  },
};
const source=readFileSync(new URL('../../app/games/solfege-staircase/page.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}});
assert.equal(compiled.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0);
const mod={exports:{}};
const context={
  module:mod,exports:mod.exports,
  require:name=>name==='@supabase/supabase-js'?{createClient:()=>client}:
    name==='next/navigation'?{useSearchParams:()=>({get:key=>key==='studentId'?student:null})}:require(name),
  process:{env:{NEXT_PUBLIC_SUPABASE_URL:'https://example.test',NEXT_PUBLIC_SUPABASE_ANON_KEY:'test'}},
  window:{location:{reload(){reloads++}},print(){}},localStorage,
  document:{getElementById:()=>null},
  setTimeout:()=>1,clearTimeout(){},Math:Object.assign(Object.create(Math),{random:()=>0}),
};
vm.runInNewContext(compiled.outputText,context,{filename:'solfege-page.cjs'});
const Page=mod.exports.default;
let view;
const flush=async()=>{for(let i=0;i<20;i++) await Promise.resolve()};
async function mount(){await act(async()=>{view=renderer.create(React.createElement(Page));await flush()})}
async function unmount(){await act(async()=>view.unmount())}
const text=()=>JSON.stringify(view.toJSON());
const button=label=>view.root.findAllByType('button').find(b=>b.children.join('').includes(label));
async function click(label){await act(async()=>{button(label).props.onClick();await flush()})}

await mount();
assert.equal(view.root.findByType('fieldset').props.disabled,false);
assert.equal(cache.get(`rk_solfege:parent-A:${A}`),'7');
assert(!text().includes('999'),'legacy global cache must never restore');
sessionError={message:'network'};
await click('PLAY NOTE');
await act(async()=>{view.root.findAllByType('button').find(b=>b.props['data-index']===0).props.onClick();await flush()});
assert.equal(saves.at(-1).p_score,8);
assert.equal(sessions.length,1);
assert(text().includes('Practice history was not saved online'),'score success must not hide history failure');
sessionError=null;
await act(async()=>{view.root.findAllByType('button').find(b=>b.props['data-index']===0).props.onClick();await flush()});
assert.equal(sessions.length,1,'same answered question cannot submit twice');
await click('Reset Stars');
assert.equal(saves.at(-1).p_score,0);

student=B;onlineScore=null;
await act(async()=>{view.update(React.createElement(Page));await flush()});
assert.equal(cache.get(`rk_solfege:parent-A:${B}`),'0','new child starts at zero');
await click('Reset Stars');
assert.equal(saves.at(-1).p_student_id,B);
assert.equal(saves.at(-1).p_score,0);

saveError={message:'denied'};
await click('Reset Stars');
assert(text().includes('Progress was not saved online'));
saveError=null;
onAuth('SIGNED_IN',{user:{id:'parent-A'}});
assert.equal(reloads,0,'same-user auth event does not cause reload loop');
await act(async()=>{onAuth('SIGNED_OUT',null);await flush()});
assert.equal(reloads,1);
assert.equal(view.root.findByType('fieldset').props.disabled,true);
await unmount();
console.log('PASS score save/reset, child isolation, duplicate submission, visible errors, auth change');

allowed=false;
await mount();
assert.equal(view.root.findByType('fieldset').props.disabled,true);
assert(text().includes('cannot access this student'));
await unmount();
allowed=true;loadError={message:'network'};
await mount();
assert.equal(view.root.findByType('fieldset').props.disabled,true);
assert(text().includes('Could not load online progress'));
await unmount();
loadError=null;
console.log('PASS failed/unauthorized loads block writes');

// Old async load must not overwrite the state of a newly selected student.
let releaseLoad;
loadWait=new Promise(resolve=>{releaseLoad=resolve});student=A;onlineScore=50;
await mount();
loadWait=null;student=B;onlineScore=2;
await act(async()=>{view.update(React.createElement(Page));await flush()});
await act(async()=>{releaseLoad();await flush()});
assert.equal(cache.get(`rk_solfege:parent-A:${B}`),'2');
await unmount();
console.log('PASS stale load cancelled when student changes');

// Requests must be serialized so a slow answer save cannot overtake reset.
student=A;onlineScore=7;
await mount();
let releaseSave;
saveWait=new Promise(resolve=>{releaseSave=resolve});
const before=saves.length;
await click('Reset Stars');
await click('Reset Stars');
assert.equal(saves.length,before+1);
await act(async()=>{saveWait=null;releaseSave();await flush()});
assert.equal(saves.length,before+2);
await unmount();
console.log('PASS saves preserve submission order');
