import { useEffect, useRef } from "react";

// [6] 숨기기 확인 — 인페이지 모달. 브라우저 confirm() 금지.
// 소프트 삭제의 성격을 카피에 정확히: 삭제되지 않고, 되돌릴 수 있다.
export default function HideModal({ count, onCancel, onConfirm }) {
  const cardRef = useRef(null);
  const cancelRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();

    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      // 포커스 트랩 — Tab이 모달 밖으로 나가지 않게
      if (e.key === "Tab") {
        const focusables = cardRef.current?.querySelectorAll("button");
        if (!focusables?.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="hide-title" ref={cardRef}>
        <h2 id="hide-title">
          {count === 1 ? "이 신청자를 숨길까요?" : `선택한 ${count}명을 숨길까요?`}
        </h2>
        <p>목록에서 감춰집니다. 데이터는 삭제되지 않고, 방금 숨긴 항목은 되돌릴 수 있어요.</p>
        <div className="modal-actions">
          <button type="button" className="btn" ref={cancelRef} onClick={onCancel}>취소</button>
          <button type="button" className="btn ink" onClick={onConfirm}>숨기기</button>
        </div>
      </div>
    </div>
  );
}
