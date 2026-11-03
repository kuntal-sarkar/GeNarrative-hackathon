<div align="center">

# FRAMEFORGE

### Every creative decision has a story.

**A human-first creative workspace for filmmakers and storytellers.**  
Organize scripts, scenes and shots, review creative suggestions, and preserve the reasoning behind every decision.

**GeNarrative Clash 2026 · Hackathon Prototype**

[Explore the Repository](https://github.com/kuntal-sarkar/GeNarrative-hackathon) · [Features](#features-and-current-status) · [Run Locally](#getting-started) · [Roadmap](#roadmap)

</div>

---

## Overview

Creative projects rarely evolve in a straight line. A story becomes a script, a script becomes scenes, scenes become shots, and each iteration introduces new creative choices. Traditional workflows can scatter the writing, planning and feedback across disconnected tools.

**FRAMEFORGE** brings those steps into a single project-centered experience. Its core premise is simple: **AI should assist creative judgment, not replace it.** The creator remains responsible for accepting, modifying, or rejecting suggestions—and can record *why* a choice was made.

> **Prototype status (November 2026):** The frontend is implemented and runs locally. Manual project/story/scene/shot workflows and browser-local persistence are available. AI generation, AI critics, AI chat responses and automated continuity analysis are **not yet connected** to a live backend. The app does not display fabricated AI results.

## The Problem

- **Fragmented production planning:** A story, scene breakdown and shot plan often live in separate documents.
- **Feedback without accountability:** Suggestions can be accepted or rejected without capturing the creator's intent.
- **Creative context gets lost:** A later revision may overlook why an earlier decision was intentional.
- **AI without clear boundaries:** Generative tools can appear to make decisions on behalf of the author instead of helping them make informed choices.

## Our Approach

FRAMEFORGE is designed around a **human-in-the-loop** workflow:

1. **Create or import** a story project.
2. **Develop** its story, scenes and shot plan using manual editing tools.
3. **Inspect** the storyboard sequence and project information together.
4. **Review** proposed feedback through creative critic interfaces (AI-backed reviews are planned).
5. **Accept, modify or reject** suggestions, preserving human control.
6. **Record intentions and decisions** in Creative Memory, so future revisions have context.

## Features and Current Status

| Area | What it does | Current status |
| --- | --- | --- |
| Home dashboard | Entry points, recent projects and project-oriented navigation | **Implemented (frontend)** |
| Project library | Create, find, open and manage projects | **Implemented (frontend)** |
| Project setup | Start from a blank project, provide a script or choose an AI-oriented flow | **UI implemented; AI generation pending** |
| Script import | Extract selectable text from PDF, TXT and Markdown files | **Implemented (frontend)** |
| Story editor | Edit title, synopsis, genre and story content; explicitly save changes | **Implemented (frontend)** |
| Scene breakdown | Create, edit, organize and remove scenes | **Implemented (frontend)** |
| Shot planner | Manage scene-level shots, camera directions and shot order | **Implemented (frontend)** |
| Storyboard | View planned shots as an ordered visual sequence | **Implemented (frontend); AI images pending** |
| Project workspace | Navigate Overview, Story, Scenes, Shots, Storyboard and creative tools within each project | **Implemented (frontend)** |
| Creative Critics | Project-level and global review interfaces, including decision workflows | **Frontend workflow; new AI reviews pending** |
| Creative Memory | View and record project-specific intentions and creative decisions | **Implemented (frontend)** |
| Continuity checker | Interface for reviewing narrative consistency | **UI implemented; AI analysis pending** |
| Project AI Chat | Conversation management and contextual chat interface | **Frontend UI; AI responses pending** |
| Responsive experience | Desktop navigation and mobile-friendly project workflows | **Implemented (frontend)** |
| Persistence | Store locally created projects and related data in browser storage | **Implemented (localStorage)** |

### The Creative Critic Concept

The planned multi-perspective AI review panel evaluates creative work through complementary roles such as **Visual Director, Story Editor, Copywriter, Audience Perspective and Marketing Perspective**. The goal is not to produce a single unquestionable answer, but to present viewpoints that the creator can evaluate and challenge.

The UI is built around **human approval**: creators can accept, modify or reject feedback rather than silently applying it. **Live multi-agent inference and consensus generation are planned integrations, not current working services.**

## Project Workflow

```text
Home / Project Library
         |
         v
Create Project or Import Script
         |
         v
  Project Workspace
         |
         +-- Story Editor
         +-- Scene Breakdown
         +-- Shot Planner
         +-- Storyboard
         +-- Creative Critics (AI pending)
         +-- Continuity Review (AI pending)
         +-- Creative Memory
         +-- Project AI Chat (AI pending)
         |
         v
Human reviews decisions and saves changes
```

## Tech Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Frontend | **React 19** | Component-based UI |
| Build tooling | **Vite 8** | Development server and production builds |
| Routing | **React Router 7** | Page and project workspace navigation |
| Styling | **CSS + Tailwind CSS 4** | Responsive presentation |
| UI motion | **Motion** | Interface animations |
| Icons | **Lucide React** | Consistent interface iconography |
| State utilities | **Zustand** | Client-side state tooling |
| Script handling | **PDF.js (`pdfjs-dist`)** | Browser-side extraction from text-based PDFs |
| Current data storage | **Browser `localStorage`** | Temporary project persistence |
| Planned AI service | **Flask + Gemini API** | AI generation, critique, conversation and continuity operations |

## Getting Started

### Prerequisites

- **Node.js** with npm (use a recent version compatible with Vite 8).
- A modern desktop or mobile browser.

### Local installation

```bash
git clone https://github.com/kuntal-sarkar/GeNarrative-hackathon.git
cd GeNarrative-hackathon
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

> No API key is needed to explore the **current frontend-only prototype**. AI-powered actions will require a connected backend when implemented.

### Available commands

```bash
npm run dev      # Start the development server
npm run build    # Create a production build in dist/
npm run preview  # Preview the production build locally
npm run lint     # Run Oxlint
```

### Optional future backend configuration

The frontend has a backend-ready API integration layer in `src/services/workspaceApi.js`. Once a compatible backend is implemented, it can use a Vite environment variable:

```dotenv
VITE_API_BASE_URL=http://localhost:5000
```

The client is structured to send project operations to endpoints resembling:

```text
POST {VITE_API_BASE_URL}/api/projects/:projectId/ai/:operation
```

**This documents an integration point—not a claim that the Flask API is already running.** Do not put Gemini keys, passwords or other secrets in `VITE_` variables; Vite exposes those values to browser clients. Store secrets on the backend.

## Project Structure

```text
GeNarrative-hackathon/
├── public/                 # Static assets
├── src/
│   ├── assets/             # App images and assets
│   ├── components/
│   │   ├── home/           # Dashboard sections
│   │   ├── layout/         # Shared navigation and layout
│   │   ├── studio/         # Story, scenes, shots, storyboard
│   │   ├── workspace/      # Critics, memory, chat, continuity
│   │   └── ui/             # Reusable controls
│   ├── config/             # App and navigation configuration
│   ├── pages/              # Home, Studio, Workspace, etc.
│   ├── services/           # Project storage, import, AI API adapter
│   ├── styles/             # Shared visual styles
│   ├── App.jsx             # Application routes
│   └── main.jsx            # Frontend entry point
├── index.html
├── package.json
└── vite.config.js
```

## Design Principles

**Human agency first.** The product should help creators explore alternatives while leaving the final decision with them.

**Real user data, not demo fabrications.** Content should come from the user's projects. Unconnected AI features should communicate their state clearly rather than impersonating a completed model call.

**Explicit edits.** Creators should be able to decide when changes are saved, with clear feedback for unsaved work.

**Project context.** Stories, scenes, shots, critiques and memories belong to their respective projects.

**Accessible across screen sizes.** Desktop and mobile layouts support the same overall creative workflow.

## Limitations of the Current Prototype

- The app uses **browser-local storage**, not a hosted database. Data is **not automatically synced** between browsers or devices.
- Clearing site data or using a different browser can make locally stored projects unavailable. Back up important original scripts separately.
- PDF import works with **selectable text**. Scanned/image-only PDFs require OCR, which is not included.
- Script import has safeguards for file size and document length; not every PDF layout can be reproduced perfectly as plain text.
- **AI backend, generated critiques, live chat replies and automated continuity checks are pending.**
- This is a **hackathon prototype**, not a production-hosted collaborative editing platform.

## Roadmap

### Current milestone — Interactive frontend

- [x] Responsive navigation and project library
- [x] Project creation and manual story editing
- [x] PDF / TXT / MD script import
- [x] Scene and shot management
- [x] Storyboard sequence visualization
- [x] Creative Critics and Creative Memory interfaces
- [x] Local project persistence and backend-ready integration points

### Next milestone — Real intelligence and persistence

- [ ] Connect Flask backend and Gemini API
- [ ] Implement real AI story assistance, critics and context-aware chat
- [ ] Add automated continuity analysis
- [ ] Add authentication and persistent database/storage
- [ ] Support storyboard reference image management
- [ ] Add character profiles / Character Bible
- [ ] Add revision history and restore controls
- [ ] Add exports and project backup/restore
- [ ] Add evaluation, guardrails and observability for AI responses

## Hackathon Context

Built for **GeNarrative Clash 2026**, exploring how generative AI can support—not displace—human creativity. FRAMEFORGE focuses on **creative critique, transparent decision-making and preservation of intent** across the storytelling workflow.

For prototype judging, please evaluate the **implemented frontend workflows** separately from the **planned AI integrations**. This README intentionally distinguishes what works now from what is next.

## Contributing

This is an actively evolving hackathon project. Please open an issue or Pull Request describing the change, keep changes focused, and test the frontend build before requesting a merge.

```bash
npm run build
```

---

<div align="center">

**FRAMEFORGE — Create with intention. Decide with confidence.**

</div>
