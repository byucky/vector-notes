import { Component } from "@angular/core";
import { MatInputModule } from "@angular/material/input";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { NoteService } from "../../services/note.service";
import { NoteStateService } from "../../services/note-state.service";

@Component({
    selector: 'note-search',
    templateUrl: './note-search.component.html',
    styleUrls: ['./note-search.component.scss'],
    standalone: true,
    imports: [
        MatInputModule,
        FormsModule,
        MatIconModule,
        MatButtonModule,
    ]
})
export class NoteSearchComponent {
    searchQuery: string = '';

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
        if (this.searchQuery.trim()) {
            const similarNotes = await this.noteService.searchSimilarNotes(this.searchQuery.trim());
            this.noteStateService.setSearchResults(similarNotes);
        }
    }
}