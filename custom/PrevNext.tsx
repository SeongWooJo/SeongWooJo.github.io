import { resolveRelative } from "../quartz/util/path"
import { QuartzPluginData } from "../quartz/plugins/vfile"
import { byDateAndAlphabetical } from "../quartz/components/PageList"
import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../quartz/components/types"

/** 직접 쓴 글인지 (홈·폴더·태그 페이지 제외) */
function isPost(f: QuartzPluginData): boolean {
  const s = f.slug ?? ""
  return f.filePath !== undefined && f.unlisted !== true && s !== "index" && !s.endsWith("/index")
}

/** 글이 들어 있는 분류(폴더). 예: "study/cs/jwt" → "study/cs/" */
function category(slug: string | undefined): string {
  const s = slug ?? ""
  return s.slice(0, s.lastIndexOf("/") + 1)
}

/**
 * 글 아래의 "이전 글 / 다음 글" 이동. 같은 분류(같은 폴더)의 글끼리만 잇는다.
 * 순서는 날짜순이다. 이전 글 = 더 먼저 쓴 글, 다음 글 = 더 나중에 쓴 글.
 * 분류에 글이 하나뿐이면 아무것도 나오지 않는다.
 */
export default (() => {
  const PrevNext: QuartzComponent = ({ fileData, allFiles }: QuartzComponentProps) => {
    if (!isPost(fileData)) return null
    const here = category(fileData.slug)
    const posts = allFiles
      .filter((f) => isPost(f) && category(f.slug) === here)
      .sort(byDateAndAlphabetical()) // 최신이 앞
    const i = posts.findIndex((p) => p.slug === fileData.slug)
    if (i < 0) return null
    const newer = posts[i - 1]
    const older = posts[i + 1]
    if (!newer && !older) return null

    const card = (page: QuartzPluginData | undefined, dir: "prev" | "next") =>
      page ? (
        <a
          class={`internal post-nav-card post-nav-${dir}`}
          href={resolveRelative(fileData.slug!, page.slug!)}
          rel={dir}
          data-no-popover="true"
        >
          <span class="post-nav-label">{dir === "prev" ? "← 이전 글" : "다음 글 →"}</span>
          <span class="post-nav-title">{page.frontmatter?.title}</span>
        </a>
      ) : (
        <span class="post-nav-empty" />
      )

    return (
      <nav class="post-nav" aria-label="같은 분류의 이전 글과 다음 글">
        {card(older, "prev")}
        {card(newer, "next")}
      </nav>
    )
  }

  PrevNext.css = `
.post-nav { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 0.75rem; margin: 1.5rem 0 2.5rem; }
.post-nav a.post-nav-card { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.8rem 1rem; border: 1px solid var(--lightgray); border-radius: 8px; background: transparent; text-decoration: none; transition: border-color 0.15s ease; }
.post-nav a.post-nav-card:hover, .post-nav a.post-nav-card:focus-visible { border-color: var(--secondary); }
.post-nav a.post-nav-next { text-align: right; align-items: flex-end; }
.post-nav .post-nav-label { font-size: 0.8rem; font-weight: 400; color: var(--darkgray); opacity: 0.85; }
.post-nav .post-nav-title { font-size: 0.95rem; font-weight: 600; line-height: 1.4; color: var(--dark); overflow-wrap: anywhere; }
.post-nav a.post-nav-card:hover .post-nav-title { color: var(--secondary); }
@media all and (max-width: 520px) {
  .post-nav { grid-template-columns: minmax(0, 1fr); }
  .post-nav .post-nav-empty { display: none; }
}
`
  return PrevNext
}) satisfies QuartzComponentConstructor
