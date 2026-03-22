// ── 減価償却計算エンジン ──────────────────────────────────────────────────────

/** 固定資産 */
export interface FixedAsset {
  id: string;
  name: string;
  category: string;      // 建物, 車両, 工具器具備品, etc.
  acquisitionDate: string; // 取得日
  acquisitionCost: number; // 取得価額
  usefulLife: number;      // 耐用年数
  method: "straight" | "declining"; // 定額法 or 定率法
  residualRate: number;    // 残存割合 (通常0 = 備忘価額1円)
  year: number;
  accountCode: string;     // 対応する勘定科目コード
  note: string;
}

/** 減価償却スケジュール1行 */
export interface DepreciationScheduleLine {
  year: number;
  beginningValue: number; // 期首簿価
  depreciationAmount: number;
  endingValue: number;    // 期末簿価
  accumulatedDepreciation: number;
}

/** 定率法の償却率テーブル（主要な耐用年数） */
const DECLINING_RATES: Record<number, number> = {
  2: 1.000, 3: 0.667, 4: 0.500, 5: 0.400, 6: 0.333,
  7: 0.286, 8: 0.250, 9: 0.222, 10: 0.200, 11: 0.182,
  12: 0.167, 13: 0.154, 14: 0.143, 15: 0.133, 20: 0.100,
  25: 0.080, 30: 0.067, 35: 0.057, 40: 0.050, 45: 0.044, 50: 0.040,
};

/** 定率法の改定償却率 */
const REVISED_RATES: Record<number, number> = {
  2: 1.000, 3: 1.000, 4: 1.000, 5: 0.500, 6: 0.334,
  7: 0.334, 8: 0.334, 9: 0.250, 10: 0.200, 11: 0.200,
  12: 0.200, 13: 0.167, 14: 0.167, 15: 0.143, 20: 0.100,
};

/** 定率法の保証率 */
const GUARANTEE_RATES: Record<number, number> = {
  2: 0, 3: 0.11089, 4: 0.12499, 5: 0.10800, 6: 0.09911,
  7: 0.08680, 8: 0.07909, 9: 0.07126, 10: 0.06552, 11: 0.05992,
  12: 0.05566, 13: 0.05180, 14: 0.04854, 15: 0.04565, 20: 0.03486,
};

function getDecliningRate(life: number): number {
  return DECLINING_RATES[life] || (1 / life * 2);
}

function getRevisedRate(life: number): number {
  return REVISED_RATES[life] || getDecliningRate(life);
}

function getGuaranteeRate(life: number): number {
  return GUARANTEE_RATES[life] || 0;
}

/** 減価償却スケジュールを生成 */
export function calcDepreciationSchedule(asset: FixedAsset): DepreciationScheduleLine[] {
  const lines: DepreciationScheduleLine[] = [];
  const startYear = new Date(asset.acquisitionDate).getFullYear();
  const cost = asset.acquisitionCost;
  const life = asset.usefulLife;

  if (asset.method === "straight") {
    // 定額法
    const annualAmount = Math.floor(cost / life);
    let accumulated = 0;

    for (let y = 0; y < life; y++) {
      const isLast = y === life - 1;
      const remaining = cost - accumulated;
      const dep = isLast ? remaining - 1 : Math.min(annualAmount, remaining - 1);
      accumulated += dep;

      lines.push({
        year: startYear + y,
        beginningValue: cost - (accumulated - dep),
        depreciationAmount: dep,
        endingValue: cost - accumulated,
        accumulatedDepreciation: accumulated,
      });
    }
  } else {
    // 定率法 (250%定率法 - 2012年4月以降取得)
    const rate = getDecliningRate(life);
    const revisedRate = getRevisedRate(life);
    const guaranteeAmount = Math.floor(cost * getGuaranteeRate(life));
    let bookValue = cost;
    let accumulated = 0;
    let useRevised = false;

    for (let y = 0; y < life; y++) {
      const beginning = bookValue;
      let dep: number;

      if (useRevised) {
        dep = Math.floor(beginning * revisedRate);
      } else {
        dep = Math.floor(beginning * rate);
        if (dep < guaranteeAmount) {
          useRevised = true;
          dep = Math.floor(beginning * revisedRate);
        }
      }

      // 最終年は備忘価額1円を残す
      if (y === life - 1 || beginning - dep < 1) {
        dep = beginning - 1;
      }

      accumulated += dep;
      bookValue = beginning - dep;

      lines.push({
        year: startYear + y,
        beginningValue: beginning,
        depreciationAmount: dep,
        endingValue: bookValue,
        accumulatedDepreciation: accumulated,
      });

      if (bookValue <= 1) break;
    }
  }

  return lines;
}

/** 特定年度の減価償却費を取得 */
export function getDepreciationForYear(asset: FixedAsset, year: number): number {
  const schedule = calcDepreciationSchedule(asset);
  const line = schedule.find(l => l.year === year);
  return line?.depreciationAmount || 0;
}

/** 主要な耐用年数一覧 */
export const USEFUL_LIFE_TABLE = [
  { category: "建物（木造）", years: 22 },
  { category: "建物（鉄骨）", years: 34 },
  { category: "建物（RC）", years: 47 },
  { category: "建物附属設備", years: 15 },
  { category: "構築物", years: 15 },
  { category: "機械装置", years: 10 },
  { category: "車両運搬具", years: 6 },
  { category: "工具器具備品", years: 5 },
  { category: "パソコン", years: 4 },
  { category: "ソフトウェア", years: 5 },
  { category: "ソフトウェア（自社利用）", years: 3 },
];
