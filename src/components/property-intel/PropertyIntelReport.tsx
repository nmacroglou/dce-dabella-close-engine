import { useState } from "react";
import type { PropertyIntelReport as Report } from "@/lib/propertyIntel/types";
import DoorValue from "./DoorValue";
import { formatCurrency } from "@/lib/format";
import ConfidenceBadge from "./ConfidenceBadge";
import WhyConfidencePanel from "./WhyConfidencePanel";
import RepActionsBar from "./RepActionsBar";
import QualificationDeck from "./QualificationDeck";
import { NeighborhoodProof } from "./NeighborhoodProof";
import IntelMetricsPanel from "./IntelMetrics";

import {
  MapPin, User, ScrollText, Home, Sparkles, DoorOpen, AlertCircle, FileWarning, Building2,
} from "lucide-react";

function Section({
  icon: Icon, title, badge, children,
}: { icon: React.ElementType; title: string; badge?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card-elevated p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-display font-bold uppercase tracking-[0.14em]">{title}</h3>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1 border-b border-hairline/50 last:border-b-0">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground text-right">{value ?? "—"}</span>
    </div>
  );
}

const OWNER_TYPE_LABEL: Record<string, string> = {
  individual: "Individual",
  joint: "Joint owners",
  trust: "Trust",
  llc: "LLC",
  corporation: "Corporation",
  unknown: "Unknown",
};

export default function PropertyIntelReportView({ report }: { report: Report }) {
  const { property_match: m, ownership: o, most_recent_sale: s, identity, info, opportunity: opp, brief } = report;
  const requiresConfirmation = o.owner_type === "trust" || o.owner_type === "llc" || o.owner_type === "corporation";

  return (
    <div className="space-y-4 pb-24">
      {report.is_demo && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] font-semibold text-amber-300 flex items-center gap-2">
          <FileWarning className="h-4 w-4" />
          Demo data — provider APIs not yet connected. Configure ATTOM / Regrid / CoreLogic / DataTree to enable live lookups.
        </div>
      )}

      {info.do_not_knock && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-[13px] font-bold text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Do Not Knock — this property is suppressed. Routing and door actions disabled.
        </div>
      )}

      {/* Pre-Door Brief — hero */}
      <Section icon={DoorOpen} title="Pre-door brief" badge={<ConfidenceBadge c={report.overall_confidence} />}>
        <div className="grid gap-2">
          <Row label="Likely recorded owner"
            value={brief.headline_name ?? <span className="text-amber-300">Ownership requires confirmation</span>} />
          <Row label="Owner confidence" value={<ConfidenceBadge c={identity.confidence} />} />
          <Row label="Likely product need" value={opp.primary_product.replace(/^./, (c) => c.toUpperCase())} />
          <Row label="Opportunity score" value={`${opp.opportunity_score}/100`} />
          <Row label="Product confidence" value={<ConfidenceBadge c={opp.recommendation_confidence} />} />
        </div>
        <div className="mt-3 rounded-lg border border-primary/30 bg-primary/10 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">Suggested opener</p>
          <p className="text-sm text-foreground italic">"{brief.suggested_opener}"</p>
          {!brief.use_name_at_door && (
            <p className="mt-2 text-[11px] text-amber-300 font-semibold">
              Name suppressed — confidence below 75%. Do not use the recorded name at the door.
            </p>
          )}
        </div>
        {brief.reasons.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Why this house</p>
            <ul className="space-y-1">
              {brief.reasons.map((r, i) => (
                <li key={i} className="text-[12px] text-foreground/85">• {r}</li>
              ))}
            </ul>
          </div>
        )}
      </Section>

      <NeighborhoodProof lat={m.latitude} lng={m.longitude} street={m.standardized_address.split(",")[0]} />

      <QualificationDeck report={report} />

      <IntelMetricsPanel report={report} />



      {/* Property match */}
      <Section icon={MapPin} title="Property match" badge={<ConfidenceBadge c={m.confidence} />}>
        <div className="grid gap-1">
          <Row label="Standardized address" value={m.standardized_address} />
          <Row label="Parcel #" value={m.parcel_number} />
          <Row label="Property type" value={m.property_type} />
          <Row label="Coordinates" value={m.latitude && m.longitude ? `${m.latitude.toFixed(5)}, ${m.longitude.toFixed(5)}` : "—"} />
          <Row label="Sources" value={m.data_sources.join(" · ")} />
          <Row label="Last updated" value={new Date(m.last_updated).toLocaleString()} />
        </div>
        <WhyConfidencePanel c={m.confidence} />
      </Section>

      {/* Owner & Buyer intelligence */}
      <Section icon={User} title="Owner & buyer intelligence" badge={<ConfidenceBadge c={o.confidence} />}>
        {requiresConfirmation && (
          <div className="mb-3 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-amber-300" />
            <span className="text-[12px] font-semibold text-amber-300">Owner identity requires confirmation</span>
          </div>
        )}
        <div className="grid gap-1">
          <Row label="Recorded owner" value={o.owner_name} />
          <Row label="Ownership type" value={OWNER_TYPE_LABEL[o.owner_type]} />
          <Row label="Tax mailing name" value={o.tax_mailing_name} />
          <Row label="Tax mailing address" value={o.tax_mailing_address} />
          <Row label="Tax mailing matches property"
            value={o.tax_mailing_matches_property
              ? <span className="text-emerald-400">Yes</span>
              : <span className="text-amber-300">No</span>} />
          <Row label="Document type" value={o.document_type} />
          <Row label="Record date" value={o.source_record_date} />
          <Row label="Source" value={o.source} />
        </div>
        <WhyConfidencePanel c={o.confidence} label="Why this ownership confidence?" />
      </Section>

      <Section icon={ScrollText} title="Most recent recorded sale" badge={<ConfidenceBadge c={s.confidence} />}>
        <div className="grid gap-1">
          <Row label="Sale date" value={s.sale_date} />
          <Row label="Recorded buyer" value={s.buyer_name} />
          <Row label="Recorded seller" value={s.seller_name} />
          <Row label="Sale price" value={s.sale_price ? formatCurrency(s.sale_price) : "—"} />
          <Row label="Document" value={`${s.document_type ?? ""} · ${s.recording_number ?? ""}`} />
          <Row label="Source" value={s.source} />
        </div>
        <WhyConfidencePanel c={s.confidence} label="Why this sale confidence?" />
      </Section>

      <Section icon={Home} title="Property information">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <Row label="Year built" value={info.year_built} />
          <Row label="Stories" value={info.stories} />
          <Row label="Square feet" value={info.square_feet?.toLocaleString()} />
          <Row label="Lot size (sq ft)" value={info.lot_size?.toLocaleString()} />
          <Row label="Bedrooms" value={info.bedrooms} />
          <Row label="Bathrooms" value={info.bathrooms} />
          <Row label="Assessed value" value={info.assessed_value ? formatCurrency(info.assessed_value) : "—"} />
          <Row label="Est. market value" value={info.estimated_market_value ? formatCurrency(info.estimated_market_value) : "—"} />
          <Row label="Roof material" value={info.roof_material} />
          <Row label={info.is_roof_age_estimated ? "Roof age (est.)" : "Roof age"} value={info.estimated_roof_age ? `${info.estimated_roof_age} years` : "—"} />
          <Row label="Exterior" value={info.exterior_material} />
          <Row label="Solar" value={info.solar_present ? "Yes" : "No"} />
          <Row label="Heat exposure" value={info.heat_exposure} />
          <Row label="Storm exposure" value={info.storm_exposure} />
        </div>
        {info.permits.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Permit history</p>
            <ul className="space-y-1">
              {info.permits.map((p, i) => (
                <li key={i} className="text-[12px] text-foreground/85">
                  <span className="font-semibold">{p.date}</span> — {p.type}: {p.description}
                </li>
              ))}
            </ul>
          </div>
        )}
        <p className="mt-2 text-[10px] italic text-muted-foreground">
          Estimated values shown are not proof of purchasing ability or financing eligibility.
        </p>
      </Section>

      {/* Opportunity */}
      <Section icon={Sparkles} title="Product opportunity" badge={<ConfidenceBadge c={opp.recommendation_confidence} />}>
        <div className="grid gap-1">
          <Row label="Primary" value={opp.primary_product.replace(/^./, (c) => c.toUpperCase())} />
          <Row label="Secondary" value={opp.secondary_product?.replace(/^./, (c) => c.toUpperCase()) ?? "—"} />
          <Row label="Opportunity score" value={`${opp.opportunity_score} / 100`} />
        </div>
        <div className="mt-3 space-y-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Supporting reasons</p>
            <ul className="space-y-1">
              {opp.reasons.map((r, i) => <li key={i} className="text-[12px] text-foreground/85">• {r}</li>)}
            </ul>
          </div>
          {opp.suggested_inspection_focus.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Inspection focus</p>
              <ul className="space-y-1">
                {opp.suggested_inspection_focus.map((r, i) => <li key={i} className="text-[12px] text-foreground/85">→ {r}</li>)}
              </ul>
            </div>
          )}
          {opp.missing_info.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Missing information</p>
              <ul className="space-y-1">
                {opp.missing_info.map((r, i) => <li key={i} className="text-[12px] text-amber-300/90">? {r}</li>)}
              </ul>
            </div>
          )}
        </div>
        <p className="mt-3 text-[10px] italic text-muted-foreground">
          Opportunity score is separate from confidence score. Do not state that the roof is damaged unless confirmed by inspection.
        </p>
      </Section>
        </div>
      )}

      <RepActionsBar report={report} />
    </div>
  );
}
