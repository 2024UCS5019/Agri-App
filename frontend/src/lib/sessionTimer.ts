import { ActiveTractorSession } from '@/types';

const STORAGE_KEY = 'agri_active_tractor_session';

export const getActiveSession = (): ActiveTractorSession | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const saveActiveSession = (session: ActiveTractorSession | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('agri_session_update', { detail: null }));
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      window.dispatchEvent(new CustomEvent('agri_session_update', { detail: session }));
    }
  } catch {
    // quota
  }
};

export const computeLiveSeconds = (session: ActiveTractorSession | null): number => {
  if (!session) return 0;
  let total = session.accumulatedSeconds || 0;
  if (session.isRunning && session.startTimestamp) {
    const delta = Math.max(0, Math.floor((Date.now() - session.startTimestamp) / 1000));
    total += delta;
  }
  return total;
};

export const formatDigitalTime = (totalSeconds: number): string => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateSessionAmount = (totalSeconds: number, hourlyRate: number): number => {
  if (!totalSeconds || !hourlyRate) return 0;
  const hours = totalSeconds / 3600;
  return Math.round(hours * hourlyRate);
};

export const pauseSession = (): ActiveTractorSession | null => {
  const current = getActiveSession();
  if (!current) return null;
  const liveSecs = computeLiveSeconds(current);
  const updated: ActiveTractorSession = {
    ...current,
    isRunning: false,
    startTimestamp: null,
    accumulatedSeconds: liveSecs,
    lastUpdated: Date.now(),
  };
  saveActiveSession(updated);
  return updated;
};

export const resumeSession = (): ActiveTractorSession | null => {
  const current = getActiveSession();
  if (!current) return null;
  const updated: ActiveTractorSession = {
    ...current,
    isRunning: true,
    startTimestamp: Date.now(),
    lastUpdated: Date.now(),
  };
  saveActiveSession(updated);
  return updated;
};

export const clearSession = (): void => {
  saveActiveSession(null);
};
