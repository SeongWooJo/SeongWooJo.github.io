import { h, toChildArray, VNode } from "preact"
import { QuartzComponent, QuartzComponentProps } from "../quartz/components/types"

/**
 * 플러그인 컴포넌트의 제목(<h3>) 글자만 바꿔서 돌려준다. 나머지 화면·스크립트·스타일은 그대로다.
 * 제목을 설정으로 바꿀 수 없는 플러그인(그래프 등)에 쓴다. 예: withTitle(graph, "지식 그래프")
 */
export function withTitle(component: QuartzComponent, title: string): QuartzComponent {
  const Titled: QuartzComponent = (props: QuartzComponentProps) => {
    let node = component(props) as VNode<any> | null
    // YAML 의 layout.condition 으로 감싼 컴포넌트는 안쪽 컴포넌트를 한 겹 더 풀어야 실제 화면이 나온다
    while (node && typeof node.type === "function") {
      node = (node.type as (p: unknown) => VNode<any> | null)(node.props)
    }
    if (!node) return null
    if (typeof node.type !== "string") return node // 예상한 모양이 아니면 원래 화면 그대로 둔다
    const { children, ...rest } = node.props
    const next = toChildArray(children).map((child) =>
      typeof child === "object" && child !== null && (child as VNode).type === "h3" ? <h3>{title}</h3> : child,
    )
    return h(node.type as string, rest, ...next)
  }
  Titled.css = component.css
  Titled.beforeDOMLoaded = component.beforeDOMLoaded
  Titled.afterDOMLoaded = component.afterDOMLoaded
  return Titled
}

/** 그래프 플러그인의 컴포넌트인지 (스크립트가 .graph-container 를 다룬다) */
export function isGraph(component: QuartzComponent): boolean {
  return String(component.afterDOMLoaded ?? "").includes("graph-container")
}
