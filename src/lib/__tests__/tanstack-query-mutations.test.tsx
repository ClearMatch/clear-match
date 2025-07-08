import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Mock dependencies
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/supabase');
jest.mock('sonner', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn(),
  },
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Test data
const mockUser = {
  id: 'user-123',
  user_metadata: { 
    organizationId: 'org-456' 
  }
};

const mockContact = {
  id: 'contact-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  organization_id: 'org-456'
};

const mockTask = {
  id: 'task-1',
  title: 'Contact John Doe',
  description: 'Follow up on application',
  status: 'pending',
  priority: 'high',
  assignee_id: 'user-123',
  organization_id: 'org-456'
};

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  
  return TestWrapper;
}

// Utility hook for testing mutations
function useTestMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>, 
  options: Record<string, unknown> = {}
) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success('Operation successful');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Operation failed');
    },
    ...options,
  });
}

describe('TanStack Query Mutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth
    mockUseAuth.mockReturnValue({
      user: mockUser,
      loading: false,
      signOut: jest.fn(),
    } as any);

    // Mock Supabase methods with proper chaining
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockContact, error: null })
        })
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockContact, error: null })
          })
        })
      }),
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ data: null, error: null })
      }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
    } as any);
  });

  describe('Contact Mutations', () => {
    describe('Create Contact', () => {
      it('should create contact successfully', async () => {
        const createContactFn = async (contactData: Record<string, unknown>) => {
          const { data, error } = await supabase
            .from('contacts')
            .insert([{
              ...contactData,
              organization_id: mockUser.user_metadata.organizationId,
            }])
            .select()
            .single();

          if (error) throw error;
          return data;
        };

        const wrapper = createWrapper();
        const { result } = renderHook(() => useTestMutation(createContactFn), { wrapper });

        await act(async () => {
          result.current.mutate({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          });
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockSupabase.from).toHaveBeenCalledWith('contacts');
        expect(mockToast.success).toHaveBeenCalledWith('Operation successful');
        expect(result.current.data).toEqual(mockContact);
      });

      it('should handle create contact errors', async () => {
        // Override the mock for this specific test
        mockSupabase.from.mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ 
                data: null, 
                error: { message: 'Email already exists' } 
              })
            })
          })
        } as any);

        const createContactFn = async (contactData: Record<string, unknown>) => {
          const { data, error } = await supabase
            .from('contacts')
            .insert([contactData])
            .select()
            .single();

          if (error) throw new Error(error.message);
          return data;
        };

        const wrapper = createWrapper();
        const { result } = renderHook(() => useTestMutation(createContactFn), { wrapper });

        await act(async () => {
          result.current.mutate({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
          });
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(mockToast.error).toHaveBeenCalledWith('Email already exists');
        expect(result.current.error).toEqual(new Error('Email already exists'));
      });
    });

    describe('Update Contact', () => {
      it('should update contact successfully', async () => {
        // Use the already configured mock from beforeEach
        const updateContactFn = async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
          const { data, error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;
          return data;
        };

        const wrapper = createWrapper();
        const { result } = renderHook(() => useTestMutation(updateContactFn), { wrapper });

        await act(async () => {
          result.current.mutate({
            id: 'contact-1',
            firstName: 'Jane',
          });
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockToast.success).toHaveBeenCalledWith('Operation successful');
      });

      it('should handle update contact errors', async () => {
        // Override the mock for this specific test
        mockSupabase.from.mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ 
                  data: null, 
                  error: { message: 'Contact not found' } 
                })
              })
            })
          })
        } as any);

        const updateContactFn = async ({ id, ...updates }: { id: string; [key: string]: unknown }) => {
          const { data, error } = await supabase
            .from('contacts')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

          if (error) throw new Error(error.message);
          return data;
        };

        const wrapper = createWrapper();
        const { result } = renderHook(() => useTestMutation(updateContactFn), { wrapper });

        await act(async () => {
          result.current.mutate({
            id: 'nonexistent-contact',
            firstName: 'Jane',
          });
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(mockToast.error).toHaveBeenCalledWith('Contact not found');
      });
    });

    describe('Delete Contact', () => {
      it('should delete contact successfully', async () => {
        // Use the already configured mock from beforeEach
        const deleteContactFn = async (contactId: string) => {
          const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', contactId);

          if (error) throw error;
          return { success: true };
        };

        const wrapper = createWrapper();
        const { result } = renderHook(() => useTestMutation(deleteContactFn), { wrapper });

        await act(async () => {
          result.current.mutate('contact-1');
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockToast.success).toHaveBeenCalledWith('Operation successful');
      });

      it('should handle delete contact errors', async () => {
        // Override the mock for this specific test
        mockSupabase.from.mockReturnValue({
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ 
              data: null, 
              error: { message: 'Permission denied' } 
            })
          })
        } as any);

        const deleteContactFn = async (contactId: string) => {
          const { error } = await supabase
            .from('contacts')
            .delete()
            .eq('id', contactId);

          if (error) throw new Error(error.message);
          return { success: true };
        };

        const wrapper = createWrapper();
        const { result } = renderHook(() => useTestMutation(deleteContactFn), { wrapper });

        await act(async () => {
          result.current.mutate('contact-1');
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(mockToast.error).toHaveBeenCalledWith('Permission denied');
      });
    });
  });

  describe('Task Mutations', () => {
    describe('Update Task Status', () => {
      it('should implement optimistic updates', async () => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: { retry: false, staleTime: 0 },
            mutations: { retry: false },
          },
        });

        // Set initial cache data
        queryClient.setQueryData(['tasks'], [mockTask]);

        const updateTaskStatusFn = async ({ taskId, status }: { taskId: string; status: string }) => {
          // Simulate delay
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { data, error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', taskId)
            .select()
            .single();

          if (error) throw error;
          return data;
        };

        const useOptimisticMutation = () => {
          return useMutation({
            mutationFn: updateTaskStatusFn,
            onMutate: async ({ taskId, status }) => {
              // Cancel outgoing refetches
              await queryClient.cancelQueries({ queryKey: ['tasks'] });
              
              // Snapshot previous value
              const previousTasks = queryClient.getQueryData(['tasks']);
              
              // Optimistically update
              queryClient.setQueryData(['tasks'], (old: typeof mockTask[]) =>
                old?.map(task => 
                  task.id === taskId 
                    ? { ...task, status }
                    : task
                ) || []
              );
              
              return { previousTasks };
            },
            onError: (err, variables, context) => {
              // Rollback on error
              queryClient.setQueryData(['tasks'], context?.previousTasks);
              toast.error('Failed to update task status');
            },
            onSuccess: () => {
              toast.success('Task status updated');
            },
            onSettled: () => {
              queryClient.invalidateQueries({ queryKey: ['tasks'] });
            },
          });
        };

        const TestWrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
        TestWrapper.displayName = 'TestWrapper';

        const { result } = renderHook(() => useOptimisticMutation(), { wrapper: TestWrapper });

        // Override the mock for this specific test
        mockSupabase.from.mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: { ...mockTask, status: 'completed' },
                  error: null
                })
              })
            })
          })
        } as any);

        await act(async () => {
          result.current.mutate({
            taskId: 'task-1',
            status: 'completed',
          });
        });

        // Check that optimistic update happened immediately
        const optimisticData = queryClient.getQueryData(['tasks']) as typeof mockTask[];
        expect(optimisticData[0]!.status).toBe('completed');

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockToast.success).toHaveBeenCalledWith('Task status updated');
      });

      it('should rollback optimistic updates on error', async () => {
        const queryClient = new QueryClient({
          defaultOptions: {
            queries: { retry: false, staleTime: 0 },
            mutations: { retry: false },
          },
        });

        // Set initial cache data
        queryClient.setQueryData(['tasks'], [mockTask]);

        const updateTaskStatusFn = async ({ taskId, status }: { taskId: string; status: string }) => {
          const { data, error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', taskId)
            .select()
            .single();

          if (error) throw error;
          return data;
        };

        const useOptimisticMutation = () => {
          return useMutation({
            mutationFn: updateTaskStatusFn,
            onMutate: async ({ taskId, status }) => {
              await queryClient.cancelQueries({ queryKey: ['tasks'] });
              const previousTasks = queryClient.getQueryData(['tasks']);
              
              queryClient.setQueryData(['tasks'], (old: typeof mockTask[]) =>
                old?.map(task => 
                  task.id === taskId 
                    ? { ...task, status }
                    : task
                ) || []
              );
              
              return { previousTasks };
            },
            onError: (err, variables, context) => {
              queryClient.setQueryData(['tasks'], context?.previousTasks);
              toast.error('Failed to update task status');
            },
          });
        };

        const TestWrapper = ({ children }: { children: React.ReactNode }) => (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        );
        TestWrapper.displayName = 'TestWrapper';

        const { result } = renderHook(() => useOptimisticMutation(), { wrapper: TestWrapper });

        // Override the mock for this specific test  
        mockSupabase.from.mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Update failed' }
                })
              })
            })
          })
        } as any);

        await act(async () => {
          result.current.mutate({
            taskId: 'task-1',
            status: 'completed',
          });
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        // Check that data was rolled back to original state
        const rolledBackData = queryClient.getQueryData(['tasks']) as typeof mockTask[];
        expect(rolledBackData[0]!.status).toBe('pending'); // Original status

        expect(mockToast.error).toHaveBeenCalledWith('Failed to update task status');
      });
    });
  });

  describe('Cache Invalidation Patterns', () => {
    it('should invalidate related queries after mutation', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 0 },
          mutations: { retry: false },
        },
      });

      // Set up multiple related queries
      queryClient.setQueryData(['contacts'], [mockContact]);
      queryClient.setQueryData(['contacts', { status: 'active' }], [mockContact]);
      queryClient.setQueryData(['contact-tasks', 'contact-1'], [mockTask]);

      const useMutationWithInvalidation = () => {
        return useMutation({
          mutationFn: async (data: Record<string, unknown>) => {
            return { success: true };
          },
          onSuccess: () => {
            // Invalidate all contact-related queries
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
            queryClient.invalidateQueries({ 
              queryKey: ['contact-tasks', mockContact.id] 
            });
          },
        });
      };

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
      TestWrapper.displayName = 'TestWrapper';

      const { result } = renderHook(() => useMutationWithInvalidation(), { wrapper: TestWrapper });

      await act(async () => {
        result.current.mutate({ id: 'contact-1' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that related queries were invalidated
      expect(queryClient.getQueryState(['contacts'])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['contacts', { status: 'active' }])?.isInvalidated).toBe(true);
      expect(queryClient.getQueryState(['contact-tasks', 'contact-1'])?.isInvalidated).toBe(true);
    });

    it('should handle concurrent mutations gracefully', async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false, staleTime: 0 },
          mutations: { retry: false },
        },
      });

      const mutationFn = async (data: Record<string, unknown>) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50));
        return { success: true, id: data.id };
      };

      const useConcurrentMutation = () => {
        return useMutation({
          mutationFn,
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
          },
        });
      };

      const TestWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
      TestWrapper.displayName = 'TestWrapper';

      const { result } = renderHook(() => useConcurrentMutation(), { wrapper: TestWrapper });

      // Trigger multiple concurrent mutations
      await act(async () => {
        const promises = [
          result.current.mutateAsync({ id: 1 }),
          result.current.mutateAsync({ id: 2 }),
          result.current.mutateAsync({ id: 3 }),
        ];

        const results = await Promise.all(promises);
        
        expect(results).toHaveLength(3);
        results.forEach((result, i) => {
          expect(result.id).toBe(i + 1);
        });
      });
    });
  });

  describe('Error Recovery', () => {
    it('should handle network errors with proper user feedback', async () => {
      const mutationFn = async () => {
        throw new Error('Network error');
      };

      const wrapper = createWrapper();
      const { result } = renderHook(() => useTestMutation(mutationFn), { wrapper });

      await act(async () => {
        result.current.mutate({});
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockToast.error).toHaveBeenCalledWith('Network error');
      expect(result.current.error).toEqual(new Error('Network error'));
    });

    it('should handle mutation retry on failure', async () => {
      let attemptCount = 0;
      const retryMutationFn = async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error(`Attempt ${attemptCount} failed`);
        }
        return { success: true };
      };

      const useRetryMutation = () => {
        return useMutation({
          mutationFn: retryMutationFn,
          retry: 2, // Retry 2 times
          retryDelay: 100, // Quick retry for tests
        });
      };

      const wrapper = createWrapper();
      const { result } = renderHook(() => useRetryMutation(), { wrapper });

      await act(async () => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      }, { timeout: 1000 });

      expect(attemptCount).toBe(3); // Initial attempt + 2 retries
      expect(result.current.data).toEqual({ success: true });
    });
  });
});