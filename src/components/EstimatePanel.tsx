"use client";

import type { EstimateParams } from "@/lib/tax-engine";

interface Props {
  params: EstimateParams;
  setParams: (p: EstimateParams) => void;
  result: ReturnType<typeof import("@/lib/tax-engine").estimateTax>;
}

export function EstimatePanel({ params, setParams, result }: Props) {
  const set = (key: keyof EstimateParams, value: number | string) =>
    setParams({ ...params, [key]: value });

  const fmt = (n: number) => `¥${n.toLocaleString()}`;

  return (
    <div className="space-y-6">
      {/* Input form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-700 mb-4">🧮 控除入力</h3>

        <Section title="① 基本控除">
          <Grid>
            <Field label="社会保険料控除" value={params.socialInsurance} onChange={v => set("socialInsurance", v)} />
            <Field label="青色申告特別控除" value={params.blueDeduction} onChange={v => set("blueDeduction", v)} help="65万/55万/10万" />
            <Field label="未登録の追加経費" value={params.extraExpenses} onChange={v => set("extraExpenses", v)} />
            <Field label="iDeCo/小規模企業共済" value={params.ideco} onChange={v => set("ideco", v)} help="全額控除" />
          </Grid>
        </Section>

        <Section title="② 医療費控除">
          <Grid>
            <Field label="医療費支払総額" value={params.medicalTotal} onChange={v => set("medicalTotal", v)} />
            <Field label="保険補填額" value={params.medicalReimbursement} onChange={v => set("medicalReimbursement", v)} />
          </Grid>
        </Section>

        <Section title="③ ふるさと納税">
          <Field label="寄附金合計額" value={params.furusatoDonations} onChange={v => set("furusatoDonations", v)} />
        </Section>

        <Section title="④ 保険料控除">
          <Grid>
            <Field label="一般生命保険料" value={params.lifeInsGeneral} onChange={v => set("lifeInsGeneral", v)} />
            <Field label="介護医療保険料" value={params.lifeInsMedical} onChange={v => set("lifeInsMedical", v)} />
            <Field label="個人年金保険料" value={params.lifeInsPension} onChange={v => set("lifeInsPension", v)} />
            <Field label="地震保険料" value={params.earthquakeInsurance} onChange={v => set("earthquakeInsurance", v)} />
          </Grid>
        </Section>

        <Section title="⑤ 人的控除">
          <Grid>
            <Field label="配偶者の年収（-1=なし）" value={params.spouseIncome} onChange={v => set("spouseIncome", v)} />
          </Grid>
        </Section>

        <Section title="⑥ 追加控除">
          <Grid>
            <SelectField
              label="障害者控除"
              value={(params as unknown as Record<string, unknown>).disabilityType as string || "none"}
              onChange={v => set("disabilityType" as keyof EstimateParams, v)}
              options={[
                { label: "なし", value: "none" },
                { label: "一般障害者", value: "general" },
                { label: "特別障害者", value: "special" },
                { label: "同居特別障害者", value: "cohabiting_special" },
              ]}
            />
            <SelectField
              label="寡婦/ひとり親控除"
              value={(params as unknown as Record<string, unknown>).widowType as string || "none"}
              onChange={v => set("widowType" as keyof EstimateParams, v)}
              options={[
                { label: "なし", value: "none" },
                { label: "寡婦", value: "widow" },
                { label: "ひとり親", value: "single_parent" },
              ]}
            />
            <CheckboxField
              label="勤労学生控除"
              checked={!!(params as unknown as Record<string, unknown>).workingStudent}
              onChange={v => set("workingStudent" as keyof EstimateParams, v ? 1 : 0)}
            />
          </Grid>
        </Section>

        <Section title="⑦ 住宅ローン控除">
          <Grid>
            <Field
              label="住宅ローン残高"
              value={(params as unknown as Record<string, unknown>).housingLoanBalance as number || 0}
              onChange={v => set("housingLoanBalance" as keyof EstimateParams, v)}
            />
            <CheckboxField
              label="初年度"
              checked={!!(params as unknown as Record<string, unknown>).housingLoanFirstYear}
              onChange={v => set("housingLoanFirstYear" as keyof EstimateParams, v ? 1 : 0)}
            />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">取得日</label>
              <input
                type="date"
                value={(params as unknown as Record<string, unknown>).housingLoanDate as string || ""}
                onChange={e => set("housingLoanDate" as keyof EstimateParams, e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-300 outline-none"
              />
            </div>
          </Grid>
        </Section>

        <Section title="⑧ その他">
          <Grid>
            <Field
              label="寄附金控除（ふるさと納税以外）"
              value={(params as unknown as Record<string, unknown>).otherDonations as number || 0}
              onChange={v => set("otherDonations" as keyof EstimateParams, v)}
            />
            <Field
              label="雑損控除（損失額）"
              value={(params as unknown as Record<string, unknown>).casualtyLoss as number || 0}
              onChange={v => set("casualtyLoss" as keyof EstimateParams, v)}
            />
            <Field
              label="雑損控除（保険金）"
              value={(params as unknown as Record<string, unknown>).casualtyInsurance as number || 0}
              onChange={v => set("casualtyInsurance" as keyof EstimateParams, v)}
            />
            <Field
              label="セルフメディケーション"
              value={(params as unknown as Record<string, unknown>).selfMedication as number || 0}
              onChange={v => set("selfMedication" as keyof EstimateParams, v)}
              help="12,000円超が対象"
            />
            <Field
              label="予定納税額"
              value={(params as unknown as Record<string, unknown>).prepaidTax as number || 0}
              onChange={v => set("prepaidTax" as keyof EstimateParams, v)}
            />
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                家事按分割合: {(params as unknown as Record<string, unknown>).homeOfficeRatio as number || 0}%
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={(params as unknown as Record<string, unknown>).homeOfficeRatio as number || 0}
                onChange={e => set("homeOfficeRatio" as keyof EstimateParams, Number(e.target.value))}
                className="w-full"
              />
            </div>
          </Grid>
        </Section>
      </div>

      {/* Results */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-bold text-slate-700 mb-4">📄 計算結果</h3>

        <ResultSection title="A. 収入金額">
          <ResultGrid>
            <ResultItem label="給与収入" value={fmt(result.salary)} />
            <ResultItem label="事業収入" value={fmt(result.business)} />
            <ResultItem label="その他" value={fmt(result.other + result.dividend + result.realEstate + result.capitalGains + result.miscellaneous)} />
            <ResultItem label="合計" value={fmt(result.totalIncome)} bold />
          </ResultGrid>
        </ResultSection>

        <ResultSection title="B. 所得金額">
          <ResultGrid>
            <ResultItem label="給与所得" value={fmt(result.taxableSalary)} sub={`控除 ${fmt(result.salaryDeduction)}`} />
            <ResultItem label="事業所得" value={fmt(result.businessTaxable)} sub={`経費 ${fmt(result.totalExpenses)}`} />
          </ResultGrid>
        </ResultSection>

        <ResultSection title="C. 所得控除">
          <ResultGrid>
            {Object.entries(result.deductions)
              .filter(([k, v]) => v > 0 && k !== "total")
              .map(([k, v]) => {
                const labels: Record<string, string> = {
                  social: "社会保険料", medical: "医療費", furusato: "寄附金",
                  lifeIns: "生命保険料", earthquake: "地震保険料", spouse: "配偶者",
                  dependent: "扶養", ideco: "iDeCo", blue: "青色申告", basic: "基礎控除",
                  disability: "障害者", widow: "寡婦/ひとり親", workingStudent: "勤労学生",
                  otherDonations: "寄附金(その他)", casualty: "雑損", selfMedication: "セルフメディケーション",
                };
                return <ResultItem key={k} label={labels[k] || k} value={fmt(v as number)} />;
              })}
            <ResultItem label="控除合計" value={fmt(result.deductions.total)} bold />
          </ResultGrid>
        </ResultSection>

        <ResultSection title="D. 税額">
          <ResultGrid>
            <ResultItem label="所得税" value={fmt(result.incomeTax)} sub={`課税所得 ${fmt(result.incomeTaxable)}`} />
            <ResultItem label="復興特別所得税" value={fmt(result.reconstructionTax)} sub="所得税×2.1%" />
            <ResultItem label="住民税（概算）" value={fmt(result.residentTax)} sub={`課税所得 ${fmt(result.residentTaxable)}`} />
            {((result as unknown as Record<string, unknown>).housingLoanDeduction as number) > 0 && (
              <ResultItem label="住宅ローン控除" value={fmt((result as unknown as Record<string, unknown>).housingLoanDeduction as number)} color="green" />
            )}
            <ResultItem label="税額合計" value={fmt(result.totalTax)} bold />
          </ResultGrid>
        </ResultSection>

        <ResultSection title="E. 納付・還付">
          <ResultGrid>
            <ResultItem label="源泉徴収済" value={fmt(result.withheld)} />
            {((result as unknown as Record<string, unknown>).prepaidTax as number) > 0 && (
              <ResultItem label="予定納税額" value={fmt((result as unknown as Record<string, unknown>).prepaidTax as number)} />
            )}
            <ResultItem
              label={result.balance > 0 ? "📌 追加納付額" : "🎉 還付予定額"}
              value={fmt(Math.abs(result.balance))}
              bold
              color={result.balance > 0 ? "red" : "green"}
            />
            <ResultItem label="実効税率" value={`${(result.effectiveRate * 100).toFixed(1)}%`} />
          </ResultGrid>
        </ResultSection>

        {result.furusatoLimit > 0 && (
          <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-lg text-sm text-sky-800">
            💡 ふるさと納税 控除上限目安: <strong>{fmt(result.furusatoLimit)}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-sm font-semibold text-slate-600 mb-2">{title}</h4>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">{children}</div>;
}

function Field({ label, value, onChange, help }: {
  label: string; value: number; onChange: (v: number) => void; help?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value) || 0)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-300 outline-none"
      />
      {help && <p className="text-xs text-slate-400 mt-0.5">{help}</p>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-300 outline-none"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function CheckboxField({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2 pt-5">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-300"
      />
      <label className="text-xs font-medium text-slate-500">{label}</label>
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h4 className="text-sm font-semibold text-slate-600 mb-2 border-b border-slate-100 pb-1">{title}</h4>
      {children}
    </div>
  );
}

function ResultGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 md:grid-cols-4 gap-2">{children}</div>;
}

function ResultItem({ label, value, sub, bold, color }: {
  label: string; value: string; sub?: string; bold?: boolean; color?: "red" | "green";
}) {
  const colorClass = color === "red" ? "text-red-600" : color === "green" ? "text-emerald-600" : "text-slate-800";
  return (
    <div className="bg-slate-50 rounded-lg p-2.5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`${bold ? "text-lg font-bold" : "font-semibold"} ${colorClass}`}>{value}</div>
      {sub && <div className="text-xs text-slate-400">{sub}</div>}
    </div>
  );
}
