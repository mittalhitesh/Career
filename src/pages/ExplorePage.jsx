import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RouteMeta from '../components/RouteMeta.jsx';
import { AsciiDivider } from '../components/AsciiPrimitives.jsx';
import careers from '../data/careers.json';
import styles from './ExplorePage.module.css';

export default function ExplorePage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const navigate = useNavigate();

  const categories = useMemo(() => {
    const unique = Array.from(new Set(careers.map((c) => c.category)));
    return ['All', ...unique];
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return careers.filter((c) => {
      const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      const haystack = [
        c.title,
        c.category,
        c.whoItSuits,
        ...(c.coreSkills || []),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query, selectedCategory]);

  const askMitar = (career) => {
    navigate('/chat', {
      state: {
        initialPrompt: `I am exploring ${career.title} in India. Based on my background, what should my first 8 weeks look like?`,
        autoSend: false,
      },
    });
  };

  return (
    <div className={`container ${styles.page}`}>
      <RouteMeta
        title="Explore Careers"
        description="Explore 14 Indian career paths with realistic INR salary bands, timelines, core skills, and entry steps."
      />

      <header className={styles.header}>
        <h1 className={styles.title}>Explore 14 Indian Career Paths</h1>
        <p className={styles.subtitle}>
          Realistic INR compensation bands, preparation timelines, and concrete entry steps across
          tech, data, finance, design, core engineering, and public sector tracks.
        </p>
      </header>

      <div className={styles.controls}>
        <div className={styles.searchWrap}>
          <label htmlFor="explore-search" className="sr-only">
            Search careers or skills
          </label>
          <input
            id="explore-search"
            type="search"
            className="input"
            placeholder="Search by role, skill (e.g., SQL, Figma, Embedded C, GATE)…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className={styles.chips} role="group" aria-label="Filter by category">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`btn btn-sm ${
                selectedCategory === cat ? 'btn-primary' : ''
              }`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <AsciiDivider label={`${filtered.length} of ${careers.length} tracks`} />

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>No career tracks matched "{query}".</p>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setQuery('');
              setSelectedCategory('All');
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filtered.map((career) => (
            <article key={career.slug} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.category}>{career.category}</span>
                <span className={styles.timeline}>{career.timeline}</span>
              </div>

              <h2 className={styles.cardTitle}>{career.title}</h2>
              <p className={styles.salary}>{career.salaryBand}</p>
              <p className={styles.suits}>{career.whoItSuits}</p>

              <div className={styles.sectionLabel}>Core Skills</div>
              <div className={styles.skills}>
                {career.coreSkills.map((skill) => (
                  <span key={skill} className={styles.skillTag}>
                    {skill}
                  </span>
                ))}
              </div>

              <div className={styles.sectionLabel}>Entry Steps</div>
              <ul className={styles.steps}>
                {career.entrySteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => askMitar(career)}
                >
                  Ask Mitar about this
                </button>
                <Link to={`/roadmap/${career.slug}`} className="btn btn-sm">
                  Open Roadmap →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
