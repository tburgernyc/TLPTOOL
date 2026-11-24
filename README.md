# Tarot Light Path Video Tool

Making a tarot video alone means managing the cards, the script, and the teleprompter at the same time. TLPTOOL brings those steps into one React app. In the manual workflow, read the generated introduction, speak the 13 cards into the microphone, and let the app draft the rest of the reading from the spread. The teleprompter advances on a timer, so you can keep your attention on the camera and the script.

The app can generate spoken audio as well as text. It is designed to help a solo operator prepare and deliver a reading from a regular laptop, but browser speech recognition, microphone access, an internet connection, and a Gemini API key are required for the corresponding features. The current teleprompter does not track spoken words to control its scroll.

## How it works

- **React and Vite frontend:** collect reading details, show card spreads, and present scripts.
- **Manual card capture:** browser speech recognition parses spoken card names into a 13-card spread. Cards can be reviewed and edited before the reading is generated.
- **Script generation:** the server-side Gemini integration generates the introduction and reading text. The astrology request asks Gemini for moon phase, transits, retrogrades, and a summary; the repository does not include a dedicated ephemeris integration to independently verify those values.
- **Teleprompter and audio:** the teleprompter scrolls through the script on a timer. Text-to-speech is an optional Gemini feature.
- **Local development API:** `npm run dev` starts the Express/Vite development server, which exposes the API routes locally. Production API functions are in `api/`.

## Performance & Engineering Notes

- The flattened tarot card database is created on first request and cached for later lookups in `tarotCardDatabase.ts` (main commit `9d31d48`). App state uses a lazy initializer in `App.tsx` (main commit `b758fd5`). These changes do not establish a measured 50% startup-time reduction.
- `cardMatcher.ts` builds cached exact and phonetic lookup maps for card matching (main commit `bb8b038`). `ManualCardEntry.tsx` debounces matching and validation; the parsing debounce is in main commit `80b9382`.
- `cardMatcher.ts` consolidates phonetic normalization patterns (main commit `2c8847b`), while `api/gemini.ts` combines script-cleanup replacements (main commit `a7e46b4`).
- `useSpeechRecognition.ts` limits volume-meter updates to about every 50 ms. `AudioPlayer.tsx` uses browser audio decoding; its optimization is in main commit `603d902`.

## Run locally

**Prerequisite:** Node.js 20 or newer.

1. Install the locked dependencies:

   ```bash
   npm ci
   ```

2. Copy `.env.example` to `.env` and set `GEMINI_API_KEY` in `.env`. Keep real keys local and do not commit `.env`.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open `http://localhost:3000`. The local API health endpoint is `http://localhost:3000/api/health`.

To create a production frontend build, run `npm run build`.

## Deploy to Vercel

Set `GEMINI_API_KEY` in the Vercel project environment settings. Use `npm run build` as the build command and `dist` as the output directory. The functions in `api/` provide the production API endpoints.
