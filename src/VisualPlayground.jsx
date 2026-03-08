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
    const openCount = (code.match(/\{/g) || []).length;
    const closeCount = (code.match(/\}/g) || []).length;
    if (openCount !== closeCount) errors.push(`Unmatched braces: {${openCount}} vs }${closeCount}}`);
    if (code.includes("// Write your code here")) errors.push("Please remove the template comment and write your logic.");
    return errors;
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
    const [terminalOutput, setTerminalOutput] = useState([{ msg: "Terminal ready. Write code and click 'Run' to compile.", type: "system" }]);
    const [code, setCode] = useState(ALGORITHM_CONFIGS[initialAlg || "bubble_sort"]?.defaultCode || "// Write your code here...");
    const monaco = useMonaco();
    const editorRef = useRef(null);
    const decorRef = useRef([]);

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
            // Pass code explicitly to avoid stale closure in the first run
            handleRun(initialAlg, defaultCode);
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

    const handleRun = async (targetAlg = alg, codeToUse = code) => {
        setIsLoading(true);
        setIsPlaying(false);
        setStepIdx(0);
        setError(null);

        setTerminalOutput([{ msg: `Compiling ${targetAlg.replace("_", " ")}...`, type: "system" }]);

        const lintErrors = analyzeCode(codeToUse);
        if (lintErrors.length > 0) {
            setTerminalOutput(prev => [...prev, ...lintErrors.map(e => ({ msg: `❌ Compilation Error: ${e}`, type: "error" }))]);
            setError("Compilation failed. Check terminal.");
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

            if (!res.ok) throw new Error(`Server connection failed (${res.status})`);

            const data = await res.json();

            if (data.steps) {
                setTerminalOutput(prev => [...prev, { msg: "✅ Compilation successful. Executing simulation...", type: "success" }]);
                setSteps(data.steps);
                setIsPlaying(true);
            } else {
                setTerminalOutput(prev => [...prev, { msg: `❌ Execution Error: ${data.error || "Unknown simulator error"}`, type: "error" }]);
                setError(data.error);
            }
        } catch (err) {
            setTerminalOutput(prev => [...prev, { msg: "❌ Request failed: Target environment unreachable.", type: "error" }]);
            setError("Could not connect to the engine.");
        }
        setIsLoading(false);
    };

    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;

        // Add custom theme tweaks
        monaco.editor.defineTheme('dsa-dark', {
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
        monaco.editor.setTheme('dsa-dark');
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
                        const newCode = ALGORITHM_CONFIGS[newAlg]?.defaultCode || "";
                        setCode(newCode);
                        setSteps([]);
                        setStepIdx(0);
                        handleRun(newAlg, newCode);
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
                <div style={{ width: "45%", display: "flex", flexDirection: "column", borderRight: "1px solid #222", position: "relative" }}>
                    <div style={{ flex: 1, position: "relative", display: "flex", flexDirection: "column" }}>
                        <div style={{ padding: "12px 24px", background: "#111", borderBottom: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <span style={{ fontSize: 10, fontWeight: 900, color: "#a1a1aa", letterSpacing: 1 }}>EDITOR</span>
                                <div style={{ height: 12, width: 1, background: "#333" }} />
                                <span style={{ fontSize: 11, fontWeight: 700, color: "#0071e3" }}>solution.java</span>
                            </div>
                            <div style={{ background: "rgba(0,113,227,0.1)", color: "#0071e3", padding: "2px 10px", borderRadius: 4, fontSize: 10, fontWeight: 800, border: "1px solid rgba(0,113,227,0.3)" }}>
                                {alg.toUpperCase()} DEBUG MODE
                            </div>
                        </div>
                        <Editor
                            height="100%"
                            language="java"
                            theme="vs-dark"
                            value={code}
                            onChange={(v) => setCode(v)}
                            onMount={handleEditorDidMount}
                            options={{
                                fontSize: 14,
                                minimap: { enabled: false },
                                padding: { top: 20 },
                                fontFamily: "'JetBrains Mono', monospace",
                                scrollBeyondLastLine: false,
                                lineNumbers: "on",
                                roundedSelection: true,
                                automaticLayout: true,
                                cursorStyle: "block",
                                selectionHighlight: true
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


                {/* Integrated Terminal Dashboard */}
                <div style={{ height: 260, background: "#0c0c0e", borderTop: "2px solid #222", display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", background: "#111", borderBottom: "1px solid #222" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 8, height: 8, background: "#ef4444", borderRadius: "50%" }} />
                            <span style={{ fontSize: 11, fontWeight: 900, color: "#a1a1aa", letterSpacing: 1.5 }}>DEBUG TERMINAL</span>
                        </div>
                        <button onClick={() => setTerminalOutput([])} style={{ background: "none", border: "none", color: "#52525b", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>CLEAR</button>
                    </div>
                    <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 1.8 }}>
                        {terminalOutput.map((log, i) => (
                            <div key={i} style={{
                                color: log.type === "error" ? "#ef4444" : log.type === "success" ? "#22c55e" : "#e4e4e7",
                                marginBottom: 6,
                                display: "flex",
                                gap: 12
                            }}>
                                <span style={{ color: "#3f3f46", userSelect: "none" }}>[{i + 1}]</span>
                                <span>{log.msg}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Visualization and Test Cases */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Sub-header for Steps */}
                <div style={{ padding: "12px 32px", background: "#111", borderBottom: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <span style={{ fontSize: 11, fontWeight: 900, color: "#60a5fa" }}>TEST CASE STATUS:</span>
                        <div style={{ display: "flex", gap: 8 }}>
                            {ALGORITHM_CONFIGS[alg]?.testCases?.map((_, idx) => (
                                <div key={idx} style={{ padding: "4px 10px", background: steps.length > 0 && stepIdx === steps.length - 1 ? "rgba(34, 197, 94, 0.1)" : "#18181b", color: steps.length > 0 && stepIdx === steps.length - 1 ? "#22c55e" : "#52525b", borderRadius: 6, fontSize: 10, fontWeight: 900, border: "1px solid currentColor" }}>
                                    CASE {idx + 1} {steps.length > 0 && stepIdx === steps.length - 1 ? "✅" : "⏳"}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#a1a1aa" }}>{stepIdx + 1} / {steps.length || 0} STEPS</div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "40px", display: "flex", flexDirection: "column", gap: 32, background: "#09090b" }}>
                    {error && (
                        <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: 24, borderRadius: 24, border: "2px solid rgba(239, 68, 68, 0.2)", fontSize: 14, fontWeight: 600, textAlign: "center" }}>
                            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
                            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Compilation/Runtime Error</div>
                            {error}
                            <button onClick={() => handleRun()} style={{ marginTop: 20, display: "block", width: "100%", background: "#ef4444", color: "white", padding: "12px", borderRadius: 12, border: "none", fontWeight: 700, cursor: "pointer" }}>Retry Compilation</button>
                        </div>
                    )}
                    {!currentStep && !error ? (
                        <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: 0.6, textAlign: "center" }}>
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }} style={{ fontSize: 80, marginBottom: 20 }}>⚙️</motion.div>
                            <h3 style={{ fontSize: 24, fontWeight: 800, color: "white", marginBottom: 8 }}>{isLoading ? "Analyzing your algorithm..." : "Ready to Visualize"}</h3>
                            <p style={{ color: "#a1a1aa", maxWidth: 300 }}>{isLoading ? "Generating step-by-step state changes for your code." : "Click 'Run Algorithm' to see the execution flow."}</p>
                        </div>
                    ) : currentStep && (
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
    );
};
