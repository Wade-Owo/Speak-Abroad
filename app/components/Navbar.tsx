// app/components/Navbar.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// Notice we use "export default function" so the imports don't crash!
export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/home"
          className="text-lg font-bold tracking-tight text-blue-950 hover:opacity-80 transition-opacity"
        >
          SpeakAbroad
        </Link>
        
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              {/* Here is your missing Dashboard Link! */}
              <Link href="/dashboard" className="text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              
              <span className="hidden sm:inline text-sm text-slate-400">|</span>
              
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen((current) => !current)}
                  aria-expanded={isMenuOpen}
                  aria-label="Open profile menu"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-800 shadow-sm transition hover:bg-blue-100"
                >
                  {/* Shows the first letter of the user's name, or 'U' for User */}
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 top-11 z-50 w-36 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-blue-950/10">
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="block w-full text-left rounded-xl px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-blue-700"
                    >
                      Log out
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <Link href="/login" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-blue-700">
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}