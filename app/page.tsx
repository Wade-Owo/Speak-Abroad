import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-blue-50 px-5 py-16 text-blue-950 shadow-inner shadow-blue-200/60 sm:py-20">
      <section className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <h1 className="text-5xl font-black tracking-tight drop-shadow-sm sm:text-7xl">
          SpeakAbroad
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
          Helping international students build confidence through real
          conversations.
        </p>
        <div className="mt-9 w-full max-w-3xl rounded-2xl bg-white/80 p-5 shadow-2xl shadow-blue-950/10 backdrop-blur sm:p-8">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-inner sm:p-10">
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
                  Great, thank you!
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Natural phrasing feedback
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center">
          <Link
            href="/home"
            className="rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-xl shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700"
          >
            Get Started
          </Link>
        </div>
      </section>
    </main>
  );
}
