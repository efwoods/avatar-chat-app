                                                                                                    
                                                                                                    
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
                       │                     │  → interacts with PostgreSQL                         
                       │  /health            │                                                      
                       │  /metrics           │  → handles WebSocket transcription                   
                       │  /transcriptions/*  │                                                      
                       │  /media/*           │                                                      
                       │  /avatars/*         │                                                      
                       │  /login             │                                                      
                       │  /logout            │                                                      
                       │  /signup            │                                                      
                       │                     │                                                      
                       └────────┬────────────┘                                                      
                                │                                                                   
                                │                                                                   
                                ▼                                                                   
                       ┌─────────────────────┐                                                      
                       │ Redis Session Cache │                                                      
                      ┌┴────────────────────┬┘                                                      
                      │                     │                                                       
                      │                     │      On Cache Miss                                    
                      │                     │                                                       
   ┌──────────────────▼──┐               ┌──▼──────────────────┐                                    
   │  PostgreSQL DB      │               │ Mongodb Object DB   │                                    
   └─────────────────────┘               └─────────────────────┘                                    
                                                                                                    
           → Stores User Login Info                    → Stores Image, Video, Text, Audio, Neural Da
                                                                                                    
           → Stores Avatar Info Per User               → Stores Data per Avatar Per User            
                                                                                                    
                                                       → Stores Trained Models Per Avatar Per User  
                                                                                                    
                                                                                                    
                                                                                                    

                                                                                                                                                                                                     
The react frontend goes to an ngrok tunnel then to the fast api.
The fast api searches the redis cache for session information. 
On a cache miss, User and Per user avatar information is searched or created in the PostgresDB
On a cache miss for object media, user and Per avatar information is searched in the Mongodb Object store. The session should initially load the list of created avatars. On selection, the avatar selected should load the previous message and all relevant media data into session memory from the mongodb. 

---

✅ Architecture Summary
Frontend (React)

    Connects to the FastAPI backend via HTTPS + WSS via ngrok.

    JWT stored in memory (or sessionStorage) sent in Authorization header as Bearer <token>.

Backend (FastAPI)

    Handles authentication, avatar CRUD, message logging, real-time WebSocket transcription, and serves static/streaming media.

    Relies on:

        Redis: For low-latency session & avatar metadata cache.

        PostgreSQL: Persistent structured data (users, avatars, metadata).

        MongoDB: Stores large objects (audio, video, text logs, embeddings, models).

🧠 High-Level System Behavior
On Load:

    React client authenticates with JWT (/login or /signup).

    FastAPI checks Redis cache for session and avatar list:

        If missing → fetch from PostgreSQL → store in Redis.

    React receives list of avatars → displayed in sidebar.

On Avatar Selection:

    React sends GET /avatars/{avatar_id} → FastAPI checks Redis:

        If Redis miss → pull metadata from PostgreSQL and media from MongoDB.

        All messages, media, context, and embedding data preloaded into memory.

    WebSocket transcription begins and audio is streamed (via AudioStreamer.jsx).

    React frontend displays chat history, real-time messages, and associated avatar context.