export interface RubricCriteria {
  id: string;
  category: string;
  maxPoints: number;
  description: string;
}

export interface AIEmphasisPriorities {
  grammar: 'low' | 'medium' | 'high';
  structure: 'low' | 'medium' | 'high';
  contentAccuracy: 'low' | 'medium' | 'high';
  criticalAnalysis: 'low' | 'medium' | 'high';
  creativity: 'low' | 'medium' | 'high';
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  rubric: RubricCriteria[];
  createdAt: string;
  emphasisPriorities?: AIEmphasisPriorities;
  peerReviewGuidelines?: string;
  learningObjectives?: string;
  // Engineering additions
  type?: 'essay' | 'research' | 'project'; // 'essay' is default, 'research' represents synthesis + PPT + Presentation Recording
  minReviews?: number; // Minimum number of peer reviewers (e.g. 3 or 4)
  allowedDocTypes?: string[]; // Teacher-specified allowed files e.g. ["PDF", "PPTX", "MP4", "DOCX"]
  classroomCode?: string; // Code of the classroom this assignment was created in
}

export interface RubricScore {
  category: string;
  score: number;
  maxPoints: number;
  feedback: string;
}

export interface AIFeedback {
  overallScore: number;
  maxScore: number;
  rubricScores: RubricScore[];
  strengths: string[];
  improvements: string[];
  detailedAnalysis: string; // Markdown text
  sentiment: 'constructive' | 'excellent' | 'needs_work';
  generatedAt: string;
}

export interface TeacherFeedback {
  grade: number;
  comments: string;
  givenAt: string;
  crossChecked?: boolean; // Set to true when teacher cross-checks peer grades and approves/overrides
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  avatarUrl: string;
  content: string;
  status: 'draft' | 'submitted';
  submittedAt: string;
  aiFeedback: AIFeedback | null;
  teacherFeedback: TeacherFeedback | null;
  
  // High-performance rich research assets
  journalPaperTitle?: string;
  paperGist?: string;
  pptFileName?: string;
  videoFileName?: string;
  uploadedFiles?: { name: string; type: string; size: string }[];
  classroomCode?: string; // Links assignment classrooms
}

export interface PeerReview {
  id: string;
  submissionId: string;
  assignmentId: string;
  authorId: string;
  authorName: string;
  reviewerName?: string;
  scores: { [categoryId: string]: number };
  scoreGiven?: number;
  commentStrengths: string;
  commentImprovements: string;
  submittedAt: string;
  isFlagged?: boolean;
  flagReason?: string;
  suggestedRevision?: string;
  flagCheckedByTeacher?: boolean;
  qualityRating?: 'excellent' | 'satisfactory' | 'needs_improvement';
}

export interface Classroom {
  id: string;
  name: string;
  code: string;
  teacherId: string;
  allowedDocTypes: string[];
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  avatarUrl: string;
  email: string;
  studentId?: string; // Used for registration
  staffId?: string; // Used for teachers
  classroomCode?: string; // For students joining classrooms
  classroomCodes?: string[]; // Multiple classroom codes enrolled
}

