"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Send, Loader2, Phone, User } from "lucide-react";
import { toast } from "sonner";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/phone-utils";

interface MessageComposerProps {
  activityId: string;
  contactId: string;
  contactName: string;
  contactPhone?: string;
  userPhone?: string;
  onMessageSent?: () => void;
  onPhoneUpdated?: () => void;
}

export default function MessageComposer({
  activityId,
  contactId,
  contactName,
  contactPhone,
  userPhone,
  onMessageSent,
  onPhoneUpdated
}: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [phoneFrom, setPhoneFrom] = useState(userPhone || "");
  const [phoneTo, setPhoneTo] = useState(contactPhone || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (!phoneFrom) {
      toast.error("Please set your phone number");
      setShowPhoneDialog(true);
      return;
    }

    if (!phoneTo) {
      toast.error("Contact phone number is required");
      return;
    }

    if (!validatePhoneNumber(phoneFrom)) {
      toast.error("Invalid sender phone number format");
      return;
    }

    if (!validatePhoneNumber(phoneTo)) {
      toast.error("Invalid recipient phone number format");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activityId,
          contactId,
          message: message.trim(),
          phoneFrom,
          phoneTo,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("Message sent successfully!");
        setMessage("");
        onMessageSent?.();
      } else {
        toast.error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneUpdate = async () => {
    if (!phoneFrom) {
      toast.error("Please enter your phone number");
      return;
    }

    if (!validatePhoneNumber(phoneFrom)) {
      toast.error("Invalid phone number format");
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: phoneFrom,
        }),
      });

      if (response.ok) {
        toast.success("Phone number updated!");
        setShowPhoneDialog(false);
        onPhoneUpdated?.(); // Refresh the profile to update userPhone prop
      } else {
        toast.error("Failed to update phone number");
      }
    } catch (error) {
      console.error("Error updating phone:", error);
      toast.error("Failed to update phone number");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Send Text Message
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phone Numbers Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <User className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">From (You)</p>
              <p className="text-sm text-gray-900">
                {phoneFrom ? formatPhoneNumber(phoneFrom) : "No phone set"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Phone className="w-4 h-4 text-gray-600" />
            <div>
              <p className="text-sm font-medium text-gray-700">To ({contactName})</p>
              <p className="text-sm text-gray-900">
                {phoneTo ? formatPhoneNumber(phoneTo) : "No phone set"}
              </p>
            </div>
          </div>
        </div>

        {/* Message Input */}
        <div>
          <Label htmlFor="message">Message</Label>
          <Textarea
            id="message"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={1000}
          />
          <p className="text-sm text-gray-500 mt-1">
            {message.length}/1000 characters
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Phone className="w-4 h-4 mr-2" />
                Set Phone Number
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Your Phone Number</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={phoneFrom}
                    onChange={(e) => setPhoneFrom(e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Enter your phone number to send text messages
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPhoneDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePhoneUpdate}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save Phone Number
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleSend}
            disabled={isLoading || !message.trim() || !phoneFrom || !phoneTo}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:text-gray-200"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Send Message
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}