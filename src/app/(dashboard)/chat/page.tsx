import { ChatInterface } from '@/components/ChatInterface';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Assistant | Clear Match',
  description: 'Chat with Clear Match AI Assistant for help with candidates, activities, and data insights.',
};

export default function ChatPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Compact header */}
      <div className="shrink-0 border-b bg-white/50 backdrop-blur-sm px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold">AI Assistant</h1>
              <p className="text-sm text-muted-foreground">
                Ask questions about your recruitment data and get AI-powered insights
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chat interface fills remaining space */}
      <div className="flex-1 p-6 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full">
          <ChatInterface className="h-full shadow-sm border-0 bg-white/70 backdrop-blur-sm" />
        </div>
      </div>
    </div>
  );
}