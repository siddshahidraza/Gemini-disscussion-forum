import React, { useState, FormEvent } from "react";
import { 
  Assignment, 
  Submission, 
  PeerReview, 
  RubricCriteria, 
  AIFeedback,
  Classroom
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
  Clock,
  Trash,
  AlertTriangle,
  CheckSquare,
  Sliders,
  Download
} from "lucide-react";

interface TeacherDashboardProps {
  assignments: Assignment[];
  submissions: Submission[];
  peerReviews: PeerReview[];
  classrooms: Classroom[];
  onAddAssignment: (assignment: Assignment) => void;
  onAddClassroom: (classroom: Classroom) => void;
  onGradeSubmission: (submissionId: string, grade: number, comments: string) => void;
  onAIEvaluateSubmission: (submissionId: string, updatedAIFeedback: AIFeedback) => void;
  onUpdatePeerReviews: (updatedPeerReviews: PeerReview[]) => void;
}

export default function TeacherDashboard({
  assignments,
  submissions,
  peerReviews,
  classrooms = [],
  onAddAssignment,
  onAddClassroom,
  onGradeSubmission,
  onAIEvaluateSubmission,
  onUpdatePeerReviews
}: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState<'submissions' | 'create' | 'classrooms' | 'analytics' | 'moderation'>('submissions');
  const [selectedAsgId, setSelectedAsgId] = useState<string>(assignments[0]?.id || "");
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [selectedModerationId, setSelectedModerationId] = useState<string | null>(null);

  // Form State for creating classroom
  const [newClassName, setNewClassName] = useState("");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassDocTypes, setNewClassDocTypes] = useState<string[]>(["PDF", "DOCX", "PPTX", "MP4"]);

  // Form State for creating assignment
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [asgType, setAsgType] = useState<'essay' | 'research' | 'project'>('essay');
  const [asgClassCode, setAsgClassCode] = useState(classrooms[0]?.code || "AI-ETHICS");
  const [minReviews, setMinReviews] = useState(3);
  const [asgDocTypes, setAsgDocTypes] = useState<string[]>(["PDF", "DOCX"]);

  const [newLearningObjectives, setNewLearningObjectives] = useState("");
  const [newPeerGuidelines, setNewPeerGuidelines] = useState(
    "1. Maintain mutual respect and use professional, scholarly language.\n2. Pinpoint exactly one logical strength in their deontology application.\n3. Make suggestions specific and actionable."
  );
  
  const [emphasisGrammar, setEmphasisGrammar] = useState<'low' | 'medium' | 'high'>('medium');
  const [emphasisStructure, setEmphasisStructure] = useState<'low' | 'medium' | 'high'>('medium');
  const [emphasisContent, setEmphasisContent] = useState<'low' | 'medium' | 'high'>('medium');
  const [emphasisAnalysis, setEmphasisAnalysis] = useState<'low' | 'medium' | 'high'>('medium');
  const [emphasisCreativity, setEmphasisCreativity] = useState<'low' | 'medium' | 'high'>('medium');

  const [isGeneratingRubric, setIsGeneratingRubric] = useState(false);
  const [rubricGenError, setRubricGenError] = useState<string | null>(null);

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

  const handleGenerateRubricAI = async () => {
    if (!newTitle.trim() || !newDesc.trim()) {
      alert("Please provide an Assignment Title and Essay Prompt details first. The AI analyzes these to devise a tailored rubric matrix!");
      return;
    }

    setIsGeneratingRubric(true);
    setRubricGenError(null);

    try {
      const response = await fetch("/api/generate-rubric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          learningObjectives: newLearningObjectives
        })
      });

      if (!response.ok) {
        throw new Error("Failed to reach advanced curriculum auto-generation service.");
      }

      const data = await response.json();
      if (data.rubric && Array.isArray(data.rubric)) {
        setNewRubric(data.rubric);
      } else {
        throw new Error("Invalid schema returned by rubric assistant.");
      }
    } catch (err: any) {
      console.error(err);
      setRubricGenError(err.message || "Failed auto-generating rubric. Check server logs.");
      
      // Standby fallback rubric if offline
      setNewRubric([
        { category: "Stated Arguments Synthesis", maxPoints: 30, description: "Depth of alignment with stated learning objectives, framework correctness." },
        { category: "Empirical Reasoning & Citations", maxPoints: 30, description: "Citing support case studies, verifying premises, quality data." },
        { category: "Structure & Flow", maxPoints: 20, description: "Logical consistency of flow, paragraph transitions." },
        { category: "Creativity & Novelty", maxPoints: 20, description: "Original thesis statements, thinking outside standard prompts." }
      ]);
    } finally {
      setIsGeneratingRubric(false);
    }
  };

  const handleCreateClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim() || !newClassCode.trim()) {
      alert("Please enter a classroom name and a unique entry code.");
      return;
    }
    const cleanCode = newClassCode.trim().toUpperCase();
    if (classrooms.some(c => c.code === cleanCode)) {
      alert(`The class code "${cleanCode}" is already in use. Please choose a different one.`);
      return;
    }
    const newClass: Classroom = {
      id: `class_${Date.now()}`,
      name: newClassName.trim(),
      code: cleanCode,
      teacherId: "vance_teacher",
      allowedDocTypes: newClassDocTypes,
      createdAt: new Date().toISOString()
    };
    onAddClassroom(newClass);
    setNewClassName("");
    setNewClassCode("");
    setActiveTab("classrooms");
    alert(`Classroom "${newClass.name}" has been created! Students can join with class code: ${newClass.code}`);
  };

  const handleDownloadSpreadsheet = () => {
    if (!activeAssignment) {
      alert("No active assignment selected to download.");
      return;
    }
    
    const csvHeaders = [
      "Student ID",
      "Student Name",
      "Classroom Code",
      "Assignment Type",
      "Assignment Title",
      "Submission Status",
      "Submission Date",
      "AI Grade Score",
      "Peer Reviews Average Score",
      "Final Faculty Grade",
      "Faculty Cross-Checked",
      "Faculty Comments"
    ];

    const targetSubmissions = submissions.filter(s => s.assignmentId === activeAssignment.id);

    const csvRows = targetSubmissions.map(sub => {
      const matchReviews = peerReviews.filter(pr => pr.submissionId === sub.id && pr.scoreGiven !== undefined);
      const peerAvg = matchReviews.length > 0 
        ? (matchReviews.reduce((sum, r) => sum + (r.scoreGiven || 0), 0) / matchReviews.length).toFixed(1)
        : "N/A";

      const finalGrade = sub.teacherFeedback?.grade !== undefined ? sub.teacherFeedback.grade : "N/A";
      const crossChecked = sub.teacherFeedback?.crossChecked ? "YES" : "NO";
      const comments = sub.teacherFeedback?.comments 
        ? `"${sub.teacherFeedback.comments.replace(/"/g, '""').replace(/\n/g, ' ')}"` 
        : "N/A";
      
      return [
        sub.studentId,
        sub.studentName,
        activeAssignment.classroomCode || "AI-ETHICS",
        activeAssignment.type || "essay",
        `"${activeAssignment.title.replace(/"/g, '""')}"`,
        sub.status,
        sub.submittedAt ? new Date(sub.submittedAt).toISOString() : "N/A",
        sub.aiFeedback ? sub.aiFeedback.overallScore : "N/A",
        peerAvg,
        finalGrade,
        crossChecked,
        comments
      ];
    });

    const csvContent = [
      csvHeaders.join(","),
      ...csvRows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Marksheet_${activeAssignment.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
      createdAt: new Date().toISOString(),
      learningObjectives: newLearningObjectives,
      peerReviewGuidelines: newPeerGuidelines,
      type: asgType,
      classroomCode: asgClassCode,
      minReviews: Number(minReviews),
      allowedDocTypes: asgDocTypes,
      emphasisPriorities: {
        grammar: emphasisGrammar,
        structure: emphasisStructure,
        contentAccuracy: emphasisContent,
        criticalAnalysis: emphasisAnalysis,
        creativity: emphasisCreativity
      }
    };

    onAddAssignment(newAsg);
    setSelectedAsgId(newAsg.id);
    
    // reset form
    setNewTitle("");
    setNewDesc("");
    setNewLearningObjectives("");
    setNewPeerGuidelines(
      "1. Maintain mutual respect and use professional, scholarly language.\n2. Pinpoint exactly one logical strength in their deontology application.\n3. Make suggestions specific and actionable."
    );
    setAsgType("essay");
    setMinReviews(3);
    setAsgDocTypes(["PDF", "DOCX"]);
    setEmphasisGrammar("medium");
    setEmphasisStructure("medium");
    setEmphasisContent("medium");
    setEmphasisAnalysis("medium");
    setEmphasisCreativity("medium");
    
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
          rubrics: asg.rubric,
          emphasisPriorities: asg.emphasisPriorities || {
            grammar: "medium",
            structure: "medium",
            contentAccuracy: "medium",
            criticalAnalysis: "medium",
            creativity: "medium"
          }
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
        detailedAnalysis: `### Assignment Evaluation Summary (Local Fallback)
A local simulated assessment has been compiled for this submission. 

#### Dimension Feedback:
- Grammar priority weighted: **${asg.emphasisPriorities?.grammar?.toUpperCase() || 'MEDIUM'}**
- Structure priority weighted: **${asg.emphasisPriorities?.structure?.toUpperCase() || 'MEDIUM'}**
- Accuracy priority weighted: **${asg.emphasisPriorities?.contentAccuracy?.toUpperCase() || 'MEDIUM'}**
- Analysis priority weighted: **${asg.emphasisPriorities?.criticalAnalysis?.toUpperCase() || 'MEDIUM'}**
- Creativity priority weighted: **${asg.emphasisPriorities?.creativity?.toUpperCase() || 'MEDIUM'}**

The thesis shows excellent dedication to clarifying the core arguments with respect to these custom parameters.`,
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
      <div className="bg-slate-900 text-white rounded-2xl p-7 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 animate-fade-in" id="teacher-hero-banner">
        <div>
          <div className="flex items-center gap-2 mb-1.5" id="teacher-badge">
            <Award className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-widest">Instructor Suite</span>
          </div>
          <h2 className="text-xl font-bold font-sans tracking-tight" id="teacher-welcome-name">Dr. Elizabeth Vance</h2>
          <p className="text-xs text-slate-300 font-sans mt-0.5">Classroom Panel &bull; Direct AI Evaluator &bull; Peer Critique Analytics</p>
        </div>

        <div className="flex gap-1.5 bg-slate-800 p-1.5 rounded-xl self-start md:self-auto border border-slate-700/60 overflow-x-auto max-w-full" id="teacher-menu-tabs">
          <button
            id="tab-submissions"
            onClick={() => { setActiveTab('submissions'); setSelectedSubmissionId(null); }}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'submissions' ? 'bg-indigo-600 text-white font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5" />
              Grading Portal
            </div>
          </button>
          <button
            id="tab-classrooms"
            onClick={() => setActiveTab('classrooms')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'classrooms' ? 'bg-indigo-600 text-white font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Classrooms
            </div>
          </button>
          <button
            id="tab-analytics"
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'analytics' ? 'bg-indigo-600 text-white font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            <div className="flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5" />
              Critique Analytics
            </div>
          </button>
          <button
            id="tab-moderation"
            onClick={() => setActiveTab('moderation')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'moderation' ? 'bg-indigo-600 text-white font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Moderation Queue
            </div>
          </button>
          <button
            id="tab-create"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${activeTab === 'create' ? 'bg-indigo-600 text-white font-extrabold shadow-xs' : 'text-slate-300 hover:text-white'}`}
          >
            <div className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              New Assignment
            </div>
          </button>
        </div>
      </div>

      {/* Assignment selector (Applicable for Submissions & Analytics) */}
      {activeTab !== 'create' && activeTab !== 'moderation' && activeTab !== 'classrooms' && (
        <div className="flex items-center justify-between bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs gap-4 flex-wrap md:flex-nowrap" id="teacher-selector-bar">
          <div className="flex items-center gap-3 shrink-1 min-w-0" id="teacher-selector-left">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-sans shrink-0">Standard Topic</span>
            <select
              id="select-asg-teacher"
              value={selectedAsgId}
              onChange={(e) => { setSelectedAsgId(e.target.value); setSelectedSubmissionId(null); }}
              className="text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/25 border border-slate-250 rounded-xl bg-slate-50 px-3.5 py-2 cursor-pointer max-w-full truncate"
            >
              {assignments.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider ml-auto flex-wrap md:flex-nowrap" id="teacher-selector-stats">
            <button
              id="btn-export-asg-marksheet"
              type="button"
              onClick={handleDownloadSpreadsheet}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs px-3.5 py-2 rounded-xl transition duration-150 cursor-pointer shadow-sm font-bold uppercase tracking-wide"
              title="Download results in spreadsheet CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              Export Spreadsheet
            </button>
            <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-1.5 rounded-lg">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Submissions: <strong className="text-slate-700">{totalSubCount}</strong>
            </span>
            <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-2.5 py-1.5 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Completed: <strong className="text-indigo-800">{gradedSubCount}/{totalSubCount}</strong>
            </span>
          </div>
        </div>
      )}

      {/* SUBMISSIONS GRADING WEB-PORTAL */}
      {activeTab === 'submissions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="grading-portal-body">
          {/* Submissions Sidebar List */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl shadow-sm p-4.5 flex flex-col gap-3.5" id="submissions-list-col">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between" id="submissions-list-header">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Class Submissions</h3>
              <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100/60 rounded-md text-[9px] font-extrabold uppercase tracking-wide">{pendingGradingCount} Pending</span>
            </div>

            {activeSubmissions.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-sans" id="no-subs">
                <p className="font-bold text-slate-700 mb-1.5">No responses submitted yet</p>
                <p className="text-[10px] text-slate-450 px-4 font-medium leading-relaxed">Wait for students to change their status from draft to submitted.</p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[500px]" id="submissions-sidebar-list">
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
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 cursor-pointer ${isSelected ? 'border-indigo-600 bg-indigo-50/40 shadow-xs' : 'border-slate-200 hover:bg-slate-50 bg-white'}`}
                    >
                      <img 
                        src={sub.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                        alt={sub.studentName} 
                        className="w-8.5 h-8.5 rounded-full border border-slate-150 shrink-0 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="min-w-0 flex-1" id={`pcontainer-${sub.id}`}>
                        <div className="flex justify-between items-start gap-1" id={`sub-meta-${sub.id}`}>
                          <h4 className="text-xs font-bold text-slate-800 font-display truncate">{sub.studentName}</h4>
                          <span className="text-[9px] font-mono text-slate-400 font-bold shrink-0">
                            {new Date(sub.submittedAt).toLocaleDateString([], {month: 'short', day: 'numeric'})}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-450 truncate mt-1.5 font-sans font-medium">
                          {sub.content}
                        </p>

                        <div className="flex items-center justify-between mt-3.5 text-[10px]" id={`sub-labels-${sub.id}`}>
                          <span className="flex items-center gap-1 font-bold text-slate-450 uppercase text-[9px] tracking-wide font-sans">
                            <MessageSquare className="w-3 h-3 text-indigo-500 shrink-0" />
                            {subFeedbackCount} Reviews
                          </span>

                          <div className="flex items-center gap-1.5" id={`sub-grades-${sub.id}`}>
                            {sub.aiFeedback ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-bold border border-indigo-105 flex items-center gap-0.5 font-sans uppercase">
                                <Sparkles className="w-2.5 h-2.5 shrink-0" />
                                AI: {aiMark}/{totalMaxScore}
                              </span>
                            ) : (
                              <span className="text-[9px] text-indigo-750 font-extrabold bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100 animate-pulse uppercase">
                                AI Pending
                              </span>
                            )}

                            {finalMark !== undefined ? (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-855 text-[9px] font-bold border border-emerald-100 uppercase">
                                Grade: {finalMark}
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-600 text-[9px] font-extrabold border border-slate-205 uppercase">
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
              <div className="space-y-6 animate-fade-in" id="drilled-sub-workspace">
                {/* 1. Student Submission and assignment guidelines */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6" id="sub-content-card">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-100" id="drilled-sub-header">
                    <div className="flex items-center gap-3.5" id="drilled-student-profile-info">
                      <img 
                      src={drilledSub.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                        alt={drilledSub.studentName} 
                        className="w-10 h-10 rounded-full border border-slate-100 object-cover" 
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h3 className="text-sm font-bold text-slate-850 font-display">{drilledSub.studentName}</h3>
                        <p className="text-[11px] text-slate-450 font-sans font-medium">Submitted on {new Date(drilledSub.submittedAt).toLocaleString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2" id="drilled-sub-header-actions">
                      {!drilledSub.aiFeedback && (
                        <button
                          id="btn-evaluate-submission-ai"
                          disabled={aiEvalLoadingId === drilledSub.id}
                          onClick={() => handleTriggerAIEval(drilledSub)}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
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
                    <div className="p-3 bg-red-50 border border-red-100 text-red-800 text-xs rounded-xl mb-4 flex gap-1.5 items-center font-sans font-medium" id="ai-error-banner">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      <span>{aiEvalError}</span>
                    </div>
                  )}

                  {/* Submission text container */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5" id="submission-text-body">
                    <span className="text-[9px] font-mono font-bold text-slate-400 bg-white border border-slate-200/60 px-2.5 py-1 rounded-full mb-3.5 inline-block tracking-wider">STUDENT RESPONSE</span>
                    <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans font-medium">
                      {drilledSub.content}
                    </p>
                  </div>
                </div>

                {/* 2. AI Grading and Rubric Breakdown (Visible if AI feedback generated) */}
                {drilledSub.aiFeedback && (
                  <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl shadow-sm overflow-hidden" id="ai-feedback-workspace-card">
                    <div className="bg-slate-900 p-5 text-white flex items-center justify-between" id="ai-workspace-banner">
                      <div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-indigo-300 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          Evaluation Model Report
                        </span>
                        <h4 className="text-sm font-bold font-sans mt-0.5">Automated Multi-Rubric Grading</h4>
                      </div>
                      <div className="text-center" id="ai-workspace-score-tally">
                        <span className="text-[9px] block text-slate-400 font-mono font-semibold">OVERALL</span>
                        <span className="text-lg font-mono font-extrabold leading-none">{drilledSub.aiFeedback.overallScore}<span className="text-xs text-slate-400">/{drilledSub.aiFeedback.maxScore}</span></span>
                      </div>
                    </div>

                    <div className="p-5 space-y-6 bg-white" id="ai-workspace-metrics-body">
                      {/* Rubric metrics list */}
                      <div className="space-y-3" id="ai-workspace-rubric-table">
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Criteria Scoring</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="ai-workspace-rubric-grid">
                          {drilledSub.aiFeedback.rubricScores.map((scoreItem, idx) => {
                            const percent = scoreItem.maxPoints > 0 ? (scoreItem.score / scoreItem.maxPoints) * 100 : 0;
                            return (
                              <div key={idx} className="p-3 bg-violet-50/20 border border-violet-100 rounded-lg flex flex-col justify-between h-full" id={`rs-card-${idx}`}>
                                <div>
                                  <div className="flex justify-between items-center gap-2" id={`rs-head-${idx}`}>
                                    <span className="text-xs font-bold text-slate-800 font-display truncate">{scoreItem.category}</span>
                                    <span className="text-xs font-mono font-extrabold text-indigo-700 shrink-0">{scoreItem.score}/{scoreItem.maxPoints}</span>
                                  </div>
                                  <p className="text-[10.5px] text-slate-500 leading-relaxed mt-1 font-sans font-medium">{scoreItem.feedback}</p>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-1 mt-3.5 overflow-hidden" id={`rs-bar-container-${idx}`}>
                                  <div className="bg-indigo-600 h-1 rounded-full animate-pulse-once" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Strengths & Improvements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100" id="ai-workspace-pro-contra">
                        <div className="space-y-2.5" id="ai-workspace-strengths">
                          <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Identified Strengths</h5>
                          <ul className="space-y-2">
                            {drilledSub.aiFeedback.strengths.map((str, idx) => (
                              <li key={idx} className="p-3 bg-emerald-50 border border-emerald-100/70 text-emerald-900 text-xs rounded-xl flex items-start gap-2 leading-relaxed font-sans font-medium shadow-xs" id={`strength-li-${idx}`}>
                                <Check className="w-3.5 h-3.5 text-emerald-650 text-emerald-650 text-emerald-650 text-emerald-650 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{str}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-2.5" id="ai-workspace-improvements">
                          <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1">Suggested Revisions</h5>
                          <ul className="space-y-2">
                            {drilledSub.aiFeedback.improvements.map((imp, idx) => (
                              <li key={idx} className="p-3 bg-indigo-50/50 border border-indigo-100/70 text-indigo-950 text-xs rounded-xl flex items-start gap-2 leading-relaxed font-sans font-medium shadow-xs" id={`improvement-li-${idx}`}>
                                <TrendingUp className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                                <span>{imp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Long assessment report - parse simple markdown headers */}
                      <div className="pt-4 border-t border-slate-100 prose prose-slate max-w-none" id="ai-workspace-large-report">
                        <h5 className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Detailed Critical Commentary</h5>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 text-xs text-slate-700 leading-relaxed font-sans space-y-4 max-h-[300px] overflow-y-auto">
                          {drilledSub.aiFeedback.detailedAnalysis.split("\n").map((line, lIdx) => {
                            const trimmed = line.trim();
                            if (trimmed.startsWith("###")) {
                              return <h4 key={lIdx} className="text-xs font-bold text-slate-800 mt-3 pt-2 mb-1 border-b border-slate-200 first:mt-0 pb-1 font-display">{trimmed.replace(/^###\s*/, "")}</h4>;
                            }
                            if (trimmed.startsWith("####")) {
                              return <h5 key={lIdx} className="text-xs font-bold text-slate-700 mt-2 mb-1">{trimmed.replace(/^####\s*/, "")}</h5>;
                            }
                            if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
                              return <li key={lIdx} className="ml-4 list-disc mb-1 pl-1 text-slate-600 font-medium">{trimmed.replace(/^[\*\-]\s*/, "")}</li>;
                            }
                            if (!trimmed) return <div key={lIdx} className="h-1" />;
                            return <p key={lIdx} className="text-xs pb-0.5 font-medium text-slate-700 leading-relaxed">{trimmed}</p>;
                          })}
                        </div>
                      </div>
                      
                      {/* Regeneration helper */}
                      <div className="flex justify-end gap-2" id="regrade-action-container">
                        <button
                          id="btn-re-evaluate-submission-ai"
                          disabled={aiEvalLoadingId === drilledSub.id}
                          onClick={() => handleTriggerAIEval(drilledSub)}
                          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition disabled:opacity-55 shadow-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Regrade with AI Evaluator
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Classmate Anonymous Constructive critiques received */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="critiques-received-section">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 mb-4">Classmate Peer Reviews ({drilledPeerReviews.length})</h4>
                  
                  {drilledPeerReviews.length === 0 ? (
                    <p className="text-xs text-slate-405 italic text-center py-5 bg-slate-50 border border-slate-200 rounded-xl font-sans font-medium">No peer evaluations have been recorded for this student yet.</p>
                  ) : (
                    <div className="space-y-4" id="peer-reviews-list-container">
                      {drilledPeerReviews.map((pr, idx) => (
                        <div key={pr.id} className="p-4.5 bg-slate-50 border border-slate-200 rounded-2xl hover:border-indigo-200 hover:ring-2 hover:ring-indigo-600/10 transition space-y-3.5 shadow-xs" id={`pr-comment-${idx}`}>
                          <div className="flex border-b border-slate-200/60 pb-2 justify-between items-center" id={`pr-comment-head-${idx}`}>
                            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 font-display">
                              <Users className="w-3.5 h-3.5 text-indigo-500" />
                              Constructive Respondent: <strong className="text-slate-900 font-extrabold">{pr.authorName}</strong>
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(pr.submittedAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10.5px]" id={`pr-comment-scores-${idx}`}>
                            {Object.entries(pr.scores).map(([critId, val]) => {
                              const crit = activeAssignment?.rubric.find(r => r.id === critId);
                              return (
                                <div key={critId} className="bg-white px-3 py-1.5 border border-slate-200 rounded-xl" id={`pr-pills-${critId}`}>
                                  <span className="text-slate-400 block font-sans font-bold uppercase text-[8px] tracking-wider truncate mb-0.5">{crit?.category || "Score"}</span>
                                  <strong className="text-slate-800 font-extrabold font-mono">{val} <span className="text-slate-400 font-medium font-sans">/ {crit?.maxPoints || 30}</span></strong>
                                </div>
                              );
                            })}
                          </div>

                          <div className="text-xs space-y-2 mt-3 pt-2 border-t border-dashed border-slate-200/80 font-sans text-slate-700 font-medium" id={`pr-comment-text-${idx}`}>
                            <p className="leading-relaxed"><strong className="text-emerald-700 font-bold">What worked well:</strong> &ldquo;{pr.commentStrengths}&rdquo;</p>
                            <p className="pt-2 border-t border-slate-100/40 leading-relaxed"><strong className="text-indigo-850 text-indigo-750 text-indigo-600 font-bold">Constructive improvement:</strong> &ldquo;{pr.commentImprovements}&rdquo;</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 4. Instructor Manual Verification Grid & grading overwrite */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="manual-grading-form">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100" id="manual-form-title flex gap-2">
                    <FileCheck className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Instructor Assessment Verdict</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="manual-form-grid">
                    <div className="md:col-span-1 space-y-3" id="manual-form-score-col">
                      <div>
                        <label htmlFor="input-teacher-grade" className="text-xs font-bold text-slate-800 font-display block mb-1">Override Final Grade</label>
                        <p className="text-[10px] text-slate-450 mb-2 font-sans font-medium">Set verified score tally out of <strong>{totalMaxScore}</strong> points.</p>
                        <div className="flex items-center gap-2" id="num-box">
                          <input
                            id="input-teacher-grade"
                            type="number"
                            min="0"
                            max={totalMaxScore}
                            value={manualGrade}
                            onChange={(e) => setManualGrade(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 w-24 text-center font-mono font-bold text-sm focus:ring-2 focus:ring-indigo-650/20 focus:border-indigo-600 text-slate-900"
                          />
                          <span className="text-xs font-bold text-slate-400 font-sans">/ {totalMaxScore} pts</span>
                        </div>
                      </div>

                      {drilledSub.aiFeedback && (
                        <button
                          id="btn-use-ai-mark"
                          type="button"
                          onClick={() => setManualGrade(drilledSub.aiFeedback!.overallScore)}
                          className="w-full text-left text-[10px] border border-indigo-100 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-900 py-2.5 px-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wide font-sans shadow-xs"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          Apply AI Mark ({drilledSub.aiFeedback.overallScore})
                        </button>
                      )}

                      {drilledPeerReviews.length > 0 && (
                        <button
                          id="btn-use-peer-avg-mark"
                          type="button"
                          onClick={() => {
                            const scores = drilledPeerReviews.map(r => r.scoreGiven || 0);
                            const avgVal = scores.reduce((sum, s) => sum + s, 0) / scores.length;
                            setManualGrade(Math.round(avgVal));
                          }}
                          className="w-full text-left text-[10px] border border-emerald-100 bg-emerald-50/55 hover:bg-emerald-50 text-emerald-905 py-2.5 px-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center gap-1.5 uppercase tracking-wide font-sans shadow-xs"
                        >
                          <Users className="w-3.5 h-3.5 text-emerald-650" />
                          Apply Peer Avg ({Math.round(drilledPeerReviews.map(r => r.scoreGiven || 0).reduce((sum, s) => sum + s, 0) / drilledPeerReviews.length)})
                        </button>
                      )}

                      {drilledSub.teacherFeedback?.grade !== undefined && (
                        <div className="flex items-center gap-2 bg-sky-50 border border-sky-100 text-sky-850 text-[10px] font-bold p-2.5 rounded-xl uppercase tracking-wider font-sans justify-center mt-1">
                          <CheckSquare className="w-4 h-4 text-sky-600" />
                          Cross-Checked & Verified
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2 flex flex-col justify-between" id="manual-form-comments-col">
                      <div>
                        <label htmlFor="input-teacher-comment" className="text-xs font-bold text-slate-800 font-display block mb-1">Assessment Guidance Comments</label>
                        <textarea
                          id="input-teacher-comment"
                          rows={3}
                          value={manualComment}
                          onChange={(e) => setManualComment(e.target.value)}
                          placeholder="Provide encouraging and constructive commentary regarding the student's draft philosophy, responses, and peer participation..."
                          className="bg-slate-50 border border-slate-200 p-3 text-xs w-full rounded-xl focus:ring-2 focus:ring-indigo-650/20 focus:border-indigo-600 font-sans leading-relaxed text-slate-950 placeholder:text-slate-400"
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3.5" id="manual-form-submit-row">
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
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl shadow-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer"
                        >
                          Save Final Assessment Verdict
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl p-16 text-center text-slate-400" id="empty-sub-workspace">
                <FileText className="w-10 h-10 text-indigo-400/80 mx-auto mb-3.5" />
                <h4 className="text-sm font-bold text-slate-800 mb-1 font-display uppercase tracking-wider">Select a submission from the sidebar</h4>
                <p className="text-xs text-slate-450 max-w-sm mx-auto px-4 font-sans font-medium leading-relaxed">Click any submitted assignment paper from your left-hand roster list to view student text, classmate critiques, and execute AI rubric evaluations.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE CRITIQUE ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in" id="analytics-tab-body">
          {/* Dashboard Summary Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6" id="analytics-top-deck">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs" id="acard-1">
              <span className="text-slate-400 text-[9px] font-bold font-mono uppercase block tracking-widest mb-1.5 pl-0.5">Class Enrollment</span>
              <div className="flex justify-between items-end mt-1" id="ad-content-1">
                <strong className="text-2xl font-mono text-slate-800 leading-none">3 <span className="text-xs text-slate-450 font-sans font-medium pl-1">Rostered Students</span></strong>
                <Users className="w-5 h-5 text-indigo-500" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs" id="acard-2">
              <span className="text-slate-400 text-[9px] font-bold font-mono uppercase block tracking-widest mb-1.5 pl-0.5">Responses Recorded</span>
              <div className="flex justify-between items-end mt-1" id="ad-content-2">
                <strong className="text-2xl font-mono text-slate-800 leading-none">
                  {totalSubCount} <span className="text-xs text-slate-450 font-sans font-medium pl-1">Submissions</span>
                </strong>
                <FileCheck className="w-5 h-5 text-emerald-500" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs" id="acard-3">
              <span className="text-slate-400 text-[9px] font-bold font-mono uppercase block tracking-widest mb-1.5 pl-0.5">Topic Average Performance</span>
              <div className="flex justify-between items-end mt-1" id="ad-content-3">
                <strong className="text-2xl font-mono text-indigo-800 leading-none">
                  {classAvgScore} <span className="text-xs text-slate-450 font-sans font-medium pl-1">/ {totalMaxScore} pts</span>
                </strong>
                <Award className="w-5 h-5 text-indigo-600" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs" id="acard-4">
              <span className="text-slate-400 text-[9px] font-bold font-mono uppercase block tracking-widest mb-1.5 pl-0.5">Total Peer Critiques Left</span>
              <div className="flex justify-between items-end mt-1" id="ad-content-4">
                <strong className="text-2xl font-mono text-slate-800 leading-none">
                  {peerReviews.length} <span className="text-xs text-slate-450 font-sans font-medium pl-1">Reviews</span>
                </strong>
                <MessageSquare className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="analytics-graphics-deck">
            {/* SVG Visual Criteria Performance Analytics Chart (Horizontal Bar Chart) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="analytic-graphic-criteria">
              <div>
                <h4 className="text-sm font-bold text-slate-850 font-display">Multi-Criteria Score Breakdown</h4>
                <p className="text-xs text-slate-450 font-sans font-medium mt-0.5">Analysis of average student performance across specific rubrics sections, including peer reviews & AI evaluations.</p>
              </div>

              {rubricAvgList.length === 0 ? (
                <div className="text-center py-10 text-xs text-slate-400 italic bg-slate-50 border border-slate-200 rounded-2xl font-sans font-medium">Insufficient response grading logs to display criteria curves.</div>
              ) : (
                <div className="space-y-5 pt-3" id="analytic-criteria-list-visualizer">
                  {rubricAvgList.map((item, idx) => {
                    const barColor = item.percentage >= 85 ? 'bg-emerald-500' : item.percentage >= 70 ? 'bg-indigo-600' : 'bg-rose-500';
                    const textColor = item.percentage >= 85 ? 'text-emerald-800' : item.percentage >= 70 ? 'text-indigo-800' : 'text-rose-800';
                    return (
                      <div key={idx} className="space-y-1.5" id={`analytics-chart-bar-${idx}`}>
                        <div className="flex justify-between items-center text-xs" id={`analytics-bar-info-${idx}`}>
                          <div className="min-w-0" id={`analytics-name-col-${idx}`}>
                            <span className="font-bold text-slate-800 font-sans truncate block">{item.category}</span>
                            <span className="text-[10px] text-slate-400 font-medium block">Max: {item.maxValue} points</span>
                          </div>
                          <div className="text-right shrink-0" id={`analytics-score-col-${idx}`}>
                            <strong className="text-slate-850 block font-mono font-bold">{item.avgValue} / {item.maxValue}</strong>
                            <span className={`text-[10px] font-bold block font-sans ${textColor}`}>{item.percentage}% average achievement</span>
                          </div>
                        </div>

                        {/* Visual Progress Track */}
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-205" id={`graphics-bar-wrap-${idx}`}>
                          <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${item.percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="text-[11px] font-sans text-slate-650 bg-indigo-50/55 border border-indigo-100/60 rounded-xl p-4 flex gap-2.5 items-start mt-2" id="analytics-criteria-help">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-sans font-medium">
                  <strong className="text-indigo-900 font-bold block mb-0.5">Instructor Development Recommendation</strong>
                  Rubric criteria with scores falling under 75% display struggle areas in need of conceptual review. You can assign further focused peer activities to target those categories.
                </p>
              </div>
            </div>

            {/* SVG Class Grade Distribution Roster overview */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4" id="analytic-graphic-grades">
              <div>
                <h4 className="text-sm font-bold text-slate-850 font-display">Grade Distribution Stack</h4>
                <p className="text-xs text-slate-455 font-sans font-medium mt-0.5">Frequency breakdown of final student feedback standings for this active prompt.</p>
              </div>

              {/* Native responsive vertical bar charts */}
              <div className="h-44 w-full flex items-end justify-around gap-2 px-2 pt-6 border-b border-slate-200 pb-1" id="distrib-graphic-wrapper">
                {/* Score groups computed manually based on seed stats */}
                {[
                  { range: "90-100", frequency: activeSubmissions.filter(s => (s.teacherFeedback?.grade || s.aiFeedback?.overallScore || 0) >= 90).length, color: "bg-emerald-500", desc: "A / Excellent" },
                  { range: "80-89", frequency: activeSubmissions.filter(s => {
                    const m = s.teacherFeedback?.grade || s.aiFeedback?.overallScore || 0;
                    return m >= 80 && m < 90;
                  }).length, color: "bg-indigo-600", desc: "B / Solid" },
                  { range: "70-79", frequency: activeSubmissions.filter(s => {
                    const m = s.teacherFeedback?.grade || s.aiFeedback?.overallScore || 0;
                    return m >= 70 && m < 80;
                  }).length, color: "bg-amber-500", desc: "C / Pass" },
                  { range: "<70", frequency: activeSubmissions.filter(s => {
                    const m = s.teacherFeedback?.grade || s.aiFeedback?.overallScore || 0;
                    return m > 0 && m < 70;
                  }).length, color: "bg-rose-500", desc: "Needs Work" }
                ].map((col, idx) => {
                  const maxFreq = Math.max(1, activeSubmissions.length);
                  const hPct = Math.max(10, Math.round((col.frequency / maxFreq) * 100)); // ensure min peak
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 h-full justify-end group cursor-help relative animate-breathe" id={`stack-col-${idx}`}>
                      {/* Tooltip on Hover */}
                      <div className="absolute -top-1 opacity-0 group-hover:opacity-100 bg-slate-900 border border-slate-800 text-white text-[9px] font-bold font-sans py-1.5 px-2.5 rounded-lg -translate-y-full transition-all duration-150 text-center whitespace-nowrap shadow-md pointer-events-none z-10 uppercase tracking-wider">
                        <strong>{col.frequency} Student(s)</strong>
                        <span className="block text-slate-300 font-semibold">{col.desc}</span>
                      </div>

                      <span className="text-[10px] font-mono font-bold text-slate-800 mb-1">{col.frequency}</span>
                      <div className={`w-full ${col.color} rounded-t-md transition-all duration-500 ease-out`} style={{ height: `${col.frequency > 0 ? hPct : 2}%` }} />
                      <span className="text-[9px] font-bold text-slate-450 mt-2 font-mono whitespace-nowrap tracking-wide">{col.range}</span>
                    </div>
                  );
                })}
              </div>

              {/* Bottom grade index guide labels */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-[10px] font-sans font-bold text-slate-450 uppercase tracking-wider" id="analytic-graphic-grades-guide">
                <div className="flex items-center gap-1.5" id="label-guide-1">
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500 shrink-0" />
                  <span>A (Score &ge; 90)</span>
                </div>
                <div className="flex items-center gap-1.5" id="label-guide-2">
                  <div className="w-2.5 h-2.5 rounded-sm bg-indigo-600 shrink-0" />
                  <span>B (Score 80-89)</span>
                </div>
                <div className="flex items-center gap-1.5" id="label-guide-3">
                  <div className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" id="color-legend-c" />
                  <span>B (Score 80-89)</span>
                </div>
                <div className="flex items-center gap-1.5" id="label-guide-3">
                  <div className="w-2.5 h-2.5 rounded-sm bg-indigo-600 shrink-0" id="color-legend-b" />
                  <span>C (Score 70-79)</span>
                </div>
                <div className="flex items-center gap-1.5" id="label-guide-4">
                  <div className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" id="color-legend-review" />
                  <span>Review (&lt; 70)</span>
                </div>
              </div>
            </div>

            {/* PEER REVIEW PARTICIPATION & QUALITY ANALYTICS */}
            <div className="col-span-1 lg:col-span-12 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="peer-participation-analytics-bento">
              <div>
                <h4 className="text-sm font-bold text-slate-850 font-display">Student Critique Participation & Quality Ledger</h4>
                <p className="text-xs text-slate-455 font-sans font-medium mt-0.5">Dynamic participation logs monitoring the depth, constructive rate, and safety score of classmates' critiques.</p>
              </div>

              <div className="overflow-x-auto" id="critic-table-wrapper">
                <table className="w-full text-left text-xs border-collapse" id="critique-integrity-table">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Student / Critic Name</th>
                      <th className="pb-3 text-center font-semibold">Total Reviews Drafted</th>
                      <th className="pb-3 text-center font-semibold">Avg. Grading Score Given</th>
                      <th className="pb-3 text-center font-semibold font-mono text-amber-600">Flagged Incidents</th>
                      <th className="pb-3 text-center font-semibold">AI Quality Integrity Badge</th>
                      <th className="pb-3 text-right font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-sans font-medium text-slate-700">
                    {(() => {
                      // Compile comprehensive list of student names present in system
                      const peerReviewers = Array.from(new Set(peerReviews.map(p => p.reviewerName || p.authorName)));
                      const allStudents = peerReviewers.length > 0 ? peerReviewers : ["Julian Vance", "Aris Thorne", "Clara Mercer", "Marcus Thorne"];
                      
                      return allStudents.map((stName, idx) => {
                        const studentReviews = peerReviews.filter(p => (p.reviewerName || p.authorName) === stName);
                        const reviewCount = studentReviews.length;
                        const flaggedCount = studentReviews.filter(p => p.isFlagged).length;
                        const avgScoreGiven = reviewCount > 0 
                          ? Math.round(studentReviews.reduce((sum, p) => sum + (p.scoreGiven || 0), 0) / reviewCount) 
                          : 0;

                        // Calculate custom badges
                        let badgeColor = "bg-slate-100 text-slate-600 border-slate-200";
                        let badgeLabel = "No Logs";
                        
                        if (reviewCount > 0) {
                          if (flaggedCount > 0) {
                            badgeColor = "bg-amber-50 text-amber-700 border-amber-200/60";
                            badgeLabel = "Needs Advice";
                          } else {
                            const excellentPct = studentReviews.filter(p => p.qualityRating === 'excellent').length;
                            if (excellentPct > 0) {
                              badgeColor = "bg-emerald-50 text-emerald-800 border-emerald-250 font-extrabold";
                              badgeLabel = "High Integrity Critic";
                            } else {
                              badgeColor = "bg-indigo-50 text-indigo-700 border-indigo-200/60";
                              badgeLabel = "Satisfactory";
                            }
                          }
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition duration-150" id={`student-critic-row-${idx}`}>
                            <td className="py-3 font-semibold text-slate-800">{stName}</td>
                            <td className="py-3 text-center font-mono font-bold">{reviewCount}</td>
                            <td className="py-3 text-center font-mono text-slate-600">{reviewCount > 0 ? `${avgScoreGiven} pts` : "N/A"}</td>
                            <td className={`py-3 text-center font-mono font-bold ${flaggedCount > 0 ? "text-amber-600" : "text-slate-400"}`}>{flaggedCount}</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold border ${badgeColor} inline-block`}>{badgeLabel}</span>
                            </td>
                            <td className="py-3 text-right">
                              {reviewCount >= 2 ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-850 font-bold px-2 py-0.5 rounded-lg">✅ Complete</span>
                              ) : reviewCount > 0 ? (
                                <span className="text-[10px] bg-amber-100 text-amber-850 font-bold px-2 py-0.5 rounded-lg">⚡ Pending Draft (1/2)</span>
                              ) : (
                                <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-lg">&ldquo;No Critiques Written&rdquo;</span>
                              )}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAFETY MODERATION QUEUE VIEW */}
      {activeTab === 'moderation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="moderation-desk-view">
          {/* Left panel - queue directory */}
          <div className="lg:col-span-5 space-y-4" id="mod-queue-directory">
            <div className="bg-white border border-slate-200 rounded-2xl p-4.5 shadow-xs animate-shake-none" id="mod-summary">
              <div className="flex items-center justify-between" id="mod-summary-bar">
                <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-md uppercase tracking-wider">Safety Ledger</span>
                <span className="text-xs font-bold text-slate-500">{peerReviews.filter(p => p.isFlagged).length} Flagged Critiques Pending</span>
              </div>
              <h3 className="text-sm font-bold text-slate-850 font-display mt-2">Critique Integrity Center</h3>
              <p className="text-xs text-slate-450 mt-1 leading-relaxed">
                The platform utilizes real-time semantic screening to defend classroom safety guidelines. Flagged comments are quarantined here for manual instructor override.
              </p>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1" id="mod-list-grid">
              {peerReviews.length === 0 ? (
                <div className="text-center p-8 bg-white border border-slate-150 rounded-2xl text-slate-400 text-xs font-sans font-medium">
                  No classmate reviews are recorded in the database yet.
                </div>
              ) : (
                peerReviews.map(pr => {
                  const sub = submissions.find(s => s.id === pr.submissionId);
                  const asg = sub ? assignments.find(a => a.id === sub.assignmentId) : null;
                  return (
                    <button
                      key={pr.id}
                      type="button"
                      onClick={() => setSelectedModerationId(pr.id)}
                      className={`w-full p-3.5 border text-left rounded-xl transition flex flex-col gap-1.5 focus:outline-hidden cursor-pointer ${
                        selectedModerationId === pr.id 
                          ? 'bg-slate-900 border-slate-900 text-white shadow-xs' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      } ${pr.isFlagged && !pr.flagCheckedByTeacher ? 'border-l-4 border-l-amber-500' : pr.flagCheckedByTeacher ? 'border-l-4 border-l-slate-300' : 'border-l-4 border-l-emerald-500'}`}
                    >
                      <div className="flex items-center justify-between w-full" id={`mod-row-meta-${pr.id}`}>
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-90">
                          Critic: {pr.reviewerName || pr.authorName}
                        </span>
                        {pr.isFlagged && !pr.flagCheckedByTeacher ? (
                          <span className="bg-amber-100 text-amber-800 border border-amber-200 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase font-mono shrink-0">⚠️ Flagged</span>
                        ) : pr.flagCheckedByTeacher ? (
                          <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase font-mono shrink-0">Resolved</span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-850 border border-emerald-250 text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase font-mono shrink-0">Approved</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold line-clamp-1">{asg ? asg.title : "Discussion Prompt"}</h4>
                      <p className={`text-[11px] line-clamp-2 ${selectedModerationId === pr.id ? 'text-slate-200' : 'text-slate-450'}`}>
                        &ldquo;{pr.commentStrengths}&rdquo;
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel - detail assessment and action console */}
          <div className="lg:col-span-7" id="mod-queue-details">
            {(() => {
              const selectedReview = peerReviews.find(p => p.id === selectedModerationId) || peerReviews.find(p => p.isFlagged) || peerReviews[0];
              if (!selectedReview) {
                return (
                  <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3" id="empty-mod-card">
                    <CheckSquare className="w-10 h-10 text-emerald-500 bg-emerald-50 p-2 rounded-xl border border-emerald-100" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Safety Ledger Clean</h4>
                      <p className="text-xs text-slate-450 mt-1">There are no peer critique logs generated to inspect right now.</p>
                    </div>
                  </div>
                );
              }

              const sub = submissions.find(s => s.id === selectedReview.submissionId);
              const asg = sub ? assignments.find(a => a.id === sub.assignmentId) : null;

              const handleApproveAndDismiss = () => {
                const newList = peerReviews.map(p => {
                  if (p.id === selectedReview.id) {
                    return { ...p, isFlagged: false, flagCheckedByTeacher: true };
                  }
                  return p;
                });
                onUpdatePeerReviews(newList);
              };

              const handleDeleteReview = () => {
                if (window.confirm(`Are you sure you want to permanently delete this critique from student ${selectedReview.reviewerName || selectedReview.authorName}? This action is irreversible.`)) {
                  const newList = peerReviews.filter(p => p.id !== selectedReview.id);
                  onUpdatePeerReviews(newList);
                  if (selectedModerationId === selectedReview.id) {
                    setSelectedModerationId(null);
                  }
                }
              };

              return (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 animate-fade-in" id="mod-review-panel">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3" id="mod-detail-header">
                    <div>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 block uppercase">Review Ledger Audit</span>
                      <h3 className="text-sm font-bold text-slate-850 font-display mt-0.5">Assigned Critic: {selectedReview.reviewerName || selectedReview.authorName}</h3>
                    </div>
                    <div className="text-right" id="mod-detail-grade">
                      <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block font-mono">Assigned Rating</span>
                      <span className="text-xs font-bold font-mono text-slate-800">{(selectedReview.scoreGiven || 0)} / 100 points given</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Student Essay Topic</span>
                    <h4 className="text-xs font-semibold text-indigo-900 font-display">{asg ? asg.title : "Standard Topic"}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="mod-comment-content-grid">
                    <div className="bg-emerald-50/15 border border-emerald-100/40 p-4 rounded-xl space-y-1.5" id="mod-strengths">
                      <h5 className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider font-sans">Positive Strengths Articulated</h5>
                      <p className="text-xs text-slate-700 leading-relaxed italic font-serif bg-white p-2.5 rounded-lg border border-slate-100">&ldquo;{selectedReview.commentStrengths}&rdquo;</p>
                    </div>

                    <div className="bg-amber-50/15 border border-amber-100/45 p-4 rounded-xl space-y-1.5" id="mod-improvements">
                      <h5 className="text-[10px] font-extrabold text-amber-800 uppercase tracking-wider font-sans">Improvements Suggested</h5>
                      <p className="text-xs text-slate-700 leading-relaxed italic font-serif bg-white p-2.5 rounded-lg border border-slate-100">&ldquo;{selectedReview.commentImprovements}&rdquo;</p>
                    </div>
                  </div>

                  {selectedReview.isFlagged && (
                    <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 space-y-2.5" id="mod-ai-flag-report">
                      <div className="flex items-center gap-2" id="mod-ai-flag-report-title">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <h5 className="text-xs font-bold text-amber-900 font-display">Semantic Screening Warning Report</h5>
                          <p className="text-[10px] text-amber-700 font-sans mt-0.5">Our automated checker flagged this feedback written by this reviewer.</p>
                        </div>
                      </div>

                      <div className="text-xs text-slate-750 space-y-2 leading-relaxed" id="mod-ai-flag-details">
                        <p>
                          <strong className="text-amber-950 font-bold block mb-0.5">AI Flag Detail Reason:</strong>
                          {selectedReview.flagReason || "Written review is too brief, low-effort, or ignores requested constructive guideline criteria parameters."}
                        </p>
                        {selectedReview.suggestedRevision && (
                          <div className="bg-white border border-indigo-100 p-3 rounded-lg mt-2" id="mod-ai-suggested-revision">
                            <span className="text-[9px] font-extrabold text-indigo-700 tracking-wider block font-sans mb-1 uppercase">AI Recommended Refinement (Constructive alternative)</span>
                            <p className="font-sans text-[11px] text-slate-650 leading-relaxed italic font-medium">&ldquo;{selectedReview.suggestedRevision}&rdquo;</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4" id="mod-enforced-guidelines">
                    <h5 className="text-[10px] font-extrabold text-slate-450 uppercase tracking-wider font-sans mb-1.5 flex items-center gap-1">Enforced Peer Review Guidelines</h5>
                    <p className="text-[11px] text-slate-600 font-sans leading-relaxed whitespace-pre-wrap italic">
                      {asg?.peerReviewGuidelines || "1. Align critiques constructively, offer clear improvements.\n2. Do NOT write simple word placeholders."}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-100" id="mod-admin-actions">
                    <button
                      id="btn-mod-dismiss"
                      type="button"
                      onClick={handleApproveAndDismiss}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-xs transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Approve & Dismiss Flag
                    </button>
                    <button
                      id="btn-mod-delete"
                      type="button"
                      onClick={handleDeleteReview}
                      className="bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 hover:text-rose-700 font-bold text-xs py-2 px-4 rounded-xl transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash className="w-4 h-4" />
                      Reject & Delete Review
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* CREATE NEW ASSIGNMENTS / RUBRICS MAKER FORM */}
      {activeTab === 'create' && (
        <form onSubmit={handleCreateAssignment} className="bg-white border border-slate-200 rounded-2xl p-6.5 shadow-sm space-y-6 animate-fade-in" id="create-assignment-form">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100" id="form-creation-banner">
            <Plus className="w-5 h-5 text-indigo-600 bg-indigo-50 p-1 rounded-md" />
            <div>
              <h3 className="text-sm font-bold text-slate-850 font-display">Establish Advanced Topic Discussion</h3>
              <p className="text-xs text-slate-450 font-sans font-medium mt-0.5">Initiate a custom essay prompt aligned with unique grading parameters.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="form-general-grid">
            <div className="space-y-4" id="form-general-fields-col">
              <div>
                <label htmlFor="input-asg-title" className="text-xs font-bold text-slate-800 font-display block mb-1.5">Assignment Title</label>
                <input
                  id="input-asg-title"
                  type="text"
                  required
                  placeholder="e.g., Cybernetic Rights and Ethics under State Apparatus Policy"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs w-full focus:ring-2 focus:ring-indigo-650/20 focus:border-indigo-600 font-sans font-medium text-slate-900 placeholder:text-slate-400 shadow-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="select-asg-class-association" className="text-[11px] font-bold text-slate-700 font-display block mb-1">Target Classroom</label>
                  <select
                    id="select-asg-class-association"
                    value={asgClassCode}
                    onChange={(e) => setAsgClassCode(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs w-full font-sans font-semibold text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                  >
                    {classrooms.map(c => (
                      <option key={c.id} value={c.code}>{c.name} ({c.code})</option>
                    ))}
                    {classrooms.length === 0 && (
                      <option value="AI-ETHICS">Ethics & Safety (AI-ETHICS)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label htmlFor="select-asg-type-selector" className="text-[11px] font-bold text-slate-700 font-display block mb-1">Assignment Type Mode</label>
                  <select
                    id="select-asg-type-selector"
                    value={asgType}
                    onChange={(e) => setAsgType(e.target.value as any)}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs w-full font-sans font-semibold text-slate-850 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="essay">Standard Discussion Essay</option>
                    <option value="research">Reputed Journal Research Gist & PPT Presentation</option>
                    <option value="project">Interactive Engineering Project Sandbox</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="input-asg-min-reviews" className="text-[11px] font-bold text-slate-700 font-display block mb-1">Minimum Peer Reviewers Required</label>
                  <input
                    id="input-asg-min-reviews"
                    type="number"
                    min="1"
                    max="10"
                    value={minReviews}
                    onChange={(e) => setMinReviews(Number(e.target.value))}
                    className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs w-full font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                  />
                  <p className="text-[9px] text-slate-400 mt-1">Default is 3 reviewers to ensure reliable anonymous peer scoring average.</p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 font-display block mb-1">Permitted File Types</label>
                  <div className="flex gap-1.5 flex-wrap" id="checkbox-allowed-types">
                    {["PDF", "DOCX", "PPTX", "MP4", "ZIP"].map(ext => {
                      const active = asgDocTypes.includes(ext);
                      return (
                        <button
                          key={ext}
                          type="button"
                          id={`btn-ext-toggle-${ext}`}
                          onClick={() => {
                            if (active) {
                              setAsgDocTypes(asgDocTypes.filter(e => e !== ext));
                            } else {
                              setAsgDocTypes([...asgDocTypes, ext]);
                            }
                          }}
                          className={`text-[9.5px] font-bold font-mono px-2.5 py-1.5 border rounded-lg transition-all duration-100 ${active ? "bg-indigo-600 border-indigo-700 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                        >
                          .{ext}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {asgType === "research" && (
                <div className="p-3.5 bg-indigo-50 border border-indigo-100 rounded-xl mt-2 animate-fade-in" id="research-info-alert">
                  <div className="flex gap-2 items-start">
                    <Sparkles className="w-4 h-4 text-indigo-650 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs font-bold text-indigo-950">Peer-Graded Research Paper Assignment Enabled</h5>
                      <p className="text-[10px] text-indigo-850 leading-normal mt-0.5">
                        Students write a structured review selecting a paper from a reputed journal, provide an executive summary (gist), create a PPT template, and supply their recorded presentation. High academic integrity guidelines apply.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="input-asg-desc" className="text-xs font-bold text-slate-800 font-display block mb-1.5">Constructive Essay Prompt & Guidelines</label>
                <textarea
                  id="input-asg-desc"
                  rows={8}
                  required
                  placeholder="Add background detail issues, philosophical framework parameters, links, and questions. E.g., 'Describe how technological disruption Impacts marginalized groups...'"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs w-full focus:ring-2 focus:ring-indigo-650/20 focus:border-indigo-600 font-sans leading-relaxed text-slate-900 placeholder:text-slate-400 shadow-xs animate-shake-none"
                />
              </div>

              <div>
                <label htmlFor="input-asg-learning-objectives" className="text-xs font-bold text-slate-800 font-display block mb-1.5">Learning Objectives & Goals (Optional)</label>
                <textarea
                  id="input-asg-learning-objectives"
                  rows={2}
                  placeholder="e.g., Learn to critique utilitarian deontology, construct logically coherent defenses of civic safety laws."
                  value={newLearningObjectives}
                  onChange={(e) => setNewLearningObjectives(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs w-full focus:ring-2 focus:ring-indigo-650/20 focus:border-indigo-600 font-sans leading-relaxed text-slate-900 placeholder:text-slate-400 shadow-xs"
                />
              </div>

              <div>
                <label htmlFor="input-asg-peer-guidelines" className="text-xs font-bold text-slate-800 font-display block mb-1.5">Constructive Peer Review Guidelines</label>
                <textarea
                  id="input-asg-peer-guidelines"
                  rows={3}
                  required
                  placeholder="Specify review etiquette for student critics..."
                  value={newPeerGuidelines}
                  onChange={(e) => setNewPeerGuidelines(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs w-full focus:ring-2 focus:ring-indigo-650/20 focus:border-indigo-600 font-sans leading-relaxed text-slate-900 placeholder:text-slate-400 shadow-xs"
                />
              </div>

              <div className="bg-indigo-50/40 border border-indigo-100/80 rounded-xl p-4 space-y-3" id="ai-emphasis-form-group">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950 font-display flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-600" />
                    AI Evaluation Emphasis Priorities
                  </h4>
                  <p className="text-[10px] text-indigo-600/80 leading-normal font-sans font-medium mt-0.5">Customize how the AI evaluator weighs grading dimensions for this topic.</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1" id="ai-emphasis-priorities-grid">
                  <div>
                    <label htmlFor="select-emphasis-grammar" className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Grammar</label>
                    <select
                      id="select-emphasis-grammar"
                      value={emphasisGrammar}
                      onChange={(e) => setEmphasisGrammar(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-700 w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-650"
                    >
                      <option value="low">Low (Generous)</option>
                      <option value="medium">Medium (Standard)</option>
                      <option value="high">High (Strict)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="select-emphasis-structure" className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Structure & Flow</label>
                    <select
                      id="select-emphasis-structure"
                      value={emphasisStructure}
                      onChange={(e) => setEmphasisStructure(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-700 w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-650"
                    >
                      <option value="low">Low (Relaxed)</option>
                      <option value="medium">Medium (Standard)</option>
                      <option value="high">High (Polished)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="select-emphasis-content" className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Accuracy / Core Facts</label>
                    <select
                      id="select-emphasis-content"
                      value={emphasisContent}
                      onChange={(e) => setEmphasisContent(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-700 w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-650"
                    >
                      <option value="low">Low Leeway</option>
                      <option value="medium">Medium Standard</option>
                      <option value="high">High Integrity</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="select-emphasis-analysis" className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Critical Analysis</label>
                    <select
                      id="select-emphasis-analysis"
                      value={emphasisAnalysis}
                      onChange={(e) => setEmphasisAnalysis(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-700 w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-650"
                    >
                      <option value="low">Low Focus</option>
                      <option value="medium">Medium Standard</option>
                      <option value="high">Strict Rigorous</option>
                    </select>
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="select-emphasis-creativity" className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Creativity / Novelty</label>
                    <select
                      id="select-emphasis-creativity"
                      value={emphasisCreativity}
                      onChange={(e) => setEmphasisCreativity(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg p-1.5 text-[11px] font-bold text-slate-700 w-full focus:outline-hidden focus:ring-1 focus:ring-indigo-650"
                    >
                      <option value="low">Low Importance</option>
                      <option value="medium">Medium Standard</option>
                      <option value="high">High Priority Accent</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Rubrics Builder Module */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-200/80 md:pl-6" id="form-rubrics-col">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-120 p-4 rounded-xl space-y-2.5 shadow-xs" id="ai-rubric-generation-cta">
                <div className="flex items-center gap-2" id="ai-rubrics-cta-heading">
                  <span className="bg-indigo-600 text-white rounded-lg p-1.5 text-xs font-mono font-bold uppercase tracking-widest flex items-center justify-center">AI</span>
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 font-display">Let AI Formulate the Rubric</h5>
                    <p className="text-[10px] text-slate-500 font-sans mt-0.5">Generate customized point categories matching objectives in 1-Click.</p>
                  </div>
                </div>

                <button
                  id="btn-trigger-ai-rubric-gen"
                  type="button"
                  disabled={isGeneratingRubric}
                  onClick={handleGenerateRubricAI}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-75 disabled:cursor-not-allowed text-white text-[11px] font-extrabold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 tracking-wide font-sans shadow-xs"
                >
                  {isGeneratingRubric ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Analyzing Objectives & Creating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      ✨ Generate Custom 100pt Rubric
                    </>
                  )}
                </button>

                {rubricGenError && (
                  <p className="text-[10px] text-rose-500 font-medium font-sans leading-relaxed text-center px-1 bg-rose-50 rounded-md py-1">{rubricGenError}</p>
                )}
              </div>

              <h4 className="text-xs font-bold text-slate-805 font-display mb-1 pt-1">Interactive Evaluation Rubric Builder</h4>
              <p className="text-[11px] text-slate-450 leading-normal font-sans font-medium">Configure custom evaluation categories. The sum is verified before draft submissions.</p>

              {/* Rubrics criterias preview list */}
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="form-rubric-preview-list">
                {newRubric.map((item, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start gap-3 shadow-xs" id={`new-criteria-bubble-${idx}`}>
                    <div className="min-w-0" id={`new-criteria-bubble-info-${idx}`}>
                      <div className="flex gap-1.5 items-center" id={`new-criteria-bubble-cat-${idx}`}>
                        <span className="text-xs font-bold text-slate-700 font-sans truncate">{item.category}</span>
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[9px] font-mono font-bold shrink-0">{item.maxPoints} pts</span>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-1 font-sans font-medium">{item.description}</p>
                    </div>
                    <button
                      id={`btn-remove-criteria-${idx}`}
                      type="button"
                      onClick={() => handleRemoveCriteria(idx)}
                      className="text-[9px] font-semibold text-rose-500 hover:text-rose-700 uppercase tracking-wider font-sans cursor-pointer mt-0.5 transition"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {newRubric.length === 0 && (
                  <div className="text-center p-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl font-sans font-medium">No criteria established. Formulate at least one to save.</div>
                )}
              </div>

              {/* Form Row to insert criteria */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3" id="rubric-builder-inputs">
                <span className="text-[9px] font-mono font-bold text-slate-400 tracking-wider ml-0.5 block">INSERT SCORE CRITERIA ROW</span>
                <div className="grid grid-cols-3 gap-2" id="criteria-inputs-row-1">
                  <div className="col-span-2">
                    <input
                      id="input-criteria-category"
                      type="text"
                      placeholder="Category e.g., Logic & Flow"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="bg-white border border-slate-205 p-2 text-xs w-full rounded-lg focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-slate-900 shadow-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      id="input-criteria-maxpoints"
                      type="number"
                      min="1"
                      max="100"
                      placeholder="Max pts"
                      value={newCatPoints || ""}
                      onChange={(e) => setNewCatPoints(Number(e.target.value))}
                      className="bg-white border border-slate-205 p-2 text-xs w-full text-center rounded-lg focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-slate-900 font-mono font-bold shadow-xs"
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
                    className="bg-white border border-slate-205 p-2 text-xs w-full rounded-lg focus:ring-1 focus:ring-indigo-600 focus:border-indigo-600 text-slate-900 shadow-xs"
                  />
                </div>

                <button
                  id="btn-add-criteria"
                  type="button"
                  onClick={handleAddCriteria}
                  className="w-full bg-slate-900 hover:bg-black text-white text-[10px] font-bold py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wide shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Score Row to Rubric
                </button>
              </div>

              <div className="text-[11px] font-mono text-right text-slate-500 block pr-1" id="total-rubric-sum">
                Total Max Rubric Tally: <strong className="text-slate-800 font-mono font-bold">{newRubric.reduce((acc, r) => acc + r.maxPoints, 0)} points</strong>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end gap-3" id="form-creation-actions">
            <button
              id="btn-cancel-create"
              type="button"
              onClick={() => setActiveTab('submissions')}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              id="btn-submit-create-asg"
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              Assign Discussion Topic &bull; Save
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* CLASSROOMS PANEL */}
      {activeTab === 'classrooms' && (
        <div className="space-y-6 animate-fade-in" id="classrooms-tab-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Create Classroom Card */}
            <div className="md:col-span-1 bg-white border border-slate-200 p-6 rounded-2xl shadow-xs h-fit" id="create-classroom-card">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100" id="create-class-header">
                <Plus className="w-4 h-4 text-indigo-600 bg-indigo-50 p-1.5 rounded-md" />
                <h4 className="text-xs font-bold text-slate-855 uppercase tracking-widest font-sans">Establish New Classroom</h4>
              </div>

              <form onSubmit={handleCreateClassroom} className="space-y-4 mt-4" id="create-class-form">
                <div>
                  <label htmlFor="input-class-name" className="text-xs font-bold text-slate-700 block mb-1">Classroom Name</label>
                  <input
                    id="input-class-name"
                    type="text"
                    required
                    placeholder="e.g., AI Research Seminar, Senior Thesis"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="bg-slate-50 border border-slate-205 p-3 text-xs w-full rounded-xl focus:ring-1 focus:ring-indigo-600 text-slate-900"
                  />
                </div>

                <div>
                  <label htmlFor="input-class-code" className="text-xs font-bold text-slate-700 block mb-1">Unique Class Code (Faculty Issued)</label>
                  <input
                    id="input-class-code"
                    type="text"
                    required
                    placeholder="e.g., CS-501, ETHICS-202"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value)}
                    className="bg-slate-50 border border-slate-205 p-3 text-xs w-full rounded-xl focus:ring-1 focus:ring-indigo-600 font-mono font-bold uppercase text-slate-900 placeholder:normal-case"
                  />
                  <p className="text-[10px] text-slate-450 mt-1 font-sans">Students sign up or join using this exact entry code.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">Default Allowed Document Formats</label>
                  <div className="flex gap-2 flex-wrap" id="class-doc-allowance">
                    {["PDF", "DOCX", "PPTX", "MP4", "ZIP"].map(ext => {
                      const contains = newClassDocTypes.includes(ext);
                      return (
                        <button
                          key={ext}
                          type="button"
                          id={`btn-class-ext-${ext}`}
                          onClick={() => {
                            if (contains) {
                              setNewClassDocTypes(newClassDocTypes.filter(e => e !== ext));
                            } else {
                              setNewClassDocTypes([...newClassDocTypes, ext]);
                            }
                          }}
                          className={`text-[10px] font-bold font-mono px-3 py-1.5 border rounded-lg transition-all cursor-pointer ${contains ? "bg-indigo-600 border-indigo-700 text-white shadow-xs" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                        >
                          .{ext}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-2">Faculty holds the administrative right to determine student upload types.</p>
                </div>

                <button
                  id="btn-save-classroom"
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl !mt-6 transition cursor-pointer shadow-xs"
                >
                  Create & Save Classroom Code
                </button>
              </form>
            </div>

            {/* Classrooms List Grid */}
            <div className="md:col-span-2 space-y-4" id="classrooms-inventory">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Active Classrooms Ledger ({classrooms.length})</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="classroom-grid-list">
                {classrooms.map(c => {
                  const classroomAssignments = assignments.filter(a => a.classroomCode === c.code);
                  const enrolledStudentsSet = new Set(submissions.filter(s => s.classroomCode === c.code || classroomAssignments.some(ca => ca.id === s.assignmentId)).map(s => s.studentId));
                  
                  return (
                    <div key={c.id} className="bg-white border border-slate-250 hover:border-indigo-300 p-5 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs" id={`class-box-${c.code}`}>
                      <div>
                        <div className="flex justify-between items-start" id={`class-box-head-${c.code}`}>
                          <span className="bg-indigo-50 border border-indigo-120 text-indigo-750 font-mono font-bold text-xs px-3 py-1 rounded-full uppercase">
                            {c.code}
                          </span>
                          <span className="text-[10.5px] text-slate-400 font-medium font-sans">Est: {new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <h5 className="text-sm font-extrabold text-slate-800 font-display mt-3 leading-tight">{c.name}</h5>
                      </div>

                      <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[11px]" id={`class-box-foot-${c.code}`}>
                        <span className="text-slate-400 font-bold flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          Students Joined: <strong className="text-slate-700">{enrolledStudentsSet.size}</strong>
                        </span>
                        <span className="text-slate-400 font-bold flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          Topics: <strong className="text-indigo-750">{classroomAssignments.length}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}

                {classrooms.length === 0 && (
                  <div className="col-span-2 text-center p-12 bg-slate-50 border border-slate-205 border-dashed rounded-2xl text-slate-400 font-sans font-medium">
                    No classrooms established. Generate one on the left so students can register!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
