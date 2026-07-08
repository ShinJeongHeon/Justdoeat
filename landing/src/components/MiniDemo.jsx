import { useEffect, useMemo, useRef, useState } from "react";
import { CONDITIONS, recommend, won } from "../data";
import { prefersReducedMotion, useTilt } from "../hooks";
import { SpoonMark } from "./SpoonCheck";

const FLIP_MS = 650; // --dur-flip
const SWAP_MS = 320; // 90° 시점 — 뒷면(새 식당) 노출 타이밍

export default function MiniDemo() {
  const [active, setActive] = useState({ rain: false, budget: false, spicy: false, quiet: false });
  const [calc, setCalc] = useState(0); // 재계산 카운터 — 체크 드로잉·플립 재시작 키
  const [flip, setFlip] = useState(null); // { fromEmoji } — 접시 3D 플립 진행 중
  const [announce, setAnnounce] = useState("");
  const [nudge, setNudge] = useState(true); // 첫 칩 원타임 넛지 — 첫 조작 전까지만

  const top3 = useMemo(() => recommend(active), [active]);
  const winner = top3[0];

  // 1위 텍스트·이유 칩은 플립 90° 시점에 교체된다
  const [headline, setHeadline] = useState(winner);
  const swapTimer = useRef();
  const endTimer = useRef();
  useEffect(() => () => { clearTimeout(swapTimer.current); clearTimeout(endTimer.current); }, []);

  const tiltRef = useTilt(3);

  function toggle(id) {
    const next = { ...active, [id]: !active[id] };
    const newTop = recommend(next)[0];
    const changed = newTop.id !== headline.id;

    setActive(next);
    setNudge(false);
    setCalc((c) => c + 1);
    clearTimeout(swapTimer.current);
    clearTimeout(endTimer.current);

    if (changed && !prefersReducedMotion()) {
      // 연타 시 마지막 입력 기준으로 안무 재시작 (calc 키로 애니메이션 리셋)
      setFlip({ fromEmoji: headline.emoji });
      swapTimer.current = setTimeout(() => setHeadline(newTop), SWAP_MS);
      endTimer.current = setTimeout(() => setFlip(null), FLIP_MS + 30);
      setAnnounce(`추천이 바뀌었어요: ${newTop.name} ${newTop.menu}`);
    } else {
      setFlip(null);
      setHeadline(newTop);
      setAnnounce(changed
        ? `추천이 바뀌었어요: ${newTop.name} ${newTop.menu}`
        : `추천 이유가 갱신됐어요: ${newTop.name} ${newTop.menu}`);
    }
  }

  return (
    <div className="demo-card" ref={tiltRef}>
      <div className="demo-eyebrow">
        <SpoonMark className="ic" draw drawKey={calc} />
        <span>오늘 점심, 이걸로 정했어요</span>
      </div>

      <div className="demo-chips" role="group" aria-label="점심 조건 선택">
        {CONDITIONS.map((c) => (
          <button
            key={c.id}
            type="button"
            className={"demo-chip" + (active[c.id] ? " on" : "") + (nudge && c.id === "rain" ? " nudge" : "")}
            aria-pressed={active[c.id]}
            onClick={() => toggle(c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="demo-top">
        <div className="plate-stage">
          {flip ? (
            <div className="plate-flipper" key={calc}>
              <span className="plate face front" aria-hidden="true">{flip.fromEmoji}</span>
              <span className="plate face back" aria-hidden="true">{winner.emoji}</span>
            </div>
          ) : (
            <span className="plate" aria-hidden="true">{headline.emoji}</span>
          )}
        </div>
        <div className="demo-headline" key={headline.id}>
          <div className="demo-name">{headline.name}</div>
          <div className="demo-menu">{headline.menu} · {won(headline.price)}</div>
          <div className="reasons">
            {headline.reasons.map((r) => (
              <span key={r.t} className={"chip" + (r.tone ? " " + r.tone : "")}>{r.t}</span>
            ))}
          </div>
        </div>
        <span className="demo-score">{headline.score}<small>점</small></span>
      </div>

      <div className="demo-alts">
        {top3.slice(1).map((r, i) => (
          <div className="demo-alt" key={`${r.id}-${i}`} style={{ animationDelay: `${i * 60}ms` }}>
            <span className="alt-rank">{i + 2}위</span>
            <span className="plate sm" aria-hidden="true">{r.emoji}</span>
            <span className="demo-alt-name">{r.name}</span>
            <span className="demo-alt-menu">{r.menu}</span>
            <span className="demo-alt-score">{r.score}점</span>
          </div>
        ))}
      </div>

      <p className="demo-hint">조건을 눌러 보세요 — 추천이 다시 계산됩니다</p>
      <div className="visually-hidden" aria-live="polite">{announce}</div>
    </div>
  );
}
