import signupImage from "@/assets/signup-image.jpg";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SignUpForm from "./SignUpForm";
import AnimeSignupStyles from "@/components/SignupStyles";

export const metadata: Metadata = {
  title: "Sign Up",
};

export default function Page() {
  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden bg-[#e8e4f5]">
      <AnimeSignupStyles />

      {/* Same pastel orbs as Login */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-32 -top-32 h-[28rem] w-[28rem] animate-[pulse_7s_ease-in-out_infinite] rounded-full bg-violet-300/35 blur-[110px]" />
        <div className="absolute -bottom-32 -left-32 h-[28rem] w-[28rem] animate-[pulse_6s_ease-in-out_infinite_1.5s] rounded-full bg-fuchsia-300/30 blur-[110px]" />
        <div className="absolute left-1/3 top-1/4 h-64 w-64 animate-[pulse_8s_ease-in-out_infinite_3s] rounded-full bg-indigo-200/30 blur-[80px]" />
      </div>

      {/* Same dot pattern as Login */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(109,40,217,0.2) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Same floating particles as Login */}
      <div className="pointer-events-none absolute inset-0">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? "4px" : "3px",
              height: i % 3 === 0 ? "4px" : "3px",
              left: `${6 + i * 8}%`,
              top: `${10 + ((i * 41) % 80)}%`,
              background: i % 2 === 0 ? "rgba(139,92,246,0.45)" : "rgba(196,131,255,0.4)",
              animation: `float ${3 + (i % 4) * 0.8}s ease-in-out infinite`,
              animationDelay: `${i * 0.38}s`,
              boxShadow: "0 0 6px 2px rgba(139,92,246,0.18)",
            }}
          />
        ))}
      </div>

      {/* Same decorative stars as Login */}
      <div className="pointer-events-none absolute left-[6%] top-[16%] text-2xl text-violet-400/35 animate-[spin_14s_linear_infinite]">✦</div>
      <div className="pointer-events-none absolute right-[8%] top-[18%] text-xl text-fuchsia-400/30 animate-[spin_9s_linear_infinite_reverse]">✧</div>
      <div className="pointer-events-none absolute bottom-[16%] left-[10%] text-lg text-purple-400/30 animate-[spin_11s_linear_infinite]">✦</div>
      <div className="pointer-events-none absolute bottom-[20%] right-[6%] text-2xl text-violet-300/30 animate-[spin_16s_linear_infinite_reverse]">✧</div>

      {/* Main card — same size as Login */}
      <div className="relative z-10 flex h-full max-h-[50rem] w-full max-w-[76rem] overflow-hidden rounded-3xl bg-[#f0edfb]/75 shadow-[0_12px_60px_rgba(109,40,217,0.18),0_2px_16px_rgba(109,40,217,0.1)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-violet-300/40" />
        <div className="pointer-events-none absolute inset-[1px] rounded-3xl border border-white/50" />

        {/* Image side — 62% wide, landscape */}
        <div className="relative hidden md:block md:w-[62%]">
          <Image
            src={signupImage}
            alt=""
            className="h-full w-full object-cover object-center"
          />
          {/* Gentle right-edge fade to blend into form panel */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to left, rgba(240,237,251,0.75) 0%, rgba(240,237,251,0.2) 25%, transparent 55%)" }}
          />
          {/* Subtle top/bottom vignette */}
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(232,228,245,0.25) 0%, transparent 18%, transparent 78%, rgba(232,228,245,0.3) 100%)" }}
          />

          {/* Corner brackets */}
          <div className="absolute left-5 top-5 h-10 w-10 border-l-2 border-t-2 border-violet-400/30 rounded-tl-lg" />
          <div className="absolute bottom-5 right-5 h-10 w-10 border-b-2 border-r-2 border-fuchsia-400/25 rounded-br-lg" />

          {/* Badge */}
          <div className="absolute bottom-8 left-8 rounded-2xl border border-white/40 bg-white/30 px-5 py-3 backdrop-blur-md shadow-lg">
            <p className="font-mono text-[10px] tracking-widest text-violet-600/75 uppercase">Begin Your</p>
            <p className="text-2xl font-black text-violet-800">Journey</p>
          </div>
        </div>

        {/* Form side — 38%, same style as Login */}
        <div className="relative flex w-full flex-col justify-center space-y-5 overflow-y-auto bg-[#ede9fd]/60 p-10 backdrop-blur-sm md:w-[38%]">
          <div className="absolute left-0 right-0 top-0 h-[3px] rounded-tr-3xl bg-gradient-to-l from-violet-400 via-fuchsia-400 to-transparent" />

          <div className="space-y-1 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="h-px w-6 bg-gradient-to-r from-transparent to-violet-400/60" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-violet-500/70 uppercase">
                Create Account
              </span>
              <div className="h-px w-6 bg-gradient-to-l from-transparent to-violet-400/60" />
            </div>
            <h1
              className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-pink-500 bg-clip-text text-4xl font-black tracking-tight text-transparent"
              style={{ fontFamily: "'Rajdhani', 'Orbitron', sans-serif" }}
            >
              StarRail
            </h1>
            <p className="text-sm text-violet-400/70">
              A place where even{" "}
              <span className="italic text-fuchsia-500/80">you</span> can find a friend.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-violet-200/70" />
            <span className="rounded-full border border-violet-300/50 bg-violet-100/60 px-3 py-0.5 font-mono text-[10px] tracking-widest text-violet-500 uppercase">
              Sign Up
            </span>
            <div className="h-px flex-1 bg-violet-200/70" />
          </div>

          <div className="space-y-4">
            <SignUpForm />
            <Link
              href="/login"
              className="block text-center text-sm text-violet-400/80 transition-colors duration-300 hover:text-violet-600 hover:underline"
            >
              Already have an account?{" "}
              <span className="font-semibold text-violet-600">Log in</span>
            </Link>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-br-3xl bg-gradient-to-l from-fuchsia-400/70 via-violet-400/50 to-transparent" />
        </div>
      </div>
    </main>
  );
}