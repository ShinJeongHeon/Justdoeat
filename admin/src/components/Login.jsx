import { useState } from "react";
import { supabase } from "../supabaseClient";
import { SpoonBadge } from "./SpoonCheck";

// 로그인 게이트 — PII를 다루는 화면의 문. (04-design §4.0)
// 실패 문구는 어느 쪽이 틀렸는지 밝히지 않는다.
export default function Login({ notice, onNoticeClear }) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    onNoticeClear?.();
    const f = new FormData(e.currentTarget);
    const email = (f.get("email") || "").trim();
    const password = f.get("password") || "";

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setSubmitting(true);
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);

    if (authError) {
      setError("이메일 또는 비밀번호가 맞지 않아요.");
      return;
    }
    setError(""); // 성공 — App의 onAuthStateChange가 콘솔로 전환한다
  }

  return (
    <main className="gate">
      <div className="gate-head">
        <SpoonBadge size={44} />
        <span className="wordmark">JUST DO EAT</span>
        <span className="role">관리자</span>
      </div>

      <form className="gate-card" onSubmit={onSubmit} noValidate>
        {notice && <p className="form-error" role="status">{notice}</p>}
        <div className="field">
          <label htmlFor="lg-email">이메일</label>
          <input
            id="lg-email" name="email" type="email" inputMode="email"
            autoComplete="username" placeholder="name@company.com" autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="lg-password">비밀번호</label>
          <input id="lg-password" name="password" type="password" autoComplete="current-password" />
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="cta full" disabled={submitting}>
          {submitting ? "확인하는 중…" : "로그인"}
        </button>
      </form>

      <p className="gate-note">운영자 전용 — 신청자 개인정보를 다루는 화면입니다.</p>
    </main>
  );
}
