import { expect, test, type Locator, type Page } from '@playwright/test';

const MOCK_RESPONSE = 'Renaissance Kids is ready.';
const EXPECTED_PARTIALS = [
  'Renaissance',
  'Renaissance Kids',
  MOCK_RESPONSE,
] as const;

type AssistantPage = {
  name: string;
  path: string;
  userPrompt: string;
};

const assistantPages: AssistantPage[] = [
  {
    name: 'Parent Assistant',
    path: '/parent-assistant?chatSmoke=1',
    userPrompt: 'How should I organize our quarterly records?',
  },
  {
    name: 'Student Helper',
    path: '/student-helper?chatSmoke=1',
    userPrompt: 'Can you help me practice a music pattern?',
  },
];

async function snapshotAssistantMessages(page: Page): Promise<string[]> {
  return page.locator('[data-chat-role="assistant"]').allTextContents();
}

async function sendAndVerifyMessage(
  page: Page,
  panel: Locator,
  prompt: string,
  expectedAssistantMessageCount: number,
  observedAssistantStates: string[]
) {
  const input = panel.getByLabel('Message input');
  const sendButton = panel.getByRole('button', { name: 'Send message' });

  await input.fill(prompt);
  await sendButton.click();

  // The user turn is rendered synchronously and the request is sent to the mock route.
  await expect(panel.locator('[data-chat-role="user"]').last()).toContainText(prompt);
  await expect(panel).toHaveAttribute('data-chat-status', /submitted|streaming/);
  await expect(panel).toHaveAttribute('data-chat-status', 'streaming');
  await expect(panel.locator('[data-chat-thinking="true"]')).toBeVisible();
  await expect(input).toBeDisabled();
  await expect(sendButton).toBeDisabled();

  // The observer is populated after every DOM update. It must include all three
  // cumulative streamed states, proving incremental ordered rendering.
  await expect
    .poll(() => observedAssistantStates, { timeout: 8_000 })
    .toEqual(expect.arrayContaining([...EXPECTED_PARTIALS]));

  await expect
    .poll(async () => (await snapshotAssistantMessages(page)).length, {
      timeout: 8_000,
    })
    .toBe(expectedAssistantMessageCount);

  const completedAssistantMessage = panel
    .locator('[data-chat-role="assistant"]')
    .last();
  await expect(completedAssistantMessage).toHaveText(MOCK_RESPONSE);

  // Completion must return the hook to ready, clear the loading affordance, and
  // make the next user turn available.
  await expect(panel).toHaveAttribute('data-chat-status', 'ready');
  await expect(panel.locator('[data-chat-thinking="true"]')).toHaveCount(0);
  await expect(input).toBeEnabled();
  await expect(sendButton).toBeEnabled();
}

for (const assistant of assistantPages) {
  test(`${assistant.name} completes two browser-to-server streaming turns`, async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const mockRequestUrls: string[] = [];
    const mockResponseStatuses: number[] = [];
    const observedAssistantStates: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('request', (request) => {
      if (
        request.method() === 'POST' &&
        new URL(request.url()).pathname === '/api/chat/mock'
      ) {
        mockRequestUrls.push(request.url());
      }
    });
    page.on('response', (response) => {
      if (
        response.request().method() === 'POST' &&
        new URL(response.url()).pathname === '/api/chat/mock'
      ) {
        mockResponseStatuses.push(response.status());
      }
    });

    await page.goto(assistant.path);
    const panel = page.getByRole('region', { name: assistant.name });
    await expect(panel).toBeVisible();

    await page.evaluate(() => {
      const log = document.querySelector('[role="log"]');
      if (!log) throw new Error('Chat log was not found.');

      const recordStates = () => {
        const state = Array.from(
          document.querySelectorAll<HTMLElement>('[data-chat-role="assistant"]')
        )
          .map((message) => message.innerText)
          .join('\n');

        if (state) {
          window.dispatchEvent(
            new CustomEvent('rk-chat-stream-state', { detail: state })
          );
        }
      };

      new MutationObserver(recordStates).observe(log, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    });
    await page.exposeFunction('recordAssistantState', (state: string) => {
      observedAssistantStates.push(state);
    });
    await page.evaluate(() => {
      window.addEventListener('rk-chat-stream-state', (event) => {
        const state = (event as CustomEvent<string>).detail;
        void (window as unknown as { recordAssistantState: (value: string) => void })
          .recordAssistantState(state);
      });
    });

    await sendAndVerifyMessage(
      page,
      panel,
      assistant.userPrompt,
      1,
      observedAssistantStates
    );

    // A fresh second turn proves that a completed stream did not leave the
    // transport in a stuck state and that the input remains usable.
    await sendAndVerifyMessage(
      page,
      panel,
      'Please send one more ready message.',
      2,
      observedAssistantStates
    );

    // These assertions cover route-handler execution and the absence of
    // client-visible or request-level server failures.
    expect(mockRequestUrls).toHaveLength(2);
    expect(mockResponseStatuses).toEqual([200, 200]);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });
}
