import { Assignment, Submission, PeerReview, UserProfile } from "./types";

export const SEED_PROFILES: UserProfile[] = [
  {
    id: "vance_teacher",
    name: "Dr. Elizabeth Vance",
    role: "teacher",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
    email: "e.vance@education.edu",
    staffId: "VANCE77"
  },
  {
    id: "alex_morgan",
    name: "Alex Morgan",
    role: "student",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150",
    email: "alex.m@student.edu",
    studentId: "STU101",
    classroomCode: "AI-ETHICS"
  },
  {
    id: "sophia_chen",
    name: "Sophia Chen",
    role: "student",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
    email: "sophia.c@student.edu",
    studentId: "STU102",
    classroomCode: "AI-ETHICS"
  },
  {
    id: "mateo_rodriguez",
    name: "Mateo Rodriguez",
    role: "student",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    email: "mateo.r@student.edu",
    studentId: "STU103",
    classroomCode: "AI-ETHICS"
  }
];

export const SEED_CLASSROOMS = [
  {
    id: "class_ethics_101",
    name: "Autonomous Systems Ethics (AI-101)",
    code: "AI-ETHICS",
    teacherId: "vance_teacher",
    allowedDocTypes: ["PDF", "PPTX", "MP4", "DOCX"],
    createdAt: "2026-05-19T08:00:00Z"
  }
];

export const SEED_ASSIGNMENTS: Assignment[] = [
  {
    id: "asg_1_ai_ethics",
    title: "Ethical Dilemmas in Autonomous AI Systems",
    description: "Autonomous algorithms (such as self-driving cars or clinical diagnostic systems) often face high-stakes decisional matrices. If a split-second collision is unavoidable, should a self-driving vehicle's algorithm prioritize passenger safety above all else, or execute actions that minimize overall human casualties (utilitarian approach)? Discuss this scenario by applying both Utilitarian and Deontological (duty-based) ethical frameworks. Cite real-world or theoretical counterexamples, such as the Trolley Problem, to enrich your argumentation.",
    createdAt: "2026-05-20T09:00:00Z",
    learningObjectives: "Apply ethical theories (utilitarianism, deontology) to complex autonomous decision-making scenarios. Synthesize opposing views and formulate a balanced public safety recommendation.",
    peerReviewGuidelines: "1. Respectful constructive tone.\n2. Pinpoint exactly one logical strength in their deontology application.\n3. Critique whether there is sufficient evidence regarding Bentham's casualty minimization.\n4. Avoid one-word answers like 'agreed' or comments lacking reasoning.",
    type: "essay",
    minReviews: 3,
    classroomCode: "AI-ETHICS",
    allowedDocTypes: ["PDF", "DOCX"],
    emphasisPriorities: {
      grammar: "medium",
      structure: "high",
      contentAccuracy: "high",
      criticalAnalysis: "high",
      creativity: "medium"
    },
    rubric: [
      {
        id: "philosophy_grounding",
        category: "Philosophical Frameworks",
        maxPoints: 30,
        description: "Accurate application and description of Utilitarianism and Deontology."
      },
      {
        id: "logical_cohesion",
        category: "Argumentation & Evidence",
        maxPoints: 30,
        description: "Consistency of reasoning, depth of claims, and strength of supporting evidence or theoretical scenarios."
      },
      {
        id: "grammar_style",
        category: "Tone, Grammar & Structure",
        maxPoints: 20,
        description: "Academic prose, clear organizational structure, grammar, and precise paragraphs."
      },
      {
        id: "peer_review_value",
        category: "Constructiveness of Peer Review",
        maxPoints: 20,
        description: "Ability to evaluate others with objective, thorough, actionable feedback that fosters learning."
      }
    ]
  },
  {
    id: "asg_2_climate_funding",
    title: "Climate Adaptation vs. Mitigation in Developing Nations",
    description: "As globally rising ocean levels and changing weather patterns continue to accelerate environmental strain, policy developers are in deep discussion about allocation. Critically evaluate whether regional governments of developing nations should devote the majority of their primary climate budget to Mitigation (investing in renewable transitions, carbon traps, zero-emission transits) or Adaptation (building seawalls, reinforcing drainage grids, introducing drought-impervious agriculture). Consider funding limits, economic compromises, and international climate justice in your response.",
    createdAt: "2026-05-22T10:30:00Z",
    learningObjectives: "Evaluate policy adaptation budgets against mitigating infrastructure initiatives. Analyze international climate justice trends and resource bounds.",
    peerReviewGuidelines: "1. Focus on economic and policy realism. Evaluate whether classmate's financing claims are viable.\n2. Suggest at least one specific adaptation metric (e.g. seawalls, crop types) to expand their argument.\n3. Maintain an encouraging and academically helpful prose style.",
    type: "essay",
    minReviews: 3,
    classroomCode: "AI-ETHICS",
    allowedDocTypes: ["PDF"],
    emphasisPriorities: {
      grammar: "medium",
      structure: "medium",
      contentAccuracy: "high",
      criticalAnalysis: "high",
      creativity: "low"
    },
    rubric: [
      {
        id: "economic_realism",
        category: "Economic & Policy Realism",
        maxPoints: 35,
        description: "Evaluates policy decisions with economic boundaries, infrastructure complexity, and local limits in mind."
      },
      {
        id: "justice_perspective",
        category: "Climate Justice & Equity",
        maxPoints: 35,
        description: "Addresses geographic disproportion, historical emission trends, and resource equity."
      },
      {
        id: "presentation_flow",
        category: "Grammar & Thesis Development",
        maxPoints: 30,
        description: "Formulates a single sharp defense line, supported by standard logical structures."
      }
    ]
  }
];

export const SEED_SUBMISSIONS: Submission[] = [
  {
    id: "sub_sophia_ethics",
    assignmentId: "asg_1_ai_ethics",
    studentId: "sophia_chen",
    studentName: "Sophia Chen",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=150",
    content: "When analyzing split-second ethical decisions for autonomous self-driving vehicles, we encounter a modern manifestation of Philippa Foot's classic Trolley Problem. I argue that of the two primary choices—passenger preservation or casualty minimization—automotive algorithms must strictly adhere to a utilitarian baseline focused on casualty minimization, modified under deontological constraints regarding active harm.\n\nFrom a purely utilitarian standpoint as articulated by Jeremy Bentham and John Stuart Mill, the morally correct action is that which maximizes total system utility, commonly calculated as the greatest good for the greatest number. In a split-second conflict where a passenger vehicle must choose between swerving into a concrete barricade (killing its single occupant) or maintaining course (colliding with three pedestrians), the passenger-protection heuristic would sacrifice three lives to save one. This yields a net loss of human life, which is philosophically indefensible under a quantitative calculus of suffering.\n\nHowever, a pure utilitarian rule creates public insecurity; few would buy a vehicle programmed to actively sacrifice them in rare crises. Here, Immanuel Kant's deontological framework provides an essential corrective constraint. Kant's Categorical Imperative dictates that we must treat individuals as ends in themselves, rather than as mere means to an end. Programmatic swerving to kill a bystander to preserve a passenger violates deontological duty. Therefore, the vehicle should not execute active redirections targeting innocent bystanders, but should apply maximum braking forces within its path of travel, operating with a duty-bound minimization rule that acts passively rather than actively deciding who lives and dies.",
    status: "submitted",
    submittedAt: "2026-05-24T14:22:00Z",
    aiFeedback: {
      overallScore: 92,
      maxScore: 100,
      rubricScores: [
        {
          category: "Philosophical Frameworks",
          score: 29,
          maxPoints: 30,
          feedback: "Excellent contrast between Utilitarian calculation and Kant's corrective action constraint. Very precise terminology."
        },
        {
          category: "Argumentation & Evidence",
          score: 28,
          maxPoints: 30,
          feedback: "Extremely strong thesis. The distinction between active redirection and passive breaking is highly logical."
        },
        {
          category: "Tone, Grammar & Structure",
          score: 19,
          maxPoints: 20,
          feedback: "Sophisticated vocabulary and impeccable structure. Reads like a publishing draft."
        },
        {
          category: "Constructiveness of Peer Review",
          score: 16,
          maxPoints: 20,
          feedback: "Pending performance. Peer reviews from Sophia are positive but can benefit from more rigorous logical stress testing of classmates."
        }
      ],
      strengths: [
        "Incredible handling of complex ethical theories (Kant, Bentham) with logical harmony.",
        "Introduced the active vs. passive redirections distinction, which resolves the utilitarian marketing paradox beautifully."
      ],
      improvements: [
        "Include more concrete discussion of digital sensor telemetry limitations in split-second calculations.",
        "Review how legal liability framework overlaps could impact the Kantian duty argument."
      ],
      detailedAnalysis: `### Thorough Assessment Review

This submission showcases an outstanding scholarly perspective on autonomous AI ethics. By grounding the decision metrics in a multi-theoretic frame, the author constructs an analytical reconciliation between Bentham's raw mathematical calculus and Kant's imperative against objectifying human lives.

#### Strengths of Argumentation
The thesis is clearly laid out in the introduction. The author correctly identifies that while raw utilitarianism is mathematically optimal for casualty minimization, it introduces deep consumer friction. The implementation of a Kantian "deontological handbrake"—allowing passive braking but prohibiting aggressive redirection into external bystanders—successfully addresses this dilemma.

#### Technical and Theoretical Integrity
The conceptual vocabulary is appropriate for university-level philosophy of computer science. There is proper reference to Philippa Foot's foundation work and the categorical imperative. For further improvement, the student might explore the corporate responsibility angle—how proprietary manufacturer weights are legally categorized under current public highway safety bylaws.`,
      sentiment: "excellent",
      generatedAt: "2026-05-24T14:23:15Z"
    },
    teacherFeedback: null
  },
  {
    id: "sub_mateo_ethics",
    assignmentId: "asg_1_ai_ethics",
    studentId: "mateo_rodriguez",
    studentName: "Mateo Rodriguez",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
    content: "The ethics of self-driving cars is super complicated. I think we have to prioritize the passenger because the person inside bought the car and expects the computer to keep them safe. If cars were programmed to crash themselves, nobody would purchase them.\n\nLooking at Deontology, we have a duty to fulfill our promises. When you buy a product, the company has an implied contract to protect you. Swerving to hit someone else instead of hitting a wall might violate that, but sacrificing your own customer is bad business ethics. Utilitarianism is nice on paper but in the real world, you cannot measure happiness points easily in a millisecond. We should focus on making sensors better so the car never gets into these situations in the first place.",
    status: "submitted",
    submittedAt: "2026-05-25T11:05:00Z",
    aiFeedback: {
      overallScore: 71,
      maxScore: 100,
      rubricScores: [
        {
          category: "Philosophical Frameworks",
          score: 19,
          maxPoints: 30,
          feedback: "Recognizes the marketing dilemma but gets deontology partially confused with contract law. Needs deeper integration of Kantian duty principles."
        },
        {
          category: "Argumentation & Evidence",
          score: 21,
          maxPoints: 30,
          feedback: "Maintains a consistent focus on consumer expectations, but bypasses the central pedestrian casualty minimization challenge outlined in the prompt."
        },
        {
          category: "Tone, Grammar & Structure",
          score: 15,
          maxPoints: 20,
          feedback: "Written in a highly conversational tone. Try using academic terminology (e.g., 'categorical imperatives' instead of 'promises')."
        },
        {
          category: "Constructiveness of Peer Review",
          score: 16,
          maxPoints: 20,
          feedback: "Peer review contribution is underway. Participation is steady."
        }
      ],
      strengths: [
        "Strong practical perspective regarding manufacturer promises and real-world consumer behavior.",
        "Good practical observation that improving sensor thresholds is the ideal systemic solution."
      ],
      improvements: [
        "Differentiate clearly between deontological philosophical obligations and general business contracts.",
        "Refine conversational phrases (e.g. 'super complicated', 'nice on paper') into formal academic structure."
      ],
      detailedAnalysis: `### Conceptual Alignment and Critical Analysis Feedback

This paper introduces a welcome dose of realistic product engineering concerns. The core thesis—that a self-destructive vehicle would destroy public adoption—is a real-world constraint that purist philosophical approaches often overlook.

#### Conceptual Adjustments
However, the application of deontological ethics requires correction. Deontology as founded by Kant deals with universalizable moral laws, not contract agreements or commercial transactions. A duty to protect your client is a professional duty, but sacrificing multiple bystanders to save one client might violate Kant's supreme moral law (as it values local safety over universal human worth). 

#### Elevating Academic Prose
The structure is functional but reads a bit too informally. Try substituting colloquial sentences with structured analytic arguments. For example, instead of 'Utilitarianism is nice on paper', write 'Utilitarian frameworks encounter significant operational challenges due to the difficulty of quantifying utility metrics in high-velocity scenarios.'`,
      sentiment: "constructive",
      generatedAt: "2026-05-25T11:06:40Z"
    },
    teacherFeedback: {
      grade: 75,
      comments: "Good, relatable perspective on consumer expectations, Mateo. I agree that sensors are our first line of defense. However, please revise your description of Deontology for of our next midterm review. Check Sophia's commentary on Kant's rule of treating people as ends.",
      givenAt: "2026-05-25T16:45:00Z"
    }
  },
  {
    id: "sub_alex_ethics_draft",
    assignmentId: "asg_1_ai_ethics",
    studentId: "alex_morgan",
    studentName: "Alex Morgan",
    avatarUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150",
    content: "My thoughts: In autonomous vehicle ethics, deontology is stronger because we should never use murder to save lives. Swerving is an intentional act, so if the car decides to swerve and hit an bystander to save its passenger, that is actively choosing to murder someone who was safe. This is totally immoral. On the other hand, a utilitarian is fine killing one to save 5. But does that make it okay? I don't think so because humans are not numbers.",
    status: "draft",
    submittedAt: "2026-05-26T08:12:00Z",
    aiFeedback: null,
    teacherFeedback: null
  }
];

export const SEED_PEER_REVIEWS: PeerReview[] = [
  {
    id: "pr_mateo_on_sophia",
    submissionId: "sub_sophia_ethics",
    assignmentId: "asg_1_ai_ethics",
    authorId: "mateo_rodriguez",
    authorName: "Mateo Rodriguez",
    scores: {
      "philosophy_grounding": 28,
      "logical_cohesion": 27,
      "grammar_style": 19,
      "peer_review_value": 18
    },
    commentStrengths: "This is a masterpiece Sophia! I love how you balanced Immanuel Kant's rules with utilitarian maths. Your point about passive braking versus actively deciding to steer into people completely blew my mind and resolved a paradox.",
    commentImprovements: "Honestly, the content is super academic. It made me realize my own essay's issues! Maybe you could clarify if there are any current manufacturers attempting to write this passive-braking constraint in their actual auto-pilots?",
    submittedAt: "2026-05-24T18:30:00Z"
  },
  {
    id: "pr_sophia_on_mateo",
    submissionId: "sub_mateo_ethics",
    assignmentId: "asg_1_ai_ethics",
    authorId: "sophia_chen",
    authorName: "Sophia Chen",
    scores: {
      "philosophy_grounding": 20,
      "logical_cohesion": 22,
      "grammar_style": 16,
      "peer_review_value": 18
    },
    commentStrengths: "Mateo, your argument about public adoption is very strong. Philosophers often forget that if people don't buy self-driving cars, standard human-driven cars (which crash far more often) will remain on roads and kill thousands more.",
    commentImprovements: "I would suggest strengthening your deontology section. Kant argues that human lives have 'dignity' beyond any 'price' or transaction, so treating bystander lives as an acceptable commercial exchange violates this. Separating business contract ethics from deontology would elevate the vocabulary.",
    submittedAt: "2026-05-25T13:40:00Z"
  },
  {
    id: "pr_flagged_sample",
    submissionId: "sub_mateo_ethics",
    assignmentId: "asg_1_ai_ethics",
    authorId: "alex_morgan",
    authorName: "Alex Morgan",
    scores: {
      "philosophy_grounding": 10,
      "logical_cohesion": 8,
      "grammar_style": 12,
      "peer_review_value": 5
    },
    scoreGiven: 35,
    commentStrengths: "this sucks",
    commentImprovements: "it has terrible mock facts and is stupid",
    submittedAt: "2026-05-25T19:10:00Z",
    isFlagged: true,
    flagReason: "Inappropriate or low-effort phrase matching ('this sucks', 'stupid'). Class reviews must adhere strictly to constructive guidelines.",
    suggestedRevision: "I appreciated your practical considerations on consumer adoption. However, expanding code details and clarifying deontology rules would make the thesis substantially stronger.",
    flagCheckedByTeacher: false,
    qualityRating: "needs_improvement"
  }
];

export function initializeDatabase() {
  if (!localStorage.getItem("pforum_profiles")) {
    localStorage.setItem("pforum_profiles", JSON.stringify(SEED_PROFILES));
  }
  if (!localStorage.getItem("pforum_classrooms")) {
    localStorage.setItem("pforum_classrooms", JSON.stringify(SEED_CLASSROOMS));
  }
  if (!localStorage.getItem("pforum_assignments")) {
    localStorage.setItem("pforum_assignments", JSON.stringify(SEED_ASSIGNMENTS));
  }
  if (!localStorage.getItem("pforum_submissions")) {
    localStorage.setItem("pforum_submissions", JSON.stringify(SEED_SUBMISSIONS));
  }
  if (!localStorage.getItem("pforum_peer_reviews")) {
    localStorage.setItem("pforum_peer_reviews", JSON.stringify(SEED_PEER_REVIEWS));
  }
  if (!localStorage.getItem("pforum_current_user")) {
    localStorage.setItem("pforum_current_user", "null"); // Default to logged out for auth form
  }
}
