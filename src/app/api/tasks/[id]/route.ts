import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { handleApiError, validateString, ApiError } from '@/lib/api-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("PUT request received for task ID:", params.id);
    
    // Get the authorization header from the request
    const authHeader = request.headers.get('authorization');
    console.log("Authorization header present:", !!authHeader);
    
    // Try to get the token from the authorization header
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log("Token extracted from Authorization header");
    }
    
    // If no token in header, try to get it from cookies
    const cookieStore = cookies();
    console.log("Cookie store initialized");
    
    if (!token) {
      // List all cookies to debug
      const allCookies = cookieStore.getAll();
      console.log("All available cookies:", allCookies.map(c => c.name));
      
      // Try to get the token from various possible cookie names
      // Supabase typically uses cookies like: sb-<project-ref>-auth-token
      const possibleCookies = [
        'sb-zkqeoppjgdyzarkhhbqc-auth-token',
        'sb-zkqeoppjgdyzarkhhbqc-auth-token-code-verifier',
        'sb-access-token', 
        'supabase-auth-token', 
        'sb:token'
      ];
      
      // Also check for cookies that start with 'sb-'
      for (const cookie of allCookies) {
        if (cookie.name.startsWith('sb-') && cookie.name.includes('auth-token') && !cookie.name.includes('code-verifier')) {
          console.log(`Found Supabase auth cookie: ${cookie.name}`);
          try {
            const parsed = JSON.parse(cookie.value);
            // Supabase auth cookies have a specific structure
            if (parsed && Array.isArray(parsed) && parsed.length > 0) {
              const authData = parsed[0];
              token = authData.access_token || authData.token;
              if (token) {
                console.log("Extracted token from Supabase cookie");
                break;
              }
            }
          } catch (e) {
            console.log("Failed to parse cookie as JSON, trying raw value");
            token = cookie.value;
            if (token) break;
          }
        }
      }
      
      // If still no token, try the predefined cookie names
      if (!token) {
        for (const cookieName of possibleCookies) {
          const cookie = cookieStore.get(cookieName);
          if (cookie) {
            console.log(`Found auth cookie: ${cookieName}`);
            try {
              // Some cookies store the token as JSON
              const parsed = JSON.parse(cookie.value);
              if (Array.isArray(parsed) && parsed.length > 0) {
                const authData = parsed[0];
                token = authData.access_token || authData.token;
              } else {
                token = parsed.access_token || parsed.token || parsed;
              }
            } catch (e) {
              // If not JSON, use the raw value
              token = cookie.value;
            }
            if (token) break;
          }
        }
      }
    }
    
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
        global: {
          headers: token ? {
            Authorization: `Bearer ${token}`
          } : {}
        }
      }
    );
    console.log("Supabase client created");
    
    // Get the current session
    console.log("Getting auth session...");
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session error:", sessionError);
      throw new ApiError('Authentication error: ' + sessionError.message, 401);
    }
    
    if (!session || !session.user) {
      console.error("No session or user found");
      
      // If we have a token but no session, try to get the user directly
      if (token) {
        console.log("Trying to get user from token...");
        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        
        if (userError || !userData.user) {
          console.error("User error:", userError);
          throw new ApiError('Invalid authentication token', 401);
        }
        
        console.log("Authenticated as user from token:", userData.user.id);
        
        // Continue with the user ID from the token
        const userId = userData.user.id;
        
        // Get the user's organization_id
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("organization_id")
          .eq("id", userId)
          .single();
          
        if (profileError) {
          console.error("Profile error:", profileError);
          throw new ApiError('Failed to get user organization', 500);
        }
        
        // Continue processing with the user ID from the token
        const { id } = params;
        const body = await request.json();
        
        // Extract and validate task data
        const {
          description,
          type,
          due_date,
          status,
          priority,
          candidate_id,
          subject,
          content,
          assigned_to,
          event_id,
          job_posting_id
        } = body;

        // Build update object with validated fields
        const updateData: any = {};
        
        // Always set the organization_id from the user's profile
        updateData.organization_id = profileData.organization_id;
        
        if (description !== undefined) {
          updateData.description = validateString(description, 'Description', 500, true);
        }
        
        if (type !== undefined) {
          updateData.type = validateString(type, 'Type', 100, true);
        }
        
        if (due_date !== undefined) {
          // Handle empty string for due_date
          updateData.due_date = due_date === "" ? null : due_date;
        }
        
        if (status !== undefined) {
          const validStatuses = ['todo', 'in-progress', 'done'];
          if (!validStatuses.includes(status)) {
            throw new ApiError('Invalid status value', 400);
          }
          updateData.status = status;
        }
        
        if (priority !== undefined) {
          // Handle both string and number priority values
          const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
          if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 6) {
            throw new ApiError('Priority must be a number between 1 and 6', 400);
          }
          updateData.priority = priorityNum;
        }
        
        if (candidate_id !== undefined) {
          // Handle empty string for candidate_id
          updateData.candidate_id = candidate_id === "" ? null : candidate_id;
        }
        
        
        if (subject !== undefined) {
          updateData.subject = validateString(subject, 'Subject', 200);
        }
        
        if (content !== undefined) {
          updateData.content = validateString(content, 'Content', 5000);
        }
        
        if (assigned_to !== undefined) {
          // Handle empty string for assigned_to
          updateData.assigned_to = assigned_to === "" ? null : assigned_to;
        }
        
        if (event_id !== undefined) {
          updateData.event_id = event_id;
        }
        
        if (job_posting_id !== undefined) {
          updateData.job_posting_id = job_posting_id;
        }

        // First, verify the task exists and belongs to the user's organization
        const { data: existingTask, error: taskError } = await supabase
          .from("activities")
          .select("id, organization_id")
          .eq("id", id)
          .eq("organization_id", profileData.organization_id)
          .single();
          
        if (taskError || !existingTask) {
          throw new ApiError('Task not found or you do not have permission to update it', 404);
        }

        // Update the task
        const { data: task, error: updateError } = await supabase
          .from("activities")
          .update(updateData)
          .eq("id", id)
          .select()
          .single();

        if (updateError) {
          throw new ApiError("Failed to update task", 500);
        }

        return NextResponse.json(task);
      }
      
      throw new ApiError('Authentication required - no session found', 401);
    }
    
    console.log("Authenticated as user:", session.user.id);
    
    // Get the user's organization_id
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", session.user.id)
      .single();
      
    if (profileError) {
      throw new ApiError('Failed to get user organization', 500);
    }
    
    const { id } = params;
    const body = await request.json();
    
    // Extract and validate task data
    const {
      description,
      type,
      due_date,
      status,
      priority,
      candidate_id,
      subject,
      content,
      assigned_to,
      event_id,
      job_posting_id
    } = body;

    // Build update object with validated fields
    const updateData: any = {};
    
    // Always set the organization_id from the user's profile
    updateData.organization_id = profileData.organization_id;
    
    if (description !== undefined) {
      updateData.description = validateString(description, 'Description', 500, true);
    }
    
    if (type !== undefined) {
      updateData.type = validateString(type, 'Type', 100, true);
    }
    
    if (due_date !== undefined) {
      // Handle empty string for due_date
      updateData.due_date = due_date === "" ? null : due_date;
    }
    
    if (status !== undefined) {
      const validStatuses = ['todo', 'in-progress', 'done'];
      if (!validStatuses.includes(status)) {
        throw new ApiError('Invalid status value', 400);
      }
      updateData.status = status;
    }
    
    if (priority !== undefined) {
      // Handle both string and number priority values
      const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
      if (isNaN(priorityNum) || priorityNum < 1 || priorityNum > 6) {
        throw new ApiError('Priority must be a number between 1 and 6', 400);
      }
      updateData.priority = priorityNum;
    }
    
    if (candidate_id !== undefined) {
      // Handle empty string for candidate_id
      updateData.candidate_id = candidate_id === "" ? null : candidate_id;
    }
    
    
    if (subject !== undefined) {
      updateData.subject = validateString(subject, 'Subject', 200);
    }
    
    if (content !== undefined) {
      updateData.content = validateString(content, 'Content', 5000);
    }
    
    if (assigned_to !== undefined) {
      // Handle empty string for assigned_to
      updateData.assigned_to = assigned_to === "" ? null : assigned_to;
    }
    
    if (event_id !== undefined) {
      updateData.event_id = event_id;
    }
    
    if (job_posting_id !== undefined) {
      updateData.job_posting_id = job_posting_id;
    }

    // First, verify the task exists and belongs to the user's organization
    const { data: existingTask, error: taskError } = await supabase
      .from("activities")
      .select("id, organization_id")
      .eq("id", id)
      .eq("organization_id", profileData.organization_id)
      .single();
      
    if (taskError || !existingTask) {
      throw new ApiError('Task not found or you do not have permission to update it', 404);
    }

    // Update the task
    const { data: task, error: updateError } = await supabase
      .from("activities")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw new ApiError("Failed to update task", 500);
    }

    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session || !session.user) {
      throw new ApiError('Authentication required', 401);
    }
    
    // Get the user's organization_id
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", session.user.id)
      .single();
      
    if (profileError) {
      throw new ApiError('Failed to get user organization', 500);
    }
    
    const { id } = params;

    // First, check if the task exists and belongs to the user's organization
    const { data: task, error: taskError } = await supabase
      .from("activities")
      .select("id, organization_id")
      .eq("id", id)
      .eq("organization_id", profileData.organization_id)
      .single();
      
    if (taskError || !task) {
      throw new ApiError('Task not found or you do not have permission to delete it', 404);
    }

    // Delete the task
    const { error: deleteError } = await supabase
      .from("activities")
      .delete()
      .eq("id", id);

    if (deleteError) {
      throw new ApiError("Failed to delete task", 500);
    }

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
