import { useState } from "react";
import { pmGateway, DbUser } from "../../utils/supabase";
import { Loader2 } from "lucide-react";

interface AuthPanelProps {
  onLogin: (user: DbUser) => void;
}

export default function AuthPanel({ onLogin }: AuthPanelProps) {
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [roleInput, setRoleInput] = useState("Lead Developer");
  
  // Profile Setup State (after registration)
  const [isProfileSetup, setIsProfileSetup] = useState(false);
  const [bioInput, setBioInput] = useState("");
  const [tempUser, setTempUser] = useState<DbUser | null>(null);

  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(""); setAuthSuccess("");
    if (!emailInput.trim() || !passwordInput) return setAuthError("Email and password required.");
    
    setLoading(true);
    const res = await pmGateway.logIn(emailInput.trim(), passwordInput);
    setLoading(false);

    if (res.success && res.user) {
      onLogin(res.user);
    } else {
      setAuthError(res.error || "Login failed.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(""); setAuthSuccess("");
    if (!nameInput.trim() || !emailInput.trim() || !passwordInput) return setAuthError("Fill all fields.");
    
    setLoading(true);
    const res = await pmGateway.signUp(emailInput.trim(), nameInput.trim(), roleInput, passwordInput);
    setLoading(false);

    if (res.success && res.user) {
      setTempUser(res.user);
      setIsProfileSetup(true);
    } else {
      setAuthError(res.error || "Registration failed.");
    }
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempUser) return;
    setLoading(true);
    await pmGateway.updateProfile(tempUser.id, { bio: bioInput });
    setLoading(false);
    onLogin({ ...tempUser, bio: bioInput });
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return setAuthError("Email required for reset link.");
    setAuthSuccess("If the email exists, a password reset link has been sent.");
    setAuthError("");
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] w-full items-center justify-center p-4">
      <div className="w-full max-w-[440px]">
        {/* Header branding */}
        <div className="flex flex-col items-center mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-yellow-400 font-bold mb-2">DawnDesk</p>
          <h1 className="text-3xl font-bold text-white tracking-tight">Project Manager</h1>
          <p className="text-sm text-white/50 mt-2">Sign in to orchestrate your team's workflow.</p>
        </div>

        {/* Auth Card */}
        <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/80 to-neutral-950/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
          
          {isProfileSetup && tempUser ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-white mb-2">Complete Profile</h2>
              <p className="text-xs text-white/50 mb-6">Add a short bio and upload an avatar.</p>
              <form onSubmit={handleProfileSetup} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Short Bio</label>
                  <textarea
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    placeholder="I love building scalable UI..."
                    className="rounded-xl border border-neutral-800 bg-neutral-950/60 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-all h-24 resize-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Profile Photo</label>
                  <input type="file" accept="image/*" className="text-xs text-white/50 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-yellow-400/10 file:text-yellow-400 hover:file:bg-yellow-400/20 cursor-pointer" />
                </div>
                <button type="submit" disabled={loading} className="rounded-xl bg-yellow-400 py-3 text-sm font-bold text-black hover:bg-yellow-300 transition-all mt-2 flex items-center justify-center">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enter Workspace"}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Tab Switcher */}
              <div className="flex bg-neutral-950/50 p-1 rounded-xl border border-neutral-800/80 mb-6">
                <button
                  onClick={() => { setAuthMode("login"); setAuthError(""); setAuthSuccess(""); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === "login" ? "bg-neutral-800/80 text-white shadow-sm border border-neutral-700/50" : "text-white/40 hover:text-white"}`}
                >Log In</button>
                <button
                  onClick={() => { setAuthMode("register"); setAuthError(""); setAuthSuccess(""); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${authMode === "register" ? "bg-neutral-800/80 text-white shadow-sm border border-neutral-700/50" : "text-white/40 hover:text-white"}`}
                >Register</button>
              </div>

              {authError && <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 text-center animate-in fade-in">⚠️ {authError}</div>}
              {authSuccess && <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-xs text-green-400 text-center animate-in fade-in">✓ {authSuccess}</div>}

              {authMode === "login" && (
                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Email</label>
                    <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-colors" placeholder="name@company.com" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Password</label>
                      <button type="button" onClick={() => setAuthMode("forgot")} className="text-[10px] font-medium text-yellow-400 hover:text-yellow-300">Forgot Password?</button>
                    </div>
                    <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-colors" placeholder="••••••••" required />
                  </div>
                  <button type="submit" disabled={loading} className="rounded-xl bg-yellow-400 py-3 mt-2 text-sm font-bold text-black hover:bg-yellow-300 transition-all shadow-[0_0_15px_rgba(250,204,21,0.15)] flex items-center justify-center">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                  </button>
                  <p className="text-center text-[10px] text-white/40 mt-2">
                    For local testing, use elena@dawndesk.com / any password
                  </p>
                </form>
              )}

              {authMode === "register" && (
                <form onSubmit={handleRegister} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Full Name</label>
                    <input type="text" value={nameInput} onChange={e => setNameInput(e.target.value)} className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-colors" placeholder="Jane Doe" required />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Email</label>
                    <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-colors" placeholder="name@company.com" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Password</label>
                      <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-colors" placeholder="••••••••" required minLength={6} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Role</label>
                      <select value={roleInput} onChange={e => setRoleInput(e.target.value)} className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-3 py-3 text-sm text-white outline-none focus:border-yellow-400/50 transition-colors cursor-pointer">
                        <option>Product Manager</option>
                        <option>Lead Developer</option>
                        <option>UI/UX Designer</option>
                        <option>Marketing</option>
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="rounded-xl bg-yellow-400 py-3 mt-2 text-sm font-bold text-black hover:bg-yellow-300 transition-all shadow-[0_0_15px_rgba(250,204,21,0.15)] flex items-center justify-center">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                  </button>
                </form>
              )}

              {authMode === "forgot" && (
                <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Email for Reset Link</label>
                    <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} className="rounded-xl border border-neutral-800 bg-neutral-950/80 px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-yellow-400/50 transition-colors" placeholder="name@company.com" required />
                  </div>
                  <button type="submit" className="rounded-xl bg-yellow-400 py-3 mt-2 text-sm font-bold text-black hover:bg-yellow-300 transition-all">Send Reset Link</button>
                  <button type="button" onClick={() => setAuthMode("login")} className="text-xs text-white/50 hover:text-white mt-2 transition-colors">← Back to Login</button>
                </form>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
