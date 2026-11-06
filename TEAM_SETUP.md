# FRAMEFORGE — Team Local Development Setup

> **For Windows / PowerShell** · Repository: [GeNarrative-hackathon](https://github.com/kuntal-sarkar/GeNarrative-hackathon) · Branch: `main`
>
> This guide runs **both the React frontend and Flask backend locally** on each teammate's computer. **No backend hosting is required.**

## How the setup works

```text
Your laptop                               Teammate laptop
React (localhost:5173)                   React (localhost:5173)
        |                                        |
Flask (127.0.0.1:5000)                  Flask (127.0.0.1:5000)
        |                                        |
        +---------- Google Gemini API ----------+
                  Each backend uses its
                  locally configured key
```

- Each member has their **own local project data** in their browser. Git does **not** sync `localStorage` projects, chats, or saved reviews.
- Everyone shares **source code** via GitHub, not personal project data.
- Each member chooses **either the team's shared Gemini key or their own Gemini key**. No code changes are required to switch keys.
- **Never commit, paste into GitHub, or include API keys in frontend Vite variables.** Only the local Flask backend should read `GEMINI_API_KEY`.

## 0. Prerequisites (once per laptop)

Install:

1. **Git** — to clone and pull the repository.
2. **Node.js + npm** — use an actively supported Node LTS version compatible with the repo's Vite version (check `package.json` / `node --version`).
3. **Python** — a version compatible with `backend/requirements.txt` (use `py --version`; if install fails, use a compatible stable Python version).
4. **VS Code** or another editor — to create local `.env` files.
5. A working internet connection (for `npm`, `pip`, and Gemini API requests).

Verify in PowerShell:

```powershell
 git --version
 node --version
 npm --version
 py --version
```

If a command is not recognized, install the corresponding tool and reopen PowerShell.

## 1. Get the code from GitHub

Choose any folder you can write to, e.g. `D:\Projects`:

```powershell
New-Item -ItemType Directory -Path 'D:\Projects' -Force | Out-Null
Set-Location 'D:\Projects'
git clone -b main https://github.com/kuntal-sarkar/GeNarrative-hackathon.git
cd GeNarrative-hackathon
```

**If the repository is already cloned**, do not clone again. In the existing repository root:

```powershell
git switch main
git pull origin main
```

Expected layout:

```text
GeNarrative-hackathon/
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── routes/
│   ├── services/
│   └── utils/
├── src/
├── public/
├── package.json
└── vite.config.js
```

## 2. Configure the frontend (once per laptop)

In **repository root**, install packages:

```powershell
npm install
```

Create a local Vite environment file automatically:

```powershell
Set-Content -Path '.env.local' -Value 'VITE_API_BASE_URL=http://127.0.0.1:5000'
```

> This URL refers to the **same teammate's local Flask server**. It is *not* the team leader's laptop. Do not put any Gemini key in `.env.local` or `VITE_*` variables: Vite exposes those values to client-side code.

## 3. Configure the Flask backend (once per laptop)

Open **PowerShell terminal A** in the project root:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

You can use the venv's Python directly without activating the environment, avoiding PowerShell script execution-policy issues.

### Choose whose Gemini key to use

**Option A — Team's shared key (all members use the project owner's Gemini API account):**

- The project owner should ideally create a **separate key for FRAMEFORGE team development**, with appropriate quotas and monitoring.
- Share it privately using a trusted secret-sharing/password-manager mechanism. **Do not send it in the Git repository, issues, screenshots, or a public chat.**
- Each member stores that key in their **own** `backend/.env`.

**Option B — Member's own key:**

- Obtain a Gemini API key for your own Google AI Studio / associated Google Cloud project.
- Store it in your **own** `backend/.env`.
- This works with **the same code**. Gemini usage, rate limits, and possible charges apply to the project/account associated with the chosen key.

Create the backend environment file manually in VS Code as `backend/.env` (the file is deliberately **not** included in GitHub):

```dotenv
GEMINI_API_KEY=PASTE_THE_CHOSEN_KEY_HERE
GEMINI_MODEL=gemini-3.1-flash-lite
```

Use **either key**, not both. Do not put quotes or spaces around the value unless you know they are needed. Never paste the actual key into shared terminal output or screenshots.

> `.env` does **not** appear automatically after `pip install`. Each member must create/configure it once. Your frontend `.env.local` and backend `.env` should remain git-ignored. If changing the key later, edit `backend/.env` and restart Flask.

## 4. Start Flask — terminal A

From repository root:

```powershell
cd backend
.\.venv\Scripts\python.exe app.py
```

If already in the `backend` folder, skip `cd backend`.

Keep this terminal open. The local backend is expected at `http://127.0.0.1:5000` when Flask uses its default configured port. Use the address shown in the Flask terminal if different, and update `VITE_API_BASE_URL` accordingly.

**Quick check:** open `http://127.0.0.1:5000/` in a browser or run:

```powershell
Invoke-WebRequest 'http://127.0.0.1:5000/'
```

A `404` on `/` does not necessarily mean Flask is down—some apps do not expose a root route. Verify the Flask terminal shows a running server and test an actual endpoint if necessary.

## 5. Start React — terminal B

Open a **second PowerShell terminal** in the repository root:

```powershell
npm run dev
```

Open the URL displayed by Vite, usually `http://localhost:5173`. Keep **both** terminals running.

## 6. Test AI features end to end

In FRAMEFORGE, create a **new local test project**, add a short story, and **save the story** first. Then try:

| Feature | Test | Status before fresh teammate test |
|---|---|---|
| Project AI Chat | Ask a question about the story | Previously integrated/tested |
| Creative Critics | Run a critique and inspect feedback | Previously integrated/tested |
| Continuity Checker | Check a deliberate contradiction | Previously integrated/tested |
| Character Bible | Analyze story with AI | Previously integrated/tested |

These four integrations worked on the original development machine; **verify them on each new laptop**. A successful build alone does not prove the API works.

**Not yet guaranteed on teammate machines:** scene breakdown, shot generation, storyboard/image generation. Some services may require unfinished frontend integration or additional image-provider credentials and configuration. Do not represent all backend source files as already fully working features.

## 7. Collaborate safely using feature branches

To pull teammates' newly merged work:

```powershell
git switch main
git pull origin main
```

For new work, create your own branch (choose a unique descriptive name):

```powershell
git switch -c feature/my-task
# Make your changes, then:
git status
git add src backend  # Stage only files relevant to your work
git commit -m 'feat: describe my task'
git push -u origin feature/my-task
```

Open a **Pull Request into `main`** on GitHub. Do not force-push `main`. Be careful with `git add -A`: do not accidentally commit local exports, backups, secrets, or test artifacts.

After pulling new dependencies:

```powershell
npm install
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Existing `backend/.env` and root `.env.local` should stay local and do not usually need recreating for each pull.

## 8. Troubleshooting

| Symptom | What to check |
|---|---|
| `AI backend not connected` | Root `.env.local` exists and has `VITE_API_BASE_URL`; **restart Vite** after editing it. |
| `Failed to fetch` / connection refused | Flask is running on the configured URL/port; check terminal A, firewall/port conflicts. |
| `GEMINI_API_KEY is missing` | `backend/.env` exists and is named `.env`, not `.env.txt`; key is configured; restart Flask. |
| Gemini 401/403 | API key validity, model access, API/project restrictions. |
| Gemini 429 | Quota/rate limits exhausted; **shared key means shared quotas**. |
| Vite `npm` errors | Check Node version, internet connection; rerun `npm install`. |
| Python import errors | Verify terminal A uses `backend/.venv/Scripts/python.exe`; reinstall requirements. |
| Port already in use | Stop other local Flask processes or deliberately configure both backend port and frontend URL consistently. |
| Project data missing on another laptop | Expected: browser `localStorage` is device/browser-specific, **not synced via Git**. |
| AI image generation fails | Additional provider configuration may be needed; Gemini key alone may not cover it. |

## 9. Security rules — mandatory

- **Never push:** `backend/.env`, `.env.local`, `.venv/`, API keys, credentials, private project exports.
- **Never store keys in React / `VITE_*` variables**; browsers expose these.
- Sharing one key on teammate devices **reveals that key to those teammates**. If that is unacceptable, use separate keys or a protected centrally hosted backend/proxy instead.
- A shared key combines all usage in one API project/account; monitor quota and billing. Rotate or revoke the development key if someone leaves or it may have leaked.
- GitHub access does **not** provide secrets automatically (by design).

## 10. Setup checklist

- [ ] Git, Node/npm, Python installed
- [ ] `main` branch cloned/pulled
- [ ] `npm install` completed
- [ ] Root `.env.local` created with local Flask URL
- [ ] `backend/.venv` created
- [ ] Backend Python requirements installed
- [ ] `backend/.env` created with **shared OR own** Gemini key
- [ ] Flask started in terminal A
- [ ] React started in terminal B
- [ ] AI Chat, Critics, Continuity, Character Bible tested
- [ ] Working branch created for development

---

**Bottom line:** Each teammate runs the **full code locally**. They can choose to use **your shared Gemini key or their own key** simply by setting `GEMINI_API_KEY` in their local `backend/.env`. **No deployment is required** for this development workflow, and your existing browser projects are not shared.
