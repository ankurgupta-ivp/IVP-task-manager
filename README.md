# IVP Task Manager — React v2

A full-featured team task manager built with React + Vite, backed by Supabase (PostgreSQL).

## ✨ New in React version

- **Per-column filtering** — click the filter icon in any column header to filter by that column
- **Resizable columns** — drag the right edge of any column header to resize it
- **Tag quick filters** — add any tag as a quick filter pill from the Manage button
- **Drag-to-reorder** persisted to database
- **React Context** state management — clean, no external state library needed

## 🚀 Quick Start (local dev)

```bash
npm install
npm run dev
```

Open http://localhost:5173

## 🔧 Configure Supabase

Open `src/lib/supabase.js` and replace:

```js
export const SUPABASE_URL  = 'https://YOUR_PROJECT_ID.supabase.co'
export const SUPABASE_ANON = 'YOUR_ANON_KEY'
```

Your existing database schema is fully compatible — no changes needed.

## 🏗️ Build for GitHub Pages

```bash
npm run build
```

This creates a `dist/` folder. Upload the **contents** of `dist/` to your GitHub repository root and enable GitHub Pages.

Or use the GitHub Actions workflow below for automatic deployment on every push.

## ⚙️ GitHub Actions Auto-Deploy

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v4
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

After adding this file, every push to `main` auto-builds and deploys to GitHub Pages.

## 📁 Project Structure

```
src/
├── lib/
│   ├── supabase.js      ← Supabase URL + REST helpers
│   ├── utils.js         ← Helpers, mappers, demo data
│   └── AppContext.jsx   ← Global state (useReducer)
├── hooks/
│   └── useBootstrap.js  ← Loads all data from Supabase on login
├── components/
│   ├── UI.jsx           ← Buttons, modals, badges, toast
│   ├── TopBar.jsx       ← App header + user menu
│   ├── LeftNav.jsx      ← Collapsible sidebar
│   ├── QuickFilters.jsx ← Quick filter pills + manage modal
│   ├── TaskGrid.jsx     ← Main blotter (filtering, resize, drag)
│   ├── TaskModal.jsx    ← Create/edit task form
│   ├── TaskDetail.jsx   ← Slide panel + share modal
│   └── ColConfigModal.jsx
├── pages/
│   ├── LoginPage.jsx
│   └── AdminPanel.jsx   ← User management + all config tabs
├── App.jsx              ← Root component
├── main.jsx             ← Entry point
└── index.css            ← IVP design tokens + global styles
```

## 🔑 First Login

| Field    | Value                  |
|----------|------------------------|
| Email    | ankurgupta@ivp.in      |
| Password | changeme123            |

**Change your password immediately via the user menu (top right).**

## 🗄️ Database

Uses the same Supabase schema as the HTML version — no migration needed.
If upgrading from the HTML version, just point this app at the same Supabase project.
