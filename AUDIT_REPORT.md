# Codebase Audit Report

## Executive Summary
This audit identified and resolved several critical "program-breaking" issues that prevented the application from running successfully in a local development environment and posed risks for production deployment. The primary issues were an architectural mismatch between the serverless API and the client-side dev server, a runtime crash due to an SDK version mismatch, and broken asset references.

All critical issues have been resolved. The application is now configured to run locally with full API support and is prepared for deployment on Vercel.

## Critical Issues & Resolutions

### 1. Architecture Mismatch (Critical)
*   **Issue**: The project contains server-side logic in `api/gemini.ts` (intended for Vercel Serverless), but the default `npm run dev` command launched a standard Vite client-side server. This caused all AI features to fail locally with 404 errors because the `/api/gemini` endpoint was not being served.
*   **Resolution**: Created a custom local development server (`scripts/dev-server.ts`) using Express and Vite middleware. This server correctly handles `/api/gemini` requests by executing the server-side handler locally while still providing Vite's HMR features.
*   **Action**: Updated `package.json` scripts to use this server for `npm run dev`.

### 2. Runtime Crash: SDK Mismatch (Critical)
*   **Issue**: The `api/gemini.ts` file attempted to call `response.text()` as a function. However, the installed version of `@google/genai` exposes `text` as a getter property. This would have caused a runtime crash whenever the API was called.
*   **Resolution**: Updated `api/gemini.ts` to access `response.text` as a property.

### 3. Broken Asset Reference (Build/Runtime)
*   **Issue**: `index.html` contained a hardcoded link to `/index.css`. While the file existed, this pattern is fragile in Vite builds if not explicitly imported, and `npm run build` was emitting warnings that the file would be unresolved.
*   **Resolution**:
    *   Removed `<link rel="stylesheet" href="/index.css">` from `index.html`.
    *   Added `import './index.css';` to `index.tsx` to ensure Vite correctly bundles the styles.

### 4. Environment Configuration
*   **Issue**: No Node.js version was specified, which could lead to build failures on older environments given the dependencies (Vite 6, React 19).
*   **Resolution**: Added `"engines": { "node": ">=20" }` to `package.json`.
*   **Issue**: `index.html` contained a redundant `<script type="importmap">` which could conflict with Vite's module resolution.
*   **Resolution**: Removed the import map.

### 5. Runtime Crash: Unhandled Toast Type
*   **Issue**: `App.tsx` dispatched a toast with type `'warning'`, but `Toast.tsx` did not define this type in its TypeScript definition or runtime configuration object. This would have caused a runtime crash when trying to access properties of `undefined`.
*   **Resolution**: Added `'warning'` to `ToastType` and its corresponding styling configuration in `Toast.tsx`.

## Verification
*   **Local Dev**: Run `npm run dev`. The server will start on port 3000 and serve both the frontend and the `/api/gemini` endpoint.
*   **Deployment**: The project structure (`api/` folder) is compatible with Vercel's default configuration for serverless functions.

## Remaining Recommendations
*   **Deployment**: Ensure the `GEMINI_API_KEY` environment variable is set in your Vercel project settings (and `.env` locally).
*   **Testing**: The current test suite has some mocks that may need updating if the internal API structure changes further.
