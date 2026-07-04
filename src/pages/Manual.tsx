import { Link } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import {
  BookOpen, Calculator, Presentation, ShieldAlert, Layers, Brain, DollarSign,
  ClipboardCheck, Briefcase, GitBranch, LayoutDashboard, Wallet, Sun, Trophy,
  Wrench, Sparkles, Target, Coffee, Droplets, Moon, Phone, Mail, FileText,
  Users, ShieldCheck, Zap,
} from "lucide-react";

type Section = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  blurb: string;
  body: React.ReactNode;
};

const SECTIONS: Section[] = [
  {
    id: "full-walkthrough",
    icon: GitBranch,
    title: "Full walkthrough: deal → presentation",
    blurb: "Every step, in order, from a brand-new lead to a shared proposal.",
    body: (
      <ol className="list-decimal pl-5 space-y-3">
        <li>
          <b>Create the deal.</b> Go to <Link to="/deals" className="text-primary underline">Deals</Link> → <b>New Deal</b>.
          Enter homeowner name(s), address, <b>email</b>, and <b>phone</b> (both power Follow-Ups and the Share dialog).
          Pick the product (Roof / Windows / Bath / Solar) and lead source.
        </li>
        <li>
          <b>Set it active.</b> On the deal card, tap <b>Set Active</b>. The gold pill at the top of every page now shows that homeowner —
          everything you do next writes back to this deal.
        </li>
        <li>
          <b>Run the inspection (optional but recommended).</b> Open the deal → <b>Inspection</b> tab (or the Close Engine → Inspection).
          Pick the report type, upload photos from the iPad camera, and let AI tag each shot with defects, severity, and captions.
          Edit the narrative blocks (Executive Summary, Scope, Opinion, Next Steps), then <b>Generate PDF</b> and share it with the homeowner.
        </li>
        <li>
          <b>Prep with the Playbook.</b> Open the <Link to="/" className="text-primary underline">Close Engine</Link> → <b>Playbook</b>.
          Run the pre-appointment checklist, review the CVV battle card for the product, and confirm the <b>3 Pillars</b> (Sleep · Eat · Water).
        </li>
        <li>
          <b>Price the job in the Calculator.</b> Engine → <b>Calculator</b>. Enter the credit score
          (auto-picks the payment factor: ≥720 → .0108, 640–719 → .012, &lt;640 → .015),
          any promos (Efficiency, Standby, Deferred 6/12), and the price for Options A, B, and C.
          Rename options if needed — the cards will remember your labels for this deal.
        </li>
        <li>
          <b>Customize "What's Included."</b> Engine → <b>Presentation</b> → the pencil icon on each option's features list.
          You can edit features per option (A/B/C) or share one list across all three.
        </li>
        <li>
          <b>Walk the presentation.</b> Presentation tab flows: <b>Options reveal</b> → <b>Financial Impact</b> (move-forward vs. do-nothing,
          inflation penalty, locked-in savings) → <b>Scope of Work</b> → <b>Welcome / T-Close</b>. Use the footer nav to move step-by-step.
        </li>
        <li>
          <b>Handle objections live.</b> Engine → <b>Objections</b>. Search by keyword, tap a rebuttal — it's logged against this deal
          for the Dashboard heatmap. Flip to <b>Coach Mode</b> for live AI tips while you speak.
        </li>
        <li>
          <b>Share the proposal.</b> Top of the Presentation tab → <b>Share</b>. Two modes:
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li><b>Share Proposal</b> — after the homeowner picks an option, sends that single option's full PDF (cover, numbers, scope, welcome).</li>
            <li><b>Share All 3 Options</b> — no option picked yet: sends the 3-option overview, a side-by-side "What's Included" page, plus a full detail page for each option.</li>
          </ul>
          Deliver via email (pre-filled from the deal), SMS, download, or signed link.
        </li>
        <li>
          <b>Close it out.</b> If they say yes, tap the selected option in the Presentation → confirm <b>Sold For</b>.
          Engine → <b>Post-Close</b>: capture next steps, upload signed docs and photos, and follow-ups are auto-scheduled.
          The deal moves to <b>Won</b> in the <Link to="/pipeline" className="text-primary underline">Pipeline</Link>.
        </li>
        <li>
          <b>Track the money.</b> Engine → <b>Performance</b> shows commission for this deal;
          <Link to="/ledger" className="text-primary underline"> Ledger</Link> tracks cash in/out and payment calendar;
          <Link to="/dashboard" className="text-primary underline"> Dashboard</Link> updates your Sit-to-Close, earnings, and objection heatmap.
        </li>
      </ol>
    ),
  },
  {
    id: "overview",
    icon: Sparkles,
    title: "What is the Close Engine?",
    blurb: "Your iPad-first companion for every in-home appointment.",
    body: (
      <>
        <p>
          The DaBella Close Engine is the field rep's all-in-one tool: a price calculator,
          a customer presentation deck, an objection playbook, a commission tracker, and a
          deal pipeline — all glued to one another by the <b>Active Deal</b> at the top of
          the screen.
        </p>
        <p>
          Set an active deal first, then every tab (Calculator, Presentation, Commission,
          Post-Close) reads and writes to that homeowner automatically. No double-entry.
        </p>
      </>
    ),
  },
  {
    id: "first-run",
    icon: Target,
    title: "Your first 5 minutes",
    blurb: "Get from sign-in to a live presentation fast.",
    body: (
      <ol className="list-decimal pl-5 space-y-1.5">
        <li>Sign in on the <Link to="/auth" className="text-primary underline">Auth screen</Link>.</li>
        <li>Open <Link to="/deals" className="text-primary underline">Deals</Link> and create a new deal — homeowner names, address, <b>email + phone</b> (used by Follow-Ups).</li>
        <li>Click <b>Set Active</b> on that deal card. The active-deal banner now shows at the top.</li>
        <li>Head to the <Link to="/" className="text-primary underline">Engine</Link> → <b>Calculator</b>, enter price + financing factor.</li>
        <li>Switch to <b>Presentation</b> and walk the homeowner through Options → Numbers → Scope → Welcome.</li>
      </ol>
    ),
  },
  {
    id: "engine-tabs",
    icon: Wrench,
    title: "The Engine tabs",
    blurb: "Eight tabs, each with a specific job.",
    body: (
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { icon: BookOpen, name: "Playbook", desc: "Pre-appointment checklist, battle cards (incl. the 3 Pillars: Sleep · Eat · Water), payment factors, and reference scripts." },
          { icon: Calculator, name: "Calculator", desc: "Enter price, credit score (auto-picks payment factor: ≥720→.0108, 640–719→.012, <640→.015), and promos. Outputs Options A/B/C." },
          { icon: Presentation, name: "Presentation", desc: "Customer-facing reveal: 3 options → financial impact → scope of work → welcome close. Tap Share Proposal for a branded PDF." },
          { icon: ShieldAlert, name: "Objections", desc: "Searchable library of rebuttals. Logs which objections fired on this deal for the Dashboard heatmap." },
          { icon: Layers, name: "Closing Stack", desc: "Step-by-step T-close + closing sequence with progress tracking." },
          { icon: ClipboardCheck, name: "Post-Close", desc: "After the yes: capture next steps, photos, finance docs, and trigger follow-ups." },
          { icon: DollarSign, name: "Performance", desc: "Commission sheet, monthly overview, and KPI grid for the active deal and your month." },
          { icon: Brain, name: "Coach Mode", desc: "AI live coach — real-time tips while you present. Uses Lovable AI; works offline-tolerant." },
        ].map((t) => (
          <div key={t.name} className="rounded-xl border border-border bg-card/60 p-3">
            <div className="flex items-center gap-2 mb-1">
              <t.icon className="h-4 w-4 text-primary" />
              <p className="font-semibold text-sm">{t.name}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "nav",
    icon: GitBranch,
    title: "Top-nav pages",
    blurb: "Beyond the Engine — the rest of the app.",
    body: (
      <div className="grid sm:grid-cols-2 gap-3">
        {[
          { icon: Briefcase, to: "/deals", name: "Deals", desc: "Every homeowner. Inline edit contact (email/phone), tags, stage. Set active deal here." },
          { icon: GitBranch, to: "/pipeline", name: "Pipeline", desc: "Kanban by stage. Drag deals between Inspecting → Presented → Won/Lost. Includes Follow-Up admin." },
          { icon: LayoutDashboard, to: "/dashboard", name: "Dashboard", desc: "Sit-to-Close rate (cohort-based), earnings, lead flow, objection heatmap, trends." },
          { icon: Wallet, to: "/ledger", name: "Ledger", desc: "Cash in/out, paid commissions, cashflow forecast, payment calendar." },
          { icon: ShieldAlert, to: "/incidents", name: "Incidents", desc: "Log install/service issues with attachments. Feeds dashboard health." },
          { icon: Sun, to: "/energy-lens", name: "Energy Lens", desc: "Utility rate news + savings breakdown for solar conversations." },
          { icon: Trophy, to: "/manage-up", name: "Manage Up", desc: "Manager KPI rubric — what 'great' looks like in numbers." },
          { icon: ShieldCheck, to: "/admin", name: "Admin (admins only)", desc: "Role manager, system-wide metrics." },
        ].map((p) => (
          <Link key={p.to} to={p.to} className="rounded-xl border border-border bg-card/60 p-3 hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-2 mb-1">
              <p.icon className="h-4 w-4 text-primary" />
              <p className="font-semibold text-sm">{p.name}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
          </Link>
        ))}
      </div>
    ),
  },
  {
    id: "active-deal",
    icon: Users,
    title: "The Active Deal pattern",
    blurb: "One deal, everywhere.",
    body: (
      <>
        <p>
          The pill at the top of every page shows your active homeowner. Setting it from the
          Deals page is the single most important habit:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Calculator writes Option A/B/C prices to the deal.</li>
          <li>Presentation persists the homeowner's selected option + sold-for amount.</li>
          <li>Commission Sheet mirrors the sold-for as roof worth.</li>
          <li>Objections fired during this session are tagged to this deal.</li>
          <li>Follow-ups schedule against this deal's email/phone.</li>
        </ul>
      </>
    ),
  },
  {
    id: "follow-ups",
    icon: Mail,
    title: "Follow-Ups & contact",
    blurb: "Email + phone on every deal feeds the cadence.",
    body: (
      <>
        <p>
          Add <b>homeowner email</b> and <b>phone</b> on the deal card or in the new-deal
          dialog. The Follow-Up Composer auto-fills the recipient and the mailto pre-fills
          the To: field — open in Mail/Gmail and send.
        </p>
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Mail className="h-3.5 w-3.5" /> Inline edit anywhere — saves on blur.
          <Phone className="h-3.5 w-3.5 ml-2" /> Phone is stored for future SMS cadence.
        </p>
      </>
    ),
  },
  {
    id: "pillars",
    icon: Zap,
    title: "The 3 Pillars of Power",
    blurb: "Sleep · Eat · Water. Non-negotiable before any appointment.",
    body: (
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { icon: Moon, h: "Sleep", t: "6–8 hours. A tired closer loses tone, presence, and recall on objections." },
          { icon: Coffee, h: "Eat", t: "Don't skip meals. Hunger = irritation = lost rapport mid-presentation." },
          { icon: Droplets, h: "Water", t: "5 × 32oz across the day. Dehydration drops energy and voice." },
        ].map((p) => (
          <div key={p.h} className="rounded-xl border border-primary/30 bg-primary/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <p.icon className="h-4 w-4 text-primary" />
              <p className="font-semibold text-sm">{p.h}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{p.t}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "tips",
    icon: FileText,
    title: "Tips & conventions",
    blurb: "Small things that make the tool feel fast.",
    body: (
      <ul className="list-disc pl-5 space-y-1.5">
        <li><b>Dark mode</b> toggles from the sun/moon icon in the header — most reps run dark on iPad.</li>
        <li><b>Optimistic updates</b>: tag and stage changes feel instant; if they fail you'll see a toast.</li>
        <li><b>Currency</b> always uses the shared formatter — no rounding surprises across tabs.</li>
        <li><b>Close rate</b> on the Dashboard is cohort-based Sit-to-Close, not won/(won+lost).</li>
        <li><b>Share Proposal</b> in the Presentation generates a branded PDF (cover → options → impact → scope → welcome).</li>
        <li><b>Coach Mode</b> needs Lovable AI on; tips stream as you speak.</li>
      </ul>
    ),
  },
];

export default function Manual() {
  return (
    <div className="min-h-screen surface-premium">
      <AppHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <header className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary">
            <BookOpen className="h-3.5 w-3.5" /> Manual
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-extrabold tracking-tight">
            How to use the <span className="gradient-text">Close Engine</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            A field rep's quick reference to every tab, page, and pattern in the app. Start with
            "Your first 5 minutes" if you've never opened it before.
          </p>
        </header>

        {/* TOC */}
        <nav className="rounded-2xl border border-border bg-card/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Jump to</p>
          <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
            {SECTIONS.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="text-sm text-foreground hover:text-primary flex items-center gap-2">
                <s.icon className="h-3.5 w-3.5 text-primary" /> {s.title}
              </a>
            ))}
          </div>
        </nav>

        {SECTIONS.map((s) => (
          <section
            key={s.id}
            id={s.id}
            className="rounded-2xl border border-border bg-card/40 p-5 sm:p-6 space-y-3 scroll-mt-20"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold leading-tight">{s.title}</h2>
                <p className="text-xs text-muted-foreground">{s.blurb}</p>
              </div>
            </div>
            <div className="text-sm text-foreground/90 leading-relaxed space-y-2">
              {s.body}
            </div>
          </section>
        ))}

        <footer className="pt-4 pb-8 text-center text-xs text-muted-foreground">
          DaBella Close Engine · field manual · updated June 2026
        </footer>
      </main>
    </div>
  );
}
