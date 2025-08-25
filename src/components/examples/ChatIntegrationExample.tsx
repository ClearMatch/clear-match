'use client';

import React from 'react';
import { ChatProvider } from '@/contexts/ChatContext';
import { ChatWidget } from '@/components/ChatWidget';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useChat } from '@/contexts/ChatContext';

/**
 * Example component showing how to use chat context
 */
function ExampleDashboardContent() {
  const { openChat, currentSession, sessions } = useChat();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Clear Match Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Stats Cards */}
        <Card>
          <CardHeader>
            <CardTitle>Active Candidates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">142</div>
            <p className="text-sm text-muted-foreground">
              +12 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interviews This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-sm text-muted-foreground">
              8 scheduled, 15 completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>AI Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-sm text-muted-foreground mb-3">
              Chat sessions
            </p>
            <Button onClick={openChat} size="sm" className="w-full">
              Ask AI Assistant
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={openChat}>
              💬 Ask about candidates
            </Button>
            <Button variant="outline" size="sm" onClick={openChat}>
              📊 View recruitment metrics
            </Button>
            <Button variant="outline" size="sm" onClick={openChat}>
              🎯 Get productivity tips
            </Button>
            <Button variant="outline" size="sm" onClick={openChat}>
              📅 Check upcoming tasks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Session Info */}
      {currentSession && (
        <Card>
          <CardHeader>
            <CardTitle>Current Chat Session</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              <strong>Title:</strong> {currentSession.title || 'New Chat'}
            </p>
            <p className="text-sm text-muted-foreground">
              Started: {new Date(currentSession.created_at).toLocaleString()}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={openChat}
              className="mt-2"
            >
              Continue Chat
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Complete example showing ChatProvider + ChatWidget integration
 * 
 * This demonstrates the full chat feature integration:
 * 1. ChatProvider wraps the entire app
 * 2. ChatWidget provides global floating chat access
 * 3. Components can use useChat hook to interact with chat state
 * 
 * @example
 * ```tsx
 * // In your root layout or app component:
 * <ChatProvider>
 *   <YourApp />
 *   <ChatWidget position="bottom-right" showSessionManagement={true} />
 * </ChatProvider>
 * ```
 */
export function ChatIntegrationExample() {
  return (
    <ChatProvider>
      <div className="min-h-screen bg-background">
        {/* Your main application content */}
        <ExampleDashboardContent />
        
        {/* Global chat widget - accessible from anywhere */}
        <ChatWidget 
          position="bottom-right"
          showSessionManagement={true}
        />
      </div>
    </ChatProvider>
  );
}

/**
 * Alternative integration for specific pages
 * Shows how to integrate ChatInterface directly into a page
 */
export function InlineChat() {
  return (
    <ChatProvider>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6">Candidate Analysis</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main content */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Your candidate analysis content goes here...</p>
            </CardContent>
          </Card>
          
          {/* Inline chat */}
          <Card>
            <CardHeader>
              <CardTitle>Ask AI Assistant</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Import and use ChatInterface directly */}
              <div className="h-[500px]">
                {/* <ChatInterface className="border-0 shadow-none h-full" /> */}
                <p className="p-4 text-muted-foreground">
                  Chat interface would go here when API is ready
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ChatProvider>
  );
}