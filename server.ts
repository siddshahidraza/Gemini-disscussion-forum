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

// 1. Endpoint: AI submission evaluation & grading (with custom criteria weighting support)
app.post("/api/eval-submission", async (req, res) => {
  try {
    const { assignmentTitle, assignmentDescription, studentContent, rubrics, emphasisPriorities } = req.body;

    if (!assignmentTitle || !studentContent || !rubrics) {
      return res.status(400).json({ error: "Missing required fields for evaluation" });
    }

    const ai = getGeminiClient();

    let prioritiesText = "none specified";
    if (emphasisPriorities) {
      prioritiesText = Object.entries(emphasisPriorities)
        .map(([k, v]) => `${k.toUpperCase()}: ${String(v).toUpperCase()}`)
        .join(", ");
    }

    if (!ai) {
      // Fallback: If no API key is provided, return rich mockup evaluation honoring priorities!
      console.log(`No GEMINI_API_KEY found, using fallback feedback. Priorities selected: ${prioritiesText}`);
      
      // Calculate a dynamic score based on content length
      const lengthBonus = Math.min(15, Math.floor(studentContent.length / 100));
      const basePercentage = 75 + lengthBonus; // default around ~80-92%
      
      // Let's adjust mock score based on criteria priorities if available
      let adjustedPct = basePercentage;
      if (emphasisPriorities) {
        // Mock adjustments to simulate importance
        if (emphasisPriorities.criticalAnalysis === 'high') adjustedPct += 3;
        if (emphasisPriorities.grammar === 'low') adjustedPct += 2; // more leeway
        if (emphasisPriorities.creativity === 'high' && studentContent.length > 500) adjustedPct += 4;
      }
      adjustedPct = Math.min(100, Math.max(50, adjustedPct));

      const mockScoreSum = rubrics.reduce((acc: number, r: any) => acc + Math.round(r.maxPoints * (adjustedPct / 100)), 0);
      const mockMaxSum = rubrics.reduce((acc: number, r: any) => acc + r.maxPoints, 0);

      const mockFeedback = {
        overallScore: mockScoreSum,
        maxScore: mockMaxSum,
        rubricScores: rubrics.map((r: any) => {
          const scoreVal = Math.round(r.maxPoints * (adjustedPct / 100));
          return {
            category: r.category,
            score: scoreVal,
            maxPoints: r.maxPoints,
            feedback: `Evaluated with custom emphasis weightings (${prioritiesText}). The draft provides sound reasoning fitting ${r.category} guidelines.`
          };
        }),
        strengths: [
          `Addressed central thesis using constructive statements.`,
          `Good articulation aligning with teacher's priorities: ${prioritiesText}.`
        ],
        improvements: [
          `To optimize, expand on the theoretical concepts of this criteria.`,
          `Consider addressing possible counter-evidence to push into higher brackets.`
        ],
        detailedAnalysis: `### Detailed Evaluation Report (Simulated Local Mode)
This grading report was generated using local platform scoring rules.

**Selected Teacher Priorities:**
- **Grammar Emphasis:** ${emphasisPriorities?.grammar?.toUpperCase() || 'MEDIUM'}
- **Structure Emphasis:** ${emphasisPriorities?.structure?.toUpperCase() || 'MEDIUM'}
- **Content Accuracy Emphasis:** ${emphasisPriorities?.contentAccuracy?.toUpperCase() || 'MEDIUM'}
- **Critical Analysis Emphasis:** ${emphasisPriorities?.criticalAnalysis?.toUpperCase() || 'MEDIUM'}
- **Creativity Emphasis:** ${emphasisPriorities?.creativity?.toUpperCase() || 'MEDIUM'}

#### Evaluator Assessment
The thesis argues its position with decent structural stability. In accordance with your instructor's **${emphasisPriorities?.criticalAnalysis || 'medium'}** critical analysis focus and **${emphasisPriorities?.grammar || 'medium'}** grammar weight, the response was measured carefully.
Transitions are smooth. To improve, we encourage citing additional case examples next time!`,
        sentiment: 'constructive',
        generatedAt: new Date().toISOString()
      };
      return res.json(mockFeedback);
    }

    // Guide the prompt according to teacher specified emphasis priorities
    let emphasisDirective = "";
    if (emphasisPriorities) {
      emphasisDirective = `
IMPORTANT COMPLIANCE INSTRUCTIONS:
The teacher has specified customized emphasis weights for evaluating this submission. You MUST weigh and evaluate the submission focusing on these priorities:
- Grammar Emphasis: **${emphasisPriorities.grammar?.toUpperCase() || 'MEDIUM'}**
- Structure/Flow Emphasis: **${emphasisPriorities.structure?.toUpperCase() || 'MEDIUM'}**
- Content Accuracy Emphasis: **${emphasisPriorities.contentAccuracy?.toUpperCase() || 'MEDIUM'}**
- Critical Analysis Emphasis: **${emphasisPriorities.criticalAnalysis?.toUpperCase() || 'MEDIUM'}**
- Creativity/Novelty Emphasis: **${emphasisPriorities.creativity?.toUpperCase() || 'MEDIUM'}**

Guidance for scores:
- For 'HIGH' priority priorities: Be thorough & rigorous. Provide deeper analytical commentary in the detailedAnalysis, and let this criteria influence their core scores heavily.
- For 'LOW' priority priorities: Be highly lenient. Give them generous leeway. Do not penalize scores heavily in rubric items reflecting these, even if syntax or styling is conversational.
`;
    }

    // Call Gemini API with Structured Schema Output using gemini-3.5-flash
    const prompt = `
You are an expert academic assessor. Evaluate and grade this student's response to an assignment prompt in a collaborative discussion forum.
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

${emphasisDirective}

Please perform a detailed assessment, computing score points for each rubric criteria based on its 'maxPoints' and description, considering the priority emphasis directions specified.
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
              description: "A comprehensive academic analysis (in Markdown format) spanning several paragraphs outlining arguments, syntax, methodology, errors, and stylistic remarks. Explicitly touch upon the teacher-defined evaluation priorities."
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

// 3. Endpoint: AI Rubrics Auto-Generator
app.post("/api/generate-rubric", async (req, res) => {
  try {
    const { title, description, learningObjectives } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required to generate a rubric." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Mock generated rubric when API key is not present
      console.log("No GEMINI_API_KEY found, using fallback generated rubric.");
      const mockRubric = [
        {
          category: "Conceptual Depth & Integration",
          maxPoints: 30,
          description: "Depth of alignment with stated learning goals. Strong understanding of related social or technical frameworks."
        },
        {
          category: "Empirical Evidence & Justification",
          maxPoints: 30,
          description: "Quality of support materials, citations, or theoretical thought experiments cited."
        },
        {
          category: "Structure & Flow",
          maxPoints: 20,
          description: "Logical transition of core concepts, clear paragraphs, and academic grammar."
        },
        {
          category: "Creativity & Counterarguments",
          maxPoints: 20,
          description: "Addresses opposing views substantively, suggesting novel or creative framework applications."
        }
      ];
      return res.json({ rubric: mockRubric });
    }

    const prompt = `
You are an expert academic curriculum designer. Create a comprehensive, professional grading rubric for this discussion assignment.
The rubric MUST consist of 3 to 4 distinct criteria items.
Crucially, the 'maxPoints' across all generated criteria items MUST sum up to EXACTLY 100 points.

Assignment Title: "${title}"
Assignment Description: "${description}"
Stated Learning Objectives (Optional): "${learningObjectives || "Analyze and critique the prompt scenario"}"

Provide clear, professional, editable rubric category names, point budgets, and brief descriptions outlining how point brackets are partitioned.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are an expert curriculum builder. Compile 3-4 highly relevant rubric criteria based on details. Ensure their point boundaries sum exactly to 100 points.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["rubric"],
          properties: {
            rubric: {
              type: Type.ARRAY,
              description: "Array of 3 to 4 rubric objects. The sum of maxPoints MUST be exactly 100.",
              items: {
                type: Type.OBJECT,
                required: ["category", "maxPoints", "description"],
                properties: {
                  category: { type: Type.STRING, description: "Name of the criteria, e.g. Ethical Reasoning, Code Efficiency" },
                  maxPoints: { type: Type.INTEGER, description: "Max score. Ensure points sum exactly to 100." },
                  description: { type: Type.STRING, description: "1-2 sentence definition of excellent standing under this bracket." }
                }
              }
            }
          }
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No response returned from rubric generator.");
    }

    const parsed = JSON.parse(outputText.trim());
    return res.json(parsed);

  } catch (error: any) {
    console.error("Rubric generator API error:", error);
    return res.status(500).json({ error: error?.message || "Internal failure generating rubric." });
  }
});

// 4. Endpoint: Peer critique constructive reviews moderator
app.post("/api/moderate-feedback", async (req, res) => {
  try {
    const { commentStrengths, commentImprovements, guidelines } = req.body;

    if (!commentStrengths || !commentImprovements) {
      return res.status(400).json({ error: "Peer feedback comments are required for moderation checking." });
    }

    const ai = getGeminiClient();

    if (!ai) {
      // Local moderation logic when API key is missing
      const textTotal = (commentStrengths + " " + commentImprovements).toLowerCase();
      const combinedLength = commentStrengths.trim().length + commentImprovements.trim().length;

      let isFlagged = false;
      let flagReason = "";
      let suggestedRevision = "";
      let qualityRating: 'excellent' | 'satisfactory' | 'needs_improvement' = 'satisfactory';

      // 1. Detect low effort (very brief)
      if (commentStrengths.trim().split(/\s+/).length < 4 || commentImprovements.trim().split(/\s+/).length < 4) {
        isFlagged = true;
        flagReason = "Feedback commentaries are too brief or low-effort to support peer growth.";
        suggestedRevision = `Hi there! Try expanding on your claims, for example: "${commentStrengths.trim() || 'Awesome work!'} I really appreciated your specific examples in paragraph 2, though I suggest adding a sentence explaining how your thesis supports your primary conclusion."`;
        qualityRating = 'needs_improvement';
      } 
      // 2. Detect inappropriate placeholder words
      else if (textTotal.includes("stupid") || textTotal.includes("idiot") || textTotal.includes("trash") || textTotal.includes("dumb") || textTotal.includes("bad work")) {
        isFlagged = true;
        flagReason = "Contains discouraging or non-academic terms (e.g., negative descriptors of person rather than constructive debate of arguments).";
        suggestedRevision = "Constructive alternative: 'While I understand the perspective in your argument, focusing on exploring counter-perspectives would make your defense significantly more academic.'";
        qualityRating = 'needs_improvement';
      }
      // 3. High quality
      else if (combinedLength > 160) {
        qualityRating = 'excellent';
      }

      return res.json({ isFlagged, flagReason, suggestedRevision, qualityRating });
    }

    const prompt = `
You are an academic discussion forum moderation assistant and peer-review coach.
Your job is to analyze peer critique comments written by a student to verify if they adhere to constructive guidelines, automatically flagging inappropriate, hostile, abusive, or extremely low-effort/unhelpful comments. It also rates the overall quality of this critique.

Teacher Review Guidelines:
"""
${guidelines || "Be constructive, specific, polite, and encourage peer learning."}
"""

Student Critique Comments:
- Strengths mentioned: "${commentStrengths}"
- Improvements suggested: "${commentImprovements}"

Analyze this draft review:
- Is it flagged? Set isFlagged to true if there is abusive language, toxic tone, or if it is extremely unhelpful/negligible (e.g. 1-3 word single-word placeholders like "looks good", "nice", ".").
- Compile a clear explanation in flagReason if isFlagged is true.
- Draft a suggestedRevision to help the student rewrite their feedback more constructively.
- Grade the qualityRating as "excellent", "satisfactory", or "needs_improvement" based on detail level, respectfulness, and guidance fidelity.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional educational forum moderator. Flag toxic, abusive or unhelpful/low effort single-phrase items, and rate constructive prose accurately according to instructions.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["isFlagged", "flagReason", "suggestedRevision", "qualityRating"],
          properties: {
            isFlagged: { type: Type.BOOLEAN, description: "Is this commentary inappropriate, toxic, or low-effort filler?" },
            flagReason: { type: Type.STRING, description: "Why was it flagged, or empty string if not flagged." },
            suggestedRevision: { type: Type.STRING, description: "Polite suggested rewrite that is constructive and aligns with guidelines." },
            qualityRating: {
              type: Type.STRING,
              enum: ["excellent", "satisfactory", "needs_improvement"],
              description: "AI grading of written peer feedback helpfulness and depth."
            }
          }
        }
      }
    });

    const outputText = response.text;
    if (!outputText) {
      throw new Error("No response returned from feedback moderator.");
    }

    const parsed = JSON.parse(outputText.trim());
    return res.json(parsed);

  } catch (error: any) {
    console.error("Moderation API Error:", error);
    return res.status(500).json({ error: error?.message || "Internal failure moderating critique comments." });
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
