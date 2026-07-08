import { useEffect, useState } from "react";
import { SpoonMark } from "./SpoonCheck";

// 모바일 전용 — 히어로 CTA가 뷰포트를 벗어나면 등장,
// 출시 알림 폼(#waitlist)이 보이는 동안은 폼을 가리지 않게 숨긴다
export default function StickyCta() {
  const [heroOut, setHeroOut] = useState(false);
  const [formIn, setFormIn] = useState(false);

  useEffect(() => {
    const observers = [];
    const hero = document.getElementById("hero-cta");
    if (hero) {
      const io = new IntersectionObserver(([entry]) => {
        setHeroOut(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      });
      io.observe(hero);
      observers.push(io);
    }
    const form = document.getElementById("waitlist");
    if (form) {
      const io = new IntersectionObserver(
        ([entry]) => setFormIn(entry.isIntersecting),
        { threshold: 0.12 }
      );
      io.observe(form);
      observers.push(io);
    }
    return () => observers.forEach((io) => io.disconnect());
  }, []);

  const show = heroOut && !formIn;
  return (
    <a className={"sticky-cta" + (show ? " show" : "")} href="#waitlist" aria-hidden={!show} tabIndex={show ? 0 : -1}>
      <SpoonMark className="ic" />
      출시 알림 받기
    </a>
  );
}
