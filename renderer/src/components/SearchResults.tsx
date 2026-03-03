import type { NoteEmbeddingDto } from '../../../src/ipc/dto';

export function SearchResults(props: {
  results: NoteEmbeddingDto[];
  onBack: () => void;
  onOpenResult: (noteId: string) => void;
}) {
  return (
    <div className="panel resultsPanel">
      <div className="resultsHeader">
        <div className="resultsTitle">Search Results</div>
        <button className="btn" onClick={props.onBack}>
          Back to Notes
        </button>
      </div>

      {props.results.length === 0 ? <div className="muted resultsEmpty">No search results found.</div> : null}

      <div className="resultsList">
        {props.results.map((r) => (
          <button key={r.id} className="resultCard" onClick={() => props.onOpenResult(r.noteId)}>
            <div className="resultIdea">{r.idea}</div>
            <div className="resultMeta muted">Note ID: {r.noteId}</div>
            <div
              className="resultSnippet"
              dangerouslySetInnerHTML={{ __html: highlightIdea(r.content ?? '', r.idea ?? '') }}
            />
            <div className="resultActionRow">
              <span className="btn btnPrimary">Open Note</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function highlightIdea(content: string, idea: string) {
  if (!idea || !content) return escapeHtml(content);
  const escapedIdea = escapeRegex(idea);
  const regex = new RegExp(`(${escapedIdea})`, 'gi');
  return escapeHtml(content).replace(regex, '<strong>$1</strong>');
}

function escapeRegex(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

