import {
  QuartzComponent,
  QuartzComponentConstructor,
  QuartzComponentProps,
} from "../quartz/components/types"

interface Options {
  /** GoatCounter 코드 (https://<code>.goatcounter.com). 비우면 설정의 analytics.websiteId 를 쓴다 */
  code?: string
  /** 직접 운영하는 GoatCounter 를 쓸 때만 바꾼다 */
  host?: string
}

/**
 * 방문자 수 한 줄: "오늘 N · 전체 N". 글 화면에서는 날짜 옆에 그 글의 "조회 N" 도 붙인다.
 * 세는 일은 Quartz 의 analytics(provider: goatcounter)가 하고, 여기서는 GoatCounter 의
 * 공개 집계 주소(/counter/TOTAL.json, /counter/<글 주소>.json)를 읽어 보여 주기만 한다.
 *
 * 알아 둘 점 (GoatCounter 서버 동작):
 * - GoatCounter 설정에서 "Allow adding visitor counts on your website" 를 켜야 읽힌다 (꺼져 있으면 403).
 * - 응답이 최대 4시간 캐시된다. 숫자가 바로바로 오르지 않는다.
 * - 날짜를 UTC 로 센다. "오늘"은 한국 시간 오전 9시에 0으로 돌아간다.
 */
export default ((userOpts?: Options) => {
  const Visitors: QuartzComponent = ({ cfg }: QuartzComponentProps) => {
    const analytics = cfg.analytics
    const fromConfig = analytics?.provider === "goatcounter" ? analytics : undefined
    const code = userOpts?.code ?? fromConfig?.websiteId
    if (!code) return null
    const host = userOpts?.host ?? fromConfig?.host ?? "goatcounter.com"

    return (
      <p class="visitors" data-counter={`https://${code}.${host}/counter/TOTAL.json`}>
        <span>
          오늘 <b data-range="today">–</b>
        </span>
        <span class="visitors-sep" aria-hidden="true">
          ·
        </span>
        <span>
          전체 <b data-range="total">–</b>
        </span>
      </p>
    )
  }

  Visitors.css = `
.visitors { display: flex; gap: 0.5rem; justify-content: flex-end; margin: 2.5rem 0 0; font-size: 0.8rem; color: var(--darkgray); opacity: 0.8; }
.visitors b { font-weight: 600; color: var(--dark); font-variant-numeric: tabular-nums; }
.visitors .visitors-sep { opacity: 0.6; }
.content-meta .post-views b { font-weight: 600; font-variant-numeric: tabular-nums; }
`

  // 페이지를 옮길 때마다 다시 묻지 않도록 10분 동안은 받아 둔 값을 쓴다 (서버도 4시간 캐시한다)
  Visitors.afterDOMLoaded = `
(function () {
  var TTL = 10 * 60 * 1000;
  var cache = {};
  // 받는 중인 요청과 실패한 요청도 함께 기억한다. 광고 차단 등으로 막힌 경우 페이지를 옮길 때마다
  // 같은 요청을 다시 보내지 않게 하려는 것이다.
  function load(url) {
    var hit = cache[url];
    if (hit && Date.now() - hit.at < TTL) return hit.promise;
    var promise = fetch(url)
      .then(function (r) {
        // 아직 한 번도 집계되지 않은 글은 404 와 함께 count "0" 이 온다
        if (!r.ok && r.status !== 404) throw new Error(String(r.status));
        return r.json();
      })
      .then(function (d) { return d.count; });
    cache[url] = { at: Date.now(), promise: promise };
    return promise;
  }
  function fill(target, url) {
    var path = location.pathname;
    load(url)
      .then(function (value) { if (location.pathname === path && target.isConnected) target.textContent = value; })
      .catch(function () { if (target.isConnected) target.textContent = "–"; });
  }
  function setup() {
    var el = document.querySelector(".visitors[data-counter]");
    if (!el) return;
    var base = el.getAttribute("data-counter");
    var today = new Date().toISOString().slice(0, 10); // GoatCounter 는 날짜를 UTC 로 센다
    var ranges = [["total", base], ["today", base + "?start=" + today]];
    ranges.forEach(function (range) {
      var target = el.querySelector('[data-range="' + range[0] + '"]');
      if (target) fill(target, range[1]);
    });

    // 글 화면: 제목 아래 날짜 줄(.content-meta)에 그 글의 조회수를 덧붙인다. 날짜 줄은 글 화면에만 있다.
    var meta = document.querySelector(".page-header .content-meta");
    if (!meta) return;
    var views = meta.querySelector(".post-views");
    if (!views) {
      views = document.createElement("span");
      views.className = "post-views";
      views.appendChild(document.createTextNode("조회 "));
      views.appendChild(document.createElement("b"));
      meta.appendChild(views);
    }
    var num = views.querySelector("b");
    num.textContent = "–";
    // 집계에 기록되는 주소는 location.pathname 그대로다 (analytics 가 그렇게 보낸다)
    fill(num, base.replace(/TOTAL\\.json$/, encodeURIComponent(location.pathname) + ".json"));
  }
  document.addEventListener("nav", setup);
  document.addEventListener("render", setup);
})();
`
  return Visitors
}) satisfies QuartzComponentConstructor<Options | undefined>
