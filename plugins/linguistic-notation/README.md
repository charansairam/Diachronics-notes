# Linguistic Notation Plugin

This repo-local Quartz transformer provides an explicit authoring shorthand for Unicode small-caps conversion.

## Supported shorthand

- `{{sc:obl}}` -> `ᴏʙʟ`
- `{{sc:dist.dem.nhum.pl.obl}}` -> `ᴅɪꜱᴛ.ᴅᴇᴍ.ɴʜᴜᴍ.ᴘʟ.ᴏʙʟ`
- `{{smallcaps:gen}}` -> `ɢᴇɴ`

## Why this exists

Blindly converting all-caps strings would incorrectly rewrite ordinary abbreviations such as `CDIAL` or `IA`. This plugin only converts text inside explicit markers.

## Notes

- Existing Unicode small-caps already present in notes are left unchanged.
- Characters without a mapping are left unchanged and logged once during build.
- This plugin is a good place to extend later for superscript/subscript conveniences.
