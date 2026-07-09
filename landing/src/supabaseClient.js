import { createClient } from "@supabase/supabase-js";

// Supabase 연결 정보는 환경변수로 분리한다.
// Vite에서 클라이언트로 노출하려면 접두사가 VITE_ 여야 한다. (landing/.env 참고)
// URL과 publishable(anon) 키는 브라우저에 노출되어도 되는 공개 값이며,
// 실제 쓰기 권한은 page 테이블의 RLS 정책(insert 전용)으로 제한된다.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Supabase 환경변수가 없습니다. landing/.env 파일에 VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY 를 설정하세요. (예: landing/.env.example 참고)"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
