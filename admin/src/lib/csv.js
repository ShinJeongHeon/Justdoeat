import { fmtFullTime, fmtDateKey } from "./format";

// CSV 내보내기 — 컬럼은 사용자 언어로. 원본 컬럼명(company)은 노출하지 않는다.
// UTF-8 BOM: 엑셀에서 한글이 깨지지 않게. (04-design-director.md §5-[7])

const BOM = String.fromCharCode(0xfeff);

function esc(v) {
  const s = String(v ?? "");
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildCsv(rows) {
  const header = ["신청일시", "이메일", "전화", "직장 동네"];
  const lines = [header.map(esc).join(",")];
  for (const r of rows) {
    lines.push([fmtFullTime(r.created_at), r.email ?? "", r.phone ?? "", r.company ?? ""].map(esc).join(","));
  }
  return BOM + lines.join("\r\n");
}

// 파일명에 날짜·필터 요약: justdoeat_신청자_역삼동_2026-07-08.csv
export function csvFilename(hoodLabel, periodLabel) {
  const parts = ["justdoeat", "신청자"];
  if (hoodLabel) parts.push(hoodLabel.replace(/[\\/:*?"<>|\s]+/g, ""));
  if (periodLabel && periodLabel !== "전체 기간") parts.push(periodLabel.replace(/\s+/g, ""));
  parts.push(fmtDateKey(new Date()));
  return parts.join("_") + ".csv";
}

export function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
