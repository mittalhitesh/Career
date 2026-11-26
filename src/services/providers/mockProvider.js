import { ChatApiError, ERROR_CODES } from '../errors.js';

const MOCK_RESPONSES = [
  {
    keywords: ['data', 'analyst', 'analytics', 'sql', 'python', 'power bi'],
    reply: `### Data Analyst Path in India (Practical 6-Month Plan)

Breaking into **Data Analytics** in India is very realistic without an IIT tag—hiring managers care most about SQL fluency, clean Excel/Power BI dashboards, and business sense.

#### 1. Core Stack (Weeks 1–10)
- **SQL (Non-negotiable):** Joins, CTEs, window functions (\`RANK()\`, \`LAG()\`), and aggregations on real datasets.
- **Excel / Google Sheets:** Pivot tables, \`XLOOKUP\`, basic data cleaning.
- **BI Tool:** Pick **Power BI** (widely used across Indian GCCs, fintech, and retail).
- **Python (Pandas):** Enough to clean messy CSVs and run exploratory analysis.

#### 2. Portfolio That Gets Callbacks
Avoid Titanic/Iris datasets. Build **2 India-relevant projects**:
1. *UPI / Quick-Commerce Order Funnel Analysis* — cohort retention, drop-offs, city-tier split.
2. *Retail Inventory & Margin Dashboard* in Power BI with a 1-page business summary.

#### 3. Realistic Salary Expectations
- **Fresher (0–1 yr):** ₹4.5 – ₹8 LPA (higher at product startups & GCCs)
- **Mid-level (2–4 yrs):** ₹9 – ₹16 LPA

Would you like a week-by-week SQL + Power BI study schedule based on your current background?`,
  },
  {
    keywords: ['software', 'sde', 'developer', 'coding', 'web', 'frontend', 'backend', 'dsa'],
    reply: `### Software Engineering (SDE) Strategy for Indian Students

To stand out in India's crowded entry-level market, balance **problem solving** with **one deployed, real-world project**.

#### 1. Pick One Clear Track
- **Frontend:** HTML/CSS, JavaScript (ES6+), React, accessibility, and state management.
- **Backend:** Node.js/Express or Python/FastAPI or Java/Spring Boot + PostgreSQL + REST APIs.

#### 2. DSA Without Burnout
- Focus on **Arrays, HashMaps, Two Pointers, Sliding Window, Trees, and Graphs** (120–150 quality problems beats 600 random ones).
- Practice explaining your approach out loud in 3 minutes.

#### 3. Proof of Work
- Ship **2 deployed projects** with clean READMEs, error handling, and real data.
- Target **internships** at early-stage startups (Wellfound, LinkedIn, Y Combinator Work at a Startup) before final-year placements.

#### Typical Compensation
- **Service / IT firms:** ₹3.6 – ₹7 LPA
- **Product startups & GCCs:** ₹8 – ₹18 LPA

Tell me your current year/degree and tech stack, and I can tailor a 90-day plan.`,
  },
  {
    keywords: ['upsc', 'govt', 'government', 'ssc', 'banking', 'gate', 'cat', 'mba'],
    reply: `### Evaluating Competitive Exams vs. Skill-Based Roles

Competitive exams in India (**GATE, CAT, UPSC, SSC, Banking**) can be transformative, but they carry high opportunity cost. A calm decision framework helps:

#### 1. Set a Clear Time-Box
- Give yourself **1–2 focused attempts** with measurable mock-test benchmarks rather than an open-ended multi-year loop.
- Keep a **Plan B skill track** (e.g., analytics, QA, or software) warm in 4–5 hours/week so your resume never has an unexplained gap.

#### 2. Exam-Specific Quick Notes
- **GATE:** Great for M.Tech at IITs/NITs or PSU roles; requires deep fundamentals in core subjects.
- **CAT / MBA:** Best ROI from Tier-1/top-20 B-schools; work experience (12–24 months) often strengthens both admits and placements.
- **UPSC / State PSC:** Demands 12–18 months of disciplined reading + answer writing; start with NCERTs and previous year papers.

What exam or degree are you weighing right now?`,
  },
];

const DEFAULT_MOCK_REPLY = `### Let's Map Your Next Career Step

Here is a calm, structured way to think through your options in the Indian job market:

1. **Clarify your 12-month horizon:** Are you aiming for your *first internship/job*, a *domain switch*, or *higher studies*?
2. **Focus on 1 primary role + 1 adjacent role:** For example, *Data Analyst* + *Business Analyst*, or *Frontend Developer* + *Full-Stack Junior*.
3. **Build visible proof:** A clean GitHub/portfolio with 2–3 solved problems beats a generic 10-certificate resume.

#### Next Step You Can Take Today
- Browse **Explore** for INR salary bands and entry steps across 14 Indian career paths.
- Open **Roadmaps** to track your progress phase by phase.
- Tell me your **education, interests, and target timeline**, and I will draft a concrete 8-week plan.`;

function pickMockReply(messages) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = (lastUser?.content || '').toLowerCase();

  for (const item of MOCK_RESPONSES) {
    if (item.keywords.some((kw) => text.includes(kw))) {
      return item.reply;
    }
  }
  return DEFAULT_MOCK_REPLY;
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new ChatApiError('Generation stopped.', { code: ERROR_CODES.ABORTED }));
      return;
    }
    const id = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    function onAbort() {
      clearTimeout(id);
      reject(new ChatApiError('Generation stopped.', { code: ERROR_CODES.ABORTED }));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function sendMockMessage({ messages, signal, onToken, isTest = false }) {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = lastUser?.content || '';

  if (!isTest) {
    const forceError = text.includes('[simulate-error]');
    const randomError = Math.random() < 0.1;
    if (forceError || randomError) {
      await wait(350, signal);
      throw new ChatApiError(
        'Simulated provider hiccup (1-in-10 demo failure or [simulate-error] trigger). Click Retry to test recovery.',
        { code: ERROR_CODES.SIMULATED_ERROR, retryable: true }
      );
    }
  }

  const fullText = isTest ? 'Mock provider ready.' : pickMockReply(messages);
  if (isTest) {
    onToken?.(fullText);
    return fullText;
  }

  // Stream in realistic word/chunk slices
  const tokens = fullText.match(/\S+\s*/g) || [fullText];
  let accumulated = '';
  for (const token of tokens) {
    await wait(24, signal);
    accumulated += token;
    onToken?.(token);
  }
  return accumulated;
}

export async function testMockConnection(signal) {
  await wait(180, signal);
  return { ok: true, message: 'Mock provider is active and ready (no API key required).' };
}
