// app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { db } from "../../firebase"; // Adjust path if your firebase.ts is elsewhere
import { collection, query, where, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar";

type FeedbackEntry = {
  id: string;
  roomName: string;
  score: number;
  wentWell: string;
  toImprove: string;
  insteadOf: string;
  tryThis: string;
  culturalTip: string;
  createdAt?: any;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [feedbackList, setFeedbackList] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    async function fetchFeedback() {
      if (!user) return;
      try {
        const feedbackRef = collection(db, "feedback");
        // Query only the documents belonging to this user
        const q = query(feedbackRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        
        const results: FeedbackEntry[] = [];
        snapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() } as FeedbackEntry);
        });

        // Sort locally to avoid needing a composite index in Firebase
        results.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA; // Newest first
        });

        setFeedbackList(results);
      } catch (error) {
        console.error("Error fetching feedback:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeedback();
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>
      </div>
    );
  }

  const averageScore = feedbackList.length > 0 
    ? Math.round(feedbackList.reduce((acc, curr) => acc + curr.score, 0) / feedbackList.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      <main className="mx-auto max-w-5xl p-6 sm:p-10">
        <header className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-blue-950">Your Progress</h1>
          <p className="mt-2 text-lg text-slate-500">Review your past scenarios and track your fluency.</p>
        </header>

        {/* Overview Stats */}
        <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Average Score</p>
            <p className="mt-2 text-5xl font-black text-blue-600">{averageScore}<span className="text-2xl text-slate-400">/100</span></p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Practices Completed</p>
            <p className="mt-2 text-5xl font-black text-blue-950">{feedbackList.length}</p>
          </div>
        </div>

        {/* Feedback List */}
        <h2 className="mb-6 text-xl font-bold text-blue-950">Recent Feedback</h2>
        
        {feedbackList.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center">
            <p className="text-slate-500">You haven't completed any practice scenarios yet.</p>
            <button 
              onClick={() => router.push("/home")} 
              className="mt-4 rounded-full bg-blue-600 px-6 py-3 font-bold text-white shadow hover:bg-blue-700"
            >
              Start Your First Practice
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {feedbackList.map((feedback) => (
              <div key={feedback.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between bg-slate-50 px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                      {feedback.score}
                    </span>
                    <span className="font-bold text-blue-950">Score</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-400">
                    {feedback.createdAt ? new Date(feedback.createdAt.seconds * 1000).toLocaleDateString() : "Recent"}
                  </span>
                </div>
                
                <div className="p-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-emerald-600">What went well</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{feedback.wentWell}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold uppercase tracking-wider text-rose-500">To Improve</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{feedback.toImprove}</p>
                  </div>
                  <div className="sm:col-span-2 rounded-2xl bg-blue-50 p-5">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-blue-600">Cultural Tip</h4>
                    <p className="mt-2 text-sm leading-6 text-blue-950">{feedback.culturalTip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}