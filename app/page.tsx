import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between font-sans bg-background text-foreground relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800/80 bg-zinc-950/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              AI Job Apply
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors" id="nav-features">Features</a>
            <a href="#applications" className="hover:text-white transition-colors" id="nav-applications">Dashboard</a>
            <a href="#pricing" className="hover:text-white transition-colors" id="nav-pricing">Pricing</a>
          </nav>

          <div>
            <button
              id="btn-connect-profile"
              className="px-4 py-2 text-sm font-medium rounded-full bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-100 hover:bg-zinc-800 transition-all duration-200 shadow-sm"
            >
              Connect Profile
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-24 flex flex-col gap-20">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6 max-w-3xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/5 text-xs text-blue-455 font-medium">
            <span className="animate-pulse">✨</span> Introducing Autonomous Mode v1.0
          </div>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white">
            Let AI Apply for You. <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-violet-500 bg-clip-text text-transparent">
              Get Hired Faster.
            </span>
          </h1>

          <p className="text-base md:text-xl text-zinc-400 leading-relaxed max-w-2xl">
            Autonomously match your profile with open roles, craft tailored resumes, and submit application forms 24/7. Your agent handles the busywork.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4 w-full sm:w-auto">
            <button
              id="btn-start-auto-applying"
              className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-semibold transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transform hover:-translate-y-0.5"
            >
              Start Auto-Applying
            </button>
            <button
              id="btn-upload-resume"
              className="px-8 py-4 rounded-full bg-zinc-900 border border-zinc-850 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-200 font-semibold transition-all duration-200"
            >
              Upload Resume
            </button>
          </div>
        </section>

        {/* Dashboard Preview Section (Glassmorphic Card) */}
        <section className="relative z-10 w-full max-w-5xl mx-auto">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 backdrop-blur-xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 flex gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-800" />
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-800" />
              <span className="w-3.5 h-3.5 rounded-full bg-zinc-800" />
            </div>

            <div className="border-b border-zinc-800/60 pb-6 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Agent Operations</h2>
                <p className="text-xs text-zinc-500">Real-time status of your autonomous application assistant</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Agent Active</span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-950/40 rounded-xl p-5 border border-zinc-800/40 hover:border-zinc-750 transition-colors">
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Total Scanned</div>
                <div className="text-3xl font-extrabold text-white">412</div>
                <div className="text-zinc-400 text-xs mt-1">Across 6 platforms</div>
              </div>
              <div className="bg-zinc-950/40 rounded-xl p-5 border border-zinc-800/40 hover:border-zinc-750 transition-colors">
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Tailored & Sent</div>
                <div className="text-3xl font-extrabold text-white">38</div>
                <div className="text-zinc-400 text-xs mt-1">Ready for review: 5</div>
              </div>
              <div className="bg-zinc-950/40 rounded-xl p-5 border border-zinc-800/40 hover:border-zinc-750 transition-colors">
                <div className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">Interviews Booked</div>
                <div className="text-3xl font-extrabold text-white">2</div>
                <div className="text-zinc-400 text-xs mt-1">Success rate: 5.2%</div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 relative z-10">
          <div className="flex flex-col gap-4 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/50 hover:border-zinc-800 hover:bg-zinc-900/20 transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Resume Personalization</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Every job application receives a tailored PDF resume focusing on the specific keywords and metrics relevant to that listing.
            </p>
          </div>

          <div className="flex flex-col gap-4 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/50 hover:border-zinc-800 hover:bg-zinc-900/20 transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Autopilot Form Filling</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Our AI navigates complicated forms, correctly inputs standard and customized answers, and handles work history questionnaires.
            </p>
          </div>

          <div className="flex flex-col gap-4 p-6 rounded-2xl border border-zinc-900 bg-zinc-950/50 hover:border-zinc-800 hover:bg-zinc-900/20 transition-all duration-300">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white">Smart Match Analytics</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Tracks match scores for every listing. If a job has less than an 80% fit, the agent flags it for manual review rather than submitting.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-8 px-6 bg-zinc-950/40 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <div>
            &copy; {new Date().getFullYear()} AI Job Apply. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-zinc-300 transition-colors">Terms of Service</a>
            <a href="#support" className="hover:text-zinc-300 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
