import { memo, useEffect, useRef, useState } from 'react';
import type { ProcessedIssue } from '../types';
import type { CurrentUser } from '../hooks/useIssuesWithChecklists';
import styles from './IssueCard.module.scss';
import UserIcon from '@iconify-react/lets-icons/user';
import DoneIcon from '@iconify-react/lets-icons/done';
import TimeIcon from '@iconify-react/lets-icons/time';
import ExternalIcon from '@iconify-react/lets-icons/external';

function MarqueeText({ text }: { text: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [scrollDistance, setScrollDistance] = useState(0);
  const [scrollDuration, setScrollDuration] = useState('6s');

  useEffect(() => {
    const container = containerRef.current;
    const textEl = textRef.current;
    if (!container || !textEl) return;

    const checkOverflow = () => {
      const containerWidth = container.clientWidth;
      const textWidth = textEl.scrollWidth;
      // this prevents "jiggly" scroll, when text is short (but too long xD)
      if (textWidth > containerWidth + 40) {
        setShouldScroll(true);
        const dist = containerWidth - textWidth;
        setScrollDistance(dist);

        const speed = 35;
        const duration = Math.abs(dist) / speed;
        setScrollDuration(`${duration}s`);
      } else {
        setShouldScroll(false);
        setScrollDistance(0);
        setScrollDuration('6s');
      }
    };

    const animId = requestAnimationFrame(checkOverflow);
    const observer = new ResizeObserver(() => {
      checkOverflow();
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, [text]);

  const style = shouldScroll
    ? ({
        '--scroll-dist': `${scrollDistance}px`,
        '--scroll-duration': scrollDuration,
      } as React.CSSProperties)
    : undefined;

  return (
    <div ref={containerRef} className={styles.titleContainer}>
      <span ref={textRef} className={`${styles.titleText} ${shouldScroll ? styles.animate : ''}`} style={style}>
        {text}
      </span>
    </div>
  );
}

export const IssueCard = memo(function IssueCard({
  issue,
  hideAlreadyDone,
  currentUser,
}: {
  issue: ProcessedIssue;
  hideAlreadyDone: boolean;
  currentUser: CurrentUser | null;
}) {
  const displayedTranslations = hideAlreadyDone
    ? (issue.translations || []).filter(lang => !lang.done)
    : issue.translations || [];

  const isMeAssigned = currentUser && issue.assigneeIds.includes(currentUser.id);

  const assigneesContainerRef = useRef<HTMLDivElement>(null);
  const assigneesTrackRef = useRef<HTMLDivElement>(null);
  const [assigneesOverflow, setAssigneesOverflow] = useState(false);
  const [marqueeDuration, setMarqueeDuration] = useState('25s');

  useEffect(() => {
    const container = assigneesContainerRef.current;
    const track = assigneesTrackRef.current;
    if (!container || !track) return;

    const checkOverflow = () => {
      const containerWidth = container.clientWidth;
      const firstList = track.firstElementChild as HTMLElement;
      if (firstList) {
        const contentWidth = firstList.scrollWidth;
        const overflow = contentWidth > containerWidth;
        setAssigneesOverflow(overflow);

        if (overflow) {
          const speed = 45;
          const duration = contentWidth / speed;
          setMarqueeDuration(`${duration}s`);
        }
      }
    };

    const animId = requestAnimationFrame(checkOverflow);
    const observer = new ResizeObserver(() => {
      checkOverflow();
    });
    observer.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, [issue.assignees]);

  const renderAssigneeBadge = (name: string, index: number, isClone: boolean) => {
    const id = issue.assigneeIds[index];
    const isMe = currentUser && id === currentUser.id;
    return (
      <span key={`${id}-${index}${isClone ? '-clone' : ''}`} className={`${styles.badge} ${isMe ? styles.mine : ''}`}>
        <UserIcon width="14" height="14" /> {name}
      </span>
    );
  };

  return (
    <a href={issue.issueUrl} target="_blank" className={`${styles.card} ${isMeAssigned ? styles.mineCard : ''}`}>
      <div className={styles.header}>
        <MarqueeText text={issue.title} />
        <ExternalIcon className={styles.openIcon} width="16" height="16" />
      </div>

      {issue.assignees.length > 0 && (
        <div ref={assigneesContainerRef} className={styles.assigneesMarquee}>
          <div
            ref={assigneesTrackRef}
            className={`${styles.assigneesTrack} ${assigneesOverflow ? styles.animate : ''}`}
            style={{ '--marquee-duration': marqueeDuration } as React.CSSProperties}
          >
            <div className={styles.assigneesList}>
              {issue.assignees.map((name, index) => renderAssigneeBadge(name, index, false))}
            </div>
            {assigneesOverflow && (
              <div className={styles.assigneesList} aria-hidden="true">
                {issue.assignees.map((name, index) => renderAssigneeBadge(name, index, true))}
              </div>
            )}
          </div>
        </div>
      )}

      {displayedTranslations.length > 0 && (
        <div className={styles.translations}>
          <div className={styles.list}>
            {displayedTranslations.map(lang => (
              <span key={lang.description} className={`${styles.badge} ${lang.done ? styles.done : styles.pending}`}>
                {lang.description}{' '}
                {lang.done ? <DoneIcon width="14" height="14" /> : <TimeIcon width="14" height="14" />}
              </span>
            ))}
          </div>
        </div>
      )}

      {issue.columnName && (
        <div className={styles.footer}>
          <span className={styles.columnChip}>{issue.columnName}</span>
        </div>
      )}
    </a>
  );
});
