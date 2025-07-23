import { Component, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef } from "@angular/material/dialog";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialogModule } from "@angular/material/dialog";
import { AppSettings } from "../../services/settings.service";
import { FormsModule } from "@angular/forms";

// Electron imports
declare const window: any;

@Component({
    selector: 'settings-dialog',
    templateUrl: './settings-dialog.component.html',
    styleUrls: ['./settings-dialog.component.scss'],
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule,
        FormsModule
    ]
})
export class SettingsDialogComponent {
    readonly dialogRef = inject(MatDialogRef<SettingsDialogComponent>);

    settings: AppSettings = {
        openaiApiKey: '',
    };
    
    constructor() {
        // Load settings from Electron
        window.electron.ipcRenderer.invoke('get-settings').then((loadedSettings: AppSettings) => {
            this.settings = { ...this.settings, ...loadedSettings };
        });
    }

    closeDialog(): void {
        this.dialogRef.close();
    }
    
    async saveSettings(): Promise<void> {
        try {
            // Save the entire settings object
            await window.electron.ipcRenderer.invoke('save-settings', this.settings);
            console.log('settings saved successfully');
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
        
        // Close the dialog
        this.dialogRef.close(true);
    }
}
