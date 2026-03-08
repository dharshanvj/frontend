import React, { useState, useEffect, useRef, useMemo } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';

const ALGORITHM_CONFIGS = {
    bubble_sort: {
        name: "Bubble Sort",
        complexity: "O(n²)",
        description: "Compare adjacent elements and swap them if they are in the wrong order.",
        defaultCode: `void bubbleSort(int arr[], int n) {\n  bool swapped;\n  for (int i = 0; i < n; i++) {\n    swapped = false;\n    for (int j = 0; j < n - i - 1; j++) {\n      if (arr[j] > arr[j+1]) {\n        swap(&arr[j], &arr[j+1]);\n        swapped = true;\n      }\n    }\n    if (!swapped) break;\n  }\n}`,
        defaultInput: [5, 3, 8, 1, 2]
    },
    insertion_sort: {
        name: "Insertion Sort",
        complexity: "O(n²)",
        description: "Build the final sorted array one item at a time.",
        defaultCode: `void insertionSort(int arr[], int n) {\n  for (int i = 1; i < n; i++) {\n    int key = arr[i];\n    int j = i - 1;\n    while (j >= 0 && arr[j] > key) {\n      arr[j + 1] = arr[j];\n      j = j - 1;\n    }\n    arr[j + 1] = key;\n  }\n}`,
        defaultInput: [5, 2, 4, 6, 1, 3]
    },
    binary_search: {
        name: "Binary Search",
        complexity: "O(log n)",
        description: "Find the position of a target value within a sorted array.",
        defaultCode: `int binarySearch(int arr[], int target) {\n  int low = 0, high = n - 1;\n  while (low <= high) {\n    int mid = (low + high) / 2;\n    if (arr[mid] == target) return mid;\n    else if (arr[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}`,
        defaultInput: { arr: [1, 3, 5, 8, 10, 15, 20], target: 8 }
    },
    factorial: {
        name: "Factorial (Recursion)",
        complexity: "O(n)",
        description: "Calculates n! using recursive calls.",
        defaultCode: `int fact(int n) {\n  if (n <= 1) return 1;\n  return n * fact(n - 1);\n}`,
        defaultInput: 5
    },
    dfs: {
        name: "Depth First Search (DFS)",
        complexity: "O(V + E)",
        description: "Traverses or searches tree or graph data structures.",
        defaultCode: `void dfs(int start) {\n  visited[start] = true;\n  for (int neighbor : adj[start]) {\n    if (!visited[neighbor])\n      dfs(neighbor);\n  }\n}`,
        defaultInput: { adj: { "0": [1, 2], "1": [2], "2": [0, 3], "3": [3] }, start: "2" }
    },
    bfs: {
        name: "Breadth First Search (BFS)",
        complexity: "O(V + E)",
        description: "Explores all neighbor nodes at the present depth before moving to the next level.",
        defaultCode: `void bfs(int start) {\n  queue.enqueue(start);\n  visited[start] = true;\n  while (!queue.isEmpty()) {\n    int curr = queue.dequeue();\n    for (int neighbor : adj[curr]) {\n       if (!visited[neighbor]) {\n          visited[neighbor] = true;\n          queue.enqueue(neighbor);\n       }\n    }\n  }\n}`,
        defaultInput: { adj: { "0": [1, 2], "1": [2], "2": [0, 3], "3": [3] }, start: "2" }
    },
    stack: {
        name: "Stack Operations",
        complexity: "O(1)",
        description: "Last-In, First-Out (LIFO) data structure operations.",
        defaultCode: `void stackOperations() {\n  push(10);\n  push(20);\n  pop();\n  push(30);\n  pop();\n}`,
        defaultInput: [
            { action: "push", value: 10 },
            { action: "push", value: 20 },
            { action: "pop" },
            { action: "push", value: 30 },
            { action: "pop" }
        ]
    },
    queue: {
        name: "Queue Operations",
        complexity: "O(1)",
        description: "First-In, First-Out (FIFO) data structure operations.",
        defaultCode: `void queueOperations() {\n  enqueue(10);\n  enqueue(20);\n  dequeue();\n  enqueue(30);\n  dequeue();\n}`,
        defaultInput: [
            { action: "enqueue", value: 10 },
            { action: "enqueue", value: 20 },
            { action: "dequeue" },
            { action: "enqueue", value: 30 },
            { action: "dequeue" }
        ]
    }
};

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000" : "https://backend-vix7.onrender.com";

export const VisualPlayground = ({ onBack, initialAlg }) => {
    const [alg, setAlg] = useState(initialAlg || "bubble_sort");
    const [steps, setSteps] = useState([]);
    const [stepIdx, setStepIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [code, setCode] = useState(ALGORITHM_CONFIGS[initialAlg || "bubble_sort"]?.defaultCode || "// Write your code here...");
    const monaco = useMonaco();
    const editorRef = useRef(null);
    const decorationsRef = useRef([]);

    // Audio sounds
    const sounds = useRef({
        step: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
        success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3')
    });

    useEffect(() => {
        sounds.current.step.volume = 0.2;
        sounds.current.success.volume = 0.4;
    }, []);

    const config = useMemo(() => {
        return ALGORITHM_CONFIGS[alg] || {
            name: alg.replace(/_/g, " ").toUpperCase(),
            complexity: "O(?)",
            description: `Visualizing ${alg.replace(/_/g, " ")}.`,
            defaultCode: `// Implementation for ${alg.replace(/_/g, " ")}\n// Edit this code to explore!`,
            defaultInput: {}
        };
    }, [alg]);

    const currentStep = steps[stepIdx] || null;

    useEffect(() => {
        if (initialAlg) {
            setAlg(initialAlg);
            const defaultCode = ALGORITHM_CONFIGS[initialAlg]?.defaultCode || `// Write logic for ${initialAlg.replace(/_/g, " ")} here...`;
            setCode(defaultCode);
            handleRun(initialAlg);
        }
    }, [initialAlg]);

    useEffect(() => {
        if (isPlaying && steps.length > 0 && stepIdx < steps.length - 1) {
            const timer = setTimeout(() => {
                setStepIdx(s => s + 1);
            }, 1000 / speed);
            return () => clearTimeout(timer);
        } else if (stepIdx > 0 && stepIdx === steps.length - 1) {
            setIsPlaying(false);
            sounds.current.success.play().catch(() => { });
        }
    }, [isPlaying, stepIdx, steps, speed]);

    useEffect(() => {
        if (stepIdx > 0 && isPlaying) {
            sounds.current.step.currentTime = 0;
            sounds.current.step.play().catch(() => { });
        }
    }, [stepIdx]);

    useEffect(() => {
        if (currentStep && editorRef.current && monaco) {
            const line = currentStep.line;
            decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, [
                {
                    range: new monaco.Range(line, 1, line, 1),
                    options: {
                        isWholeLine: true,
                        className: 'active-line-highlight',
                        glyphMarginClassName: 'active-line-glyph'
                    }
                }
            ]);
            editorRef.current.revealLineInCenter(line);
        }
    }, [currentStep, monaco]);

    const handleRun = async (targetAlg = alg) => {
        setIsLoading(true);
        setIsPlaying(false);
        setStepIdx(0);
        setError(null);
        setShowConfetti(false);
        console.log("Running visualization for:", targetAlg);

        try {
            const res = await fetch(`${API_BASE}/visualize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    algorithm: targetAlg,
                    code: code,
                    input: ALGORITHM_CONFIGS[targetAlg]?.defaultInput || {}
                })
            });

            if (!res.ok) throw new Error(`Server responded with ${res.status}`);

            const data = await res.json();
            console.log("Received steps:", data.steps?.length);

            if (data.steps) {
                setSteps(data.steps);
                setIsPlaying(true);
            } else if (data.error) {
                setError(data.error);
            }
        } catch (err) {
            console.error("Visualization Error:", err);
            setError("Could not connect to the visualization engine. Please ensure the backend is running.");
        }
        setIsLoading(false);
    };

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
    };

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0e0e10", color: "#e3e3e3", overflow: "hidden" }}>
            {/* Dynamic styles for monaco highlight */}
            <style>{`
        .active-line-highlight { background: rgba(0, 113, 227, 0.2) !important; width: 100% !important; }
        .active-line-glyph { background: #0071E3 !important; width: 5px !important; }
      `}</style>

            {/* Header */}
            <div style={{ padding: "0 24px", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #222", background: "#18181b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button onClick={onBack} style={{ background: "none", border: "none", color: "#0071e3", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>‹ BACK</button>
                    <div style={{ width: 1.5, height: 20, background: "#333" }} />
                    <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>Visual DSA Playground</h1>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <select value={alg} onChange={(e) => {
                        const newAlg = e.target.value;
                        setAlg(newAlg);
                        if (ALGORITHM_CONFIGS[newAlg]) setCode(ALGORITHM_CONFIGS[newAlg].defaultCode);
                        setSteps([]);
                        setStepIdx(0);
                        handleRun(newAlg);
                    }}
                        style={{ background: "#27272a", color: "white", border: "1px solid #3f3f46", padding: "8px 16px", borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                        {Object.keys(ALGORITHM_CONFIGS).map(k => (
                            <option key={k} value={k}>{ALGORITHM_CONFIGS[k].name}</option>
                        ))}
                    </select>
                    <button onClick={handleRun} disabled={isLoading} style={{ background: "#0071e3", color: "white", padding: "8px 20px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", opacity: isLoading ? 0.5 : 1 }}>
                        {isLoading ? "Running..." : "Run Algorithm 🚀"}
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* Left: Editor and Info */}
                <div style={{ width: "45%", display: "flex", flexDirection: "column", borderRight: "1px solid #222" }}>
                    <div style={{ flex: 1 }}>
                        <Editor
                            height="100%"
                            defaultLanguage="cpp"
                            theme="vs-dark"
                            value={code}
                            onChange={(val) => setCode(val)}
                            onMount={handleEditorDidMount}
                            options={{
                                readOnly: false,
                                minimap: { enabled: false },
                                scrollBeyondLastLine: false,
                                fontSize: 14,
                                fontFamily: "var(--font-mono)",
                                lineNumbersMinChars: 3,
                                glyphMargin: true,
                                padding: { top: 20 }
                            }}
                        />
                    </div>
                    <div style={{ padding: 24, background: "#111", borderTop: "1px solid #222" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                            <h2 style={{ fontSize: 16, fontWeight: 800 }}>{config.name}</h2>
                            <span style={{ fontSize: 12, background: "#0071e322", color: "#0071e3", padding: "4px 10px", borderRadius: 20, fontWeight: 700 }}>{config.complexity}</span>
                        </div>
                        <p style={{ fontSize: 14, color: "#a1a1aa", lineHeight: 1.6 }}>{config.description}</p>
                    </div>
                </div>

                {/* Right: Viz Panels */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#09090b" }}>

                    {/* Controls Bar */}
                    <div style={{ padding: 16, borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 16, background: "#18181b" }}>
                        <button onClick={() => setIsPlaying(!isPlaying)} style={{ width: 40, height: 40, borderRadius: "50%", background: "#27272a", border: "none", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {isPlaying ? "⏸" : "▶"}
                        </button>
                        <button onClick={() => setStepIdx(s => Math.max(0, s - 1))} style={{ padding: "8px 12px", borderRadius: 8, background: "#27272a", border: "none", color: "white", cursor: "pointer" }}>Step Back</button>
                        <button onClick={() => setStepIdx(s => Math.min(steps.length - 1, s + 1))} style={{ padding: "8px 12px", borderRadius: 8, background: "#27272a", border: "none", color: "white", cursor: "pointer" }}>Step Next</button>
                        <button onClick={() => { setStepIdx(0); setIsPlaying(false); }} style={{ padding: "8px 12px", borderRadius: 8, background: "#27272a", border: "none", color: "white", cursor: "pointer" }}>Reset</button>

                        <div style={{ flex: 1, margin: "0 20px" }}>
                            <input type="range" min="0" max={Math.max(0, steps.length - 1)} value={stepIdx} onChange={(e) => setStepIdx(parseInt(e.target.value))}
                                style={{ width: "100%", accentColor: "#0071e3" }} />
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa" }}>{stepIdx + 1} / {steps.length || 0}</div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: "40px", display: "flex", flexDirection: "column", gap: 32, background: "#09090b" }}>
                        {error && (
                            <div style={{ background: "#fef2f2", color: "#991b1b", padding: 16, borderRadius: 12, border: "1px solid #fee2e2", fontSize: 14, fontWeight: 500 }}>
                                ⚠️ {error}
                            </div>
                        )}
                        {!currentStep ? (
                            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.3 }}>
                                <span style={{ fontSize: 60 }}>🧊</span>
                                <p>{isLoading ? "Processing algorithm..." : "Run the algorithm to see visualization"}</p>
                            </div>
                        ) : (
                            <>
                                {/* State explanation - PROMINENT SINGLE BAR */}
                                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} key={stepIdx}
                                    style={{ background: "linear-gradient(135deg, #0071e3 0%, #00458a 100%)", borderRadius: 24, padding: "32px 40px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)", textAlign: "center", marginBottom: 12 }}>
                                    <div style={{ fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: 3, marginBottom: 12 }}>CURRENT EXECUTION STEP</div>
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                        style={{ fontSize: 24, fontWeight: 800, color: "white", textShadow: "0 2px 4px rgba(0,0,0,0.2)" }}>
                                        {currentStep.explanation}
                                    </motion.div>
                                </motion.div>

                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 32 }}>
                                    {/* Memory Panel */}
                                    <div style={{ background: "#18181b", borderRadius: 24, padding: 32, border: "2px solid #222", minHeight: 180 }}>
                                        <h3 style={{ fontSize: 13, fontWeight: 900, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 18 }}>💾</span> Memory Registry
                                        </h3>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
                                            {currentStep.array.map((val, idx) => {
                                                const isPointed = Object.values(currentStep.pointers).includes(idx);
                                                return (
                                                    <motion.div key={idx} layout transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                        style={{ width: 64, height: 64, background: isPointed ? "linear-gradient(135deg, #0071e3 0%, #0056ad 100%)" : "#27272a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, border: isPointed ? "3px solid #60a5fa" : "2px solid #333", color: "white", position: "relative", boxShadow: isPointed ? "0 10px 20px rgba(0,113,227,0.3)" : "none" }}>
                                                        {val}
                                                        {Object.entries(currentStep.pointers).filter(([p, pos]) => pos === idx).map(([p], pid) => (
                                                            <div key={p} style={{ position: "absolute", bottom: -30, left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "#60a5fa", whiteSpace: "nowrap", fontWeight: 900, background: "#09090b", padding: "2px 8px", borderRadius: 4, border: "1px solid #333" }}>
                                                                ↑ {p}
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                );
                                            })}
                                            {currentStep.array.length === 0 && <div style={{ color: "#a1a1aa", opacity: 0.3, fontStyle: "italic", padding: 20 }}>No items in memory</div>}
                                        </div>
                                    </div>

                                    {/* Variables Panel */}
                                    <div style={{ background: "#18181b", borderRadius: 24, padding: 32, border: "2px solid #222", minHeight: 180 }}>
                                        <h3 style={{ fontSize: 13, fontWeight: 900, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                                            <span style={{ fontSize: 18 }}>📊</span> Execution Variables
                                        </h3>
                                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 16 }}>
                                            {Object.entries(currentStep.variables).map(([k, v]) => (
                                                <div key={k} style={{ padding: "16px 20px", background: "#27272a", borderRadius: 16, border: "1px solid #333", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                                                    <div style={{ fontSize: 11, fontWeight: 800, color: "#a1a1aa", marginBottom: 6, opacity: 0.7 }}>{k.toUpperCase()}</div>
                                                    <div style={{ fontSize: 18, fontWeight: 900, color: "#60a5fa" }}>{JSON.stringify(v)}</div>
                                                </div>
                                            ))}
                                            {Object.keys(currentStep.variables).length === 0 && <div style={{ color: "#a1a1aa", opacity: 0.3, fontStyle: "italic" }}>No active variables</div>}
                                        </div>
                                    </div>

                                    {/* Recursion Stack - only if exists */}
                                    {currentStep.stack && currentStep.stack.length > 0 && (
                                        <div style={{ background: "#18181b", borderRadius: 24, padding: 32, border: "2px solid #222", gridColumn: "1 / -1" }}>
                                            <h3 style={{ fontSize: 13, fontWeight: 900, color: "#a1a1aa", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
                                                <span style={{ fontSize: 18 }}>🥞</span> Call Stack
                                            </h3>
                                            <div style={{ display: "flex", flexDirection: "column-reverse", gap: 10 }}>
                                                <AnimatePresence>
                                                    {currentStep.stack.map((frame, idx) => (
                                                        <motion.div key={idx + frame} initial={{ height: 0, opacity: 0, x: -10 }} animate={{ height: 50, opacity: 1, x: 0 }}
                                                            style={{ background: "rgba(96,165,250,0.1)", border: "2.5px solid rgba(96,165,250,0.2)", borderRadius: 16, display: "flex", alignItems: "center", padding: "0 24px", fontSize: 15, fontWeight: 800, color: "#60a5fa" }}>
                                                            {idx === currentStep.stack.length - 1 ? "➡️ " : "   "} {frame}
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
