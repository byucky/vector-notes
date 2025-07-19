import { Component, ViewChildren, QueryList, ElementRef, Renderer2 } from "@angular/core";
import { Note } from "./note";

@Component({
    selector: 'note-editor',
    templateUrl: './note-editor.component.html',
    styleUrls: ['./note-editor.component.scss']
})

export class NoteEditorComponent {
    note: Note;

    constructor(private renderer: Renderer2) {}

    onTitleChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.note.onTitleChange(input.value);
    }

    onContentChange(event: Event) {
        const textarea = event.target as HTMLTextAreaElement;
        this.note.onContentChange(textarea.value);
    }
}