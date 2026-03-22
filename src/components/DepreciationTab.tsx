"use client";
import { useState } from "react";
import { calcDepreciationSchedule, USEFUL_LIFE_TABLE, type FixedAsset } from "@/lib/depreciation";

interface Props {
  year: number;
  data: any;
  onRefresh: () => void;
}

export function DepreciationTab({ year, data, onRefresh }: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const assets: FixedAsset[] = data?.fixedAssets || [];
  const selectedAsset = assets.find(a => a.id === selectedAssetId);
  const schedule = selectedAsset ? calcDepreciationSchedule(selectedAsset) : [];

  const totalDepreciation = assets.reduce((sum, asset) => {
    const s = calcDepreciationSchedule(asset);
    const line = s.find(l => l.year === year);
    return sum + (line?.depreciationAmount || 0);
  }, 0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);

    const asset: FixedAsset = {
      id: crypto.randomUUID(),
      name: fd.get("name") as string,
      category: fd.get("category") as string,
      acquisitionDate: fd.get("acquisitionDate") as string,
      acquisitionCost: Number(fd.get("acquisitionCost")),
      usefulLife: Number(fd.get("usefulLife")),
      method: fd.get("method") as "straight" | "declining",
      residualRate: 0,
      year: new Date(fd.get("acquisitionDate") as string).getFullYear(),
      accountCode: "",
      note: fd.get("note") as string,
    };

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "fixed_asset", data: asset }),
      });
      if (!res.ok) throw new Error();
      e.currentTarget.reset();
      onRefresh();
    } catch {
      setError("固定資産の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* 当年度の減価償却費合計 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-amber-500 p-4">
        <div className="text-xs text-slate-500 mb-1">{year}年度 減価償却費合計</div>
        <div className="text-2xl font-bold text-slate-800">{`\u00A5${totalDepreciation.toLocaleString()}`}</div>
      </div>

      {/* 固定資産登録フォーム */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-3">固定資産登録</h3>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">名称</label>
              <input name="name" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">区分（プリセット）</label>
              <select name="category" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                onChange={(ev) => {
                  const preset = USEFUL_LIFE_TABLE.find(u => u.category === ev.target.value);
                  if (preset) {
                    const lifeInput = ev.target.form?.querySelector<HTMLInputElement>('[name="usefulLife"]');
                    if (lifeInput) lifeInput.value = String(preset.years);
                  }
                }}>
                <option value="">-- 選択 --</option>
                {USEFUL_LIFE_TABLE.map(u => (
                  <option key={u.category} value={u.category}>{u.category}（{u.years}年）</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">取得日</label>
              <input name="acquisitionDate" type="date" required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">取得価額（円）</label>
              <input name="acquisitionCost" type="number" min={0} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">耐用年数</label>
              <input name="usefulLife" type="number" min={1} max={50} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">償却方法</label>
              <select name="method" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="straight">定額法</option>
                <option value="declining">定率法</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">メモ</label>
              <input name="note" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {saving ? "保存中..." : "固定資産を登録"}
          </button>
        </form>
      </div>

      {/* 固定資産一覧 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-3">固定資産一覧</h3>
        {assets.length === 0 ? (
          <p className="text-sm text-slate-400">固定資産が登録されていません</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 px-2">名称</th>
                  <th className="py-2 px-2">区分</th>
                  <th className="py-2 px-2">取得日</th>
                  <th className="py-2 px-2 text-right">取得価額</th>
                  <th className="py-2 px-2">耐用年数</th>
                  <th className="py-2 px-2">償却方法</th>
                  <th className="py-2 px-2 text-right">{year}年 償却額</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(a => {
                  const s = calcDepreciationSchedule(a);
                  const line = s.find(l => l.year === year);
                  return (
                    <tr key={a.id} className={`border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${selectedAssetId === a.id ? "bg-sky-50" : ""}`}
                      onClick={() => setSelectedAssetId(selectedAssetId === a.id ? null : a.id)}>
                      <td className="py-2 px-2">{a.name}</td>
                      <td className="py-2 px-2 text-slate-500">{a.category}</td>
                      <td className="py-2 px-2 text-slate-500">{a.acquisitionDate}</td>
                      <td className="py-2 px-2 text-right font-mono">{`\u00A5${a.acquisitionCost.toLocaleString()}`}</td>
                      <td className="py-2 px-2 text-center">{a.usefulLife}年</td>
                      <td className="py-2 px-2">{a.method === "straight" ? "定額法" : "定率法"}</td>
                      <td className="py-2 px-2 text-right font-mono font-bold">
                        {line ? `\u00A5${line.depreciationAmount.toLocaleString()}` : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 減価償却スケジュール */}
      {selectedAsset && schedule.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-bold text-slate-700 mb-3">
            減価償却スケジュール: {selectedAsset.name}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 px-2">年度</th>
                  <th className="py-2 px-2 text-right">期首簿価</th>
                  <th className="py-2 px-2 text-right">償却額</th>
                  <th className="py-2 px-2 text-right">期末簿価</th>
                  <th className="py-2 px-2 text-right">累計償却額</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map(l => (
                  <tr key={l.year} className={`border-b border-slate-100 ${l.year === year ? "bg-amber-50 font-bold" : ""}`}>
                    <td className="py-2 px-2">{l.year}</td>
                    <td className="py-2 px-2 text-right font-mono">{`\u00A5${l.beginningValue.toLocaleString()}`}</td>
                    <td className="py-2 px-2 text-right font-mono">{`\u00A5${l.depreciationAmount.toLocaleString()}`}</td>
                    <td className="py-2 px-2 text-right font-mono">{`\u00A5${l.endingValue.toLocaleString()}`}</td>
                    <td className="py-2 px-2 text-right font-mono">{`\u00A5${l.accumulatedDepreciation.toLocaleString()}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
