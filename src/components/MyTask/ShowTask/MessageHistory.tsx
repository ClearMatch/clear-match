"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Clock, CheckCircle, XCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatPhoneNumber } from "@/lib/phone-utils";

interface Message {
  id: string;
  direction: 'outbound' | 'inbound';
  phone_from: string;
  phone_to: string;
  message_body: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'received';
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  sender?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  contact?: {
    id: string;
    first_name: string;
    last_name: string;
  };
}

interface MessageHistoryProps {
  activityId: string;
  refreshTrigger?: number;
}

export default function MessageHistory({ activityId, refreshTrigger }: MessageHistoryProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/messages/activity/${activityId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [activityId, refreshTrigger]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'sent':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'received':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'received':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Message History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Message History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8 text-red-600">
            <XCircle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Message History
          {messages.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {messages.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {messages.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No messages yet. Send your first text message above!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 rounded-lg border ${
                  message.direction === 'outbound'
                    ? 'bg-blue-50 border-blue-200 ml-8'
                    : 'bg-gray-50 border-gray-200 mr-8'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {message.direction === 'outbound' ? (
                      <ArrowRight className="w-4 h-4 text-blue-600" />
                    ) : (
                      <ArrowLeft className="w-4 h-4 text-gray-600" />
                    )}
                    <span className="text-sm font-medium">
                      {message.direction === 'outbound' ? 'Sent' : 'Received'}
                    </span>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(message.status)}
                      <Badge className={`text-xs ${getStatusColor(message.status)}`}>
                        {message.status}
                      </Badge>
                    </div>
                  </div>
                  <time className="text-xs text-gray-500">
                    {formatDate(message.created_at)}
                  </time>
                </div>
                
                <div className="mb-3">
                  <p className="text-gray-900 whitespace-pre-wrap">{message.message_body}</p>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>From: {formatPhoneNumber(message.phone_from)}</span>
                    <span>To: {formatPhoneNumber(message.phone_to)}</span>
                  </div>
                  {message.sent_at && (
                    <span>Sent: {formatDate(message.sent_at)}</span>
                  )}
                </div>
                
                {message.error_message && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-600">
                      Error: {message.error_message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}