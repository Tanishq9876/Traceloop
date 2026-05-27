export type Platform = "LeetCode" | "GeeksforGeeks" | "Codeforces" | "CodeChef";
export type Difficulty = "Easy" | "Medium" | "Hard";

export type Question = {
  id: string;
  title: string;
  platform: Platform;
  difficulty: Difficulty;
  url: string;
  topic: string;
  tags: string[];
  popularity: number; // 1-100
  addedAt: string; // ISO date
};

export const TOPICS = [
  "Arrays",
  "Binary Search",
  "Strings",
  "Linked List",
  "Recursion",
  "Bit Manipulation",
  "Stack and Queues",
  "Sliding Window & Two Pointers",
  "Heaps",
  "Greedy Algorithms",
  "Binary Trees",
  "Binary Search Trees",
  "Graphs",
  "Dynamic Programming",
  "Tries",
  "Sorting",
];

export const PLATFORMS: Platform[] = ["LeetCode", "GeeksforGeeks", "Codeforces", "CodeChef"];

const mk = (
  id: string,
  title: string,
  platform: Platform,
  difficulty: Difficulty,
  url: string,
  topic: string,
  tags: string[],
  popularity = 70,
  daysAgo = 30,
): Question => ({
  id,
  title,
  platform,
  difficulty,
  url,
  topic,
  tags,
  popularity,
  addedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
});

export const QUESTIONS: Question[] = [
  // Arrays
  mk("a1", "Two Sum", "LeetCode", "Easy", "https://leetcode.com/problems/two-sum/", "Arrays", ["Hashing"], 99, 3),
  mk("a2", "Best Time to Buy and Sell Stock", "LeetCode", "Easy", "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", "Arrays", ["DP"], 95, 5),
  mk("a3", "Maximum Subarray (Kadane)", "LeetCode", "Medium", "https://leetcode.com/problems/maximum-subarray/", "Arrays", ["DP"], 96, 10),
  mk("a4", "Subarray with Given Sum", "GeeksforGeeks", "Easy", "https://www.geeksforgeeks.org/find-subarray-with-given-sum/", "Arrays", ["Prefix Sum"], 80, 14),
  mk("a5", "Trapping Rain Water", "LeetCode", "Hard", "https://leetcode.com/problems/trapping-rain-water/", "Arrays", ["Two Pointers"], 92, 20),
  mk("a6", "Watermelon", "Codeforces", "Easy", "https://codeforces.com/problemset/problem/4/A", "Arrays", ["Math"], 70, 25),
  mk("a7", "Chef and Notebooks", "CodeChef", "Easy", "https://www.codechef.com/problems/CNOTE", "Arrays", [], 60, 40),

  // Binary Search
  mk("b1", "Binary Search", "LeetCode", "Easy", "https://leetcode.com/problems/binary-search/", "Binary Search", ["Classic"], 98, 2),
  mk("b2", "Search Insert Position", "LeetCode", "Easy", "https://leetcode.com/problems/search-insert-position/", "Binary Search", [], 90, 6),
  mk("b3", "Aggressive Cows", "CodeChef", "Medium", "https://www.spoj.com/problems/AGGRCOW/", "Binary Search", ["Binary Search on Answer"], 88, 12),
  mk("b4", "Lower Bound & Upper Bound", "GeeksforGeeks", "Easy", "https://www.geeksforgeeks.org/lower_bound-in-cpp/", "Binary Search", [], 78, 18),
  mk("b5", "Binary Search — Step 2", "Codeforces", "Medium", "https://codeforces.com/edu/course/2/lesson/6/2", "Binary Search", ["EDU"], 82, 22),
  mk("b6", "Median of Two Sorted Arrays", "LeetCode", "Hard", "https://leetcode.com/problems/median-of-two-sorted-arrays/", "Binary Search", [], 91, 30),

  // Strings
  mk("s1", "Valid Anagram", "LeetCode", "Easy", "https://leetcode.com/problems/valid-anagram/", "Strings", ["Hashing"], 88, 4),
  mk("s2", "Longest Palindromic Substring", "LeetCode", "Medium", "https://leetcode.com/problems/longest-palindromic-substring/", "Strings", ["DP"], 90, 9),
  mk("s3", "Reverse Words in a String", "GeeksforGeeks", "Easy", "https://www.geeksforgeeks.org/reverse-words-in-a-given-string/", "Strings", [], 70, 15),
  mk("s4", "Theatre Square", "Codeforces", "Easy", "https://codeforces.com/problemset/problem/1/A", "Strings", ["Math"], 65, 30),

  // Linked List
  mk("l1", "Reverse Linked List", "LeetCode", "Easy", "https://leetcode.com/problems/reverse-linked-list/", "Linked List", ["Iterative", "Recursive"], 97, 3),
  mk("l2", "Merge Two Sorted Lists", "LeetCode", "Easy", "https://leetcode.com/problems/merge-two-sorted-lists/", "Linked List", [], 92, 7),
  mk("l3", "Detect Cycle (Floyd)", "LeetCode", "Medium", "https://leetcode.com/problems/linked-list-cycle/", "Linked List", ["Two Pointers"], 90, 12),
  mk("l4", "Add Two Numbers", "LeetCode", "Medium", "https://leetcode.com/problems/add-two-numbers/", "Linked List", [], 87, 16),
  mk("l5", "Detect Loop in Linked List", "GeeksforGeeks", "Easy", "https://www.geeksforgeeks.org/detect-loop-in-a-linked-list/", "Linked List", [], 75, 25),

  // Recursion
  mk("r1", "Subsets", "LeetCode", "Medium", "https://leetcode.com/problems/subsets/", "Recursion", ["Backtracking"], 89, 5),
  mk("r2", "Permutations", "LeetCode", "Medium", "https://leetcode.com/problems/permutations/", "Recursion", ["Backtracking"], 88, 8),
  mk("r3", "N-Queens", "LeetCode", "Hard", "https://leetcode.com/problems/n-queens/", "Recursion", ["Backtracking"], 85, 18),
  mk("r4", "Tower of Hanoi", "GeeksforGeeks", "Medium", "https://www.geeksforgeeks.org/c-program-for-tower-of-hanoi/", "Recursion", [], 72, 26),

  // Bit Manipulation
  mk("bm1", "Single Number", "LeetCode", "Easy", "https://leetcode.com/problems/single-number/", "Bit Manipulation", ["XOR"], 88, 4),
  mk("bm2", "Number of 1 Bits", "LeetCode", "Easy", "https://leetcode.com/problems/number-of-1-bits/", "Bit Manipulation", [], 80, 11),
  mk("bm3", "Bit Difference", "GeeksforGeeks", "Easy", "https://www.geeksforgeeks.org/count-set-bits-in-an-integer/", "Bit Manipulation", [], 70, 22),
  mk("bm4", "XOR Game", "Codeforces", "Medium", "https://codeforces.com/problemset/problem/15/A", "Bit Manipulation", [], 65, 35),

  // Stack and Queues
  mk("st1", "Valid Parentheses", "LeetCode", "Easy", "https://leetcode.com/problems/valid-parentheses/", "Stack and Queues", ["Stack"], 96, 3),
  mk("st2", "Min Stack", "LeetCode", "Medium", "https://leetcode.com/problems/min-stack/", "Stack and Queues", [], 86, 9),
  mk("st3", "Next Greater Element", "GeeksforGeeks", "Medium", "https://www.geeksforgeeks.org/next-greater-element/", "Stack and Queues", ["Monotonic Stack"], 84, 17),
  mk("st4", "Implement Queue using Stacks", "LeetCode", "Easy", "https://leetcode.com/problems/implement-queue-using-stacks/", "Stack and Queues", [], 78, 23),

  // Sliding Window & Two Pointers
  mk("sw1", "Longest Substring Without Repeating Characters", "LeetCode", "Medium", "https://leetcode.com/problems/longest-substring-without-repeating-characters/", "Sliding Window & Two Pointers", ["Sliding Window"], 97, 4),
  mk("sw2", "Minimum Window Substring", "LeetCode", "Hard", "https://leetcode.com/problems/minimum-window-substring/", "Sliding Window & Two Pointers", ["Sliding Window"], 90, 12),
  mk("sw3", "Two Sum II — Input Array Is Sorted", "LeetCode", "Medium", "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", "Sliding Window & Two Pointers", ["Two Pointers"], 85, 16),
  mk("sw4", "Container With Most Water", "LeetCode", "Medium", "https://leetcode.com/problems/container-with-most-water/", "Sliding Window & Two Pointers", ["Two Pointers"], 91, 20),

  // Heaps
  mk("h1", "Kth Largest Element in an Array", "LeetCode", "Medium", "https://leetcode.com/problems/kth-largest-element-in-an-array/", "Heaps", [], 92, 6),
  mk("h2", "Merge K Sorted Lists", "LeetCode", "Hard", "https://leetcode.com/problems/merge-k-sorted-lists/", "Heaps", [], 90, 15),
  mk("h3", "Top K Frequent Elements", "LeetCode", "Medium", "https://leetcode.com/problems/top-k-frequent-elements/", "Heaps", ["Hashing"], 88, 19),
  mk("h4", "Heap Sort", "GeeksforGeeks", "Medium", "https://www.geeksforgeeks.org/heap-sort/", "Heaps", ["Sorting"], 70, 30),

  // Greedy
  mk("g1", "Jump Game", "LeetCode", "Medium", "https://leetcode.com/problems/jump-game/", "Greedy Algorithms", [], 89, 8),
  mk("g2", "Gas Station", "LeetCode", "Medium", "https://leetcode.com/problems/gas-station/", "Greedy Algorithms", [], 84, 14),
  mk("g3", "N meetings in one room", "GeeksforGeeks", "Easy", "https://www.geeksforgeeks.org/find-maximum-meetings-in-one-room/", "Greedy Algorithms", ["Sorting"], 78, 22),
  mk("g4", "Bear and Big Brother", "Codeforces", "Easy", "https://codeforces.com/problemset/problem/791/A", "Greedy Algorithms", [], 60, 33),

  // Binary Trees
  mk("bt1", "Binary Tree Inorder Traversal", "LeetCode", "Easy", "https://leetcode.com/problems/binary-tree-inorder-traversal/", "Binary Trees", [], 90, 5),
  mk("bt2", "Maximum Depth of Binary Tree", "LeetCode", "Easy", "https://leetcode.com/problems/maximum-depth-of-binary-tree/", "Binary Trees", ["DFS"], 88, 9),
  mk("bt3", "Binary Tree Level Order Traversal", "LeetCode", "Medium", "https://leetcode.com/problems/binary-tree-level-order-traversal/", "Binary Trees", ["BFS"], 87, 13),
  mk("bt4", "Diameter of Binary Tree", "LeetCode", "Easy", "https://leetcode.com/problems/diameter-of-binary-tree/", "Binary Trees", [], 84, 18),

  // BST
  mk("bst1", "Validate Binary Search Tree", "LeetCode", "Medium", "https://leetcode.com/problems/validate-binary-search-tree/", "Binary Search Trees", [], 88, 7),
  mk("bst2", "Lowest Common Ancestor of a BST", "LeetCode", "Medium", "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", "Binary Search Trees", [], 85, 12),
  mk("bst3", "Kth Smallest Element in a BST", "LeetCode", "Medium", "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", "Binary Search Trees", [], 82, 20),

  // Graphs
  mk("gr1", "Number of Islands", "LeetCode", "Medium", "https://leetcode.com/problems/number-of-islands/", "Graphs", ["BFS", "DFS"], 93, 4),
  mk("gr2", "Course Schedule", "LeetCode", "Medium", "https://leetcode.com/problems/course-schedule/", "Graphs", ["Topological Sort"], 87, 11),
  mk("gr3", "Dijkstra's Shortest Path", "GeeksforGeeks", "Medium", "https://www.geeksforgeeks.org/dijkstras-shortest-path-algorithm-greedy-algo-7/", "Graphs", ["Shortest Path"], 84, 17),
  mk("gr4", "Fox And Names", "Codeforces", "Medium", "https://codeforces.com/problemset/problem/510/C", "Graphs", ["Topological Sort"], 70, 28),

  // DP
  mk("d1", "Climbing Stairs", "LeetCode", "Easy", "https://leetcode.com/problems/climbing-stairs/", "Dynamic Programming", ["Fibonacci"], 95, 3),
  mk("d2", "House Robber", "LeetCode", "Medium", "https://leetcode.com/problems/house-robber/", "Dynamic Programming", [], 90, 8),
  mk("d3", "Longest Common Subsequence", "LeetCode", "Medium", "https://leetcode.com/problems/longest-common-subsequence/", "Dynamic Programming", ["2D DP"], 91, 14),
  mk("d4", "0/1 Knapsack", "GeeksforGeeks", "Medium", "https://www.geeksforgeeks.org/0-1-knapsack-problem-dp-10/", "Dynamic Programming", ["Classic"], 89, 22),
  mk("d5", "Edit Distance", "LeetCode", "Hard", "https://leetcode.com/problems/edit-distance/", "Dynamic Programming", ["2D DP"], 86, 28),
  mk("d6", "Vasya and Cornfield", "Codeforces", "Easy", "https://codeforces.com/problemset/problem/1030/B", "Dynamic Programming", [], 60, 40),

  // Tries
  mk("t1", "Implement Trie (Prefix Tree)", "LeetCode", "Medium", "https://leetcode.com/problems/implement-trie-prefix-tree/", "Tries", ["Design"], 88, 9),
  mk("t2", "Word Search II", "LeetCode", "Hard", "https://leetcode.com/problems/word-search-ii/", "Tries", ["Backtracking"], 84, 18),
  mk("t3", "Trie | Insert and Search", "GeeksforGeeks", "Medium", "https://www.geeksforgeeks.org/trie-insert-and-search/", "Tries", [], 72, 30),

  // Sorting
  mk("so1", "Sort Colors", "LeetCode", "Medium", "https://leetcode.com/problems/sort-colors/", "Sorting", ["Dutch Flag"], 85, 6),
  mk("so2", "Merge Intervals", "LeetCode", "Medium", "https://leetcode.com/problems/merge-intervals/", "Sorting", [], 90, 10),
  mk("so3", "Quick Sort", "GeeksforGeeks", "Medium", "https://www.geeksforgeeks.org/quick-sort/", "Sorting", ["Divide & Conquer"], 78, 25),
  mk("so4", "Merge Sort", "GeeksforGeeks", "Medium", "https://www.geeksforgeeks.org/merge-sort/", "Sorting", ["Divide & Conquer"], 78, 26),
];

export const PLATFORM_META: Record<
  Platform,
  { color: string; initials: string; url: string; logo: string }
> = {
  LeetCode: {
    color: "from-amber-500 to-orange-600",
    initials: "LC",
    url: "https://leetcode.com",
    logo: "https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png",
  },
  GeeksforGeeks: {
    color: "from-emerald-500 to-green-700",
    initials: "GFG",
    url: "https://geeksforgeeks.org",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/43/GeeksforGeeks.svg",
  },
  Codeforces: {
    color: "from-sky-500 to-blue-700",
    initials: "CF",
    url: "https://codeforces.com",
    logo: "https://codeforces.org/s/0/favicon-96x96.png",
  },
  CodeChef: {
    color: "from-amber-700 to-stone-800",
    initials: "CC",
    url: "https://codechef.com",
    logo: "https://cdn.codechef.com/images/cc-logo.png",
  },
};
