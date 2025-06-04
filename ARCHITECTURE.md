┌───────────────────────────┐
│       Public Client       │
│ (browser, script, mobile) │
└────────────┬──────────────┘
             │ HTTPS / WSS
             ▼
     ┌────────────────────┐
     │     ngrok tunnel   │ ◄─── exposes HTTPS + WSS
     │ https://xyz.ngrok.io
     └────────┬───────────┘
              ▼
      ┌─────────────────────┐
      │    FastAPI app      │
      ├─────────────────────┤
      │  /api/db/*          │  → interacts with PostgreSQL
      │  /api/health        │
      │  /ws                │  → handles WebSocket transcription
      └────────┬────────────┘
               ▼
      ┌─────────────────────┐
      │  PostgreSQL DB      │
      └─────────────────────┘
