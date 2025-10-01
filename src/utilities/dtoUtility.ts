export interface NoteDto {
    id: string;
    title: string;
    content: string;
    created_at: number;
    updated_at: number;
}

export interface NoteEmbeddingDto {
    id: string;
    idea: string;
    noteId: string;
    content: string;
}