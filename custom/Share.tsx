import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../quartz/components/types"
import { Icon } from "./icons"

/**
 * 글 아래의 공유 단추 줄: 링크 복사 · X · Facebook · LinkedIn.
 * 휴대폰처럼 기기의 공유 창을 쓸 수 있는 곳에서는 맨 앞에 "공유하기" 단추가 하나 더 나온다(카카오톡 등은 거기서 고른다).
 * 주소는 지금 보고 있는 페이지 주소를 쓴다(#위치와 ?뒤는 뺀다).
 */
export default (() => {
  const Share: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
    const slug = fileData.slug ?? ""
    if (fileData.filePath === undefined || slug === "index" || slug.endsWith("/index")) return null

    return (
      <div class="post-share">
        <span class="post-share-label">공유</span>
        <button type="button" class="post-share-btn" data-share="native" aria-label="공유하기" title="공유하기" hidden>
          <Icon name="share" />
        </button>
        <button type="button" class="post-share-btn" data-share="copy" aria-label="링크 복사" title="링크 복사">
          <Icon name="link" />
        </button>
        <a class="post-share-btn" data-share="x" target="_blank" rel="noopener noreferrer" aria-label="X에 공유" title="X에 공유">
          <Icon name="x" />
        </a>
        <a class="post-share-btn" data-share="facebook" target="_blank" rel="noopener noreferrer" aria-label="Facebook에 공유" title="Facebook에 공유">
          <Icon name="facebook" />
        </a>
        <a class="post-share-btn" data-share="linkedin" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn에 공유" title="LinkedIn에 공유">
          <Icon name="linkedin" />
        </a>
        <span class="post-share-status" role="status" aria-live="polite"></span>
      </div>
    )
  }

  Share.css = `
.post-share { display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem; margin: 2.5rem 0 0; }
.post-share .post-share-label { font-size: 0.85rem; color: var(--darkgray); margin-right: 0.3rem; }
.post-share .post-share-btn { display: inline-flex; align-items: center; justify-content: center; width: 2.1rem; height: 2.1rem; padding: 0; border: 1px solid var(--lightgray); border-radius: 50%; background: transparent; color: var(--darkgray); font-size: 0.95rem; cursor: pointer; text-decoration: none; transition: color 0.15s ease, border-color 0.15s ease; }
.post-share .post-share-btn[hidden] { display: none; }
.post-share .post-share-btn:hover, .post-share .post-share-btn:focus-visible { color: var(--secondary); border-color: var(--secondary); }
.post-share .post-share-status { font-size: 0.8rem; color: var(--darkgray); margin-left: 0.3rem; }
`

  Share.afterDOMLoaded = `
(function () {
  function pageUrl() { return location.origin + location.pathname; }
  function setup() {
    var box = document.querySelector(".post-share");
    if (!box) return;
    var url = encodeURIComponent(pageUrl());
    var title = encodeURIComponent(document.title);
    var targets = {
      x: "https://twitter.com/intent/tweet?url=" + url + "&text=" + title,
      facebook: "https://www.facebook.com/sharer/sharer.php?u=" + url,
      linkedin: "https://www.linkedin.com/sharing/share-offsite/?url=" + url
    };
    Object.keys(targets).forEach(function (key) {
      var a = box.querySelector('[data-share="' + key + '"]');
      if (a) a.setAttribute("href", targets[key]);
    });
    var native = box.querySelector('[data-share="native"]');
    if (native) native.hidden = typeof navigator.share !== "function";
  }
  function say(box, text) {
    var status = box.querySelector(".post-share-status");
    if (!status) return;
    status.textContent = text;
    clearTimeout(status._t);
    status._t = setTimeout(function () { status.textContent = ""; }, 2500);
  }
  function copyFallback(text) {
    var ta = document.createElement("textarea");
    ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) {}
    ta.remove();
    return ok;
  }
  // 단추는 페이지를 옮길 때마다 새로 그려지므로, 누르는 일은 문서 전체에서 한 번만 받아 처리한다
  document.addEventListener("click", function (e) {
    var btn = e.target && e.target.closest ? e.target.closest(".post-share [data-share]") : null;
    if (!btn) return;
    var box = btn.closest(".post-share");
    var kind = btn.getAttribute("data-share");
    if (kind === "copy") {
      var url = pageUrl();
      var done = function (ok) { say(box, ok ? "링크를 복사했습니다" : "복사하지 못했습니다. 주소창의 주소를 복사해 주세요"); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function () { done(true); }, function () { done(copyFallback(url)); });
      } else {
        done(copyFallback(url));
      }
    } else if (kind === "native" && typeof navigator.share === "function") {
      navigator.share({ title: document.title, url: pageUrl() }).catch(function () {});
    }
  });
  document.addEventListener("nav", setup);
  document.addEventListener("render", setup);
})();
`
  return Share
}) satisfies QuartzComponentConstructor
