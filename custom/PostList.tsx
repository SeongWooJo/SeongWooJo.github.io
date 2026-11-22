import { FilePath, FullSlug, resolveRelative, slugifyFilePath } from "../quartz/util/path"
import { QuartzPluginData } from "../quartz/plugins/vfile"
import { byDateAndAlphabetical } from "../quartz/components/PageList"
import { Date, getDate } from "../quartz/components/Date"
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../quartz/components/types"

interface Options {
  /** 한 페이지에 보여 줄 글 수 */
  pageSize: number
  /** 대표 이미지를 적는 프론트매터 키 */
  thumbnailKey: string
}

/** 프론트매터에 적은 대표 이미지(파일 이름, [[파일 이름]], https 주소)를 이 페이지 기준 주소로 바꾼다. */
function thumbnailUrl(current: FullSlug, value: unknown, allFiles: string[]): string | undefined {
  // 따옴표 없이 `thumbnail: [[파일.webp]]` 로 적으면 YAML 이 겹친 목록으로 읽는다
  while (Array.isArray(value)) value = value[0]
  if (typeof value !== "string" || value.trim() === "") return undefined
  const v = value.trim().replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim()
  if (/^https?:\/\//i.test(v)) return v
  // 한글 파일 이름은 기기에 따라 자모가 풀린 형태(NFD)로 저장되기도 해서 맞춰 놓고 비교한다
  const base = (p: string) => p.normalize("NFC").toLowerCase().split("/").pop()
  const name = base(v)
  const hit = allFiles.find((fp) => base(fp) === name)
  return hit ? resolveRelative(current, slugifyFilePath(hit as FilePath)) : undefined
}

/**
 * 홈과 폴더(분류) 페이지에 "그 아래 모든 글"을 최신순으로 보여 주는 목록.
 * - 홈: 사이트의 모든 글
 * - 폴더 페이지: 하위 폴더까지 포함한 그 분류의 모든 글 (Quartz 기본 목록은 바로 아래 항목만 보여 준다)
 * 글은 전부 HTML 에 들어가고, 5개씩 나눠 보여 주는 일은 아래 스크립트가 브라우저에서 한다.
 */
export default ((userOpts?: Partial<Options>) => {
  const pageSize = userOpts?.pageSize ?? 5
  const thumbnailKey = userOpts?.thumbnailKey ?? "thumbnail"

  const PostList: QuartzComponent = (props: QuartzComponentProps) => {
    const { fileData, allFiles, cfg, ctx } = props
    const slug = fileData.slug ?? ""
    const isHome = slug === "index"
    const isFolder = slug.endsWith("/index") && !slug.startsWith("tags/")
    if (!isHome && !isFolder) return null

    const prefix = isHome ? "" : slug.slice(0, -"index".length) // 예: "cs-note/web/"
    const posts = allFiles.filter((f: QuartzPluginData) => {
      const s = f.slug ?? ""
      return (
        f.filePath !== undefined && // 실제 파일만 (폴더·태그 같은 가상 페이지 제외)
        f.unlisted !== true &&
        s !== "index" &&
        !s.endsWith("/index") &&
        s.startsWith(prefix)
      )
    })

    // 바로 아래 하위 폴더: 원래 폴더 이름(대소문자 유지)과 글 수
    const depth = prefix === "" ? 0 : prefix.split("/").length - 1
    const folders = new Map<string, { name: string; count: number }>()
    for (const f of posts) {
      const slugParts = (f.slug ?? "").split("/")
      if (slugParts.length <= depth + 1) continue // 이 폴더 바로 아래의 글
      const key = slugParts[depth]
      const rel = String(f.relativePath ?? "").split("/")
      const name = rel.length > depth + 1 ? rel[depth] : key
      const cur = folders.get(key)
      folders.set(key, { name, count: (cur?.count ?? 0) + 1 })
    }

    return (
      <div class="post-list page-listing" data-page-size={pageSize}>
        {folders.size > 0 && (
          <ul class="post-list-folders">
            {[...folders.entries()].map(([key, { name, count }]) => (
              <li>
                <a
                  class="internal"
                  href={resolveRelative(fileData.slug!, `${prefix}${key}/index` as FullSlug)}
                  data-no-popover="true"
                >
                  {name} <span>{count}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <h2 class="post-list-title">{isHome ? "최근 글" : `이 분류의 글 ${posts.length}개`}</h2>
        <ul class="section-ul post-ul">
          {[...posts].sort(byDateAndAlphabetical()).map((page) => {
            const href = resolveRelative(fileData.slug!, page.slug!)
            const tags = (page.frontmatter?.tags ?? []) as string[]
            const thumb = thumbnailUrl(
              fileData.slug!,
              (page.frontmatter as Record<string, unknown> | undefined)?.[thumbnailKey],
              ctx.allFiles as string[],
            )
            return (
              <li class="section-li post-item">
                <a class="post-thumb" href={href} tabIndex={-1} aria-hidden="true" data-no-popover="true">
                  {thumb && <img src={thumb} alt="" loading="lazy" decoding="async" />}
                </a>
                <div class="post-text">
                  <h3>
                    <a href={href} class="internal">
                      {page.frontmatter?.title}
                    </a>
                  </h3>
                  <p class="meta">{page.dates && <Date date={getDate(page)!} locale={cfg.locale} />}</p>
                  <ul class="tags">
                    {tags.map((tag) => (
                      <li>
                        <a class="internal tag-link" href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}>
                          {tag}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            )
          })}
        </ul>
        {posts.length > pageSize && <nav class="pager" aria-label="글 목록 페이지" />}
      </div>
    )
  }

  PostList.css = `
.post-list { margin-top: 1.5rem; }
/* h2 이지만 크기는 목록 안의 글 제목(h3)과 같은 단계로 둔다 */
.post-list .post-list-title { margin: 0 0 0.75rem; font-size: 1.12rem; }
.post-list .post-list-folders { display: flex; flex-wrap: wrap; gap: 0.4rem; list-style: none; margin: 0 0 1.5rem; padding: 0; }
.post-list .post-list-folders a { display: inline-flex; gap: 0.4rem; align-items: baseline; padding: 0.2rem 0.7rem; border: 1px solid var(--lightgray); border-radius: 999px; background: var(--light); font-weight: 600; }
.post-list .post-list-folders a:hover { border-color: var(--secondary); }
.post-list .post-list-folders span { color: var(--subtle-text, var(--darkgray)); font-weight: 400; font-size: 0.85em; }
.post-list ul.post-ul { list-style: none; margin: 0; padding: 0; }
.post-list li.post-item { display: grid; grid-template-columns: 7.5rem minmax(0, 1fr); gap: 1rem; align-items: start; margin: 0 0 1.25rem; }
.post-list .post-thumb { display: block; aspect-ratio: 3 / 2; border-radius: 8px; overflow: hidden; background: var(--lightgray); }
.post-list .post-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; margin: 0; border-radius: 0; }
.post-list .post-text h3 { margin: 0; font-size: 1.1rem; line-height: 1.4; }
/* 목록의 제목 링크에는 본문 링크용 배경색을 쓰지 않는다 */
.post-list .post-text h3 a { background-color: transparent; padding: 0; }
.post-list .post-text .meta { margin: 0.15rem 0 0; color: var(--subtle-text, var(--darkgray)); white-space: nowrap; }
.post-list .post-text .tags { margin: 0.45rem 0 0; justify-content: flex-start; }
@media (max-width: 600px) { .post-list li.post-item { grid-template-columns: 5.5rem minmax(0, 1fr); gap: 0.75rem; } }
li.pager-hidden { display: none !important; }
nav.pager { display: flex; flex-wrap: wrap; gap: 0.3rem; align-items: center; justify-content: center; min-height: 2.1rem; margin: 1.5rem 0 0; }
/* display:flex 가 hidden 속성을 덮어쓰지 않게 한다 (글이 한 페이지뿐일 때 빈 줄이 남지 않도록) */
nav.pager[hidden] { display: none; }
nav.pager button { font: inherit; font-size: 0.9rem; min-width: 2.1rem; height: 2.1rem; padding: 0 0.6rem; border: 1px solid var(--lightgray); border-radius: 6px; background: var(--light); color: var(--darkgray); cursor: pointer; }
nav.pager button:hover:not(:disabled):not([aria-current]) { border-color: var(--secondary); color: var(--secondary); }
nav.pager button[aria-current="page"] { background: var(--secondary); border-color: var(--secondary); color: var(--light); font-weight: 600; cursor: default; }
nav.pager button:disabled { opacity: 0.4; cursor: default; }
nav.pager .pager-gap { color: var(--subtle-text, var(--darkgray)); padding: 0 0.2rem; }
/* 폴더 페이지의 기본 목록(바로 아래 항목만)은 위 목록과 겹치므로 감춘다 */
[data-quartz-plugin="folder-page"] .page-listing { display: none; }
`

  // 글은 전부 HTML 에 들어 있어서, 아래 스크립트가 돌기 전까지는 목록 전체가 한꺼번에 보였다가
  // 줄어든다(화면이 밀리고, 안 보일 썸네일까지 받는다). 화면이 처음 그려지기 전에 지금 페이지 밖의 글을
  // 감추는 규칙을 넣어 둔다. 아래 스크립트가 처음 돌 때 이 규칙을 지운다 (남겨 두면 링크 미리보기 안의
  // 목록까지 잘린다). 그 뒤의 페이지 이동은 스크립트가 화면을 그리기 전에 바로 처리한다.
  // 자바스크립트가 꺼져 있으면 규칙이 들어가지 않아 글이 전부 보인다.
  PostList.beforeDOMLoaded = `
(function () {
  var size = ${pageSize};
  var page = parseInt(new URLSearchParams(location.search).get("page") || "1", 10) || 1;
  if (page < 1) page = 1;
  var style = document.createElement("style");
  style.id = "pager-initial";
  style.setAttribute("data-persist", "true");
  style.textContent =
    'body:not([data-slug="tags/index"]):not([data-slug="tags"]) :is(.post-list, [data-quartz-plugin="tag-page"] .page-listing) ul.section-ul:not(.pager-ready) > li:not(:nth-child(n+' +
    ((page - 1) * size + 1) + '):nth-child(-n+' + page * size + ')) { display: none !important; }';
  document.head.appendChild(style);
})();
`

  // 목록을 pageSize 개씩 나눠 보여 준다. 홈·폴더 목록과 태그 페이지의 기본 목록에 적용된다.
  PostList.afterDOMLoaded = `
(function () {
  var DEFAULT_SIZE = ${pageSize};
  function setup() {
    var initial = document.getElementById("pager-initial"); // 첫 화면용 임시 규칙 (beforeDOMLoaded 참고)
    var slug = document.body.dataset.slug || "";
    if (slug === "tags/index" || slug === "tags") { if (initial) initial.remove(); return; } // 태그 전체 목록은 태그별 묶음이라 나누지 않는다
    var boxes = document.querySelectorAll('.post-list, [data-quartz-plugin="tag-page"] .page-listing');
    boxes.forEach(function (box) {
      var ul = box.querySelector("ul.section-ul");
      if (!ul) return;
      var items = Array.prototype.filter.call(ul.children, function (el) { return el.tagName === "LI"; });
      var size = parseInt(box.dataset.pageSize || "", 10) || DEFAULT_SIZE;
      var pages = Math.ceil(items.length / size);
      var nav = box.querySelector("nav.pager");
      if (!nav) {
        nav = document.createElement("nav");
        nav.className = "pager";
        nav.setAttribute("aria-label", "글 목록 페이지");
        box.appendChild(nav);
      }
      ul.classList.add("pager-ready");
      if (pages <= 1) { nav.hidden = true; items.forEach(function (li) { li.classList.remove("pager-hidden"); }); return; }
      nav.hidden = false;
      var cur = parseInt(new URLSearchParams(location.search).get("page") || "1", 10) || 1;
      cur = Math.min(pages, Math.max(1, cur));
      function button(label, page, opts) {
        var b = document.createElement("button");
        b.type = "button"; b.textContent = label; b.dataset.page = String(page);
        if (opts && opts.current) b.setAttribute("aria-current", "page");
        if (opts && opts.disabled) b.disabled = true;
        if (opts && opts.aria) b.setAttribute("aria-label", opts.aria);
        return b;
      }
      function render(scroll) {
        items.forEach(function (li, i) { li.classList.toggle("pager-hidden", Math.floor(i / size) + 1 !== cur); });
        nav.replaceChildren();
        nav.appendChild(button("이전", cur - 1, { disabled: cur === 1, aria: "이전 페이지" }));
        var last = 0;
        for (var p = 1; p <= pages; p++) {
          if (pages > 7 && p !== 1 && p !== pages && Math.abs(p - cur) > 1) continue; // 많으면 처음·끝·현재 주변만
          if (last && p - last > 1) { var gap = document.createElement("span"); gap.className = "pager-gap"; gap.textContent = "…"; nav.appendChild(gap); }
          nav.appendChild(button(String(p), p, { current: p === cur, aria: p + " 페이지" }));
          last = p;
        }
        nav.appendChild(button("다음", cur + 1, { disabled: cur === pages, aria: "다음 페이지" }));
        var u = new URL(location.href);
        if (cur > 1) u.searchParams.set("page", String(cur)); else u.searchParams.delete("page");
        history.replaceState(history.state, "", u);
        if (scroll) { var r = box.getBoundingClientRect(); if (r.top < 0) window.scrollTo({ top: window.scrollY + r.top - 24 }); }
      }
      nav.onclick = function (e) {
        var b = e.target.closest ? e.target.closest("button[data-page]") : null;
        if (!b || b.disabled || b.getAttribute("aria-current")) return;
        cur = parseInt(b.dataset.page, 10);
        render(true);
        // 단추를 새로 그리면서 누른 단추가 사라지므로, 키보드 위치를 지금 페이지 단추로 옮겨 둔다
        var now = nav.querySelector('button[aria-current="page"]');
        if (now) now.focus({ preventScroll: true });
      };
      render(false);
    });
    if (initial) initial.remove();
  }
  document.addEventListener("nav", setup);
  document.addEventListener("render", setup);
})();
`
  return PostList
}) satisfies QuartzComponentConstructor<Partial<Options> | undefined>
