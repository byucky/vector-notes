import { Component } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";

@Component({
    selector: 'notes-navigator',
    templateUrl: './notes-navigator.component.html',
    styleUrls: ['./notes-navigator.component.scss'],
    imports: [
        MatIconModule,
        MatButtonModule,
    ]
})

export class NotesNavigatorComponent {
    constructor() {
        console.log('NotesNavigatorComponent');
    }
}