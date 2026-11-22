import path from "node:path"
import fs from "node:fs"

// 이 플러그인이 하는 일 두 가지
// 1) 프론트매터에 `thumbnail: 파일이름.webp` (또는 "[[파일이름.webp]]", https 주소) 가 있으면
//    본문 맨 위에 그 이미지를 넣는다. 본문에 들어가므로 Quartz 가 "글이 쓰는 이미지"로 인식해 함께 내보낸다.
// 2) 본문의 모든 그림에 실제 가로·세로 크기를 적어 넣는다. 크기를 모르면 그림이 뜨는 순간
//    아래 글이 밀려 내려간다(화면 밀림). 맨 위 그림은 먼저, 나머지는 화면에 가까워질 때 받게 한다.

/** 그림 파일 앞부분만 읽어 [가로, 세로] 를 알아낸다. 모르는 형식이면 undefined. */
function readImageSize(file) {
  let buf
  try {
    const fd = fs.openSync(file, "r")
    try {
      buf = Buffer.alloc(256 * 1024)
      buf = buf.subarray(0, fs.readSync(fd, buf, 0, buf.length, 0))
    } finally {
      fs.closeSync(fd)
    }
  } catch {
    return undefined
  }
  if (buf.length < 30) return undefined
  // PNG
  if (buf.readUInt32BE(0) === 0x89504e47) return [buf.readUInt32BE(16), buf.readUInt32BE(20)]
  // GIF
  if (buf.toString("latin1", 0, 3) === "GIF") return [buf.readUInt16LE(6), buf.readUInt16LE(8)]
  // WebP
  if (buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP") {
    const kind = buf.toString("latin1", 12, 16)
    if (kind === "VP8X") return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)]
    if (kind === "VP8L") {
      const b = buf.readUInt32LE(21)
      return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)]
    }
    if (kind === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff]
    return undefined
  }
  // JPEG: 크기는 SOF 구간에 있다
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return undefined
      const marker = buf[i + 1]
      if (marker === 0xff) { i++; continue } // 채움 바이트
      const isSOF = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc
      if (isSOF) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]
      i += 2 + buf.readUInt16BE(i + 2)
    }
    return undefined
  }
  return undefined
}

/** 파일 이름 비교용: Quartz 가 주소를 만들 때처럼 소문자·공백은 하이픈으로 맞춘다 */
const norm = (name) => {
  let s = String(name)
  try { s = decodeURIComponent(s) } catch {}
  // 한글 파일 이름은 기기에 따라 자모가 풀린 형태(NFD)로 저장되기도 해서 NFC 로 맞춘다
  return s.normalize("NFC").split(/[?#]/)[0].split("/").pop().toLowerCase().replace(/\s+/g, "-")
}

function walk(node, fn) {
  if (node.type === "element") fn(node)
  for (const child of node.children ?? []) walk(child, fn)
}

export const CoverImage = (opts = {}) => {
  const key = opts.key ?? "thumbnail"
  const alt = opts.alt ?? "대표 이미지"
  const keyLine = new RegExp("^" + key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ":[ \\t]*(.+?)[ \\t]*$", "m")
  const sizes = new Map() // 파일 경로 → [가로, 세로] | undefined (한 번 읽은 그림은 다시 읽지 않는다)
  return {
    name: "CoverImage",
    textTransform(_ctx, src) {
      const text = String(src)
      const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?/)
      if (!fm) return src
      const line = fm[1].match(keyLine)
      if (!line) return src
      let value = line[1].replace(/^["']|["']$/g, "").trim()
      value = value.replace(/^\[\[/, "").replace(/\]\]$/, "").split("|")[0].trim()
      if (!value) return src
      const image = /^https?:\/\//i.test(value) ? `![${alt}](${value})` : `![[${value.split("/").pop()}|${alt}]]`
      return text.slice(0, fm[0].length) + "\n" + image + "\n\n" + text.slice(fm[0].length)
    },
    htmlPlugins(ctx) {
      if (opts.imageSize === false) return []
      const byName = new Map()
      for (const fp of ctx.allFiles ?? []) {
        if (!/\.(png|jpe?g|gif|webp)$/i.test(fp)) continue
        const k = norm(fp)
        // 같은 이름의 그림이 두 폴더에 있으면 어느 쪽인지 알 수 없으므로 크기를 적지 않는다
        byName.set(k, byName.has(k) ? null : fp)
      }
      const sizeOf = (src) => {
        if (typeof src !== "string" || /^(https?:)?\/\//i.test(src) || src.startsWith("data:")) return undefined
        const fp = byName.get(norm(src))
        if (!fp) return undefined
        const full = path.join(ctx.argv.directory, fp)
        if (!sizes.has(full)) sizes.set(full, readImageSize(full))
        return sizes.get(full)
      }
      const num = (v) => (/^\d+$/.test(String(v ?? "")) ? Number(v) : undefined)
      return [
        () => (tree) => {
          let index = 0
          walk(tree, (el) => {
            if (el.tagName !== "img") return
            const p = (el.properties ??= {})
            const first = index++ === 0
            // 맨 위 그림은 화면에 바로 보이므로 미루지 않고(대표 이미지는 먼저) 받고,
            // 나머지는 스크롤해서 가까워질 때 받는다
            if (first && p.alt === alt) p.fetchPriority ??= "high"
            if (!first) p.loading ??= "lazy"
            p.decoding ??= "async"
            const size = sizeOf(p.src)
            if (!size || !size[0] || !size[1]) return
            const [w, h] = size
            const askedW = num(p.width) // ![[그림.png|300]] 처럼 가로를 정해 준 경우
            const askedH = num(p.height)
            if (askedW && askedH) return // 가로·세로를 둘 다 정해 줬으면 그대로 둔다
            if (askedW) { p.width = askedW; p.height = Math.round((askedW * h) / w) }
            else if (askedH) { p.height = askedH; p.width = Math.round((askedH * w) / h) }
            else { p.width = w; p.height = h }
            p.dataSized = "" // custom.scss 가 이 표시가 있는 그림만 비율대로 줄인다
          })
        },
      ]
    },
  }
}
