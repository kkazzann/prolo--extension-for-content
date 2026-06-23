import { use } from 'react';
import { fetchAllIssuesWithChecklists } from './useIssuesWithChecklists';

const STORAGE_KEY = 'prologistics_load_history';

export function getAverageLoadTime(): number | null {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    if (!Array.isArray(history) || history.length === 0) return null;

    const sum = history.reduce((a, b) => a + b, 0);
    return Math.round(sum / history.length);
  } catch (e) {
    return null;
  }
}

function saveLoadTime(seconds: number) {
  try {
    const history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const validHistory = Array.isArray(history) ? history : [];

    validHistory.push(seconds);
    if (validHistory.length > 5) {
      validHistory.shift();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(validHistory));
  } catch (e) {
    console.error('local storage exception', e);
  }
}

const promiseCache = new Map<string, Promise<any>>();

export function useIssueData(boardId: number, status: string = 'open') {
  const cacheKey = `${boardId}-${status}`;

  if (!promiseCache.has(cacheKey)) {
    const startTime = Date.now();

    const promise = fetchAllIssuesWithChecklists(boardId, status).then(data => {
      const durationInSeconds = (Date.now() - startTime) / 1000;
      saveLoadTime(durationInSeconds);
      return data; // { issues, currentUser }
    });

    promiseCache.set(cacheKey, promise);
  }

  const promise = promiseCache.get(cacheKey)!;
  return use(promise) as {
    issues: import('../types').ProcessedIssue[];
    currentUser: import('./useIssuesWithChecklists').CurrentUser | null;
  };
}
