import { useMemo } from "react";
import { fmtDateKey, fmtInt } from "../lib/format";

const W = 320;
const H = 116;
const PAD_X = 8;
const TOP = 14;
const BASE = H - 20; // 베이스라인 — 축·격자는 이것뿐

// [4] 최근 30일 추이 — 단일 네이비 라인 하나. 차트 라이브러리 없음.
export default function TrendChart({ daily, summary }) {
  const days = useMemo(() => {
    const map = new Map((daily ?? []).map((d) => [d.day, Number(d.cnt)]));
    const out = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      out.push({ key: fmtDateKey(d), cnt: map.get(fmtDateKey(d)) ?? 0 });
    }
    return out;
  }, [daily]);

  const loading = daily == null;
  const max = Math.max(...days.map((d) => d.cnt), 1);
  const x = (i) => PAD_X + (i * (W - PAD_X * 2)) / (days.length - 1);
  const y = (cnt) => BASE - (cnt / max) * (BASE - TOP);
  const path = days.map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(d.cnt).toFixed(1)}`).join(" ");
  const todayCnt = summary?.today_new ?? days[days.length - 1].cnt;
  const lastX = x(days.length - 1);
  const lastY = y(days[days.length - 1].cnt);
  // 오늘 라벨이 오른쪽 끝에서 잘리지 않게 왼쪽으로 정렬
  const labelX = Math.min(lastX, W - 14);

  return (
    <section className="panel trend" aria-label="최근 30일 신청 추이">
      <div className="panel-head">
        <h2 className="eyebrow">최근 30일</h2>
      </div>

      {loading ? (
        <div style={{ padding: "24px 6px" }}>
          <span className="skel" style={{ width: "90%" }} />
        </div>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`최근 30일 일별 신청 추이, 오늘 ${fmtInt(todayCnt)}건`}>
            <line x1={PAD_X} y1={BASE} x2={W - PAD_X} y2={BASE} stroke="var(--line2)" strokeWidth="1" />
            <path d={path} fill="none" stroke="var(--navy)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {/* 오늘 지점만 점 강조 + 라벨 */}
            <circle cx={lastX} cy={lastY} r="3.5" fill="var(--navy)" />
            <text
              x={labelX} y={Math.max(lastY - 9, 10)} textAnchor="end"
              fontSize="12" fontWeight="800" fill="var(--ok)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              오늘 +{fmtInt(todayCnt)}
            </text>
          </svg>
          <div className="trend-foot" aria-hidden="true">
            <span>{days[0].key.slice(5).replace("-", ".")}</span>
            <span>오늘</span>
          </div>
        </>
      )}
    </section>
  );
}
