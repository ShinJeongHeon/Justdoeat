import { useReveal } from "../hooks";
import { SpoonBadge } from "./SpoonCheck";

/* ── [2] 결정 피로 — "어느 단톡방" 채팅 재연 ──────────
   기능 설명 대신 매일 겪는 장면을 그대로 보여준다.
   타임스탬프 = 흘러가는 시간, 마지막 결론 카드 = 제품의 등장 */
const CHAT = [
  { type: "time", text: "오전 11:28" },
  { type: "l", text: "점심 뭐 먹을까요?" },
  { type: "r", text: "아무거나 좋아요" },
  { type: "l", text: "어제도 아무거나라고 하셨어요" },
  { type: "r", text: "그럼 김치찌개…? 아, 어제 먹었네" },
  { type: "time", text: "오전 11:41 — 아직 못 정함" },
];

export function DecisionLoop() {
  const ref = useReveal();
  return (
    <section className="section band reveal" ref={ref}>
      <div className="wrap-narrow">
        <p className="eyebrow center-eyebrow">오전 11시 30분, 어느 단톡방</p>
        <div
          className="chat"
          role="img"
          aria-label="점심 메뉴를 정하지 못하고 겉도는 단체 대화. Just do eat이 뚝배기집 김치찌개로 결론을 내려준다."
        >
          {CHAT.map((m, i) =>
            m.type === "time" ? (
              <span className="chat-time" key={i} style={{ "--i": i }}>{m.text}</span>
            ) : (
              <span className={"bubble " + m.type} key={i} style={{ "--i": i }}>{m.text}</span>
            )
          )}
          <div className="chat-decision" style={{ "--i": CHAT.length }}>
            <SpoonBadge size={30} />
            <span className="cd-body">
              <b>오늘 점심, 이걸로 정했어요</b>
              <span>뚝배기집 김치찌개 · 도보 3분 · 84점</span>
            </span>
          </div>
        </div>
        <p className="display-m loop-line">
          이 대화, 내일 또 합니다. <em>1년이면 250번.</em>
        </p>
        <p className="section-sub center">
          인생은 선택의 연속. <b>점심만큼은 고민하지 마세요.</b> 결론만 받아 보세요.
        </p>
      </div>
    </section>
  );
}

/* ── [3] 작동 방식 3단계 ─────────────────────────── */
const STEPS = [
  {
    title: "내 조건 그대로",
    desc: "예산·알레르기·일정·날씨. 한 번만 알려주면 매일 자동으로 반영됩니다.",
    ui: (
      <div className="step-ui">
        <span className="ctx-chip">예산 10,000원</span>
        <span className="ctx-chip">갑각류 제외</span>
        <span className="ctx-chip">12:30 회의</span>
        <span className="ctx-chip">비 예보 반영</span>
      </div>
    ),
  },
  {
    title: "매일 TOP 3 + 이유",
    desc: "무한 리스트 대신 오늘의 결론. 왜 이 집인지 근거까지 보여드려요.",
    ui: (
      <div className="step-ui step-top3">
        <div className="mini-row first"><span className="plate xs" aria-hidden="true">🍲</span><b>뚝배기집</b><span className="mini-score">84점</span></div>
        <div className="mini-row"><span className="plate xs" aria-hidden="true">🍜</span>명동칼국수<span className="mini-score">79점</span></div>
        <div className="mini-row"><span className="plate xs" aria-hidden="true">🥣</span>진국설렁탕<span className="mini-score">76점</span></div>
      </div>
    ),
  },
  {
    title: "먹을수록 정확하게",
    desc: "좋았어요 한 번이면 다음 추천이 달라집니다. 쓸수록 내 입맛에 가까워져요.",
    ui: (
      <div className="step-ui">
        <span className="fb-pill like">좋았어요</span>
        <span className="fb-pill">별로였어요</span>
        <span className="fb-pill">다신 안 가요</span>
        <span className="step-note">다음 추천에 바로 반영</span>
      </div>
    ),
  },
];

export function HowItWorks() {
  const ref = useReveal();
  return (
    <section className="section reveal" ref={ref}>
      <div className="wrap-narrow">
        <p className="eyebrow">작동 방식</p>
        <h2 className="display-l">설정은 한 번. <em>결정은 매일 3초.</em></h2>
        <div className="steps">
          {STEPS.map((s, i) => (
            <div className="step-card" key={s.title} style={{ "--i": i }}>
              <span className="step-badge">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              {s.ui}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── [4] 킬러 피처 — "왜 이 집이에요?" ─────────────── */
const WHY_ROWS = [
  { label: "기본 점수", value: "+72", tone: "" },
  { label: "비 오는 날, 뜨끈한 국물", value: "+10", tone: "plus" },
  { label: "도보 3분", value: "+6", tone: "plus" },
  { label: "예산 1,000원 여유", value: "+4", tone: "plus" },
  { label: "12시 혼잡 예상", value: "−5", tone: "minus" },
  { label: "어제도 한식", value: "−3", tone: "minus" },
];

export function KillerFeature() {
  const ref = useReveal();
  return (
    <section className="section band reveal" ref={ref}>
      <div className="wrap-narrow why-grid">
        <div className="why-copy">
          <p className="eyebrow brand">킬러 피처</p>
          <h2 className="display-l">왜 이 집이에요?</h2>
          <p className="section-sub">
            점수가 어떻게 만들어졌는지, 2위와는 왜 갈렸는지까지 전부 공개합니다.
            근거를 보여줄 수 없는 추천은 하지 않아요.
          </p>
        </div>
        <div className="why-panel">
          <div className="why-head">
            <span className="plate xs" aria-hidden="true">🍲</span>
            <b>뚝배기집</b> <span className="why-menu">김치찌개</span>
          </div>
          {WHY_ROWS.map((r, i) => (
            <div className="bd-row" key={r.label} style={{ "--i": i }}>
              <span>{r.label}</span>
              <b className={r.tone}>{r.value}</b>
            </div>
          ))}
          <div className="why-total" style={{ "--i": WHY_ROWS.length }}>
            <span>오늘의 매치</span><b>84점</b>
          </div>
          <div className="why-vs" style={{ "--i": WHY_ROWS.length + 1 }}>
            <span className="hd">VS 2위 명동칼국수</span>
            국물 점수는 같았지만, 12시 혼잡 감점에서 갈렸어요. <b>84 : 79</b>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── [5] 신뢰 장치 — 당일 인증 리뷰 ─────────────────── */
export function TrustBand() {
  const ref = useReveal();
  return (
    <section className="section reveal" ref={ref}>
      <div className="wrap-narrow trust">
        <p className="eyebrow">당일 인증 리뷰</p>
        <h2 className="display-l">그날 결정한 사람만, 그날만.</h2>
        <div className="trust-flow" role="img" aria-label="오늘 결정하면 오늘만 리뷰를 쓸 수 있고, 내일이면 마감됩니다">
          <span className="trust-chip">오늘 결정</span>
          <span className="trust-arrow" aria-hidden="true">→</span>
          <span className="trust-chip">오늘만 리뷰 가능</span>
          <span className="trust-arrow" aria-hidden="true">→</span>
          <span className="trust-chip dim">내일이면 마감</span>
        </div>
        <p className="section-sub center">
          가 보지 않은 집에는 리뷰를 쓸 수 없어요. <b>허위 리뷰가 구조적으로 불가능합니다.</b>
        </p>
      </div>
    </section>
  );
}

/* ── [6] 기록·리포트 미리보기 ─────────────────────── */
const CAL_MEALS = { 1: "🍲", 2: "🥗", 3: "🍜", 6: "🍱", 7: "🍢", 8: "🥣" };
const CAL_DOTS = { 1: "like", 3: "like", 6: "like", 7: "dislike" };
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

export function RecordPreview() {
  const ref = useReveal();
  const cells = [];
  for (let i = 0; i < 3; i++) cells.push(<span className="cal-cell blank" key={"b" + i} />);
  for (let d = 1; d <= 14; d++) {
    cells.push(
      <span className={"cal-cell" + (d === 8 ? " today" : "")} key={d}>
        {d}
        {CAL_MEALS[d] && <span className="emo" aria-hidden="true">{CAL_MEALS[d]}</span>}
        {CAL_DOTS[d] && <span className={"dot " + CAL_DOTS[d]} />}
      </span>
    );
  }
  return (
    <section className="section reveal" ref={ref}>
      <div className="wrap-narrow">
        <p className="eyebrow">기록 · 리포트</p>
        <h2 className="display-l">석 달 뒤엔, 나보다 <em>내 입맛</em>을 잘 압니다</h2>
        <p className="section-sub">
          결정은 식사 달력과 월간 리포트로 남고, 좋아요·별로 피드백은 다음 추천에 바로 반영됩니다.
        </p>
        <div className="record-stack">
          <div className="record-card tilt-l">
            <h3 className="record-title">7월 식사 달력</h3>
            <div className="cal-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
            <div className="cal-grid">{cells}</div>
          </div>
          <div className="record-card tilt-r">
            <h3 className="record-title">6월 리포트</h3>
            <div className="stat-grid">
              <div className="stat"><span className="v">21<small>회</small></span><span className="l">점심 기록</span></div>
              <div className="stat"><span className="v">196,500<small>원</small></span><span className="l">이번 달 지출</span></div>
              <div className="stat"><span className="v">9,357<small>원</small></span><span className="l">평균 한 끼</span></div>
              <div className="stat"><span className="v">5<small>곳</small></span><span className="l">새로 간 집</span></div>
            </div>
            <h4 className="record-sub">카테고리</h4>
            {[["한식", 43], ["일식", 19], ["분식", 14], ["샐러드", 14]].map(([l, v]) => (
              <div className="bar-row" key={l}>
                <span className="lbl">{l}</span>
                <span className="track"><span className="fill" style={{ width: v + "%" }} /></span>
                <span className="val">{v}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── [7] 나머지 기능 — 텍스트 칩 한 줄 ─────────────── */
export function FeatureChips() {
  const ref = useReveal();
  return (
    <section className="section slim reveal" ref={ref}>
      <div className="wrap-narrow">
        <p className="eyebrow center-eyebrow">이런 것까지 챙깁니다</p>
        <div className="feature-line">
          <span className="feature-chip">혼잡도</span>
          <span className="feature-chip">영양정보</span>
          <span className="feature-chip">원산지</span>
          <span className="feature-chip">출장 모드<small>낯선 동네에서도</small></span>
          <span className="feature-chip">지도</span>
        </div>
      </div>
    </section>
  );
}
