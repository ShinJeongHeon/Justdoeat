import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 관리자 콘솔 — 랜딩(landing/)과 분리된 앱, 별도 경로로 배포한다.
export default defineConfig({
  base: "./",
  plugins: [react()],
  server: { port: 5180 },
});
