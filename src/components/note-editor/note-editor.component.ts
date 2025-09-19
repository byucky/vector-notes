import { Component, Renderer2, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Note } from "./note";
import { NoteStateService, NoteState } from "../../services/note-state.service";
import { Subscription } from "rxjs";

@Component({
    selector: 'note-editor',
    templateUrl: './note-editor.component.html',
    styleUrls: ['./note-editor.component.scss'],
    imports: [CommonModule],
    standalone: true
})

export class NoteEditorComponent implements OnInit, OnDestroy {
    note: Note | null = null;
    private subscription: Subscription;

    constructor(
        private renderer: Renderer2,
        private noteStateService: NoteStateService
    ) {}

    ngOnInit() {
        this.subscription = this.noteStateService.state$.subscribe((state: NoteState) => {
            this.note = state.selectedNote;
        });
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    onTitleChange(event: Event) {
        if (!this.note) return;
        
        const input = event.target as HTMLInputElement;
        this.note.onTitleChange(input.value);
        this.noteStateService.updateNote(this.note);
    }

    onContentChange(event: Event) {
        if (!this.note) return;
        
        const textarea = event.target as HTMLTextAreaElement;
        this.note.onContentChange(textarea.value);
        this.noteStateService.updateNote(this.note);
    }
}