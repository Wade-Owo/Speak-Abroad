import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-12 text-blue-950">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <div className="rounded-full border border-blue-100 bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
          AI roleplay for real student moments
        </div>
        <h1 className="mt-8 text-5xl font-black tracking-tight sm:text-7xl">
          SpeakAbroad
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
          Helping international students build confidence through real
          conversations.
        </p>
        <Link
          href="/home"
          className="mt-8 rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
        >
          Get Started
        </Link>
        <p className="mt-4 text-sm font-medium text-slate-500">
          Practice before the moment happens.
        </p>

        <div className="mt-12 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-blue-950/10 sm:p-8">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 sm:p-10">
            <div className="mx-auto flex max-w-xl flex-col gap-4">
              <div className="mr-10 rounded-2xl rounded-bl-sm bg-white p-4 text-left shadow-md">
                <p className="text-sm font-semibold text-blue-950">
                  Where can I find notebooks?
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Clear question practice
                </p>
              </div>
              <div className="ml-12 rounded-2xl rounded-br-sm bg-blue-600 p-4 text-left text-white shadow-md">
                <p className="text-sm font-semibold">
                  Aisle four, near the checkout.
                </p>
                <p className="mt-1 text-xs text-blue-100">
                  Realistic follow-up listening
                </p>
              </div>
              <div className="mr-20 rounded-2xl rounded-bl-sm bg-white p-4 text-left shadow-md">
                <p className="text-sm font-semibold text-blue-950">
                  Great, thank you. Could I also get a bag?
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Natural phrasing feedback
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
