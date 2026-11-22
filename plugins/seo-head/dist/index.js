import { h, Fragment } from "preact"

const ENTITIES = { "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'", "&#x27;": "'", "&amp;": "&" }
const unescapeHtml = (s) => s.replace(/&(?:lt|gt|quot|#39|#x27|amp);/g, (m) => ENTITIES[m])

// 페이지마다 canonical 링크, RSS 피드 알림 링크, JSON-LD(글은 BlogPosting, 홈은 WebSite)를 넣는다.
export const SeoHead = (opts = {}) => ({
  name: "SeoHead",
  // 본문은 건드리지 않는다. Quartz 가 변환기로 인식하려면 이 메서드가 있어야 한다.
  markdownPlugins() {
    return []
  },
  externalResources(ctx) {
    const cfg = ctx.cfg.configuration
    if (!cfg.baseUrl) return {}
    const root = `https://${cfg.baseUrl}`
    // 날짜만 있는 글은 현지 자정으로 읽히므로, UTC 로 바꾸지 않고 현지 날짜 그대로 적는다
    const pad = (n) => String(n).padStart(2, "0")
    const iso = (d) =>
      d instanceof Date && !isNaN(d) ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : undefined
    return {
      additionalHead: [
        (page) => {
          const slug = page.slug ?? ""
          if (slug === "404") return null
          const path = slug === "index" ? "" : slug.endsWith("/index") ? slug.slice(0, -5) : slug
          const url = encodeURI(`${root}/${path}`)
          const out = [h("link", { rel: "canonical", href: url })]
          // 구독 앱이 블로그 주소만으로 피드를 찾을 수 있게 알린다 (피드는 post-sitemap 플러그인이 만든다)
          if (opts.rss !== false)
            out.push(h("link", { rel: "alternate", type: "application/rss+xml", title: cfg.pageTitle, href: `${root}/index.xml` }))
          if (opts.googleSiteVerification)
            out.push(h("meta", { name: "google-site-verification", content: opts.googleSiteVerification }))
          if (opts.naverSiteVerification)
            out.push(h("meta", { name: "naver-site-verification", content: opts.naverSiteVerification }))
          // 태그 목록 페이지는 색인에서 빼고 링크만 따라가게 한다
          if (opts.noindexTagPages !== false && (slug === "tags/index" || slug.startsWith("tags/")))
            out.push(h("meta", { name: "robots", content: "noindex, follow" }))
          const isPost = page.filePath !== undefined && slug !== "index" && !slug.endsWith("/index")
          let ld
          if (isPost) {
            ld = {
              "@context": "https://schema.org",
              "@type": "BlogPosting",
              headline: page.frontmatter?.title,
              description: page.frontmatter?.description ?? page.description,
              url,
              mainEntityOfPage: { "@type": "WebPage", "@id": url },
              datePublished: iso(page.dates?.created),
              dateModified: iso(page.dates?.modified),
              inLanguage: cfg.locale,
              keywords: (page.frontmatter?.tags ?? []).join(", ") || undefined,
              author: opts.author ? { "@type": "Person", name: opts.author } : undefined,
              publisher: { "@type": "Organization", name: cfg.pageTitle },
            }
          } else if (slug === "index") {
            ld = { "@context": "https://schema.org", "@type": "WebSite", name: cfg.pageTitle, url, inLanguage: cfg.locale }
          }
          if (ld) {
            // 자동으로 뽑힌 설명은 &gt; 같은 HTML 표기로 들어오므로 원래 글자로 되돌린다
            if (typeof ld.description === "string") ld.description = unescapeHtml(ld.description)
            // 제목·설명에 "</script>" 가 있어도 스크립트가 끊기지 않게 "<" 를 \u003c 로 적는다
            const json = JSON.stringify(ld).replace(/</g, "\\u003c")
            out.push(h("script", { type: "application/ld+json", dangerouslySetInnerHTML: { __html: json } }))
          }
          return h(Fragment, null, out)
        },
      ],
    }
  },
})
