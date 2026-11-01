#!/usr/bin/env python3
r"""
K06-island-for-Gemini — 專案進度與跨模型無縫接手紀錄管理器 (island_notes_manager.py)

用途：
1. init     : 初始化標準化 island_project_notes.md（含跨模型接手快照、TODO 表、Done 雙位數流水號表）
2. complete : 完成單一階段時即時寫入 Done 表（自動遞增 01, 02...、合併「階段<br>項目名稱」、忠實保存原始提示詞）並同步更新快照與 TODO
3. status   : 供新接手之 AI 模型快速讀取當前進度摘要與下一步待辦事項
"""

import argparse
import datetime
import os
import re
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

DEFAULT_STAGES = [
    ("Stage 1", "架構拆解、視覺地標分析與實作計畫核准", "盤點資料結構、提取色票、規劃核心地標與各單元節點空間佈局並取得使用者核准"),
    ("Stage 2", "資料層、UTF-8 防亂碼與即時狀態／測驗引擎", "實作 TextDecoder('utf-8') BOM 清洗、離線備援常數、個資遮蔽檢查與推薦測驗邏輯"),
    ("Stage 3", "3D 積木核心、同材質靜態幾何合併與移軸後製", "建立單例幾何快取池、bakeStaticGroup 靜態合併（縮減率 >= 75%）、移軸微縮後製（手機自動關閉）與天氣日夜光影"),
    ("Stage 4", "中央核心主島與精神地標純幾何建模", "零外部 3D 模型檔，100% 以基本幾何拼裝中央核心主地標、廣場景觀與共用角色元件"),
    ("Stage 5", "各單元節點微縮建築、招牌道具與尋寶小夥伴建模", "拼裝各單元主題微縮建築、連接橋樑／航線動態載具與白名單計數尋寶小夥伴"),
    ("Stage 6", "響應式 HUD 介面整合與雙端 Playwright 零錯誤驗證", "完成頂端雙行不折行品牌卡、整數像素名牌、側欄／Bottom Sheet、導覽工具列，並通過桌機與 360px 窄螢幕自動化驗收"),
]


def sanitize_cell(text: str) -> str:
    """將多行文字與管道符號安全轉譯為單列 Markdown 表格儲存格格式（零資訊刪減）。"""
    if not text:
        return ""
    cleaned = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    cleaned = cleaned.replace("|", r"\|")
    cleaned = "<br>".join(line.strip() for line in cleaned.split("\n"))
    return cleaned


def now_str() -> str:
    return datetime.datetime.now().strftime("%Y-%m-%d %H:%M")


def cmd_init(args: argparse.Namespace) -> int:
    target = os.path.abspath(args.file)
    if os.path.exists(target) and not args.force:
        print(f"[SKIP] 檔案已存在：{target}（若需覆寫請加 --force）")
        return 0

    os.makedirs(os.path.dirname(target), exist_ok=True)

    todo_rows = "\n".join(
        f"| {st} | {name} | {desc} | ⏳ 待執行 |" for st, name, desc in DEFAULT_STAGES
    )

    content = f"""# {args.title}：3D 互動微縮專案紀錄 ({os.path.basename(target)})

最後更新時間：{now_str()} ｜ 目前狀態：專案初始化完成，準備進入 Stage 1 計畫核准

---

## 跨模型接手狀態快照 (Handover Snapshot)

> **跨模型接手說明**：若因 Token 額度耗盡切換模型或開啟新對話，請先閱讀下表與「待辦事項 (TODO)」，即可直接從最新未完成階段無縫接續開發，無須重頭詢問。

| 狀態欄位 | 目前設定值 |
| :--- | :--- |
| **內容主題** | {sanitize_cell(args.theme)} |
| **視覺風格** | {sanitize_cell(args.style)} |
| **空間比喻模型** | {sanitize_cell(args.metaphor)} |
| **前端技術棧** | {sanitize_cell(args.stack)} |
| **主入口檔案** | `{args.entry}` |
| **最新完成階段** | 尚無（初始化） |
| **接手下一步指引** | 執行 Stage 1：分析使用者素材與空間配置，提交實作計畫驗證 |

---

## 待辦事項 (TODO)

| 階段編號 | 項目名稱 | 預計執行內容 | 狀態 |
| :--- | :--- | :--- | :--- |
{todo_rows}

---

## 已完成事項 (Done)

| 編號 | 階段及項目名稱 | 完成內容摘要 | 我下的提示詞 |
| :--- | :--- | :--- | :--- |
"""
    with open(target, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"[OK] 已初始化專案紀錄檔：{target}")
    return 0


def cmd_complete(args: argparse.Namespace) -> int:
    target = os.path.abspath(args.file)
    if not os.path.exists(target):
        print(f"[ERROR] 找不到專案紀錄檔：{target}，請先執行 init。", file=sys.stderr)
        return 1

    with open(target, "r", encoding="utf-8") as f:
        content = f.read()

    prompt_raw = args.prompt or ""
    if args.prompt_file:
        with open(args.prompt_file, "r", encoding="utf-8-sig") as pf:
            prompt_raw = pf.read()
    if not prompt_raw:
        prompt_raw = "同上"

    # 解析目前 Done 表最大雙位數流水號
    done_marker = "## 已完成事項 (Done)"
    if done_marker not in content:
        print(f"[ERROR] 檔案缺少 '{done_marker}' 區塊。", file=sys.stderr)
        return 1

    before_done, done_part = content.split(done_marker, 1)
    serials = [int(m.group(1)) for m in re.finditer(r"^\|\s*(\d{2,3})\s*\|", done_part, flags=re.MULTILINE)]
    next_seq = (max(serials) + 1) if serials else 1
    seq_str = f"{next_seq:02d}"

    stage_clean = sanitize_cell(args.stage)
    name_clean = sanitize_cell(args.name)
    summary_clean = sanitize_cell(args.summary)
    prompt_clean = sanitize_cell(prompt_raw)

    new_done_row = f"| {seq_str} | {stage_clean}<br>{name_clean} | {summary_clean} | {prompt_clean} |\n"
    if not done_part.endswith("\n"):
        done_part += "\n"
    done_part += new_done_row

    # 移除已完成之 TODO 列，並更新快照欄位
    lines = before_done.splitlines(keepends=True)
    updated_lines = []
    in_todo = False
    remaining_todos = []

    for line in lines:
        stripped = line.strip()
        if stripped.startswith("最後更新時間："):
            next_hint = sanitize_cell(args.next_todo) if args.next_todo else f"已完成至 {stage_clean}"
            updated_lines.append(f"最後更新時間：{now_str()} ｜ 目前狀態：已完成 #{seq_str}（{stage_clean}）— {next_hint}\n")
            continue
        if stripped.startswith("| **最新完成階段** |"):
            updated_lines.append(f"| **最新完成階段** | #{seq_str} {stage_clean}：{name_clean} |\n")
            continue
        if stripped.startswith("| **接手下一步指引** |") and args.next_todo:
            updated_lines.append(f"| **接手下一步指引** | {sanitize_cell(args.next_todo)} |\n")
            continue

        if stripped.startswith("## 待辦事項 (TODO)"):
            in_todo = True
            updated_lines.append(line)
            continue

        if in_todo:
            if stripped.startswith("---"):
                # 若 TODO 皆已清空，自動補上無待辦列
                if not remaining_todos:
                    updated_lines.append(
                        f"| 無 | 本階段修改項目皆已全數結案 | 最新完成 #{seq_str}（{stage_clean}：{name_clean}）。 | ✅ 無待辦 |\n\n"
                    )
                in_todo = False
                updated_lines.append(line)
                continue
            if stripped.startswith("|") and not stripped.startswith("| 階段編號") and not stripped.startswith("| :---"):
                cols = [c.strip() for c in stripped.split("|")]
                row_stage = cols[1] if len(cols) > 1 else ""
                if row_stage == args.stage.strip() or row_stage == "無":
                    # 已完成此階段或舊無待辦列，予以移除
                    continue
                remaining_todos.append(row_stage)
            updated_lines.append(line)
        else:
            updated_lines.append(line)

    # 若未指定 --next-todo 但仍有剩餘 TODO，自動將第一筆剩餘 TODO 設為下一步指引
    final_before = "".join(updated_lines)
    if not args.next_todo:
        next_guide = f"接續執行 {remaining_todos[0]}" if remaining_todos else "全數階段已結案，可依使用者需求追加彩蛋或強化模組"
        final_before = re.sub(
            r"^\|\s*\*\*接手下一步指引\*\*\s*\|.*\|$",
            f"| **接手下一步指引** | {next_guide} |",
            final_before,
            flags=re.MULTILINE,
        )

    with open(target, "w", encoding="utf-8") as f:
        f.write(final_before + done_marker + done_part)

    print(f"[OK] 已寫入完成紀錄 #{seq_str} ({args.stage} - {args.name}) -> {target}")
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    target = os.path.abspath(args.file)
    if not os.path.exists(target):
        print(f"[ERROR] 找不到專案紀錄檔：{target}", file=sys.stderr)
        return 1

    with open(target, "r", encoding="utf-8") as f:
        content = f.read()

    done_rows = re.findall(r"^\|\s*(\d{2,3})\s*\|\s*([^|]+)\|", content, flags=re.MULTILINE)
    print(f"=== 專案進度接手快照 ({target}) ===")
    for line in content.splitlines():
        if line.startswith("最後更新時間：") or line.startswith("| **"):
            print(line)
    print(f"\n已完成階段總數：{len(done_rows)} 筆")
    if done_rows:
        last_id, last_title = done_rows[-1]
        print(f"最新一筆完成：#{last_id} {last_title.strip().replace('<br>', ' — ')}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="K06 3D 島嶼專案進度與跨模型接手紀錄管理器")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init", help="初始化標準 island_project_notes.md")
    p_init.add_argument("--file", required=True, help="目標 Markdown 路徑")
    p_init.add_argument("--title", required=True, help="專案名稱")
    p_init.add_argument("--theme", required=True, help="問題 1：內容主題")
    p_init.add_argument("--style", required=True, help="問題 2：視覺風格")
    p_init.add_argument("--metaphor", required=True, help="問題 3：空間比喻模型")
    p_init.add_argument("--stack", default="原生 ES Modules + Three.js 0.170.0 CDN importmap", help="前端技術棧")
    p_init.add_argument("--entry", default="island.html", help="主入口 HTML 檔名")
    p_init.add_argument("--force", action="store_true", help="強制覆寫既有檔案")
    p_init.set_defaults(func=cmd_init)

    p_comp = sub.add_parser("complete", help="記錄已完成階段並更新接手狀態")
    p_comp.add_argument("--file", required=True, help="目標 Markdown 路徑")
    p_comp.add_argument("--stage", required=True, help="階段代號（例如 'Stage 1' 或 '【彩蛋】紅綠燈-1'）")
    p_comp.add_argument("--name", required=True, help="項目名稱")
    p_comp.add_argument("--summary", required=True, help="完成內容摘要")
    p_comp.add_argument("--prompt", default="", help="忠實呈現使用者輸入的原始提示詞（或填 '同上'）")
    p_comp.add_argument("--prompt-file", default="", help="從 UTF-8 文字檔讀取多行原始提示詞（避免命令列引號跳脫問題）")
    p_comp.add_argument("--next-todo", default="", help="明確指定接手下一步指引")
    p_comp.set_defaults(func=cmd_complete)

    p_stat = sub.add_parser("status", help="讀取當前接手狀態摘要")
    p_stat.add_argument("--file", required=True, help="目標 Markdown 路徑")
    p_stat.set_defaults(func=cmd_status)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
