import React, { useState, useEffect, FormEvent } from "react";
import { 
  Assignment, 
  Submission, 
  PeerReview, 
  RubricCriteria,
  AIFeedback,
  UserProfile
} from "../types";
import AICoach from "./AICoach";
import { 
  Sparkles, 
  FileText, 
  Send, 
  MessageSquare, 
  Users, 
  Award, 
  Cpu, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  BookOpen,
  Eye,
  Loader2,
  RefreshCw,
  HelpCircle,
  ThumbsUp,
  TrendingUp
} from "lucide-react";

import { Classroom } from "../types";

interface StudentDashboardProps {
  currentStudent: UserProfile;
  assignments: Assignment[];
  submissions: Submission[];
  peerReviews: PeerReview[];
  classrooms: Classroom[];
  onSubmitSubmission: (assignmentId: string, content: string, aiFeedback: AIFeedback | null, extraFields?: any) => void;
  onSaveDraft: (assignmentId: string, content: string, extraFields?: any) => void;
  onSubmitPeerReview: (newReview: PeerReview) => void;
  onJoinClassroom: (classCode: string) => boolean;
}

export default function StudentDashboard({
  currentStudent,
  assignments,
  submissions,
  peerReviews,
  classrooms,
  onSubmitSubmission,
  onSaveDraft,
  onSubmitPeerReview,
  onJoinClassroom
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<'discussion' | 'peer-review' | 'joined-classrooms'>('discussion');
  const [selectedAsgId, setSelectedAsgId] = useState<string>("");
  
  // Join classroom form states
  const [joinClassCode, setJoinClassCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Research paper asset inputs
  const [journalPaperTitle, setJournalPaperTitle] = useState("");
  const [paperGist, setPaperGist] = useState("");
  const [pptFileName, setPptFileName] = useState("");
  const [videoFileName, setVideoFileName] = useState("");
  
  // Submission Editor State
  const [editorText, setEditorText] = useState("");
  const [isAiGrading, setIsAiGrading] = useState(false);
  const [gradingError, setGradingError] = useState<string | null>(null);

  // Sub-tab selection for submitted view
  const [submittedSubTab, setSubmittedSubTab] = useState<'my-text' | 'ai-feedback' | 'all-reviews'>('ai-feedback');

  // Peer review selection state
  const [selectedPeerSubId, setSelectedPeerSubId] = useState<string | null>(null);
  const [isModerating, setIsModerating] = useState(false);
  const [moderationWarning, setModerationWarning] = useState<{
    flagReason: string;
    suggestedRevision: string;
    scoreGiven: number;
    strengths: string;
    improvements: string;
  } | null>(null);

  // Peer review form states
  const [peerScores, setPeerScores] = useState<{ [categoryId: string]: number }>({});
  const [peerGoodComments, setPeerGoodComments] = useState("");
  const [peerImproveComments, setPeerImproveComments] = useState("");
  const [peerSuccessMsg, setPeerSuccessMsg] = useState(false);

  // Filter assignments matching the student's joined classroom codes OR has no classroomCode
  const myClassroomCodes = (currentStudent.classroomCodes || []).map(c => c.toUpperCase());
  const filteredAssignments = assignments.filter(asg => {
    if (!asg.classroomCode) return true; // public
    return myClassroomCodes.includes(asg.classroomCode.toUpperCase());
  });

  const activeAssignment = filteredAssignments.find(a => a.id === selectedAsgId) || filteredAssignments[0];
  const mySubmission = submissions.find(s => s.assignmentId === (activeAssignment?.id || "") && s.studentId === currentStudent.id);

  useEffect(() => {
    if (activeAssignment?.id && !selectedAsgId) {
      setSelectedAsgId(activeAssignment.id);
    }
  }, [activeAssignment, selectedAsgId]);

  useEffect(() => {
    if (mySubmission) {
      setEditorText(mySubmission.content);
      setJournalPaperTitle(mySubmission.journalPaperTitle || "");
      setPaperGist(mySubmission.paperGist || "");
      setPptFileName(mySubmission.pptFileName || "");
      setVideoFileName(mySubmission.videoFileName || "");
      // Auto toggle tab matching submission state
      if (mySubmission.status === 'submitted') {
        setSubmittedSubTab('ai-feedback');
      }
    } else {
      setEditorText("");
      setJournalPaperTitle("");
      setPaperGist("");
      setPptFileName("");
      setVideoFileName("");
    }
  }, [selectedAsgId, currentStudent.id, mySubmission]);

  // Initializing peer scores when entering peer critique view
  const handleSelectPeerToReview = (sub: Submission) => {
    setSelectedPeerSubId(sub.id);
    setPeerSuccessMsg(false);
    setPeerGoodComments("");
    setPeerImproveComments("");
    const initialScores: { [catId: string]: number } = {};
    activeAssignment.rubric.forEach(r => {
      initialScores[r.id] = Math.round(r.maxPoints * 0.82); // logical default middle starting point
    });
    setPeerScores(initialScores);
  };

  const handleSaveDraftLocal = () => {
    const extra = {
      journalPaperTitle: journalPaperTitle.trim() || undefined,
      paperGist: paperGist.trim() || undefined,
      pptFileName: pptFileName.trim() || undefined,
      videoFileName: videoFileName.trim() || undefined
    };
    onSaveDraft(selectedAsgId, editorText, extra);
    alert("Draft saved to browser storage successfully!");
  };

  const handleSubmitFinalEssay = async () => {
    if (activeAssignment?.type === "research") {
      if (!journalPaperTitle.trim()) {
        alert("A reputed academic journal assignment requires selecting and entering a paper title in high-end peer reviews!");
        return;
      }
      if (!paperGist.trim()) {
        alert("Please provide the absolute executive gist of your selected journal paper!");
        return;
      }
      if (!pptFileName.trim()) {
        alert("Please link or upload your presentation PPT file so peers can grade your slides!");
        return;
      }
      if (!videoFileName.trim()) {
        alert("Please provide your video self-recording presenting this research paper!");
        return;
      }
    }

    if (editorText.trim().length < 100) {
      alert("A brief paragraph isn't quite enough to address these deep assignment rubrics. Expand your central thesis to at least 100 characters before deploying!");
      return;
    }

    if (!window.confirm("Ready to publish your work in the forum? This locks editing and triggers immediate AI Rubric Critique grading!")) {
      return;
    }

    setIsAiGrading(true);
    setGradingError(null);

    const extra = {
      journalPaperTitle: journalPaperTitle.trim(),
      paperGist: paperGist.trim(),
      pptFileName: pptFileName.trim(),
      videoFileName: videoFileName.trim(),
      classroomCode: activeAssignment.classroomCode
    };

    try {
      // Call modern server route to generate real AI grading report
      const response = await fetch("/api/eval-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentTitle: activeAssignment.title,
          assignmentDescription: activeAssignment.description,
          studentContent: `${editorText}\n\n[JOURNAL]: ${journalPaperTitle}\n[GIST]: ${paperGist}\n[PPT PLAN]: ${pptFileName}\n[PRESENTATION]: ${videoFileName}`,
          rubrics: activeAssignment.rubric
        })
      });

      if (!response.ok) {
        throw new Error("Grading services experienced networking exceptions.");
      }

      const aiFinalFeedback: AIFeedback = await response.json();
      onSubmitSubmission(selectedAsgId, editorText, aiFinalFeedback, extra);
      setSubmittedSubTab('ai-feedback');
    } catch (err: any) {
      console.warn("AI Grading endpoint offline or failed. Applying fallback mock assessment.", err);
      setGradingError("Direct AI grader is operating in local diagnostic fallback. Scoring simulation compiled.");
      
      // Fallback structured feedback so user experience is perfect even offline
      const mockScoreSum = activeAssignment.rubric.reduce((acc, r) => acc + Math.round(r.maxPoints * 0.8), 0);
      const mockMaxSum = activeAssignment.rubric.reduce((acc, r) => acc + r.maxPoints, 0);

      const fallbackFeedback: AIFeedback = {
        overallScore: mockScoreSum,
        maxScore: mockMaxSum,
        rubricScores: activeAssignment.rubric.map(r => ({
          category: r.category,
          score: Math.round(r.maxPoints * 0.8),
          maxPoints: r.maxPoints,
          feedback: `Good effort addressing ${r.category}. Cite more direct historical definitions to push into the top bracket.`
        })),
        strengths: [
          "Thesis is stated clearly in the essays files.",
          "Good attempt to frame the discussion using relevant vocabulary terms."
        ],
        improvements: [
          "Try to introduce explicit evidence rather than relying strictly on generalizations.",
          "Spend more focus polishing transitions between the third and fourth arguments."
        ],
        detailedAnalysis: `### Assignment Evaluation Summary (Simulated Diagnosis)
The draft demonstrates solid dedication to critical synthesis. We suggest strengthening structural signposting to increase logical flow. Good overall progress; refer to suggestions in your scorecard columns on the right to polish future submissions.`,
        sentiment: "constructive",
        generatedAt: new Date().toISOString()
      };

      setTimeout(() => {
        onSubmitSubmission(selectedAsgId, editorText, fallbackFeedback, extra);
        setIsAiGrading(false);
        setSubmittedSubTab('ai-feedback');
      }, 1500);
      return;
    } finally {
      setIsAiGrading(false);
    }
  };

  const handleJoinClassroomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(null);
    
    if (!joinClassCode.trim()) {
      setJoinError("Please key in a valid classroom code.");
      return;
    }
    
    const success = onJoinClassroom(joinClassCode.trim());
    if (success) {
      setJoinSuccess(`Enrolled successfully in class code: ${joinClassCode.trim().toUpperCase()}!`);
      setJoinClassCode("");
    } else {
      setJoinError(`Class code "${joinClassCode.trim().toUpperCase()}" was not found. Verify code with your faculty instructor.`);
    }
  };

  const handlePostPeerCritique = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeerSubId) return;

    if (!peerGoodComments.trim() || !peerImproveComments.trim()) {
      alert("Please provide both positive strengths AND advice for improvement to support peer learning!");
      return;
    }

    setIsModerating(true);
    setModerationWarning(null);

    // Compute peer score sum
    const rubricMax = activeAssignment?.rubric.reduce((acc, cr) => acc + cr.maxPoints, 0) || 100;
    const computedScore = activeAssignment?.rubric.reduce((acc, cr) => {
      const scoreVal = peerScores[cr.id] !== undefined ? peerScores[cr.id] : Math.round(cr.maxPoints * 0.85);
      return acc + scoreVal;
    }, 0) || 85;

    const finalPctScore = rubricMax > 0 ? Math.round((computedScore / rubricMax) * 100) : 85;

    try {
      const response = await fetch("/api/moderate-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentStrengths: peerGoodComments,
          commentImprovements: peerImproveComments,
          guidelines: activeAssignment?.peerReviewGuidelines || ""
        })
      });

      if (!response.ok) {
        throw new Error("Unable to contact active safe scrutiny systems.");
      }

      const status = await response.json();

      if (status.isFlagged) {
        // Show interactive warning modal/dialog inline
        setModerationWarning({
          flagReason: status.flagReason,
          suggestedRevision: status.suggestedRevision,
          scoreGiven: finalPctScore,
          strengths: peerGoodComments,
          improvements: peerImproveComments
        });
        return;
      }

      // No flag, continue to publish review immediately!
      const newReview: PeerReview = {
        id: `pr_${Date.now()}`,
        submissionId: selectedPeerSubId,
        assignmentId: selectedAsgId,
        authorId: currentStudent.id,
        authorName: currentStudent.name,
        reviewerName: currentStudent.name,
        scores: { ...peerScores },
        scoreGiven: finalPctScore,
        commentStrengths: peerGoodComments,
        commentImprovements: peerImproveComments,
        isFlagged: false,
        flagReason: "",
        suggestedRevision: "",
        flagCheckedByTeacher: false,
        qualityRating: status.qualityRating || "satisfactory",
        submittedAt: new Date().toISOString()
      };

      onSubmitPeerReview(newReview);
      setPeerSuccessMsg(true);
      setPeerGoodComments("");
      setPeerImproveComments("");
      setTimeout(() => {
        setPeerSuccessMsg(false);
        setSelectedPeerSubId(null);
      }, 2000);

    } catch (err) {
      console.warn("Safety filtering offline. Registering critique directly (Local Offline Simulation checks).");
      
      // Standby offline local moderation check
      const textTotal = (peerGoodComments + " " + peerImproveComments).toLowerCase();
      let isFlagged = false;
      let flagReason = "";
      let suggestedRevision = "";
      
      if (peerGoodComments.trim().split(/\s+/).length < 4 || peerImproveComments.trim().split(/\s+/).length < 4) {
        isFlagged = true;
        flagReason = "Critique responses are extremely brief or low-effort.";
        suggestedRevision = `Wonderful deontology critique! Try expanding: "${peerGoodComments.trim()} Although you asserted the core premising details nicely, introducing explicit structural details is advised."`;
      } else if (textTotal.includes("stupid") || textTotal.includes("idiot") || textTotal.includes("trash") || textTotal.includes("bad work")) {
        isFlagged = true;
        flagReason = "Vulgar or unscholarly language detected. Critiques should comment neutrally on arguments.";
        suggestedRevision = "Polite rewrite: 'The arguments are presented nicely, though exploring additional counterarguments would elevate structural standings.'";
      }

      if (isFlagged) {
        setModerationWarning({
          flagReason,
          suggestedRevision,
          scoreGiven: finalPctScore,
          strengths: peerGoodComments,
          improvements: peerImproveComments
        });
        return;
      }

      const newReview: PeerReview = {
        id: `pr_${Date.now()}`,
        submissionId: selectedPeerSubId,
        assignmentId: selectedAsgId,
        authorId: currentStudent.id,
        authorName: currentStudent.name,
        reviewerName: currentStudent.name,
        scores: { ...peerScores },
        scoreGiven: finalPctScore,
        commentStrengths: peerGoodComments,
        commentImprovements: peerImproveComments,
        isFlagged: false,
        flagReason: "",
        suggestedRevision: "",
        flagCheckedByTeacher: false,
        qualityRating: "satisfactory",
        submittedAt: new Date().toISOString()
      };

      onSubmitPeerReview(newReview);
      setPeerSuccessMsg(true);
      setPeerGoodComments("");
      setPeerImproveComments("");
      setTimeout(() => {
        setPeerSuccessMsg(false);
        setSelectedPeerSubId(null);
      }, 2000);

    } finally {
      setIsModerating(false);
    }
  };

  const handleSubmitBypassingModeration = (useAIRevision: boolean) => {
    if (!selectedPeerSubId || !moderationWarning) return;

    let finalStrengths = moderationWarning.strengths;
    let finalImprovements = moderationWarning.improvements;
    let flaggedStatus = true;
    let reasonText = moderationWarning.flagReason;
    let suggestedText = moderationWarning.suggestedRevision;

    if (useAIRevision && moderationWarning.suggestedRevision) {
      // Re-organize strengths & improvements to use AI suggestion
      finalStrengths = "I liked the general direction, thesis statement, and evidence applied to deontology.";
      finalImprovements = moderationWarning.suggestedRevision;
      flaggedStatus = false; // Resolved immediately!
      reasonText = "";
      suggestedText = "";
    }

    const newReview: PeerReview = {
      id: `pr_${Date.now()}`,
      submissionId: selectedPeerSubId,
      assignmentId: selectedAsgId,
      authorId: currentStudent.id,
      authorName: currentStudent.name,
      reviewerName: currentStudent.name,
      scores: { ...peerScores },
      scoreGiven: moderationWarning.scoreGiven,
      commentStrengths: finalStrengths,
      commentImprovements: finalImprovements,
      isFlagged: flaggedStatus,
      flagReason: reasonText,
      suggestedRevision: suggestedText,
      flagCheckedByTeacher: false,
      qualityRating: useAIRevision ? "excellent" : "needs_improvement",
      submittedAt: new Date().toISOString()
    };

    onSubmitPeerReview(newReview);
    setModerationWarning(null);
    setPeerSuccessMsg(true);
    setPeerGoodComments("");
    setPeerImproveComments("");
    setTimeout(() => {
      setPeerSuccessMsg(false);
      setSelectedPeerSubId(null);
    }, 2000);
  };

  // Find peer submissions that are NOT mine (Anonymized list of classmates)
  const classmatesSubmissions = submissions.filter(s => 
    s.assignmentId === selectedAsgId &&
    s.status === 'submitted' &&
    s.studentId !== currentStudent.id
  );

  // Count reviews this student has written for the selected assignment
  const myReviewsCount = peerReviews.filter(p => 
    p.assignmentId === selectedAsgId &&
    p.authorId === currentStudent.id
  ).length;

  const totalMaxScore = activeAssignment?.rubric.reduce((acc, cr) => acc + cr.maxPoints, 0) || 100;

  return (
    <div className="space-y-6" id="student-dashboard">
      {/* Top Welcome Panel in Bento Style */}
      <div className="bg-slate-900 border border-slate-850 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4" id="student-hero">
        <div className="flex items-center gap-4.5" id="student-identity-group">
          <div className="relative shrink-0" id="avatar-container">
            <img 
              src={currentStudent.avatarUrl} 
              alt={currentStudent.name} 
              className="w-14 h-14 rounded-full border-2 border-indigo-400 shrink-0 object-cover shadow-sm bg-slate-800" 
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
          </div>
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2" id="student-welcome-title">
              Hello, {currentStudent.name}!
              <span className="text-[10px] uppercase tracking-widest font-mono text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-bold">Student Badge</span>
            </h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5">Active Arena: <strong className="text-slate-200">{activeAssignment?.title}</strong> &bull; Completed Reviews: <strong className="text-indigo-300">{myReviewsCount}</strong></p>
          </div>
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-800/80 border border-slate-700/50 rounded-full self-start md:self-auto flex-wrap" id="student-menu-tabs">
          <button
            id="tab-student-discussion"
            type="button"
            onClick={() => setActiveTab('discussion')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 ${activeTab === 'discussion' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-350 hover:text-white hover:bg-slate-700/40'}`}
          >
            <div className="flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              Discussion Arena
            </div>
          </button>
          
          <button
            id="tab-student-peerreview"
            type="button"
            onClick={() => { setActiveTab('peer-review'); setSelectedPeerSubId(null); }}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 ${activeTab === 'peer-review' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-350 hover:text-white hover:bg-slate-700/40'}`}
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Critique Peers Anonymously
            </div>
          </button>

          <button
            id="tab-student-classrooms"
            type="button"
            onClick={() => setActiveTab('joined-classrooms')}
            className={`px-5 py-2 text-xs font-bold rounded-full transition-all duration-200 ${activeTab === 'joined-classrooms' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-350 hover:text-white hover:bg-slate-700/40'}`}
          >
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
              Join Class Code
            </div>
          </button>
        </div>
      </div>

      {/* Assignment Prompt selector in Bento Style */}
      {activeTab !== 'joined-classrooms' && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white border border-slate-200 p-4.5 rounded-2xl gap-3 shadow-sm select-container" id="student-selector">
          <div className="flex items-center gap-2.5" id="student-choice">
            <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest font-sans">Active Prompt</span>
            <select
              id="select-asg-student"
              value={selectedAsgId}
              onChange={(e) => { setSelectedAsgId(e.target.value); setSelectedPeerSubId(null); }}
              className="text-xs font-bold border border-slate-250 rounded-xl text-slate-800 bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-indigo-500/20 py-2 py-2.5 px-3.5 cursor-pointer focus:outline-hidden transition-all select-none"
            >
              {filteredAssignments.map(a => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
              {filteredAssignments.length === 0 && (
                <option value="">No enrolled classroom assignments. Enter a Class code in the Classrooms tab!</option>
              )}
            </select>
          </div>

          <div className="text-[11px] text-slate-500 font-sans leading-normal max-w-xl md:text-right" id="student-limits-info">
            Please respond with clear claims, applying respective philosophical/policy frameworks. Your reply is scored on a <strong className="text-indigo-650 font-bold">{totalMaxScore}-point</strong> integrated rubric matrix.
          </div>
        </div>
      )}

      {/* DISCUSSION ARENA VIEW */}
      {activeTab === 'discussion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="student-arena-view">
          {/* Left panel: Prompt guidelines & response editor OR submitted displays */}
          <div className="lg:col-span-8 space-y-6" id="arena-editor-col">
            {/* 1. Prompt Details Card in Bento Style */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4" id="assignment-prompt-card">
              <div className="border-b border-slate-100 pb-3" id="prompt-header">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0"></span>
                  <span className="text-[10px] text-slate-400 font-sans font-bold uppercase tracking-widest">Assignment Brief & Prompt Criteria</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mt-1 font-display tracking-tight leading-snug">{activeAssignment?.title}</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-sans bg-slate-50/50 p-4 border border-slate-100 rounded-xl">
                {activeAssignment?.description}
              </p>

              {/* Collapsible/Sleek Rubric visualizer so student knows expectations */}
              <div className="space-y-3 pt-1" id="assignment-rubrics-checklist">
                <h4 className="text-[10.5px] font-bold text-slate-400 font-sans uppercase tracking-widest">Discussion Canvas Grid Guidelines</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="student-prompt-rubrics-grid">
                  {activeAssignment?.rubric.map((rub, rIdx) => (
                    <div key={rub.id} className="p-4 bg-slate-50/60 border border-slate-150 rounded-xl hover:bg-slate-50 transition duration-150" id={`prompt-rub-card-${rIdx}`}>
                      <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-200/60 mb-2" id={`rub-head-${rIdx}`}>
                        <strong className="font-bold text-slate-800 font-display">{rub.category}</strong>
                        <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-extrabold shrink-0 border border-indigo-100/50">{rub.maxPoints} pts</span>
                      </div>
                      <p className="text-[10.5px] text-slate-500 leading-normal">{rub.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI Grading Loader Overlay */}
            {isAiGrading && (
              <div className="bg-white border border-indigo-100 rounded-2xl p-12 text-center shadow-md space-y-4 flex flex-col items-center justify-center animate-pulse" id="student-grading-loader">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <h3 className="text-base font-bold text-slate-850 font-display mt-2 text-indigo-950">AI Diagnostic Ledger Grading Is Active...</h3>
                <p className="text-xs text-slate-500 max-w-sm leading-relaxed">Applying neural semantic checks to map text structures, calculating point tallies, and writing high-fidelity critique suggestions.</p>
                <div className="flex gap-2 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100/60 text-[10px] font-mono text-indigo-700 animate-bounce">
                  <span>Evaluating: Structural Integrity & Evidence Claims</span>
                </div>
              </div>
            )}

            {/* 2. Display Input Editor (Unsubmitted State) OR Display Feedback Pages (Submitted State) */}
            {!isAiGrading && (!mySubmission || mySubmission.status === 'draft') ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 animate-fade-in" id="submission-editor">
                <div className="flex justify-between items-center" id="editor-header">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-display">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Write Assignment Response
                  </span>
                  <span className="text-[10.5px] font-mono text-slate-400 font-semibold bg-slate-100 px-2.5 py-0.5 rounded-full">
                    Chars: <strong className="text-slate-800">{editorText.length}</strong> (Minimum: 100)
                  </span>
                </div>

                {activeAssignment?.type === "research" && (
                  <div className="p-4 bg-slate-50 border border-slate-220 rounded-xl space-y-4 animate-fade-in" id="research-paper-fields-container">
                    <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-wider block">JOURNAL RESEARCH ARTIFACTS REQUIRED</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="input-journal-title" className="text-xs font-bold text-slate-800 block mb-1">Reputed Journal Paper Title</label>
                        <input
                          id="input-journal-title"
                          type="text"
                          required
                          placeholder="e.g., Attention Is All You Need (ACM/IEEE)"
                          value={journalPaperTitle}
                          onChange={(e) => setJournalPaperTitle(e.target.value)}
                          className="bg-white border border-slate-205 p-3 text-xs w-full rounded-xl text-slate-900 focus:ring-1 focus:ring-indigo-650 font-sans"
                        />
                      </div>

                      <div>
                        <label htmlFor="input-ppt-file" className="text-xs font-bold text-slate-800 block mb-1">Presentation Slides File Link / Name</label>
                        <input
                          id="input-ppt-file"
                          type="text"
                          required
                          placeholder="e.g., Attention_Slides_Deck.pptx"
                          value={pptFileName}
                          onChange={(e) => setPptFileName(e.target.value)}
                          className="bg-white border border-slate-205 p-3 text-xs w-full rounded-xl text-slate-900 focus:ring-1 focus:ring-indigo-650 font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="input-video-file" className="text-xs font-bold text-slate-800 block mb-1">Recorded Self-Presentation (Video/MP4 Filename)</label>
                        <input
                          id="input-video-file"
                          type="text"
                          required
                          placeholder="e.g., Attention_Presentation.mp4"
                          value={videoFileName}
                          onChange={(e) => setVideoFileName(e.target.value)}
                          className="bg-white border border-slate-205 p-3 text-xs w-full rounded-xl text-slate-900 focus:ring-1 focus:ring-indigo-650 font-mono"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">Allowed Format Rights (Teacher Controlled)</label>
                        <div className="flex gap-1.5 pt-1.5" id="enforced-file-pills">
                          {(activeAssignment.allowedDocTypes || ["PDF", "PPTX", "MP4"]).map(ext => (
                            <span key={ext} className="bg-slate-200 text-slate-700 font-mono text-[9px] font-bold px-2.5 py-1 rounded-md uppercase border border-slate-300">
                              .{ext}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="input-paper-gist" className="text-xs font-bold text-slate-800 block mb-1">Executive Gist (Scientific Paper summary abstract)</label>
                      <textarea
                        id="input-paper-gist"
                        rows={3}
                        required
                        placeholder="Type a highly dense academic abstract or summary of the journal's scientific breakthroughs..."
                        value={paperGist}
                        onChange={(e) => setPaperGist(e.target.value)}
                        className="bg-white border border-slate-205 p-3 text-xs w-full rounded-xl text-slate-900 focus:ring-1 focus:ring-indigo-650 font-sans"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label htmlFor="textarea-essay" className="text-[11px] font-bold text-slate-700 block mb-1">Final Critical Critique Essay (Minimum: 100 char)</label>
                  <textarea
                    id="textarea-essay"
                    rows={14}
                    value={editorText}
                    onChange={(e) => setEditorText(e.target.value)}
                    placeholder="Formulate your critical thinking, backing up claims with ethical theories or policy dynamics. Keep logic cohesive and structured..."
                    className="bg-slate-50 border border-slate-200 p-4 text-xs font-sans text-slate-800 leading-relaxed rounded-xl w-full focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all placeholder:text-slate-400 italic font-medium"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between gap-3" id="editor-actions">
                  <button
                    id="btn-save-draft"
                    type="button"
                    onClick={handleSaveDraftLocal}
                    className="px-4.5 py-2.5 hover:bg-slate-50 border border-slate-250 text-slate-700 text-xs font-bold rounded-xl transition duration-150 cursor-pointer text-center"
                  >
                    Save Draft Locally
                  </button>
                  <button
                    id="btn-submit-final"
                    type="button"
                    onClick={handleSubmitFinalEssay}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all duration-150 cursor-pointer"
                  >
                    Submit Response &bull; Request AI Grading
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : !isAiGrading && mySubmission && mySubmission.status === 'submitted' ? (
              /* SUBMITTED FORUM VIEW: My paper, AI evaluations, Peer review reports */
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm animate-fade-in" id="submitted-view-card">
                {/* Submitted sub tab bar header */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap justify-between items-center gap-3.5" id="submitted-view-subtabs">
                  <div className="flex gap-1.5" id="student-internal-tabs">
                    <button
                      id="subtab-ai-feedback"
                      onClick={() => setSubmittedSubTab('ai-feedback')}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${submittedSubTab === 'ai-feedback' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-500 hover:bg-slate-200/50'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        AI Feedback Critique
                      </div>
                    </button>
                    <button
                      id="subtab-my-text"
                      onClick={() => setSubmittedSubTab('my-text')}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${submittedSubTab === 'my-text' ? 'bg-slate-800 text-white font-bold' : 'text-slate-500 hover:bg-slate-200/50'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        My Submission Text
                      </div>
                    </button>
                    <button
                      id="subtab-all-reviews"
                      onClick={() => setSubmittedSubTab('all-reviews')}
                      className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all ${submittedSubTab === 'all-reviews' ? 'bg-teal-650 bg-teal-600 text-white font-bold' : 'text-slate-500 hover:bg-slate-200/50'}`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" />
                        Peer Reviews Received
                      </div>
                    </button>
                  </div>

                  {/* Submission date */}
                  <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">
                    LOCKED FOR ASSESS: {new Date(mySubmission.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Sub-tab 1: My original text */}
                {submittedSubTab === 'my-text' && (
                  <div className="p-6 space-y-4 animate-fade-in" id="submitted-my-text-con">
                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-xl text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-wrap italic">
                      {mySubmission.content}
                    </div>
                  </div>
                )}

                {/* Sub-tab 2: Automated AI Feedback detail elements */}
                {submittedSubTab === 'ai-feedback' && (
                  <div className="p-6 space-y-6 animate-fade-in" id="submitted-ai-feedback-con">
                    {gradingError && (
                      <div className="p-3 bg-amber-50 border border-amber-100 text-amber-950 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{gradingError}</span>
                      </div>
                    )}

                    {mySubmission.aiFeedback ? (
                      <div className="space-y-6" id="student-ai-feedback-container">
                        {/* Overall score indicator */}
                        <div className="p-6 bg-slate-900 text-white rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl border border-slate-800" id="scorecard-hero">
                          <div>
                            <div className="flex items-center gap-1.5 mb-1.5 text-indigo-300 text-xs font-bold uppercase tracking-wider font-display">
                              <Sparkles className="w-4 h-4 text-indigo-400" />
                              AI Multi-Criteria Assay Score
                            </div>
                            <h4 className="text-lg font-bold font-display tracking-tight text-white">Automated Diagnostic Grading Blueprint</h4>
                            <p className="text-[11px] text-slate-400 mt-1 max-w-md leading-relaxed">This semantic analysis maps structural claims to grade suggestions instantly against point criteria definitions.</p>
                          </div>
                          
                          <div className="px-6 py-4 bg-slate-950/80 border border-slate-800 text-center rounded-xl shrink-0" id="overall-scorecard">
                            <span className="text-[9px] block font-mono font-extrabold text-indigo-300 tracking-widest uppercase mb-0.5">TOTAL SCORE</span>
                            <span className="text-3xl font-display font-black leading-none text-white">{mySubmission.aiFeedback.overallScore}<span className="text-sm font-semibold opacity-60">/{mySubmission.aiFeedback.maxScore}</span></span>
                          </div>
                        </div>

                        {/* Criteria details mapping */}
                        <div className="space-y-3" id="ai-feedback-criteria-scores">
                          <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 font-sans">Rubrics Diagnostics Ledger</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="feedback-scores-grid">
                            {mySubmission.aiFeedback.rubricScores.map((sc, idx) => {
                              const pct = sc.maxPoints > 0 ? (sc.score / sc.maxPoints) * 100 : 0;
                              return (
                                <div key={idx} className="p-4 border border-slate-200 bg-white shadow-xs rounded-xl flex flex-col justify-between" id={`feedback-score-sc-${idx}`}>
                                  <div>
                                    <div className="flex justify-between items-center pb-2 border-b border-slate-105 gap-2" id={`feedback-score-head-${idx}`}>
                                      <strong className="text-xs font-bold text-slate-850 font-display truncate">{sc.category}</strong>
                                      <span className="text-xs font-mono font-extrabold text-indigo-650 bg-indigo-50 px-2 py-0.5 border border-indigo-100/50 rounded-md shrink-0">{sc.score} / {sc.maxPoints}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-2.5 font-sans">{sc.feedback}</p>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4 overflow-hidden" id={`feedback-score-bar-p-${idx}`}>
                                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Strengths & Improvements */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-4 border-t border-slate-250/60" id="ai-feedback-balance-panels">
                          <div className="space-y-3" id="st-strengths">
                            <h5 className="text-[10px] font-bold text-emerald-900 uppercase tracking-widest pl-1 font-sans">Strengths to Leverage</h5>
                            <div className="space-y-2.5" id={`st-gr-strs`}>
                              {mySubmission.aiFeedback.strengths.map((st, idx) => (
                                <div key={idx} className="p-4 bg-emerald-50/60 border border-emerald-100/80 rounded-xl text-emerald-950 text-xs font-semibold flex gap-2.5 items-start leading-relaxed shadow-xs" id={`feedback-strength-div-${idx}`}>
                                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                  <span>{st}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-3" id="st-improvements">
                            <h5 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest pl-1 font-sans">Critique & Revisions</h5>
                            <div className="space-y-2.5" id={`st-gr-imps`}>
                              {mySubmission.aiFeedback.improvements.map((im, idx) => (
                                <div key={idx} className="p-4 bg-indigo-50/60 border border-indigo-100/80 rounded-xl text-indigo-950 text-xs font-semibold flex gap-2.5 items-start leading-relaxed shadow-xs" id={`feedback-improvement-div-${idx}`}>
                                  <TrendingUp className="w-4 h-4 text-indigo-650 shrink-0 mt-0.5" />
                                  <span>{im}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Detailed Analysis Markdown Section */}
                        <div className="pt-4 border-t border-slate-205 space-y-3" id="ai-feedback-detailed-text">
                          <h5 className="text-[10px] font-bold text-slate-450 uppercase tracking-widest pl-1">Detailed Essay Critique Transcript</h5>
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5.5 text-xs text-slate-700 leading-relaxed font-sans space-y-4 max-h-[300px] overflow-y-auto shadow-inner">
                            {mySubmission.aiFeedback.detailedAnalysis.split("\n").map((line, lIdx) => {
                              const trimmed = line.trim();
                              if (trimmed.startsWith("###")) {
                                return <h4 key={lIdx} className="text-xs font-bold text-indigo-950 mt-4 pt-3 mb-1.5 border-b border-indigo-100 first:mt-0 pb-1 font-display uppercase tracking-wide">{trimmed.replace(/^###\s*/, "")}</h4>;
                              }
                              if (trimmed.startsWith("####")) {
                                return <h5 key={lIdx} className="text-xs font-bold text-slate-850 mt-2.5 mb-1">{trimmed.replace(/^####\s*/, "")}</h5>;
                              }
                              if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
                                return <li key={lIdx} className="ml-4 list-disc mb-1.5 pl-1 text-slate-650">{trimmed.replace(/^[\*\-]\s*/, "")}</li>;
                              }
                              if (!trimmed) return <div key={lIdx} className="h-1.5" />;
                              return <p key={lIdx} className="text-xs pb-1">{trimmed}</p>;
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-400 italic" id="feedback-absent">
                        No AI evaluative feedback records found. Request system assistance.
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-tab 3: Classmate reviews & teacher manual feedback */}
                {submittedSubTab === 'all-reviews' && (
                  <div className="p-6 space-y-6 animate-fade-in" id="submitted-reviews-con">
                    {/* Teacher Manual grade display block if exists */}
                    {mySubmission.teacherFeedback ? (
                      <div className="p-6 bg-indigo-50/70 border border-indigo-100 rounded-2xl flex items-start gap-4.5 shadow-xs" id="teacher-mark-banner">
                        <div className="p-2.5 bg-indigo-650 bg-indigo-600 text-white rounded-xl shrink-0" id="teacher-icon-wrap">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div className="space-y-1.5" id="teacher-notes">
                          <div className="flex items-center gap-2.5 animate-fade-in" id="teacher-assessment-title">
                            <h4 className="text-xs font-bold text-indigo-955 text-indigo-900 uppercase tracking-widest font-display">Verified Instructor Assessment Grade</h4>
                            <span className="font-mono font-bold text-indigo-900 px-2.5 py-0.5 bg-indigo-100 border border-indigo-200 rounded-lg text-xs shrink-0">
                              {mySubmission.teacherFeedback.grade} / {totalMaxScore} pts
                            </span>
                          </div>
                          <p className="text-xs text-indigo-900 leading-relaxed font-sans font-semibold italic">
                            &ldquo;{mySubmission.teacherFeedback.comments}&rdquo;
                          </p>
                          <span className="text-[10px] text-indigo-400 block pt-1 font-sans font-bold uppercase tracking-wider">Assessed by Dr. Vance on {new Date(mySubmission.teacherFeedback.givenAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-400 italic mb-2" id="teacher-pending">
                        Instructor manual grading verification is on the agenda. Dr. Vance has not yet overwrote your scoring.
                      </div>
                    )}

                    {/* Classmate critiques received */}
                    <div className="space-y-4" id="student-classmate-reviews">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 font-sans">Classmate Peer Reviews ({peerReviews.filter(p => p.submissionId === mySubmission.id).length})</h4>
                      
                      {peerReviews.filter(p => p.submissionId === mySubmission.id).length === 0 ? (
                        <p className="text-xs text-slate-400 italic bg-slate-50/50 p-5 rounded-xl border border-dashed border-slate-200 text-center">Classmate constructive peer submissions have not been logged yet. Check back shortly!</p>
                      ) : (
                        <div className="space-y-4" id="my-peer-reviews-list">
                          {peerReviews.filter(p => p.submissionId === mySubmission.id).map((pr, idx) => (
                            <div key={pr.id} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-3.5 hover:shadow-xs transition duration-150" id={`review-li-${idx}`}>
                              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100 animate-fade-in" id={`review-head-${idx}`}>
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-display">
                                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                                  Anonymous Peer Critique #{idx + 1}
                                </span>
                                <span className="text-[10px] text-slate-450 font-mono font-medium">
                                  {new Date(pr.submittedAt).toLocaleDateString()}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]" id={`review-scores-${idx}`}>
                                {Object.entries(pr.scores).map(([critId, scoreVal]) => {
                                  const crit = activeAssignment.rubric.find(r => r.id === critId);
                                  return (
                                    <div key={critId} className="bg-slate-50 p-2.5 border border-slate-150 rounded-xl" id={`review-chip-${critId}`}>
                                      <span className="text-slate-450 block truncate font-sans font-medium uppercase text-[9px] tracking-wide">{crit?.category || "Category"}</span>
                                      <strong className="text-slate-800 font-mono text-[11px]">{scoreVal} / {crit?.maxPoints || 30}</strong>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="text-xs space-y-2 mt-2 leading-relaxed" id={`review-comments-text-${idx}`}>
                                <p><strong className="text-emerald-800 font-display">What worked well:</strong> &ldquo;{pr.commentStrengths}&rdquo;</p>
                                <p className="pt-2 border-t border-dashed border-slate-200/60"><strong className="text-indigo-850 font-display">Constructive advice:</strong> &ldquo;{pr.commentImprovements}&rdquo;</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Right panel: Live AICoach feedback alignment tool (Visible when not submitted) */}
          <div className="lg:col-span-4" id="arena-coach-col">
            {mySubmission && mySubmission.status === 'submitted' ? (
              <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm text-center space-y-3.5 animate-fade-in" id="arena-sub-locked">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto" id="locked-icon-bubble">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-sans">Interactive Response Is Live</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-sans">Your draft response has been finalized and posted anonymously to other students in the Peer Review Center.</p>
                <div className="p-4 bg-indigo-50 border border-indigo-100/50 text-indigo-950 text-xs leading-relaxed rounded-xl text-left animate-fade-in" id="congrats-coach text font-medium">
                  <strong className="font-bold text-indigo-900 font-display block mb-1">Peer Review Active:</strong> Classmates can now view and review your essay in their Peer Review centers! Swap active profile roles in the top header to examine and review classmates' answers!
                </div>
              </div>
            ) : (
              <AICoach
                assignmentTitle={activeAssignment?.title || "Discussion Essay"}
                assignmentDescription={activeAssignment?.description || "Respond to the prompt."}
                draftContent={editorText}
                rubrics={activeAssignment?.rubric || []}
              />
            )}
          </div>
        </div>
      )}

      {/* PEER REVIEW CENTER VIEW */}
      {activeTab === 'peer-review' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="peer-review-pane">
          {/* Left Hand: classmates roster submissions listed */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm flex flex-col gap-3.5" id="classmates-entries">
            <div className="pb-3 border-b border-slate-105 flex justify-between items-center" id="classmates-header">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Anonymized Essay Roster</h3>
              <span className="text-[10px] bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-lg font-mono font-bold text-indigo-700">{classmatesSubmissions.length} Available</span>
            </div>

            {classmatesSubmissions.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 font-bold font-sans">Currently no classmates have submitted final answers. Ask other students to submit!</p>
            ) : (
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto" id="classmates-list">
                {classmatesSubmissions.map((sub, idx) => {
                  const alreadyReviewed = peerReviews.some(pr => pr.submissionId === sub.id && pr.authorId === currentStudent.id);
                  const isSelected = selectedPeerSubId === sub.id;

                  return (
                    <button
                      key={sub.id}
                      id={`btn-target-peer-${sub.id}`}
                      onClick={() => handleSelectPeerToReview(sub)}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start justify-between gap-2.5 cursor-pointer ${isSelected ? 'border-indigo-650 bg-indigo-50/40 shadow-xs' : 'border-slate-200 bg-white hover:bg-slate-50'}`}
                    >
                      <div className="min-w-0" id={`classmate-btn-info-${sub.id}`}>
                        <div className="flex items-center gap-2" id={`classmate-btn-div-${sub.id}`}>
                          <h4 className="text-xs font-bold text-slate-800 font-display">Classmate Response #{idx + 1}</h4>
                          {alreadyReviewed && (
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-0.5 font-sans">
                              <CheckCircle className="w-2.5 h-2.5" /> Reviewed
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-450 truncate mt-1.5 font-sans font-medium">{sub.content}</p>
                      </div>
                      <ArrowRight className={`w-4 h-4 shrink-0 self-center transition ${isSelected ? 'text-indigo-655 text-indigo-600' : 'text-slate-300'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Hand: selected classmate submission text and constructive review scoring form */}
          <div className="lg:col-span-8 space-y-6" id="peer-review-workspace">
            {selectedPeerSubId ? (
              (() => {
                const targetSub = submissions.find(s => s.id === selectedPeerSubId);
                if (!targetSub) return null;
                const peerIndex = classmatesSubmissions.findIndex(s => s.id === selectedPeerSubId) + 1;
                const hasReviewed = peerReviews.some(pr => pr.submissionId === targetSub.id && pr.authorId === currentStudent.id);

                return (
                  <div className="space-y-6 animate-fade-in" id="peer-critique-form-holder">
                    {/* Peer submission and metadata context */}
                    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm" id="peer-content-preview">
                      <div className="border-b border-slate-100 pb-3 mb-4" id="peer-metadata">
                        <span className="text-[9px] font-mono text-slate-400 block font-bold uppercase tracking-widest mb-1.5">ANONYMOUS CLASSROOM SUBMISSION</span>
                        <h3 className="text-sm font-bold text-slate-800 font-display">Classmate Response #{peerIndex}</h3>
                      </div>
                      
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5" id="peer-original-content">
                        <p className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed font-sans font-medium">{targetSub.content}</p>
                      </div>
                    </div>

                    {/* Critique Review Assessment form */}
                    {hasReviewed ? (
                      <div className="bg-emerald-50/40 border border-emerald-100 p-6 rounded-2xl text-center space-y-3 shadow-xs animate-fade-in" id="peer-already-reviewed">
                        <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto" id="thumbsup-critique">
                          <ThumbsUp className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs font-bold text-emerald-900 uppercase tracking-widest font-sans">Peer Evaluation Accomplished!</h4>
                        <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed font-medium">You have submitted constructive scores and qualitative remarks to Classmate Response #{peerIndex}. Select another classmate response from the sidebar roster list to leave further commentaries.</p>
                      </div>
                    ) : (
                      <form onSubmit={handlePostPeerCritique} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6 animate-fade-in" id="constructive-peer-form">
                        <div className="border-b border-slate-100 pb-3" id="form-header-row">
                          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2 font-display">
                            <MessageSquare className="w-4 h-4 text-indigo-650 text-indigo-600" />
                            Constructive Critique Rubric Scoring
                          </h4>
                          <p className="text-[11px] text-slate-450 leading-relaxed font-sans mt-1">Submit fair grades out of maximum parameters, accompanied by constructive feedback suggestions.</p>
                        </div>

                        {/* Active Instructor Guidelines Banner */}
                        <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex gap-3 text-left animate-fade-in animate-shake-none" id="active-review-criteria-banner">
                          <BookOpen className="w-4.5 h-4.5 text-indigo-600 shrink-0 mt-0.5" />
                          <div>
                            <h5 className="text-[11px] font-bold text-indigo-950 font-display uppercase tracking-wide">Instructor Feedback Guidelines</h5>
                            <p className="text-[10.5px] text-slate-600 font-sans leading-relaxed mt-1 whitespace-pre-line italic">
                              {activeAssignment?.peerReviewGuidelines || "1. Address specific paragraphs or thesis structure.\n2. Do not use inflammatory remarks or general placeholders."}
                            </p>
                          </div>
                        </div>

                        {peerSuccessMsg && (
                          <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-850 text-xs rounded-xl flex items-center gap-2" id="review-success">
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span className="font-sans font-semibold">Critique feedback successfully posted to class ledger!</span>
                          </div>
                        )}

                        {/* REAL-TIME SCRUTINY QUALITY ALERT */}
                        {moderationWarning && (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4.5 space-y-3.5 text-left animate-fade-in" id="reviewer-moderation-interactivity-card">
                            <div className="flex items-center gap-2.5" id="mod-warn-banner">
                              <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0" />
                              <div className="min-w-0">
                                <h5 className="text-xs font-bold text-amber-900 font-display">Feedback Content Scrutiny Warning</h5>
                                <p className="text-[10px] text-amber-700 font-sans mt-0.5">Automated guidelines checkers flagged potential improvements for your text.</p>
                              </div>
                            </div>

                            <div className="text-xs text-slate-750 font-sans space-y-2.5 leading-relaxed" id="mod-warn-report">
                              <p>
                                <strong className="text-amber-950 font-bold block mb-0.5">Flagged Reason:</strong>
                                {moderationWarning.flagReason}
                              </p>

                              {moderationWarning.suggestedRevision && (
                                <div className="bg-white border border-indigo-150 p-3.5 rounded-xl space-y-1.5" id="mod-warn-revision">
                                  <span className="text-[9px] font-extrabold text-indigo-600 tracking-wider block font-sans uppercase">✨ AI Polished Constructive Rewrite Suggestion</span>
                                  <p className="font-sans text-[11px] text-slate-700 leading-relaxed italic font-medium">&ldquo;{moderationWarning.suggestedRevision}&rdquo;</p>
                                  <button
                                    id="btn-apply-suggestion"
                                    type="button"
                                    onClick={() => handleSubmitBypassingModeration(true)}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-extrabold text-[11px] py-2 rounded-lg transition duration-105 cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                                  >
                                    <Sparkles className="w-3 h-3" /> Apply refined AI rewrite & submit now
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2.5 pt-1.5" id="mod-warn-action-buttons">
                              <button
                                id="btn-mod-edit-draft"
                                type="button"
                                onClick={() => setModerationWarning(null)}
                                className="flex-1 bg-white hover:bg-slate-50 border border-slate-205 text-slate-705 font-bold text-[11px] py-1.8 py-2 rounded-lg transition cursor-pointer text-center"
                              >
                                ✏️ Let me revise my commentary manually
                              </button>
                              <button
                                id="btn-mod-bypass"
                                type="button"
                                onClick={() => handleSubmitBypassingModeration(false)}
                                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] py-2 rounded-lg transition cursor-pointer text-center"
                              >
                                Submit anyway to Teacher Audit Queue
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Slide/Number input indicators for each rubric category */}
                        <div className="space-y-4" id="critique-rubrics-scoring-card">
                          <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-widest pl-1 block mb-1 font-sans">Rubric score sliders</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="slug-rubrics-grid">
                            {activeAssignment.rubric.map((r, idx) => (
                              <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between" id={`score-slide-${idx}`}>
                                <div>
                                  <div className="flex justify-between items-center text-xs pb-1 border-b border-slate-200 gap-2 mb-2" id={`score-slide-head-${idx}`}>
                                    <span className="font-bold text-slate-800 font-display">{r.category}</span>
                                    <strong className="font-mono text-indigo-700 font-extrabold shrink-0">{peerScores[r.id] || 0} <span className="text-slate-400">/ {r.maxPoints} pts</span></strong>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-normal font-sans">{r.description}</p>
                                </div>

                                <div className="flex items-center gap-3 pt-2" id={`score-slide-control-${idx}`}>
                                  <input
                                    id={`input-grade-slider-${r.id}`}
                                    type="range"
                                    min="0"
                                    max={r.maxPoints}
                                    value={peerScores[r.id] || 0}
                                    onChange={(e) => setPeerScores({ ...peerScores, [r.id]: Number(e.target.value) })}
                                    className="w-full h-1.5 bg-slate-200 accent-indigo-600 rounded-lg appearance-none cursor-pointer"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Commentary boxes */}
                        <div className="space-y-5 pt-4 border-t border-slate-100" id="qualitative-commentary-fields">
                          <span className="text-[10px] font-mono font-bold text-slate-450 uppercase tracking-widest pl-1 block font-sans">Structured Written Dialogue</span>

                          <div className="space-y-1.5">
                            <label htmlFor="input-peer-strengths" className="text-xs font-bold text-slate-800 font-display block">What worked exceptionally well in this response?</label>
                            <span className="text-[10px] text-slate-450 block font-sans">Point out logical arguments, framework compliance, style strengths...</span>
                            <textarea
                              id="input-peer-strengths"
                              rows={3}
                              required
                              value={peerGoodComments}
                              onChange={(e) => setPeerGoodComments(e.target.value)}
                              placeholder="e.g., I loved how smoothly you connected Bentham's mathematics with consumer marketing limitations, particularly in your third paragraph..."
                              className="bg-slate-50 border border-slate-200 p-3.5 text-xs font-sans w-full rounded-xl focus:ring-2 focus:ring-indigo-650/20 focus:border-indigo-600 text-slate-900 leading-relaxed outline-hidden transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label htmlFor="input-peer-improvements" className="text-xs font-bold text-slate-800 font-display block">What constructive revisions would help them elevate their claims?</label>
                            <span className="text-[10px] text-slate-450 block font-sans">Point out counterclaims they might have overlooked or grammatical transitions...</span>
                            <textarea
                              id="input-peer-improvements"
                              rows={3}
                              required
                              value={peerImproveComments}
                              onChange={(e) => setPeerImproveComments(e.target.value)}
                              placeholder="e.g., To improve further, distinguishing clearly between Kant's universal moral deontology versus transactional contract promises would make your vocabulary much cleaner..."
                              className="bg-slate-50 border border-slate-200 p-3.5 text-xs font-sans w-full rounded-xl focus:ring-2 focus:ring-indigo-650/20 focus:border-indigo-600 text-slate-900 leading-relaxed outline-hidden transition"
                            />
                          </div>
                        </div>

                        <div className="border-t border-slate-100 pt-5 flex justify-end gap-3.5" id="constructive-peer-form-submit">
                          <button
                            id="btn-cancel-critique"
                            type="button"
                            onClick={() => setSelectedPeerSubId(null)}
                            className="px-4.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl transition cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            id="btn-submit-critique"
                            type="submit"
                            disabled={isModerating}
                            className="px-5.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-75 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                          >
                            {isModerating ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                Analyzing Feedback Quality...
                              </>
                            ) : (
                              <>
                                Publish Peer Dialogue Review
                                <Send className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })()
            ) : (
              <div className="bg-slate-50/50 border border-slate-200 border-dashed rounded-2xl p-16 text-center text-slate-400" id="peer-workspace-empty">
                <Users className="w-10 h-10 text-indigo-400/80 mx-auto mb-3.5" />
                <h4 className="text-sm font-bold text-slate-800 mb-1 font-display uppercase tracking-wider">Constructive Dialogue Board</h4>
                <p className="text-xs text-slate-450 max-w-sm mx-auto px-4 font-sans font-medium leading-relaxed">Choose any classmate's anonymized submission response from your left-hand roster index to begin reading, leaving grading scores, and writing structured critique feedback notes.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* JOIN CLASSROOMS PANEL */}
      {activeTab === 'joined-classrooms' && (
        <div className="space-y-6 animate-fade-in" id="student-classrooms-panel">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Join Form Card */}
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs h-fit" id="student-join-class-card">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100" id="student-join-header">
                <Cpu className="w-5 h-5 text-indigo-650 bg-indigo-50 p-1 rounded-md mb-0.5" />
                <h4 className="text-xs font-bold text-slate-805 uppercase tracking-widest font-sans">Enroll in Academic Class Code</h4>
              </div>

              <form onSubmit={handleJoinClassroomSubmit} className="space-y-4 mt-4" id="student-join-form">
                <div>
                  <label htmlFor="input-join-code" className="text-xs font-bold text-slate-700 block mb-1">Classroom Entry Code</label>
                  <input
                    id="input-join-code"
                    type="text"
                    required
                    placeholder="e.g. CS-501, ETHICS-202"
                    value={joinClassCode}
                    onChange={(e) => setJoinClassCode(e.target.value)}
                    className="bg-slate-50 border border-slate-205 p-3 text-xs w-full rounded-xl focus:ring-1 focus:ring-indigo-600 font-mono font-bold uppercase text-slate-900 placeholder:normal-case shadow-xs"
                  />
                  <p className="text-[10px] text-slate-450 mt-1.5 font-sans leading-relaxed">Enter the registration coupon code issued by your professor to instantly see dynamic discussion prompts and participate in peer critique review portfolios.</p>
                </div>

                {joinError && (
                  <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-sans font-semibold leading-relaxed animate-shake">
                    {joinError}
                  </div>
                )}

                {joinSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-sans font-semibold leading-relaxed">
                    {joinSuccess}
                  </div>
                )}

                <button
                  id="btn-student-enroll-execute"
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-xl mt-4 transition cursor-pointer shadow-xs uppercase tracking-wide font-sans"
                >
                  Confirm Class Enrollment
                </button>
              </form>
            </div>

            {/* My Joined Classes List */}
            <div className="space-y-4" id="enrolled-classes-listings">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">My Registered Classrooms ({myClassroomCodes.length})</h4>
              
              <div className="grid grid-cols-1 gap-4" id="enrolled-classes-grid">
                {classrooms.filter(c => myClassroomCodes.includes(c.code.toUpperCase())).map(c => {
                  const classroomAssignments = assignments.filter(a => a.classroomCode === c.code);
                  return (
                    <div key={c.id} className="bg-white border border-slate-200 p-5 rounded-2xl flex flex-col justify-between hover:border-indigo-200 transition shadow-xs" id={`registered-class-${c.code}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="bg-indigo-50 border border-indigo-100 text-indigo-750 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                            {c.code}
                          </span>
                          <h5 className="text-sm font-extrabold text-slate-900 mt-2 font-display">{c.name}</h5>
                        </div>
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                          <CheckCircle className="w-3.5 h-3.5" /> Enrolled
                        </span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-[10.5px] text-slate-450 font-sans font-semibold">
                        <span>Active Topics: <strong className="text-slate-700">{classroomAssignments.length}</strong></span>
                        <span>Instructor: Faculty Lead</span>
                      </div>
                    </div>
                  );
                })}

                {myClassroomCodes.length === 0 && (
                  <div className="text-center p-12 bg-slate-50 border border-slate-200 border-dashed rounded-2xl text-slate-400 font-sans font-medium flex flex-col items-center justify-center space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-350" />
                    <span>No active classroom enrollments detected. Key in your class code above to register.</span>
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
