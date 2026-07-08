// 스푼체크 로고 — index.html의 #spoonCheck 심볼과 동일한 패스

// 원형 배지 (헤더 로고용): 고추장 레드 원 + 화이트 체크·스푼
export function SpoonBadge({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill="#E0431F" />
      <path d="M12.5 24 L19 30.5 L31.5 15.5" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="33.6" cy="12.9" rx="3.9" ry="6.2" fill="#fff" transform="rotate(-50 33.6 12.9)" />
    </svg>
  );
}

// currentColor 심볼 (아이브로우·CTA·잉크 밴드용)
// drawKey가 바뀌면 체크 획이 stroke-dashoffset으로 다시 그려진다 — "결정 완료" 도장
export function SpoonMark({ className = "ic", draw = false, drawKey }) {
  return (
    <svg className={className} viewBox="0 0 44 44" aria-hidden="true">
      <path
        key={drawKey}
        className={draw ? "check-draw" : undefined}
        d="M12.5 24 L19 30.5 L31.5 15.5"
        pathLength="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <ellipse cx="33.6" cy="12.9" rx="4.2" ry="6.4" fill="currentColor" transform="rotate(-50 33.6 12.9)" />
    </svg>
  );
}
