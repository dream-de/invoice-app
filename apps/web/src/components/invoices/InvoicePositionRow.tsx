"use client";

import { Trash2 } from "lucide-react";

type Position = {
  id: string;
  title: string;
  quantity: number;
  price: number;
};

type Props = {
  position: Position;
  onChange: (id: string, field: string, value: string) => void;
  onRemove: (id: string) => void;
};

export function InvoicePositionRow({ position, onChange, onRemove }: Props) {
  const total = position.quantity * position.price;

  return (
    <div className="grid grid-cols-[1.5fr_110px_140px_140px_50px] items-center gap-3 rounded-[22px] border border-slate-200 bg-white p-3">
      <input
        value={position.title}
        onChange={(event) => onChange(position.id, "title", event.target.value)}
        placeholder="Leistung oder Artikel"
        className="h-12 rounded-full bg-slate-50 px-4 text-sm font-semibold outline-none"
      />

      <input
        type="number"
        value={position.quantity}
        onChange={(event) => onChange(position.id, "quantity", event.target.value)}
        className="h-12 rounded-full bg-slate-50 px-4 text-sm font-semibold outline-none"
      />

      <input
        type="number"
        value={position.price}
        onChange={(event) => onChange(position.id, "price", event.target.value)}
        className="h-12 rounded-full bg-slate-50 px-4 text-sm font-semibold outline-none"
      />

      <div className="text-right text-sm font-black text-slate-900">
        {total.toFixed(2)} €
      </div>

      <button
        type="button"
        onClick={() => onRemove(position.id)}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
