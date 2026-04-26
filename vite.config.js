import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ─────────────────────────────────────────────────────────────
// IMPORTANT: Set this to your GitHub repository name.
// e.g. if your repo is github.com/ankurgupta/ivp-task-manager
// then set:  base: '/ivp-task-manager/'
//
// If you deploy to a custom domain (tasks.ivp.in), use:
//            base: '/'
// ─────────────────────────────────────────────────────────────
const GITHUB_REPO_NAME = 'IVP-task-manager'   // ← change this

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? `/${GITHUB_REPO_NAME}/` : '/',
})
