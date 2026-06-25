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

const SUPERSCRIPT_MAP = {
  0: "⁰",
  1: "¹",
  2: "²",
  3: "³",
  4: "⁴",
  5: "⁵",
  6: "⁶",
  7: "⁷",
  8: "⁸",
  9: "⁹",
  a: "ᵃ",
  b: "ᵇ",
  c: "ᶜ",
  d: "ᵈ",
  e: "ᵉ",
  f: "ᶠ",
  g: "ᵍ",
  h: "ʰ",
  i: "ⁱ",
  j: "ʲ",
  k: "ᵏ",
  l: "ˡ",
  m: "ᵐ",
  n: "ⁿ",
  o: "ᵒ",
  p: "ᵖ",
  r: "ʳ",
  s: "ˢ",
  t: "ᵗ",
  u: "ᵘ",
  v: "ᵛ",
  w: "ʷ",
  x: "ˣ",
  y: "ʸ",
  z: "ᶻ",
  "+": "⁺",
  "-": "⁻",
  "=": "⁼",
  "(": "⁽",
  ")": "⁾",
}

const SUBSCRIPT_MAP = {
  0: "₀",
  1: "₁",
  2: "₂",
  3: "₃",
  4: "₄",
  5: "₅",
  6: "₆",
  7: "₇",
  8: "₈",
  9: "₉",
  a: "ₐ",
  e: "ₑ",
  h: "ₕ",
  i: "ᵢ",
  j: "ⱼ",
  k: "ₖ",
  l: "ₗ",
  m: "ₘ",
  n: "ₙ",
  o: "ₒ",
  p: "ₚ",
  r: "ᵣ",
  s: "ₛ",
  t: "ₜ",
  u: "ᵤ",
  v: "ᵥ",
  x: "ₓ",
  "+": "₊",
  "-": "₋",
  "=": "₌",
  "(": "₍",
  ")": "₎",
}

const SMALL_CAP_MARKER = /\{\{(?:sc|smallcaps):([\s\S]*?)\}\}/gi
const SUPERSCRIPT_MARKER = /\{\{(?:sup|super):([\s\S]*?)\}\}/gi
const SUBSCRIPT_MARKER = /\{\{(?:sub|subscript):([\s\S]*?)\}\}/gi
const warned = new Set()

function normalizeWithMap(kind, text, map, lowercaseLetters = true) {
  const unmapped = new Set()
  const converted = Array.from(text).map((char) => {
    const key = lowercaseLetters ? char.toLowerCase() : char
    if (map[key]) {
      return map[key]
    }

    if (/[A-Za-z0-9]/.test(char)) {
      unmapped.add(char)
    }

    return char
  })

  if (unmapped.size > 0) {
    const warnKey = `${kind}:${Array.from(unmapped).sort().join(",")}`
    if (!warned.has(warnKey)) {
      warned.add(warnKey)
      console.warn(
        `[linguistic-notation] No Unicode ${kind} mapping for: ${Array.from(unmapped).sort().join(", ")}. Leaving those characters unchanged.`,
      )
    }
  }

  return converted.join("")
}

function replaceMarkers(src, marker, kind, map, lowercaseLetters = true) {
  return src.replace(marker, (_match, body) =>
    normalizeWithMap(kind, body.trim(), map, lowercaseLetters),
  )
}

export default function LinguisticNotation() {
  return {
    name: "LinguisticNotation",
    textTransform(_ctx, src) {
      let out = src
      out = replaceMarkers(out, SMALL_CAP_MARKER, "small-cap", SMALL_CAPS_MAP)
      out = replaceMarkers(out, SUPERSCRIPT_MARKER, "superscript", SUPERSCRIPT_MAP)
      out = replaceMarkers(out, SUBSCRIPT_MARKER, "subscript", SUBSCRIPT_MAP)
      return out
    },
  }
}
