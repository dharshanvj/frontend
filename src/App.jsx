// Version 1.0.1 - Deploying Login, Settings & Quest System
import { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VisualPlayground } from './VisualPlayground';
import Editor from "@monaco-editor/react";

/* ============================================================
   SUPABASE CONFIG — Replace with your own project credentials
   1. Go to https://supabase.com → New Project
   2. Settings → API → copy Project URL and anon key
============================================================ */
const SUPABASE_URL = "https://hmshjaqpraxlzydpkdml.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtc2hqYXFwcmF4bHp5ZHBrZG1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MTg0NjEsImV4cCI6MjA4Nzk5NDQ2MX0.cLUg_LAcnWv-_MNune2UttgPq4IQ1zwILmUyBmxxTYE";

// Minimal Supabase auth client (no SDK needed)
const supabase = {
  async signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "Sign up failed");
    return data;
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || data.msg || "Sign in failed");
    return data;
  },
  async signOut(accessToken) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
  },
  async getUser(accessToken) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return res.json();
  },
  signInWithGoogle() {
    const redirectTo = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${redirectTo}`;
  },
};

const SESSION_KEY = "fita_supabase_session";

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:ital,wght@0,100..800;1,100..800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #F5F7FA;
    --dark: #1D1D1F;
    --teal: #0071E3;
    --gold: #FF9500;
    --gold-light: #FFCC00;
    --text: #1d1d1f;
    --text-muted: #86868b;
    --font: 'Inter', -apple-system, sans-serif;
    --font-serif: 'Instrument Serif', serif;
    --radius: 32px;
    --shadow-sm: 0 4px 20px rgba(0,0,0,0.03);
    --shadow-md: 0 12px 40px rgba(0,0,0,0.06);
    --shadow-lg: 0 25px 60px rgba(0,0,0,0.08);
    --border: 1.5px solid rgba(0,0,0,0.06);
  }
  html { scroll-behavior: smooth; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    -webkit-font-smoothing: antialiased;
  }
  
  @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
  @keyframes drift { 0%, 100% { transform: translateX(0px); } 50% { transform: translateX(20px); } }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .sky-gradient { background: linear-gradient(180deg, #AEE2FF 0%, #F5F9FF 100%); }

  .premium-card {
    background: white;
    border: var(--border);
    box-shadow: var(--shadow-md);
    border-radius: 40px;
    transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  }
  .premium-card:hover { border-color: rgba(0,113,227,0.3); transform: translateY(-8px); boxShadow: var(--shadow-lg); }

  .login-input {
    width: 100%;
    padding: 14px 18px;
    border: 1.5px solid rgba(0,0,0,0.1);
    border-radius: 14px;
    font-size: 15px;
    font-family: var(--font);
    background: rgba(255,255,255,0.8);
    color: #1d1d1f;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
  }
  .login-input:focus { border-color: #0071e3; box-shadow: 0 0 0 4px rgba(0,113,227,0.12); background: white; }
  .login-input::placeholder { color: #a1a1a6; }
  .login-input.error { border-color: #ff3b30; box-shadow: 0 0 0 4px rgba(255,59,48,0.1); }
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
   SUPABASE NOT CONFIGURED BANNER
============================================================ */
const isSupabaseConfigured = () =>
  SUPABASE_URL !== "https://YOUR_PROJECT.supabase.co" && SUPABASE_ANON_KEY !== "YOUR_ANON_KEY_HERE";

/* ============================================================
   LOGIN SCREEN — Real Supabase Auth
============================================================ */
const LoginScreen = ({ onLogin, onBack }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const configured = isSupabaseConfigured();

  const triggerError = (msg) => { setError(msg); setShakeKey(k => k + 1); };

  const handleLogin = async () => {
    if (!email.trim() || !password) { triggerError("Please enter your email and password."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { triggerError("Please enter a valid email address."); return; }
    setLoading(true); setError(""); setInfo("");
    try {
      const data = await supabase.signIn(email.trim().toLowerCase(), password);
      const session = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        user: data.user,
        name: data.user?.user_metadata?.display_name || email.split("@")[0],
        username: email.split("@")[0],
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      onLogin(session);
    } catch (err) {
      setLoading(false);
      triggerError(err.message || "Invalid email or password.");
    }
  };

  const handleSignup = async () => {
    if (!displayName.trim()) { triggerError("Please enter your display name."); return; }
    if (!email.trim()) { triggerError("Please enter your email address."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { triggerError("Please enter a valid email address."); return; }
    if (password.length < 6) { triggerError("Password must be at least 6 characters."); return; }
    if (password !== confirmPassword) { triggerError("Passwords do not match."); return; }
    setLoading(true); setError(""); setInfo("");
    try {
      await supabase.signUp(email.trim().toLowerCase(), password);
      setLoading(false);
      setInfo("✅ Account created! Check your email to confirm, then sign in.");
      setMode("login");
      setPassword(""); setConfirmPassword("");
    } catch (err) {
      setLoading(false);
      triggerError(err.message || "Sign up failed. Try a different email.");
    }
  };

  const handleSubmit = () => { setError(""); mode === "login" ? handleLogin() : handleSignup(); };
  const handleKeyDown = (e) => { if (e.key === "Enter") handleSubmit(); };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f7", position: "relative", overflow: "hidden" }}>
      {/* Animated background orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: "5%", left: "10%", width: 500, height: 500, background: "radial-gradient(circle, rgba(0,113,227,0.14), transparent 70%)", borderRadius: "50%", filter: "blur(40px)", animation: "orb-drift 12s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: "5%", right: "8%", width: 440, height: 440, background: "radial-gradient(circle, rgba(52,199,89,0.11), transparent 70%)", borderRadius: "50%", filter: "blur(40px)", animation: "orb-drift 16s ease-in-out infinite reverse" }} />
        <div style={{ position: "absolute", top: "45%", right: "20%", width: 360, height: 360, background: "radial-gradient(circle, rgba(175,82,222,0.09), transparent 70%)", borderRadius: "50%", filter: "blur(40px)", animation: "orb-drift 10s ease-in-out infinite 3s" }} />
        <div style={{ position: "absolute", top: "20%", right: "5%", width: 280, height: 280, background: "radial-gradient(circle, rgba(255,149,0,0.08), transparent 70%)", borderRadius: "50%", filter: "blur(35px)", animation: "orb-drift 14s ease-in-out infinite 1s" }} />
      </div>

      {/* Floating module icons */}
      {[
        { icon: "📚", top: "12%", left: "6%", delay: "0s", size: 48 },
        { icon: "🔄", top: "70%", left: "4%", delay: "1.5s", size: 40 },
        { icon: "🔍", top: "20%", right: "6%", delay: "0.8s", size: 44 },
        { icon: "🫧", bottom: "15%", right: "8%", delay: "2s", size: 36 },
        { icon: "💻", top: "55%", right: "3%", delay: "1s", size: 38 },
        { icon: "🎤", bottom: "25%", left: "7%", delay: "0.4s", size: 34 },
      ].map((item, i) => (
        <div key={i} style={{ position: "fixed", top: item.top, bottom: item.bottom, left: item.left, right: item.right, zIndex: 0, pointerEvents: "none", animation: `login-float 4s ease-in-out infinite`, animationDelay: item.delay }}>
          <div style={{ width: item.size, height: item.size, borderRadius: item.size * 0.28, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: item.size * 0.46, boxShadow: "var(--shadow)", border: "1.5px solid var(--border)", opacity: 0.8 }}>
            {item.icon}
          </div>
        </div>
      ))}
      {onBack && (
        <motion.button onClick={onBack} whileHover={{ x: -4 }} style={{ position: "fixed", top: 40, left: 40, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", border: "1.5px solid #EEE", color: "#1D1D1F", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 800, cursor: "pointer", zIndex: 100, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          ‹ BACK TO HOME
        </motion.button>
      )}

      {/* Login Card */}
      <motion.div
        key={shakeKey}
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 420, margin: "0 24px" }}
      >
        <div style={{ background: "rgba(255,255,255,0.88)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderRadius: 28, boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)", border: "1.5px solid rgba(255,255,255,0.9)", overflow: "hidden" }}>
          <div style={{ height: 4, background: "linear-gradient(90deg, #0071e3, #34c759, #af52de, #ff9500)" }} />

          <div style={{ padding: "36px 36px 32px" }}>
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <div style={{ width: 44, height: 44, borderRadius: 13, background: "#0071e3", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,113,227,0.35)" }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: "white", fontFamily: "var(--font-mono)" }}>C</span>
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#1d1d1f", letterSpacing: -0.3 }}>CodeLoom</div>
                <div style={{ fontSize: 11, color: "#86868b", fontWeight: 500 }}>Learning Platform</div>
              </div>
            </div>

            {/* Supabase not configured warning */}
            {!configured && (
              <div style={{ background: "#fff4e6", border: "1.5px solid rgba(255,149,0,0.3)", borderRadius: 14, padding: "12px 16px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#ff9500", marginBottom: 6 }}>⚙️ Setup Required</div>
                <p style={{ fontSize: 12, color: "#424245", lineHeight: 1.6 }}>
                  Add your Supabase credentials at the top of this file to enable real authentication. Go to{" "}
                  <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: "#0071e3", fontWeight: 600 }}>supabase.com</a>
                  {" "}→ New Project → Settings → API.
                </p>
              </div>
            )}

            {/* Mode toggle */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.05)", borderRadius: 14, padding: 3, marginBottom: 28 }}>
              {[["login", "Sign In"], ["signup", "Sign Up"]].map(([m, l]) => (
                <button key={m} onClick={() => { setMode(m); setError(""); setInfo(""); }} style={{ flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600, borderRadius: 11, border: "none", cursor: "pointer", transition: "all 0.2s", background: mode === m ? "white" : "transparent", color: mode === m ? "#1d1d1f" : "#86868b", boxShadow: mode === m ? "var(--shadow-sm)" : "none" }}>
                  {l}
                </button>
              ))}
            </div>

            <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: -0.5, color: "#1d1d1f", marginBottom: 4 }}>
              {mode === "login" ? "Welcome back" : "Create account"}
            </h2>
            <p style={{ fontSize: 13, color: "#86868b", marginBottom: 24 }}>
              {mode === "login" ? "Sign in to continue learning" : "Join CodeLoom Platform"}
            </p>

            {/* Info message */}
            <AnimatePresence>
              {info && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }} style={{ background: "#e8f9ee", border: "1.5px solid rgba(52,199,89,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#34c759", fontWeight: 500 }}>{info}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -8, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -8, height: 0 }} style={{ background: "#fff1f0", border: "1.5px solid rgba(255,59,48,0.25)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>⚠️</span>
                  <span style={{ fontSize: 13, color: "#ff3b30", fontWeight: 500 }}>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <AnimatePresence>
                {mode === "signup" && (
                  <motion.div key="name-field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#424245", display: "block", marginBottom: 6, letterSpacing: 0.2 }}>Display Name</label>
                    <input className="login-input" type="text" placeholder="Your name" value={displayName} onChange={e => setDisplayName(e.target.value)} onKeyDown={handleKeyDown} autoComplete="name" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#424245", display: "block", marginBottom: 6, letterSpacing: 0.2 }}>Email Address</label>
                <input className="login-input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} autoComplete="email" autoFocus />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#424245", display: "block", marginBottom: 6, letterSpacing: 0.2 }}>Password</label>
                <div style={{ position: "relative" }}>
                  <input className="login-input" type={showPass ? "text" : "password"} placeholder={mode === "login" ? "Enter password" : "Min 6 characters"} value={password} onChange={e => setPassword(e.target.value)} onKeyDown={handleKeyDown} autoComplete={mode === "login" ? "current-password" : "new-password"} style={{ paddingRight: 48 }} />
                  <button onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 16, color: "#86868b", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {mode === "signup" && (
                  <motion.div key="confirm-field" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: "#424245", display: "block", marginBottom: 6, letterSpacing: 0.2 }}>Confirm Password</label>
                    <input className="login-input" type="password" placeholder="Repeat password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={handleKeyDown} autoComplete="new-password" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 8px 28px rgba(0,113,227,0.35)" }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={loading || !configured}
              style={{ width: "100%", marginTop: 20, padding: "14px", fontSize: 15, fontWeight: 600, background: !configured ? "#a1a1a6" : loading ? "#86868b" : "#0071e3", color: "white", borderRadius: 14, border: "none", cursor: loading || !configured ? "not-allowed" : "pointer", boxShadow: "var(--shadow-blue)", transition: "background 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </>
              ) : !configured ? (
                "Configure Supabase First"
              ) : (
                mode === "login" ? "Sign In →" : "Create Account →"
              )}
            </motion.button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0 0" }}>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
              <span style={{ fontSize: 12, color: "#a1a1a6", fontWeight: 500 }}>or continue with</span>
              <div style={{ flex: 1, height: 1, background: "rgba(0,0,0,0.08)" }} />
            </div>

            {/* Google OAuth Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
              whileTap={{ scale: 0.97 }}
              onClick={() => configured && supabase.signInWithGoogle()}
              disabled={!configured}
              style={{ width: "100%", marginTop: 12, padding: "13px 16px", fontSize: 14, fontWeight: 600, background: "white", color: "#1d1d1f", borderRadius: 14, border: "1.5px solid rgba(0,0,0,0.12)", cursor: configured ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", transition: "all 0.2s" }}
            >
              {/* Google G logo SVG */}
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.28 3.08 29.43 1 24 1 14.82 1 7.07 6.64 3.85 14.58l7.1 5.52C12.7 13.64 17.9 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.5 24.5c0-1.57-.14-3.08-.4-4.54H24v8.59h12.68c-.55 2.94-2.2 5.44-4.68 7.13l7.19 5.59C43.1 37.49 46.5 31.45 46.5 24.5z" />
                <path fill="#FBBC05" d="M10.95 28.1A14.56 14.56 0 0 1 9.5 24c0-1.42.24-2.8.65-4.1l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.87.92 7.53 2.55 10.78l8.4-6.68z" />
                <path fill="#34A853" d="M24 47c5.43 0 9.99-1.8 13.32-4.89l-7.19-5.59c-1.8 1.21-4.1 1.93-6.13 1.93-6.1 0-11.3-4.14-13.05-9.7l-8.4 6.68C7.07 41.36 14.82 47 24 47z" />
              </svg>
              Continue with Google
            </motion.button>

            {/* Security note */}
            <div style={{ marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#a1a1a6" }}>🔒</span>
              <span style={{ fontSize: 11, color: "#a1a1a6" }}>Secured by Supabase Auth · Passwords never stored in plain text</span>
            </div>
          </div>
        </div>

        <p style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "#a1a1a6" }}>
          Powered by <strong style={{ color: "#0071e3" }}>FITA Academy</strong> · Chennai & Bangalore
        </p>
      </motion.div>
    </div>
  );
};

/* ============================================================
   INTERVIEW DATA — unchanged
============================================================ */
const INTERVIEW_DATA = {
  "Stack": [
    { q: "What is a Stack and how does LIFO work?", a: "A Stack is a linear data structure where insertion (push) and deletion (pop) happen at the same end called the 'top'. LIFO means the Last element Inserted is the First one Out — like a pile of plates.", company: "Google", difficulty: "Easy" },
    { q: "Which of the following is the correct property of a Stack?", a: "LIFO", options: ["FIFO", "LIFO", "LILO", "None of these"], company: "Amazon", difficulty: "Easy" },
    { q: "What is Stack Overflow and Stack Underflow?", a: "Stack Overflow occurs when you push an element onto a full stack. Stack Underflow occurs when you pop from an empty stack. Both are error conditions that must be checked before operations.", company: "Amazon", difficulty: "Easy" },
    { q: "Which data structure is used to implement recursion?", a: "Stack", options: ["Queue", "Stack", "Linked List", "Tree"], company: "Microsoft", difficulty: "Easy" },
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
    { q: "In a Queue, insertion happens at ___ and deletion at ___?", a: "Rear, Front", options: ["Front, Rear", "Rear, Front", "Top, Bottom", "None"], company: "Google", difficulty: "Easy" },
    { q: "What is a Circular Queue and why is it needed?", a: "In a linear queue, after dequeuing, the front index moves right and freed space cannot be reused. A Circular Queue uses modular arithmetic — (rear+1) % capacity — to wrap around and reuse freed slots, solving space wastage.", company: "Microsoft", difficulty: "Easy" },
    { q: "Which data structure follows FIFO principle?", a: "Queue", options: ["Stack", "Queue", "Binary Tree", "Priority Queue"], company: "Amazon", difficulty: "Easy" },
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
  "Arrays": [
    { q: "What is an Array and how is it stored in memory?", a: "An array is a collection of elements of same type stored in contiguous memory locations. It allows random access to elements using an index. The memory address of arr[i] is calculated as: BaseAddress + (index * SizeOfElement).", company: "Infosys", difficulty: "Easy" },
    { q: "What is the time complexity of accessing an element in an array?", a: "O(1)", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], company: "TCS", difficulty: "Easy" },
    { q: "What is the time complexity of searching an element in an unsorted array?", a: "O(n)", options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"], company: "Amazon", difficulty: "Easy" },
    { q: "What is the difference between static and dynamic arrays?", a: "Static arrays have a fixed size determined at compile time. Dynamic arrays (like ArrayList in Java or vector in C++) can grow in size; when they fill up, a new larger array is allocated and elements are copied. Growing takes O(n) but is amortized O(1).", company: "Amazon", difficulty: "Medium" },
    { q: "How do you find the second largest element in an array in one pass?", a: "Initialize 'first' and 'second' to smallest possible value. Iterate through array: if current > first, update second = first and first = current. Else if current > second, update second = current. O(n) time, O(1) space.", company: "Microsoft", difficulty: "Easy" },
    { q: "Explain the concept of 'prefix sum' array.", a: "A prefix sum array P of array A is where P[i] = A[0] + A[1] + ... + A[i]. It allows O(1) range sum queries: Sum(i, j) = P[j] - P[i-1]. Preprocessing takes O(n).", company: "Google", difficulty: "Medium" },
  ],
  "Strings": [
    { q: "Which of the following classes is mutable in Java?", a: "StringBuilder", options: ["String", "StringBuilder", "Double", "Integer"], company: "Infosys", difficulty: "Easy" },
    { q: "What is the difference between String, StringBuilder, and StringBuffer in Java?", a: "String is immutable. StringBuilder is mutable but not thread-safe (faster). StringBuffer is mutable and thread-safe (synchronized, slower).", company: "Infosys", difficulty: "Easy" },
    { q: "How do you check if two strings are anagrams?", a: "Option 1: Sort both strings and compare (O(n log n)). Option 2: Use a frequency array of size 256 (or 26) to count characters (O(n)).", company: "Amazon", difficulty: "Medium" },
    { q: "What is string interning?", a: "String interning is a method of storing only one copy of each distinct string value, which must be immutable. All interned strings are stored in a pool managed by the JVM.", company: "Microsoft", difficulty: "Medium" },
  ],
  "Linked Lists": [
    { q: "What is the time complexity of inserting at the head of a linked list?", a: "O(1)", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], company: "TCS", difficulty: "Easy" },
    { q: "What is a Linked List and how does it differ from an Array?", a: "Linked List is a linear data structure where elements are not stored in contiguous memory. Each element (node) contains a data part and a pointer to the next node. Unlike arrays, linked lists have dynamic size and O(1) insertion/deletion at a known position.", company: "TCS", difficulty: "Easy" },
    { q: "How do you detect a cycle in a linked list?", a: "Use Floyd’s Cycle-Finding Algorithm (Two Pointers: Slow and Fast). If they meet, there is a cycle.", company: "Google", difficulty: "Medium" },
    { q: "How do you reverse a linked list?", a: "Use three pointers: prev (null), curr (head), and next. Iterate: next = curr.next; curr.next = prev; prev = curr; curr = next. Finally, head = prev.", company: "Amazon", difficulty: "Medium" },
  ],
  "Recursion": [
    { q: "Which data structure is used inherently by recursion?", a: "Stack", options: ["Queue", "Stack", "Heap", "Tree"], company: "TCS", difficulty: "Easy" },
    { q: "What is Recursion?", a: "Recursion is a process in which a function calls itself directly or indirectly. It requires a Base Case to stop and a Recursive Step to move towards the base case.", company: "TCS", difficulty: "Easy" },
    { q: "What is tail recursion?", a: "Tail recursion is a special case where the recursive call is the last action in the function. Some compilers can optimize this to prevent stack overflow (tail call optimization).", company: "Google", difficulty: "Medium" },
  ],
  "Backtracking": [
    { q: "What is Backtracking?", a: "Backtracking is an algorithmic technique that considers all possible solutions and discards those that do not satisfy the constraints. It often uses recursion to explore the search space.", company: "Amazon", difficulty: "Medium" },
    { q: "How is backtracking different from brute force?", a: "While both explore many options, backtracking 'prunes' branches that are guaranteed not to lead to a solution, saving time.", company: "Microsoft", difficulty: "Medium" },
  ],
  "Trees": [
    { q: "What is a Tree data structure?", a: "A tree is a non-linear data structure that represents a hierarchical relationship between nodes. It consists of a root node and children nodes, with no cycles.", company: "Infosys", difficulty: "Easy" },
    { q: "Explain Tree Traversal techniques.", a: "In-order (Left, Root, Right), Pre-order (Root, Left, Right), and Post-order (Left, Right, Root). Also Level-order (BFS).", company: "Meta", difficulty: "Medium" },
  ],
  "Binary Search Trees": [
    { q: "What is a Binary Search Tree (BST)?", a: "A BST is a binary tree where the left child's value < parent's value, and the right child's value > parent's value. This property must hold for all subtrees.", company: "TCS", difficulty: "Easy" },
    { q: "What is the time complexity of searching in a BST?", a: "Best/Average: O(log n). Worst (skewed tree): O(n). To avoid worst case, use self-balancing BSTs (AVL, Red-Black Trees).", company: "Infosys", difficulty: "Easy" },
  ],
  "Heap / Priority Queue": [
    { q: "What is a Heap?", a: "A Heap is a complete binary tree that satisfies the heap property: in a Max-Heap, parent node is >= children; in a Min-Heap, parent node is <= children.", company: "Amazon", difficulty: "Medium" },
    { q: "How is a heap represented in an array?", a: "For a node at index i: Left child: 2i + 1, Right child: 2i + 2, Parent: floor((i-1)/2).", company: "Microsoft", difficulty: "Medium" },
  ],
  "Hashing": [
    { q: "What is Hashing?", a: "Hashing is a process of mapping data of arbitrary size to fixed-size values (hash codes) using a hash function. It allows constant time O(1) average lookup.", company: "Google", difficulty: "Easy" },
    { q: "What is the average time complexity of searching in a Hash Table?", a: "O(1)", options: ["O(1)", "O(n)", "O(log n)", "O(n²)"], company: "Amazon", difficulty: "Easy" },
    { q: "Explain Collision Handling in HashTables.", a: "Collisions occur when two keys hash to the same index. Techniques include Chaining (linked lists at indices) and Open Addressing (Linear Probing, Quadratic Probing, Double Hashing).", company: "Amazon", difficulty: "Medium" },
    { q: "Which of these is a collision resolution technique?", a: "Chaining", options: ["Chaining", "Linear Search", "Binary Search", "All of these"], company: "Google", difficulty: "Easy" },
  ],
  "Graphs": [
    { q: "What is a Graph?", a: "A Graph is a set of vertices (nodes) and edges that connect them. It can be Directed or Undirected, Weighted or Unweighted.", company: "TCS", difficulty: "Easy" },
    { q: "What is the difference between BFS and DFS traversal?", a: "BFS uses a Queue and explores level-by-level (finds shortest path in unweighted graphs). DFS uses a Stack/Recursion and goes as deep as possible.", company: "Google", difficulty: "Medium" },
  ],
  "Greedy Algorithms": [
    { q: "What is a Greedy Algorithm?", a: "An algorithm that makes the locally optimal choice at each step with the hope of finding a global optimum. Examples: Dijkstra's, Prim's, Fractional Knapsack.", company: "Microsoft", difficulty: "Medium" },
  ],
  "Dynamic Programming": [
    { q: "What is Dynamic Programming (DP)?", a: "An optimization technique that solves complex problems by breaking them into overlapping subproblems and storing their results (Memoization or Tabulation).", company: "Meta", difficulty: "Medium" },
    { q: "Explain Memoization vs Tabulation.", a: "Memoization is Top-Down (recursive + hash/cache). Tabulation is Bottom-Up (iterative + table).", company: "Amazon", difficulty: "Medium" },
  ],
  "Bit Manipulation": [
    { q: "What is Bit Manipulation?", a: "The act of algorithmically manipulating bits or other pieces of data shorter than a word. Common operations: AND (&), OR (|), XOR (^), NOT (~), Left Shift (<<), Right Shift (>>).", company: "Microsoft", difficulty: "Easy" },
    { q: "How do you check if a number is a power of 2?", a: "If (n > 0 && (n & (n - 1)) == 0), then n is a power of 2.", company: "Google", difficulty: "Easy" },
  ],
  "Tries": [
    { q: "What is a Trie (Prefix Tree)?", a: "A retrieval tree data structure used for efficient prefix-based searching of strings. Each node represents a character of a string.", company: "Amazon", difficulty: "Medium" },
  ],
  "Segment Trees": [
    { q: "What is a Segment Tree?", a: "A tree data structure used for storing information about intervals or segments. It allows querying and updating in O(log n) time.", company: "Google", difficulty: "Hard" },
  ],
  "Disjoint Set (Union Find)": [
    { q: "What is Union-Find?", a: "A data structure that tracks a set of elements partitioned into several disjoint subsets. Primary operations: Find (find root of set) and Union (merge two sets).", company: "Meta", difficulty: "Medium" },
    { q: "Explain Path Compression and Union by Rank.", a: "Path Compression flattens the tree during Find. Union by Rank always attaches the smaller tree under the taller tree. Together, they make operations nearly O(1).", company: "Google", difficulty: "Medium" },
  ],
  "Advanced Graph Algorithms": [
    { q: "Explain Dijkstra's Algorithm.", a: "Finds the shortest path from a source to all other nodes in a weighted graph (no negative weights). USes a PriorityQueue. O((V+E) log V).", company: "Amazon", difficulty: "Hard" },
    { q: "What is Bellman-Ford used for?", a: "Shortest paths for graphs with negative weights. Also detects negative cycles. Time O(VE).", company: "Microsoft", difficulty: "Hard" },
  ],
  "Binary Search": [
    { q: "What is the prerequisite for Binary Search?", a: "Sorted Array", options: ["Unsorted Array", "Sorted Array", "Must be Linked List", "None"], company: "TCS", difficulty: "Easy" },
    { q: "What is the time complexity of Binary Search?", a: "O(log n)", options: ["O(n)", "O(log n)", "O(n²)", "O(1)"], company: "Infosys", difficulty: "Easy" },
    { q: "Explain the difference between lower_bound and upper_bound.", a: "lower_bound returns the index of the first element >= target. upper_bound returns the index of the first element > target. Java equivalent: Arrays.binarySearch returns insertion point when not found.", company: "Microsoft", difficulty: "Medium" },
    { q: "What is Binary Search on the Answer?", a: "Instead of searching for a value in an array, we binary search on the ANSWER SPACE (e.g., min/max feasible answer). Define a monotonic predicate canAchieve(mid) and binary search on lo/hi to find the boundary. Converts O(n²) to O(n log n).", company: "Google", difficulty: "Medium" },
    { q: "How do you find a peak element in O(log n)?", a: "If arr[mid] < arr[mid+1], peak is in the right half. Else peak is in the left half (or at mid). Binary search on the condition, not the value. Works even on unsorted arrays (just needs adjacency property).", company: "Meta", difficulty: "Medium" },
    { q: "Explain the Koko Eating Bananas problem.", a: "Binary search on the answer (eating speed k). For each candidate speed, check if all piles can be finished in H hours. O(n log(max_pile)) total. Classic example of 'binary search on answer space'.", company: "Amazon", difficulty: "Medium" },
    { q: "How do you search in a rotated sorted array?", a: "One half of the array is always sorted. Check which half is sorted using mid vs lo/hi. If target is within the sorted half, search there; else search the other half. O(log n).", company: "Google", difficulty: "Medium" },
    { q: "What is exponential (gallop) search?", a: "Find the range where target lies by doubling index (1, 2, 4, 8...) then binary search within that range. Useful for unbounded/infinite arrays and sorted linked lists. O(log n) overall.", company: "Microsoft", difficulty: "Hard" },
    { q: "How do you find the square root of a number using Binary Search?", a: "Binary search lo=1, hi=x. If mid*mid <= x: lo=mid+1, capture answer. Else hi=mid-1. The final captured answer is floor(sqrt(x)). Can be done with longs to avoid overflow. O(log x).", company: "Infosys", difficulty: "Easy" },
    { q: "What is the difference between Binary Search and Linear Search?", a: "Linear: O(n), works on unsorted, no preprocessing. Binary: O(log n), requires sorted array. For n=10^6: linear needs 10^6 ops worst case vs binary's 20 ops. Always sort + binary search for repeated searches.", company: "TCS", difficulty: "Easy" },
  ],
  "Selection Sort": [
    { q: "Explain Selection Sort with an example.", a: "Selection Sort divides the array into sorted and unsorted parts. In each pass, it finds the minimum element from the unsorted part and swaps it to the correct position. Example: [64,25,12,22,11] → [11,25,12,22,64] → [11,12,25,22,64] → ... → [11,12,22,25,64].", company: "TCS", difficulty: "Easy" },
    { q: "What is the time complexity of Selection Sort?", a: "Best/Average/Worst: O(n²) — always makes (n-1)+(n-2)+...+1 = n(n-1)/2 comparisons regardless of input. Space: O(1). Number of swaps: exactly O(n) — at most n-1 swaps, making it efficient when writes are expensive.", company: "Infosys", difficulty: "Easy" },
    { q: "Is Selection Sort stable?", a: "Standard Selection Sort is NOT stable (swapping non-adjacent elements can displace equal elements). However, it can be made stable by shifting instead of swapping — but this increases writes to O(n²). For stability, prefer Insertion Sort.", company: "Microsoft", difficulty: "Medium" },
    { q: "When would you use Selection Sort over other algorithms?", a: "Use Selection Sort when write operations are very expensive (e.g., Flash memory with limited write cycles). It performs exactly O(n) swaps in the worst case — fewer writes than Bubble Sort O(n²) and Insertion Sort O(n²).", company: "Google", difficulty: "Medium" },
    { q: "Compare Selection Sort vs Insertion Sort.", a: "Both O(n²) average/worst. Selection: not stable, O(n) swaps (fewer writes), not adaptive (always O(n²)). Insertion: stable, O(n²) shifts but O(n) best (nearly sorted), adaptive. Insertion is preferred in practice.", company: "Amazon", difficulty: "Medium" },
    { q: "What is Heap Sort and how does it relate to Selection Sort?", a: "Heap Sort = Selection Sort + Max-Heap. Both select the maximum element each pass. Selection Sort uses O(n) linear scan to find min → O(n²). Heap Sort uses a max-heap to find max in O(log n) → total O(n log n). Same idea, better data structure.", company: "Google", difficulty: "Hard" },
  ],
  "Insertion Sort": [
    { q: "Explain Insertion Sort with an example.", a: "Insertion Sort builds a sorted portion one element at a time, like sorting playing cards. For each element, shift larger sorted elements right and insert in position. [12,11,13,5] → [11,12,13,5] → [5,11,12,13].", company: "TCS", difficulty: "Easy" },
    { q: "What is the time complexity of Insertion Sort?", a: "Best: O(n) — already sorted, just n-1 comparisons. Average: O(n²). Worst: O(n²) — reverse sorted. Space: O(1) in-place. It is adaptive: the closer to sorted the input, the faster it runs.", company: "Wipro", difficulty: "Easy" },
    { q: "Why is Insertion Sort used for small arrays in practice?", a: "For small n (< ~16-32), Insertion Sort has better cache performance and lower constant factors than Merge/Quick Sort. Java's Arrays.sort() and C++ std::sort (Introsort) use Insertion Sort for subarrays of size ≤ 16.", company: "Oracle", difficulty: "Medium" },
    { q: "Is Insertion Sort stable?", a: "Yes. Insertion Sort is stable because it only shifts elements that are strictly GREATER than the key (not >=). Equal elements are not moved past each other, preserving their original relative order.", company: "Microsoft", difficulty: "Easy" },
    { q: "What is Binary Insertion Sort?", a: "Instead of linear scan to find insertion position, use Binary Search to find the correct position (O(log n) per element). But shifting still costs O(n) per element, so total is still O(n²). Reduces COMPARISONS but not total time.", company: "Amazon", difficulty: "Medium" },
    { q: "How does Insertion Sort relate to Shell Sort? ", a: "Shell Sort is a generalization of Insertion Sort. Instead of comparing adjacent elements, Shell Sort compares elements h positions apart, gradually reducing h to 1. Final pass (h=1) is regular Insertion Sort. Achieves O(n^1.5) or better with good gap sequences.", company: "Google", difficulty: "Hard" },
  ],
  "Merge Sort": [
    { q: "Explain Merge Sort with its time complexity.", a: "Merge Sort uses divide-and-conquer: split array in half recursively until subarrays of size 1, then merge sorted halves. Time: O(n log n) all cases (divides log n times, merges O(n) each level). Space: O(n) auxiliary for merging.", company: "Google", difficulty: "Easy" },
    { q: "Why is Merge Sort preferred for linked lists?", a: "Merge Sort doesn't need random access (unlike Quick Sort which needs index-based swaps). For linked lists, splitting takes O(1) by relinking, and merging is O(n). No extra space needed for linked list merge sort. Quick Sort on linked lists is complex.", company: "Amazon", difficulty: "Medium" },
    { q: "Is Merge Sort stable?", a: "Yes. During the merge step, when elements from left and right subarrays are equal, we always take from the LEFT first (arr[i] <= arr[j]). This preserves relative order of equal elements. Java's Arrays.sort(Object[]) uses TimSort (merge sort variant) for stability.", company: "Microsoft", difficulty: "Easy" },
    { q: "What is the space complexity of Merge Sort?", a: "O(n) auxiliary space for the temporary array during merging. The recursive call stack uses O(log n) space. In-place merge sort exists but is complex with O(n log² n) time. Standard implementation: O(n) space total.", company: "Google", difficulty: "Medium" },
    { q: "How would you count inversions using Merge Sort?", a: "During merge, when we take an element from the RIGHT subarray before LEFT elements, all remaining LEFT elements form inversions with it — add (mid - i + 1) to the count. O(n log n) inversion count using modified merge sort.", company: "Amazon", difficulty: "Hard" },
    { q: "What is TimSort and how does it use Merge Sort?", a: "TimSort (Java's default sort for objects) divides array into 'runs' of naturally sorted sequences (min 32 elements, using Insertion Sort). Then merges runs using a Merge Sort-like process. O(n log n) worst case, O(n) best case. Stable, adaptive, and used in Python too.", company: "Oracle", difficulty: "Hard" },
    { q: "Compare Merge Sort vs Quick Sort.", a: "Merge Sort: O(n log n) guaranteed, stable, O(n) space, not in-place, cache-unfriendly merges. Quick Sort: O(n log n) average but O(n²) worst, unstable, O(log n) space, in-place, cache-friendly. Quick Sort is faster in practice; Merge Sort for stability or linked lists.", company: "Meta", difficulty: "Medium" },
  ],
  "Quick Sort": [
    { q: "Explain Quick Sort with its time complexity.", a: "Quick Sort picks a 'pivot,' partitions elements less than pivot to left and greater to right, then recursively sorts both halves. Average: O(n log n). Worst: O(n²) when pivot is always min/max (sorted array with first-element pivot).", company: "Google", difficulty: "Easy" },
    { q: "What is the Lomuto vs Hoare partition scheme?", a: "Lomuto: pivot = last element; i tracks boundary of smaller elements; j scans left to right. Simple but makes 3x more swaps. Hoare: pivot = first element; two pointers i and j moving inward. More efficient (fewer swaps), but harder to implement correctly.", company: "Amazon", difficulty: "Medium" },
    { q: "How do you avoid O(n²) worst case in Quick Sort?", a: "1) Randomized pivot: randomly select pivot before partitioning. Reduces probability of O(n²) to negligible. 2) Median-of-three: pick median of first, middle, last as pivot. 3) Introsort: fall back to Heap Sort after depth exceeds 2*log(n).", company: "Microsoft", difficulty: "Medium" },
    { q: "What is the three-way partition (Dutch National Flag) Quick Sort?", a: "Partition into three regions: < pivot, == pivot, > pivot. All equal elements are placed in the middle and not recursed into. Reduces O(n²) to O(n) on arrays with many duplicates. Useful when data has many repeated values.", company: "Google", difficulty: "Medium" },
    { q: "What is QuickSelect and what is its time complexity? ", a: "QuickSelect finds the K-th smallest element in O(n) average using Quick Sort's partition. After partitioning, if pivot position == k: return; if k < pivot: recurse left; else recurse right. Average O(n), Worst O(n²) without randomization.", company: "Meta", difficulty: "Medium" },
    { q: "Is Quick Sort stable?", a: "No, standard Quick Sort is NOT stable. Elements equal to the pivot can be rearranged relative to each other during partitioning. If stability is needed, use Merge Sort. Java uses Quick Sort (dual-pivot) for primitive arrays and TimSort (stable) for Object arrays.", company: "Oracle", difficulty: "Easy" },
    { q: "What is Java's Dual-Pivot Quick Sort?", a: "Introduced in Java 7 (Arrays.sort for primitives). Uses TWO pivots p1 <= p2, partitioning into three parts: < p1, p1..p2, > p2. Fewer comparisons and better branch prediction than single-pivot. Empirically 10-15% faster on real-world data.", company: "Oracle", difficulty: "Hard" },
  ],
};

/* ============================================================
   CODING CHALLENGES
============================================================ */
const CODING_CHALLENGES = {
  "Stack": {
    "Beginner": [
      { id: "sb1", title: "Valid Parentheses", company: "Google", desc: "Given a string containing '(', ')', '{', '}', '[', ']', determine if it is valid. Every open bracket must be closed by the same type, in the correct order.", starter: `public boolean isValid(String s) {\n    // Your code here\n    \n}`, solution: `public boolean isValid(String s) {\n    Stack<Character> stack = new Stack<>();\n    for (char c : s.toCharArray()) {\n        if (c=='(' || c=='{' || c=='[') stack.push(c);\n        else {\n            if (stack.isEmpty()) return false;\n            char top = stack.pop();\n            if (c==')' && top!='(') return false;\n            if (c=='}' && top!='{') return false;\n            if (c==']' && top!='[') return false;\n        }\n    }\n    return stack.isEmpty();\n}`, testCases: `Input: "()" → true\nInput: "()[]{}" → true\nInput: "(]" → false\nInput: "([)]" → false` },
      { id: "sb2", title: "Reverse String using Stack", company: "Amazon", desc: "Reverse a string using a stack data structure. Push each character and pop to build reversed string.", starter: `public String reverseString(String s) {\n    // Use a Stack to reverse\n    \n}`, solution: `public String reverseString(String s) {\n    Stack<Character> stack = new Stack<>();\n    for (char c : s.toCharArray()) stack.push(c);\n    StringBuilder sb = new StringBuilder();\n    while (!stack.isEmpty()) sb.append(stack.pop());\n    return sb.toString();\n}`, testCases: `Input: "hello" → "olleh"\nInput: "abcde" → "edcba"\nInput: "a" → "a"` },
      { id: "sb3", title: "Implement Stack using Array", company: "Microsoft", desc: "Implement a stack class with push, pop, peek, and isEmpty methods using a fixed-size array.", starter: `class MyStack {\n    int[] arr = new int[100];\n    int top = -1;\n    \n    public void push(int x) { }\n    public int pop() { }\n    public int peek() { }\n    public boolean isEmpty() { }\n}`, solution: `class MyStack {\n    int[] arr = new int[100];\n    int top = -1;\n    \n    public void push(int x) {\n        if (top == 99) throw new RuntimeException("Overflow");\n        arr[++top] = x;\n    }\n    public int pop() {\n        if (top == -1) throw new RuntimeException("Underflow");\n        return arr[top--];\n    }\n    public int peek() { return arr[top]; }\n    public boolean isEmpty() { return top == -1; }\n}`, testCases: `push(1), push(2), peek() → 2\npop() → 2, peek() → 1\nisEmpty() after pop() → false` },
    ],
    "Intermediate": [
      { id: "si1", title: "Min Stack", company: "Amazon", desc: "Design a stack that supports push, pop, top, and retrieving the minimum element — all in O(1) time.", starter: `class MinStack {\n    public void push(int val) { }\n    public void pop() { }\n    public int top() { }\n    public int getMin() { }\n}`, solution: `class MinStack {\n    Deque<Integer> stack = new ArrayDeque<>();\n    Deque<Integer> minStack = new ArrayDeque<>();\n    \n    public void push(int val) {\n        stack.push(val);\n        if (minStack.isEmpty() || val <= minStack.peek())\n            minStack.push(val);\n    }\n    public void pop() {\n        if (stack.pop().equals(minStack.peek())) minStack.pop();\n    }\n    public int top() { return stack.peek(); }\n    public int getMin() { return minStack.peek(); }\n}`, testCases: `push(-2),push(0),push(-3)\ngetMin() → -3\npop()\ntop() → 0\ngetMin() → -2` },
      { id: "si2", title: "Evaluate Reverse Polish Notation", company: "Meta", desc: "Evaluate the value of an arithmetic expression in Reverse Polish Notation (postfix). Valid operators: +, -, *, /.", starter: `public int evalRPN(String[] tokens) {\n    // Use a stack to evaluate\n    \n}`, solution: `public int evalRPN(String[] tokens) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (String t : tokens) {\n        if ("+-*/".contains(t)) {\n            int b = stack.pop(), a = stack.pop();\n            switch(t) {\n                case "+": stack.push(a+b); break;\n                case "-": stack.push(a-b); break;\n                case "*": stack.push(a*b); break;\n                case "/": stack.push(a/b); break;\n            }\n        } else stack.push(Integer.parseInt(t));\n    }\n    return stack.pop();\n}`, testCases: `["2","1","+","3","*"] → 9\n["4","13","5","/","+"] → 6` },
      { id: "si3", title: "Daily Temperatures", company: "Amazon", desc: "Given an array of temperatures, return an array where each element is how many days to wait for a warmer temperature.", starter: `public int[] dailyTemperatures(int[] temperatures) {\n    // Monotonic stack approach\n    \n}`, solution: `public int[] dailyTemperatures(int[] temperatures) {\n    int n = temperatures.length;\n    int[] result = new int[n];\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int i = 0; i < n; i++) {\n        while (!stack.isEmpty() && temperatures[i] > temperatures[stack.peek()]) {\n            int idx = stack.pop();\n            result[idx] = i - idx;\n        }\n        stack.push(i);\n    }\n    return result;\n}`, testCases: `[73,74,75,71,69,72,76,73] → [1,1,4,2,1,1,0,0]\n[30,40,50,60] → [1,1,1,0]` },
    ],
    "Advanced": [
      { id: "sa1", title: "Largest Rectangle in Histogram", company: "Google", desc: "Given an array of bar heights in a histogram, find the area of the largest rectangle that can be formed.", starter: `public int largestRectangleArea(int[] heights) {\n    // Monotonic stack solution\n    \n}`, solution: `public int largestRectangleArea(int[] heights) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    int maxArea = 0;\n    int n = heights.length;\n    for (int i = 0; i <= n; i++) {\n        int curr = (i == n) ? 0 : heights[i];\n        while (!stack.isEmpty() && heights[stack.peek()] > curr) {\n            int h = heights[stack.pop()];\n            int w = stack.isEmpty() ? i : i - stack.peek() - 1;\n            maxArea = Math.max(maxArea, h * w);\n        }\n        stack.push(i);\n    }\n    return maxArea;\n}`, testCases: `[2,1,5,6,2,3] → 10\n[2,4] → 4` },
      { id: "sa2", title: "Trapping Rain Water", company: "Amazon", desc: "Given n non-negative integers representing elevation heights, compute how much rainwater can be trapped after rain.", starter: `public int trap(int[] height) {\n    // Stack-based approach\n    \n}`, solution: `public int trap(int[] height) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    int water = 0;\n    for (int i = 0; i < height.length; i++) {\n        while (!stack.isEmpty() && height[i] > height[stack.peek()]) {\n            int bottom = stack.pop();\n            if (stack.isEmpty()) break;\n            int left = stack.peek();\n            int h = Math.min(height[left], height[i]) - height[bottom];\n            water += h * (i - left - 1);\n        }\n        stack.push(i);\n    }\n    return water;\n}`, testCases: `[0,1,0,2,1,0,1,3,2,1,2,1] → 6\n[4,2,0,3,2,5] → 9` },
      { id: "sa3", title: "Asteroid Collision", company: "Meta", desc: "An array represents asteroids. Positive = right, Negative = left. Same size asteroids explode. Find the state after all collisions.", starter: `public int[] asteroidCollision(int[] asteroids) {\n    // Use stack to simulate\n    \n}`, solution: `public int[] asteroidCollision(int[] asteroids) {\n    Deque<Integer> stack = new ArrayDeque<>();\n    for (int a : asteroids) {\n        boolean alive = true;\n        while (alive && a < 0 && !stack.isEmpty() && stack.peek() > 0) {\n            if (stack.peek() < -a) { stack.pop(); }\n            else if (stack.peek() == -a) { stack.pop(); alive = false; }\n            else alive = false;\n        }\n        if (alive) stack.push(a);\n    }\n    int[] res = new int[stack.size()];\n    for (int i = res.length - 1; i >= 0; i--) res[i] = stack.pop();\n    return res;\n}`, testCases: `[5,10,-5] → [5,10]\n[8,-8] → []\n[10,2,-5] → [10]` },
    ],
  },
  "Queue": {
    "Beginner": [
      { id: "qb1", title: "Implement Queue using Stacks", company: "Amazon", desc: "Implement a FIFO queue using two stacks. Support push, pop, peek, and empty operations.", starter: `class MyQueue {\n    public void push(int x) { }\n    public int pop() { }\n    public int peek() { }\n    public boolean empty() { }\n}`, solution: `class MyQueue {\n    Deque<Integer> inbox = new ArrayDeque<>();\n    Deque<Integer> outbox = new ArrayDeque<>();\n    \n    public void push(int x) { inbox.push(x); }\n    private void transfer() {\n        if (outbox.isEmpty())\n            while (!inbox.isEmpty()) outbox.push(inbox.pop());\n    }\n    public int pop() { transfer(); return outbox.pop(); }\n    public int peek() { transfer(); return outbox.peek(); }\n    public boolean empty() { return inbox.isEmpty() && outbox.isEmpty(); }\n}`, testCases: `push(1),push(2),peek() → 1\npop() → 1\nempty() → false` },
      { id: "qb2", title: "Number of Recent Calls", company: "Google", desc: "Count the number of requests in the last 3000 milliseconds.", starter: `class RecentCounter {\n    public int ping(int t) { }\n}`, solution: `class RecentCounter {\n    Queue<Integer> q = new LinkedList<>();\n    public int ping(int t) {\n        q.offer(t);\n        while (q.peek() < t - 3000) q.poll();\n        return q.size();\n    }\n}`, testCases: `ping(1)→1, ping(100)→2, ping(3001)→3, ping(3002)→3` },
      { id: "qb3", title: "Circular Queue Implementation", company: "Microsoft", desc: "Design a circular queue with fixed capacity. Implement enQueue, deQueue, Front, Rear, isEmpty, isFull.", starter: `class MyCircularQueue {\n    int[] arr; int front, rear, size, cap;\n    public MyCircularQueue(int k) { }\n    public boolean enQueue(int val) { }\n    public boolean deQueue() { }\n}`, solution: `class MyCircularQueue {\n    int[] arr; int front=0,rear=-1,size=0,cap;\n    public MyCircularQueue(int k){arr=new int[k];cap=k;}\n    public boolean enQueue(int val){if(isFull())return false;rear=(rear+1)%cap;arr[rear]=val;size++;return true;}\n    public boolean deQueue(){if(isEmpty())return false;front=(front+1)%cap;size--;return true;}\n    public int Front(){return isEmpty()?-1:arr[front];}\n    public int Rear(){return isEmpty()?-1:arr[rear];}\n    public boolean isEmpty(){return size==0;}\n    public boolean isFull(){return size==cap;}\n}`, testCases: `k=3: enQueue(1)→true, enQueue(4)→false (full)` },
    ],
    "Intermediate": [
      { id: "qi1", title: "Binary Tree Level Order Traversal", company: "Amazon", desc: "Return level-order traversal of a binary tree's node values.", starter: `public List<List<Integer>> levelOrder(TreeNode root) {\n    // BFS with queue\n}`, solution: `public List<List<Integer>> levelOrder(TreeNode root) {\n    List<List<Integer>> result = new ArrayList<>();\n    if (root == null) return result;\n    Queue<TreeNode> q = new LinkedList<>();\n    q.offer(root);\n    while (!q.isEmpty()) {\n        int size = q.size();\n        List<Integer> level = new ArrayList<>();\n        for (int i = 0; i < size; i++) {\n            TreeNode node = q.poll();\n            level.add(node.val);\n            if (node.left != null) q.offer(node.left);\n            if (node.right != null) q.offer(node.right);\n        }\n        result.add(level);\n    }\n    return result;\n}`, testCases: `[3,9,20,null,null,15,7] → [[3],[9,20],[15,7]]` },
      { id: "qi2", title: "Rotting Oranges", company: "Google", desc: "Given a grid with fresh(1) and rotten(2) oranges, find minimum minutes until all oranges rot.", starter: `public int orangesRotting(int[][] grid) {\n    // Multi-source BFS\n}`, solution: `public int orangesRotting(int[][] grid) {\n    int rows=grid.length,cols=grid[0].length,fresh=0,mins=0;\n    Queue<int[]> q=new LinkedList<>();\n    for(int r=0;r<rows;r++) for(int c=0;c<cols;c++){if(grid[r][c]==2)q.offer(new int[]{r,c});if(grid[r][c]==1)fresh++;}\n    int[][] dirs={{0,1},{0,-1},{1,0},{-1,0}};\n    while(!q.isEmpty()&&fresh>0){mins++;int size=q.size();for(int i=0;i<size;i++){int[]curr=q.poll();for(int[]d:dirs){int nr=curr[0]+d[0],nc=curr[1]+d[1];if(nr>=0&&nr<rows&&nc>=0&&nc<cols&&grid[nr][nc]==1){grid[nr][nc]=2;fresh--;q.offer(new int[]{nr,nc});}}}}\n    return fresh==0?mins:-1;\n}`, testCases: `[[2,1,1],[1,1,0],[0,1,1]] → 4\n[[0,2]] → 0` },
      { id: "qi3", title: "Task Scheduler", company: "Amazon", desc: "Given tasks and cooldown n, find the minimum time to execute all tasks.", starter: `public int leastInterval(char[] tasks, int n) { }`, solution: `public int leastInterval(char[] tasks, int n) {\n    int[] freq=new int[26];\n    for(char t:tasks) freq[t-'A']++;\n    PriorityQueue<Integer> pq=new PriorityQueue<>(Collections.reverseOrder());\n    for(int f:freq) if(f>0) pq.offer(f);\n    int time=0;\n    while(!pq.isEmpty()){List<Integer> temp=new ArrayList<>();for(int i=0;i<=n;i++){if(!pq.isEmpty())temp.add(pq.poll());time++;if(pq.isEmpty()&&temp.isEmpty())break;}for(int f:temp)if(f-1>0)pq.offer(f-1);}\n    return time;\n}`, testCases: `tasks=["A","A","A","B","B","B"],n=2 → 8` },
    ],
    "Advanced": [
      { id: "qa1", title: "Sliding Window Maximum", company: "Amazon", desc: "Find the maximum in each sliding window of size k in an array.", starter: `public int[] maxSlidingWindow(int[] nums, int k) { }`, solution: `public int[] maxSlidingWindow(int[] nums, int k) {\n    int n=nums.length;\n    int[] result=new int[n-k+1];\n    Deque<Integer> deque=new ArrayDeque<>();\n    for(int i=0;i<n;i++){while(!deque.isEmpty()&&deque.peekFirst()<i-k+1)deque.pollFirst();while(!deque.isEmpty()&&nums[deque.peekLast()]<nums[i])deque.pollLast();deque.offerLast(i);if(i>=k-1)result[i-k+1]=nums[deque.peekFirst()];}\n    return result;\n}`, testCases: `[1,3,-1,-3,5,3,6,7],k=3 → [3,3,5,5,6,7]` },
      { id: "qa2", title: "Course Schedule II (Topological Sort)", company: "Google", desc: "Given numCourses and prerequisites, return the order to finish all courses.", starter: `public int[] findOrder(int numCourses, int[][] prerequisites) { }`, solution: `public int[] findOrder(int numCourses, int[][] prereqs) {\n    List<List<Integer>> adj=new ArrayList<>();\n    int[] inDegree=new int[numCourses];\n    for(int i=0;i<numCourses;i++) adj.add(new ArrayList<>());\n    for(int[] p:prereqs){adj.get(p[1]).add(p[0]);inDegree[p[0]]++;}\n    Queue<Integer> q=new LinkedList<>();\n    for(int i=0;i<numCourses;i++) if(inDegree[i]==0) q.offer(i);\n    int[] result=new int[numCourses];int idx=0;\n    while(!q.isEmpty()){int node=q.poll();result[idx++]=node;for(int next:adj.get(node))if(--inDegree[next]==0)q.offer(next);}\n    return idx==numCourses?result:new int[]{};\n}`, testCases: `numCourses=2,prerequisites=[[1,0]] → [0,1]` },
      { id: "qa3", title: "Find Median from Data Stream", company: "Meta", desc: "Design a data structure to add numbers and find the median.", starter: `class MedianFinder {\n    public void addNum(int num) { }\n    public double findMedian() { }\n}`, solution: `class MedianFinder {\n    PriorityQueue<Integer> lo=new PriorityQueue<>(Collections.reverseOrder());\n    PriorityQueue<Integer> hi=new PriorityQueue<>();\n    public void addNum(int num){lo.offer(num);hi.offer(lo.poll());if(lo.size()<hi.size())lo.offer(hi.poll());}\n    public double findMedian(){return lo.size()>hi.size()?lo.peek():(lo.peek()+hi.peek())/2.0;}\n}`, testCases: `addNum(1),addNum(2),findMedian()→1.5\naddNum(3),findMedian()→2.0` },
    ],
  },
  "Linear Search": {
    "Beginner": [
      { id: "lb1", title: "Find First Occurrence", company: "TCS", desc: "Given an array and target, return the index of the first occurrence, or -1 if not found.", starter: `public int findFirst(int[] arr, int target) { }`, solution: `public int findFirst(int[] arr, int target) {\n    for (int i = 0; i < arr.length; i++)\n        if (arr[i] == target) return i;\n    return -1;\n}`, testCases: `[4,8,2,9,5], target=9 → 3\n[1,2,3,4,5], target=6 → -1` },
      { id: "lb2", title: "Two Sum", company: "Amazon", desc: "Return indices of two numbers that add up to target. Use HashMap for O(n).", starter: `public int[] twoSum(int[] nums, int target) { }`, solution: `public int[] twoSum(int[] nums, int target) {\n    Map<Integer,Integer> map = new HashMap<>();\n    for (int i=0;i<nums.length;i++) {\n        int comp = target - nums[i];\n        if (map.containsKey(comp)) return new int[]{map.get(comp),i};\n        map.put(nums[i],i);\n    }\n    return new int[]{};\n}`, testCases: `[2,7,11,15],target=9 → [0,1]\n[3,2,4],target=6 → [1,2]` },
      { id: "lb3", title: "Maximum Element", company: "Infosys", desc: "Find the maximum element in an unsorted array using a single linear scan.", starter: `public int findMax(int[] arr) { }`, solution: `public int findMax(int[] arr) {\n    int max = arr[0];\n    for (int i=1;i<arr.length;i++)\n        if (arr[i] > max) max = arr[i];\n    return max;\n}`, testCases: `[3,1,4,1,5,9,2,6] → 9\n[-5,-1,-3] → -1` },
    ],
    "Intermediate": [
      { id: "li1", title: "Maximum Subarray (Kadane's)", company: "Amazon", desc: "Find the contiguous subarray with the largest sum.", starter: `public int maxSubArray(int[] nums) { }`, solution: `public int maxSubArray(int[] nums) {\n    int maxSum = nums[0], currSum = nums[0];\n    for (int i=1;i<nums.length;i++) {\n        currSum = Math.max(nums[i], currSum + nums[i]);\n        maxSum = Math.max(maxSum, currSum);\n    }\n    return maxSum;\n}`, testCases: `[-2,1,-3,4,-1,2,1,-5,4] → 6\n[5,4,-1,7,8] → 23` },
      { id: "li2", title: "Majority Element (Boyer-Moore)", company: "Meta", desc: "Find the element appearing more than n/2 times using O(1) space.", starter: `public int majorityElement(int[] nums) { }`, solution: `public int majorityElement(int[] nums) {\n    int candidate=nums[0], count=1;\n    for (int i=1;i<nums.length;i++) {\n        if (count==0) { candidate=nums[i]; count=1; }\n        else if (nums[i]==candidate) count++;\n        else count--;\n    }\n    return candidate;\n}`, testCases: `[3,2,3] → 3\n[2,2,1,1,1,2,2] → 2` },
      { id: "li3", title: "Best Time to Buy and Sell Stock", company: "Amazon", desc: "Find the maximum profit by buying and selling a stock once.", starter: `public int maxProfit(int[] prices) { }`, solution: `public int maxProfit(int[] prices) {\n    int minPrice = prices[0], maxProfit = 0;\n    for (int price : prices) {\n        minPrice = Math.min(minPrice, price);\n        maxProfit = Math.max(maxProfit, price - minPrice);\n    }\n    return maxProfit;\n}`, testCases: `[7,1,5,3,6,4] → 5\n[7,6,4,3,1] → 0` },
    ],
    "Advanced": [
      { id: "la1", title: "Trapping Rain Water (Two Pointer)", company: "Google", desc: "Calculate total rainwater trapped using the two-pointer linear scan technique.", starter: `public int trap(int[] height) { }`, solution: `public int trap(int[] height) {\n    int left=0,right=height.length-1,leftMax=0,rightMax=0,water=0;\n    while(left<right){if(height[left]<height[right]){if(height[left]>=leftMax)leftMax=height[left];else water+=leftMax-height[left];left++;}else{if(height[right]>=rightMax)rightMax=height[right];else water+=rightMax-height[right];right--;}}\n    return water;\n}`, testCases: `[0,1,0,2,1,0,1,3,2,1,2,1] → 6\n[4,2,0,3,2,5] → 9` },
      { id: "la2", title: "Maximum Product Subarray", company: "Microsoft", desc: "Find the contiguous subarray with the largest product.", starter: `public int maxProduct(int[] nums) { }`, solution: `public int maxProduct(int[] nums) {\n    int maxP=nums[0],minP=nums[0],result=nums[0];\n    for(int i=1;i<nums.length;i++){int tmp=maxP;maxP=Math.max(nums[i],Math.max(maxP*nums[i],minP*nums[i]));minP=Math.min(nums[i],Math.min(tmp*nums[i],minP*nums[i]));result=Math.max(result,maxP);}\n    return result;\n}`, testCases: `[2,3,-2,4] → 6\n[-2,3,-4] → 24` },
      { id: "la3", title: "Dutch National Flag", company: "Google", desc: "Sort array of 0s, 1s, 2s in-place in one pass without extra space.", starter: `public void sortColors(int[] nums) { }`, solution: `public void sortColors(int[] nums) {\n    int lo=0,mid=0,hi=nums.length-1;\n    while(mid<=hi){if(nums[mid]==0){int t=nums[lo];nums[lo++]=nums[mid];nums[mid++]=t;}else if(nums[mid]==1){mid++;}else{int t=nums[hi];nums[hi--]=nums[mid];nums[mid]=t;}}\n}`, testCases: `[2,0,2,1,1,0] → [0,0,1,1,2,2]` },
    ],
  },
  "Bubble Sort": {
    "Beginner": [
      { id: "bb1", title: "Implement Bubble Sort", company: "TCS", desc: "Sort an integer array in ascending order using Bubble Sort with the swapped-flag optimization.", starter: `public void bubbleSort(int[] arr) { }`, solution: `public void bubbleSort(int[] arr) {\n    int n = arr.length;\n    for (int i=0;i<n-1;i++) {\n        boolean swapped = false;\n        for (int j=0;j<n-1-i;j++) {\n            if (arr[j]>arr[j+1]) {\n                int tmp=arr[j]; arr[j]=arr[j+1]; arr[j+1]=tmp;\n                swapped=true;\n            }\n        }\n        if (!swapped) break;\n    }\n}`, testCases: `[5,3,8,4,2] → [2,3,4,5,8]\n[1,2,3,4,5] → [1,2,3,4,5] (early exit)` },
      { id: "bb2", title: "Sort Strings Alphabetically", company: "Wipro", desc: "Sort an array of strings alphabetically using Bubble Sort.", starter: `public void sortStrings(String[] arr) { }`, solution: `public void sortStrings(String[] arr) {\n    int n = arr.length;\n    for (int i=0;i<n-1;i++)\n        for (int j=0;j<n-1-i;j++)\n            if (arr[j].compareTo(arr[j+1])>0) {\n                String tmp=arr[j]; arr[j]=arr[j+1]; arr[j+1]=tmp;\n            }\n}`, testCases: `["banana","apple","cherry"] → ["apple","banana","cherry"]` },
      { id: "bb3", title: "Check if Array is Sorted", company: "Accenture", desc: "Return true if array is sorted in ascending order.", starter: `public boolean isSorted(int[] arr) { }`, solution: `public boolean isSorted(int[] arr) {\n    for (int i=0;i<arr.length-1;i++)\n        if (arr[i]>arr[i+1]) return false;\n    return true;\n}`, testCases: `[1,2,3,4,5] → true\n[1,3,2,4,5] → false` },
    ],
    "Intermediate": [
      { id: "bi1", title: "Count Inversions", company: "Amazon", desc: "Count the number of inversions in an array. Use merge sort for O(n log n).", starter: `public long countInversions(int[] arr) { }`, solution: `public long countInversions(int[] arr){return mergeCount(arr,0,arr.length-1);}\nprivate long mergeCount(int[]arr,int l,int r){if(l>=r)return 0;int mid=(l+r)/2;long inv=mergeCount(arr,l,mid)+mergeCount(arr,mid+1,r);return inv+merge(arr,l,mid,r);}\nprivate long merge(int[]arr,int l,int mid,int r){int[]tmp=new int[r-l+1];int i=l,j=mid+1,k=0;long inv=0;while(i<=mid&&j<=r){if(arr[i]<=arr[j])tmp[k++]=arr[i++];else{inv+=(mid-i+1);tmp[k++]=arr[j++];}}while(i<=mid)tmp[k++]=arr[i++];while(j<=r)tmp[k++]=arr[j++];System.arraycopy(tmp,0,arr,l,tmp.length);return inv;}`, testCases: `[2,4,1,3,5] → 3\n[2,3,4,5,6,1] → 5` },
      { id: "bi2", title: "Merge Sort Implementation", company: "Google", desc: "Implement Merge Sort. Understand why it's O(n log n) while Bubble Sort is O(n²).", starter: `public void mergeSort(int[] arr, int left, int right) { }`, solution: `public void mergeSort(int[]arr,int left,int right){if(left>=right)return;int mid=(left+right)/2;mergeSort(arr,left,mid);mergeSort(arr,mid+1,right);merge(arr,left,mid,right);}\nprivate void merge(int[]arr,int l,int mid,int r){int[]tmp=new int[r-l+1];int i=l,j=mid+1,k=0;while(i<=mid&&j<=r)tmp[k++]=arr[i]<=arr[j]?arr[i++]:arr[j++];while(i<=mid)tmp[k++]=arr[i++];while(j<=r)tmp[k++]=arr[j++];System.arraycopy(tmp,0,arr,l,tmp.length);}`, testCases: `[5,3,8,4,2] → [2,3,4,5,8]` },
      { id: "bi3", title: "Sort Array of 0s, 1s, 2s", company: "Microsoft", desc: "Sort array containing only 0s, 1s, and 2s in O(n) without extra space.", starter: `public void sortColors(int[] nums) { }`, solution: `public void sortColors(int[]nums){int lo=0,mid=0,hi=nums.length-1;while(mid<=hi){if(nums[mid]==0){int t=nums[lo];nums[lo++]=nums[mid];nums[mid++]=t;}else if(nums[mid]==1)mid++;else{int t=nums[hi];nums[hi--]=nums[mid];nums[mid]=t;}}}`, testCases: `[2,0,2,1,1,0] → [0,0,1,1,2,2]` },
    ],
    "Advanced": [
      { id: "ba1", title: "Sort K-Sorted Array", company: "Amazon", desc: "Sort an array where each element is at most k positions from its sorted position using a Min-Heap.", starter: `public int[] sortKSortedArray(int[] arr, int k) { }`, solution: `public int[] sortKSortedArray(int[]arr,int k){PriorityQueue<Integer> pq=new PriorityQueue<>();int[]result=new int[arr.length];int ri=0;for(int i=0;i<arr.length;i++){pq.offer(arr[i]);if(pq.size()>k)result[ri++]=pq.poll();}while(!pq.isEmpty())result[ri++]=pq.poll();return result;}`, testCases: `[6,5,3,2,8,10,9], k=3 → [2,3,5,6,8,9,10]` },
      { id: "ba2", title: "Quick Sort Implementation", company: "Google", desc: "Implement Quick Sort with Lomuto partition scheme.", starter: `public void quickSort(int[] arr, int low, int high) { }`, solution: `public void quickSort(int[]arr,int low,int high){if(low<high){int pi=partition(arr,low,high);quickSort(arr,low,pi-1);quickSort(arr,pi+1,high);}}\nprivate int partition(int[]arr,int low,int high){int pivot=arr[high],i=low-1;for(int j=low;j<high;j++)if(arr[j]<=pivot){i++;int tmp=arr[i];arr[i]=arr[j];arr[j]=tmp;}int tmp=arr[i+1];arr[i+1]=arr[high];arr[high]=tmp;return i+1;}`, testCases: `[5,3,8,4,2] → [2,3,4,5,8]` },
      { id: "ba3", title: "Find Kth Largest Element", company: "Meta", desc: "Find the kth largest element using QuickSelect for O(n) average time.", starter: `public int findKthLargest(int[] nums, int k) { }`, solution: `public int findKthLargest(int[]nums,int k){return quickSelect(nums,0,nums.length-1,nums.length-k);}\nprivate int quickSelect(int[]arr,int lo,int hi,int target){int pivot=arr[hi],i=lo-1;for(int j=lo;j<hi;j++)if(arr[j]<=pivot){i++;int t=arr[i];arr[i]=arr[j];arr[j]=t;}i++;int t=arr[i];arr[i]=arr[hi];arr[hi]=t;if(i==target)return arr[i];return i<target?quickSelect(arr,i+1,hi,target):quickSelect(arr,lo,i-1,target);}`, testCases: `[3,2,1,5,6,4],k=2 → 5` },
    ],
  },
  "Arrays": {
    "Beginner": [
      { id: "ar1", title: "Find Maximum Element", company: "TCS", desc: "Scan the array and return the largest value.", starter: `public int findMax(int[] arr) { }`, solution: `public int findMax(int[] arr) {\n    int max = arr[0];\n    for(int i=1; i<arr.length; i++) if(arr[i] > max) max = arr[i];\n    return max;\n}`, testCases: `[1, 5, 3, 9, 2] → 9` },
      { id: "ar2", title: "Reverse an Array", company: "Infosys", desc: "Reverse the elements in-place.", starter: `public void reverse(int[] arr) { }`, solution: `public void reverse(int[] arr) {\n    int i=0, j=arr.length-1;\n    while(i < j) {\n        int temp = arr[i]; arr[i] = arr[j]; arr[j] = temp;\n        i++; j--;\n    }\n}`, testCases: `[1, 2, 3, 4] → [4, 3, 2, 1]` },
    ],
    "Intermediate": [
      { id: "ari1", title: "Find Missing Number", company: "Amazon", desc: "Given an array of size n containing numbers from 1 to n+1 with one missing, find it.", starter: `public int findMissing(int[] arr, int n) { }`, solution: `public int findMissing(int[] arr, int n) {\n    int total = (n + 1) * (n + 2) / 2;\n    for(int x : arr) total -= x;\n    return total;\n}`, testCases: `[1, 2, 4, 5], n=4 → 3` },
      { id: "ari2", title: "Rotate Array", company: "Microsoft", desc: "Rotate array k steps to the right.", starter: `public void rotate(int[] arr, int k) { }`, solution: `public void rotate(int[] arr, int k) {\n    k %= arr.length;\n    reverse(arr, 0, arr.length - 1);\n    reverse(arr, 0, k - 1);\n    reverse(arr, k, arr.length - 1);\n}\nprivate void reverse(int[] a, int i, int j) {\n    while(i < j) {\n        int t = a[i]; a[i++] = a[j]; a[j--] = t;\n    }\n}`, testCases: `[1,2,3,4,5], k=2 → [4,5,1,2,3]` },
    ],
    "Advanced": [
      { id: "ara1", title: "Spiral Matrix", company: "Google", desc: "Print a 2D matrix in spiral order.", starter: `public List<Integer> spiralOrder(int[][] matrix) { }`, solution: `public List<Integer> spiralOrder(int[][] matrix) {\n    List<Integer> res = new ArrayList<>();\n    int r1=0, r2=matrix.length-1, c1=0, c2=matrix[0].length-1;\n    while(r1 <= r2 && c1 <= c2) {\n        for(int c=c1; c<=c2; c++) res.add(matrix[r1][c]);\n        for(int r=r1+1; r<=r2; r++) res.add(matrix[r][c2]);\n        if(r1 < r2 && c1 < c2) {\n            for(int c=c2-1; c>c1; c--) res.add(matrix[r2][c]);\n            for(int r=r2; r>r1; r--) res.add(matrix[r][c1]);\n        }\n        r1++; r2--; c1++; c2--;\n    }\n    return res;\n}`, testCases: `[[1,2,3],[4,5,6],[7,8,9]] → [1,2,3,6,9,8,7,4,5]` }
    ]
  },
  "Strings": {
    "Beginner": [
      { id: "st1", title: "Reverse a String", company: "TCS", desc: "Reverse the given string.", starter: `public String reverse(String s) { }`, solution: `public String reverse(String s) {\n    return new StringBuilder(s).reverse().toString();\n}`, testCases: `"hello" → "olleh"` },
      { id: "st2", title: "Palindrome Check", company: "Wipro", desc: "Check if string is palindrome.", starter: `public boolean isPalindrome(String s) { }`, solution: `public boolean isPalindrome(String s) {\n    int i=0, j=s.length()-1;\n    while(i < j) if(s.charAt(i++) != s.charAt(j--)) return false;\n    return true;\n}`, testCases: `"racecar" → true` },
    ],
    "Intermediate": [
      { id: "sti1", title: "Longest Substring Without Repeating Characters", company: "Amazon", desc: "Find the length of the longest substring with all unique characters.", starter: `public int lengthOfLongestSubstring(String s) { }`, solution: `public int lengthOfLongestSubstring(String s) {\n    int[] map = new int[128];\n    int start=0, end=0, res=0;\n    while(end < s.length()) {\n        char c = s.charAt(end);\n        start = Math.max(start, map[c]);\n        res = Math.max(res, end - start + 1);\n        map[c] = end + 1;\n        end++;\n    }\n    return res;\n}`, testCases: `"abcabcbb" → 3` },
    ],
    "Advanced": [
      { id: "sta1", title: "Edit Distance", company: "Microsoft", desc: "Find minimum operations to convert str1 to str2.", starter: `public int minDistance(String s1, String s2) { }`, solution: `// DP solution here`, testCases: `"horse", "ros" → 3` }
    ]
  },
  "Linked Lists": {
    "Beginner": [
      { id: "ll1", title: "Insert at Head", company: "Infosys", desc: "Insert a new node at the beginning of the list.", starter: `public ListNode insertAtHead(ListNode head, int val) { }`, solution: `public ListNode insertAtHead(ListNode head, int val) {\n    ListNode newNode = new ListNode(val);\n    newNode.next = head;\n    return newNode;\n}`, testCases: `[1,2], val=0 → [0,1,2]` },
    ],
    "Intermediate": [
      { id: "lli1", title: "Middle of the Linked List", company: "Google", desc: "Return the middle node of the list.", starter: `public ListNode middleNode(ListNode head) { }`, solution: `public ListNode middleNode(ListNode head) {\n    ListNode slow = head, fast = head;\n    while(fast != null && fast.next != null) {\n        slow = slow.next; fast = fast.next.next;\n    }\n    return slow;\n}`, testCases: `[1,2,3,4,5] → 3` },
    ],
    "Advanced": [
      { id: "lla1", title: "Merge K Sorted Lists", company: "Meta", desc: "Merge k sorted linked lists using a PriorityQueue.", starter: `public ListNode mergeKLists(ListNode[] lists) { }`, solution: `// K-merge logic here`, testCases: `[[1,4,5],[1,3,4],[2,6]] → [1,1,2,3,4,4,5,6]` }
    ]
  },
  "Recursion": {
    "Beginner": [
      { id: "re1", title: "Factorial", company: "TCS", desc: "Find factorial of n recursively.", starter: `public int fact(int n) { }`, solution: `public int fact(int n) {\n    if(n <= 1) return 1;\n    return n * fact(n-1);\n}`, testCases: `5 → 120` },
      { id: "re2", title: "Fibonacci Number", company: "Wipro", desc: "Find nth Fibonacci number.", starter: `public int fib(int n) { }`, solution: `public int fib(int n) {\n    if(n <= 1) return n;\n    return fib(n-1) + fib(n-2);\n}`, testCases: `6 → 8` },
    ],
    "Intermediate": [],
    "Advanced": []
  },
  "Backtracking": {
    "Beginner": [],
    "Intermediate": [
      { id: "bt1", title: "N-Queens Problem", company: "Amazon", desc: "Find one valid placement of N queens on an NxN board.", starter: `// N-Queens logic here`, solution: `// Logic here`, testCases: `4 → [[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]]` },
    ],
    "Advanced": []
  },
  "Trees": {
    "Beginner": [
      { id: "tr1", title: "Max Depth of Tree", company: "Google", desc: "Find the maximum depth of a binary tree.", starter: `public int maxDepth(TreeNode root) { }`, solution: `public int maxDepth(TreeNode root) {\n    if(root == null) return 0;\n    return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n}`, testCases: `[3,9,20,null,null,15,7] → 3` },
    ],
    "Intermediate": [],
    "Advanced": []
  },
  "Binary Search Trees": {
    "Beginner": [
      { id: "bst1", title: "Search in BST", company: "Infosys", desc: "Check if a value exists in a BST.", starter: `public boolean search(TreeNode root, int val) { }`, solution: `public boolean search(TreeNode root, int val) {\n    if(root == null) return false;\n    if(root.val == val) return true;\n    return val < root.val ? search(root.left, val) : search(root.right, val);\n}`, testCases: `tree:[4,2,7,1,3], val=2 → true` },
    ],
    "Intermediate": [],
    "Advanced": []
  },
  "Heap / Priority Queue": {
    "Beginner": [
      { id: "hp1", title: "Kth Largest in Stream", company: "Amazon", desc: "Design a class to find the kth largest element in a stream.", starter: `// Class definition here`, solution: `// PriorityQueue(k) logic`, testCases: `add: 4, 5, 8, 2 -> 4th largest: 2` },
    ],
    "Intermediate": [],
    "Advanced": []
  },
  "Hashing": {
    "Beginner": [
      { id: "hs1", title: "Two Sum", company: "Google", desc: "Find two numbers that add up up to a target using Hashing.", starter: `public int[] twoSum(int[] nums, int target) { }`, solution: `public int[] twoSum(int[] nums, int target) {\n    Map<Integer, Integer> map = new HashMap<>();\n    for(int i=0; i<nums.length; i++) {\n        int comp = target - nums[i];\n        if(map.containsKey(comp)) return new int[]{map.get(comp), i};\n        map.put(nums[i], i);\n    }\n    return new int[0];\n}`, testCases: `[2,7,11,15], target=9 → [0,1]` },
    ],
    "Intermediate": [],
    "Advanced": []
  },
  "Graphs": {
    "Beginner": [
      { id: "gr1", title: "BFS Implementation", company: "Amazon", desc: "Traverse a graph using Breadth First Search.", starter: `public void bfs(int start, List<List<Integer>> adj) { }`, solution: `// BFS queue logic`, testCases: `0 -> [[1,2],[0,2,3],[0,1],[1]] -> [0,1,2,3]` },
    ],
    "Intermediate": [],
    "Advanced": []
  },
  "Greedy Algorithms": {
    "Beginner": [
      { id: "ga1", title: "Fractional Knapsack", company: "Infosys", desc: "Maximize value in fractional knapsack.", starter: `public double getMaxValue(Item[] items, int cap) { }`, solution: `// Greedy by density logic`, testCases: `val:[60,100,120], wt:[10,20,30], cap:50 → 240.0` },
    ],
    "Intermediate": [],
    "Advanced": []
  },
  "Dynamic Programming": {
    "Beginner": [
      { id: "dp1", title: "Coin Change", company: "Google", desc: "Find min coins to make a sum.", starter: `public int coinChange(int[] coins, int amount) { }`, solution: `// DP coins logic`, testCases: `coins:[1,2,5], amt:11 → 3` },
    ],
    "Intermediate": [],
    "Advanced": []
  },
  "Bit Manipulation": {
    "Beginner": [
      { id: "bm1", title: "Count Set Bits", company: "Infosys", desc: "Count the number of 1s in a binary representation.", starter: `public int countSetBits(int n) { }`, solution: `// Bit counting logic`, testCases: `7 → 3` },
    ],
    "Intermediate": [],
    "Advanced": []
  },
  "Tries": {
    "Beginner": [
      { id: "ti1", title: "Insert and Search Trie", company: "Amazon", desc: "Implement insert, search, and startsWith in a Trie.", starter: `// Trie class here`, solution: `// Trie logic`, testCases: `insert 'apple', search 'apple' → true` },
    ],
    "Intermediate": [],
    "Advanced": []
  },
  "Segment Trees": {
    "Beginner": [],
    "Intermediate": [],
    "Advanced": [
      { id: "st1", title: "Range Sum Query", company: "Google", desc: "Implement a segment tree for range sum queries and point updates.", starter: `// Segment Tree logic`, solution: `// Tree logic`, testCases: `range(1,3) → sum` },
    ]
  },
  "Disjoint Set (Union Find)": {
    "Beginner": [],
    "Intermediate": [
      { id: "uf1", title: "Number of Connected Components", company: "Meta", desc: "Find the number of connected components in an undirected graph.", starter: `public int countComponents(int n, int[][] edges) { }`, solution: `// DSU logic`, testCases: `5, [[0,1],[1,2],[3,4]] → 2` },
    ],
    "Advanced": []
  },
  "Advanced Graph Algorithms": {
    "Beginner": [],
    "Intermediate": [],
    "Advanced": [
      { id: "ag1", title: "Dijkstra Implementation", company: "Google", desc: "Find shortest path from source to all nodes.", starter: `public int[] dijkstra(int n, int[][] edges, int start) { }`, solution: `// Dijkstra logic`, testCases: `n=3, [[0,1,1],[1,2,1],[0,2,3]], start=0 → [0,1,2]` },
    ]
  },
  "Binary Search": {
    "Beginner": [
      { id: "bsb1", title: "Classic Binary Search", company: "Google", desc: "Given a sorted array and target, return the index. Return -1 if not found.", starter: `public int search(int[] nums, int target) {\n    // Binary search\n}`, solution: `public int search(int[] nums, int target) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] == target) return mid;\n        else if (nums[mid] < target) lo = mid + 1;\n        else hi = mid - 1;\n    }\n    return -1;\n}`, testCases: `[-1,0,3,5,9,12], target=9 → 4\n[-1,0,3,5,9,12], target=2 → -1` },
      { id: "bsb2", title: "Square Root (Integer)", company: "Amazon", desc: "Return the floor of the square root of n using binary search.", starter: `public int mySqrt(int x) { }`, solution: `public int mySqrt(int x) {\n    if (x < 2) return x;\n    long lo = 1, hi = x / 2, ans = 1;\n    while (lo <= hi) {\n        long mid = lo + (hi - lo) / 2;\n        if (mid * mid <= x) { ans = mid; lo = mid + 1; }\n        else hi = mid - 1;\n    }\n    return (int) ans;\n}`, testCases: `4 → 2\n8 → 2\n9 → 3` },
      { id: "bsb3", title: "First Bad Version", company: "Meta", desc: "Find the first bad version among 1..n using minimum API calls.", starter: `public int firstBadVersion(int n) { }`, solution: `public int firstBadVersion(int n) {\n    int lo = 1, hi = n;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (isBadVersion(mid)) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`, testCases: `n=5, bad=4 → 4\nn=1, bad=1 → 1` },
    ],
    "Intermediate": [
      { id: "bsi1", title: "Search in Rotated Sorted Array", company: "Google", desc: "Search target in a rotated sorted array (no duplicates).", starter: `public int search(int[] nums, int target) { }`, solution: `public int search(int[] nums, int target) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo <= hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[lo] <= nums[mid]) {\n            if (nums[lo] <= target && target < nums[mid]) hi = mid - 1;\n            else lo = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[hi]) lo = mid + 1;\n            else hi = mid - 1;\n        }\n    }\n    return -1;\n}`, testCases: `[4,5,6,7,0,1,2], target=0 → 4\n[4,5,6,7,0,1,2], target=3 → -1` },
      { id: "bsi2", title: "Find Peak Element", company: "Amazon", desc: "Find a peak element index where arr[i] > arr[i-1] and arr[i] > arr[i+1].", starter: `public int findPeakElement(int[] nums) { }`, solution: `public int findPeakElement(int[] nums) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] > nums[mid + 1]) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`, testCases: `[1,2,3,1] → 2\n[1,2,1,3,5,6,4] → 1 or 5` },
      { id: "bsi3", title: "Koko Eating Bananas", company: "Amazon", desc: "Find the minimum eating speed k to finish all piles in h hours.", starter: `public int minEatingSpeed(int[] piles, int h) { }`, solution: `public int minEatingSpeed(int[] piles, int h) {\n    int lo = 1, hi = 0;\n    for (int p : piles) hi = Math.max(hi, p);\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        long hours = 0;\n        for (int p : piles) hours += (p + mid - 1) / mid;\n        if (hours <= h) hi = mid;\n        else lo = mid + 1;\n    }\n    return lo;\n}`, testCases: `piles=[3,6,7,11], h=8 → 4\npiles=[30,11,23,4,20], h=5 → 30` },
    ],
    "Advanced": [
      { id: "bsa1", title: "Median of Two Sorted Arrays", company: "Google", desc: "Find median of two sorted arrays in O(log(m+n)) time.", starter: `public double findMedianSortedArrays(int[] nums1, int[] nums2) { }`, solution: `public double findMedianSortedArrays(int[] A, int[] B) {\n    if (A.length > B.length) return findMedianSortedArrays(B, A);\n    int m = A.length, n = B.length, lo = 0, hi = m;\n    while (lo <= hi) {\n        int i = (lo + hi) / 2, j = (m + n + 1) / 2 - i;\n        int aLeft = (i == 0) ? Integer.MIN_VALUE : A[i-1];\n        int aRight = (i == m) ? Integer.MAX_VALUE : A[i];\n        int bLeft = (j == 0) ? Integer.MIN_VALUE : B[j-1];\n        int bRight = (j == n) ? Integer.MAX_VALUE : B[j];\n        if (aLeft <= bRight && bLeft <= aRight) {\n            int maxLeft = Math.max(aLeft, bLeft);\n            if ((m + n) % 2 == 1) return maxLeft;\n            return (maxLeft + Math.min(aRight, bRight)) / 2.0;\n        } else if (aLeft > bRight) hi = i - 1;\n        else lo = i + 1;\n    }\n    return 0;\n}`, testCases: `[1,3],[2] → 2.0\n[1,2],[3,4] → 2.5` },
      { id: "bsa2", title: "Minimum in Rotated Sorted Array", company: "Microsoft", desc: "Find the minimum element in a rotated sorted array.", starter: `public int findMin(int[] nums) { }`, solution: `public int findMin(int[] nums) {\n    int lo = 0, hi = nums.length - 1;\n    while (lo < hi) {\n        int mid = lo + (hi - lo) / 2;\n        if (nums[mid] > nums[hi]) lo = mid + 1;\n        else hi = mid;\n    }\n    return nums[lo];\n}`, testCases: `[3,4,5,1,2] → 1\n[4,5,6,7,0,1,2] → 0` },
    ],
  },
  "Selection Sort": {
    "Beginner": [
      { id: "ssb1", title: "Implement Selection Sort", company: "TCS", desc: "Sort an array using Selection Sort — find minimum in unsorted portion and swap to correct position.", starter: `public void selectionSort(int[] arr) { }`, solution: `public void selectionSort(int[] arr) {\n    int n = arr.length;\n    for (int i = 0; i < n - 1; i++) {\n        int minIdx = i;\n        for (int j = i + 1; j < n; j++)\n            if (arr[j] < arr[minIdx]) minIdx = j;\n        int tmp = arr[minIdx]; arr[minIdx] = arr[i]; arr[i] = tmp;\n    }\n}`, testCases: `[64,25,12,22,11] → [11,12,22,25,64]` },
      { id: "ssb2", title: "Find Second Minimum", company: "Wipro", desc: "Find the second minimum element in an unsorted array in one pass.", starter: `public int secondMin(int[] arr) { }`, solution: `public int secondMin(int[] arr) {\n    int min1 = Integer.MAX_VALUE, min2 = Integer.MAX_VALUE;\n    for (int x : arr) {\n        if (x < min1) { min2 = min1; min1 = x; }\n        else if (x < min2 && x != min1) min2 = x;\n    }\n    return min2;\n}`, testCases: `[12, 13, 1, 10, 34, 1] → 10` },
    ],
    "Intermediate": [
      { id: "ssi1", title: "Sort by Absolute Difference", company: "Amazon", desc: "Sort array based on absolute difference from a given value.", starter: `public void sortByDiff(int[] arr, int x) { }`, solution: `public void sortByDiff(int[] arr, int x) {\n    int n = arr.length;\n    for (int i = 0; i < n - 1; i++) {\n        int minIdx = i;\n        for (int j = i+1; j < n; j++)\n            if (Math.abs(arr[j]-x) < Math.abs(arr[minIdx]-x)) minIdx = j;\n        int tmp = arr[minIdx]; arr[minIdx] = arr[i]; arr[i] = tmp;\n    }\n}`, testCases: `arr=[10,5,3,9,2], x=7 → [5,9,10,3,2]` },
    ],
    "Advanced": [
      { id: "ssa1", title: "Heap Sort", company: "Google", desc: "Implement Heap Sort using a max-heap (Selection Sort + Heap optimization).", starter: `public void heapSort(int[] arr) { }`, solution: `public void heapSort(int[] arr) {\n    int n = arr.length;\n    for (int i = n / 2 - 1; i >= 0; i--) heapify(arr, n, i);\n    for (int i = n - 1; i > 0; i--) {\n        int tmp = arr[0]; arr[0] = arr[i]; arr[i] = tmp;\n        heapify(arr, i, 0);\n    }\n}\nvoid heapify(int[] arr, int n, int root) {\n    int largest = root, l = 2*root+1, r = 2*root+2;\n    if (l < n && arr[l] > arr[largest]) largest = l;\n    if (r < n && arr[r] > arr[largest]) largest = r;\n    if (largest != root) { int t=arr[root]; arr[root]=arr[largest]; arr[largest]=t; heapify(arr,n,largest); }\n}`, testCases: `[12,11,13,5,6,7] → [5,6,7,11,12,13]` },
    ],
  },
  "Insertion Sort": {
    "Beginner": [
      { id: "isb1", title: "Implement Insertion Sort", company: "TCS", desc: "Sort an array by inserting each element into its correct position in the sorted portion.", starter: `public void insertionSort(int[] arr) { }`, solution: `public void insertionSort(int[] arr) {\n    for (int i = 1; i < arr.length; i++) {\n        int key = arr[i], j = i - 1;\n        while (j >= 0 && arr[j] > key) {\n            arr[j + 1] = arr[j]; j--;\n        }\n        arr[j + 1] = key;\n    }\n}`, testCases: `[12,11,13,5,6] → [5,6,11,12,13]\n[1,2,3,4,5] → [1,2,3,4,5] (O(n))` },
      { id: "isb2", title: "Sort Strings by Length", company: "Wipro", desc: "Sort an array of strings by length using Insertion Sort.", starter: `public void sortByLength(String[] arr) { }`, solution: `public void sortByLength(String[] arr) {\n    for (int i = 1; i < arr.length; i++) {\n        String key = arr[i]; int j = i - 1;\n        while (j >= 0 && arr[j].length() > key.length()) {\n            arr[j + 1] = arr[j]; j--;\n        }\n        arr[j + 1] = key;\n    }\n}`, testCases: `["banana","pi","kiwi","a"] → ["a","pi","kiwi","banana"]` },
    ],
    "Intermediate": [
      { id: "isi1", title: "Sort Nearly Sorted Array", company: "Amazon", desc: "Sort a k-sorted array (each element at most k positions from correct) efficiently.", starter: `public int[] sortKSorted(int[] arr, int k) { }`, solution: `public int[] sortKSorted(int[] arr, int k) {\n    PriorityQueue<Integer> pq = new PriorityQueue<>();\n    int[] res = new int[arr.length]; int ri = 0;\n    for (int i = 0; i < arr.length; i++) {\n        pq.offer(arr[i]);\n        if (pq.size() > k) res[ri++] = pq.poll();\n    }\n    while (!pq.isEmpty()) res[ri++] = pq.poll();\n    return res;\n}`, testCases: `[3,2,1,5,4,7,6,5], k=2 → [1,2,3,4,5,5,6,7]` },
    ],
    "Advanced": [
      { id: "isa1", title: "Shell Sort", company: "Google", desc: "Implement Shell Sort — an optimized variant of Insertion Sort using gap sequences.", starter: `public void shellSort(int[] arr) { }`, solution: `public void shellSort(int[] arr) {\n    int n = arr.length;\n    for (int gap = n / 2; gap > 0; gap /= 2) {\n        for (int i = gap; i < n; i++) {\n            int temp = arr[i], j = i;\n            while (j >= gap && arr[j - gap] > temp) {\n                arr[j] = arr[j - gap]; j -= gap;\n            }\n            arr[j] = temp;\n        }\n    }\n}`, testCases: `[12,34,54,2,3] → [2,3,12,34,54]` },
    ],
  },
  "Merge Sort": {
    "Beginner": [
      { id: "msb1", title: "Implement Merge Sort", company: "Google", desc: "Implement Merge Sort using divide-and-conquer. Understand why it's O(n log n).", starter: `public void mergeSort(int[] arr, int left, int right) { }`, solution: `public void mergeSort(int[] arr, int left, int right) {\n    if (left >= right) return;\n    int mid = (left + right) / 2;\n    mergeSort(arr, left, mid);\n    mergeSort(arr, mid + 1, right);\n    merge(arr, left, mid, right);\n}\nvoid merge(int[] arr, int l, int mid, int r) {\n    int[] tmp = new int[r - l + 1];\n    int i = l, j = mid + 1, k = 0;\n    while (i <= mid && j <= r) tmp[k++] = arr[i] <= arr[j] ? arr[i++] : arr[j++];\n    while (i <= mid) tmp[k++] = arr[i++];\n    while (j <= r) tmp[k++] = arr[j++];\n    System.arraycopy(tmp, 0, arr, l, tmp.length);\n}`, testCases: `[5,3,8,4,2] → [2,3,4,5,8]` },
      { id: "msb2", title: "Merge Two Sorted Arrays", company: "Amazon", desc: "Merge two sorted arrays into one sorted array.", starter: `public int[] mergeSorted(int[] a, int[] b) { }`, solution: `public int[] mergeSorted(int[] a, int[] b) {\n    int[] res = new int[a.length + b.length];\n    int i = 0, j = 0, k = 0;\n    while (i < a.length && j < b.length) res[k++] = a[i] <= b[j] ? a[i++] : b[j++];\n    while (i < a.length) res[k++] = a[i++];\n    while (j < b.length) res[k++] = b[j++];\n    return res;\n}`, testCases: `[1,3,5],[2,4,6] → [1,2,3,4,5,6]` },
    ],
    "Intermediate": [
      { id: "msi1", title: "Count Inversions", company: "Amazon", desc: "Count inversions using modified Merge Sort in O(n log n).", starter: `public long countInversions(int[] arr) { }`, solution: `public long countInversions(int[] arr){return mc(arr,0,arr.length-1);}\nlong mc(int[]a,int l,int r){if(l>=r)return 0;int m=(l+r)/2;return mc(a,l,m)+mc(a,m+1,r)+merge(a,l,m,r);}\nlong merge(int[]a,int l,int m,int r){int[]t=new int[r-l+1];int i=l,j=m+1,k=0;long inv=0;\nwhile(i<=m&&j<=r){if(a[i]<=a[j])t[k++]=a[i++];else{inv+=(m-i+1);t[k++]=a[j++];}}\nwhile(i<=m)t[k++]=a[i++];while(j<=r)t[k++]=a[j++];System.arraycopy(t,0,a,l,t.length);return inv;}`, testCases: `[2,4,1,3,5] → 3\n[2,3,4,5,6,1] → 5` },
      { id: "msi2", title: "Sort Linked List", company: "Microsoft", desc: "Sort a linked list using Merge Sort.", starter: `public ListNode sortList(ListNode head) { }`, solution: `public ListNode sortList(ListNode head) {\n    if (head == null || head.next == null) return head;\n    ListNode slow = head, fast = head.next;\n    while (fast != null && fast.next != null) { slow=slow.next; fast=fast.next.next; }\n    ListNode mid = slow.next; slow.next = null;\n    ListNode l=sortList(head), r=sortList(mid), dummy=new ListNode(0), cur=dummy;\n    while(l!=null&&r!=null){if(l.val<=r.val){cur.next=l;l=l.next;}else{cur.next=r;r=r.next;}cur=cur.next;}\n    cur.next=(l!=null)?l:r; return dummy.next;\n}`, testCases: `[4,2,1,3] → [1,2,3,4]\n[-1,5,3,4,0] → [-1,0,3,4,5]` },
    ],
    "Advanced": [
      { id: "msa1", title: "K-th Smallest in Sorted Matrix", company: "Google", desc: "Find the kth smallest element in an n×n matrix where each row and column is sorted.", starter: `public int kthSmallest(int[][] matrix, int k) { }`, solution: `public int kthSmallest(int[][] matrix, int k) {\n    int n=matrix.length, lo=matrix[0][0], hi=matrix[n-1][n-1];\n    while(lo<hi){\n        int mid=lo+(hi-lo)/2, count=0, j=n-1;\n        for(int i=0;i<n;i++){while(j>=0&&matrix[i][j]>mid)j--;count+=j+1;}\n        if(count>=k)hi=mid; else lo=mid+1;\n    }\n    return lo;\n}`, testCases: `[[1,5,9],[10,11,13],[12,13,15]], k=8 → 13` },
    ],
  },
  "Quick Sort": {
    "Beginner": [
      { id: "qsb1", title: "Implement Quick Sort", company: "Google", desc: "Implement Quick Sort with Lomuto partition scheme.", starter: `public void quickSort(int[] arr, int low, int high) { }`, solution: `public void quickSort(int[] arr, int low, int high) {\n    if (low < high) {\n        int pi = partition(arr, low, high);\n        quickSort(arr, low, pi - 1);\n        quickSort(arr, pi + 1, high);\n    }\n}\nint partition(int[] arr, int low, int high) {\n    int pivot=arr[high], i=low-1;\n    for(int j=low;j<high;j++) if(arr[j]<=pivot){i++;int t=arr[i];arr[i]=arr[j];arr[j]=t;}\n    int t=arr[i+1];arr[i+1]=arr[high];arr[high]=t; return i+1;\n}`, testCases: `[5,3,8,4,2] → [2,3,4,5,8]` },
      { id: "qsb2", title: "Sort Colors (Dutch National Flag)", company: "Google", desc: "Sort array of 0s, 1s, and 2s in-place using one pass.", starter: `public void sortColors(int[] nums) { }`, solution: `public void sortColors(int[] nums) {\n    int lo=0,mid=0,hi=nums.length-1;\n    while(mid<=hi){\n        if(nums[mid]==0){int t=nums[lo];nums[lo++]=nums[mid];nums[mid++]=t;}\n        else if(nums[mid]==1)mid++;\n        else{int t=nums[hi];nums[hi--]=nums[mid];nums[mid]=t;}\n    }\n}`, testCases: `[2,0,2,1,1,0] → [0,0,1,1,2,2]` },
    ],
    "Intermediate": [
      { id: "qsi1", title: "Kth Largest Element", company: "Meta", desc: "Find the kth largest element using QuickSelect for O(n) average time.", starter: `public int findKthLargest(int[] nums, int k) { }`, solution: `public int findKthLargest(int[] nums, int k){return qs(nums,0,nums.length-1,nums.length-k);}\nint qs(int[] a,int lo,int hi,int t){int p=a[hi],i=lo-1;for(int j=lo;j<hi;j++)if(a[j]<=p){i++;int x=a[i];a[i]=a[j];a[j]=x;}i++;int x=a[i];a[i]=a[hi];a[hi]=x;if(i==t)return a[i];return i<t?qs(a,i+1,hi,t):qs(a,lo,i-1,t);}`, testCases: `[3,2,1,5,6,4], k=2 → 5\n[3,2,3,1,2,4,5,5,6], k=4 → 4` },
      { id: "qsi2", title: "Partition Array by Pivot", company: "Amazon", desc: "Rearrange so elements less than pivot come before, equal next, then greater.", starter: `public int[] pivotArray(int[] nums, int pivot) { }`, solution: `public int[] pivotArray(int[] nums, int pivot) {\n    List<Integer> less=new ArrayList<>(), eq=new ArrayList<>(), gr=new ArrayList<>();\n    for(int n:nums){if(n<pivot)less.add(n);else if(n==pivot)eq.add(n);else gr.add(n);}\n    int i=0; int[] res=new int[nums.length];\n    for(int x:less)res[i++]=x; for(int x:eq)res[i++]=x; for(int x:gr)res[i++]=x;\n    return res;\n}`, testCases: `[9,12,5,10,14,3,10], pivot=10 → [9,5,3,10,10,12,14]` },
    ],
    "Advanced": [
      { id: "qsa1", title: "Wiggle Sort II", company: "Google", desc: "Rearrange so nums[0] < nums[1] > nums[2] < nums[3]... (strict inequalities).", starter: `public void wiggleSort(int[] nums) { }`, solution: `public void wiggleSort(int[] nums) {\n    int[] copy=nums.clone(); Arrays.sort(copy);\n    int n=nums.length, lo=(n-1)/2, hi=n-1;\n    for(int i=0;i<n;i++) nums[i]=(i%2==0)?copy[lo--]:copy[hi--];\n}`, testCases: `[1,5,1,1,6,4] → [1,6,1,5,1,4]\n[1,3,2,2,3,1] → [2,3,1,3,1,2]` },
      { id: "qsa2", title: "Top K Frequent Elements", company: "Amazon", desc: "Find the k most frequent elements.", starter: `public int[] topKFrequent(int[] nums, int k) { }`, solution: `public int[] topKFrequent(int[] nums, int k) {\n    Map<Integer,Integer> freq=new HashMap<>();\n    for(int n:nums)freq.merge(n,1,Integer::sum);\n    int[][] arr=new int[freq.size()][2]; int i=0;\n    for(var e:freq.entrySet())arr[i++]=new int[]{e.getKey(),e.getValue()};\n    Arrays.sort(arr,(a,b)->b[1]-a[1]);\n    int[] res=new int[k]; for(int j=0;j<k;j++)res[j]=arr[j][0]; return res;\n}`, testCases: `[1,1,1,2,2,3], k=2 → [1,2]\n[1], k=1 → [1]` },
    ],
  },
};

/* ============================================================
   CODE ANALYZER
============================================================ */
function analyzeCode(code) {
  if (!code || !code.trim()) return { errors: [], warnings: [] };
  const errors = [], warnings = [];
  const lines = code.split('\n');
  let open = 0, close = 0;
  for (const ch of code) { if (ch === '{') open++; if (ch === '}') close++; }
  if (open !== close) errors.push({ type: "error", msg: `Unmatched braces: ${open} '{' and ${close} '}'` });
  lines.forEach((line, idx) => {
    const t = line.trim();
    if (!t.length) return;
    const needsSemi = /^(return|int |String |boolean |double |float |long |char |var |List |Map |Set |Deque |Queue |Stack )/.test(t)
      && !t.endsWith(';') && !t.endsWith('{') && !t.endsWith('}') && !t.endsWith(',') && !t.startsWith('//');
    if (needsSemi) warnings.push({ type: "warning", msg: `Line ${idx + 1}: Possible missing semicolon` });
  });
  if (/\bif\s*\([^)]*=[^=]/.test(code)) warnings.push({ type: "warning", msg: "Assignment inside if condition — did you mean '=='?" });
  if (code.includes('.peek()') && !code.includes('isEmpty')) warnings.push({ type: "warning", msg: "Calling peek() without isEmpty() check — potential NullPointerException" });
  if (code.includes('.pop()') && !code.includes('isEmpty')) warnings.push({ type: "warning", msg: "Calling pop() without isEmpty() check — potential EmptyStackException" });
  if (open > 0 && open === close && errors.length === 0 && (code.includes('while') || code.includes('for')))
    warnings.push({ type: "info", msg: "Loop detected — verify termination condition" });
  return { errors, warnings };
}

/* ============================================================
   CONSTANTS
============================================================ */
const MOD_COLORS = { "Stack": "#0071e3", "Queue": "#34c759", "Linear Search": "#ff9500", "Bubble Sort": "#af52de", "Arrays": "#007aff", "Strings": "#5856d6", "Linked Lists": "#ff2d55", "Recursion": "#ff6723", "Backtracking": "#a2845e", "Trees": "#28a745", "Binary Search Trees": "#00c7be", "Heap / Priority Queue": "#ff375f", "Hashing": "#5ac8fa", "Graphs": "#bf5af2", "Greedy Algorithms": "#e6a800", "Dynamic Programming": "#ff453a", "Bit Manipulation": "#30d158", "Tries": "#0a84ff", "Segment Trees": "#5e5ce6", "Disjoint Set (Union Find)": "#ff9f0a", "Advanced Graph Algorithms": "#eb4d3d", "Binary Search": "#32ade6", "Selection Sort": "#ff6b35", "Insertion Sort": "#4cd964", "Merge Sort": "#9b59b6", "Quick Sort": "#e74c3c" };
const MOD_ICONS = { "Stack": "📚", "Queue": "🔄", "Linear Search": "🔍", "Bubble Sort": "🫧", "Arrays": "📦", "Strings": "🔤", "Linked Lists": "🔗", "Recursion": "🔁", "Backtracking": "↩️", "Trees": "🌳", "Binary Search Trees": "🌲", "Heap / Priority Queue": "⛰️", "Hashing": "🔐", "Graphs": "🕸️", "Greedy Algorithms": "💰", "Dynamic Programming": "🧩", "Bit Manipulation": "⚡", "Tries": "🔠", "Segment Trees": "📊", "Disjoint Set (Union Find)": "🔀", "Advanced Graph Algorithms": "🗺️", "Binary Search": "🎯", "Selection Sort": "🎰", "Insertion Sort": "🃏", "Merge Sort": "🔀", "Quick Sort": "⚡" };
const MOD_DESCS = { "Stack": "Last In, First Out", "Queue": "First In, First Out", "Linear Search": "Sequential scan", "Bubble Sort": "Comparison-based sort", "Arrays": "Contiguous memory storage", "Strings": "Character sequence operations", "Linked Lists": "Node-pointer chains", "Recursion": "Self-referencing functions", "Backtracking": "Explore & prune solutions", "Trees": "Hierarchical data structures", "Binary Search Trees": "Ordered binary trees", "Heap / Priority Queue": "Priority-based extraction", "Hashing": "Key-value fast lookup", "Graphs": "Nodes and edges", "Greedy Algorithms": "Locally optimal choices", "Dynamic Programming": "Overlapping subproblems", "Bit Manipulation": "Binary-level operations", "Tries": "Prefix tree structures", "Segment Trees": "Range query structures", "Disjoint Set (Union Find)": "Connected components", "Advanced Graph Algorithms": "Shortest paths & flows", "Binary Search": "Divide & conquer search", "Selection Sort": "Select minimum each pass", "Insertion Sort": "Build sorted array left to right", "Merge Sort": "Divide, sort, merge", "Quick Sort": "Partition around pivot" };
const MODULES = ["Stack", "Queue", "Linear Search", "Bubble Sort", "Arrays", "Strings", "Linked Lists", "Recursion", "Backtracking", "Trees", "Binary Search Trees", "Heap / Priority Queue", "Hashing", "Graphs", "Greedy Algorithms", "Dynamic Programming", "Bit Manipulation", "Tries", "Segment Trees", "Disjoint Set (Union Find)", "Advanced Graph Algorithms", "Binary Search", "Selection Sort", "Insertion Sort", "Merge Sort", "Quick Sort"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

/* ============================================================
   PROGRESS STORE
============================================================ */
const useProgress = (userId) => {
  const storageKey = `dsaProgress_v2_${userId || "guest"}`;
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch { return {}; }
  });
  const save = useCallback((key, val) => {
    setProgress(p => {
      const n = { ...p, [key]: val };
      try { localStorage.setItem(storageKey, JSON.stringify(n)); } catch { }
      return n;
    });
  }, [storageKey]);
  return [progress, save];
};

/* ============================================================
   ANALYTICS ENGINE
============================================================ */
const useAnalytics = (userId) => {
  const key = `dsa_analytics_v1_${userId || "guest"}`;
  const [data, setData] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key) || { sessions: [], lastActive: null, streak: 0 }); }
    catch { return { sessions: [], lastActive: null, streak: 0 }; }
  });

  const logSession = ({ type, topic, score, difficulty, time, id }) => {
    setData(prev => {
      const now = new Date();
      const newSession = { date: now.toISOString(), type, topic, score, difficulty, time, id };
      const sessions = [...prev.sessions, newSession];

      // Streak logic
      let streak = prev.streak || 0;
      const last = prev.lastActive ? new Date(prev.lastActive) : null;
      if (!last) streak = 1;
      else {
        const diff = Math.floor((now - last) / (1000 * 60 * 60 * 24));
        if (diff === 1) streak += 1;
        else if (diff > 1) streak = 1;
      }

      const next = { ...prev, sessions, lastActive: now.toISOString(), streak };
      localStorage.setItem(key, JSON.stringify(next));
      return next;
    });
  };

  return { analytics: data, logSession };
};

/* ============================================================
   FITA ACADEMY PROFILE
============================================================ */
const FitaAcademyProfile = () => {
  const courses = [
    { name: "Data Structures & Algorithms", icon: "🧮", color: "#0071e3" },
    { name: "UI/UX Design", icon: "🎨", color: "#34c759" },
    { name: "Full Stack Development", icon: "💻", color: "#ff9500" },
    { name: "Python & Machine Learning", icon: "🤖", color: "#af52de" },
    { name: "Cloud Computing (AWS/Azure)", icon: "☁️", color: "#ff3b30" },
    { name: "Placement Training", icon: "🏆", color: "#5ac8fa" },
  ];
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }} style={{ width: "100%", maxWidth: 720 }}>
      <div style={{ background: "white", borderRadius: 24, overflow: "hidden", marginBottom: 16, boxShadow: "var(--shadow-lg)" }}>
        <div style={{ background: "linear-gradient(145deg,#f5f5f7,#e8f2ff)", padding: "40px 36px 32px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, background: "radial-gradient(circle,rgba(0,113,227,0.12),transparent 70%)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: 80, height: 80, borderRadius: 20, background: "linear-gradient(135deg,#0071e3,#0a84ff)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 24px rgba(0,113,227,0.35)", flexShrink: 0 }}>
              <span style={{ fontSize: 36 }}>🎓</span>
            </motion.div>
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color: "#0071e3", background: "rgba(0,113,227,0.1)", padding: "3px 10px", borderRadius: 20 }}>IT Training Institute</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#34c759", background: "rgba(52,199,89,0.1)", padding: "3px 10px", borderRadius: 20 }}>✓ Verified</span>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 700, color: "#1d1d1f", letterSpacing: -0.5, marginBottom: 4 }}>FITA Academy</h2>
              <p style={{ fontSize: 14, color: "#86868b", fontFamily: "var(--font-mono)" }}>Chennai • Bangalore • Malaysia</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 28, marginTop: 24 }}>
            {[["10K+", "Students"], ["50+", "Courses"], ["95%", "Placement"], ["15+", "Years"]].map(([n, l]) => (
              <div key={l}><div style={{ fontSize: 22, fontWeight: 700, color: "#1d1d1f" }}>{n}</div><div style={{ fontSize: 11, color: "#86868b", marginTop: 1 }}>{l}</div></div>
            ))}
          </div>
        </div>
        <div style={{ padding: "24px 36px", display: "flex", gap: 12, flexWrap: "wrap", borderBottom: "1px solid var(--border)" }}>
          {[{ href: "https://www.linkedin.com/company/fitaofficial/", label: "LinkedIn", color: "#0a66c2", icon: "in" }, { href: "https://www.fita.in", label: "fita.in", color: "#0071e3", icon: "🌐" }].map(({ href, label, color, icon }) => (
            <motion.a key={label} href={href} target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.98 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", background: "white", border: "1.5px solid var(--border)", borderRadius: 12, color, fontWeight: 600, fontSize: 13, boxShadow: "var(--shadow-sm)" }}>
              <span>{icon}</span>{label} ↗
            </motion.a>
          ))}
        </div>
        <div style={{ padding: "24px 36px" }}>
          <p style={{ fontSize: 14, color: "#424245", lineHeight: 1.7, marginBottom: 16 }}>At FITA Academy, you don't just learn — you get placement-ready. From Data Structures & Algorithms to UI/UX Design, expert-led courses crafted for real-world success.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <motion.a href="https://www.fita.in" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, background: "#0071e3", color: "white", borderRadius: 14, boxShadow: "var(--shadow-blue)" }}>
              Explore All Courses →
            </motion.a>
            <motion.a href="https://www.linkedin.com/company/fitaofficial/" target="_blank" rel="noopener noreferrer" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", fontSize: 14, fontWeight: 600, background: "white", color: "#424245", border: "1.5px solid var(--border)", borderRadius: 14 }}>
              Follow on LinkedIn
            </motion.a>
          </div>
        </div>
      </div>
      <div style={{ background: "white", borderRadius: 20, padding: "24px", boxShadow: "var(--shadow)" }}>
        <p style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: "#86868b", textTransform: "uppercase", marginBottom: 16 }}>Popular Courses</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 10 }}>
          {courses.map((c, i) => (
            <motion.a key={i} href="https://www.fita.in" target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              whileHover={{ scale: 1.03, y: -2 }}
              style={{ padding: "14px 16px", background: c.color + "0d", border: `1.5px solid ${c.color}22`, borderRadius: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>{c.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: c.color, lineHeight: 1.4 }}>{c.name}</span>
            </motion.a>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const PillBtn = ({ onClick, active, children, color, style: s }) => (
  <motion.button whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.96 }} onClick={onClick}
    style={{
      padding: "12px 28px", fontSize: 14, fontWeight: 800, borderRadius: 100, border: "none", cursor: "pointer", transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
      background: active ? (color || "#0071e3") : "white",
      color: active ? "white" : "#1d1d1f",
      boxShadow: active
        ? `0 12px 24px ${(color || "#0071e3")}44, 0 4px 8px ${(color || "#0071e3")}22, inset 0 1px rgba(255,255,255,0.3)`
        : "0 4px 12px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.1), inset 0 1px white",
      border: active ? "none" : "1.5px solid #F0F0F0",
      ...s
    }}>
    {children}
  </motion.button>
);

/* ============================================================
   HOME SCREEN
============================================================ */
/* ============================================================
   SUB-COMPONENTS FOR HERO
============================================================ */
const FloatingWords = () => {
  const words = ["Stacks", "Queues", "Binary Search", "Recursion", "Sorting", "Graphs", "DP", "Tries", "Heaps", "Big O"];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      {words.map((w, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: "110%", x: `${10 + Math.random() * 80}%` }}
          animate={{ opacity: [0, 0.4, 0], y: "-10%", x: `${(10 + Math.random() * 80) + (Math.random() * 10 - 5)}%` }}
          transition={{ duration: 15 + Math.random() * 20, repeat: Infinity, delay: i * 2, ease: "linear" }}
          style={{ position: "absolute", color: "rgba(255, 255, 255, 0.1)", fontSize: "clamp(1.2rem, 3vw, 4rem)", fontWeight: 900, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}
        >
          {w}
        </motion.div>
      ))}
    </div>
  );
};

const CornerDance = () => {
  const languages = ["Java", "Python", "JavaScript", "C++", "Golang", "Swift", "Ruby", "TypeScript"];
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 5 }}>
      {languages.map((l, i) => {
        const isRight = i % 2 === 0;
        const isBottom = i < 4;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0, 0.3, 0],
              x: isRight ? [0, 20, 0] : [0, -20, 0],
              y: isBottom ? [0, 20, 0] : [0, -20, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 8 + Math.random() * 5,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "easeInOut"
            }}
            style={{
              position: "absolute",
              top: !isBottom ? `${10 + Math.random() * 15}%` : "auto",
              bottom: isBottom ? `${10 + Math.random() * 15}%` : "auto",
              right: isRight ? `${5 + Math.random() * 10}%` : "auto",
              left: !isRight ? `${5 + Math.random() * 10}%` : "auto",
              fontSize: 16,
              fontWeight: 800,
              color: i % 3 === 0 ? "var(--gold)" : "var(--teal)",
              fontFamily: "var(--font-mono)",
              background: "rgba(255,255,255,0.05)",
              padding: "8px 16px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.1)",
              backdropFilter: "blur(4px)"
            }}
          >
            {l}
          </motion.div>
        );
      })}
    </div>
  );
};

/* ============================================================
   NEW COMPONENTS
============================================================ */
const EduDivider = ({ label }) => (
  <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, margin: "80px 0 40px" }}>
    <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
      <path d="M0 10C5 10 10 0 15 0C20 0 25 10 30 10" stroke="#D2D2D7" strokeWidth="2" />
      <circle cx="34" cy="10" r="2.5" fill="#D2D2D7" />
    </svg>
    <span style={{ fontSize: 28, fontWeight: 800, color: "var(--dark)", letterSpacing: -1 }}>{label}</span>
    <svg width="60" height="20" viewBox="0 0 60 20" fill="none">
      <circle cx="26" cy="10" r="2.5" fill="#D2D2D7" />
      <path d="M30 10C35 10 40 0 45 0C50 0 55 10 60 10" stroke="#D2D2D7" strokeWidth="2" />
    </svg>
  </motion.div>
);

const EduTabCard = ({ title, badge, children, img }) => (
  <motion.div
    whileHover={{ y: -10, boxShadow: "0 40px 80px rgba(0,0,0,0.08)" }}
    style={{ background: "white", borderRadius: 40, overflow: "hidden", border: "1.5px solid #F0F0F0", position: "relative", minHeight: 400, display: "flex", flexDirection: "column" }}
  >
    <div style={{ position: "absolute", top: 0, left: 0, background: "white", padding: "14px 28px", borderRadius: "0 0 32px 0", borderBottom: "1.5px solid #F0F0F0", borderRight: "1.5px solid #F0F0F0", zIndex: 10, display: "flex", alignItems: "center", gap: 12 }}>
      <span style={{ fontSize: 20, fontWeight: 800 }}>{title}</span>
      {badge && <span style={{ fontSize: 10, fontWeight: 900, color: "var(--teal)", background: "#E5F1FF", padding: "4px 10px", borderRadius: 20 }}>{badge}</span>}
    </div>
    {img && <div style={{ height: 260, overflow: "hidden", background: "#f8f9fa", position: "relative" }}>
      <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>}
    <div style={{ padding: "80px 40px 40px", flex: 1 }}>{children}</div>
  </motion.div>
);

const UserDashboard = ({ user, onLogout, onClose, onSettings, onProgress }) => {
  if (!user) return null;
  const displayName = user?.name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Dharshan";
  const initial = displayName?.[0]?.toUpperCase() || "D";

  const gridItems = [
    { label: "My Lists", icon: "📋", color: "#34C759" },
    { label: "Notebook", icon: "📓", color: "#0071E3" },
    { label: "Progress", icon: "📈", color: "#FF9500", onClick: () => { onClose(); onProgress(); } },
    { label: "Points", icon: "🪙", color: "#FFCC00" }
  ];

  const listItems = [
    { label: "Try New Features", icon: "🔬" },
    { label: "Orders", icon: "🛒" },
    { label: "My Playgrounds", icon: "🧪", highlight: true },
    { label: "Settings", icon: "⚙️", highlight: true, onClick: () => { onClose(); onSettings(); } },
    { label: "Appearance", icon: "🌗", hasSub: true }
  ];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -20 }} transition={{ type: "spring", damping: 20, stiffness: 300 }}
      style={{
        position: "absolute", top: 70, right: 0, width: 320, background: "#1D1D1F", borderRadius: 32, padding: 24, zIndex: 5000,
        boxShadow: "0 30px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)", color: "white", textAlign: "left"
      }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 900 }}>{initial}</div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 4 }}>{displayName}</div>
          <div style={{ fontSize: 13, color: "#FF9500", fontWeight: 700 }}>Access all features with our Premium subscription!</div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
        {gridItems.map(item => (
          <motion.div key={item.label} onClick={item.onClick} whileHover={{ background: "rgba(255,255,255,0.05)" }} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 16, cursor: "pointer", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ width: 36, height: 36, borderRadius: 12, background: `${item.color}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{item.label}</div>
          </motion.div>
        ))}
      </div>

      {/* List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
        {listItems.map(item => (
          <motion.div key={item.label} onClick={item.onClick} whileHover={{ background: "rgba(255,255,255,0.05)" }} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderRadius: 16, cursor: "pointer", transition: "0.2s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 18, opacity: 0.7 }}>{item.icon}</span>
              <span style={{ fontSize: 14, fontWeight: item.highlight ? 800 : 500, color: item.highlight ? "white" : "rgba(255,255,255,0.7)" }}>{item.label}</span>
            </div>
            {item.hasSub && <span style={{ fontSize: 12, opacity: 0.3 }}>›</span>}
          </motion.div>
        ))}
      </div>

      {/* Footer Sign Out */}
      <motion.button onClick={onLogout} whileHover={{ background: "rgba(255,59,48,0.15)" }}
        style={{ width: "100%", padding: "14px", borderRadius: 16, background: "rgba(255,255,255,0.03)", border: "none", color: "#FF3B30", fontSize: 14, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 12, justifyContent: "center" }}>
        <span>🚪</span> Sign Out
      </motion.button>

      {/* Click-away overlay */}
      <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: -1 }} />
    </motion.div>
  );
};

const ExperienceSection = () => (
  <div style={{ padding: "120px 0", textAlign: "center" }}>
    <span style={{ fontSize: 13, fontWeight: 900, color: "#0071E3", background: "#E5F1FF", padding: "6px 14px", borderRadius: 8, letterSpacing: 1 }}>THE EXPERIENCE</span>
    <h2 style={{ fontSize: 62, fontWeight: 900, color: "#1D1D1F", letterSpacing: -2, marginTop: 24, marginBottom: 20 }}>Beyond Conventional Learning</h2>
    <p style={{ fontSize: 22, color: "var(--text-muted)", maxWidth: 800, margin: "0 auto 80px", lineHeight: 1.6 }}>
      Traditional platforms focus on memorization. We focus on intuition, visualization, and real-world implementation patterns.
    </p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 32 }}>
      {[
        { title: "Dynamic Visualizers", desc: "Step through complex logic like Recursion and DP with our custom animation engine.", icon: "🎬", bg: "#F5F5F7" },
        { title: "Interview Blueprints", desc: "Access high-yield questions curated by FITA Academy experts from 10,000+ real experiences.", icon: "🗺️", bg: "#F5F5F7" },
        { title: "Theory & Code Separation", desc: "Master the structure through theory tests, then master the logic in our Code Arena.", icon: "⚔️", bg: "#F5F5F7" }
      ].map((f, i) => (
        <motion.div key={i} whileHover={{ y: -10 }} style={{ padding: 48, background: f.bg, borderRadius: 32, textAlign: "left" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>{f.icon}</div>
          <h3 style={{ fontSize: 28, fontWeight: 800, marginBottom: 16 }}>{f.title}</h3>
          <p style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1.6 }}>{f.desc}</p>
        </motion.div>
      ))}
    </div>
  </div>
);

const StatsSection = () => (
  <div style={{ background: "#000", borderRadius: 48, padding: "100px 80px", color: "white", margin: "120px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", background: "radial-gradient(circle at 70% 30%, rgba(255,149,0,0.15), transparent 70%)" }} />
    <div>
      <h2 style={{ fontSize: 62, fontWeight: 900, letterSpacing: -2, marginBottom: 60, lineHeight: 1.1 }}>How you become <br /> <span style={{ color: "#FF9500" }}>Interview Ready</span></h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>
        {[
          { num: "01", title: "Fundamental Core", desc: "Start with Arrays, Strings, and basic sorting to build a solid foundation." },
          { num: "02", title: "Non-Linear Mastery", desc: "Level up to Trees, Graphs, and Heaps. Understand hierarchical data." },
          { num: "03", title: "Algorithmic Precision", desc: "Master DP, Backtracking, and Greedy strategies to solve complex problems." }
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 24 }}>
            <span style={{ fontSize: 24, fontWeight: 900, color: "rgba(255,255,255,0.2)" }}>{item.num}</span>
            <div>
              <h4 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>{item.title}</h4>
              <p style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", borderRadius: 40, padding: 60, border: "1px solid rgba(255,255,255,0.1)" }}>
      <span style={{ fontSize: 12, fontWeight: 900, color: "#FF9500", letterSpacing: 1, textTransform: "uppercase" }}>Platform Stats</span>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginTop: 40, marginBottom: 60 }}>
        {[["25+", "Advanced Modules"], ["1000+", "Interview Qs"], ["500+", "Code Challenges"], ["100%", "FAANG Coverage"]].map(([val, lbl]) => (
          <div key={lbl}>
            <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 4 }}>{val}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>{lbl}</div>
          </div>
        ))}
      </div>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ width: "100%", padding: "20px", borderRadius: 16, background: "transparent", border: "1px solid white", color: "white", fontSize: 16, fontWeight: 800, cursor: "pointer" }}>
        Explore Full Curriculum
      </motion.button>
    </div>
  </div>
);

const ChennaiSection = () => (
  <div style={{ padding: "100px 0", textAlign: "center" }}>
    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FFE5E5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 20 }}>🍎</div>
    <h2 style={{ fontSize: 24, fontWeight: 800, color: "#FF3B30", marginBottom: 24 }}>Made with ❤️ in Chennai</h2>
    <p style={{ fontSize: 18, color: "var(--text-muted)", maxWidth: 800, margin: "0 auto 60px", lineHeight: 1.6 }}>
      At FITA Academy, our mission is to help you improve yourself and land your dream job. We have a sizable repository of interview resources for many companies.
    </p>
    <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap", opacity: 0.3, filter: "grayscale(100%)", marginBottom: 60 }}>
      {["FACEBOOK", "APPLE", "UBER", "CISCO", "AMAZON", "INTEL", "IBM"].map(c => (
        <span key={c} style={{ fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>{c}</span>
      ))}
    </div>
    <motion.a href="https://www.fita.in/job-openings-in-chennai/" target="_blank" rel="noopener noreferrer" style={{ fontSize: 18, fontWeight: 800, color: "#0071E3", textDecoration: "none" }}>Join Our Team →</motion.a>
  </div>
);

/* ============================================================
   HOME SCREEN REDESIGN
============================================================ */
export const HomeScreen = ({ onEnter, user, onLogout, progress, onLoginClick, onSettings, onProgress }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [tab, setTab] = useState("home");
  const displayName = user?.name || user?.user_metadata?.display_name || "User";
  const initial = displayName?.[0]?.toUpperCase() || "U";

  const lastMod = progress.last_module || "Binary Search";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", position: "relative" }}>
      {/* Centered Pill Navbar */}
      <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 1000, width: "90%", maxWidth: 1000 }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(20px)", borderRadius: 32,
          padding: "10px 10px", display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 10px 40px rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.4)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, paddingLeft: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#0071E3", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 20 }}>🧑‍💻</div>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: -1 }}>CodeLoom</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {[["home", "My Path"], ["company", "FITA Academy"]].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: "10px 24px", borderRadius: 24, fontSize: 14, fontWeight: 700,
                background: tab === t ? "var(--teal)" : "transparent",
                color: tab === t ? "white" : "var(--text-muted)", border: "none", transition: "0.3s"
              }}>{l}</button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{ background: "#E5F1FF", color: "#0071E3", padding: "10px 24px", borderRadius: 24, fontSize: 14, fontWeight: 800, border: "none" }}>
              📄 Syllabus
            </motion.button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, borderLeft: "1px solid #EEE", paddingLeft: 16 }}>
              {user ? (
                <>
                  <motion.div onClick={() => setShowProfile(!showProfile)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, #FF9500, #FFCC00)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 18, cursor: "pointer", border: "2px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
                    {initial}
                  </motion.div>
                  <AnimatePresence>
                    {showProfile && <UserDashboard user={user} onLogout={onLogout} onClose={() => setShowProfile(false)} onSettings={onSettings} onProgress={onProgress} />}
                  </AnimatePresence>
                </>
              ) : (
                <PillBtn onClick={onLoginClick} color="#0071E3" active>Sign In</PillBtn>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {tab === "home" && (
          <motion.div key="home-v2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="sky-gradient" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "140px 40px 100px", textAlign: "center", position: "relative", overflow: "hidden" }}>
              <motion.div animate={{ x: [0, 50, 0], y: [0, 10, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", top: "20%", left: "10%", opacity: 0.4, fontSize: 120, pointerEvents: "none" }}>☁️</motion.div>
              <motion.div animate={{ x: [0, -40, 0], y: [0, -15, 0] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }} style={{ position: "absolute", bottom: "30%", right: "10%", opacity: 0.3, fontSize: 100, pointerEvents: "none" }}>☁️</motion.div>
              <motion.h1 initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }} style={{ fontSize: "clamp(3rem, 7vw, 6rem)", fontWeight: 900, color: "#1D1D1F", letterSpacing: -4, lineHeight: 1, marginBottom: 20 }}>
                Knowledge is power. <br /> <span style={{ color: "var(--teal)" }}>Master DSA.</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ fontSize: 20, color: "rgba(0,0,0,0.6)", marginBottom: 60, maxWidth: 600 }}>
                The ultimate treasure isn't gold—it's the logic you build. Join the academy and start your journey today.
              </motion.p>
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.7, duration: 0.6 }} style={{ position: "relative", width: "100%", maxWidth: 800, margin: "0 auto" }}>
                <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}>
                  <img src="https://images.unsplash.com/photo-1587620962725-abab7fe55159?q=80&w=2831&auto=format&fit=crop" style={{ width: "100%", maxHeight: 500, objectFit: "contain", borderRadius: 40 }} />
                </motion.div>
              </motion.div>
            </div>
            <div style={{ background: "white", padding: "100px 40px" }}>
              <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                <EduDivider label="Current Path" />
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 40, marginBottom: 120 }}>
                  <EduTabCard title="The Core Modules" badge="Learning Path">
                    <p style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1.8, marginBottom: 32 }}>
                      Our curriculum is built on a "State of Mind". Not just a system, but art-driven building blocks that focus on peak understanding of data structures.
                    </p>
                    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 40 }}>
                      {MODULES.slice(0, 4).map(m => (
                        <span key={m} style={{ padding: "8px 20px", background: "#F5F5F7", borderRadius: 20, fontSize: 14, fontWeight: 700 }}>{m}</span>
                      ))}
                    </div>
                    <motion.button onClick={user ? onEnter : onLoginClick} whileHover={{ x: 10 }} style={{ color: "var(--teal)", fontWeight: 900, fontSize: 20, border: "none", background: "none", cursor: "pointer" }}>
                      View Full Map →
                    </motion.button>
                  </EduTabCard>
                  <EduTabCard title="Stats" badge="Active Progress">
                    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                        <div style={{ background: "#F5F5F7", padding: "20px", borderRadius: 24 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--teal)", marginBottom: 4 }}>SOLVED</div>
                          <div style={{ fontSize: 32, fontWeight: 900 }}>12</div>
                        </div>
                        <div style={{ background: "#F5F5F7", padding: "20px", borderRadius: 24 }}>
                          <div style={{ fontSize: 11, fontWeight: 800, color: "var(--teal)", marginBottom: 4 }}>RANK</div>
                          <div style={{ fontSize: 32, fontWeight: 900 }}>#42</div>
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: 12, fontWeight: 800, color: "var(--teal)", marginBottom: 8, textTransform: "uppercase" }}>Current Focus: {lastMod}</div>
                        <div style={{ height: 14, background: "#F5F5F7", borderRadius: 12, overflow: "hidden", border: "3px solid #F5F5F7" }}>
                          <motion.div initial={{ width: 0 }} whileInView={{ width: "64%" }} transition={{ duration: 1 }} style={{ height: "100%", background: "var(--teal)", borderRadius: 8 }} />
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ width: 44, height: 44, background: "#0071E312", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🏆</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: "#1D1D1F" }}>Mastery Level 4</div>
                          <div style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Top 5% in Chennai region</div>
                        </div>
                      </div>
                    </div>
                  </EduTabCard>
                </div>

                <ExperienceSection />

                <EduDivider label="Our Origin" />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 40 }}>
                  <EduTabCard title="Teacher's Note" img="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2670&auto=format&fit=crop">
                    <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-muted)" }}> Teaching is <b>not an API</b> between user and logic. It's a craft. </p>
                  </EduTabCard>
                  <EduTabCard title="FITA Academy" img="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop">
                    <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--text-muted)" }}> Building at the heart of <b>Chennai</b>. Our ship never stops. </p>
                  </EduTabCard>
                </div>

                <StatsSection />

                <ChennaiSection />
              </div>
            </div>
          </motion.div>
        )}

        {tab === "company" && (
          <motion.div key="company-profile" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
            style={{ display: "flex", justifyContent: "center", padding: "160px 40px", background: "white", minHeight: "100vh" }}>
            <FitaAcademyProfile />
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} style={{ position: "fixed", bottom: 40, left: "50%", transform: "translateX(-50%)", zIndex: 1000 }}>
        <motion.button onClick={user ? onEnter : onLoginClick} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{ background: "#0071E3", color: "white", padding: "18px 52px", borderRadius: 40, fontSize: 18, fontWeight: 900, border: "none", boxShadow: "0 20px 40px rgba(0,113,227,0.3)", cursor: "pointer" }}>
          Start Learning Now 🚀
        </motion.button>
      </motion.div>
    </div>
  );
};

/* ============================================================
   DSA SCREEN
============================================================ */
const DSAScreen = ({ level, setLevel, onSelectModule, onBack, progress, user, onSettings, analytics, logSession, onShowProgress, onExploreVisualizer }) => {
  // const { analytics, logSession } = useAnalytics(); // Removed, handled in App
  const [showProfile, setShowProfile] = useState(false);
  const [activeTab, setActiveTab] = useState("learn");
  const [showReport, setShowReport] = useState(false);
  const tabs = [["learn", "📚 Learn"], ["interview", "🎤 Interview"], ["code", "💻 Code"]];
  const initial = user?.name?.[0]?.toUpperCase() || "D";

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Analytics Trigger */}
      <motion.button onClick={() => setShowReport(true)}
        initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: 1.1, rotate: 5, boxShadow: "0 20px 40px rgba(0,255,140,0.3)" }} whileTap={{ scale: 0.9 }}
        style={{ position: "fixed", bottom: 48, right: 48, width: 80, height: 80, borderRadius: "50%", background: "var(--teal)", color: "white", fontSize: 32, boxShadow: "0 12px 32px rgba(0,0,0,0.15)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", border: "5px solid white" }}>
        📊
      </motion.button>
      {showReport && <PerformanceReport analytics={analytics} onClose={() => setShowReport(false)} />}
      <div style={{ position: "fixed", top: 32, left: "50%", transform: "translateX(-50%)", zIndex: 1000, width: "90%", maxWidth: 1100 }}>
        <div style={{
          background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(24px)", borderRadius: 40,
          padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 20px 60px rgba(0,0,0,0.1)", border: "1px solid rgba(255,255,255,0.6)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <motion.button onClick={onBack} whileHover={{ x: -6 }} style={{ background: "none", border: "none", display: "flex", alignItems: "center", gap: 8, color: "var(--teal)", fontSize: 16, fontWeight: 900, cursor: "pointer", paddingLeft: 20 }}>
              ‹ HOME
            </motion.button>
            <div style={{ height: 28, width: 1.5, background: "#F0F0F0" }} />
            <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: -1, color: "#1D1D1F" }}>THE KNOWLEDGE ENGINE</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#F5F5F7", padding: 6, borderRadius: 32 }}>
            {tabs.map(([t, l]) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: "10px 24px", borderRadius: 28, fontSize: 14, fontWeight: 800,
                background: activeTab === t ? "white" : "transparent",
                color: activeTab === t ? "#1D1D1F" : "var(--text-muted)",
                border: "none", transition: "0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                boxShadow: activeTab === t ? "0 4px 16px rgba(0,0,0,0.06)" : "none",
                cursor: "pointer"
              }}>{l.split(" ")[1].toUpperCase()}</button>
            ))}
          </div>

          <div style={{ position: "relative", width: 140, display: "flex", justifyContent: "flex-end", paddingRight: 16 }}>
            <motion.div onClick={() => setShowProfile(!showProfile)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--teal)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, border: "3px solid white", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", cursor: "pointer" }}>
              {initial}
            </motion.div>
            <AnimatePresence>
              {showProfile && <UserDashboard user={user} onLogout={() => { onBack(); window.location.reload(); }} onClose={() => setShowProfile(false)} onSettings={onSettings} onProgress={onShowProgress} />}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "140px 40px 100px",
        height: "auto"
      }}>
        <AnimatePresence mode="wait">
          {activeTab === "learn" && (
            <motion.div key="learn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <LearnTab level={level} setLevel={setLevel} onSelectModule={onSelectModule} progress={progress} onExploreVisualizer={onExploreVisualizer} />
            </motion.div>
          )}
          {activeTab === "interview" && (
            <motion.div key="interview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <InterviewTab />
            </motion.div>
          )}
          {activeTab === "code" && (
            <motion.div key="code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <CodeArenaTab logSession={logSession} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const SettingsScreen = ({ user, onBack, onLogout, onShowProgress }) => {
  const [activeTab, setActiveTab] = useState("Account");
  const displayName = user?.name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";

  const tabs = ["Account", "Privacy", "Billing", "Points", "Progress", "Orders", "Notifications"];

  const renderContent = () => {
    if (activeTab === "Notifications") {
      return (
        <div style={{ color: "white" }}>
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Site Notification</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Receive Website / Browser Notifications</p>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
              {[
                { label: "Ranking Updates", icon: "📊" },
                { label: "Post Comments", icon: "💬" },
                { label: "Awards Received", icon: "🥇" }
              ].map((item, i) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 18, opacity: 0.7 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 24, background: "#0071E3", borderRadius: 12, position: "relative", cursor: "pointer" }}>
                      <div style={{ position: "absolute", right: 2, top: 2, width: 20, height: 20, background: "white", borderRadius: "50%" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>On</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Email</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Receive notifications via your primary email.</p>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
              {[
                { label: "Important Announcements", icon: "📢" },
                { label: "Weekly Newsletter", icon: "📰" },
                { label: "Promotion Events", icon: "🎁" }
              ].map((item, i) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 18, opacity: 0.7 }}>{item.icon}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 44, height: 24, background: "#0071E3", borderRadius: 12, position: "relative", cursor: "pointer" }}>
                      <div style={{ position: "absolute", right: 2, top: 2, width: 20, height: 20, background: "white", borderRadius: "50%" }} />
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>On</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "Account") {
      return (
        <div style={{ color: "white" }}>
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>General</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Manage your core account details and identifiers.</p>
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
              {[
                { label: "CodeLoom ID", value: displayName, icon: "👤" },
                { label: "Email", value: user?.email || "user@example.com", icon: "✉️" },
                { label: "Phone Number", value: "Not linked", icon: "📞" },
                { label: "Password", value: "••••••••", icon: "🔑" }
              ].map((item, i) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", cursor: "pointer", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 18, opacity: 0.7 }}>{item.icon}</span>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: 800 }}>{item.label}</span>
                      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginLeft: 12 }}>{item.value}</span>
                    </div>
                  </div>
                  <span style={{ fontSize: 18, opacity: 0.3 }}>›</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Social Accounts</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Connect social accounts to sign in to CodeLoom.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Google", "Github", "Apple"].map(social => (
                <div key={social} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 18 }}>{social === "Google" ? "G" : social === "Github" ? "🐙" : "🍎"}</span>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{social}</span>
                  </div>
                  <button style={{ padding: "8px 24px", borderRadius: 8, background: "white", color: "#1D1D1F", border: "none", fontSize: 13, fontWeight: 800, cursor: "pointer" }}>Connect</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === "Progress") {
      return (
        <div style={{ color: "white", textAlign: "center", padding: "80px 0" }}>
          <div style={{ fontSize: 60, marginBottom: 24 }}>📈</div>
          <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 16 }}>Your DSA Progress</h3>
          <p style={{ color: "rgba(255,255,255,0.4)", marginBottom: 40, maxWidth: 400, margin: "0 auto 40px" }}>Monitor your growth, solved problems, and interview readiness from our advanced tracking dashboard.</p>
          <button onClick={onShowProgress} style={{ padding: "14px 40px", borderRadius: 12, background: "#0071E3", color: "white", border: "none", fontSize: 16, fontWeight: 900, cursor: "pointer", boxShadow: "0 10px 30px rgba(0,113,227,0.3)" }}>Open Dashboard</button>
        </div>
      );
    }

    return (
      <div style={{ color: "white", textAlign: "center", padding: "80px 0" }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>🏗️</div>
        <h3 style={{ fontSize: 20, fontWeight: 800 }}>{activeTab} Settings</h3>
        <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 8 }}>This section is currently under development.</p>
      </div>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ minHeight: "100vh", background: "#0D0D0E", color: "white" }}>
      {/* Settings Header */}
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "20px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <motion.button onClick={onBack} whileHover={{ x: -4 }} style={{ background: "none", border: "none", color: "#0071E3", fontSize: 15, fontWeight: 900, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            ‹ BACK
          </motion.button>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Settings</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>{displayName}</div>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{displayName[0]}</div>
        </div>
      </div>

      <div style={{ display: "flex", maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
        {/* Sidebar */}
        <div style={{ width: 240, display: "flex", flexDirection: "column", gap: 4 }}>
          {tabs.map(t => (
            <motion.div key={t} onClick={() => setActiveTab(t)}
              whileHover={{ background: activeTab === t ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.03)" }}
              style={{
                padding: "12px 20px", borderRadius: 12, cursor: "pointer", transition: "0.2s",
                background: activeTab === t ? "rgba(255,255,255,0.05)" : "transparent",
                color: activeTab === t ? "white" : "rgba(255,255,255,0.5)",
                fontWeight: activeTab === t ? 800 : 500
              }}>
              {t}
            </motion.div>
          ))}
          <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ padding: "12px 20px", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>Profile Settings ↗</div>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, paddingLeft: 80 }}>
          <h2 style={{ fontSize: 24, fontWeight: 900, marginBottom: 32 }}>{activeTab}</h2>
          {renderContent()}
        </div>
      </div>

      <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>Copyright © 2026 CodeLoom • Help Center • Jobs • Privacy Policy</div>
      </div>
    </motion.div>
  );
};

const LearnTab = ({ level, setLevel, onSelectModule, progress, onExploreVisualizer }) => {
  const modProgress = (m) => {
    const solved = Object.keys(progress).filter(k => k.startsWith(`learn_${m}_`) && progress[k] === "solved").length;
    return (solved / 3) * 100;
  };

  return (
    <div style={{ animation: "fadeIn 0.6s ease-out" }}>
      <div style={{ marginBottom: 60, textAlign: "center" }}>
        <h2 style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2, color: "#1D1D1F", marginBottom: 20 }}>The Knowledge Map</h2>
        <p style={{ color: "var(--text-muted)", fontSize: 22, maxWidth: 640, margin: "0 auto", fontWeight: 500 }}>
          Master foundational structures through immersive reading and detailed theory.
        </p>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 52, justifyContent: "center" }}>
        {LEVELS.map(l => (
          <PillBtn key={l} active={level === l} onClick={() => setLevel(l)} color="#1D1D1F">
            {l.toUpperCase()}
          </PillBtn>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 32 }}>
        {MODULES.map((m, i) => {
          const color = MOD_COLORS[m];
          const p = modProgress(m);
          return (
            <motion.div
              key={m} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
              whileHover={{ y: -12, boxShadow: "var(--shadow-lg)" }}
              onClick={() => onSelectModule(m)}
              style={{
                background: "white", borderRadius: 40, padding: 0, overflow: "hidden", cursor: "pointer", border: "1.5px solid #F0F0F0", transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)"
              }}
            >
              <div style={{ height: 180, background: `${color}12`, position: "relative", overflow: "hidden" }}>
                <motion.div initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }} style={{ position: "absolute", top: 40, left: 40, width: 64, height: 64, borderRadius: 20, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "0 10px 20px rgba(0,0,0,0.05)", border: "1.5px solid #F0F0F0" }}>{MOD_ICONS[m]}</motion.div>
                <div style={{ position: "absolute", bottom: 32, left: 40 }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>Curriculum</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#1D1D1F", letterSpacing: -0.5 }}>{m}</div>
                </div>
              </div>

              <div style={{ padding: 40 }}>
                <p style={{ fontSize: 14, color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.6, marginBottom: 32 }}>Build deep architectural intuition for {m} with practical examples.</p>
                <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const algKey = m === "Recursion" ? "factorial" : m.toLowerCase().replace(/\s+\/\s+/g, "_").replace(/\s+/g, "_");
                      onExploreVisualizer(algKey);
                    }}
                    style={{ background: `${color}15`, color: color, border: `1px solid ${color}33`, padding: "8px 16px", borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                  >
                    🎨 Visualize
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "#1D1D1F" }}>{p < 100 ? "IN PROGRESS" : " COMPLETED"}</span>
                  <span style={{ fontSize: 11, fontWeight: 900, color: color }}>{Math.round(p)}%</span>
                </div>
                <div style={{ height: 8, background: "#F5F5F7", borderRadius: 10, overflow: "hidden" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${p}%` }} style={{ height: "100%", background: color, borderRadius: 10 }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const InterviewTab = () => {
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const [examState, setExamState] = useState("landing"); // landing -> path -> setup -> exam -> results
  const [selMod, setSelMod] = useState("Stack");
  const [search, setSearch] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [timePerQ, setTimePerQ] = useState(60);
  const [includeCoding, setIncludeCoding] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [userResponse, setUserResponse] = useState("");
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  const [examQuestions, setExamQuestions] = useState([]);
  const [codingQuestion, setCodingQuestion] = useState(null);
  const [codingResponse, setCodingResponse] = useState("");
  const [isCodingPhase, setIsCodingPhase] = useState(false);
  const { analytics, logSession } = useAnalytics();
  const color = MOD_COLORS[selMod];

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const finishExam = useCallback(() => {
    clearInterval(timerRef.current);
    const taken = Math.round((Date.now() - startTimeRef.current) / 1000);
    setTimeTaken(taken);
    setExamState("results");
  }, []);

  useEffect(() => {
    if (examState !== "exam") return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); finishExam(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [examState, finishExam]);

  const startExam = () => {
    const allQ = INTERVIEW_DATA[selMod] || [];
    const shuffled = [...allQ].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(numQuestions, allQ.length));
    setExamQuestions(selected);

    if (includeCoding) {
      const levels = ["Beginner", "Intermediate", "Advanced"];
      const allChallenges = [];
      levels.forEach(l => {
        if (CODING_CHALLENGES[selMod]?.[l]) allChallenges.push(...CODING_CHALLENGES[selMod][l]);
      });
      if (allChallenges.length > 0) setCodingQuestion(allChallenges[Math.floor(Math.random() * allChallenges.length)]);
      else setCodingQuestion(null);
    } else setCodingQuestion(null);

    setAnswers(new Array(selected.length).fill(null));
    setCurrentQ(0);
    setUserResponse("");
    setCodingResponse("");
    setIsCodingPhase(false);
    const total = timePerQ * selected.length + (includeCoding ? 300 : 0);
    setTimeLeft(total);
    setTotalTime(total);
    startTimeRef.current = Date.now();
    setExamState("exam");
  };

  const checkAnswer = (userInput, correctSolution, isMCQ = false) => {
    if (!userInput) return false;
    if (isMCQ) return userInput === correctSolution;

    if (userInput.trim().length < 3) return false;
    const input = userInput.toLowerCase();
    const solution = correctSolution.toLowerCase();
    // Simple keyword extraction: words > 3 chars
    const keywords = solution.match(/\b[a-z]{4,}\b/g) || [];
    const uniqueKeywords = [...new Set(keywords)];
    if (uniqueKeywords.length === 0) return input.length > 5;

    let matches = 0;
    uniqueKeywords.forEach(kw => { if (input.includes(kw)) matches++; });
    const matchPct = (matches / uniqueKeywords.length);
    return matchPct >= 0.4; // 40% keyword match considered passing
  };

  const handleFinish = useCallback((finalAnswers = answers) => {
    const correctCount = finalAnswers.filter(a => a?.correct).length;
    const finalScore = Math.round((correctCount / examQuestions.length) * 100);
    logSession({
      type: "interview",
      topic: selMod,
      score: finalScore,
      difficulty: "Mixed",
      time: Math.round((Date.now() - startTimeRef.current) / 1000)
    });
    finishExam();
  }, [answers, examQuestions, selMod, logSession, finishExam]);

  const submitCurrentAnswer = () => {
    const q = examQuestions[currentQ];
    const isCorrect = checkAnswer(userResponse, q.a, !!q.options);
    const newAnswers = [...answers];
    const ansObj = { user: userResponse, correct: isCorrect, keywords: q.a, isMCQ: !!q.options };
    newAnswers[currentQ] = ansObj;
    setAnswers(newAnswers);

    if (currentQ + 1 < examQuestions.length) {
      setCurrentQ(q => q + 1);
      setUserResponse("");
    } else {
      if (codingQuestion) setIsCodingPhase(true);
      else handleFinish(newAnswers);
    }
  };

  const skipQuestion = () => {
    const newAnswers = [...answers];
    newAnswers[currentQ] = { user: "(Skipped)", correct: false, skipped: true };
    setAnswers(newAnswers);
    if (currentQ + 1 >= examQuestions.length) {
      if (codingQuestion) setIsCodingPhase(true);
      else handleFinish(newAnswers);
      return;
    }
    setCurrentQ(q => q + 1);
    setUserResponse("");
  };

  const getGrade = (pct) => {
    if (pct >= 90) return { grade: "A+", label: "Excellent! 🏆", color: "#34c759" };
    if (pct >= 80) return { grade: "A", label: "Great Job! 🎉", color: "#30d158" };
    if (pct >= 70) return { grade: "B", label: "Good Work 👍", color: "#5ac8fa" };
    if (pct >= 60) return { grade: "C", label: "Average 📚", color: "#ff9500" };
    if (pct >= 50) return { grade: "D", label: "Needs Work 💪", color: "#ff6b35" };
    return { grade: "F", label: "Keep Practicing 🔄", color: "#ff3b30" };
  };

  /* ── LANDING SCREEN ── */
  if (examState === "landing") {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: "center", padding: "40px 0" }}>
        <div style={{ marginBottom: 48 }}>
          <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity }} style={{ fontSize: 80, marginBottom: 20 }}>🏔️</motion.div>
          <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2, color: "#1D1D1F", marginBottom: 12 }}>Interview Quest</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 20, fontWeight: 500 }}>Turn practice into progress</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24, maxWidth: 1000, margin: "0 auto" }}>
          <motion.div whileHover={{ y: -8, boxShadow: "var(--shadow-lg)" }} onClick={() => setExamState("path")}
            style={{ background: "#1D1D1F", color: "white", borderRadius: 40, padding: 40, textAlign: "left", cursor: "pointer", border: "1px solid rgba(255,255,255,0.1)", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Data Structures and Algorithms</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>0/35 Levels</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, opacity: 0.3 }}>
              {[1, 2, 3, 4, 5, 6, 7].map(i => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "white" }} />)}
            </div>
            <div style={{ position: "absolute", bottom: 40, right: 40, fontSize: 40 }}>⚡</div>
          </motion.div>

          <motion.div style={{ background: "#1D1D1F", color: "white", borderRadius: 40, padding: 40, textAlign: "left", opacity: 0.6, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Database</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>5 Levels</div>
            <div style={{ background: "rgba(255,255,255,0.1)", padding: "10px 24px", borderRadius: 20, display: "inline-block", fontSize: 13, fontWeight: 700 }}>🔒 Locked</div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  /* ── PATH SCREEN ── */
  if (examState === "path") {
    const modules = ["Arrays", "Strings", "Linked Lists", "Stack", "Queue", "Trees", "Graphs", "DP"];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: "40px 0" }}>
        <button onClick={() => setExamState("landing")} style={{ background: "none", border: "none", color: "var(--teal)", fontWeight: 900, fontSize: 15, cursor: "pointer", marginBottom: 32, display: "flex", alignItems: "center", gap: 8 }}>
          ‹ BACK TO QUEST
        </button>

        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 900 }}>The Linear Shoal</h2>
          <p style={{ color: "var(--text-muted)", fontWeight: 600 }}>Ascend through the levels of hierarchy</p>
        </div>

        <div style={{ position: "relative", maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 60 }}>
          {/* Vertical path line */}
          <div style={{ position: "absolute", top: 0, bottom: 0, width: 4, background: "rgba(0,0,0,0.05)", borderLeft: "2px dashed #DDD", zIndex: 0 }} />

          {modules.map((m, i) => (
            <motion.div key={m} initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
              style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: i % 2 === 0 ? "flex-start" : "flex-end" }}>
              <motion.button
                whileHover={{ scale: 1.1, rotation: 2 }}
                onClick={() => { setSelMod(m); setExamState("setup"); }}
                style={{
                  background: selMod === m ? "var(--teal)" : "white", color: selMod === m ? "white" : "#1D1D1F",
                  padding: "16px 32px", borderRadius: 24, border: "2px solid #F0F0F0", fontSize: 15, fontWeight: 800,
                  boxShadow: "var(--shadow-lg)", cursor: "pointer", display: "flex", alignItems: "center", gap: 12
                }}>
                <span style={{ fontSize: 20 }}>{MOD_ICONS[m] || "📦"}</span>
                {m}
              </motion.button>
              {i === 2 && <div style={{ position: "absolute", left: -60, top: "50%", transform: "translateY(-50%)", fontSize: 24 }}>🧳</div>}
              {i === 5 && <div style={{ position: "absolute", right: -60, top: "50%", transform: "translateY(-50%)", fontSize: 24 }}>🪙</div>}
            </motion.div>
          ))}

          <div style={{ fontSize: 40, marginTop: 40, opacity: 0.3 }}>❓</div>
        </div>
      </motion.div>
    );
  }

  /* ── SETUP SCREEN ── */
  if (examState === "setup") {
    const actualQ = Math.min(numQuestions, INTERVIEW_DATA[selMod]?.length || 0);
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ animation: "fadeIn 0.6s ease-out" }}>
        <button onClick={() => setExamState("path")} style={{ background: "none", border: "none", color: "var(--teal)", fontWeight: 900, fontSize: 15, cursor: "pointer", marginBottom: 32, display: "flex", alignItems: "center", gap: 8 }}>
          ‹ BACK TO PATH
        </button>

        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <h2 style={{ fontSize: 48, fontWeight: 900, letterSpacing: -2, color: "#1D1D1F", marginBottom: 16 }}>Mission Briefing</h2>
          <p style={{ color: "var(--text-muted)", fontSize: 20, maxWidth: 600, margin: "0 auto" }}>Prepare for your encounter with the {selMod} domain.</p>
        </div>

        <div style={{ background: "white", borderRadius: 40, border: "1.5px solid #F0F0F0", padding: 48, boxShadow: "0 40px 80px rgba(0,0,0,0.05)", maxWidth: 720, margin: "0 auto" }}>
          {/* Header Info */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 40, background: "#F5F5F7", padding: 24, borderRadius: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>{MOD_ICONS[selMod]}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 900, color: "var(--teal)", textTransform: "uppercase", letterSpacing: 1 }}>Selected Domain</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: "#1D1D1F" }}>{selMod} Verification</div>
            </div>
          </div>

          {/* Questions Selection */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#86868b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Combat Intensity (Questions)</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[5, 10, 15, 20].map(n => (
                <button key={n} onClick={() => setNumQuestions(n)}
                  style={{ flex: 1, padding: "16px 4px", fontSize: 15, fontWeight: 900, borderRadius: 16, border: `2px solid ${numQuestions === n ? "var(--teal)" : "#F0F0F0"}`, cursor: "pointer", background: numQuestions === n ? "var(--teal)" : "white", color: numQuestions === n ? "white" : "#1D1D1F", transition: "0.3s" }}>{n}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#86868b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>Time Allowance (Per Question)</div>
            <div style={{ display: "flex", gap: 10 }}>
              {[30, 60, 90, 120].map(t => (
                <button key={t} onClick={() => setTimePerQ(t)}
                  style={{ flex: 1, padding: "16px 4px", fontSize: 14, fontWeight: 900, borderRadius: 16, border: `2px solid ${timePerQ === t ? "var(--teal)" : "#F0F0F0"}`, cursor: "pointer", background: timePerQ === t ? "var(--teal)" : "white", color: timePerQ === t ? "white" : "#1D1D1F", transition: "0.3s" }}>{t}S
                </button>
              ))}
            </div>
          </div>

          {/* Coding Challenge Toggle */}
          <div style={{ marginBottom: 40, padding: "24px", background: "#f5f5f7", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "space-between", border: "1px solid rgba(0,0,0,0.04)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 24 }}>💻</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 900, color: "#1d1d1f" }}>Include Boss Battle</div>
                <div style={{ fontSize: 12, color: "#86868b", fontWeight: 600 }}>Add a coding challenge at the end</div>
              </div>
            </div>
            <button onClick={() => setIncludeCoding(!includeCoding)}
              style={{ width: 64, height: 32, borderRadius: 100, border: "none", cursor: "pointer", background: includeCoding ? "var(--teal)" : "#e5e5ea", position: "relative", transition: "0.3s" }}>
              <motion.div animate={{ x: includeCoding ? 32 : 4 }} style={{ width: 24, height: 24, background: "white", borderRadius: "50%", position: "absolute", top: 4 }} />
            </button>
          </div>

          {/* Final CTA */}
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={startExam}
            style={{ width: "100%", padding: "20px", fontSize: 18, fontWeight: 900, background: "var(--teal)", color: "white", borderRadius: 24, border: "none", cursor: "pointer", boxShadow: "0 20px 40px rgba(0,255,140,0.2)" }}>
            🚀 DEPLOY TO FIELD
          </motion.button>
        </div>
      </motion.div>
    );
  }

  /* ── EXAM SCREEN ── */
  if (examState === "exam") {
    if (isCodingPhase && codingQuestion) {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ background: "white", borderRadius: 24, border: `2px solid ${color}`, padding: 32, boxShadow: "var(--shadow-lg)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: color, animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: 13, fontWeight: 800, color, textTransform: "uppercase", letterSpacing: 1 }}>Final Phase — Coding</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: timeLeft < 60 ? "#ff3b30" : color }}>{formatTime(timeLeft)}</div>
            </div>

            <div style={{ background: "#f5f5f7", borderRadius: 20, padding: 24, marginBottom: 28, border: "1.5px solid rgba(0,0,0,0.04)" }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1d1d1f", marginBottom: 12 }}>{codingQuestion.title}</h3>
              <p style={{ fontSize: 15, color: "#424245", lineHeight: 1.6, marginBottom: 16 }}>{codingQuestion.desc}</p>

              <div style={{ background: "white", borderRadius: 12, padding: "12px 16px", marginBottom: 16, border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#86868b", textTransform: "uppercase", marginBottom: 6 }}>Example Test Case:</div>
                <div style={{ fontSize: 13, fontFamily: "var(--font-mono)", color: color, fontWeight: 600 }}>{codingQuestion.testCases}</div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, background: "white", color: "#86868b", padding: "4px 10px", borderRadius: 12 }}>{codingQuestion.company}</span>
              </div>
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 10, textTransform: "uppercase" }}>Implementation Logic:</div>
            <textarea value={codingResponse} onChange={e => setCodingResponse(e.target.value)}
              placeholder="Explain your approach or write starter logic here..."
              style={{ width: "100%", height: 200, padding: 20, borderRadius: 16, border: "1.5px solid var(--border)", background: "#1e1e1e", color: "#d4d4d4", outline: "none", fontSize: 14, fontFamily: "var(--font-mono)", resize: "none", marginBottom: 28 }} />

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleFinish()}
              style={{ width: "100%", padding: "18px", fontSize: 16, fontWeight: 800, background: color, color: "white", borderRadius: 16, border: "none", cursor: "pointer", boxShadow: `0 8px 24px ${color}44` }}>
              💾 Complete & Submit Final Results
            </motion.button>
          </div>
        </motion.div>
      );
    }

    const question = examQuestions[currentQ];
    const diffData = { Easy: { color: "#34c759", bg: "#e8f9ee" }, Medium: { color: "#ff9500", bg: "#fff4e6" }, Hard: { color: "#ff3b30", bg: "#fff1f0" } }[question?.difficulty] || { color: "#86868b", bg: "#f5f5f7" };
    const timerPct = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;
    const timerColor = timerPct > 51 ? "#34c759" : timerPct > 21 ? "#ff9500" : "#ff3b30";

    return (
      <div>
        <div style={{ background: "white", borderRadius: 18, padding: "14px 22px", marginBottom: 16, boxShadow: "var(--shadow)", border: "1.5px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color, background: `${color}12`, padding: "4px 12px", borderRadius: 20 }}>THEORY PHASE</span>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Q {currentQ + 1} / {examQuestions.length}</span>
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: timerColor, fontFamily: "var(--font-mono)" }}>{formatTime(timeLeft)}</span>
        </div>

        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: "white", borderRadius: 24, padding: 32, boxShadow: "var(--shadow-lg)", border: "1.5px solid var(--border)", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: diffData.color, background: diffData.bg, padding: "3px 10px", borderRadius: 20 }}>{question?.difficulty}</span>
          </div>
          <p style={{ fontSize: 19, fontWeight: 700, color: "#1d1d1f", marginBottom: 24, lineHeight: 1.5 }}>{question?.q}</p>

          <div style={{ fontSize: 12, fontWeight: 700, color: "#86868b", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
            {question?.options ? "Select the correct answer" : "Your Answer (One line explanation)"}
          </div>

          {question?.options ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
              {question.options.map((opt, i) => (
                <button key={i} onClick={() => setUserResponse(opt)}
                  style={{
                    padding: "16px 20px", borderRadius: 16, border: `2px solid ${userResponse === opt ? color : "var(--border)"}`,
                    background: userResponse === opt ? `${color}10` : "white",
                    color: userResponse === opt ? color : "#1d1d1f",
                    fontSize: 15, fontWeight: 600, cursor: "pointer", textAlign: "left", transition: "all 0.2s",
                    display: "flex", gap: 12, alignItems: "center"
                  }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${userResponse === opt ? color : "#d2d2d7"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {userResponse === opt && <div style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />}
                  </div>
                  {opt}
                </button>
              ))}
            </div>
          ) : (
            <textarea value={userResponse} onChange={e => setUserResponse(e.target.value)}
              placeholder="Type your answer here... inclusion of important terms earns marks."
              style={{ width: "100%", height: 100, padding: 16, borderRadius: 16, border: "1.5px solid var(--border)", background: "#f5f5f7", outline: "none", fontSize: 15, fontFamily: "inherit", resize: "none", marginBottom: 24 }} />
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <motion.button disabled={!userResponse.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={submitCurrentAnswer}
              style={{ flex: 1, padding: "14px", fontSize: 15, fontWeight: 700, background: userResponse.trim() ? color : "#e5e5ea", color: "white", borderRadius: 14, border: "none", cursor: userResponse.trim() ? "pointer" : "default" }}>
              Submit Answer & Next →
            </motion.button>
            <button onClick={skipQuestion} style={{ padding: "14px 20px", fontSize: 14, fontWeight: 600, color: "#86868b", background: "white", border: "1.5px solid var(--border)", borderRadius: 14, cursor: "pointer" }}>Skip</button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ── RESULTS SCREEN ── */
  const correct = answers.filter(a => a?.correct).length;
  const total = examQuestions.length;
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  const gradeInfo = getGrade(score);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      {/* Grade card */}
      <div style={{ background: "white", borderRadius: 24, overflow: "hidden", boxShadow: "var(--shadow-lg)", marginBottom: 16, border: "1.5px solid var(--border)" }}>
        <div style={{ height: 6, background: `linear-gradient(90deg, ${gradeInfo.color}, ${gradeInfo.color}77)` }} />
        <div style={{ padding: "40px 36px", textAlign: "center" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 14 }}
            style={{ width: 120, height: 120, borderRadius: "50%", background: `${gradeInfo.color}15`, border: `4px solid ${gradeInfo.color}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <div style={{ fontSize: 38, fontWeight: 900, color: gradeInfo.color, lineHeight: 1 }}>{gradeInfo.grade}</div>
          </motion.div>
          <div style={{ fontSize: 48, fontWeight: 900, color: "#1d1d1f", letterSpacing: -2, marginBottom: 4 }}>{score}%</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: gradeInfo.color, marginBottom: 6 }}>{gradeInfo.label}</div>
          <div style={{ fontSize: 13, color: "#86868b", fontWeight: 500 }}>Theory: {correct}/{total} Correct · Time: {formatTime(timeTaken)}</div>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setExamState("setup"); setAnswers([]); setExamQuestions([]); }}
          style={{ padding: "13px 28px", fontSize: 14, fontWeight: 700, background: color, color: "white", borderRadius: 14, border: "none", cursor: "pointer", boxShadow: `0 4px 16px ${color}44` }}>
          🔄 New Exam
        </motion.button>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={startExam}
          style={{ padding: "13px 28px", fontSize: 14, fontWeight: 700, background: "white", color: "#424245", border: "1.5px solid var(--border)", borderRadius: 14, cursor: "pointer", boxShadow: "var(--shadow-sm)" }}>
          🔀 Retry Same Settings
        </motion.button>
      </div>

      {/* Answer review */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f", marginBottom: 14, letterSpacing: -0.3 }}>📋 Answer Review</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {examQuestions.map((q, i) => {
          const ans = answers[i];
          const isCorrect = ans?.correct;
          const bg = isCorrect ? "#f0fdf4" : "#fff1f0";
          const c = isCorrect ? "#34c759" : "#ff3b30";
          return (
            <div key={i} style={{ background: "white", borderRadius: 16, border: "1.5px solid var(--border)", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1d1d1f" }}>Question {i + 1}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: c, background: `${c}12`, padding: "4px 10px", borderRadius: 20 }}>{isCorrect ? "MATCHED" : "MISMATCHED"}</div>
              </div>
              <div style={{ padding: "16px 20px" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#1d1d1f", marginBottom: 12 }}>{q.q}</p>
                <div style={{ fontSize: 12, background: "#f5f5f7", padding: 12, borderRadius: 10, color: "#424245" }}>
                  <span style={{ fontWeight: 700, color: "#86868b" }}>YOUR ANSWER:</span> {ans?.user || "(No answer)"}
                </div>
                <div style={{ fontSize: 12, background: `${color}08`, padding: 12, borderRadius: 10, color: "#1d1d1f", marginTop: 8 }}>
                  <span style={{ fontWeight: 700, color }}>EXPECTED TERMS:</span> {q.a}
                </div>
              </div>
            </div>
          );
        })}

        {codingQuestion && (
          <div style={{ background: "white", borderRadius: 16, border: `2px solid ${color}`, overflow: "hidden", marginTop: 10 }}>
            <div style={{ padding: "16px 20px", background: `${color}08`, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `2.5px solid ${color}` }}>
              <div style={{ fontWeight: 800, fontSize: 14, color }}>🏁 FINAL CODING PHASE</div>
            </div>
            <div style={{ padding: "20px" }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{codingQuestion.title}</h4>
              <p style={{ fontSize: 13, color: "#86868b", marginBottom: 16 }}>{codingQuestion.desc}</p>
              <div style={{ fontSize: 12, background: "#1e1e1e", padding: 16, borderRadius: 12, color: "#d4d4d4", fontFamily: "var(--font-mono)", whiteSpace: "pre-wrap" }}>
                <span style={{ color: "#86868b", fontWeight: 700, display: "block", marginBottom: 8, fontFamily: "inherit" }}>YOUR LOGIC:</span>
                {codingResponse || "(No implementation logic provided)"}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

/* ============================================================
   PERFORMANCE BOT / REPORT COMPONENT
============================================================ */
const PerformanceReport = ({ analytics, onClose }) => {
  const { sessions, streak } = analytics;
  const now = new Date();
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

  const last30Days = new Set(sessions.filter(s => new Date(s.date) > thirtyDaysAgo).map(s => s.date.split("T")[0])).size;
  const consistency = Math.round((last30Days / 30) * 100);

  const thisMonth = sessions.filter(s => new Date(s.date).getMonth() === now.getMonth());
  const lastMonth = sessions.filter(s => new Date(s.date).getMonth() === (now.getMonth() === 0 ? 11 : now.getMonth() - 1));
  const avgThis = thisMonth.length ? thisMonth.reduce((acc, s) => acc + (s.score || 0), 0) / thisMonth.length : 0;
  const avgLast = lastMonth.length ? lastMonth.reduce((acc, s) => acc + (s.score || 0), 0) / lastMonth.length : 0;
  const improvement = Math.round(avgThis - avgLast);

  const difficultyMap = sessions.reduce((acc, s) => { acc[s.difficulty] = (acc[s.difficulty] || 0) + 1; return acc; }, {});
  const topicStats = sessions.reduce((acc, s) => {
    if (!acc[s.topic]) acc[s.topic] = { total: 0, count: 0 };
    acc[s.topic].total += (s.score || 0);
    acc[s.topic].count += 1;
    return acc;
  }, {});

  const topicEntries = Object.entries(topicStats);
  const strongestTopic = topicEntries.length ? topicEntries.reduce((best, curr) => {
    const avg = curr[1].total / curr[1].count;
    return avg > best.avg ? { name: curr[0], avg } : best;
  }, { name: "N/A", avg: 0 }) : { name: "N/A", avg: 0 };

  const weakTopic = topicEntries.length ? topicEntries.reduce((worst, curr) => {
    const avg = curr[1].total / curr[1].count;
    return avg < worst.avg ? { name: curr[0], avg } : worst;
  }, { name: "N/A", avg: 101 }) : { name: topicEntries.length ? topicEntries[0][0] : "N/A", avg: 0 };

  const Card = ({ title, value, sub, icon, color }) => (
    <div style={{ background: "white", borderRadius: 20, padding: 20, border: "1.5px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 20 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#86868b", textTransform: "uppercase" }}>{title}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: color || "#1d1d1f" }}>{value}</div>
      <div style={{ fontSize: 12, color: "#86868b", marginTop: 4 }}>{sub}</div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ width: "95%", maxWidth: 900, maxHeight: "90vh", background: "#FFFFFF", borderRadius: 40, overflow: "hidden", position: "relative", boxShadow: "0 60px 120px rgba(0,0,0,0.15)", border: "1px solid #F0F0F0" }}>
        <div style={{ padding: "40px 48px", background: "white", borderBottom: "1px solid #F5F5F7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: 32, fontWeight: 900, letterSpacing: -1.5, color: "#1D1D1F" }}>Learning Intelligence</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 16, fontWeight: 600 }}>A deep dive into your DSA journey and proficiency</p>
          </div>
          <button onClick={onClose} style={{ width: 48, height: 48, borderRadius: "50%", background: "#F5F5F7", fontSize: 24, color: "#1D1D1F", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.2s", border: "none" }}>×</button>
        </div>
        <div style={{ padding: 40, overflowY: "auto", maxHeight: "calc(90vh - 110px)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            <Card title="Consistency Score" value={`${consistency}%`} sub={`Practiced ${last30Days} days this month`} icon="📅" color="#0071e3" />
            <Card title="Improvement Tracker" value={`${improvement >= 0 ? "+" : ""}${improvement}%`} sub={`Vs previous month accuracy`} icon="📈" color={improvement >= 0 ? "#34c759" : "#ff3b30"} />
            <Card title="Solving Streak" value={`${streak} Days`} sub="Keep the momentum going!" icon="🔥" color="#ff9500" />
            <Card title="Avg Accuracy" value={`${sessions.length ? Math.round(sessions.reduce((a, b) => a + (b.score || 0), 0) / sessions.length) : 0}%`} sub="Overall performance" icon="🎯" color="#af52de" />
            <Card title="Strongest Topic" value={strongestTopic.name} sub={`${Math.round(strongestTopic.avg)}% average score`} icon="🏆" color="#34c759" />
            <Card title="Improvement Area" value={weakTopic.name} sub="Needs more practice" icon="⚠️" color="#ff3b30" />
          </div>
          <div style={{ marginTop: 32, background: "white", borderRadius: 24, padding: 32, border: "1.5px solid var(--border)" }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📊 Difficulty Learning Curve</div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: 180, padding: "20px 0" }}>
              {["Beginner", "Intermediate", "Advanced"].map(lvl => {
                const count = difficultyMap[lvl] || 0;
                const max = Math.max(...Object.values(difficultyMap), 1);
                const h = (count / max) * 140;
                return (
                  <div key={lvl} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: lvl === "Beginner" ? "#34c759" : lvl === "Intermediate" ? "#ff9500" : "#ff3b30" }}>{count}</div>
                    <motion.div initial={{ height: 0 }} animate={{ height: h + 10 }} style={{ width: "100%", maxWidth: 64, background: `linear-gradient(180deg, ${lvl === "Beginner" ? "#34c759" : lvl === "Intermediate" ? "#ff9500" : "#ff3b30"}, ${lvl === "Beginner" ? "#34c75988" : lvl === "Intermediate" ? "#ff950088" : "#ff3b3088"})`, borderRadius: "12px 12px 4px 4px" }} />
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#1d1d1f" }}>{lvl}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

/* ============================================================
   PROGRESS TRACKING DASHBOARD (LEETCODE STYLE)
============================================================ */
const ProgressTrackingDashboard = ({ analytics, onClose }) => {
  const { sessions = [], streak = 0 } = analytics;

  const totalSolved = sessions.length;
  const difficulties = sessions.reduce((acc, s) => {
    acc[s.difficulty || "Beginner"] = (acc[s.difficulty || "Beginner"] || 0) + 1;
    return acc;
  }, { "Beginner": 0, "Intermediate": 0, "Advanced": 0 });

  const easy = difficulties["Beginner"];
  const med = difficulties["Intermediate"];
  const hard = difficulties["Advanced"];
  const acceptance = totalSolved > 0 ? "100" : "0";

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}>
      <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{ width: "95%", maxWidth: 1100, height: "85vh", background: "#1a1a1a", border: "1.5px solid #333", borderRadius: 24, padding: 40, display: "flex", flexDirection: "column", gap: 32, boxShadow: "0 40px 100px rgba(0,0,0,0.6)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 32, fontSize: 18, fontWeight: 700 }}>
            <span style={{ color: "white", paddingBottom: 12, borderBottom: "3px solid white" }}>Practice History</span>
            <span style={{ color: "#555", paddingBottom: 12, cursor: "not-allowed" }}>Summary</span>
          </div>
          <button onClick={onClose} style={{ width: 44, height: 44, borderRadius: "50%", background: "#262626", border: "none", color: "#8c8c8c", fontSize: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>

        {/* Content Body */}
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: 32, flex: 1, overflow: "hidden" }}>

          {/* Left Panel */}
          <div style={{ background: "#262626", borderRadius: 20, padding: 32, position: "relative", overflowY: "auto", border: "1px solid #333" }}>
            {sessions.length === 0 ? (
              <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32 }}>
                <div style={{ fontSize: 120, fontWeight: 900, color: "rgba(255,255,255,0.03)", userSelect: "none" }}>Null</div>
                <button onClick={onClose} style={{ padding: "14px 40px", background: "white", color: "black", borderRadius: 100, fontSize: 16, fontWeight: 900, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 10px 30px rgba(255,255,255,0.1)" }}>
                  <span style={{ fontSize: 20 }}>▶</span> Practice
                </button>
              </div>
            ) : (
              <table style={{ width: "100%", textAlign: "left", borderCollapse: "separate", borderSpacing: "0 12px" }}>
                <thead style={{ position: "sticky", top: 0, background: "#262626", zIndex: 10 }}>
                  <tr style={{ color: "#8c8c8c", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5 }}>
                    <th style={{ paddingBottom: 16 }}>Last Submitted</th>
                    <th style={{ paddingBottom: 16 }}>Problem</th>
                    <th style={{ paddingBottom: 16 }}>Last Result</th>
                    <th style={{ paddingBottom: 16 }}>Submissions</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice().reverse().map((s, idx) => (
                    <tr key={idx} style={{ background: "#1a1a1a", border: "1px solid #333" }}>
                      <td style={{ padding: "16px 20px", borderRadius: "12px 0 0 12px", fontSize: 14, color: "#8c8c8c" }}>{new Date(s.date).toLocaleDateString()}</td>
                      <td style={{ padding: "16px 20px", fontSize: 15, fontWeight: 800, color: "white" }}>{s.topic}</td>
                      <td style={{ padding: "16px 20px", fontSize: 14, color: "#00b8a3", fontWeight: 700 }}>Solved</td>
                      <td style={{ padding: "16px 20px", borderRadius: "0 12px 12px 0", fontSize: 14, color: "white" }}>1</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Right Panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" }}>

            {/* Summary Card */}
            <div style={{ background: "#262626", borderRadius: 20, padding: 32, border: "1px solid #333" }}>
              <h3 style={{ fontSize: 13, color: "#8c8c8c", marginBottom: 24, fontWeight: 800, textTransform: "uppercase" }}>Summary</h3>
              <div style={{ display: "flex", alignItems: "center", gap: 32, marginBottom: 32 }}>
                <div style={{ width: 100, height: 100, borderRadius: "50%", border: "10px solid #333", borderTopColor: "#ffa116", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "white" }}>{totalSolved}</div>
                    <div style={{ fontSize: 10, color: "#8c8c8c", textTransform: "uppercase", fontWeight: 800 }}>Solved</div>
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#00b8a3" }}>EASY</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: "white" }}>{easy}</span>
                    </div>
                    <div style={{ height: 4, background: "#333", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#00b8a3", width: `${(easy / (totalSolved || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#ffc01e" }}>MED.</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: "white" }}>{med}</span>
                    </div>
                    <div style={{ height: 4, background: "#333", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#ffc01e", width: `${(med / (totalSolved || 1)) * 100}%` }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#ef4743" }}>HARD</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: "white" }}>{hard}</span>
                    </div>
                    <div style={{ height: 4, background: "#333", borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", background: "#ef4743", width: `${(hard / (totalSolved || 1)) * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#ffa116", fontWeight: 900, textAlign: "right", letterSpacing: 0.5 }}>🔥 Streak: {streak} Days</div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "#262626", borderRadius: 16, padding: 24, border: "1px solid #333" }}>
                <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 12, fontWeight: 800 }}>SUBMISSIONS</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#bf5af2" }}>{totalSolved}</div>
              </div>
              <div style={{ background: "#262626", borderRadius: 16, padding: 24, border: "1px solid #333" }}>
                <div style={{ fontSize: 11, color: "#8c8c8c", marginBottom: 12, fontWeight: 800 }}>ACCEPTANCE</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: "#00b8a3" }}>{acceptance}%</div>
              </div>
            </div>

            {/* Placeholder for Analytics */}
            <div style={{ background: "#262626", borderRadius: 20, padding: 24, flex: 1, border: "1px solid #333", minHeight: 180 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div style={{ background: "#1a1a1a", padding: 6, borderRadius: 10, display: "flex", gap: 8 }}>
                  <span style={{ background: "#333", padding: "4px 12px", borderRadius: 6, fontSize: 11, fontWeight: 800, color: "white" }}>Solved</span>
                  <span style={{ padding: "4px 12px", fontSize: 11, fontWeight: 800, color: "#555" }}>History</span>
                </div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#8c8c8c" }}>2026-03 ▾</div>
              </div>
              <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", borderBottom: "1px solid #333", marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#555", fontWeight: 700 }}>No activity data found</div>
              </div>
              <div style={{ display: "flex", gap: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#00b8a3" }}>Easy 0</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#ffc01e" }}>Med. 0</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4743" }}>Hard 0</div>
              </div>
            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
};

const CodeArenaTab = ({ logSession }) => {
  const [progress, saveProgress] = useProgress();
  const [selMod, setSelMod] = useState(null);
  const [selLevel, setSelLevel] = useState("Beginner");
  const [selChallenge, setSelChallenge] = useState(null);

  if (selChallenge) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 20000, background: "white", animation: "fadeIn 0.3s ease-out" }}>
      <CodingChallengeScreen challenge={selChallenge} progress={progress} saveProgress={saveProgress} module={selMod} level={selLevel} onBack={() => setSelChallenge(null)} logSession={logSession} />
    </div>
  );

  const challenges = selMod ? (CODING_CHALLENGES[selMod]?.[selLevel] || []) : [];
  const color = selMod ? (MOD_COLORS[selMod] || "#0071e3") : "#0071e3";

  return (
    <div style={{ animation: "fadeIn 0.6s ease-out" }}>
      {!selMod ? (
        <div style={{ animation: "fadeIn 0.5s ease-out" }}>
          <div style={{ marginBottom: 60, textAlign: "center" }}>
            <h2 style={{ fontSize: 56, fontWeight: 900, letterSpacing: -2, color: "#1D1D1F", marginBottom: 20 }}>Battle Arena</h2>
            <p style={{ color: "var(--text-muted)", fontSize: 22, maxWidth: 640, margin: "0 auto", fontWeight: 500 }}>Choose a domain to start your implementation journey.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {MODULES.map((m, i) => {
              const c = MOD_COLORS[m];
              const desc = MOD_DESCS[m];
              return (
                <motion.div
                  key={m} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                  whileHover={{ y: -10, boxShadow: "var(--shadow-lg)" }}
                  onClick={() => setSelMod(m)}
                  style={{ background: "white", borderRadius: 40, padding: "40px", border: "1.5px solid #F0F0F0", cursor: "pointer", transition: "all 0.4s cubic-bezier(0.22, 1, 0.36, 1)" }}
                >
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: `${c}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 28, border: "1.5px solid #F0F0F0" }}>{MOD_ICONS[m]}</div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, color: "#1D1D1F", marginBottom: 12, letterSpacing: -0.5 }}>{m}</h3>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600, lineHeight: 1.6 }}>{desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ animation: "fadeIn 0.4s ease-out" }}>
          <button onClick={() => setSelMod(null)} style={{ background: "none", border: "none", color: "var(--teal)", fontWeight: 900, fontSize: 15, cursor: "pointer", marginBottom: 32, display: "flex", alignItems: "center", gap: 8 }}>
            ‹ BACK TO MODULES
          </button>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 48, gap: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{MOD_ICONS[selMod]}</div>
                <h2 style={{ fontSize: 40, fontWeight: 900, color: "#1D1D1F", letterSpacing: -1.5 }}>{selMod} Challenges</h2>
              </div>
              <p style={{ color: "var(--text-muted)", fontSize: 18, fontWeight: 600 }}>Solve production-grade problems from companies like Google, Meta, and Amazon.</p>
            </div>

            <div style={{ display: "flex", gap: 10, background: "#F5F5F7", padding: 8, borderRadius: 100, border: "1.5px solid #EEE" }}>
              {LEVELS.map(l => (
                <button key={l} onClick={() => setSelLevel(l)} style={{
                  padding: "12px 28px", borderRadius: 100, fontSize: 13, fontWeight: 900,
                  background: selLevel === l ? "white" : "transparent",
                  color: selLevel === l ? "#1D1D1F" : "#86868B",
                  border: "none", transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                  boxShadow: selLevel === l ? "0 8px 16px rgba(0,0,0,0.08)" : "none",
                  cursor: "pointer"
                }}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <ProgressCard module={selMod} progress={progress} total={challenges.length || 9} type="code" />

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 40 }}>
            {challenges.length > 0 ? challenges.map((ch, i) => {
              const key = `code_${selMod}_${ch.id}`;
              const status = progress[key];
              return (
                <motion.div key={ch.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  whileHover={{ x: 6, boxShadow: "0 20px 40px rgba(0,0,0,0.05)" }} style={{ background: "white", border: "1.5px solid", borderColor: status === "solved" ? "var(--teal)" : "#F0F0F0", borderRadius: 28, padding: "32px 40px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.3s" }}
                  onClick={() => setSelChallenge(ch)}>
                  <div>
                    <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 900, color: "var(--teal)", background: "#E5F1FF", padding: "4px 12px", borderRadius: 8 }}>{selLevel.toUpperCase()}</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#86868B", background: "#F5F5F7", padding: "4px 12px", borderRadius: 8 }}>{ch.company.toUpperCase()}</span>
                      {status === "solved" && <span style={{ fontSize: 11, fontWeight: 900, color: "#34C759" }}>✓ SOLVED</span>}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#1D1D1F", marginBottom: 8, letterSpacing: -0.5 }}>{ch.title}</div>
                    <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6, maxWidth: 700 }}>{ch.desc}</p>
                  </div>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F5F5F7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: 40, border: "2px solid white", boxShadow: "0 10px 20px rgba(0,0,0,0.05)" }}>
                    <span style={{ color: "#1D1D1F", fontSize: 24, fontWeight: 900 }}>→</span>
                  </div>
                </motion.div>
              );
            }) : (
              <div style={{ padding: 100, textAlign: "center", color: "#86868B", fontWeight: 600 }}>No {selLevel} challenges found for this module yet.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const CodingChallengeScreen = ({ challenge, progress, saveProgress, module: mod, level, onBack, logSession }) => {
  const [code, setCode] = useState(challenge.starter);
  const [analysis, setAnalysis] = useState(null);
  const [activeTab, setActiveTab] = useState("desc"); // desc, solution
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState(null);

  const color = MOD_COLORS[mod] || "#0071e3";
  const key = `code_${mod}_${challenge.id}`;
  const isSolved = progress[key] === "solved";

  const handleRun = () => {
    if (!code || !code.trim()) {
      setOutput("Terminal Clear: Waiting for code...");
      setAnalysis(null);
      setTerminalOpen(true);
      return;
    }
    setRunning(true);
    setTerminalOpen(true);
    setTimeout(() => {
      const res = analyzeCode(code);
      setAnalysis(res);
      setOutput(res.errors.length > 0 ? "Compilation failed. Check errors below." : "Test Cases Passed! ✓\nAll tests cleared.");
      setRunning(false);
    }, 800);
  };

  const handleSubmit = () => {
    setRunning(true);
    setTimeout(() => {
      const res = analyzeCode(code);
      if (res.errors.length === 0) {
        saveProgress(key, "solved");
        logSession({ type: "code", topic: mod, score: 100, difficulty: level, id: challenge.id });
        setOutput("Success! Submission accepted.\nDifficulty: " + level + "\nPoints: +100 XP");
        // Sound of joy
        new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3').play().catch(() => { });
      } else {
        setOutput("Submission failed. Please fix compilation errors.");
      }
      setRunning(false);
      setTerminalOpen(true);
    }, 1200);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#FFFFFF", color: "#1D1D1F", fontFamily: "var(--font)" }}>
      {/* Top Nav */}
      <div style={{ height: 60, borderBottom: "1px solid #F0F0F0", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--teal)", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            ‹ DASHBOARD
          </button>
          <div style={{ height: 20, width: 1, background: "#EEE" }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F" }}>
            {mod} / {challenge.title}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={handleRun} disabled={running} style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid #D2D2D7", background: "white", color: "#1D1D1F", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            {running ? "Running..." : "Run Code"}
          </button>
          <button onClick={handleSubmit} disabled={running} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "var(--teal)", color: "white", fontSize: 13, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
            Submit
          </button>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#F5F5F7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🧑‍💻</div>
        </div>
      </div>

      {/* Main Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Left Side: Description */}
        <div style={{ width: "40%", borderRight: "1px solid #F0F0F0", display: "flex", flexDirection: "column", background: "#FDFDFD" }}>
          <div style={{ display: "flex", borderBottom: "1px solid #F0F0F0", background: "white" }}>
            {[["desc", "Description"], ["sol", "Solution"]].map(([t, l]) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{
                padding: "16px 24px", fontSize: 13, fontWeight: 700, border: "none", background: "none",
                color: activeTab === t ? "var(--teal)" : "#86868B",
                borderBottom: activeTab === t ? "2px solid var(--teal)" : "none",
                cursor: "pointer"
              }}>{l.toUpperCase()}</button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "40px" }}>
            {activeTab === "desc" ? (
              <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: "white", background: level === "Beginner" ? "#34C759" : level === "Intermediate" ? "#FF9500" : "#FF3B30", padding: "4px 10px", borderRadius: 6 }}>{level.toUpperCase()}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#86868B", background: "#F5F5F7", padding: "4px 10px", borderRadius: 6 }}>{challenge.company.toUpperCase()}</span>
                  {isSolved && <span style={{ fontSize: 11, fontWeight: 900, color: "#34C759" }}>✓ SOLVED</span>}
                </div>

                <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: -1, marginBottom: 16 }}>{challenge.title}</h1>
                <p style={{ fontSize: 16, lineHeight: 1.7, color: "#424245", marginBottom: 32 }}>{challenge.desc}</p>

                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1D1D1F", marginBottom: 12 }}>EXAMPLES</h3>
                <div style={{ background: "#F8F8F8", borderRadius: 12, padding: 20, border: "1.5px solid #F0F0F0", marginBottom: 24 }}>
                  <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 14, fontFamily: "var(--font-mono)", color: "#1D1D1F", fontWeight: 600 }}>{challenge.testCases}</pre>
                </div>

                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#1D1D1F", marginBottom: 12 }}>CONSTRAINTS</h3>
                <ul style={{ paddingLeft: 20, color: "var(--text-muted)", fontSize: 14, lineHeight: 1.8 }}>
                  <li>Time Limit: 1.0s</li>
                  <li>Memory Limit: 256MB</li>
                  <li>Valid Java 11+ syntax required</li>
                </ul>
              </div>
            ) : (
              <div style={{ animation: "fadeIn 0.3s ease-out" }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Official Solution</h2>
                <div style={{ background: "#1D2126", borderRadius: 16, padding: 20, color: "#ABB2BF", overflow: "hidden" }}>
                  <pre style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}><code>{challenge.solution}</code></pre>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Editor & Terminal */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#f8f9fa" }}>
          {/* Toolbar */}
          <div style={{ height: 48, background: "white", borderBottom: "1px solid #F0F0F0", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--teal)" }}>JAVA (OPENJDK 11)</span>
            </div>
            <button onClick={() => setCode(challenge.starter)} style={{ border: "none", background: "none", fontSize: 11, fontWeight: 800, color: "#86868B", cursor: "pointer" }}>RESET TO STARTER</button>
          </div>

          <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>
            <Editor
              height="100%"
              defaultLanguage="java"
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val)}
              options={{
                minimap: { enabled: false },
                fontSize: 15,
                lineNumbers: "on",
                fontFamily: "var(--font-mono)",
                lineHeight: 1.8,
                padding: { top: 20 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth"
              }}
            />
          </div>

          {/* Terminal Drawer */}
          <div style={{
            height: terminalOpen ? 240 : 40, background: "#1D2126", borderTop: "4px solid #333",
            transition: "height 0.3s cubic-bezier(0.22, 1, 0.36, 1)", overflow: "hidden", display: "flex", flexDirection: "column"
          }}>
            <div onClick={() => setTerminalOpen(!terminalOpen)} style={{ height: 40, display: "flex", alignItems: "center", padding: "0 20px", cursor: "pointer", background: "#2D2D2D" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "white", flex: 1 }}>{terminalOpen ? "▼ TERMINAL" : "▲ CONSOLE OUT"}</span>
              {running && <div style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "white", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />}
            </div>

            <div style={{ flex: 1, padding: 24, overflowY: "auto", fontFamily: "var(--font-mono)" }}>
              {output ? (
                <div style={{ animation: "fadeIn 0.2s" }}>
                  <div style={{ color: output.includes("Clear") ? "#86868B" : output.includes("failed") ? "#FF3B30" : "#34C759", fontWeight: 800, marginBottom: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                    {output.includes("failed") ? "❌" : output.includes("Passed") || output.includes("Success") ? "✅" : "ℹ️"} {output.split('\n')[0]}
                  </div>
                  <pre style={{ margin: 0, color: "#AAA", fontSize: 12, whiteSpace: "pre-wrap" }}>{output.split('\n').slice(1).join('\n')}</pre>

                  {analysis && analysis.errors.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      {analysis.errors.map((e, i) => (
                        <div key={i} style={{ color: "#FF3B30", fontSize: 12, marginBottom: 4 }}>Error: {e.msg}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ color: "#666", fontSize: 12 }}>Run your code to see results here...</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProgressCard = ({ module: mod, progress, total, type }) => {
  const color = MOD_COLORS[mod] || "#0071e3";
  let done, correct, wrong;
  if (type === "interview") {
    const keys = INTERVIEW_DATA[mod]?.map((_, i) => `interview_${mod}_q${i}`) || [];
    done = keys.filter(k => progress[k] !== undefined).length;
    correct = keys.filter(k => progress[k] === "correct").length;
    wrong = keys.filter(k => progress[k] === "wrong").length;
    total = keys.length;
  } else {
    const allChallenges = Object.values(CODING_CHALLENGES[mod] || {}).flat();
    done = allChallenges.filter(ch => progress[`code_${mod}_${ch.id}`] === "solved").length;
    correct = done; wrong = 0;
    total = allChallenges.length || 9;
  }
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <motion.div whileHover={{ y: -5 }} style={{ background: "white", border: "1.5px solid #F0F0F0", borderRadius: 32, padding: "32px 40px", marginBottom: 32, boxShadow: "0 20px 40px rgba(0,0,0,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--teal)", background: "#E5F1FF", padding: "6px 14px", borderRadius: 8, display: "inline-block", marginBottom: 12 }}>{mod.toUpperCase()} PROGRESS</div>
          <div style={{ fontSize: 44, fontWeight: 900, color: "#1D1D1F", letterSpacing: -2 }}>{pct}% <span style={{ fontSize: 18, color: "var(--text-muted)", fontWeight: 700, letterSpacing: 0 }}>COMPLETED</span></div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 16, color: "var(--text-muted)", fontWeight: 800 }}>{done} / {total} Units</div>
          {type === "interview" && <div style={{ fontSize: 13, color: "#34C759", fontWeight: 700, marginTop: 4 }}>✓ {correct} Correct</div>}
        </div>
      </div>
      <div style={{ height: 12, background: "#F5F5F7", borderRadius: 10, overflow: "hidden" }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: "100%", background: "var(--teal)", borderRadius: 10 }} />
      </div>
    </motion.div>
  );
};

/* ============================================================
   MODULE SCREEN
============================================================ */
const MODULE_TABS = [["concept", "📖 Concept"], ["visual", "🎬 Visualizer"], ["program", "💻 Code"]];

const ModuleScreen = ({ module: mod, data, subScreen, setSubScreen, onBack, logSession }) => {
  const color = MOD_COLORS[mod] || "#0071e3";

  // Auto-open concept tab when first entering the module
  useEffect(() => {
    if (!subScreen) setSubScreen("concept");
  }, [mod]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sticky header with breadcrumb + tabs */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", background: "rgba(245,245,247,0.9)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 32px", height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 5, color: "#0071e3", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "5px 10px", borderRadius: 8, background: "rgba(0,113,227,0.07)", transition: "background 0.2s" }}>‹ Modules</button>
            <span style={{ color: "#d2d2d7", fontSize: 16 }}>/</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 16 }}>{MOD_ICONS[mod]}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#1d1d1f" }}>{mod}</span>
            </div>
          </div>
          {/* Inline tab switcher */}
          <div style={{ display: "flex", gap: 2, background: "rgba(0,0,0,0.05)", borderRadius: 12, padding: 3 }}>
            {MODULE_TABS.map(([s, l]) => (
              <button key={s} onClick={() => setSubScreen(s)}
                style={{
                  padding: "6px 18px", fontSize: 13, fontWeight: 600, borderRadius: 9, border: "none", cursor: "pointer", transition: "all 0.2s",
                  background: subScreen === s ? "white" : "transparent",
                  color: subScreen === s ? color : "#86868b",
                  boxShadow: subScreen === s ? `0 2px 8px ${color}22` : "none"
                }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {/* Active tab underline indicator */}
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "flex-end", padding: "0 32px" }}>
          <div style={{ display: "flex", width: "auto" }}>
            {MODULE_TABS.map(([s]) => (
              <div key={s} style={{ width: 72, height: 2, background: subScreen === s ? color : "transparent", transition: "background 0.2s", borderRadius: 2 }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 32px 60px" }}>
        {/* Module header — compact */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 28 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${color}25`, flexShrink: 0 }}>
            <span style={{ fontSize: 26 }}>{MOD_ICONS[mod]}</span>
          </div>
          <div>
            <h1 style={{ fontSize: "clamp(1.5rem,4vw,2.2rem)", fontWeight: 700, letterSpacing: -0.5, color: "#1d1d1f", marginBottom: 3 }}>{mod}</h1>
            <div style={{ display: "flex", gap: 6 }}>
              {MODULE_TABS.map(([s, l]) => (
                <button key={s} onClick={() => setSubScreen(s)}
                  style={{
                    padding: "3px 12px", fontSize: 11, fontWeight: 600, borderRadius: 20, border: "none", cursor: "pointer", transition: "all 0.2s",
                    background: subScreen === s ? color : "transparent",
                    color: subScreen === s ? "white" : "#86868b"
                  }}>
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {subScreen === "concept" && data && (
            <motion.div key="c" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ ease: [0.22, 1, 0.36, 1] }}>
              <ConceptPanel data={data} color={color} />
            </motion.div>
          )}
          {subScreen === "visual" && (
            <motion.div key="v" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ ease: [0.22, 1, 0.36, 1] }}>
              <VisualPanel module={mod} color={color} />
            </motion.div>
          )}
          {subScreen === "program" && data && (
            <motion.div key="p" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ ease: [0.22, 1, 0.36, 1] }}>
              <ProgramPanel data={data} module={mod} color={color} />
            </motion.div>
          )}
          {(subScreen === "concept" || subScreen === "program") && !data && (
            <motion.div key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    background: "white", border: "1.5px solid var(--border)", borderRadius: 18, padding: 24, height: 120,
                    background: "linear-gradient(90deg, #f5f5f7 25%, #e8e8ea 50%, #f5f5f7 75%)",
                    backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite"
                  }} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ConceptPanel = ({ data, color }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
    {[
      { label: "Definition", content: <p style={{ lineHeight: 1.8, fontSize: 14, color: "#424245" }}>{data.definition}</p> },
      { label: "How It Works", content: <p style={{ lineHeight: 1.8, fontSize: 14, color: "#424245" }}>{data.working}</p> },
      data.algorithm && { label: "Algorithm", content: <pre style={{ fontSize: 12, color: "#0071e3", lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "var(--font-mono)" }}>{data.algorithm}</pre>, wide: true },
      {
        label: "Time Complexity", content: (
          <div>
            {typeof data.time_complexity === "object" ? Object.entries(data.time_complexity).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, color: "#86868b", fontFamily: "var(--font-mono)" }}>{k}</span>
                <span style={{ fontSize: 13, color: "#0071e3", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{v}</span>
              </div>
            )) : <pre style={{ fontSize: 13, color: "#0071e3" }}>{JSON.stringify(data.time_complexity, null, 2)}</pre>}
            {data.space_complexity && <div style={{ marginTop: 10, padding: "8px 0", borderTop: "2px solid var(--border)" }}>
              <span style={{ fontSize: 12, color: "#86868b", fontWeight: 600 }}>Space: </span>
              <span style={{ fontSize: 13, color: "#af52de", fontFamily: "var(--font-mono)", fontWeight: 600 }}>{data.space_complexity}</span>
            </div>}
          </div>
        ), wide: true
      },
      data.advantages && { label: "✅ Advantages", content: <p style={{ lineHeight: 1.9, fontSize: 13, color: "#34c759", whiteSpace: "pre-line" }}>{data.advantages}</p> },
      data.disadvantages && { label: "❌ Disadvantages", content: <p style={{ lineHeight: 1.9, fontSize: 13, color: "#ff3b30", whiteSpace: "pre-line" }}>{data.disadvantages}</p> },
      data.applications && { label: "Applications", content: <p style={{ lineHeight: 1.9, fontSize: 13, color: "#86868b", whiteSpace: "pre-line" }}>{data.applications}</p>, wide: true },
      data.interview_notes && { label: "Interview Tips ★", content: <p style={{ lineHeight: 1.9, fontSize: 13, color: "#424245", whiteSpace: "pre-line" }}>{data.interview_notes}</p>, wide: true },
    ].filter(Boolean).map(({ label, content, wide }, i) => (
      <div key={i} style={{ background: "white", border: "1.5px solid var(--border)", borderTop: `3px solid ${color}`, borderRadius: 18, padding: 24, gridColumn: wide ? "1/-1" : undefined, boxShadow: "var(--shadow-sm)" }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, color, textTransform: "uppercase", marginBottom: 14 }}>{label}</div>
        {content}
      </div>
    ))}
  </div>
);

const ProgramPanel = ({ data, module: mod, color }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(data.java || ""); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ background: "#1d2126", borderRadius: 20, overflow: "hidden", boxShadow: "var(--shadow-lg)" }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 7 }}>{["#ff5f56", "#ffbd2e", "#27c93f"].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}</div>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{mod}.java</span>
        <button onClick={copy} style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: copied ? "#27c93f" : "rgba(255,255,255,0.35)", background: "none", cursor: "pointer", transition: "color 0.2s", fontWeight: copied ? 600 : 400 }}>
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <pre style={{ padding: 28, fontSize: 13, lineHeight: 1.9, color: "#abb2bf", overflowX: "auto", maxHeight: 520 }}><code>{data.java}</code></pre>
    </div>
  );
};

/* ============================================================
   VISUALIZERS
============================================================ */
const VisualPanel = ({ module: mod, color }) => {
  const hasViz = ["Stack", "Queue", "Linear Search", "Bubble Sort", "Selection Sort", "Insertion Sort", "Merge Sort", "Quick Sort", "Binary Search", "Linked Lists", "Recursion", "Trees", "Binary Search Trees", "Graphs"].includes(mod);
  return (
    <div style={{ background: "white", border: "1.5px solid var(--border)", borderRadius: 20, padding: 36, boxShadow: "var(--shadow)", minHeight: 400, display: "flex", flexDirection: "column", justifyContent: hasViz ? "flex-start" : "center", alignItems: hasViz ? "stretch" : "center", textAlign: "center" }}>
      {mod === "Stack" && <StackVisual color={color} />}
      {mod === "Queue" && <QueueVisual color={color} />}
      {mod === "Linear Search" && <LinearSearchVisual color={color} />}
      {mod === "Bubble Sort" && <UniversalSortVisual color={color} type="Bubble Sort" />}
      {mod === "Selection Sort" && <UniversalSortVisual color={color} type="Selection Sort" />}
      {mod === "Insertion Sort" && <UniversalSortVisual color={color} type="Insertion Sort" />}
      {mod === "Merge Sort" && <UniversalSortVisual color={color} type="Merge Sort" />}
      {mod === "Quick Sort" && <UniversalSortVisual color={color} type="Quick Sort" />}
      {mod === "Binary Search" && <BinarySearchVisual color={color} />}
      {mod === "Linked Lists" && <LinkedListVisual color={color} />}
      {mod === "Recursion" && <RecursionVisual color={color} />}
      {(mod === "Trees" || mod === "Binary Search Trees") && <TreeVisual color={color} isBST={mod === "Binary Search Trees"} />}
      {mod === "Graphs" && <GraphVisual color={color} />}
      {!hasViz && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <div style={{ fontSize: 64, marginBottom: 20 }}>🎬</div>
          <h3 style={{ fontSize: 24, fontWeight: 700, color: "#1d1d1f", marginBottom: 8 }}>{mod} Visualizer</h3>
          <p style={{ color: "#86868b", fontSize: 16, maxWidth: 400 }}>We're currently building a high-fidelity interactive simulator for this module. Stay tuned for the upcoming update!</p>
          <div style={{ marginTop: 24, display: "inline-block", padding: "8px 20px", background: `${color}12`, color, borderRadius: 20, fontSize: 13, fontWeight: 600 }}>Feature Coming Soon</div>
        </motion.div>
      )}
    </div>
  );
};

const VizBtn = ({ onClick, children, color }) => (
  <motion.button whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }} onClick={onClick}
    style={{ padding: "10px 24px", fontSize: 13, fontWeight: 600, borderRadius: 12, background: `${color}12`, color, border: `1.5px solid ${color}30`, marginRight: 10, cursor: "pointer", boxShadow: "var(--shadow-sm)" }}>
    {children}
  </motion.button>
);

function StackVisual({ color }) {
  const [stack, setStack] = useState([42, 17]);
  const [inputVal, setInputVal] = useState("");
  const pushValue = () => {
    const v = parseInt(inputVal);
    if (!isNaN(v)) { setStack(p => [...p, v]); setInputVal(""); }
    else setStack(p => [...p, Math.floor(Math.random() * 99) + 1]);
  };
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: "#86868b", textTransform: "uppercase", marginBottom: 20 }}>Stack — Last In, First Out (LIFO)</div>
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* Stack visualization */}
        <div style={{ flex: "0 0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column-reverse", alignItems: "flex-start", minHeight: 180, gap: 8, marginBottom: 20 }}>
            <AnimatePresence>
              {stack.map((item, i) => (
                <motion.div key={`${item}-${i}`} layout initial={{ opacity: 0, x: -30, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 30, scale: 0.8 }} transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  style={{ width: 180, padding: "12px 20px", background: i === stack.length - 1 ? color : `${color}12`, color: i === stack.length - 1 ? "white" : color, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, borderRadius: 12, display: "flex", justifyContent: "space-between", alignItems: "center", border: `1.5px solid ${color}30`, boxShadow: i === stack.length - 1 ? `0 4px 16px ${color}44` : "none" }}>
                  {item}{i === stack.length - 1 && <span style={{ fontSize: 10, opacity: 0.8, fontWeight: 600, letterSpacing: 0.5 }}>← TOP</span>}
                </motion.div>
              ))}
              {stack.length === 0 && (
                <div style={{ width: 180, padding: "12px 20px", border: `2px dashed ${color}40`, borderRadius: 12, color: `${color}60`, fontFamily: "var(--font-mono)", fontSize: 13, textAlign: "center" }}>Empty Stack</div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {/* Controls */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#86868b", marginBottom: 8, letterSpacing: 0.3 }}>PUSH VALUE</div>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)}
                onKeyDown={e => e.key === "Enter" && pushValue()}
                placeholder="Enter number..."
                style={{ flex: 1, padding: "10px 14px", border: `1.5px solid ${color}40`, borderRadius: 10, fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 600, color: "#1d1d1f", outline: "none", background: "#f5f5f7" }} />
              <VizBtn onClick={pushValue} color={color}>Push ↑</VizBtn>
            </div>
          </div>
          <VizBtn onClick={() => setStack(p => p.slice(0, -1))} color={color}>Pop ↓</VizBtn>
          <div style={{ marginTop: 16, padding: "12px 16px", background: `${color}08`, borderRadius: 12, border: `1px solid ${color}20` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, marginBottom: 4, letterSpacing: 0.3 }}>STATE</div>
            <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#424245" }}>Size: {stack.length} | Top: {stack.length > 0 ? stack[stack.length - 1] : "null"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QueueVisual({ color }) {
  const [queue, setQueue] = useState([10, 30, 55]);
  const [inputVal, setInputVal] = useState("");
  const enqueue = () => {
    const v = parseInt(inputVal);
    if (!isNaN(v)) { setQueue(p => [...p, v]); setInputVal(""); }
    else setQueue(p => [...p, Math.floor(Math.random() * 99) + 1]);
  };
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: "#86868b", textTransform: "uppercase", marginBottom: 20 }}>Queue — First In, First Out (FIFO)</div>
      {/* Queue display */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center", flexWrap: "wrap", padding: "16px", background: `${color}06`, borderRadius: 16, border: `1px solid ${color}18`, minHeight: 80 }}>
          <span style={{ fontSize: 10, color: color, fontFamily: "var(--font-mono)", fontWeight: 700, marginRight: 4 }}>FRONT</span>
          <AnimatePresence>
            {queue.map((item, i) => (
              <motion.div key={`${item}-${i}`} layout initial={{ opacity: 0, x: 20, scale: 0.8 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -20, scale: 0.5 }} transition={{ type: "spring", stiffness: 350, damping: 25 }}
                style={{ position: "relative", width: 56, height: 56, display: "flex", alignItems: "center", justifyContent: "center", background: i === 0 ? color : `${color}12`, color: i === 0 ? "white" : color, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 15, borderRadius: 12, border: `1.5px solid ${color}30`, boxShadow: i === 0 ? `0 4px 16px ${color}44` : "none" }}>
                {item}
                {i === 0 && <div style={{ position: "absolute", bottom: -18, fontSize: 9, color, fontWeight: 700 }}>FRONT</div>}
                {i === queue.length - 1 && i !== 0 && <div style={{ position: "absolute", bottom: -18, fontSize: 9, color: "#86868b", fontWeight: 700 }}>REAR</div>}
              </motion.div>
            ))}
            {queue.length === 0 && (
              <div style={{ padding: "12px 20px", border: `2px dashed ${color}40`, borderRadius: 12, color: `${color}60`, fontFamily: "var(--font-mono)", fontSize: 12 }}>Empty Queue</div>
            )}
          </AnimatePresence>
          {queue.length > 0 && <span style={{ fontSize: 10, color: "#86868b", fontFamily: "var(--font-mono)", fontWeight: 700, marginLeft: 4 }}>REAR</span>}
        </div>
      </div>
      {/* Controls */}
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && enqueue()}
            placeholder="Value..."
            style={{ width: 110, padding: "10px 14px", border: `1.5px solid ${color}40`, borderRadius: 10, fontSize: 14, fontFamily: "var(--font-mono)", fontWeight: 600, color: "#1d1d1f", outline: "none", background: "#f5f5f7" }} />
          <VizBtn onClick={enqueue} color={color}>Enqueue →</VizBtn>
        </div>
        <VizBtn onClick={() => setQueue(p => p.slice(1))} color={color}>← Dequeue</VizBtn>
        <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "#86868b", fontWeight: 500 }}>Size: {queue.length}</div>
      </div>
    </div>
  );
}

function LinearSearchVisual({ color }) {
  const [array] = useState([4, 8, 2, 9, 5, 1, 7, 3]);
  const [current, setCurrent] = useState(-1);
  const [found, setFound] = useState(-1);
  const [target] = useState(9);
  const running = useRef(false);
  const search = () => {
    if (running.current) return; running.current = true; setCurrent(-1); setFound(-1);
    let i = 0;
    const iv = setInterval(() => { setCurrent(i); if (array[i] === target) { setFound(i); clearInterval(iv); running.current = false; return; } i++; if (i >= array.length) { clearInterval(iv); running.current = false; } }, 500);
  };
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: "#86868b", textTransform: "uppercase", marginBottom: 20 }}>Linear Search — Target: {target}</div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 }}>
        {array.map((num, i) => (
          <motion.div key={i} animate={{ scale: current === i ? 1.15 : 1, y: current === i ? -4 : 0 }} transition={{ type: "spring", stiffness: 400, damping: 20 }}
            style={{ width: 54, height: 54, display: "flex", alignItems: "center", justifyContent: "center", background: found === i ? color : current === i ? `${color}18` : "#f5f5f7", color: found === i ? "white" : current === i ? color : "#424245", fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 16, borderRadius: 14, border: `1.5px solid ${found === i || current === i ? color : "transparent"}`, transition: "background 0.25s,color 0.25s", boxShadow: found === i ? `0 4px 16px ${color}44` : "none" }}>
            {num}
          </motion.div>
        ))}
      </div>
      {found !== -1 && <motion.p initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} style={{ fontFamily: "var(--font-mono)", fontSize: 13, color, marginBottom: 16, fontWeight: 600 }}>✓ Found {target} at index {found}</motion.p>}
      <VizBtn onClick={search} color={color}>▶ Start Search</VizBtn>
    </div>
  );
}

function UniversalSortVisual({ color, type }) {
  const init = [5, 3, 8, 4, 2, 7, 1, 6];
  const [array, setArray] = useState([...init]);
  const [active, setActive] = useState([-1, -1]);
  const running = useRef(false);

  const reset = () => { setArray([...init]); setActive([-1, -1]); };

  const bubbleSort = (arr, steps) => {
    let a = [...arr];
    for (let i = 0; i < a.length - 1; i++) {
      for (let j = 0; j < a.length - 1 - i; j++) {
        steps.push({ arr: [...a], comparing: [j, j + 1] });
        if (a[j] > a[j + 1]) {
          [a[j], a[j + 1]] = [a[j + 1], a[j]];
          steps.push({ arr: [...a], comparing: [j, j + 1] });
        }
      }
    }
  };

  const selectionSort = (arr, steps) => {
    let a = [...arr];
    for (let i = 0; i < a.length - 1; i++) {
      let min = i;
      for (let j = i + 1; j < a.length; j++) {
        steps.push({ arr: [...a], comparing: [i, j] });
        if (a[j] < a[min]) min = j;
      }
      [a[i], a[min]] = [a[min], a[i]];
      steps.push({ arr: [...a], comparing: [i, min] });
    }
  };

  const insertionSort = (arr, steps) => {
    let a = [...arr];
    for (let i = 1; i < a.length; i++) {
      let key = a[i];
      let j = i - 1;
      while (j >= 0 && a[j] > key) {
        steps.push({ arr: [...a], comparing: [j, j + 1] });
        a[j + 1] = a[j];
        j--;
        steps.push({ arr: [...a], comparing: [j + 1, j + 2] });
      }
      a[j + 1] = key;
      steps.push({ arr: [...a], comparing: [j + 1, j + 1] });
    }
  };

  const mergeSort = (arr, steps) => {
    let a = [...arr];
    const merge = (low, mid, high) => {
      let left = a.slice(low, mid + 1);
      let right = a.slice(mid + 1, high + 1);
      let i = 0, j = 0, k = low;
      while (i < left.length && j < right.length) {
        steps.push({ arr: [...a], comparing: [low + i, mid + 1 + j] });
        if (left[i] <= right[j]) a[k++] = left[i++];
        else a[k++] = right[j++];
        steps.push({ arr: [...a], comparing: [k - 1, k - 1] });
      }
      while (i < left.length) a[k++] = left[i++];
      while (j < right.length) a[k++] = right[j++];
      steps.push({ arr: [...a], comparing: [low, high] });
    };
    const divide = (low, high) => {
      if (low < high) {
        let mid = Math.floor((low + high) / 2);
        divide(low, mid);
        divide(mid + 1, high);
        merge(low, mid, high);
      }
    };
    divide(0, a.length - 1);
  };

  const quickSort = (arr, steps) => {
    let a = [...arr];
    const partition = (low, high) => {
      let pivot = a[high];
      let i = low - 1;
      for (let j = low; j < high; j++) {
        steps.push({ arr: [...a], comparing: [j, high] });
        if (a[j] < pivot) {
          i++;
          [a[i], a[j]] = [a[j], a[i]];
          steps.push({ arr: [...a], comparing: [i, j] });
        }
      }
      [a[i + 1], a[high]] = [a[high], a[i + 1]];
      steps.push({ arr: [...a], comparing: [i + 1, high] });
      return i + 1;
    };
    const sortRec = (low, high) => {
      if (low < high) {
        let pi = partition(low, high);
        sortRec(low, pi - 1);
        sortRec(pi + 1, high);
      }
    };
    sortRec(0, a.length - 1);
  };

  const sort = () => {
    if (running.current) return;
    running.current = true;
    let steps = [];
    if (type === "Bubble Sort") bubbleSort(array, steps);
    else if (type === "Selection Sort") selectionSort(array, steps);
    else if (type === "Insertion Sort") insertionSort(array, steps);
    else if (type === "Merge Sort") mergeSort(array, steps);
    else if (type === "Quick Sort") quickSort(array, steps);
    else bubbleSort(array, steps);

    if (steps.length === 0) { running.current = false; return; }
    steps.push({ arr: steps[steps.length - 1].arr, comparing: [-1, -1] });

    let s = 0;
    const iv = setInterval(() => {
      if (s >= steps.length) {
        clearInterval(iv);
        running.current = false;
        setActive([-1, -1]);
        return;
      }
      setArray(steps[s].arr);
      setActive(steps[s].comparing);
      s++;
    }, 200);
  };

  const maxVal = Math.max(...array);
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: "#86868b", textTransform: "uppercase", marginBottom: 20 }}>{type} — Visualization</div>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end", marginBottom: 28, height: 160 }}>
        {array.map((num, i) => (
          <motion.div key={i} layout transition={{ type: "spring", stiffness: 350, damping: 28 }}
            style={{ flex: 1, height: `${(num / maxVal) * 140}px`, background: (active[0] === i || active[1] === i) ? color : `${color}20`, borderRadius: "10px 10px 0 0", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 6, color: (active[0] === i || active[1] === i) ? "white" : color, fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, transition: "background 0.15s,color 0.15s", boxShadow: (active[0] === i || active[1] === i) ? `0 4px 16px ${color}44` : "none" }}>
            {num}
          </motion.div>
        ))}
      </div>
      <VizBtn onClick={sort} color={color}>▶ Sort</VizBtn>
      <VizBtn onClick={reset} color={color}>↺ Reset</VizBtn>
    </div>
  );
}

function BinarySearchVisual({ color }) {
  const [array] = useState([1, 4, 7, 12, 18, 25, 33, 40, 50, 65, 80, 99]);
  const [range, setRange] = useState({ lo: 0, hi: array.length - 1, mid: -1 });
  const [found, setFound] = useState(-1);
  const [target] = useState(33);
  const running = useRef(false);

  const search = () => {
    if (running.current) return;
    running.current = true;
    setFound(-1);
    let lo = 0, hi = array.length - 1;

    const nextStep = () => {
      if (lo > hi) {
        setRange({ lo, hi, mid: -1 });
        running.current = false;
        return;
      }
      let mid = Math.floor((lo + hi) / 2);
      setRange({ lo, hi, mid });

      setTimeout(() => {
        if (array[mid] === target) {
          setFound(mid);
          running.current = false;
        } else if (array[mid] < target) {
          lo = mid + 1;
          nextStep();
        } else {
          hi = mid - 1;
          nextStep();
        }
      }, 1000);
    };
    nextStep();
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, color: "#86868b", textTransform: "uppercase", marginBottom: 20 }}>Binary Search — Target: {target}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 32, justifyContent: "center" }}>
        {array.map((num, i) => {
          const isMid = range.mid === i;
          const inRange = i >= range.lo && i <= range.hi;
          const isFound = found === i;
          return (
            <motion.div key={i} animate={{
              scale: isMid ? 1.2 : 1,
              y: isMid ? -8 : 0,
              opacity: inRange ? 1 : 0.2
            }}
              style={{
                width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                background: isFound ? "#34c759" : isMid ? `${color}18` : "#f5f5f7",
                color: isFound ? "white" : isMid ? color : "#424245",
                fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 13, borderRadius: 10,
                border: `1.5px solid ${isFound ? "#34c759" : isMid ? color : "transparent"}`,
                boxShadow: isFound ? `0 4px 16px rgba(52,199,89,0.3)` : "none",
                position: "relative"
              }}>
              {num}
              {isMid && <div style={{ position: "absolute", bottom: -18, fontSize: 9, color, fontWeight: 800 }}>MID</div>}
              {range.lo === i && i !== range.mid && <div style={{ position: "absolute", top: -14, fontSize: 8, color: "#0071e3", fontWeight: 800 }}>LO</div>}
              {range.hi === i && i !== range.mid && <div style={{ position: "absolute", top: -14, fontSize: 8, color: "#ff3b30", fontWeight: 800 }}>HI</div>}
            </motion.div>
          );
        })}
      </div>
      <VizBtn onClick={search} color={color}>▶ Start Search</VizBtn>
    </div>
  );
}

function LinkedListVisual({ color }) {
  const [list, setList] = useState([10, 20, 30, 40]);
  const [inputVal, setInputVal] = useState("");
  const addNode = () => {
    const v = parseInt(inputVal);
    if (!isNaN(v)) { setList(p => [...p, v]); setInputVal(""); }
  };
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: "#86868b", textTransform: "uppercase", marginBottom: 20 }}>Linked List — Sequence of Nodes</div>
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: 40, flexWrap: "wrap", justifyContent: "center" }}>
        <AnimatePresence>
          {list.map((item, i) => (
            <div key={`${item}-${i}`} style={{ display: "flex", alignItems: "center" }}>
              <motion.div initial={{ opacity: 0, scale: 0.8, x: -20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8, x: 20 }}
                style={{ width: 64, height: 60, borderRadius: 12, background: "white", border: `2px solid ${color}`, display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#1d1d1f", fontWeight: 800, fontSize: 15, fontFamily: "var(--font-mono)" }}>{item}</div>
                <div style={{ height: 18, background: `${color}15`, borderTop: `1px solid ${color}30`, fontSize: 9, fontWeight: 700, color, display: "flex", alignItems: "center", justifyContent: "center" }}>NEXT</div>
              </motion.div>
              {i < list.length - 1 ? (
                <motion.div initial={{ width: 0 }} animate={{ width: 40 }} style={{ height: 2, background: color, position: "relative" }}>
                  <div style={{ position: "absolute", right: -2, top: -4, borderStyle: "solid", borderWidth: "5px 0 5px 8px", borderColor: `transparent transparent transparent ${color}` }} />
                </motion.div>
              ) : (
                <div style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ height: 2, width: 20, background: "#d2d2d7", position: "relative" }}>
                    <div style={{ position: "absolute", right: -2, top: -4, borderStyle: "solid", borderWidth: "5px 0 5px 8px", borderColor: `transparent transparent transparent #d2d2d7` }} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "#d2d2d7", fontFamily: "var(--font-mono)" }}>NULL</span>
                </div>
              )}
            </div>
          ))}
        </AnimatePresence>
      </div>
      <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
        <input type="number" value={inputVal} onChange={e => setInputVal(e.target.value)} placeholder="Value"
          style={{ width: 90, padding: "10px 14px", border: `1.5px solid ${color}30`, borderRadius: 10, outline: "none", fontSize: 14 }} />
        <VizBtn onClick={addNode} color={color}>Add Node +</VizBtn>
        <VizBtn onClick={() => setList(p => p.slice(1))} color={color}>Delete Head -</VizBtn>
      </div>
    </div>
  );
}

function RecursionVisual({ color }) {
  const [calls, setCalls] = useState([]);
  const [result, setResult] = useState(null);
  const running = useRef(false);

  const startFact = async (n) => {
    if (running.current) return;
    running.current = true;
    setCalls([]);
    setResult(null);

    const fact = async (num) => {
      const id = Date.now() + Math.random();
      setCalls(p => [...p, { id, num, state: 'calling' }]);
      await new Promise(r => setTimeout(r, 800));

      if (num <= 1) {
        setCalls(p => p.map(c => c.id === id ? { ...c, state: 'returning', val: 1 } : c));
        return 1;
      }

      const subRes = await fact(num - 1);
      const res = num * subRes;
      await new Promise(r => setTimeout(r, 600));

      setCalls(p => p.map(c => c.id === id ? { ...c, state: 'returning', val: res } : c));
      return res;
    };

    const final = await fact(n);
    setResult(final);
    running.current = false;
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#86868b", textTransform: "uppercase", marginBottom: 20 }}>Recursion Stack Frames — fact(5)</div>
      <div style={{ display: "flex", flexDirection: "column-reverse", gap: 10, alignItems: "center", minHeight: 320, marginBottom: 32 }}>
        <AnimatePresence>
          {calls.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              style={{
                width: "100%", maxWidth: 320, padding: "14px 20px", borderRadius: 12, border: `1.5px solid ${c.state === 'returning' ? '#34c759' : color}`,
                background: c.state === 'returning' ? '#34c75910' : 'white', display: "flex", justifyContent: "space-between", alignItems: "center",
                boxShadow: "var(--shadow-sm)"
              }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: c.state === 'returning' ? '#34c759' : color, animation: c.state === 'calling' ? 'pulse 1.5s infinite' : 'none' }} />
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 700, fontSize: 14, color: c.state === 'returning' ? '#34c759' : color }}>factorial({c.num})</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 800, color: c.state === 'returning' ? '#34c759' : '#86868b' }}>
                {c.state === 'returning' ? `RESULT: ${c.val}` : 'EXECUTING...'}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {calls.length === 0 && <div style={{ color: "#d2d2d7", fontSize: 14, fontFamily: "var(--font-mono)" }}>No active frames</div>}
      </div>
      <div style={{ textAlign: "center" }}>
        {result !== null && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ marginBottom: 20, fontSize: 20, fontWeight: 800, color: "#1d1d1f" }}>
            Final Result: <span style={{ color }}>{result}</span>
          </motion.div>
        )}
        <VizBtn onClick={() => startFact(5)} color={color}>▶ Call fact(5)</VizBtn>
        <VizBtn onClick={() => { setCalls([]); setResult(null); }} color={color}>↺ Clear</VizBtn>
      </div>
    </div>
  );
}

function TreeVisual({ color, isBST }) {
  const [active, setActive] = useState(null);
  const tree = {
    val: isBST ? 50 : 1,
    left: {
      val: isBST ? 30 : 2,
      left: { val: isBST ? 20 : 4, left: null, right: null },
      right: { val: isBST ? 40 : 5, left: null, right: null }
    },
    right: {
      val: isBST ? 70 : 3,
      left: { val: isBST ? 60 : 6, left: null, right: null },
      right: { val: isBST ? 80 : 7, left: null, right: null }
    }
  };

  const traverse = async (node, path = "") => {
    if (!node) return;
    setActive(path);
    await new Promise(r => setTimeout(r, 800));
    await traverse(node.left, path + "L");
    await traverse(node.right, path + "R");
  };

  const renderNode = (node, path = "") => {
    if (!node) return null;
    const isActive = active === path;
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        <motion.div animate={{ scale: isActive ? 1.25 : 1, y: isActive ? -5 : 0, backgroundColor: isActive ? color : "white", color: isActive ? "white" : color }}
          style={{
            width: 48, height: 48, borderRadius: "50%", border: `2.5px solid ${color}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 16, boxShadow: isActive ? `0 0 25px ${color}66` : "var(--shadow-sm)", zIndex: 10, position: "relative"
          }}>
          {node.val}
        </motion.div>
        {(node.left || node.right) && (
          <div style={{ display: "flex", gap: 40, marginTop: 24, position: "relative" }}>
            {node.left && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ position: "absolute", top: -24, left: "25%", width: 2, height: 30, background: color, transform: "rotate(35deg)", transformOrigin: "top", opacity: 0.4 }} />
                {renderNode(node.left, path + "L")}
              </div>
            )}
            {node.right && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ position: "absolute", top: -24, right: "25%", width: 2, height: 30, background: color, transform: "rotate(-35deg)", transformOrigin: "top", opacity: 0.4 }} />
                {renderNode(node.right, path + "R")}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#86868b", textTransform: "uppercase", marginBottom: 40 }}>{isBST ? 'Binary Search Tree (Ordered)' : 'Binary Tree Structure'}</div>
      <div style={{ display: "flex", justifyContent: "center", minHeight: 300, padding: "0 20px" }}>
        {renderNode(tree)}
      </div>
      <div style={{ marginTop: 40 }}>
        <VizBtn onClick={() => traverse(tree)} color={color}>▶ Visualize DFS Traversal</VizBtn>
        <VizBtn onClick={() => setActive(null)} color={color}>↺ Reset</VizBtn>
      </div>
    </div>
  );
}

function GraphVisual({ color }) {
  const [activeNode, setActiveNode] = useState(null);
  const nodes = [
    { id: 0, x: 150, y: 50 },
    { id: 1, x: 50, y: 150 },
    { id: 2, x: 250, y: 150 },
    { id: 3, x: 100, y: 250 },
    { id: 4, x: 200, y: 250 }
  ];
  const edges = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 4], [3, 4]];

  const traverse = async () => {
    const visited = new Set();
    const queue = [0];
    visited.add(0);

    while (queue.length > 0) {
      const curr = queue.shift();
      setActiveNode(curr);
      await new Promise(r => setTimeout(r, 800));

      const neighbors = edges.filter(e => e.includes(curr)).map(e => e[0] === curr ? e[1] : e[0]);
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
    setActiveNode(null);
  };

  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#86868b", textTransform: "uppercase", marginBottom: 30 }}>Graph Topology — BFS Discovery</div>
      <div style={{ position: "relative", width: 300, height: 300, margin: "0 auto", background: "#f9f9fb", borderRadius: 20, border: "1px solid #eee" }}>
        <svg width="300" height="300">
          {edges.map(([u, v], i) => (
            <line key={i} x1={nodes[u].x} y1={nodes[u].y} x2={nodes[v].x} y2={nodes[v].y} stroke={color} strokeWidth="2" opacity="0.2" />
          ))}
        </svg>
        {nodes.map(n => (
          <motion.div key={n.id} animate={{ scale: activeNode === n.id ? 1.3 : 1, backgroundColor: activeNode === n.id ? color : "white" }}
            style={{
              position: "absolute", left: n.x - 20, top: n.y - 20, width: 40, height: 40, borderRadius: "50%", border: `2px solid ${color}`,
              display: "flex", alignItems: "center", justifyContent: "center", color: activeNode === n.id ? "white" : color, fontWeight: 800,
              fontSize: 14, boxShadow: activeNode === n.id ? `0 0 15px ${color}55` : "var(--shadow-sm)", zIndex: 5
            }}>
            {n.id}
          </motion.div>
        ))}
      </div>
      <div style={{ marginTop: 30 }}>
        <VizBtn onClick={traverse} color={color}>▶ Run BFS</VizBtn>
      </div>
    </div>
  );
}

/* ============================================================
   LOCAL MODULE DATA
============================================================ */
const LOCAL_MODULE_DATA = {
  "Stack": {
    "Beginner": {
      definition: "A Stack is a linear data structure that follows the Last In, First Out (LIFO) principle. Elements are inserted and removed from the same end called the 'top'. Think of it like a stack of plates — you always add and remove from the top.",
      working: "Push adds an element to the top. Pop removes the top element. Peek returns the top element without removing it. isEmpty checks if the stack has no elements. The top pointer tracks the current top position, initialized to -1 for an empty stack.",
      algorithm: "PUSH(stack, x):\n  if top == MAX-1 → Overflow error\n  top = top + 1\n  stack[top] = x\n\nPOP(stack):\n  if top == -1 → Underflow error\n  x = stack[top]\n  top = top - 1\n  return x\n\nPEEK(stack):\n  return stack[top]",
      time_complexity: { "Push": "O(1)", "Pop": "O(1)", "Peek": "O(1)", "isEmpty": "O(1)", "Search": "O(n)", "Space": "O(n)" },
      applications: "Undo/Redo in text editors, browser back/forward history, function call stack in operating systems, expression evaluation (postfix/prefix), balanced parentheses checking in compilers, backtracking algorithms.",
      interview_notes: "Always clarify if the stack should handle overflow. Prefer ArrayDeque over java.util.Stack in Java. Common patterns: monotonic stack for NGE problems, two-stack trick for queue simulation.",
      java: `import java.util.ArrayDeque;\nimport java.util.Deque;\n\npublic class StackDemo {\n    public static void main(String[] args) {\n        Deque<Integer> stack = new ArrayDeque<>();\n        stack.push(10); stack.push(20); stack.push(30);\n        System.out.println("Peek: " + stack.peek());\n        System.out.println("Pop: " + stack.pop());\n    }\n}`
    },
    "Intermediate": {
      definition: "At the intermediate level, stacks power advanced patterns: monotonic stacks maintain elements in sorted order enabling O(n) solutions, and two-stack designs support O(1) getMin().",
      working: "Monotonic Stack: maintain increasing or decreasing order — pop elements that violate the property. Min Stack: push to minStack only when new value ≤ current min, ensuring O(1) getMin().",
      algorithm: "MONOTONIC STACK (Next Greater Element):\n  for i = 0 to n-1:\n    while stack not empty AND arr[stack.top] < arr[i]:\n      result[stack.pop()] = arr[i]\n    stack.push(i)\n\nMIN STACK push(x):\n  mainStack.push(x)\n  if minStack empty OR x <= minStack.peek():\n    minStack.push(x)",
      time_complexity: { "Monotonic Stack": "O(n)", "Min Stack push": "O(1)", "Min Stack getMin": "O(1)", "Infix to Postfix": "O(n)", "Evaluate Postfix": "O(n)" },
      applications: "Next Greater Element, Stock Span Problem, Largest Rectangle in Histogram, Daily Temperatures, Expression evaluation and conversion.",
      interview_notes: "Monotonic stack is the key pattern for O(n) solutions to 'next greater/smaller' problems. Min Stack: pop minStack only when popped value equals minStack.peek(). Daily Temperatures and Stock Span are must-know.",
      java: `import java.util.*;\n\npublic class IntermediateStack {\n    static class MinStack {\n        Deque<Integer> stack = new ArrayDeque<>(), minStack = new ArrayDeque<>();\n        public void push(int val) {\n            stack.push(val);\n            if (minStack.isEmpty() || val <= minStack.peek()) minStack.push(val);\n        }\n        public void pop() { if (stack.pop().equals(minStack.peek())) minStack.pop(); }\n        public int getMin() { return minStack.peek(); }\n    }\n    public static int[] nextGreaterElement(int[] nums) {\n        int n = nums.length; int[] result = new int[n]; Arrays.fill(result, -1);\n        Deque<Integer> stack = new ArrayDeque<>();\n        for (int i = 0; i < n; i++) {\n            while (!stack.isEmpty() && nums[stack.peek()] < nums[i]) result[stack.pop()] = nums[i];\n            stack.push(i);\n        }\n        return result;\n    }\n}`
    },
    "Advanced": {
      definition: "Advanced stack problems: Largest Rectangle in Histogram, Trapping Rain Water, and Asteroid Collision are canonical hard problems solved elegantly with monotonic stacks.",
      working: "Histogram Rectangle: use monotonic stack of indices. When a shorter bar is found, pop and calculate area using current index and new stack top as boundaries.",
      algorithm: "LARGEST RECTANGLE:\n  for i = 0 to n (with sentinel):\n    while heights[stack.top] > curr:\n      h = heights[stack.pop()]\n      w = stack.empty ? i : i - stack.peek() - 1\n      maxArea = max(maxArea, h*w)\n    push i",
      time_complexity: { "Largest Rectangle": "O(n)", "Trapping Rain Water": "O(n)", "Asteroid Collision": "O(n)", "Space": "O(n)" },
      applications: "Histogram analysis, terrain water trapping simulation, asteroid collision physics, stock market analysis, skyline problems.",
      interview_notes: "Largest Rectangle and Trapping Rain Water are top-5 Google/Amazon questions. Always handle the sentinel boundary case. For Asteroid Collision, handle equal-size case — both must die.",
      java: `import java.util.*;\n\npublic class AdvancedStack {\n    public static int largestRectangleArea(int[] heights) {\n        Deque<Integer> stack = new ArrayDeque<>();\n        int maxArea = 0, n = heights.length;\n        for (int i = 0; i <= n; i++) {\n            int curr = (i == n) ? 0 : heights[i];\n            while (!stack.isEmpty() && heights[stack.peek()] > curr) {\n                int h = heights[stack.pop()];\n                int w = stack.isEmpty() ? i : i - stack.peek() - 1;\n                maxArea = Math.max(maxArea, h * w);\n            }\n            stack.push(i);\n        }\n        return maxArea;\n    }\n    public static void main(String[] args) {\n        System.out.println(largestRectangleArea(new int[]{2,1,5,6,2,3})); // 10\n    }\n}`
    }
  },
  "Queue": {
    "Beginner": {
      definition: "A Queue is a linear data structure following First In, First Out (FIFO). Elements are added at the REAR (enqueue) and removed from the FRONT (dequeue). Like a line at a ticket counter — first in, first served.",
      working: "Enqueue adds element at rear. Dequeue removes element from front. Peek returns front without removing. A Circular Queue reuses freed slots using modular arithmetic: rear = (rear+1) % capacity.",
      algorithm: "ENQUEUE(queue, x):\n  if isFull() → Overflow\n  rear = (rear+1) % capacity\n  queue[rear] = x\n\nDEQUEUE(queue):\n  if isEmpty() → Underflow\n  x = queue[front]\n  front = (front+1) % capacity\n  return x",
      time_complexity: { "Enqueue": "O(1)", "Dequeue": "O(1)", "Peek": "O(1)", "isEmpty": "O(1)", "Space": "O(n)" },
      applications: "CPU scheduling (Round Robin), printer job queue, BFS, keyboard input buffer, network packet buffering, customer service systems.",
      interview_notes: "Prefer ArrayDeque over LinkedList in Java (better cache performance). ArrayDeque.offer()/poll() are idiomatic. Know: Queue (FIFO) vs Stack (LIFO) vs Deque (both ends).",
      java: `import java.util.*;\n\npublic class QueueDemo {\n    public static void main(String[] args) {\n        Queue<Integer> queue = new ArrayDeque<>();\n        queue.offer(10); queue.offer(20); queue.offer(30);\n        System.out.println("Queue: " + queue);\n        System.out.println("Peek: " + queue.peek()); // 10\n        System.out.println("Poll: " + queue.poll()); // 10\n    }\n}`
    },
    "Intermediate": {
      definition: "Intermediate queue applications include BFS for shortest path, multi-source BFS for simultaneous expansion, and level-order binary tree traversal — essential for graph and tree problems.",
      working: "BFS explores nodes level by level using a queue. Enqueue start node, repeatedly dequeue a node, process it, and enqueue unvisited neighbors. Level trick: capture queue.size() before the inner loop to process exactly one level.",
      algorithm: "BFS(graph, start):\n  queue.offer(start); visited.add(start)\n  while queue not empty:\n    node = queue.poll()\n    for each neighbor:\n      if not visited: visited.add(neighbor); queue.offer(neighbor)\n\nLEVEL ORDER:\n  size = queue.size() // capture before loop\n  for i = 0 to size-1: process nodes",
      time_complexity: { "BFS": "O(V+E)", "Level Order": "O(n)", "Multi-Source BFS": "O(V+E)", "Rotting Oranges": "O(m×n)", "Space": "O(V)" },
      applications: "Shortest path in unweighted graphs, social network degrees, web crawlers, GPS navigation, Rotting Oranges, 01 Matrix, Walls and Gates.",
      interview_notes: "Multi-source BFS is the key insight for Rotting Oranges — start ALL rotten cells simultaneously. Always capture queue.size() BEFORE the inner loop for level-order. BFS guarantees shortest path in unweighted graphs.",
      java: `import java.util.*;\n\npublic class IntermediateQueue {\n    public static int orangesRotting(int[][] grid) {\n        int rows = grid.length, cols = grid[0].length, fresh = 0, mins = 0;\n        Queue<int[]> queue = new LinkedList<>();\n        for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) {\n            if (grid[r][c] == 2) queue.offer(new int[]{r,c});\n            if (grid[r][c] == 1) fresh++;\n        }\n        int[][] dirs = {{0,1},{0,-1},{1,0},{-1,0}};\n        while (!queue.isEmpty() && fresh > 0) {\n            mins++;\n            for (int i = queue.size(); i > 0; i--) {\n                int[] curr = queue.poll();\n                for (int[] d : dirs) {\n                    int nr = curr[0]+d[0], nc = curr[1]+d[1];\n                    if (nr>=0&&nr<rows&&nc>=0&&nc<cols&&grid[nr][nc]==1) {\n                        grid[nr][nc]=2; fresh--; queue.offer(new int[]{nr,nc});\n                    }\n                }\n            }\n        }\n        return fresh==0 ? mins : -1;\n    }\n}`
    },
    "Advanced": {
      definition: "Advanced queue patterns: monotonic deque for sliding window maximum O(n), Dijkstra's with priority queue, and Kahn's topological sort. These are staple FAANG interview problems.",
      working: "Sliding Window Max: maintain a deque of indices in decreasing value order. Remove out-of-window indices from front, remove smaller-value indices from back. Front index always holds the current window maximum.",
      algorithm: "SLIDING WINDOW MAX:\n  for i = 0 to n-1:\n    remove indices < i-k+1 from front\n    remove indices with value < nums[i] from back\n    deque.addLast(i)\n    if i >= k-1: result[i-k+1] = nums[deque.front]",
      time_complexity: { "Sliding Window Max": "O(n)", "Dijkstra": "O((V+E)logV)", "Kahn's Topo Sort": "O(V+E)", "0-1 BFS": "O(V+E)" },
      applications: "Sliding window maximum in data streams, shortest path in weighted graphs, task dependency ordering, course scheduling with prerequisites.",
      interview_notes: "Sliding Window Maximum uses ArrayDeque which supports O(1) addFirst/addLast/pollFirst/pollLast. Kahn's detects cycles: if result.size() < numNodes, a cycle exists.",
      java: `import java.util.*;\n\npublic class AdvancedQueue {\n    public static int[] maxSlidingWindow(int[] nums, int k) {\n        int n = nums.length; int[] result = new int[n-k+1];\n        Deque<Integer> deque = new ArrayDeque<>();\n        for (int i = 0; i < n; i++) {\n            while (!deque.isEmpty() && deque.peekFirst() < i-k+1) deque.pollFirst();\n            while (!deque.isEmpty() && nums[deque.peekLast()] < nums[i]) deque.pollLast();\n            deque.offerLast(i);\n            if (i >= k-1) result[i-k+1] = nums[deque.peekFirst()];\n        }\n        return result;\n    }\n    public static void main(String[] args) {\n        System.out.println(Arrays.toString(maxSlidingWindow(new int[]{1,3,-1,-3,5,3,6,7}, 3)));\n        // [3,3,5,5,6,7]\n    }\n}`
    }
  },
  "Linear Search": {
    "Beginner": {
      definition: "Linear Search scans each element one by one from the beginning until the target is found or all elements are exhausted. It works on both sorted and unsorted data with no preprocessing required.",
      working: "Start from index 0. Compare each element with the target. If match found, return the index. If end reached without match, return -1. Sentinel optimization places target at last index to remove boundary check from each iteration.",
      algorithm: "LINEAR_SEARCH(arr, target):\n  for i = 0 to n-1:\n    if arr[i] == target: return i\n  return -1",
      time_complexity: { "Best": "O(1)", "Average": "O(n)", "Worst": "O(n)", "Space": "O(1)" },
      applications: "Searching unsorted arrays, finding elements in linked lists, small datasets, finding first/last/all occurrences.",
      interview_notes: "Linear search is O(n). Mention Sentinel optimization. For linked lists, linear search is the ONLY option. To optimize, use HashMap O(1) lookup or sort+binary search.",
      java: `public class LinearSearchDemo {\n    public static int linearSearch(int[] arr, int target) {\n        for (int i = 0; i < arr.length; i++)\n            if (arr[i] == target) return i;\n        return -1;\n    }\n    public static int[] twoSum(int[] nums, int target) {\n        java.util.Map<Integer,Integer> map = new java.util.HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int comp = target - nums[i];\n            if (map.containsKey(comp)) return new int[]{map.get(comp), i};\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n    public static void main(String[] args) {\n        System.out.println(linearSearch(new int[]{4,8,2,9,5}, 9)); // 3\n    }\n}`
    },
    "Intermediate": {
      definition: "Intermediate linear search patterns: Kadane's for max subarray, Boyer-Moore for majority elements, two-pointer for pair-sum, and sliding window for subarray conditions.",
      working: "Kadane's: at each index, decide whether to extend current subarray or start fresh — max(arr[i], currSum+arr[i]). Boyer-Moore: cancel out non-majority elements using a count variable; the surviving candidate is the majority element.",
      algorithm: "KADANE'S:\n  currSum = maxSum = arr[0]\n  for i = 1 to n-1:\n    currSum = max(arr[i], currSum + arr[i])\n    maxSum = max(maxSum, currSum)\n  return maxSum\n\nBOYER-MOORE:\n  candidate = arr[0], count = 1\n  for i = 1: if count==0: candidate=arr[i],count=1\n             elif arr[i]==candidate: count++\n             else: count--",
      time_complexity: { "Kadane's": "O(n) O(1) space", "Boyer-Moore": "O(n) O(1) space", "Two Pointer": "O(n) O(1) space", "Stock Buy/Sell": "O(n) O(1) space" },
      applications: "Maximum profit stock trading, majority vote in elections, container with most water, subarray sum problems.",
      interview_notes: "Kadane's is THE classic DP + linear scan pattern. Boyer-Moore GUARANTEES majority element exists (>n/2 times). Two-pointer only works on sorted arrays for pair-sum; use HashMap for unsorted.",
      java: `public class IntermediateLinearSearch {\n    public static int maxSubArray(int[] nums) {\n        int maxSum = nums[0], currSum = nums[0];\n        for (int i = 1; i < nums.length; i++) {\n            currSum = Math.max(nums[i], currSum + nums[i]);\n            maxSum = Math.max(maxSum, currSum);\n        }\n        return maxSum;\n    }\n    public static int majorityElement(int[] nums) {\n        int candidate = nums[0], count = 1;\n        for (int i = 1; i < nums.length; i++) {\n            if (count == 0) { candidate = nums[i]; count = 1; }\n            else if (nums[i] == candidate) count++;\n            else count--;\n        }\n        return candidate;\n    }\n    public static void main(String[] args) {\n        System.out.println(maxSubArray(new int[]{-2,1,-3,4,-1,2,1,-5,4})); // 6\n        System.out.println(majorityElement(new int[]{2,2,1,1,1,2,2})); // 2\n    }\n}`
    },
    "Advanced": {
      definition: "Advanced linear scan: Dutch National Flag (3-way partition), trapping rain water with two pointers, QuickSelect for O(n) kth element, XOR for single number, first missing positive in O(n) O(1) space.",
      working: "Dutch National Flag: 3 pointers (low, mid, high). Swap 0s to left, 2s to right, 1s stay middle. QuickSelect: partition like QuickSort but only recurse on the side containing the kth element — O(n) average.",
      algorithm: "DUTCH NATIONAL FLAG:\n  low=0, mid=0, high=n-1\n  while mid <= high:\n    if arr[mid]==0: swap(low,mid); low++; mid++\n    elif arr[mid]==1: mid++\n    else: swap(mid,high); high--",
      time_complexity: { "Dutch National Flag": "O(n)", "Rain Water (2ptr)": "O(n) O(1)", "QuickSelect avg": "O(n)", "XOR Single Number": "O(n) O(1)" },
      applications: "RGB image partitioning, terrain flood simulation, streaming kth-largest, XOR-based unique element detection.",
      interview_notes: "Dutch National Flag is 3-way partition — foundation of 3-way QuickSort. For Rain Water, two-pointer is O(1) space vs O(n) stack approach. XOR trick only works when all other elements appear exactly twice.",
      java: `public class AdvancedLinearSearch {\n    public static void sortColors(int[] nums) {\n        int lo=0, mid=0, hi=nums.length-1;\n        while (mid <= hi) {\n            if (nums[mid]==0) { int t=nums[lo];nums[lo]=nums[mid];nums[mid]=t; lo++; mid++; }\n            else if (nums[mid]==1) { mid++; }\n            else { int t=nums[mid];nums[mid]=nums[hi];nums[hi]=t; hi--; }\n        }\n    }\n    public static int singleNumber(int[] nums) {\n        int res=0; for(int n:nums) res^=n; return res;\n    }\n    public static void main(String[] args) {\n        int[] c={2,0,2,1,1,0}; sortColors(c);\n        System.out.println(java.util.Arrays.toString(c)); // [0,0,1,1,2,2]\n        System.out.println(singleNumber(new int[]{4,1,2,1,2})); // 4\n    }\n}`
    }
  },
  "Bubble Sort": {
    "Beginner": {
      definition: "Bubble Sort repeatedly steps through the array, compares adjacent elements, and swaps them if they're in the wrong order. After each pass, the largest unsorted element 'bubbles up' to its correct position at the end.",
      working: "Outer loop runs n-1 times. Inner loop compares arr[j] and arr[j+1], shrinking each pass since last i elements are sorted. Swap if out of order. Optimization: 'swapped' flag — if no swaps occur in a pass, array is already sorted, break early.",
      algorithm: "BUBBLE_SORT(arr):\n  for i = 0 to n-2:\n    swapped = false\n    for j = 0 to n-2-i:\n      if arr[j] > arr[j+1]:\n        swap(arr[j], arr[j+1])\n        swapped = true\n    if NOT swapped: break",
      time_complexity: { "Best (sorted)": "O(n)", "Average": "O(n²)", "Worst": "O(n²)", "Space": "O(1)", "Stable": "Yes" },
      applications: "Educational purposes, detecting nearly-sorted arrays, sorting very small arrays, understanding inversion count concept.",
      interview_notes: "Always mention 'swapped' optimization for O(n) best case. Bubble Sort is STABLE. After k passes, k largest elements are in final position. In production use Arrays.sort() (TimSort, O(n log n)).",
      java: `import java.util.Arrays;\n\npublic class BubbleSortDemo {\n    public static void bubbleSort(int[] arr) {\n        int n = arr.length;\n        for (int i = 0; i < n-1; i++) {\n            boolean swapped = false;\n            for (int j = 0; j < n-1-i; j++) {\n                if (arr[j] > arr[j+1]) {\n                    int tmp=arr[j]; arr[j]=arr[j+1]; arr[j+1]=tmp;\n                    swapped = true;\n                }\n            }\n            if (!swapped) break;\n        }\n    }\n    public static void main(String[] args) {\n        int[] arr = {5,3,8,4,2};\n        bubbleSort(arr);\n        System.out.println(Arrays.toString(arr)); // [2,3,4,5,8]\n    }\n}`
    },
    "Intermediate": {
      definition: "Intermediate: analyze Bubble Sort's relationship to inversion count, compare with Insertion and Selection Sort, and understand why Merge Sort's O(n log n) is superior by eliminating multiple inversions per comparison.",
      working: "Inversion: pair (i,j) where i<j but arr[i]>arr[j]. Each Bubble Sort swap removes exactly one inversion. Total swaps = total inversions (max n(n-1)/2). Insertion Sort is faster: fewer writes, adaptive O(n) on nearly sorted, cache-friendly.",
      algorithm: "COUNT INVERSIONS (Merge Sort):\n  merge: when right element taken before left[i..mid],\n         inv += (mid - i + 1)  // all remaining left are inversions",
      time_complexity: { "Bubble Sort": "O(n²)", "Insertion Sort": "O(n) best, O(n²) worst", "Merge Sort": "O(n log n)", "Count Inversions": "O(n log n)" },
      applications: "Inversion counting for measuring array disorder, choosing sort algorithm by data profile, understanding sort stability.",
      interview_notes: "Inversion count via modified Merge Sort is a must-know. Key: when taking right element before remaining left elements in merge, ALL remaining left form inversions with it.",
      java: `public class IntermediateBubbleSort {\n    public static long countInversions(int[] arr) { return mergeCount(arr,0,arr.length-1); }\n    private static long mergeCount(int[] arr, int l, int r) {\n        if (l>=r) return 0;\n        int mid=(l+r)/2;\n        return mergeCount(arr,l,mid)+mergeCount(arr,mid+1,r)+merge(arr,l,mid,r);\n    }\n    private static long merge(int[] arr, int l, int mid, int r) {\n        int[] tmp=new int[r-l+1]; int i=l,j=mid+1,k=0; long inv=0;\n        while(i<=mid&&j<=r) {\n            if(arr[i]<=arr[j]) tmp[k++]=arr[i++];\n            else { inv+=(mid-i+1); tmp[k++]=arr[j++]; }\n        }\n        while(i<=mid) tmp[k++]=arr[i++];\n        while(j<=r) tmp[k++]=arr[j++];\n        System.arraycopy(tmp,0,arr,l,tmp.length);\n        return inv;\n    }\n    public static void main(String[] args) {\n        System.out.println(countInversions(new int[]{2,4,1,3,5})); // 3\n    }\n}`
    },
    "Advanced": {
      definition: "Advanced sorting: QuickSort with Lomuto/Hoare partitioning for O(n log n) average, QuickSelect for O(n) kth-largest, K-sorted array with min-heap, and the Ω(n log n) comparison sort lower bound.",
      working: "QuickSort: choose pivot, partition smaller left and larger right, recurse on both halves. O(n log n) average, O(n²) worst on sorted input. QuickSelect: like QuickSort but recurse on ONE side — O(n) average for kth element.",
      algorithm: "QUICKSORT (Lomuto):\n  partition(arr, low, high):\n    pivot=arr[high]; i=low-1\n    for j=low to high-1:\n      if arr[j]<=pivot: i++; swap(i,j)\n    swap(i+1, high); return i+1",
      time_complexity: { "QuickSort average": "O(n log n)", "QuickSort worst": "O(n²)", "QuickSelect average": "O(n)", "K-sorted array": "O(n log k)" },
      applications: "General purpose sorting, streaming kth-largest, nearly-sorted optimization, database index sorting, in-place sorting.",
      interview_notes: "QuickSort worst O(n²) on sorted input — use random pivot or median-of-three. QuickSelect is O(n) average. K-sorted heap is O(n log k) — much better than O(n log n) when k is small.",
      java: `import java.util.*;\n\npublic class AdvancedBubbleSort {\n    public static void quickSort(int[] arr, int lo, int hi) {\n        if (lo<hi) { int pi=partition(arr,lo,hi); quickSort(arr,lo,pi-1); quickSort(arr,pi+1,hi); }\n    }\n    private static int partition(int[] arr, int lo, int hi) {\n        int pivot=arr[hi],i=lo-1;\n        for(int j=lo;j<hi;j++) if(arr[j]<=pivot){i++;int t=arr[i];arr[i]=arr[j];arr[j]=t;}\n        int t=arr[i+1];arr[i+1]=arr[hi];arr[hi]=t; return i+1;\n    }\n    public static int findKthLargest(int[] nums, int k) {\n        return qs(nums,0,nums.length-1,nums.length-k);\n    }\n    private static int qs(int[] a,int lo,int hi,int tgt) {\n        int i=partition(a,lo,hi);\n        if(i==tgt) return a[i];\n        return i<tgt?qs(a,i+1,hi,tgt):qs(a,lo,i-1,tgt);\n    }\n    public static void main(String[] args) {\n        int[] arr={5,3,8,4,2,7,1}; quickSort(arr,0,arr.length-1);\n        System.out.println(Arrays.toString(arr));\n        System.out.println(findKthLargest(new int[]{3,2,1,5,6,4},2)); // 5\n    }\n}`
    }
  },
  "Arrays": {
    "Beginner": {
      definition: "An Array is a collection of items stored at contiguous memory locations. It is the most fundamental data structure.",
      working: "Elements are accessed using an index starting from 0. The memory address is calculated based on base address and offset.",
      algorithm: "ACCESS: address = base + index * size\nSEARCH: iterate from 0 to n-1",
      time_complexity: { "Access": "O(1)", "Search": "O(n)", "Insertion": "O(n)", "Deletion": "O(n)" },
      applications: "Storing lists of items, base for other structures like Stacks and Heaps.",
      interview_notes: "Arrays are fixed size. Dynamic arrays grow exponentially.",
      java: `public class ArrayDemo {\n    public static void main(String[] args) {\n        int[] arr = {1, 2, 3};\n        System.out.println(arr[1]); // 2\n    }\n}`
    },
    "Intermediate": {
      definition: "Intermediate array concepts include 2D arrays, matrix operations, and prefix sums.",
      working: "2D arrays are arrays of arrays. Prefix sums precompute range totals.",
      algorithm: "RANGE_SUM(i, j) = P[j] - P[i-1]",
      time_complexity: { "Sum Query": "O(1)", "Precomputation": "O(n)" },
      applications: "Image processing, financial data range queries.",
      interview_notes: "Always check for array out of bounds.",
      java: `int[] p = new int[n];\np[0] = a[0];\nfor(int i=1; i<n; i++) p[i] = p[i-1] + a[i];`
    },
    "Advanced": {
      definition: "Advanced array problems involve multi-dimensional DP, sliding windows, and complex traversals.",
      working: "Solving problems like Trapping Rain Water or Maximum Sliding Window.",
      algorithm: "SLIDING_WINDOW_MAX using Deque",
      time_complexity: { "Sliding Window": "O(n)" },
      applications: "Stream processing, game engines.",
      interview_notes: "Use two pointers or sliding windows to reduce O(n²) to O(n).",
      java: `// Complex array logic here`
    }
  },
  "Strings": {
    "Beginner": {
      definition: "A String is a sequence of characters. In many languages like Java, Strings are immutable.",
      working: "Strings are often stored in a special pool to save memory.",
      algorithm: "CONCATENATION: s1 + s2\nLENGTH: s.length()",
      time_complexity: { "Access": "O(1)", "Comparison": "O(n)", "Search": "O(n)" },
      applications: "Text processing, input validation, web development.",
      interview_notes: "Always mention String pool and immutability.",
      java: `String s = "Hello";\ns = s + " World"; // Creates new object`
    },
    "Intermediate": {
      definition: "Intermediate topics include pattern matching, rolling hashes, and sliding windows on strings.",
      working: "KMP algorithm for pattern matching avoids redundant comparisons.",
      algorithm: "KMP: build LPS array, then scan",
      time_complexity: { "Pattern Match": "O(N+M)" },
      applications: "Search engines, bioinformatics.",
      interview_notes: "Sliding window is the go-to pattern for substring problems.",
      java: `StringBuilder sb = new StringBuilder();`
    },
    "Advanced": {
      definition: "Advanced topics include Tries, Suffix Trees, and Dynamic Programming on strings.",
      working: "DP is used for Longest Common Subsequence or Edit Distance.",
      algorithm: "LCS DP Table: if(s1[i]==s2[j]) T[i][j] = 1 + T[i-1][j-1]",
      time_complexity: { "LCS": "O(nm)" },
      applications: "Differencing tools (git diff), spell checkers.",
      interview_notes: "Suffix structures are powerful for sub-problem matching.",
      java: `// Advanced DP logic`
    }
  },
  "Linked Lists": {
    "Beginner": {
      definition: "A Linked List is a dynamic data structure where nodes are connected via pointers.",
      working: "Each node has 'data' and 'next'. Deletion/Insertion doesn't require shifting elements.",
      algorithm: "TRAVERSE: while(curr != null) curr = curr.next",
      time_complexity: { "Access": "O(n)", "Search": "O(n)", "Insert": "O(1)", "Delete": "O(1)" },
      applications: "Implementing Stacks and Queues, undo functionality.",
      interview_notes: "Always handle the case where head is null.",
      java: `class Node {\n    int val; Node next;\n}`
    },
    "Intermediate": {
      definition: "Intermediate concepts include Doubly Linked Lists, Circular Lists, and Tortoise & Hare algorithms.",
      working: "Fast and slow pointers help in detecting cycles and finding the middle element.",
      algorithm: "FAST_SLOW: fast = fast.next.next; slow = slow.next;",
      time_complexity: { "Cycle Detection": "O(n)" },
      applications: "Music playlists, browser cache (LRU).",
      interview_notes: "Practice reversing a list locally as it's the most common question.",
      java: `// DLL logic: node.prev = prevNode;`
    },
    "Advanced": {
      definition: "Advanced topics include Flattening lists, Cloning lists with random pointers, and merging K lists.",
      working: "Using Heaps to merge or keeping track of visited nodes using a Map for cloning.",
      algorithm: "K-MERGE: PriorityQueue stores head of K lists.",
      time_complexity: { "K-Merge": "O(N log K)" },
      applications: "Memory management, complex navigation systems.",
      interview_notes: "Corner cases: single node list, even/odd length lists.",
      java: `// Advanced list manipulation`
    }
  },
  "Recursion": {
    "Beginner": {
      definition: "Recursion is a technique where a function calls itself to solve smaller sub-problems.",
      working: "Each call adds a frame to the Stack. The stack is popped when a base case is reached.",
      algorithm: "solve(n) { if(base) return; solve(n-1); }",
      time_complexity: { "Fact": "O(n)", "Fib": "O(2^n)" },
      applications: "Mathematical computations, Tree traversals.",
      interview_notes: "Always define the base case first to avoid stack overflow.",
      java: `int f(int n) { return n<=1 ? 1 : n*f(n-1); }`
    }
  },
  "Backtracking": {
    "Beginner": {
      definition: "Backtracking builds candidates incrementally and abandons them if they can't lead to a valid solution.",
      working: "It uses recursion and state management (choose, explore, un-choose).",
      algorithm: "void solve() { if(found) return; for(choice) { make(choice); solve(); undo(choice); } }",
      time_complexity: { "N-Queens": "O(N!)" },
      applications: "Solving Sudoku, N-Queens, generating permutations.",
      interview_notes: "Crucial step is 'undoing' the choice (backtrack).",
      java: `// backtrace logic`
    }
  },
  "Trees": {
    "Beginner": {
      definition: "A Tree is a non-linear data structure with a root and child nodes.",
      working: "Nodes are linked via pointers. A Binary Tree has at most 2 children.",
      algorithm: "DFS: recursive calls on left and right.",
      time_complexity: { "Traverse": "O(n)", "Search": "O(h)" },
      applications: "File systems, decision trees, DOM tree.",
      interview_notes: "Height vs Depth: height is from leaf, depth is from root.",
      java: `class Node { int v; Node l, r; }`
    }
  },
  "Binary Search Trees": {
    "Beginner": {
      definition: "A BST is an ordered tree where left < parent < right.",
      working: "Searching is similar to Binary Search on an array.",
      algorithm: "In-order traversal of a BST gives elements in sorted order.",
      time_complexity: { "Search": "O(log n)", "Insert": "O(log n)" },
      applications: "Implementing Maps/Sets, databases.",
      interview_notes: "Skewed BST is basically a Linked List.",
      java: `void insert(int v) { // logic }`
    }
  },
  "Heap / Priority Queue": {
    "Beginner": {
      definition: "A Heap is a complete tree with max/min child property.",
      working: "Usually implemented using an array for space efficiency.",
      algorithm: "HEAPIFY: move element up/down to restore property.",
      time_complexity: { "Push": "O(log n)", "Pop": "O(log n)", "Peek": "O(1)" },
      applications: "Dijkstra's Algo, Priority Scheduling, Heapsort.",
      interview_notes: "PriorityQueue in Java is a Min-Heap by default.",
      java: `PriorityQueue<Integer> pq = new PriorityQueue<>();`
    }
  },
  "Hashing": {
    "Beginner": {
      definition: "Hashing provides fast lookups using hash functions.",
      working: "A key is hashed to an index map[hash(key)] = value.",
      algorithm: "h(k) = k % table_size (simple modulo).",
      time_complexity: { "Search": "O(1) avg", "Insert": "O(1) avg" },
      applications: "Database indexing, Caching, Sets.",
      interview_notes: "O(n) worst case if many collisions occur.",
      java: `HashMap<String, Integer> map = new HashMap<>();`
    }
  },
  "Graphs": {
    "Beginner": {
      definition: "A Graph consists of vertices and edges.",
      working: "Represented using Adjacency Matrix or Adjacency List.",
      algorithm: "BFS: visit layer by layer using a Queue.",
      time_complexity: { "BFS": "O(V+E)", "DFS": "O(V+E)" },
      applications: "Social networks, Google Maps, Network routing.",
      interview_notes: "Adjacency list is preferred for sparse graphs.",
      java: `List<Integer>[] adj = new ArrayList[v];`
    }
  },
  "Greedy Algorithms": {
    "Beginner": {
      definition: "Greedy algorithms pick the best local option.",
      working: "Requires greedy choice property and optimal substructure.",
      algorithm: "Sort by a criteria (like profit/weight ratio).",
      time_complexity: { "Sort": "O(n log n)", "Scan": "O(n)" },
      applications: "Huffman coding, Prim's algorithm.",
      interview_notes: "Doesn't always yield global optimum.",
      java: `Arrays.sort(items, (a, b) -> Double.compare(b.ratio, a.ratio));`
    }
  },
  "Dynamic Programming": {
    "Beginner": {
      definition: "DP solves overlapping subproblems.",
      working: "Avoids redundant work by storing sub-results.",
      algorithm: "Define state, state transition, and base case.",
      time_complexity: { "Knapsack": "O(nW)", "Fib": "O(n)" },
      applications: "Optimization problems, sequence alignment.",
      interview_notes: "Look for 'Minimum/Maximum' or 'Total ways' keywords.",
      java: `int[] dp = new int[target + 1];`
    }
  },
  "Bit Manipulation": {
    "Beginner": {
      definition: "Working with data at the bit level.",
      working: "Bitwise operators like &, |, ^ are much faster than arithmetic.",
      algorithm: "Bit Masking: use 1 << i to isolate the i-th bit.",
      time_complexity: { "XOR": "O(1)", "Shift": "O(1)" },
      applications: "Compression, Cryptography, Low-level optimization.",
      interview_notes: "XOR of same numbers is 0. XOR with 0 is the number itself.",
      java: `int x = a ^ b;`
    }
  },
  "Tries": {
    "Beginner": {
      definition: "A Trie stores a re-accessible set of strings.",
      working: "Common prefixes are shared among nodes, saving space.",
      algorithm: "INSERT: traverse/create nodes for each character.",
      time_complexity: { "Search": "O(L)", "Insert": "O(L)" },
      applications: "Autocomplete, Spell checker, IP routing.",
      interview_notes: "L is the length of the string, making it faster than hashing for prefix search.",
      java: `class TrieNode { TrieNode[] children = new TrieNode[26]; boolean isEnd; }`
    }
  },
  "Segment Trees": {
    "Beginner": {
      definition: "A Segment Tree facilitates range queries.",
      working: "It's a full binary tree where each node represents an interval sum/min/max.",
      algorithm: "QUERY: O(log n) by traversing tree levels.",
      time_complexity: { "Query": "O(log n)", "Update": "O(log n)" },
      applications: "Competitive programming, computational geometry.",
      interview_notes: "Requires 4n space for n elements.",
      java: `void build(int node, int start, int end) { // logic }`
    }
  },
  "Disjoint Set (Union Find)": {
    "Beginner": {
      definition: "DSU manages elements into non-overlapping sets.",
      working: "Each set is a tree identifying its parent. Root is the set representative.",
      algorithm: "FIND(i) with Path Compression: parent[i] = find(parent[i]).",
      time_complexity: { "Union": "O(α(n))", "Find": "O(α(n))" },
      applications: "Kruskal's MST, detecting cycles in undirected graphs.",
      interview_notes: "α(n) is the Inverse Ackermann function (extremely slow growth).",
      java: `int find(int i) { if(p[i]==i) return i; return p[i]=find(p[i]); }`
    }
  },
  "Advanced Graph Algorithms": {
    "Beginner": {
      definition: "Advanced algorithms for complex graph metrics.",
      working: "Techniques like Greedy (Dijkstra) or Dynamic Programming (Floyd-Warshall).",
      algorithm: "DIJKSTRA: pick min dist node and relax its edges.",
      time_complexity: { "Dijkstra": "O(E log V)", "Kruskal": "O(E log E)" },
      applications: "GPS Navigation, Network Reliability, Logistics.",
      interview_notes: "Know when to use BFS (unweighted) vs Dijkstra (weighted).",
      java: `// Advanced Graph logic`
    }
  }
};

function getLocalData(mod, level) {
  return LOCAL_MODULE_DATA?.[mod]?.[level] || null;
}

export default function App() {
  useGlobalStyle(GLOBAL_CSS);
  const [screen, setScreen] = useState("home");
  const [module, setModule] = useState(null);
  const [subScreen, setSubScreen] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [level, setLevel] = useState("Beginner");
  const [data, setData] = useState(null);
  const [selectedPlaygroundAlg, setSelectedPlaygroundAlg] = useState("bubble_sort");

  // Real auth state — restore from sessionStorage or URL hash (from email confirmation) on mount
  const [user, setUser] = useState(() => {
    try {
      if (typeof window === "undefined") return null;

      // 1. Check if returning from an email confirmation link (hash contains access_token)
      const hash = window.location.hash.substring(1);
      if (hash && hash.includes("access_token")) {
        const params = new URLSearchParams(hash);
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        if (access_token) {
          const session = {
            access_token,
            refresh_token,
            user: { id: "user" }, // We will fetch real user details in useEffect
            name: "Student",
            username: "student",
          };
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));

          if (typeof window.history !== "undefined") {
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
          }
          return session;
        }
      }

      // 2. Otherwise use existing session storage
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [progress, saveProgress] = useProgress(user?.user?.id || user?.username);
  const { analytics, logSession } = useAnalytics(user?.user?.id || user?.username);
  const [showProgress, setShowProgress] = useState(false);

  // Verify stored session is still valid on mount, and grab user data if we just logged in via email link
  useEffect(() => {
    if (!user?.access_token) return;
    supabase.getUser(user.access_token).then(userData => {
      if (!userData) {
        sessionStorage.removeItem(SESSION_KEY);
        setUser(null);
      } else if (user.name === "Student" && userData.user_metadata?.display_name) {
        // Update temporary stub from email link with real user data
        const updatedSession = {
          ...user,
          user: userData,
          name: userData.user_metadata.display_name,
          username: userData.email?.split("@")[0] || "student"
        };
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession));
        setUser(updatedSession);
      }
    }).catch(() => {
      // Network error — keep session, don't log out
    });
  }, [user?.access_token]);

  useEffect(() => {
    if (!module) return;
    // Show local data INSTANTLY — no loading delay
    setData(getLocalData(module, level));
    // Silently try backend in background for richer content
    const encodedModule = encodeURIComponent(module);
    const encodedLevel = encodeURIComponent(level);

    // Auto-switch based on environment
    const API_BASE = window.location.hostname === "localhost"
      ? "http://localhost:8000"
      : "https://backend-vix7.onrender.com";

    fetch(`${API_BASE}/module/${encodedModule}/${encodedLevel}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(backendData => setData(backendData))
      .catch(() => { /* backend sleeping — local data already shown */ });
  }, [module, level]);

  const selectModule = (mod) => {
    setModule(mod);
    setSubScreen(null);
    setScreen("module");
    saveProgress("last_module", mod);
  };

  const handleLogin = (session) => {
    setUser(session);
    setShowLogin(false);
    setScreen("home");
  };

  const handleLogout = async () => {
    if (user?.access_token) {
      try { await supabase.signOut(user.access_token); } catch { }
    }
    sessionStorage.removeItem(SESSION_KEY);
    setUser(null);
    setScreen("home");
    setModule(null);
    setSubScreen(null);
  };

  if (!user && showLogin) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
        <AnimatePresence mode="wait">
          <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <LoginScreen onLogin={handleLogin} onBack={() => setShowLogin(false)} />
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text)" }}>
      <AnimatePresence mode="wait">
        {screen === "home" && (
          <motion.div key="home" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.4 }}>
            <HomeScreen onEnter={() => setScreen("dsa")} user={user} onLogout={handleLogout} progress={progress} onLoginClick={() => setShowLogin(true)} onSettings={() => setScreen("settings")} onProgress={() => setShowProgress(true)} />
          </motion.div>
        )}
        {screen === "dsa" && (
          <motion.div key="dsa" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <DSAScreen
              level={level} setLevel={setLevel} onSelectModule={selectModule}
              onBack={() => setScreen("home")} progress={progress} user={user}
              onSettings={() => setScreen("settings")} analytics={analytics}
              logSession={logSession} onShowProgress={() => setShowProgress(true)}
              onExploreVisualizer={(alg) => { setSelectedPlaygroundAlg(alg); setScreen("playground"); }}
            />
          </motion.div>
        )}
        {screen === "playground" && (
          <motion.div key="playground" initial={{ opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.4 }}>
            <VisualPlayground onBack={() => setScreen("dsa")} initialAlg={selectedPlaygroundAlg} />
          </motion.div>
        )}
        {screen === "settings" && (
          <motion.div key="settings" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.3 }}>
            <SettingsScreen user={user} onBack={() => setScreen("home")} onLogout={handleLogout} onShowProgress={() => setShowProgress(true)} />
          </motion.div>
        )}
        {screen === "module" && (
          <motion.div key="module" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <ModuleScreen module={module} data={data} subScreen={subScreen} setSubScreen={setSubScreen} onBack={() => { setScreen("dsa"); setSubScreen(null); }} logSession={logSession} />
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showProgress && <ProgressTrackingDashboard analytics={analytics} onClose={() => setShowProgress(false)} />}
      </AnimatePresence>
    </div>
  );
}
