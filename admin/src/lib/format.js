// 표시·정규화 유틸 — 서버(RPC)의 정규화 규칙과 반드시 일치시킨다.

export function fmtInt(n) {
  if (n == null) return "—";
  return Number(n).toLocaleString("ko-KR");
}

const pad2 = (n) => String(n).padStart(2, "0");

// 표 셀용: MM-DD HH:mm (전체 일시는 title로 제공)
export function fmtCellTime(iso) {
  const d = new Date(iso);
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

// CSV·title용: YYYY-MM-DD HH:mm
export function fmtFullTime(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export function fmtDateKey(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// 중복 판정 키 — admin_duplicates RPC와 동일 규칙
export function normEmail(email) {
  return email ? email.trim().toLowerCase() : "";
}
export function normPhone(phone) {
  return phone ? phone.replace(/\D/g, "") : "";
}

// 기간 필터 → created_at 경계 (운영자 로컬 시간 = KST 기준)
export function periodRange(period, customFrom, customTo) {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "today") return { from: dayStart.toISOString(), to: null };
  if (period === "7d") {
    const d = new Date(dayStart);
    d.setDate(d.getDate() - 6);
    return { from: d.toISOString(), to: null };
  }
  if (period === "30d") {
    const d = new Date(dayStart);
    d.setDate(d.getDate() - 29);
    return { from: d.toISOString(), to: null };
  }
  if (period === "custom") {
    let from = null;
    let to = null;
    if (customFrom) from = new Date(`${customFrom}T00:00:00`).toISOString();
    if (customTo) {
      const t = new Date(`${customTo}T00:00:00`);
      t.setDate(t.getDate() + 1); // 종료일 포함
      to = t.toISOString();
    }
    return { from, to };
  }
  return { from: null, to: null };
}

export const PERIOD_LABELS = {
  all: "전체 기간",
  today: "오늘",
  "7d": "최근 7일",
  "30d": "최근 30일",
  custom: "사용자 지정",
};

export const CONTACT_LABELS = {
  all: "연락수단 전체",
  email: "이메일만",
  phone: "전화만",
  both: "둘 다",
};
