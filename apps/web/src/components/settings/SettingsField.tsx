import { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  children?: ReactNode;
};

export function SettingsField({ label, children, className = "", ...props }: Props) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase text-slate-500">
        {label}
      </span>

      {children ?? (
        <input
          {...props}
          className={`h-12 w-full rounded-full bg-slate-50 px-5 text-sm font-semibold outline-none ring-1 ring-slate-200 ${className}`}
        />
      )}
    </label>
  );
}
