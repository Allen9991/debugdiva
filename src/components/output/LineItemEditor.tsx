"use client";

import type { LineItem } from "@/lib/types";
import { formatCurrency } from "@/lib/format";

interface Props {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
}

export function LineItemEditor({ items, onChange }: Props) {
  const update = (id: string, field: keyof LineItem, value: string | number) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.unit_price;
        return updated;
      })
    );
  };

  const remove = (id: string) => onChange(items.filter((i) => i.id !== id));

  const add = () =>
    onChange([
      ...items,
      { id: crypto.randomUUID(), description: "", quantity: 1, unit_price: 0, total: 0, type: "labour" },
    ]);

  return (
    <div>
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 px-1 mb-1">
        <div className="col-span-5">Description</div>
        <div className="col-span-2 text-center">Qty</div>
        <div className="col-span-2 text-right">Rate</div>
        <div className="col-span-2 text-right">Total</div>
        <div className="col-span-1" />
      </div>

      {items.map((item) => (
        <div key={item.id} className="grid grid-cols-12 gap-2 items-center mb-2">
          <div className="col-span-5">
            <input
              className="w-full bg-gray-50 rounded px-2 py-1.5 text-sm border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none"
              value={item.description}
              onChange={(e) => update(item.id, "description", e.target.value)}
              placeholder="Item description"
            />
          </div>
          <div className="col-span-2">
            <input
              className="w-full bg-gray-50 rounded px-2 py-1.5 text-sm text-center border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none"
              type="number"
              min="0"
              step="0.5"
              value={item.quantity}
              onChange={(e) => update(item.id, "quantity", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="col-span-2">
            <input
              className="w-full bg-gray-50 rounded px-2 py-1.5 text-sm text-right border border-transparent focus:border-blue-300 focus:bg-white focus:outline-none"
              type="number"
              min="0"
              step="0.01"
              value={item.unit_price}
              onChange={(e) => update(item.id, "unit_price", parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="col-span-2 text-right text-sm font-medium text-gray-700 pr-1">
            {formatCurrency(item.total)}
          </div>
          <div className="col-span-1 flex justify-center">
            <button
              onClick={() => remove(item.id)}
              className="text-gray-300 hover:text-red-400 text-xl leading-none transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={add}
        className="text-blue-500 text-sm hover:text-blue-700 transition-colors flex items-center gap-1 pl-1 mt-1"
      >
        <span className="text-lg leading-none">+</span> Add line item
      </button>
    </div>
  );
}
