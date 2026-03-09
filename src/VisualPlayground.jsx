import React, { useState, useEffect, useRef, useMemo } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import { motion, AnimatePresence } from 'framer-motion';

const ALGORITHM_CONFIGS = {
    bubble_sort: {
        name: "Bubble Sort",
        complexity: "O(n²)",
        description: "Sort an array by swapping adjacent elements.",
        defaultCode: `void bubbleSort(int[] arr) {\n    int n = arr.length;\n    // Write your bubble sort logic here\n    // Use: if(arr[j] > arr[j+1]) { swap(arr, j, j+1); }\n    \n}`,
        testCases: [{ input: [5, 2, 8, 1, 9], expected: [1, 2, 5, 8, 9] }],
        defaultInput: [5, 2, 8, 1, 9]
    },
    binary_search: {
        name: "Binary Search",
        complexity: "O(log n)",
        description: "Find an element in a sorted array.",
        defaultCode: `int binarySearch(int[] arr, int target) {\n    int low = 0, high = arr.length - 1;\n    // Write your binary search logic here\n    \n    return -1;\n}`,
        testCases: [{ input: { arr: [1, 2, 3, 4, 5], target: 4 }, expected: 3 }],
        defaultInput: { arr: [1, 2, 3, 4, 5], target: 4 }
    },
    factorial: {
        name: "Factorial (Recursion)",
        complexity: "O(n)",
        description: "Calculate n! using recursive calls.",
        defaultCode: `int factorial(int n) {\n    // Base case: if(n <= 1) return 1;\n    // Recursive step: return n * factorial(n - 1);\n    \n}`,
        testCases: [{ input: 5, expected: 120 }],
        defaultInput: 5
    },
    stack: {
        name: "Stack Operations",
        complexity: "O(1)",
        description: "Implement LIFO operations.",
        defaultCode: `void runStack() {\n    Stack<Integer> s = new Stack<>();\n    // Try: s.push(10); s.push(20); s.pop();\n    \n}`,
        testCases: [{ input: [], expected: [] }],
        defaultInput: [{ action: "push", value: 10 }, { action: "push", value: 20 }, { action: "pop" }]
    },
    queue: {
        name: "Queue Operations",
        complexity: "O(1)",
        description: "Implement FIFO operations.",
        defaultCode: `void runQueue() {\n    Queue<Integer> q = new LinkedList<>();\n    // Try: q.add(10); q.add(20); q.poll();\n    \n}`,
        testCases: [{ input: [], expected: [] }],
        defaultInput: [{ action: "enqueue", value: 10 }, { action: "enqueue", value: 20 }, { action: "dequeue" }]
    }
};

const analyzeCode = (code) => {
    const errors = [];
    if (!code || !code.trim()) return ["Source file is empty."];
    const openCount = (code.match(/\{/g) || []).length;
    const closeCount = (code.match(/\}/g) || []).length;
    if (openCount !== closeCount) errors.push(`Unmatched braces: {${openCount}} vs }${closeCount}}`);
    return errors;
};

const getValidAlg = (rawAlg) => {
    if (!rawAlg) return "bubble_sort";
    const normalized = String(rawAlg).toLowerCase().replace(/ /g, "_");
    return ALGORITHM_CONFIGS[normalized] ? normalized : "bubble_sort";
};

const API_BASE = window.location.hostname === "localhost" ? "http://localhost:8000" : "https://backend-vix7.onrender.com";

export const VisualPlayground = ({ onBack, initialAlg }) => {
    const defaultAlg = getValidAlg(initialAlg);
    const [alg, setAlg] = useState(defaultAlg);
    const [steps, setSteps] = useState([]);
    const [stepIdx, setStepIdx] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [code, setCode] = useState(ALGORITHM_CONFIGS[defaultAlg]?.defaultCode || "// Write your code here...");

    const monaco = useMonaco();
    const editorRef = useRef(null);
    const decorRef = useRef([]);

    const sounds = useRef({
        step: new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'),
        success: new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3')
    });

    useEffect(() => {
        sounds.current.step.volume = 0.2;
        sounds.current.success.volume = 0.4;
    }, []);

    const config = useMemo(() => ALGORITHM_CONFIGS[alg] || ALGORITHM_CONFIGS.bubble_sort, [alg]);
    const currentStep = steps[stepIdx] || null;

    useEffect(() => {
        if (initialAlg) {
            const validAlg = getValidAlg(initialAlg);
            setAlg(validAlg);
            const defaultCode = ALGORITHM_CONFIGS[validAlg]?.defaultCode || `// Write logic for ${validAlg} here...`;
            setCode(defaultCode);
            handleRun(validAlg, defaultCode);
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
            decorRef.current = editorRef.current.deltaDecorations(decorRef.current, [
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

    const handleRun = async (targetAlg = alg, codeToUse = code) => {
        setIsLoading(true);
        setIsPlaying(false);
        setStepIdx(0);
        setError(null);

        const lintErrors = analyzeCode(codeToUse);
        if (lintErrors.length > 0) {
            setError(lintErrors[0]);
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/visualize`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    algorithm: targetAlg,
                    code: codeToUse,
                    input: ALGORITHM_CONFIGS[targetAlg]?.defaultInput || {}
                })
            });

            if (!res.ok) throw new Error("Simulator connection failed.");

            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                setSteps(data);
                setIsPlaying(true);
            } else if (data.steps && data.steps.length > 0) {
                setSteps(data.steps);
                setIsPlaying(true);
            } else {
                setError(data.error || "No visualization steps generated.");
            }
        } catch (err) {
            setError("The visualization engine is currently offline.");
        }
        setIsLoading(false);
    };

    const handleEditorDidMount = (editor, monacoInstance) => {
        editorRef.current = editor;
        if (monacoInstance) {
            monacoInstance.editor.defineTheme('dsa-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': '#09090b',
                    'editorLineNumber.foreground': '#3f3f46',
                    'editor.selectionBackground': '#0071e333',
                    'editorCursor.foreground': '#0071e3',
                }
            });
            monacoInstance.editor.setTheme('dsa-dark');
        }
    };

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "#0e0e10", color: "#e3e3e3", overflow: "hidden" }}>
            <style>{`.active-line-highlight { background: rgba(0, 113, 227, 0.2) !important; width: 100% !important; } .active-line-glyph { background: #0071E3 !important; width: 5px !important; }`}</style>

            {/* Header */}
            <div style={{ padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #222", background: "#18181b" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <button onClick={onBack} style={{ background: "none", border: "none", color: "#0071e3", fontWeight: 700, cursor: "pointer", fontSize: 13 }}>‹ BACK</button>
                    <div style={{ width: 1, height: 20, background: "#333" }} />
                    <h1 style={{ fontSize: 18, fontWeight: 900 }}>Visual Playground</h1>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <select value={alg} onChange={(e) => {
                        const newAlg = e.target.value; setAlg(newAlg);
                        const newCode = ALGORITHM_CONFIGS[newAlg]?.defaultCode || ""; setCode(newCode);
                        setSteps([]); setStepIdx(0); handleRun(newAlg, newCode);
                    }} style={{ background: "#27272a", color: "white", border: "1px solid #3f3f46", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
                        {Object.keys(ALGORITHM_CONFIGS).map(k => <option key={k} value={k}>{ALGORITHM_CONFIGS[k].name}</option>)}
                    </select>
                    <button onClick={() => handleRun()} disabled={isLoading} style={{ background: "#0071e3", color: "white", padding: "8px 24px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", opacity: isLoading ? 0.6 : 1 }}>
                        {isLoading ? "Running..." : "Visualize 🚀"}
                    </button>
                </div>
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
                {/* Editor Panel */}
                <div style={{ width: "35%", display: "flex", flexDirection: "column", borderRight: "1px solid #222" }}>
                    <div style={{ flex: 1, position: "relative" }}>
                        <Editor height="100%" language="java" theme="vs-dark" value={code} onChange={(v) => setCode(v)} onMount={handleEditorDidMount} options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 20 }, fontFamily: "'JetBrains Mono', monospace", scrollBeyondLastLine: false, lineNumbers: "on", cursorStyle: "block" }} />
                    </div>
                </div>

                {/* Visualizer Panel */}
                <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#09090b" }}>
                    {/* Controls Bar */}
                    <div style={{ height: 60, padding: "0 24px", background: "#111", borderBottom: "1px solid #222", display: "flex", alignItems: "center", gap: 20 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <button onClick={() => setIsPlaying(!isPlaying)} style={{ width: 40, height: 40, borderRadius: "50%", background: "#0071e3", border: "none", color: "white", cursor: "pointer", fontSize: 14 }}>{isPlaying ? "⏸" : "▶"}</button>
                            <button onClick={() => setStepIdx(s => Math.max(0, s - 1))} style={{ width: 32, height: 32, borderRadius: 8, background: "#27272a", border: "none", color: "white", cursor: "pointer", fontSize: 12 }}>⏮</button>
                            <button onClick={() => setStepIdx(s => Math.min(steps.length - 1, s + 1))} style={{ width: 32, height: 32, borderRadius: 8, background: "#27272a", border: "none", color: "white", cursor: "pointer", fontSize: 12 }}>⏭</button>
                        </div>
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ fontSize: 11, fontWeight: 800, color: "#52525b" }}>SPEED</span>
                            <input type="range" min="0.5" max="3" step="0.5" value={speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} style={{ flex: 1, accentColor: "#0071e3" }} />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 900, color: "#a1a1aa", background: "#18181b", padding: "6px 12px", borderRadius: 8 }}>STEP {stepIdx + 1} / {steps.length || 0}</div>
                    </div>

                    <div style={{ flex: 1, overflowY: "auto", padding: 40, display: "flex", flexDirection: "column", gap: 32 }}>
                        {error && <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid #ef4444", padding: 20, borderRadius: 12, color: "#ef4444", fontWeight: 700 }}>⚠️ {error}</div>}

                        {currentStep ? (
                            <>
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={stepIdx} style={{ background: "rgba(0,113,227,0.1)", border: "1px solid rgba(0,113,227,0.3)", padding: "24px 32px", borderRadius: 16, color: "white", fontSize: 20, fontWeight: 800 }}>{currentStep.explanation}</motion.div>
                                {Array.isArray(currentStep.array) && (
                                    <div style={{ background: "#18181b", borderRadius: 16, padding: 24, border: "1px solid #222" }}>
                                        <h3 style={{ fontSize: 11, fontWeight: 900, color: "#52525b", marginBottom: 20, letterSpacing: 1 }}>MEMORY STATE</h3>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                                            {currentStep.array.map((v, i) => {
                                                const isPointed = currentStep.pointers && Object.values(currentStep.pointers).includes(i);
                                                return (
                                                    <div key={i} style={{ width: 50, height: 50, background: isPointed ? "#0071e3" : "#27272a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 16, border: isPointed ? "2px solid #60a5fa" : "1px solid #333", position: "relative" }}>
                                                        {v}
                                                        {currentStep.pointers && Object.entries(currentStep.pointers).filter(([p, pos]) => pos === i).map(([p], idx) => (
                                                            <div key={p} style={{ position: "absolute", bottom: -20, fontSize: 9, color: "#60a5fa", fontWeight: 900 }}>{p}</div>
                                                        ))}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {currentStep.variables && typeof currentStep.variables === "object" && (
                                    <div style={{ background: "#18181b", borderRadius: 16, padding: 24, border: "1px solid #222" }}>
                                        <h3 style={{ fontSize: 11, fontWeight: 900, color: "#52525b", marginBottom: 20, letterSpacing: 1 }}>VARIABLES</h3>
                                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                                            {Object.entries(currentStep.variables).map(([k, v]) => (
                                                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, background: "#27272a", padding: "8px 12px", borderRadius: 8 }}>
                                                    <span style={{ color: "#a1a1aa", fontWeight: 700 }}>{k}</span>
                                                    <span style={{ fontWeight: 800 }}>{JSON.stringify(v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.3, fontSize: 18, fontWeight: 800 }}>CLICK VISUALIZE TO START</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};
