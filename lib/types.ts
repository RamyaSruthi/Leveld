// Legacy Pillar type kept for compatibility; prefer PillarConfig from DB
export type Pillar = string;

export type TopicStatus = "not_started" | "in_progress" | "done";
export type MockScore = "weak" | "acceptable" | "strong";

// ── Dynamic pillar configuration (stored per-user in DB) ────────────────────

export interface PillarConfig {
  id: string;
  user_id: string;
  slug: string;
  label: string;
  color: string;
  order_index: number;
}

// Default pillars — used to seed new users
export const DEFAULT_PILLARS: Omit<PillarConfig, "id" | "user_id">[] = [
  { slug: "dsa", label: "DSA", color: "#6c5ce7", order_index: 0 },
  { slug: "hld", label: "HLD", color: "#0984e3", order_index: 1 },
  { slug: "lld", label: "LLD", color: "#00b894", order_index: 2 },
  { slug: "tech_stack", label: "Tech Stack / Java", color: "#e17055", order_index: 3 },
  { slug: "theory", label: "Theory", color: "#fdcb6e", order_index: 4 },
  { slug: "behavioral", label: "Behavioral", color: "#a29bfe", order_index: 5 },
  { slug: "projects", label: "Projects", color: "#fd79a8", order_index: 6 },
];

// Helpers to build lookup maps from a PillarConfig array
export function pillarLabels(pillars: PillarConfig[]): Record<string, string> {
  return Object.fromEntries(pillars.map((p) => [p.slug, p.label]));
}
export function pillarColors(pillars: PillarConfig[]): Record<string, string> {
  return Object.fromEntries(pillars.map((p) => [p.slug, p.color]));
}
export function pillarSlugs(pillars: PillarConfig[]): string[] {
  return pillars.map((p) => p.slug);
}

export interface Topic {
  id: string;
  pillar: string;
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
  "Leetcode Top Interview 150",
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

export type ApplicationStatus =
  | "applied"
  | "screening"
  | "interviewing"
  | "offer"
  | "rejected"
  | "withdrawn"
  | "ghosted";

export type RoundOutcome = "pending" | "passed" | "failed";

export interface JobApplication {
  id: string;
  user_id: string;
  company: string;
  role: string;
  status: ApplicationStatus;
  applied_at: string | null;
  job_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_linkedin: string | null;
  notes: string | null;
  compensation_asked: string | null;
  comp_asked_base: string | null;
  comp_asked_joining_bonus: string | null;
  comp_asked_esop: string | null;
  comp_asked_relocation: string | null;
  compensation_final: string | null;
  comp_final_base: string | null;
  comp_final_joining_bonus: string | null;
  comp_final_esop: string | null;
  comp_final_relocation: string | null;
  created_at: string;
}

export interface InterviewRound {
  id: string;
  application_id: string;
  user_id: string;
  name: string;
  scheduled_at: string | null;
  outcome: RoundOutcome;
  notes: string | null;
  created_at: string;
}

export interface InterviewQuestion {
  id: string;
  user_id: string;
  application_id: string;
  round_id: string;
  question: string;
  answer: string | null;
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

export interface MindsetEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  updated_at: string;
  created_at: string;
}

export type ResourceCategory = "book" | "article" | "repo" | "course";

export const RESOURCE_CATEGORIES: { value: ResourceCategory; label: string; icon: string }[] = [
  { value: "book", label: "Books", icon: "📚" },
  { value: "article", label: "Articles", icon: "📝" },
  { value: "repo", label: "Git Repos", icon: "🔗" },
  { value: "course", label: "Courses / YouTube", icon: "🎬" },
];

export interface Resource {
  id: string;
  user_id: string;
  category: ResourceCategory;
  title: string;
  url: string | null;
  description: string | null;
  pillar_slug: string | null;
  created_at: string;
}
