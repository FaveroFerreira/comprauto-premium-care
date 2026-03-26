import { useEffect, useState } from 'react';
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { Download, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [installing, setInstalling] = useState(false);
  const [progress, setProgress] = useState('');
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    checkForUpdate();
  }, []);

  async function checkForUpdate() {
    try {
      const update = await check();
      if (update) {
        setUpdateAvailable(true);
        setNewVersion(update.version);
      }
    } catch {
      // Silently ignore update check failures
    }
  }

  async function installUpdate() {
    try {
      setInstalling(true);
      setProgress('Baixando atualização...');
      const update = await check();
      if (!update) return;

      await update.downloadAndInstall((event) => {
        if (event.event === 'Started' && event.data.contentLength) {
          setProgress(`Baixando... 0%`);
        } else if (event.event === 'Progress') {
          setProgress(`Baixando...`);
        } else if (event.event === 'Finished') {
          setProgress('Instalando...');
        }
      });

      setProgress('Reiniciando...');
      await relaunch();
    } catch {
      setInstalling(false);
      setProgress('');
    }
  }

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-start gap-3">
        <Download className="h-5 w-5 text-primary mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-sm">Nova versão disponível</p>
          <p className="text-sm text-muted-foreground">
            Versão {newVersion} está pronta para instalar.
          </p>
          {progress && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              {progress}
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={installUpdate} disabled={installing}>
              {installing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Atualizar
            </Button>
            {!installing && (
              <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                Depois
              </Button>
            )}
          </div>
        </div>
        {!installing && (
          <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
