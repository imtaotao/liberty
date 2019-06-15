// https://github.com/mozilla/source-map/blob/master/lib/base64-vlq.js
// http://www.ruanyifeng.com/blog/2013/01/javascript_source_map.html

function genMappings (source) {
  const lines = source.split('\n')
  const code = l => `AA${l}A`
  // the line is relative position,
  // so, current position relative to the previous line, only to +1
  // AADA;AACA;---
  return code('D') + ';' + lines.map(() => code('C')).join(';')
}

export default function (resource, responseURL) {
  const content = JSON.stringify({
    version: 3,
    sources: [responseURL],
    mappings: genMappings(resource),
  })
  return `//@ sourceMappingURL=data:application/json;base64,${btoa(content)}`
}