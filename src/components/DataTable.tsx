"use client";

import { useState } from "react";

interface Column {
  key: string;
  label: string;
  format?: (value: unknown) => string;
  hideOnMobile?: boolean;
}

interface Props {
  title: string;
  items: (Record<string, unknown> & { id: string })[];
  columns: Column[];
  onDelete: (id: string) => Promise<void>;
}

export function DataTable({ title, items, columns, onDelete }: Props) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeleting(true);
    try { await onDelete(id); } finally { setDeleting(false); setConfirmId(null); }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 sm:p-5">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-700 text-sm sm:text-base">{title}</h3>
        <span className="text-xs text-slate-400">{items.length}件</span>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">登録なし</p>
      ) : (
        <>
          {/* Desktop: table view */}
          <div className="hidden sm:block overflow-x-auto">
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
                {items.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                    {columns.map(col => (
                      <td key={col.key} className="py-2 px-2 text-slate-700">
                        {col.format ? col.format(item[col.key]) : String(item[col.key] || "—")}
                      </td>
                    ))}
                    <td className="py-2 px-2">
                      <DeleteButton
                        id={item.id}
                        confirmId={confirmId}
                        deleting={deleting}
                        onConfirm={setConfirmId}
                        onDelete={handleDelete}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: card view */}
          <div className="sm:hidden space-y-2">
            {items.map(item => (
              <div key={item.id} className="border border-slate-100 rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    {columns.filter(c => !c.hideOnMobile).map(col => (
                      <div key={col.key} className="flex items-baseline gap-2 text-sm">
                        <span className="text-[10px] text-slate-400 flex-shrink-0 w-12">{col.label}</span>
                        <span className="text-slate-700 font-medium truncate">
                          {col.format ? col.format(item[col.key]) : String(item[col.key] || "—")}
                        </span>
                      </div>
                    ))}
                  </div>
                  <DeleteButton
                    id={item.id}
                    confirmId={confirmId}
                    deleting={deleting}
                    onConfirm={setConfirmId}
                    onDelete={handleDelete}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DeleteButton({ id, confirmId, deleting, onConfirm, onDelete }: {
  id: string; confirmId: string | null; deleting: boolean;
  onConfirm: (id: string | null) => void; onDelete: (id: string) => void;
}) {
  if (confirmId === id) {
    return (
      <button
        onClick={() => onDelete(id)}
        disabled={deleting}
        className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 min-h-[32px] min-w-[32px]"
      >
        確認
      </button>
    );
  }
  return (
    <button
      onClick={() => onConfirm(id)}
      className="text-slate-400 hover:text-red-500 transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
    >
      🗑️
    </button>
  );
}
