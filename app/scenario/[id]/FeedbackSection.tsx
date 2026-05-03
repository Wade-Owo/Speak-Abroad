"use client";

import { useEffect, useState } from "react";
import { FeedbackItem } from "../../components/FeedbackItem";

export function FeedbackSection({ scenarioId }: { scenarioId: string }) {
  const [feedback, setFeedback] = useState<Record<string, string> | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Example polling logic to check for feedback every 5 seconds 
  // once the user starts the session (triggered by your app logic)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isChecking && !feedback) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/feedback?scenarioId=${scenarioId}`);
          const data = await res.json();
          if (data) {
            setFeedback(data);
            setIsChecking(false);
          }
        } catch (e) {
          console.error("Feedback fetch failed", e);
        }
      }, 5000);
    }

    return () => clearInterval(interval);
  }, [isChecking, feedback, scenarioId]);

  return (
    <section>
      <h2 className="text-xl font-bold text-blue-950">
        {feedback ? "Your Performance Results" : "After the conversation, you'll get feedback on:"}
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {feedback ? (
          Object.entries(feedback).map(([title, description]) => (
            <FeedbackItem
              key={title}
              title={title}
              description={description}
            />
          ))
        ) : (
          <>
            <FeedbackItem
              title="Clarity"
              description="Whether your questions and answers were easy to understand."
            />
            <FeedbackItem
              title="Confidence"
              description="How steady, direct, and prepared you sounded."
            />
            <FeedbackItem
              title="Natural phrasing"
              description="More fluent ways to express the same idea."
            />
            <FeedbackItem
              title="Cultural fit"
              description="Tone and social expectations for the situation."
            />
          </>
        )}
      </div>
      
      {!feedback && (
        <button 
          onClick={() => setIsChecking(true)}
          className="mt-4 text-xs text-slate-400 hover:text-blue-600 transition"
        >
          {isChecking ? "Waiting for results..." : "Check for feedback after finishing"}
        </button>
      )}
    </section>
  );
}