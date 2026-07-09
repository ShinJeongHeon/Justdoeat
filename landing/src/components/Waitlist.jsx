import { useState } from "react";
import { APP_URL } from "../data";
import { SpoonMark } from "./SpoonCheck";
import { useReveal } from "../hooks";
import { supabase } from "../supabaseClient";

// 출시 알림 신청 — Supabase page 테이블에 저장한다.
// 이메일 → email, 전화번호 → phone, 직장 동네 → company 로 매핑.
// 재방문 시 "신청 완료" 상태를 보여주기 위해 localStorage에도 사본을 남긴다.
// 직장 동네 필드가 핵심 훅: "신청이 많은 동네부터 먼저 엽니다."
const KEY = "jde-waitlist";

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || null;
  } catch {
    return null;
  }
}

export default function Waitlist() {
  const ref = useReveal();
  const [saved, setSaved] = useState(load);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = (f.get("email") || "").trim();
    const phone = (f.get("phone") || "").trim();
    const hood = (f.get("hood") || "").trim();

    if (!email && !phone) {
      setError("알림을 보낼 곳이 필요해요 — 이메일과 전화번호 중 하나만 적어주세요.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("이메일 주소 형식을 확인해 주세요.");
      return;
    }
    if (phone && !/^[\d\-+() ]{9,}$/.test(phone)) {
      setError("전화번호를 확인해 주세요. 예: 010-0000-0000");
      return;
    }

    setSubmitting(true);
    // page 테이블에 저장 — 직장 동네(hood)는 company 컬럼으로.
    const { error: dbError } = await supabase.from("page").insert({
      email: email || null,
      phone: phone || null,
      company: hood || null,
    });
    setSubmitting(false);

    if (dbError) {
      setError("신청을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }

    const entry = { email, phone, hood };
    try { localStorage.setItem(KEY, JSON.stringify(entry)); } catch { /* 시크릿 모드 등 */ }
    setError("");
    setSaved(entry);
  }

  return (
    <section className="final-band reveal" id="waitlist" ref={ref}>
      <div className="final-grid">
        <div className="final-copy">
          <SpoonMark className="final-mark" />
          <p className="final-wordmark">JUST DO EAT</p>
          <h2 className="display-m final-line">고민은 여기까지.</h2>
          <p className="final-sub">
            지금은 출시를 준비하고 있어요. 신청해 두시면 열리는 날 가장 먼저
            알려드릴게요. 그동안은 데모로 미리 써볼 수 있습니다.
          </p>
          <a className="linkbtn ghost" href={APP_URL}>데모 먼저 써보기 →</a>
        </div>

        <div className="waitlist-card" aria-live="polite">
          {saved ? (
            <div className="waitlist-done">
              <SpoonMark className="done-mark" draw />
              <h3 className="done-title">신청 완료</h3>
              <p className="done-line">
                {saved.hood
                  ? <>&lsquo;{saved.hood}&rsquo; 점심이 준비되는 대로 가장 먼저 알려드릴게요.</>
                  : <>출시가 준비되는 대로 가장 먼저 알려드릴게요.</>}
              </p>
              <button type="button" className="linkbtn done-edit" onClick={() => setSaved(null)}>
                신청 내용 고치기
              </button>
            </div>
          ) : (
            <form onSubmit={onSubmit} noValidate>
              <h3 className="waitlist-title">출시 알림 받기</h3>
              <p className="waitlist-sub">딱 한 번, 출시 소식만 보내드려요.</p>
              <div className="field">
                <label htmlFor="wl-email">이메일</label>
                <input
                  id="wl-email" name="email" type="email" inputMode="email"
                  placeholder="name@company.com" autoComplete="email"
                />
              </div>
              <div className="field">
                <label htmlFor="wl-phone">
                  전화번호 <span className="opt">이메일이 있으면 건너뛰어도 돼요</span>
                </label>
                <input
                  id="wl-phone" name="phone" type="tel" inputMode="tel"
                  placeholder="010-0000-0000" autoComplete="tel"
                />
              </div>
              <div className="field">
                <label htmlFor="wl-hood">직장 동네</label>
                <input id="wl-hood" name="hood" type="text" placeholder="예: 역삼동, 판교, 을지로" />
                <p className="help">점심을 드시는 동네요. 신청이 많은 동네부터 먼저 엽니다.</p>
              </div>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button type="submit" className="cta full" disabled={submitting}>
                <SpoonMark className="ic" draw />
                {submitting ? "신청하는 중…" : "출시 알림 받기"}
              </button>
            </form>
          )}
        </div>
      </div>
      <footer className="final-footer">
        Just do eat — 출시 준비 중인 프로토타입입니다. 데모의 식당과 데이터는 예시이며,
        설치 없이 브라우저에서 바로 동작합니다.
      </footer>
    </section>
  );
}
