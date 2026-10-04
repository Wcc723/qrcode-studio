# 部署：背景與本機驗證

`AGENTS.md` 留規則與指路，這份放部署相關的背景、沿革與完整的驗證指令。
子路徑的規則本身（四個不可改動點、資產根目錄、前綴的事實來源）以 `AGENTS.md` 為準。

## 站群與搬站

工具站正陸續從 `<slug>.pocketool.app` 子網域搬到 hub 的子路徑。**本站已於 2026-09-07 搬完**，
與 `compound-calculator`、`kaomoji` 同一模式；`tw-life-calc` 與 `zipcode` 待搬，
`beyblade` 與 `speak-cards` 站長決定不搬。逐站現況以 hub 的 `CLAUDE.md` 對照表為準。

## 部署方式的沿革

repo 內**沒有** GitHub Actions。原本有一份 `.github/workflows/deploy.yml`，但 repo 的
Actions secrets 是空的、`CLOUDFLARE_API_TOKEN` 從未設定，那條部署從 2026-06-01 起每次
都失敗，而 Workers Builds 一直正常運作所以沒人發現。2026-09-07 已整個移除。

把關綁在 npm 生命週期上（`prebuild`、`postbuild`），不是後台欄位：這樣把關留在版本控管內、
本機能用同一條指令重現，也不必碰後台那個一輸入就會讓整頁變空白的「組建命令」欄位。

## 改動 base 相關設定後的本機驗證

```bash
rm -rf dist && npm run build

ls -a dist                                   # 應只有 404.html 與 qrcode-studio/
grep -rho 'href="/[^"]*"' dist/qrcode-studio --include='*.html' \
  | sort -u | grep -v '^href="/qrcode-studio/'   # 必須零輸出

npx wrangler dev --port 8799 --local         # 用真正的 Workers runtime 驗
curl -sI http://127.0.0.1:8799/qrcode-studio/            # 200
curl -sI http://127.0.0.1:8799/qrcode-studio             # 307 → 帶尾斜線
curl -sI "http://127.0.0.1:8799/qrcode-studio?utm_source=t"  # 307，不能是 404
curl -sI http://127.0.0.1:8799/qrcode-studio-foo         # 404 但 content-length 不能是 0
```

**wrangler dev 會在啟動時建好資產清單**，build 之後沒重啟的話會拿到過時的結果
（實際踩過：未預渲染路徑一度回 404，重啟後正常）。改完 build 一定要重啟再驗。
