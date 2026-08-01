import type { Metadata } from 'next';
import ChatPanel from '@/components/chat/ChatPanel';

export const metadata: Metadata = {
  title: 'Parent Assistant',
  description:
    'Get warm, professional guidance on homeschool documentation, NYS requirements, and Renaissance Kids curriculum resources.',
};

export default function ParentAssistantPage() {
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
          endpoint="/api/chat/parent"
          title="Parent Assistant"
          placeholder="Ask about homeschool documentation, NYS standards…"
          accentClass="bg-rk-green"
        />
      </div>
    </main>
  );
}
