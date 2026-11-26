import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import RouteMeta from '../components/RouteMeta.jsx';
import { AsciiBox, AsciiProgressBar, AsciiDivider } from '../components/AsciiPrimitives.jsx';
import careers from '../data/careers.json';
import styles from './RoadmapPage.module.css';

const ROADMAP_STORAGE_KEY = 'career_mitar_roadmap_progress_v1';

function loadAllProgress() {
  try {
    const raw = localStorage.getItem(ROADMAP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export default function RoadmapPage() {
  const { career: careerSlug } = useParams();
  const navigate = useNavigate();

  const activeCareer = useMemo(
    () => careers.find((c) => c.slug === careerSlug) || careers[0],
    [careerSlug]
  );

  const [progressMap, setProgressMap] = useState(loadAllProgress);

  useEffect(() => {
    try {
      localStorage.setItem(ROADMAP_STORAGE_KEY, JSON.stringify(progressMap));
    } catch {
      // ignore storage errors
    }
  }, [progressMap]);

  const completedIds = progressMap[activeCareer.slug] || [];
  const allSteps = activeCareer.roadmap.flatMap((p) => p.steps);
  const completedCount = allSteps.filter((s) => completedIds.includes(s.id)).length;

  const toggleStep = (stepId) => {
    setProgressMap((prev) => {
      const current = prev[activeCareer.slug] || [];
      const next = current.includes(stepId)
        ? current.filter((id) => id !== stepId)
        : [...current, stepId];
      return { ...prev, [activeCareer.slug]: next };
    });
  };

  const resetCareerProgress = () => {
    setProgressMap((prev) => ({
      ...prev,
      [activeCareer.slug]: [],
    }));
  };

  return (
    <div className={`container ${styles.page}`}>
      <RouteMeta
        title={`${activeCareer.title} Roadmap`}
        description={`Interactive ASCII career roadmap for ${activeCareer.title} in India: ${activeCareer.timeline}.`}
      />

      <div className={styles.topBar}>
        <div>
          <span className={styles.kicker}>{activeCareer.category}</span>
          <h1 className={styles.title}>{activeCareer.title}</h1>
          <p className={styles.metaLine}>
            {activeCareer.salaryBand} · {activeCareer.timeline}
          </p>
        </div>

        <div className={styles.switcherWrap}>
          <label htmlFor="career-switcher" className="label">
            Switch Career Track
          </label>
          <select
            id="career-switcher"
            className="select"
            value={activeCareer.slug}
            onChange={(e) => navigate(`/roadmap/${e.target.value}`)}
          >
            {careers.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <AsciiBox className={styles.progressBox}>
        <div className={styles.progressRow}>
          <div>
            <div className={styles.progressLabel}>
              Completed {completedCount} of {allSteps.length} milestones
            </div>
            <AsciiProgressBar
              value={completedCount}
              max={allSteps.length}
              segments={12}
              label={`${activeCareer.title} roadmap progress`}
            />
          </div>
          <div className={styles.progressActions}>
            <button
              type="button"
              className="btn btn-sm"
              onClick={resetCareerProgress}
              disabled={completedCount === 0}
            >
              Reset Progress
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() =>
                navigate('/chat', {
                  state: {
                    initialPrompt: `I am following the ${activeCareer.title} roadmap (${completedCount}/${allSteps.length} steps done). What should I focus on next?`,
                    autoSend: false,
                  },
                })
              }
            >
              Discuss in Chat
            </button>
          </div>
        </div>
      </AsciiBox>

      <AsciiDivider label="Interactive ASCII Tree" />

      <div className={styles.tree}>
        <div className={styles.treeRoot}>
          <code>{activeCareer.slug}/</code>
        </div>

        {activeCareer.roadmap.map((phaseObj, pIdx) => {
          const isLastPhase = pIdx === activeCareer.roadmap.length - 1;
          const phaseBranch = isLastPhase ? '└── ' : '├── ';
          const childPrefix = isLastPhase ? '    ' : '│   ';

          return (
            <div key={phaseObj.phase} className={styles.phaseBlock}>
              <div className={styles.phaseHeader}>
                <code className={styles.treeGlyph} aria-hidden="true">
                  {phaseBranch}
                </code>
                <span className={styles.phaseTitle}>{phaseObj.phase}</span>
              </div>

              <ul className={styles.stepList}>
                {phaseObj.steps.map((step, sIdx) => {
                  const isLastStep = sIdx === phaseObj.steps.length - 1;
                  const stepBranch = isLastStep ? '└── ' : '├── ';
                  const checked = completedIds.includes(step.id);

                  return (
                    <li key={step.id} className={styles.stepRow}>
                      <code className={styles.treeGlyph} aria-hidden="true">
                        {childPrefix}
                        {stepBranch}
                      </code>
                      <label className={`${styles.stepLabel} ${checked ? styles.stepDone : ''}`}>
                        <input
                          type="checkbox"
                          className={styles.checkbox}
                          checked={checked}
                          onChange={() => toggleStep(step.id)}
                        />
                        <span className={styles.checkGlyph} aria-hidden="true">
                          {checked ? '[x]' : '[ ]'}
                        </span>
                        <span>{step.label}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>

      <div className={styles.footerNav}>
        <Link to="/explore" className="btn btn-sm">
          ← Back to Explore
        </Link>
      </div>
    </div>
  );
}
