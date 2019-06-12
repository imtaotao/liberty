// https://github.com/mozilla/source-map/blob/master/lib/base64-vlq.js
// http://www.ruanyifeng.com/blog/2013/01/javascript_source_map.html
const VLQ_BASE_SHIFT = 5
const VLQ_BASE = 1 << VLQ_BASE_SHIFT
const VLQ_BASE_MASK = VLQ_BASE - 1
const VLQ_CONTINUATION_BIT = VLQ_BASE
const intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("")

function toVLQSigned (aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0
}

function base64Encode (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number]
  }
  throw new TypeError("Must be between 0 and 63: " + number)
}

// encode to VLQ
function encoded (aValue) {
  let encoded = ""
  let digit
  let vlq = toVLQSigned(aValue)

  do {
    digit = vlq & VLQ_BASE_MASK
    vlq >>>= VLQ_BASE_SHIFT
    if (vlq > 0) {
      digit |= VLQ_CONTINUATION_BIT
    }
    encoded += base64Encode(digit)
  } while (vlq > 0)

  return encoded
}

window.e = encoded
function genSourcemapUrl (content) {
  return `//@ sourceMappingURL=data:application/json;base64,${btoa(JSON.stringify(content))}`
}

function genMappings (source) {
  console.log(source);
  let mappings = ''
  const lines = source.split('\n')

  for (let i = 0; i < lines.length; i++) {
    console.log(lines[i], i);
    const destLine = i - 2
    const res = `${encoded(0)}${encoded(0)}${encoded(destLine > 0 ? destLine : 0)}${encoded(0)};`
    mappings += res
  }
  return mappings
}

export default function (resource, responseURL) {
  return genSourcemapUrl({
    // names: [],
    version: 3,
    sources: [responseURL],
    mappings: genMappings(resource),
    // mappings: 'AAAA'
  })
}