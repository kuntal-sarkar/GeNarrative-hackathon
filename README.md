<div align="center">

# TAKEGRID

### Every creative decision has a story.

**A human-first AI creative workspace for filmmakers, writers, and storytellers.**

Turn an idea into a story, scenes, shots, and storyboard. Explore multiple creative perspectives, preserve your decisions, and stay in control of every edit.

**GeNarrative Clash 2026 | Team Runtime Error**

![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-202020?style=for-the-badge&logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/Python-AI_Services-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-Server--Side_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Optional_Images-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

![MVP](https://img.shields.io/badge/Hackathon-MVP_Ready-238636?style=flat-square)
![Data](https://img.shields.io/badge/Data-Browser_Local-F9AB00?style=flat-square)
![Database](https://img.shields.io/badge/MySQL-Planned-1B93F5?style=flat-square)
![Voice](https://img.shields.io/badge/Live_Audio-Roadmap-FF6B5B?style=flat-square)

[**Get the source**](https://github.com/kuntal-sarkar/GeNarrative-hackathon/tree/kuntal) | [**Download ZIP**](https://github.com/kuntal-sarkar/GeNarrative-hackathon/archive/refs/heads/kuntal.zip) | [**Quick setup**](#quick-start---copy-and-paste) | [**Complete setup**](#complete-windows-powershell-setup) | [**Team**](#team-runtime-error)

[Overview](#overview) | [Features](#implemented-features) | [Status](#mvp-status-and-validation) | [Architecture](#architecture) | [Future features](#future-ai-and-voice-features) | [Roadmap](#roadmap)

</div>

---

> [!IMPORTANT]
> **Project status: Hackathon MVP (November 2026).** The core frontend and Flask AI workflows have been implemented and tested during development, including a successful automatic AI Project Builder test. A local frontend production build and backend Python syntax check passed. This is **not** a claim of completed public deployment, database persistence, authentication, or exhaustive end-to-end testing. This guide targets the working **`kuntal` branch** and its verified MVP baseline (`a08e82f`); check GitHub for newer commits and PR merges.

## Quick start - copy and paste

For new contributors on Windows: **Git, Node.js, and Python** are required. Use the **complete setup below** for the actual first installation, including API keys. These short commands show the overall flow.

```powershell
# Clone the working MVP branch and enter the repository
git clone --branch kuntal --single-branch https://github.com/kuntal-sarkar/GeNarrative-hackathon.git
cd GeNarrative-hackathon

# Install frontend packages; no API key goes in the frontend environment
npm ci
 'VITE_API_BASE_URL=http://127.0.0.1:5000' | Set-Content -Encoding ascii .env.local

# Create the Python backend environment
cd backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# IMPORTANT: Follow Step 5 below to create backend/.env and supply your own key.
```

After adding `backend/.env`, run **Flask and React in separate PowerShell terminals**. A full sequence with every command is in [Complete Windows PowerShell Setup](#complete-windows-powershell-setup).

> [!CAUTION]
> **Never put API keys in React, `.env.local`, or a `VITE_*` variable.** Gemini, Cloudflare, and any future database credentials must remain on the server in `backend/.env`. Do not commit that file.

---

## Overview

Film development involves more than writing a script. A single idea becomes a story, then scenes, shot plans, storyboards, revisions, critique, and creative decisions. When those steps live in different tools, the reason behind each decision gets lost.

**TAKEGRID** brings this work into one project-centered environment. Its guiding principle is simple:

> **AI should support human creative judgment, not replace it.**

Creators can plan a story, ask project-aware questions, compare creative directions, consult multiple AI critics, check continuity, and deliberately accept or reject suggestions. Relevant decisions live in **Creative Memory** rather than disappearing after a chat.

### What makes TAKEGRID different?

| Creative problem | TAKEGRID approach |
| --- | --- |
| Story, scene, and shot information is disconnected | One project workspace for the whole writing-to-storyboard flow |
| AI gives one generic opinion | Five specialized Creative Critics perspectives |
| Suggestions can override original creative intention | Explicit creator review and decisions |
| Characters and facts drift across revisions | Project-aware Continuity Checker |
| Past decisions are forgotten | Creative Memory with contextual intent |
| Separate projects cannot be compared easily | Global AI with selectable project context |
| Starting a project takes time | AI Project Builder with optional project name |

## Implemented features

### 01. Home dashboard and Global AI

- Modern responsive home dashboard with project entry points and recent work.
- **Global AI** conversations for brainstorming and comparing selected projects.
- Searchable, multi-project context selector with clear selection state.
- Saved chat history, pinned conversations, copy, like/dislike, attachments, and Markdown responses.
- Floating chat composer, auto-expanding input, generation indicators, and stop control.
- **Build New Project** form: provide the project type/idea; the title is optional. The backend generates a proposal, and a successful response can create and open a project using the existing project storage flow.

### 02. Projects and Story Studio

- User-driven project creation, management, and navigation.
- Editable stories, script import for supported formats, and deliberate Save behavior.
- AI-assisted story exploration with reviewable edits rather than silent overwrites.
- Project-specific creative context and revision-oriented workflows.

### 03. Scene Breakdown, Shots, and Storyboard

- Scene planning and backend AI-assisted scene breakdown.
- Scene-linked shot planning and shot-generation assistance.
- Storyboard visualization tied to project shots.
- Optional Cloudflare-backed storyboard image generation when valid credentials and provider access are available.

### 04. Characters and Continuity

- Character Bible / character generation based on story context.
- Continuity checks across story, scenes, characters, timeline, locations, and relevant details.
- Findings for the creator to evaluate; an intentional deviation is not automatically an error.

### 05. Creative Critics and Reimagine

| AI perspective | Main focus |
| --- | --- |
| **Visual Director** | Framing, composition, visual expression |
| **Story Editor** | Plot, pacing, arcs, coherence |
| **Copywriter** | Dialogue, voice, wording |
| **Audience Perspective** | Emotion, clarity, engagement |
| **Marketing Perspective** | Positioning, audience fit, discoverability |

- Multiple complementary reviews of project material.
- Reimagine proposals and review-before-save interactions.
- Human decisions are treated as creative intent, not automatic instructions to rewrite a project.

### 06. Creative Memory and Project AI Chat

- Project-isolated creative decisions and rationale.
- Context-aware chat within a specific project.
- AI-powered story review, suggested revisions, and deliberate application to the saved story.
- Conversation history and contextual memory in existing browser-oriented workflows.

### 07. Exports and usability

- Project export/backup and revision-related interfaces.
- Responsive navigation, compact controls, well-formatted rich AI responses, and independent scrolling in chat areas.
- No invented sample projects, fake AI success responses, or local regex pretending to be an AI scene breakdown.

## MVP status and validation

**The statuses below reflect development-machine verification, not a fresh test on every cloned checkout.**

| Component | Status | Notes |
| --- | --- | --- |
| React app and core project workspace | **Working locally** | Production build passed |
| Flask API and Gemini integration | **Working locally** | Python compilation passed |
| Story, scene, shot, character workflows | **Working locally** | Continue edge-case testing |
| Project AI Chat | **Working locally** | Conversation and story-edit flows tested |
| Global AI Chat and history | **Working locally** | Browser-side conversation persistence |
| AI Project Builder | **Working locally** | Project created successfully after adjusting fallback |
| Creative Critics, Reimagine, Creative Memory | **Working locally** | Long input and unexpected-response QA pending |
| Continuity and Storyboard | **Working locally** | Image availability depends on provider credentials |
| Model fallback | **Partially verified** | Model access, quota, and outage cases vary |
| Stop-generation control | **UI/request cancellation** | Already-running provider work may not stop |
| Export and restore | **Implemented** | Verify restoration before relying on it for migration |
| MySQL database and multi-device sync | **Planned** | Not yet integrated |
| Login, role-based access, public hosting | **Planned** | Not production-ready |
| Live transcription, dialogue rehearsal, TTS | **Planned** | Not included in current MVP |

> [!NOTE]
> Existing project and chat data is largely **browser-local**, not stored in a production database. Clearing browser data can remove it. Use the export functionality and keep independent copies of valuable scripts before the database migration.

## Architecture

```text
                            USER / BROWSER
                                  |
                           React 19 + Vite 8
                                  |
                  +---------------+---------------+
                  |                               |
            Project UI                       Global AI UI
                  |                               |
                  +---------------+---------------+
                                  |
                       Frontend service layer
                                  |
                        Flask REST backend
                                  |
               +------------------+------------------+
               |                                     |
         AI task router                        Image service
               |                                     |
         Google Gemini API                    Cloudflare Workers AI
               |
         Prompt + project context

         Browser local storage: current app data
         MySQL + authenticated ownership: future phase
```

### Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 8, React Router 7 |
| UI styling and animation | CSS, Tailwind CSS 4, Motion, Lucide React |
| State and local persistence | Zustand, browser-local storage |
| Script import | PDF.js / `pdfjs-dist`, text files |
| Backend | Python, Flask, Flask-CORS |
| AI integration | `google-genai` SDK and task-based routing |
| Optional image generation | Cloudflare Workers AI |
| Planned persistent database | MySQL (not yet integrated) |

### Project structure

**ASCII-only directory diagram** to avoid broken box characters on Windows or GitHub:

```text
GeNarrative-hackathon/
|-- public/                       # Public assets
|-- src/
|   |-- components/
|   |   |-- home/                 # Dashboard and Global AI
|   |   |-- studio/               # Story, scenes, shots, storyboard
|   |   |-- workspace/            # Project Chat, Critics, Memory, Continuity
|   |   `-- export/               # Export and backup UI
|   |-- config/                   # TAKEGRID branding and settings
|   |-- pages/                    # Dashboard and project screens
|   |-- services/                 # API adapters, Global AI, transfer tools
|   `-- main.jsx
|-- backend/
|   |-- app.py                    # Flask entry point
|   |-- requirements.txt
|   |-- routes/
|   |   |-- ai_routes.py
|   |   |-- project_ai_routes.py
|   |   `-- global_ai_routes.py
|   |-- services/
|   |   |-- gemini_model_router.py
|   |   |-- global_ai_service.py
|   |   |-- brand_identity.py
|   |   `-- ...                   # Story, scenes, critics, memory, etc.
|   `-- utils/
|-- package.json
|-- package-lock.json
|-- vite.config.js
|-- TEAM_SETUP.md
|-- FRAMEFORGE_PROJECT_CONTEXT.md # Historical engineering notes
`-- README.md
```

The React frontend lives at the **repository root**. The Flask backend lives at **`backend/` in the same repository**. You do **not** need to separately clone the local `frameforge-backend` directory used during development.

---

## Complete Windows PowerShell setup

> [!TIP]
> **Follow steps 0-10 in order for a brand-new laptop.** Each block can be copied and pasted into PowerShell. The final setup requires supplying your **own valid Gemini key** and, for optional storyboard image generation, **Cloudflare token + account ID**. No database is required for the current browser-local MVP.

### Step 0 - Install prerequisites

Install **Git**, a **Node.js LTS release compatible with Vite 8**, and **Python 3 with pip**. Then confirm:

```powershell
git --version
node --version
npm --version
py --version
```

If the Python Launcher `py` is unavailable, install it or use the corresponding `python` command. Very new Python versions may need updated dependency wheels.

### Step 1 - Clone the working code

```powershell
# Choose a working folder; change this location if preferred.
Set-Location "$HOME\Documents"

git clone --branch kuntal --single-branch https://github.com/kuntal-sarkar/GeNarrative-hackathon.git
Set-Location .\GeNarrative-hackathon

git branch --show-current
```

The branch should print `kuntal`. For collaboration, do not casually switch branches with uncommitted changes. Once `main` contains a verified PR merge, contributors may choose that branch instead.

### Step 2 - Install frontend dependencies

**Run in the repository root** (where `package.json` is located).

```powershell
npm ci
```

`npm ci` uses the project's dependency lockfile. Use `npm install` only if the particular checkout does not contain `package-lock.json`.

### Step 3 - Create frontend environment configuration

```powershell
# Still in the repository root
'VITE_API_BASE_URL=http://127.0.0.1:5000' | Set-Content -LiteralPath .env.local -Encoding ascii
Get-Content .env.local
```

**Never paste credentials into `.env.local`.** `VITE_*` values can be visible in browser-delivered code.

### Step 4 - Install Python backend dependencies

```powershell
Set-Location .\backend

py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Using the virtual environment's Python directly avoids changing PowerShell execution policies.

### Step 5 - Create the complete backend `.env` template

**Run inside `GeNarrative-hackathon\backend`.** This command writes a safe placeholder template; no key is embedded in the README.

```powershell
@'
# REQUIRED: Google Gemini API access
GEMINI_API_KEY=PASTE_YOUR_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.6-flash
TAKEGRID_BUILDER_MODELS=gemini-3.1-flash-lite,gemini-3.8-flash

# Flask server
FLASK_PORT=5000

# OPTIONAL: Cloudflare storyboard image generation
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_IMAGE_MODEL=@cf/black-forest-labs/flux-1-schnell

# OPTIONAL: Hugging Face configuration / experimental integrations
HF_TOKEN=
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
'@ | Set-Content -LiteralPath .env -Encoding ascii

notepad .env
```

Replace `PASTE_YOUR_GEMINI_API_KEY_HERE` with **your own Gemini API key**. Optional image generation also requires valid `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` values. Save the file in Notepad.

**Why these model settings?** `GEMINI_MODEL` provides a default configuration, while the app's task router may choose per-feature models. The Project Builder's `TAKEGRID_BUILDER_MODELS` override is the configuration used in a successful local project-creation test. **Quota and access depend on your account**; no model is guaranteed to be available forever.

Optional HF entries are placeholders only: adding an HF token does not automatically enable a separately validated image workflow.

### Step 6 - Check backend syntax

```powershell
# Inside GeNarrative-hackathon\backend
.\.venv\Scripts\python.exe -m compileall -q app.py routes services
```

No output indicates that Python compilation found no syntax errors. It is **not** a provider connectivity test.

### Step 7 - Start Flask (Terminal A)

```powershell
# Inside GeNarrative-hackathon\backend
.\.venv\Scripts\python.exe app.py
```

Leave Terminal A running. The expected local backend address is `http://127.0.0.1:5000`.

### Step 8 - Start React (Terminal B)

**Open a second PowerShell window.** Set the path to where you cloned the app, then run:

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon"
npm run dev
```

Open the address Vite prints, generally **http://localhost:5173**. If you cloned elsewhere, replace the path with your actual repository root.

### Step 9 - Verify the backend and app

**Open a third PowerShell window (or use another free terminal):**

```powershell
Invoke-RestMethod http://127.0.0.1:5000/api/health
```

Then, in the browser:

1. Open TAKEGRID and create a project.
2. Save a real story; refresh and reopen it.
3. Test Project AI Chat and Global AI with your Gemini key.
4. Try **Build New Project** with a short creative brief.
5. If Cloudflare is configured, separately test storyboard image generation.

> [!NOTE]
> If Vite opens on a different port (such as 5174), the backend CORS allowlist may need updating; stopping another Vite process so it can use 5173 is usually simpler. Model quota limits, transient provider errors, and Cloudflare permissions can affect AI features even when local setup is correct.

### Step 10 - Build and quality checks

**Run from the repository root:**

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon"

npm run build
npm run lint
```

A Vite warning about large JavaScript chunks **is not a failed build**. Lint may identify independent code-quality issues; fix them before claiming lint clean.

### Everyday startup - no reinstall required

**Terminal A: Flask**

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon\backend"
.\.venv\Scripts\python.exe app.py
```

**Terminal B: React**

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon"
npm run dev
```

### Useful commands

| Task | Run from | Command |
| --- | --- | --- |
| Frontend dev server | Repo root | `npm run dev` |
| Production frontend build | Repo root | `npm run build` |
| Build preview | Repo root | `npm run preview` |
| Lint | Repo root | `npm run lint` |
| Backend Flask server | `backend/` | `.\.venv\Scripts\python.exe app.py` |
| Update Python packages | `backend/` | `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` |
| Backend syntax check | `backend/` | `.\.venv\Scripts\python.exe -m compileall -q app.py routes services` |
| Current Git branch | Repo root | `git branch --show-current` |
| Working tree status | Repo root | `git status -sb` |

### Common problems

| Symptom | What to check |
| --- | --- |
| `npm run dev` has no `dev` script | You are in the wrong folder. Go to the repository root, not `src/` or `backend/`. |
| `npm ci` fails | Check compatible Node version and presence of `package-lock.json`. |
| Python import error | Install `backend/requirements.txt` inside the venv. |
| Gemini key not found | Verify `backend/.env` exists (not `.env.txt`) and restart Flask. |
| AI request gets `429` | Provider quota/rate limit; look at model/account limits. |
| Builder returns `502` or `503` | Check backend model-route logs and accessible model IDs. |
| Fallback gets `404` | The candidate model is unavailable for the account/project. |
| Browser says `Failed to fetch` | Ensure Flask is running, check frontend `.env.local`, port, and CORS. |
| Cloudflare storyboard image fails | Verify token, account ID, model availability, quota, and permissions. |
| Cancel stops UI but API still consumes tokens | Already-started generation may continue server-side; frontend abort does not guarantee provider termination. |
| Projects absent on another computer | Current storage is browser-local; database sync is not implemented. |
| README text looks like `a^` or garbled box symbols | Use this ASCII-safe README and edit/save as UTF-8. |

---

## Future AI and voice features

**Roadmap only. Not implemented in the current MVP.** Models and quotas are provider/account dependent; confirm actual identifiers and access before integrating them.

| Feature | Candidate capability | How it would help creators | Priority |
| --- | --- | --- | --- |
| **Voice-to-Story** | Streaming live transcription | Speak a prompt or scene instead of typing | High |
| **Director's Voice Notes** | Transcription + existing text AI | Convert spoken direction into editable scene notes | High |
| **Script Read-Aloud** | Dedicated text-to-speech endpoint | Listen to dialogue timing and narration | High |
| **Dialogue Rehearsal** | Real-time native audio conversation | Rehearse a scene with an AI character | Medium |
| **Live Creative Director** | Gemini Live API | Brainstorm a film hands-free, interrupt or ask follow-ups | Medium |
| **Multilingual Dialogue Practice** | Live translation | Explore story dialogue in multiple languages | Medium |
| **Advanced Live Analysis** | Live models with greater reasoning capacity | Discuss complex character arcs by voice | Experimental |
| **Agentic production assistant** | Carefully permissioned agent framework | Assist multi-step planning and research | Research |

Potential services include the **Gemini Live API**, transcription-specific Live models, native audio dialogue models, and dedicated TTS models. Not every listed dashboard model is necessarily accessible through a normal REST text-generation call.

**Planned flow:** microphone permission -> secure streaming connection -> transcription or voice response -> editable preview -> creator approval -> existing Story/Chat service. Keep the long-lived API key on the backend. Real-time bidirectional audio needs streaming/WebSocket support, not merely the existing JSON Flask POST route.

Official references: [Gemini model list](https://ai.google.dev/gemini-api/docs/models) | [Live API](https://ai.google.dev/gemini-api/docs/live-api) | [Rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

## Design system

| Purpose | Color |
| --- | --- |
| Main background | `#FFF4DC` |
| Calls to action | `#FF6B5B` |
| Navigation and primary text | `#172A46` |
| Secondary accent | `#1B93F5` |
| Cards, input, search | White and subtle warm neutrals |

The interface aims for clean typography, readable cards, compact pill-shaped controls, useful animation, mobile-friendly navigation, and separate reusable JSX/CSS components.

## Roadmap

### Phase 1 - Hackathon MVP

- [x] React/Vite frontend and project workspaces
- [x] Flask backend and Gemini integration
- [x] Story, Scenes, Shots, Characters, and Storyboard workflows
- [x] Project AI Chat, Global AI, and automatic project creation
- [x] Creative Critics, Reimagine, Continuity Checker, Creative Memory
- [x] Local persistence, export/backup, responsive UI
- [x] Local production build and backend syntax check
- [ ] Full device-by-device regression, performance and long-input QA

### Phase 2 - Data and reliability

- [ ] MySQL schema and persistent projects/chats/memory
- [ ] Migration of existing browser data without loss
- [ ] Authentication, ownership checks and server-side access control
- [ ] Robust provider error handling, quotas, logging and evaluation
- [ ] Safe image/media storage and deployment hardening

### Phase 3 - Live creative tools

- [ ] Voice prompt input and transcription
- [ ] Director's voice notes
- [ ] Script narration and dialogue rehearsal
- [ ] Live multilingual conversation and translation
- [ ] Evaluation, privacy, user consent, cost controls and accessibility

## Security and data handling

- Never commit `.env`, `.env.local`, private keys, `.venv`, `node_modules`, or generated media.
- Frontend `VITE_*` environment variables are **not private**.
- Model responses are proposals; humans should verify creative and factual content.
- Local browser storage does not automatically sync across users, devices or browsers.
- Stop-generation controls cannot promise cancellation of work already executing at the provider.
- Use real project content; do not add sample stories, pretend AI responses or locally fabricated analysis.
- Set up proper auth, ownership, retention, input validation and backup before serving real users publicly.

## Team Runtime Error

| Member | Responsibility |
| --- | --- |
| **Kuntal Sarkar** | **Team Leader** - architecture, system design, full-stack development, AI integration |
| **Aditi Singh** | UI/UX and database-related work |
| **Diya Shree** | Backend engineering and database-related work |
| **Swati Singh** | UI/UX and database-related work |

**Event:** GeNarrative Clash 2026
**Project:** TAKEGRID
**Team:** Runtime Error
**Repository:** [GeNarrative-hackathon](https://github.com/kuntal-sarkar/GeNarrative-hackathon)

### Collaboration workflow

1. Confirm the intended branch before modifying files: `git branch --show-current`.
2. Review status and diff before staging: `git status -sb` and `git diff --stat`.
3. Work on a feature branch; do not overwrite teammates' changes or force-push.
4. Stage only reviewed files. Check with `git diff --cached --check` before commit.
5. Run `npm run build` and the relevant backend checks.
6. Open a pull request into the agreed target branch and review it with the team.

Historical engineering decisions are captured in [`FRAMEFORGE_PROJECT_CONTEXT.md`](./FRAMEFORGE_PROJECT_CONTEXT.md). That filename is retained from the earlier product name; the current brand is TAKEGRID.

---

<div align="center">

### TAKEGRID

**Create with intention. Decide with confidence.**

Made by **Team Runtime Error** for **GeNarrative Clash 2026**.

[Back to top](#takegrid)

</div>
