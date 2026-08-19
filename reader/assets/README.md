# assets/

Icone dell'app desktop. Sostituisci i file placeholder prima di distribuire.

| File        | Formato                               | Usato da                    |
| ----------- | ------------------------------------- | --------------------------- |
| `icon.png`  | PNG 256×256 o superiore               | Linux AppImage, tray icon   |
| `icon.ico`  | ICO multi-size (256, 128, 64, 32, 16) | Windows installer e taskbar |
| `icon.icns` | ICNS                                  | macOS .app e Dock           |

## Come generare `.ico` e `.icns` dall'immagine PNG

Con [sharp-cli](https://github.com/nicktindall/sharp-cli) o tool equivalenti:

```bash
# .ico (multi-size) — usa png2ico, ImageMagick, o il sito favicon.io
magick icon.png -define icon:auto-resize=256,128,64,32,16 icon.ico

# .icns (macOS) — su macOS con iconutil
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
iconutil -c icns icon.iconset
```
