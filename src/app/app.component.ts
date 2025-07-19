import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NoteEditorComponent } from '../components/note-editor/note-editor.component';
import { AppHeaderComponent } from '../components/app-header/app-header.component';
import { NotesNavigatorComponent } from '../components/notes-navigator/notes-navigator.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatSlideToggleModule,
    MatSidenavModule,
    NoteEditorComponent,
    AppHeaderComponent,
    NotesNavigatorComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'Vectored Notes';
}
