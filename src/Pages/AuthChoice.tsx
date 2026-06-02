import { ArrowLeft, ArrowRight, Cloud, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";
import { signInWithGoogleDesktop } from "../lib/desktopAuth";

export default function AuthChoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isSwitchingAccount = searchParams.get("switch") === "account";
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(isSupabaseConfigured);

  useEffect(() => {
    let isMounted = true;

    const redirectIfSignedIn = async () => {
      if (!supabase || !isSupabaseConfigured) {
        setIsCheckingSession(false);
        return;
      }

      if (isSwitchingAccount) {
        await supabase.auth.signOut();
        if (isMounted) setIsCheckingSession(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (data.session) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setIsCheckingSession(false);
    };

    void redirectIfSignedIn();

    const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => {
      if (session) {
        navigate("/dashboard", { replace: true });
      } else {
        setIsCheckingSession(false);
      }
    }) ?? { data: { subscription: null } };

    return () => {
      isMounted = false;
      listener.subscription?.unsubscribe();
    };
  }, [isSwitchingAccount, navigate]);

  const handleGoogleSignIn = async () => {
    setAuthError("");

    if (!supabase || !isSupabaseConfigured) {
      setAuthError("Cloud sign-in is not configured yet. Add the required environment settings to continue.");
      return;
    }

    setIsSigningIn(true);
    try {
      await signInWithGoogleDesktop();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : String(error));
      setIsSigningIn(false);
    }
  };

  const handleGuestAccess = () => {
    localStorage.setItem(
      "dawndesk_session",
      JSON.stringify({ mode: "guest", startedAt: new Date().toISOString() }),
    );
    navigate("/dashboard");
  };

  if (isCheckingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-neutral-950 text-white">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-neutral-950 text-white">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-45 blur-[2px]"
        src="/sunflower_field_with_lake.mp4"
        autoPlay
        loop
        muted
      />
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-950/88 to-neutral-950/55" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-yellow-400/15 to-transparent" />

      <div className="relative z-10 grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_520px]">
        <section className="flex flex-col justify-between px-6 py-6 sm:px-10 lg:px-14">
          <Link
            to="/"
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/10 bg-neutral-950/40 px-3 py-2 text-sm font-semibold text-white/70 backdrop-blur transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>

          <div className="max-w-2xl py-10 lg:py-0">
            <img src="/realistic_logo.png" alt="DawnDesk Logo" className="mb-5 h-24 w-24 object-contain" />
            <p className="dd-label">DawnDesk account</p>
            <h1 className="mt-3 font-heading text-4xl font-black leading-tight tracking-tight text-white sm:text-6xl">
              Choose how you want to start your workspace.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/62 sm:text-lg">
              Sign in to prepare cloud sync, or keep moving locally as a guest.
            </p>
          </div>

          <div className="grid max-w-3xl gap-3 pb-4 sm:grid-cols-3">
            {[
              { icon: <Cloud className="h-5 w-5" />, label: "Cloud ready", text: "Prepared for synced profiles." },
              { icon: <ShieldCheck className="h-5 w-5" />, label: "Private by default", text: "Guest mode stays local." },
              { icon: <Sparkles className="h-5 w-5" />, label: "Fast setup", text: "Enter DawnDesk in one step." },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-white/10 bg-neutral-950/55 p-4 backdrop-blur">
                <div className="mb-3 grid h-9 w-9 place-items-center rounded-lg border border-yellow-400/25 bg-yellow-400/10 text-yellow-300">
                  {item.icon}
                </div>
                <h2 className="font-heading text-sm font-bold text-white">{item.label}</h2>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex items-center px-6 pb-8 sm:px-10 lg:px-12 lg:py-12">
          <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-950/86 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-7">
            <div className="mb-6">
              <p className="dd-label">Continue</p>
              <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-white">Welcome to DawnDesk</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Your workspace can be connected to Google later, but choosing now keeps the path clear.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="group flex w-full items-center justify-between rounded-xl border border-white/12 bg-white px-4 py-4 text-left font-bold text-neutral-950 transition-colors hover:bg-yellow-50 disabled:cursor-wait disabled:opacity-70"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-200 bg-white font-heading text-lg text-neutral-950">
                    G
                  </span>
                  <span>
                    <span className="block text-sm">{isSigningIn ? "Opening Google..." : "Sign in with Google"}</span>
                    <span className="block text-xs font-semibold text-neutral-500">Uses secure cloud authentication</span>
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={handleGuestAccess}
                className="group flex w-full items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-4 text-left font-bold text-white transition-colors hover:border-yellow-400/60 hover:bg-neutral-900"
              >
                <span className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg border border-yellow-400/25 bg-yellow-400/10 text-yellow-300">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-sm">Continue as guest</span>
                    <span className="block text-xs font-semibold text-white/45">Local DawnDesk workspace only</span>
                  </span>
                </span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>

            {authError && (
              <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {authError}
              </p>
            )}

            <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-yellow-300">What changes?</p>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                Google sign-in is for identity and future sync. Guest mode keeps today&apos;s DawnDesk experience
                lightweight and device-first.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
