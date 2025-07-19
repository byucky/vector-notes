export interface INote {
    id: string;
    title: string;
    content: string;
    created_at?: number;
    updated_at?: number;
}

export class Note {
    id: string;
    title: string;
    content: string;
    created_at?: number;
    updated_at?: number;

    constructor(
        id: string = '',
        title: string = '',
        content: string = '',
        created_at?: number,
        updated_at?: number
    ) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    onTitleChange(title: string) {
        this.title = title;
    }

    onContentChange(content: string) {
        this.content = content;
    }
}