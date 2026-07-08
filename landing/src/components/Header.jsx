import { SpoonBadge } from "./SpoonCheck";

export default function Header() {
  return (
    <header>
      <div className="wrap bar">
        <a className="logo" href="#" onClick={(e) => e.preventDefault()} aria-label="Just do eat — 오늘 점심, 바로 결정">
          <SpoonBadge size={36} />
          <span className="lockup">
            <span className="wordmark">JUST DO EAT</span>
            <span className="claim">오늘 점심, 바로 결정</span>
          </span>
        </a>
        <a className="linkbtn small header-cta" href="#waitlist">출시 알림 받기</a>
      </div>
    </header>
  );
}
