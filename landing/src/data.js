// 히어로 미니 데모 — 실제 추천 엔진의 축소판 (랜딩용 고정 데이터 8곳)
// 조건 칩 4개 × 식당 속성으로 점수를 재계산해 TOP 3를 뽑는다.

export const APP_URL = "./app/";

export const CONDITIONS = [
  { id: "rain", label: "비 오는 날" },
  { id: "budget", label: "예산 절약" },
  { id: "spicy", label: "매운 게 당김" },
  { id: "quiet", label: "혼잡 회피" },
];

// crowd: low | mid | high, soup: 뜨끈한 국물, cold: 차가운 메뉴
const POOL = [
  { id: "burger",    name: "버거플래닛",   menu: "수제버거",        emoji: "🍔", price: 8900,  walk: 3, base: 77, soup: false, cold: false, spicy: 0, crowd: "high" },
  { id: "kimchi",    name: "뚝배기집",     menu: "김치찌개",        emoji: "🍲", price: 9000,  walk: 3, base: 76, soup: true,  cold: false, spicy: 2, crowd: "high" },
  { id: "kalguksu",  name: "명동칼국수",   menu: "칼국수",          emoji: "🍜", price: 9500,  walk: 5, base: 74, soup: true,  cold: false, spicy: 0, crowd: "mid" },
  { id: "seolleong", name: "진국설렁탕",   menu: "설렁탕",          emoji: "🥣", price: 11000, walk: 4, base: 73, soup: true,  cold: false, spicy: 0, crowd: "low" },
  { id: "salad",     name: "샐러디밸리",   menu: "닭가슴살 샐러드", emoji: "🥗", price: 9900,  walk: 4, base: 72, soup: false, cold: true,  spicy: 0, crowd: "low" },
  { id: "mala",      name: "마라공방",     menu: "마라탕",          emoji: "🌶️", price: 12000, walk: 9, base: 71, soup: true,  cold: false, spicy: 3, crowd: "mid" },
  { id: "tteok",     name: "분식천국",     menu: "떡볶이+김밥",     emoji: "🍢", price: 7000,  walk: 2, base: 70, soup: false, cold: false, spicy: 2, crowd: "high" },
  { id: "sandwich",  name: "써브샌드",     menu: "클럽 샌드위치",   emoji: "🥪", price: 7500,  walk: 2, base: 69, soup: false, cold: true,  spicy: 0, crowd: "low" },
];

export const won = (n) => n.toLocaleString("ko-KR") + "원";

export function recommend(active) {
  const scored = POOL.map((r) => {
    let score = r.base;
    const reasons = [{ t: `도보 ${r.walk}분`, tone: "" }];

    if (active.rain) {
      if (r.soup) { score += 10; reasons.push({ t: "비 오는 날엔 뜨끈한 국물", tone: "blue" }); }
      else if (r.cold) score -= 5;
    }
    if (active.budget) {
      if (r.price <= 7500) { score += 14; reasons.push({ t: `${won(r.price)} — 지갑 안심`, tone: "green" }); }
      else if (r.price <= 9000) { score += 7; reasons.push({ t: `예산 내 ${won(r.price)}`, tone: "green" }); }
      else score -= 7;
    }
    if (active.spicy) {
      if (r.spicy >= 2) { score += 12; reasons.push({ t: `맵기 ${"●".repeat(r.spicy)}${"○".repeat(3 - r.spicy)}`, tone: "" }); }
      else score -= 5;
    }
    if (active.quiet) {
      if (r.crowd === "low") { score += 10; reasons.push({ t: "지금 한산해요", tone: "green" }); }
      else if (r.crowd === "mid") score += 2;
      else score -= 9;
    }
    if (!active.budget) reasons.push({ t: won(r.price), tone: "" });

    return { ...r, score, reasons: reasons.slice(0, 3) };
  });

  scored.sort((a, b) => b.score - a.score || a.walk - b.walk);
  return scored.slice(0, 3);
}
