#!/usr/bin/env python3
"""content/ 의 글에 적힌 바깥 주소(http·https)가 아직 열리는지 확인한다.

- 없어진 주소(404·410)가 하나라도 있으면 실패로 끝난다 (종료 코드 1).
- 막아 둔 곳(403·429 등)이나 연결이 안 된 곳은 "확인 못 함"으로만 적는다. 사람에게는 열리는 경우가 많다.
- 글끼리의 링크와 그림은 여기서 보지 않는다. 글을 올릴 때 따로 검사한다.
- 코드 블록과 `인라인 코드` 안의 주소는 예시이므로 건너뛴다.
"""

from __future__ import annotations

import concurrent.futures
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = "content"
URL = re.compile(r"https?://[^\s<>\"')\]]+")
CODE = re.compile(r"```.*?```|~~~.*?~~~|`[^`\n]*`", re.S)
LOCAL = re.compile(r"https?://(localhost|127\.|\[::1\])")


def status(url: str) -> tuple[str, str]:
    """('ok' | 'broken' | 'unknown', 설명)"""
    last = ""
    for method in ("HEAD", "GET"):
        req = urllib.request.Request(url, method=method, headers={"User-Agent": "Mozilla/5.0 (link check)"})
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                return "ok", str(res.status)
        except urllib.error.HTTPError as e:
            last = str(e.code)
            if method == "HEAD":
                continue  # HEAD 를 막는 곳이 많다 → GET 으로 한 번 더
            return ("broken", last) if e.code in (404, 410) else ("unknown", last)
        except Exception as e:  # 연결 실패·시간 초과 등
            last = type(e).__name__
    return "unknown", last


def main() -> int:
    found: dict[str, list[str]] = {}
    for folder, _, files in os.walk(ROOT):
        for name in files:
            if not name.endswith(".md"):
                continue
            path = os.path.join(folder, name)
            text = CODE.sub("", open(path, encoding="utf-8").read())
            for url in URL.findall(text):
                url = url.rstrip(".,;:!?")
                if not LOCAL.match(url):
                    found.setdefault(url, []).append(path)

    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        results = dict(zip(found, pool.map(status, found)))

    broken = [(u, why) for u, (state, why) in results.items() if state == "broken"]
    unknown = [(u, why) for u, (state, why) in results.items() if state == "unknown"]
    lines = [f"주소 {len(found)}개 확인 — 없어짐 {len(broken)} · 확인 못 함 {len(unknown)}", ""]
    for title, items in (("없어진 주소", broken), ("확인 못 한 주소", unknown)):
        if items:
            lines.append(f"### {title}")
            lines += [f"- `{why}` {u} — {', '.join(sorted(set(found[u])))}" for u, why in items]
            lines.append("")
    report = "\n".join(lines)
    print(report)
    summary = os.environ.get("GITHUB_STEP_SUMMARY")
    if summary:
        with open(summary, "a", encoding="utf-8") as f:
            f.write("## 링크 검사\n\n" + report + "\n")
    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
