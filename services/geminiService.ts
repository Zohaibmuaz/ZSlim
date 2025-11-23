import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FoodAssessment, AdvisorResult, MacroNutrients, DailyLog, DailyAnalysis, HealthyAlternativeResult } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Interrogative Food Logger
 */
export const assessFoodInput = async (
  description: string,
  imageBase64?: string,
  previousQuestions?: string[],
  userAnswers?: string[]
): Promise<FoodAssessment> => {
  const modelId = "gemini-2.5-flash";

  const assessmentSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      isSpecific: { type: Type.BOOLEAN, description: "True if we can calculate calories with 90% accuracy." },
      clarifyingQuestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of 2-3 short questions to ask the user if isSpecific is false."
      },
      foodName: { type: Type.STRING },
      estimatedMacros: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fats: { type: Type.NUMBER },
          saturatedFats: { type: Type.NUMBER },
          sugars: { type: Type.NUMBER },
        },
        required: ["calories", "protein", "carbs", "fats", "saturatedFats", "sugars"]
      }
    },
    required: ["isSpecific"]
  };

  let prompt = `
    You are a strict, precision-focused nutritionist AI. Your goal is EXACT calorie tracking.
    User Input: "${description}"
  `;

  if (previousQuestions && userAnswers) {
    prompt += `
    Context - Previous Questions: ${JSON.stringify(previousQuestions)}
    User Answers: ${JSON.stringify(userAnswers)}
    Combine this information to determine specific macros.
    `;
  }

  const parts: any[] = [{ text: prompt }];
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: assessmentSchema,
        systemInstruction: "If the user input is vague (e.g., 'sandwich', 'rice', 'chicken'), set isSpecific to false and ask for cooking method, portion size (grams/cups), or ingredients. Do not guess averages. Only return macros if you are confident."
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as FoodAssessment;

  } catch (error) {
    console.error("Error assessing food:", error);
    throw error;
  }
};

/**
 * The Verdict Generator
 */
export const getFoodVerdict = async (foodName: string, macros: MacroNutrients): Promise<string> => {
  const modelId = "gemini-flash-lite-latest";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Analyze this food for weight loss: ${foodName}. Macros: ${JSON.stringify(macros)}. Give a single sentence verdict.`,
      config: {
        systemInstruction: "You are a weight loss coach. Be direct. Mention if high in saturated fat or sugar. Max 15 words.",
      }
    });
    return response.text || "Analysis unavailable.";
  } catch (e) {
    return "Could not generate verdict.";
  }
};

/**
 * Chat with Advisor (Context Aware)
 */
export const chatWithAdvisor = async (
  currentMessage: string,
  chatHistory: {role: string, parts: {text: string}[]}[],
  userContext: string
): Promise<string> => {
  const modelId = "gemini-2.5-flash";

  try {
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: `You are SlimLogic AI, a supportive but strict weight loss coach. 
        You have access to the user's data: ${userContext}.
        Use this data to give specific advice. If they ask "What should I eat?", look at their remaining calories and macros.
        Keep answers concise (under 3 sentences) unless asked for a detailed plan.`
      },
      history: chatHistory
    });

    const result = await chat.sendMessage({ message: currentMessage });
    return result.text;
  } catch (e) {
    console.error(e);
    return "I'm having trouble connecting to the server right now.";
  }
};

/**
 * Generate Report Summary
 */
export const generateWeeklyReportSummary = async (history: any[]): Promise<string> => {
    const modelId = "gemini-3-pro-preview";
    
    try {
         const response = await ai.models.generateContent({
            model: modelId,
            contents: `Analyze this weekly food log history JSON and write a professional progress report. 
            Data: ${JSON.stringify(history)}
            
            Format Requirements:
            - Use **bold** for key insights.
            - Write in clear, encouraging paragraphs.
            - Start with a "Weekly Snapshot" header.
            - End with a "Focus for Next Week" section.
            - Do NOT use JSON or markdown code blocks, just use the text formatting.`,
            config: {
                systemInstruction: "You are a data analyst for a weight loss app. Be encouraging but factual."
            }
         });
         return response.text || "No summary available.";
    } catch (e) {
        return "Could not generate summary.";
    }
};

/**
 * Healthy Alternative Logic
 */
export const suggestHealthyAlternative = async (
    imageBase64: string,
    userHistoryContext: string
): Promise<HealthyAlternativeResult> => {
    const modelId = "gemini-2.5-flash";

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            originalFood: { type: Type.STRING },
            healthierAlternative: { type: Type.STRING },
            whyItIsBetter: { type: Type.STRING },
            calorieDifference: { type: Type.NUMBER, description: "Estimated calories saved" }
        },
        required: ["originalFood", "healthierAlternative", "whyItIsBetter", "calorieDifference"]
    };

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: {
                parts: [
                    { text: `Identify this food. Suggest a healthier alternative that satisfies a similar craving but is better for weight loss. Context of user habits: ${userHistoryContext}` },
                    { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });
        
        const text = response.text;
        if (!text) throw new Error("No alternative generated");
        return JSON.parse(text) as HealthyAlternativeResult;
    } catch (error) {
        console.error("Alternative error:", error);
        throw error;
    }
}

/**
 * Generate Food Image (for the Swap feature)
 */
export const generateFoodImage = async (foodDescription: string): Promise<string | null> => {
  const modelId = "gemini-2.5-flash-image";
  
  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { text: `A delicious, high-quality, professional food photography shot of ${foodDescription}. Bright, appetizing, healthy.` }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData && part.inlineData.data) {
        return part.inlineData.data;
      }
    }
    return null;
  } catch (e) {
    console.error("Image gen error", e);
    return null;
  }
}

/**
 * Daily Historical Analysis
 */
export const analyzeDailyLog = async (log: DailyLog): Promise<DailyAnalysis> => {
    const modelId = "gemini-3-pro-preview"; // Using Pro for complex reasoning

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            verdict: { type: Type.STRING, enum: ["Good Day", "Needs Improvement", "Off Track"] },
            summary: { type: Type.STRING },
            dos: { type: Type.ARRAY, items: { type: Type.STRING } },
            donts: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["verdict", "summary", "dos", "donts"]
    };

    try {
        const response = await ai.models.generateContent({
            model: modelId,
            contents: `Analyze this daily log: ${JSON.stringify(log)}. Did the user meet their goals? Provide actionable advice for tomorrow.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const text = response.text;
        if (!text) throw new Error("No analysis generated");
        return JSON.parse(text) as DailyAnalysis;
    } catch (error) {
        console.error("Daily analysis error:", error);
        return {
            verdict: "Needs Improvement",
            summary: "Could not generate analysis.",
            dos: ["Keep tracking"],
            donts: ["Give up"]
        };
    }
}

/**
 * Edit Food Image (Meal Fixer) - Legacy
 */
export const editFoodImage = async (
  originalImageBase64: string,
  prompt: string
): Promise<string | null> => {
  const modelId = "gemini-2.5-flash-image";

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: originalImageBase64,
            },
          },
          { text: prompt },
        ],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData?.data) {
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Edit image error:", error);
    return null;
  }
};

/**
 * Meal Choice Evaluation (Should I Eat This?)
 */
export const evaluateFoodChoice = async (
  imageBase64: string | null,
  description: string,
  userContext: string
): Promise<AdvisorResult> => {
  const modelId = "gemini-2.5-flash";

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      recommendation: { type: Type.STRING, enum: ["Yes", "No"] },
      reason: { type: Type.STRING }
    },
    required: ["recommendation", "reason"]
  };

  const parts: any[] = [
    { text: `Based on the user's remaining calories and goals (${userContext}), should they eat this? Be strict. If it fits, say Yes. If it blows the limit or is junk, say No. Provide a short, punchy reason.` }
  ];

  if (description) parts.push({ text: `Food: ${description}` });
  if (imageBase64) parts.push({ inlineData: { mimeType: "image/jpeg", data: imageBase64 } });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No evaluation generated");
    return JSON.parse(text) as AdvisorResult;
  } catch (e) {
    console.error("Evaluate food choice error", e);
    return { recommendation: "No", reason: "Could not analyze. Better safe than sorry." };
  }
}