import { useState } from 'react';
import { SettingsModal } from './SettingsModal';
import { noteStore } from '../../../src/state/noteStore';

export function Header(props: { sidenavOpened: boolean; onToggleSidebar: () => void }) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  async function runSearch() {
    const trimmed = query.trim();
    if (!trimmed || searching) return;
    setSearching(true);
    try {
      await noteStore.search(trimmed);
    } finally {
      setSearching(false);
    }
  }

  return (
    <header className="header panel">
      <div className="headerLeft">
        <button className="btn" onClick={props.onToggleSidebar} aria-label="Toggle sidebar">
          {props.sidenavOpened ? '⟪' : '⟫'}
        </button>
        <div className="headerTitle">Vector Notes</div>
      </div>

      <div className="headerRight">
        <div className="searchBox">
          <input
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void runSearch();
            }}
            placeholder="What information are you looking for?"
            disabled={searching}
          />
          <button className="btn btnPrimary" onClick={() => void runSearch()} disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>

        <button className="btn" onClick={() => setSettingsOpen(true)}>
          Settings
        </button>
      </div>

      {settingsOpen ? <SettingsModal onClose={() => setSettingsOpen(false)} /> : null}
    </header>
  );
}

