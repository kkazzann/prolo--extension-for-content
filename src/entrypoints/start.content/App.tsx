import { useState } from 'react';
import { IssueBoard } from './components/IssueBoard';
import styles from './App.module.scss';
import ViewIcon from '@iconify-react/lets-icons/view';

function App() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(true);

  return (
    <>
      <div className={`${styles.overlay} ${!isOverlayVisible ? styles.hidden : ''}`}>
        <div className={styles.topBar} onClick={() => setIsOverlayVisible(false)}>
          Hide Overlay
        </div>

        <div className={styles.content}>
          <IssueBoard boardId={8} status="open" />
        </div>
      </div>

      {!isOverlayVisible && (
        <button className={styles.showButton} onClick={() => setIsOverlayVisible(true)}>
          <ViewIcon width="20" height="20" />
          Show Board
        </button>
      )}
    </>
  );
}

export default App;
