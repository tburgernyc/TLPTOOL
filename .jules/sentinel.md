## 2026-01-24 - AI Output Injection via dangerouslySetInnerHTML
**Vulnerability:** `ScriptViewer.tsx` used `dangerouslySetInnerHTML` to render AI-generated content, assuming regex cleaning was sufficient sanitization.
**Learning:** AI output is untrusted input. Regex replacements for custom tags (like `[PAUSE]`) encouraged the use of `dangerouslySetInnerHTML`, opening the door for XSS if the AI generated HTML tags.
**Prevention:** Parse custom tags into React components instead of replacing them with HTML strings. Treat all other AI output as plain text.
