import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Check for required environment variables at app startup
const requiredEnvVars = [
  'VITE_API_URL',
  'VITE_OPENAI_API_KEY'
];

requiredEnvVars.forEach(variable => {
  if (!import.meta.env[variable]) {
    console.error(`Missing required environment variable: ${variable}`);
    if (import.meta.env.MODE === 'production') {
      throw new Error(`Missing env var: ${variable}`);
    }
  }
});

createRoot(document.getElementById("root")!).render(<App />);
