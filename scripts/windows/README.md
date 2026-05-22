# SnapSpend Windows Local Launcher

This launcher runs SnapSpend locally on Windows with:

- Django backend at `http://127.0.0.1:8000`
- React/Vite frontend at `http://localhost:5173`
- SQLite database at `backend\db.sqlite3`

It installs `backend\requirements.txt`, runs `npm install`, applies Django migrations, seeds categories, and opens the frontend in your browser.

## Prerequisites

- Python 3.11+ with `py` or `python` on PATH
- Node.js 18+ with `npm` on PATH
- Tesseract OCR if you want bill scanning: <https://github.com/UB-Mannheim/tesseract/wiki>

## Run Without Building EXE

Double-click:

```text
Start-SnapSpend-Windows.cmd
```

## Build The EXE

Open Windows PowerShell from the project root and run:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\windows\Build-SnapSpend-Launcher.ps1
```

That creates:

```text
SnapSpendLocal.exe
```

Keep `SnapSpendLocal.exe` in the project root beside the `scripts`, `backend`, and `frontend` folders.

## Faster Subsequent Runs

After dependencies are already installed, you can skip reinstalling packages:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\windows\Start-SnapSpend.ps1 -SkipInstall
```
