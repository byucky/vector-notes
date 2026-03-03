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
  has_changed?: boolean;

  constructor(id: string = '', title: string = '', content: string = '', created_at?: number, updated_at?: number) {
    this.id = id;
    this.title = title;
    this.content = content;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.has_changed = false;
  }

  onTitleChange(title: string) {
    this.title = title;
    this.has_changed = true;
  }

  onContentChange(content: string) {
    this.content = content;
    this.has_changed = true;
  }
}

