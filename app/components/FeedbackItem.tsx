type FeedbackItemProps = {
  title: string;
  description: string;
};

export function FeedbackItem({ title, description }: FeedbackItemProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="mt-1 h-2.5 w-2.5 rounded-full bg-blue-600" />
        <div>
          <h3 className="font-semibold text-blue-950">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );
}
