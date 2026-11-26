import { Link } from 'react-router-dom';
import RouteMeta from '../components/RouteMeta.jsx';
import styles from './NotFoundPage.module.css';

export default function NotFoundPage() {
  return (
    <div className={`container ${styles.page}`}>
      <RouteMeta title="Page Not Found" description="The requested route does not exist." />

      <pre className={styles.tree} aria-hidden="true">
{`career-mitar/
├── /              (Home)
├── /chat          (AI Mentor)
├── /explore       (14 Career Paths)
├── /roadmap/:slug (ASCII Roadmaps)
└── ???            (404 — Not Found)`}
      </pre>

      <h1 className={styles.title}>404 — Trail Not Found</h1>
      <p className={styles.copy}>
        The page you are looking for isn&apos;t on this map. Head back home or explore the 14
        career tracks.
      </p>

      <div className={styles.actions}>
        <Link to="/" className="btn btn-primary">
          Go Home
        </Link>
        <Link to="/explore" className="btn">
          Explore Careers
        </Link>
      </div>
    </div>
  );
}
