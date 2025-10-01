import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Subject, takeUntil } from 'rxjs';
import { NoteEditorComponent } from '../components/note-editor/note-editor.component';
import { AppHeaderComponent } from '../components/app-header/app-header.component';
import { NotesNavigatorComponent } from '../components/notes-navigator/notes-navigator.component';
import { SearchResultsComponent } from '../components/search-results/search-results.component';
import { NoteStateService, NoteState } from '../services/note-state.service';

@Component({
  selector: 'app-root',
  imports: [
    CommonModule,
    RouterOutlet,
    MatSlideToggleModule,
    MatSidenavModule,
    NoteEditorComponent,
    AppHeaderComponent,
    NotesNavigatorComponent,
    SearchResultsComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Vectored Notes';
  private destroy$ = new Subject<void>();
  private currentState: NoteState = {
    notes: [],
    selectedNote: null,
    searchResults: [],
    loading: false
  };

  constructor(private noteStateService: NoteStateService) {}

  ngOnInit(): void {
    this.noteStateService.state$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.currentState = state;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  hasSearchResults(): boolean {
    return this.currentState.searchResults.length > 0;
  }
}
