export const manifest = {
  name: "linguistic-notation",
  displayName: "Linguistic Notation",
  description: "Normalizes authoring shorthand for linguistic notation before Quartz parses Markdown.",
  version: "0.1.0",
  quartzVersion: ">=5.0.0",
  category: "transformer",
  defaultOrder: 15,
}

const SMALL_CAPS_MAP = {
  a: "ᴀ",
  b: "ʙ",
  c: "ᴄ",
  d: "ᴅ",
  e: "ᴇ",
  f: "ꜰ",
  g: "ɢ",
  h: "ʜ",
  i: "ɪ",
  j: "ᴊ",
  k: "ᴋ",
  l: "ʟ",
  m: "ᴍ",
  n: "ɴ",
  o: "ᴏ",
  p: "ᴘ",
  q: "ꞯ",
  r: "ʀ",
  s: "ꜱ",
  t: "ᴛ",
  u: "ᴜ",
  v: "ᴠ",
  w: "ᴡ",
  y: "ʏ",
  z: "ᴢ",
}

const SMALL_CAP_MARKER = /\{\{(?:sc|smallcaps):([\s\S]*?)\}\}/gi
const warned = new Set()

function normalizeSmallCaps(text) {
  const unmapped = new Set()
  const converted = Array.from(text).map((char) => {
    const lower = char.toLowerCase()
    if (SMALL_CAPS_MAP[lower]) {
      return SMALL_CAPS_MAP[lower]
    }

    if (/[A-Za-z]/.test(char)) {
      unmapped.add(lower)
    }

    return char
  })

  if (unmapped.size > 0) {
    const key = Array.from(unmapped).sort().join(",")
    if (!warned.has(key)) {
      warned.add(key)
      console.warn(
        `[linguistic-notation] No Unicode small-cap mapping for: ${Array.from(unmapped).sort().join(", ")}. Leaving those letters unchanged.`,
      )
    }
  }

  return converted.join("")
}

function replaceSmallCapsMarkers(src) {
  return src.replace(SMALL_CAP_MARKER, (_match, body) => normalizeSmallCaps(body.trim()))
}

export default function LinguisticNotation() {
  return {
    name: "LinguisticNotation",
    textTransform(_ctx, src) {
      return replaceSmallCapsMarkers(src)
    },
  }
}
