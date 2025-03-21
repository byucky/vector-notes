import { Component, ViewChildren, QueryList, ElementRef, Renderer2 } from "@angular/core";
import { Note } from "./note";

@Component({
    selector: 'note-editor',
    templateUrl: './note-editor.component.html',
    styleUrls: ['./note-editor.component.scss']
})

export class NoteEditorComponent {
    @ViewChildren('thoughtTextarea') thoughtTextareas: QueryList<ElementRef>;
    focusIndex: number | null = null;
    note: Note;

    constructor(private renderer: Renderer2) {
        this.note = new Note();

        if (this.note.thoughts.length === 0) {
            this.note.addThought('');
        }
    }

    onThoughtChange(event: Event, thought: string) {
        console.log('event', event);
        const textarea = event.target as HTMLTextAreaElement;
        this.note.updateThought(thought, textarea.value);
    }

    ngAfterViewChecked() {
        if (this.focusIndex !== null) {
            const textarea = this.thoughtTextareas.toArray()[this.focusIndex];
            if (textarea) {
                this.renderer.selectRootElement(textarea.nativeElement).focus();
                this.focusIndex = null;
            }
        }
    }

    onEnterKey(event: KeyboardEvent, thoughtIndex: number) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            
            if (this.note.thoughts.length - 1 <= thoughtIndex) {
                this.note.addThought('');
            }
            
            // Set the focus index to the next thought
            this.focusIndex = thoughtIndex + 1;
        }
    }
}