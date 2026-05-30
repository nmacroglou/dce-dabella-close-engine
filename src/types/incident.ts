export const INCIDENT_TYPES = [
  "incomplete_paperwork",
  "audit_item",
  "change_order",
  "addendum",
  "refund",
  "deposit_issue",
  "missing_poi",
  "fraud_alert",
  "cancel_decline",
  "approval_pending",
  "ownership_stip",
  "roof_packet",
  "deal_update",
  "other",
] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  incomplete_paperwork: "Incomplete Paperwork",
  audit_item: "Audit Item",
  change_order: "Change Order",
  addendum: "Addendum",
  refund: "Refund",
  deposit_issue: "Deposit Issue",
  missing_poi: "Missing POI",
  fraud_alert: "Fraud Alert",
  cancel_decline: "Cancel / Decline",
  approval_pending: "Approval Pending",
  ownership_stip: "Ownership Stip",
  roof_packet: "Roof Job Packet",
  deal_update: "Deal Update",
  other: "Other",
};

export const INCIDENT_STATUSES = [
  "open",
  "in_progress",
  "waiting_external",
  "blocked",
  "resolved",
] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_external: "Waiting",
  blocked: "Blocked",
  resolved: "Resolved",
};

export const INCIDENT_SEVERITIES = ["low", "medium", "high", "critical"] as const;
export type IncidentSeverity = (typeof INCIDENT_SEVERITIES)[number];

export const SEVERITY_ORDER: Record<IncidentSeverity, number> = {
  critical: 4, high: 3, medium: 2, low: 1,
};

export const INCIDENT_SOURCES = ["email", "phone", "text", "portal", "in_person", "other"] as const;
export type IncidentSource = (typeof INCIDENT_SOURCES)[number];

export interface IncidentAttachment {
  path: string;
  name: string;
  size?: number;
  type?: string;
}

export interface Incident {
  id: string;
  rep_id: string;
  deal_id: string | null;
  job_number: string | null;
  customer_name: string | null;
  title: string;
  details: string | null;
  incident_type: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;
  assignee: string | null;
  email_subject: string | null;
  email_link: string | null;
  tags: string[];
  attachments: IncidentAttachment[];
  due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IncidentNote {
  id: string;
  incident_id: string;
  rep_id: string;
  body: string;
  attachments: IncidentAttachment[];
  created_at: string;
}
