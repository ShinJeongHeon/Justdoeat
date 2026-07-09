import { useEffect, useRef, useState } from "react";
import { SpoonMark } from "./SpoonCheck";

// [1] 잉크 상단바 — 랜딩의 "결정" 밴드 색을 상시 크롬으로. 사이드바 없음.
export default function TopBar({ onExport, onLogout, exporting }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (!menuRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <SpoonMark className="mark" />
        <span className="wordmark">JUST DO EAT</span>
        <span className="dot" aria-hidden="true">·</span>
        <span className="role">관리자</span>

        <div className="topbar-util">
          <button type="button" className="btn ghost" onClick={onExport} disabled={exporting}>
            {exporting ? "내보내는 중…" : "내보내기"}
          </button>
          <button type="button" className="btn ghost" onClick={onLogout}>로그아웃</button>
        </div>

        {/* 모바일: 유틸을 메뉴로 접기 */}
        <div className="topbar-menu" ref={menuRef}>
          <button
            type="button" className="btn ghost" aria-expanded={open} aria-haspopup="true"
            aria-label="메뉴" onClick={() => setOpen((v) => !v)}
          >
            ⋯
          </button>
          {open && (
            <div className="topbar-pop" role="menu">
              <button type="button" role="menuitem" onClick={() => { setOpen(false); onExport(); }} disabled={exporting}>
                내보내기
              </button>
              <button type="button" role="menuitem" onClick={() => { setOpen(false); onLogout(); }}>
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
