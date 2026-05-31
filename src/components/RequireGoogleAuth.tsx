import { ArrowLeft, ArrowRight, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

type RequireGoogleAuthProps = {
  moduleName: string;
  children: React.ReactNode;
};

export default function RequireGoogleAuth({ moduleName, children }: RequireGoogleAuthProps) {
  const [isChecking, setIsChecking] = useState(true);
  const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const readSession = async () => {
      if (!supabase) {
        if (isMounted) setIsChecking(false);
        return;
      }

      const { data } = await supabase.auth.getSession();
      const session = data.session;
      const provider = session?.user.app_metadata?.provider;
      const hasGoogleIdentity = session?.user.identities?.some((identity) => identity.provider === "google");

      if (isMounted) {
        setIsGoogleSignedIn(provider === "google" || Boolean(hasGoogleIdentity));
        setIsChecking(false);
      }
    };

    readSession();

    const { data: listener } = supabase?.auth.onAuthStateChange((_event, session) => {
      const provider = session?.user.app_metadata?.provider;
      const hasGoogleIdentity = session?.user.identities?.some((identity) => identity.provider === "google");
      setIsGoogleSignedIn(provider === "google" || Boolean(hasGoogleIdentity));
      setIsChecking(false);
    }) ?? { data: { subscription: null } };

    return () => {
      isMounted = false;
      listener.subscription?.unsubscribe();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError("");

    if (!supabase || !isSupabaseConfigured) {
      setAuthError("Cloud sign-in is not configured yet. Add the required environment settings first.");
      return;
    }

    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });

    if (error) {
      setAuthError(error.message);
      setIsSigningIn(false);
    }
  };

  if (isChecking) {
    return (
      <div className="dd-page items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
      </div>
    );
  }

  if (isGoogleSignedIn) return <>{children}</>;

  return (
    <div className="dd-page relative items-center justify-center p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(250,204,21,0.12),transparent_34%),linear-gradient(135deg,rgba(23,23,23,0.9),rgba(10,10,10,1))]" />

      <section className="relative z-10 w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-950/88 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="dd-icon-box">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs font-bold text-white/55 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>

        <p className="dd-label">Google sign-in required</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight text-white">
          Unlock {moduleName}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/58">
          {moduleName} is connected to your protected DawnDesk workspace. Sign in with Google to continue.
        </p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isSigningIn}
          className="group mt-6 flex w-full items-center justify-between rounded-xl bg-yellow-400 px-4 py-4 text-left font-bold text-black transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-70"
        >
          <span className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-lg border border-black/10 bg-white font-heading text-lg">
              G
            </span>
            <span>
              <span className="block text-sm">{isSigningIn ? "Opening Google..." : "Sign in with Google"}</span>
              <span className="block text-xs font-semibold text-black/55">Required for this module</span>
            </span>
          </span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>

        {authError && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {authError}
          </p>
        )}

        <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-900/70 p-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-yellow-300">
            <ShieldCheck className="h-4 w-4" />
            Guest mode active
          </div>
          <p className="mt-2 text-sm leading-relaxed text-white/52">
            You can still use the dashboard and local tools as a guest. Project and finance workspaces open
            after Google sign-in.
          </p>
        </div>
      </section>
    </div>
  );
}
