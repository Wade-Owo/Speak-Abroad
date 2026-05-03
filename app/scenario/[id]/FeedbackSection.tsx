import { FeedbackItem } from "../../components/FeedbackItem";

export function FeedbackSection() {
  return (
    <section>
      <h2 className="text-xl font-bold text-blue-950">
        After the conversation, you&apos;ll get feedback on:
      </h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
      </div>
    </section>
  );
}
