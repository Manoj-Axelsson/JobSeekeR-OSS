# Tauri v2 Desktop Packaging Readiness Assessment

- **Target**: Desktop Packaging via Tauri v2 (Rust-backed lightweight webview wrapper for macOS, Windows, and Linux).
- **Assessment Date**: 2026-08-02
- **Status**: **Ready for Tauri v2 Integration**

---

## 1. Architectural Compatibility Matrix

| Category | Current Web State | Tauri v2 Requirement | Readiness Assessment |
| :--- | :--- | :--- | :--- |
| **Routing** | Next.js App Router | Static HTML / SSG export or local dev server | 🟢 Ready (`next export` or static output compatible) |
| **Database** | Embedded SQLite (`prisma/dev.db`) | Local SQLite / `tauri-plugin-sql` | 🟢 Ready (SQLite architecture naturally maps to native Tauri storage) |
| **Browser APIs** | Speech Synthesis (TTS), PWA Manifest | Native OS APIs / Webview Audio | 🟢 Ready (Web Speech API supported in macOS/Windows WebViews) |
| **File I/O** | PDF/Word upload via `/api/documents` | Native OS File Picker / Rust fs plugin | 🟢 Ready (Can use `tauri-plugin-dialog` or HTTP endpoints) |

---

## 2. Recommended Tauri v2 Configuration (`src-tauri/tauri.conf.json`)

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devUrl": "http://localhost:3000",
    "frontendDist": "../out"
  },
  "app": {
    "title": "JobseekeR Intelligence Suite",
    "windows": [
      {
        "title": "JobseekeR™",
        "width": 1280,
        "height": 800,
        "resizable": true
      }
    ]
  }
}
```

---

## 3. Next Steps for Native Packaging Sprint
1. Run `npx tauri init` to initialize the `src-tauri` Rust manifest.
2. Add `@tauri-apps/api` for native file drag-and-drop support.
