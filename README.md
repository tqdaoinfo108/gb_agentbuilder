<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dae5342f-ffb7-4a0a-92f8-b200b400fd5b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. (Optional) Set `AGENT_TOKEN` in [.env.local](.env.local) to the secret token your agents use (e.g. `AGENT_TOKEN=secret-agent-token-123`).
   - If `AGENT_TOKEN` is not set, any non-empty token is accepted (local/dev mode).
4. Run the app:
   `npm run dev`
