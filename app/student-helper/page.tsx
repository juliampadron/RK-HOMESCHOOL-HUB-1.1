import type { Metadata } from 'next';
import ChatPanel from '@/components/chat/ChatPanel';

export const metadata: Metadata = {
  title: 'Student Helper',
  description:
    'A friendly learning companion for Renaissance Kids homeschool students.',
};

export default function StudentHelperPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-rk-orange">Student Helper</h1>
          <p className="text-sm text-gray-500 mt-1">
            Hi! I&apos;m here to help you learn. Ask me anything about your
            schoolwork!
          </p>
        </div>
        <ChatPanel
          endpoint="/api/chat/student"
          title="Student Helper"
          placeholder="Ask me anything about your schoolwork…"
          accentClass="bg-rk-orange"
        />
      </div>
    </main>
  );
}
