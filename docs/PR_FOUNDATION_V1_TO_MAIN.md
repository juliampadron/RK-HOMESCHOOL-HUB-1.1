# PR: Stabilize Foundation Build and Verify Streaming Checkout Flows

## Summary

This pull request merges the **`foundation/v1`** stabilization baseline into `main`. It resolves the original seven TypeScript/build blockers, removes the legacy dual-App-Router conflict, and adds repeatable regression coverage for the two runtime areas most affected by the dependency migration: **AI chat streaming** and **Square payment-link responses**.

The branch is ready for review and merge. The full validation suite passes, including a browser-to-server-to-browser smoke test for both Parent Assistant and Student Helper.

| Area | Result |
|---|---|
| Original build blockers | **7 resolved; 0 remaining** |
| TypeScript validation | **Pass** |
| ESLint validation | **Pass** |
| Unit tests | **4 / 4 pass** |
| Browser streaming smoke tests | **2 / 2 pass** |
| Production build | **Pass** |

## What Changed

### 1. Foundation stabilization

The branch establishes the Next.js 14 App Router foundation, including the root layout, site styles, Tailwind configuration, environment contract, Supabase server/browser helpers, authentication helpers, shared Zod request contracts, Square integration utilities, and the Supabase UUID identity/RLS migration.

The legacy `src/app/` routes were removed after their supported equivalents were migrated into the active root-level `app/` tree. This eliminates the Next.js dual-app-root conflict and retains the quarterly-report and message endpoints under their supported paths.

### 2. AI SDK v7 chat streaming correction

The original dependency upgrade paired the server's `createUIMessageStreamResponse()` protocol with `TextStreamChatTransport` in the browser. The deterministic browser smoke test caught the runtime mismatch: the client rendered raw `data: {...}` event frames rather than assistant text.

The shared `ChatPanel` now uses **`DefaultChatTransport`**, which is the matching client transport for UI-message streams. The panel also memoizes that transport per endpoint to avoid recreating it during message/status re-renders. Both production routes continue to convert inbound UI messages through `convertToModelMessages()` before calling `streamText()`.

A test-only route at `app/api/chat/mock/route.ts` emits the three predictable chunks `Renaissance`, ` Kids`, and ` is ready.` at 200 ms intervals. It responds only while `CHAT_SMOKE_TEST=1` is set. The two assistant pages route to it only when that environment flag and the explicit `?chatSmoke=1` query parameter are both present. The normal production routes remain `/api/chat/parent` and `/api/chat/student`.

### 3. Square SDK v42 response-shape coverage

A route-level unit test now mocks `SquareClient.checkout.paymentLinks.create()` and verifies that the checkout handler returns the v42 response path:

```ts
{ url: response.paymentLink?.url }
```

The test also confirms the expected Square order payload, checkout redirect, explicit idempotency key, and the safe `undefined` result when Square omits a payment link.

### 4. Legacy chat request cleanup

Repository search found no application caller that still sends the former `{ role, content }` chat format. The compatibility union was therefore removed rather than deferred. `chatRequestSchema` now documents and accepts the AI SDK v7 `UIMessage` contract only: a message role plus a non-empty `parts` array.

## Runtime Verification

The Playwright smoke suite exercises both assistant pages using the actual browser client hook, Next.js route handler, AI SDK stream framing, and DOM rendering lifecycle. Each page completes **two consecutive chat turns**.

| Assertion | Parent Assistant | Student Helper |
|---|---:|---:|
| User message is rendered immediately | Pass | Pass |
| POST request reaches the deterministic route handler | Pass | Pass |
| Assistant content renders as three ordered text updates | Pass | Pass |
| `useChat` status enters `streaming` | Pass | Pass |
| `useChat` status returns to `ready` after completion | Pass | Pass |
| “Thinking…” indicator clears after completion | Pass | Pass |
| Completed assistant message stays visible | Pass | Pass |
| Input and send button become usable again | Pass | Pass |
| Second message succeeds | Pass | Pass |
| Browser console errors and page errors | None | None |
| Chat route response status | 200 for both turns | 200 for both turns |

## Validation Evidence

Run from the repository root:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:chat-smoke
pnpm build
```

| Command | Outcome |
|---|---|
| `pnpm typecheck` | Pass — 0 TypeScript errors |
| `pnpm lint` | Pass — 0 lint errors; the existing TypeScript 5.9 support-range notice is non-blocking |
| `pnpm test` | Pass — 2 test files, 4 tests |
| `pnpm test:chat-smoke` | Pass — 2 Playwright browser flows |
| `pnpm build` | Pass — optimized production build compiled successfully |

## Review Notes

- The test-only mock streaming endpoint is inaccessible without `CHAT_SMOKE_TEST=1`; it is not selected by either assistant page in normal environments.
- The middleware skips Supabase session refresh only while that same explicit smoke-test flag is enabled. Production middleware behavior is unchanged.
- No production credentials, API keys, or Supabase project values are included in this PR.
- The first smoke run exposed and fixed a real UI-message transport mismatch. This PR therefore includes both the regression test and the runtime correction it validated.

## Recommended Merge Checklist

- [x] Confirm `foundation/v1` is the intended stabilization baseline.
- [x] Confirm Square remains the selected payment provider; Stripe Connect remains deferred.
- [x] Confirm the chat contract is now AI SDK v7 `UIMessage` only.
- [x] Confirm CI runs the five validation commands above.
- [ ] Merge into `main` after required repository review/approval checks pass.

## Follow-up Work (Not a Merge Blocker)

A live, credentialed smoke test against the deployed Ollama endpoint and Square sandbox remains useful as a deployment-environment check. It is not required to validate the client/server stream protocol or the Square v42 response mapping covered here.
