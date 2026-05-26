import React, { useState } from "react";
import { UserProfile, Classroom } from "../types";
import { GraduationCap, BookOpen, Key, User, Plus, ArrowRight, ArrowLeft } from "lucide-react";

interface AuthScreenProps {
  profiles: UserProfile[];
  classrooms: Classroom[];
  onLogin: (user: UserProfile) => void;
  onRegisterStudent: (newStudent: UserProfile) => void;
}

export default function AuthScreen({
  profiles,
  classrooms,
  onLogin,
  onRegisterStudent
}: AuthScreenProps) {
  const [role, setRole] = useState<'student' | 'teacher'>('student');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Login Form States
  const [studentIdInput, setStudentIdInput] = useState("");
  const [staffIdInput, setStaffIdInput] = useState("");
  
  // Student Registration Form States
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regStudentId, setRegStudentId] = useState("");
  const [regClassCode, setRegClassCode] = useState("");
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmedId = studentIdInput.trim();
    if (!trimmedId) {
      setErrorMsg("Please enter your Student ID.");
      return;
    }
    
    const user = profiles.find(p => p.role === 'student' && p.studentId === trimmedId);
    if (user) {
      onLogin(user);
    } else {
      setErrorMsg(`No student found with Student ID "${trimmedId}". If you are new, please register below using the class code.`);
    }
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const trimmedId = staffIdInput.trim();
    if (!trimmedId) {
      setErrorMsg("Please enter your Staff ID.");
      return;
    }

    const user = profiles.find(p => p.role === 'teacher' && p.staffId === trimmedId);
    if (user) {
      onLogin(user);
    } else {
      setErrorMsg(`Invalid Staff ID "${trimmedId}". Teacher registration is restricted to Administrator provisioning only.`);
    }
  };

  const handleStudentRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const name = regName.trim();
    const email = regEmail.trim();
    const studentId = regStudentId.trim();
    const classCode = regClassCode.trim().toUpperCase();

    if (!name || !email || !studentId || !classCode) {
      setErrorMsg("All fields are mandatory for student registration.");
      return;
    }

    // Check duplicate studentId
    const isDuplicate = profiles.some(p => p.studentId === studentId);
    if (isDuplicate) {
      setErrorMsg(`A student with Student ID "${studentId}" is already registered. Please login instead.`);
      return;
    }

    // Check classroom code validity
    const matchedClass = classrooms.find(c => c.code.toUpperCase() === classCode);
    if (!matchedClass) {
      setErrorMsg(`Invalid Classroom Code "${classCode}". Please check with your faculty member.`);
      return;
    }

    // Create student profile
    const newStudent: UserProfile = {
      id: `stu_${Date.now()}`,
      name,
      role: 'student',
      avatarUrl: `https://images.unsplash.com/photo-${1530000000000 + Math.floor(Math.random() * 100000)}?auto=format&fit=crop&q=80&w=150`,
      email,
      studentId,
      classroomCode: classCode,
      classroomCodes: [classCode]
    };

    onRegisterStudent(newStudent);
    alert(`Registration successful! Welcome to ${matchedClass.name}.`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12" id="auth-portal-screen">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden" id="auth-card">
        
        {/* Banner header */}
        <div className="bg-indigo-900 px-6 py-8 text-center text-white relative">
          <div className="absolute top-4 left-4 bg-indigo-800/80 px-2.5 py-1 rounded-md text-[9px] font-mono uppercase tracking-wider font-semibold">
            v2.1 Pedagogy Suite
          </div>
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-md">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-xl font-bold font-display tracking-tight">Collaborative Grading Ledger</h2>
          <p className="text-xs text-indigo-200 mt-1">Classroom-Verified Peer Assessment Engine</p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            id="tab-select-student-auth"
            type="button"
            className={`w-1/2 py-3.5 text-xs font-bold tracking-wide uppercase transition ${
              role === 'student' 
                ? 'bg-white text-indigo-700 border-b-2 border-indigo-600' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => { setRole('student'); setErrorMsg(null); }}
          >
            Student Core
          </button>
          <button
            id="tab-select-teacher-auth"
            type="button"
            className={`w-1/2 py-3.5 text-xs font-bold tracking-wide uppercase transition ${
              role === 'teacher' 
                ? 'bg-white text-indigo-700 border-b-2 border-indigo-600' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
            onClick={() => { setRole('teacher'); setMode('login'); setErrorMsg(null); }}
          >
            Faculty Office
          </button>
        </div>

        <div className="p-6 md:p-8" id="auth-form-container">
          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs font-medium flex items-start gap-2" id="auth-error-banner">
              <span className="font-bold">Error:</span>
              <span>{errorMsg}</span>
            </div>
          )}

          {role === 'student' ? (
            /* Student Flow */
            mode === 'login' ? (
              <form onSubmit={handleStudentLogin} className="space-y-4" id="form-student-login">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold mb-1">Enter Student ID</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      id="input-login-student-id"
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. STU101"
                      value={studentIdInput}
                      onChange={(e) => setStudentIdInput(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  id="btn-login-student-submit"
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold font-display text-white py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm hover:shadow transition flex items-center justify-center gap-2"
                >
                  Enter Portal <ArrowRight className="w-4 h-4" />
                </button>

                <div className="text-center pt-2">
                  <button
                    id="btn-switch-to-register"
                    type="button"
                    onClick={() => { setMode('register'); setErrorMsg(null); }}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition"
                  >
                    Don't have an account yet? Register Here
                  </button>
                </div>
              </form>
            ) : (
              /* Student Register Form */
              <form onSubmit={handleStudentRegister} className="space-y-3.5" id="form-student-register">
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold mb-1">Full Name</label>
                  <input
                    id="input-reg-name"
                    type="text"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="e.g. Alex Morgan"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold mb-1">University Email Address</label>
                  <input
                    id="input-reg-email"
                    type="email"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3.5 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="alex@student.edu"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold mb-1">Student ID (Log In ID)</label>
                    <input
                      id="input-reg-studentid"
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3.5 text-sm font-mono font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g. STU125"
                      value={regStudentId}
                      onChange={(e) => setRegStudentId(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold mb-1">Classroom Code</label>
                    <input
                      id="input-reg-classcode"
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-3.5 text-sm font-mono font-bold text-slate-800 placeholder:normal-case focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none uppercase"
                      placeholder="e.g. AI-ETHICS"
                      value={regClassCode}
                      onChange={(e) => setRegClassCode(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  id="btn-register-student-submit"
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold font-display text-white py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center gap-2 mt-2"
                >
                  Create & Enroll Account <Plus className="w-4 h-4" />
                </button>

                <div className="text-center pt-1.5">
                  <button
                    id="btn-revert-login"
                    type="button"
                    onClick={() => { setMode('login'); setErrorMsg(null); }}
                    className="text-slate-500 hover:text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto transition"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Student Login
                  </button>
                </div>
              </form>
            )
          ) : (
            /* Teacher Flow */
            <form onSubmit={handleTeacherLogin} className="space-y-4" id="form-teacher-login">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-600 leading-relaxed mb-1">
                <span className="font-bold text-indigo-950 block mb-0.5">Faculty Registration Policy</span>
                Teacher registration permissions are restricted to central system administrators only. Faculty members must authenticate utilizing pre-assigned credentials.
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-widest font-semibold mb-1">Faculty Staff ID</label>
                <div className="relative">
                  <Key className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    id="input-login-staff-id"
                    type="password"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm font-semibold text-slate-850 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Enter Staff ID..."
                    value={staffIdInput}
                    onChange={(e) => setStaffIdInput(e.target.value)}
                  />
                </div>
              </div>

              <button
                id="btn-login-teacher-submit"
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold font-display text-white py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm hover:shadow transition flex items-center justify-center gap-2"
              >
                Authenticate Faculty <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick-start Test Profiles Helper Box */}
          <div className="mt-8 border-t border-slate-100 pt-5 text-left" id="test-sandbox-credentials">
            <h4 className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2">Academic Sandboxed Credentials</h4>
            <div className="space-y-1.5 text-[11px] text-slate-600">
              <div className="flex justify-between items-center bg-slate-100/60 p-1.5 px-3 rounded-lg border border-slate-200/50">
                <span className="font-semibold text-slate-700">Dr. Elizabeth Vance (Faculty)</span>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">VANCE77</span>
              </div>
              <div className="flex justify-between items-center bg-slate-100/60 p-1.5 px-3 rounded-lg border border-slate-200/50">
                <span className="font-semibold text-slate-700">Alex Morgan (Student)</span>
                <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 font-bold">STU101</span>
              </div>
              <div className="flex items-center justify-center bg-indigo-50/50 p-1.5 rounded-lg border border-indigo-100 text-[10px] text-indigo-805 text-center font-semibold uppercase tracking-wide">
                Join Classroom Code: <span className="font-mono font-bold text-indigo-700 ml-1">AI-ETHICS</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
