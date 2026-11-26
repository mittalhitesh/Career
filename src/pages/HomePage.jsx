import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RouteMeta from '../components/RouteMeta.jsx';
import { AsciiBox, AsciiDivider } from '../components/AsciiPrimitives.jsx';
import careers from '../data/careers.json';
import styles from './HomePage.module.css';

const STARTER_PROMPTS = [
  {
    title: 'Data Analyst from non-CS',
    prompt: 'I am a B.Com / B.Sc student in India. How do I break into Data Analytics in 6 months?',
  },
  {
    title: 'Tier-3 SDE Placement Plan',
    prompt: 'I am in 3rd year B.Tech at a Tier-3 college. How should I balance DSA and projects for SDE internships?',
  },
  {
    title: 'GATE vs. Job vs. MBA',
    prompt: 'Help me compare preparing for GATE, taking a 4.5 LPA IT job, or aiming for CAT/MBA after 1 year.',
  },
  {
    title: 'Switch from Support to Cloud',
    prompt: 'I have 1 year in IT support. What is a practical roadmap to transition into Cloud & DevOps in India?',
  },
];

const FEATURED_SLUGS = [
  'software-engineer',
  'data-analyst',
  'product-manager',
  'ev-embedded-systems',
];

export default function HomePage() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const featuredCareers = FEATURED_SLUGS.map((slug) =>
    careers.find((c) => c.slug === slug)
  ).filter(Boolean);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed) {
      navigate('/chat');
      return;
    }
    navigate('/chat', { state: { initialPrompt: trimmed, autoSend: true } });
  };

  const handleStarter = (starterPrompt) => {
    navigate('/chat', { state: { initialPrompt: starterPrompt, autoSend: true } });
  };

  return (
    <div className="container">
      <RouteMeta
        title="Home"
        description="Calm, practical AI career guidance for Indian students. Explore 14 career paths, interactive ASCII roadmaps, and local-first chat."
      />

      <section className={styles.hero}>
        <pre className={styles.wordmarkFull} aria-hidden="true">
{`┌──────────────────────────────────────────────────────────┐
│  CAREER MITAR AI  ·  LOCAL-FIRST CAREER COMPANION        │
└──────────────────────────────────────────────────────────┘`}
        </pre>
        <div className={styles.wordmarkCompact} aria-hidden="true">
          <code>[ CAREER MITAR AI · LOCAL-FIRST ]</code>
        </div>

        <h1 className={styles.headline}>
          Calm, practical career guidance for Indian students.
        </h1>
        <p className={styles.lead}>
          No hype, no guaranteed-placement gimmicks. Compare realistic INR salary bands, follow
          checkable ASCII roadmaps, and talk through your next step with an AI mentor that keeps
          your data in your browser.
        </p>

        <form onSubmit={handleSubmit} className={styles.promptForm}>
          <label htmlFor="home-prompt" className="sr-only">
            Ask a career question
          </label>
          <input
            id="home-prompt"
            type="text"
            className={`input ${styles.promptInput}`}
            placeholder="Ask anything — e.g. 'How do I prepare for Data Analyst roles from a Tier-2 college?'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Ask Mitar →
          </button>
        </form>

        <div className={styles.starterGrid}>
          {STARTER_PROMPTS.map((item) => (
            <button
              key={item.title}
              type="button"
              className={styles.starterCard}
              onClick={() => handleStarter(item.prompt)}
            >
              <span className={styles.starterTitle}>{item.title}</span>
              <span className={styles.starterText}>{item.prompt}</span>
            </button>
          ))}
        </div>
      </section>

      <AsciiDivider label="How It Works" />

      <section className={styles.howGrid} aria-label="How Career Mitar AI works">
        <AsciiBox title="01 / Explore">
          <h2 className={styles.stepHeading}>Compare 14 Indian tracks</h2>
          <p className={styles.stepCopy}>
            Inspect realistic fresher-to-mid INR salary bands, required skills, and honest entry
            steps before committing months to a path.
          </p>
        </AsciiBox>
        <AsciiBox title="02 / Talk">
          <h2 className={styles.stepHeading}>Chat with optional context</h2>
          <p className={styles.stepCopy}>
            Works out-of-the-box in Demo Mode, or connect OpenAI, IBM Watsonx.ai, or your own
            backend proxy in Settings.
          </p>
        </AsciiBox>
        <AsciiBox title="03 / Track">
          <h2 className={styles.stepHeading}>Follow ASCII roadmaps</h2>
          <p className={styles.stepCopy}>
            Check off concrete weekly milestones per career. Everything persists locally in your
            browser—no account required.
          </p>
        </AsciiBox>
      </section>

      <AsciiDivider label="Featured Career Paths" />

      <section className={styles.featuredSection}>
        <div className={styles.featuredGrid}>
          {featuredCareers.map((career) => (
            <article key={career.slug} className={styles.careerCard}>
              <div className={styles.careerMeta}>
                <span className={styles.careerCategory}>{career.category}</span>
                <span className={styles.careerTimeline}>{career.timeline}</span>
              </div>
              <h3 className={styles.careerTitle}>{career.title}</h3>
              <p className={styles.careerSalary}>{career.salaryBand}</p>
              <p className={styles.careerDesc}>{career.whoItSuits}</p>
              <div className={styles.careerLinks}>
                <Link to={`/roadmap/${career.slug}`} className="btn btn-sm">
                  View Roadmap
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  onClick={() =>
                    navigate('/chat', {
                      state: {
                        initialPrompt: `Tell me how to get started as a ${career.title} in India.`,
                        autoSend: false,
                      },
                    })
                  }
                >
                  Ask Mitar
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.exploreMore}>
          <Link to="/explore" className="btn">
            Explore all 14 career paths →
          </Link>
        </div>
      </section>
    </div>
  );
}
