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
  a: "\u1d00",
  b: "\u0299",
  c: "\u1d04",
  d: "\u1d05",
  e: "\u1d07",
  f: "\ua730",
  g: "\u0262",
  h: "\u029c",
  i: "\u026a",
  j: "\u1d0a",
  k: "\u1d0b",
  l: "\u029f",
  m: "\u1d0d",
  n: "\u0274",
  o: "\u1d0f",
  p: "\u1d18",
  q: "\ua7af",
  r: "\u0280",
  s: "\ua731",
  t: "\u1d1b",
  u: "\u1d1c",
  v: "\u1d20",
  w: "\u1d21",
  y: "\u028f",
  z: "\u1d22",
}

const SUPERSCRIPT_MAP = {
  0: "\u2070",
  1: "\u00b9",
  2: "\u00b2",
  3: "\u00b3",
  4: "\u2074",
  5: "\u2075",
  6: "\u2076",
  7: "\u2077",
  8: "\u2078",
  9: "\u2079",
  a: "\u1d43",
  b: "\u1d47",
  c: "\u1d9c",
  d: "\u1d48",
  e: "\u1d49",
  f: "\u1da0",
  g: "\u1d4d",
  h: "\u02b0",
  i: "\u2071",
  j: "\u02b2",
  k: "\u1d4f",
  l: "\u02e1",
  m: "\u1d50",
  n: "\u207f",
  o: "\u1d52",
  p: "\u1d56",
  r: "\u02b3",
  s: "\u02e2",
  t: "\u1d57",
  u: "\u1d58",
  v: "\u1d5b",
  w: "\u02b7",
  x: "\u02e3",
  y: "\u02b8",
  z: "\u1dbb",
  "+": "\u207a",
  "-": "\u207b",
  "=": "\u207c",
  "(": "\u207d",
  ")": "\u207e",
}

const SUBSCRIPT_MAP = {
  0: "\u2080",
  1: "\u2081",
  2: "\u2082",
  3: "\u2083",
  4: "\u2084",
  5: "\u2085",
  6: "\u2086",
  7: "\u2087",
  8: "\u2088",
  9: "\u2089",
  a: "\u2090",
  e: "\u2091",
  h: "\u2095",
  i: "\u1d62",
  j: "\u2c7c",
  k: "\u2096",
  l: "\u2097",
  m: "\u2098",
  n: "\u2099",
  o: "\u2092",
  p: "\u209a",
  r: "\u1d63",
  s: "\u209b",
  t: "\u209c",
  u: "\u1d64",
  v: "\u1d65",
  x: "\u2093",
  "+": "\u208a",
  "-": "\u208b",
  "=": "\u208c",
  "(": "\u208d",
  ")": "\u208e",
}

const SMALL_CAP_OPENERS = ["{{sc:", "{{smallcaps:"]
const SUPERSCRIPT_OPENERS = ["{{sup:", "{{super:"]
const SUBSCRIPT_OPENERS = ["{{sub:", "{{subscript:"]
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

function replaceMarkers(src, openers, kind, map, lowercaseLetters = true) {
  let cursor = 0
  let output = ""

  while (cursor < src.length) {
    let matchedOpener = null
    let openerIndex = -1

    for (const opener of openers) {
      const candidateIndex = src.indexOf(opener, cursor)
      if (candidateIndex === -1) continue
      if (openerIndex === -1 || candidateIndex < openerIndex) {
        openerIndex = candidateIndex
        matchedOpener = opener
      }
    }

    if (matchedOpener == null || openerIndex === -1) {
      output += src.slice(cursor)
      break
    }

    output += src.slice(cursor, openerIndex)
    const bodyStart = openerIndex + matchedOpener.length
    const bodyEnd = src.indexOf("}}", bodyStart)

    if (bodyEnd === -1) {
      output += src.slice(openerIndex)
      break
    }

    const body = src.slice(bodyStart, bodyEnd)
    output += normalizeWithMap(kind, body.trim(), map, lowercaseLetters)
    cursor = bodyEnd + 2
  }

  return output
}

export default function LinguisticNotation() {
  return {
    name: "LinguisticNotation",
    textTransform(_ctx, src) {
      let out = src
      out = replaceMarkers(out, SMALL_CAP_OPENERS, "small-cap", SMALL_CAPS_MAP)
      out = replaceMarkers(out, SUPERSCRIPT_OPENERS, "superscript", SUPERSCRIPT_MAP)
      out = replaceMarkers(out, SUBSCRIPT_OPENERS, "subscript", SUBSCRIPT_MAP)
      return out
    },
  }
}
