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
      "Ask the 10 Power Questions during rapport",
    ],
    tips: [
      "Mirror the homeowner's energy level",
      "Get both decision-makers engaged from the start",
      "Avoid jumping into business too quickly — earn trust first",
      "After Question 3 or 4 — repeat their words back: 'So what I'm hearing is… the biggest concern is [X]… right?' This alone increases close rate significantly.",
    ],
    references: [
      {
        title: "🔟 The 10 Power Questions",
        content: ["These questions feed directly into Option A/B/C relevance, ROI positioning, energy close strength, objection routing, and T-close framing."],
        subSections: [
          {
            heading: "1. \"What made you decide to have us out today?\"",
            items: [
              "Finds the trigger event",
              "Reveals urgency level",
              "Tells you if they're reactive or proactive",
              "👉 This sets the tone for the entire appointment",
            ],
          },
          {
            heading: "2. \"How long have you been dealing with this?\"",
            items: [
              "Measures pain duration",
              "Longer = more emotional fatigue = easier close",
            ],
          },
          {
            heading: "3. \"What concerns you most about it right now?\"",
            items: [
              "Identifies the true problem — not always leaks",
              "Could be: energy bills, appearance, resale value",
              "👉 You sell to THIS, not the roof",
            ],
          },
          {
            heading: "4. \"What happens if this doesn't get taken care of?\"",
            items: [
              "Creates future pain visualization",
              "Builds urgency without pressure",
              "👉 This is 🔥 for the T-close later",
            ],
          },
          {
            heading: "5. \"Have you had anyone else take a look at this yet?\"",
            items: [
              "Identifies competition",
              "Tells you if they're shopping, comparing, or just exploring",
            ],
          },
          {
            heading: "6. \"What did they tell you?\"",
            items: [
              "Reveals misinformation, price anchoring, objections before they happen",
              "👉 You can pre-handle objections early",
            ],
          },
          {
            heading: "7. \"What are you hoping to get out of this project?\"",
            items: [
              "Defines their win condition",
              "Position: Option A = ideal, Option B = compromise",
            ],
          },
          {
            heading: "8. \"How long do you plan on being in the home?\"",
            items: [
              "Determines ROI relevance, energy close strength, product tier positioning",
              "Short term → cost focus | Long term → value focus",
            ],
          },
          {
            heading: "9. \"If everything made sense today, is this something you'd want to take care of now or are you more in the research phase?\"",
            items: [
              "Identifies timing truth",
              "Soft commitment without pressure",
              "👉 This is a hidden pre-close",
            ],
          },
          {
            heading: "10. \"Is there anything that would stop you from moving forward today besides the investment?\"",
            items: [
              "Isolates objections EARLY",
              "Sets up your final close later",
              "👉 One of the most important questions you'll ask",
            ],
          },
        ],
      },
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
    subtitle: "The Kelley Blue Book for your home",
    icon: DollarSign,
    script: `"Opinions are cheap. Data is powerful. That's why I base every conversation on the Cost vs. Value Report — the nationally recognized benchmark used by real estate investors, appraisers, and networks like HGTV to understand what home improvement projects are actually worth at resale.\n\nThis isn't marketing spin. It's the same authoritative source that financial professionals rely on when evaluating a home's true market position. When I show you the numbers, I'm showing you what the market says — not what a salesperson thinks sounds good."`,
    detailedScripts: [
      {
        label: "Reframe: Investment, not expense",
        text: `"Understanding this report is your power move as a homeowner. It transforms the roofing conversation from 'how much does this cost?' into 'how does this protect and build my wealth?' — which is the only question that really matters."`,
      },
      {
        label: "Core insight script",
        text: `"A roof isn't just an expense — it's one of the core value-protection systems of your home."\n\nMost people mentally file 'new roof' under home expenses — right next to HVAC repairs and plumbing fixes. But the Cost vs. Value data tells a fundamentally different story. Your roof is one of the highest-returning investments you can make in your property.\n\nIt's not just protecting your family from the elements. It's protecting your equity. Your insurance rates. Your ability to sell. Your ability to refinance. In Phoenix's competitive real estate market, a compromised roof is a negotiating liability — a certified, upgraded roof is a negotiating asset."`,
      },
      {
        label: "Metal roofing value script",
        text: `"Metal roofing commands a higher initial investment — but it also delivers a premium end product. The return percentage on metal is lower — but that's only part of the story.\n\nMetal roofs deliver 50+ year lifespans, dramatically lower energy costs in Phoenix's intense heat, superior storm resistance, and a premium aesthetic that attracts higher-end buyers.\n\nThe value equation for metal isn't just resale — it's decades of reduced utility bills, zero replacement cycles, and the peace of mind that comes from owning a roof that essentially never needs to be replaced again.\n\nMetal roofing in Phoenix also reflects solar heat more efficiently — a critical performance advantage in a market where summer cooling costs can be extreme."`,
      },
    ],
    checklist: [
      "Present the Cost vs. Value Report as 'Kelley Blue Book for your home'",
      "Show Phoenix-specific market data",
      "Show asphalt shingle ROI: 77.5% value retained",
      "Show metal roofing ROI: 59.7% value retained (with longevity context)",
      "Compare to kitchen remodel ROI (60–65%) to contextualize",
      "Frame roof as value-protection system, not expense",
      "Use the T-Close board for 10-year comparison",
      "Compare cost of doing nothing",
    ],
    tips: [
      "Never apologize for price — let the data speak",
      "Always show cost of waiting first, then your price",
      "Use the Financial Impact panel in Presentation",
      "The CVV Report is used by investors, appraisers, and HGTV",
      "77.5% retention on roofing beats most kitchen remodels",
      "For metal: sell the 50+ year lifespan & energy savings, not just resale %",
    ],
    linkTab: "presentation",
    references: [
      {
        title: "Phoenix Market Data — Cost vs. Value 2025",
        content: ["These are market-verified figures from the 2025 Cost vs. Value Report for the Phoenix metro area."],
        subSections: [
          {
            heading: "Roofing — Asphalt Shingles",
            items: [
              "Job Cost: $26,368",
              "Resale Value: $20,436",
              "Value Retained: 77.5%",
              "One of the highest ROI percentages of any major home improvement category",
            ],
          },
          {
            heading: "Roofing — Metal",
            items: [
              "Job Cost: $41,202",
              "Resale Value: $24,609",
              "Value Retained: 59.7%",
              "50+ year lifespan, lower energy costs, superior storm resistance",
            ],
          },
          {
            heading: "Windows — Vinyl",
            items: [
              "Job Cost: $21,022",
              "Resale Value: $16,312",
              "Value Retained: 77.6%",
            ],
          },
          {
            heading: "Windows — Wood",
            items: [
              "Job Cost: $26,166",
              "Resale Value: $17,626",
              "Value Retained: 67.4%",
            ],
          },
          {
            heading: "Siding — Vinyl",
            items: [
              "Job Cost: $15,343",
              "Resale Value: $19,828",
              "Value Retained: 129.2% ✨",
            ],
          },
          {
            heading: "Siding — Fiber Cement",
            items: [
              "Job Cost: $16,573",
              "Resale Value: $17,130",
              "Value Retained: 103.4%",
            ],
          },
          {
            heading: "Comparison: Kitchen Remodels",
            items: [
              "Minor Kitchen (Midrange): $28,333 cost → $30,899 resale → 109.1%",
              "Major Kitchen (Midrange): $81,274 cost → $38,089 resale → 46.9%",
              "Major Kitchen (Upscale): $158,252 cost → $53,408 resale → 33.7%",
            ],
          },
          {
            heading: "Other High-ROI Projects",
            items: [
              "Garage Door Replacement: 248.3% value recouped",
              "Steel Entry Door: 194.1% value recouped",
              "Manufactured Stone Veneer: 160.9% value recouped",
            ],
          },
        ],
      },
    ],
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
    subtitle: "Preparing to Ask for the Order",
    icon: HandshakeIcon,
    script: `"By the look on your face it seems as if we found the right (Roofing/Siding/Windows/Bath) system for you, am I right?\n\nAre there any features you would like to add or change?\n\nThat brings me to the most important question of the day, is there anything other than price that would stop you from using DaBella as your contractor and the (Applicable Product) System as your (Product) of choice?"`,
    detailedScripts: [
      {
        label: "Response: 'No, I think it's just the money'",
        text: `"Great, since it all boils down to dollars and cents, do you mind if we talk about that for a minute?"\n(Response) "Yes, that's what we've been waiting for."\n\nUSE THE PROJECT REVIEW SHEET TO TALK ABOUT BELOW:\n\n"I find that most of my clients fall within 1 of 3 monthly investment categories in terms of financing. These are — $500–600 per month, $400–500 per month, or $300–400 per month. Which one of those best fits your budget?"`,
      },
      {
        label: "Response: 'I'm not buying anything today'",
        text: `"I'm not asking you to buy anything right now. What I am doing is preparing a 3-point comprehensive bid that includes:\n• The scope of work\n• The terms of finance\n• The amount of the initial deposit\nThat way you can give this careful consideration — sound good?"\n\n"So what would be comfortable for you? $500–600, $400–500, or $300–400?"\n(Response) "$300–400"\n\n"Is that closer to $300 or $400, or in the middle?"\n(Response) "In the middle somewhere"\n\n"Great I'll make a note of that — and last but not least, what would a comfortable deposit be?"`,
      },
      {
        label: "Response: 'Again, I'm not buying anything'",
        text: `"I understand… again it's just to give you the information in order for you to give careful consideration. So if you called me in the next 30 days, and said I've earned your business and nothing financially has changed for you, what would a comfortable deposit look like?"\n(Response) "What is required?"\n\n"Ideally the banks like to see a 10% commitment, so in your case that would be around $3,000 (whatever 10% of their project is)."\n(Response) "I can't swing that."\n\n"How about if we cut that in half? Say $1,500?"\n(Response) "Yeah, I can do that."\n\n"So if I can get your payment around $350 and your deposit at $1,500 would I earn your business?"`,
      },
      {
        label: "If they say 'I'm not buying anything tonight!'",
        text: `"But you could at least give it careful consideration?"\n"Yes!"`,
      },
    ],
    checklist: [
      "Confirm they like the product/system",
      "Ask if any features to add or change",
      "Ask: anything besides price stopping you?",
      "Identify comfortable monthly payment range ($300–400, $400–500, $500–600)",
      "Narrow down: closer to $300 or $400?",
      "Determine comfortable deposit amount",
      "Present the 3-point comprehensive bid",
      "Gauge buying temperature",
    ],
    tips: [
      "The PTA is about permission, not pressure",
      "Use the 3-range technique: $500–600, $400–500, $300–400",
      "When they resist, reframe as 'careful consideration' not buying",
      "Banks like 10% down — but cutting in half often gets the yes",
      "Always end with: 'Would I earn your business?'",
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
    script: `"I want to check one more thing for you. The homeowners who move forward when everything makes sense are the ones we can reward with our efficiency pricing. Let me make a quick call to my manager to see what we can do."`,
    detailedScripts: [
      {
        label: "Efficiency pricing intro",
        text: `"Here's the thing — when a homeowner like you says 'this makes sense, I want to move forward,' we can save on a second trip, re-measuring, re-presenting… all of that costs money. So we pass that savings on to you. That's what efficiency pricing is — you're not getting a discount, you're earning a better price by being efficient."`,
      },
      {
        label: "1-Year deferral offer",
        text: `"One more option I want to make sure you know about — we have a 1-year deferral program. That means you can get this project done now, lock in today's pricing, and not make your first payment for 12 months. That gives you time to budget, plan, and enjoy the new system without any financial pressure right away."`,
      },
      {
        label: "Manager on-demand call",
        text: `"Let me call my manager real quick. I want to see if there's any additional room we can work with based on your situation. This isn't something I can do on my own — but if they approve it, this would be the absolute best pricing available."\n\n[MAKE THE CALL]\n\n"Great news — my manager approved (efficiency pricing / standby program / additional discount). This is only available because you're moving forward today. Here's what that looks like…"`,
      },
      {
        label: "Standby program",
        text: `"We may have limited room in a standby program if you can be flexible on install timing. Instead of us scheduling you in a premium slot, you'd go on standby — meaning we fit you in when there's an opening. In exchange, you save even more. Would it be okay if I check on that for you?"`,
      },
      {
        label: "Final close after efficiency",
        text: `"So with the efficiency pricing, your payment comes down to [amount], your deposit is [amount], and you get the full warranty, full system, full installation. Based on everything we've gone through — would you like to handle the deposit with a check or card?"`,
      },
    ],
    checklist: [
      "Explain efficiency pricing — earned, not discounted",
      "Present 1-year deferral option",
      "Make the manager on-demand call",
      "Get manager approval for final pricing",
      "Present standby program if applicable",
      "Present the final, best offer with new numbers",
      "Ask for the business with updated payment",
    ],
    tips: [
      "This is your ace — don't play it too early",
      "The manager call adds authority and urgency",
      "Frame savings as earned, not discounted",
      "Efficiency = saving on second trip, re-measuring, re-presenting",
      "The 1-year deferral removes the 'not right now' objection",
      "Standby only works if they can be flexible on timing",
      "Always present the new monthly payment — not just the discount amount",
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
