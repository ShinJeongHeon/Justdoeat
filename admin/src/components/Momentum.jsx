import { fmtInt } from "../lib/format";

// [2] 모멘텀 스트립 — 얇은 지표 타일 4개. 랭킹에 자리를 양보한다(강등된 KPI).
// 수치 갱신은 조용히, 로딩 중엔 '—'.
export default function Momentum({ summary }) {
  const total = summary?.total;
  const unique = summary?.unique_contacts;
  const emailPct = summary && summary.total > 0 ? Math.round((summary.with_email / summary.total) * 100) : null;
  const phonePct = summary && summary.total > 0 ? Math.round((summary.with_phone / summary.total) * 100) : null;

  return (
    <section className="strip" aria-label="신청 지표">
      <div className="tile">
        <span className="lbl eyebrow">총 신청</span>
        <span className="num">{fmtInt(total)}</span>
        {/* 중복 존재를 숨기지 않는다 — 고유 연락처 병기 (PRD 주의 2) */}
        {summary != null && unique != null && unique < total && (
          <span className="aux">고유 연락처 <b>{fmtInt(unique)}</b></span>
        )}
      </div>
      <div className="tile">
        <span className="lbl eyebrow">오늘 신규</span>
        <span className={summary && summary.today_new > 0 ? "num up" : "num"}>
          {summary == null ? "—" : summary.today_new > 0 ? `+${fmtInt(summary.today_new)}` : "0"}
        </span>
        <span className="aux">자정 기준</span>
      </div>
      <div className="tile">
        <span className="lbl eyebrow">이번 주</span>
        <span className={summary && summary.week_new > 0 ? "num up" : "num"}>
          {summary == null ? "—" : summary.week_new > 0 ? `+${fmtInt(summary.week_new)}` : "0"}
        </span>
        <span className="aux">최근 7일</span>
      </div>
      <div className="tile">
        <span className="lbl eyebrow">연락수단</span>
        <span className="aux">메일 <b>{emailPct == null ? "—" : `${emailPct}%`}</b></span>
        <span className="aux">전화 <b>{phonePct == null ? "—" : `${phonePct}%`}</b></span>
      </div>
    </section>
  );
}
