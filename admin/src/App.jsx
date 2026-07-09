import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import Login from "./components/Login";
import Console from "./components/Console";

// 인증 게이트 — 세션이 없으면 콘솔 UI 자체를 렌더하지 않는다. (KR3: 보안이 곧 UX)
export default function App() {
  const [session, setSession] = useState(undefined); // undefined = 세션 확인 중
  const [notice, setNotice] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 데이터 호출 중 JWT 만료를 만나면 세션을 닫고 로그인으로 되돌린다.
  async function handleExpired() {
    setNotice("세션이 만료됐어요. 다시 로그인해 주세요.");
    await supabase.auth.signOut();
  }

  if (session === undefined) return null; // 세션 확인 중 — 아무것도 깜빡이지 않게

  if (!session) {
    return <Login notice={notice} onNoticeClear={() => setNotice("")} />;
  }
  return <Console onExpired={handleExpired} />;
}
