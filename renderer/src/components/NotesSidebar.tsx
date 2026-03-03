import type { Note } from '../../../src/domain/note';

export function NotesSidebar(props: {
  notes: Note[];
  selectedNoteId: string | null;
  loading: boolean;
  onSelectNote: (id: string) => void;
  onCreateNewNote: () => void;
}) {
  return (
    <div className="panel sidebarPanel">
      <div className="sidebarHeader">
        <div className="sidebarTitle">Notes</div>
        <button className="btn btnPrimary" onClick={props.onCreateNewNote}>
          + New
        </button>
      </div>

      <div className="sidebarBody">
        {props.loading ? <div className="muted sidebarEmpty">Loading notes…</div> : null}

        {!props.loading && props.notes.length === 0 ? (
          <div className="muted sidebarEmpty">No notes yet. Create your first note.</div>
        ) : null}

        <ul className="notesList">
          {props.notes.map((n) => {
            const selected = props.selectedNoteId === n.id;
            return (
              <li key={n.id}>
                <button
                  className={`noteRow ${selected ? 'noteRowSelected' : ''}`}
                  onClick={() => props.onSelectNote(n.id)}
                >
                  <div className="noteRowTitle">{n.title?.trim() ? n.title : 'Untitled'}</div>
                  <div className="noteRowMeta">{formatDate(n.updated_at)}</div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function formatDate(updatedAt?: number) {
  if (!updatedAt) return '';
  try {
    return new Date(updatedAt).toLocaleDateString();
  } catch {
    return '';
  }
}

