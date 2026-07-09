import { useEffect, useRef, useState } from "react";
import { fmtCellTime, fmtFullTime, fmtInt, normEmail, normPhone, PERIOD_LABELS, CONTACT_LABELS } from "../lib/format";
import { SpoonMark } from "./SpoonCheck";

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="7" cy="7" r="5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <line x1="10.8" y1="10.8" x2="14.2" y2="14.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

// 페이지 번호 목록 — 7개 이하는 전부, 넘으면 현재 주변 + 양끝
function pageItems(totalPages, current) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i);
  const set = new Set([0, totalPages - 1, current - 1, current, current + 1]);
  const items = [...set].filter((p) => p >= 0 && p < totalPages).sort((a, b) => a - b);
  const out = [];
  let prev = null;
  for (const p of items) {
    if (prev != null && p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

// [5] 신청자 목록 — 랭킹에서 내려온 결정이 명단이 되는 곳.
export default function SignupTable({
  ref, rows, count, loading, error, page, pageSize, sort, q, hood, period,
  customFrom, customTo, contact, ranking, dups, selected, hasFilter, exporting,
  onSearch, onHood, onPeriod, onCustomFrom, onCustomTo, onContact, onSort,
  onPage, onSelect, onHide, onExport, onClearFilters, onRetry,
}) {
  const [menuId, setMenuId] = useState(null);
  const headCheckRef = useRef(null);

  const totalPages = count != null ? Math.max(Math.ceil(count / pageSize), 1) : 1;
  const pageIds = (rows ?? []).map((r) => r.id);
  const allChecked = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const someChecked = pageIds.some((id) => selected.has(id));

  useEffect(() => {
    if (headCheckRef.current) headCheckRef.current.indeterminate = someChecked && !allChecked;
  }, [someChecked, allChecked]);

  useEffect(() => {
    if (menuId == null) return;
    const close = () => setMenuId(null);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuId]);

  function toggleAll() {
    const next = new Set(selected);
    if (allChecked) pageIds.forEach((id) => next.delete(id));
    else pageIds.forEach((id) => next.add(id));
    onSelect(next);
  }

  function toggleOne(id) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelect(next);
  }

  const isDup = (r) => ({
    email: Boolean(r.email && dups.emails.has(normEmail(r.email))),
    phone: Boolean(r.phone && dups.phones.has(normPhone(r.phone))),
  });

  const globalEmpty = !loading && !error && !hasFilter && count === 0;
  const filterEmpty = !loading && !error && hasFilter && count === 0;

  const ariaSort = (col) => (sort.col === col ? (sort.asc ? "ascending" : "descending") : "none");
  const caret = (col) => (sort.col === col ? (sort.asc ? "▲" : "▼") : "");

  return (
    <section className="list-section" ref={ref} aria-label="신청자 목록">
      <div className="list-head">
        <h2 className="list-title">신청자 목록</h2>
        {/* 랭킹에서 내려온 동네 필터 — 명시적으로, 개별 해제 가능 */}
        {hood && (
          <span className="filter-chip">
            <SpoonMark className="ic" />
            선택됨: {hood.label}
            <button type="button" aria-label={`${hood.label} 필터 해제`} onClick={() => onHood(null)}>✕</button>
          </span>
        )}
        <span className="list-total" aria-hidden="true">
          총 <b>{count == null ? "—" : fmtInt(count)}</b>명
        </span>
        {/* 결과 수 낭독 — "역삼동 312명" */}
        <p className="visually-hidden" aria-live="polite">
          {count == null ? "" : `${hood ? hood.label + " " : ""}${fmtInt(count)}명`}
        </p>
      </div>

      <div className="toolbar">
        <div className="search">
          <SearchIcon />
          <input
            type="search"
            value={q}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="이메일·전화·동네 검색"
            aria-label="이메일, 전화, 동네 검색"
          />
        </div>
        <select
          className="filter" aria-label="동네 필터"
          value={hood?.key ?? ""}
          onChange={(e) => {
            const entry = (ranking ?? []).find((r) => r.hood_key === e.target.value);
            onHood(entry ? { key: entry.hood_key, label: entry.hood } : null);
          }}
        >
          <option value="">동네 전체</option>
          {(ranking ?? []).map((r) => (
            <option key={r.hood_key} value={r.hood_key}>{r.hood} ({fmtInt(r.cnt)})</option>
          ))}
        </select>
        <select className="filter" aria-label="기간 필터" value={period} onChange={(e) => onPeriod(e.target.value)}>
          {Object.entries(PERIOD_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        {period === "custom" && (
          <>
            <input type="date" aria-label="시작일" value={customFrom} onChange={(e) => onCustomFrom(e.target.value)} />
            <span className="date-sep">–</span>
            <input type="date" aria-label="종료일" value={customTo} onChange={(e) => onCustomTo(e.target.value)} />
          </>
        )}
        <select className="filter" aria-label="연락수단 필터" value={contact} onChange={(e) => onContact(e.target.value)}>
          {Object.entries(CONTACT_LABELS).map(([v, label]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="error-banner" role="alert">
          데이터를 불러오지 못했어요.
          <button type="button" className="btn" onClick={onRetry}>다시 시도</button>
        </div>
      )}

      {globalEmpty ? (
        <div className="table-card">
          <div className="empty">
            <SpoonMark className="mark" />
            <p>아직 신청이 없어요.<br />랜딩에서 첫 신청이 들어오면 여기 나타납니다.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th className="col-check" scope="col">
                    <input
                      ref={headCheckRef} type="checkbox" checked={allChecked}
                      onChange={toggleAll} aria-label="이 페이지 전체 선택"
                    />
                  </th>
                  <th scope="col" aria-sort={ariaSort("created_at")}>
                    <button type="button" className="sortbtn" onClick={() => onSort("created_at")}>
                      신청일시 {caret("created_at") && <span className="caret" aria-hidden="true">{caret("created_at")}</span>}
                    </button>
                  </th>
                  <th scope="col">이메일</th>
                  <th scope="col">전화</th>
                  <th scope="col" aria-sort={ariaSort("company")}>
                    <button type="button" className="sortbtn" onClick={() => onSort("company")}>
                      직장 동네 {caret("company") && <span className="caret" aria-hidden="true">{caret("company")}</span>}
                    </button>
                  </th>
                  <th className="col-menu" scope="col"><span className="visually-hidden">행 메뉴</span></th>
                </tr>
              </thead>
              <tbody>
                {loading &&
                  Array.from({ length: 8 }, (_, i) => (
                    <tr key={`skel-${i}`}>
                      <td className="col-check" />
                      <td><span className="skel" style={{ width: 76 }} /></td>
                      <td><span className="skel" style={{ width: 150 }} /></td>
                      <td><span className="skel" style={{ width: 100 }} /></td>
                      <td><span className="skel" style={{ width: 60 }} /></td>
                      <td className="col-menu" />
                    </tr>
                  ))}

                {!loading && filterEmpty && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty">
                        <p>이 조건에 맞는 신청자가 없어요.</p>
                        <button type="button" className="btn" onClick={onClearFilters}>필터 지우기</button>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  (rows ?? []).map((r) => {
                    const dup = isDup(r);
                    return (
                      <tr key={r.id} className={selected.has(r.id) ? "selected" : undefined}>
                        <td className="col-check">
                          <input
                            type="checkbox" checked={selected.has(r.id)}
                            onChange={() => toggleOne(r.id)}
                            aria-label={`${r.email || r.phone || "신청자"} 선택`}
                          />
                        </td>
                        <td title={fmtFullTime(r.created_at)}>{fmtCellTime(r.created_at)}</td>
                        <td className={r.email ? undefined : "cell-empty"}>
                          {r.email ?? "—"}
                          {dup.email && <span className="badge-dup">중복</span>}
                        </td>
                        <td className={r.phone ? undefined : "cell-empty"}>
                          {r.phone ?? "—"}
                          {dup.phone && <span className="badge-dup">중복</span>}
                        </td>
                        <td className={r.company ? undefined : "cell-empty"}>{r.company ?? "—"}</td>
                        <td className="col-menu">
                          <span className="rowmenu">
                            <button
                              type="button" className="rowmenu-btn" aria-haspopup="true"
                              aria-expanded={menuId === r.id} aria-label="행 메뉴"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuId(menuId === r.id ? null : r.id);
                              }}
                            >
                              ⋯
                            </button>
                            {menuId === r.id && (
                              <span className="rowmenu-pop" role="menu">
                                <button
                                  type="button" role="menuitem"
                                  onClick={(e) => {
                                    setMenuId(null);
                                    onHide([r.id], e.currentTarget.closest("tr")?.querySelector(".rowmenu-btn"));
                                  }}
                                >
                                  숨기기
                                </button>
                              </span>
                            )}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>

            <div className="table-foot">
              <button
                type="button" className="btn"
                disabled={selected.size === 0}
                onClick={(e) => onHide([...selected], e.currentTarget)}
              >
                선택 숨기기{selected.size > 0 ? ` (${selected.size})` : ""}
              </button>
              <div className="spacer" />
              {/* 시그니처 ③: 동네가 선택되면 다음 행동(내보내기)이 신호를 받는다 */}
              <button
                type="button" className={hood ? "btn emph" : "btn"}
                onClick={onExport} disabled={exporting || count === 0}
              >
                {exporting ? "내보내는 중…" : "필터 결과 CSV 내보내기"}
              </button>
              {totalPages > 1 && (
                <nav className="pager" aria-label="페이지">
                  <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="이전 페이지">‹</button>
                  {pageItems(totalPages, page).map((p, i) =>
                    p === "…" ? (
                      <span key={`e-${i}`} className="ellip">…</span>
                    ) : (
                      <button
                        key={p} type="button"
                        aria-current={p === page ? "page" : undefined}
                        onClick={() => onPage(p)}
                      >
                        {p + 1}
                      </button>
                    )
                  )}
                  <button type="button" disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)} aria-label="다음 페이지">›</button>
                </nav>
              )}
            </div>
          </div>

          {/* 모바일: 표 대신 읽기용 스택 카드. 관리(숨기기)는 데스크톱 위주. */}
          <div className="cards" aria-hidden="false">
            {!loading && filterEmpty && (
              <div className="scard">
                <div className="empty" style={{ padding: "18px 6px" }}>
                  <p>이 조건에 맞는 신청자가 없어요.</p>
                  <button type="button" className="btn" onClick={onClearFilters}>필터 지우기</button>
                </div>
              </div>
            )}
            {!loading &&
              (rows ?? []).map((r) => {
                const dup = isDup(r);
                return (
                  <div key={r.id} className="scard">
                    <div className="scard-top">
                      <span>{fmtCellTime(r.created_at)}</span>
                      {r.company && <span className="hood">· {r.company}</span>}
                      {(dup.email || dup.phone) && <span className="badge-dup">중복</span>}
                    </div>
                    <div className="scard-body">
                      {r.email ?? ""}{r.email && r.phone ? " / " : ""}{r.phone ?? ""}
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </section>
  );
}
