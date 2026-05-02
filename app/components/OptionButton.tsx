"use client";

type OptionButtonProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export function OptionButton({ label, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
        selected
          ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
      }`}
    >
      {label}
    </button>
  );
}
