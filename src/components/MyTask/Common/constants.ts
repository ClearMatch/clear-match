export const activityTypeOptions = [
  // Highest Importance (10)
  { value: "new-job-posting", label: "New Job Posting" },

  // High Importance (9)
  { value: "open-to-work", label: "Open to Work" },
  { value: "laid-off", label: "Laid Off" },
  { value: "interview", label: "Interview" },

  // Medium-High Importance (8)
  { value: "funding-news", label: "Funding News" },
  { value: "company-layoffs", label: "Company Layoffs" },
  { value: "birthday", label: "Birthday" },
  { value: "meeting", label: "Meeting" },

  // Medium Importance (6)
  { value: "m-and-a-activity", label: "M&A Activity" },
  { value: "email-reply-received", label: "Email Reply Received" },
  { value: "follow-up", label: "Follow Up" },
  { value: "call", label: "Call" },
  { value: "video", label: "Video" },

  // Low Importance (4)
  { value: "holiday", label: "Holiday" },
  { value: "personal-interest-tag", label: "Personal Interest Tag" },
  { value: "email", label: "Email" },
  { value: "text", label: "Text" },

  // Lowest Importance (2)
  { value: "dormant-status", label: "Dormant Status" },
];

export const statusOptions = [
  { value: "todo", label: "To Do" },
  { value: "in-progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export const priorityOptions = [
  { value: "4", label: "Critical" },
  { value: "3", label: "High" },
  { value: "2", label: "Medium" },
  { value: "1", label: "Low" },
];

export const criticalityTypeOptions = priorityOptions;
