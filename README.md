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

<a id="what-is-takegrid"></a>

## 01. What is TAKEGRID?

**TAKEGRID is an AI-assisted creative development workspace built for filmmakers, screenwriters, directors, and storytellers.** It gives a creative team one place to move from an early idea to a practical plan for production. A creator can write a story, divide it into scenes, plan individual camera shots, organize storyboard frames, study character consistency, and evaluate their work through different creative perspectives.

Rather than presenting AI as an automatic replacement for a writer or director, TAKEGRID treats it as a **creative collaborator**. AI can propose story improvements, spot potential continuity issues, suggest camera coverage, or compare projects. The human creator reviews the result, edits it, rejects it, or deliberately saves it. This distinction is the center of the product.

### Who is it for?

| Creator | Why TAKEGRID is useful |
| :--- | :--- |
| **Screenwriters** | Develop stories, scenes, character arcs, revisions, and alternative directions. |
| **Directors** | Convert narrative ideas into shots, storyboard frames, and visual notes. |
| **Student filmmakers** | Practice an end-to-end filmmaking workflow without managing many disconnected tools. |
| **Creative teams** | Keep a project's story, feedback, decisions, and supporting context together. |
| **Independent creators** | Use one workspace for brainstorming, planning, and reviewing a concept before production. |

### The central idea

> **Creative control stays with the human. AI provides options, not orders.**

A proposed AI edit is not a saved edit. A critic's suggestion is not a creative decision. A continuity warning is not necessarily a mistake: it might be intentional. TAKEGRID aims to keep these distinctions visible throughout the workflow.

---

## 02. Why TAKEGRID exists

Making a film or developing a screenplay usually means juggling different documents, scene breakdowns, shot lists, visual references, chat threads, and feedback. The problem is not just that information gets scattered: **the reasoning behind creative decisions gets lost**. A character's motivation may change in a later revision, the visual plan may diverge from the script, or a reviewer may suggest changing a scene without understanding why the original version was written that way.

Today's AI tools can produce suggestions quickly, but a generic answer is not the same as **project-aware, trustworthy creative support**. A creator needs to know what material the AI considered, whether its feedback is relevant, and how to preserve creative intent if they disagree.

### Problems we want to solve

| Problem | Why it matters | TAKEGRID's approach |
| :--- | :--- | :--- |
| **Disconnected creative tools** | A story, scene plan, shot list, and storyboard can drift apart. | Keep them organized inside the same project workspace. |
| **Generic AI feedback** | A single response may miss camera language, audience needs, or plot structure. | Use multiple specialist Creative Critics perspectives. |
| **Lost intent** | Teams forget why a suggestion was accepted or rejected. | Maintain Creative Memory and explicit review decisions. |
| **Continuity drift** | Character facts, locations, objects, and timelines may become inconsistent. | Compare current project material with continuity analysis. |
| **Slow early planning** | Turning a premise into a starting project can be time-consuming. | Generate an initial project from a short creator brief. |
| **AI taking too much control** | A generated suggestion can accidentally overwrite authorial work. | Keep story edits reviewable and subject to explicit Save. |
| **Project-specific blind spots** | One project chat cannot naturally compare several separate projects. | Provide Global AI with a selectable multi-project context. |

### What makes the approach different?

**Five perspectives, one creator:** Visual Director, Story Editor, Copywriter, Audience Perspective, and Marketing Perspective look at different aspects of the same work. Their suggestions remain suggestions; the creator makes the decision.

**A memory of why:** Creative Memory is intended to preserve creator reasoning, including conscious disagreement. This helps avoid an AI repeatedly recommending something that conflicts with a deliberate creative choice.

**Planning connected to the actual story:** Scenes, shots, storyboards, and conversations belong to a specific project, rather than becoming a collection of unrelated prompts.

**An honest prototype:** TAKEGRID does not use hardcoded fake AI responses or sample projects to make an unfinished feature appear successful. Where provider access, storage, or deployment is incomplete, the interface and documentation should say so.

---

<a id="overview"></a>

## 03. Overview

TAKEGRID has two complementary working spaces:

| Area | Main purpose | Context used |
| :--- | :--- | :--- |
| **Home + Global AI** | Brainstorm, compare projects, combine directions, and initiate a new project. | The projects a creator selects for Global AI. |
| **Project Workspace** | Write, plan, review, and revise one specific creative project. | The current project's story and relevant saved context. |

### The creative workflow

```text
CREATIVE IDEA
    |
    +-- Create a blank project
    +-- Import a supported script
    `-- Ask Global AI to build a new project
    |
    v
STORY --> SCENES --> SHOTS --> STORYBOARD
    |          |         |
    +----------+---------+
               |
    +----------+-------------------------+
    |          |           |             |
 CHARACTERS  CRITICS   CONTINUITY   PROJECT AI CHAT
               |           |             |
               +-----------+-------------+
                           |
                    HUMAN REVIEW
                           |
                     CREATIVE MEMORY
                           |
                   SAVE / EXPORT / REVISE
```

This is a conceptual workflow, not a claim that every operation is automatically invoked in sequence. The creator decides what to use and when to save changes.

### Current development status

![Frontend](https://img.shields.io/badge/Frontend-Local_Build_Passed-238636?style=flat-square)
![Backend](https://img.shields.io/badge/Backend-Python_Syntax_Passed-238636?style=flat-square)
![AI](https://img.shields.io/badge/AI-Core_Flows_Locally_Tested-1B93F5?style=flat-square)
![Cloud](https://img.shields.io/badge/Cloud_Deployment-Not_Verified-F9AB00?style=flat-square)

The **hackathon MVP is feature-complete** based on the development-machine tests discussed by the team. The frontend build passed and an AI-generated project was created successfully with the configured model fallback. New contributors must still verify their own API credentials, model availability, browser persistence, and full workflows. **Database sync, public hosting, authentication, and live voice are not part of the verified current MVP.**

---

<a id="implemented-features"></a>
<a id="mvp-status-and-validation"></a>

## 04. All implemented features

### 4.1 Home dashboard and Global AI

The Home screen brings together navigation, recent projects, and the Global AI workspace. Global AI is separate from a project's AI Chat: it can compare or discuss **multiple selected projects** instead of being limited to one.

- **Global conversations:** send prompts, review formatted answers, and reopen saved browser-local chats.
- **Modern chat UI:** responsive transcript, floating expandable composer, copy action, thumbs-up/down feedback, a compact New Chat control, and a Stop button.
- **Chat history:** recent and pinned conversations, selectable history, and contextual actions.
- **Multi-project selection:** searchable selector, clear selection states, Select All and Clear actions; bounded context selection for AI requests.
- **Attachments:** supported files can be added to applicable requests; attachments are not a permanent file-storage system.
- **Global project brainstorming:** ask about creative directions, comparisons, potential combinations, and alternative concepts.
- **AI Project Builder:** a form accepts the type/idea of a project, with an **optional project name** and other creative preferences. The backend generates a proposal and can create/open the project through the existing project-saving flow.
- **Generation indicators and cancellation:** visual progress and a user-facing stop action. Stopping the browser request does **not** guarantee cancellation of work already running at the AI provider.

### 4.2 Project library and project creation

Creators can create and reopen real projects, move into the project workspace, and organize their own material. The application is intentionally designed around **user-authored projects**, not seeded demonstration content. Existing browser-local project data must not be cleared casually.

### 4.3 Story Studio and script import

- Write and edit project stories with creator-controlled saving.
- Supported text-script intake includes text-based PDF and plain-text formats used by the workspace; scanned-image PDFs may require OCR, which is not a verified feature.
- Explore AI-assisted story editing inside the project workflow.
- Review proposed changes before applying them to the story; normal chat should not silently rewrite saved material.
- Revisit story versions through the implemented revision/backup-oriented interfaces, with recovery workflows needing final QA.

### 4.4 AI Scene Breakdown

Convert story material into proposed scenes through the Flask AI service and review scene structure. Scenes represent **narrative events and transitions**; they are not camera shots. The project also supports scene-planning workflows and project-specific organization.

### 4.5 Shot Planner

Plan shots associated with scenes, including their intended visual execution. AI-assisted shot-generation services have been integrated and locally tested in development. The creator remains responsible for reviewing the output.

### 4.6 Storyboard and image generation

- Visualize ordered frames linked to the project's shots.
- Use backend-managed storyboard generation and frame retrieval where available.
- Optionally request **Cloudflare Workers AI** image generation when the token, account ID, model availability, quota, and permissions permit it.
- Generated frames and local media should not be confused with durable cloud file storage; current runtime artifacts can be local to the server.

### 4.7 Character Bible

Generate or explore character information based on story context, helping creators track relationships, motivations, and recurring facts. Character generation has been locally tested, but every newly cloned environment should verify the provider response and save workflow.

### 4.8 Creative Critics: five specialist perspectives

| Perspective | Creative question it investigates |
| :--- | :--- |
| **Visual Director** | Can composition, framing, and visual storytelling be stronger? |
| **Story Editor** | Does the structure, pacing, and character progression make sense? |
| **Copywriter** | Are dialogue, tone, wording, and emotional expression clear? |
| **Audience Perspective** | Is the idea understandable, engaging, and emotionally effective? |
| **Marketing Perspective** | What is the potential audience, positioning, and communication angle? |

Critics can return project-related feedback, and **Reimagine** supports alternative creative approaches that the creator reviews. Where the app displays agreement across critics, that agreement must come from actual returned findings, never a hardcoded consensus count.

### 4.9 Creative Memory

Creative Memory records relevant project decisions and intent. A creator can preserve a preference or disagreement rather than letting a later AI response treat an earlier suggestion as a final instruction. Project isolation is important: one project's decisions should not silently become another project's facts.

### 4.10 Continuity Checker

The Continuity feature reviews potential mismatches across a project, such as changes in character details, timing, locations, objects, or story logic. Findings require human interpretation. **An intentional deviation is not automatically an error.**

### 4.11 Project AI Chat

A context-aware assistant for the active project, distinct from Global AI. Implemented workflows include discussing the story, reviewing creative material, exploring proposed edits, and applying reviewed content through the project's explicit save flow. Conversation history and response formatting are part of the current interface.

### 4.12 Export, backup, and responsive experience

- Project export/backup and version-oriented interfaces.
- Desktop navigation and compact mobile-oriented navigation.
- Responsive project pages, editor panels, chat histories, dialogs, and floating inputs.
- User-friendly loading, empty, and error states.

> [!NOTE]
> **Working locally** means implemented and exercised on the original development environment. It does not certify every edge case, production-scale performance, cross-device synchronization, accessibility, or deployment readiness.

### What is not yet complete?

| Area | Status |
| :--- | :--- |
| Browser-local project and chat data | **Current MVP behavior** |
| MySQL server persistence and automatic migration | **Next phase** |
| Multi-user login and project ownership | **Planned** |
| Public hosting and production hardening | **Not yet verified** |
| Real-time microphone transcription, TTS, and AI voice | **Future feature** |
| Provider-side hard cancellation | **Not guaranteed** |

---

## 05. How to use TAKEGRID

**A typical creator journey:** Open the Home page, make a project (or ask Global AI to create an initial one), enter the workspace, add a story, plan scenes and shots, explore storyboard options, request reviews, save the creator's actual decisions, and export important work.

| Step | Action | Result |
| :--- | :--- | :--- |
| **1** | Create/open a project | Enter one project's workspace. |
| **2** | Write or import story material | Establish the project's creative source. |
| **3** | Save your story | Keep intentional, user-approved content. |
| **4** | Create or generate scenes | Organize the narrative into units. |
| **5** | Plan shots and storyboard | Translate narrative events into visual choices. |
| **6** | Ask Critics or Continuity | Review weaknesses and possible alternatives. |
| **7** | Use Project AI Chat | Discuss project-aware ideas and proposed edits. |
| **8** | Save Creative Memory | Keep your reasoning for future revisions. |
| **9** | Export/backup | Preserve work before risky changes or migration. |

**Global AI workflow:** Select relevant projects from the Home assistant, ask a cross-project question, or open **Build New Project**. For project creation, enter a short premise or desired genre/type; leaving the name blank allows AI to propose one. Generation requires a working backend and available model quota.

**Important:** The existing MVP stores much of its data in the browser. Clearing browser data, switching browsers, or moving to another laptop can make those projects unavailable. Make backups before database migration.

---

## 06. Who built TAKEGRID?

**Team Runtime Error**

- **Team Leader:** Kuntal Sarkar
- **Team Members:** Aditi Singh, Diya Shree, Swati Singh

Detailed roles and responsibilities are documented in [Section 11](#11-team-runtime-error---people-and-contributions).

---

<a id="quick-start---copy-and-paste"></a>
<a id="complete-windows-powershell-setup"></a>

## 07. Quick start, complete installation, and local usage

> [!TIP]
> **Windows PowerShell: one setup guide, in order.** For a new machine, copy each command block from **Step 0 through Step 9**. Use **two terminals** to run the app after configuration. MySQL is **not required** for the current local MVP. A valid Gemini key is needed for AI requests; Cloudflare credentials enable optional storyboard images.

### Quick start: the sequence at a glance

```powershell
# 1. Clone the verified MVP branch
Set-Location "$HOME\Documents"
git clone --branch kuntal --single-branch https://github.com/kuntal-sarkar/GeNarrative-hackathon.git
Set-Location .\GeNarrative-hackathon

# 2. Install React dependencies
npm ci

# 3. Point the frontend to local Flask
'VITE_API_BASE_URL=http://127.0.0.1:5000' | Set-Content -Encoding ascii .env.local

# 4. Install Flask dependencies in a private Python environment
Set-Location .\backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# 5. Create backend/.env with the full template in Step 4 below
# 6. Add your own API key and optionally Cloudflare credentials
# 7. Start Flask (Terminal A) and React (Terminal B)
```

### Step 0 - Install and verify prerequisites

Install **Git**, a recent **Node.js version compatible with Vite 8**, and **Python 3 with pip**. Windows Terminal, PowerShell, and VS Code are convenient but not required. A recent LTS Node release is preferable; use the version constraints in the checked-out package tooling if a build reports incompatibility.

```powershell
# Verify prerequisites. Each command should print a version.
git --version
node --version
npm --version
py --version
```

If `py` is unavailable, install the Python Launcher or use an installed `python` executable. If an especially new Python release encounters dependency-wheel issues, use a compatible Python version supported by the pinned backend dependencies.

### Step 1 - Clone TAKEGRID from GitHub

```powershell
# Change this folder if you prefer another working location.
Set-Location "$HOME\Documents"

git clone --branch kuntal --single-branch https://github.com/kuntal-sarkar/GeNarrative-hackathon.git
Set-Location .\GeNarrative-hackathon

git branch --show-current
git status -sb
```

The documented branch is **`kuntal`**, which contains the verified MVP baseline commit `a08e82f`. Check for later changes and approved PR merges before changing the branch. Never switch branches over uncommitted work without reviewing `git status`.

### Step 2 - Install frontend dependencies

**Terminal: repository root**, where `package.json` and `package-lock.json` live.

```powershell
npm ci
```

`npm ci` installs from the checked-in lockfile and is preferred for reproducible setup. Do not install packages one by one unless the repository has intentionally changed its dependency manifest.

### Step 3 - Create the frontend `.env.local`

**Still in the repository root:**

```powershell
'VITE_API_BASE_URL=http://127.0.0.1:5000' | Set-Content -Encoding ascii .env.local
Get-Content .env.local
```

The frontend `.env.local` contains **only the backend URL**. **Never add Gemini, Cloudflare, Hugging Face, or database secrets to any `VITE_*` variable:** Vite exposes these to browser-side code.

### Step 4 - Create a Python environment and backend `.env`

**Move into `backend/` in the same Git repository.** A separate backend clone is not required.

```powershell
Set-Location .\backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Now create the complete `.env` template. This command uses the backend's exact configuration variable names; **you must add your own private credentials** before testing provider-backed features.

```powershell
@'
# Required for AI functions
GEMINI_API_KEY=PASTE_YOUR_PRIVATE_GEMINI_API_KEY_HERE
GEMINI_MODEL=gemini-3.6-flash
TAKEGRID_BUILDER_MODELS=gemini-3.1-flash-lite,gemini-3.8-flash

# Flask
FLASK_PORT=5000

# Optional: Cloudflare storyboard image generation
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_IMAGE_MODEL=@cf/black-forest-labs/flux-1-schnell

# Optional: experimental Hugging Face configuration
HF_TOKEN=
HF_IMAGE_MODEL=black-forest-labs/FLUX.1-schnell
'@ | Set-Content -Encoding ascii .env

# Open the file to paste your API key and, if needed, Cloudflare values.
notepad .env
```

| Variable | Required? | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | **For AI** | Server-side AI authentication. |
| `GEMINI_MODEL` | Configurable | Default model; the per-task router may select other models. |
| `TAKEGRID_BUILDER_MODELS` | Recommended | Project Builder primary/fallback priority; shown value worked in a development test. |
| `FLASK_PORT` | Recommended | Local Flask port, normally `5000`. |
| `CLOUDFLARE_API_TOKEN` | Only for Cloudflare images | Server-side Workers AI access token. |
| `CLOUDFLARE_ACCOUNT_ID` | Only for Cloudflare images | Account running the image model. |
| `CLOUDFLARE_IMAGE_MODEL` | Only for Cloudflare images | Image model identifier used by the backend. |
| `HF_TOKEN` / `HF_IMAGE_MODEL` | Optional | Experimental configuration; not required to start the core app. |

> [!WARNING]
> **Never commit `.env`, `.env.local`, keys, access tokens, or private project data.** If a key is exposed publicly, revoke and rotate it at the provider. Provider quota, billing, and model access depend on the account; adding a key alone cannot guarantee every AI/image request succeeds.

### Step 5 - Check backend syntax

```powershell
# Run from the backend directory.
.\.venv\Scripts\python.exe -m compileall -q app.py routes services
```

No output means Python syntax compilation passed; it does **not** prove an API key, a model, or Cloudflare is accessible.

### Step 6 - Start the Flask backend (Terminal A)

```powershell
# Run from the backend directory.
.\.venv\Scripts\python.exe app.py
```

Leave this terminal running. The expected address is **http://127.0.0.1:5000**. Model errors and service messages appear in the Flask terminal; do not paste credentials into issue reports.

### Step 7 - Start the React frontend (Terminal B)

Open a **second PowerShell terminal**. This command works when you cloned into the default `Documents` location used above:

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon"
npm run dev
```

Open the address printed by Vite, typically **http://localhost:5173**. If you cloned to a different folder, change `Set-Location` accordingly.

### Step 8 - Check the live app (Terminal C or another available prompt)

```powershell
# Flask should return JSON identifying a healthy service.
Invoke-RestMethod -Uri 'http://127.0.0.1:5000/api/health'
```

In the browser, check this sequence using your own story idea: **Create Project -> Save Story -> Open Project AI Chat -> Ask a question -> Test scene/shot planning -> Review Critics/Continuity -> Open Global AI -> Build New Project**. Test Cloudflare storyboard images separately only if you supplied working Cloudflare credentials.

### Step 9 - Build and run quality checks

Run from the **repository root**:

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon"
npm run build
npm run lint
```

A Vite warning about chunks over 500 kB does not mean the build failed. Lint success should only be claimed if the command returns successfully.

### Everyday commands (no reinstall needed)

**Terminal A - Flask:**

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon\backend"
.\.venv\Scripts\python.exe app.py
```

**Terminal B - React:**

```powershell
Set-Location "$HOME\Documents\GeNarrative-hackathon"
npm run dev
```

### Useful PowerShell and Git commands

| Task | Location | Command |
| :--- | :--- | :--- |
| Start frontend | Repo root | `npm run dev` |
| Production frontend build | Repo root | `npm run build` |
| Preview production build locally | Repo root | `npm run preview` |
| Check frontend lint | Repo root | `npm run lint` |
| Start backend | `backend/` | `.\.venv\Scripts\python.exe app.py` |
| Install backend dependencies | `backend/` | `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` |
| Compile backend Python files | `backend/` | `.\.venv\Scripts\python.exe -m compileall -q app.py routes services` |
| Show current branch | Repo root | `git branch --show-current` |
| Show changes | Repo root | `git status -sb` |
| Check staged whitespace | Repo root | `git diff --cached --check` |
| Update the current branch (only with clean worktree) | Repo root | `git pull --ff-only` |

### Common problems and troubleshooting

| Problem | First thing to check |
| :--- | :--- |
| `npm run dev` says missing script | You are not in the repository root. Run `Get-Location` and check `package.json`. |
| `npm ci` fails | Node/Vite compatibility and the existing lockfile. |
| Python imports fail | Create the venv and install `backend/requirements.txt` using the venv Python. |
| Backend returns connection refused | Flask must be running in Terminal A; check port `5000`. |
| Browser gets `Failed to fetch` | Frontend `.env.local` URL, Flask startup, port, and local CORS. |
| Gemini key is reported missing | Edit `backend/.env`, ensure it is not `.env.txt`, restart Flask. |
| Model response `429` | Quota/rate limit; check provider dashboard and per-model limits. |
| Model returns `503` | Model/server overload or temporary unavailability; check router logs. |
| Fallback returns `404` | Model identifier not enabled or accessible for this account/project. |
| Project Builder fails | Inspect `/api/global-ai/proposal` status and backend logs; check configured fallback models. |
| Cloudflare image request fails | Token, account ID, access permission, model availability, quota, and billing. |
| Stop button stops UI but usage continues | Browser cancellation cannot always stop already-started provider work. |
| Projects absent on another browser/device | Projects are currently browser-local, not cloud-synced. |
| README text is garbled | Preserve UTF-8; avoid recoding Unicode text with system-default encodings. |
| Another process occupies port 5173 | Stop the other Vite instance or verify the app/CORS configuration for the new port. |

> [!IMPORTANT]
> If you have an existing installation, **back up projects and check `git status` before pulling, switching branches, or deleting browser data**. Manual story changes are intentionally creator-controlled. Do not replace real data with mock projects to make a screen appear populated.

---

## 08. Technology stack

### Frontend

| Technology | Usage |
| :--- | :--- |
| **React 19** | Component-based user interface. |
| **Vite 8** | Development server, fast bundling, production frontend build. |
| **React Router 7** | Screen and project navigation. |
| **Tailwind CSS 4 + CSS** | Responsive styling and modular component design. |
| **Lucide React** | Consistent interface icons. |
| **Motion** | Animations and interactive transitions. |
| **Zustand** | Frontend state-management utilities. |
| **PDF.js (`pdfjs-dist`)** | Text extraction from supported PDF files. |
| **Browser localStorage** | Current local projects and related browser-side state. |

### Backend and AI

| Technology | Usage |
| :--- | :--- |
| **Python + Flask** | HTTP API and backend feature routes. |
| **Flask-CORS** | Local cross-origin access from the React dev server. |
| **Google Gen AI SDK (`google-genai`)** | Model calls, prompts, and AI service integration. |
| **Task-based model router** | Candidate-model priorities and limited failover for supported errors. |
| **Cloudflare Workers AI** | Optional storyboard-image generation. |
| **python-dotenv** | Local backend environment configuration. |
| **MySQL** | **Planned** durable database; not yet a required dependency. |

![Frontend](https://img.shields.io/badge/Frontend-React_%2B_Vite-646CFF?style=flat-square)
![Backend](https://img.shields.io/badge/Backend-Flask_%2B_Python-202020?style=flat-square)
![Storage](https://img.shields.io/badge/Storage-Browser_Local-F9AB00?style=flat-square)

---

<a id="architecture"></a>

## 09. Architecture

### System overview

```text
                        CREATOR / WEB BROWSER
                                 |
                         REACT + VITE APP
                                 |
                 +---------------+---------------+
                 |                               |
            HOME / GLOBAL AI               PROJECT WORKSPACE
                 |                               |
                 +---------------+---------------+
                                 |
                   FRONTEND SERVICE ADAPTERS
                                 |
                    FLASK REST API (backend/)
                                 |
                +----------------+----------------+
                |                                 |
           AI TASK ROUTES                    IMAGE ROUTE
                |                                 |
           MODEL ROUTER                    CLOUDFLARE AI
                |
          GEMINI MODEL API

      CURRENT PERSISTENCE: BROWSER LOCAL STORAGE
      FUTURE PERSISTENCE: MYSQL + ACCOUNT OWNERSHIP
```

### API integration layers

- **`src/services/workspaceApi.js`:** frontend boundary for project/workspace AI features.
- **`src/services/globalAI.js`:** frontend calls for Global AI conversation and project proposals.
- **`backend/routes/ai_routes.py`:** general AI service endpoints.
- **`backend/routes/project_ai_routes.py`:** project-scoped AI endpoints.
- **`backend/routes/global_ai_routes.py`:** Global AI and generated-project proposal endpoints.
- **`backend/services/gemini_model_router.py`:** task-specific model selection and supported failover behavior.
- **`backend/services/brand_identity.py`:** TAKEGRID identity behavior for the assistant.
- **`backend/services/image_generation_service.py`:** optional image generation integration.

### Example AI request flow

```text
Creator asks a project question
              |
              v
React validates local input
              |
              v
Flask receives project context
              |
              v
Relevant AI service + model routing
              |
              v
Response validation / error handling
              |
              v
Creator reviews the proposed output
              |
              v
Creator explicitly saves a change, if desired
```

### Repository structure

The directory diagram intentionally uses **ASCII characters** so it stays readable across Windows PowerShell, terminals, and GitHub Markdown viewers.

```text
GeNarrative-hackathon/
|-- public/                       # Static images and assets
|-- src/
|   |-- components/
|   |   |-- home/                 # Home dashboard + Global AI
|   |   |-- studio/               # Story, scenes, shots, storyboard
|   |   |-- workspace/            # Project AI Chat, Critics, Memory
|   |   |-- export/               # Export and backup UI
|   |   `-- layout/               # Navigation and responsive shell
|   |-- config/                   # TAKEGRID branding and app config
|   |-- pages/                    # Screens and workspace pages
|   |-- services/                 # Frontend API and data adapters
|   `-- main.jsx                  # React entry point
|-- backend/
|   |-- app.py                    # Flask server entry point
|   |-- requirements.txt         # Pinned Python dependencies
|   |-- routes/                  # AI API blueprints
|   |-- services/                # AI routing and task services
|   `-- utils/                   # Request helpers / validation
|-- package.json                 # Frontend scripts and dependencies
|-- package-lock.json            # Locked npm dependency graph
|-- vite.config.js               # Vite configuration
|-- TEAM_SETUP.md                # Additional contributor notes
`-- README.md                    # Project documentation
```

### Data boundaries and security

**Current:** Projects and substantial chat state are stored browser-locally; Flask handles API-based AI tasks. Backend-generated frames may use local server storage. **Planned:** database records, authenticated ownership, cross-device access, safer server-backed file storage, migration tools, and access controls.

**Never put long-lived AI credentials into React.** The frontend talks to Flask; Flask talks to the AI or image provider. The backend's development server is for local use, **not** an authenticated production deployment.

---

<a id="future-ai-and-voice-features"></a>

## 10. Future features

The following features are **planned or exploratory**. They are not claimed to be working in the current hackathon MVP.

### Upcoming AI voice and audio features

| Feature | Candidate model/capability | Creator experience | Priority |
| :--- | :--- | :--- | :--- |
| **Voice-to-Story** | Live transcription model | Speak story ideas directly into an editable text composer. | High |
| **Director's Voice Notes** | Transcription + current text AI | Turn spoken direction into reviewable scene notes. | High |
| **Script Read-Aloud** | Dedicated TTS model | Listen to narration and dialogue pacing. | High |
| **Dialogue Rehearsal** | Native audio dialogue / Live API | Practice a scene with an AI character voice. | Medium |
| **Live Creative Director** | Gemini Live API | Talk to an assistant while brainstorming; ask follow-ups by voice. | Medium |
| **Multilingual Dialogue Practice** | Live translation | Explore dialogue in different languages. | Medium |
| **Real-time creative analysis** | More capable Live reasoning models | Review complex story questions during a voice session. | Experimental |
| **Production assistant agent** | Agentic tools with permission controls | Support multi-step project planning under human oversight. | Research |

The team's candidate models include **Gemini 2.5 Flash Native Audio Dialog**, **Gemini 3 Flash Live**, **Gemini 3.5 Transcribe Live**, **Gemini 3.5 Live Translate**, and **Gemini 3.8 Live** variants. **Model names, API access, quota, and pricing can change**, so availability must be checked before selecting a production route. "Antigravity" is an agent platform/workflow concept rather than a drop-in replacement for a standard text model endpoint.

**Planned audio architecture:** Browser microphone -> permission and recording UI -> authenticated streaming/WebSocket backend -> transcription or live model -> editable text/audio response -> creator approval. The current Flask JSON POST API is **not**, by itself, a complete real-time audio service.

### Database, collaboration, and platform improvements

- **MySQL data persistence:** projects, stories, scenes, shots, characters, decision memory, and conversations stored beyond a single browser.
- **Safe migration:** import existing browser-local projects without silently deleting or overwriting originals.
- **Accounts and permissions:** secure sign-in, project ownership, role-based collaboration.
- **Server-backed media:** durable storage for storyboard frames and creator attachments.
- **Production deployment:** hosting configuration, secure API boundaries, environment separation, and monitoring.
- **Reliability:** controlled retries, quota-aware routing, observability, request evaluation, and systematic integration tests.

Useful official references: [Gemini models](https://ai.google.dev/gemini-api/docs/models) | [Gemini Live API](https://ai.google.dev/gemini-api/docs/live-api) | [API rate limits](https://ai.google.dev/gemini-api/docs/rate-limits)

---

<a id="team-runtime-error"></a>

## 11. Team Runtime Error - people and contributions

TAKEGRID is a collaborative hackathon project created by **Team Runtime Error** for **GeNarrative Clash 2026**. The roles below describe team responsibilities and documented work areas; they do not imply that every planned database or cloud service is already deployed.

| Team member | Role | Contribution and responsibilities |
| :--- | :--- | :--- |
| **Kuntal Sarkar** | **Team Leader, Architecture, Full-Stack & AI Integration** | Product and system architecture; technical direction; coordination of frontend and Flask services; AI integration, creative workflows, model routing, and end-to-end feature alignment. |
| **Aditi Singh** | **UI/UX & Database** | User-interface and user-experience design; screen flows, usability, and database-related design/development work. |
| **Diya Shree** | **Backend & Database** | Backend engineering and database workstream; server-side architecture, services, and data-contract planning. |
| **Swati Singh** | **UI/UX & Database** | Responsive UI/UX contributions, project interface refinement, and database-related design/development work. |

**Shared responsibilities:** testing, creative decisions, integration, documentation review, and hackathon preparation. Contributions evolve as teammates merge work through GitHub.

### Team details

| Field | Information |
| :--- | :--- |
| **Project** | TAKEGRID |
| **Team** | Runtime Error |
| **Event** | GeNarrative Clash 2026 |
| **Team leader** | Kuntal Sarkar |
| **Members** | Aditi Singh, Diya Shree, Swati Singh |
| **Repository** | [GeNarrative-hackathon](https://github.com/kuntal-sarkar/GeNarrative-hackathon) |
| **Working MVP branch documented here** | [`kuntal`](https://github.com/kuntal-sarkar/GeNarrative-hackathon/tree/kuntal) |

---

<a id="roadmap"></a>

## 12. Roadmap

### Phase 1 - Core MVP: implemented locally

- [x] Project-centered React frontend and Flask AI backend.
- [x] Story, scenes, shots, storyboard and character tools.
- [x] Project AI Chat and Global AI interactions.
- [x] AI Project Builder with a successful local project-creation test.
- [x] Creative Critics, Reimagine, Creative Memory and Continuity interfaces/services.
- [x] Project export/backup-oriented workflows.
- [x] Model routing and selected failover paths.
- [x] Successful frontend production build and backend Python compilation.

### Phase 2 - Data and reliability: next

- [ ] MySQL database schema and migrations.
- [ ] Durable backend project storage and safe browser-data import.
- [ ] Cross-browser and teammate environment testing.
- [ ] Full workflow QA, including restore, long requests, and model failures.
- [ ] Credential handling, logging discipline, request validation, and deployment preparation.

### Phase 3 - Audio and richer creative tools: planned

- [ ] Functional microphone input for Global AI and Project AI Chat.
- [ ] Spoken scene notes and transcription preview.
- [ ] Script narration / read-aloud.
- [ ] Character dialogue rehearsal and interactive voice brainstorming.
- [ ] Language translation and accessibility improvements.

### Phase 4 - Collaboration and production: future

- [ ] Secure accounts and role-based project access.
- [ ] Team collaboration and conflict-safe shared editing.
- [ ] Durable media storage and robust backup/recovery.
- [ ] Observability, automated tests, deployment, monitoring, and scaling.

---

## 13. Contribution guidelines

**Before making changes:** read this README, inspect the actual source code, and confirm your Git branch. The verified MVP code was first pushed to a feature branch; `main` and teammate branches may differ.

```powershell
# Run from the repository root.
git branch --show-current
git status -sb
git fetch origin

# Make a task-specific branch from your approved starting point.
git switch -c feat/describe-your-task

# After editing and testing, stage only the files you reviewed.
git add README.md
# Replace or add paths above for your own task.
git diff --cached --check
git diff --cached --stat

git commit -m "docs: describe the change"
git push -u origin feat/describe-your-task
```

Open a PR and review it before merging. **Do not push API keys, `.env`, local generated images, large personal backups, or virtual environments.** Do not introduce fake project data, hardcoded AI output, or silent story overwrites. Avoid destructive renaming or restructuring without an audit and a recoverable commit.

---

## 14. Privacy, current limitations, and reliability notes

- **Browser-local persistence:** Clearing browser storage can delete unsynced projects and chat history. Export and separately back up valuable work.
- **AI suggestions require judgment:** Verify important story facts, continuity warnings, and any potentially sensitive decisions.
- **No verified authentication:** The current local backend must not be treated as secure public multi-user infrastructure.
- **Provider limitations:** A 429 means rate/usage limits; 503 can mean temporary capacity problems; 404 may mean a model route is inaccessible. Model names may evolve.
- **Cancellation:** Stopping a frontend request or showing a cancellation toast does not guarantee that an already-started provider request stops using quota.
- **Image generation:** Cloudflare credentials, account permissions, and available quota are required; image availability is separate from text AI availability.
- **Deployment:** Frontend `npm run build` passing is not a production deployment. Flask's development server is for local development.
- **Access and ownership:** Before moving creative content to a shared server, introduce authentication, isolation, retention rules, backups, and safe input handling.

---

## 15. Why TAKEGRID fits GeNarrative Clash 2026

The event's theme is **where generative AI meets human creativity**. TAKEGRID makes that interaction concrete: AI supplies alternative viewpoints, context-aware suggestions, possible continuity findings, or an initial creative brief, while the filmmaker owns the final story and decisions.

The project does not aim to replace a director, screenwriter, or creative team. It aims to give them **more perspectives, clearer context, and a practical creative workflow** without losing authorship.

---

## Acknowledgements

Built by **Team Runtime Error**: **Kuntal Sarkar**, **Aditi Singh**, **Diya Shree**, and **Swati Singh**.

Thank you to the GeNarrative Clash 2026 organizers and the open-source ecosystem behind the tools used in TAKEGRID.

---

<div align="center">

### TAKEGRID

**Every creative decision has a story.**

**Create with intention. Review with context. Decide with confidence.**

**Team Runtime Error | GeNarrative Clash 2026**

[Back to top](#takegrid)

</div>
