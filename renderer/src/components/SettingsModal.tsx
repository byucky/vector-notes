import { useEffect, useState } from 'react';
import type { AppSettings } from '../../../src/ipc/settingsApi';
import { settingsApi } from '../../../src/ipc/settingsApi';

export function SettingsModal(props: { onClose: () => void }) {
  const [settings, setSettings] = useState<AppSettings>({ openaiApiKey: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void settingsApi.getSettings().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save() {
    setSaving(true);
    try {
      await settingsApi.saveSettings(settings);
      props.onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalBackdrop" role="dialog" aria-modal="true">
      <div className="modal panel">
        <div className="modalHeader">
          <div className="modalTitle">Settings</div>
          <button className="btn" onClick={props.onClose}>
            Close
          </button>
        </div>

        <div className="modalBody">
          <label className="fieldLabel">
            <div>OpenAI API Key</div>
            <input
              className="input"
              value={settings.openaiApiKey}
              onChange={(e) => setSettings((s) => ({ ...s, openaiApiKey: e.target.value }))}
              placeholder="sk-..."
              autoFocus
            />
            <div className="muted fieldHint">Stored locally in your Electron user data folder.</div>
          </label>
        </div>

        <div className="modalFooter">
          <button className="btn" onClick={props.onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btnPrimary" onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

