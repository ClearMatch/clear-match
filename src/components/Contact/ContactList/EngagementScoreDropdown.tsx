"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "@/hooks/use-toast";
import { engagementScoreSelectOptions, getEngagementScoreLabel } from "@/lib/constants/engagement-score";
import { useState } from "react";

interface EngagementScoreDropdownProps {
  contactId: string;
  currentScore?: number;
  onUpdate?: (newScore: number) => void;
}

export function EngagementScoreDropdown({
  contactId,
  currentScore,
  onUpdate,
}: EngagementScoreDropdownProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();

  const updateEngagementScore = useMutation({
    mutationFn: async ({ contactId, score }: { contactId: string; score: number }) => {
      const { error } = await supabase
        .from("contacts")
        .update({ engagement_score: score })
        .eq("id", contactId);

      if (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (_, variables) => {
      // More targeted cache invalidation
      queryClient.invalidateQueries({ 
        queryKey: ["contacts"], 
        exact: false 
      });
      
      toast({
        title: "Success",
        description: "Engagement score updated successfully.",
      });
      
      onUpdate?.(variables.score);
      setIsUpdating(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update engagement score",
        variant: "destructive",
      });
      setIsUpdating(false);
    },
  });

  const handleScoreChange = (value: string) => {
    const score = parseInt(value);
    setIsUpdating(true);
    updateEngagementScore.mutate({ contactId, score });
  };

  // If no current score, show a select to add one
  if (!currentScore) {
    return (
      <Select onValueChange={handleScoreChange} disabled={isUpdating}>
        <SelectTrigger className={`w-full h-8 text-xs border border-gray-200 rounded-md ${isUpdating ? 'animate-pulse' : ''}`}>
          <SelectValue placeholder="Set score" />
        </SelectTrigger>
        <SelectContent>
          {engagementScoreSelectOptions.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // If has score, show current score with full-width dropdown
  return (
    <Select 
      value={currentScore.toString()} 
      onValueChange={handleScoreChange}
      disabled={isUpdating}
    >
      <SelectTrigger className={`w-full h-8 border border-gray-200 rounded-md px-2 py-1 text-xs hover:bg-gray-50 transition-colors ${isUpdating ? 'animate-pulse' : ''}`}>
        <span className={`truncate ${isUpdating ? 'opacity-50' : ''}`}>
          {isUpdating ? "Updating..." : `${currentScore} - ${getEngagementScoreLabel(currentScore)}`}
        </span>
      </SelectTrigger>
      <SelectContent>
        {engagementScoreSelectOptions.map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}