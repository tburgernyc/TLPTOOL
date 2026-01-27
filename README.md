<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Tarot Light Path Video Tool

This is a React application powered by Google's Gemini AI, designed to generate and read Tarot scripts.

## Run Locally

**Prerequisites:** Node.js v20+

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Configure Environment:**
    Create a `.env` file in the root directory and add your Gemini API key:
    ```env
    GEMINI_API_KEY=your_api_key_here
    ```

3.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    This command starts a custom development server (using `tsx` and `express`) that serves the Vite frontend and proxies API requests to `api/` functions, simulating the Vercel serverless environment.

4.  **Verify Setup:**
    -   Open your browser to `http://localhost:3000`.
    -   Check the API health status at `http://localhost:3000/api/health`. You should receive a JSON response with `"status": "ok"`.

## Deployment (Vercel)

This project is designed to be deployed on Vercel.

1.  **Import Project:** Import the repository into Vercel.
2.  **Environment Variables:** Add `GEMINI_API_KEY` to the project's Environment Variables settings in the Vercel dashboard.
3.  **Build Settings:** The default settings (Framework: Vite) should work correctly.
    -   Build Command: `npm run build`
    -   Output Directory: `dist`

The API functions in `api/` will be automatically deployed as Vercel Serverless Functions.
