<div align="center">

# TAKEGRID

### Every creative decision has a story.

**A human-first AI creative development workspace for filmmakers, writers, and storytellers.**

From the first idea to **Story â†’ Scenes â†’ Shots â†’ Storyboard**, with creative feedback, continuity checks, project memory, and project-aware AI collaborationâ€”all while the creator stays in control.

**GeNarrative Clash 2026 Â· Hackathon MVP**
**Built by Team Runtime Error**

![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.1-202020?style=for-the-badge&logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/Python-AI_Backend-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-Server--Side_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Status](https://img.shields.io/badge/Status-Hackathon_MVP-FF6B5B?style=for-the-badge)

[**Download MVP ZIP**](https://github.com/kuntal-sarkar/GeNarrative-hackathon/archive/refs/heads/kuntal.zip) Â· [**MVP Source (`kuntal`)**](https://github.com/kuntal-sarkar/GeNarrative-hackathon/tree/kuntal) Â· [**Quick Start**](#quick-start--copy-paste-powershell) Â· [**Full Setup**](#getting-started--complete-windows-powershell-setup) Â· [**Team**](#meet-team-runtime-error)

[Overview](#overview) Â· [Progress](#development-progress--feature-status) Â· [Features](#features-in-detail) Â· [Architecture](#architecture--system-design) Â· [Future Voice Features](#future-ai--voice-roadmap) Â· [Roadmap](#roadmap)

</div>

---

> [!IMPORTANT]
> **Status â€” November 2026:** The TAKEGRID **hackathon MVP is feature-complete** based on development-machine testing. The latest locally tested frontend production build passed (`npm run build`; 2,164 modules transformed). Backend Python syntax compilation passed, and Global AI's automatic project creation succeeded after configuring its model fallback. **This is not a claim of fully automated end-to-end verification, production deployment, hosted database, or universal model availability.** The `kuntal` branch contains the committed MVP as of `a08e82f`; merge status of `main` should be checked separately.

## Quick Start â€” Copy/Paste PowerShell

**Windows Â· Git + Node.js + Python required Â· two terminals for running.** The commands below use the **verified MVP branch `kuntal`**, not an assumed updated `main`.

**1. Clone the app:**

```powershell
git clone --branch kuntal --single-branch https://github.com/kuntal-sarkar/GeNarrative-hackathon.git
cd GeNarrative-hackathon
```

**2. Install frontend and configure its backend URL:**

```powershell
npm ci
Set-Content -LiteralPath .env.local -Encoding ascii -Value 'VITE_API_BASE_URL=http://127.0.0.1:5000'
```

**3. Install backend in a virtual environment:**

```powershell
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

**4. Create your private backend `.env` template:**

```powershell
@'
GEMINI_API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.6-flash
TAKEGRID_BUILDER_MODELS=gemini-3.1-flash-lite,gemini-3.8-flash
FLASK_PORT=5000

# Optional image generation: Cloudflare Workers AI
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_IMAGE_MODEL=@cf/black-forest-labs/flux-1-schnell

# Optional / experimental Hugging Face configuration (not required by the verified Cloudflare image path)
HF_TOKEN=
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
'@ | Set-Content -LiteralPath .env -Encoding ascii
notepad .env
```

**5. In Notepad, replace `PASTE_YOUR_GEMINI_API_KEY_HERE` with your real Gemini API key and save.** If you need AI storyboard *image generation*, also fill in the **Cloudflare API token and account ID**. Those Cloudflare values are optional for the rest of the app. **Never paste keys into frontend `.env.local`, commit them, or share them in screenshots.**

**6. Terminal A â€” start Flask (from `backend/`):**

```powershell
.\.venv\Scripts\python.exe app.py
```

**7. Terminal B â€” open a new PowerShell terminal and start React (from the cloned repository root):**

```powershell
cd GeNarrative-hackathon
npm run dev
```

> In Terminal B, use the **actual location** you cloned to; if the new terminal starts elsewhere, `cd` to that full folder path instead. Open **http://localhost:5173** when Vite reports port `5173`. Flask should be running at **http://127.0.0.1:5000**.

**8. Verify Flask from a third terminal:**

```powershell
Invoke-RestMethod http://127.0.0.1:5000/api/health
```

You should receive a JSON response with `success: true` and a healthy status. **AI and image features depend on valid credentials, provider access and current quotas**; setup alone cannot guarantee every provider request succeeds.

> [!CAUTION]
> **Root `.env.local`** holds only `VITE_API_BASE_URL`. **`backend/.env`** holds the private Gemini/Cloudflare credentials. `.env` files and `.venv` are ignored by Git. Do not expose tokens as `VITE_*` variablesâ€”Vite includes those in browser-delivered code.

---

## Overview

Creative work rarely follows a straight line. Ideas become stories; stories become scenes; scenes become planned camera shots and storyboard frames. Meanwhile, feedback, continuity decisions and the creator's rationale can get lost between different tools.

**TAKEGRID** organizes those steps within a **project-centered creative workspace** and provides specialized, contextual AI help without treating suggestions as unquestionable final decisions.

> **AI should strengthen human creative judgmentâ€”not replace it.**

The signature experience combines **Creative Critics** (distinct visual, editorial, dialogue, audience and marketing perspectives) with **Creative Memory** (why a creator accepted, modified or rejected an idea). TAKEGRID's **Global AI** can work across selected projects, while **Project AI Chat** stays connected to a particular story world.

## The Problem We're Solving

| Challenge | Impact | TAKEGRID's response |
| --- | --- | --- |
| Fragmented writing and planning | Stories, scenes, shots and visuals live in different places | One project workspace from story to storyboard |
| One-dimensional feedback | Important creative trade-offs are missed | Five AI critic perspectives and actionable feedback |
| Continuity drift | Plot, timing, character and prop details change unexpectedly | Project-aware Continuity Checker |
| Lost creative intent | AI recommendations overwrite or obscure creator decisions | Accept, modify and disagree; keep Creative Memory |
| Weak project context | Generic AI cannot see the current work | Project AI Chat and selectable cross-project Global AI context |
| Repeated setup | Creators must construct a project from scratch | AI-assisted project builder with an optional title |

## Our Solution at a Glance

```text
                       TAKEGRID / HOME
                              |
           +------------------+-------------------+
           |                                      |
     PROJECT LIBRARY                       GLOBAL AI ASSISTANT
           |                              Cross-project analysis
   Create / Import / AI Build             Build New Project
           |                                      |
           +------------------+-------------------+
                              |
                       PROJECT WORKSPACE
                              |
              +---------------+---------------+
              |               |               |
            STORY           SCENES           SHOTS
              |               |               |
              +---------------+---------------+
                              |
                          STORYBOARD
                              |
           +------------------+------------------+
           |                  |                  |
       AI CRITICS         CONTINUITY      PROJECT AI CHAT
           |                  |                  |
           +------------------+------------------+
                              |
                      CREATIVE MEMORY
                 Human choices & rationale
                              |
                 EXPORT / BACKUP / REVISIONS
```

Project content stays tied to its project. **Global AI is not a substitute for project-scoped workflows.**

## Development Progress & Feature Status

These statuses distinguish **reported working behavior** from **still-needed QA**. "Working" means demonstrated during the project development processâ€”not guaranteed on every clone, API key or platform.

| Module | Current MVP status | Evidence / remaining checks |
| --- | --- | --- |
| Home dashboard and responsive navigation | **Implemented / working locally** | Mobile, accessibility and viewport QA remain |
| Project library & manual creation | **Implemented / working locally** | Server-side persistence and multi-user identity pending |
| AI Build New Project | **Working locally** | Automatic project creation confirmed after dedicated fallback configuration; retry/timeout edge cases pending |
| Script import (TXT, MD, selectable PDF) | **Implemented** | Scanned PDF OCR not provided; complex layouts may vary |
| Story editing & explicit Save | **Working locally** | Final unsaved-state and project-reload regression checks |
| AI story editing and review flow | **Working locally** | Creator review / approval retained; check generated edits before saving |
| AI scene breakdown & scene CRUD | **Working locally** | Long-story and unusual-format stress tests |
| AI shot generation & shot planner | **Working locally** | Scene-to-shot consistency QA |
| Characters / Character Bible | **Working locally** | Context accuracy and saved-data review |
| Storyboard planning | **Working locally** | Image-generation provider configuration and visual QA |
| Creative Critics (five perspectives) | **Working locally** | Reimagine, consensus and long-input edge-case QA |
| Creative Memory | **Working locally** | Project-isolated CRUD, decisions and context tested; database pending |
| Continuity Checker | **Working locally** | False-positive/long-project evaluations pending |
| Project AI Chat | **Working locally** | Chat context, revision prompts and error-handling refinements tested |
| Global AI Chat | **Working locally** | Selected projects, Markdown, history, feedback and attachments implemented |
| Chat history / pin / copy / reactions | **Implemented / working locally** | Browser-level persistence; multi-device sync not yet available |
| Export & Backup / version workflows | **Implemented** | Restore and cross-device import QA recommended |
| Model routing / fallback | **Implemented, partly verified** | Project-builder primary `503` then invalid fallback `404` was fixed using explicit working route; quota/capacity vary |
| Cloudflare storyboard image generation | **Backend integrated** | Requires account credentials/credits; test separately |
| Request cancellation | **Frontend cancellation works for UI** | Already-started provider work may continue on server |
| Frontend production build | **Passed** | Vite 8.3.5; chunk-size warning only |
| Backend Python syntax | **Passed** | Compilation is not an end-to-end service test |
| Hosted DB, login, collaboration, public deployment | **Not implemented/verified** | Upcoming database, authentication, hosting phase |

> [!NOTE]
> **MVP ready â‰  production ready.** Projects and conversations are currently stored largely in browser storage. They can disappear when site data is cleared and do not automatically sync across devices. Export backups before clearing browser data or changing storage architecture.

## Features in Detail

### 1. Home Dashboard & Global AI

The dashboard gives direct access to recent projects and the Global AI assistant. Global AI supports **multi-project selection**, project comparison, conversational brainstorming, a compact history panel with pinning, upload context, message copy/feedback, and a separate **Build New Project** flow. A project-creation form accepts a required project idea/type plus an **optional name**, asks AI for a project proposal and uses the existing project save workflow to create/open the project when generation succeeds. Creator data is not fabricated to fill empty states.

### 2. Project Library, Creation & Import

Create/manage projects manually, import supported written scripts, or use the AI Project Builder. PDF import works for **selectable-text PDFs**; scans require separate OCR. Cancelling a flow must not silently create an empty project.

### 3. Story Studio

Write or edit your actual story; control when edits are saved. Use AI to explore alternatives and review changes before committing them. Project AI Chat can suggest changes to exact story passages instead of silently rewriting the entire work.

### 4. Scene Breakdown & Shot Planner

Scenes describe narrative events and locations. Shots describe camera placement, framing, direction and visual execution. Both have distinct project-specific planning screens. AI-assisted breakdown and shot generation send requests to backend services rather than using local fake regex parsing.

### 5. Characters / Character Bible

Generate and review character details based on the project's current content. Character continuity should remain anchored to the actual story and saved project state.

### 6. Storyboard & Images

Organize shots into storyboard frames. AI storyboard image generation uses the **Cloudflare Workers AI** integration when configured. **Gemini and Cloudflare credentials are separate.** Image results can be slow, limited or require paid credits; a visible UI button is not a promise of free unlimited generation.

### 7. Creative Critics & Reimagine

| Perspective | Reviews |
| --- | --- |
| **Visual Director** | Cinematography, composition and visual storytelling |
| **Story Editor** | Plot, structure, pacing, stakes and character arcs |
| **Copywriter** | Dialogue, language, tone and clarity |
| **Audience Perspective** | Emotional engagement and comprehensibility |
| **Marketing Perspective** | Positioning, discoverability and likely audience fit |

Show differentiated review feedback, grounded consensus where supported, and a focused **Reimagine** option. AI suggestions remain proposals for human review, not automatic creative decisions.

### 8. Creative Memory

Record the creator's decisions, reasons and intentional disagreements. Project-specific memory can be selected as relevant context for later AI help. Local persistence currently needs database migration for durable, multi-device access.

### 9. Continuity Checker

Analyze timeline, characters, locations, scene logic, object details and contradictions. Results are suggestions; an intentional change may be correct even when an AI flags it.

### 10. Project AI Chat

Use a project-specific contextual conversation to brainstorm, review the current story, generate proposed edits, and deliberately save accepted changes. The UI includes a floating composer, readable Markdown, chat history and generation states. AI outputs may contain mistakesâ€”verify important details.

### 11. Version History, Export & Backup

Use the existing project review/export tools to protect work and track revisions where available. **Do not assume that a browser export equals cloud backup.** Test import/restore before relying on it for migration.

### 12. Responsive Experience

Desktop and mobile use distinct navigation layouts, with compact pill-shaped controls, clean project sections and intentional scrolling. Core palette is documented below.

## Future AI & Voice Roadmap

**Planned only â€” none of these Live Audio features should be presented as implemented.** Model IDs and usage quotas can change; confirm your project's real availability in Google AI Studio before selecting one.

| Planned feature | Candidate model / API | Experience | Priority |
| --- | --- | --- | --- |
| **Voice-to-Story / voice input** | Gemini 3.5 Transcribe Live (`gemini-3.5-transcribe-live`) | Dictate prompts, dialogues and story notes into editable text | **First** |
| **Director's voice notes** | Transcribe Live + existing text AI | Turn spoken scene instructions into reviewable edits | **First** |
| **Script / scene read-aloud** | Dedicated TTS model (e.g. Gemini Flash TTS), **not necessarily Live API** | Listen to drafts and dialogue pacing | **Second** |
| **AI dialogue rehearsal** | Gemini 3.8 Live (`gemini-3.8-live`) | Role-play characters in an audio conversation | **Later** |
| **Live creative director** | Gemini 3.8 Live | Hands-free spoken brainstorming with interruptions | **Later** |
| **Multilingual voice translation** | Gemini 3.5 Live Translate | Explore delivery in other languages | **Later** |
| **Deeper voice reasoning** | Gemini 3.8 Live Extended Thinking | More complex live story discussions | **Experimental** |
| **Agentic research / automation** | Separate approved agent architecture, not a chat-model drop-in | Multi-step task orchestration | **Research** |

**Architecture plan:** React microphone permission â†’ secure server-controlled streaming connection / Live API â†’ text or audio output â†’ creator review before editing saved content. A traditional Flask JSON POST endpoint is **not** a substitute for a bidirectional Live Audio connection. Never expose a long-lived Gemini API key in browser source. Audio costs/quotas, streaming reconnects, consent and retention rules must be assessed before rollout.

References: [Gemini models](https://ai.google.dev/gemini-api/docs/models) Â· [Live API](https://ai.google.dev/gemini-api/docs/live-api) Â· [Live transcription](https://ai.google.dev/gemini-api/docs/live-api/live-transcribe) Â· [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits).

## Design System & UX Direction

| Role | Color |
| --- | --- |
| Main background | `#FFF4DC` â€” warm cream |
| Primary highlight | `#FF6B5B` â€” coral |
| Structural text | `#172A46` â€” deep navy |
| Secondary accent | `#1B93F5` â€” blue |
| Cards, search and input surfaces | White / subtle warm neutral |

Modern, restrained, mobile-friendly UI with separate JSX/CSS components, purposeful motion, clean readable controls and **no dummy project data, canned AI responses or fake parsing**.

## Architecture & System Design

```text
Browser / React 19 + Vite 8
           |
           +--> Local browser state / project data
           |    (future: authenticated database)
           |
           +--> Flask API on 127.0.0.1:5000
                     |
                     +--> Project AI endpoints
                     +--> Global AI / Project Builder
                     +--> Model router + failover
                     |       |
                     |       +--> Google Gemini API
                     |
                     +--> Image generation service
                             |
                             +--> Cloudflare Workers AI

Future: users + ownership + MySQL + migrations + media storage + auth
```

### Current technology

| Area | Technology |
| --- | --- |
| UI | React 19, Vite 8 |
| Routing | React Router 7 |
| Styling & animations | CSS, Tailwind 4, Motion |
| Icons | Lucide React |
| State | Zustand and browser-local storage |
| PDF import | `pdfjs-dist` |
| API backend | Python, Flask, Flask-CORS |
| Text AI | `google-genai` SDK and task-based model router |
| HTTP/network | `httpx`, `requests` |
| Image AI | Cloudflare Workers AI (optional credentials) |
| Database | **Planned MySQL integration; not deployed** |

The repo's `package.json` and `backend/requirements.txt` are the authority for installed dependencies. Prefer `npm ci` when the lockfile is present and `pip install -r requirements.txt` rather than manually installing individual packages.

### Current AI model routing

The backend configures separate model priorities by AI task. The **Project Builder** supports an override via `TAKEGRID_BUILDER_MODELS` and a working development configuration was:

```dotenv
TAKEGRID_BUILDER_MODELS=gemini-3.1-flash-lite,gemini-3.8-flash
```

The first model has previously returned `503`; a former `gemini-2.5-flash-lite` fallback returned `404`. The updated override enabled a successful project creation **on the development machine**, but availability can vary by account and time. Other optional overrides implemented in `backend/services/gemini_model_router.py` include `TAKEGRID_CHAT_MODELS`, `TAKEGRID_STORY_MODELS`, `TAKEGRID_CRITICS_MODELS`, `TAKEGRID_SCENES_MODELS`, `TAKEGRID_SHOTS_MODELS`, `TAKEGRID_CHARACTERS_MODELS` and `TAKEGRID_CONTINUITY_MODELS`. Use them only if you understand the quotas and capabilities of selected models.

**Quota reminder:** Provider limits may be based on RPM, TPM and RPDâ€”not simply a displayed "Unlimited" count. A model shared between different features also shares the applicable project quota.

## Project Structure

```text
GeNarrative-hackathon/
â”œâ”€â”€ public/                   # Public assets
â”œâ”€â”€ src/
â”‚   â”œâ”€â”€ components/
â”‚   â”‚   â”œâ”€â”€ home/             # Dashboard + Global AI
â”‚   â”‚   â”œâ”€â”€ studio/           # Story, scenes, shots, storyboard
â”‚   â”‚   â”œâ”€â”€ workspace/        # Project chat, Critics, Memory, Continuity
â”‚   â”‚   â”œâ”€â”€ export/           # Backup / export
â”‚   â”‚   â””â”€â”€ ...
â”‚   â”œâ”€â”€ config/               # Branding / app configuration
â”‚   â”œâ”€â”€ pages/                # Project and dashboard pages
â”‚   â”œâ”€â”€ services/             # workspaceApi, globalAI, transfer services
â”‚   â””â”€â”€ main.jsx
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ app.py
â”‚   â”œâ”€â”€ requirements.txt
â”‚   â”œâ”€â”€ routes/
â”‚   â”‚   â”œâ”€â”€ ai_routes.py
â”‚   â”‚   â”œâ”€â”€ project_ai_routes.py
â”‚   â”‚   â””â”€â”€ global_ai_routes.py
â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”œâ”€â”€ gemini_model_router.py
â”‚   â”‚   â”œâ”€â”€ global_ai_service.py
â”‚   â”‚   â”œâ”€â”€ brand_identity.py
â”‚   â”‚   â””â”€â”€ ...
â”‚   â””â”€â”€ utils/
â”œâ”€â”€ package.json
â”œâ”€â”€ package-lock.json          # npm lockfile (if present)
â”œâ”€â”€ vite.config.js
â”œâ”€â”€ TEAM_SETUP.md
â”œâ”€â”€ FRAMEFORGE_PROJECT_CONTEXT.md  # Historical document: old project name
â””â”€â”€ README.md
```

The repository contains the **frontend at its root** and the **backend under `backend/`**. You do **not** need to separately clone the developer's `frameforge-backend` working directory.

## Getting Started â€” Complete Windows PowerShell Setup

**All commands are collected here in order.** Follow each step once, then use [Daily Start Commands](#daily-start-commands) for subsequent sessions.

### 0. Install prerequisites

Install **Git**, **Node.js compatible with Vite 8** (Node 20.19+ or 22.12+ as a baseline; use an actively supported LTS), and **Python 3 with pip**. Python package wheels for newer interpreter versions can vary; if installing pinned dependencies fails on a very new Python, use a supported Python release in a fresh venv. Verify in PowerShell:

```powershell
git --version
node --version
npm --version
py --version
```

If `py` is not recognized, install Python Launcher or use the accessible `python` command in the backend setup step.

### 1. Clone the verified branch

```powershell
# Choose where to place the project (example: your Documents directory)
Set-Location "$HOME\Documents"
git clone --branch kuntal --single-branch https://github.com/kuntal-sarkar/GeNarrative-hackathon.git
Set-Location .\GeNarrative-hackathon
```

> If GitHub's `main` branch has subsequently received the MVP merge, `main` can also be used. The verified documentation baseline for this guide is **`kuntal` at `a08e82f`**, so the commands intentionally use that branch.

### 2. Install React/Vite dependencies

```powershell
# Repository root â€” where package.json is located
npm ci
```

If your checkout has no package lockfile, use `npm install` instead. Do not run npm commands from inside `src/` or `backend/`.

### 3. Create the frontend environment file

```powershell
Set-Content -LiteralPath .env.local -Encoding ascii -Value 'VITE_API_BASE_URL=http://127.0.0.1:5000'
Get-Content .env.local
```

**No API keys** belong in this file. Restart Vite after changing it.

### 4. Create backend venv and install Python dependencies

```powershell
Set-Location .\backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Using `.\.venv\Scripts\python.exe` directly avoids having to run `Activate.ps1` or change PowerShell execution policy.

### 5. Generate backend `.env` with all supported credential slots

```powershell
@'
# REQUIRED: Google Gemini for AI tools
GEMINI_API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.6-flash

# AI Builder model priority (development-tested configuration)
TAKEGRID_BUILDER_MODELS=gemini-3.1-flash-lite,gemini-3.8-flash

# Flask local server
FLASK_PORT=5000

# OPTIONAL: Cloudflare Workers AI storyboard images
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_IMAGE_MODEL=@cf/black-forest-labs/flux-1-schnell

# OPTIONAL: future/experimental Hugging Face integrations
HF_TOKEN=
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
'@ | Set-Content -LiteralPath .env -Encoding ascii

notepad .env
```

Now fill in the **real Gemini API key**, and optionally the **Cloudflare API token and Account ID**, save, and close Notepad. `GEMINI_MODEL` is a default setting; **task-specific model routes can take precedence**. Models may require separate access or quotas. **HF values are included as optional configuration placeholders; adding an HF token does not by itself enable a working Hugging Face image endpoint.**

> [!WARNING]
> Do not commit `.env`, `.env.local`, keys, generated images, local chat backups or `.venv`. Do not share your actual token values in an issue, message or screenshot. If a token leaks, rotate it with its provider.

### 6. Start Flask â€” Terminal A

```powershell
# Already inside GeNarrative-hackathon/backend
.\.venv\Scripts\python.exe -m compileall -q app.py routes services
.\.venv\Scripts\python.exe app.py
```

Keep that terminal open. Expected Flask URL: `http://127.0.0.1:5000`.

### 7. Start React â€” Terminal B

Open a **new** PowerShell terminal, navigate to the folder you cloned, then run:

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon"
npm run dev
```

> Adjust the folder if you cloned somewhere other than Documents. In general, `Set-Location` must point to the folder containing `package.json`.

Open the Vite URL shown in Terminal B. The backend only allows the local frontend origins `http://localhost:5173` and `http://127.0.0.1:5173` in its current Flask CORS configuration. If Vite picks another port (5174, etc.), stop the existing Vite instance or update the backend's CORS allowlist intentionally.

### 8. Check the server and app

```powershell
Invoke-RestMethod http://127.0.0.1:5000/api/health
```

Then in the browser: open TAKEGRID, create a project, save a story, test Project AI Chat, open Global AI, and optionally test Build New Project. **For storyboard image generation**, ensure Cloudflare Workers AI account access, token permissions and any applicable credits are configured.

### 9. Optional production build and lint

```powershell
# From GeNarrative-hackathon repository root
npm run build
npm run lint
npm run preview
```

`npm run build` previously passed on the development machine. The output contained a **chunk-size warning**, not a compilation failure. `npm run lint` is an available script but may report warnings/errors that need separate remediation. `preview` previews the built frontend **locally**, not an internet deployment.

### Daily Start Commands

Once dependencies and credentials are configured, **you do not need to repeat installations**. Start only two terminals.

**Terminal A â€” backend**

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon\backend"
.\.venv\Scripts\python.exe app.py
```

**Terminal B â€” frontend**

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon"
npm run dev
```

### Updating your clone safely

```powershell
# From repository root
 git status -sb
 git branch --show-current
 git fetch origin
```

Commit/stash your own work first. Then pull **the branch you actually use** (e.g. `kuntal`), not an arbitrary branch:

```powershell
git switch kuntal
git pull --ff-only origin kuntal
```

Avoid blind branch switching with uncommitted files or `git push --force` in this team repository.

### Troubleshooting

| Symptom | Check / fix |
| --- | --- |
| `npm run dev` says missing script | Run from repo root, verify `package.json`, then `npm ci` |
| `npm ci` fails | Check Node version and lockfile; try supported Node LTS |
| Python module import errors | Run `backend/.venv/Scripts/python.exe -m pip install -r backend/requirements.txt` from repo root |
| Flask says Gemini key missing | Put real key in `backend/.env`; ensure file isn't `.env.txt`; restart Flask |
| Browser shows network error | Flask running? Frontend `.env.local` URL and Vite port correct? |
| Browser requests blocked by CORS | Use localhost/127.0.0.1 on port 5173 or update backend's local CORS allowlist |
| `429 RESOURCE_EXHAUSTED` | Check AI Studio RPM/TPM/RPD, provider quota and shared-project usage |
| Builder gets 502 or 503 | Inspect backend logs; verify `TAKEGRID_BUILDER_MODELS` and model access; transient outages possible |
| A fallback model returns 404 | Model may not be available to your API project; choose a genuinely accessible ID |
| Storyboard image fails | Cloudflare token/account/model/credit status and generated-image response |
| Cancel still consumes tokens | Frontend abort does not guarantee termination of a request already running at the provider |
| Projects disappear on another browser | Expected with browser-local storage; use Export/Backup until database integration |
| Local app opens on port 5174 | Stop other Vite instance or update backend CORS allowlist |

## Data Handling, Security & Limitations

- **Browser-local persistence:** Project and AI chat state is not yet a hosted database. Clear site data carefully; export backups first.
- **No production authentication or shared storage:** User accounts, MySQL, RBAC and multi-device project ownership are future work.
- **No fake output:** AI failures must be surfaced as failures, not replaced with made-up creative data.
- **No silent project edits:** Creator review and explicit approval remain essential.
- **Server-side keys only:** Gemini and Cloudflare credentials belong in Flask's private environment.
- **AI limitations:** Outputs may be inaccurate, incomplete or inconsistent; independently review creative material and production facts.
- **Rate limits/costs:** API availability, 404/429/503 errors and pricing differ by model, project, usage tier and region.
- **Cancellation:** Stop may prevent frontend updates but does not guarantee stopping already-started server/provider work.
- **File uploads:** Respect file-size limits and private user content; do not assume uploads or browser chats are permanently archived.

## Development History & Engineering Decisions

1. **FrameForge â†’ TAKEGRID:** The final product name is TAKEGRID. Some internal historical filenames (`FRAMEFORGE_PROJECT_CONTEXT.md`, repo/folder names) retain the earlier name for continuity.
2. **Project-first workspace:** Story, Scenes, Shots, Storyboard, Characters, Critics, Memory, Continuity and Project Chat were organized around individual projects.
3. **Real AI integration:** Flask/Gemini services replaced fake responses and locally simulated scene extraction.
4. **Human-in-the-loop editing:** Story edits, critic advice and creative decisions remain reviewable rather than silently auto-applied.
5. **Global AI:** Added selected cross-project context, modern history, message actions, Markdown presentation and AI-assisted project creation.
6. **Model routing:** Task-based model candidates and fallback configuration were introduced to manage provider failures; a Project Builder-specific route was successfully tested after correcting a bad fallback.
7. **UI polishing:** Responsive navigation, chat patterns, floating composers, compact selectors, pinned histories and better scrolling.
8. **Version control:** The current MVP was committed/pushed to the team's `kuntal` branch at `a08e82f`, after cleaning patch backups and excluding secrets.
9. **Next:** MySQL data persistence, authentication and robustness QAâ€”**not** undocumented production readiness.

## Roadmap

### Milestone 1 â€” Hackathon MVP

- [x] React/Vite project-centered workspace and responsive layout
- [x] Flask AI backend and server-side Gemini integration
- [x] Story, scene and shot planning
- [x] Character Bible and Continuity Checker
- [x] Creative Critics, Reimagine and Creative Memory
- [x] Project-context AI Chat and Home Global AI
- [x] AI-assisted automatic project creation (locally verified)
- [x] Storyboard UI and image-provider integration
- [x] Browser-local persistence, export/backup and history workflows
- [x] Successful frontend production build / Python compilation
- [ ] Full cross-device, mobile and long-session regression QA

### Milestone 2 â€” Database & reliability

- [ ] MySQL schema for users, projects, story versions, scenes, shots, characters, decisions and chats
- [ ] Migration from existing browser-local data without data loss
- [ ] Authentication, ownership checks and project isolation on the server
- [ ] Durable object/media storage and safe backup/restore
- [ ] API error handling, provider usage monitoring and end-to-end tests
- [ ] Deployment configuration, CORS/security hardening and observability

### Milestone 3 â€” Voice-first creative workflows

- [ ] Voice Input + editable transcription using an available streaming transcription API
- [ ] Director's Voice Notes with reviewable suggested edits
- [ ] Script and dialogue read-aloud with a dedicated TTS endpoint
- [ ] Live Dialogue Rehearsal / Live Creative Director
- [ ] Multilingual voice translation (subject to access and quotas)
- [ ] Optional advanced agent orchestration, caching, RAG and evaluations

## Meet Team Runtime Error

TAKEGRID is built for **GeNarrative Clash 2026** by **Team Runtime Error**.

| Member | Role | Focus |
| --- | --- | --- |
| **Kuntal Sarkar** | **Team Leader Â· System Architect Â· Full-Stack & AI Integration** | Architecture, overall development direction, frontend/backend integration and AI workflows |
| **Aditi Singh** | **UI/UX & Database** | User-facing experience, UI workflows and database planning |
| **Diya Shree** | **Backend & Database** | Flask/backend and database design/integration workstream |
| **Swati Singh** | **UI/UX & Database** | UI/UX, responsive design and database planning |

### Project & team information

| Field | Detail |
| --- | --- |
| Product | **TAKEGRID** |
| Team | **Runtime Error** |
| Event | **GeNarrative Clash 2026** |
| MVP source | [GeNarrative-hackathon Â· `kuntal`](https://github.com/kuntal-sarkar/GeNarrative-hackathon/tree/kuntal) |
| Current stage | Hackathon MVP feature-complete; QA and database work remain |

## Hackathon Fit & What Makes It Different

**Theme:** *Where generative AI meets human creativity.* TAKEGRID uses AI as a creative collaborator, not as a replacement for authorship. Its differences are **multiple specialist perspectives**, **human disagreement as a valid decision**, **persistent creative intention**, **project-aware context** and a **connected writing-to-production planning flow**.

## Contributing & Working With the Codebase

**Teammates and AI coding assistants:** Read the code and `TEAM_SETUP.md`; `FRAMEFORGE_PROJECT_CONTEXT.md` is a **historical** engineering handoff, not an up-to-date substitute for this README.

Use your own branch and inspect it **before** editing or pushing:

```powershell
git branch --show-current
git status -sb
git fetch origin
git switch -c feature/your-task
# Make and test your changes
git diff --check
npm run build
git add src backend README.md
git diff --cached --check
git diff --cached --name-only
git commit -m "feat: describe your change"
git push -u origin feature/your-task
```

Open a pull request and have a teammate review it before merging to `main`. Never force-push team branches or stage private keys, environments, generated media and patch backups.

## Acknowledgements

**TAKEGRID is built by Team Runtime Error:** Kuntal Sarkar, Aditi Singh, Diya Shree and Swati Singh. Thanks to the open-source ecosystems and API platforms supporting this prototype. External AI service availability is governed by its provider's access, rate limits and billing conditions.

---

<div align="center">

### TAKEGRID

**Create with intention. Decide with confidence.**

Made by **Team Runtime Error** Â· **GeNarrative Clash 2026**

</div>
