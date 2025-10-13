import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { NoteService } from "../../services/note.service";
import { NoteStateService } from "../../services/note-state.service";

@Component({
    selector: 'note-search',
    templateUrl: './note-search.component.html',
    styleUrls: ['./note-search.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        MatInputModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ]
})
export class NoteSearchComponent {
    searchQuery: string = '';
    isSearching: boolean = false;

    constructor(
        private noteService: NoteService,
        private noteStateService: NoteStateService
    ) { }

    onSearch(event: Event): void {
        const target = event.target as HTMLInputElement;
        this.searchQuery = target.value;
    }

    onSearchIconClick(): void {
        this.performSearch();
    }

    onKeyPress(event: KeyboardEvent): void {
        if (event.key === 'Enter') {
            this.performSearch();
        }
    }

    private async performSearch(): Promise<void> {
        if (this.searchQuery.trim() && !this.isSearching) {
            this.isSearching = true;
            try {
                const similarNotes = await this.noteService.searchSimilarNotes(this.searchQuery.trim());
                this.noteStateService.setSearchResults(similarNotes);
            } catch (error) {
                console.error('Search error:', error);
            } finally {
                this.isSearching = false;
            }
        }
    }
}