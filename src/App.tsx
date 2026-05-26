import { useState, useEffect } from "react";
import { 
  UserProfile, 
  Assignment, 
  Submission, 
  PeerReview,
  AIFeedback 
} from "./types";
import { initializeDatabase } from "./seedData";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";
import { 
  GraduationCap, 
  Users, 
  Sparkles, 
  RefreshCw,
  HelpCircle,
  MessageSquare,
  BookmarkCheck,
  CheckCircle2,
  Trash2
} from "lucide-react";

export default function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load database from localStorage on startup
  useEffect(() => {
    initializeDatabase();
    
    const storedProfiles = JSON.parse(localStorage.getItem("pforum_profiles") || "[]");
    const storedAssignments = JSON.parse(localStorage.getItem("pforum_assignments") || "[]");
    const storedSubmissions = JSON.parse(localStorage.getItem("pforum_submissions") || "[]");
    const storedPeerReviews = JSON.parse(localStorage.getItem("pforum_peer_reviews") || "[]");
    const storedCurrentUser = JSON.parse(localStorage.getItem("pforum_current_user") || "null");

    setProfiles(storedProfiles);
    setAssignments(storedAssignments);
    setSubmissions(storedSubmissions);
    setPeerReviews(storedPeerReviews);
    setCurrentUser(storedCurrentUser || storedProfiles[1]); // Default to student Alex
    setHydrated(true);
  }, []);

  // Update localStorage whenever state updates
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("pforum_profiles", JSON.stringify(profiles));
    localStorage.setItem("pforum_assignments", JSON.stringify(assignments));
    localStorage.setItem("pforum_submissions", JSON.stringify(submissions));
    localStorage.setItem("pforum_peer_reviews", JSON.stringify(peerReviews));
    if (currentUser) {
      localStorage.setItem("pforum_current_user", JSON.stringify(currentUser));
    }
  }, [profiles, assignments, submissions, peerReviews, currentUser, hydrated]);

  const handleProfileSwitch = (profileId: string) => {
    const target = profiles.find(p => p.id === profileId);
    if (target) {
      setCurrentUser(target);
    }
  };

  // Add Assignment (Teacher Action)
  const handleAddAssignment = (newAssignment: Assignment) => {
    setAssignments([newAssignment, ...assignments]);
  };

  // Grade/Feedback save (Teacher Action)
  const handleGradeSubmission = (submissionId: string, grade: number, comments: string) => {
    const updated = submissions.map(sub => {
      if (sub.id === submissionId) {
        return {
          ...sub,
          teacherFeedback: {
            grade,
            comments,
            givenAt: new Date().toISOString()
          }
        };
      }
      return sub;
    });
    setSubmissions(updated);
  };

  // AI Evaluation completed (Teacher or Student Action)
  const handleAIEvaluateSubmission = (submissionId: string, updatedAIFeedback: AIFeedback) => {
    const updated = submissions.map(sub => {
      if (sub.id === submissionId) {
        return {
          ...sub,
          aiFeedback: updatedAIFeedback
        };
      }
      return sub;
    });
    setSubmissions(updated);
  };

  // Save Draft (Student Action)
  const handleSaveDraft = (assignmentId: string, content: string) => {
    if (!currentUser) return;
    
    const existing = submissions.find(s => s.assignmentId === assignmentId && s.studentId === currentUser.id);
    
    if (existing) {
      const updated = submissions.map(s => {
        if (s.id === existing.id) {
          return { ...s, content, submittedAt: new Date().toISOString() };
        }
        return s;
      });
      setSubmissions(updated);
    } else {
      const newSubmission: Submission = {
        id: `sub_${Date.now()}`,
        assignmentId,
        studentId: currentUser.id,
        studentName: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        content,
        status: 'draft',
        submittedAt: new Date().toISOString(),
        aiFeedback: null,
        teacherFeedback: null
      };
      setSubmissions([...submissions, newSubmission]);
    }
  };

  // Final Submit Response (Student Action)
  const handleSubmitSubmission = (assignmentId: string, content: string, aiFeedback: AIFeedback | null) => {
    if (!currentUser) return;

    const existingId = submissions.find(s => s.assignmentId === assignmentId && s.studentId === currentUser.id)?.id;
    
    if (existingId) {
      const updated = submissions.map(s => {
        if (s.id === existingId) {
          return {
            ...s,
            content,
            status: 'submitted' as const,
            submittedAt: new Date().toISOString(),
            aiFeedback
          };
        }
        return s;
      });
      setSubmissions(updated);
    } else {
      const newSubmission: Submission = {
        id: `sub_${Date.now()}`,
        assignmentId,
        studentId: currentUser.id,
        studentName: currentUser.name,
        avatarUrl: currentUser.avatarUrl,
        content,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        aiFeedback,
        teacherFeedback: null
      };
      setSubmissions([...submissions, newSubmission]);
    }
  };

  // Save Peer Review critique response
  const handleSubmitPeerReview = (newReview: PeerReview) => {
    setPeerReviews([...peerReviews, newReview]);
  };

  const handleResetDatabase = () => {
    if (window.confirm("Restore platform to default assignment prompts, student drafts, and peer critique scores? All custom changes will be overwritten.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!hydrated || !currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans" id="app-loading">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-800">Booting Collaborative Discussion Ledger...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans antialiased" id="forum-root">
      {/* Platform Navigation Header Bar */}
      <nav id="header-navigation-bar" className="bg-white border-b border-gray-200 shadow-xs sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-4">
            {/* Logo Brand Title */}
            <div className="flex items-center gap-2.5 min-w-0" id="brand-logo-id">
              <div className="p-1.5 bg-slate-900 text-amber-400 rounded-lg shrink-0" id="brand-graphic-logo">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div className="min-w-0" id="brand-words">
                <h1 className="text-sm font-extrabold text-slate-950 font-sans tracking-tight truncate leading-none">Pedagogy Suite</h1>
                <span className="text-[10px] text-gray-500 font-medium font-sans">AI Rubrics Analysis & Peer Review</span>
              </div>
            </div>

            {/* Live Role-Switcher Drawer in Header */}
            <div className="flex items-center gap-3 shrink-0" id="role-swapping-box">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider hidden md:inline shrink-0">Testing Persona:</span>
              <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-xl border border-gray-200" id="personas-capsule">
                <select
                  id="select-user-role-global"
                  value={currentUser.id}
                  onChange={(e) => handleProfileSwitch(e.target.value)}
                  className="bg-white border-none focus:ring-0 text-xs font-bold text-slate-900 py-1.5 px-3 rounded-lg shadow-inner cursor-pointer"
                >
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.role === 'teacher' ? 'Dr.' : 'Student:'} {p.name}
                    </option>
                  ))}
                </select>

                <div className="w-7 h-7 rounded-lg border border-white shrink-0 overflow-hidden" id="persona-indicator-avatar">
                  <img 
                    src={currentUser.avatarUrl} 
                    alt={currentUser.name} 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Reset seed button */}
              <button
                id="btn-reset-ledger"
                onClick={handleResetDatabase}
                title="Restore Default Roster"
                className="p-2 border border-gray-200 hover:border-gray-300 rounded-xl hover:bg-gray-50 text-gray-400 hover:text-red-600 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6" id="forum-main-body">
        {/* Dynamic Instructional Tips Block based on switched profile for testing */}
        <div className="bg-amber-100-style bg-amber-50 text-amber-900 border border-amber-100 rounded-xl p-4 flex gap-3 items-start mb-6" id="platform-instructional-tip">
          <HelpCircle className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" />
          <div className="text-[11.5px] leading-relaxed" id="tip-text">
            {currentUser.role === 'teacher' ? (
              <p>
                <strong>Academic Lead Perspective ({currentUser.name}):</strong> You are in teacher view! Monitor student rosters, create new discussion prompts with score metrics under <strong>"New Assignment"</strong>, check class analytics under <strong>"Critique Analytics"</strong>, or click any student submission in the <strong>"Grading Portal"</strong> to evaluate their logic against the rubrics or overwrite final scores!
              </p>
            ) : (
              <p>
                <strong>Classroom Peer Representative ({currentUser.name}):</strong> You are in student view! Read topic prompts, draft arguments using the <strong>"AI Rubric Alignment Coach"</strong> on your right, or finalize your essay to trigger immediate AI multi-rubrics grading. You can also head over to <strong>"Critique Peers Anonymously"</strong> to read classmates' essays and grade them!
              </p>
            )}
            <p className="text-[10.5px] mt-1.5 text-gray-500 italic">
              *Pro-Tip: Switch accounts in the header to pretend to be a classmate and exchange critique reviews instantly in real-time!
            </p>
          </div>
        </div>

        {/* Dynamic Switch matching current logged-in role dashboard */}
        {currentUser.role === 'teacher' ? (
          <TeacherDashboard
            assignments={assignments}
            submissions={submissions}
            peerReviews={peerReviews}
            onAddAssignment={handleAddAssignment}
            onGradeSubmission={handleGradeSubmission}
            onAIEvaluateSubmission={handleAIEvaluateSubmission}
          />
        ) : (
          <StudentDashboard
            currentStudent={currentUser}
            assignments={assignments}
            submissions={submissions}
            peerReviews={peerReviews}
            onSubmitSubmission={handleSubmitSubmission}
            onSaveDraft={handleSaveDraft}
            onSubmitPeerReview={handleSubmitPeerReview}
          />
        )}
      </main>
    </div>
  );
}
