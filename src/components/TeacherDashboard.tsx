import React, { useState, FormEvent } from "react";
import { 
  Assignment, 
  Submission, 
  PeerReview, 
  RubricCriteria, 
  AIFeedback 
} from "../types";
import { 
  Plus, 
  Check, 
  Award, 
  Bookmark, 
  HelpCircle, 
  Sparkles, 
  FileText, 
  Users, 
  BarChart2, 
  TrendingUp, 
  AlertCircle, 
  Loader2, 
  FileCheck, 
  ArrowRight,
  MessageSquare,
  RefreshCw,
  Clock
} from "lucide-react";

interface TeacherDashboardProps {
  assignments: Assignment[];
  submissions: Submission[];
  peerReviews: PeerReview[];
  onAddAssignment: (assignment: Assignment) => void;
  onGradeSubmission: (submissionId: string, grade: number, comments: string) => void;
  onAIEvaluateSubmission: (submissionId: string, updatedAIFeedback: AIFeedback) => void;
}

export default function TeacherDashboard({
  assignments,
  submissions,
  peerReviews,
  onAddAssignment,
  onGradeSubmission,
  onAIEvaluateSubmission
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'create' | 'analytics'>('submissions');
  const [selectedAsgId, setSelectedAsgId] = useState<string>(assignments[0]?.id || "");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Form State for creating assignment
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newRubric, setNewRubric] = useState<Omit<RubricCriteria, "id">[]>([
    { category: "Critical Thinking", maxPoints: 30, description: "Depth of argument, logic synthesis, and framework application." },
    { category: "Evidence & Reasoning", maxPoints: 30, description: "Quality of source verification, data, and counterclaims." },
    { category: "Formatting & Style", maxPoints: 40, description: "Grammar, academic prose, flow, and structural thesis consistency." }
  ]);
  const [newCatName, setNewCatName] = useState("");
  const [newCatPoints, setNewCatPoints] = useState(10);
  const [newCatDesc, setNewCatDesc] = useState("");

  const [aiEvalLoadingId, setAiEvalLoadingId] = useState<string | null>(null);
  const [aiEvalError, setAiEvalError] = useState<string | null>(null);

  // Form State for teacher manual grading
  const [manualGrade, setManualGrade] = useState<number>(0);
  const [manualComment, setManualComment] = useState("");
  const [gradeSuccessMsg, setGradeSuccessMsg] = useState(false);

  const activeAssignment = assignments.find(a => a.id === selectedAsgId) || assignments[0];
  const activeSubmissions = submissions.filter(s => s.assignmentId === selectedAsgId && s.status === 'submitted');

  const handleAddCriteria = () => {
    if (!newCatName.trim()) return;
    setNewRubric([
      ...newRubric,
      { category: newCatName, maxPoints: Number(newCatPoints), description: newCatDesc }
    ]);
    setNewCatName("");
    setNewCatPoints(10);
    setNewCatDesc("");
  };

  const handleRemoveCriteria = (index: number) => {
    setNewRubric(newRubric.filter((_, i) => i !== index));
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim() || newRubric.length === 0) {
      alert("Please provide a title, prompt description, and at least one rubric category!");
      return;
    }

    const compiledRubric: RubricCriteria[] = newRubric.map((r, idx) => ({
      ...r,
      id: `rubric_${Date.now()}_${idx}`
    }));

    const newAsg: Assignment = {
      id: `asg_${Date.now()}`,
      title: newTitle,
      description: newDesc,
      rubric: compiledRubric,
      createdAt: new Date().toISOString()
    };

    onAddAssignment(newAsg);
    setSelectedAsgId(newAsg.id);
    
    // reset form
    setNewTitle("");
    setNewDesc("");
    setNewRubric([
      { category: "Critical Thinking", maxPoints: 30, description: "Depth of argument, logic synthesis, and framework application." },
      { category: "Evidence & Reasoning", maxPoints: 30, description: "Quality of source verification, data, and counterclaims." },
      { category: "Formatting & Style", maxPoints: 40, description: "Grammar, academic prose, flow, and structural thesis consistency." }
    ]);
    setActiveTab('submissions');
  };

  const handleTriggerAIEval = async (sub: Submission) => {
    setAiEvalLoadingId(sub.id);
    setAiEvalError(null);

    const asg = assignments.find(a => a.id === sub.assignmentId);
    if (!asg) {
      setAiEvalError("Assignment context not found.");
      setAiEvalLoadingId(null);
      return;
    }

    try {
      const response = await fetch("/api/eval-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentTitle: asg.title,
          assignmentDescription: asg.description,
          studentContent: sub.content,
          rubrics: asg.rubric
        })
      });

      if (!response.ok) {
        throw new Error("Assessment host returned non-200 state.");
      }

      const evalData = await response.json();
      onAIEvaluateSubmission(sub.id, evalData);
    } catch (err: any) {
      console.error(err);
      setAiEvalError("AI Grading request failed. Offline simulation used instead.");
      
      // Simulate rich template if offline or error
      const mockScoreSum = asg.rubric.reduce((acc, r) => acc + Math.round(r.maxPoints * 0.85), 0);
      const mockMaxSum = asg.rubric.reduce((acc, r) => acc + r.maxPoints, 0);
      const simulatedFeedback: AIFeedback = {
        overallScore: mockScoreSum,
        maxScore: mockMaxSum,
        rubricScores: asg.rubric.map(r => ({
          category: r.category,
          score: Math.round(r.maxPoints * 0.85),
          maxPoints: r.maxPoints,
          feedback: `The work provides sound definitions matching requested "${r.category}" goals.`
        })),
        strengths: [
          "Developed claims logically, following the topic's main objectives.",
          "Presented cohesive, structured writing with consistent syntax."
        ],
        improvements: [
          "Cite additional real-world case studies to bolster credibility.",
          "Identify and address implicit assumptions more thoroughly."
        ],
        detailedAnalysis: `### Assignment Evaluation Summary
A simulated assessment is generated for this submission. The thesis shows excellent dedication to clarifying the core arguments. We strongly suggest introducing quantitative metrics to complement qualitative statements in subsequent revisions.`,
        sentiment: "constructive",
        generatedAt: new Date().toISOString()
      };
      
      setTimeout(() => {
        onAIEvaluateSubmission(sub.id, simulatedFeedback);
        setAiEvalLoadingId(null);
      }, 1000);
      return;
    } finally {
      if (aiEvalLoadingId === sub.id) {
        setAiEvalLoadingId(null);
      }
    }
  };

  const handleSaveTeacherGrade = (submissionId: string) => {
    onGradeSubmission(submissionId, manualGrade, manualComment);
    setGradeSuccessMsg(true);
    setTimeout(() => {
      setGradeSuccessMsg(false);
    }, 3000);
  };

  // Drilled in sub
  const drilledSub = activeSubmissions.find(s => s.id === selectedSubmissionId);
  const drilledPeerReviews = drilledSub ? peerReviews.filter(pr => pr.submissionId === drilledSub.id) : [];

  // Statistics calculation for active assignment
  const totalSubCount = activeSubmissions.length;
  const gradedSubCount = activeSubmissions.filter(s => s.teacherFeedback).length;
  const pendingGradingCount = totalSubCount - gradedSubCount;
  
  const classAvgScore = totalSubCount > 0 
    ? Math.round(activeSubmissions.reduce((acc, s) => {
        const score = s.teacherFeedback?.grade || s.aiFeedback?.overallScore || 0;
        return acc + score;
      }, 0) / totalSubCount)
    : 0;

  const totalMaxScore = activeAssignment?.rubric.reduce((acc, cr) => acc + cr.maxPoints, 0) || 100;

  // Let's compute average score per criteria for the rubrics bar chart!
  const rubricAvgList = activeAssignment?.rubric.map(criteria => {
    let scoreTotal = 0;
    let count = 0;
    
    activeSubmissions.forEach(sub => {
      // average of classmates reviews + AI review if any for this category
      let scoreSum = 0;
      let scoreCount = 0;

      if (sub.aiFeedback) {
        const aiMatch = sub.aiFeedback.rubricScores.find(rs => rs.category === criteria.category);
        if (aiMatch) {
          scoreSum += aiMatch.score;
          scoreCount++;
        }
      }

      const matchReviews = peerReviews.filter(pr => pr.submissionId === sub.id);
      matchReviews.forEach(pr => {
        const prScore = pr.scores[criteria.id];
        if (prScore !== undefined) {
          scoreSum += prScore;
          scoreCount++;
        }
      });

      if (scoreCount > 0) {
        scoreTotal += (scoreSum / scoreCount);
        count++;
      }
    });

    const averageScore = count > 0 ? Number((scoreTotal / count).toFixed(1)) : 0;
    const pct = criteria.maxPoints > 0 ? Math.round((averageScore / criteria.maxPoints) * 100) : 0;

    return {
      category: criteria.category,
      avgValue: averageScore,
      maxValue: criteria.maxPoints,
      percentage: pct
    };
  }) || [];

  return (
    <div className="space-y-6" id="teacher-dashboard">
      {/* Top Banner Navigation */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="teacher-hero-banner">
        <div>
          <div className="flex items-center gap-2 mb-1" id="teacher-badge">
            <Award className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider">Instructor Suite</span>
          </div>
          <h2 className="text-xl font-bold font-sans tracking-tight" id="teacher-welcome-name">Dr. Elizabeth Vance</h2>
          <p className="text-xs text-slate-300">Classroom Panel &bull; Direct AI Evaluator &bull; Peer Critique Analytics</p>
        </div>

        <div className="flex gap-1 bg-slate-850 p-1 rounded-lg self-start md:self-auto border border-slate-800" id="teacher-menu-tabs">
          <button
            id="tab-submissions"
            onClick={() => { setActiveTab('submissions'); setSelectedSubmissionId(null); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === 'submissions' ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Grading Portal
            </div>
          </button>
          <button
            id="tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === 'analytics' ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              Critique Analytics
            </div>
          </button>
          <button
            id="tab-create"
            onClick={() => setActiveTab('create')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === 'create' ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            <div className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New Assignment
            </div>
          </button>
        </div>
      </div>

      {/* Assignment selector (Applicable for Submissions & Analytics) */}
      {activeTab !== 'create' && (
        <div className="flex items-center justify-between bg-white border border-gray-150 p-4 rounded-xl shadow-xs" id="teacher-selector-bar">
          <div className="flex items-center gap-3 shrink-1 min-w-0" id="teacher-selector-left">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider font-sans shrink-0">Standard Topic</span>
            <select
              id="select-asg-teacher"
              value={selectedAsgId}
              onChange={(e) => { setSelectedAsgId(e.target.value); setSelectedSubmissionId(null); }}
              className="text-sm font-semibold text-slate-950 focus:outline-none focus:ring-1 focus:ring-amber-500 border border-gray-200 rounded-lg bg-gray-50 px-3 py-1.5 cursor-pointer max-w-full truncate"
            >
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-gray-500 hidden sm:flex" id="teacher-selector-stats">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              Submissions: <strong>{totalSubCount}</strong>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              Completed: <strong className="text-amber-800">{gradedSubCount}/{totalSubCount}</strong>
            </span>
          </div>
        </div>
      )}

      {/* SUBMISSIONS GRADING WEB-PORTAL */}
      {activeTab === 'submissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="grading-portal-body">
          {/* Submissions Sidebar List */}
          <div className="lg:col-span-4 bg-white border border-gray-150 rounded-xl shadow-xs p-4 flex flex-col gap-3" id="submissions-list-col">
            <div className="pb-2 border-b border-gray-100 flex items-center justify-between" id="submissions-list-header">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Class Submissions</h3>
              <span className="px-2 py-0.5 bg-amber-100-style bg-amber-50 text-amber-900 border border-amber-100 rounded text-[10px] font-semibold">{pendingGradingCount} Pending</span>
            </div>

            {activeSubmissions.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-xs" id="no-subs">
                <p className="font-semibold mb-1">No responses submitted yet</p>
                <p className="text-[10px] text-gray-400 px-4">Wait for students to change their status from draft to submitted.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[500px]" id="submissions-sidebar-list">
                {activeSubmissions.map((sub) => {
                  const subFeedbackCount = peerReviews.filter(p => p.submissionId === sub.id).length;
                  const isSelected = selectedSubmissionId === sub.id;
                  
                  // Score displays Teacher score first, then AI score if teacher has not scored
                  const finalMark = sub.teacherFeedback?.grade;
                  const aiMark = sub.aiFeedback?.overallScore;

                  return (
                    <button
                      key={sub.id}
                      id={`btn-select-sub-${sub.id}`}
                      onClick={() => {
                        setSelectedSubmissionId(sub.id);
                        setManualGrade(sub.teacherFeedback?.grade || sub.aiFeedback?.overallScore || 0);
                        setManualComment(sub.teacherFeedback?.comments || "");
                      }}
                      className={`w-full text-left p-3.5 rounded-xl border transition flex items-start gap-3 ${isSelected ? 'border-amber-500 bg-amber-50/50 ring-1 ring-amber-500/20' : 'border-gray-200 hover:bg-gray-50 bg-white'}`}
                    >
                      <img 
                        src={sub.avatarUrl} 
                        alt={sub.studentName} 
                        className="w-8 h-8 rounded-full border border-gray-100 shrink-0 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1" id={`pcontainer-${sub.id}`}>
                        <div className="flex justify-between items-start gap-1" id={`sub-meta-${sub.id}`}>
                          <h4 className="text-xs font-semibold text-slate-900 truncate">{sub.studentName}</h4>
                          <span className="text-[10px] font-mono text-gray-400 shrink-0">
                            {new Date(sub.submittedAt).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                          </span>
                        </div>

                        <p className="text-[11px] text-gray-500 truncate mt-1">
                          {sub.content}
                        </p>

                        <div className="flex items-center justify-between mt-3 text-[10px]" id={`sub-labels-${sub.id}`}>
                          <span className="flex items-center gap-1 font-medium text-gray-500">
                            <MessageSquare className="w-3 h-3 text-gray-400" />
                            {subFeedbackCount} Reviews
                          </span>

                          <div className="flex items-center gap-1.5" id={`sub-grades-${sub.id}`}>
                            {sub.aiFeedback ? (
                              <span className="px-1.5 py-0.5 rounded bg-violet-100/75 text-violet-800 text-[9px] font-semibold flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                AI: {aiMark}/{totalMaxScore}
                              </span>
                            ) : (
                              <span className="text-[9px] text-violet-700 font-semibold bg-violet-50 px-1 py-0.5 rounded border border-violet-100 animate-pulse">
                                AI Pending
                              </span>
                            )}

                            {finalMark !== undefined ? (
                              <span className="px-1.5 py-0.5 rounded bg-emerald-150-style bg-emerald-50 text-emerald-800 text-[9px] font-bold border border-emerald-100">
                                Grade: {finalMark}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-semibold border border-amber-100">
                                Unmarked
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drilled-down Submission Grade Workspace */}
          <div className="lg:col-span-8 space-y-6" id="submissions-workspace-col">
            {drilledSub ? (
              <div className="space-y-6" id="drilled-sub-workspace">
                {/* 1. Student Submission and assignment guidelines */}
                <div className="bg-white border border-gray-150 rounded-xl shadow-sm p-6" id="sub-content-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-gray-150" id="drilled-sub-header">
                    <div className="flex items-center gap-3" id="drilled-student-profile-info">
                      <img 
                        src={drilledSub.avatarUrl} 
                        alt={drilledSub.studentName} 
                        className="w-10 h-10 rounded-full border border-gray-100 object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{drilledSub.studentName}</h3>
                        <p className="text-[11px] text-gray-500">Submitted on {new Date(drilledSub.submittedAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" id="drilled-sub-header-actions">
                      {!drilledSub.aiFeedback && (
                        <button
                          id="btn-evaluate-submission-ai"
                          disabled={aiEvalLoadingId === drilledSub.id}
                          onClick={() => handleTriggerAIEval(drilledSub)}
                          className="px-3 py-1.5 bg-violet-900 hover:bg-violet-950 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
                        >
                          {aiEvalLoadingId === drilledSub.id ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              Evaluating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Generate AI Rubric Critique
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {aiEvalError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-800 text-xs rounded-lg mb-4 flex gap-1 items-center" id="ai-error-banner">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{aiEvalError}</span>
                    </div>
                  )}

                  {/* Submission text container */}
                  <div className="bg-gray-50 border border-gray-150 rounded-xl p-5" id="submission-text-body">
                    <span className="text-[10px] font-mono font-medium text-gray-400 bg-white border border-gray-200 px-2 py-0.5 rounded-full mb-3 inline-block">STUDENT RESPONSE</span>
                    <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed font-sans mt-1">
                      {drilledSub.content}
                    </p>
                  </div>
                </div>

                {/* 2. AI Grading and Rubric Breakdown (Visible if AI feedback generated) */}
                {drilledSub.aiFeedback && (
                  <div className="bg-violet-50/40 border border-violet-100 rounded-xl shadow-sm overflow-hidden" id="ai-feedback-workspace-card">
                    <div className="bg-gradient-to-r from-violet-900 to-violet-800 p-4 text-white flex items-center justify-between" id="ai-workspace-banner">
                      <div>
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-violet-200 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-yellow-300" />
                          Evaluation Model Report
                        </span>
                        <h4 className="text-sm font-bold font-sans mt-0.5">Automated Multi-Rubric Grading</h4>
                      </div>
                      <div className="text-center" id="ai-workspace-score-tally">
                        <span className="text-[10px] block text-violet-200 font-mono font-medium">OVERALL</span>
                        <span className="text-lg font-mono font-bold leading-none">{drilledSub.aiFeedback.overallScore}<span className="text-xs text-violet-300">/{drilledSub.aiFeedback.maxScore}</span></span>
                      </div>
                    </div>

                    <div className="p-5 space-y-6 bg-white" id="ai-workspace-metrics-body">
                      {/* Rubric metrics list */}
                      <div className="space-y-3" id="ai-workspace-rubric-table">
                        <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Criteria Scoring</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="ai-workspace-rubric-grid">
                          {drilledSub.aiFeedback.rubricScores.map((scoreItem, idx) => {
                            const percent = scoreItem.maxPoints > 0 ? (scoreItem.score / scoreItem.maxPoints) * 100 : 0;
                            return (
                              <div key={idx} className="p-3 bg-violet-50/20 border border-violet-100 rounded-lg flex flex-col justify-between h-full" id={`rs-card-${idx}`}>
                                <div>
                                  <div className="flex justify-between items-center gap-2" id={`rs-head-${idx}`}>
                                    <span className="text-xs font-semibold text-slate-900 truncate">{scoreItem.category}</span>
                                    <span className="text-xs font-mono font-bold text-violet-900 shrink-0">{scoreItem.score}/{scoreItem.maxPoints}</span>
                                  </div>
                                  <p className="text-[10.5px] text-gray-500 leading-relaxed mt-1">{scoreItem.feedback}</p>
                                </div>
                                <div className="w-full bg-violet-100/50 rounded-full h-1 mt-3 overflow-hidden" id={`rs-bar-container-${idx}`}>
                                  <div className="bg-violet-850-style bg-violet-800 h-1 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Strengths & Improvements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-gray-100" id="ai-workspace-pro-contra">
                        <div className="space-y-2" id="ai-workspace-strengths">
                          <h5 className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">Identified Strengths</h5>
                          <ul className="space-y-2">
                            {drilledSub.aiFeedback.strengths.map((str, idx) => (
                              <li key={idx} className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-950 text-xs rounded-lg flex items-start gap-2 leading-relaxed" id={`strength-li-${idx}`}>
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2" id="ai-workspace-improvements">
                          <h5 className="text-[10px] font-bold text-amber-900 uppercase tracking-wider">Suggested Revisions</h5>
                          <ul className="space-y-2">
                            {drilledSub.aiFeedback.improvements.map((imp, idx) => (
                              <li key={idx} className="p-2.5 bg-amber-50 border border-amber-100 text-amber-950 text-xs rounded-lg flex items-start gap-2 leading-relaxed" id={`improvement-li-${idx}`}>
                                <TrendingUp className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Long assessment report - parse simple markdown headers */}
                      <div className="pt-4 border-t border-gray-100 prose prose-slate max-w-none" id="ai-workspace-large-report">
                        <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Detailed Critical Commentary</h5>
                        <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 text-xs text-gray-700 leading-relaxed font-sans space-y-4 max-h-[300px] overflow-y-auto">
                          {drilledSub.aiFeedback.detailedAnalysis.split("\n").map((line, lIdx) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith("###")) {
                              return <h4 key={lIdx} className="text-xs font-bold text-slate-900 mt-3 pt-2 mb-1 border-b border-gray-105 first:mt-0 pb-1">{trimmed.replace(/^###\s*/, "")}</h4>;
                            }
                            if (trimmed.startsWith("####")) {
                              return <h5 key={lIdx} className="text-xs font-semibold text-slate-800 mt-2 mb-1">{trimmed.replace(/^####\s*/, "")}</h5>;
                            }
                            if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
                              return <li key={lIdx} className="ml-4 list-disc mb-1 pl-1 text-gray-650">{trimmed.replace(/^[\*\-]\s*/, "")}</li>;
                            }
                            if (!trimmed) return <div key={lIdx} className="h-1" />;
                            return <p key={lIdx} className="text-xs pb-0.5">{trimmed}</p>;
                          })}
                        </div>
                      </div>
                      
                      {/* Regeneration helper */}
                      <div className="flex justify-end gap-2" id="regrade-action-container">
                        <button
                          id="btn-re-evaluate-submission-ai"
                          disabled={aiEvalLoadingId === drilledSub.id}
                          onClick={() => handleTriggerAIEval(drilledSub)}
                          className="px-2.5 py-1.5 border border-violet-200 hover:border-violet-400 text-violet-800 rounded bg-white text-[10.5px] font-medium flex items-center justify-center gap-1 cursor-pointer transition disabled:opacity-55"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Regrade with AI Evaluator
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Classmate Anonymous Constructive critiques received */}
                <div className="bg-white border border-gray-150 rounded-xl p-6 shadow-sm" id="critiques-received-section">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Classmate Peer Reviews ({drilledPeerReviews.length})</h4>
                  
                  {drilledPeerReviews.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 border border-gray-200 rounded-lg">No peer evaluations have been recorded for this student yet.</p>
                  ) : (
                    <div className="space-y-4" id="peer-reviews-list-container">
                      {drilledPeerReviews.map((pr, idx) => (
                        <div key={pr.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-slate-350 transition space-y-3" id={`pr-comment-${idx}`}>
                          <div className="flex border-b border-gray-200 pb-2 justify-between items-center" id={`pr-comment-head-${idx}`}>
                            <span className="text-xs font-semibold text-slate-850 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5 text-gray-400" />
                              Constructive Respondent: <strong className="text-gray-900">{pr.authorName}</strong>
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(pr.submittedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10.5px]" id={`pr-comment-scores-${idx}`}>
                            {Object.entries(pr.scores).map(([critId, val]) => {
                              const crit = activeAssignment?.rubric.find(r => r.id === critId);
                              return (
                                <div key={critId} className="bg-white px-2.5 py-1 border border-gray-200 rounded" id={`pr-pills-${critId}`}>
                                  <span className="text-gray-400 block font-sans truncate">{crit?.category || "Score"}</span>
                                  <strong className="text-slate-900 font-bold">{val} <span className="text-gray-400">/ {crit?.maxPoints || 30}</span></strong>
                                </div>
                              );
                            })}
                          </div>

                          <div className="text-xs space-y-2 mt-2 pt-1 font-sans text-gray-800" id={`pr-comment-text-${idx}`}>
                            <p><strong className="text-emerald-800">What worked well:</strong> &ldquo;{pr.commentStrengths}&rdquo;</p>
                            <p className="pt-1 border-t border-dashed border-gray-200"><strong className="text-amber-800">Constructive improvement:</strong> &ldquo;{pr.commentImprovements}&rdquo;</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Instructor Manual Verification Grid & grading overwrite */}
                <div className="bg-white border border-gray-150 rounded-xl p-6 shadow-sm space-y-4" id="manual-grading-form">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100" id="manual-form-title flex gap-2">
                    <FileCheck className="w-4 h-4 text-amber-500" />
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Instructor Assessment Verdict</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="manual-form-grid">
                    <div className="md:col-span-1 space-y-3" id="manual-form-score-col">
                      <div>
                        <label htmlFor="input-teacher-grade" className="text-xs font-semibold text-slate-800 block mb-1">Override Final Grade</label>
                        <p className="text-[10px] text-gray-400 mb-2">Set verified score tally out of <strong>{totalMaxScore}</strong> points.</p>
                        <div className="flex items-center gap-2" id="num-box">
                          <input
                            id="input-teacher-grade"
                            type="number"
                            min="0"
                            max={totalMaxScore}
                            value={manualGrade}
                            onChange={(e) => setManualGrade(Number(e.target.value))}
                            className="bg-gray-50 border border-gray-250 rounded-lg p-2.5 w-24 text-center font-mono font-bold text-sm focus:ring-1 focus:ring-amber-500 text-slate-900"
                          />
                          <span className="text-xs font-semibold text-gray-400">/ {totalMaxScore} pts</span>
                        </div>
                      </div>

                      {drilledSub.aiFeedback && (
                        <button
                          id="btn-use-ai-mark"
                          onClick={() => setManualGrade(drilledSub.aiFeedback!.overallScore)}
                          className="w-full text-left text-[10.5px] border border-violet-100 bg-violet-50/50 hover:bg-violet-50 text-violet-900 py-1.5 px-2.5 rounded font-medium transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Apply AI Suggested Mark ({drilledSub.aiFeedback.overallScore})
                        </button>
                      )}
                    </div>

                    <div className="md:col-span-2 flex flex-col justify-between" id="manual-form-comments-col">
                      <div>
                        <label htmlFor="input-teacher-comment" className="text-xs font-semibold text-slate-800 block mb-1">Assessment Guidance Comments</label>
                        <textarea
                          id="input-teacher-comment"
                          rows={3}
                          value={manualComment}
                          onChange={(e) => setManualComment(e.target.value)}
                          placeholder="Provide encouraging and constructive commentary regarding the student's draft philosophy, responses, and peer participation..."
                          className="bg-gray-50 border border-gray-250 p-3 text-xs w-full rounded-xl focus:ring-1 focus:ring-amber-500 font-sans leading-relaxed text-slate-950 placeholder:text-gray-400"
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3" id="manual-form-submit-row">
                        {gradeSuccessMsg ? (
                          <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg h-full" id="success-banner">
                            <Check className="w-4 h-4" />
                            Grade successfully logged.
                          </span>
                        ) : (
                          <div />
                        )}
                        <button
                          id="btn-save-teacher-grade"
                          onClick={() => handleSaveTeacherGrade(drilledSub.id)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 font-bold text-xs text-slate-950 rounded-lg shadow-xs flex items-center gap-1 transition shrink-0 cursor-pointer"
                        >
                          Save Final Assessment Verdict
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50/50 border border-gray-150 border-dashed rounded-xl p-16 text-center text-gray-400" id="empty-sub-workspace">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2.5" />
                <h4 className="text-sm font-semibold text-gray-500 mb-1">Select a submission from the sidebar</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto px-4">Click any submitted assignment paper from your left-hand roster list to view student text, classmate critiques, and execute AI rubric evaluations.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE CRITIQUE ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="space-y-6" id="analytics-tab-body">
          {/* Dashboard Summary Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="analytics-top-deck">
            <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs" id="acard-1">
              <span className="text-gray-400 text-[10.5px] font-bold uppercase block tracking-wider mb-1">Class Attendance</span>
              <div className="flex justify-between items-end mt-1" id="ad-content-1">
                <strong className="text-2xl font-mono text-slate-900 leading-none">3 <span className="text-xs text-gray-400">Rosteered Students</span></strong>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs" id="acard-2">
              <span className="text-gray-400 text-[10.5px] font-bold uppercase block tracking-wider mb-1">Responses Recorded</span>
              <div className="flex justify-between items-end mt-1" id="ad-content-2">
                <strong className="text-2xl font-mono text-slate-900 leading-none">
                  {totalSubCount} <span className="text-xs text-gray-400">Submissions</span>
                </strong>
                <FileCheck className="w-5 h-5 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs" id="acard-3">
              <span className="text-gray-400 text-[10.5px] font-bold uppercase block tracking-wider mb-1">Topic Average Performance</span>
              <div className="flex justify-between items-end mt-1" id="ad-content-3">
                <strong className="text-2xl font-mono text-violet-900 leading-none">
                  {classAvgScore} <span className="text-xs text-gray-400">/ {totalMaxScore} pts</span>
                </strong>
                <Award className="w-5 h-5 text-violet-600" />
              </div>
            </div>

            <div className="bg-white border border-gray-150 p-5 rounded-xl shadow-xs" id="acard-4">
              <span className="text-gray-400 text-[10.5px] font-bold uppercase block tracking-wider mb-1">Total Peer Critiques Left</span>
              <div className="flex justify-between items-end mt-1" id="ad-content-4">
                <strong className="text-2xl font-mono text-slate-900 leading-none">
                  {peerReviews.length} <span className="text-xs text-gray-400">Reviews</span>
                </strong>
                <MessageSquare className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="analytics-graphics-deck">
            {/* SVG Visual Criteria Performance Analytics Chart (Horizontal Bar Chart) */}
            <div className="lg:col-span-7 bg-white border border-gray-150 rounded-xl p-6 shadow-sm space-y-4" id="analytic-graphic-criteria">
              <div>
                <h4 className="text-sm font-bold text-slate-950 font-sans">Multi-Criteria Score Breakdown</h4>
                <p className="text-xs text-gray-400">Analysis of average student performance across specific rubrics sections, including peer reviews & AI evaluations.</p>
              </div>

              {rubricAvgList.length === 0 ? (
                <div className="text-center py-10 text-xs text-gray-405 italic bg-gray-50 border border-gray-150 rounded-xl">Insufficient response grading logs to display criteria curves.</div>
              ) : (
                <div className="space-y-5 pt-3" id="analytic-criteria-list-visualizer">
                  {rubricAvgList.map((item, idx) => {
                    const barColor = item.percentage >= 85 ? 'bg-emerald-500' : item.percentage >= 70 ? 'bg-amber-500' : 'bg-red-500';
                    const textColor = item.percentage >= 85 ? 'text-emerald-800' : item.percentage >= 70 ? 'text-amber-800' : 'text-red-800';
                    return (
                      <div key={idx} className="space-y-1.5" id={`analytics-chart-bar-${idx}`}>
                        <div className="flex justify-between items-center text-xs" id={`analytics-bar-info-${idx}`}>
                          <div className="min-w-0" id={`analytics-name-col-${idx}`}>
                            <span className="font-semibold text-slate-900 truncate block">{item.category}</span>
                            <span className="text-[10px] text-gray-400 italic block">Max: {item.maxValue} points</span>
                          </div>
                          <div className="text-right shrink-0" id={`analytics-score-col-${idx}`}>
                            <strong className="text-slate-900 block font-mono">{item.avgValue} / {item.maxValue}</strong>
                            <span className={`text-[10px] font-semibold block ${textColor}`}>{item.percentage}% average achievement</span>
                          </div>
                        </div>

                        {/* Visual Progress Track */}
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200" id={`graphics-bar-wrap-${idx}`}>
                          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="text-[11px] font-sans text-gray-500 bg-blue-50 border border-blue-100 rounded-xl p-3 flex gap-2 items-start" id="analytics-criteria-help">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Instructor Tip:</strong> Rubric criteria with scores falling under 75% display struggle areas in need of conceptual review. You can assign further focused peer activities to targets those categories.
                </p>
              </div>
            </div>

            {/* SVG Class Grade Distribution Roster overview */}
            <div className="lg:col-span-5 bg-white border border-gray-150 rounded-xl p-6 shadow-sm flex flex-col justify-between space-y-4" id="analytic-graphic-grades">
              <div>
                <h4 className="text-sm font-bold text-slate-950 font-sans">Grade Distribution Stack</h4>
                <p className="text-xs text-gray-400">Frequency breakdown of final student feedback standings for this active prompt.</p>
              </div>

              {/* Native responsive vertical bar charts */}
              <div className="h-52 w-full flex items-end justify-around gap-2 px-2 pt-6 border-b border-gray-200 pb-1" id="distrib-graphic-wrapper">
                {/* Score groups computed manually based on seed stats */}
                {[
                  { range: "90-100", frequency: activeSubmissions.filter(s => (s.teacherFeedback?.grade || s.aiFeedback?.overallScore || 0) >= 90).length, color: "bg-emerald-400", desc: "A / Excellent" },
                  { range: "80-89", frequency: activeSubmissions.filter(s => {
                    const m = s.teacherFeedback?.grade || s.aiFeedback?.overallScore || 0;
                    return m >= 80 && m < 90;
                  }).length, color: "bg-teal-400", desc: "B / Solid" },
                  { range: "70-79", frequency: activeSubmissions.filter(s => {
                    const m = s.teacherFeedback?.grade || s.aiFeedback?.overallScore || 0;
                    return m >= 70 && m < 80;
                  }).length, color: "bg-amber-400", desc: "C / Pass" },
                  { range: "<70", frequency: activeSubmissions.filter(s => {
                    const m = s.teacherFeedback?.grade || s.aiFeedback?.overallScore || 0;
                    return m > 0 && m < 70;
                  }).length, color: "bg-rose-450 bg-rose-400", desc: "Needs Work" }
                ].map((col, idx) => {
                  const maxFreq = Math.max(1, activeSubmissions.length);
                  const hPct = Math.max(10, Math.round((col.frequency / maxFreq) * 100)); // ensure min peak
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group cursor-help relative" id={`stack-col-${idx}`}>
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-1 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[10px] py-1 px-2 rounded -translate-y-full transition text-center whitespace-nowrap shadow-md pointer-events-none z-10">
                        <strong>{col.frequency} Student(s)</strong>
                        <span className="block text-slate-400">{col.desc}</span>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-slate-900 mb-1">{col.frequency}</span>
                      <div className={`w-full ${col.color} rounded-t-md transition-all duration-500 ease-out`} style={{ height: `${col.frequency > 0 ? hPct : 2}%` }} />
                      <span className="text-[10px] font-semibold text-gray-500 mt-2 font-mono whitespace-nowrap">{col.range}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom grade index guide labels */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-100 text-xs font-sans text-gray-500" id="analytic-graphic-grades-guide">
                <div className="flex items-center gap-1.5" id="label-guide-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0" />
                  <span>A (Score &ge; 90)</span>
                </div>
                <div className="flex items-center gap-1.5" id="label-guide-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400 shrink-0" />
                  <span>B (Score 80-89)</span>
                </div>
                <div className="flex items-center gap-1.5" id="label-guide-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                  <span>C (Score 70-79)</span>
                </div>
                <div className="flex items-center gap-1.5" id="label-guide-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-450 bg-rose-400 shrink-0" />
                  <span>Needs Work (&lt; 70)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW ASSIGNMENTS / RUBRICS MAKER FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateAssignment} className="bg-white border border-gray-150 rounded-xl p-6 shadow-sm space-y-6" id="create-assignment-form">
          <div className="flex items-center gap-2 pb-3 border-b border-gray-150" id="form-creation-banner">
            <Plus className="w-5 h-5 text-amber-500 bg-amber-100 p-1 rounded-md" />
            <div>
              <h3 className="text-sm font-bold text-slate-950 font-sans">Establish Advanced Topic Discussion</h3>
              <p className="text-xs text-gray-400">Initiate a custom essay prompt aligned with unique grading parameters.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="form-general-grid">
            <div className="space-y-4" id="form-general-fields-col">
              <div>
                <label htmlFor="input-asg-title" className="text-xs font-bold text-slate-805 text-slate-800 block mb-1">Assignment Title</label>
                <input
                  id="input-asg-title"
                  type="text"
                  required
                  placeholder="e.g., Cybernetic Rights and Ethics under State Apparatus Policy"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-gray-50 border border-gray-250 rounded-xl p-3 text-xs w-full focus:ring-1 focus:ring-amber-500 font-sans font-medium text-slate-900 placeholder:text-gray-450"
                />
              </div>

              <div>
                <label htmlFor="input-asg-desc" className="text-xs font-bold text-slate-805 text-slate-800 block mb-1">Constructive Essay Prompt & Guidelines</label>
                <textarea
                  id="input-asg-desc"
                  rows={8}
                  required
                  placeholder="Add background detail issues, philosophical framework parameters, links, and questions. E.g., 'Describe how technological disruption Impacts marginalized groups...'"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="bg-gray-50 border border-gray-250 rounded-xl p-3 text-xs w-full focus:ring-1 focus:ring-amber-500 font-sans leading-relaxed text-slate-900 placeholder:text-gray-450"
                />
              </div>
            </div>

            {/* Rubrics Builder Module */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-gray-200 md:pl-6" id="form-rubrics-col">
              <h4 className="text-xs font-bold text-slate-900 font-sans mb-1">Interactive Evaluation Rubric Builder</h4>
              <p className="text-[11px] text-gray-500 leading-normal">Configure custom evaluation categories. The sum is verified before draft submissions.</p>

              {/* Rubrics criterias preview list */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="form-rubric-preview-list">
                {newRubric.map((item, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-200 rounded-lg flex justify-between items-start gap-3" id={`new-criteria-bubble-${idx}`}>
                    <div className="min-w-0" id={`new-criteria-bubble-info-${idx}`}>
                      <div className="flex gap-1.5 items-center" id={`new-criteria-bubble-cat-${idx}`}>
                        <span className="text-xs font-semibold text-slate-900 truncate">{item.category}</span>
                        <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-mono shrink-0">{item.maxPoints} pts</span>
                      </div>
                      <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.description}</p>
                    </div>
                    <button
                      id={`btn-remove-criteria-${idx}`}
                      type="button"
                      onClick={() => handleRemoveCriteria(idx)}
                      className="text-[10px] text-red-500 hover:text-red-700 font-medium cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {newRubric.length === 0 && (
                  <div className="text-center p-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg">No criteria established. Formulate at least one to save.</div>
                )}
              </div>

              {/* Form Row to insert criteria */}
              <div className="bg-slate-55/70 bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3" id="rubric-builder-inputs">
                <span className="text-[10px] font-mono font-bold text-amber-900 ml-0.5 block">INSERT SCORE CRITERIA ROW</span>
                <div className="grid grid-cols-3 gap-2" id="criteria-inputs-row-1">
                  <div className="col-span-2">
                    <input
                      id="input-criteria-category"
                      type="text"
                      placeholder="Category e.g., Logic & Flow"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="bg-white border border-gray-250 p-2 text-xs w-full rounded focus:ring-1 focus:ring-amber-500 text-slate-900"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      id="input-criteria-maxpoints"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="Max pts"
                      value={newCatPoints}
                      onChange={(e) => setNewCatPoints(Number(e.target.value))}
                      className="bg-white border border-gray-250 p-2 text-xs w-full text-center rounded focus:ring-1 focus:ring-amber-500 text-slate-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <input
                    id="input-criteria-description"
                    type="text"
                    placeholder="Short description... e.g. 'Synthesizes counter-claims effectively.'"
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="bg-white border border-gray-250 p-2 text-xs w-full rounded focus:ring-1 focus:ring-amber-500 text-slate-900"
                  />
                </div>

                <button
                  id="btn-add-criteria"
                  type="button"
                  onClick={handleAddCriteria}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold py-1.5 rounded transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Score Row to Rubric
                </button>
              </div>

              <div className="text-[11px] font-mono text-right text-slate-600 block pr-1" id="total-rubric-sum">
                Total Max Rubric Tally: <strong className="text-slate-900 font-mono">{newRubric.reduce((acc, r) => acc + r.maxPoints, 0)} points</strong>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-150 pt-4 flex justify-end gap-3" id="form-creation-actions">
            <button
              id="btn-cancel-create"
              type="button"
              onClick={() => setActiveTab('submissions')}
              className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-slate-700 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-asg"
              type="submit"
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              Assign Discussion Topic &bull; Save
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
