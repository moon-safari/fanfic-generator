"use client";

import { Sparkles } from "lucide-react";
import {
  PRODUCT_HERO_EYEBROW,
  PRODUCT_NAME,
  PRODUCT_TAGLINE,
} from "../lib/product";
import { createClient } from "../lib/supabase/client";

export default function LoginPage() {
  const supabase = createClient();

  const signInWith = async (provider: "discord" | "google") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_rgba(9,9,11,0.96)_35%),linear-gradient(180deg,_#09090b_0%,_#111827_100%)] px-4 py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl items-center">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.2fr)_420px]">
          <section className="rounded-[32px] border border-white/8 bg-white/5 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur">
            <p className="text-[11px] uppercase tracking-[0.2em] text-cyan-300">
              {PRODUCT_HERO_EYEBROW}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-200">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold text-white sm:text-4xl">
                  {PRODUCT_NAME}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-7 text-zinc-300 sm:text-base">
                  {PRODUCT_TAGLINE}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                "Memory that stays with the project",
                "Writing help in context",
                "Reuse one draft across outputs",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3 text-sm text-zinc-300"
                >
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/8 bg-zinc-950/80 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Sign in</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Open your saved projects, memory, and outputs.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => signInWith("discord")}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-[#5865F2] px-4 py-3 font-medium text-white transition-colors hover:bg-[#4752C4]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Continue with Discord
              </button>

              <button
                onClick={() => signInWith("google")}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-zinc-700 bg-zinc-900 px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-800"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-zinc-600">
              By continuing, you use the secure sign-in flow for this workspace.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
