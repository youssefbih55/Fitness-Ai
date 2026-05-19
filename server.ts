import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  const executeWithRetry = async (fn: () => Promise<any>, maxRetries = 3) => {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const status = error.code || 500;
        if (status === 503 || status === 429) {
          console.log(`AI busy (${status}). Retry ${i + 1}/${maxRetries}...`);
          const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  };

  // API to analyze body from photo
  app.post("/api/analyze-body", async (req, res) => {
    try {
      const { image, userData } = req.body;
      if (!image) return res.status(400).json({ error: "Image required" });

      const data = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `You are an elite scientific fitness analyzer. Analyze this body photo with extreme precision. 
                User Context: ${JSON.stringify(userData)}
                
                Provide:
                1. Calculated Body Fat % range based on visual landmarks (V-taper, vascularity, abdominal definition).
                2. Precise Body Type (Ectomorph, Mesomorph, Endomorph or Hybrid).
                3. Biomechanical Strengths and Weaknesses (e.g., high lat attachment, quad dominance).
                4. Strategic Corrective Advice (posture, muscle imbalances, specific localized training).
                5. A "Genetic Potential" score (1-10) for the user's current goal.
                
                The response MUST be in Arabic. Return strictly JSON.`
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: image.split(",")[1]
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bodyFatRange: { type: Type.STRING },
              bodyType: { type: Type.STRING },
              analysis: { type: Type.STRING },
              advice: { type: Type.STRING },
              potentialScore: { type: Type.NUMBER }
            }
          }
        }
      }));

      res.json(JSON.parse(data.text || "{}"));
    } catch (error: any) {
      console.error("Analysis Error:", error);
      res.status(error.code || 500).json({ error: "Failed to analyze image", details: error.message });
    }
  });

  // API to analyze meal from photo
  app.post("/api/analyze-meal", async (req, res) => {
    try {
      const { image } = req.body;
      if (!image) return res.status(400).json({ error: "Image required" });

      const data = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Analyze this meal photo and estimate the nutritional content. Identify all food items.
                Output:
                1. Meal Name
                2. Estimated Calories
                3. Protein, Carbs, Fats (grams)
                4. Health Score (1-10)
                5. Expert Insight (why it is good or what to add for better balance)
                
                The response MUST be in Arabic. Return strictly JSON.`
              },
              {
                inlineData: {
                  mimeType: "image/jpeg",
                  data: image.split(",")[1]
                }
              }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              mealName: { type: Type.STRING },
              calories: { type: Type.NUMBER },
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fats: { type: Type.NUMBER },
              healthScore: { type: Type.NUMBER },
              insight: { type: Type.STRING }
            }
          }
        }
      }));
      res.json(JSON.parse(data.text || "{}"));
    } catch (error: any) {
      console.error("Meal Analysis Error:", error);
      res.status(error.code || 500).json({ error: "Failed to analyze meal" });
    }
  });

  // API to generate recipe based on macros and preferences
  app.post("/api/generate-recipe", async (req, res) => {
    try {
      const { preferences, mealType } = req.body;
      const data = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            text: `Generate a healthy recipe for ${mealType} based on: ${JSON.stringify(preferences)}.
            Include: Name, Ingredients, Instructions, Calories, Macros.
            Answer in Arabic.`
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
              instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
              calories: { type: Type.NUMBER },
              macros: {
                type: Type.OBJECT,
                properties: {
                  protein: { type: Type.NUMBER },
                  carbs: { type: Type.NUMBER },
                  fats: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }));
      res.json(JSON.parse(data.text || "{}"));
    } catch (error: any) {
      console.error("Recipe Error:", error);
      res.status(error.code || 500).json({ error: "Failed to generate recipe", details: error.message });
    }
  });

  // API to generate full fitness and diet plan
  app.post("/api/generate-plan", async (req, res) => {
    try {
      const userData = req.body;
      const data = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview", 
        contents: [
          {
            text: `You are a professional AI Fitness Coach and Nutritionist. Generate a 100% personalized fitness and diet plan based on the following user data:
            ${JSON.stringify(userData, null, 2)}
            
            Return the response in JSON format according to the following schema. 
            The response must be in Arabic as the user requested, but use English for exercise names where appropriate (like Bench Press).
            `
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              analysis: {
                type: Type.OBJECT,
                properties: {
                  bmi: { type: Type.NUMBER },
                  tdee: { type: Type.NUMBER },
                  proteinNeeds: { type: Type.NUMBER, description: "grams per day" },
                  bodyTypeAnalysis: { type: Type.STRING },
                  strengthsWeaknesses: { type: Type.STRING },
                  estimatedTime: { type: Type.STRING, description: "estimated time to reach goal" }
                },
                required: ["bmi", "tdee", "proteinNeeds", "bodyTypeAnalysis", "strengthsWeaknesses"]
              },
              workoutPlan: {
                type: Type.OBJECT,
                properties: {
                  summary: { type: Type.STRING },
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dayNumber: { type: Type.NUMBER },
                        title: { type: Type.STRING },
                        exercises: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              name: { type: Type.STRING },
                              sets: { type: Type.NUMBER },
                              reps: { type: Type.STRING },
                              rest: { type: Type.STRING },
                              muscleGroup: { type: Type.STRING }
                            }
                          }
                        },
                        cardio: { type: Type.STRING },
                        tips: { type: Type.STRING }
                      }
                    }
                  }
                }
              },
              nutritionPlan: {
                type: Type.OBJECT,
                properties: {
                  macros: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.NUMBER },
                      protein: { type: Type.NUMBER },
                      carbs: { type: Type.NUMBER },
                      fats: { type: Type.NUMBER }
                    }
                  },
                  meals: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        calories: { type: Type.NUMBER },
                        alternatives: { type: Type.STRING }
                      }
                    }
                  },
                  generalTips: { type: Type.STRING }
                }
              }
            }
          }
        }
      }));

      if (!data.text) throw new Error("Empty response from AI");
      res.json(JSON.parse(data.text));
    } catch (error: any) {
      console.error("Generator Error:", error);
      res.status(error.code || 500).json({ 
        error: "Failed to generate plan", 
        details: error.message,
        isUnavailable: error.code === 503 
      });
    }
  });

  // API for Chat Coach
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, userData } = req.body;
      const chat = ai.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: `You are the Fitness AI Coach. You are helping a user with their fitness and diet.
          User Profile: ${JSON.stringify(userData)}
          Always be encouraging, professional, and evidence-based.
          Answer in Arabic as the user speaks Arabic.
          Keep answers concise but informative.`
        }
      });
      const response = await executeWithRetry(() => chat.sendMessage({ message }));
      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Chat Error:", error);
      res.status(error.code || 500).json({ error: "Failed to process chat" });
    }
  });

  // API to generate expert insight of the day
  app.post("/api/expert-insight", async (req, res) => {
    try {
      const { userData, weightHistory } = req.body;
      const data = await executeWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            text: `You are an elite high-performance biohacker and coach. Based on this user's data: ${JSON.stringify(userData)} and weight history: ${JSON.stringify(weightHistory)}, provide ONE deep biometric insight for today.
            Focus on trends, recovery, metabolic state, or psychological motivation.
            Output:
            1. Title (Short)
            2. Insight (1-2 sentences)
            3. Actionable Tip
            
            The response MUST be in Arabic. Return strictly JSON.`
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              insight: { type: Type.STRING },
              tip: { type: Type.STRING }
            }
          }
        }
      }));
      res.json(JSON.parse(data.text || "{}"));
    } catch (error: any) {
      console.error("Insight Error:", error);
      res.status(500).json({ error: "Failed to generate insight" });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
