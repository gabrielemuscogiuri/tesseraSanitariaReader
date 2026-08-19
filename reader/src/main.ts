import { app, BrowserWindow, ipcMain, Menu, nativeImage, Tray, screen } from 'electron';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { CardData, WatchHandle } from 'tessera-sanitaria-reader';
import { watchTesseraSanitaria } from 'tessera-sanitaria-reader';

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// macOS menu bar requires a template image (monochrome, suffix "Template")
// so it adapts to light/dark mode automatically.
const TRAY_ICON_PATH =
  process.platform === 'darwin'
    ? path.join(__dirname, '../assets/iconTemplate.png')
    : path.join(__dirname, '../assets/icon.png');

const APP_ICON_PATH = path.join(__dirname, '../assets/icon.png');

const createWindow = () => {
  win = new BrowserWindow({
    width: 700,
    height: 600,
    title: 'Lettore Tessera Sanitaria',
    icon: APP_ICON_PATH,
    show: false,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      win?.hide();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    void win.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
  }
};

const createTray = () => {
  // `nativeImage.createFromPath()` può fallire se il file icona è dentro `app.asar`.
  // Leggiamo i bytes con fs e creiamo l'immagine dal buffer: funziona anche in asar.
  const icon = (() => {
    try {
      const bytes = readFileSync(TRAY_ICON_PATH);
      return nativeImage.createFromBuffer(bytes);
    } catch {
      return nativeImage.createEmpty();
    }
  })();

  tray = new Tray(icon);
  tray.setToolTip('Lettore Tessera Sanitaria');

  const menu = Menu.buildFromTemplate([
    {
      label: 'Mostra',
      click: () => {
        win?.show();
        win?.focus();
      },
    },
    { type: 'separator' },
    {
      label: 'Esci',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(menu);
  const showAsPopup = () => {
    if (!win) return;

    // Posiziona la finestra sotto l’icona in alto (menu bar / tray).
    try {
      const bounds = tray.getBounds();
      const [winW, winH] = win.getSize();

      const targetX = Math.round(bounds.x + bounds.width - winW + 6);
      const targetY = Math.round(bounds.y + bounds.height + 4);

      const display = screen.getDisplayNearestPoint({ x: targetX, y: targetY });
      const work = display.workArea;

      const clampedX = Math.min(Math.max(work.x, targetX), work.x + work.width - winW);
      const clampedY = Math.min(Math.max(work.y, targetY), work.y + work.height - winH);

      win.setPosition(clampedX, clampedY, false);
    } catch {
      // ignore positioning errors
    }

    win.show();
    win.focus();
    // Temporaneamente in primo piano (popup), poi torna normale.
    win.setAlwaysOnTop(true, 'floating');
    win.once('blur', () => {
      try {
        win?.setAlwaysOnTop(false);
      } catch {
        // ignore
      }
    });
  };

  // macOS: click sulla tray/menu bar per mostrare la finestra.
  tray.on('click', () => showAsPopup());
  tray.on('double-click', () => showAsPopup());
};

app.whenReady().then(() => {
  // Hide the big icon in the Dock: we rely on the menu bar / tray instead.
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  createWindow();
  createTray();

  // pcsclite runs here in the main process — never in the renderer.
  const handle: WatchHandle = watchTesseraSanitaria({
    onReader: (readerName: string) => {
      win?.webContents.send('tessera:reader', { readerName });
    },
    onCard: (data: CardData, meta: { readerName: string }) => {
      win?.show();
      win?.focus();
      win?.webContents.send('tessera:card', { data, readerName: meta.readerName });
    },
    onRemove: (meta: { readerName: string }) => {
      win?.webContents.send('tessera:remove', { readerName: meta.readerName });
    },
    onError: (error: Error) => {
      win?.webContents.send('tessera:error', { message: error.message });
    },
  });

  app.on('before-quit', () => {
    isQuitting = true;
    handle.close();
  });

  app.on('window-all-closed', () => {
    // Do NOT quit — the tray keeps the app alive.
  });

  app.on('activate', () => {
    if (win) {
      win.show();
      win.focus();
    } else {
      createWindow();
    }
  });

  ipcMain.handle('tessera:ping', () => ({ ok: true }));
});
