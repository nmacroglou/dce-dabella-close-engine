export interface FollowUpTouchpoint {
  label: string;
  offset_hours: number;
}

export interface FollowUpSLA {
  touchpoints: FollowUpTouchpoint[];
}

export const DEFAULT_FOLLOW_UP_SLA: FollowUpSLA = {
  touchpoints: [
    { label: "First touch", offset_hours: 24 },
    { label: "Second touch", offset_hours: 72 },
    { label: "Third touch", offset_hours: 168 },
  ],
};

export interface FollowUpAttachment {
  url: string;
  path: string;
  name: string;
  type: string;
  size: number;
  caption?: string;
}

export interface FollowUp {
  id: string;
  deal_id: string;
  rep_id: string;
  touchpoint_number: number;
  due_at: string;
  completed_at: string | null;
  channel: string | null;
  notes: string | null;
  ai_email_subject: string | null;
  ai_email_body: string | null;
  context_notes: string | null;
  attachments: FollowUpAttachment[];
  created_at: string;
  updated_at: string;
}

export type FollowUpStatus = "overdue" | "due_today" | "upcoming" | "completed";

export function followUpStatus(f: FollowUp, now: Date = new Date()): FollowUpStatus {
  if (f.completed_at) return "completed";
  const due = new Date(f.due_at);
  const diffH = (due.getTime() - now.getTime()) / 36e5;
  if (diffH < 0) return "overdue";
  // due "today" if due within current calendar day
  if (
    due.getFullYear() === now.getFullYear() &&
    due.getMonth() === now.getMonth() &&
    due.getDate() === now.getDate()
  ) return "due_today";
  return "upcoming";
}
