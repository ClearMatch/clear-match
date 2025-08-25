'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Chat session type definition
 */
interface ChatSession {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
  last_message_at?: string;
}

/**
 * Chat message type definition
 */
interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: Record<string, any>;
}

/**
 * Chat context state interface
 */
interface ChatContextState {
  // Chat visibility
  isOpen: boolean;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  
  // Session management
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  loadSessions: () => Promise<void>;
  createSession: () => Promise<ChatSession | null>;
  selectSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  
  // Message management
  messages: ChatMessage[];
  loadMessages: (sessionId: string) => Promise<void>;
  saveMessage: (message: Omit<ChatMessage, 'id' | 'created_at'>) => Promise<void>;
  clearMessages: () => void;
  
  // Loading states
  isLoadingSessions: boolean;
  isLoadingMessages: boolean;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

/**
 * Chat context
 */
const ChatContext = createContext<ChatContextState | undefined>(undefined);

/**
 * Chat context provider component
 * 
 * Manages global chat state including:
 * - Chat widget visibility
 * - Session management
 * - Message persistence
 * - Loading states
 * 
 * @example
 * ```tsx
 * // Wrap your app with the provider
 * <ChatProvider>
 *   <App />
 * </ChatProvider>
 * 
 * // Use in components
 * const { isOpen, toggleChat, currentSession } = useChat();
 * ```
 */
export function ChatProvider({ children }: { children: React.ReactNode }) {
  // State management
  const [isOpen, setIsOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Toggle chat visibility
   */
  const toggleChat = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  /**
   * Open chat
   */
  const openChat = useCallback(() => {
    setIsOpen(true);
  }, []);

  /**
   * Close chat
   */
  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  /**
   * Load messages for a specific session
   */
  const loadMessages = useCallback(async (sessionId: string) => {
    setIsLoadingMessages(true);
    setError(null);
    
    try {
      const { data, error: dbError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (dbError) {
        console.error('Error loading messages:', dbError);
        setError('Failed to load messages');
        return;
      }

      setMessages(data || []);
    } catch (err) {
      console.error('Error in loadMessages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  /**
   * Load all chat sessions for the current user
   */
  const loadSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      const { data, error: dbError } = await supabase
        .from('chat_session_summaries')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (dbError) {
        console.error('Error loading sessions:', dbError);
        setError('Failed to load chat sessions');
        return;
      }

      setSessions(data || []);
      
      // Auto-select the most recent session if none selected
      if (!currentSession && data && data.length > 0) {
        setCurrentSession(data[0]);
        await loadMessages(data[0].id);
      }
    } catch (err) {
      console.error('Error in loadSessions:', err);
      setError('Failed to load chat sessions');
    } finally {
      setIsLoadingSessions(false);
    }
  }, [currentSession, loadMessages]);

  /**
   * Create a new chat session
   */
  const createSession = useCallback(async (): Promise<ChatSession | null> => {
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return null;
      }

      const { data, error: dbError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          metadata: {}
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error creating session:', dbError);
        setError('Failed to create chat session');
        return null;
      }

      const newSession = data as ChatSession;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      setMessages([]); // Clear messages for new session
      
      return newSession;
    } catch (err) {
      console.error('Error in createSession:', err);
      setError('Failed to create chat session');
      return null;
    }
  }, []);

  /**
   * Select a chat session
   */
  const selectSession = useCallback(async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
      await loadMessages(sessionId);
    }
  }, [sessions, loadMessages]);

  /**
   * Delete a chat session
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    setError(null);
    
    try {
      const { error: dbError } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId);

      if (dbError) {
        console.error('Error deleting session:', dbError);
        setError('Failed to delete chat session');
        return;
      }

      // Update local state
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      
      // If deleted session was current, clear it
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setMessages([]);
      }
    } catch (err) {
      console.error('Error in deleteSession:', err);
      setError('Failed to delete chat session');
    }
  }, [currentSession]);

  /**
   * Save a message to the database
   */
  const saveMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'created_at'>) => {
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('User not authenticated');
        return;
      }

      // Create a new session if none exists
      let sessionId = currentSession?.id;
      if (!sessionId) {
        const newSession = await createSession();
        if (!newSession) return;
        sessionId = newSession.id;
      }

      const { data, error: dbError } = await supabase
        .from('chat_messages')
        .insert({
          ...message,
          session_id: sessionId,
          user_id: user.id
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error saving message:', dbError);
        setError('Failed to save message');
        return;
      }

      // Add to local state
      setMessages(prev => [...prev, data as ChatMessage]);
      
      // Update session's updated_at locally
      setSessions(prev => prev.map(s => 
        s.id === sessionId 
          ? { ...s, updated_at: new Date().toISOString() }
          : s
      ));
    } catch (err) {
      console.error('Error in saveMessage:', err);
      setError('Failed to save message');
    }
  }, [currentSession, createSession]);

  /**
   * Clear messages from current view (doesn't delete from DB)
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Load sessions on mount if user is authenticated
   */
  useEffect(() => {
    const checkAuthAndLoadSessions = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        loadSessions();
      }
    };

    checkAuthAndLoadSessions();
  }, [loadSessions]);

  // Context value
  const value: ChatContextState = {
    isOpen,
    toggleChat,
    openChat,
    closeChat,
    currentSession,
    sessions,
    loadSessions,
    createSession,
    selectSession,
    deleteSession,
    messages,
    loadMessages,
    saveMessage,
    clearMessages,
    isLoadingSessions,
    isLoadingMessages,
    error,
    clearError,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

/**
 * Hook to use chat context
 * 
 * @throws {Error} If used outside of ChatProvider
 * @returns {ChatContextState} Chat context state and methods
 */
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}