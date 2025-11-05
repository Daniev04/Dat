import { GoogleGenAI, Type } from "@google/genai";
import { StoryboardResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Utility for retrying API calls with exponential backoff ---
async function retryWithBackoff<T>(
  apiCall: () => Promise<T>,
  retries = 5, // Increased retries
  initialDelay = 5000 // Increased initial delay to 5 seconds
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error as Error;
      
      // Check if it's a rate-limit error (429) by inspecting the error message
      if (lastError.message.includes('"code":429') || lastError.message.includes('RESOURCE_EXHAUSTED')) {
        const delay = initialDelay * Math.pow(2, attempt);
        console.warn(`Rate limit hit. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        // If it's not a rate-limit error, don't retry, just throw
        throw lastError;
      }
    }
  }
  // If all retries fail, throw the last captured error
  throw new Error(`API call failed after ${retries} attempts: ${lastError?.message}`);
}


async function generateImage(sceneDescription: string): Promise<string> {
  const imagePrompt = `
    A single storyboard frame visualizing the scene: ${sceneDescription}.

    Style guidelines:
    - Art Style: Hand-drawn, sketchy black and white art style, similar to professional film storyboards. Use clear line work and dramatic shading.
    - Color: Strictly grayscale.
    - Aspect Ratio: 16:9 landscape.
    - Quality: High quality, high detail.
    - Composition: Cinematic, clear visual storytelling.
  `;

  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: imagePrompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '16:9',
    },
  });

  if (response.generatedImages && response.generatedImages.length > 0) {
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/jpeg;base64,${base64ImageBytes}`;
  } else {
    throw new Error("Image generation failed or returned no images.");
  }
}

async function analyzeScene(sceneDescription: string): Promise<{ cameraAngle: string; mood: string }> {
  const analysisPrompt = `
    You are a professional Storyboard Artist AI. Analyze the following scene description and determine the best camera angle and overall mood.

    Scene: "${sceneDescription}"

    Respond with ONLY a JSON object with two keys: "cameraAngle" and "mood".
    - For "cameraAngle", choose from: "Wide Shot", "Close-Up", "Top Shot", "Shoulder Level", "Eye Level", "High Angle", "Low Angle".
    - For "mood", provide a short, descriptive phrase (e.g., "Tense and suspenseful", "Joyful and celebratory", "Somber and reflective").
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: analysisPrompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cameraAngle: {
            type: Type.STRING,
            description: "The selected camera angle for the scene.",
          },
          mood: {
            type: Type.STRING,
            description: "The determined mood of the scene.",
          },
        },
        required: ["cameraAngle", "mood"],
      },
    },
  });

  try {
    const jsonText = response.text.trim();
    return JSON.parse(jsonText);
  } catch (e) {
    console.error("Failed to parse JSON from analysis response:", response.text);
    throw new Error("Could not determine scene metadata.");
  }
}


export const generateStoryboardFrame = async (sceneDescription: string): Promise<StoryboardResult> => {
  try {
    // Wrap each API call in the retry utility to handle rate limiting.
    const sceneAnalysis = await retryWithBackoff(() => analyzeScene(sceneDescription));
    const imageUrl = await retryWithBackoff(() => generateImage(sceneDescription));

    return {
      imageUrl,
      cameraAngle: sceneAnalysis.cameraAngle,
      mood: sceneAnalysis.mood,
    };
  } catch (error) {
    console.error("Error generating storyboard frame:", error);
    if (error instanceof Error) {
        let finalMessage = error.message;

        // The core error from the API is often a JSON string.
        // Let's try to find it within the broader error message for a cleaner display.
        const jsonMatch = error.message.match(/{.*}/s);
        if (jsonMatch) {
            try {
                const errorJson = JSON.parse(jsonMatch[0]);
                if (errorJson.error && errorJson.error.message) {
                    finalMessage = errorJson.error.message;
                }
            } catch (e) {
                // Parsing failed, stick with the original message which is still informative.
            }
        }
        throw new Error(`Failed to generate storyboard: ${finalMessage}`);
    }
    throw new Error("An unknown error occurred during storyboard generation.");
  }
};