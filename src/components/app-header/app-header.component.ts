import { Component, inject, Input, Output, EventEmitter } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog } from "@angular/material/dialog";
import { SettingsDialogComponent } from "../settings-dialog/settings-dialog.component";
import { NoteSearchComponent } from "../note-search/note-search.component";

@Component({
    selector: 'app-header',
    templateUrl: './app-header.component.html',
    styleUrls: ['./app-header.component.scss'],
    imports: [
        MatIconModule,
        MatButtonModule,
        NoteSearchComponent,
    ]
})

export class AppHeaderComponent {
    @Input() sidenavOpened: boolean = true;
    @Output() toggleSidebar = new EventEmitter<void>();
    
    readonly dialog = inject(MatDialog);

    constructor() {
        console.log('AppHeaderComponent');
    }

    onToggleSidebar() {
        this.toggleSidebar.emit();
    }

    openSettingsDialog() {
        this.dialog.open(SettingsDialogComponent, {
            width: '700px',
            maxWidth: '90vw',
            minHeight: '400px'
        });
    }
}