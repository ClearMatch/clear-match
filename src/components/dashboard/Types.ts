import React from "react";

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  engagement_score?: number;
}

export interface ProfileGroup {
  name: string;
  scoreRange: string;
  minScore: number;
  maxScore: number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  contacts: Contact[];
  count: number;
}