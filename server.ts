import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Lazy-loaded Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. The app will use high-fidelity mockup feedback generator instead.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. Endpoint: AI submission evaluation & grading
app.post("/api/eval-submission", async (req, res) => {
  try {
    const { assignmentTitle, assignmentDescription, studentContent, rubrics } = req.body;

    if (!assignmentTitle || !studentContent || !rubrics) {
      return res.status(400).json({ error: "Missing required fields for evaluation" });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Fallback: If no API key is provided, return rich mockup evaluation so the app remains interactive!
      console.log("No GEMINI_API_KEY found, using structured high-fidelity fallback feedback.");
      const mockScoreSum = rubrics.reduce((acc: number, r: any) => acc + Math.round(r.maxPoints * 0.8), 0);
      const mockMaxSum = rubrics.reduce((acc: number, r: any) => acc + r.maxPoints, 0);
      
      const mockFeedback = {
        overallScore: mockScoreSum,
        maxScore: mockMaxSum,
        rubricScores: rubrics.map((r: any) => ({
          category: r.category,
          score: Math.round(r.maxPoints * 0.8),
          maxPoints: r.maxPoints,
          feedback: `Good job addressing the criteria for "${r.category}". To elevate, add clearer examples or cross-reference sources.`
        })),
        strengths: [
          "Developed a clear central argument aligned with the prompt description.",
          "Demonstrates strong command over vocabulary and professional syntax."
        ],
        improvements: [
          "Needs deeper analysis of opposing perspectives instead of one-sided claims.",
          "Try to cite external concepts to back up recommendations."
        ],
        detailedAnalysis: `### Detailed Evaluation Report
This is a structured evaluation mock feedback report because no Gemini API key is configured. 

The submission is well-organized with clear section divides. 
In the first paragraph, the premise is asserted persuasively. 

#### Area 1: Constructiveness
The student response addresses the central prompt with focus. However, to achieve maximum points, consider explicitly detailing **why** this policy position stands out.

#### Area 2: Structure
The transition between arguments is clear, though introducing concrete real-world case studies would strengthen the final point.`,
        sentiment: 'constructive',
        generatedAt: new Date().toISOString()
      };
      return res.json(mockFeedback);
    }

    // Call Gemini API with Structured Schema Output using gemini-3.5-flash
    const prompt = `
You are an expert academic evaluator and teacher's assistant. Grade and evaluate this student's response to an assignment prompt in a discussion forum.
Provide constructive, balanced, and encouraging feedback.

Assignment Title: "${assignmentTitle}"
Assignment Prompt/Description:
"""
${assignmentDescription}
"""

Student's Answer/Response:
"""
${studentContent}
"""

The grading is strictly based on the following Rubric Criteria:
${JSON.stringify(rubrics, null, 2)}

Please perform a detailed assessment, computing score points for each rubric criteria based on its 'maxPoints' and description.
Provide specific strengths, improvements, and a beautiful comprehensive analytical markdown feedback report.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional educational assessor. Give critical, detailed, encouraging, and accurate evaluations according to the assigned rubrics. Calculate exact score values based on the maximum points per criteria. Do not output values over maxPoints.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["overallScore", "maxScore", "rubricScores", "strengths", "improvements", "detailedAnalysis", "sentiment"],
          properties: {
            overallScore: { type: Type.INTEGER, description: "Sum of scores across all rubric criteria" },
            maxScore: { type: Type.INTEGER, description: "Total maximum score points possible across all rubric sections" },
            rubricScores: {
              type: Type.ARRAY,
              description: "Assessments for each rubric item in the prompt",
              items: {
                type: Type.OBJECT,
                required: ["category", "score", "maxPoints", "feedback"],
                properties: {
                  category: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                  maxPoints: { type: Type.INTEGER },
                  feedback: { type: Type.STRING, description: "1-2 sentence criteria-specific critique explaining the specific mark." }
                }
              }
            },
            strengths: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 precise bullet points highlighting what the student did exceptionally well."
            },
            improvements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 precise directions for revision, refinement, or further critical thinking."
            },
            detailedAnalysis: {
              type: Type.STRING,
              description: "A comprehensive academic analysis (in Markdown format) spanning several paragraphs outlining arguments, syntax, methodology, errors, and stylistic remarks."
            },
            sentiment: {
              type: Type.STRING,
              enum: ["excellent", "constructive", "needs_work"],
              description: "Overall sentiment classification of the work."
            }
          }
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("Empty response from Gemini AI");
    }

    const aiFeedbackParsed = JSON.parse(outputText.trim());
    aiFeedbackParsed.generatedAt = new Date().toISOString();

    return res.json(aiFeedbackParsed);

  } catch (error: any) {
    console.error("Error in AI Evaluation:", error);
    return res.status(500).json({ error: error?.message || "Internal server error during Gemini analysis" });
  }
});

// 2. Endpoint: AI Coach - helper suggestions BEFORE submitting
app.post("/api/coach-submission", async (req, res) => {
  try {
    const { assignmentTitle, assignmentDescription, draftContent, rubrics } = req.body;

    if (!assignmentTitle || !draftContent) {
      return res.status(400).json({ error: "Missing draft contents or title for coaching" });
    }

    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        coachFeedback: `### Preview Coaching Tips (Mock Mode)
1. **Strengthen the Introduction:** Your initial statement addresses "${assignmentTitle}" beautifully, but stating your custom thesis statement sooner would elevate structure.
2. **Expand on Rubrics:** Make sure you explicitly reference key terminology from your assigned rubric to maximize grading metrics.
3. **Grammar Checklist:** Double-check sentence phrasing in paragraph 2 to ensure reading flows effortlessly.`
      });
    }

    const prompt = `
You are a peer-grade prep coach. A student has written a draft response for a discussion forum assignment. They want advice on how to improve this draft BEFORE submitting it.

Assignment Title: "${assignmentTitle}"
Prompt Description: "${assignmentDescription || "Analyze prompt themes"}"
Rubric Requirements: ${JSON.stringify(rubrics || [], null, 2)}

Student Draft:
"""
${draftContent}
"""

Provide 3 quick, actionable, friendly, and practical suggestions pointing out specifically where the draft is strong and where they can incorporate rubric components to get higher marks. Format your response cleanly in Markdown. Keep it brief and constructive (under 200 words).
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an encouraging academic AI advisor guiding students to refine draft content. Offer 3 direct, friendly, bullet points focusing on how to level up draft points based on assigned rubrics."
      }
    });

    return res.json({ coachFeedback: response.text });

  } catch (error: any) {
    console.error("Coaching API Error:", error);
    return res.status(500).json({ error: "Failed to generate coaching suggestions." });
  }
});


async function bootstrapServer() {
  // Serve health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Vite Express setup
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
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

  // Start listener
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started. Listening at http://0.0.0.0:${PORT}`);
  });
}

bootstrapServer().catch((err) => {
  console.error("Failed to bootstrap fullstack service:", err);
});
