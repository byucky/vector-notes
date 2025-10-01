import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Observable, Subject, takeUntil } from 'rxjs';
import { NoteEmbeddingDto } from '../../utilities/dtoUtility';
import { NoteStateService } from '../../services/note-state.service';

@Component({
  selector: 'search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule
  ]
})
export class SearchResultsComponent implements OnInit, OnDestroy {
  searchResults: NoteEmbeddingDto[] = [];
  private destroy$ = new Subject<void>();

  constructor(private noteStateService: NoteStateService) {}

  ngOnInit(): void {
    this.noteStateService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.searchResults = state.searchResults;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onResultClick(result: NoteEmbeddingDto): void {
    // Select the note and clear search results
    this.noteStateService.selectNote(result.noteId);
    this.noteStateService.clearSearchResults();
  }

  onBackToNotes(): void {
    // Clear search results to go back to note editor
    this.noteStateService.clearSearchResults();
  }

  /**
   * Highlight the idea text in the content by bolding it
   */
  highlightIdea(content: string, idea: string): string {
    if (!idea || !content) return content;
    
    // Create a regex that matches the idea text, case insensitive
    const regex = new RegExp(`(${this.escapeRegex(idea)})`, 'gi');
    return content.replace(regex, '<strong>$1</strong>');
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
