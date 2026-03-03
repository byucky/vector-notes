import type { Note } from '../../../src/domain/note';

export function NoteEditor(props: { note: Note | null; onChange: (note: Note) => void }) {
  if (!props.note) {
    return (
      <div className="panel editorPanel">
        <div className="muted editorEmpty">Select a note (or create a new one) to start writing.</div>
      </div>
    );
  }

  return (
    <div className="panel editorPanel">
      <input
        className="input editorTitle"
        value={props.note.title}
        onChange={(e) => {
          props.note.onTitleChange(e.target.value);
          props.onChange(props.note);
        }}
        placeholder="Title"
      />

      <textarea
        className="input editorBody"
        value={props.note.content}
        onChange={(e) => {
          props.note.onContentChange(e.target.value);
          props.onChange(props.note);
        }}
        placeholder="Write your note…"
      />
    </div>
  );
}

