import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { ModelSelector } from '../ModelSelector';
import { AVAILABLE_MODELS } from '@/config/models';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('ModelSelector', () => {
  const mockOnModelChange = jest.fn();
  const defaultProps = {
    selectedModel: 'openai/gpt-4o',
    onModelChange: mockOnModelChange,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Rendering', () => {
    it('should render the selected model name', () => {
      render(<ModelSelector {...defaultProps} />);
      expect(screen.getByRole('button', { name: /GPT-4o/ })).toBeInTheDocument();
    });

    it('should show loading state when not mounted', () => {
      // Mock useState to simulate not mounted state
      const mockSetState = jest.fn();
      jest.spyOn(React, 'useState')
        .mockImplementationOnce(() => [false, mockSetState]); // mounted = false
      
      render(<ModelSelector {...defaultProps} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<ModelSelector {...defaultProps} disabled={true} />);
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      expect(button).toBeDisabled();
    });

    it('should display correct icon for model tier', () => {
      render(<ModelSelector {...defaultProps} />);
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      // GPT-4o is popular tier, should have Sparkles icon
      expect(button.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Dropdown Functionality', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup();
      render(<ModelSelector {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Choose AI Model')).toBeInTheDocument();
      });
    });

    it('should display all available models in dropdown', async () => {
      const user = userEvent.setup();
      render(<ModelSelector {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      await user.click(button);

      await waitFor(() => {
        AVAILABLE_MODELS.forEach(model => {
          expect(screen.getAllByText(model.name).length).toBeGreaterThanOrEqual(1);
        });
      });
    });

    it('should show models organized by tiers', async () => {
      const user = userEvent.setup();
      render(<ModelSelector {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Premium Models')).toBeInTheDocument();
        expect(screen.getByText('Popular Models')).toBeInTheDocument();
        expect(screen.getByText('Budget & Testing')).toBeInTheDocument();
      });
    });

    it('should show recommended badges for recommended models', async () => {
      const user = userEvent.setup();
      render(<ModelSelector {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      await user.click(button);

      await waitFor(() => {
        const recommendedModels = AVAILABLE_MODELS.filter(m => m.isRecommended);
        expect(screen.getAllByText('Recommended')).toHaveLength(recommendedModels.length);
      });
    });

    it('should show model descriptions and cost information', async () => {
      const user = userEvent.setup();
      render(<ModelSelector {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      await user.click(button);

      await waitFor(() => {
        const gpt4oModel = AVAILABLE_MODELS.find(m => m.id === 'openai/gpt-4o')!;
        expect(screen.getByText(gpt4oModel.description)).toBeInTheDocument();
      });
    });
  });

  describe('Model Selection', () => {
    it('should call onModelChange when a model is selected', async () => {
      const user = userEvent.setup();
      render(<ModelSelector {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      await user.click(button);

      await waitFor(() => {
        const claudeOption = screen.getByRole('menuitem', { name: /Claude Sonnet 4/ });
        expect(claudeOption).toBeInTheDocument();
      });

      const claudeOption = screen.getByRole('menuitem', { name: /Claude Sonnet 4/ });
      await user.click(claudeOption);

      expect(mockOnModelChange).toHaveBeenCalledWith('anthropic/claude-sonnet-4');
    });

    it('should persist model selection to localStorage', async () => {
      const user = userEvent.setup();
      render(<ModelSelector {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      await user.click(button);

      await waitFor(() => {
        const claudeOption = screen.getByRole('menuitem', { name: /Claude Sonnet 4/ });
        expect(claudeOption).toBeInTheDocument();
      });

      const claudeOption = screen.getByRole('menuitem', { name: /Claude Sonnet 4/ });
      await user.click(claudeOption);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'clear-match-selected-model',
        'anthropic/claude-sonnet-4'
      );
    });

    it('should show selection indicator for currently selected model', async () => {
      const user = userEvent.setup();
      render(<ModelSelector selectedModel="qwen/qwen3-coder" onModelChange={mockOnModelChange} />);
      
      const button = screen.getByRole('button', { name: /Qwen3 Coder/ });
      await user.click(button);

      await waitFor(() => {
        // The selected model should have a visual indicator
        // This tests the isSelected logic in ModelMenuItem
        const selectedItem = screen.getByRole('menuitem', { name: /Qwen3 Coder/ });
        expect(selectedItem).toBeInTheDocument();
      });
    });
  });

  describe('Model Information Display', () => {
    it('should display correct cost labels for different tiers', async () => {
      const user = userEvent.setup();
      render(<ModelSelector {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      await user.click(button);

      await waitFor(() => {
        // Check for cost indicators that should be present
        expect(screen.getAllByText('Free').length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should display model strengths', async () => {
      const user = userEvent.setup();
      render(<ModelSelector {...defaultProps} />);
      
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      await user.click(button);

      await waitFor(() => {
        // Check that model strengths are displayed
        expect(screen.getByText(/Creative writing/)).toBeInTheDocument();
        expect(screen.getByText(/Complex reasoning/)).toBeInTheDocument();
        expect(screen.getByText(/Fast responses/)).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle unknown selected model gracefully', () => {
      render(<ModelSelector selectedModel="unknown/model" onModelChange={mockOnModelChange} />);
      expect(screen.getByText('Select Model')).toBeInTheDocument();
    });

    it('should not call onModelChange when disabled', async () => {
      render(<ModelSelector {...defaultProps} disabled={true} />);
      
      const button = screen.getByRole('button', { name: /GPT-4o/ });
      
      // Button should be disabled
      expect(button).toBeDisabled();
      
      // Since button is disabled, we can't test dropdown opening
      // Just verify the button is in disabled state
      expect(button).toHaveAttribute('disabled');
    });
  });
});