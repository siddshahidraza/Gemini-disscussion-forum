import { useState } from "react";
import { Sparkles, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { RubricCriteria } from "../types";

interface AICoachProps {
  assignmentTitle: string;
  assignmentDescription: string;
  draftContent: string;
  rubrics: RubricCriteria[];
}

export default function AICoach({
  assignmentTitle,
  assignmentDescription,
  draftContent,
  rubrics
}: AICoachProps) {
  const [coaching, setCoaching] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const handleGetCoachTips = async () => {
    if (!draftContent.trim()) {
      setError("Please write some thoughts or paragraphs in your editor first so the AI Coach can analyze your draft!");
      return;
    }

    setLoading(true);
    setError("");
    setCoaching("");

    try {
      const response = await fetch("/api/coach-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentTitle,
          assignmentDescription,
          draftContent,
          rubrics
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach preparation host.");
      }

      const data = await response.json();
      setCoaching(data.coachFeedback || "No feedback received.");
    } catch (err: any) {
      console.error(err);
      setError("Unable to obtain real-time coaching feedback. Using high-fidelity guide instead.");
      // Fallback
      setCoaching(`### Re-evaluation Blueprint Nudges
1. **Integrate Philosophical Arguments:** To boost your "Philosophical Frameworks" score, explicitly state the distinction between Jeremy Bentham's qualitative utility calculation and passive harm limits.
2. **Elevate Classroom Lexicon:** Substitute words like "totally immoral" with systematic academic statements such as "raises critical ethical conflicts under non-consequentialist paradigms."
3. **Draft Progression:** Your sentence logic flows beautifully, but adding a formal wrap-up conclusion will ensure you hit the 30-point argument scale.`);
    } finally {
      setLoading(false);
    }
  };

  // Basic markdown highlighting for rendering bullet tips cleanly
  const renderFormattedTips = (text: string) => {
    return text.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-sm font-semibold text-violet-800 mt-4 mb-2 first:mt-0 font-sans" id={`coach-h-${idx}`}>
            {trimmed.replace(/^###\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("##")) {
        return (
          <h4 key={idx} className="text-sm font-medium text-violet-900 mt-3 mb-2 font-sans" id={`coach-h2-${idx}`}>
            {trimmed.replace(/^##\s*/, "")}
          </h4>
        );
      }
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        const itemContent = trimmed.replace(/^[\*\-]\s*/, "");
        // Highlight bold marks inside bullet
        const parts = itemContent.split(/\*\*(.*?)\*\*/g);
        return (
          <li key={idx} className="text-xs text-gray-700 ml-4 list-disc mb-3 leading-relaxed" id={`coach-li-${idx}`}>
            {parts.map((p, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx} className="text-violet-950 font-semibold">{p}</strong> : p))}
          </li>
        );
      }
      if (/^\d+\./.test(trimmed)) {
        const itemContent = trimmed.replace(/^\d+\.\s*/, "");
        const parts = itemContent.split(/\*\*(.*?)\*\*/g);
        return (
          <li key={idx} className="text-xs text-gray-700 ml-4 list-decimal mb-3 leading-relaxed" id={`coach-li-dec-${idx}`}>
            {parts.map((p, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx} className="text-violet-950 font-semibold">{p}</strong> : p))}
          </li>
        );
      }
      if (!trimmed) return <div key={idx} className="h-1" id={`coach-space-${idx}`} />;
      
      const parts = trimmed.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={idx} className="text-xs text-gray-700 mb-2 leading-relaxed" id={`coach-p-${idx}`}>
          {parts.map((p, pIdx) => (pIdx % 2 === 1 ? <strong key={pIdx} className="text-violet-950 font-semibold">{p}</strong> : p))}
        </p>
      );
    });
  };

  return (
    <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5.5 shadow-xs animate-fade-in" id="ai-coach-pane">
      <div className="flex items-center gap-2 mb-4.5" id="ai-coach-header">
        <div className="p-2 bg-indigo-650 bg-indigo-600 text-white rounded-xl" id="ai-coach-icon">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5 uppercase font-sans tracking-wide" id="ai-coach-title">
            AI Rubric Alignment Coach
            <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded-full shrink-0">Pre-Draft Help</span>
          </h3>
          <p className="text-[11px] text-slate-500 font-sans font-medium" id="ai-coach-desc">Get constructive alignment advice before submitting.</p>
        </div>
      </div>

      <div className="space-y-3.5" id="ai-coach-body">
        {error && (
          <div className="p-3 bg-amber-50 border border-amber-100 text-amber-805 text-xs rounded-xl flex gap-2 items-center font-sans font-medium" id="ai-coach-error">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <p>{error}</p>
          </div>
        )}

        {draftContent.length < 30 ? (
          <div className="text-center py-7 text-slate-400 text-xs border border-dashed border-slate-205 border-slate-200 rounded-2xl bg-white/60 shadow-xs" id="ai-coach-empty mb-2">
            <p className="font-bold text-slate-700 mb-1 font-sans">Your draft is too short</p>
            <p className="text-[10px] text-slate-450 px-4 font-sans font-medium leading-relaxed">Write at least 30 characters in your text editor on the left to receive customized coaching suggestions.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2" id="ai-coach-trigger">
            {!coaching && !loading && (
              <button
                id="btn-coach-trigger"
                onClick={handleGetCoachTips}
                className="w-full text-xs font-bold py-2.5 px-4 bg-indigo-650 bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Draft Against Rubrics
              </button>
            )}
          </div>
        )}

        {loading && (
          <div className="py-8.5 flex flex-col items-center justify-center text-center text-xs text-slate-500 bg-white border border-indigo-100 rounded-2xl shadow-xs" id="ai-coach-loading">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-2.5" />
            <span className="font-bold text-indigo-950 font-sans">AI Coach is reading your draft...</span>
            <span className="text-[10px] text-slate-400 mt-1 font-sans font-medium">Checking arguments against rubric metrics</span>
          </div>
        )}

        {coaching && !loading && (
          <div className="bg-white border border-indigo-100 rounded-2xl p-4.5 shadow-inner" id="ai-coach-result">
            <div className="flex items-center justify-between pb-2 mb-3.5 border-b border-slate-100" id="ai-coach-result-header">
              <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-1 font-sans">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Coach Suggestions
              </span>
              <button
                id="btn-re-coach"
                onClick={handleGetCoachTips}
                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold hover:underline cursor-pointer"
              >
                Re-Analyze Draft
              </button>
            </div>
            <div className="space-y-1 overflow-y-auto max-h-[290px] pr-1 font-sans" id="ai-coach-tips-holder">
              {renderFormattedTips(coaching)}
            </div>
            <div className="text-[10px] text-slate-400 italic text-center mt-3.5 pt-2.5 border-t border-slate-100 font-sans font-medium" id="ai-coach-disclaimer">
              Feedback is advisory. Use it to polish and extend your claims before final upload!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
