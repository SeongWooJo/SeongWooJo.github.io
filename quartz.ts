import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader"
import { registerCondition } from "./quartz/plugins/loader/conditions"
import PostList from "./custom/PostList"
import Career from "./custom/Career"
import Visitors from "./custom/Visitors"
import SocialLinks from "./custom/SocialLinks"
import Share from "./custom/Share"
import PrevNext from "./custom/PrevNext"
import ImageZoom from "./custom/ImageZoom"
import { withTitle, isGraph } from "./custom/withTitle"

// 홈에서만 보이는 컴포넌트용 조건. YAML 의 layout.condition: index-only 로 쓴다.
// loadQuartzConfig() 가 안에서 레이아웃을 만들기 때문에 그보다 먼저 등록해야 한다.
registerCondition("index-only", (props) => props.fileData.slug === "index")

const config = await loadQuartzConfig()
export default config

// 홈과 폴더(분류) 페이지 아래에 글 목록을 5개씩 나눠 보여 준다.
// 주의: 여기서 afterBody 를 지정하면 YAML 에서 afterBody 로 배치한 플러그인(댓글)은 이 목록으로 대체된다.
//       그래서 글 화면(content)에는 YAML 쪽 afterBody(yamlLayout.defaults.afterBody)를 뒤에 이어 붙인다.
const postList = PostList({ pageSize: 5 })
// 타임라인(git 그래프 모양)은 홈에서만 나온다. 오른쪽 칸에 YAML 로 배치된 것(그래프·목차·백링크) 뒤에 덧붙인다.
// 내용은 content/index.md 프론트매터의 career: 목록에서 읽는다.
const yamlLayout = await loadQuartzLayout()
// 방문자 수("오늘 · 전체") 한 줄. 본문 칸 맨 아래, 바닥글 바로 위에 둔다.
// 어느 계정의 숫자를 읽을지는 quartz.config.yaml 의 analytics(provider: goatcounter)에서 가져온다.
const visitors = Visitors()
// 오른쪽 칸 그래프 상자의 제목
const GRAPH_TITLE = "지식 그래프"
export const layout = await loadQuartzLayout({
  defaults: {
    right: [
      // 그래프 상자의 제목은 플러그인에 바꾸는 설정이 없어서 여기서 바꿔 끼운다 (기본값 "그래프 뷰")
      ...(yamlLayout.defaults.right ?? []).map((c) => (isGraph(c) ? withTitle(c, GRAPH_TITLE) : c)),
      Career(),
    ],
  },
  byPageType: {
    // 본문 아래 순서 — 홈: 연락처 링크 → 최근 글 / 글: 공유 단추 → 이전·다음 글 → 댓글(YAML) → 방문자 수.
    // SocialLinks 와 postList 는 홈에서만, Share 와 PrevNext 는 글에서만 스스로 나온다. ImageZoom 은 그리는 것 없이 스크립트만 싣는다.
    content: {
      afterBody: [
        SocialLinks(),
        postList,
        Share(),
        PrevNext(),
        ...(yamlLayout.defaults.afterBody ?? []),
        visitors,
        ImageZoom(),
      ],
    },
    folder: { afterBody: [postList, visitors] },
    tag: { afterBody: [visitors] },
  },
})
