// Quartz 5.1 의 탐색기는 저장된 스크롤 위치가 없으면 현재 글 항목에 scrollIntoView 를 호출하는데,
// 이때 탐색기 목록뿐 아니라 창 전체가 내려가 글 제목이 가려진다.
// 탐색기 스크립트보다 먼저 저장값을 0 으로 채워 두어 그 경로를 타지 않게 한다.
const script = `try{if(sessionStorage.getItem("explorerScrollTop")===null)sessionStorage.setItem("explorerScrollTop","0")}catch(e){}`

export const FirstLoadScrollFix = () => ({
  name: "FirstLoadScrollFix",
  markdownPlugins() {
    return []
  },
  externalResources() {
    return { js: [{ script, loadTime: "beforeDOMReady", contentType: "inline" }] }
  },
})
