import { SpoonMark } from "./SpoonCheck";

// 토스트 — 동작은 결과로 명명("내보내기"→"내보냈어요"), 숨기기엔 되돌리기.
// aria-live 영역은 상시 마운트해 낭독 누락을 막는다.
export default function Toast({ toast }) {
  return (
    <div aria-live="polite">
      {toast && (
        <div className="toast">
          {toast.spoon && <SpoonMark className="ic" draw drawKey={toast.msg} />}
          <span>{toast.msg}</span>
          {toast.undo && (
            <button type="button" className="undo" onClick={toast.undo}>되돌리기</button>
          )}
        </div>
      )}
    </div>
  );
}
