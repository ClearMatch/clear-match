import { NextRequest, NextResponse } from "next/server";
import { handleApiError, validateString, ApiError, authenticateUser } from '@/lib/api-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase } = await authenticateUser();
    
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
    const updateData: {
      organization_id: string;
      description?: string | null;
      type?: string | null;
      due_date?: string | null;
      status?: string;
      priority?: number;
      candidate_id?: string | null;
      subject?: string | null;
      content?: string | null;
      assigned_to?: string | null;
      event_id?: string | null;
      job_posting_id?: string | null;
    } = {
      // Always set the organization_id from the user's profile
      organization_id: user.organizationId
    };
    
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
      .eq("organization_id", user.organizationId)
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
    const { user, supabase } = await authenticateUser();
    
    const { id } = params;

    // First, check if the task exists and belongs to the user's organization
    const { data: task, error: taskError } = await supabase
      .from("activities")
      .select("id, organization_id")
      .eq("id", id)
      .eq("organization_id", user.organizationId)
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