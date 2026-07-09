import { useState } from "react";
import { fmtInt } from "../lib/format";
import { SpoonMark } from "./SpoonCheck";

const TOP_N = 6;

// 병합 힌트 — 표기 흔들림을 정규화 키로 합쳤음을 숨기지 않는다 (정규화 투명성)
function MergeHint({ variants }) {
  if (!variants || variants.length < 2) return null;
  return (
    <span className="merge-hint" tabIndex={0}>
      ·병합 {variants.length}
      <span className="tip" role="tooltip">{variants.join(" / ")}</span>
    </span>
  );
}

// [3] 먼저 열 동네 — ★ 시그니처 히어로 위젯.
// 중립적 "동네별 신청 수"가 아니라 "먼저 열 동네의 순번"으로 프레이밍한다.
// 행 클릭 = 그 동네를 실행 대상으로 고르는 결정 → 아래 목록이 필터된다.
export default function HoodRanking({ ranking, summary, selectedKey, checkKey, onPick }) {
  const [expanded, setExpanded] = useState(false);

  const loading = ranking == null;
  const entries = ranking ?? [];
  const first = entries[0];
  const rest = entries.slice(1);
  const shown = expanded ? rest : rest.slice(0, TOP_N - 1);
  const hiddenCount = rest.length - (TOP_N - 1);
  const max = first ? Number(first.cnt) : 1;
  const rankedSum = entries.reduce((acc, e) => acc + Number(e.cnt), 0);
  const noHood = summary ? Number(summary.total) - rankedSum : null;

  return (
    <section className="panel rank" aria-label="먼저 열 동네">
      <div className="panel-head">
        <h2 className="eyebrow">먼저 열 동네</h2>
        <p className="panel-sub">신청 많은 순서대로 — 랜딩에서 약속한 그대로.</p>
      </div>

      {loading && (
        <div style={{ padding: "18px 6px" }}>
          <span className="skel" style={{ width: "60%" }} />
          <br /><br />
          <span className="skel" style={{ width: "85%" }} />
          <br /><br />
          <span className="skel" style={{ width: "45%" }} />
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="empty">
          <SpoonMark className="mark" />
          <p>아직 신청이 없어요.<br />랜딩에서 첫 신청이 들어오면 여기 나타납니다.</p>
        </div>
      )}

      {!loading && first && (
        <>
          {/* 1위 — 먼저 엽니다. Black Han Sans는 결정을 이름 짓는 순간에만. */}
          <button
            type="button"
            className={selectedKey === first.hood_key ? "rank-first on" : "rank-first"}
            onClick={(e) => onPick(first, e.currentTarget)}
          >
            <span className="rank-first-tag">
              {selectedKey === first.hood_key && (
                <SpoonMark className="ic" draw drawKey={checkKey} />
              )}
              1순위 · 먼저 엽니다
            </span>
            <span className="rank-first-name">
              <span className="name">{first.hood}</span>
              <span className="rank-count">
                {fmtInt(first.cnt)}<small>명</small>
              </span>
              <MergeHint variants={first.variants} />
            </span>
            <span className="rank-track" aria-hidden="true">
              <span className="rank-fill" style={{ width: "100%" }} />
            </span>
            <span className="rank-go">이 동네 명단 보기 →</span>
          </button>

          {/* 2위 이하 — 조밀하게. 순위는 길이 + 숫자 + 이름으로 (색만으로 전달 금지). */}
          {shown.map((e, i) => (
            <button
              key={e.hood_key}
              type="button"
              className={selectedKey === e.hood_key ? "rank-row on" : "rank-row"}
              onClick={(ev) => onPick(e, ev.currentTarget)}
            >
              <span className="rank-pill">{i + 2}</span>
              <span className="rank-hood">
                {e.hood}
                <MergeHint variants={e.variants} />
              </span>
              <span className="rank-track" aria-hidden="true">
                <span
                  className="rank-fill"
                  style={{ width: `${Math.max((Number(e.cnt) / max) * 100, 2)}%` }}
                />
              </span>
              <span className="rank-count">{fmtInt(e.cnt)}</span>
              <span className="rank-go">명단 보기 →</span>
            </button>
          ))}

          {hiddenCount > 0 && (
            <button type="button" className="rank-more" onClick={() => setExpanded((v) => !v)}>
              {expanded ? "접기 ▴" : `기타 ${hiddenCount}개 동네 펼치기 ▾`}
            </button>
          )}

          {noHood != null && noHood > 0 && (
            <p className="rank-note">동네 미입력 {fmtInt(noHood)}명은 랭킹에서 제외됐어요.</p>
          )}
        </>
      )}
    </section>
  );
}
