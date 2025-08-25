import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ChatInterface } from '../ChatInterface';

// Mock dependencies
jest.mock('@ai-sdk/react', () => ({
  useChat: jest.fn(),
  UIMessage: {},
}));

jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

jest.mock('../SuggestedPrompts', () => ({
  SuggestedPrompts: ({ onPromptSelect }: { onPromptSelect: (prompt: string) => void }) => (
    <div data-testid="suggested-prompts">
      <button onClick={() => onPromptSelect('Test prompt')}>Test Suggestion</button>
    </div>
  ),
}));

jest.mock('react-markdown', () => {
  const MockMarkdown = ({ children }: { children: string }) => <div data-testid="markdown">{children}</div>;
  MockMarkdown.displayName = 'ReactMarkdown';
  return MockMarkdown;
});

const mockSendMessage = jest.fn();
const mockUseChat = require('@ai-sdk/react').useChat;
const mockSupabase = require('@/lib/supabase').supabase;

describe('ChatInterface', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementations
    mockUseChat.mockReturnValue({
      messages: [],
      sendMessage: mockSendMessage,
      status: 'awaiting-message',
      error: null,
    });

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  describe('Authentication States', () => {
    it('should show loading state while checking authentication', () => {
      render(<ChatInterface />);
      expect(screen.getByText('Initializing chat...')).toBeInTheDocument();
    });

    it('should show authentication error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      render(<ChatInterface />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByText('Please sign in to use the chat feature.')).toBeInTheDocument();
      });
    });

    it('should show authentication error when auth fails', async () => {
      // Suppress expected console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Auth failed'),
      });

      render(<ChatInterface />);

      await waitFor(() => {
        expect(screen.getByText('Authentication Required')).toBeInTheDocument();
        expect(screen.getByText('Authentication failed. Please sign in again.')).toBeInTheDocument();
      });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Chat Interface Rendering', () => {
    beforeEach(async () => {
      render(<ChatInterface />);
      await waitFor(() => {
        expect(screen.queryByText('Initializing chat...')).not.toBeInTheDocument();
      });
    });

    it('should render welcome message when no messages exist', () => {
      expect(screen.getByText('Welcome to Clear Match AI')).toBeInTheDocument();
      expect(screen.getByText(/I'm here to help you analyze candidate data/)).toBeInTheDocument();
    });

    it('should render chat input area', () => {
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...');
      expect(textarea).toBeInTheDocument();
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('should render send button', () => {
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toBeDisabled(); // Should be disabled when input is empty
    });

    it('should show suggestions button', () => {
      const suggestionsButton = screen.getByText('Show Suggestions');
      expect(suggestionsButton).toBeInTheDocument();
    });
  });

  describe('Message Input and Submission', () => {
    beforeEach(async () => {
      render(<ChatInterface />);
      await waitFor(() => {
        expect(screen.queryByText('Initializing chat...')).not.toBeInTheDocument();
      });
    });

    it('should enable send button when input has text', async () => {
      const user = userEvent.setup();
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(textarea, 'Hello');

      expect(sendButton).toBeEnabled();
    });

    it('should submit message when send button is clicked', async () => {
      const user = userEvent.setup();
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(textarea, 'Test message');
      await user.click(sendButton);

      expect(mockSendMessage).toHaveBeenCalledWith(
        { text: 'Test message' },
        { body: { model: 'openai/gpt-oss-20b:free' } }
      );
    });

    it('should submit message when Enter key is pressed', async () => {
      const user = userEvent.setup();
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...');

      await user.type(textarea, 'Test message');
      await user.keyboard('{Enter}');

      expect(mockSendMessage).toHaveBeenCalledWith(
        { text: 'Test message' },
        { body: { model: 'openai/gpt-oss-20b:free' } }
      );
    });

    it('should not submit when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...');

      await user.type(textarea, 'Test message');
      await user.keyboard('{Shift>}{Enter}{/Shift}');

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it('should clear input after submission', async () => {
      const user = userEvent.setup();
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...') as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(textarea, 'Test message');
      await user.click(sendButton);

      expect(textarea.value).toBe('');
    });

    it('should not submit empty or whitespace-only messages', async () => {
      const user = userEvent.setup();
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(textarea, '   ');
      await user.click(sendButton);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('Message Display', () => {
    const mockMessages = [
      {
        id: '1',
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: 'Hello' }],
      },
      {
        id: '2',
        role: 'assistant' as const,
        parts: [{ type: 'text' as const, text: 'Hi there!' }],
      },
    ];

    beforeEach(async () => {
      mockUseChat.mockReturnValue({
        messages: mockMessages,
        sendMessage: mockSendMessage,
        status: 'awaiting-message',
        error: null,
      });

      render(<ChatInterface />);
      await waitFor(() => {
        expect(screen.queryByText('Initializing chat...')).not.toBeInTheDocument();
      });
    });

    it('should display user and assistant messages', () => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });

    it('should render assistant messages with markdown', () => {
      expect(screen.getByTestId('markdown')).toHaveTextContent('Hi there!');
    });

    it('should not show welcome message when messages exist', () => {
      expect(screen.queryByText('Welcome to Clear Match AI')).not.toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    beforeEach(async () => {
      render(<ChatInterface />);
      await waitFor(() => {
        expect(screen.queryByText('Initializing chat...')).not.toBeInTheDocument();
      });
    });

    it('should show loading indicator when submitting', async () => {
      const user = userEvent.setup();
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...');

      await user.type(textarea, 'Test message');
      
      // Mock the submission to be pending
      const sendButton = screen.getByRole('button', { name: /send message/i });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Thinking...')).toBeInTheDocument();
      });
    });

    it('should disable input and button while submitting', async () => {
      const user = userEvent.setup();
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...');
      const sendButton = screen.getByRole('button', { name: /send message/i });

      await user.type(textarea, 'Test message');
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(textarea).toBeDisabled();
        expect(sendButton).toBeDisabled();
      });
    });
  });

  describe('Suggested Prompts', () => {
    beforeEach(async () => {
      render(<ChatInterface />);
      await waitFor(() => {
        expect(screen.queryByText('Initializing chat...')).not.toBeInTheDocument();
      });
    });

    it('should show suggested prompts when button is clicked', async () => {
      const user = userEvent.setup();
      const suggestionsButton = screen.getByText('Show Suggestions');

      await user.click(suggestionsButton);

      expect(screen.getByTestId('suggested-prompts')).toBeInTheDocument();
      expect(screen.getByText('Hide Suggestions')).toBeInTheDocument();
    });

    it('should hide suggested prompts when already shown and button is clicked', async () => {
      const user = userEvent.setup();
      const suggestionsButton = screen.getByText('Show Suggestions');

      await user.click(suggestionsButton);
      await user.click(screen.getByText('Hide Suggestions'));

      expect(screen.queryByTestId('suggested-prompts')).not.toBeInTheDocument();
      expect(screen.getByText('Show Suggestions')).toBeInTheDocument();
    });

    it('should populate input when suggestion is selected', async () => {
      const user = userEvent.setup();
      const suggestionsButton = screen.getByText('Show Suggestions');
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...') as HTMLTextAreaElement;

      await user.click(suggestionsButton);
      await user.click(screen.getByText('Test Suggestion'));

      expect(textarea.value).toBe('Test prompt');
      expect(screen.queryByTestId('suggested-prompts')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error message when chat error occurs', async () => {
      mockUseChat.mockReturnValue({
        messages: [],
        sendMessage: mockSendMessage,
        status: 'awaiting-message',
        error: new Error('Chat failed'),
      });

      render(<ChatInterface />);
      
      await waitFor(() => {
        expect(screen.queryByText('Initializing chat...')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Sorry, I encountered an error. Please try again.')).toBeInTheDocument();
    });
  });

  describe('Message Limit', () => {
    it('should limit messages to prevent memory issues', async () => {
      // Create more than 100 messages (the CHAT_CONFIG.MAX_MESSAGES limit)
      const manyMessages = Array.from({ length: 150 }, (_, i) => ({
        id: `msg-${i}`,
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: `Message ${i}` }],
      }));

      mockUseChat.mockReturnValue({
        messages: manyMessages,
        sendMessage: mockSendMessage,
        status: 'awaiting-message',
        error: null,
      });

      render(<ChatInterface />);

      await waitFor(() => {
        expect(screen.queryByText('Initializing chat...')).not.toBeInTheDocument();
      });

      // Should only show the last 100 messages
      expect(screen.queryByText('Message 0')).not.toBeInTheDocument();
      expect(screen.getByText('Message 149')).toBeInTheDocument();
      expect(screen.getByText('Message 50')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      render(<ChatInterface />);
      await waitFor(() => {
        expect(screen.queryByText('Initializing chat...')).not.toBeInTheDocument();
      });
    });

    it('should have accessible send button with screen reader text', () => {
      const sendButton = screen.getByRole('button', { name: /send message/i });
      expect(sendButton).toBeInTheDocument();
      expect(sendButton).toHaveTextContent('Send message');
    });

    it('should have accessible form elements', () => {
      const textarea = screen.getByPlaceholderText('Ask me anything about your data...');
      expect(textarea).toHaveAttribute('placeholder');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className prop', async () => {
      const { container } = render(<ChatInterface className="custom-chat-class" />);
      
      await waitFor(() => {
        expect(screen.queryByText('Initializing chat...')).not.toBeInTheDocument();
      });

      const chatContainer = container.querySelector('.custom-chat-class');
      expect(chatContainer).toBeInTheDocument();
    });
  });
});