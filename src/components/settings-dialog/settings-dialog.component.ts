import { Component, inject } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDialogRef } from "@angular/material/dialog";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialogModule } from "@angular/material/dialog";

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
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatDialogModule
    ]
})

export class SettingsDialogComponent {
    readonly dialogRef = inject(MatDialogRef<SettingsDialogComponent>);
    // readonly OpenAIKey = inject(OpenAIKey);
    
    openaiKeyControl = new FormControl('');
    originalOpenaiKey = '';
    
    constructor() {
        console.log('SettingsDialogComponent');
        // Initialize the form control with the current value from Electron store
        this.loadApiKey();
    }

    private async loadApiKey(): Promise<void> {
        try {
            // Use Electron's IPC to get the API key from the main process
            const savedKey = await window.electron.ipcRenderer.invoke('get-api-key') || '';
            this.openaiKeyControl.setValue(savedKey);
            this.originalOpenaiKey = savedKey;
        } catch (error) {
            console.error('Failed to load API key:', error);
            this.openaiKeyControl.setValue('');
            this.originalOpenaiKey = '';
        }
    }

    closeDialog(): void {
        this.dialogRef.close();
    }
    
    async saveSettings(): Promise<void> {
        // Save the OpenAI API key
        const newKey = this.openaiKeyControl.value || '';
        
        // Only save if the key has changed
        if (newKey !== this.originalOpenaiKey) {
            try {
                // Use Electron's IPC to save the API key in the main process
                await window.electron.ipcRenderer.invoke('save-api-key', newKey);
                this.originalOpenaiKey = newKey;
                console.log('OpenAI API key saved successfully');
            } catch (error) {
                console.error('Failed to save API key:', error);
            }
        }
        
        // Close the dialog
        this.dialogRef.close(true);
    }
}
