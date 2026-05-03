"use client";

import Link from "next/link";
import { useState } from "react";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/home"
          className="text-lg font-bold tracking-tight text-blue-950"
        >
          SpeakAbroad
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-expanded={isMenuOpen}
            aria-label="Open profile menu"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
          >
            WA
          </button>

          {isMenuOpen ? (
            <div className="absolute right-0 top-11 z-50 w-36 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-blue-950/10">
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-blue-700"
              >
                Log out
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
