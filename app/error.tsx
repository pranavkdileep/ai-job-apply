"use client";

import React from "react";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "linear-gradient(135deg, #C7D0C8, #DCE2DC)" }}
    >
      <div className="bg-card rounded-[28px] p-10 shadow-2xl max-w-md w-full text-center flex flex-col items-center gap-6">
        <div className="h-14 w-14 rounded-full bg-coral-custom/15 flex items-center justify-center">
          <span className="text-2xl">!</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-sm" style={{ color: "#8A8A8A" }}>
            An unexpected error occurred. Please try again.
          </p>
        </div>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-full bg-primary-custom text-card font-bold hover:opacity-90 transition-all"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
