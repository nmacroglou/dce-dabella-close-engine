import { Users, ClipboardList, Search, BarChart3, DollarSign, Award, HandshakeIcon, Target, Zap, Heart } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface ReferenceSection {
  title: string;
  content: string[];
  subSections?: { heading: string; items: string[] }[];
}

export interface SellingStep {
  id: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  script: string;
  /** Additional detailed scripts for specific scenarios */
  detailedScripts?: { label: string; text: string }[];
  checklist: string[];
  tips: string[];
  linkTab?: string;
  /** Reference material (POI guides, payment factors, etc.) */
  references?: ReferenceSection[];
}

export const SELLING_STEPS: SellingStep[] = [
  {
    id: 1,
    title: "Arrival / Build Rapport",
    subtitle: "First impressions & connection",
    icon: Users,
    script: `"Hi [Name], I'm [Your Name] with DaBella — thanks for having me out today! Beautiful home you've got here. How long have you been in the neighborhood?"`,
    checklist: [
      "Arrive 5 minutes early",
      "Professional appearance — branded polo, clean shoes",
      "Compliment something specific about the home",
      "Find common ground (family, pets, neighborhood)",
      "Introduce yourself and your role clearly",
    ],
    tips: [
      "Mirror the homeowner's energy level",
      "Get both decision-makers engaged from the start",
      "Avoid jumping into business too quickly — earn trust first",
    ],
  },
  {
    id: 2,
    title: "Agenda",
    subtitle: "Confirm the appointment flow",
    icon: ClipboardList,
    script: `"Did the person on the phone tell you what to expect from me when I came out this evening?"`,
    detailedScripts: [
      {
        label: "Customer says 'No'",
        text: `"Well, we come to each appointment with a pretty specific agenda. First, I will have you give me a tour of your roof so I can measure and inspect. Then we can sit down at the table and discuss the results of your inspection.\n\nNext I'll take a couple of minutes and tell you about our company. Let me share this with you. The most important decision you will make regarding a project like yours is not so much the price you pay or even the product you choose, it's the company you decide to have do the work for you. So even though this only takes a few minutes it is the most important part.\n\nThen is the fun part, we'll go product shopping. We have access to a number of different styles and colors to best fit your wants and needs.\n\nAnd last before I leave, we can sit down to write up your contracts, put you on the installation schedule and, if needed, arrange your financing. FAIR ENOUGH?"`,
      },
      {
        label: "Customer: 'I'm not buying anything tonight'",
        text: `"I understand, I get a bit ahead of myself! Let me re-say correctly, what I meant to say the first time. Often times when I meet with people, they think they will have to search for a bank or find an installer or even go to the city for permits. What I meant to say was, when you DO decide to move forward, I have everything we need, including financing.\n\nI also like to be realistic. I know that one of three things is going to happen in all of my appointments. Either you find a product you like, the timing is right, the price is right and you say yes, and I love to hear that! OR the timing is wrong or whatever else is wrong and you say no. That's fine too, it's part of the job. It's the third response I really try to avoid… 'Call you next week, next month, or next year.' It's not that I won't come back if you asked, but it's been my experience that when someone says that, it is just a nice way to say no.\n\nSo, I will make a deal with you! If you see something you like and I can make it affordable for you say YES, and if not say NO I will take no as graciously as a yes. FAIR ENOUGH?"`,
      },
    ],
    checklist: [
      "Confirm both decision-makers are present",
      "Set time expectations (60–90 min)",
      "Outline the inspection → results → options flow",
      "Get verbal agreement on the agenda",
      "Handle 'not buying tonight' objection with script",
    ],
    tips: [
      "If a decision-maker is missing, reschedule or call them in",
      "Setting the agenda controls the appointment pace",
      "Always end agenda sections with 'FAIR ENOUGH?' for agreement",
    ],
  },
  {
    id: 3,
    title: "Inspection",
    subtitle: "Measure & inspect the project area",
    icon: Search,
    script: `"I'm going to head outside and do a thorough inspection. I'll take photos and measurements so we can go over everything together. This usually takes about 20–30 minutes."`,
    checklist: [
      "Take photos of all relevant areas",
      "Measure accurately and document",
      "Note existing damage or wear",
      "Check for code compliance issues",
      "Complete the window/roof inspection checklist",
    ],
    tips: [
      "Bring the homeowner outside to see key problem areas",
      "Take more photos than you think you need",
      "Use the Calculator tab to enter measurements live",
    ],
    linkTab: "calculator",
  },
  {
    id: 4,
    title: "Inspection Results",
    subtitle: "Present findings — the compelling event",
    icon: BarChart3,
    script: `"So here's what I found — let me walk you through the photos and measurements. I want you to see exactly what I saw so we're on the same page about your home's condition."`,
    checklist: [
      "Show inspection photos to both homeowners",
      "Explain findings in simple, non-technical terms",
      "Identify the compelling event (why now matters)",
      "Create urgency without being pushy",
      "Connect findings to their concerns",
    ],
    tips: [
      "Let the damage speak for itself",
      "Ask: 'Were you aware of this?' to gauge concern",
      "Use the Presentation tab to show results professionally",
    ],
    linkTab: "presentation",
  },
  {
    id: 5,
    title: "Cost vs. Value",
    subtitle: "Present price with context",
    icon: DollarSign,
    script: `"Now let's talk about what this means financially. I want to show you not just the cost, but the value — what it costs to fix it now versus what it costs to wait."`,
    checklist: [
      "Show the 10-year cost comparison",
      "Present ROI / home value impact",
      "Frame as investment, not expense",
      "Use the T-Close board",
      "Compare cost of doing nothing",
    ],
    tips: [
      "Never apologize for price",
      "Always show cost of waiting first, then your price",
      "Use the Financial Impact panel in Presentation",
    ],
    linkTab: "presentation",
  },
  {
    id: 6,
    title: "Product Demo",
    subtitle: "Differentiators & GAF advantages",
    icon: Award,
    script: `"Let me show you what makes our system different. This isn't just about putting new materials on your home — it's about the system, the warranty, and the people behind it."`,
    checklist: [
      "Present GAF system advantages",
      "Explain Golden Pledge warranty",
      "Highlight Master Elite contractor status",
      "Show Factory-Trained crew certification",
      "Demo physical samples if available",
      "Explain SolarMAX HD shingles or product features",
    ],
    tips: [
      "Focus on what matters to THEM, not every feature",
      "Use the 'What's Included' cards in the option presentation",
      "Let them touch and feel samples",
    ],
  },
  {
    id: 7,
    title: "PTA — Ask for the Business",
    subtitle: "Monthly payment range & comfortable down payment",
    icon: HandshakeIcon,
    script: `"Based on everything we've gone through, I'd love to earn your business today. Let me ask — if the monthly payment felt comfortable, is this something you'd want to take care of now rather than later?"`,
    checklist: [
      "Ask about comfortable monthly payment range",
      "Determine preferred down payment amount",
      "Present the 3 options (A, B, C)",
      "Ask which option they'd eliminate first",
      "Gauge buying temperature",
    ],
    tips: [
      "The PTA is about permission, not pressure",
      "Use the option elimination technique: 'Which would you remove?'",
      "Never skip this step — it transitions to the close",
    ],
  },
  {
    id: 8,
    title: "Close Sequence",
    subtitle: "Earning the sale",
    icon: Target,
    script: `"So based on everything — the condition of your home, the value this adds, and the payment fitting your budget — the only question left is: would you like to handle the initial deposit with a check or card?"`,
    checklist: [
      "Use the closing stack in order",
      "Handle objections with empathy",
      "Ask for the business directly",
      "If 'no,' isolate the true objection",
      "Re-close after addressing the concern",
    ],
    tips: [
      "Stay calm and confident during the close",
      "Silence is your friend — ask and wait",
      "Use the Closing Stack and Objections tabs",
    ],
    linkTab: "closing",
  },
  {
    id: 9,
    title: "Efficiency",
    subtitle: "1-year deferral & manager on-demand call",
    icon: Zap,
    script: `"I want to check one more thing for you. We sometimes have efficiency pricing available for homeowners who are ready to move forward when everything makes sense. Let me make a quick call to my manager."`,
    checklist: [
      "Offer efficiency / standby pricing if applicable",
      "Present 1-year deferral option",
      "Make the manager on-demand call",
      "Get manager approval for final pricing",
      "Present the final, best offer",
    ],
    tips: [
      "This is your ace — don't play it too early",
      "The manager call adds authority and urgency",
      "Frame savings as earned, not discounted",
    ],
  },
  {
    id: 10,
    title: "Welcome to the Family",
    subtitle: "Signing contracts — proof of income & 2 forms of ID",
    icon: Heart,
    script: `"Congratulations! Welcome to the DaBella family. Let's get the paperwork taken care of so we can get your project scheduled. I'll need a couple of things from you."`,
    checklist: [
      "Collect signed contract",
      "Collect proof of income (POI)",
      "Collect 2 forms of ID",
      "Process initial deposit",
      "ALWAYS get the co-app",
      "Include customer's last name in subject line of every email to Finance",
      "Set expectations for next steps",
      "Schedule installation timeline",
      "Get all required paperwork in right away",
      "Provide your contact info for questions",
    ],
    tips: [
      "Celebrate the decision — reinforce they made a great choice",
      "POI is required on ALL deals",
      "Ask how much they make monthly, then ask about bonuses, OT, commission",
      "Need $2,000 in disposable income",
      "DTI = monthly recurring debts / monthly gross income",
      "Ask about ALL household income",
      "If self-employed: get business name, type, work # — prepare for 1040 & Schedule C",
      "IDs are required!",
      "NEVER disclose specific credit info from Finance — we do not run credit",
      "If customer cancels (cash or financed) — let Finance know right away",
      "Deals with everything Finance needs get processed FIRST",
      "Respond to emails quickly and/or acknowledge you are working on it",
    ],
    references: [
      {
        title: "POI — Proof of Income Guide",
        content: ["Below is what the bank will accept to prove different types of income."],
        subSections: [
          {
            heading: "Full Time Employee",
            items: [
              "Paystub within the last 30–45 days showing: date of check, pay period, gross YTD income, employer's name, employee's name",
              "W-2 from previous year (in addition to recent paystub) — used when employee has significant OT and/or bonus income",
            ],
          },
          {
            heading: "Part Time Employee",
            items: [
              "Same as full time EXCEPT a W-2 from the previous year is required as well",
            ],
          },
          {
            heading: "Self Employed / Business Owner",
            items: [
              "Two years of tax returns (most recent): 1040, Schedule C, and Schedule E (if applicable)",
              "Paystub within the last 30–45 days — if they have one",
            ],
          },
          {
            heading: "Retirement / Disability / Veteran's Benefits / Pension / Annuity",
            items: [
              "Recent bank statement(s) showing: date of statement, period covered, customer's name, ALL pages — not just deposits",
              "Award letters (usually sent at the beginning of the year)",
              "1099 Tax Documents (sent at the end of the year)",
            ],
          },
          {
            heading: "Alimony / Child Support",
            items: [
              "Court ordered documents / divorce decree showing amount and duration",
            ],
          },
          {
            heading: "Rental Income",
            items: [
              "Two years of taxes to prove rental income: 1040 and Schedule E",
              "If not claimed on taxes, must provide a formal lease/rental agreement — no guarantee this will clear the income stipulation",
            ],
          },
          {
            heading: "401K / IRA / Investments",
            items: [
              "They DO NOT have to touch this income — just prove it exists",
              "Provide a recent statement showing current value",
              "The bank will take a percentage of the amount divided over the term of the loan and consider it an asset",
            ],
          },
        ],
      },
    ],
  },
];
