import { jsPDF } from "jspdf";
import { registerPdfFonts } from "./fonts";
import {
  type RGB,
  ACCENT, CARD, CREAM, FOREST, FOREST_INK, GRAPHITE, LIME, LIME_DEEP,
  MIST, NEGATIVE, PH, POSITIVE, PW, SAND, SLATE, WHITE,
} from "./theme";
import {
  eyebrow, hairline, pageBg, rect, reportFooter, rounded, sectionHeader,
  setBodyFont, setColor, setDisplayFont, setFill, trackedText, vGradient,
} from "./primitives";
import type { Confidence, PropertyIntelReport } from "@/lib/propertyIntel/types";
import { buildQualification } from "@/lib/propertyIntel/qualification";
import { buildIntelMetrics } from "@/lib/propertyIntel/metrics";


const M = 22;                 // page margin
const CW = PW - M * 2;        // content width
const BOTTOM = PH - 22;       // safe bottom

const dash = (v: unknown) =>
  v === null || v === undefined || v === "" ? "—" : String(v);

const money = (n: number | null | undefined) =>
  n === null || n === undefined
    ? "—"
    : `$${Math.round(n).toLocaleString("en-US")}`;

const num = (n: number | null | undefined, suffix = "") =>
  n === null || n === undefined ? "—" : `${n.toLocaleString("en-US")}${suffix}`;

const date = (s: string | null | undefined) => {
  if (!s) return "—";
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? s
    : d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const title = (s: string | null | undefined) =>
  !s ? "—" : s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function confColor(score: number) {
  if (score >= 75) return POSITIVE;
  if (score >= 50) return ACCENT;
  if (score >= 30) return LIME_DEEP;
  return NEGATIVE;
}

// ─── Page state ───────────────────────────────────────────────
interface Ctx { y: number }

function newPage(pdf: jsPDF, ctx: Ctx, eyebrowText: string, heading: string, subtitle?: string) {
  pdf.addPage();
  pageBg(pdf);
  sectionHeader(pdf, eyebrowText, heading, subtitle);
  ctx.y = subtitle ? 82 : 76;
}

/** Height of a kv card with n rows, including the block title above it. */
const kvNeed = (rows: number) => Math.ceil(rows / 2) * 9.4 + 8 + 6.5;

function ensure(pdf: jsPDF, ctx: Ctx, needed: number, eyebrowText: string, heading: string) {
  if (ctx.y + needed > BOTTOM) newPage(pdf, ctx, eyebrowText, `${heading} (cont.)`);
}

// ─── Building blocks ──────────────────────────────────────────
function blockTitle(pdf: jsPDF, ctx: Ctx, text: string) {
  setFill(pdf, ACCENT);
  pdf.rect(M, ctx.y - 3.2, 2.2, 4.4, "F");
  setDisplayFont(pdf, 11);
  setColor(pdf, FOREST_INK);
  pdf.text(text, M + 5.5, ctx.y);
  ctx.y += 6.5;
}

/** Two-column key/value grid inside a card. */
function kvCard(pdf: jsPDF, ctx: Ctx, rows: [string, string][]) {
  const cols = 2;
  const colW = (CW - 10) / cols;
  const rowH = 9.4;
  const lines = Math.ceil(rows.length / cols);
  const h = lines * rowH + 8;

  rounded(pdf, M, ctx.y, CW, h, 3, CARD, MIST);

  rows.forEach((r, i) => {
    const col = i % cols;
    const line = Math.floor(i / cols);
    const x = M + 6 + col * colW;
    const y = ctx.y + 8 + line * rowH;

    setBodyFont(pdf, 6.8);
    setColor(pdf, SLATE);
    trackedText(pdf, r[0].toUpperCase(), x, y, { charSpace: 0.4 });

    setBodyFont(pdf, 9.2, "bold");
    setColor(pdf, FOREST_INK);
    const val = pdf.splitTextToSize(r[1], colW - 8)[0] ?? "—";
    pdf.text(val, x, y + 4.6);
  });

  ctx.y += h + 7;
}

function paragraph(pdf: jsPDF, ctx: Ctx, text: string, size = 9.2) {
  setBodyFont(pdf, size);
  setColor(pdf, GRAPHITE);
  const lines = pdf.splitTextToSize(text, CW - 12) as string[];
  lines.forEach((ln) => {
    pdf.text(ln, M + 6, ctx.y);
    ctx.y += size * 0.52 + 0.9;
  });
  ctx.y += 3;
}

function bullets(pdf: jsPDF, ctx: Ctx, items: string[], color: RGB = LIME_DEEP) {
  if (!items.length) {
    paragraph(pdf, ctx, "None recorded.");
    return;
  }
  items.forEach((it) => {
    setBodyFont(pdf, 9);
    setColor(pdf, GRAPHITE);
    const lines = pdf.splitTextToSize(it, CW - 16) as string[];
    setFill(pdf, color);
    pdf.circle(M + 7, ctx.y - 1.2, 0.9, "F");
    lines.forEach((ln, i) => {
      pdf.text(ln, M + 11, ctx.y + i * 4.8);
    });
    ctx.y += lines.length * 4.8 + 1.6;
  });
  ctx.y += 2.5;
}

/** Confidence pill + score bar. */
function confidenceRow(pdf: jsPDF, ctx: Ctx, label: string, c: Confidence) {
  const h = 13;
  rounded(pdf, M, ctx.y, CW, h, 2.5, CREAM, MIST);
  const col = confColor(c.score);

  setBodyFont(pdf, 8.6, "bold");
  setColor(pdf, FOREST_INK);
  pdf.text(label, M + 6, ctx.y + 8.4);

  // bar
  const barX = M + 78;
  const barW = 60;
  rect(pdf, barX, ctx.y + 5.6, barW, 2.6, SAND);
  setFill(pdf, col);
  pdf.rect(barX, ctx.y + 5.6, (barW * Math.max(0, Math.min(100, c.score))) / 100, 2.6, "F");

  setBodyFont(pdf, 8.4, "bold");
  setColor(pdf, col);
  pdf.text(`${Math.round(c.score)}  ${c.label}`, PW - M - 6, ctx.y + 8.4, { align: "right" });

  ctx.y += h + 3;
}

// ─── Cover ────────────────────────────────────────────────────
function drawCover(pdf: jsPDF, r: PropertyIntelReport) {
  vGradient(pdf, 0, 0, PW, PH, FOREST, FOREST_INK);

  pdf.setGState(pdf.GState({ opacity: 0.07 }));
  setFill(pdf, LIME);
  pdf.circle(180, 34, 92, "F");
  pdf.circle(-12, 236, 76, "F");
  pdf.setGState(pdf.GState({ opacity: 1 }));

  rect(pdf, 0, 0, PW, 0.6, ACCENT);

  setDisplayFont(pdf, 7);
  setColor(pdf, LIME);
  trackedText(pdf, "DABELLA", M, 22, { charSpace: 0.7 });

  setBodyFont(pdf, 7);
  setColor(pdf, [220, 230, 220]);
  trackedText(
    pdf,
    new Date(r.generated_at ?? Date.now())
      .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      .toUpperCase(),
    PW - M, 22, { align: "right", charSpace: 0.45 },
  );

  setDisplayFont(pdf, 8);
  setColor(pdf, LIME);
  trackedText(pdf, "PROPERTY INTELLIGENCE REPORT", M, 104, { charSpace: 0.6 });

  setDisplayFont(pdf, 34);
  setColor(pdf, WHITE);
  const addr = r.property_match.standardized_address || "Property Report";
  const addrLines = (pdf.splitTextToSize(addr, CW) as string[]).slice(0, 3);
  addrLines.forEach((ln, i) => pdf.text(ln, M, 130 + i * 14));

  setFill(pdf, ACCENT);
  pdf.rect(M, 130 + addrLines.length * 14 + 4, 30, 1.2, "F");

  setBodyFont(pdf, 10);
  setColor(pdf, [216, 230, 216]);
  pdf.text(
    "Ownership, occupancy, property characteristics and product fit —",
    M, 130 + addrLines.length * 14 + 18,
  );
  pdf.text("assembled from public records and scored for confidence.", M, 130 + addrLines.length * 14 + 25);

  const ry = 224;
  hairline(pdf, M, ry, PW - M, ry, ACCENT, 0.5);
  setDisplayFont(pdf, 7);
  setColor(pdf, ACCENT);
  trackedText(pdf, "LIKELY OWNER", M, ry + 7, { charSpace: 0.55 });

  setDisplayFont(pdf, 20);
  setColor(pdf, WHITE);
  pdf.text(dash(r.identity.likely_owner_name ?? r.ownership.owner_name), M, ry + 21);

  setBodyFont(pdf, 8.5);
  setColor(pdf, [198, 214, 198]);
  pdf.text(
    `Overall confidence: ${Math.round(r.overall_confidence.score)} / 100 · ${r.overall_confidence.label}`,
    M, ry + 29,
  );
  if (r.is_demo) {
    setBodyFont(pdf, 8.5, "bold");
    setColor(pdf, LIME);
    pdf.text("DEMO DATA — not a live records match", M, ry + 36);
  }

  setBodyFont(pdf, 7);
  setColor(pdf, [180, 200, 180]);
  trackedText(pdf, "DABELLA.US", M, PH - 14, { charSpace: 0.6 });
  trackedText(pdf, "HOME IMPROVEMENT, EXPERTLY DONE", PW - M, PH - 14, {
    align: "right", charSpace: 0.35,
  });
}

// ─── Footers ──────────────────────────────────────────────────
function drawFooters(pdf: jsPDF, address: string) {
  const total = pdf.getNumberOfPages();
  for (let i = 2; i <= total; i++) {
    pdf.setPage(i);
    reportFooter(pdf, i, total, "DaBella · Property Intelligence", address);
  }
}

// ─── Main ─────────────────────────────────────────────────────
export async function buildPropertyIntelPdf(
  r: PropertyIntelReport,
): Promise<{ blob: Blob; doc: jsPDF }> {
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4", compress: true });
  await registerPdfFonts(pdf);

  drawCover(pdf, r);

  const ctx: Ctx = { y: 0 };

  // ── Page 2: Match, ownership, sale, identity
  newPage(pdf, ctx, "Section 1", "Property & Ownership",
    "Matched parcel, record owner, latest transfer and who most likely lives here.");

  blockTitle(pdf, ctx, "Property match");
  kvCard(pdf, ctx, [
    ["Address", dash(r.property_match.standardized_address)],
    ["Parcel / APN", dash(r.property_match.parcel_number)],
    ["City", dash(r.property_match.city)],
    ["State / ZIP", `${dash(r.property_match.state)} ${r.property_match.postal_code ?? ""}`.trim()],
    ["Property type", title(r.property_match.property_type)],
    ["Data sources", r.property_match.data_sources.join(", ") || "—"],
  ]);

  blockTitle(pdf, ctx, "Ownership of record");
  kvCard(pdf, ctx, [
    ["Owner name", dash(r.ownership.owner_name)],
    ["Owner type", title(r.ownership.owner_type)],
    ["Homeowners on record", r.ownership.owner_count ? String(r.ownership.owner_count) : "—"],
    ["Recorded transfers", r.ownership.owner_history?.length ? String(r.ownership.owner_history.length) : "—"],
    ["Tax mailing name", dash(r.ownership.tax_mailing_name)],
    ["Mail matches property", r.ownership.tax_mailing_matches_property ? "Yes" : "No"],
    ["Tax mailing address", dash(r.ownership.tax_mailing_address)],
    ["Ownership since", date(r.ownership.ownership_start_date)],
    ["Document type", dash(r.ownership.document_type)],
    ["Recording #", dash(r.ownership.recording_number)],
  ]);

  ensure(pdf, ctx, kvNeed(6), "Section 1", "Property & Ownership");
  blockTitle(pdf, ctx, "Most recent sale");
  kvCard(pdf, ctx, [
    ["Sale date", date(r.most_recent_sale.sale_date)],
    ["Sale price", money(r.most_recent_sale.sale_price)],
    ["Buyer", dash(r.most_recent_sale.buyer_name)],
    ["Seller", dash(r.most_recent_sale.seller_name)],
    ["Document type", dash(r.most_recent_sale.document_type)],
    ["Recording #", dash(r.most_recent_sale.recording_number)],
  ]);

  ensure(pdf, ctx, kvNeed(4), "Section 1", "Property & Ownership");
  blockTitle(pdf, ctx, "Identity assessment");
  kvCard(pdf, ctx, [
    ["Likely owner", dash(r.identity.likely_owner_name)],
    ["Likely occupant", dash(r.identity.likely_occupant_name)],
    ["Occupancy", title(r.identity.owner_occupancy_status)],
    ["Assessment confidence", `${Math.round(r.identity.confidence.score)} · ${r.identity.confidence.label}`],
  ]);

  // ── Page 3: Property characteristics
  newPage(pdf, ctx, "Section 2", "Property Characteristics",
    "Physical profile, valuation and exposure signals that drive product fit.");

  const i = r.info;
  blockTitle(pdf, ctx, "Structure");
  kvCard(pdf, ctx, [
    ["Year built", i.year_built ? String(i.year_built) : "—"],
    ["Square feet", num(i.square_feet, " sq ft")],
    ["Lot size", num(i.lot_size, " sq ft")],
    ["Stories", num(i.stories)],
    ["Bedrooms", num(i.bedrooms)],
    ["Bathrooms", num(i.bathrooms)],
  ]);

  blockTitle(pdf, ctx, "Value & taxes");
  kvCard(pdf, ctx, [
    ["Assessed value", money(i.assessed_value)],
    ["Estimated market value", money(i.estimated_market_value)],
  ]);

  blockTitle(pdf, ctx, "Envelope & systems");
  kvCard(pdf, ctx, [
    ["Roof material", title(i.roof_material)],
    ["Estimated roof age", i.estimated_roof_age === null
      ? "—"
      : `${i.estimated_roof_age} yrs${i.is_roof_age_estimated ? " (est.)" : ""}`],
    ["Exterior material", title(i.exterior_material)],
    ["Solar present", i.solar_present === null ? "—" : i.solar_present ? "Yes" : "No"],
    ["Storm exposure", title(i.storm_exposure)],
    ["Heat exposure", title(i.heat_exposure)],
  ]);

  ensure(pdf, ctx, 34, "Section 2", "Property Characteristics");
  blockTitle(pdf, ctx, "Permits on record");
  if (i.permits.length) {
    bullets(pdf, ctx, i.permits.map((p) =>
      `${date(p.date)} — ${p.type}${p.description ? `: ${p.description}` : ""}`));
  } else {
    paragraph(pdf, ctx, "No permits found in available records.");
  }

  ensure(pdf, ctx, kvNeed(4), "Section 2", "Property Characteristics");
  blockTitle(pdf, ctx, "Flags");
  kvCard(pdf, ctx, [
    ["Existing customer", i.existing_customer ? "Yes" : "No"],
    ["Previous DaBella interaction", i.previous_dabella_interaction ? "Yes" : "No"],
    ["Do Not Knock", i.do_not_knock ? "YES — DO NOT CONTACT" : "No"],
    ["Condition notes", dash(i.visible_condition_notes)],
  ]);

  // ── Page 4: Opportunity + door brief
  newPage(pdf, ctx, "Section 3", "Opportunity & Approach",
    "Recommended product focus and how to open the conversation at the door.");

  const o = r.opportunity;
  blockTitle(pdf, ctx, "Recommended focus");
  kvCard(pdf, ctx, [
    ["Primary product", title(o.primary_product)],
    ["Secondary product", title(o.secondary_product)],
    ["Opportunity score", `${Math.round(o.opportunity_score)} / 100`],
    ["Recommendation confidence", `${Math.round(o.recommendation_confidence.score)} · ${o.recommendation_confidence.label}`],
  ]);

  blockTitle(pdf, ctx, "Why this product");
  bullets(pdf, ctx, o.reasons);

  ensure(pdf, ctx, 40, "Section 3", "Opportunity & Approach");
  blockTitle(pdf, ctx, "Inspection focus");
  bullets(pdf, ctx, o.suggested_inspection_focus, ACCENT);

  if (o.missing_info.length) {
    ensure(pdf, ctx, 40, "Section 3", "Opportunity & Approach");
    blockTitle(pdf, ctx, "Missing information");
    bullets(pdf, ctx, o.missing_info, SLATE);
  }

  ensure(pdf, ctx, kvNeed(2) + 24, "Section 3", "Opportunity & Approach");
  blockTitle(pdf, ctx, "Pre-door brief");
  kvCard(pdf, ctx, [
    ["Name to use", dash(r.brief.headline_name)],
    ["Use name at door", r.brief.use_name_at_door ? "Yes" : "No — stay generic"],
  ]);

  ensure(pdf, ctx, 30, "Section 3", "Opportunity & Approach");
  rounded(pdf, M, ctx.y, CW, 6, 2, CREAM, MIST);
  eyebrow(pdf, "Suggested opener", M + 5, ctx.y + 4, LIME_DEEP, 6.8);
  ctx.y += 11;
  paragraph(pdf, ctx, `“${r.brief.suggested_opener}”`, 9.6);

  if (r.brief.reasons.length) {
    ensure(pdf, ctx, 35, "Section 3", "Opportunity & Approach");
    bullets(pdf, ctx, r.brief.reasons, SLATE);
  }

  // ── Page 5: Qualification & door strategy
  const q = buildQualification(r);
  newPage(pdf, ctx, "Section 4", "Qualification & Door Strategy",
    "Scored fit, ability signals, timing and the objections to expect at this door.");

  blockTitle(pdf, ctx, "Qualification scorecard");
  kvCard(pdf, ctx, [
    ["Tier", `Tier ${q.tier} — ${Math.round(q.score)} / 100`],
    ["Best knock window", q.best_knock_window],
    ...q.pillars.map((p) => [p.label, `${p.score} — ${p.detail}`] as [string, string]),
  ]);
  paragraph(pdf, ctx, q.tier_note);

  ensure(pdf, ctx, kvNeed(6), "Section 4", "Qualification & Door Strategy");
  blockTitle(pdf, ctx, "Equity & ability picture");
  kvCard(pdf, ctx, [
    ["Estimated value", money(q.equity.current_value)],
    ["Value basis", q.equity.value_basis],
    ["Purchase price", money(q.equity.purchase_price)],
    ["Purchase year", q.equity.purchase_year ? String(q.equity.purchase_year) : "—"],
    ["Tenure", q.equity.tenure_years !== null ? `${Math.round(q.equity.tenure_years)} yrs` : "—"],
    ["Estimated equity", q.equity.estimated_equity !== null
      ? `${money(q.equity.estimated_equity)}${q.equity.equity_pct !== null ? ` (~${q.equity.equity_pct}%)` : ""}`
      : "—"],
  ]);

  ensure(pdf, ctx, 45, "Section 4", "Qualification & Door Strategy");
  blockTitle(pdf, ctx, "System lifecycle clock");
  bullets(pdf, ctx, q.lifecycle.map((l) =>
    `${l.system}: ${l.age ?? "?"} of ${l.expected_life} yrs — ${l.status === "overdue" ? "past rated life"
      : l.status === "window" ? "in replacement window" : l.status === "watch" ? "watch" : l.status === "healthy" ? "healthy" : "unknown"}`), ACCENT);

  ensure(pdf, ctx, kvNeed(6), "Section 4", "Qualification & Door Strategy");
  blockTitle(pdf, ctx, `Investment runway — ${q.investment.product}`);
  kvCard(pdf, ctx, [
    ["Ballpark project range", `${money(q.investment.low)} – ${money(q.investment.high)}`],
    ["Range basis", q.investment.basis],
    ...q.investment.rows.map((row) =>
      [`${row.term_months / 12} yr (${row.term_months} mo)`, `${money(row.low)} – ${money(row.high)} / mo`] as [string, string]),
  ]);
  paragraph(pdf, ctx,
    `Planning ballpark only, using the ${q.investment.rate_label}. Final scope, pricing and approved terms come from the bid sheet and the lender. Not a credit decision or proof of financing eligibility.`,
    7.8);

  if (q.urgency_hooks.length) {
    ensure(pdf, ctx, 40, "Section 4", "Qualification & Door Strategy");
    blockTitle(pdf, ctx, "Urgency hooks");
    bullets(pdf, ctx, q.urgency_hooks);
  }

  ensure(pdf, ctx, 60, "Section 4", "Qualification & Door Strategy");
  blockTitle(pdf, ctx, "Door approach — 90 second track");
  bullets(pdf, ctx, q.approach.steps.map((st) => `${st.label} (${st.seconds}): ${st.script}`), ACCENT);
  paragraph(pdf, ctx, `Callback text: ${q.approach.callback_text}`);
  paragraph(pdf, ctx, `Voicemail: ${q.approach.voicemail}`);

  ensure(pdf, ctx, 40, "Section 4", "Qualification & Door Strategy");
  blockTitle(pdf, ctx, "Decision-maker map");
  bullets(pdf, ctx, q.decision_makers.map((d) =>
    `${d.required ? "[Required] " : "[Context] "}${d.label} — ${d.note}`), SLATE);

  ensure(pdf, ctx, 50, "Section 4", "Qualification & Door Strategy");
  blockTitle(pdf, ctx, "Objections to expect");
  bullets(pdf, ctx, q.objections.map((ob) => `“${ob.objection}” → ${ob.rebuttal}`), LIME_DEEP);

  ensure(pdf, ctx, 45, "Section 4", "Qualification & Door Strategy");
  blockTitle(pdf, ctx, "Discovery questions");
  bullets(pdf, ctx, q.discovery, ACCENT);

  if (q.red_flags.length) {
    ensure(pdf, ctx, 40, "Section 4", "Qualification & Door Strategy");
    blockTitle(pdf, ctx, "Before you knock");
    bullets(pdf, ctx, q.red_flags, NEGATIVE);
  }

  // ── Page 6: Derived metrics & triangulation
  const im = buildIntelMetrics(r, q);
  newPage(pdf, ctx, "Section 5", "Derived Metrics & Triangulation",
    "Independent estimates reconciled, payment comfort, expected value and source corroboration.");

  blockTitle(pdf, ctx, "Route priority");
  kvCard(pdf, ctx, [
    ["Blended route score", `${im.route_priority} / 100`],
    ["Read", im.route_note],
    ["Urgency index", `${im.timing.urgency_index} / 100`],
    ["Payment comfort index", `${im.affordability.index} / 100`],
    ["Data corroboration", `${im.data.corroboration_pct}% (${im.data.completeness_pct}% complete)`],
  ]);

  ensure(pdf, ctx, kvNeed(6), "Section 5", "Derived Metrics & Triangulation");
  blockTitle(pdf, ctx, "Value triangulation");
  kvCard(pdf, ctx, [
    ["Consensus value", money(im.valuation.consensus)],
    ["Estimate range", im.valuation.low !== null && im.valuation.high !== null
      ? `${money(im.valuation.low)} – ${money(im.valuation.high)}` : "—"],
    ["Source agreement", `${im.valuation.agreement}${im.valuation.spread_pct !== null ? ` · ${im.valuation.spread_pct}% spread` : ""}`],
    ["Price per sq ft", money(im.valuation.price_per_sqft)],
    ["Appreciation since purchase", im.valuation.cagr_pct !== null ? `${im.valuation.cagr_pct}% / yr` : "—"],
    ["Tax burden", im.valuation.tax_burden_pct !== null ? `${im.valuation.tax_burden_pct}% of value` : "—"],
  ]);
  if (im.valuation.estimates.length) {
    bullets(pdf, ctx, im.valuation.estimates.map((e) => `${e.label}: ${money(e.value)} — ${e.note}`), ACCENT);
  }
  paragraph(pdf, ctx, im.valuation.agreement_note);

  ensure(pdf, ctx, kvNeed(5), "Section 5", "Derived Metrics & Triangulation");
  blockTitle(pdf, ctx, "Payment comfort");
  kvCard(pdf, ctx, [
    ["Read", im.affordability.headline],
    ["Est. monthly (mid, 120 mo)", money(im.affordability.project_payment_mid)],
    ["Implied household income", money(im.affordability.implied_household_income)],
    ["Payment / income", im.affordability.payment_to_income_pct !== null ? `${im.affordability.payment_to_income_pct}%` : "—"],
    ["Project / home value", im.affordability.payment_to_value_pct !== null ? `${im.affordability.payment_to_value_pct}%` : "—"],
  ]);
  bullets(pdf, ctx, im.affordability.notes, SLATE);

  ensure(pdf, ctx, kvNeed(5), "Section 5", "Derived Metrics & Triangulation");
  blockTitle(pdf, ctx, "Expected value of this door");
  kvCard(pdf, ctx, [
    ["Expected commission", money(im.economics.expected_commission)],
    ["If it closes", `${money(im.economics.commission_low)} – ${money(im.economics.commission_high)}`],
    ["Modeled contract", money(im.economics.contract_mid)],
    ["Sit → close", `${Math.round(im.economics.sit_probability * 100)}% → ${Math.round(im.economics.close_probability * 100)}%`],
    ["Contacts per deal", im.economics.knocks_to_one_deal !== null ? String(im.economics.knocks_to_one_deal) : "—"],
  ]);
  paragraph(pdf, ctx, `${im.economics.verdict} Modeled from tier conversion history and front-end commission ranges — not a payout quote.`, 7.8);

  ensure(pdf, ctx, 45, "Section 5", "Derived Metrics & Triangulation");
  blockTitle(pdf, ctx, "Timing signals");
  paragraph(pdf, ctx, im.timing.season_note);
  if (im.timing.signals.length) {
    bullets(pdf, ctx, im.timing.signals.map((s) => `${s.label} (${s.weight}): ${s.detail}`), LIME_DEEP);
  }

  if (im.data.verify_at_door.length) {
    ensure(pdf, ctx, 45, "Section 5", "Derived Metrics & Triangulation");
    blockTitle(pdf, ctx, "Verify at the door");
    bullets(pdf, ctx, im.data.verify_at_door, NEGATIVE);
  }

  // ── Page 6: Confidence & sourcing
  newPage(pdf, ctx, "Section 6", "Confidence & Sourcing",
    "How much to trust each part of this report, and where the data came from.");


  confidenceRow(pdf, ctx, "Overall report", r.overall_confidence);
  confidenceRow(pdf, ctx, "Property match", r.property_match.confidence);
  confidenceRow(pdf, ctx, "Ownership record", r.ownership.confidence);
  confidenceRow(pdf, ctx, "Most recent sale", r.most_recent_sale.confidence);
  confidenceRow(pdf, ctx, "Identity assessment", r.identity.confidence);
  confidenceRow(pdf, ctx, "Product recommendation", o.recommendation_confidence);
  ctx.y += 4;

  ensure(pdf, ctx, 45, "Section 6", "Confidence & Sourcing");
  blockTitle(pdf, ctx, "Why this confidence");
  bullets(pdf, ctx, r.overall_confidence.reasons);

  if (r.overall_confidence.conflicts.length) {
    ensure(pdf, ctx, 40, "Section 6", "Confidence & Sourcing");
    blockTitle(pdf, ctx, "Conflicts detected");
    bullets(pdf, ctx, r.overall_confidence.conflicts, NEGATIVE);
  }

  ensure(pdf, ctx, 45, "Section 6", "Confidence & Sourcing");
  blockTitle(pdf, ctx, "Sourcing");
  kvCard(pdf, ctx, [
    ["Ownership source", dash(r.ownership.source)],
    ["Ownership record date", date(r.ownership.source_record_date)],
    ["Sale source", dash(r.most_recent_sale.source)],
    ["Records last updated", date(r.property_match.last_updated)],
    ["Report generated", date(r.generated_at)],
    ["Mode", r.is_demo ? "Demo fixture data" : "Live records"],
  ]);

  ensure(pdf, ctx, 20, "Section 6", "Confidence & Sourcing");
  setBodyFont(pdf, 7.6);
  setColor(pdf, SLATE);
  const disc = pdf.splitTextToSize(
    "This report compiles information from third-party public-record and data-provider sources. Details may be incomplete, delayed, or inaccurate. Verify ownership and occupancy at the door before relying on any name shown here. Respect all Do Not Knock and suppression flags.",
    CW - 12,
  ) as string[];
  disc.forEach((ln) => { pdf.text(ln, M + 6, ctx.y); ctx.y += 4.2; });

  drawFooters(pdf, r.property_match.standardized_address || "");

  return { blob: pdf.output("blob"), doc: pdf };
}

export function propertyIntelPdfFilename(r: PropertyIntelReport) {
  const slug = (r.property_match.standardized_address || "property")
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, 60);
  return `property-intel-${slug}.pdf`;
}
