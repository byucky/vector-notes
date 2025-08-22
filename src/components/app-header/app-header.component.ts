import { Component, inject } from "@angular/core";
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
    readonly dialog = inject(MatDialog);

    constructor() {
        console.log('AppHeaderComponent');
    }

    openSettingsDialog() {
        this.dialog.open(SettingsDialogComponent, {
            width: '250px'
        });
    }
}