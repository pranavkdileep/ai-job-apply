# AI Job Apply

> **Draft, tailor, and send job application emails — powered by AI and your Gmail.**

Upload a job description or a poster image, let any LLM (OpenAI, Anthropic, Google, or Vercel AI Gateway) generate a personalized application email, review and edit it, then send it straight from your Gmail inbox.

---

## Features

- **Multi-provider LLM support** — OpenAI, Anthropic, Google Gemini, or Vercel AI Gateway (100+ models).
- **Smart email generation** — feeds your resume + job details as context for a tailored draft.
- **Poster image OCR** — upload a job poster image; the LLM extracts company, role, and contact info.
- **Auto-extract recipient** — the LLM picks up the application email from the job description or image.
- **Gmail integration** — send directly via your Google account (Gmail API).
- **PDF resume attachment** — upload a PDF to attach per email (or send without one).
- **Secure** — API keys stay in your browser's localStorage; they never hit the server database.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | [Next.js](https://nextjs.org/) 16 (App Router) |
| UI | React 19 + [Tailwind CSS 4](https://tailwindcss.com) |
| AI SDK | [Vercel AI SDK](https://ai-sdk.dev) v6 (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/gateway`) |
| Auth | Google OAuth 2.0 + Gmail API (`gmail.send` scope) |
| Database | MongoDB |
| Email Transport | Nodemailer → Gmail REST API |

---

## Prerequisites

- **Node.js** 18+ and **npm**
- **MongoDB** instance (local or [Atlas](https://www.mongodb.com/atlas))
- **Google Cloud project** with the Gmail API enabled and OAuth 2.0 credentials

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd ai-job-apply
npm install
```

### 2. Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

```env
# MongoDB connection string
MONGODB_URI=mongodb://localhost:27017

# Google OAuth credentials (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Your app's public URL (used for OAuth redirects)
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

> **Google Cloud setup:** Enable the **Gmail API**, create an OAuth 2.0 Web Client, and add `http://localhost:3000/api/auth/callback` as an authorized redirect URI. with scope `https://www.googleapis.com/auth/gmail.send`.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### 1. Sign in with Google
Click **Sign in with Google** — grants the app permission to send email on your behalf.

### 2. Save your resume (optional)
Go to the **Resume** tab and paste your plain-text resume. The AI uses this to tailor the generated email. This is also where you'd upload a PDF resume for attachment later.

### 3. Configure an LLM provider
Go to the **LLM Settings** tab and pick your provider:

- **OpenAI** — model like `gpt-4o`, paste your OpenAI API key.
- **Anthropic** — model like `claude-3-5-sonnet-20240620`, paste your Anthropic API key.
- **Google** — model like `gemini-1.5-flash`, paste your Google AI Studio key.
- **Vercel** — model like `openai/gpt-5.5` (provider/model format). Paste your Vercel AI Gateway API key, or leave it blank if you've set `AI_GATEWAY_API_KEY` on the server.

Keys are stored only in your browser's localStorage.

### 4. Generate an email
Paste a **job description** or upload a **job poster image**, then click **Generate**. The LLM streams the draft into the review panel.

If the job posting includes an application email, the **To:** field is auto-filled.

### 5. Review & send
Edit the subject, body, and recipient. Optionally upload a **PDF resume** to attach. Click **Send Application Email** — it goes out through your Gmail.

---

## Project Structure

```
app/
├── api/
│   ├── auth/        # Google OAuth login, callback, session, logout
│   ├── generate/    # LLM streaming endpoint
│   ├── resume/      # Save/retrieve plain-text resume
│   └── send-email/  # Gmail API send endpoint
├── layout.tsx
└── page.tsx         # Main SPA — generation, review, send
lib/
├── db.ts            # MongoDB client
└── session.ts       # Session helpers
```

---

## License

MIT
