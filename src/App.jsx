import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";

/* ============================================================
   GLOBAL STYLES — Apple Design Language
============================================================ */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f5f5f7;
    --bg2: #ffffff;
    --surface: rgba(255,255,255,0.72);
    --surface-solid: #ffffff;
    --elevated: rgba(255,255,255,0.9);
    --border: rgba(0,0,0,0.08);
    --border-strong: rgba(0,0,0,0.14);
    --accent1: #0071e3;
    --accent1-light: #e8f2ff;
    --accent2: #34c759;
    --accent2-light: #e8f9ee;
    --accent3: #ff3b30;
    --accent3-light: #fff1f0;
    --accent4: #af52de;
    --accent4-light: #f5eeff;
    --accent5: #ff9500;
    --text: #1d1d1f;
    --text2: #424245;
    --muted: #86868b;
    --muted-light: #a1a1a6;
    --font: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono: 'DM Mono', 'SF Mono', monospace;
    --radius: 18px;
    --radius-sm: 12px;
    --radius-xs: 8px;
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
    --shadow: 0 4px 20px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
    --shadow-lg: 0 20px 60px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.06);
    --shadow-blue: 0 4px 20px rgba(0,113,227,0.25);
  }
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  button { font-family: var(--font); cursor: pointer; border: none; outline: none; background: none; }
  pre, code { font-family: var(--font-mono); }
  textarea { font-family: var(--font-mono); resize: none; }
  a { text-decoration: none; }
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.15); border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(0,0,0,0.25); }
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 0 0 rgba(0,113,227,0.3); }
    50% { box-shadow: 0 0 0 8px rgba(0,113,227,0); }
  }
`;

function useGlobalStyle(css) {
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = css;
    document.head.appendChild(el);
    return () => document.head.removeChild(el);
  }, []);
}

/* ============================================================
   INTERVIEW DATA — unchanged
============================================================ */
const INTERVIEW_DATA = {
  "Stack": [
    { q: "What is a Stack and how does LIFO work?", a: "A Stack is a linear data structure where insertion (push) and deletion (pop) happen at the same end called the 'top'. LIFO means the Last element Inserted is the First one Out — like a pile of plates.", company: "Google", difficulty: "Easy" },
    { q: "What is Stack Overflow and Stack Underflow?", a: "Stack Overflow occurs when you push an element onto a full stack. Stack Underflow occurs when you pop from an empty stack. Both are error conditions that must be checked before operations.", company: "Amazon", difficulty: "Easy" },
    { q: "How would you implement a stack using an array?", a: "Declare an array of fixed size MAX and an integer 'top' initialized to -1. Push: increment top and store element at arr[top]. Pop: return arr[top] and decrement top. Peek: return arr[top] without decrementing.", company: "Microsoft", difficulty: "Easy" },
    { q: "What are the real-world applications of a Stack?", a: "Undo/Redo in editors, browser back/forward history, function call stack in OS, expression evaluation (postfix/prefix), balancing parentheses in compilers, backtracking in maze solving.", company: "Flipkart", difficulty: "Easy" },
    { q: "How do you check balanced parentheses using a stack?", a: "Iterate through the string. Push every opening bracket onto the stack. For every closing bracket, check if the stack top has the matching opener. If yes, pop; if no or stack empty, return false. At end, stack should be empty.", company: "Adobe", difficulty: "Medium" },
    { q: "Implement a Min Stack that supports getMin() in O(1).", a: "Maintain two stacks: the main stack and a minStack. On push(x): push x to main; push x to minStack if minStack is empty OR x <= minStack.top. On pop: if popped value equals minStack.top, also pop minStack. getMin() returns minStack.top.", company: "Google", difficulty: "Medium" },
    { q: "How would you implement a Queue using two Stacks?", a: "Use stack1 (inbox) and stack2 (outbox). Enqueue: push to stack1. Dequeue: if stack2 is empty, transfer all elements from stack1 to stack2 (reversing order), then pop stack2. Amortized O(1) dequeue.", company: "Amazon", difficulty: "Medium" },
    { q: "What is a Monotonic Stack and where is it used?", a: "A Monotonic Stack maintains elements in strictly increasing or decreasing order. Used for Next Greater Element, Stock Span, Largest Rectangle in Histogram, and Trapping Rainwater problems — all in O(n) instead of O(n²).", company: "Meta", difficulty: "Medium" },
    { q: "Explain the Next Greater Element problem and its O(n) solution.", a: "For each element, find the first element to its right that is greater. Brute force is O(n²). Using a monotonic stack: iterate left to right, maintain a decreasing stack of indices. When current element is greater than stack top, it is the 'next greater' for the top element.", company: "Microsoft", difficulty: "Medium" },
    { q: "How is the call stack used in recursion?", a: "Each recursive call creates a new stack frame storing local variables, parameters, and the return address. When a function returns, its frame is popped. Deep recursion risks Stack Overflow when frames exceed memory. Tail recursion can be optimized to avoid extra frames.", company: "Infosys", difficulty: "Medium" },
    { q: "How would you sort a stack using only stack operations?", a: "Use a temporary stack. Pop element from main stack. While temp stack not empty AND temp.top > popped element, move temp.top back to main. Push popped element to temp. Repeat. Result is temp stack sorted in ascending order from top.", company: "TCS", difficulty: "Hard" },
    { q: "Solve the Largest Rectangle in Histogram using a stack.", a: "Use a monotonic stack of indices. For each bar, pop while current bar is shorter than stack top. For each popped bar, compute area = height × (current_index - stack.top - 1). Track maximum area. O(n) time.", company: "Google", difficulty: "Hard" },
    { q: "Explain the Trapping Rainwater problem and stack approach.", a: "Stack stores indices of bars. When current bar is taller, pop the bottom, calculate bounded water using min(left_height, right_height) - bottom_height × width. Accumulate total water. O(n) time, O(n) space.", company: "Amazon", difficulty: "Hard" },
    { q: "What is the difference between Stack (java.util) and Deque?", a: "Stack extends Vector (synchronized, legacy, slower). Deque (ArrayDeque) is preferred for production — not synchronized, faster, no legacy overhead. Java docs recommend using Deque over Stack for stack operations.", company: "Wipro", difficulty: "Easy" },
    { q: "How do you reverse a string using a stack?", a: "Push each character of the string onto the stack. Then pop all characters and append to a new string. Since stack is LIFO, characters come out in reverse order. Time O(n), Space O(n).", company: "Accenture", difficulty: "Easy" },
    { q: "Implement infix to postfix conversion.", a: "Use operator stack. Scan left to right: output operands directly. For operators, pop stack while top has >= precedence (respecting associativity), then push current. For '(', push; for ')', pop until '('. At end, pop all remaining operators.", company: "Cognizant", difficulty: "Medium" },
    { q: "What are the differences between DFS with stack vs recursion?", a: "Recursive DFS uses the system call stack implicitly. Iterative DFS uses an explicit stack. Iterative is safer for large graphs (avoids stack overflow), slightly more complex to write, but equivalent in result. Both O(V+E).", company: "Meta", difficulty: "Medium" },
    { q: "How do you detect a cycle in a directed graph using a stack?", a: "Use DFS with a recursion stack (separate boolean array). Mark a node in the recursion stack when entering and unmark when exiting. If you visit a node that's already in the recursion stack, a cycle exists.", company: "Google", difficulty: "Hard" },
    { q: "Explain Asteroid Collision (LeetCode 735).", a: "Use a stack. For each asteroid: if positive, push. If negative, while stack not empty and top is positive and top < |current|, pop (collision). If stack empty or top is negative, push current. If top == |current|, pop both. O(n) time.", company: "Amazon", difficulty: "Hard" },
    { q: "What is the time complexity of all standard stack operations?", a: "Push: O(1), Pop: O(1), Peek: O(1), isEmpty: O(1), Search: O(n). Space: O(n) for n elements. Java's Stack.search() is O(n) as it scans from top. All primary operations are constant time.", company: "Infosys", difficulty: "Easy" },
  ],
  "Queue": [
    { q: "What is a Queue and how does FIFO work?", a: "A Queue is a linear data structure with two ends: REAR (insertion via Enqueue) and FRONT (deletion via Dequeue). FIFO means First In, First Out — like people waiting in a line at a bank.", company: "Amazon", difficulty: "Easy" },
    { q: "What is a Circular Queue and why is it needed?", a: "In a linear queue, after dequeuing, the front index moves right and freed space cannot be reused. A Circular Queue uses modular arithmetic — (rear+1) % capacity — to wrap around and reuse freed slots, solving space wastage.", company: "Microsoft", difficulty: "Easy" },
    { q: "What is the difference between a Queue and a Deque?", a: "A Queue allows insertion at rear and deletion at front only. A Deque (Double-Ended Queue) allows insertion and deletion at BOTH front and rear. Deque is more flexible and can function as both a stack and queue.", company: "Google", difficulty: "Easy" },
    { q: "How does a Priority Queue differ from a regular Queue?", a: "A regular Queue serves elements in FIFO order. A Priority Queue serves elements based on priority — the element with the highest (or lowest) priority is dequeued first, regardless of insertion order. Implemented with a binary heap.", company: "Flipkart", difficulty: "Easy" },
    { q: "Explain BFS and why it uses a Queue.", a: "BFS (Breadth-First Search) explores nodes level by level. A Queue ensures nodes are processed in the order they were discovered — FIFO guarantees we finish one level before starting the next, giving shortest path in unweighted graphs.", company: "Meta", difficulty: "Medium" },
    { q: "Implement Queue using two Stacks.", a: "Two stacks: inbox and outbox. Enqueue: push to inbox. Dequeue: if outbox empty, transfer all inbox→outbox (reversing), then pop outbox. This gives FIFO behavior with amortized O(1) dequeue.", company: "Amazon", difficulty: "Medium" },
    { q: "What is Multi-Source BFS and when is it used?", a: "Multi-Source BFS initializes the queue with ALL source nodes at once. BFS then expands outward from all sources simultaneously. Used in: Rotting Oranges (all rotten cells as sources), 01 Matrix (all 0-cells), Walls and Gates.", company: "Google", difficulty: "Medium" },
    { q: "Solve the Rotting Oranges problem (LeetCode 994).", a: "Multi-source BFS. Initialize queue with all rotten oranges (value=2) and count fresh oranges. BFS: each minute, rot adjacent fresh oranges, decrement fresh count. Return minutes elapsed when fresh=0, or -1 if fresh>0 remains.", company: "Microsoft", difficulty: "Medium" },
    { q: "Explain the Sliding Window Maximum problem.", a: "Find max in every window of size k. Naive: O(nk). Monotonic Deque: maintain indices of potentially useful elements in decreasing order. Remove out-of-window indices from front, smaller elements from back. Front is always the current max. O(n).", company: "Amazon", difficulty: "Hard" },
    { q: "What is 0-1 BFS and when does it outperform Dijkstra?", a: "0-1 BFS handles graphs with only 0 or 1 edge weights. Use a Deque: push 0-weight neighbors to front, 1-weight to back. O(V+E) vs Dijkstra's O((V+E)logV). Faster when weights are only 0 and 1.", company: "Google", difficulty: "Hard" },
    { q: "How do you implement level-order traversal of a binary tree?", a: "Use a queue. Enqueue root. While queue not empty: record size (nodes in current level). Dequeue size nodes, process each, enqueue their children. Size-based loop ensures level separation. O(n) time and space.", company: "Infosys", difficulty: "Medium" },
    { q: "What is Kahn's Algorithm (Topological Sort via BFS)?", a: "Compute in-degrees of all nodes. Enqueue all nodes with in-degree 0. BFS: dequeue node, add to result, reduce neighbor in-degrees. If neighbor's in-degree becomes 0, enqueue it. If result size < n, cycle exists.", company: "TCS", difficulty: "Hard" },
    { q: "What is the Word Ladder problem approach?", a: "BFS on implicit graph of strings. Each word is a node; edge exists if words differ by one character. BFS gives shortest transformation sequence. Generate all possible 1-character mutations, check if in word list. O(M² × N) where M=word length, N=wordlist size.", company: "Meta", difficulty: "Hard" },
    { q: "What is the difference between ArrayDeque and LinkedList as a Queue?", a: "ArrayDeque uses a resizable array — better cache performance, less memory overhead, faster in practice. LinkedList uses nodes with pointers — O(1) insertion/deletion but more memory per element. Java docs recommend ArrayDeque.", company: "Wipro", difficulty: "Easy" },
    { q: "How is a Queue used in CPU scheduling?", a: "Round Robin scheduling uses a circular queue of processes. Each process gets a fixed time quantum. After quantum expires, process moves to rear of queue. FIFO ensures fair scheduling — no process starves.", company: "Accenture", difficulty: "Easy" },
    { q: "What is a Blocking Queue in Java concurrency?", a: "A thread-safe queue where enqueue blocks if full (waits for space) and dequeue blocks if empty (waits for elements). Used in Producer-Consumer pattern. Java's BlockingQueue interface is implemented by ArrayBlockingQueue, LinkedBlockingQueue.", company: "Oracle", difficulty: "Medium" },
    { q: "Explain the concept of BFS for shortest path.", a: "In an unweighted graph, BFS gives the shortest path from source to any node. Since BFS explores level by level, the first time a node is visited is via the shortest path. Each level represents one more edge from the source.", company: "Google", difficulty: "Medium" },
    { q: "How do you find the right side view of a binary tree?", a: "Level-order BFS. For each level, the last element dequeued is the rightmost node visible from the right. Add it to the result. Equivalently, in each level loop, capture the last node's value.", company: "Amazon", difficulty: "Medium" },
    { q: "What is Dijkstra's algorithm and how does it use a priority queue?", a: "Dijkstra finds shortest paths in weighted graphs with non-negative edges. Priority Queue (min-heap) always processes the node with smallest current distance. On processing, relax edges. O((V+E)logV) with binary heap.", company: "Meta", difficulty: "Hard" },
    { q: "How do you detect a cycle in an undirected graph using BFS?", a: "BFS from each unvisited node. Track parent of each node. If a neighbor is already visited and is not the current node's parent, a cycle exists. O(V+E) time.", company: "Cognizant", difficulty: "Medium" },
  ],
  "Linear Search": [
    { q: "What is Linear Search and when should you use it over Binary Search?", a: "Linear Search scans each element sequentially. Use it over Binary Search when: array is unsorted, array is very small (overhead not worth it), searching a linked list (no random access), or searching by a non-comparable key.", company: "TCS", difficulty: "Easy" },
    { q: "What is the time complexity of Linear Search in best, average, and worst cases?", a: "Best: O(1) — target is first element. Average: O(n/2) ≈ O(n) — target in middle. Worst: O(n) — target is last or not present. Space: O(1) — in-place, no extra memory.", company: "Infosys", difficulty: "Easy" },
    { q: "What is Sentinel Linear Search and how does it improve performance?", a: "Place the target at the last position of the array before searching. Then loop without checking boundary (i < n) since the sentinel guarantees a stop. Removes boundary check from each iteration, saving n comparisons. Same O(n) complexity but lower constant factor.", company: "Wipro", difficulty: "Easy" },
    { q: "How would you implement Linear Search for all occurrences?", a: "Instead of returning the first found index, collect all indices where arr[i] == target into a list. Continue the loop even after finding a match. Return the complete list. Time O(n) always.", company: "Accenture", difficulty: "Easy" },
    { q: "Explain the Move-to-Front heuristic for self-organizing lists.", a: "When element at index i is found, swap it with arr[0]. Over repeated searches, frequently accessed elements migrate to the front. Amortized search time decreases for hot elements. Trade-off: disturbs array order.", company: "Google", difficulty: "Medium" },
    { q: "How does Kadane's Algorithm relate to linear search?", a: "Kadane's Algorithm (Maximum Subarray Sum) is a linear scan: for each element, decide if it's better to extend the current subarray or start fresh. max(arr[i], currSum + arr[i]). Single pass O(n), O(1) space — the essence of linear search optimization.", company: "Amazon", difficulty: "Medium" },
    { q: "What is Boyer-Moore Majority Vote Algorithm?", a: "Find the majority element (appears > n/2 times) in one pass with O(1) space. Maintain a candidate and count. Increment count if same as candidate, else decrement. When count hits 0, update candidate. Verify in a second pass.", company: "Meta", difficulty: "Medium" },
    { q: "How do you search in a 2D sorted matrix efficiently?", a: "Start from top-right corner (or bottom-left). If current > target, move left. If current < target, move down. This eliminates one row or column per step. O(m+n) — much better than O(m×n) linear scan.", company: "Microsoft", difficulty: "Medium" },
    { q: "Explain the Best Time to Buy and Sell Stock solution.", a: "Single linear scan. Track minimum price seen so far. For each price, compute profit = price - minPrice. Track maximum profit. Update minPrice when lower price found. O(n) time, O(1) space — classic linear search pattern.", company: "Amazon", difficulty: "Easy" },
    { q: "How would you find a duplicate in an array using linear search?", a: "Use a HashSet. Linear scan: if element already in set, it's a duplicate — return it. Else add to set. O(n) time, O(n) space. Alternative: Floyd's cycle detection for O(n) time, O(1) space (when elements are in range 1..n).", company: "Google", difficulty: "Medium" },
    { q: "What is the difference between Linear Search and Binary Search?", a: "Linear: O(n), works on unsorted arrays, no preprocessing. Binary: O(log n), requires sorted array. For n=1M: linear needs 1M operations worst case; binary needs only 20. Always sort and use binary search for large repeated-search scenarios.", company: "Infosys", difficulty: "Easy" },
    { q: "How is Linear Search used in the Two-Sum problem?", a: "Brute force Two-Sum is O(n²) with nested linear search. Optimized: use a HashMap. For each element, check if (target - element) exists in the map — O(1) lookup. Overall O(n) with O(n) space. Single linear scan.", company: "Amazon", difficulty: "Medium" },
    { q: "Explain the Single Number problem (XOR technique).", a: "In an array where every element appears twice except one: XOR all elements. XOR of same numbers is 0. XOR with 0 is identity. All duplicates cancel out, leaving the single number. O(n) linear scan, O(1) space.", company: "Microsoft", difficulty: "Easy" },
    { q: "How do you find the maximum subarray product?", a: "Extension of Kadane's. Track both maxProduct and minProduct (because negative × negative = positive). For each element: maxProd = max(num, maxProd×num, minProd×num); minProd = min same. Update global max. O(n) single pass.", company: "Google", difficulty: "Hard" },
    { q: "What is the Container With Most Water problem approach?", a: "Two-pointer linear scan. Start with pointers at both ends. Area = min(height[L], height[R]) × (R - L). Move the pointer pointing to the shorter bar inward (it can't contribute more). O(n) time, O(1) space.", company: "Meta", difficulty: "Medium" },
    { q: "How would you find the first missing positive integer?", a: "Place each number x in position x-1 using index manipulation (cycle sort idea). Then scan: first index i where arr[i] != i+1, return i+1. O(n) time, O(1) space. Linear scan after rearrangement.", company: "Amazon", difficulty: "Hard" },
    { q: "Explain the Dutch National Flag problem.", a: "Three-way partition (0s, 1s, 2s) in one pass. Three pointers: low, mid, high. If arr[mid]=0, swap with low, advance both. If arr[mid]=1, advance mid. If arr[mid]=2, swap with high, only decrement high. O(n) one pass.", company: "Google", difficulty: "Medium" },
    { q: "How do you find all pairs with a given sum using linear search?", a: "Sort + two pointer: O(n log n). Or use HashMap: for each element, check if (sum - element) exists in map. Add pair if yes. Add element to map. O(n) time, O(n) space. Handles duplicates by removing used elements.", company: "Cognizant", difficulty: "Medium" },
    { q: "What is the Majority Element II problem?", a: "Find elements appearing > n/3 times. At most 2 such elements can exist. Use extended Boyer-Moore with 2 candidates and 2 counts. After first pass, verify both candidates in second pass. O(n) time, O(1) space.", company: "Microsoft", difficulty: "Hard" },
    { q: "How would you implement Linear Search on a Linked List?", a: "Start at head node. Traverse node by node, comparing data with target. No index access — must follow next pointers. Return index (counting from 0) when found, -1 if end reached. O(n) time always — no binary search possible on linked list.", company: "TCS", difficulty: "Easy" },
  ],
  "Bubble Sort": [
    { q: "Explain Bubble Sort with an example.", a: "Bubble Sort repeatedly compares adjacent elements and swaps if out of order. After each pass, the largest unsorted element 'bubbles' to its correct position. Example: [5,3,8,4,2] → Pass1: [3,5,4,2,8] → Pass2: [3,4,2,5,8] → until sorted.", company: "TCS", difficulty: "Easy" },
    { q: "What is the time complexity of Bubble Sort?", a: "Best: O(n) with optimization flag when array is already sorted — detects no swaps in first pass. Average: O(n²). Worst: O(n²) — reverse sorted array. Space: O(1) — in-place. Total comparisons: n(n-1)/2 worst case.", company: "Infosys", difficulty: "Easy" },
    { q: "How do you optimize Bubble Sort for nearly sorted arrays?", a: "Add a 'swapped' boolean flag. Set false at start of each outer loop pass. Set true whenever a swap occurs. If after a complete inner pass swapped is still false, the array is already sorted — break early. Achieves O(n) on already-sorted arrays.", company: "Wipro", difficulty: "Easy" },
    { q: "Is Bubble Sort stable? Explain.", a: "Yes, Bubble Sort is stable. It only swaps arr[j] and arr[j+1] when arr[j] > arr[j+1] — strictly greater, not >=. Equal elements are never swapped, preserving their original relative order. This matters when sorting objects by one key.", company: "Accenture", difficulty: "Easy" },
    { q: "Compare Bubble Sort, Selection Sort, and Insertion Sort.", a: "All are O(n²) average/worst. Bubble: stable, many swaps, adaptive with flag. Selection: unstable, minimum swaps (O(n)), not adaptive. Insertion: stable, adaptive (O(n) best), best for nearly sorted/small arrays. Insertion Sort is fastest in practice among the three.", company: "Microsoft", difficulty: "Medium" },
    { q: "What is the relationship between Bubble Sort and inversion count?", a: "An inversion is a pair (i,j) where i<j but arr[i]>arr[j]. Each Bubble Sort swap removes exactly one inversion. Total swaps = total inversions. A sorted array has 0 inversions. Reverse-sorted has maximum n(n-1)/2 inversions.", company: "Google", difficulty: "Medium" },
    { q: "How would you count inversions efficiently?", a: "Brute force O(n²): count all pairs where arr[i]>arr[j] for i<j. Efficient: Modified Merge Sort O(n log n). During merge, when right element is taken before left elements, all remaining left elements form inversions — add their count.", company: "Amazon", difficulty: "Hard" },
    { q: "What is Cocktail Shaker Sort?", a: "Bidirectional Bubble Sort. Forward pass moves largest to right. Backward pass moves smallest to left. Shrink active range from both sides. Solves the 'turtle' problem — small elements far right move to correct position faster. Still O(n²) worst case.", company: "Meta", difficulty: "Medium" },
    { q: "Why is Bubble Sort rarely used in production?", a: "O(n²) average/worst makes it impractical for n > 10,000. Merge Sort O(n log n) and stable. Quick Sort O(n log n) average and cache-friendly. Tim Sort (Java's default) O(n log n) and adaptive. Insertion Sort even beats Bubble for small n.", company: "Google", difficulty: "Easy" },
    { q: "What is the lower bound for comparison-based sorting?", a: "Ω(n log n) — proven via decision tree argument. A sorting algorithm makes comparisons to determine the right permutation from n! possibilities. Decision tree has at least n! leaves, height ≥ log₂(n!) ≈ n log n by Stirling's approximation.", company: "Microsoft", difficulty: "Hard" },
    { q: "How does Bubble Sort relate to Tim Sort used in Java?", a: "TimSort (Java Arrays.sort for objects) uses Insertion Sort for small runs (n<32) instead of Bubble Sort, because Insertion Sort is faster in practice (fewer moves). Then merges runs with Merge Sort. Bubble Sort is never a subroutine in production sort algorithms.", company: "Oracle", difficulty: "Hard" },
    { q: "After k passes of Bubble Sort, what can you guarantee?", a: "After k passes of Bubble Sort, the k largest elements are in their correct final positions at the right end of the array. The inner loop can be reduced by k each pass — the optimized version does exactly this: inner loop runs n-1-i times.", company: "TCS", difficulty: "Easy" },
    { q: "How do you sort a K-sorted array efficiently?", a: "A k-sorted array has each element at most k positions from its correct position. Use a Min-Heap of size k+1. Process elements: add to heap, poll minimum. O(n log k) — better than Bubble Sort's O(nk) and Merge Sort's O(n log n) when k is small.", company: "Amazon", difficulty: "Hard" },
    { q: "Implement Bubble Sort for strings.", a: "Replace numeric comparison with String's compareTo() method. If str[j].compareTo(str[j+1]) > 0, swap. compareTo returns negative if str[j] < str[j+1] lexicographically. Same O(n²) passes but each comparison is O(L) where L is string length.", company: "Cognizant", difficulty: "Easy" },
    { q: "What is an in-place sorting algorithm?", a: "An in-place algorithm uses O(1) extra space — it sorts within the original array using only a constant amount of additional variables (like a temp for swapping). Bubble Sort, Selection Sort, and Insertion Sort are in-place. Merge Sort is NOT in-place (uses O(n) auxiliary).", company: "Google", difficulty: "Easy" },
    { q: "Explain Insertion Sort and why it beats Bubble Sort in practice.", a: "Insertion Sort builds a sorted portion left to right. For each element, shifts larger sorted elements right and inserts the current element in the correct position. Fewer writes than Bubble Sort. Adaptive: O(n) on nearly sorted. Cache-friendly. Preferred for small n.", company: "Meta", difficulty: "Medium" },
    { q: "What happens to Bubble Sort on an already-sorted array?", a: "Without optimization: O(n²) — makes all comparisons even though no swaps. With optimization (swapped flag): O(n) — first pass makes n-1 comparisons, finds no swaps, breaks. This is the best case of optimized Bubble Sort.", company: "Wipro", difficulty: "Easy" },
    { q: "How does Merge Sort improve on Bubble Sort?", a: "Merge Sort uses divide-and-conquer. Split array in halves, sort recursively, merge. During merge, each element comparison can eliminate multiple inversions at once — unlike Bubble Sort which eliminates exactly 1 per swap. Result: O(n log n) vs O(n²).", company: "Google", difficulty: "Medium" },
    { q: "What is the maximum number of swaps Bubble Sort can make?", a: "Maximum swaps = maximum inversions = n(n-1)/2. This occurs when the array is reverse-sorted. For n=5: [5,4,3,2,1] needs 10 swaps. Formula: n*(n-1)/2. This is also the sum of arithmetic series 0+1+2+...+(n-1).", company: "Amazon", difficulty: "Medium" },
    { q: "When would you actually choose Bubble Sort in real code?", a: "Almost never for production. Legitimate uses: educational demonstration, detecting if an array is sorted (optimized version, O(n)), sorting arrays of exactly 2-3 elements where overhead doesn't matter, or code golf. For any n>100, use better algorithms.", company: "Microsoft", difficulty: "Easy" },
  ],
};

/* ============================================================
   CODING CHALLENGES
============================================================ */
const CODING_CHALLENGES = {
  "Stack": {
    "Beginner": [
      { id:"sb1", title:"Valid Parentheses", company:"Google", desc:"Given a string containing '(', ')', '{', '}', '[', ']', determine if it is valid. Every open bracket must be closed by the same type, in the correct order.", starter:`public boolean isValid(String s) {\n    // Your code here\n    \n}`, solution:`public boolean isValid(String s) {\n    Stack<Character> stack = new Stack<>();\n    for (char c : s.toCharArray()) {\n        if (c=='(' || c=='{' || c=='[') stack.push(c);\n        else {\n            if (stack.isEmpty()) return false;\n            char top = stack.pop();\n            if (c==')' && top!='(') return false;\n            if (c=='}' && top!='{') return false;\n            if (c==']' && top!='[') return false;\n        }\n    }\n    return stack.isEmpty();\n}`, testCases:`Input: "()" → true\nInput: "()[]{}" → true\nInput: "(]" → false\nInput: "([)]" → false` },
      { id:"sb2", title:"Reverse String using Stack", company:"Amazon", desc:"Reverse a string using a stack data structure. Push each character and pop to build reversed string.", starter:`public String reverseString(String s) {\n    // Use a Stack to reverse\n    \n}`, solution:`public String reverseString(String s) {\n    Stack<Character> stack = new Stack<>();\n    for (char c : s.toCharArray()) stack.push(c);\n    StringBuilder sb = new StringBuilder();\n    while (!stack.isEmpty()) sb.append(stack.pop());\n    return sb.toString();\n}`, testCases:`Input: "hello" → "olleh"\nInput: "abcde" → "edcba"\nInput: "a" → "a"` },
      { id:"sb3", title:"Implement Stack using Array", company:"Microsoft", desc:"Implement a stack class with push, pop, peek, and isEmpty methods using a fixed-size array.", starter:`class MyStack {\n    int[] arr = new int[100];\n    int top = -1;\n    \n    public void push(int x) { }\n    public int pop() { }\n    public int peek() { }\n    public boolean isEmpty() { }\n}`, solution:`class MyStack {\n    int[] arr = new int[100];\n    int top = -1;\n    \n    public void push(int x) {\n        if (top == 99) throw new RuntimeException("Overflow");\n        arr[++top] = x;\n    }\n    public int pop() {\n        if (top == -1) throw new RuntimeException("Underflow");\n        return arr[top--];\n    }\n    public int peek() { return arr[top]; }\n    public boolean isEmpty() { return top == -1; }\n}`, testCases:`push(1), push(2), peek() → 2\npop() → 2, peek() → 1\nisEmpty() after pop() → false` },
    ],
    "Intermediate": [
      { id:"si1", title:"Min Stack", company:"Amazon", desc:"Design a stack that supports push, pop, top, and retrieving the minimum element — all in O(1) time.", starter:`class MinStack {\n    public void push(int val) { }\n    public void pop() { }\n    public int top() { }\n    public int getMin() { }\n}`, solution:`class MinStack {\n    Deque<Integer> stack = new ArrayDeque<>();\n    Deque<Integer> minStack = new ArrayDeque<>();\n    \n    public void push(int val) {\n        stack.push(val);\n        if (minStack.isEmpty() || val <= minStack.peek())\n            minStack.push(val);\n    }\n    public void pop() {\n        if (stack.pop().equals(minStack.peek())) minStack.pop();\n    }\n    public int top() { return stack.peek(); }\n    public int getMin() { return minStack.peek(); }\n}`, testCases:`push(-2),push(0),push(-3)\ngetMin() → -3\npop()\ntop() → 0\ngetMin() → -2` },
      { id:"si2", title:"Evaluate Reverse Polish Notation", company:"Meta", desc:"Evaluate the value of an arithmetic expression in Reverse Polish Notation (postfix). Valid operators: +, -, *, /.", starter:`public int evalRPN(String[] tokens) {\n    // Use a stack to evaluate\n    \n}`, solution:`public int evalRPN(String[] tokens) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (String t : tokens) {\n        if ("+-*/".contains(t)) {\n            int b = stack.pop(), a = stack.pop();\n            switch(t) {\n                case "+": stack.push(a+b); break;\n                case "-": stack.push(a-b); break;\n                case "*": stack.push(a*b); break;\n                case "/": stack.push(a/b); break;\n            }\n        } else stack.push(Integer.parseInt(t));\n    }\n    return stack.pop();\n}`, testCases:`["2","1","+","3","*"] → 9\n["4","13","5","/","+"] → 6` },
      { id:"si3", title:"Daily Temperatures", company:"Amazon", desc:"Given an array of temperatures, return an array where each element is how many days to wait for a warmer temperature.", starter:`public int[] dailyTemperatures(int[] temperatures) {\n    // Monotonic stack approach\n    \n}`, solution:`public int[] dailyTemperatures(int[] temperatures) {\n    int n = temperatures.length;\n    int[] result = new int[n];\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int i = 0; i < n; i++) {\n        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {\n            int idx = stack.pop();\n            result[idx] = i - idx;\n        }\n        stack.push(i);\n    }\n    return result;\n}`, testCases:`[73,74,75,71,69,72,76,73] → [1,1,4,2,1,1,0,0]\n[30,40,50,60] → [1,1,1,0]` },
    ],
    "Advanced": [
      { id:"sa1", title:"Largest Rectangle in Histogram", company:"Google", desc:"Given an array of bar heights in a histogram, find the area of the largest rectangle that can be formed.", starter:`public int largestRectangleArea(int[] heights) {\n    // Monotonic stack solution\n    \n}`, solution:`public int largestRectangleArea(int[] heights) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    int maxArea = 0;\n    int n = heights.length;\n    for (int i = 0; i <= n; i++) {\n        int curr = (i == n) ? 0 : heights[i];\n        while (!stack.isEmpty() && heights[stack.peek()] > curr) {\n            int h = heights[stack.pop()];\n            int w = stack.isEmpty() ? i : i - stack.peek() - 1;\n            maxArea = Math.max(maxArea, h * w);\n        }\n        stack.push(i);\n    }\n    return maxArea;\n}`, testCases:`[2,1,5,6,2,3] → 10\n[2,4] → 4` },
      { id:"sa2", title:"Trapping Rain Water", company:"Amazon", desc:"Given n non-negative integers representing elevation heights, compute how much rainwater can be trapped after rain.", starter:`public int trap(int[] height) {\n    // Stack-based approach\n    \n}`, solution:`public int trap(int[] height) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    int water = 0;\n    for (int i = 0; i < height.length; i++) {\n        while (!stack.isEmpty() && height[i] > height[stack.peek()]) {\n            int bottom = stack.pop();\n            if (stack.isEmpty()) break;\n            int left = stack.peek();\n            int h = Math.min(height[left], height[i]) - height[bottom];\n            water += h * (i - left - 1);\n        }\n        stack.push(i);\n    }\n    return water;\n}`, testCases:`[0,1,0,2,1,0,1,3,2,1,2,1] → 6\n[4,2,0,3,2,5] → 9` },
      { id:"sa3", title:"Asteroid Collision", company:"Meta", desc:"An array represents asteroids. Positive = right, Negative = left. Same size asteroids explode. Find the state after all collisions.", starter:`public int[] asteroidCollision(int[] asteroids) {\n    // Use stack to simulate\n    \n}`, solution:`public int[] asteroidCollision(int[] asteroids) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int a : asteroids) {\n        boolean alive = true;\n        while (alive && a < 0 && !stack.isEmpty() && stack.peek() > 0) {\n            if (stack.peek() < -a) { stack.pop(); }\n            else if (stack.peek() == -a) { stack.pop(); alive = false; }\n            else alive = false;\n        }\n        if (alive) stack.push(a);\n    }\n    int[] res = new int[stack.size()];\n    for (int i = res.length - 1; i >= 0; i--) res[i] = stack.pop();\n    return res;\n}`, testCases:`[5,10,-5] → [5,10]\n[8,-8] → []\n[10,2,-5] → [10]` },
    ],
  },
  "Queue": {
    "Beginner": [
      { id:"qb1", title:"Implement Queue using Stacks", company:"Amazon", desc:"Implement a FIFO queue using two stacks. Support push, pop, peek, and empty operations.", starter:`class MyQueue {\n    public void push(int x) { }\n    public int pop() { }\n    public int peek() { }\n    public boolean empty() { }\n}`, solution:`class MyQueue {\n    Deque<Integer> inbox = new ArrayDeque<>();\n    Deque<Integer> outbox = new ArrayDeque<>();\n    \n    public void push(int x) { inbox.push(x); }\n    private void transfer() {\n        if (outbox.isEmpty())\n            while (!inbox.isEmpty()) outbox.push(inbox.pop());\n    }\n    public int pop() { transfer(); return outbox.pop(); }\n    public int peek() { transfer(); return outbox.peek(); }\n    public boolean empty() { return inbox.isEmpty() && outbox.isEmpty(); }\n}`, testCases:`push(1),push(2),peek() → 1\npop() → 1\nempty() → false` },
      { id:"qb2", title:"Number of Recent Calls", company:"Google", desc:"Count the number of requests in the last 3000 milliseconds.", starter:`class RecentCounter {\n    public int ping(int t) { }\n}`, solution:`class RecentCounter {\n    Queue<Integer> q = new LinkedList<>();\n    public int ping(int t) {\n        q.offer(t);\n        while (q.peek() < t - 3000) q.poll();\n        return q.size();\n    }\n}`, testCases:`ping(1)→1, ping(100)→2, ping(3001)→3, ping(3002)→3` },
      { id:"qb3", title:"Circular Queue Implementation", company:"Microsoft", desc:"Design a circular queue with fixed capacity. Implement enQueue, deQueue, Front, Rear, isEmpty, isFull.", starter:`class MyCircularQueue {\n    int[] arr; int front, rear, size, cap;\n    public MyCircularQueue(int k) { }\n    public boolean enQueue(int val) { }\n    public boolean deQueue() { }\n}`, solution:`class MyCircularQueue {\n    int[] arr; int front=0,rear=-1,size=0,cap;\n    public MyCircularQueue(int k){arr=new int[k];cap=k;}\n    public boolean enQueue(int val){if(isFull())return false;rear=(rear+1)%cap;arr[rear]=val;size++;return true;}\n    public boolean deQueue(){if(isEmpty())return false;front=(front+1)%cap;size--;return true;}\n    public int Front(){return isEmpty()?-1:arr[front];}\n    public int Rear(){return isEmpty()?-1:arr[rear];}\n    public boolean isEmpty(){return size==0;}\n    public boolean isFull(){return size==cap;}\n}`, testCases:`k=3: enQueue(1)→true, enQueue(4)→false (full)` },
    ],
    "Intermediate": [
      { id:"qi1", title:"Binary Tree Level Order Traversal", company:"Amazon", desc:"Return level-order traversal of a binary tree's node values.", starter:`public List<List<Integer>> levelOrder(TreeNode root) {\n    // BFS with queue\n}`, solution:`public List<List<Integer>> levelOrder(TreeNode root) {\n    List<List<Integer>> result = new ArrayList<>();\n    if (root == null) return result;\n    Queue<TreeNode> q = new LinkedList<>();\n    q.offer(root);\n    while (!q.isEmpty()) {\n        int size = q.size();\n        List<Integer> level = new ArrayList<>();\n        for (int i = 0; i < size; i++) {\n            TreeNode node = q.poll();\n            level.add(node.val);\n            if (node.left != null) q.offer(node.left);\n            if (node.right != null) q.offer(node.right);\n        }\n        result.add(level);\n    }\n    return result;\n}`, testCases:`[3,9,20,null,null,15,7] → [[3],[9,20],[15,7]]` },
      { id:"qi2", title:"Rotting Oranges", company:"Google", desc:"Given a grid with fresh(1) and rotten(2) oranges, find minimum minutes until all oranges rot.", starter:`public int orangesRotting(int[][] grid) {\n    // Multi-source BFS\n}`, solution:`public int orangesRotting(int[][] grid) {\n    int rows=grid.length,cols=grid[0].length,fresh=0,mins=0;\n    Queue<int[]> q=new LinkedList<>();\n    for(int r=0;r<rows;r++) for(int c=0;c<cols;c++){if(grid[r][c]==2)q.offer(new int[]{r,c});if(grid[r][c]==1)fresh++;}\n    int[][] dirs={{0,1},{0,-1},{1,0},{-1,0}};\n    while(!q.isEmpty()&&fresh>0){mins++;int size=q.size();for(int i=0;i<size;i++){int[]curr=q.poll();for(int[]d:dirs){int nr=curr[0]+d[0],nc=curr[1]+d[1];if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&grid[nr][nc]==1){grid[nr][nc]=2;fresh--;q.offer(new int[]{nr,nc});}}}}\n    return fresh==0?mins:-1;\n}`, testCases:`[[2,1,1],[1,1,0],[0,1,1]] → 4\n[[0,2]] → 0` },
      { id:"qi3", title:"Task Scheduler", company:"Amazon", desc:"Given tasks and cooldown n, find the minimum time to execute all tasks.", starter:`public int leastInterval(char[] tasks, int n) { }`, solution:`public int leastInterval(char[] tasks, int n) {\n    int[] freq=new int[26];\n    for(char t:tasks) freq[t-'A']++;\n    PriorityQueue<Integer> pq=new PriorityQueue<>(Collections.reverseOrder());\n    for(int f:freq) if(f>0) pq.offer(f);\n    int time=0;\n    while(!pq.isEmpty()){List<Integer> temp=new ArrayList<>();for(int i=0;i<=n;i++){if(!pq.isEmpty())temp.add(pq.poll());time++;if(pq.isEmpty()&&temp.isEmpty())break;}for(int f:temp)if(f-1>0)pq.offer(f-1);}\n    return time;\n}`, testCases:`tasks=["A","A","A","B","B","B"],n=2 → 8` },
    ],
    "Advanced": [
      { id:"qa1", title:"Sliding Window Maximum", company:"Amazon", desc:"Find the maximum in each sliding window of size k in an array.", starter:`public int[] maxSlidingWindow(int[] nums, int k) { }`, solution:`public int[] maxSlidingWindow(int[] nums, int k) {\n    int n=nums.length;\n    int[] result=new int[n-k+1];\n    Deque<Integer> deque=new ArrayDeque<>();\n    for(int i=0;i<n;i++){while(!deque.isEmpty()&&deque.peekFirst()<i-k+1)deque.pollFirst();while(!deque.isEmpty()&&nums[deque.peekLast()]<nums[i])deque.pollLast();deque.offerLast(i);if(i>=k-1)result[i-k+1]=nums[deque.peekFirst()];}\n    return result;\n}`, testCases:`[1,3,-1,-3,5,3,6,7],k=3 → [3,3,5,5,6,7]` },
      { id:"qa2", title:"Course Schedule II (Topological Sort)", company:"Google", desc:"Given numCourses and prerequisites, return the order to finish all courses.", starter:`public int[] findOrder(int numCourses, int[][] prerequisites) { }`, solution:`public int[] findOrder(int numCourses, int[][] prereqs) {\n    List<List<Integer>> adj=new ArrayList<>();\n    int[] inDegree=new int[numCourses];\n    for(int i=0;i<numCourses;i++) adj.add(new ArrayList<>());\n    for(int[] p:prereqs){adj.get(p[1]).add(p[0]);inDegree[p[0]]++;}\n    Queue<Integer> q=new LinkedList<>();\n    for(int i=0;i<numCourses;i++) if(inDegree[i]==0) q.offer(i);\n    int[] result=new int[numCourses];int idx=0;\n    while(!q.isEmpty()){int node=q.poll();result[idx++]=node;for(int next:adj.get(node))if(--inDegree[next]==0)q.offer(next);}\n    return idx==numCourses?result:new int[]{};\n}`, testCases:`numCourses=2,prerequisites=[[1,0]] → [0,1]` },
      { id:"qa3", title:"Find Median from Data Stream", company:"Meta", desc:"Design a data structure to add numbers and find the median.", starter:`class MedianFinder {\n    public void addNum(int num) { }\n    public double findMedian() { }\n}`, solution:`class MedianFinder {\n    PriorityQueue<Integer> lo=new PriorityQueue<>(Collections.reverseOrder());\n    PriorityQueue<Integer> hi=new PriorityQueue<>();\n    public void addNum(int num){lo.offer(num);hi.offer(lo.poll());if(lo.size()<hi.size())lo.offer(hi.poll());}\n    public double findMedian(){return lo.size()>hi.size()?lo.peek():(lo.peek()+hi.peek())/2.0;}\n}`, testCases:`addNum(1),addNum(2),findMedian()→1.5\naddNum(3),findMedian()→2.0` },
    ],
  },
  "Linear Search": {
    "Beginner": [
      { id:"lb1", title:"Find First Occurrence", company:"TCS", desc:"Given an array and target, return the index of the first occurrence, or -1 if not found.", starter:`public int findFirst(int[] arr, int target) { }`, solution:`public int findFirst(int[] arr, int target) {\n    for (int i = 0; i < arr.length; i++)\n        if (arr[i] == target) return i;\n    return -1;\n}`, testCases:`[4,8,2,9,5], target=9 → 3\n[1,2,3,4,5], target=6 → -1` },
      { id:"lb2", title:"Two Sum", company:"Amazon", desc:"Return indices of two numbers that add up to target. Use HashMap for O(n).", starter:`public int[] twoSum(int[] nums, int target) { }`, solution:`public int[] twoSum(int[] nums, int target) {\n    Map<Integer,Integer> map = new HashMap<>();\n    for (int i=0;i<nums.length;i++) {\n        int comp = target - nums[i];\n        if (map.containsKey(comp)) return new int[]{map.get(comp),i};\n        map.put(nums[i],i);\n    }\n    return new int[]{};\n}`, testCases:`[2,7,11,15],target=9 → [0,1]\n[3,2,4],target=6 → [1,2]` },
      { id:"lb3", title:"Maximum Element", company:"Infosys", desc:"Find the maximum element in an unsorted array using a single linear scan.", starter:`public int findMax(int[] arr) { }`, solution:`public int findMax(int[] arr) {\n    int max = arr[0];\n    for (int i=1;i<arr.length;i++)\n        if (arr[i] > max) max = arr[i];\n    return max;\n}`, testCases:`[3,1,4,1,5,9,2,6] → 9\n[-5,-1,-3] → -1` },
    ],
    "Intermediate": [
      { id:"li1", title:"Maximum Subarray (Kadane's)", company:"Amazon", desc:"Find the contiguous subarray with the largest sum.", starter:`public int maxSubArray(int[] nums) { }`, solution:`public int maxSubArray(int[] nums) {\n    int maxSum = nums[0], currSum = nums[0];\n    for (int i=1;i<nums.length;i++) {\n        currSum = Math.max(nums[i], currSum + nums[i]);\n        maxSum = Math.max(maxSum, currSum);\n    }\n    return maxSum;\n}`, testCases:`[-2,1,-3,4,-1,2,1,-5,4] → 6\n[5,4,-1,7,8] → 23` },
      { id:"li2", title:"Majority Element (Boyer-Moore)", company:"Meta", desc:"Find the element appearing more than n/2 times using O(1) space.", starter:`public int majorityElement(int[] nums) { }`, solution:`public int majorityElement(int[] nums) {\n    int candidate=nums[0], count=1;\n    for (int i=1;i<nums.length;i++) {\n        if (count==0) { candidate=nums[i]; count=1; }\n        else if (nums[i]==candidate) count++;\n        else count--;\n    }\n    return candidate;\n}`, testCases:`[3,2,3] → 3\n[2,2,1,1,1,2,2] → 2` },
      { id:"li3", title:"Best Time to Buy and Sell Stock", company:"Amazon", desc:"Find the maximum profit by buying and selling a stock once.", starter:`public int maxProfit(int[] prices) { }`, solution:`public int maxProfit(int[] prices) {\n    int minPrice = prices[0], maxProfit = 0;\n    for (int price : prices) {\n        minPrice = Math.min(minPrice, price);\n        maxProfit = Math.max(maxProfit, price - minPrice);\n    }\n    return maxProfit;\n}`, testCases:`[7,1,5,3,6,4] → 5\n[7,6,4,3,1] → 0` },
    ],
    "Advanced": [
      { id:"la1", title:"Trapping Rain Water (Two Pointer)", company:"Google", desc:"Calculate total rainwater trapped using the two-pointer linear scan technique.", starter:`public int trap(int[] height) { }`, solution:`public int trap(int[] height) {\n    int left=0,right=height.length-1,leftMax=0,rightMax=0,water=0;\n    while(left<right){if(height[left]<height[right]){if(height[left]>=leftMax)leftMax=height[left];else water+=leftMax-height[left];left++;}else{if(height[right]>=rightMax)rightMax=height[right];else water+=rightMax-height[right];right--;}}\n    return water;\n}`, testCases:`[0,1,0,2,1,0,1,3,2,1,2,1] → 6\n[4,2,0,3,2,5] → 9` },
      { id:"la2", title:"Maximum Product Subarray", company:"Microsoft", desc:"Find the contiguous subarray with the largest product.", starter:`public int maxProduct(int[] nums) { }`, solution:`public int maxProduct(int[] nums) {\n    int maxP=nums[0],minP=nums[0],result=nums[0];\n    for(int i=1;i<nums.length;i++){int tmp=maxP;maxP=Math.max(nums[i],Math.max(maxP*nums[i],minP*nums[i]));minP=Math.min(nums[i],Math.min(tmp*nums[i],minP*nums[i]));result=Math.max(result,maxP);}\n    return result;\n}`, testCases:`[2,3,-2,4] → 6\n[-2,3,-4] → 24` },
      { id:"la3", title:"Dutch National Flag", company:"Google", desc:"Sort array of 0s, 1s, 2s in-place in one pass without extra space.", starter:`public void sortColors(int[] nums) { }`, solution:`public void sortColors(int[] nums) {\n    int lo=0,mid=0,hi=nums.length-1;\n    while(mid<=hi){if(nums[mid]==0){int t=nums[lo];nums[lo++]=nums[mid];nums[mid++]=t;}else if(nums[mid]==1){mid++;}else{int t=nums[hi];nums[hi--]=nums[mid];nums[mid]=t;}}\n}`, testCases:`[2,0,2,1,1,0] → [0,0,1,1,2,2]` },
    ],
  },
  "Bubble Sort": {
    "Beginner": [
      { id:"bb1", title:"Implement Bubble Sort", company:"TCS", desc:"Sort an integer array in ascending order using Bubble Sort with the swapped-flag optimization.", starter:`public void bubbleSort(int[] arr) { }`, solution:`public void bubbleSort(int[] arr) {\n    int n = arr.length;\n    for (int i=0;i<n-1;i++) {\n        boolean swapped = false;\n        for (int j=0;j<n-1-i;j++) {\n            if (arr[j]>arr[j+1]) {\n                int tmp=arr[j]; arr[j]=arr[j+1]; arr[j+1]=tmp;\n                swapped=true;\n            }\n        }\n        if (!swapped) break;\n    }\n}`, testCases:`[5,3,8,4,2] → [2,3,4,5,8]\n[1,2,3,4,5] → [1,2,3,4,5] (early exit)` },
      { id:"bb2", title:"Sort Strings Alphabetically", company:"Wipro", desc:"Sort an array of strings alphabetically using Bubble Sort.", starter:`public void sortStrings(String[] arr) { }`, solution:`public void sortStrings(String[] arr) {\n    int n = arr.length;\n    for (int i=0;i<n-1;i++)\n        for (int j=0;j<n-1-i;j++)\n            if (arr[j].compareTo(arr[j+1])>0) {\n                String tmp=arr[j]; arr[j]=arr[j+1]; arr[j+1]=tmp;\n            }\n}`, testCases:`["banana","apple","cherry"] → ["apple","banana","cherry"]` },
      { id:"bb3", title:"Check if Array is Sorted", company:"Accenture", desc:"Return true if array is sorted in ascending order.", starter:`public boolean isSorted(int[] arr) { }`, solution:`public boolean isSorted(int[] arr) {\n    for (int i=0;i<arr.length-1;i++)\n        if (arr[i]>arr[i+1]) return false;\n    return true;\n}`, testCases:`[1,2,3,4,5] → true\n[1,3,2,4,5] → false` },
    ],
    "Intermediate": [
      { id:"bi1", title:"Count Inversions", company:"Amazon", desc:"Count the number of inversions in an array. Use merge sort for O(n log n).", starter:`public long countInversions(int[] arr) { }`, solution:`public long countInversions(int[] arr){return mergeCount(arr,0,arr.length-1);}\nprivate long mergeCount(int[]arr,int l,int r){if(l>=r)return 0;int mid=(l+r)/2;long inv=mergeCount(arr,l,mid)+mergeCount(arr,mid+1,r);return inv+merge(arr,l,mid,r);}\nprivate long merge(int[]arr,int l,int mid,int r){int[]tmp=new int[r-l+1];int i=l,j=mid+1,k=0;long inv=0;while(i<=mid&&j<=r){if(arr[i]<=arr[j])tmp[k++]=arr[i++];else{inv+=(mid-i+1);tmp[k++]=arr[j++];}}while(i<=mid)tmp[k++]=arr[i++];while(j<=r)tmp[k++]=arr[j++];System.arraycopy(tmp,0,arr,l,tmp.length);return inv;}`, testCases:`[2,4,1,3,5] → 3\n[2,3,4,5,6,1] → 5` },
      { id:"bi2", title:"Merge Sort Implementation", company:"Google", desc:"Implement Merge Sort. Understand why it's O(n log n) while Bubble Sort is O(n²).", starter:`public void mergeSort(int[] arr, int left, int right) { }`, solution:`public void mergeSort(int[]arr,int left,int right){if(left>=right)return;int mid=(left+right)/2;mergeSort(arr,left,mid);mergeSort(arr,mid+1,right);merge(arr,left,mid,right);}\nprivate void merge(int[]arr,int l,int mid,int r){int[]tmp=new int[r-l+1];int i=l,j=mid+1,k=0;while(i<=mid&&j<=r)tmp[k++]=arr[i]<=arr[j]?arr[i++]:arr[j++];while(i<=mid)tmp[k++]=arr[i++];while(j<=r)tmp[k++]=arr[j++];System.arraycopy(tmp,0,arr,l,tmp.length);}`, testCases:`[5,3,8,4,2] → [2,3,4,5,8]` },
      { id:"bi3", title:"Sort Array of 0s, 1s, 2s", company:"Microsoft", desc:"Sort array containing only 0s, 1s, and 2s in O(n) without extra space.", starter:`public void sortColors(int[] nums) { }`, solution:`public void sortColors(int[]nums){int lo=0,mid=0,hi=nums.length-1;while(mid<=hi){if(nums[mid]==0){int t=nums[lo];nums[lo++]=nums[mid];nums[mid++]=t;}else if(nums[mid]==1)mid++;else{int t=nums[hi];nums[hi--]=nums[mid];nums[mid]=t;}}}`, testCases:`[2,0,2,1,1,0] → [0,0,1,1,2,2]` },
    ],
    "Advanced": [
      { id:"ba1", title:"Sort K-Sorted Array", company:"Amazon", desc:"Sort an array where each element is at most k positions from its sorted position using a Min-Heap.", starter:`public int[] sortKSortedArray(int[] arr, int k) { }`, solution:`public int[] sortKSortedArray(int[]arr,int k){PriorityQueue<Integer> pq=new PriorityQueue<>();int[]result=new int[arr.length];int ri=0;for(int i=0;i<arr.length;i++){pq.offer(arr[i]);if(pq.size()>k)result[ri++]=pq.poll();}while(!pq.isEmpty())result[ri++]=pq.poll();return result;}`, testCases:`[6,5,3,2,8,10,9], k=3 → [2,3,5,6,8,9,10]` },
      { id:"ba2", title:"Quick Sort Implementation", company:"Google", desc:"Implement Quick Sort with Lomuto partition scheme.", starter:`public void quickSort(int[] arr, int low, int high) { }`, solution:`public void quickSort(int[]arr,int low,int high){if(low<high){int pi=partition(arr,low,high);quickSort(arr,low,pi-1);quickSort(arr,pi+1,high);}}\nprivate int partition(int[]arr,int low,int high){int pivot=arr[high],i=low-1;for(int j=low;j<high;j++)if(arr[j]<=pivot){i++;int tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;}int tmp=arr[i+1];arr[i+1]=arr[high];arr[high]=tmp;return i+1;}`, testCases:`[5,3,8,4,2] → [2,3,4,5,8]` },
      { id:"ba3", title:"Find Kth Largest Element", company:"Meta", desc:"Find the kth largest element using QuickSelect for O(n) average time.", starter:`public int findKthLargest(int[] nums, int k) { }`, solution:`public int findKthLargest(int[]nums,int k){return quickSelect(nums,0,nums.length-1,nums.length-k);}\nprivate int quickSelect(int[]arr,int lo,int hi,int target){int pivot=arr[hi],i=lo-1;for(int j=lo;j<hi;j++)if(arr[j]<=pivot){i++;int t=arr[i];arr[i]=arr[j];arr[j]=t;}i++;int t=arr[i];arr[i]=arr[hi];arr[hi]=t;if(i==target)return arr[i];return i<target?quickSelect(arr,i+1,hi,target):quickSelect(arr,lo,i-1,target);}`, testCases:`[3,2,1,5,6,4],k=2 → 5` },
    ],
  },
};

/* ============================================================
   CODE ANALYZER
============================================================ */
function analyzeCode(code) {
  const errors = [], warnings = [];
  const lines = code.split('\n');
  let open = 0, close = 0;
  for (const ch of code) { if (ch==='{') open++; if (ch==='}') close++; }
  if (open !== close) errors.push({ type:"error", msg:`Unmatched braces: ${open} '{' and ${close} '}'` });
  lines.forEach((line, idx) => {
    const t = line.trim();
    if (!t.length) return;
    const needsSemi = /^(return|int |String |boolean |double |float |long |char |var |List |Map |Set |Deque |Queue |Stack )/.test(t)
      && !t.endsWith(';') && !t.endsWith('{') && !t.endsWith('}') && !t.endsWith(',') && !t.startsWith('//');
    if (needsSemi) warnings.push({ type:"warning", msg:`Line ${idx+1}: Possible missing semicolon` });
  });
  if (/\bif\s*\([^)]*=[^=]/.test(code)) warnings.push({ type:"warning", msg:"Assignment inside if condition — did you mean '=='?" });
  if (code.includes('.peek()') && !code.includes('isEmpty')) warnings.push({ type:"warning", msg:"Calling peek() without isEmpty() check — potential NullPointerException" });
  if (code.includes('.pop()') && !code.includes('isEmpty')) warnings.push({ type:"warning", msg:"Calling pop() without isEmpty() check — potential EmptyStackException" });
  if (open > 0 && open === close && errors.length === 0 && (code.includes('while') || code.includes('for')))
    warnings.push({ type:"info", msg:"Loop detected — verify termination condition" });
  return { errors, warnings };
}

/* ============================================================
   CONSTANTS
============================================================ */
const MOD_COLORS = { "Stack":"#0071e3", "Queue":"#34c759", "Linear Search":"#ff9500", "Bubble Sort":"#af52de" };
const MOD_ICONS = { "Stack":"📚", "Queue":"🔄", "Linear Search":"🔍", "Bubble Sort":"🫧" };
const MODULES = ["Stack", "Queue", "Linear Search", "Bubble Sort"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

/* ============================================================
   PROGRESS STORE
============================================================ */
const useProgress = () => {
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dsaProgress_v2') || '{}'); } catch { return {}; }
  });
  const save = useCallback((key, val) => {
    setProgress(p => { const n = {...p,[key]:val}; try{localStorage.setItem('dsaProgress_v2',JSON.stringify(n))}catch{}; return n; });
  }, []);
  return [progress, save];
};

/* ============================================================
   FITA ACADEMY PROFILE — Apple Style
============================================================ */
const FitaAcademyProfile = () => {
  const courses = [
    { name:"Data Structures & Algorithms", icon:"🧮", color:"#0071e3" },
    { name:"UI/UX Design", icon:"🎨", color:"#34c759" },
    { name:"Full Stack Development", icon:"💻", color:"#ff9500" },
    { name:"Python & Machine Learning", icon:"🤖", color:"#af52de" },
    { name:"Cloud Computing (AWS/Azure)", icon:"☁️", color:"#ff3b30" },
    { name:"Placement Training", icon:"🏆", color:"#5ac8fa" },
  ];
  return (
    <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.6,ease:[0.22,1,0.36,1]}} style={{width:"100%",maxWidth:720}}>
      {/* Hero Card */}
      <div style={{background:"white",borderRadius:24,overflow:"hidden",marginBottom:16,boxShadow:"var(--shadow-lg)"}}>
        <div style={{background:"linear-gradient(145deg,#f5f5f7,#e8f2ff)",padding:"40px 36px 32px",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-60,right:-60,width:200,height:200,background:"radial-gradient(circle,rgba(0,113,227,0.12),transparent 70%)"}}/>
          <div style={{display:"flex",alignItems:"center",gap:24}}>
            <motion.div animate={{y:[0,-6,0]}} transition={{duration:3,repeat:Infinity,ease:"easeInOut"}}
              style={{width:80,height:80,borderRadius:20,background:"linear-gradient(135deg,#0071e3,#0a84ff)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 8px 24px rgba(0,113,227,0.35)",flexShrink:0}}>
              <span style={{fontSize:36}}>🎓</span>
            </motion.div>
            <div>
              <div style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                <span style={{fontSize:11,fontWeight:600,letterSpacing:0.5,color:"#0071e3",background:"rgba(0,113,227,0.1)",padding:"3px 10px",borderRadius:20}}>IT Training Institute</span>
                <span style={{fontSize:11,fontWeight:600,color:"#34c759",background:"rgba(52,199,89,0.1)",padding:"3px 10px",borderRadius:20}}>✓ Verified</span>
              </div>
              <h2 style={{fontSize:28,fontWeight:700,color:"#1d1d1f",letterSpacing:-0.5,marginBottom:4}}>FITA Academy</h2>
              <p style={{fontSize:14,color:"#86868b",fontFamily:"var(--font-mono)"}}>Chennai • Bangalore • malaysia</p>
            </div>
          </div>
          {/* Stats */}
          <div style={{display:"flex",gap:28,marginTop:24}}>
            {[["10K+","Students"],["50+","Courses"],["95%","Placement"],["15+","Years"]].map(([n,l])=>(
              <div key={l}>
                <div style={{fontSize:22,fontWeight:700,color:"#1d1d1f"}}>{n}</div>
                <div style={{fontSize:11,color:"#86868b",marginTop:1}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Links */}
        <div style={{padding:"24px 36px",display:"flex",gap:12,flexWrap:"wrap",borderBottom:"1px solid var(--border)"}}>
          {[
            {href:"https://www.linkedin.com/company/fitaofficial/",label:"LinkedIn",color:"#0a66c2",icon:"in"},
            {href:"https://www.fita.in",label:"fita.in",color:"#0071e3",icon:"🌐"},
          ].map(({href,label,color,icon})=>(
            <motion.a key={label} href={href} target="_blank" rel="noopener noreferrer"
              whileHover={{scale:1.03,y:-1}} whileTap={{scale:0.98}}
              style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 20px",background:"white",border:"1.5px solid var(--border)",borderRadius:12,color,fontWeight:600,fontSize:13,boxShadow:"var(--shadow-sm)"}}>
              <span>{icon}</span>{label} ↗
            </motion.a>
          ))}
        </div>
        {/* CTA */}
        <div style={{padding:"24px 36px"}}>
          <p style={{fontSize:14,color:"#424245",lineHeight:1.7,marginBottom:16}}>
            At FITA Academy, you don't just learn — you get placement-ready. From Data Structures & Algorithms to UI/UX Design, expert-led courses crafted for real-world success.
          </p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <motion.a href="https://www.fita.in" target="_blank" rel="noopener noreferrer"
              whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 24px",fontSize:14,fontWeight:600,background:"#0071e3",color:"white",borderRadius:14,boxShadow:"var(--shadow-blue)"}}>
              Explore All Courses →
            </motion.a>
            <motion.a href="https://www.linkedin.com/company/fitaofficial/" target="_blank" rel="noopener noreferrer"
              whileHover={{scale:1.03}} whileTap={{scale:0.97}}
              style={{display:"inline-flex",alignItems:"center",gap:8,padding:"12px 24px",fontSize:14,fontWeight:600,background:"white",color:"#424245",border:"1.5px solid var(--border)",borderRadius:14}}>
              Follow on LinkedIn
            </motion.a>
          </div>
        </div>
      </div>
      {/* Courses */}
      <div style={{background:"white",borderRadius:20,padding:"24px",boxShadow:"var(--shadow)"}}>
        <p style={{fontSize:12,fontWeight:600,letterSpacing:0.5,color:"#86868b",textTransform:"uppercase",marginBottom:16}}>Popular Courses</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:10}}>
          {courses.map((c,i)=>(
            <motion.a key={i} href="https://www.fita.in" target="_blank" rel="noopener noreferrer"
              initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.06}}
              whileHover={{scale:1.03,y:-2}}
              style={{padding:"14px 16px",background:c.color+"0d",border:`1.5px solid ${c.color}22`,borderRadius:14,display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:18}}>{c.icon}</span>
              <span style={{fontSize:12,fontWeight:600,color:c.color,lineHeight:1.4}}>{c.name}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const PillBtn = ({ onClick, active, children, color, style: s }) => (
  <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={onClick}
    style={{padding:"9px 20px",fontSize:13,fontWeight:600,borderRadius:50,border:"none",cursor:"pointer",transition:"all 0.2s",
      background: active ? (color||"#0071e3") : "white",
      color: active ? "white" : "#424245",
      boxShadow: active ? `0 4px 12px ${(color||"#0071e3")}44` : "var(--shadow-sm)",
      ...s
    }}>
    {children}
  </motion.button>
);

/* ============================================================
   HOME SCREEN — Apple-style
============================================================ */
export const HomeScreen = ({ onEnter }) => {
  const [tab, setTab] = useState("home");
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)",position:"relative",overflow:"hidden"}}>
      {/* Apple-style background blobs */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        <div style={{position:"absolute",top:"-10%",left:"20%",width:600,height:600,background:"radial-gradient(circle,rgba(0,113,227,0.12),transparent 70%)",borderRadius:"50%",filter:"blur(40px)"}}/>
        <div style={{position:"absolute",bottom:"-10%",right:"10%",width:500,height:500,background:"radial-gradient(circle,rgba(52,199,89,0.1),transparent 70%)",borderRadius:"50%",filter:"blur(40px)"}}/>
        <div style={{position:"absolute",top:"40%",right:"25%",width:400,height:400,background:"radial-gradient(circle,rgba(175,82,222,0.08),transparent 70%)",borderRadius:"50%",filter:"blur(40px)"}}/>
      </div>

      {/* Top Nav */}
      <div style={{position:"fixed",top:0,left:0,right:0,zIndex:100,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(245,245,247,0.8)",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:1100,margin:"0 auto",padding:"0 40px",height:52,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:8,background:"#0071e3",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <span style={{fontSize:14,fontWeight:800,color:"white",fontFamily:"var(--font-mono)"}}>F</span>
            </div>
            <span style={{fontSize:15,fontWeight:600,color:"#1d1d1f"}}>FITA DSA</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            {[["home","Home"],["company","FITA Academy"]].map(([t,l])=>(
              <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 16px",fontSize:13,fontWeight:500,borderRadius:20,background:tab===t?"#0071e3":"transparent",color:tab===t?"white":"#424245",border:"none",cursor:"pointer",transition:"all 0.2s"}}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{paddingTop:52,minHeight:"100vh",display:"flex",justifyContent:"center",alignItems:"center",padding:"72px 40px 60px",position:"relative",zIndex:1}}>
        <AnimatePresence mode="wait">
          {tab==="home" && (
            <motion.div key="hero" initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} transition={{duration:0.5,ease:[0.22,1,0.36,1]}} style={{textAlign:"center",maxWidth:680}}>
              {/* Badge */}
              <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:0.1}}
                style={{display:"inline-flex",alignItems:"center",gap:8,background:"white",border:"1.5px solid rgba(0,113,227,0.2)",borderRadius:50,padding:"8px 18px",marginBottom:32,boxShadow:"var(--shadow-sm)"}}>
                <div style={{width:6,height:6,borderRadius:"50%",background:"#34c759",animation:"pulse-glow 2s infinite"}}/>
                <span style={{fontSize:13,fontWeight:500,color:"#0071e3"}}>Beginner DSA Learning Platform</span>
              </motion.div>

              {/* Hero Title */}
              <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.15}}
                style={{fontSize:"clamp(2.8rem,7vw,5.2rem)",fontWeight:700,lineHeight:1.05,letterSpacing:-2,color:"#1d1d1f",marginBottom:20}}>
                Learn Basic<br/>
                <span style={{color:"#0071e3"}}>Data Structures</span><br/>
                <span style={{color:"#424245",fontWeight:400,fontSize:"clamp(1.8rem,4vw,3rem)"}}>with FITA Academy</span>
              </motion.h1>

              <motion.p initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}}
                style={{fontSize:17,color:"#86868b",lineHeight:1.7,marginBottom:12}}>
                Interactive visualizations • MNC interview Q&A<br/>Adaptive coding challenges • Progress tracking
              </motion.p>

              {/* FITA badge */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.25}}
                onClick={()=>setTab("company")} whileHover={{scale:1.02}} style={{display:"inline-flex",alignItems:"center",gap:10,cursor:"pointer",padding:"10px 20px",background:"white",border:"1.5px solid rgba(0,113,227,0.2)",borderRadius:50,marginBottom:40,boxShadow:"var(--shadow-sm)"}}>
                <div style={{width:24,height:24,borderRadius:6,background:"#0071e3",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:12,fontWeight:800,color:"white",fontFamily:"var(--font-mono)"}}>F</span>
                </div>
                <span style={{fontSize:13,fontWeight:500,color:"#424245"}}>Powered by <strong style={{color:"#0071e3"}}>FITA Academy</strong></span>
                <span style={{color:"#86868b"}}>→</span>
              </motion.div>

              <br/>

              <motion.button initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
                whileHover={{scale:1.04,boxShadow:"0 8px 30px rgba(0,113,227,0.35)"}} whileTap={{scale:0.97}}
                onClick={onEnter}
                style={{padding:"16px 48px",fontSize:17,fontWeight:600,background:"#0071e3",color:"white",borderRadius:50,border:"none",cursor:"pointer",boxShadow:"var(--shadow-blue)",letterSpacing:-0.2}}>
                Start Learning →
              </motion.button>

              {/* Module previews */}
              <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
                style={{display:"flex",gap:12,justifyContent:"center",marginTop:60,flexWrap:"wrap"}}>
                {MODULES.map((m,i)=>(
                  <motion.div key={m} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:0.45+i*0.07}}
                    style={{background:"white",border:"1.5px solid var(--border)",borderRadius:16,padding:"14px 20px",display:"flex",alignItems:"center",gap:10,boxShadow:"var(--shadow-sm)"}}>
                    <span style={{fontSize:18}}>{MOD_ICONS[m]}</span>
                    <div>
                      <div style={{fontSize:13,fontWeight:600,color:"#1d1d1f"}}>{m}</div>
                      <div style={{fontSize:11,color:"#86868b"}}>20 Q&A • 9 Problems</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
          {tab==="company" && (
            <motion.div key="company" initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-20}} transition={{duration:0.4}}
              style={{width:"100%",maxWidth:760,maxHeight:"85vh",overflowY:"auto",paddingTop:20,paddingBottom:40}}>
              <FitaAcademyProfile/>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

/* ============================================================
   DSA SCREEN
============================================================ */
const DSAScreen = ({ level, setLevel, onSelectModule, onBack, progress }) => {
  const [activeTab, setActiveTab] = useState("learn");
  return (
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      {/* Sticky header */}
      <div style={{position:"sticky",top:0,zIndex:50,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(245,245,247,0.85)",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 32px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,color:"#0071e3",fontSize:14,fontWeight:500,cursor:"pointer"}}>
              <span>‹</span> Home
            </button>
            <span style={{color:"#d2d2d7"}}>|</span>
            <span style={{fontSize:15,fontWeight:600,color:"#1d1d1f"}}>Choose Your Path</span>
          </div>
          <div style={{display:"flex",gap:4,background:"rgba(0,0,0,0.06)",borderRadius:12,padding:3}}>
            {[["learn","📚 Learn"],["interview","🎤 Interview"],["code","💻 Code"]].map(([t,l])=>(
              <button key={t} onClick={()=>setActiveTab(t)} style={{padding:"6px 16px",fontSize:13,fontWeight:500,borderRadius:9,border:"none",cursor:"pointer",transition:"all 0.2s",background:activeTab===t?"white":"transparent",color:activeTab===t?"#1d1d1f":"#86868b",boxShadow:activeTab===t?"var(--shadow-sm)":"none"}}>
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"40px 32px"}}>
        {activeTab==="learn" && <LearnTab level={level} setLevel={setLevel} onSelectModule={onSelectModule} progress={progress}/>}
        {activeTab==="interview" && <InterviewTab/>}
        {activeTab==="code" && <CodeArenaTab/>}
      </div>
    </div>
  );
};

/* ============================================================
   LEARN TAB
============================================================ */
const LearnTab = ({ level, setLevel, onSelectModule, progress }) => (
  <div>
    <div style={{marginBottom:32}}>
      <h2 style={{fontSize:32,fontWeight:700,letterSpacing:-1,color:"#1d1d1f",marginBottom:6}}>Modules</h2>
      <p style={{color:"#86868b",fontSize:15}}>Start with fundamentals and progress to advanced concepts</p>
    </div>
    <div style={{display:"flex",gap:8,marginBottom:32}}>
      {LEVELS.map(l=><PillBtn key={l} active={level===l} onClick={()=>setLevel(l)} color="#0071e3">{l}</PillBtn>)}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))",gap:16}}>
      {MODULES.map((mod,i)=>{
        const color=MOD_COLORS[mod];
        const done = Object.keys(progress).filter(k=>k.startsWith(`interview_${mod}`)).length;
        const codeDone = Object.keys(progress).filter(k=>k.startsWith(`code_${mod}`)).length;
        return(
          <motion.button key={mod} initial={{opacity:0,y:24}} animate={{opacity:1,y:0}} transition={{delay:i*0.07,ease:[0.22,1,0.36,1]}}
            whileHover={{scale:1.02,y:-2,boxShadow:"var(--shadow-lg)"}} whileTap={{scale:0.98}}
            onClick={()=>onSelectModule(mod)}
            style={{textAlign:"left",padding:28,background:"white",border:"1.5px solid var(--border)",borderRadius:20,boxShadow:"var(--shadow)",cursor:"pointer",transition:"box-shadow 0.3s"}}>
            <div style={{width:48,height:48,borderRadius:14,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}>
              <span style={{fontSize:22}}>{MOD_ICONS[mod]}</span>
            </div>
            <div style={{fontSize:20,fontWeight:700,color:"#1d1d1f",marginBottom:6}}>{mod}</div>
            <div style={{fontSize:13,color:"#86868b",marginBottom:16}}>{["LIFO structure","FIFO structure","Sequential scan","Comparison sort"][i]}</div>
            <div style={{display:"flex",gap:12}}>
              <span style={{fontSize:12,color,fontWeight:500}}>🎤 {done}/20 Q&A</span>
              <span style={{fontSize:12,color:"#34c759",fontWeight:500}}>💻 {codeDone}/9 solved</span>
            </div>
            <div style={{marginTop:16,height:4,background:"#f5f5f7",borderRadius:4,overflow:"hidden"}}>
              <motion.div initial={{width:0}} animate={{width:`${Math.round(((done+codeDone)/29)*100)}%`}} transition={{duration:0.8,ease:"easeOut"}}
                style={{height:"100%",background:`linear-gradient(90deg,${color},${color}99)`,borderRadius:4}}/>
            </div>
          </motion.button>
        );
      })}
    </div>
  </div>
);

/* ============================================================
   MOCK INTERVIEW TAB
============================================================ */
const InterviewTab = () => {
  const [progress, saveProgress] = useProgress();
  const [selMod, setSelMod] = useState("Stack");
  const [filter, setFilter] = useState("All");
  const [revealed, setReveal] = useState({});

  const questions = INTERVIEW_DATA[selMod] || [];
  const filtered = filter==="All" ? questions : questions.filter(q=>q.difficulty===filter);

  const toggleReveal = (id) => setReveal(p=>({...p,[id]:!p[id]}));
  const markAnswer = (id, correct) => saveProgress(`interview_${selMod}_${id}`, correct ? "correct" : "wrong");

  return (
    <div>
      <div style={{marginBottom:28}}>
        <h2 style={{fontSize:32,fontWeight:700,letterSpacing:-1,color:"#1d1d1f",marginBottom:6}}>Mock Interview</h2>
        <p style={{color:"#86868b",fontSize:15}}>20 MNC-sourced questions per module with real company tags</p>
      </div>

      <div style={{display:"flex",gap:8,marginBottom:20,flexWrap:"wrap"}}>
        {MODULES.map(m=>{
          const c=MOD_COLORS[m];
          return <PillBtn key={m} active={selMod===m} onClick={()=>{setSelMod(m);setReveal({});}} color={c}>{MOD_ICONS[m]} {m}</PillBtn>;
        })}
      </div>

      <ProgressCard module={selMod} progress={progress} total={20} type="interview"/>

      <div style={{display:"flex",gap:8,marginBottom:24,flexWrap:"wrap"}}>
        {["All","Easy","Medium","Hard"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{padding:"6px 16px",fontSize:12,fontWeight:600,borderRadius:20,border:"1.5px solid",borderColor:filter===f?"transparent":"var(--border)",cursor:"pointer",transition:"all 0.2s",background:filter===f?({All:"#1d1d1f",Easy:"#34c759",Medium:"#ff9500",Hard:"#ff3b30"}[f]):"white",color:filter===f?"white":"#424245"}}>
            {f}
          </button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {filtered.map((item, idx)=>{
          const qid = `q${questions.indexOf(item)}`;
          const key = `interview_${selMod}_${qid}`;
          const status = progress[key];
          const isRevealed = revealed[qid];
          const diffData = {Easy:{color:"#34c759",bg:"#e8f9ee"},Medium:{color:"#ff9500",bg:"#fff4e6"},Hard:{color:"#ff3b30",bg:"#fff1f0"}}[item.difficulty];
          return(
            <motion.div key={qid} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:idx*0.02,ease:[0.22,1,0.36,1]}}
              style={{background:"white",border:"1.5px solid",borderColor:status==="correct"?"rgba(52,199,89,0.3)":status==="wrong"?"rgba(255,59,48,0.3)":"var(--border)",borderRadius:18,overflow:"hidden",boxShadow:"var(--shadow-sm)"}}>
              <div style={{padding:"20px 24px",cursor:"pointer"}} onClick={()=>toggleReveal(qid)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap",alignItems:"center"}}>
                      <span style={{fontSize:11,fontWeight:600,color:diffData.color,background:diffData.bg,padding:"3px 10px",borderRadius:20}}>{item.difficulty}</span>
                      <span style={{fontSize:11,fontWeight:500,color:"#86868b",background:"#f5f5f7",padding:"3px 10px",borderRadius:20}}>{item.company}</span>
                      {status==="correct" && <span style={{fontSize:11,color:"#34c759",fontWeight:600}}>✓ Got it</span>}
                      {status==="wrong" && <span style={{fontSize:11,color:"#ff3b30",fontWeight:600}}>Review needed</span>}
                    </div>
                    <p style={{fontSize:15,fontWeight:500,lineHeight:1.6,color:"#1d1d1f"}}>{item.q}</p>
                  </div>
                  <motion.span animate={{rotate:isRevealed?180:0}} transition={{duration:0.2}}
                    style={{fontSize:16,color:"#86868b",flexShrink:0,marginTop:2}}>↓</motion.span>
                </div>
              </div>
              <AnimatePresence>
                {isRevealed && (
                  <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} transition={{duration:0.25,ease:[0.22,1,0.36,1]}}>
                    <div style={{padding:"0 24px 20px",borderTop:"1px solid var(--border)"}}>
                      <div style={{padding:"16px 20px",background:"#f5f5f7",borderRadius:14,margin:"16px 0",borderLeft:`3px solid ${MOD_COLORS[selMod]}`}}>
                        <div style={{fontSize:11,fontWeight:600,letterSpacing:0.5,color:MOD_COLORS[selMod],textTransform:"uppercase",marginBottom:8}}>Answer</div>
                        <p style={{fontSize:14,lineHeight:1.8,color:"#1d1d1f"}}>{item.a}</p>
                      </div>
                      {!status && (
                        <div style={{display:"flex",gap:10}}>
                          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>markAnswer(qid,true)}
                            style={{padding:"9px 20px",fontSize:13,fontWeight:600,background:"#34c75918",color:"#34c759",border:"1.5px solid #34c75944",borderRadius:12,cursor:"pointer"}}>
                            ✓ Got it right
                          </motion.button>
                          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={()=>markAnswer(qid,false)}
                            style={{padding:"9px 20px",fontSize:13,fontWeight:600,background:"#ff3b3018",color:"#ff3b30",border:"1.5px solid #ff3b3044",borderRadius:12,cursor:"pointer"}}>
                            Need more practice
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================
   CODE ARENA TAB
============================================================ */
const CodeArenaTab = () => {
  const [progress, saveProgress] = useProgress();
  const [selMod, setSelMod] = useState("Stack");
  const [selLevel, setSelLevel] = useState("Beginner");
  const [selChallenge, setSelChallenge] = useState(null);

  const challenges = CODING_CHALLENGES[selMod]?.[selLevel] || [];

  if (selChallenge) return <CodeEditor challenge={selChallenge} progress={progress} saveProgress={saveProgress} module={selMod} onBack={()=>setSelChallenge(null)}/>;

  const color = MOD_COLORS[selMod];

  return(
    <div>
      <div style={{marginBottom:28}}>
        <h2 style={{fontSize:32,fontWeight:700,letterSpacing:-1,color:"#1d1d1f",marginBottom:6}}>Code Arena</h2>
        <p style={{color:"#86868b",fontSize:15}}>9 challenges per module, 3 levels from Beginner to Advanced</p>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {MODULES.map(m=>{const c=MOD_COLORS[m];return<PillBtn key={m} active={selMod===m} onClick={()=>setSelMod(m)} color={c}>{MOD_ICONS[m]} {m}</PillBtn>;})}
      </div>
      <div style={{display:"flex",gap:8,marginBottom:28}}>
        {LEVELS.map(l=><PillBtn key={l} active={selLevel===l} onClick={()=>setSelLevel(l)} color="#424245">{l}</PillBtn>)}
      </div>
      <ProgressCard module={selMod} progress={progress} total={9} type="code"/>
      <div style={{display:"flex",flexDirection:"column",gap:12,marginTop:24}}>
        {challenges.map((ch,i)=>{
          const key=`code_${selMod}_${ch.id}`;
          const status=progress[key];
          return(
            <motion.div key={ch.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.07,ease:[0.22,1,0.36,1]}}
              whileHover={{scale:1.01,y:-1,boxShadow:"var(--shadow-lg)"}} style={{background:"white",border:"1.5px solid",borderColor:status==="solved"?`${color}44`:"var(--border)",borderRadius:18,padding:24,cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"var(--shadow-sm)",transition:"box-shadow 0.3s"}}
              onClick={()=>setSelChallenge(ch)}>
              <div>
                <div style={{display:"flex",gap:8,marginBottom:10,alignItems:"center"}}>
                  <span style={{fontSize:11,fontWeight:600,color,background:`${color}12`,padding:"3px 10px",borderRadius:20}}>{selLevel}</span>
                  <span style={{fontSize:11,fontWeight:500,color:"#86868b",background:"#f5f5f7",padding:"3px 10px",borderRadius:20}}>{ch.company}</span>
                  {status==="solved" && <span style={{fontSize:11,fontWeight:600,color:"#34c759",background:"#e8f9ee",padding:"3px 10px",borderRadius:20}}>✓ Solved</span>}
                </div>
                <div style={{fontSize:18,fontWeight:700,color:"#1d1d1f",marginBottom:6}}>{ch.title}</div>
                <div style={{fontSize:13,color:"#86868b",lineHeight:1.6}}>{ch.desc}</div>
              </div>
              <div style={{width:40,height:40,borderRadius:12,background:`${color}12`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginLeft:20}}>
                <span style={{color,fontSize:18}}>→</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

/* ============================================================
   CODE EDITOR — Apple style
============================================================ */
const CodeEditor = ({ challenge, progress, saveProgress, module: mod, onBack }) => {
  const [code, setCode] = useState(challenge.starter);
  const [showSolution, setShowSolution] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [tab, setTab] = useState("editor");
  const color = MOD_COLORS[mod];
  const key = `code_${mod}_${challenge.id}`;
  const isSolved = progress[key] === "solved";

  return(
    <div>
      <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,color:"#0071e3",fontSize:14,fontWeight:500,cursor:"pointer",marginBottom:24}}>
        ‹ Back to Challenges
      </button>

      <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:11,fontWeight:600,color,background:`${color}12`,padding:"3px 10px",borderRadius:20}}>{mod}</span>
        <span style={{fontSize:11,fontWeight:500,color:"#86868b",background:"#f5f5f7",padding:"3px 10px",borderRadius:20}}>{challenge.company}</span>
        {isSolved && <span style={{fontSize:11,fontWeight:600,color:"#34c759",background:"#e8f9ee",padding:"3px 10px",borderRadius:20}}>✓ Solved</span>}
      </div>

      <h2 style={{fontSize:28,fontWeight:700,letterSpacing:-0.5,color:"#1d1d1f",marginBottom:10}}>{challenge.title}</h2>
      <p style={{color:"#424245",fontSize:15,lineHeight:1.7,marginBottom:24}}>{challenge.desc}</p>

      {/* Test Cases */}
      <div style={{background:"#f5f5f7",border:"1.5px solid var(--border)",borderRadius:14,padding:"16px 20px",marginBottom:24}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:0.5,color:"#0071e3",textTransform:"uppercase",marginBottom:10}}>Test Cases</div>
        <pre style={{fontSize:13,color:"#1d1d1f",lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)"}}>{challenge.testCases}</pre>
      </div>

      {/* Tab switcher */}
      <div style={{display:"flex",gap:8,marginBottom:16,background:"rgba(0,0,0,0.05)",borderRadius:12,padding:3,width:"fit-content"}}>
        {[["editor","✏️ Your Code"],["solution","💡 Solution"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"8px 20px",fontSize:13,fontWeight:500,borderRadius:9,border:"none",cursor:"pointer",transition:"all 0.2s",background:tab===t?"white":"transparent",color:tab===t?"#1d1d1f":"#86868b",boxShadow:tab===t?"var(--shadow-sm)":"none"}}>
            {l}
          </button>
        ))}
      </div>

      {tab==="editor" && (
        <div>
          <div style={{background:"#1d2126",borderRadius:18,overflow:"hidden",marginBottom:16,boxShadow:"var(--shadow-lg)"}}>
            <div style={{padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{display:"flex",gap:7}}>
                {["#ff5f56","#ffbd2e","#27c93f"].map(c=><div key={c} style={{width:12,height:12,borderRadius:"50%",background:c}}/>)}
              </div>
              <span style={{fontFamily:"var(--font-mono)",fontSize:12,color:"rgba(255,255,255,0.35)"}}>{challenge.title}.java</span>
              <span style={{fontSize:11,fontFamily:"var(--font-mono)",color:"rgba(255,255,255,0.25)"}}>{code.split('\n').length} lines</span>
            </div>
            <textarea value={code} onChange={e=>{setCode(e.target.value);setAnalysis(null);}} spellCheck={false}
              style={{width:"100%",minHeight:320,padding:"24px",background:"transparent",border:"none",color:"#abb2bf",fontSize:13,lineHeight:1.9,outline:"none",caretColor:"#e8ff5a"}}/>
          </div>

          <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:20}}>
            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setAnalysis(analyzeCode(code))}
              style={{padding:"10px 22px",fontSize:13,fontWeight:600,background:`${color}12`,color,border:`1.5px solid ${color}30`,borderRadius:12,cursor:"pointer"}}>
              🔍 Analyze Code
            </motion.button>
            <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setCode(challenge.starter)}
              style={{padding:"10px 22px",fontSize:13,fontWeight:600,background:"#f5f5f7",color:"#424245",border:"1.5px solid var(--border)",borderRadius:12,cursor:"pointer"}}>
              ↺ Reset
            </motion.button>
            {!isSolved && (
              <motion.button whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>saveProgress(key,"solved")}
                style={{padding:"10px 22px",fontSize:13,fontWeight:600,background:"#34c75918",color:"#34c759",border:"1.5px solid #34c75944",borderRadius:12,cursor:"pointer"}}>
                ✓ Mark as Solved
              </motion.button>
            )}
          </div>

          <AnimatePresence>
            {analysis && (
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                style={{background:"white",border:"1.5px solid var(--border)",borderRadius:18,padding:"20px 24px",boxShadow:"var(--shadow)"}}>
                <div style={{fontSize:11,fontWeight:600,letterSpacing:0.5,color:"#0071e3",textTransform:"uppercase",marginBottom:16}}>Code Analysis</div>
                {analysis.errors.length===0 && analysis.warnings.length===0 &&
                  <div style={{color:"#34c759",fontSize:14,fontWeight:500}}>✓ No issues found — code looks structurally clean.</div>}
                {analysis.errors.map((e,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"10px 14px",background:"#fff1f0",border:"1.5px solid rgba(255,59,48,0.2)",borderRadius:10,marginBottom:8}}>
                    <span style={{color:"#ff3b30",flexShrink:0}}>✗</span>
                    <span style={{color:"#ff3b30",fontSize:13,lineHeight:1.6}}>{e.msg}</span>
                  </div>
                ))}
                {analysis.warnings.map((w,i)=>{
                  const isInfo=w.type==="info";
                  const wStyle=isInfo?{bg:"#e8f2ff",border:"rgba(0,113,227,0.2)",color:"#0071e3"}:{bg:"#fff4e6",border:"rgba(255,149,0,0.2)",color:"#ff9500"};
                  return(
                    <div key={i} style={{display:"flex",gap:12,padding:"10px 14px",background:wStyle.bg,border:`1.5px solid ${wStyle.border}`,borderRadius:10,marginBottom:8}}>
                      <span style={{color:wStyle.color,flexShrink:0}}>{isInfo?"ℹ":"⚠"}</span>
                      <span style={{color:wStyle.color,fontSize:13,lineHeight:1.6}}>{w.msg}</span>
                    </div>
                  );
                })}
                <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--border)",display:"flex",gap:20}}>
                  <span style={{fontSize:12,color:"#ff3b30",fontFamily:"var(--font-mono)",fontWeight:500}}>Errors: {analysis.errors.length}</span>
                  <span style={{fontSize:12,color:"#ff9500",fontFamily:"var(--font-mono)",fontWeight:500}}>Warnings: {analysis.warnings.filter(w=>w.type==="warning").length}</span>
                  <span style={{fontSize:12,color:"#0071e3",fontFamily:"var(--font-mono)",fontWeight:500}}>Info: {analysis.warnings.filter(w=>w.type==="info").length}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {tab==="solution" && (
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}>
          <div style={{background:"#1d2126",borderRadius:18,overflow:"hidden",boxShadow:"var(--shadow-lg)"}}>
            <div style={{padding:"12px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:7,alignItems:"center"}}>
              {["#ff5f56","#ffbd2e","#27c93f"].map(c=><div key={c} style={{width:12,height:12,borderRadius:"50%",background:c}}/>)}
              <span style={{fontFamily:"var(--font-mono)",fontSize:12,color:"rgba(255,255,255,0.35)",marginLeft:8}}>Solution — {challenge.title}.java</span>
            </div>
            <pre style={{padding:28,fontSize:13,lineHeight:1.9,color:"#abb2bf",overflowX:"auto",maxHeight:520}}>
              <code>{challenge.solution}</code>
            </pre>
          </div>
        </motion.div>
      )}
    </div>
  );
};

/* ============================================================
   PROGRESS CARD — Apple style
============================================================ */
const ProgressCard = ({ module: mod, progress, total, type }) => {
  const color = MOD_COLORS[mod];
  let done, correct, wrong;
  if (type==="interview") {
    const keys = INTERVIEW_DATA[mod]?.map((_,i)=>`interview_${mod}_q${i}`) || [];
    done = keys.filter(k=>progress[k]!==undefined).length;
    correct = keys.filter(k=>progress[k]==="correct").length;
    wrong = keys.filter(k=>progress[k]==="wrong").length;
  } else {
    const allChallenges = Object.values(CODING_CHALLENGES[mod]||{}).flat();
    done = allChallenges.filter(ch=>progress[`code_${mod}_${ch.id}`]==="solved").length;
    correct = done; wrong = 0;
    total = allChallenges.length;
  }
  const pct = total > 0 ? Math.round((done/total)*100) : 0;
  return(
    <div style={{background:"white",border:"1.5px solid var(--border)",borderRadius:18,padding:"20px 24px",marginBottom:24,boxShadow:"var(--shadow-sm)"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div>
          <div style={{fontSize:11,fontWeight:600,letterSpacing:0.5,color:"#86868b",textTransform:"uppercase",marginBottom:4}}>{mod} Progress</div>
          <div style={{fontSize:28,fontWeight:700,color:"#1d1d1f",letterSpacing:-1}}>{pct}%</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:13,color:"#86868b",fontWeight:500}}>{done} / {total} completed</div>
          {type==="interview" && <>
            <div style={{fontSize:12,color:"#34c759",fontWeight:600}}>✓ {correct} correct</div>
            {wrong>0 && <div style={{fontSize:12,color:"#ff3b30",fontWeight:600}}>✗ {wrong} needs review</div>}
          </>}
        </div>
      </div>
      <div style={{height:6,background:"#f5f5f7",borderRadius:10,overflow:"hidden"}}>
        <motion.div initial={{width:0}} animate={{width:`${pct}%`}} transition={{duration:0.9,ease:[0.22,1,0.36,1]}}
          style={{height:"100%",background:`linear-gradient(90deg,${color},${color}bb)`,borderRadius:10}}/>
      </div>
      {pct===100 && <div style={{marginTop:10,fontSize:13,color:"#34c759",fontWeight:600}}>🎉 Module Complete! MNC-ready.</div>}
    </div>
  );
};

/* ============================================================
   MODULE SCREEN
============================================================ */
const ModuleScreen = ({ module: mod, data, subScreen, setSubScreen, onBack }) => {
  const color = MOD_COLORS[mod] || "#0071e3";
  return(
    <div style={{minHeight:"100vh",background:"var(--bg)"}}>
      {/* Header */}
      <div style={{position:"sticky",top:0,zIndex:50,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",background:"rgba(245,245,247,0.85)",borderBottom:"1px solid rgba(0,0,0,0.06)"}}>
        <div style={{maxWidth:960,margin:"0 auto",padding:"0 32px",height:56,display:"flex",alignItems:"center",gap:16}}>
          <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,color:"#0071e3",fontSize:14,fontWeight:500,cursor:"pointer"}}>
            ‹ Modules
          </button>
          <span style={{color:"#d2d2d7"}}>|</span>
          <span style={{fontSize:14,fontWeight:600,color:"#1d1d1f"}}>{mod}</span>
        </div>
      </div>

      <div style={{maxWidth:960,margin:"0 auto",padding:"48px 32px"}}>
        {/* Hero */}
        <div style={{display:"flex",gap:20,alignItems:"center",marginBottom:40}}>
          <div style={{width:72,height:72,borderRadius:20,background:`${color}15`,display:"flex",alignItems:"center",justifyContent:"center",border:`1.5px solid ${color}25`,flexShrink:0}}>
            <span style={{fontSize:32}}>{MOD_ICONS[mod]}</span>
          </div>
          <div>
            <h1 style={{fontSize:"clamp(2rem,5vw,3rem)",fontWeight:700,letterSpacing:-1,color:"#1d1d1f",marginBottom:6}}>{mod}</h1>
            <p style={{color:"#86868b",fontSize:15}}>Select a section to start exploring</p>
          </div>
        </div>

        {/* Section buttons */}
        <div style={{display:"flex",gap:12,marginBottom:40,flexWrap:"wrap"}}>
          {[["concept","📖 Concept"],["visual","🎬 Visualizer"],["program","💻 Code"]].map(([s,l])=>(
            <motion.button key={s} whileHover={{scale:1.03}} whileTap={{scale:0.97}} onClick={()=>setSubScreen(subScreen===s?null:s)}
              style={{padding:"12px 28px",fontSize:14,fontWeight:600,borderRadius:14,border:"1.5px solid",cursor:"pointer",transition:"all 0.2s",
                borderColor:subScreen===s?color:"var(--border)",
                background:subScreen===s?color:"white",
                color:subScreen===s?"white":"#424245",
                boxShadow:subScreen===s?`0 4px 16px ${color}44`:"var(--shadow-sm)"}}>
              {l}
            </motion.button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {!subScreen && (
            <motion.div key="ph" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{textAlign:"center",padding:"80px 0",color:"#86868b",fontSize:15}}>
              Select a section above to explore {mod}
            </motion.div>
          )}
          {subScreen==="concept" && data && (
            <motion.div key="c" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{ease:[0.22,1,0.36,1]}}>
              <ConceptPanel data={data} color={color}/>
            </motion.div>
          )}
          {subScreen==="visual" && (
            <motion.div key="v" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{ease:[0.22,1,0.36,1]}}>
              <VisualPanel module={mod} color={color}/>
            </motion.div>
          )}
          {subScreen==="program" && data && (
            <motion.div key="p" initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{ease:[0.22,1,0.36,1]}}>
              <ProgramPanel data={data} module={mod} color={color}/>
            </motion.div>
          )}
          {(subScreen==="concept"||subScreen==="program") && !data && (
            <motion.div key="l" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
              style={{color:"#86868b",fontSize:14,padding:"40px 0",textAlign:"center"}}>
              ⏳ Loading module data...
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ConceptPanel = ({ data, color }) => (
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
    {[
      {label:"Definition",content:<p style={{lineHeight:1.8,fontSize:14,color:"#424245"}}>{data.definition}</p>},
      {label:"How It Works",content:<p style={{lineHeight:1.8,fontSize:14,color:"#424245"}}>{data.working}</p>},
      data.algorithm && {label:"Algorithm",content:<pre style={{fontSize:12,color:"#0071e3",lineHeight:1.8,whiteSpace:"pre-wrap",fontFamily:"var(--font-mono)"}}>{data.algorithm}</pre>,wide:true},
      {label:"Time Complexity",content:typeof data.time_complexity==="object"?Object.entries(data.time_complexity).map(([k,v])=>(
        <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid var(--border)"}}>
          <span style={{fontSize:13,color:"#86868b",fontFamily:"var(--font-mono)"}}>{k}</span>
          <span style={{fontSize:13,color:"#0071e3",fontFamily:"var(--font-mono)",fontWeight:600}}>{v}</span>
        </div>
      )):<pre style={{fontSize:13,color:"#0071e3"}}>{JSON.stringify(data.time_complexity,null,2)}</pre>,wide:true},
      data.applications && {label:"Applications",content:<p style={{lineHeight:1.8,fontSize:14,color:"#86868b"}}>{data.applications}</p>,wide:true},
      data.interview_notes && {label:"Interview Tips ★",content:<p style={{lineHeight:1.8,fontSize:14,color:"#424245"}}>{data.interview_notes}</p>,wide:true},
    ].filter(Boolean).map(({label,content,wide},i)=>(
      <div key={i} style={{background:"white",border:"1.5px solid var(--border)",borderTop:`3px solid ${color}`,borderRadius:18,padding:24,gridColumn:wide?"1/-1":undefined,boxShadow:"var(--shadow-sm)"}}>
        <div style={{fontSize:11,fontWeight:600,letterSpacing:0.5,color,textTransform:"uppercase",marginBottom:14}}>{label}</div>
        {content}
      </div>
    ))}
  </div>
);

const ProgramPanel = ({ data, module: mod, color }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {navigator.clipboard.writeText(data.java||"");setCopied(true);setTimeout(()=>setCopied(false),2000);};
  return(
    <div style={{background:"#1d2126",borderRadius:20,overflow:"hidden",boxShadow:"var(--shadow-lg)"}}>
      <div style={{padding:"14px 20px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",gap:7}}>{["#ff5f56","#ffbd2e","#27c93f"].map(c=><div key={c} style={{width:12,height:12,borderRadius:"50%",background:c}}/>)}</div>
        <span style={{fontFamily:"var(--font-mono)",fontSize:12,color:"rgba(255,255,255,0.35)"}}>{mod}.java</span>
        <button onClick={copy} style={{fontSize:12,fontFamily:"var(--font-mono)",color:copied?"#27c93f":"rgba(255,255,255,0.35)",background:"none",cursor:"pointer",transition:"color 0.2s",fontWeight:copied?600:400}}>
          {copied?"✓ Copied":"Copy"}
        </button>
      </div>
      <pre style={{padding:28,fontSize:13,lineHeight:1.9,color:"#abb2bf",overflowX:"auto",maxHeight:520}}><code>{data.java}</code></pre>
    </div>
  );
};

/* ============================================================
   VISUALIZERS — Apple-style
============================================================ */
const VisualPanel = ({ module: mod, color }) => (
  <div style={{background:"white",border:"1.5px solid var(--border)",borderRadius:20,padding:36,boxShadow:"var(--shadow)"}}>
    {mod==="Stack" && <StackVisual color={color}/>}
    {mod==="Queue" && <QueueVisual color={color}/>}
    {mod==="Linear Search" && <LinearSearchVisual color={color}/>}
    {mod==="Bubble Sort" && <BubbleSortVisual color={color}/>}
  </div>
);

const VizBtn = ({onClick,children,color})=>(
  <motion.button whileHover={{scale:1.04,y:-1}} whileTap={{scale:0.96}} onClick={onClick}
    style={{padding:"10px 24px",fontSize:13,fontWeight:600,borderRadius:12,background:`${color}12`,color,border:`1.5px solid ${color}30`,marginRight:10,cursor:"pointer",boxShadow:"var(--shadow-sm)"}}>
    {children}
  </motion.button>
);

function StackVisual({ color }) {
  const [stack,setStack]=useState([42,17]);
  return(
    <div>
      <div style={{fontSize:12,fontWeight:600,letterSpacing:0.5,color:"#86868b",textTransform:"uppercase",marginBottom:20}}>Stack — Last In, First Out</div>
      <div style={{display:"flex",flexDirection:"column-reverse",alignItems:"flex-start",minHeight:180,gap:8,marginBottom:28}}>
        <AnimatePresence>
          {stack.map((item,i)=>(
            <motion.div key={`${item}-${i}`} layout initial={{opacity:0,x:-30,scale:0.8}} animate={{opacity:1,x:0,scale:1}} exit={{opacity:0,x:30,scale:0.8}} transition={{type:"spring",stiffness:400,damping:28}}
              style={{width:160,padding:"12px 20px",background:i===stack.length-1?color:`${color}12`,color:i===stack.length-1?"white":color,fontFamily:"var(--font-mono)",fontWeight:700,fontSize:15,borderRadius:12,display:"flex",justifyContent:"space-between",alignItems:"center",border:`1.5px solid ${color}30`,boxShadow:i===stack.length-1?`0 4px 16px ${color}44`:"none"}}>
              {item}{i===stack.length-1&&<span style={{fontSize:10,opacity:0.7,fontWeight:500}}>TOP</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <VizBtn onClick={()=>setStack(p=>[...p,Math.floor(Math.random()*99)+1])} color={color}>Push</VizBtn>
      <VizBtn onClick={()=>setStack(p=>p.slice(0,-1))} color={color}>Pop</VizBtn>
    </div>
  );
}

function QueueVisual({ color }) {
  const [queue,setQueue]=useState([10,30,55]);
  return(
    <div>
      <div style={{fontSize:12,fontWeight:600,letterSpacing:0.5,color:"#86868b",textTransform:"uppercase",marginBottom:20}}>Queue — First In, First Out</div>
      <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:28,minHeight:70}}>
        <span style={{fontSize:11,color:"#86868b",fontFamily:"var(--font-mono)",fontWeight:500}}>FRONT →</span>
        <AnimatePresence>
          {queue.map((item,i)=>(
            <motion.div key={`${item}-${i}`} layout initial={{opacity:0,y:-20,scale:0.8}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,scale:0.5}} transition={{type:"spring",stiffness:350,damping:25}}
              style={{width:58,height:58,display:"flex",alignItems:"center",justifyContent:"center",background:i===0?color:`${color}12`,color:i===0?"white":color,fontFamily:"var(--font-mono)",fontWeight:700,fontSize:16,borderRadius:14,border:`1.5px solid ${color}30`,boxShadow:i===0?`0 4px 16px ${color}44`:"none"}}>
              {item}
            </motion.div>
          ))}
        </AnimatePresence>
        <span style={{fontSize:11,color:"#86868b",fontFamily:"var(--font-mono)",fontWeight:500}}>← REAR</span>
      </div>
      <VizBtn onClick={()=>setQueue(p=>[...p,Math.floor(Math.random()*99)+1])} color={color}>Enqueue</VizBtn>
      <VizBtn onClick={()=>setQueue(p=>p.slice(1))} color={color}>Dequeue</VizBtn>
    </div>
  );
}

function LinearSearchVisual({ color }) {
  const [array]=useState([4,8,2,9,5,1,7,3]);
  const [current,setCurrent]=useState(-1);
  const [found,setFound]=useState(-1);
  const [target]=useState(9);
  const running=useRef(false);
  const search=()=>{
    if(running.current)return;running.current=true;setCurrent(-1);setFound(-1);
    let i=0;
    const iv=setInterval(()=>{setCurrent(i);if(array[i]===target){setFound(i);clearInterval(iv);running.current=false;return;}i++;if(i>=array.length){clearInterval(iv);running.current=false;}},500);
  };
  return(
    <div>
      <div style={{fontSize:12,fontWeight:600,letterSpacing:0.5,color:"#86868b",textTransform:"uppercase",marginBottom:20}}>Linear Search — Target: {target}</div>
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:28}}>
        {array.map((num,i)=>(
          <motion.div key={i} animate={{scale:current===i?1.15:1,y:current===i?-4:0}} transition={{type:"spring",stiffness:400,damping:20}}
            style={{width:54,height:54,display:"flex",alignItems:"center",justifyContent:"center",background:found===i?color:current===i?`${color}18`:"#f5f5f7",color:found===i?"white":current===i?color:"#424245",fontFamily:"var(--font-mono)",fontWeight:700,fontSize:16,borderRadius:14,border:`1.5px solid ${found===i||current===i?color:"transparent"}`,transition:"background 0.25s,color 0.25s",boxShadow:found===i?`0 4px 16px ${color}44`:"none"}}>
            {num}
          </motion.div>
        ))}
      </div>
      {found!==-1&&<motion.p initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} style={{fontFamily:"var(--font-mono)",fontSize:13,color,marginBottom:16,fontWeight:600}}>✓ Found {target} at index {found}</motion.p>}
      <VizBtn onClick={search} color={color}>▶ Start Search</VizBtn>
    </div>
  );
}

function BubbleSortVisual({ color }) {
  const init=[5,3,8,4,2,7,1,6];
  const [array,setArray]=useState([...init]);
  const [active,setActive]=useState([-1,-1]);
  const running=useRef(false);
  const reset=()=>{setArray([...init]);setActive([-1,-1]);};
  const sort=()=>{
    if(running.current)return;running.current=true;
    let arr=[...array],steps=[];
    for(let i=0;i<arr.length-1;i++){for(let j=0;j<arr.length-1-i;j++){steps.push({arr:[...arr],comparing:[j,j+1]});if(arr[j]>arr[j+1]){[arr[j],arr[j+1]]=[arr[j+1],arr[j]];steps.push({arr:[...arr],comparing:[j,j+1]});}}}
    steps.push({arr:[...arr],comparing:[-1,-1]});
    let s=0;const iv=setInterval(()=>{if(s>=steps.length){clearInterval(iv);running.current=false;setActive([-1,-1]);return;}setArray(steps[s].arr);setActive(steps[s].comparing);s++;},180);
  };
  const maxVal=Math.max(...array);
  return(
    <div>
      <div style={{fontSize:12,fontWeight:600,letterSpacing:0.5,color:"#86868b",textTransform:"uppercase",marginBottom:20}}>Bubble Sort — Adjacent Comparisons</div>
      <div style={{display:"flex",gap:8,alignItems:"flex-end",marginBottom:28,height:160}}>
        {array.map((num,i)=>(
          <motion.div key={i} layout transition={{type:"spring",stiffness:350,damping:28}}
            style={{flex:1,height:`${(num/maxVal)*140}px`,background:active[0]===i||active[1]===i?color:`${color}20`,borderRadius:"10px 10px 0 0",display:"flex",alignItems:"flex-start",justifyContent:"center",paddingTop:6,color:active[0]===i||active[1]===i?"white":color,fontFamily:"var(--font-mono)",fontWeight:700,fontSize:13,transition:"background 0.15s,color 0.15s",boxShadow:active[0]===i||active[1]===i?`0 4px 16px ${color}44`:"none"}}>
            {num}
          </motion.div>
        ))}
      </div>
      <VizBtn onClick={sort} color={color}>▶ Sort</VizBtn>
      <VizBtn onClick={reset} color={color}>↺ Reset</VizBtn>
    </div>
  );
}

/* ============================================================
   ROOT APP
============================================================ */
export default function App() {
  useGlobalStyle(GLOBAL_CSS);
  const [progress, saveProgress] = useProgress();
  const [screen, setScreen] = useState("home");
  const [module, setModule] = useState(null);
  const [subScreen, setSubScreen] = useState(null);
  const [level, setLevel] = useState("Beginner");
  const [data, setData] = useState(null);

  useEffect(() => {
    if(!module) return;
    setData(null);
    fetch(`http://127.0.0.1:8000/module/${module}/${level}`)
      .then(r=>r.json()).then(setData).catch(console.error);
  }, [module, level]);

  const selectModule = (mod) => { setModule(mod); setSubScreen(null); setScreen("module"); };

  return(
    <div style={{background:"var(--bg)",minHeight:"100vh",color:"var(--text)"}}>
      <AnimatePresence mode="wait">
        {screen==="home" && (
          <motion.div key="home" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:0.98}} transition={{duration:0.4}}>
            <HomeScreen onEnter={()=>setScreen("dsa")}/>
          </motion.div>
        )}
        {screen==="dsa" && (
          <motion.div key="dsa" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}} transition={{duration:0.35,ease:[0.22,1,0.36,1]}}>
            <DSAScreen level={level} setLevel={setLevel} onSelectModule={selectModule} onBack={()=>setScreen("home")} progress={progress}/>
          </motion.div>
        )}
        {screen==="module" && (
          <motion.div key="module" initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-40}} transition={{duration:0.35,ease:[0.22,1,0.36,1]}}>
            <ModuleScreen module={module} data={data} subScreen={subScreen} setSubScreen={setSubScreen} onBack={()=>{setScreen("dsa");setSubScreen(null);}}/>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
