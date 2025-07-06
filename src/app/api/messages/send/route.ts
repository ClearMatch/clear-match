import { NextRequest, NextResponse } from "next/server";
import { handleApiError, validateString, ApiError, authenticateUser } from '@/lib/api-utils';
import { sendSMS, formatPhoneForTwilio, validatePhoneNumber } from '@/lib/sms-service';

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await authenticateUser();
    
    const body = await request.json();
    const { 
      activityId, 
      contactId, 
      message, 
      phoneFrom, 
      phoneTo 
    } = body;

    // Validate required fields
    if (!activityId || !contactId || !message || !phoneFrom || !phoneTo) {
      throw new ApiError('Missing required fields: activityId, contactId, message, phoneFrom, phoneTo', 400);
    }

    const validatedMessage = validateString(message, 'Message', 1000, true);
    if (!validatedMessage) {
      throw new ApiError('Message is required', 400);
    }

    // Validate phone numbers
    if (!validatePhoneNumber(phoneFrom)) {
      throw new ApiError('Invalid sender phone number format', 400);
    }

    if (!validatePhoneNumber(phoneTo)) {
      throw new ApiError('Invalid recipient phone number format', 400);
    }

    // Verify the activity exists and belongs to the user's organization
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("id, organization_id, contact_id, type")
      .eq("id", activityId)
      .eq("organization_id", user.organizationId)
      .single();
      
    if (activityError || !activity) {
      throw new ApiError('Activity not found or you do not have permission to send messages for it', 404);
    }

    // Verify the contact exists and belongs to the user's organization
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("id, organization_id")
      .eq("id", contactId)
      .eq("organization_id", user.organizationId)
      .single();
      
    if (contactError || !contact) {
      throw new ApiError('Contact not found or you do not have permission to send messages to them', 404);
    }

    // Verify the activity is associated with the contact
    if (activity.contact_id !== contactId) {
      throw new ApiError('Activity is not associated with this contact', 400);
    }

    // Verify the activity is a text type
    if (activity.type !== 'text') {
      throw new ApiError('Activity must be of type "text" to send SMS', 400);
    }

    // Format phone numbers for Twilio
    const formattedPhoneFrom = formatPhoneForTwilio(phoneFrom);
    const formattedPhoneTo = formatPhoneForTwilio(phoneTo);

    // Create message record in database first
    const { data: messageRecord, error: messageError } = await supabase
      .from("messages")
      .insert({
        organization_id: user.organizationId,
        activity_id: activityId,
        sender_id: user.id,
        contact_id: contactId,
        direction: 'outbound',
        phone_from: formattedPhoneFrom,
        phone_to: formattedPhoneTo,
        message_body: validatedMessage,
        status: 'pending'
      })
      .select()
      .single();

    if (messageError) {
      throw new ApiError('Failed to create message record', 500);
    }

    // Send SMS via Twilio
    const smsResult = await sendSMS({
      to: formattedPhoneTo,
      from: formattedPhoneFrom,
      body: validatedMessage
    });

    // Update message record with result
    const updateData: any = {
      status: smsResult.success ? 'sent' : 'failed',
      sent_at: smsResult.success ? new Date().toISOString() : null,
      twilio_message_sid: smsResult.messageId || null,
      twilio_status: smsResult.status || null,
      error_message: smsResult.error || null
    };

    const { data: updatedMessage, error: updateError } = await supabase
      .from("messages")
      .update(updateData)
      .eq("id", messageRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update message status:', updateError);
      // Don't throw error here, the message was sent successfully
    }

    return NextResponse.json({
      success: smsResult.success,
      message: updatedMessage || messageRecord,
      error: smsResult.error || null
    });

  } catch (error) {
    console.error('SMS sending error:', error);
    return handleApiError(error);
  }
}