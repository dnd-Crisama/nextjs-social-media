import loginImage from "@/assets/login-image.jpg";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LoginForm from "./LoginForm";
import AnimeLoginStyles from "@/components/AnimeLoginStyles";

export const metadata: Metadata = {
  title: "Login",
};

export default function Page() {
  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden bg-[#e8e4f5]">
      <AnimeLoginStyles />

      {/* Muted pastel orbs — dịu hơn */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 -top-32 h-[28rem] w-[28rem] animate-[pulse_7s_ease-in-out_infinite] rounded-full bg-violet-300/35 blur-[110px]" />
        <div className="absolute -bottom-32 -right-32 h-[28rem] w-[28rem] animate-[pulse_6s_ease-in-out_infinite_1.5s] rounded-full bg-fuchsia-300/30 blur-[110px]" />
        <div className="absolute right-1/3 top-1/4 h-64 w-64 animate-[pulse_8s_ease-in-out_infinite_3s] rounded-full bg-indigo-200/30 blur-[80px]" />
      </div>

      {/* Dot pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(109,40,217,0.2) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* Floating particles */}
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

      {/* Decorative stars */}
      <div className="pointer-events-none absolute left-[6%] top-[16%] text-2xl text-violet-400/35 animate-[spin_14s_linear_infinite]">✦</div>
      <div className="pointer-events-none absolute right-[8%] top-[18%] text-xl text-fuchsia-400/30 animate-[spin_9s_linear_infinite_reverse]">✧</div>
      <div className="pointer-events-none absolute bottom-[16%] left-[10%] text-lg text-purple-400/30 animate-[spin_11s_linear_infinite]">✦</div>
      <div className="pointer-events-none absolute bottom-[20%] right-[6%] text-2xl text-violet-300/30 animate-[spin_16s_linear_infinite_reverse]">✧</div>

      {/* Main card — to hơn, ảnh chiếm phần lớn */}
      <div className="relative z-10 flex h-full max-h-[46rem] w-full max-w-[72rem] overflow-hidden rounded-3xl bg-[#f0edfb]/75 shadow-[0_12px_60px_rgba(109,40,217,0.18),0_2px_16px_rgba(109,40,217,0.1)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 rounded-3xl border border-violet-300/40" />
        <div className="pointer-events-none absolute inset-[1px] rounded-3xl border border-white/50" />

        {/* Form side — narrow hơn để ảnh to hơn */}
        <div className="relative flex w-full flex-col justify-center space-y-7 overflow-y-auto bg-[#ede9fd]/60 p-10 backdrop-blur-sm md:w-[42%]">
          <div className="absolute left-0 right-0 top-0 h-[3px] rounded-tl-3xl bg-gradient-to-r from-violet-400 via-fuchsia-400 to-transparent" />

          <div className="space-y-1 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <div className="h-px w-6 bg-gradient-to-r from-transparent to-violet-400/60" />
              <span className="font-mono text-[10px] tracking-[0.3em] text-violet-500/70 uppercase">
                Welcome Back
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
              Your universe. Your story. Your realm.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-violet-200/70" />
            <span className="rounded-full border border-violet-300/50 bg-violet-100/60 px-3 py-0.5 font-mono text-[10px] tracking-widest text-violet-500 uppercase">
              Login
            </span>
            <div className="h-px flex-1 bg-violet-200/70" />
          </div>

          <div className="space-y-5">
            <LoginForm />
            <Link
              href="/signup"
              className="block text-center text-sm text-violet-400/80 transition-colors duration-300 hover:text-violet-600 hover:underline"
            >
              Don&apos;t have an account?{" "}
              <span className="font-semibold text-violet-600">Sign up</span>
            </Link>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-bl-3xl bg-gradient-to-r from-fuchsia-400/70 via-violet-400/50 to-transparent" />
        </div>

        {/* Image side — rộng hơn: 58% */}
        <div className="relative hidden md:block md:w-[58%]">
          <Image
            src={loginImage}
            alt=""
            className="h-full w-full object-cover"
          />
          {/* Subtle left-edge fade to blend with form */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#ede9fd]/60 via-transparent to-transparent" style={{ width: "35%" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(237,233,253,0.55) 0%, transparent 30%)" }} />

          {/* Corner brackets */}
          <div className="absolute right-5 top-5 h-12 w-12 border-r-2 border-t-2 border-white/50 rounded-tr-lg" />
          <div className="absolute bottom-5 left-5 h-12 w-12 border-b-2 border-l-2 border-violet-300/40 rounded-bl-lg" />

          {/* Badge */}
          <div className="absolute bottom-8 right-8 rounded-2xl border border-white/35 bg-white/25 px-5 py-3 text-right backdrop-blur-md shadow-lg">
            <p className="font-mono text-[10px] tracking-widest text-violet-600/80 uppercase">Enter Your</p>
            <p className="text-2xl font-black text-violet-800">World</p>
          </div>
        </div>
      </div>
    </main>
  );
}