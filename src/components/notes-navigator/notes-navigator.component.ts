import { Component, OnInit, OnDestroy } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { CommonModule } from "@angular/common";
import { Note } from "../note-editor/note";
import { NoteStateService, NoteState } from "../../services/note-state.service";
import { Subscription } from "rxjs";

@Component({
    selector: 'notes-navigator',
    templateUrl: './notes-navigator.component.html',
    styleUrls: ['./notes-navigator.component.scss'],
    imports: [
        MatIconModule,
        MatButtonModule,
        MatListModule,
        CommonModule,
    ]
})

export class NotesNavigatorComponent implements OnInit, OnDestroy {
    notes: Note[] = [];
    selectedNoteId: string | null = null;
    loading: boolean = false;
    private subscription: Subscription;

    constructor(private noteStateService: NoteStateService) {
        console.log('NotesNavigatorComponent');
    }

    ngOnInit() {
        this.subscription = this.noteStateService.state$.subscribe((state: NoteState) => {
            this.notes = state.notes;
            this.loading = state.loading;
            this.selectedNoteId = state.selectedNote?.id || null;
        });
        
        this.noteStateService.loadNotes();
    }

    ngOnDestroy() {
        if (this.subscription) {
            this.subscription.unsubscribe();
        }
    }

    /**
     * Handle note selection when a note is clicked
     * @param note The selected note
     */
    onNoteClick(note: Note) {
        this.noteStateService.selectNote(note.id);
        console.log('Note selected:', note);
    }

    /**
     * Create a new note
     */
    async createNewNote() {
        await this.noteStateService.createNote();
    }

    /**
     * Format the note title for display
     * @param note The note to format
     * @returns Formatted title
     */
    getNoteTitle(note: Note): string {
        return note.title || 'Untitled';
    }

    /**
     * Format the note's last modified date
     * @param note The note to format
     * @returns Formatted date string
     */
    getNoteDate(note: Note): string {
        if (!note.updated_at) return '';
        
        const date = new Date(note.updated_at);
        return date.toLocaleDateString();
    }
}