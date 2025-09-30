// apiService.js
export const generateLessonPlan = async (prompt) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/generate-lesson`, {
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
