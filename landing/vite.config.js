import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
// 랜딩의 CTA("지금 추천받기")가 연결되는 실제 앱 — 상위 폴더의 단일 index.html
const appHtml = path.resolve(here, "../index.html");

// 개발 서버에서는 /app/ 경로로 앱을 서빙하고, 빌드 시 dist/app/index.html로 복사한다.
// 앱 파일을 복제하지 않고 원본(../index.html) 하나만 유지하기 위한 장치.
const serveApp = {
  name: "serve-just-do-eat-app",
  configureServer(server) {
    server.middlewares.use("/app", (req, res) => {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(fs.readFileSync(appHtml));
    });
  },
  writeBundle() {
    const out = path.resolve(here, "dist/app");
    fs.mkdirSync(out, { recursive: true });
    fs.copyFileSync(appHtml, path.join(out, "index.html"));
  },
};

export default defineConfig({
  base: "./",
  plugins: [react(), serveApp],
});
