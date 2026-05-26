import { useState, useEffect } from "react";
import { 
  UserProfile, 
  Assignment, 
  Submission, 
  PeerReview,
  AIFeedback,
  Classroom
} from "./types";
import { initializeDatabase } from "./seedData";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";
import AuthScreen from "./components/AuthScreen";
import { 
  GraduationCap, 
  Users, 
  Sparkles, 
  RefreshCw,
  HelpCircle,
  MessageSquare,
  BookmarkCheck,
  CheckCircle2,
  Trash2,
  LogOut
} from "lucide-react";

export default function App() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [peerReviews, setPeerReviews] = useState<PeerReview[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load database from localStorage on startup
  useEffect(() => {
    initializeDatabase();
    
    const storedProfiles = JSON.parse(localStorage.getItem("pforum_profiles") || "[]");
    const storedClassrooms = JSON.parse(localStorage.getItem("pforum_classrooms") || "[]");
    const storedAssignments = JSON.parse(localStorage.getItem("pforum_assignments") || "[]");
    const storedSubmissions = JSON.parse(localStorage.getItem("pforum_submissions") || "[]");
    const storedPeerReviews = JSON.parse(localStorage.getItem("pforum_peer_reviews") || "[]");
    const storedCurrentUser = JSON.parse(localStorage.getItem("pforum_current_user") || "null");

    setProfiles(storedProfiles);
    setClassrooms(storedClassrooms);
    setAssignments(storedAssignments);
    setSubmissions(storedSubmissions);
    setPeerReviews(storedPeerReviews);
    setCurrentUser(storedCurrentUser); 
    setHydrated(true);
  }, []);

  // Update localStorage whenever state updates
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("pforum_profiles", JSON.stringify(profiles));
    localStorage.setItem("pforum_classrooms", JSON.stringify(classrooms));
    localStorage.setItem("pforum_assignments", JSON.stringify(assignments));
    localStorage.setItem("pforum_submissions", JSON.stringify(submissions));
    localStorage.setItem("pforum_peer_reviews", JSON.stringify(peerReviews));
    localStorage.setItem("pforum_current_user", JSON.stringify(currentUser));
  }, [profiles, classrooms, assignments, submissions, peerReviews, currentUser, hydrated]);

  const handleProfileSwitch = (profileId: string) => {
    const target = profiles.find(p => p.id === profileId);
    if (target) {
      setCurrentUser(target);
    }
  };

  const handleAddClassroom = (newClass: Classroom) => {
    setClassrooms([newClass, ...classrooms]);
  };

  const handleRegisterStudent = (newStudent: UserProfile) => {
    setProfiles([...profiles, newStudent]);
    setCurrentUser(newStudent);
  };

  const handleJoinClassroom = (classCode: string): boolean => {
    if (!currentUser) return false;
    const cleanedCode = classCode.trim().toUpperCase();
    const classExists = classrooms.some(c => c.code === cleanedCode);
    if (!classExists) {
      return false;
    }
    
    const updatedProfiles = profiles.map(p => {
      if (p.id === currentUser.id) {
        const codes = p.classroomCodes || [];
        if (!codes.includes(cleanedCode)) {
          return { ...p, classroomCodes: [...codes, cleanedCode] };
        }
      }
      return p;
    });
    setProfiles(updatedProfiles);
    
    const updatedUser = updatedProfiles.find(p => p.id === currentUser.id);
    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
    return true;
  };

  const handleLogout = () => {
    setCurrentUser(null);
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
            givenAt: new Date().toISOString(),
            crossChecked: true
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
  const handleSaveDraft = (assignmentId: string, content: string, extraFields?: Partial<Submission>) => {
    if (!currentUser) return;
    
    const existing = submissions.find(s => s.assignmentId === assignmentId && s.studentId === currentUser.id);
    
    if (existing) {
      const updated = submissions.map(s => {
        if (s.id === existing.id) {
          return { ...s, content, submittedAt: new Date().toISOString(), ...extraFields };
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
        teacherFeedback: null,
        ...extraFields
      };
      setSubmissions([...submissions, newSubmission]);
    }
  };

  // Final Submit Response (Student Action)
  const handleSubmitSubmission = (
    assignmentId: string, 
    content: string, 
    aiFeedback: AIFeedback | null,
    extraFields?: Partial<Submission>
  ) => {
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
            aiFeedback,
            ...extraFields
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
        teacherFeedback: null,
        ...extraFields
      };
      setSubmissions([...submissions, newSubmission]);
    }
  };

  // Save Peer Review critique response
  const handleSubmitPeerReview = (newReview: PeerReview) => {
    setPeerReviews([...peerReviews, newReview]);
  };

  // Update/Delete Peer Reviews (Teacher Action for Moderation)
  const handleUpdatePeerReviews = (updatedReviews: PeerReview[]) => {
    setPeerReviews(updatedReviews);
  };

  const handleResetDatabase = () => {
    if (window.confirm("Restore platform to default assignment prompts, student drafts, and peer critique scores? All custom changes will be overwritten.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans" id="app-loading">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-800">Booting Collaborative Discussion Ledger...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthScreen
        profiles={profiles}
        classrooms={classrooms}
        onLogin={setCurrentUser}
        onRegisterStudent={handleRegisterStudent}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16 font-sans antialiased" id="forum-root">
      {/* Platform Navigation Header Bar */}
      <nav id="header-navigation-bar" className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-slate-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3" id="brand-logo-id">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold font-display" id="brand-graphic-logo">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0" id="brand-words">
              <h1 className="text-base font-bold text-slate-800 font-display tracking-tight leading-none">Pedagogy Suite</h1>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-sans">DiscoursAI Engine</span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0" id="role-swapping-box">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:inline shrink-0">Testing Persona</span>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200" id="personas-capsule">
              <select
                id="select-user-role-global"
                value={currentUser.id}
                onChange={(e) => handleProfileSwitch(e.target.value)}
                className="bg-white border-none focus:ring-0 text-xs font-bold text-slate-700 py-1 px-2.5 rounded-lg shadow-xs cursor-pointer focus:outline-hidden"
              >
                {profiles.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.role === 'teacher' ? 'Dr.' : 'Student:'} {p.name}
                  </option>
                ))}
              </select>

              <div className="w-8 h-8 rounded-full border-2 border-indigo-100 shrink-0 overflow-hidden" id="persona-indicator-avatar">
                <img 
                  src={currentUser.avatarUrl} 
                  alt={currentUser.name} 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>

            {/* Logout Button */}
            <button
              id="btn-logout-ledger"
              onClick={handleLogout}
              title="Log Out Session"
              className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Reset seed button */}
            <button
              id="btn-reset-ledger"
              onClick={handleResetDatabase}
              title="Restore Default Roster"
              className="p-2 border border-slate-200 hover:border-slate-300 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-red-600 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6" id="forum-main-body">
        {/* Dynamic Instructional Tips Block based on switched profile for testing */}
        <div className="bg-indigo-50 text-indigo-950 border border-indigo-100 rounded-2xl p-5 flex gap-4 items-start mb-6 shadow-xs" id="platform-instructional-tip">
          <div className="w-8 h-8 rounded-full bg-indigo-100/80 flex items-center justify-center shrink-0 text-indigo-700 mt-0.5" id="tip-icon-group">
            <HelpCircle className="w-5 h-5 shrink-0" />
          </div>
          <div className="text-xs leading-relaxed" id="tip-text">
            {currentUser.role === 'teacher' ? (
              <p>
                <strong className="text-indigo-900 font-bold font-display">Academic Lead Perspective ({currentUser.name}):</strong> You are in teacher view! Monitor student rosters, create new discussion prompts with score metrics under <strong>"New Assignment"</strong>, check class analytics under <strong>"Critique Analytics"</strong>, or click any student submission in the <strong>"Grading Portal"</strong> to evaluate their logic against the rubrics or overwrite final scores!
              </p>
            ) : (
              <p>
                <strong className="text-indigo-900 font-bold font-display">Classroom Peer Representative ({currentUser.name}):</strong> You are in student view! Read topic prompts, draft arguments using the <strong>"AI Rubric Alignment Coach"</strong> on your right, or finalize your essay to trigger immediate AI multi-rubrics grading. You can also head over to <strong>"Critique Peers Anonymously"</strong> to read classmates' essays and grade them!
              </p>
            )}
            <p className="text-[10px] mt-1.5 text-indigo-400 font-semibold tracking-wide uppercase">
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
            classrooms={classrooms}
            onAddAssignment={handleAddAssignment}
            onAddClassroom={handleAddClassroom}
            onGradeSubmission={handleGradeSubmission}
            onAIEvaluateSubmission={handleAIEvaluateSubmission}
            onUpdatePeerReviews={handleUpdatePeerReviews}
          />
        ) : (
          <StudentDashboard
            currentStudent={currentUser}
            assignments={assignments}
            submissions={submissions}
            peerReviews={peerReviews}
            classrooms={classrooms}
            onSubmitSubmission={handleSubmitSubmission}
            onSaveDraft={handleSaveDraft}
            onSubmitPeerReview={handleSubmitPeerReview}
            onJoinClassroom={handleJoinClassroom}
          />
        )}
      </main>
    </div>
  );
}
