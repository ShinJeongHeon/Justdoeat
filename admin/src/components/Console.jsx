import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { periodRange, PERIOD_LABELS } from "../lib/format";
import { buildCsv, csvFilename, downloadCsv } from "../lib/csv";
import TopBar from "./TopBar";
import Momentum from "./Momentum";
import HoodRanking from "./HoodRanking";
import TrendChart from "./TrendChart";
import SignupTable from "./SignupTable";
import HideModal from "./HideModal";
import Toast from "./Toast";

const PAGE_SIZE = 50;

function isAuthError(error) {
  if (!error) return false;
  return error.code === "PGRST301" || error.status === 401 || /JWT|token/i.test(error.message || "");
}

// 운영 콘솔 — 단일 페이지 2섹션: 대시보드(랭킹이 히어로) + 신청자 목록.
// 서사는 하나: 랭킹(무엇을) → 명단(누구에게) → 내보내기(어떻게). (04-design §6)
export default function Console({ onExpired }) {
  // ── 대시보드 데이터 (서버 집계 RPC — 전 행을 내려받지 않는다, KR4)
  const [summary, setSummary] = useState(null);
  const [ranking, setRanking] = useState(null);
  const [daily, setDaily] = useState(null);
  const [dups, setDups] = useState({ emails: new Set(), phones: new Set() });
  const [dashError, setDashError] = useState(false);

  // ── 목록 상태
  const [q, setQ] = useState("");
  const [qDebounced, setQDebounced] = useState("");
  const [hood, setHood] = useState(null); // { key, label } — 랭킹·필터에서 선택
  const [period, setPeriod] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [contact, setContact] = useState("all");
  const [sort, setSort] = useState({ col: "created_at", asc: false });
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(null);
  const [count, setCount] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  // ── 조작 상태
  const [selected, setSelected] = useState(() => new Set());
  const [modal, setModal] = useState(null); // { ids, trigger }
  const [toast, setToast] = useState(null); // { msg, undo?, spoon? }
  const [exporting, setExporting] = useState(false);
  const [checkKey, setCheckKey] = useState(0); // 랭킹 선택 시 체크 드로잉 재생 키

  const listRef = useRef(null);
  const fetchIdRef = useRef(0);
  const toastTimerRef = useRef(null);

  const hasFilter = Boolean(qDebounced || hood || period !== "all" || contact !== "all");

  function showToast(next) {
    clearTimeout(toastTimerRef.current);
    setToast(next);
    if (next) {
      toastTimerRef.current = setTimeout(() => setToast(null), next.undo ? 8000 : 6000);
    }
  }

  // ── 검색 디바운스
  useEffect(() => {
    const t = setTimeout(() => setQDebounced(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  // ── 대시보드 로드
  const loadDashboard = useCallback(async () => {
    setDashError(false);
    const [s, r, d, du] = await Promise.all([
      supabase.rpc("admin_summary"),
      supabase.rpc("admin_hood_ranking"),
      supabase.rpc("admin_daily_counts", { days: 30 }),
      supabase.rpc("admin_duplicates"),
    ]);
    const err = s.error || r.error || d.error || du.error;
    if (err) {
      if (isAuthError(err)) return onExpired();
      setDashError(true);
      return;
    }
    setSummary(s.data?.[0] ?? null);
    setRanking(r.data ?? []);
    setDaily(d.data ?? []);
    setDups({
      emails: new Set((du.data ?? []).filter((x) => x.kind === "email").map((x) => x.val)),
      phones: new Set((du.data ?? []).filter((x) => x.kind === "phone").map((x) => x.val)),
    });
  }, [onExpired]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshTick]);

  // ── 목록 쿼리 (내보내기와 동일 조건을 공유)
  const buildListQuery = useCallback(() => {
    let query = supabase
      .from("item")
      .select("id, created_at, email, phone, company, company_norm", { count: "exact" })
      .is("deleted_at", null); // 숨긴 항목은 기본 목록에서 제외

    if (hood) query = query.eq("company_norm", hood.key);

    const { from, to } = periodRange(period, customFrom, customTo);
    if (from) query = query.gte("created_at", from);
    if (to) query = query.lt("created_at", to);

    if (contact === "email") query = query.not("email", "is", null);
    else if (contact === "phone") query = query.not("phone", "is", null);
    else if (contact === "both") query = query.not("email", "is", null).not("phone", "is", null);

    const safe = qDebounced.replace(/["\\]/g, "").trim();
    if (safe) {
      query = query.or(`email.ilike."%${safe}%",phone.ilike."%${safe}%",company.ilike."%${safe}%"`);
    }

    if (sort.col === "company") {
      query = query.order("company_norm", { ascending: sort.asc, nullsFirst: false }).order("created_at", { ascending: false });
    } else {
      query = query.order("created_at", { ascending: sort.asc });
    }
    return query;
  }, [hood, period, customFrom, customTo, contact, qDebounced, sort]);

  // ── 목록 로드 (range 페이지네이션, 50건/페이지)
  useEffect(() => {
    const id = ++fetchIdRef.current;
    setListLoading(true);
    setListError(false);
    buildListQuery()
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1)
      .then(({ data, count: total, error }) => {
        if (id !== fetchIdRef.current) return; // 뒤늦게 도착한 이전 요청은 무시
        if (error) {
          if (isAuthError(error)) return onExpired();
          setListError(true);
          setListLoading(false);
          return;
        }
        setRows(data ?? []);
        setCount(total ?? 0);
        setListLoading(false);
      });
  }, [buildListQuery, page, refreshTick, onExpired]);

  const refetchAll = useCallback(() => setRefreshTick((t) => t + 1), []);

  // 필터·검색이 바뀌면 1페이지로, 선택은 해제
  function resetPageAnd(fn) {
    fn();
    setPage(0);
    setSelected(new Set());
  }

  // ── 시그니처 ①: 랭킹 행 클릭 → 목록이 그 동네로 필터, 목록으로 스크롤
  function pickHood(entry) {
    resetPageAnd(() => setHood({ key: entry.hood_key, label: entry.hood }));
    setCheckKey((k) => k + 1);
    requestAnimationFrame(() => {
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function clearFilters() {
    resetPageAnd(() => {
      setQ("");
      setQDebounced("");
      setHood(null);
      setPeriod("all");
      setCustomFrom("");
      setCustomTo("");
      setContact("all");
    });
  }

  // ── 숨기기 (소프트 삭제 — deleted_at 갱신, 물리 삭제 아님)
  function requestHide(ids, trigger) {
    setModal({ ids, trigger: trigger ?? null });
  }

  async function confirmHide() {
    if (!modal) return;
    const ids = modal.ids;
    const { error } = await supabase
      .from("item")
      .update({ deleted_at: new Date().toISOString() })
      .in("id", ids);
    setModal(null);
    if (error) {
      if (isAuthError(error)) return onExpired();
      showToast({ msg: "숨기지 못했어요. 다시 시도해 주세요." });
      return;
    }
    setSelected(new Set());
    refetchAll();
    showToast({
      msg: `${ids.length}명을 숨겼어요.`,
      undo: async () => {
        const { error: undoError } = await supabase.from("item").update({ deleted_at: null }).in("id", ids);
        if (undoError) {
          if (isAuthError(undoError)) return onExpired();
          showToast({ msg: "되돌리지 못했어요. 다시 시도해 주세요." });
          return;
        }
        refetchAll();
        showToast({ msg: "되돌렸어요." });
      },
    });
  }

  // ── 시그니처 ③: CSV 내보내기 — 현재 필터·검색이 적용된 결과 전체 (화면 50건이 아니라)
  async function exportCsv() {
    if (exporting) return;
    setExporting(true);
    try {
      const all = [];
      for (let from = 0; ; from += 1000) {
        const { data, error } = await buildListQuery().range(from, from + 999);
        if (error) {
          if (isAuthError(error)) return onExpired();
          showToast({ msg: "내보내지 못했어요. 다시 시도해 주세요." });
          return;
        }
        all.push(...(data ?? []));
        if (!data || data.length < 1000) break;
      }
      if (all.length === 0) {
        showToast({ msg: "내보낼 신청자가 없어요." });
        return;
      }
      downloadCsv(buildCsv(all), csvFilename(hood?.label, PERIOD_LABELS[period]));
      showToast({
        msg: `${hood ? hood.label + " " : ""}${all.length.toLocaleString("ko-KR")}명을 내보냈어요.`,
        spoon: true,
      });
    } finally {
      setExporting(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  return (
    <>
      <TopBar onExport={exportCsv} onLogout={logout} exporting={exporting} />

      <main className="console">
        {dashError && (
          <div className="error-banner" role="alert">
            데이터를 불러오지 못했어요.
            <button type="button" className="btn" onClick={loadDashboard}>다시 시도</button>
          </div>
        )}

        <Momentum summary={summary} />

        <div className="dash">
          <HoodRanking
            ranking={ranking}
            summary={summary}
            selectedKey={hood?.key ?? null}
            checkKey={checkKey}
            onPick={pickHood}
          />
          <TrendChart daily={daily} summary={summary} />
        </div>

        <SignupTable
          ref={listRef}
          rows={rows}
          count={count}
          loading={listLoading}
          error={listError}
          page={page}
          pageSize={PAGE_SIZE}
          sort={sort}
          q={q}
          hood={hood}
          period={period}
          customFrom={customFrom}
          customTo={customTo}
          contact={contact}
          ranking={ranking}
          dups={dups}
          selected={selected}
          hasFilter={hasFilter}
          exporting={exporting}
          onSearch={(v) => resetPageAnd(() => setQ(v))}
          onHood={(v) => resetPageAnd(() => setHood(v))}
          onPeriod={(v) => resetPageAnd(() => setPeriod(v))}
          onCustomFrom={(v) => resetPageAnd(() => setCustomFrom(v))}
          onCustomTo={(v) => resetPageAnd(() => setCustomTo(v))}
          onContact={(v) => resetPageAnd(() => setContact(v))}
          onSort={(col) =>
            setSort((s) => (s.col === col ? { col, asc: !s.asc } : { col, asc: col === "company" }))
          }
          onPage={(p) => {
            setPage(p);
            setSelected(new Set());
          }}
          onSelect={setSelected}
          onHide={requestHide}
          onExport={exportCsv}
          onClearFilters={clearFilters}
          onRetry={refetchAll}
        />
      </main>

      {modal && (
        <HideModal
          count={modal.ids.length}
          onCancel={() => {
            const trigger = modal.trigger;
            setModal(null);
            trigger?.focus?.();
          }}
          onConfirm={confirmHide}
        />
      )}

      <Toast toast={toast} />
    </>
  );
}
