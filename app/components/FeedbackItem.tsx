type FeedbackItemProps = {
  title: string;
  description: string;
};

export function FeedbackItem({ title, description }: FeedbackItemProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-blue-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}
