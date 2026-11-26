import { createContext, useContext, useState, useCallback } from 'react';

const PROFILE_STORAGE_KEY = 'career_mitar_profile_v1';

const DEFAULT_PROFILE = {
  education: '',
  interests: '',
  location: '',
  skipped: false,
};

const ProfileContext = createContext(null);

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState(loadProfile);

  const persist = useCallback((next) => {
    setProfile(next);
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const saveProfile = useCallback(
    (fields) => {
      persist({ ...profile, ...fields, skipped: false });
    },
    [profile, persist]
  );

  const skipOnboarding = useCallback(() => {
    persist({ ...profile, skipped: true });
  }, [profile, persist]);

  const clearProfile = useCallback(() => {
    persist(DEFAULT_PROFILE);
  }, [persist]);

  const hasProfileData = Boolean(
    profile.education?.trim() || profile.interests?.trim() || profile.location?.trim()
  );

  return (
    <ProfileContext.Provider
      value={{
        profile,
        hasProfileData,
        saveProfile,
        skipOnboarding,
        clearProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside ProfileProvider');
  return ctx;
}
