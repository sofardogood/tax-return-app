"use client";

import { useState } from "react";

interface Column {
  key: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  format?: (value: any) => string;
}

interface Props {
  title: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: (Record<string, any> & { id: string })[];
  columns: Column[];
  onDelete: (id: string) => Promise<void>;
}

export function DataTable({ title, items, columns, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    try {
      await onDelete(id);
    } finally {
      setDeleting(false);
      setConfirmId(null);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-700">{title}</h3>
        <span className="text-xs text-slate-400">{items.length}件</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">登録なし</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                {columns.map(col => (
                  <th key={col.key} className="text-left py-2 px-2 text-xs font-medium text-slate-500">
                    {col.label}
                  </th>
                ))}
                <th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const id = item.id as string;
                return (
                  <tr key={id} className="border-b border-slate-50 hover:bg-slate-50">
                    {columns.map(col => (
                      <td key={col.key} className="py-2 px-2 text-slate-700">
                        {col.format ? col.format(item[col.key]) : String(item[col.key] || "—")}
                      </td>
                    ))}
                    <td className="py-2 px-2">
                      {confirmId === id ? (
                        <button
                          onClick={() => handleDelete(id)}
                          disabled={deleting}
                          className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          確認
                        </button>
                      ) : (
                        <button
                          onClick={() => setConfirmId(id)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
