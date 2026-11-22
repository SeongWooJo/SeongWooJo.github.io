import { QuartzComponent, QuartzComponentConstructor } from "../quartz/components/types"

/**
 * 본문 그림을 누르면 화면 가득 크게 보여 준다. 다시 누르거나 Esc, 닫기 단추로 닫는다.
 * 화면에 그리는 것은 없고 스크립트와 스타일만 싣는다.
 * - 링크가 걸린 그림은 링크가 그대로 동작한다.
 * - 링크에 마우스를 올렸을 때 뜨는 미리보기 안의 그림은 건드리지 않는다.
 */
export default (() => {
  const ImageZoom: QuartzComponent = () => null

  ImageZoom.css = `
article img { cursor: zoom-in; }
article img[role="button"]:focus-visible { outline: 2px solid var(--secondary); outline-offset: 2px; }
article a img, .popover article img { cursor: inherit; }
html.img-zoom-open { overflow: hidden; }
.img-zoom { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 2vmin; background: rgba(0, 0, 0, 0.85); cursor: zoom-out; }
.img-zoom img { max-width: 96vw; max-height: 94vh; width: auto; height: auto; object-fit: contain; margin: 0; border-radius: 4px; background: var(--light); box-shadow: 0 8px 40px rgba(0, 0, 0, 0.5); cursor: zoom-out; }
.img-zoom .img-zoom-close { position: fixed; top: 0.75rem; right: 0.9rem; width: 2.5rem; height: 2.5rem; border: 0; border-radius: 50%; background: rgba(255, 255, 255, 0.16); color: #fff; font-size: 1.6rem; line-height: 1; cursor: pointer; }
.img-zoom .img-zoom-close:hover, .img-zoom .img-zoom-close:focus-visible { background: rgba(255, 255, 255, 0.32); }
`

  ImageZoom.afterDOMLoaded = `
(function () {
  var overlay = null;
  var lastFocus = null;
  function close() {
    if (!overlay) return;
    overlay.remove();
    overlay = null;
    document.documentElement.classList.remove("img-zoom-open");
    if (lastFocus && lastFocus.focus && lastFocus.isConnected) lastFocus.focus();
  }
  function open(img) {
    close();
    lastFocus = document.activeElement;
    overlay = document.createElement("div");
    overlay.className = "img-zoom";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "이미지 크게 보기");
    var big = document.createElement("img");
    big.src = img.currentSrc || img.src;
    big.alt = img.alt || "";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "img-zoom-close";
    btn.setAttribute("aria-label", "닫기");
    btn.textContent = "\\u00d7";
    overlay.appendChild(big);
    overlay.appendChild(btn);
    overlay.addEventListener("click", close);
    document.body.appendChild(overlay);
    document.documentElement.classList.add("img-zoom-open");
    btn.focus();
  }
  function zoomable(t) {
    return !!t && t.tagName === "IMG" && !!t.closest && !!t.closest("article") && !t.closest("a") && !t.closest(".popover") && !t.closest(".img-zoom");
  }
  document.addEventListener("click", function (e) {
    if (!zoomable(e.target)) return;
    e.preventDefault();
    open(e.target);
  });
  document.addEventListener("keydown", function (e) {
    if (!overlay) {
      // 그림에 키보드 위치가 있을 때 Enter 나 스페이스로 연다
      if ((e.key === "Enter" || e.key === " ") && zoomable(e.target)) { e.preventDefault(); open(e.target); }
      return;
    }
    if (e.key === "Escape") close();
    else if (e.key === "Tab") { e.preventDefault(); overlay.querySelector(".img-zoom-close").focus(); } // 열려 있는 동안은 닫기 단추에 머문다
  });
  document.addEventListener("nav", function () {
    close();
    // 키보드(Tab)로도 그림에 닿을 수 있게 한다
    var imgs = document.querySelectorAll("article img");
    for (var i = 0; i < imgs.length; i++) {
      if (!zoomable(imgs[i])) continue;
      imgs[i].setAttribute("tabindex", "0");
      imgs[i].setAttribute("role", "button");
      imgs[i].setAttribute("aria-haspopup", "dialog");
    }
  });
})();
`
  return ImageZoom
}) satisfies QuartzComponentConstructor
