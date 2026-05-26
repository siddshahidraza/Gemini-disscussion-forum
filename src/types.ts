export interface RubricCriteria {
  id: string;
  category: string;
  maxPoints: number;
  description: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  rubric: RubricCriteria[];
  createdAt: string;
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
}

export interface PeerReview {
  id: string;
  submissionId: string;
  assignmentId: string;
  authorId: string;
  authorName: string;
  scores: { [categoryId: string]: number };
  commentStrengths: string;
  commentImprovements: string;
  submittedAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  role: 'teacher' | 'student';
  avatarUrl: string;
  email: string;
}
