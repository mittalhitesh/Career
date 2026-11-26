import { Link } from 'react-router-dom';
import RouteMeta from '../components/RouteMeta.jsx';
import { AsciiBox, AsciiDivider } from '../components/AsciiPrimitives.jsx';
import styles from './AboutPage.module.css';

export default function AboutPage() {
  return (
    <div className={`container ${styles.page}`}>
      <RouteMeta
        title="About"
        description="About Career Mitar AI: local-first architecture, capabilities, limitations, and career guidance disclaimer."
      />

      <header className={styles.header}>
        <h1 className={styles.title}>About Career Mitar AI</h1>
        <p className={styles.lead}>
          A calm, local-first career companion built for Indian students and early-career
          professionals—designed to replace noisy hype with structured, honest guidance.
        </p>
      </header>

      <div className={styles.grid}>
        <AsciiBox title="What It Can Do">
          <ul className={styles.list}>
            <li>Compare 14 Indian career tracks with realistic fresher-to-mid INR salary bands.</li>
            <li>Break vague goals into checkable, phase-by-phase ASCII roadmaps.</li>
            <li>Help you draft 8-week study plans, project ideas, and interview prep checklists.</li>
            <li>Run completely offline-capable for browsing careers, roadmaps, and past chats.</li>
          </ul>
        </AsciiBox>

        <AsciiBox title="What It Cannot Do">
          <ul className={styles.list}>
            <li>Guarantee job placements, exam ranks, or specific salary packages.</li>
            <li>Replace certified academic, legal, financial, or mental-health professionals.</li>
            <li>Verify live job openings or real-time hiring freezes without external search.</li>
          </ul>
        </AsciiBox>
      </div>

      <AsciiDivider label="Local-First Architecture" />

      <section className={`measure ${styles.prose}`}>
        <h2>Your data stays in your browser</h2>
        <p>
          Career Mitar AI has no user database, no tracking analytics, and no server-side chat logs.
          Your conversation history, optional student context, roadmap checkboxes, theme
          preference, and API settings are stored strictly in your browser&apos;s{' '}
          <code>localStorage</code>.
        </p>

        <h2>Guidance, not a guarantee</h2>
        <p>
          Compensation bands and timelines in this app reflect typical Indian market ranges across
          metros, Tier-2 hubs, startups, GCCs, and public-sector exams. Individual outcomes vary
          widely based on skill depth, location, market cycles, and timing. Always cross-check
          official exam notifications and company offers directly.
        </p>

        <div className={styles.cta}>
          <Link to="/chat" className="btn btn-primary">
            Start a Conversation
          </Link>
          <Link to="/settings" className="btn">
            Configure AI Provider
          </Link>
        </div>
      </section>
    </div>
  );
}
