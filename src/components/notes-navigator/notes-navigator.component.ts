import { Component, OnInit } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";
import { CommonModule } from "@angular/common";
import { Note } from "../note-editor/note";
import { NoteService } from "../../services/note.service";

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

export class NotesNavigatorComponent implements OnInit {
    notes: Note[] = [];
    selectedNoteId: string | null = null;
    loading: boolean = false;

    constructor(private noteService: NoteService) {
        console.log('NotesNavigatorComponent');
    }

    ngOnInit() {
        this.loadNotes();
    }

    /**
     * Load all notes from the database
     */
    async loadNotes() {
        this.loading = true;
        try {
            this.notes = await this.noteService.getNotes();
            console.log('Loaded notes:', this.notes);
        } catch (error) {
            console.error('Error loading notes:', error);
            this.notes = [];
        } finally {
            this.loading = false;
        }
    }

    /**
     * Handle note selection when a note is clicked
     * @param note The selected note
     */
    onNoteClick(note: Note) {
        this.selectedNoteId = note.id;
        
        // TODO: Implement note selection logic
        // This will:
        // 1. Update the selected note in the parent component
        // 2. Load the note content into the editor
        // 3. Update the UI to show the selected state
        
        console.log('Note selected:', note);
    }

    /**
     * Create a new note
     */
    async createNewNote() {
        try {
            const newNoteId = this.generateNoteId();
            const newNote = {
                id: newNoteId,
                title: '',
                content: ''
            };
            
            const success = await this.noteService.createNote(newNote);
            if (success) {
                // Reload notes to get the updated list
                await this.loadNotes();
                
                // Select the new note
                this.selectedNoteId = newNoteId;
                this.onNoteClick(new Note(newNoteId, '', ''));
            }
        } catch (error) {
            console.error('Error creating new note:', error);
        }
    }

    /**
     * Generate a unique note ID
     */
    private generateNoteId(): string {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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