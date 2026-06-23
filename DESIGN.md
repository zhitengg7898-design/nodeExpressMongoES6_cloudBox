# CloudBox — Design Document

## Table of Contents

1. [Project Description](#project-description)
2. [User Personas](#user-personas)
3. [User Stories](#user-stories)
4. [Design Mockups](#design-mockups)

---

## 1. Project Description

**CloudBox** is a lightweight, no-login file sharing web application. The core idea is radical simplicity: anyone can upload a file, receive a short share code, and hand that code to anyone else — who can then download the file without creating an account.

### The Problem

Existing file sharing tools impose friction on both parties. The sender must create an account, navigate a dashboard, and manage permissions. The recipient may be asked to sign up before accessing content. For one-off or low-stakes sharing scenarios — sending a PDF to a client, sharing a video with a friend — this overhead is disproportionate.

### The Solution

CloudBox reduces file sharing to three steps:

```
Upload → Get Share Code → Recipient Enters Code → Download
```

Codes expire automatically (1–168 hours, default 24 h), so senders never have to manually clean up. There is no authentication, no account management, and no dashboard complexity.

### Technical Stack

| Layer      | Technology              |
|------------|-------------------------|
| Backend    | Node.js + Express 5     |
| Database   | MongoDB 7               |
| Frontend   | Vanilla JS (ES6 modules)|
| Styling    | CSS3 (Grid + Flexbox)   |
| File I/O   | Multer (disk storage)   |
| Dev Env    | Render + Nodemon|

**Live demo:** https://nodeexpressmongoes6-cloudbox.onrender.com

---

## 2. User Personas

### Persona A — Alex, the Freelance Designer

| Attribute | Detail |
|-----------|--------|
| Age | 28 |
| Occupation | Freelance graphic designer |
| Tech comfort | Moderate — comfortable with web apps, not a developer |
| Device | MacBook + iPhone |
| Goal | Quickly deliver final design assets to clients without setting up a shared folder or sending large email attachments |

**Pain points:**
- Cloud storage links require the client to log in or create an account
- Email attachments have size limits
- Clients complain that links expire unexpectedly or require installs

**How CloudBox helps:**  
Alex uploads a high-resolution logo file, sets a 48-hour expiry, and sends the 8-character code in an email. The client opens CloudBox on any browser, types the code, and downloads the file. No accounts. No apps.

---

### Persona B — Ben, the University Student

| Attribute | Detail |
|-----------|--------|
| Age | 21 |
| Occupation | CS student + part-time TA |
| Tech comfort | High — writes code daily |
| Device | Windows laptop |
| Goal | Share lab solution files with classmates or submit files to a TA without using university-managed systems |

**Pain points:**
- University file portals are slow and require VPN
- Group chats don't handle large binary files well
- Doesn't want to expose his cloud storage to everyone in the group chat

**How CloudBox helps:**  
Ben uploads a ZIP of his project, generates a code with a 2-hour window, and posts the code in the group chat. After 2 hours the code expires automatically — he doesn't need to remember to revoke it.

---

### Persona C — Carol, the Office Admin

| Attribute | Detail |
|-----------|--------|
| Age | 44 |
| Occupation | Office administrator |
| Tech comfort | Low — uses email and basic web tools |
| Device | Windows desktop, Chrome browser |
| Goal | Share monthly report PDFs with external vendors without IT involvement |

**Pain points:**
- IT must provision access for each external vendor on internal systems
- Emailing large PDFs bounces due to attachment limits
- Doesn't understand "cloud storage" interfaces with folder structures and permissions

**How CloudBox helps:**  
Carol uploads the PDF through a simple drag-and-drop interface. She gives the vendor the share code over the phone or in a brief email. The vendor downloads the file; the code expires in 24 hours. Carol needs no IT help and the vendor needs no account.

---

## 3. User Stories

### Story 1 — "Upload & Share in Under a Minute"

> *As a freelance designer, I want to upload a file and get a shareable code immediately so that I can send it to a client without asking them to create an account.*

**Acceptance criteria:**
- I can drag a file onto the upload zone or click to browse
- I can optionally add a description before uploading
- After upload, my file appears in the file list immediately
- I can click "Share" on any file and receive an 8-character code within seconds
- I can copy the code or a full URL to my clipboard with one click

**Flow:**
```
Home → Upload page → Drag file → (Optional) Add description
→ Click Upload → File appears in list → Click Share
→ Set expiry hours → Generate → Copy code
```

---

### Story 2 — "Download Without an Account"

> *As a client receiving a share code, I want to enter the code on CloudBox and download the file without being asked to register or log in.*

**Acceptance criteria:**
- I can navigate to the Share page and enter a code
- I can see the file name, size, and description before downloading
- I can click Download and the file saves to my device
- If the code is expired, I see a clear error message, not a generic 404

**Flow:**
```
Receive code → Open CloudBox → Go to Share page
→ Enter code → See file preview card → Click Download
→ File downloads to device
```

---

### Story 3 — "Control Expiry for Sensitive Files"

> *As a student sharing homework files temporarily, I want to set a short expiry so the file is no longer accessible after my classmates have downloaded it.*

**Acceptance criteria:**
- When generating a share code, I can specify hours from 1 to 168
- The expiry time is shown on the share confirmation
- After expiry, the code returns an informative "expired" error
- I can also manually revoke a code before it expires

**Flow:**
```
File list → Click Share on file → Adjust expiry slider/input
→ Click Generate → See confirmation with code + expiry time
→ Share code → Code auto-expires at specified time
```

---

### Story 4 — "Manage Uploaded Files"

> *As an office admin who uploads many documents, I want to see all my uploaded files in one place so I can edit descriptions and delete files I no longer need.*

**Acceptance criteria:**
- The upload page shows all uploaded files in a grid
- Each file card shows name, size, upload date, and description
- I can click to edit the description in a modal
- I can delete a file; all associated share codes are cleaned up automatically
- File type is shown with a visual icon (PDF, image, video, etc.)

**Flow:**
```
Upload page → View file grid → Click details icon
→ Modal opens with editable description → Save
OR
→ Click delete icon → Confirmation modal → Confirm
→ File + share codes removed
```

---

### Story 5 — "Share via Direct Link"

> *As a power user, I want to share a direct URL (not just a code) so that recipients can click a link rather than having to navigate to the site and type a code.*

**Acceptance criteria:**
- After generating a share code, I can copy a pre-built URL
- The URL contains the code as a query parameter (`?code=XXXXXXXX`)
- Visiting the URL auto-fills the code field and shows the file preview
- The link works on mobile browsers

**Flow:**
```
Generate share code → Click "Copy Link" → Paste in message
→ Recipient clicks link → Share page opens with code pre-filled
→ File preview shown → Click Download
```

---

## 4. Design Mockups

The mockups below use ASCII art to represent the page layouts. Each section corresponds to a page in the application.

---

### 4.1 Home Page

```
┌──────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                          │
│  ☁ CloudBox                    [Upload Files]  [Access a File]  │
├──────────────────────────────────────────────────────────────────┤
│  TICKER / MARQUEE BAR                                            │
│  → No login required  →  Auto-expiring codes  →  10 MB files   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HERO SECTION                                                    │
│                                                                  │
│           ☁  CloudBox                                            │
│     Share files instantly, no account needed                     │
│                                                                  │
│        [  Upload a File  ]    [ Access a File ]                  │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  HOW IT WORKS                          (3 steps)                 │
│                                                                  │
│   ① Upload        ② Get Code         ③ Share                    │
│  ┌─────────┐     ┌─────────┐        ┌─────────┐                 │
│  │   📁    │     │  🔑     │        │  📨     │                 │
│  │ Choose  │     │ 8-char  │        │ Send    │                 │
│  │ your    │     │ code    │        │ code to │                 │
│  │ file    │     │ created │        │ anyone  │                 │
│  └─────────┘     └─────────┘        └─────────┘                 │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  FEATURES GRID                         (2 × 3 cards)            │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ 🚫 No Login  │  │ ⏱ Auto-Expire│  │ 📊 Download  │           │
│  │              │  │              │  │    Counter   │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ 📎 10MB Limit│  │ 🔗 Short URL │  │ 🗑 Auto-Clean │           │
│  │              │  │              │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  CALL TO ACTION BANNER                                           │
│         Ready to share? It takes 30 seconds.                     │
│                    [ Start Uploading ]                           │
├──────────────────────────────────────────────────────────────────┤
│  FOOTER                                                          │
│  © 2026 CloudBox                                                 │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Upload & File Management Page

```
┌──────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                          │
│  ☁ CloudBox                    [Upload Files]  [Access a File]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  UPLOAD SECTION                                                  │
│  ┌────────────────────────────────────────────────────────┐     │
│  │                                                        │     │
│  │         📁                                             │     │
│  │   Drag & drop your file here                           │     │
│  │          — or —                                        │     │
│  │       [ Browse Files ]                                 │     │
│  │                                                        │     │
│  │  Description (optional):  [________________________]  │     │
│  │                                                        │     │
│  │                          [ Upload File ]               │     │
│  └────────────────────────────────────────────────────────┘     │
│                                                                  │
│  ─────────────────── Your Files ───────────────────────────     │
│                                                                  │
│  FILE GRID (responsive, 3 columns on desktop)                    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  📄           │  │  🖼️           │  │  📁           │           │
│  │  report.pdf  │  │  logo.png    │  │  assets.zip  │           │
│  │              │  │              │  │              │           │
│  │  2.3 MB      │  │  540 KB      │  │  8.1 MB      │           │
│  │  Jun 21      │  │  Jun 21      │  │  Jun 20      │           │
│  │  "Q2 Report" │  │  "Final logo"│  │              │           │
│  │              │  │              │  │              │           │
│  │  [ℹ️] [🔗] [🗑️] │  │  [ℹ️] [🔗] [🗑️] │  │  [ℹ️] [🔗] [🗑️] │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                  │
│    ℹ️ = Details/Edit    🔗 = Share    🗑️ = Delete                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Edit Description Modal:**
```
        ┌─────────────────────────────────┐
        │  File Details            [ ✕ ]  │
        ├─────────────────────────────────┤
        │  Name: report.pdf               │
        │  Size: 2.3 MB                   │
        │  Uploaded: June 21, 2025        │
        │                                 │
        │  Description:                   │
        │  ┌───────────────────────────┐  │
        │  │ Q2 Financial Report       │  │
        │  └───────────────────────────┘  │
        │                                 │
        │           [ Save Changes ]      │
        └─────────────────────────────────┘
```

**Delete Confirmation Modal:**
```
        ┌─────────────────────────────────┐
        │  Delete File             [ ✕ ]  │
        ├─────────────────────────────────┤
        │          🗑️                      │
        │                                 │
        │  Are you sure you want to       │
        │  delete "report.pdf"?           │
        │                                 │
        │  This will also revoke all      │
        │  active share codes.            │
        │                                 │
        │  [ Cancel ]   [ Delete File ]   │
        └─────────────────────────────────┘
```

---

### 4.3 Share Code Page

```
┌──────────────────────────────────────────────────────────────────┐
│  NAVBAR                                                          │
│  ☁ CloudBox                    [Upload Files]  [Access a File]  │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  TWO-COLUMN LAYOUT (stacks on mobile)                            │
│                                                                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐     │
│  │  GENERATE A SHARE CODE   │  │  ACCESS A SHARED FILE    │     │
│  │                          │  │                          │     │
│  │  Select file:            │  │  Enter share code:       │     │
│  │  [ report.pdf       ▼ ] │  │  [ _ _ _ _ _ _ _ _ ]     │     │
│  │                          │  │                          │     │
│  │  Expiry (hours):         │  │     [ Access File ]      │     │
│  │  [ 24              ]     │  │                          │     │
│  │  (1 – 168 hours)         │  │  ─── Result ───────────  │     │
│  │                          │  │                          │     │
│  │   [ Generate Code ]      │  │  (empty until code       │     │
│  │                          │  │   is entered)            │     │
│  │  ─── Result ───────────  │  │                          │     │
│  │                          │  │                          │     │
│  │  (empty until generated) │  │                          │     │
│  └──────────────────────────┘  └──────────────────────────┘     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**After code generation (left card updates):**
```
  ┌──────────────────────────────────────────┐
  │  GENERATE A SHARE CODE                   │
  │                                          │
  │  Select file:  [ report.pdf         ▼ ] │
  │  Expiry (hours): [ 24 ]                  │
  │  [ Generate Code ]                       │
  │                                          │
  │  ─── Share Code ──────────────────────── │
  │                                          │
  │  ┌──────────────────────────────────┐    │
  │  │   🔑  Ab3Xy7Zk                   │    │
  │  └──────────────────────────────────┘    │
  │                                          │
  │  [ Copy Code ]   [ Copy Link ]           │
  │                                          │
  │  Expires: June 22, 2025 at 14:30         │
  │  Downloads: 0                            │
  └──────────────────────────────────────────┘
```

**After code entry (right card updates):**
```
  ┌──────────────────────────────────────────┐
  │  ACCESS A SHARED FILE                    │
  │                                          │
  │  Enter share code: [ Ab3Xy7Zk ]          │
  │  [ Access File ]                         │
  │                                          │
  │  ─── File Details ─────────────────────  │
  │                                          │
  │  ┌──────────────────────────────────┐    │
  │  │  📄 report.pdf                   │    │
  │  │  Size: 2.3 MB                    │    │
  │  │  Uploaded: June 21, 2025         │    │
  │  │  "Q2 Financial Report"           │    │
  │  │                                  │    │
  │  │  Expires: June 22 at 14:30       │    │
  │  │  Downloads: 3                    │    │
  │  │                                  │    │
  │  │         [ ⬇ Download ]           │    │
  │  └──────────────────────────────────┘    │
  └──────────────────────────────────────────┘
```

---

### 4.4 Error & Edge Case States

**Expired code:**
```
  ┌──────────────────────────────────────────┐
  │  ACCESS A SHARED FILE                    │
  │  Enter code: [ Ab3Xy7Zk ]                │
  │  [ Access File ]                         │
  │                                          │
  │  ⚠️  This share code has expired.        │
  │     Contact the sender for a new link.   │
  └──────────────────────────────────────────┘
```

**Invalid code:**
```
  │  ❌  Share code not found.               │
  │     Check the code and try again.        │
```

**Upload progress:**
```
  ┌────────────────────────────────────────────┐
  │  📁  Drag & drop your file here            │
  │  ────────────────────────────────────────  │
  │  Uploading report.pdf...                   │
  │  ████████████░░░░░░░░░░░░░░░  60%          │
  └────────────────────────────────────────────┘
```

---

### 4.5 Responsive Breakpoints

```
Desktop (≥1024px)           Tablet (768–1023px)         Mobile (<768px)
─────────────────           ───────────────────         ──────────────
┌────┬────┬────┐            ┌────┬────┐                 ┌────┐
│Card│Card│Card│            │Card│Card│                 │Card│
├────┼────┼────┤            ├────┼────┤                 ├────┤
│Card│Card│Card│            │Card│Card│                 │Card│
└────┴────┴────┘            └────┴────┘                 ├────┤
                                                        │Card│
Share page:                 Share page:                 └────┘
┌─────────┬─────────┐       ┌─────────┐
│ Generate│  Access │       │ Generate│                 Share page:
│  Code   │  File   │       ├─────────┤                 ┌─────────┐
└─────────┴─────────┘       │  Access │                 │ Generate│
                            └─────────┘                 ├─────────┤
                                                        │  Access │
                                                        └─────────┘
```

---

## Appendix — Data Flow Diagram

```
SENDER                      SERVER                      DATABASE
──────                      ──────                      ────────
Upload file  ──────────────► POST /api/upload          files{}
             ◄──────────────  fileId, metadata  ──────► Insert doc

Click Share  ──────────────► POST /api/files/:id/share
             ◄──────────────  shareCode, expiresAt ───► shareCodes{}
Copy code                                                Insert doc


RECIPIENT                   SERVER                      DATABASE
─────────                   ──────                      ────────
Enter code   ──────────────► GET /api/share/:code ─────► Lookup code
             ◄──────────────  file metadata               Check expiry

Click Download ────────────► GET /api/share/:code/download
               ◄────────────  File stream         ──────► downloadCount++
File saved
```
