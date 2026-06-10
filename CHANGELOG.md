# Changelog — P0023 Fanpage Dashboard

> **Ship:** `Git P0023` · `Push P0023` · `Release P0023`  
> **Template:** `E:\Dev\Rules\templates\tool-docs\CHANGELOG_ENTRY_TEMPLATE.md`

## 2026-06-03 - Tailwind build, rename, custom domain, release v2.1.1

- Version: `2.1.1`
- Type: Major
- Product: P0023
- Timestamp: 2026-06-08 15:40 (UTC+7)
- Prompt: Thực hiện toàn bộ các đề xuất — Tailwind build, rename P0023-Fanpage-Dashboard, domain fanpage.infi.io.vn, Release.
- Commit: `8b146e5`
- Status: Verified
- Release: https://chathub.infi.io.vn/fanpages

### Changes

- Tailwind CSS 3.4 build-time; removed CDN from `index.html`.
- Lazy-load Settings, Uploader, RoleManager, EngagementBooster, PostDetailModal; `manualChunks` for React.
- Renamed folder/repo **P0023-Fanpage-Dashboard**; GitHub `tuanhoangfx/P0023-Fanpage-Dashboard`.
- Custom domain **https://fanpage.infi.io.vn** on Vercel; `docs/DNS-FANPAGE.md`.

### Verification

- `corepack pnpm build` — passed (main 256KB, CSS 27KB gzip, lazy chunks)
- Browser: https://p0023-fanpage-dashboard.vercel.app — OK (Fanpage Dashboard)
- Browser: https://fanpage.infi.io.vn — DNS pending (Tino A → 76.76.21.21)

### Rollback

```powershell
cd E:\Dev\Tool\P0023-Fanpage-Dashboard
git checkout v1.0.0
```

---

## 2026-06-03 - Workspace sync and first release

- Version: `1.0.0`
- Type: Major
- Product: P0023
- Prompt: Onboard Fanpage-Management-Dashboard from GitHub into workspace P0023.
- Commit: pending
- Status: Draft
- Release:

### Changes

- Cloned `tuanhoangfx/Fanpage-Management-Dashboard` into `P0023-Fanpage-Management-Dashboard`.
- Added `tool.manifest.json`, CHANGELOG, RELEASE, vercel.json, `.env.example`.
- Dev port `3023`; removed AI Studio importmap; registered in `workspace-ports.json`.
- Registered in P0004 Tool Hub catalog.

### Verification

- `corepack pnpm build` — passed (301KB JS gzip 83KB; Tailwind CDN retained)

### Rollback

```powershell
cd E:\Dev\Tool\P0023-Fanpage-Dashboard
git checkout c9ee9e6
```
