export type Pillar =
  | "dsa"
  | "hld"
  | "lld"
  | "tech_stack"
  | "theory"
  | "behavioral"
  | "projects";

export type TopicStatus = "not_started" | "in_progress" | "done";
export type MockScore = "weak" | "acceptable" | "strong";

export const PILLAR_LABELS: Record<Pillar, string> = {
  dsa: "DSA",
  hld: "HLD",
  lld: "LLD",
  tech_stack: "Tech Stack / Java",
  theory: "Theory",
  behavioral: "Behavioral",
  projects: "Projects",
};

export const PILLAR_ORDER: Pillar[] = [
  "dsa",
  "hld",
  "lld",
  "tech_stack",
  "theory",
  "behavioral",
  "projects",
];

// Dot color per pillar (used in sidebar)
export const PILLAR_COLORS: Record<Pillar, string> = {
  dsa: "#6c5ce7",
  hld: "#0984e3",
  lld: "#00b894",
  tech_stack: "#e17055",
  theory: "#fdcb6e",
  behavioral: "#a29bfe",
  projects: "#fd79a8",
};

export interface Topic {
  id: string;
  pillar: Pillar;
  title: string;
  description: string | null;
  order_index: number;
  is_custom: boolean;
  // DSA-specific metadata
  tag: string | null;
  roadmap: string | null;
  is_company_specific: boolean | null;
  company: string | null;
  source_url: string | null;
}

export const DSA_TAGS = [
  "Arrays & Hashing",
  "Two Pointers",
  "Sliding Window",
  "Stack",
  "Binary Search",
  "Linked List",
  "Trees",
  "Tries",
  "Heap / Priority Queue",
  "Backtracking",
  "Graphs",
  "Dynamic Programming",
  "Greedy",
  "Intervals",
  "Bit Manipulation",
  "Math",
  "String",
] as const;

export const DSA_ROADMAPS = [
  "Neetcode 150",
  "Blind 75",
  "Striver's SDE Sheet",
  "Striver's A2Z",
  "Love Babbar 450",
  "GFG Top 100",
  "Custom",
] as const;

export interface UserTopic {
  id: string;
  user_id: string;
  topic_id: string;
  status: TopicStatus;
  review_count: number;
  easiness_factor: number;
  interval_days: number;
  last_studied_at: string | null;
  next_review_at: string | null;
}

export interface TopicWithProgress extends Topic {
  user_topic: UserTopic | null;
}

export interface Note {
  id: string;
  user_id: string;
  topic_id: string;
  content: string;
  version: number;
  created_at: string;
}

export interface AiReview {
  id: string;
  note_id: string;
  gaps: string[];
  expected_questions: string[];
  next_topics: string[];
  created_at: string;
}
