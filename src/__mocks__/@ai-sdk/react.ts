// Mock for @ai-sdk/react package (AI SDK v5)
export const useChat = jest.fn(() => ({
  messages: [],
  sendMessage: jest.fn(),
  status: 'ready',
  error: null,
}));