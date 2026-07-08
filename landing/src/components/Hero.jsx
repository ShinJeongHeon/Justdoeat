import { APP_URL } from "../data";
import { SpoonMark } from "./SpoonCheck";
import MiniDemo from "./MiniDemo";

// 데스크톱: 카피+CTA(좌) / 데모(우) · 모바일: 카피 → 데모 → CTA (grid-template-areas)
// 헤드라인은 문답 구조 — 매일 하는 질문에 취소선이 그어지고, 답이 남는다
export default function Hero() {
  return (
    <section className="hero-section">
      <div className="wrap-hero hero-grid">
        <div className="hero-copy">
          <p className="eyebrow brand rise-1">
            <SpoonMark className="ic" /> JUST DO EAT
          </p>
          <h1 className="display-xl rise-2">
            <span className="strike-q">&ldquo;오늘 뭐 먹지?&rdquo;</span>
            <br />
            이제, <em>바로 결정.</em>
          </h1>
          <p className="hero-sub rise-3">
            위치·예산·알레르기·날씨까지 계산해{" "}
            <br className="br-desk" />
            매일 점심 TOP 3를 이유와 함께. 고민은 3초면 끝.
          </p>
        </div>
        <div className="hero-demo rise-4">
          <MiniDemo />
        </div>
        <div className="hero-cta-row rise-5">
          <a className="cta big" href="#waitlist" id="hero-cta">
            <SpoonMark className="ic" draw />
            출시 알림 받기
          </a>
          <a className="linkbtn big" href={APP_URL}>데모 먼저 써보기 →</a>
        </div>
      </div>
    </section>
  );
}
