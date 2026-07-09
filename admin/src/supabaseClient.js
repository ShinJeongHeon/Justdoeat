import { createClient } from "@supabase/supabase-js";

// 랜딩과 같은 프로젝트·같은 공개(publishable) 키를 재사용한다.
// 이 키 자체로는 item 테이블을 읽을 수 없다(RLS: anon은 insert 전용).
// 읽기·숨김은 로그인 세션의 JWT + authenticated 정책으로만 열린다. (KR3)
// service_role 키는 어떤 경우에도 클라이언트에 두지 않는다.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    "Supabase 환경변수가 없습니다. admin/.env 파일에 VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY 를 설정하세요. (예: admin/.env.example 참고)"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
