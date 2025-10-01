// apiService.js
const BUILD_API = import.meta.env.VITE_API_URL || '';

function getApiBase() {
  // If the build-time API points at localhost but we're running on a non-localhost host
  // (e.g. Render), prefer the relative /api so requests go to the current origin.
  try {
    if (typeof window !== 'undefined') {
      const host = window.location.hostname;
      const isLocalHostBuild = BUILD_API.includes('localhost') || BUILD_API.includes('127.0.0.1');
      const runningLocally = host === 'localhost' || host === '127.0.0.1';
      if (isLocalHostBuild && !runningLocally) return '/api';
    }
  } catch (e) {
    // ignore and fall back
  }
  return BUILD_API || '/api';
}

export const generateLessonPlan = async (prompt) => {
  try {
    const base = getApiBase();
    const response = await fetch(`${base}/generate-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: import.meta.env.VITE_OPENAI_MODEL,
        prompt: prompt
      })
    });

    if (!response.ok) throw new Error('API request failed');
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
