<div align="center">

# FRAMEFORGE

### Every creative decision has a story.

**A human-first creative development workspace for filmmakers, writers, and storytellers.**

Take a story from concept to scenes, shots, and storyboard planning—then build towards transparent AI-assisted critique, continuity analysis, and creative decision memory without taking control away from the creator.

**GeNarrative Clash 2026 · Hackathon Project**  
**Built by Team Runtime Error**

![React](https://img.shields.io/badge/React-19-149ECA?style=for-the-badge&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-202020?style=for-the-badge&logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/Python-AI_Services-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-AI_Integration-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Status](https://img.shields.io/badge/Status-Active_Development-FF6B5B?style=for-the-badge)

[**Download ZIP**](https://github.com/kuntal-sarkar/GeNarrative-hackathon/archive/refs/heads/main.zip) · [**View Source**](https://github.com/kuntal-sarkar/GeNarrative-hackathon) · [**Quick Start**](#quick-start--frontend--backend) · [**Full Setup**](#getting-started--complete-local-setup) · [**Team**](#meet-team-runtime-error)

[Overview](#overview) · [Current Progress](#development-progress--feature-status) · [Features](#features-in-detail) · [Architecture](#architecture--system-design) · [Roadmap](#roadmap)

</div>

---

> [!IMPORTANT]
> **Project status — November 2026.** FRAMEFORGE includes a React frontend, Flask backend, project planning tools, and AI service integrations under active development. The repository's `TEAM_SETUP.md` records **Project AI Chat, Creative Critics, Continuity Checker, and Character Bible** as previously integrated/tested on the original development machine. **Every teammate must verify them locally** after configuring Flask and their Gemini key. AI scene breakdown, shot generation, and storyboard/image generation are still undergoing integration/verification. Database persistence and deployed production operation are **not claimed**. Feature status is based on project documentation and the public repository, not a successful end-to-end test performed here.

## Quick Start — Frontend + Backend

> **Windows / PowerShell recommended.** Run the **backend and frontend in two separate terminals**. For a full first-time setup and troubleshooting, see [Complete Local Setup](#getting-started--complete-local-setup) and [TEAM_SETUP.md](TEAM_SETUP.md).

**1. Download the source** — use [Download ZIP](https://github.com/kuntal-sarkar/GeNarrative-hackathon/archive/refs/heads/main.zip) and extract it, **or clone**:

```powershell
git clone -b main https://github.com/kuntal-sarkar/GeNarrative-hackathon.git
cd GeNarrative-hackathon
```

**2. Install frontend dependencies and configure local API URL** (repository root):

```powershell
npm install
Set-Content -Path '.env.local' -Value 'VITE_API_BASE_URL=http://127.0.0.1:5000'
```

**3. Prepare the backend** (same root, PowerShell):

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Create `backend/.env` yourself (do **not** commit it):

```dotenv
GEMINI_API_KEY=YOUR_PRIVATE_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.1-flash-lite
```

**4. Start both services:**

| Terminal A — Flask backend | Terminal B — React frontend |
| --- | --- |
| From `backend/`: ` .\.venv\Scripts\python.exe app.py ` | From repository root: `npm run dev` |
| Expected local address: `http://127.0.0.1:5000` | Usually: `http://localhost:5173` |

**5. Open** the Vite URL printed in Terminal B. A Gemini API key is required for backend-powered AI calls, but not for basic manual frontend operations. The app is **not** a hosted public demo; each teammate runs it locally.

> [!WARNING]
> Do **not** put `GEMINI_API_KEY` in `.env.local`, any `VITE_*` variable, the source code, or GitHub. The key belongs exclusively in the local Flask `backend/.env`.

---

## Overview

Creative work rarely follows a straight line. Ideas turn into scripts, scripts into scenes, and scenes into detailed camera shots. Feedback comes from multiple people; decisions evolve; and the reasons behind those decisions are easily lost. Story planning, shot planning, and critique often happen across separate tools.

**FRAMEFORGE** combines the core creative-development steps into one **project-centered workspace**. Its primary design principle is:

> **AI should strengthen human creative judgment—not replace it.**

The product's distinguishing direction is a **Creative Critics system**: different specialist viewpoints on the same creative material, transparent areas of agreement, and a deliberate creator decision such as **Accept**, **Modify**, or **Disagree with AI**. The creator's intention should become part of **Creative Memory**, helping future revisions preserve context.

The current milestone focuses on making the foundational project/story/scene/shot workflows usable **without fictional AI outputs or demo data**. Selected AI features have been integrated and tested on the original development machine; the next milestone is robust end-to-end verification and completing the remaining generation tools.

## The Problem We're Solving

| Challenge | What it means for creators | FRAMEFORGE's approach |
| --- | --- | --- |
| Fragmented creative planning | Stories, scenes, shot lists, and notes are disconnected | Keep planning inside a single project workspace |
| Feedback without context | Suggestions can be forgotten or applied without a record of intent | Give feedback an explicit human decision workflow |
| Limited perspectives | A single reviewer can miss artistic or audience-facing tradeoffs | Plan complementary AI critic perspectives |
| Continuity errors | Details may drift across scenes or revisions | Plan project-aware continuity analysis |
| Loss of creative ownership | Generated text or recommendations can be mistaken for final decisions | Never apply AI edits without creator approval |
| Difficult handoffs | New teammates or tools lack a reliable history of decisions | Organize project context and record decisions in Creative Memory |

## Our Solution at a Glance

```text
          HOME / PROJECT LIBRARY
                   |
         Create / Open Project
         or Import Real Script
                   |
                   v
          PROJECT WORKSPACE
                   |
          +--------+---------+
          |        |         |
        Story    Scenes     Shots
                            |
                         Storyboard
                   |
          +--------+---------+------------+
          |        |         |            |
        Critics  Memory  Continuity    Project AI Chat
          |                 (AI planned)  (AI planned)
     (AI planned)
                   |
                   v
         HUMAN CREATIVE DECISION
     Review · Accept · Modify · Disagree
                   |
            Preserve intent
```

**All project-specific data must remain connected to its own project.** A global Home Assistant and a project-aware AI Chat are separate product concepts.

## Development Progress & Feature Status

The table deliberately distinguishes **interactive frontend workflows**, **UI shells/integration points**, and **features that still need working AI/backend services**. A screen existing does not imply that its AI operation works.

| Module | Current documented progress | Implementation classification | What's still needed |
| --- | --- | --- | --- |
| Home Dashboard | Hero, quick-start entry points, recent-project access, home assistant area | Frontend workflow | Real, permission-scoped assistant responses |
| Project Library | Create/open/find/manage user projects | Frontend workflow | Server persistence, authenticated ownership, collaboration |
| Project Creation | Blank-project/script-oriented paths; AI-oriented entry option | UI + manual flows | Actual AI creation and final verification of cancel behavior |
| Script Import | PDF (selectable text), `.txt`, `.md` intake | Frontend workflow | More complex formats and optional OCR |
| Story Editor | Story title, genre, synopsis/content editing and explicit save workflow in documented frontend | Frontend workflow | Actual AI edits, revision comparisons, QA of save/unsaved state |
| Scenes | Create, edit, organize, and delete scenes manually | Frontend workflow | Real AI-powered scene breakdown, if added |
| Shots | Scene-linked shot planning, camera/direction notes, shot ordering | Frontend workflow | Genuine AI shot assistance |
| Storyboard | Shot-order visualization from real project data | Frontend visualization | Image references, generated frames, richer tools |
| Project Workspace | Project-specific Story, Scenes, Shots, Storyboard, Critics, Memory, Chat, Continuity navigation | Frontend workflow | Continued navigation and responsive QA |
| Creative Critics | Backend-linked review previously tested on development machine; human decision UI | **Previously tested; retest locally** | Verify results, stability, evidence, multi-perspective consensus |
| Creative Memory | Project-specific intent/decision recording and viewing as documented | Frontend workflow | Connected storage and use as AI context |
| Continuity Checker | AI continuity workflow previously tested on original machine | **Previously tested; retest locally** | Validate findings and project context on each laptop |
| Project AI Chat | Flask/Gemini integration previously tested on original machine | **Previously tested; retest locally** | Validate contextual replies, failures, and save behavior |
| Character Bible | AI character analysis listed as previously integrated/tested in TEAM_SETUP.md | **Previously tested; retest locally** | Confirm character extraction, edits, storage, and project scope |
| Global/Home Assistant | Dashboard assistant UI | UI/integration foundation | Verify reliable overview of actual project status |
| Responsive Layout | Desktop sidebar, mobile bottom navigation | Frontend workflow | Device-by-device visual/accessibility verification |
| Local Data Storage | Browser `localStorage`-based project persistence | Local persistence | Database migration, backups, synchronization |
| API Service Boundary | Frontend service adapter concept, including `workspaceApi.js` | Integration foundation | Final contract, Flask endpoints, auth, error cases |
| Backend + Gemini | Flask service and Gemini integration code documented by team setup | **Previously tested for selected flows** | Repeat end-to-end tests; finish other AI services |
| Hosted DB + Auth | Backend/DB development workstream | **Not verified integrated** | Working schema, migrations, secure project access |

### What the current frontend milestone achieves

- A structured **story-to-scene-to-shot** journey based on **real user input**.
- Project-specific workspace organization rather than scattered global tools.
- A manual planning experience usable before AI services exist.
- A visual storyboard representation based on planned shots.
- Dedicated entry points for the future Critics, Continuity, Memory, and Chat capabilities.
- Responsive presentation and browser-local data storage.
- Service boundaries that can be wired to Flask without embedding Gemini secrets into React.

### Important status and QA caveat

Some refinements were discussed or requested after the previous successful build. Without the latest source snapshot, their **final completion should be verified**, including: avoiding accidental `Untitled project` creation when cancelling; ensuring the existing Story tab does not repeat new-project setup; an explicit Save/unsaved-changes experience; clearer visual separation of Scenes and Shots; and the mobile Settings icon. These are recorded as **QA targets**, not silently claimed as shipped fixes.

## Features in Detail

### 1. Home Dashboard

The home screen provides the starting point for the app: introduction/hero content, quick-start actions, project access, recent projects, and the **Home Assistant** area. The assistant's intended future job is to discuss the user's actual projects and high-level progress. It is **not** the same as the assistant attached to one specific project.

The dashboard should be populated from genuine stored project data. A new user should see a meaningful empty state—not invented project cards or fabricated assistant messages.

### 2. Project Library & Creation

A project is the top-level unit for all creative work. Users should be able to deliberately create, find, open, and manage their projects, with story, scenes, shots, and supporting tools belonging to the active project.

Supported design directions include starting a blank project or importing a real script. An AI-assisted start is a **future integration**, not a fake generation workflow. Cancelling creation must not persist an unwanted empty/`Untitled` project; verify that behavior in the current build.

### 3. Script Import

The documented prototype can extract content from **text-based PDF**, **TXT**, and **Markdown** files and move it into a user-controlled editing workflow. Browser-side text extraction is intended for PDFs containing selectable text; an image-only/scanned PDF requires OCR that is **not included**. Original layout or page formatting may not survive extraction perfectly.

### 4. Story Editor

The Story area represents the project's core writing material: story title, synopsis, genre, and body content where supported. The product requirement is **explicit Save**, so the creator remains in control of edits rather than committing every keystroke automatically.

Inside an existing project, the desired editing choices are **Edit story by own** and **Edit by AI** (the latter must remain disabled or clearly labeled pending until real service integration). Initial **Start from scratch** setup choices should appear at project creation, not repeatedly inside an existing project's Story tab.

### 5. Scene Breakdown

Scenes describe **narrative units**: events, locations, character interactions, and story action. The current intended/recorded workflow is manual scene CRUD (create, edit, organize, delete). A scene is **not** a camera shot. Scene information should be tied to its parent project and easy to read independently of shot-level data.

**No simulated AI scene parsing:** An earlier local regex-based scene parser and seeded example story content were removed/archived during cleanup. Future AI breakdowns should come from genuine backend analysis and remain reviewable before being applied.

### 6. Shot Planner

Shots represent the **camera/visual execution** of a scene. The documented workflow supports manually planning scene-linked shots, their direction/camera notes, and their order. Scenes and Shots should be visibly and conceptually distinct, even when they share navigation within the project workspace.

### 7. Storyboard

The current storyboard presents an **ordered visual sequence of planned shots** using actual project content. It is a planning view—not a claim that images were generated by AI. Reference-image management, AI frame generation, and advanced storyboard editing are potential future improvements.

### 8. Creative Critics — The Flagship AI Concept

FRAMEFORGE is designed to invite multiple independent *perspectives*, rather than deliver one opaque verdict:

| Proposed critic perspective | Focus |
| --- | --- |
| **Visual Director** | Framing, compositions, camera logic, visual storytelling |
| **Story Editor** | Structure, pacing, character arcs, narrative coherence |
| **Copywriter** | Dialogue, wording, tone, and clarity |
| **Audience Perspective** | Engagement, emotion, comprehensibility, likely audience reaction |
| **Marketing Perspective** | Positioning, audience fit, communication and discoverability |

**Proposed operation:** A creator selects real project material; the backend sends relevant context to role-specific Gemini prompts or configured services; structured critique is validated; the frontend presents each perspective and the actual supporting rationale. Where independent results genuinely agree, the UI can display a grounded consensus such as *3 of 5 perspectives suggested a change*—**never a pre-filled count**.

The human controls the result: **Accept**, **Modify**, or **Disagree with AI**. Rejecting a suggestion is a valid creative choice, and the reasoning should be preserved. **This live multi-perspective inference pipeline has not yet been confirmed operational.**

### 9. Creative Memory

The purpose of Creative Memory is to preserve **what a creator intended, what was recommended, what they decided, and why**. The documented frontend includes project-specific memory/decision management. In the planned AI system, relevant remembered decisions can inform later advice without being treated as irreversible instructions.

### 10. Continuity Checker

The Continuity area lays groundwork for identifying inconsistencies across a project. Planned future categories include timeline changes, character facts/behavior, locations, scene logic, and prop/object continuity. A valid finding should point to the relevant project evidence and allow the creator to mark intentional deviations. **An AI continuity flow was previously tested on the original development machine; results should be revalidated in each setup.**

### 11. Project AI Chat and Home Assistant

- **Project AI Chat:** Context-aware project chat with a Flask/Gemini integration previously tested on the original development machine; verify current response quality and error handling.
- **Home Assistant:** Future high-level help with actual project status and navigation.
- **Continuity follow-up chat:** A discussed extension for asking questions about consistency findings.

Interfaces and architecture may exist, but responses **must not be invented** while endpoints are disconnected.

### 12. Responsive Experience

The latest discussed UI direction includes a **slim, static desktop sidebar**, a **compact, floating mobile bottom navigation**, modern cards, and clear project-local navigation. Screen-size changes should not remove essential project tools. Settings visibility on mobile remains a regression-check item.

## Design System & UX Direction

The most recent agreed color direction is:

| Purpose | Color |
| --- | --- |
| Main background | `#FFF4DC` — warm cream |
| Main highlight / calls to action | `#FF6B5B` — coral |
| Text / static structural elements | `#172A46` — deep navy |
| Complementary accent | `#1B93F5` — bright blue |
| Cards, input and search surfaces | White, distinct from the page background |

**Design principles:** minimal, contemporary, legible, project-focused; no unnecessary liquid-glass effects, no decorative sparkle icons, and no oversized navigation. Use separate reusable React components and CSS modules/files where appropriate. These colors are the **agreed design target**; visual consistency across the latest code should still be checked.

## Architecture & System Design

### Current frontend, local backend, and target production architecture

```text
                      USER / BROWSER
                             |
                    React + Vite Frontend
                             |
           +-----------------+------------------+
           |                 |                  |
      Pages / Routes    UI Components       App State
           |                 |                  |
           +-----------------+------------------+
                             |
                 Project / Workspace Services
                             |
             +---------------+----------------+
             |                                |
      Current localStorage            Planned Flask REST API
      (browser-only data)                     |
                                     Auth + validation + project scope
                                              |
                                +-------------+------------+
                                |                          |
                          Gemini AI calls            Database/storage
                           (server-side)               (planned)
                                |
                         Validated proposals
                                |
                        Human reviews outcome
```

Flask and Gemini are used for selected locally tested AI flows. Any hosted production deployment, durable database, and untested AI generation routes remain **target architecture**, not verified shipped infrastructure.

### Frontend stack

| Area | Technology | Role |
| --- | --- | --- |
| Application | **React 19** | Component-driven frontend |
| Development/build | **Vite 8** | Dev server, bundling, production build |
| Routing | **React Router 7** | Pages and project workspaces |
| Styling | **CSS + Tailwind CSS 4** | Structured responsive UI |
| Icons | **Lucide React** | Icon system |
| Motion | **Motion** | UI transitions/animations |
| Local state | **Zustand** | State-management utilities |
| PDF text import | **PDF.js (`pdfjs-dist`)** | Extract selectable PDF text |
| Data persistence | **Browser `localStorage`** | Current project persistence |
| Future API layer | **Python + Flask** | Project/AI endpoints, validation, server logic |
| Future AI provider | **Gemini API** | Story assistance, critique, chat, continuity |
| Future DB | **Database technology/schema to confirm** | Durable authenticated data and relationships |

*Versions above are those in the supplied earlier documentation; consult the actual `package.json`/lockfile before treating them as exact installed versions.*

### Core data relationships (conceptual, not a verified DB schema)

```text
User [future authentication]
  └── Project
       ├── Story / revisions
       ├── Scenes
       │    └── Shots
       │         └── Storyboard ordering / references
       ├── Critic review sessions
       │    ├── Individual findings
       │    └── Human decisions
       ├── Creative Memory entries
       ├── Continuity review and findings
       ├── Project chat history
       └── Character Bible [previously locally tested]
```

Project IDs, stable record identifiers, and appropriate ownership/permission checks should protect project boundaries. A production database migration must not silently erase existing local projects.

### Backend-ready service layer

The prior development handoff documents a frontend service boundary at `src/services/workspaceApi.js`. An example development configuration is:

```dotenv
VITE_API_BASE_URL=http://localhost:5000
```

The originally discussed endpoint family was **proposed**, not verified as a live contract:

```http
POST /api/projects/:projectId/ai/:operation
```

Before implementing, inspect actual service methods and coordinate request/response structures with the backend and database workstreams. Validate inputs/outputs, show honest failure states, use appropriate access control, and require human approval for creative edits.

> [!CAUTION]
> **Never put a Gemini API key or database secret into `VITE_` variables or frontend code.** Vite client variables are exposed to the browser. Gemini credentials, model calls, and privileged database access belong on the backend.

### AI orchestration — target design

```text
User selects a real project artifact
                |
        Frontend sends request
                |
        Flask validates access
                |
        Collect relevant context
                |
  Gemini task / critic perspective(s)
                |
    Parse + validate structured result
                |
     Present suggestions / evidence
                |
    Human Accept / Modify / Disagree
                |
        Save intentional decision
                |
             Creative Memory
```

Future considerations include contextual retrieval/RAG, caching, response safety guardrails, error handling, evaluations, request logging/observability, RBAC, and optional OAuth. **These are architecture goals, not claims of shipped features.**

## Project Structure

The following is a **documented, representative** layout from prior work and handoffs; inspect the latest repository for an authoritative tree:

```text
GeNarrative-hackathon/
├── public/                         # Public static files
├── src/
│   ├── assets/                     # Images / branding assets
│   ├── components/
│   │   ├── home/                   # HomeHero, QuickStart, RecentProjects, HomeAssistant
│   │   ├── projects/               # Project-related UI
│   │   ├── studio/                 # Story, Scene, Shot, Storyboard modules
│   │   ├── workspace/              # ProjectCritics, ProjectMemory, ProjectAIChat,
│   │   │                           # ProjectContinuity
│   │   ├── layout/                 # Navigation, shell, responsive layout
│   │   └── ui/                     # Reusable elements
│   ├── config/                     # App settings and navigation configuration
│   ├── pages/                      # Home, Studio, ProjectWorkspace, etc.
│   ├── services/                   # projectService, workspaceApi and related adapters
│   ├── store/                      # Client state
│   ├── hooks/                      # Shared hooks
│   ├── styles/                     # Global styles
│   ├── App.jsx                     # Application routing
│   └── main.jsx                    # React entry point
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── FRAMEFORGE_PROJECT_CONTEXT.md   # Internal engineering/AI handoff document
```

## Getting Started — Complete Local Setup

This section mirrors the project's [TEAM_SETUP.md](TEAM_SETUP.md) for **Windows PowerShell** and covers both frontend and backend. It assumes you have access to the repository and a valid Gemini API key for AI calls.

### Prerequisites

Install **Git**, **Node.js + npm** (a version supported by the repository's Vite version), **Python + pip**, and a code editor. Verify:

```powershell
git --version
node --version
npm --version
py --version
```

### Download / clone / update

**Download without Git:** [Download latest repository ZIP](https://github.com/kuntal-sarkar/GeNarrative-hackathon/archive/refs/heads/main.zip), extract it, and open the extracted folder in a terminal.

**Clone with Git (recommended for contributors):**

```powershell
git clone -b main https://github.com/kuntal-sarkar/GeNarrative-hackathon.git
cd GeNarrative-hackathon
```

**Already cloned?** From the repository root, if your changes are committed or safely backed up:

```powershell
git switch main
git pull origin main
```

Do not pull over important uncommitted work without checking `git status` first.

### Frontend installation and configuration

**Run from the project root**, where `package.json` exists:

```powershell
npm install
Set-Content -Path '.env.local' -Value 'VITE_API_BASE_URL=http://127.0.0.1:5000'
```

The root `.env.local` contains **only the local Flask URL**, not an API key. Restart Vite if you change it. To launch:

```powershell
npm run dev
```

Open the terminal-reported URL (commonly **http://localhost:5173**).

### Backend installation and configuration

Open **Terminal A** in the project root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Create `backend/.env` (not `.env.txt`) with the following **template only**:

```dotenv
GEMINI_API_KEY=YOUR_PRIVATE_GEMINI_API_KEY
GEMINI_MODEL=gemini-3.1-flash-lite
```

The model identifier above comes from the team's setup document; confirm availability and configuration if your Google AI account differs. You can use a privately shared team development key or your own key. Usage quotas and possible charges apply to the corresponding provider account. **Never commit `.env`.**

Run Flask from the `backend/` directory:

```powershell
.\.venv\Scripts\python.exe app.py
```

The expected local URL is **http://127.0.0.1:5000**; if your terminal reports another port, update `VITE_API_BASE_URL` in root `.env.local` and restart React. Using the virtual environment's Python executable directly avoids PowerShell activation-policy issues.

### Run frontend and backend simultaneously

Keep **two separate terminals open**:

| Terminal | Working directory | Command | Purpose |
| --- | --- | --- | --- |
| **A — Backend** | `GeNarrative-hackathon/backend` | `.\.venv\Scripts\python.exe app.py` | Flask REST API and Gemini calls |
| **B — Frontend** | `GeNarrative-hackathon` | `npm run dev` | React/Vite user interface |

**Local architecture:** Browser (`localhost:5173`) → Flask (`127.0.0.1:5000`) → Gemini API (for supported AI actions). The frontend is usable for manual project work without a key; AI actions require a running configured backend.

### Development and production commands

Run frontend commands in the **repository root**:

```powershell
npm run dev       # Development server
npm run build     # Build distributable frontend
npm run preview   # Preview built frontend
npm run lint      # Static linting (if available in current package.json)
```

Run backend commands inside **`backend/`**:

```powershell
.\.venv\Scripts\python.exe app.py
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

> [!NOTE]
> `npm run preview` is a **local frontend preview**, not a hosted deployment. Flask must still run separately for backend-backed features. This repository's documented workflow is local development, not a published deployment guide.

### Verify installation and AI features

1. Confirm the React page opens; create a project and save real story content.
2. Confirm Flask runs without missing-module or missing-key errors.
3. Test **Project AI Chat**, **Creative Critics**, **Continuity Checker**, and **Character Bible**. These were documented as working on the original development machine; **verify on every new laptop**.
4. Treat **AI scene breakdown, AI shot generation, and storyboard/image generation** as active integration/QA work until tested in your current checkout.
5. Verify project data stays associated with its correct project. `localStorage` content does **not** sync through Git.

### Troubleshooting

| Problem | Fix / check |
| --- | --- |
| `npm run dev` fails | Run from repository root; verify `package.json`, Node version, then `npm install` |
| Python cannot import a dependency | Reinstall with `backend/.venv/Scripts/python.exe -m pip install -r requirements.txt` |
| Flask connection refused / `Failed to fetch` | Start Terminal A, confirm the actual port, and inspect root `.env.local` |
| `GEMINI_API_KEY` missing | Create `backend/.env`; check the name is not `.env.txt`, restart Flask |
| Gemini `401` / `403` | Verify key, account permissions, and selected model access |
| Gemini `429` | Check provider quotas or rate limits; a shared key shares quotas |
| `/` on Flask returns `404` | The API may have no root route; inspect Flask output and use a defined endpoint |
| AI image generation fails | Confirm that image service/provider and any additional credentials are configured |
| Projects absent on a teammate's device | Expected with browser `localStorage`; Git does not transfer user projects |
| Port `5000` or `5173` already occupied | Stop conflicting process, or update URL/port configuration consistently |

### Safe collaboration

```powershell
git status
git switch -c feature/your-task
# Edit project files, then selectively stage only reviewed changes:
git add src backend README.md
git commit -m "feat: describe your change"
git push -u origin feature/your-task
```

Open a PR into `main`. **Do not indiscriminately use `git add -A` without reviewing the staged files**: the project has previously accumulated local patch scripts, backups, and temporary files. Always keep `.env`, `.env.local`, and virtual environments out of version control. See [TEAM_SETUP.md](TEAM_SETUP.md) for the complete teammate onboarding workflow.

## Data Handling, Security & Limitations

- **Browser-local persistence:** `localStorage` does not sync between users, browsers, devices, or private windows.
- **Data loss risk:** Clearing browser data can remove local projects. Keep independent copies of valuable original scripts.
- **No verified production authentication or collaboration:** Do not claim multi-user authorization, cloud sync, or shared live editing until it is implemented and tested.
- **Script import limitations:** Text PDFs are supported in the documented frontend; scanned PDFs need OCR; formatting preservation may be incomplete.
- **AI verification is feature-specific:** Chat, Critics, Continuity, and Character Bible were previously tested on the original machine per `TEAM_SETUP.md`; other AI generation features still need verification and/or integration.
- **Decision safety:** Model-produced suggestions are untrusted proposals until validated and explicitly approved by the creator.
- **Future user privacy:** Implement ownership isolation, data retention policies, input limits, safe file handling, and access checks before hosting real user content.
- **Accessible design:** Continue keyboard, focus, readable contrast, form labels, and mobile verification as the app evolves.

## Development History & Engineering Decisions

The following documents **meaningful progress and lessons**, without implying all historical patch files still exist in the latest tree:

1. **Initial product vision:** A story-centered, human-first creative assistant for GeNarrative Clash 2026.
2. **Frontend foundation:** React/Vite app structure, routing, modular UI components, responsive navigation, and chosen visual identity.
3. **Early workflow design:** Home, Studio, Projects, story setup, scene breakdown, shots, and workspace planning.
4. **Data integrity cleanup:** Removed/archived mock projects, sample stories, and local regex-based scene parsing. User content should be the only source for real project entries.
5. **Build stabilization:** Previous duplicate React-hook imports and a missing `parseScenes` export caused build issues; cleanup changes subsequently produced a successful build as reported during development.
6. **Project workspace integration:** Creative modules were reorganized conceptually/through patches into individual project workspaces; project AI Chat, Critics, Memory, and Continuity areas were introduced as project-level components.
7. **UI refinement:** Evolved navigation to a slimmer desktop sidebar and compact mobile bottom pill; established final cream/coral/navy/blue theme.
8. **Current refinement focus:** Accidental empty-project prevention, more deliberate Story editing/Save behavior, clearer Scenes vs Shots design, mobile settings visibility, and frontend/backend handoff.
9. **Next engineering phase:** Complete/test Flask + Gemini endpoints and real persistent database integration with honest progress reporting.

**No mock data, fake AI success, or local parser shortcuts should be reintroduced to make unfinished features appear complete.**

## Roadmap

### Milestone 1 — Interactive project-centered frontend

- [x] Home dashboard and project entry points
- [x] Responsive desktop/mobile navigation foundation
- [x] Project library and user-driven project workflows
- [x] Story editing UI and manual creative planning
- [x] PDF/TXT/Markdown import support (selectable-text PDFs)
- [x] Scene planning and shot planning workflows
- [x] Ordered storyboard visualization
- [x] Project-specific Critics, Memory, Continuity, and AI Chat areas
- [x] Browser-local project persistence
- [x] Backend-ready service boundary and documentation
- [x] Removal of previously used fictional sample-data / fake parsing flow in documented cleanup

### Milestone 1 QA — Check against latest frontend build

- [ ] Verify cancelled creation never leaves a blank `Untitled project`
- [ ] Verify existing-project Story tab offers appropriate edit paths, not project-creation options
- [ ] Verify explicit Save, unsaved-change indication, and no unwanted Story autosave
- [ ] Verify Scenes and Shots layouts are clearly distinct
- [ ] Verify mobile Settings control and project navigation on supported screens
- [ ] Verify no leftover mock data or fake AI output has returned

*Unchecked QA items indicate **unverified final completion**, not proof the implementation is broken.*

### Milestone 2 — Functional AI/backend/database integration

- [ ] Verify and integrate Flask API with frontend service layer
- [ ] Wire real Gemini calls server-side; handle loading, errors, and rate limits
- [ ] Add evidence-grounded multi-perspective Creative Critics
- [ ] Calculate truthful consensus from actual returned findings
- [ ] Implement story editing proposals and scene/shot assistance with human approval
- [ ] Implement real continuity analysis over current project data
- [ ] Revalidate project-context AI Chat on teammates' setups; integrate reliable Home Assistant responses
- [ ] Connect authenticated, durable database storage and safe migrations
- [ ] Persist critic decisions and make approved Creative Memory available as relevant AI context

### Milestone 3 — Product hardening and advanced workflows

- [ ] Harden previously tested Character Bible integration and persist character facts durably
- [ ] Storyboard reference media and optional generated frames
- [ ] Revision history, review diffs, undo/restore
- [ ] Export, import/backup, and recovery paths
- [ ] Proper authentication/authorization, RBAC, and collaboration where appropriate
- [ ] RAG/context management, evaluation, observability, caching, and AI guardrails
- [ ] Accessibility QA, automated testing, release/hosting documentation

## Meet Team Runtime Error

FRAMEFORGE is a collaborative project by **Team Runtime Error** for **GeNarrative Clash 2026**. The contributors below are credited for the responsibilities and workstreams described by the team. Backend/DB or AI **contribution credit does not imply that every planned service has been deployed or connected**.

| Team member | Position | Contributions and responsibility areas |
| --- | --- | --- |
| **Kuntal Sarkar** | **Team Leader · System Architect · Full-Stack & AI Integration** | Led the product architecture, end-to-end system design and technical direction; worked on full-stack development, application structure, service integration planning, and AI integration/workflow design; coordinated how frontend, backend, and AI experiences connect. |
| **Aditi Singh** | **Team Member · UI/UX & Database** | Major contribution to interface and user-experience design, user-facing workflow planning, and database-related design/development work; collaborated on making the app coherent and usable. |
| **Diya Shree** | **Team Member · Backend & Database** | Major contribution to backend engineering and database development/planning, including the server-side data and service layer needed to support the frontend and future AI capabilities. |
| **Swati Singh** | **Team Member · UI/UX & Database** | Contributed to interface and user-experience design, screen/workflow refinement, and database-related design/development work. |

### How the team collaborates

- **Architecture, overall technical direction, full-stack flow, AI integration:** Kuntal Sarkar (Team Leader).
- **Backend services and database:** Diya Shree, working with the team on API/data contracts.
- **UI/UX and database contributions:** Aditi Singh and Swati Singh.
- **Product decisions, integration, testing, and hackathon delivery:** Shared team responsibility.

All four members contributed to the direction and development of FRAMEFORGE; the credits are meant to recognize both **individual ownership areas** and **collaboration across the product**.

### Project & team information

| Field | Detail |
| --- | --- |
| **Project** | FRAMEFORGE |
| **Team** | Runtime Error |
| **Event** | GeNarrative Clash 2026 |
| **Team leader** | Kuntal Sarkar |
| **Member 1** | Aditi Singh |
| **Member 2** | Diya Shree |
| **Member 3** | Swati Singh |
| **Repository** | [GeNarrative-hackathon](https://github.com/kuntal-sarkar/GeNarrative-hackathon) |
| **Development status** | Interactive frontend and Flask/Gemini flows in development; selected features previously tested locally |

## Hackathon Fit & What Makes It Different

**Theme alignment:** FRAMEFORGE explores *where generative AI meets human creativity* by treating the AI as an **explainable collaborator** and keeping the author/filmmaker responsible for the final creative decisions.

Our intended differentiators are:

1. **Multiple perspectives**, not just a single generated response.
2. **Human disagreement is a feature**, not an error—intentional rejection can be preserved.
3. **Creative Memory** to retain decisions and their rationale between revisions.
4. **An end-to-end story-to-shot planning flow** where critique is contextual, rather than a detached prompt box.
5. **Clear and honest separation of prototype UI and functional AI services.**

Judges should evaluate the currently working interactive workflows and the proposed AI architecture separately. When the live AI/backend integration is ready, update this README and supply real end-to-end evidence.

## Contributing & Working With the Codebase

**Teammates and AI coding assistants:** Read [FRAMEFORGE_PROJECT_CONTEXT.md](./FRAMEFORGE_PROJECT_CONTEXT.md) alongside this README before modifying the project. That document contains the detailed decisions, known regressions, architecture discussion, and guardrails from previous development sessions.

When making changes:

1. Pull the latest agreed branch and **inspect the actual files** before replacing components or imports.
2. Preserve working project data and existing localStorage behavior; never clear storage as a quick fix.
3. Do not add demo projects, canned critique, dummy AI chat messages, or regex-fabricated scene breakdowns.
4. Use modular React components, clear service interfaces, and project-scoped IDs.
5. Keep Gemini secrets and database credentials server-side.
6. Make narrow changes, run `npm run build`, and run configured checks where available.
7. Report which files changed, what you tested, and what is **working vs. still pending**.
8. Coordinate shared data contracts between frontend, backend, and database contributors before integration.

## Acknowledgements

**FRAMEFORGE is built by Team Runtime Error:** Kuntal Sarkar, Aditi Singh, Diya Shree, and Swati Singh. The team's shared goal is to create technology that respects artistic intention while making creative development more organized, collaborative, and informed.

---

<div align="center">

### FRAMEFORGE

**Create with intention. Decide with confidence.**

Made with dedication by **Team Runtime Error** · **GeNarrative Clash 2026**

</div>
