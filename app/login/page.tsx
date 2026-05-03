import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-blue-50 px-5 py-10 text-blue-950 shadow-inner shadow-blue-200/60">
      <section className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl shadow-blue-950/10 sm:p-8">
        <Link
          href="/"
          className="text-lg font-black tracking-tight text-blue-950"
        >
          SpeakAbroad
        </Link>

        <div className="mt-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            Welcome
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-blue-950">
            Sign in to practice
          </h1>
        </div>

        <div className="mt-7 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Email</span>
            <input
              type="email"
              placeholder="student@example.com"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-blue-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">Password</span>
            <input
              type="password"
              placeholder="••••••••"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-blue-950 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />
          </label>
        </div>

        <Link
          href="/home"
          className="mt-7 flex w-full items-center justify-center rounded-full bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          Continue
        </Link>

        <div className="mt-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            or
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <Link
          href="/home"
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
        >
          <GoogleIcon />
          Continue with Google
        </Link>

        <p className="mt-5 text-center text-sm text-slate-500">
          No account setup needed for the hackathon demo.
        </p>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
    >
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.2 3-7.5Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-0.9 6.6-2.4l-3.2-2.5c-.9.6-2 .9-3.4.9a6 6 0 0 1-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.4 13.9a6 6 0 0 1 0-3.8V7.5H3.1a10 10 0 0 0 0 9l3.3-2.6Z"
      />
      <path
        fill="#EA4335"
        d="M12 6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A9.5 9.5 0 0 0 12 2 10 10 0 0 0 3.1 7.5l3.3 2.6A6 6 0 0 1 12 6Z"
      />
    </svg>
  );
}
