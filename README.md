# RK-HOMESCHOOL-HUB-1.1
Web App
public/homeschool-hub/solfege-staircase/index.html -----

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />

  <title>🎵 Solfege Staircase · Renaissance Kids</title>

  <!-- SEO -->
  <meta name="title" content="🎵 Solfege Staircase · Renaissance Kids">
  <meta name="description" content="Climb the musical stairs! A fun, interactive ear-training game that helps children recognize and sing the notes of the major scale. Free from Renaissance Kids.">

  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://www.renkids.org/homeschool-hub/solfege-staircase">
  <meta property="og:title" content="🎵 Solfege Staircase · Renaissance Kids">
  <meta property="og:description" content="Climb the musical stairs! A fun, interactive ear-training game that helps children recognize and sing the notes of the major scale. Free from Renaissance Kids.">
  <meta property="og:image" content="https://www.renkids.org/images/rk-solfege-share.png">

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="🎵 Solfege Staircase · Renaissance Kids">
  <meta name="twitter:description" content="Climb the musical stairs! A fun, interactive ear-training game for young musicians.">
  <meta name="twitter:image" content="https://www.renkids.org/images/rk-solfege-share.png">

  <style>
    :root{
      --rk-green:#2F6B65;
      --rk-yellow:#FBC440;
      --rk-orange:#F05A22;
      --bg:#fdfbf7;
      --panel:#ffffff;
      --ink:#1c1c1c;
    }

    body{
      margin:0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      background: var(--bg);
      color: var(--ink);
      display:flex;
      justify-content:center;
      padding:18px;
    }

    .game-container{
      width:min(860px, 100%);
      background: var(--panel);
      border-radius: 28px;
      border: 3px solid rgba(47,107,101,.18);
      box-shadow: 0 18px 40px rgba(47,107,101,.18);
      overflow:hidden;
    }

    header{
      background: var(--rk-green);
      color:#fff;
      padding:18px 20px;
      display:flex;
      align-items:center;
      justify-content:space-between;
      border-bottom: 6px solid var(--rk-yellow);
      gap:14px;
    }

    .brand{
      display:flex;
      align-items:center;
      gap:12px;
      font-weight:800;
      letter-spacing:.2px;
    }

    .brand .badge{
      width:44px;height:44px;border-radius:14px;
      background:#fff;
      display:grid;place-items:center;
      color: var(--rk-orange);
      font-size:20px;
      box-shadow:0 6px 14px rgba(0,0,0,.12);
    }

    .score-board{
      display:flex;
      align-items:center;
      gap:10px;
      font-weight:800;
      background: rgba(255,255,255,.12);
      padding:10px 14px;
      border-radius:999px;
      border:2px solid rgba(255,255,255,.20);
    }

    .score-pill{
      background: var(--rk-yellow);
      color:#1c1c1c;
      padding:6px 12px;
      border-radius:999px;
      border:2px solid rgba(0,0,0,.25);
      min-width:44px;
      text-align:center;
    }

    main{ padding:18px 18px 22px; }

    .message{
      background:#fff7e6;
      border:2px solid rgba(251,196,64,.55);
      border-radius:18px;
      padding:14px 14px;
      font-weight:650;
      margin-bottom:14px;
    }

    .play-row{
      display:flex;
      flex-wrap:wrap;
      gap:10px;
      align-items:center;
      margin-bottom:16px;
    }

    .btn{
      border:2px solid rgba(0,0,0,.25);
      border-radius:999px;
      padding:12px 16px;
      font-weight:800;
      cursor:pointer;
      background:#fff;
    }
    .btn-primary{
      background: var(--rk-orange);
      color:#fff;
      border-color: rgba(0,0,0,.25);
    }
    .btn-secondary{
      background: var(--rk-yellow);
      color:#1c1c1c;
    }

    .staircase{
      display:grid;
      gap:10px;
    }

    .step{
      display:flex;
      align-items:center;
      justify-content:space-between;
      gap:12px;
      padding:14px 14px;
      border-radius:18px;
      border:2px solid rgba(47,107,101,.18);
      background:#fff;
      box-shadow:0 10px 18px rgba(0,0,0,.06);
      user-select:none;
    }

    .step[aria-disabled="true"]{
      opacity:.55;
      pointer-events:none;
    }

    .solfege{
      font-weight:900;
      background: rgba(47,107,101,.12);
      color: var(--rk-green);
      padding:8px 12px;
      border-radius:999px;
      border:2px solid rgba(47,107,101,.18);
      min-width:90px;
      text-align:center;
      letter-spacing:.6px;
    }

    .note-letter{
      font-weight:900;
      background: rgba(251,196,64,.25);
      padding:8px 12px;
      border-radius:999px;
      border:2px solid rgba(0,0,0,.14);
      min-width:60px;
      text-align:center;
    }

    .footer-note{
      padding:12px 18px 18px;
      color: rgba(0,0,0,.55);
      font-weight:650;
      text-align:center;
    }

    /* PRINT MODE: worksheet conversion */
    @media print {
      body {
        background: white !important;
        color: black !important;
        padding: 0 !important;
      }
      .game-container {
        background: white !important;
        border: 2px solid #2F6B65 !important;
        box-shadow: none !important;
        width: 100% !important;
        max-width: 100% !important;
        border-radius: 0 !important;
      }
      .btn,
      .score-board,
      .play-row,
      .footer-note {
        display: none !important;
      }
      main{ padding: 18px !important; }
      .staircase { margin-top: 18px; gap: 6px !important; }
      .step {
        background: white !important;
        color: black !important;
        border: 1px solid #ccc !important;
        border-left: 10px solid #2F6B65 !important;
        box-shadow: none !important;
        page-break-inside: avoid;
      }
      .solfege {
        background: #eee !important;
        color: black !important;
        border: 1px solid black !important;
      }
      .note-letter {
        background: white !important;
        border: 1px dotted #666 !important;
      }
      .message {
        border: 1px solid #2F6B65 !important;
        background: white !important;
        margin-top: 18px !important;
        min-height: 90px;
        text-align: left !important;
      }
      .message::before {
        content: "Teacher/Parent Notes:";
        font-weight: bold;
        display: block;
        margin-bottom: 10px;
      }
      header::before {
        content: "Student Name: __________________________  Date: ____________";
        display: block;
        margin-bottom: 10px;
        font-weight: bold;
      }
    }
  </style>
</head>

<body>
  <div class="game-container">
    <header>
      <div class="brand">
        <div class="badge" aria-hidden="true">🎵</div>
        <div>
          <div style="font-size:1.05rem;">Renaissance Kids</div>
          <div style="opacity:.9;font-weight:700;font-size:.92rem;">Solfege Staircase</div>
        </div>
      </div>

      <div class="score-board" aria-label="Score">
        ⭐ Stars
        <span id="scoreDisplay" class="score-pill">0</span>
      </div>
    </header>

    <main>
      <div id="messageBox" class="message">Press <b>PLAY NOTE</b>, then click the matching step.</div>

      <div class="play-row">
        <button id="playBtn" class="btn btn-primary">▶ PLAY NOTE</button>
        <button id="resetBtn" class="btn btn-secondary">↺ Reset Stars</button>
        <button class="btn" onclick="window.print()">🖨 Print Worksheet</button>
      </div>

      <div id="staircase" class="staircase" aria-label="Solfege staircase"></div>
    </main>

    <div class="footer-note">
      “Light up learning through the arts.” · renkids.org · (845) 452-4225
    </div>
  </div>

  <script>
    // ====== SOLFEGE DATA ======
    const steps = [
      { solfege: "DO",  letter: "C",  freq: 261.63 },
      { solfege: "RE",  letter: "D",  freq: 293.66 },
      { solfege: "MI",  letter: "E",  freq: 329.63 },
      { solfege: "FA",  letter: "F",  freq: 349.23 },
      { solfege: "SOL", letter: "G",  freq: 392.00 },
      { solfege: "LA",  letter: "A",  freq: 440.00 },
      { solfege: "TI",  letter: "B",  freq: 493.88 },
      { solfege: "DO",  letter: "C",  freq: 523.25 }
    ];

    // ====== GAME STATE (LOCALSTORAGE ENABLED) ======
    let currentNoteIndex = null;
    let stepsEnabled = false;

    // saved score (defaults to 0)
    let score = parseInt(localStorage.getItem('rk_solfegeScore'), 10);
    if (Number.isNaN(score)) score = 0;

    // DOM
    const staircase = document.getElementById("staircase");
    const messageBox = document.getElementById("messageBox");
    const scoreDisplay = document.getElementById("scoreDisplay");
    const playBtn = document.getElementById("playBtn");
    const resetBtn = document.getElementById("resetBtn");

    // ====== AUDIO ======
    let audioCtx = null;
    function ensureAudio() {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
    }
    function playTone(freq, duration = 0.7) {
      ensureAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;

      // gentle envelope
      gain.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    }

    // ====== UI BUILD ======
    function renderStaircase() {
      staircase.innerHTML = "";
      steps.forEach((s, idx) => {
        const step = document.createElement("div");
        step.className = "step";
        step.setAttribute("role", "button");
        step.setAttribute("tabindex", "0");
        step.setAttribute("aria-label", `Step ${idx + 1}: ${s.solfege} (${s.letter})`);
        step.dataset.index = idx;

        const left = document.createElement("div");
        left.className = "solfege";
        left.textContent = s.solfege;

        const right = document.createElement("div");
        right.className = "note-letter";
        right.textContent = s.letter;

        step.appendChild(left);
        step.appendChild(right);

        step.addEventListener("click", () => handleStepClick(idx));
        step.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleStepClick(idx);
          }
        });

        staircase.appendChild(step);
      });

      disableSteps(true);
    }

    function disableSteps(disabled) {
      const children = staircase.querySelectorAll(".step");
      children.forEach(el => {
        el.setAttribute("aria-disabled", disabled ? "true" : "false");
      });
    }

    // ====== GAME FLOW ======
    function chooseNewNote() {
      currentNoteIndex = Math.floor(Math.random() * steps.length);
      stepsEnabled = true;
      disableSteps(false);
      playTone(steps[currentNoteIndex].freq);
      messageBox.innerHTML = "Listen carefully… then click the matching step!";
    }

    function handleStepClick(clickedIndex) {
      if (!stepsEnabled || currentNoteIndex === null) return;

      if (clickedIndex === currentNoteIndex) {
        // correct
        score++;
        scoreDisplay.innerText = String(score);
        localStorage.setItem('rk_solfegeScore', String(score)); // Save progress
        messageBox.innerText = `✅ CORRECT! That was ${steps[currentNoteIndex].solfege} (${steps[currentNoteIndex].letter}). Great ear!`;
        disableSteps(true);
        stepsEnabled = false;
        currentNoteIndex = null;
      } else {
        // wrong: give hint without shaming
        messageBox.innerText = `Try again — listen once more, then choose the step that matches.`;
        playTone(steps[currentNoteIndex].freq, 0.6);
      }
    }

    function resetScore() {
      score = 0;
      scoreDisplay.innerText = '0';
      localStorage.setItem('rk_solfegeScore', '0'); // Reset saved progress
      messageBox.innerText = "✨ Score reset. Let’s start a new climb!";
      disableSteps(true);
      stepsEnabled = false;
      currentNoteIndex = null;
    }

    // ====== INIT ======
    document.addEventListener("DOMContentLoaded", () => {
      scoreDisplay.innerText = String(score);
      if (score > 0) {
        messageBox.innerText = `👋 Welcome back! You have ${score} stars. Press “PLAY NOTE” to keep climbing!`;
      }
    });

    playBtn.addEventListener("click", chooseNewNote);
    resetBtn.addEventListener("click", resetScore);

    renderStaircase();
  </script>
</body>
</html>

----- END FILE -----

────────────────────────────────────────────────────────────
C) GIT COMMANDS TO “UPLOAD NEW CODE” (copy/paste)
────────────────────────────────────────────────────────────
# from your repo root:
git checkout main
git pull

# add the hero/share image
mkdir -p public/images
# move/copy your hero image into this exact path/name:
# public/images/rk-solfege-share.png

# add the solfege page
mkdir -p public/homeschool-hub/solfege-staircase
# save the HTML above as:
# public/homeschool-hub/solfege-staircase/index.html

git add public/images/rk-solfege-share.png public/homeschool-hub/solfege-staircase/index.html
git commit -m "Add Solfege Staircase: OG tags, localStorage progress, print worksheet mode"
git push origin main

────────────────────────────────────────────────────────────
D) QUICK CHECKS (so it works first try)
────────────────────────────────────────────────────────────
1) Open the page locally → earn stars → refresh → stars should persist.
2) Cmd/Ctrl+P → worksheet layout should hide buttons and print the staircase cleanly.
3) Confirm the OG image path is live:
   https://www.renkids.org/images/rk-solfege-share.png
4) If your live path is NOT /homeschool-hub/solfege-staircase,
   update og:url and (optional) canonical link.

If you tell me your actual folder/routing (Next.js route vs static public files), I’ll output the *exact* file paths + a patch-style diff tailored to your repo.