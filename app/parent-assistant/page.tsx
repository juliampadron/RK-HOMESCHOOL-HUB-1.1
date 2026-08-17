import type { Metadata } from 'next';
import ChatPanel from '@/components/chat/ChatPanel';

export const metadata: Metadata = {
  title: 'Parent Assistant',
  description:
    'Get warm, professional guidance on homeschool documentation, NYS requirements, and Renaissance Kids curriculum resources.',
};

interface ParentAssistantPageProps {
  searchParams?: {
    chatSmoke?: string;
  };
}

export default function ParentAssistantPage({
  searchParams,
}: ParentAssistantPageProps) {
  const useSmokeTestStream =
    process.env.CHAT_SMOKE_TEST === '1' && searchParams?.chatSmoke === '1';

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-rk-green">Parent Assistant</h1>
          <p className="text-sm text-gray-500 mt-1">
            Ask about homeschool documentation, NYS standards, or Renaissance Kids
            curriculum resources.
          </p>
        </div>
        <ChatPanel
          endpoint={useSmokeTestStream ? '/api/chat/mock' : '/api/chat/parent'}
          title="Parent Assistant"
          placeholder="Ask about homeschool documentation, NYS standards…"
          accentClass="bg-rk-green"
        />
      </div>
    </main>
  );
}
