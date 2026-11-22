import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../quartz/components/types"
import { Icon, hasIcon } from "./icons"

interface Options {
  /** 링크 목록을 적는 프론트매터 키 (홈 index.md) */
  key: string
}

interface Link {
  name: string
  href: string
}

/** "GitHub https://github.com/아이디" 같은 줄을 이름과 주소로 나눈다. 주소는 맨 뒤 한 덩어리. */
function parse(value: unknown): Link[] {
  if (!Array.isArray(value)) return []
  const links: Link[] = []
  for (const raw of value) {
    const m = String(raw).match(/^\s*(.+?)\s+(\S+)\s*$/)
    if (m && /^(https?:\/\/|mailto:)/i.test(m[2])) links.push({ name: m[1], href: m[2] })
  }
  return links
}

/**
 * 홈의 소개 글 아래에 연락처 링크(GitHub · LinkedIn · Email)를 아이콘과 함께 보여 준다. 홈에서만 나온다.
 * 내용은 홈 프론트매터의 `links:` 목록에서 읽는다. 이름이 github / linkedin / email 이면 아이콘이 붙는다.
 * (바닥글의 같은 링크는 quartz.config.yaml 의 footer 플러그인 options.links 에 따로 적는다)
 */
export default ((userOpts?: Partial<Options>) => {
  const key = userOpts?.key ?? "links"

  const SocialLinks: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    if (fileData.slug !== "index") return null
    const links = parse((fileData.frontmatter as Record<string, unknown> | undefined)?.[key])
    if (links.length === 0) return null

    return (
      <ul class="social-links" aria-label="연락처">
        {links.map((link) => {
          const icon = link.name.toLowerCase()
          const external = !link.href.toLowerCase().startsWith("mailto:")
          return (
            <li>
              <a
                href={link.href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer me" : undefined}
              >
                {hasIcon(icon) && <Icon name={icon} />}
                <span>{link.name}</span>
              </a>
            </li>
          )
        })}
      </ul>
    )
  }

  SocialLinks.css = `
.social-links { list-style: none; display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.25rem 0 2rem; padding: 0; }
.social-links li { margin: 0; }
.social-links a { display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.35rem 0.8rem; border: 1px solid var(--lightgray); border-radius: 999px; font-size: 0.9rem; font-weight: 600; line-height: 1.4; color: var(--darkgray); background: transparent; text-decoration: none; transition: color 0.15s ease, border-color 0.15s ease; }
.social-links a:hover, .social-links a:focus-visible { color: var(--secondary); border-color: var(--secondary); }
.social-links .ui-icon { font-size: 1.05rem; flex: none; }
`
  return SocialLinks
}) satisfies QuartzComponentConstructor<Partial<Options> | undefined>
