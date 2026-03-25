"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Pillar } from "@/lib/types";

export async function toggleTopicDone({
  topicId,
  userId,
  currentlyDone,
}: {
  topicId: string;
  userId: string;
  currentlyDone: boolean;
}) {
  const supabase = await createClient();
  const now = new Date();

  if (currentlyDone) {
    await supabase.from("user_topics").upsert({
      user_id: userId,
      topic_id: topicId,
      status: "in_progress",
      next_review_at: null,
    }, { onConflict: 'user_id,topic_id' });
  } else {
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 1);
    await supabase.from("user_topics").upsert({
      user_id: userId,
      topic_id: topicId,
      status: "done",
      last_studied_at: now.toISOString(),
      next_review_at: nextReview.toISOString(),
      interval_days: 1,
      review_count: 0,
    }, { onConflict: 'user_id,topic_id' });
  }

  revalidatePath("/", "layout");
}

export async function createTopic({
  pillar,
  userId,
  title,
  description,
  tag,
  roadmap,
  is_company_specific,
  company,
  source_url,
}: {
  pillar: Pillar;
  userId: string;
  title: string;
  description?: string;
  tag?: string;
  roadmap?: string;
  is_company_specific?: boolean;
  company?: string;
  source_url?: string;
}) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("topics")
    .select("order_index")
    .eq("user_id", userId)
    .eq("pillar", pillar)
    .order("order_index", { ascending: false })
    .limit(1)
    .single();

  const nextIndex = (existing?.order_index ?? 0) + 1;

  const { error } = await supabase.from("topics").insert({
    user_id: userId,
    pillar,
    title,
    description: description || null,
    order_index: nextIndex,
    is_custom: true,
    tag: tag || null,
    roadmap: roadmap || null,
    is_company_specific: is_company_specific ?? false,
    company: company || null,
    source_url: source_url || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function importNeetcode150({ userId }: { userId: string }): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  // Check if already imported
  const { data: existing } = await supabase
    .from("topics")
    .select("id")
    .eq("user_id", userId)
    .eq("roadmap", "Neetcode 150")
    .limit(1);

  if (existing && existing.length > 0) return { ok: false, message: "already imported" };

  const problems: { title: string; tag: string; source_url: string }[] = [
    // Arrays & Hashing
    { title: "Contains Duplicate", tag: "Arrays & Hashing", source_url: "https://leetcode.com/problems/contains-duplicate/" },
    { title: "Valid Anagram", tag: "Arrays & Hashing", source_url: "https://leetcode.com/problems/valid-anagram/" },
    { title: "Two Sum", tag: "Arrays & Hashing", source_url: "https://leetcode.com/problems/two-sum/" },
    { title: "Group Anagrams", tag: "Arrays & Hashing", source_url: "https://leetcode.com/problems/group-anagrams/" },
    { title: "Top K Frequent Elements", tag: "Arrays & Hashing", source_url: "https://leetcode.com/problems/top-k-frequent-elements/" },
    { title: "Product of Array Except Self", tag: "Arrays & Hashing", source_url: "https://leetcode.com/problems/product-of-array-except-self/" },
    { title: "Valid Sudoku", tag: "Arrays & Hashing", source_url: "https://leetcode.com/problems/valid-sudoku/" },
    { title: "Encode and Decode Strings", tag: "Arrays & Hashing", source_url: "https://leetcode.com/problems/encode-and-decode-strings/" },
    { title: "Longest Consecutive Sequence", tag: "Arrays & Hashing", source_url: "https://leetcode.com/problems/longest-consecutive-sequence/" },
    // Two Pointers
    { title: "Valid Palindrome", tag: "Two Pointers", source_url: "https://leetcode.com/problems/valid-palindrome/" },
    { title: "Two Sum II", tag: "Two Pointers", source_url: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/" },
    { title: "3Sum", tag: "Two Pointers", source_url: "https://leetcode.com/problems/3sum/" },
    { title: "Container With Most Water", tag: "Two Pointers", source_url: "https://leetcode.com/problems/container-with-most-water/" },
    { title: "Trapping Rain Water", tag: "Two Pointers", source_url: "https://leetcode.com/problems/trapping-rain-water/" },
    // Sliding Window
    { title: "Best Time to Buy and Sell Stock", tag: "Sliding Window", source_url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/" },
    { title: "Longest Substring Without Repeating Characters", tag: "Sliding Window", source_url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/" },
    { title: "Longest Repeating Character Replacement", tag: "Sliding Window", source_url: "https://leetcode.com/problems/longest-repeating-character-replacement/" },
    { title: "Permutation in String", tag: "Sliding Window", source_url: "https://leetcode.com/problems/permutation-in-string/" },
    { title: "Minimum Window Substring", tag: "Sliding Window", source_url: "https://leetcode.com/problems/minimum-window-substring/" },
    { title: "Sliding Window Maximum", tag: "Sliding Window", source_url: "https://leetcode.com/problems/sliding-window-maximum/" },
    // Stack
    { title: "Valid Parentheses", tag: "Stack", source_url: "https://leetcode.com/problems/valid-parentheses/" },
    { title: "Min Stack", tag: "Stack", source_url: "https://leetcode.com/problems/min-stack/" },
    { title: "Evaluate Reverse Polish Notation", tag: "Stack", source_url: "https://leetcode.com/problems/evaluate-reverse-polish-notation/" },
    { title: "Generate Parentheses", tag: "Stack", source_url: "https://leetcode.com/problems/generate-parentheses/" },
    { title: "Daily Temperatures", tag: "Stack", source_url: "https://leetcode.com/problems/daily-temperatures/" },
    { title: "Car Fleet", tag: "Stack", source_url: "https://leetcode.com/problems/car-fleet/" },
    { title: "Largest Rectangle in Histogram", tag: "Stack", source_url: "https://leetcode.com/problems/largest-rectangle-in-histogram/" },
    // Binary Search
    { title: "Binary Search", tag: "Binary Search", source_url: "https://leetcode.com/problems/binary-search/" },
    { title: "Search a 2D Matrix", tag: "Binary Search", source_url: "https://leetcode.com/problems/search-a-2d-matrix/" },
    { title: "Koko Eating Bananas", tag: "Binary Search", source_url: "https://leetcode.com/problems/koko-eating-bananas/" },
    { title: "Find Minimum in Rotated Sorted Array", tag: "Binary Search", source_url: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/" },
    { title: "Search in Rotated Sorted Array", tag: "Binary Search", source_url: "https://leetcode.com/problems/search-in-rotated-sorted-array/" },
    { title: "Time Based Key-Value Store", tag: "Binary Search", source_url: "https://leetcode.com/problems/time-based-key-value-store/" },
    { title: "Median of Two Sorted Arrays", tag: "Binary Search", source_url: "https://leetcode.com/problems/median-of-two-sorted-arrays/" },
    // Linked List
    { title: "Reverse Linked List", tag: "Linked List", source_url: "https://leetcode.com/problems/reverse-linked-list/" },
    { title: "Merge Two Sorted Lists", tag: "Linked List", source_url: "https://leetcode.com/problems/merge-two-sorted-lists/" },
    { title: "Reorder List", tag: "Linked List", source_url: "https://leetcode.com/problems/reorder-list/" },
    { title: "Remove Nth Node From End of List", tag: "Linked List", source_url: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/" },
    { title: "Copy List with Random Pointer", tag: "Linked List", source_url: "https://leetcode.com/problems/copy-list-with-random-pointer/" },
    { title: "Add Two Numbers", tag: "Linked List", source_url: "https://leetcode.com/problems/add-two-numbers/" },
    { title: "Linked List Cycle", tag: "Linked List", source_url: "https://leetcode.com/problems/linked-list-cycle/" },
    { title: "Find the Duplicate Number", tag: "Linked List", source_url: "https://leetcode.com/problems/find-the-duplicate-number/" },
    { title: "LRU Cache", tag: "Linked List", source_url: "https://leetcode.com/problems/lru-cache/" },
    { title: "Merge K Sorted Lists", tag: "Linked List", source_url: "https://leetcode.com/problems/merge-k-sorted-lists/" },
    { title: "Reverse Nodes in K-Group", tag: "Linked List", source_url: "https://leetcode.com/problems/reverse-nodes-in-k-group/" },
    // Trees
    { title: "Invert Binary Tree", tag: "Trees", source_url: "https://leetcode.com/problems/invert-binary-tree/" },
    { title: "Maximum Depth of Binary Tree", tag: "Trees", source_url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/" },
    { title: "Diameter of Binary Tree", tag: "Trees", source_url: "https://leetcode.com/problems/diameter-of-binary-tree/" },
    { title: "Balanced Binary Tree", tag: "Trees", source_url: "https://leetcode.com/problems/balanced-binary-tree/" },
    { title: "Same Tree", tag: "Trees", source_url: "https://leetcode.com/problems/same-tree/" },
    { title: "Subtree of Another Tree", tag: "Trees", source_url: "https://leetcode.com/problems/subtree-of-another-tree/" },
    { title: "Lowest Common Ancestor of a BST", tag: "Trees", source_url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/" },
    { title: "Binary Tree Level Order Traversal", tag: "Trees", source_url: "https://leetcode.com/problems/binary-tree-level-order-traversal/" },
    { title: "Binary Tree Right Side View", tag: "Trees", source_url: "https://leetcode.com/problems/binary-tree-right-side-view/" },
    { title: "Count Good Nodes in Binary Tree", tag: "Trees", source_url: "https://leetcode.com/problems/count-good-nodes-in-binary-tree/" },
    { title: "Validate Binary Search Tree", tag: "Trees", source_url: "https://leetcode.com/problems/validate-binary-search-tree/" },
    { title: "Kth Smallest Element in a BST", tag: "Trees", source_url: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/" },
    { title: "Construct Binary Tree from Preorder and Inorder Traversal", tag: "Trees", source_url: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/" },
    { title: "Binary Tree Maximum Path Sum", tag: "Trees", source_url: "https://leetcode.com/problems/binary-tree-maximum-path-sum/" },
    { title: "Serialize and Deserialize Binary Tree", tag: "Trees", source_url: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/" },
    // Tries
    { title: "Implement Trie (Prefix Tree)", tag: "Tries", source_url: "https://leetcode.com/problems/implement-trie-prefix-tree/" },
    { title: "Design Add and Search Words Data Structure", tag: "Tries", source_url: "https://leetcode.com/problems/design-add-and-search-words-data-structure/" },
    { title: "Word Search II", tag: "Tries", source_url: "https://leetcode.com/problems/word-search-ii/" },
    // Heap / Priority Queue
    { title: "Kth Largest Element in a Stream", tag: "Heap / Priority Queue", source_url: "https://leetcode.com/problems/kth-largest-element-in-a-stream/" },
    { title: "Last Stone Weight", tag: "Heap / Priority Queue", source_url: "https://leetcode.com/problems/last-stone-weight/" },
    { title: "K Closest Points to Origin", tag: "Heap / Priority Queue", source_url: "https://leetcode.com/problems/k-closest-points-to-origin/" },
    { title: "Kth Largest Element in an Array", tag: "Heap / Priority Queue", source_url: "https://leetcode.com/problems/kth-largest-element-in-an-array/" },
    { title: "Task Scheduler", tag: "Heap / Priority Queue", source_url: "https://leetcode.com/problems/task-scheduler/" },
    { title: "Design Twitter", tag: "Heap / Priority Queue", source_url: "https://leetcode.com/problems/design-twitter/" },
    { title: "Find Median from Data Stream", tag: "Heap / Priority Queue", source_url: "https://leetcode.com/problems/find-median-from-data-stream/" },
    // Backtracking
    { title: "Subsets", tag: "Backtracking", source_url: "https://leetcode.com/problems/subsets/" },
    { title: "Combination Sum", tag: "Backtracking", source_url: "https://leetcode.com/problems/combination-sum/" },
    { title: "Permutations", tag: "Backtracking", source_url: "https://leetcode.com/problems/permutations/" },
    { title: "Subsets II", tag: "Backtracking", source_url: "https://leetcode.com/problems/subsets-ii/" },
    { title: "Combination Sum II", tag: "Backtracking", source_url: "https://leetcode.com/problems/combination-sum-ii/" },
    { title: "Word Search", tag: "Backtracking", source_url: "https://leetcode.com/problems/word-search/" },
    { title: "Palindrome Partitioning", tag: "Backtracking", source_url: "https://leetcode.com/problems/palindrome-partitioning/" },
    { title: "Letter Combinations of a Phone Number", tag: "Backtracking", source_url: "https://leetcode.com/problems/letter-combinations-of-a-phone-number/" },
    { title: "N-Queens", tag: "Backtracking", source_url: "https://leetcode.com/problems/n-queens/" },
    // Graphs
    { title: "Number of Islands", tag: "Graphs", source_url: "https://leetcode.com/problems/number-of-islands/" },
    { title: "Clone Graph", tag: "Graphs", source_url: "https://leetcode.com/problems/clone-graph/" },
    { title: "Max Area of Island", tag: "Graphs", source_url: "https://leetcode.com/problems/max-area-of-island/" },
    { title: "Pacific Atlantic Water Flow", tag: "Graphs", source_url: "https://leetcode.com/problems/pacific-atlantic-water-flow/" },
    { title: "Surrounded Regions", tag: "Graphs", source_url: "https://leetcode.com/problems/surrounded-regions/" },
    { title: "Rotting Oranges", tag: "Graphs", source_url: "https://leetcode.com/problems/rotting-oranges/" },
    { title: "Course Schedule", tag: "Graphs", source_url: "https://leetcode.com/problems/course-schedule/" },
    { title: "Course Schedule II", tag: "Graphs", source_url: "https://leetcode.com/problems/course-schedule-ii/" },
    { title: "Redundant Connection", tag: "Graphs", source_url: "https://leetcode.com/problems/redundant-connection/" },
    { title: "Number of Connected Components in an Undirected Graph", tag: "Graphs", source_url: "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/" },
    { title: "Graph Valid Tree", tag: "Graphs", source_url: "https://leetcode.com/problems/graph-valid-tree/" },
    { title: "Word Ladder", tag: "Graphs", source_url: "https://leetcode.com/problems/word-ladder/" },
    { title: "Reconstruct Itinerary", tag: "Graphs", source_url: "https://leetcode.com/problems/reconstruct-itinerary/" },
    { title: "Min Cost to Connect All Points", tag: "Graphs", source_url: "https://leetcode.com/problems/min-cost-to-connect-all-points/" },
    { title: "Network Delay Time", tag: "Graphs", source_url: "https://leetcode.com/problems/network-delay-time/" },
    { title: "Swim in Rising Water", tag: "Graphs", source_url: "https://leetcode.com/problems/swim-in-rising-water/" },
    { title: "Cheapest Flights Within K Stops", tag: "Graphs", source_url: "https://leetcode.com/problems/cheapest-flights-within-k-stops/" },
    // Dynamic Programming
    { title: "Climbing Stairs", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/climbing-stairs/" },
    { title: "Min Cost Climbing Stairs", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/min-cost-climbing-stairs/" },
    { title: "House Robber", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/house-robber/" },
    { title: "House Robber II", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/house-robber-ii/" },
    { title: "Longest Palindromic Substring", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/longest-palindromic-substring/" },
    { title: "Palindromic Substrings", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/palindromic-substrings/" },
    { title: "Decode Ways", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/decode-ways/" },
    { title: "Coin Change", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/coin-change/" },
    { title: "Maximum Product Subarray", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/maximum-product-subarray/" },
    { title: "Word Break", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/word-break/" },
    { title: "Longest Increasing Subsequence", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/longest-increasing-subsequence/" },
    { title: "Partition Equal Subset Sum", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/partition-equal-subset-sum/" },
    { title: "Unique Paths", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/unique-paths/" },
    { title: "Longest Common Subsequence", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/longest-common-subsequence/" },
    { title: "Best Time to Buy and Sell Stock with Cooldown", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/" },
    { title: "Coin Change II", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/coin-change-ii/" },
    { title: "Target Sum", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/target-sum/" },
    { title: "Interleaving String", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/interleaving-string/" },
    { title: "Longest Increasing Path in a Matrix", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/longest-increasing-path-in-a-matrix/" },
    { title: "Distinct Subsequences", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/distinct-subsequences/" },
    { title: "Edit Distance", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/edit-distance/" },
    { title: "Burst Balloons", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/burst-balloons/" },
    { title: "Regular Expression Matching", tag: "Dynamic Programming", source_url: "https://leetcode.com/problems/regular-expression-matching/" },
    // Greedy
    { title: "Maximum Subarray", tag: "Greedy", source_url: "https://leetcode.com/problems/maximum-subarray/" },
    { title: "Jump Game", tag: "Greedy", source_url: "https://leetcode.com/problems/jump-game/" },
    { title: "Jump Game II", tag: "Greedy", source_url: "https://leetcode.com/problems/jump-game-ii/" },
    { title: "Gas Station", tag: "Greedy", source_url: "https://leetcode.com/problems/gas-station/" },
    { title: "Hand of Straights", tag: "Greedy", source_url: "https://leetcode.com/problems/hand-of-straights/" },
    { title: "Merge Triplets to Form Target Triplet", tag: "Greedy", source_url: "https://leetcode.com/problems/merge-triplets-to-form-a-target-triplet/" },
    { title: "Partition Labels", tag: "Greedy", source_url: "https://leetcode.com/problems/partition-labels/" },
    { title: "Valid Parenthesis String", tag: "Greedy", source_url: "https://leetcode.com/problems/valid-parenthesis-string/" },
    // Intervals
    { title: "Insert Interval", tag: "Intervals", source_url: "https://leetcode.com/problems/insert-interval/" },
    { title: "Merge Intervals", tag: "Intervals", source_url: "https://leetcode.com/problems/merge-intervals/" },
    { title: "Non-overlapping Intervals", tag: "Intervals", source_url: "https://leetcode.com/problems/non-overlapping-intervals/" },
    { title: "Meeting Rooms", tag: "Intervals", source_url: "https://leetcode.com/problems/meeting-rooms/" },
    { title: "Meeting Rooms II", tag: "Intervals", source_url: "https://leetcode.com/problems/meeting-rooms-ii/" },
    { title: "Minimum Interval to Include Each Query", tag: "Intervals", source_url: "https://leetcode.com/problems/minimum-interval-to-include-each-query/" },
    // Math
    { title: "Rotate Image", tag: "Math", source_url: "https://leetcode.com/problems/rotate-image/" },
    { title: "Spiral Matrix", tag: "Math", source_url: "https://leetcode.com/problems/spiral-matrix/" },
    { title: "Set Matrix Zeroes", tag: "Math", source_url: "https://leetcode.com/problems/set-matrix-zeroes/" },
    { title: "Happy Number", tag: "Math", source_url: "https://leetcode.com/problems/happy-number/" },
    { title: "Plus One", tag: "Math", source_url: "https://leetcode.com/problems/plus-one/" },
    { title: "Pow(x, n)", tag: "Math", source_url: "https://leetcode.com/problems/powx-n/" },
    { title: "Multiply Strings", tag: "Math", source_url: "https://leetcode.com/problems/multiply-strings/" },
    { title: "Detect Squares", tag: "Math", source_url: "https://leetcode.com/problems/detect-squares/" },
    // Bit Manipulation
    { title: "Single Number", tag: "Bit Manipulation", source_url: "https://leetcode.com/problems/single-number/" },
    { title: "Number of 1 Bits", tag: "Bit Manipulation", source_url: "https://leetcode.com/problems/number-of-1-bits/" },
    { title: "Counting Bits", tag: "Bit Manipulation", source_url: "https://leetcode.com/problems/counting-bits/" },
    { title: "Reverse Bits", tag: "Bit Manipulation", source_url: "https://leetcode.com/problems/reverse-bits/" },
    { title: "Missing Number", tag: "Bit Manipulation", source_url: "https://leetcode.com/problems/missing-number/" },
    { title: "Sum of Two Integers", tag: "Bit Manipulation", source_url: "https://leetcode.com/problems/sum-of-two-integers/" },
    { title: "Reverse Integer", tag: "Bit Manipulation", source_url: "https://leetcode.com/problems/reverse-integer/" },
  ];

  const payload = problems.map((p, i) => ({
    user_id: userId,
    pillar: "dsa",
    title: p.title,
    description: null,
    order_index: i + 1,
    is_custom: false,
    tag: p.tag,
    roadmap: "Neetcode 150",
    is_company_specific: false,
    company: null,
    source_url: p.source_url,
  }));

  const { error } = await supabase.from("topics").insert(payload);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/curriculum/dsa");
  revalidatePath("/dashboard");
  return { ok: true, message: "imported" };
}

export async function deleteTopic({ topicId, userId }: { topicId: string; userId: string }) {
  const supabase = await createClient();
  await supabase
    .from("topics")
    .delete()
    .eq("id", topicId)
    .eq("user_id", userId);
}
