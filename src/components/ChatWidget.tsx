'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatInterface } from '@/components/ChatInterface';
import { useChat } from '@/contexts/ChatContext';
import { 
  MessageCircle, 
  X, 
  Minimize2, 
  Maximize2, 
  History,
  Plus,
  Trash2
} from 'lucide-react';

/**
 * Props for the ChatWidget component
 */
interface ChatWidgetProps {
  /** Position of the widget on screen */
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  /** Custom CSS classes */
  className?: string;
  /** Whether to show session management controls */
  showSessionManagement?: boolean;
}

/**
 * ChatWidget - Floating chat interface with session management
 * 
 * A globally accessible chat widget that provides:
 * - Floating button to open/close chat
 * - Session management (create, switch, delete)
 * - Minimizable chat interface
 * - Position customization
 * 
 * Features:
 * - Persistent chat sessions
 * - Session history
 * - Responsive design
 * - Keyboard shortcuts
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ChatWidget />
 * 
 * // With session management and custom position
 * <ChatWidget 
 *   position="bottom-left" 
 *   showSessionManagement={true}
 * />
 * ```
 */
export function ChatWidget({ 
  position = 'bottom-right',
  className = '',
  showSessionManagement = true
}: ChatWidgetProps) {
  const {
    isOpen,
    toggleChat,
    closeChat,
    currentSession,
    sessions,
    createSession,
    selectSession,
    deleteSession,
    isLoadingSessions
  } = useChat();

  const [isMinimized, setIsMinimized] = useState(false);
  const [showSessions, setShowSessions] = useState(false);

  // Position classes mapping
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  /**
   * Handle session creation
   */
  const handleCreateSession = async () => {
    await createSession();
    setShowSessions(false);
  };

  /**
   * Handle session selection
   */
  const handleSelectSession = async (sessionId: string) => {
    await selectSession(sessionId);
    setShowSessions(false);
  };

  /**
   * Handle session deletion with confirmation
   */
  const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
    if (window.confirm(`Delete session "${sessionTitle || 'Untitled'}"?`)) {
      await deleteSession(sessionId);
    }
  };

  /**
   * Toggle minimize state
   */
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // If chat is not open, show floating button
  if (!isOpen) {
    return (
      <div 
        className={`fixed ${positionClasses[position]} z-50 ${className}`}
      >
        <Button
          onClick={toggleChat}
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90"
          title="Open AI Assistant"
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`fixed ${positionClasses[position]} z-50 ${className}`}
      style={{ 
        width: isMinimized ? '320px' : '400px',
        height: isMinimized ? '60px' : '600px',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <Card className="h-full shadow-2xl border-0 bg-white dark:bg-gray-900">
        {/* Header */}
        <CardHeader className="pb-2 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-primary" />
              Clear Match AI
              {currentSession && (
                <span className="text-xs text-muted-foreground">
                  • {currentSession.title || 'New Chat'}
                </span>
              )}
            </CardTitle>
            
            <div className="flex items-center gap-1">
              {showSessionManagement && (
                <>
                  {/* Session Management Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSessions(!showSessions)}
                    title="Manage Sessions"
                    className="h-8 w-8 p-0"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  
                  {/* New Session Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCreateSession}
                    title="New Session"
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Minimize Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMinimize}
                title={isMinimized ? "Maximize" : "Minimize"}
                className="h-8 w-8 p-0"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              
              {/* Close Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={closeChat}
                title="Close Chat"
                className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* Content */}
        {!isMinimized && (
          <CardContent className="p-0 flex-1">
            {showSessions ? (
              // Session Management Panel
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-sm">Chat Sessions</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Manage your conversation history
                  </p>
                </div>
                
                <ScrollArea className="flex-1">
                  {isLoadingSessions ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading sessions...
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-3">
                        No chat sessions yet
                      </p>
                      <Button
                        onClick={handleCreateSession}
                        size="sm"
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Start New Chat
                      </Button>
                    </div>
                  ) : (
                    <div className="p-2">
                      {sessions.map((session) => (
                        <div
                          key={session.id}
                          className={`flex items-center justify-between p-2 rounded-md mb-1 transition-colors cursor-pointer ${
                            currentSession?.id === session.id
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handleSelectSession(session.id)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {session.title || 'Untitled Chat'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(session.updated_at).toLocaleDateString()}
                              {session.message_count && ` • ${session.message_count} messages`}
                            </p>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id, session.title || '');
                            }}
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
                            title="Delete Session"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                
                <div className="p-3 border-t">
                  <Button
                    onClick={() => setShowSessions(false)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Back to Chat
                  </Button>
                </div>
              </div>
            ) : (
              // Chat Interface
              <div className="h-full">
                <ChatInterface className="border-0 shadow-none h-full" />
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  );
}