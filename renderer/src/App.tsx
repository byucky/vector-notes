import { useEffect, useState } from 'react';
import { NoteEditor } from './components/NoteEditor';
import { NotesSidebar } from './components/NotesSidebar';
import { Header } from './components/Header';
import { SearchResults } from './components/SearchResults';
import { noteStore } from '../../src/state/noteStore';
import type { NoteState } from '../../src/state/noteStore';

export default function App() {
  const [state, setState] = useState<NoteState>(noteStore.getState());
  const hasSearchResults = state.searchResults.length > 0;
  const [sidenavOpened, setSidenavOpened] = useState(true);

  useEffect(() => {
    const sub = noteStore.state$.subscribe(setState);
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    void noteStore.loadNotes();
  }, []);

  const selectedNoteId = state.selectedNote?.id ?? null;

  return (
    <div className="appRoot">
      <Header
        sidenavOpened={sidenavOpened}
        onToggleSidebar={() => {
          setSidenavOpened((v) => !v);
        }}
      />

      <div className={`contentLayout ${sidenavOpened ? '' : 'contentLayoutCollapsed'}`}>
        {sidenavOpened ? (
          <aside className="sidebar">
            <NotesSidebar
              notes={state.notes}
              loading={state.loading}
              selectedNoteId={selectedNoteId}
              onCreateNewNote={() => void noteStore.createNote()}
              onSelectNote={(id) => void noteStore.selectNote(id)}
            />
          </aside>
        ) : null}

        <main className="main">
          {hasSearchResults ? (
            <SearchResults
              results={state.searchResults}
              onBack={() => noteStore.clearSearchResults()}
              onOpenResult={(noteId) => {
                void noteStore.selectNote(noteId);
                noteStore.clearSearchResults();
              }}
            />
          ) : (
            <NoteEditor
              note={state.selectedNote}
              onChange={(note) => void noteStore.updateNote(note)}
            />
          )}
        </main>
      </div>
    </div>
  );
}

