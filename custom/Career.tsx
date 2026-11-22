import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../quartz/components/types"

interface Options {
  /** 경력 목록을 적는 프론트매터 키 (홈 index.md) */
  key: string
  /** 상자 제목 */
  title: string
  /** 1년에 해당하는 세로 길이(px). 오래 다닌 곳일수록 줄이 길어진다 */
  yearHeight: number
  /** 목록이 이보다 길어지면 상자 안에서 스크롤된다 (CSS 길이) */
  maxHeight: string
}

interface Item {
  start: string
  end: string
  title: string
  /** 기간(년). 달 단위로 센다 */
  years: number
  /** 0 = 본줄기, 1 = 옆 가지 */
  lane: 0 | 1
}

/** 글자 두 줄(이름·기간)이 들어가는 최소 높이(px). 이보다 짧은 기간은 이 높이로 그린다 */
const MIN_ROW = 46

/** "2016.03" → 달 번호. 달이 없으면(예: "2000") 시작은 1월, 끝은 12월로 본다 */
function monthIndex(s: string, fallbackMonth: number): number {
  const [y, m] = s.split(".").map(Number)
  return y * 12 + ((m || fallbackMonth) - 1)
}

/** "2016.03-2018.02 진산과학고등학교" 같은 줄을 기간과 이름으로 나눈다. 끝을 비우면 "현재". */
function parse(value: unknown): Item[] {
  if (!Array.isArray(value)) return []
  const items: Item[] = []
  for (const raw of value) {
    const m = String(raw).match(
      /^\s*(\d{4}(?:\.\d{1,2})?)\s*[-~–]\s*(\d{4}(?:\.\d{1,2})?|현재)?\s+(.+?)\s*$/,
    )
    if (!m) {
      // 형식이 맞지 않는 줄은 화면에 나오지 않는다. 조용히 사라지지 않게 빌드할 때 알린다.
      console.warn(`[타임라인] 읽지 못한 줄: "${String(raw)}" — "2024.09-2026.01 이름" 형식으로 적어 주세요`)
      continue
    }
    const end = m[2] ?? "현재"
    const now = new Date()
    const endMonth = end === "현재" ? now.getFullYear() * 12 + now.getMonth() : monthIndex(end, 12)
    const years = Math.max(0, endMonth - monthIndex(m[1], 1) + 1) / 12
    items.push({ start: m[1], end, title: m[3], years, lane: 0 })
  }
  items.sort((a, b) => a.start.localeCompare(b.start, undefined, { numeric: true }))
  // 같은 곳을 떠났다가 돌아온 경우(A → X → A)의 X 는 git 의 옆 가지처럼 그린다. 예: 대학 → 군대 → 대학
  // 옆 가지는 연달아 두지 않는다 (A → B → A → B 에서 B 하나만). 그림이 옆 가지 위아래가 본줄기라고 가정한다.
  for (let i = 1; i < items.length - 1; i++) {
    if (
      items[i - 1].lane === 0 &&
      items[i - 1].title === items[i + 1].title &&
      items[i].title !== items[i - 1].title
    ) {
      items[i].lane = 1
    }
  }
  return items.reverse() // 화면은 git log 처럼 최신이 위
}

/**
 * 홈 오른쪽 칸에 지나온 일정을 git 그래프 모양으로 보여 준다. 홈(index.md)에서만 나온다.
 * 내용은 홈의 프론트매터 `career:` 목록에서 읽는다.
 * 점 아래로 다음 점까지 이어지는 줄의 길이가 그 항목의 기간이다 (1년 = yearHeight px).
 * 점은 그 항목이 끝난 때, 줄의 아래 끝은 시작한 때다.
 * 옆 가지(예: 군대)는 자기 줄 높이만큼만 그린다: 아래에서 갈라져 나와 점(끝난 때)에서 멈추고,
 * 그 자리에서 바로 본줄기로 합쳐진다. 그 위 항목의 기간 동안 옆 줄이 이어져 보이지 않게 하려는 것이다.
 */
export default ((userOpts?: Partial<Options>) => {
  const key = userOpts?.key ?? "career"
  const title = userOpts?.title ?? "타임라인"
  const yearHeight = userOpts?.yearHeight ?? 30
  const maxHeight = userOpts?.maxHeight ?? "22rem"

  const Career: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    if (fileData.slug !== "index") return null
    const rows = parse((fileData.frontmatter as Record<string, unknown> | undefined)?.[key])
    if (rows.length === 0) return null

    return (
      <div class="career">
        <h3>{title}</h3>
        {/* tabindex: 키보드만으로도 상자 안을 스크롤할 수 있게 한다 */}
        <ol class="career-log" style={`max-height: ${maxHeight}`} tabIndex={0} aria-label={title}>
          {rows.map((row, i) => {
            const side = row.lane === 1
            const first = i === 0
            const last = i === rows.length - 1
            const forksAbove = !side && rows[i - 1]?.lane === 1 // 바로 위가 옆 가지 → 여기서 갈라진다
            return (
              <li
                class="career-row"
                style={`min-height: ${Math.max(MIN_ROW, Math.round(row.years * yearHeight))}px`}
              >
                <span class="career-rail" aria-hidden="true">
                  {side ? (
                    <>
                      <i class="v full" />
                      {/* 옆 줄은 점에서 아래로만. 점 위쪽은 본줄기로 돌아가는 곡선이다 */}
                      <i class="v l1 down" />
                      <svg viewBox="0 0 36 32">
                        <path d="M25 14 C 25 5, 7 9, 7 0" />
                      </svg>
                    </>
                  ) : (
                    <>
                      {!first && <i class="v up" />}
                      <i class="v down" />
                      {last && <i class="cap" />}
                    </>
                  )}
                  {forksAbove && (
                    <svg viewBox="0 0 36 32">
                      <path d="M25 0 C 25 9, 7 5, 7 14" />
                    </svg>
                  )}
                  <i class={side ? "dot l1" : "dot"} />
                </span>
                <span class="career-text">
                  <span class="career-title">{row.title}</span>
                  <span class="career-period">
                    {row.start} – {row.end}
                  </span>
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  // 본줄기 x=7px, 옆 가지 x=25px, 점의 세로 중심은 줄 위에서 14px (제목 첫 줄의 가운데)
  Career.css = `
.career > h3 { font-size: 1rem; margin: 0 0 0.6rem; }
.career ol.career-log { list-style: none; margin: 0; padding: 2px 0 2px 2px; overflow-y: auto; }
/* 스크롤바는 늘 보이게 한다 (macOS 는 기본 스크롤바를 스크롤할 때만 보여 준다) */
.career ol.career-log::-webkit-scrollbar { width: 6px; }
.career ol.career-log::-webkit-scrollbar-thumb { background: var(--gray); border-radius: 3px; }
.career ol.career-log::-webkit-scrollbar-thumb:hover { background: var(--darkgray); }
@supports not selector(::-webkit-scrollbar) { .career ol.career-log { scrollbar-width: thin; scrollbar-color: var(--gray) transparent; } }
.career li.career-row { display: grid; grid-template-columns: 40px minmax(0, 1fr); margin: 0; padding: 0; }
.career .career-rail { position: relative; }
.career .career-rail i { position: absolute; display: block; }
.career .career-rail .v { left: 6px; width: 2px; background: var(--secondary); }
.career .career-rail .v.l1 { left: 24px; background: var(--tertiary); }
.career .career-rail .v.up { top: 0; height: 14px; }
.career .career-rail .v.down { top: 14px; bottom: 0; }
.career .career-rail .v.full { top: 0; bottom: 0; }
.career .career-rail .cap { left: 2px; bottom: 0; width: 10px; height: 2px; background: var(--secondary); }
.career .career-rail .dot { left: 2px; top: 9px; width: 10px; height: 10px; border-radius: 50%; background: var(--secondary); box-shadow: 0 0 0 2px var(--light); }
.career .career-rail .dot.l1 { left: 20px; background: var(--tertiary); }
.career .career-rail svg { position: absolute; left: 0; top: 0; width: 36px; height: 32px; overflow: visible; }
.career .career-rail svg path { fill: none; stroke: var(--tertiary); stroke-width: 2; }
/* 긴 줄을 스크롤하는 동안 그 항목의 이름이 위에 붙어 따라온다 */
.career .career-text { display: flex; flex-direction: column; padding: 4px 0.25rem 4px 0; min-width: 0; position: sticky; top: 0; align-self: start; }
.career .career-title { font-size: 0.9rem; line-height: 20px; font-weight: 600; color: var(--dark); }
.career .career-period { font-family: var(--codeFont); font-size: 0.75rem; line-height: 1.5; color: var(--darkgray); opacity: 0.8; }
`
  return Career
}) satisfies QuartzComponentConstructor<Partial<Options> | undefined>
