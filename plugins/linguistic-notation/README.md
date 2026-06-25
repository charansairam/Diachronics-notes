# Linguistic Notation Plugin

This repo-local Quartz transformer provides explicit authoring shorthand for Unicode small-caps, superscript, and subscript conversion.

## Supported shorthand

- `{{sc:obl}}` -> `ᴏʙʟ`
- `{{sc:dist.dem.nhum.pl.obl}}` -> `ᴅɪꜱᴛ.ᴅᴇᴍ.ɴʜᴜᴍ.ᴘʟ.ᴏʙʟ`
- `{{smallcaps:gen}}` -> `ɢᴇɴ`
- `{{sup:th}}` -> `ᵗʰ`
- `{{sup:n}}` -> `ⁿ`
- `{{sub:2}}` -> `₂`
- `{{sub:pl}}` -> `ₚₗ` where mappings exist, leaving unsupported letters unchanged

## Why this exists

Blindly converting all-caps strings would incorrectly rewrite ordinary abbreviations such as `CDIAL` or `IA`. This plugin only converts text inside explicit markers.

## Notes

- Existing Unicode small-caps already present in notes are left unchanged.
- Characters without a mapping are left unchanged and logged once during build.
- Superscript and subscript support follow the limits of available Unicode characters, so some letters convert and others stay plain.
