import type { Incident, IncidentType, IncidentSeverity } from "@/types/incident";

const TYPE_RULES: Array<{ re: RegExp; type: IncidentType; severity?: IncidentSeverity }> = [
  { re: /incomplete\s*paperwork|missing\s*paperwork|paperwork\s*issue/i, type: "incomplete_paperwork", severity: "high" },
  { re: /audit/i, type: "audit_item", severity: "medium" },
  { re: /change\s*order/i, type: "change_order" },
  { re: /addendum/i, type: "addendum" },
  { re: /refund/i, type: "refund", severity: "high" },
  { re: /deposit/i, type: "deposit_issue", severity: "high" },
  { re: /missing\s*poi|proof\s*of\s*income|\bpoi\b/i, type: "missing_poi", severity: "high" },
  { re: /fraud/i, type: "fraud_alert", severity: "critical" },
  { re: /\bcancel/i, type: "cancel_decline", severity: "high" },
  { re: /\bdecline|declined/i, type: "cancel_decline", severity: "high" },
  { re: /approval|pending/i, type: "approval_pending" },
  { re: /ownership|stip/i, type: "ownership_stip" },
  { re: /roof\s*(job\s*)?packet/i, type: "roof_packet" },
  { re: /deal\s*update/i, type: "deal_update" },
];

export function parseIncidentSubject(raw: string): Partial<Incident> {
  const subject = raw.trim();
  if (!subject) return {};

  const rule = TYPE_RULES.find((r) => r.re.test(subject));
  const incident_type: IncidentType = rule?.type ?? "other";
  const severity: IncidentSeverity = rule?.severity ?? "medium";

  // Job number: 5-7 digit run
  const jobMatch = subject.match(/\b(\d{5,7})\b/);
  const job_number = jobMatch?.[1] ?? null;

  // Customer name: tokens after the job number, stripped of stopwords
  let customer_name: string | null = null;
  if (jobMatch) {
    const after = subject.slice(jobMatch.index! + jobMatch[0].length).trim();
    const cleaned = after
      .replace(/^[-–—:,/|]+/, "")
      .replace(/[-–—:,/|]+$/, "")
      .trim();
    if (cleaned) customer_name = cleaned.split(/\s+/).slice(0, 4).join(" ");
  }

  return {
    title: subject,
    email_subject: subject,
    incident_type,
    severity,
    job_number,
    customer_name,
    source: "email",
  };
}
