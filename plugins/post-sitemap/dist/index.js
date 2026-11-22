import path from "node:path"
import fs from "node:fs/promises"

// 직접 쓴 글(실제 파일)과 홈만 sitemap.xml 에 넣고, 글만 담는 RSS 피드(index.xml)도 만든다. 폴더·태그 목록 페이지는 넣지 않는다.
// 내장 사이트맵은 quartz.config.yaml 의 configuration.contentIndex.enableSiteMap: false 로 끈다.
const pad = (n) => String(n).padStart(2, "0")
const day = (d) =>
  d instanceof Date && !isNaN(d) ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : undefined
const xml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

async function writeSitemap(ctx, content) {
  const base = ctx.cfg.configuration.baseUrl
  const urls = []
  for (const [, file] of content) {
    const data = file.data ?? {}
    if (data.filePath === undefined || data.unlisted === true) continue // 가상 페이지(폴더·태그)와 비공개 목록 제외
    const slug = String(data.slug ?? "")
    if (!slug || slug === "404") continue
    const p = slug === "index" ? "" : slug.endsWith("/index") ? slug.slice(0, -5) : slug
    const lastmod = day(data.dates?.modified ?? data.dates?.created)
    urls.push(
      `<url><loc>${xml(encodeURI(`https://${base}/${p}`))}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}</url>`,
    )
  }
  urls.sort()
  const out = path.join(ctx.argv.output, "sitemap.xml")
  await fs.mkdir(path.dirname(out), { recursive: true })
  await fs.writeFile(
    out,
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`,
  )
  // robots.txt 에 사이트맵 위치를 알린다
  const robots = path.join(ctx.argv.output, "robots.txt")
  await fs.writeFile(robots, `User-agent: *\nAllow: /\n\nSitemap: https://${base}/sitemap.xml\n`)
  return [out, robots, await writeFeed(ctx, content), ...(await copyRootFiles(ctx))]
}

// root-files/ 폴더의 파일을 사이트 맨 위(/파일이름)에 그대로 둔다.
// 검색 엔진의 소유 확인 파일처럼 주소가 정해져 있는 파일에 쓴다. (Quartz 의 static/ 은 /static/ 아래로만 나간다)
const ROOT_FILES = "root-files"
async function copyRootFiles(ctx) {
  const dir = path.resolve(ROOT_FILES)
  let names = []
  try {
    names = await fs.readdir(dir)
  } catch {
    return []
  }
  const written = []
  for (const name of names) {
    const src = path.join(dir, name)
    if (name.startsWith(".") || !(await fs.stat(src)).isFile()) continue
    const dst = path.join(ctx.argv.output, name)
    await fs.copyFile(src, dst)
    written.push(dst)
  }
  return written
}

// RSS 피드(index.xml): 직접 쓴 글만 최신순으로 담는다. 홈·폴더·태그 페이지는 넣지 않는다.
// 내장 RSS 는 quartz.config.yaml 의 configuration.contentIndex.enableRSS: false 로 끈다.
const FEED_LIMIT = 20
async function writeFeed(ctx, content) {
  const cfg = ctx.cfg.configuration
  const base = cfg.baseUrl
  const dateType = cfg.defaultDateType ?? "created"
  const posts = []
  for (const [, file] of content) {
    const data = file.data ?? {}
    const slug = String(data.slug ?? "")
    if (data.filePath === undefined || data.unlisted === true) continue
    if (!slug || slug === "404" || slug === "index" || slug.endsWith("/index")) continue
    const date = data.dates?.[dateType] ?? data.dates?.created ?? data.dates?.modified
    posts.push({
      title: String(data.frontmatter?.title ?? slug),
      url: encodeURI(`https://${base}/${slug}`),
      description: String(data.frontmatter?.description ?? data.description ?? "").replace(/]]>/g, "]]&gt;"),
      date: date instanceof Date && !isNaN(date) ? date : undefined,
    })
  }
  posts.sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || a.title.localeCompare(b.title))
  const items = posts
    .slice(0, FEED_LIMIT)
    .map(
      (p) =>
        `    <item>\n      <title>${xml(p.title)}</title>\n      <link>${xml(p.url)}</link>\n      <guid>${xml(p.url)}</guid>\n` +
        `      <description><![CDATA[${p.description}]]></description>\n` +
        (p.date ? `      <pubDate>${p.date.toUTCString()}</pubDate>\n` : "") +
        `    </item>`,
    )
    .join("\n")
  const out = path.join(ctx.argv.output, "index.xml")
  await fs.writeFile(
    out,
    `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n  <channel>\n` +
      `    <title>${xml(cfg.pageTitle ?? "")}</title>\n    <link>https://${base}/</link>\n` +
      `    <description>${xml(cfg.pageTitle ?? "")}의 새 글</description>\n    <language>${xml(cfg.locale ?? "ko-KR")}</language>\n` +
      `    <atom:link href="https://${base}/index.xml" rel="self" type="application/rss+xml"/>\n` +
      (posts[0]?.date ? `    <lastBuildDate>${posts[0].date.toUTCString()}</lastBuildDate>\n` : "") +
      `${items}\n  </channel>\n</rss>\n`,
  )
  return out
}

export const PostSitemap = () => ({
  name: "PostSitemap",
  async emit(ctx, content) {
    return await writeSitemap(ctx, content)
  },
  async partialEmit(ctx, content) {
    return await writeSitemap(ctx, content)
  },
})
