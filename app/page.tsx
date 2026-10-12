import Link from "next/link";
import { Leaf, Sprout, ShieldCheck, ArrowRight } from "lucide-react";
import { BackgroundVideo } from "@/components/landing/BackgroundVideo";

export const metadata = {
  title: "AgriSurge — AI Agricultural Intelligence & Farm Insurance Platform",
  description:
    "AI-powered crop recommendations, personalized agricultural guidance, and dynamic risk intelligence for farmers and insurance providers.",
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden text-[#e7ebe6]">
      {/* 1. Background Video Layer */}
      <BackgroundVideo />

      {/* 2. Minimal Top Header: Only AgriSurge Logo / Name */}
      <header className="relative z-20 w-full px-6 py-6 sm:px-10 lg:px-12">
        <div className="mx-auto flex max-w-7xl items-center">
          <Link
            href="/"
            className="flex items-center gap-3 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-lg"
            aria-label="AgriSurge Homepage"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg border border-white/30">
              <Leaf size={22} strokeWidth={2.2} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] sm:text-2xl">
              AgriSurge
            </span>
          </Link>
        </div>
      </header>

      {/* 3. Main Center Content: Title + 2 Completely Transparent Floating Login Options */}
      <main className="relative z-20 flex-1 flex flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-5xl">
          {/* Main Heading */}
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
              Precision Intelligence for Farms.
              <span className="block mt-1 text-emerald-300 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                Data-Driven Protection for Insurers.
              </span>
            </h1>
          </div>

          {/* Completely Transparent Login Areas floating over the farm video */}
          <div className="mt-10 sm:mt-14 grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12 max-w-4xl mx-auto">
            {/* OPTION 1: Login as Farmer */}
            <section
              aria-labelledby="farmer-option-title"
              className="flex flex-col justify-between bg-transparent border-0 p-2 sm:p-4"
              style={{ background: "transparent", border: "none" }}
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600/80 text-white shadow-lg border border-white/30">
                    <Sprout size={22} strokeWidth={2.2} />
                  </div>
                  <h2
                    id="farmer-option-title"
                    className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] sm:text-3xl"
                  >
                    Login as Farmer
                  </h2>
                </div>

                <p className="mt-4 text-base font-medium leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  AI-powered crop recommendations and personalized agricultural guidance.
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href="/login/farmer"
                  id="continue-farmer-btn"
                  className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-all duration-200 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 active:scale-[0.99] cursor-pointer"
                >
                  <span>Continue as Farmer</span>
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-200 group-hover/btn:translate-x-1"
                  />
                </Link>
              </div>
            </section>

            {/* OPTION 2: Login as Insurance Company */}
            <section
              aria-labelledby="insurance-option-title"
              className="flex flex-col justify-between bg-transparent border-0 p-2 sm:p-4"
              style={{ background: "transparent", border: "none" }}
            >
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600/80 text-white shadow-lg border border-white/30">
                    <ShieldCheck size={22} strokeWidth={2.2} />
                  </div>
                  <h2
                    id="insurance-option-title"
                    className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] sm:text-3xl"
                  >
                    Login as Insurance Company
                  </h2>
                </div>

                <p className="mt-4 text-base font-medium leading-relaxed text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  Agricultural risk intelligence, underwriting support, and insurance premium recommendations.
                </p>
              </div>

              <div className="mt-8">
                <Link
                  href="/login/insurance"
                  id="continue-insurance-btn"
                  className="group/btn flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-base font-semibold text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)] transition-all duration-200 hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 active:scale-[0.99] cursor-pointer"
                >
                  <span>Continue as Insurance Company</span>
                  <ArrowRight
                    size={18}
                    className="transition-transform duration-200 group-hover/btn:translate-x-1"
                  />
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Bottom spacer */}
      <div className="relative z-20 h-10 w-full" />
    </div>
  );
}
