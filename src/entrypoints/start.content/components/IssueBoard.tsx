import { Suspense, useDeferredValue, useState, startTransition, useEffect } from 'react';
import { useIssueData, getAverageLoadTime } from '../hooks/useIssueData';
import { IssueCard } from './IssueCard';
import { ErrorBoundary } from './ErrorBoundary';
import styles from './IssueBoard.module.scss';
import ViewHideIcon from '@iconify-react/lets-icons/view-hide';
import ViewIcon from '@iconify-react/lets-icons/view';
import BouncingBallIcon from '@iconify-react/svg-spinners/bouncing-ball';
import { ProcessedIssue } from '../types';

interface IssueBoardProps {
  boardId: number;
  status?: string;
}

function LoadingTimer() {
  const [elapsed, setElapsed] = useState(0);
  const [eta, setEta] = useState<number | null>(null);

  useEffect(() => {
    setEta(getAverageLoadTime());

    const timer = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}>
        <BouncingBallIcon />
      </div>

      <span>Please wait a while, fetching all issues and processing them...</span>

      <strong>{formatTime(elapsed)} elapsed</strong>
      {eta !== null ? (
        <p>
          (avg load time: <strong>~{formatTime(eta)}</strong>)
        </p>
      ) : (
        <p>
          (avg load time: <em>-</em>)
        </p>
      )}

      {eta !== null && elapsed > eta + 2 && (
        <p className={styles.warningText}>It's taking a bit longer than usual, please wait...</p>
      )}
    </div>
  );
}

function IssueList({ boardId, status = 'open' }: IssueBoardProps) {
  const { issues, currentUser } = useIssueData(boardId, status);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [hideAlreadyDone, setHideAlreadyDone] = useState(true);
  const [onlyMyTasks, setOnlyMyTasks] = useState(true);

  const deferredSearch = useDeferredValue(searchTerm);

  const filteredIssues = issues.filter((issue: ProcessedIssue) => {
    const hasAllLanguages = issue.translations && issue.translations.length > 0;

    if (!showAll && !hasAllLanguages) {
      return false;
    }

    const isAllDone =
      issue.translations && issue.translations.length > 0 && issue.translations.every((t: any) => t.done);
    if (hideAlreadyDone && isAllDone) {
      return false;
    }

    if (onlyMyTasks) {
      if (!currentUser) return false;
      if (!issue.assigneeIds.includes(currentUser.id)) return false;
    }

    if (deferredSearch) {
      const term = deferredSearch.toLowerCase();
      const title = String(issue.title || '').toLowerCase();
      const id = String(issue.id || '');

      if (!title.includes(term) && !id.includes(term)) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className={styles.board}>
      <div className={styles.toolbar}>
        <div className={styles.leftControls}>
          <input
            type="text"
            placeholder="Search issue..."
            value={searchTerm}
            onChange={e => startTransition(() => setSearchTerm(e.target.value))}
            className={styles.searchInput}
          />

          <button className={styles.toggleBtn} onClick={() => startTransition(() => setShowAll(!showAll))}>
            {showAll ? (
              <>
                <ViewHideIcon width="20" height="20" /> Checklist Only
              </>
            ) : (
              <>
                <ViewIcon width="20" height="20" /> Show All
              </>
            )}
          </button>

          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={hideAlreadyDone} onChange={e => setHideAlreadyDone(e.target.checked)} />
            Hide already done
          </label>

          <label className={styles.checkboxLabel}>
            <input type="checkbox" checked={onlyMyTasks} onChange={e => setOnlyMyTasks(e.target.checked)} />
            Only my tasks
          </label>
        </div>

        <span className={styles.count}>
          {filteredIssues.length > 0 ? (
            <>
              {filteredIssues.length} {filteredIssues.length > 1 ? 'issues' : 'issue'}
            </>
          ) : (
            <>No Issues</>
          )}
        </span>
      </div>

      <div className={styles.grid}>
        {filteredIssues.map((issue: ProcessedIssue) => (
          <IssueCard key={issue.id} issue={issue} hideAlreadyDone={hideAlreadyDone} currentUser={currentUser} />
        ))}
      </div>
    </div>
  );
}

export function IssueBoard(props: IssueBoardProps) {
  return (
    <ErrorBoundary
      fallback={
        <div style={{ color: 'red', textAlign: 'center', padding: '20px' }}>An error occurred while loading data.</div>
      }
    >
      <Suspense fallback={<LoadingTimer />}>
        <IssueList {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
