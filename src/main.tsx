import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// At build time we may not have VITE_* vars set when using a single-service deploy
// (the frontend can fall back to a runtime-relative `/api` path). Warn instead
// of throwing so the app can still load and use runtime fallbacks.
const requiredEnvVars = [
  'VITE_API_URL',
  'VITE_OPENAI_API_KEY'
];

requiredEnvVars.forEach(variable => {
  if (!import.meta.env[variable]) {
    // Log prominently so CI/build logs show the missing variable.
    console.warn(`Missing environment variable at build-time: ${variable}. The app will attempt runtime fallbacks.`);
  }
});

createRoot(document.getElementById("root")!).render(<App />);
