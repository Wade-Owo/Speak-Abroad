import Link from "next/link";

export function Navbar() {
  return (
    <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/home"
          className="text-lg font-bold tracking-tight text-blue-950"
        >
          SpeakAbroad
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-100 bg-blue-50 text-sm font-semibold text-blue-800 shadow-sm">
          WA
        </div>
      </div>
    </header>
  );
}
