import { useState } from 'react';
import { useProfile } from '../contexts/ProfileContext.jsx';
import { AsciiBox } from './AsciiPrimitives.jsx';
import styles from './OnboardingModal.module.css';

export default function OnboardingModal({ isOpen, onClose }) {
  const { profile, saveProfile, skipOnboarding } = useProfile();
  const [education, setEducation] = useState(profile.education || '');
  const [interests, setInterests] = useState(profile.interests || '');
  const [location, setLocation] = useState(profile.location || '');

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    saveProfile({
      education: education.trim(),
      interests: interests.trim(),
      location: location.trim(),
    });
    onClose();
  };

  const handleSkip = () => {
    skipOnboarding();
    onClose();
  };

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
      <div className={styles.dialog}>
        <AsciiBox title="Optional Student Context">
          <h2 id="onboarding-title" className={styles.heading}>
            Tailor your guidance (stored locally)
          </h2>
          <p className={styles.sub}>
            Sharing a few details helps Career Mitar AI give relevant Indian college, exam, and
            salary context. You can skip this anytime.
          </p>

          <form onSubmit={handleSave} className={styles.form}>
            <div>
              <label htmlFor="onb-edu" className="label">
                Current Education / Stage
              </label>
              <input
                id="onb-edu"
                type="text"
                className="input"
                placeholder="e.g., 3rd year B.Tech CSE, B.Com graduate, Class 12 PCM"
                value={education}
                onChange={(e) => setEducation(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="onb-int" className="label">
                Interests or Target Roles
              </label>
              <input
                id="onb-int"
                type="text"
                className="input"
                placeholder="e.g., Data Analytics, Backend Dev, MBA vs job"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="onb-loc" className="label">
                City / Region (optional)
              </label>
              <input
                id="onb-loc"
                type="text"
                className="input"
                placeholder="e.g., Pune, Tier-2 city, open to relocate"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className={styles.actions}>
              <button type="button" className="btn btn-ghost" onClick={handleSkip}>
                Skip for now
              </button>
              <button type="submit" className="btn btn-primary">
                Save Context
              </button>
            </div>
          </form>
        </AsciiBox>
      </div>
    </div>
  );
}
