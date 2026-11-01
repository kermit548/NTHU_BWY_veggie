#!/usr/bin/env python3
r"""
K06-island-for-Gemini — 3D 互動群島雙端品質、效能與窄螢幕防碰撞自動化驗收工具 (audit_island_e2e.py)

檢驗項目：
1. 桌機 (1280x800) 與窄版／標準手機 (360x740, 390x844) 實機無頭瀏覽器載入
2. Console Error 與 Page Error 零錯誤斷言
3. 零外部 3D 模型檔 (.glb / .gltf / .fbx / .obj) 請求稽核（純程式幾何驗證）
4. window.__ISLAND_METRICS__ 靜態幾何合併縮減率檢驗（門檻 >= 75%）
5. 手機端頂端品牌資訊卡「標題 + 膠囊標籤」同一直線不折行及右上角按鈕零碰撞檢驗
6. 嚴格目錄隔離：所有截圖與 JSON 報告僅輸出至指定隔離目錄 (--out-dir)
"""

import argparse
import functools
import http.server
import json
import os
import socket
import sys
import tempfile
import threading
from contextlib import contextmanager

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

FORBIDDEN_MODEL_EXTS = (".glb", ".gltf", ".fbx", ".obj", ".dae", ".stl")


class QuietSimpleHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass


@contextmanager
def maybe_local_server(url: str, root: str, entry: str):
    if url:
        yield url
        return
    if not root:
        raise ValueError("必須提供 --url 或 --root 其中之一。")

    abs_root = os.path.abspath(root)
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        port = s.getsockname()[1]

    handler = functools.partial(QuietSimpleHandler, directory=abs_root)
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        clean_entry = entry.lstrip("/")
        yield f"http://127.0.0.1:{port}/{clean_entry}"
    finally:
        httpd.shutdown()
        httpd.server_close()


def run_audit(target_url: str, out_dir: str, min_merge_pct: float, allow_external_models: bool, wait_ms: int) -> int:
    from playwright.sync_api import sync_playwright

    os.makedirs(out_dir, exist_ok=True)
    viewports = [
        {"name": "desktop_1280", "width": 1280, "height": 800, "mobile": False},
        {"name": "mobile_360_narrow", "width": 360, "height": 740, "mobile": True},
        {"name": "mobile_390_std", "width": 390, "height": 844, "mobile": True},
    ]

    report = {
        "target_url": target_url,
        "out_dir": out_dir,
        "passed": True,
        "failures": [],
        "viewports": {},
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for vp in viewports:
            vp_name = vp["name"]
            console_errors = []
            page_errors = []
            external_models = []

            ctx_kwargs = {"viewport": {"width": vp["width"], "height": vp["height"]}}
            if vp["mobile"]:
                ctx_kwargs.update({
                    "is_mobile": True,
                    "has_touch": True,
                    "user_agent": (
                        "Mozilla/5.0 (Linux; Android 13; Pixel 7) "
                        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36"
                    ),
                })

            context = browser.new_context(**ctx_kwargs)
            page = context.new_page()

            page.on("console", lambda msg, ce=console_errors: ce.append(msg.text) if msg.type == "error" else None)
            page.on("pageerror", lambda err, pe=page_errors: pe.append(str(err)))
            page.on(
                "request",
                lambda req, em=external_models: em.append(req.url)
                if req.url.split("?")[0].lower().endswith(FORBIDDEN_MODEL_EXTS)
                else None,
            )

            print(f"[AUDIT] 載入視窗 {vp_name} ({vp['width']}x{vp['height']}) -> {target_url}")
            page.goto(target_url, wait_until="networkidle", timeout=45000)
            page.wait_for_timeout(wait_ms)

            # 1. 檢查 Canvas
            canvas_count = page.locator("canvas").count()
            canvas_box = page.locator("canvas").first.bounding_box() if canvas_count > 0 else None

            # 2. 讀取 __ISLAND_METRICS__ (若有暴露)
            metrics = page.evaluate("() => window.__ISLAND_METRICS__ || null")

            # 3. 檢查手機端頂端品牌卡單行與防碰撞
            brand_layout = None
            if vp["mobile"] and page.locator(".brand-card h1").count() > 0 and page.locator(".sky-pill").count() > 0:
                h1_box = page.locator(".brand-card h1").first.bounding_box()
                pill_box = page.locator(".sky-pill").first.bounding_box()
                btn_loc = page.locator("#btnMobileDevlog, .mobile-devlog-btn")
                btn_box = btn_loc.first.bounding_box() if btn_loc.count() > 0 and btn_loc.first.is_visible() else None

                if h1_box and pill_box:
                    y_diff = abs(h1_box["y"] - pill_box["y"])
                    clearance = (btn_box["x"] - (pill_box["x"] + pill_box["width"])) if btn_box else None
                    brand_layout = {
                        "y_diff_px": round(y_diff, 2),
                        "same_line": y_diff < 6.0,
                        "button_clearance_px": round(clearance, 2) if clearance is not None else None,
                    }
                    if not brand_layout["same_line"]:
                        report["failures"].append(
                            f"[{vp_name}] 頂端膠囊標籤被擠至第二行 (y_diff={y_diff:.2f}px >= 6px)"
                        )
                    if clearance is not None and clearance <= 0:
                        report["failures"].append(
                            f"[{vp_name}] 頂端膠囊標籤與右上角按鈕發生重疊碰撞 (clearance={clearance:.2f}px)"
                        )

            # 截圖存檔於隔離目錄
            shot_path = os.path.join(out_dir, f"audit_{vp_name}.png")
            page.screenshot(path=shot_path)

            if canvas_count == 0 or not canvas_box or canvas_box["width"] <= 0:
                report["failures"].append(f"[{vp_name}] 找不到有效渲染之 WebGL <canvas> 元素")
            if console_errors:
                report["failures"].append(f"[{vp_name}] 偵測到 Console Errors: {console_errors}")
            if page_errors:
                report["failures"].append(f"[{vp_name}] 偵測到 Page Errors: {page_errors}")
            if external_models and not allow_external_models:
                report["failures"].append(f"[{vp_name}] 違反純程式幾何原則，偵測到外部 3D 模型請求: {external_models}")

            if isinstance(metrics, dict) and metrics.get("rawStaticMeshes", 0) > 0:
                raw_m = metrics["rawStaticMeshes"]
                merged_m = metrics.get("mergedStaticMeshes", raw_m)
                reduction = (1.0 - (merged_m / raw_m)) * 100.0
                metrics["computedReductionPct"] = round(reduction, 2)
                if reduction < min_merge_pct:
                    report["failures"].append(
                        f"[{vp_name}] 靜態幾何合併縮減率 {reduction:.2f}% 低於門檻 {min_merge_pct:.1f}%"
                    )

            report["viewports"][vp_name] = {
                "screenshot": shot_path,
                "canvas_box": canvas_box,
                "console_error_count": len(console_errors),
                "page_error_count": len(page_errors),
                "external_model_requests": external_models,
                "metrics": metrics,
                "brand_layout": brand_layout,
            }
            context.close()

        browser.close()

    report["passed"] = len(report["failures"]) == 0
    report_path = os.path.join(out_dir, "audit_report.json")
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=2)

    print(f"\n[REPORT] 稽核報告已寫入：{report_path}")
    if report["passed"]:
        print("[PASS] 雙端 E2E 渲染、零錯誤、純幾何與窄螢幕排版檢驗全數通過！")
        return 0
    else:
        print("[FAIL] 發現以下未通過項目：", file=sys.stderr)
        for item in report["failures"]:
            print(f"  - {item}", file=sys.stderr)
        return 1


def main() -> int:
    parser = argparse.ArgumentParser(description="K06 3D 群島網站雙端自動化品質與防碰撞驗收工具")
    parser.add_argument("--url", default="", help="已啟動之目標網址（如 http://localhost/project/island.html）")
    parser.add_argument("--root", default="", help="若未啟動伺服器，指定靜態網站根目錄自動掛載臨時 HTTP Server")
    parser.add_argument("--entry", default="island.html", help="搭配 --root 使用之入口 HTML 檔名")
    parser.add_argument(
        "--out-dir",
        default=os.path.join(tempfile.gettempdir(), "k06_island_audit"),
        help="隔離輸出目錄（存放截圖與 audit_report.json，嚴禁設為專案根目錄）",
    )
    parser.add_argument("--min-merge-pct", type=float, default=75.0, help="靜態幾何合併最低縮減率百分比門檻")
    parser.add_argument("--allow-external-models", action="store_true", help="允許載入外部 GLTF/OBJ 模型")
    parser.add_argument("--wait-ms", type=int, default=2200, help="頁面載入後等待 3D 動畫穩定毫秒數")
    args = parser.parse_args()

    with maybe_local_server(args.url, args.root, args.entry) as target_url:
        return run_audit(
            target_url=target_url,
            out_dir=os.path.abspath(args.out_dir),
            min_merge_pct=args.min_merge_pct,
            allow_external_models=args.allow_external_models,
            wait_ms=args.wait_ms,
        )


if __name__ == "__main__":
    sys.exit(main())
