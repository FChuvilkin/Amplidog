(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  var i
  for (i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
(function (Buffer){(function (){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this)}).call(this,require("buffer").Buffer)
},{"base64-js":1,"buffer":2,"ieee754":3}],3:[function(require,module,exports){
/*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> */
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
"use strict";

var _amplitudeJs = _interopRequireDefault(require("amplitude-js"));

var _experimentJsClient = require("@amplitude/experiment-js-client");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

// This file initializes both Analytics and Experiment SDKs
// Import Analytics SDK
// Import Experiment SDK
function initializeExperiment() {
  // Initialize Analytics instance
  _amplitudeJs["default"].getInstance().init("53d662ed165eae375ae4ade7767e238d"); // Experiment flow
  // (1) Get your deployment's API key


  var apiKey = 'client-8zpzwcNEjp3DmsBT2LWd5S7jj6Y7zBqv'; // (2) Initialize the experiment client

  var experiment = _experimentJsClient.Experiment.initializeWithAmplitudeAnalytics(apiKey); // (3) Fetch variants for a user


  var expAssignment = experiment.fetch();
  return expAssignment;
}

var initExperiment = initializeExperiment(); // (4) Function that calls variant and create an automatic Exposure event

function showVariant() {
  console.log(initExperiment);
  initExperiment.then(function (experiment) {
    console.log(experiment);
    var variant = experiment.variant("background-color-experiment");
    console.log(variant);

    if (variant.value === 'treatment') {
      // Experiment is treatment
      document.querySelector("body").classList.add("inverted");
    } else {// Flag is off
    }
  });
}

showVariant();

},{"@amplitude/experiment-js-client":5,"amplitude-js":6}],5:[function(require,module,exports){
(function (global){(function (){
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.Experiment = {}));
})(this, (function (exports) { 'use strict';

    /**
     * @deprecated Update your version of the amplitude analytics-js SDK to 8.17.0+ and for seamless
     * integration with the amplitude analytics SDK.
     */
    var AmplitudeUserProvider = /** @class */ (function () {
        function AmplitudeUserProvider(amplitudeInstance) {
            this.amplitudeInstance = amplitudeInstance;
        }
        AmplitudeUserProvider.prototype.getUser = function () {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
            return {
                device_id: (_b = (_a = this.amplitudeInstance) === null || _a === void 0 ? void 0 : _a.options) === null || _b === void 0 ? void 0 : _b.deviceId,
                user_id: (_d = (_c = this.amplitudeInstance) === null || _c === void 0 ? void 0 : _c.options) === null || _d === void 0 ? void 0 : _d.userId,
                version: (_f = (_e = this.amplitudeInstance) === null || _e === void 0 ? void 0 : _e.options) === null || _f === void 0 ? void 0 : _f.versionName,
                language: (_h = (_g = this.amplitudeInstance) === null || _g === void 0 ? void 0 : _g.options) === null || _h === void 0 ? void 0 : _h.language,
                platform: (_k = (_j = this.amplitudeInstance) === null || _j === void 0 ? void 0 : _j.options) === null || _k === void 0 ? void 0 : _k.platform,
                os: this.getOs(),
                device_model: this.getDeviceModel(),
            };
        };
        AmplitudeUserProvider.prototype.getOs = function () {
            var _a, _b, _c, _d, _e, _f;
            return [
                (_c = (_b = (_a = this.amplitudeInstance) === null || _a === void 0 ? void 0 : _a._ua) === null || _b === void 0 ? void 0 : _b.browser) === null || _c === void 0 ? void 0 : _c.name,
                (_f = (_e = (_d = this.amplitudeInstance) === null || _d === void 0 ? void 0 : _d._ua) === null || _e === void 0 ? void 0 : _e.browser) === null || _f === void 0 ? void 0 : _f.major,
            ]
                .filter(function (e) { return e !== null && e !== undefined; })
                .join(' ');
        };
        AmplitudeUserProvider.prototype.getDeviceModel = function () {
            var _a, _b, _c;
            return (_c = (_b = (_a = this.amplitudeInstance) === null || _a === void 0 ? void 0 : _a._ua) === null || _b === void 0 ? void 0 : _b.os) === null || _c === void 0 ? void 0 : _c.name;
        };
        return AmplitudeUserProvider;
    }());
    /**
     * @deprecated Update your version of the amplitude analytics-js SDK to 8.17.0+ and for seamless
     * integration with the amplitude analytics SDK.
     */
    var AmplitudeAnalyticsProvider = /** @class */ (function () {
        function AmplitudeAnalyticsProvider(amplitudeInstance) {
            this.amplitudeInstance = amplitudeInstance;
        }
        AmplitudeAnalyticsProvider.prototype.track = function (event) {
            this.amplitudeInstance.logEvent(event.name, event.properties);
        };
        AmplitudeAnalyticsProvider.prototype.setUserProperty = function (event) {
            var _a;
            var _b;
            // if the variant has a value, set the user property and log an event
            this.amplitudeInstance.setUserProperties((_a = {},
                _a[event.userProperty] = (_b = event.variant) === null || _b === void 0 ? void 0 : _b.value,
                _a));
        };
        AmplitudeAnalyticsProvider.prototype.unsetUserProperty = function (event) {
            var _a;
            // if the variant does not have a value, unset the user property
            this.amplitudeInstance['_logEvent']('$identify', null, null, {
                $unset: (_a = {}, _a[event.userProperty] = '-', _a),
            });
        };
        return AmplitudeAnalyticsProvider;
    }());

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    var __assign = function () {
      __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];

          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }

        return t;
      };

      return __assign.apply(this, arguments);
    };
    function __awaiter(thisArg, _arguments, P, generator) {
      function adopt(value) {
        return value instanceof P ? value : new P(function (resolve) {
          resolve(value);
        });
      }

      return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) {
          try {
            step(generator.next(value));
          } catch (e) {
            reject(e);
          }
        }

        function rejected(value) {
          try {
            step(generator["throw"](value));
          } catch (e) {
            reject(e);
          }
        }

        function step(result) {
          result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
        }

        step((generator = generator.apply(thisArg, _arguments || [])).next());
      });
    }
    function __generator(thisArg, body) {
      var _ = {
        label: 0,
        sent: function () {
          if (t[0] & 1) throw t[1];
          return t[1];
        },
        trys: [],
        ops: []
      },
          f,
          y,
          t,
          g;
      return g = {
        next: verb(0),
        "throw": verb(1),
        "return": verb(2)
      }, typeof Symbol === "function" && (g[Symbol.iterator] = function () {
        return this;
      }), g;

      function verb(n) {
        return function (v) {
          return step([n, v]);
        };
      }

      function step(op) {
        if (f) throw new TypeError("Generator is already executing.");

        while (_) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];

          switch (op[0]) {
            case 0:
            case 1:
              t = op;
              break;

            case 4:
              _.label++;
              return {
                value: op[1],
                done: false
              };

            case 5:
              _.label++;
              y = op[1];
              op = [0];
              continue;

            case 7:
              op = _.ops.pop();

              _.trys.pop();

              continue;

            default:
              if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                _ = 0;
                continue;
              }

              if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
                _.label = op[1];
                break;
              }

              if (op[0] === 6 && _.label < t[1]) {
                _.label = t[1];
                t = op;
                break;
              }

              if (t && _.label < t[2]) {
                _.label = t[2];

                _.ops.push(op);

                break;
              }

              if (t[2]) _.ops.pop();

              _.trys.pop();

              continue;
          }

          op = body.call(thisArg, _);
        } catch (e) {
          op = [6, e];
          y = 0;
        } finally {
          f = t = 0;
        }

        if (op[0] & 5) throw op[1];
        return {
          value: op[0] ? op[1] : void 0,
          done: true
        };
      }
    }
    /** @deprecated */

    function __spreadArrays() {
      for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;

      for (var r = Array(s), k = 0, i = 0; i < il; i++) for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++) r[k] = a[j];

      return r;
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var analyticsConnector_umd = createCommonjsModule(function (module, exports) {
      (function (global, factory) {
        factory(exports) ;
      })(commonjsGlobal, function (exports) {

        var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof self !== 'undefined' ? self : {};

        function createCommonjsModule(fn, basedir, module) {
          return module = {
            path: basedir,
            exports: {},
            require: function (path, base) {
              return commonjsRequire(path, base === undefined || base === null ? module.path : base);
            }
          }, fn(module, module.exports), module.exports;
        }

        function commonjsRequire() {
          throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
        }

        var uaParser = createCommonjsModule(function (module, exports) {
          /////////////////////////////////////////////////////////////////////////////////

          /* UAParser.js v0.7.28
             Copyright © 2012-2021 Faisal Salman <f@faisalman.com>
             MIT License */

          /*
          Detect Browser, Engine, OS, CPU, and Device type/model from User-Agent data.
          Supports browser & node.js environment.
          Demo   : https://faisalman.github.io/ua-parser-js
          Source : https://github.com/faisalman/ua-parser-js */
          /////////////////////////////////////////////////////////////////////////////////
          (function (window, undefined$1) {
            // Constants
            /////////////
            var LIBVERSION = '0.7.28',
                EMPTY = '',
                UNKNOWN = '?',
                FUNC_TYPE = 'function',
                UNDEF_TYPE = 'undefined',
                OBJ_TYPE = 'object',
                STR_TYPE = 'string',
                MAJOR = 'major',
                MODEL = 'model',
                NAME = 'name',
                TYPE = 'type',
                VENDOR = 'vendor',
                VERSION = 'version',
                ARCHITECTURE = 'architecture',
                CONSOLE = 'console',
                MOBILE = 'mobile',
                TABLET = 'tablet',
                SMARTTV = 'smarttv',
                WEARABLE = 'wearable',
                EMBEDDED = 'embedded',
                UA_MAX_LENGTH = 255;
            var AMAZON = 'Amazon',
                APPLE = 'Apple',
                ASUS = 'ASUS',
                BLACKBERRY = 'BlackBerry',
                BROWSER = 'Browser',
                CHROME = 'Chrome',
                EDGE = 'Edge',
                FIREFOX = 'Firefox',
                GOOGLE = 'Google',
                HUAWEI = 'Huawei',
                LG = 'LG',
                MICROSOFT = 'Microsoft',
                MOTOROLA = 'Motorola',
                OPERA = 'Opera',
                SAMSUNG = 'Samsung',
                SONY = 'Sony',
                XIAOMI = 'Xiaomi',
                ZEBRA = 'Zebra'; ///////////
            // Helper
            //////////

            var extend = function (regexes, extensions) {
              var mergedRegexes = {};

              for (var i in regexes) {
                if (extensions[i] && extensions[i].length % 2 === 0) {
                  mergedRegexes[i] = extensions[i].concat(regexes[i]);
                } else {
                  mergedRegexes[i] = regexes[i];
                }
              }

              return mergedRegexes;
            },
                enumerize = function (arr) {
              var enums = {};

              for (var i = 0; i < arr.length; i++) {
                enums[arr[i].toUpperCase()] = arr[i];
              }

              return enums;
            },
                has = function (str1, str2) {
              return typeof str1 === STR_TYPE ? lowerize(str2).indexOf(lowerize(str1)) !== -1 : false;
            },
                lowerize = function (str) {
              return str.toLowerCase();
            },
                majorize = function (version) {
              return typeof version === STR_TYPE ? version.replace(/[^\d\.]/g, EMPTY).split('.')[0] : undefined$1;
            },
                trim = function (str, len) {
              if (typeof str === STR_TYPE) {
                str = str.replace(/^\s+|\s+$/g, EMPTY);
                return typeof len === UNDEF_TYPE ? str : str.substring(0, UA_MAX_LENGTH);
              }
            }; ///////////////
            // Map helper
            //////////////


            var rgxMapper = function (ua, arrays) {
              var i = 0,
                  j,
                  k,
                  p,
                  q,
                  matches,
                  match; // loop through all regexes maps

              while (i < arrays.length && !matches) {
                var regex = arrays[i],
                    // even sequence (0,2,4,..)
                props = arrays[i + 1]; // odd sequence (1,3,5,..)

                j = k = 0; // try matching uastring with regexes

                while (j < regex.length && !matches) {
                  matches = regex[j++].exec(ua);

                  if (!!matches) {
                    for (p = 0; p < props.length; p++) {
                      match = matches[++k];
                      q = props[p]; // check if given property is actually array

                      if (typeof q === OBJ_TYPE && q.length > 0) {
                        if (q.length == 2) {
                          if (typeof q[1] == FUNC_TYPE) {
                            // assign modified match
                            this[q[0]] = q[1].call(this, match);
                          } else {
                            // assign given value, ignore regex match
                            this[q[0]] = q[1];
                          }
                        } else if (q.length == 3) {
                          // check whether function or regex
                          if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                            // call function (usually string mapper)
                            this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined$1;
                          } else {
                            // sanitize match using given regex
                            this[q[0]] = match ? match.replace(q[1], q[2]) : undefined$1;
                          }
                        } else if (q.length == 4) {
                          this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined$1;
                        }
                      } else {
                        this[q] = match ? match : undefined$1;
                      }
                    }
                  }
                }

                i += 2;
              }
            },
                strMapper = function (str, map) {
              for (var i in map) {
                // check if current value is array
                if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                  for (var j = 0; j < map[i].length; j++) {
                    if (has(map[i][j], str)) {
                      return i === UNKNOWN ? undefined$1 : i;
                    }
                  }
                } else if (has(map[i], str)) {
                  return i === UNKNOWN ? undefined$1 : i;
                }
              }

              return str;
            }; ///////////////
            // String map
            //////////////
            // Safari < 3.0


            var oldSafariMap = {
              '1.0': '/8',
              '1.2': '/1',
              '1.3': '/3',
              '2.0': '/412',
              '2.0.2': '/416',
              '2.0.3': '/417',
              '2.0.4': '/419',
              '?': '/'
            },
                windowsVersionMap = {
              'ME': '4.90',
              'NT 3.11': 'NT3.51',
              'NT 4.0': 'NT4.0',
              '2000': 'NT 5.0',
              'XP': ['NT 5.1', 'NT 5.2'],
              'Vista': 'NT 6.0',
              '7': 'NT 6.1',
              '8': 'NT 6.2',
              '8.1': 'NT 6.3',
              '10': ['NT 6.4', 'NT 10.0'],
              'RT': 'ARM'
            }; //////////////
            // Regex map
            /////////////

            var regexes = {
              browser: [[/\b(?:crmo|crios)\/([\w\.]+)/i // Chrome for Android/iOS
              ], [VERSION, [NAME, 'Chrome']], [/edg(?:e|ios|a)?\/([\w\.]+)/i // Microsoft Edge
              ], [VERSION, [NAME, 'Edge']], [// Presto based
              /(opera mini)\/([-\w\.]+)/i, // Opera Mini
              /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i, // Opera Mobi/Tablet
              /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i // Opera
              ], [NAME, VERSION], [/opios[\/ ]+([\w\.]+)/i // Opera mini on iphone >= 8.0
              ], [VERSION, [NAME, OPERA + ' Mini']], [/\bopr\/([\w\.]+)/i // Opera Webkit
              ], [VERSION, [NAME, OPERA]], [// Mixed
              /(kindle)\/([\w\.]+)/i, // Kindle
              /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i, // Lunascape/Maxthon/Netfront/Jasmine/Blazer
              // Trident based
              /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i, // Avant/IEMobile/SlimBrowser
              /(ba?idubrowser)[\/ ]?([\w\.]+)/i, // Baidu Browser
              /(?:ms|\()(ie) ([\w\.]+)/i, // Internet Explorer
              // Webkit/KHTML based                                               // Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon
              /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale|qqbrowserlite|qq)\/([-\w\.]+)/i, // Rekonq/Puffin/Brave/Whale/QQBrowserLite/QQ, aka ShouQ
              /(weibo)__([\d\.]+)/i // Weibo
              ], [NAME, VERSION], [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i // UCBrowser
              ], [VERSION, [NAME, 'UC' + BROWSER]], [/\bqbcore\/([\w\.]+)/i // WeChat Desktop for Windows Built-in Browser
              ], [VERSION, [NAME, 'WeChat(Win) Desktop']], [/micromessenger\/([\w\.]+)/i // WeChat
              ], [VERSION, [NAME, 'WeChat']], [/konqueror\/([\w\.]+)/i // Konqueror
              ], [VERSION, [NAME, 'Konqueror']], [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i // IE11
              ], [VERSION, [NAME, 'IE']], [/yabrowser\/([\w\.]+)/i // Yandex
              ], [VERSION, [NAME, 'Yandex']], [/(avast|avg)\/([\w\.]+)/i // Avast/AVG Secure Browser
              ], [[NAME, /(.+)/, '$1 Secure ' + BROWSER], VERSION], [/\bfocus\/([\w\.]+)/i // Firefox Focus
              ], [VERSION, [NAME, FIREFOX + ' Focus']], [/\bopt\/([\w\.]+)/i // Opera Touch
              ], [VERSION, [NAME, OPERA + ' Touch']], [/coc_coc\w+\/([\w\.]+)/i // Coc Coc Browser
              ], [VERSION, [NAME, 'Coc Coc']], [/dolfin\/([\w\.]+)/i // Dolphin
              ], [VERSION, [NAME, 'Dolphin']], [/coast\/([\w\.]+)/i // Opera Coast
              ], [VERSION, [NAME, OPERA + ' Coast']], [/miuibrowser\/([\w\.]+)/i // MIUI Browser
              ], [VERSION, [NAME, 'MIUI ' + BROWSER]], [/fxios\/([-\w\.]+)/i // Firefox for iOS
              ], [VERSION, [NAME, FIREFOX]], [/\bqihu|(qi?ho?o?|360)browser/i // 360
              ], [[NAME, '360 ' + BROWSER]], [/(oculus|samsung|sailfish)browser\/([\w\.]+)/i], [[NAME, /(.+)/, '$1 ' + BROWSER], VERSION], [// Oculus/Samsung/Sailfish Browser
              /(comodo_dragon)\/([\w\.]+)/i // Comodo Dragon
              ], [[NAME, /_/g, ' '], VERSION], [/(electron)\/([\w\.]+) safari/i, // Electron-based App
              /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i, // Tesla
              /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i // QQBrowser/Baidu App/2345 Browser
              ], [NAME, VERSION], [/(metasr)[\/ ]?([\w\.]+)/i, // SouGouBrowser
              /(lbbrowser)/i // LieBao Browser
              ], [NAME], [// WebView
              /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i // Facebook App for iOS & Android
              ], [[NAME, 'Facebook'], VERSION], [/safari (line)\/([\w\.]+)/i, // Line App for iOS
              /\b(line)\/([\w\.]+)\/iab/i, // Line App for Android
              /(chromium|instagram)[\/ ]([-\w\.]+)/i // Chromium/Instagram
              ], [NAME, VERSION], [/\bgsa\/([\w\.]+) .*safari\//i // Google Search Appliance on iOS
              ], [VERSION, [NAME, 'GSA']], [/headlesschrome(?:\/([\w\.]+)| )/i // Chrome Headless
              ], [VERSION, [NAME, CHROME + ' Headless']], [/ wv\).+(chrome)\/([\w\.]+)/i // Chrome WebView
              ], [[NAME, CHROME + ' WebView'], VERSION], [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i // Android Browser
              ], [VERSION, [NAME, 'Android ' + BROWSER]], [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i // Chrome/OmniWeb/Arora/Tizen/Nokia
              ], [NAME, VERSION], [/version\/([\w\.]+) .*mobile\/\w+ (safari)/i // Mobile Safari
              ], [VERSION, [NAME, 'Mobile Safari']], [/version\/([\w\.]+) .*(mobile ?safari|safari)/i // Safari & Safari Mobile
              ], [VERSION, NAME], [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i // Safari < 3.0
              ], [NAME, [VERSION, strMapper, oldSafariMap]], [/(webkit|khtml)\/([\w\.]+)/i], [NAME, VERSION], [// Gecko based
              /(navigator|netscape\d?)\/([-\w\.]+)/i // Netscape
              ], [[NAME, 'Netscape'], VERSION], [/mobile vr; rv:([\w\.]+)\).+firefox/i // Firefox Reality
              ], [VERSION, [NAME, FIREFOX + ' Reality']], [/ekiohf.+(flow)\/([\w\.]+)/i, // Flow
              /(swiftfox)/i, // Swiftfox
              /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i, // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror/Klar
              /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i, // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
              /(firefox)\/([\w\.]+)/i, // Other Firefox-based
              /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i, // Mozilla
              // Other
              /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i, // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir/Obigo/Mosaic/Go/ICE/UP.Browser
              /(links) \(([\w\.]+)/i // Links
              ], [NAME, VERSION]],
              cpu: [[/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i // AMD64 (x64)
              ], [[ARCHITECTURE, 'amd64']], [/(ia32(?=;))/i // IA32 (quicktime)
              ], [[ARCHITECTURE, lowerize]], [/((?:i[346]|x)86)[;\)]/i // IA32 (x86)
              ], [[ARCHITECTURE, 'ia32']], [/\b(aarch64|arm(v?8e?l?|_?64))\b/i // ARM64
              ], [[ARCHITECTURE, 'arm64']], [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i // ARMHF
              ], [[ARCHITECTURE, 'armhf']], [// PocketPC mistakenly identified as PowerPC
              /windows (ce|mobile); ppc;/i], [[ARCHITECTURE, 'arm']], [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i // PowerPC
              ], [[ARCHITECTURE, /ower/, EMPTY, lowerize]], [/(sun4\w)[;\)]/i // SPARC
              ], [[ARCHITECTURE, 'sparc']], [/((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
              ], [[ARCHITECTURE, lowerize]]],
              device: [[//////////////////////////
              // MOBILES & TABLETS
              // Ordered by popularity
              /////////////////////////
              // Samsung
              /\b(sch-i[89]0\d|shw-m380s|sm-[pt]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i], [MODEL, [VENDOR, SAMSUNG], [TYPE, TABLET]], [/\b((?:s[cgp]h|gt|sm)-\w+|galaxy nexus)/i, /samsung[- ]([-\w]+)/i, /sec-(sgh\w+)/i], [MODEL, [VENDOR, SAMSUNG], [TYPE, MOBILE]], [// Apple
              /((ipod|iphone)\d+,\d+)/i // iPod/iPhone model
              ], [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]], [/(ipad\d+,\d+)/i // iPad model
              ], [MODEL, [VENDOR, APPLE], [TYPE, TABLET]], [/\((ip(?:hone|od)[\w ]*);/i // iPod/iPhone
              ], [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]], [/\((ipad);[-\w\),; ]+apple/i, // iPad
              /applecoremedia\/[\w\.]+ \((ipad)/i, /\b(ipad)\d\d?,\d\d?[;\]].+ios/i], [MODEL, [VENDOR, APPLE], [TYPE, TABLET]], [// Huawei
              /\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i], [MODEL, [VENDOR, HUAWEI], [TYPE, TABLET]], [/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}-[atu]?[ln][01259x][012359][an]?)\b(?!.+d\/s)/i], [MODEL, [VENDOR, HUAWEI], [TYPE, MOBILE]], [// Xiaomi
              /\b(poco[\w ]+)(?: bui|\))/i, // Xiaomi POCO
              /\b; (\w+) build\/hm\1/i, // Xiaomi Hongmi 'numeric' models
              /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i, // Xiaomi Hongmi
              /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i, // Xiaomi Redmi
              /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i // Xiaomi Mi
              ], [[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, MOBILE]], [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i // Mi Pad tablets
              ], [[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, TABLET]], [// OPPO
              /; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007)\b/i], [MODEL, [VENDOR, 'OPPO'], [TYPE, MOBILE]], [// Vivo
              /vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i], [MODEL, [VENDOR, 'Vivo'], [TYPE, MOBILE]], [// Realme
              /\b(rmx[12]\d{3})(?: bui|;|\))/i], [MODEL, [VENDOR, 'Realme'], [TYPE, MOBILE]], [// Motorola
              /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i, /\bmot(?:orola)?[- ](\w*)/i, /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i], [MODEL, [VENDOR, MOTOROLA], [TYPE, MOBILE]], [/\b(mz60\d|xoom[2 ]{0,2}) build\//i], [MODEL, [VENDOR, MOTOROLA], [TYPE, TABLET]], [// LG
              /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i], [MODEL, [VENDOR, LG], [TYPE, TABLET]], [/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i, /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i, /\blg-?([\d\w]+) bui/i], [MODEL, [VENDOR, LG], [TYPE, MOBILE]], [// Lenovo
              /(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [// Nokia
              /(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i], [[MODEL, /_/g, ' '], [VENDOR, 'Nokia'], [TYPE, MOBILE]], [// Google
              /(pixel c)\b/i // Google Pixel C
              ], [MODEL, [VENDOR, GOOGLE], [TYPE, TABLET]], [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i // Google Pixel
              ], [MODEL, [VENDOR, GOOGLE], [TYPE, MOBILE]], [// Sony
              /droid.+ ([c-g]\d{4}|so[-l]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i], [MODEL, [VENDOR, SONY], [TYPE, MOBILE]], [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i], [[MODEL, 'Xperia Tablet'], [VENDOR, SONY], [TYPE, TABLET]], [// OnePlus
              / (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [// Amazon
              /(alexa)webm/i, /(kf[a-z]{2}wi)( bui|\))/i, // Kindle Fire without Silk
              /(kf[a-z]+)( bui|\)).+silk\//i // Kindle Fire HD
              ], [MODEL, [VENDOR, AMAZON], [TYPE, TABLET]], [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i // Fire Phone
              ], [[MODEL, /(.+)/g, 'Fire Phone $1'], [VENDOR, AMAZON], [TYPE, MOBILE]], [// BlackBerry
              /(playbook);[-\w\),; ]+(rim)/i // BlackBerry PlayBook
              ], [MODEL, VENDOR, [TYPE, TABLET]], [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i // BlackBerry 10
              ], [MODEL, [VENDOR, BLACKBERRY], [TYPE, MOBILE]], [// Asus
              /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i], [MODEL, [VENDOR, ASUS], [TYPE, TABLET]], [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i], [MODEL, [VENDOR, ASUS], [TYPE, MOBILE]], [// HTC
              /(nexus 9)/i // HTC Nexus 9
              ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i, // HTC
              // ZTE
              /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i, /(alcatel|geeksphone|nexian|panasonic|sony)[-_ ]?([-\w]*)/i // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
              ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [// Acer
              /droid.+; ([ab][1-7]-?[0178a]\d\d?)/i], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [// Meizu
              /droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i], [MODEL, [VENDOR, 'Meizu'], [TYPE, MOBILE]], [// Sharp
              /\b(sh-?[altvz]?\d\d[a-ekm]?)/i], [MODEL, [VENDOR, 'Sharp'], [TYPE, MOBILE]], [// MIXED
              /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i, // BlackBerry/BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
              /(hp) ([\w ]+\w)/i, // HP iPAQ
              /(asus)-?(\w+)/i, // Asus
              /(microsoft); (lumia[\w ]+)/i, // Microsoft Lumia
              /(lenovo)[-_ ]?([-\w]+)/i, // Lenovo
              /(jolla)/i, // Jolla
              /(oppo) ?([\w ]+) bui/i // OPPO
              ], [VENDOR, MODEL, [TYPE, MOBILE]], [/(archos) (gamepad2?)/i, // Archos
              /(hp).+(touchpad(?!.+tablet)|tablet)/i, // HP TouchPad
              /(kindle)\/([\w\.]+)/i, // Kindle
              /(nook)[\w ]+build\/(\w+)/i, // Nook
              /(dell) (strea[kpr\d ]*[\dko])/i, // Dell Streak
              /(le[- ]+pan)[- ]+(\w{1,9}) bui/i, // Le Pan Tablets
              /(trinity)[- ]*(t\d{3}) bui/i, // Trinity Tablets
              /(gigaset)[- ]+(q\w{1,9}) bui/i, // Gigaset Tablets
              /(vodafone) ([\w ]+)(?:\)| bui)/i // Vodafone
              ], [VENDOR, MODEL, [TYPE, TABLET]], [/(surface duo)/i // Surface Duo
              ], [MODEL, [VENDOR, MICROSOFT], [TYPE, TABLET]], [/droid [\d\.]+; (fp\du?)(?: b|\))/i // Fairphone
              ], [MODEL, [VENDOR, 'Fairphone'], [TYPE, MOBILE]], [/(u304aa)/i // AT&T
              ], [MODEL, [VENDOR, 'AT&T'], [TYPE, MOBILE]], [/\bsie-(\w*)/i // Siemens
              ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [/\b(rct\w+) b/i // RCA Tablets
              ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [/\b(venue[\d ]{2,7}) b/i // Dell Venue Tablets
              ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [/\b(q(?:mv|ta)\w+) b/i // Verizon Tablet
              ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i // Barnes & Noble Tablet
              ], [MODEL, [VENDOR, 'Barnes & Noble'], [TYPE, TABLET]], [/\b(tm\d{3}\w+) b/i], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [/\b(k88) b/i // ZTE K Series Tablet
              ], [MODEL, [VENDOR, 'ZTE'], [TYPE, TABLET]], [/\b(nx\d{3}j) b/i // ZTE Nubia
              ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [/\b(gen\d{3}) b.+49h/i // Swiss GEN Mobile
              ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [/\b(zur\d{3}) b/i // Swiss ZUR Tablet
              ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [/\b((zeki)?tb.*\b) b/i // Zeki Tablets
              ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i // Dragon Touch Tablet
              ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [/\b(ns-?\w{0,9}) b/i // Insignia Tablets
              ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [/\b((nxa|next)-?\w{0,9}) b/i // NextBook Tablets
              ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i // Voice Xtreme Phones
              ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [/\b(lvtel\-)?(v1[12]) b/i // LvTel Phones
              ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [/\b(ph-1) /i // Essential PH-1
              ], [MODEL, [VENDOR, 'Essential'], [TYPE, MOBILE]], [/\b(v(100md|700na|7011|917g).*\b) b/i // Envizen Tablets
              ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [/\b(trio[-\w\. ]+) b/i // MachSpeed Tablets
              ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [/\btu_(1491) b/i // Rotor Tablets
              ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [/(shield[\w ]+) b/i // Nvidia Shield Tablets
              ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, TABLET]], [/(sprint) (\w+)/i // Sprint Phones
              ], [VENDOR, MODEL, [TYPE, MOBILE]], [/(kin\.[onetw]{3})/i // Microsoft Kin
              ], [[MODEL, /\./g, ' '], [VENDOR, MICROSOFT], [TYPE, MOBILE]], [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i // Zebra
              ], [MODEL, [VENDOR, ZEBRA], [TYPE, TABLET]], [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i], [MODEL, [VENDOR, ZEBRA], [TYPE, MOBILE]], [///////////////////
              // CONSOLES
              ///////////////////
              /(ouya)/i, // Ouya
              /(nintendo) ([wids3utch]+)/i // Nintendo
              ], [VENDOR, MODEL, [TYPE, CONSOLE]], [/droid.+; (shield) bui/i // Nvidia
              ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [/(playstation [345portablevi]+)/i // Playstation
              ], [MODEL, [VENDOR, SONY], [TYPE, CONSOLE]], [/\b(xbox(?: one)?(?!; xbox))[\); ]/i // Microsoft Xbox
              ], [MODEL, [VENDOR, MICROSOFT], [TYPE, CONSOLE]], [///////////////////
              // SMARTTVS
              ///////////////////
              /smart-tv.+(samsung)/i // Samsung
              ], [VENDOR, [TYPE, SMARTTV]], [/hbbtv.+maple;(\d+)/i], [[MODEL, /^/, 'SmartTV'], [VENDOR, SAMSUNG], [TYPE, SMARTTV]], [/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i // LG SmartTV
              ], [[VENDOR, LG], [TYPE, SMARTTV]], [/(apple) ?tv/i // Apple TV
              ], [VENDOR, [MODEL, APPLE + ' TV'], [TYPE, SMARTTV]], [/crkey/i // Google Chromecast
              ], [[MODEL, CHROME + 'cast'], [VENDOR, GOOGLE], [TYPE, SMARTTV]], [/droid.+aft(\w)( bui|\))/i // Fire TV
              ], [MODEL, [VENDOR, AMAZON], [TYPE, SMARTTV]], [/\(dtv[\);].+(aquos)/i // Sharp
              ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, // Roku
              /hbbtv\/\d+\.\d+\.\d+ +\([\w ]*; *(\w[^;]*);([^;]*)/i // HbbTV devices
              ], [[VENDOR, trim], [MODEL, trim], [TYPE, SMARTTV]], [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i // SmartTV from Unidentified Vendors
              ], [[TYPE, SMARTTV]], [///////////////////
              // WEARABLES
              ///////////////////
              /((pebble))app/i // Pebble
              ], [VENDOR, MODEL, [TYPE, WEARABLE]], [/droid.+; (glass) \d/i // Google Glass
              ], [MODEL, [VENDOR, GOOGLE], [TYPE, WEARABLE]], [/droid.+; (wt63?0{2,3})\)/i], [MODEL, [VENDOR, ZEBRA], [TYPE, WEARABLE]], [///////////////////
              // EMBEDDED
              ///////////////////
              /(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i // Tesla
              ], [VENDOR, [TYPE, EMBEDDED]], [////////////////////
              // MIXED (GENERIC)
              ///////////////////
              /droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i // Android Phones from Unidentified Vendors
              ], [MODEL, [TYPE, MOBILE]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i // Android Tablets from Unidentified Vendors
              ], [MODEL, [TYPE, TABLET]], [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i // Unidentifiable Tablet
              ], [[TYPE, TABLET]], [/(phone|mobile(?:[;\/]| safari)|pda(?=.+windows ce))/i // Unidentifiable Mobile
              ], [[TYPE, MOBILE]], [/(android[-\w\. ]{0,9});.+buil/i // Generic Android Device
              ], [MODEL, [VENDOR, 'Generic']]],
              engine: [[/windows.+ edge\/([\w\.]+)/i // EdgeHTML
              ], [VERSION, [NAME, EDGE + 'HTML']], [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i // Blink
              ], [VERSION, [NAME, 'Blink']], [/(presto)\/([\w\.]+)/i, // Presto
              /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna
              /ekioh(flow)\/([\w\.]+)/i, // Flow
              /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i, // KHTML/Tasman/Links
              /(icab)[\/ ]([23]\.[\d\.]+)/i // iCab
              ], [NAME, VERSION], [/rv\:([\w\.]{1,9})\b.+(gecko)/i // Gecko
              ], [VERSION, NAME]],
              os: [[// Windows
              /microsoft (windows) (vista|xp)/i // Windows (iTunes)
              ], [NAME, VERSION], [/(windows) nt 6\.2; (arm)/i, // Windows RT
              /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i, // Windows Phone
              /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i], [NAME, [VERSION, strMapper, windowsVersionMap]], [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i], [[NAME, 'Windows'], [VERSION, strMapper, windowsVersionMap]], [// iOS/macOS
              /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, // iOS
              /cfnetwork\/.+darwin/i], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i // Mac OS
              ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [// Mobile OSes
              /droid ([\w\.]+)\b.+(android[- ]x86)/i // Android-x86
              ], [VERSION, NAME], [// Android/WebOS/QNX/Bada/RIM/Maemo/MeeGo/Sailfish OS
              /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i, /(blackberry)\w*\/([\w\.]*)/i, // Blackberry
              /(tizen|kaios)[\/ ]([\w\.]+)/i, // Tizen/KaiOS
              /\((series40);/i // Series 40
              ], [NAME, VERSION], [/\(bb(10);/i // BlackBerry 10
              ], [VERSION, [NAME, BLACKBERRY]], [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i // Symbian
              ], [VERSION, [NAME, 'Symbian']], [/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i // Firefox OS
              ], [VERSION, [NAME, FIREFOX + ' OS']], [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i // WebOS
              ], [VERSION, [NAME, 'webOS']], [// Google Chromecast
              /crkey\/([\d\.]+)/i // Google Chromecast
              ], [VERSION, [NAME, CHROME + 'cast']], [/(cros) [\w]+ ([\w\.]+\w)/i // Chromium OS
              ], [[NAME, 'Chromium OS'], VERSION], [// Console
              /(nintendo|playstation) ([wids345portablevuch]+)/i, // Nintendo/Playstation
              /(xbox); +xbox ([^\);]+)/i, // Microsoft Xbox (360, One, X, S, Series X, Series S)
              // Other
              /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i, // Joli/Palm
              /(mint)[\/\(\) ]?(\w*)/i, // Mint
              /(mageia|vectorlinux)[; ]/i, // Mageia/VectorLinux
              /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i, // Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware/Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus/Raspbian/Plan9/Minix/RISCOS/Contiki/Deepin/Manjaro/elementary/Sabayon/Linspire
              /(hurd|linux) ?([\w\.]*)/i, // Hurd/Linux
              /(gnu) ?([\w\.]*)/i, // GNU
              /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, // FreeBSD/NetBSD/OpenBSD/PC-BSD/GhostBSD/DragonFly
              /(haiku) (\w+)/i // Haiku
              ], [NAME, VERSION], [/(sunos) ?([\w\.\d]*)/i // Solaris
              ], [[NAME, 'Solaris'], VERSION], [/((?:open)?solaris)[-\/ ]?([\w\.]*)/i, // Solaris
              /(aix) ((\d)(?=\.|\)| )[\w\.])*/i, // AIX
              /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux)/i, // BeOS/OS2/AmigaOS/MorphOS/OpenVMS/Fuchsia/HP-UX
              /(unix) ?([\w\.]*)/i // UNIX
              ], [NAME, VERSION]]
            }; /////////////////
            // Constructor
            ////////////////

            var UAParser = function (ua, extensions) {
              if (typeof ua === OBJ_TYPE) {
                extensions = ua;
                ua = undefined$1;
              }

              if (!(this instanceof UAParser)) {
                return new UAParser(ua, extensions).getResult();
              }

              var _ua = ua || (typeof window !== UNDEF_TYPE && window.navigator && window.navigator.userAgent ? window.navigator.userAgent : EMPTY);

              var _rgxmap = extensions ? extend(regexes, extensions) : regexes;

              this.getBrowser = function () {
                var _browser = {};
                _browser[NAME] = undefined$1;
                _browser[VERSION] = undefined$1;
                rgxMapper.call(_browser, _ua, _rgxmap.browser);
                _browser.major = majorize(_browser.version);
                return _browser;
              };

              this.getCPU = function () {
                var _cpu = {};
                _cpu[ARCHITECTURE] = undefined$1;
                rgxMapper.call(_cpu, _ua, _rgxmap.cpu);
                return _cpu;
              };

              this.getDevice = function () {
                var _device = {};
                _device[VENDOR] = undefined$1;
                _device[MODEL] = undefined$1;
                _device[TYPE] = undefined$1;
                rgxMapper.call(_device, _ua, _rgxmap.device);
                return _device;
              };

              this.getEngine = function () {
                var _engine = {};
                _engine[NAME] = undefined$1;
                _engine[VERSION] = undefined$1;
                rgxMapper.call(_engine, _ua, _rgxmap.engine);
                return _engine;
              };

              this.getOS = function () {
                var _os = {};
                _os[NAME] = undefined$1;
                _os[VERSION] = undefined$1;
                rgxMapper.call(_os, _ua, _rgxmap.os);
                return _os;
              };

              this.getResult = function () {
                return {
                  ua: this.getUA(),
                  browser: this.getBrowser(),
                  engine: this.getEngine(),
                  os: this.getOS(),
                  device: this.getDevice(),
                  cpu: this.getCPU()
                };
              };

              this.getUA = function () {
                return _ua;
              };

              this.setUA = function (ua) {
                _ua = typeof ua === STR_TYPE && ua.length > UA_MAX_LENGTH ? trim(ua, UA_MAX_LENGTH) : ua;
                return this;
              };

              this.setUA(_ua);
              return this;
            };

            UAParser.VERSION = LIBVERSION;
            UAParser.BROWSER = enumerize([NAME, VERSION, MAJOR]);
            UAParser.CPU = enumerize([ARCHITECTURE]);
            UAParser.DEVICE = enumerize([MODEL, VENDOR, TYPE, CONSOLE, MOBILE, SMARTTV, TABLET, WEARABLE, EMBEDDED]);
            UAParser.ENGINE = UAParser.OS = enumerize([NAME, VERSION]); ///////////
            // Export
            //////////
            // check js environment

            {
              // nodejs env
              if (module.exports) {
                exports = module.exports = UAParser;
              }

              exports.UAParser = UAParser;
            } // jQuery/Zepto specific (optional)
            // Note:
            //   In AMD env the global scope should be kept clean, but jQuery is an exception.
            //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
            //   and we should catch that.

            var $ = typeof window !== UNDEF_TYPE && (window.jQuery || window.Zepto);

            if ($ && !$.ua) {
              var parser = new UAParser();
              $.ua = parser.getResult();

              $.ua.get = function () {
                return parser.getUA();
              };

              $.ua.set = function (ua) {
                parser.setUA(ua);
                var result = parser.getResult();

                for (var prop in result) {
                  $.ua[prop] = result[prop];
                }
              };
            }
          })(typeof window === 'object' ? window : commonjsGlobal$1);
        });

        var ApplicationContextProviderImpl =
        /** @class */
        function () {
          function ApplicationContextProviderImpl() {
            this.ua = new uaParser.UAParser(navigator.userAgent).getResult();
          }

          ApplicationContextProviderImpl.prototype.getApplicationContext = function () {
            return {
              versionName: this.versionName,
              language: getLanguage(),
              platform: 'Web',
              os: getOs(this.ua),
              deviceModel: getDeviceModel(this.ua)
            };
          };

          return ApplicationContextProviderImpl;
        }();

        var getOs = function (ua) {
          var _a, _b;

          return [(_a = ua.browser) === null || _a === void 0 ? void 0 : _a.name, (_b = ua.browser) === null || _b === void 0 ? void 0 : _b.major].filter(function (e) {
            return e !== null && e !== undefined;
          }).join(' ');
        };

        var getDeviceModel = function (ua) {
          var _a;

          return (_a = ua.os) === null || _a === void 0 ? void 0 : _a.name;
        };

        var getLanguage = function () {
          return typeof navigator !== 'undefined' && (navigator.languages && navigator.languages[0] || navigator.language) || '';
        };

        var EventBridgeImpl =
        /** @class */
        function () {
          function EventBridgeImpl() {
            this.queue = [];
          }

          EventBridgeImpl.prototype.logEvent = function (event) {
            if (!this.receiver) {
              if (this.queue.length < 512) {
                this.queue.push(event);
              }
            } else {
              this.receiver(event);
            }
          };

          EventBridgeImpl.prototype.setEventReceiver = function (receiver) {
            this.receiver = receiver;

            if (this.queue.length > 0) {
              this.queue.forEach(function (event) {
                receiver(event);
              });
              this.queue = [];
            }
          };

          return EventBridgeImpl;
        }();
        /*! *****************************************************************************
        Copyright (c) Microsoft Corporation.

        Permission to use, copy, modify, and/or distribute this software for any
        purpose with or without fee is hereby granted.

        THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
        REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
        AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
        INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
        LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
        OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
        PERFORMANCE OF THIS SOFTWARE.
        ***************************************************************************** */


        var __assign = function () {
          __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];

              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }

            return t;
          };

          return __assign.apply(this, arguments);
        };

        var ID_OP_SET = '$set';
        var ID_OP_UNSET = '$unset';
        var ID_OP_CLEAR_ALL = '$clearAll';

        var IdentityStoreImpl =
        /** @class */
        function () {
          function IdentityStoreImpl() {
            this.identity = {
              userProperties: {}
            };
            this.listeners = new Set();
          }

          IdentityStoreImpl.prototype.editIdentity = function () {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            var self = this;

            var actingUserProperties = __assign({}, this.identity.userProperties);

            var actingIdentity = __assign(__assign({}, this.identity), {
              userProperties: actingUserProperties
            });

            return {
              setUserId: function (userId) {
                actingIdentity.userId = userId;
                return this;
              },
              setDeviceId: function (deviceId) {
                actingIdentity.deviceId = deviceId;
                return this;
              },
              setUserProperties: function (userProperties) {
                actingIdentity.userProperties = userProperties;
                return this;
              },
              updateUserProperties: function (actions) {
                var actingProperties = actingIdentity.userProperties || {};

                for (var _i = 0, _a = Object.entries(actions); _i < _a.length; _i++) {
                  var _b = _a[_i],
                      action = _b[0],
                      properties = _b[1];

                  switch (action) {
                    case ID_OP_SET:
                      for (var _c = 0, _d = Object.entries(properties); _c < _d.length; _c++) {
                        var _e = _d[_c],
                            key = _e[0],
                            value = _e[1];
                        actingProperties[key] = value;
                      }

                      break;

                    case ID_OP_UNSET:
                      for (var _f = 0, _g = Object.keys(properties); _f < _g.length; _f++) {
                        var key = _g[_f];
                        delete actingProperties[key];
                      }

                      break;

                    case ID_OP_CLEAR_ALL:
                      actingProperties = {};
                      break;
                  }
                }

                actingIdentity.userProperties = actingProperties;
                return this;
              },
              commit: function () {
                self.setIdentity(actingIdentity);
                return this;
              }
            };
          };

          IdentityStoreImpl.prototype.getIdentity = function () {
            return __assign({}, this.identity);
          };

          IdentityStoreImpl.prototype.setIdentity = function (identity) {
            var originalIdentity = __assign({}, this.identity);

            this.identity = __assign({}, identity);

            if (!isEqual(originalIdentity, this.identity)) {
              this.listeners.forEach(function (listener) {
                listener(identity);
              });
            }
          };

          IdentityStoreImpl.prototype.addIdentityListener = function (listener) {
            this.listeners.add(listener);
          };

          IdentityStoreImpl.prototype.removeIdentityListener = function (listener) {
            this.listeners.delete(listener);
          };

          return IdentityStoreImpl;
        }(); // eslint-disable-next-line @typescript-eslint/no-explicit-any


        var isEqual = function (obj1, obj2) {
          var primitive = ['string', 'number', 'boolean', 'undefined'];
          var typeA = typeof obj1;
          var typeB = typeof obj2;

          if (typeA !== typeB) {
            return false;
          }

          if (primitive.includes(typeA)) {
            return obj1 === obj2;
          } //if got here - objects


          if (obj1.length !== obj2.length) {
            return false;
          } //check if arrays


          var isArrayA = Array.isArray(obj1);
          var isArrayB = Array.isArray(obj2);

          if (isArrayA !== isArrayB) {
            return false;
          }

          if (isArrayA && isArrayB) {
            //arrays
            for (var i = 0; i < obj1.length; i++) {
              if (!isEqual(obj1[i], obj2[i])) {
                return false;
              }
            }
          } else {
            //objects
            var sorted1 = Object.keys(obj1).sort();
            var sorted2 = Object.keys(obj2).sort();

            if (!isEqual(sorted1, sorted2)) {
              return false;
            } //compare object values


            var result_1 = true;
            Object.keys(obj1).forEach(function (key) {
              if (!isEqual(obj1[key], obj2[key])) {
                result_1 = false;
              }
            });
            return result_1;
          }

          return true;
        };

        var safeGlobal = typeof globalThis !== 'undefined' ? globalThis : commonjsGlobal || self;
        safeGlobal['analyticsConnectorInstances'] = {};

        var AnalyticsConnector =
        /** @class */
        function () {
          function AnalyticsConnector() {
            this.identityStore = new IdentityStoreImpl();
            this.eventBridge = new EventBridgeImpl();
            this.applicationContextProvider = new ApplicationContextProviderImpl();
          }

          AnalyticsConnector.getInstance = function (instanceName) {
            if (!safeGlobal['analyticsConnectorInstances'][instanceName]) {
              safeGlobal['analyticsConnectorInstances'][instanceName] = new AnalyticsConnector();
            }

            return safeGlobal['analyticsConnectorInstances'][instanceName];
          };

          return AnalyticsConnector;
        }();

        exports.AnalyticsConnector = AnalyticsConnector;
        Object.defineProperty(exports, '__esModule', {
          value: true
        });
      });
    });

    /**
     * Determines the primary source of variants before falling back.
     *
     * @category Source
     */
    exports.Source = void 0;
    (function (Source) {
        /**
         * The default way to source variants within your application. Before the
         * assignments are fetched, `getVariant(s)` will fallback to local storage
         * first, then `initialVariants` if local storage is empty. This option
         * effectively falls back to an assignment fetched previously.
         */
        Source["LocalStorage"] = "localStorage";
        /**
         * This bootstrap option is used primarily for servers-side rendering using an
         * Experiment server SDK. This bootstrap option always prefers the config
         * `initialVariants` over data in local storage, even if variants are fetched
         * successfully and stored locally.
         */
        Source["InitialVariants"] = "initialVariants";
    })(exports.Source || (exports.Source = {}));
    /**
     * Indicates from which source the variant() function determines the variant
     *
     * @category Source
     */
    var VariantSource;
    (function (VariantSource) {
        VariantSource["LocalStorage"] = "storage";
        VariantSource["InitialVariants"] = "initial";
        VariantSource["SecondaryLocalStoraage"] = "secondary-storage";
        VariantSource["SecondaryInitialVariants"] = "secondary-initial";
        VariantSource["FallbackInline"] = "fallback-inline";
        VariantSource["FallbackConfig"] = "fallback-config";
    })(VariantSource || (VariantSource = {}));
    /**
     * Returns true if the VariantSource is one of the fallbacks (inline or config)
     *
     * @param source a {@link VariantSource}
     * @returns true if source is {@link VariantSource.FallbackInline} or {@link VariantSource.FallbackConfig}
     */
    var isFallback = function (source) {
        return (source === VariantSource.FallbackInline ||
            source === VariantSource.FallbackConfig);
    };

    /**
     Defaults for Experiment Config options

     | **Option**       | **Default**                       |
     |------------------|-----------------------------------|
     | **debug**        | `false`                           |
     | **instanceName** | `$default_instance` |
     | **fallbackVariant**         | `null`                 |
     | **initialVariants**         | `null`                 |
     | **source** | `Source.LocalStorage` |
     | **serverUrl**    | `"https://api.lab.amplitude.com"` |
     | **assignmentTimeoutMillis**    | `10000` |
     | **retryFailedAssignment**    | `true` |
     | **automaticExposureTracking** | `true` |
     | **automaticFetchOnAmplitudeIdentityChange** | `false` |
     | **userProvider**    | `null` |
     | **analyticsProvider**    | `null` |
     | **exposureTrackingProvider**    | `null` |

     *
     * @category Configuration
     */
    var Defaults = {
        debug: false,
        instanceName: '$default_instance',
        fallbackVariant: {},
        initialVariants: {},
        source: exports.Source.LocalStorage,
        serverUrl: 'https://api.lab.amplitude.com',
        fetchTimeoutMillis: 10000,
        retryFetchOnFailure: true,
        automaticExposureTracking: true,
        automaticFetchOnAmplitudeIdentityChange: false,
        userProvider: null,
        analyticsProvider: null,
        exposureTrackingProvider: null,
    };

    var version = "1.4.0";

    var safeGlobal = typeof globalThis !== 'undefined' ? globalThis : global || self;

    var ConnectorUserProvider = /** @class */ (function () {
        function ConnectorUserProvider(identityStore) {
            this.identityStore = identityStore;
        }
        ConnectorUserProvider.prototype.identityReady = function (ms) {
            return __awaiter(this, void 0, void 0, function () {
                var identity;
                var _this = this;
                return __generator(this, function (_a) {
                    identity = this.identityStore.getIdentity();
                    if (!identity.userId && !identity.deviceId) {
                        return [2 /*return*/, Promise.race([
                                new Promise(function (resolve) {
                                    var listener = function () {
                                        resolve();
                                        _this.identityStore.removeIdentityListener(listener);
                                    };
                                    _this.identityStore.addIdentityListener(listener);
                                }),
                                new Promise(function (resolve, reject) {
                                    safeGlobal.setTimeout(reject, ms, 'Timed out waiting for Amplitude Analytics SDK to initialize. ' +
                                        'You must ensure that the analytics SDK is initialized prior to calling fetch().');
                                }),
                            ])];
                    }
                    return [2 /*return*/];
                });
            });
        };
        ConnectorUserProvider.prototype.getUser = function () {
            var identity = this.identityStore.getIdentity();
            var userProperties = undefined;
            try {
                userProperties = identity.userProperties;
            }
            catch (_a) {
                console.warn('[Experiment] failed to cast user properties');
            }
            return {
                user_id: identity.userId,
                device_id: identity.deviceId,
                user_properties: userProperties,
            };
        };
        return ConnectorUserProvider;
    }());
    var ConnectorExposureTrackingProvider = /** @class */ (function () {
        function ConnectorExposureTrackingProvider(eventBridge) {
            this.eventBridge = eventBridge;
        }
        ConnectorExposureTrackingProvider.prototype.track = function (exposure) {
            this.eventBridge.logEvent({
                eventType: '$exposure',
                eventProperties: exposure,
            });
        };
        return ConnectorExposureTrackingProvider;
    }());

    /**
     * @packageDocumentation
     * @internal
     */
    var LocalStorage = /** @class */ (function () {
        function LocalStorage(instanceName, apiKey) {
            this.map = {};
            var shortApiKey = apiKey.substring(apiKey.length - 6);
            this.namespace = "amp-exp-" + instanceName + "-" + shortApiKey;
        }
        LocalStorage.prototype.put = function (key, value) {
            this.map[key] = value;
        };
        LocalStorage.prototype.get = function (key) {
            var value = this.map[key];
            if (value === undefined) {
                value = null;
            }
            return value;
        };
        LocalStorage.prototype.clear = function () {
            this.map = {};
        };
        LocalStorage.prototype.getAll = function () {
            return this.map;
        };
        LocalStorage.prototype.load = function () {
            try {
                var map = JSON.parse(localStorage.getItem(this.namespace)) || {};
                var newMap = {};
                for (var _i = 0, _a = Object.entries(map); _i < _a.length; _i++) {
                    var _b = _a[_i], key = _b[0], value = _b[1];
                    if (typeof value === 'string') {
                        // old format
                        newMap[key] = { value: value };
                    }
                    else if (typeof value === 'object') {
                        // new format
                        newMap[key] = {
                            value: value['value'],
                            payload: value['payload'],
                        };
                    }
                }
                this.map = newMap;
            }
            catch (e) {
                this.map = {};
            }
        };
        LocalStorage.prototype.save = function () {
            try {
                localStorage.setItem(this.namespace, JSON.stringify(this.map));
            }
            catch (e) {
                // pass
            }
        };
        return LocalStorage;
    }());

    function unfetch (e, n) {
      return n = n || {}, new Promise(function (t, r) {
        var s = new XMLHttpRequest(),
            o = [],
            u = [],
            i = {},
            a = function () {
          return {
            ok: 2 == (s.status / 100 | 0),
            statusText: s.statusText,
            status: s.status,
            url: s.responseURL,
            text: function () {
              return Promise.resolve(s.responseText);
            },
            json: function () {
              return Promise.resolve(JSON.parse(s.responseText));
            },
            blob: function () {
              return Promise.resolve(new Blob([s.response]));
            },
            clone: a,
            headers: {
              keys: function () {
                return o;
              },
              entries: function () {
                return u;
              },
              get: function (e) {
                return i[e.toLowerCase()];
              },
              has: function (e) {
                return e.toLowerCase() in i;
              }
            }
          };
        };

        for (var l in s.open(n.method || "get", e, !0), s.onload = function () {
          s.getAllResponseHeaders().replace(/^(.*?):[^\S\n]*([\s\S]*?)$/gm, function (e, n, t) {
            o.push(n = n.toLowerCase()), u.push([n, t]), i[n] = i[n] ? i[n] + "," + t : t;
          }), t(a());
        }, s.onerror = r, s.withCredentials = "include" == n.credentials, n.headers) s.setRequestHeader(l, n.headers[l]);

        s.send(n.body || null);
      });
    }

    /**
     * @packageDocumentation
     * @internal
     */
    var fetch = safeGlobal.fetch || unfetch;
    /*
     * Copied from:
     * https://github.com/github/fetch/issues/175#issuecomment-284787564
     */
    var timeout = function (promise, timeoutMillis) {
        // Dont timeout if timeout is null or invalid
        if (timeoutMillis == null || timeoutMillis <= 0) {
            return promise;
        }
        return new Promise(function (resolve, reject) {
            safeGlobal.setTimeout(function () {
                reject(Error('Request timeout after ' + timeoutMillis + ' milliseconds'));
            }, timeoutMillis);
            promise.then(resolve, reject);
        });
    };
    var request = function (requestUrl, method, headers, data, timeoutMillis) {
        return timeout(fetch(requestUrl, {
            method: method,
            headers: headers,
            body: data,
        }), timeoutMillis);
    };
    var FetchHttpClient = { request: request };

    /**
     * Event for tracking a user's exposure to a variant. This event will not count
     * towards your analytics event volume.
     *
     * @deprecated use ExposureTrackingProvider instead
     */
    var exposureEvent = function (user, key, variant, source) {
        var _a;
        var name = '[Experiment] Exposure';
        var value = variant === null || variant === void 0 ? void 0 : variant.value;
        var userProperty = "[Experiment] " + key;
        return {
            name: name,
            user: user,
            key: key,
            variant: variant,
            userProperty: userProperty,
            properties: {
                key: key,
                variant: value,
                source: source,
            },
            userProperties: (_a = {},
                _a[userProperty] = value,
                _a),
        };
    };

    var isNullOrUndefined = function (value) {
        return value === null || value === undefined;
    };

    var Backoff = /** @class */ (function () {
        function Backoff(attempts, min, max, scalar) {
            this.started = false;
            this.done = false;
            this.attempts = attempts;
            this.min = min;
            this.max = max;
            this.scalar = scalar;
        }
        Backoff.prototype.start = function (fn) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!this.started) {
                                this.started = true;
                            }
                            else {
                                throw Error('Backoff already started');
                            }
                            return [4 /*yield*/, this.backoff(fn, 0, this.min)];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        };
        Backoff.prototype.cancel = function () {
            this.done = true;
            clearTimeout(this.timeoutHandle);
        };
        Backoff.prototype.backoff = function (fn, attempt, delay) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    if (this.done) {
                        return [2 /*return*/];
                    }
                    this.timeoutHandle = safeGlobal.setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        var nextAttempt, nextDelay;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    _a.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, fn()];
                                case 1:
                                    _a.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    _a.sent();
                                    nextAttempt = attempt + 1;
                                    if (nextAttempt < this.attempts) {
                                        nextDelay = Math.min(delay * this.scalar, this.max);
                                        this.backoff(fn, nextAttempt, nextDelay);
                                    }
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }, delay);
                    return [2 /*return*/];
                });
            });
        };
        return Backoff;
    }());

    var fromByteArray_1 = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    for (var i = 0, len = code.length; i < len; ++i) {
      lookup[i] = code[i];
      revLookup[code.charCodeAt(i)] = i;
    } // Support decoding URL-safe base64 strings, as Node.js does.
    // See: https://en.wikipedia.org/wiki/Base64#URL_applications


    revLookup['-'.charCodeAt(0)] = 62;
    revLookup['_'.charCodeAt(0)] = 63;

    function tripletToBase64(num) {
      return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
    }

    function encodeChunk(uint8, start, end) {
      var tmp;
      var output = [];

      for (var i = start; i < end; i += 3) {
        tmp = (uint8[i] << 16 & 0xFF0000) + (uint8[i + 1] << 8 & 0xFF00) + (uint8[i + 2] & 0xFF);
        output.push(tripletToBase64(tmp));
      }

      return output.join('');
    }

    function fromByteArray(uint8) {
      var tmp;
      var len = uint8.length;
      var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes

      var parts = [];
      var maxChunkLength = 16383; // must be multiple of 3
      // go through the array every three bytes, we'll deal with trailing stuff later

      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
      } // pad the end with zeros, but make sure to not forget the extra bytes


      if (extraBytes === 1) {
        tmp = uint8[len - 1];
        parts.push(lookup[tmp >> 2] + lookup[tmp << 4 & 0x3F] + '==');
      } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + uint8[len - 1];
        parts.push(lookup[tmp >> 10] + lookup[tmp >> 4 & 0x3F] + lookup[tmp << 2 & 0x3F] + '=');
      }

      return parts.join('');
    }

    var stringToUtf8Array = function (s) {
        var utf8 = unescape(encodeURIComponent(s));
        var arr = [];
        for (var i = 0; i < utf8.length; i++) {
            arr.push(utf8.charCodeAt(i));
        }
        return arr;
    };
    var urlSafeBase64Encode = function (s) {
        var base64encoded = fromByteArray_1(new Uint8Array(stringToUtf8Array(s)));
        return base64encoded
            .replace(/=/g, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');
    };

    var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = function (length, alphabet) {
        if (alphabet === void 0) { alphabet = CHARS; }
        var str = '';
        for (var i = 0; i < length; ++i) {
            str += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
        }
        return str;
    };

    /**
     * A wrapper for an analytics provider which only sends one exposure event per
     * flag, per variant, per session. In other words, wrapping an analytics
     * provider in this class will prevent the same exposure event to be sent twice
     * in one session.
     */
    var SessionAnalyticsProvider = /** @class */ (function () {
        function SessionAnalyticsProvider(analyticsProvider) {
            // In memory record of flagKey and variant value to in order to only set
            // user properties and track an exposure event once per session unless the
            // variant value changes
            this.setProperties = {};
            this.unsetProperties = {};
            this.analyticsProvider = analyticsProvider;
        }
        SessionAnalyticsProvider.prototype.track = function (event) {
            if (this.setProperties[event.key] == event.variant.value) {
                return;
            }
            else {
                this.setProperties[event.key] = event.variant.value;
                delete this.unsetProperties[event.key];
            }
            this.analyticsProvider.track(event);
        };
        SessionAnalyticsProvider.prototype.setUserProperty = function (event) {
            if (this.setProperties[event.key] == event.variant.value) {
                return;
            }
            this.analyticsProvider.setUserProperty(event);
        };
        SessionAnalyticsProvider.prototype.unsetUserProperty = function (event) {
            if (this.unsetProperties[event.key]) {
                return;
            }
            else {
                this.unsetProperties[event.key] = 'unset';
                delete this.setProperties[event.key];
            }
            this.analyticsProvider.unsetUserProperty(event);
        };
        return SessionAnalyticsProvider;
    }());

    var SessionExposureTrackingProvider = /** @class */ (function () {
        function SessionExposureTrackingProvider(exposureTrackingProvider) {
            this.tracked = {};
            this.exposureTrackingProvider = exposureTrackingProvider;
        }
        SessionExposureTrackingProvider.prototype.track = function (exposure) {
            var trackedExposure = this.tracked[exposure.flag_key];
            if (trackedExposure && trackedExposure.variant === exposure.variant) {
                return;
            }
            else {
                this.tracked[exposure.flag_key] = exposure;
                this.exposureTrackingProvider.track(exposure);
            }
        };
        return SessionExposureTrackingProvider;
    }());

    /**
     * @packageDocumentation
     * @module experiment-js-client
     */
    // Configs which have been removed from the public API.
    // May be added back in the future.
    var fetchBackoffTimeout = 10000;
    var fetchBackoffAttempts = 8;
    var fetchBackoffMinMillis = 500;
    var fetchBackoffMaxMillis = 10000;
    var fetchBackoffScalar = 1.5;
    /**
     * The default {@link Client} used to fetch variations from Experiment's
     * servers.
     *
     * @category Core Usage
     */
    var ExperimentClient = /** @class */ (function () {
        /**
         * Creates a new ExperimentClient instance.
         *
         * In most cases you will want to use the `initialize` factory method in
         * {@link Experiment}.
         *
         * @param apiKey The Client key for the Experiment project
         * @param config See {@link ExperimentConfig} for config options
         */
        function ExperimentClient(apiKey, config) {
            this.user = null;
            /**
             * @deprecated
             */
            this.userProvider = null;
            this.apiKey = apiKey;
            this.config = __assign(__assign({}, Defaults), config);
            if (this.config.userProvider) {
                this.userProvider = this.config.userProvider;
            }
            if (this.config.analyticsProvider) {
                this.analyticsProvider = new SessionAnalyticsProvider(this.config.analyticsProvider);
            }
            if (this.config.exposureTrackingProvider) {
                this.exposureTrackingProvider = new SessionExposureTrackingProvider(this.config.exposureTrackingProvider);
            }
            this.httpClient = FetchHttpClient;
            this.storage = new LocalStorage(this.config.instanceName, apiKey);
            this.storage.load();
        }
        /**
         * Assign the given user to the SDK and asynchronously fetch all variants
         * from the server. Subsequent calls may omit the user from the argument to
         * use the user from the previous call.
         *
         * If an {@link ExperimentUserProvider} has been set, the argument user will
         * be merged with the provider user, preferring user fields from the argument
         * user and falling back on the provider for fields which are null or
         * undefined.
         *
         * If configured, fetch retries the request in the background on failure.
         * Variants received from a successful retry are stored in local storage for
         * access.
         *
         * If you are using the `initialVariants` config option to pre-load this SDK
         * from the server, you generally do not need to call `fetch`.
         *
         * @param user The user to fetch variants for.
         * @returns Promise that resolves when the request for variants completes.
         * @see ExperimentUser
         * @see ExperimentUserProvider
         */
        ExperimentClient.prototype.fetch = function (user) {
            if (user === void 0) { user = this.user; }
            return __awaiter(this, void 0, void 0, function () {
                var e_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            this.setUser(user || {});
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.fetchInternal(user, this.config.fetchTimeoutMillis, this.config.retryFetchOnFailure)];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            e_1 = _a.sent();
                            console.error(e_1);
                            return [3 /*break*/, 4];
                        case 4: return [2 /*return*/, this];
                    }
                });
            });
        };
        /**
         * Returns the variant for the provided key.
         *
         * Access the variant from {@link Source}, falling back  on the given
         * fallback, then the configured fallbackVariant.
         *
         * If an {@link ExperimentAnalyticsProvider} is configured and trackExposure is
         * true, this function will call the provider with an {@link ExposureEvent}.
         * The exposure event does not count towards your event volume within Amplitude.
         *
         * @param key The key to get the variant for.
         * @param fallback The highest priority fallback.
         * @see ExperimentConfig
         * @see ExperimentAnalyticsProvider
         */
        ExperimentClient.prototype.variant = function (key, fallback) {
            if (!this.apiKey) {
                return { value: undefined };
            }
            var _a = this.variantAndSource(key, fallback), source = _a.source, variant = _a.variant;
            if (this.config.automaticExposureTracking) {
                this.exposureInternal(key, variant, source);
            }
            this.debug("[Experiment] variant for " + key + " is " + variant.value);
            return variant;
        };
        /**
         * Track an exposure event for the variant associated with the flag/experiment
         * {@link key}.
         *
         * This method requires that an {@link ExperimentAnalyticsProvider} be
         * configured when this client is initialized, either manually, or through the
         * Amplitude Analytics SDK integration from set up using
         * {@link Experiment.initializeWithAmplitudeAnalytics}.
         *
         * @param key The flag/experiment key to track an exposure for.
         */
        ExperimentClient.prototype.exposure = function (key) {
            var _a = this.variantAndSource(key, null), source = _a.source, variant = _a.variant;
            this.exposureInternal(key, variant, source);
        };
        /**
         * Returns all variants for the user.
         *
         * The primary source of variants is based on the
         * {@link Source} configured in the {@link ExperimentConfig}.
         *
         * @see Source
         * @see ExperimentConfig
         */
        ExperimentClient.prototype.all = function () {
            if (!this.apiKey) {
                return {};
            }
            return __assign(__assign({}, this.secondaryVariants()), this.sourceVariants());
        };
        /**
         * Get a copy of the internal {@link ExperimentUser} object if it is set.
         *
         * @returns a copy of the internal user object if set.
         */
        ExperimentClient.prototype.getUser = function () {
            var _a;
            if (!this.user) {
                return this.user;
            }
            if ((_a = this.user) === null || _a === void 0 ? void 0 : _a.user_properties) {
                var userPropertiesCopy = __assign({}, this.user.user_properties);
                return __assign(__assign({}, this.user), { user_properties: userPropertiesCopy });
            }
            else {
                return __assign({}, this.user);
            }
        };
        /**
         * Copy in and set the user within the experiment client.
         *
         * @param user the user to set within the experiment client.
         */
        ExperimentClient.prototype.setUser = function (user) {
            var _a;
            if (!user) {
                this.user = null;
                return;
            }
            if ((_a = this.user) === null || _a === void 0 ? void 0 : _a.user_properties) {
                var userPropertiesCopy = __assign({}, user.user_properties);
                this.user = __assign(__assign({}, user), { user_properties: userPropertiesCopy });
            }
            else {
                this.user = __assign({}, user);
            }
        };
        /**
         * Get the user provider set by {@link setUserProvider} or null if the user
         * provider has not been set.
         *
         * @returns The user provider set by {@link setUserProvider} or null.
         * @deprecated use ExperimentConfig.userProvider instead
         */
        ExperimentClient.prototype.getUserProvider = function () {
            return this.userProvider;
        };
        /**
         * Sets a user provider that will inject identity information into the user
         * for {@link fetch()} requests. The user provider will only set user fields
         * in outgoing requests which are null or undefined.
         *
         * See {@link ExperimentUserProvider} for more details
         * @param userProvider
         * @deprecated use ExperimentConfig.userProvider instead
         */
        ExperimentClient.prototype.setUserProvider = function (userProvider) {
            this.userProvider = userProvider;
            return this;
        };
        ExperimentClient.prototype.variantAndSource = function (key, fallback) {
            if (this.config.source === exports.Source.InitialVariants) {
                // for source = InitialVariants, fallback order goes:
                // 1. InitialFlags
                // 2. Local Storage
                // 3. Function fallback
                // 4. Config fallback
                var sourceVariant = this.sourceVariants()[key];
                if (!isNullOrUndefined(sourceVariant)) {
                    return {
                        variant: this.convertVariant(sourceVariant),
                        source: VariantSource.InitialVariants,
                    };
                }
                var secondaryVariant = this.secondaryVariants()[key];
                if (!isNullOrUndefined(secondaryVariant)) {
                    return {
                        variant: this.convertVariant(secondaryVariant),
                        source: VariantSource.SecondaryLocalStoraage,
                    };
                }
                if (!isNullOrUndefined(fallback)) {
                    return {
                        variant: this.convertVariant(fallback),
                        source: VariantSource.FallbackInline,
                    };
                }
                return {
                    variant: this.convertVariant(this.config.fallbackVariant),
                    source: VariantSource.FallbackConfig,
                };
            }
            else {
                // for source = LocalStorage, fallback order goes:
                // 1. Local Storage
                // 2. Function fallback
                // 3. InitialFlags
                // 4. Config fallback
                var sourceVariant = this.sourceVariants()[key];
                if (!isNullOrUndefined(sourceVariant)) {
                    return {
                        variant: this.convertVariant(sourceVariant),
                        source: VariantSource.LocalStorage,
                    };
                }
                if (!isNullOrUndefined(fallback)) {
                    return {
                        variant: this.convertVariant(fallback),
                        source: VariantSource.FallbackInline,
                    };
                }
                var secondaryVariant = this.secondaryVariants()[key];
                if (!isNullOrUndefined(secondaryVariant)) {
                    return {
                        variant: this.convertVariant(secondaryVariant),
                        source: VariantSource.SecondaryInitialVariants,
                    };
                }
                return {
                    variant: this.convertVariant(this.config.fallbackVariant),
                    source: VariantSource.FallbackConfig,
                };
            }
        };
        ExperimentClient.prototype.fetchInternal = function (user, timeoutMillis, retry) {
            return __awaiter(this, void 0, void 0, function () {
                var variants, e_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            // Don't even try to fetch variants if API key is not set
                            if (!this.apiKey) {
                                throw Error('Experiment API key is empty');
                            }
                            this.debug("[Experiment] Fetch all: retry=" + retry);
                            // Proactively cancel retries if active in order to avoid unecessary API
                            // requests. A new failure will restart the retries.
                            if (retry) {
                                this.stopRetries();
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.doFetch(user, timeoutMillis)];
                        case 2:
                            variants = _a.sent();
                            this.storeVariants(variants);
                            return [2 /*return*/, variants];
                        case 3:
                            e_2 = _a.sent();
                            if (retry) {
                                this.startRetries(user);
                            }
                            throw e_2;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        ExperimentClient.prototype.doFetch = function (user, timeoutMillis) {
            return __awaiter(this, void 0, void 0, function () {
                var userContext, encodedContext, queryString, endpoint, headers, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.addContextOrWait(user, 1000)];
                        case 1:
                            userContext = _a.sent();
                            encodedContext = urlSafeBase64Encode(JSON.stringify(userContext));
                            queryString = '';
                            if (this.config.debug) {
                                queryString = "?d=" + randomString(8);
                            }
                            endpoint = this.config.serverUrl + "/sdk/vardata" + queryString;
                            headers = {
                                Authorization: "Api-Key " + this.apiKey,
                                'X-Amp-Exp-User': encodedContext,
                            };
                            this.debug('[Experiment] Fetch variants for user: ', userContext);
                            return [4 /*yield*/, this.httpClient.request(endpoint, 'GET', headers, null, timeoutMillis)];
                        case 2:
                            response = _a.sent();
                            if (response.status != 200) {
                                throw Error("Fetch error response: status=" + response.status);
                            }
                            this.debug('[Experiment] Received fetch response: ', response);
                            return [4 /*yield*/, this.parseResponse(response)];
                        case 3: return [2 /*return*/, _a.sent()];
                    }
                });
            });
        };
        ExperimentClient.prototype.parseResponse = function (response) {
            return __awaiter(this, void 0, void 0, function () {
                var json, variants, _i, _a, key;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0: return [4 /*yield*/, response.json()];
                        case 1:
                            json = _b.sent();
                            variants = {};
                            for (_i = 0, _a = Object.keys(json); _i < _a.length; _i++) {
                                key = _a[_i];
                                variants[key] = {
                                    value: json[key].key,
                                    payload: json[key].payload,
                                };
                            }
                            this.debug('[Experiment] Received variants: ', variants);
                            return [2 /*return*/, variants];
                    }
                });
            });
        };
        ExperimentClient.prototype.storeVariants = function (variants) {
            this.storage.clear();
            for (var key in variants) {
                this.storage.put(key, variants[key]);
            }
            this.storage.save();
            this.debug('[Experiment] Stored variants: ', variants);
        };
        ExperimentClient.prototype.startRetries = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                var _this = this;
                return __generator(this, function (_a) {
                    this.debug('[Experiment] Retry fetch');
                    this.retriesBackoff = new Backoff(fetchBackoffAttempts, fetchBackoffMinMillis, fetchBackoffMaxMillis, fetchBackoffScalar);
                    this.retriesBackoff.start(function () { return __awaiter(_this, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, this.fetchInternal(user, fetchBackoffTimeout, false)];
                                case 1:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [2 /*return*/];
                });
            });
        };
        ExperimentClient.prototype.stopRetries = function () {
            if (this.retriesBackoff != null) {
                this.retriesBackoff.cancel();
            }
        };
        ExperimentClient.prototype.addContext = function (user) {
            var _a, _b;
            var providedUser = (_a = this.userProvider) === null || _a === void 0 ? void 0 : _a.getUser();
            var mergedUserProperties = __assign(__assign({}, user === null || user === void 0 ? void 0 : user.user_properties), providedUser === null || providedUser === void 0 ? void 0 : providedUser.user_properties);
            return __assign(__assign(__assign({ library: "experiment-js-client/" + version }, (_b = this.userProvider) === null || _b === void 0 ? void 0 : _b.getUser()), user), { user_properties: mergedUserProperties });
        };
        ExperimentClient.prototype.addContextOrWait = function (user, ms) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!(this.userProvider instanceof ConnectorUserProvider)) return [3 /*break*/, 2];
                            return [4 /*yield*/, this.userProvider.identityReady(ms)];
                        case 1:
                            _a.sent();
                            _a.label = 2;
                        case 2: return [2 /*return*/, this.addContext(user)];
                    }
                });
            });
        };
        ExperimentClient.prototype.convertVariant = function (value) {
            if (value === null || value === undefined) {
                return {};
            }
            if (typeof value == 'string') {
                return {
                    value: value,
                };
            }
            else {
                return value;
            }
        };
        ExperimentClient.prototype.sourceVariants = function () {
            if (this.config.source == exports.Source.LocalStorage) {
                return this.storage.getAll();
            }
            else if (this.config.source == exports.Source.InitialVariants) {
                return this.config.initialVariants;
            }
        };
        ExperimentClient.prototype.secondaryVariants = function () {
            if (this.config.source == exports.Source.LocalStorage) {
                return this.config.initialVariants;
            }
            else if (this.config.source == exports.Source.InitialVariants) {
                return this.storage.getAll();
            }
        };
        ExperimentClient.prototype.exposureInternal = function (key, variant, source) {
            var _a, _b, _c, _d, _e, _f, _g;
            var user = this.addContext(this.getUser());
            var event = exposureEvent(user, key, variant, source);
            if (isFallback(source) || !(variant === null || variant === void 0 ? void 0 : variant.value)) {
                // fallbacks indicate not being allocated into an experiment, so
                // we can unset the property
                (_a = this.exposureTrackingProvider) === null || _a === void 0 ? void 0 : _a.track({ flag_key: key, variant: null });
                (_c = (_b = this.analyticsProvider) === null || _b === void 0 ? void 0 : _b.unsetUserProperty) === null || _c === void 0 ? void 0 : _c.call(_b, event);
            }
            else if (variant === null || variant === void 0 ? void 0 : variant.value) {
                // only track when there's a value for a non fallback variant
                (_d = this.exposureTrackingProvider) === null || _d === void 0 ? void 0 : _d.track({
                    flag_key: key,
                    variant: variant.value,
                });
                (_f = (_e = this.analyticsProvider) === null || _e === void 0 ? void 0 : _e.setUserProperty) === null || _f === void 0 ? void 0 : _f.call(_e, event);
                (_g = this.analyticsProvider) === null || _g === void 0 ? void 0 : _g.track(event);
            }
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ExperimentClient.prototype.debug = function (message) {
            var optionalParams = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                optionalParams[_i - 1] = arguments[_i];
            }
            if (this.config.debug) {
                console.debug.apply(console, __spreadArrays([message], optionalParams));
            }
        };
        return ExperimentClient;
    }());

    var DefaultUserProvider = /** @class */ (function () {
        function DefaultUserProvider(applicationContextProvider) {
            this.contextProvider = applicationContextProvider;
        }
        DefaultUserProvider.prototype.getUser = function () {
            var context = this.contextProvider.getApplicationContext();
            return {
                version: context.versionName,
                language: context.language,
                platform: context.platform,
                os: context.os,
                device_model: context.deviceModel,
            };
        };
        return DefaultUserProvider;
    }());

    var instances = {};
    /**
     * Initializes a singleton {@link ExperimentClient} identified by the configured
     * instance name.
     *
     * @param apiKey The deployment API Key
     * @param config See {@link ExperimentConfig} for config options
     */
    var initialize = function (apiKey, config) {
        // Store instances by appending the instance name and api key. Allows for
        // initializing multiple default instances for different api keys.
        var instanceName = (config === null || config === void 0 ? void 0 : config.instanceName) || Defaults.instanceName;
        var instanceKey = instanceName + "." + apiKey;
        var connector = analyticsConnector_umd.AnalyticsConnector.getInstance(instanceName);
        if (!instances[instanceKey]) {
            config = __assign({ userProvider: new DefaultUserProvider(connector.applicationContextProvider) }, config);
            instances[instanceKey] = new ExperimentClient(apiKey, config);
        }
        return instances[instanceKey];
    };
    /**
     * Initialize a singleton {@link ExperimentClient} which automatically
     * integrates with the installed and initialized instance of the amplitude
     * analytics SDK.
     *
     * You must be using amplitude-js SDK version 8.17.0+ for this integration to
     * work.
     *
     * @param apiKey The deployment API Key
     * @param config See {@link ExperimentConfig} for config options
     */
    var initializeWithAmplitudeAnalytics = function (apiKey, config) {
        // Store instances by appending the instance name and api key. Allows for
        // initializing multiple default instances for different api keys.
        var instanceName = (config === null || config === void 0 ? void 0 : config.instanceName) || Defaults.instanceName;
        var instanceKey = instanceName + "." + apiKey;
        var connector = analyticsConnector_umd.AnalyticsConnector.getInstance(instanceName);
        if (!instances[instanceKey]) {
            config = __assign({ userProvider: new ConnectorUserProvider(connector.identityStore), exposureTrackingProvider: new ConnectorExposureTrackingProvider(connector.eventBridge) }, config);
            instances[instanceKey] = new ExperimentClient(apiKey, config);
            if (config.automaticFetchOnAmplitudeIdentityChange) {
                connector.identityStore.addIdentityListener(function () {
                    instances[instanceKey].fetch();
                });
            }
        }
        return instances[instanceKey];
    };
    /**
     * Provides factory methods for storing singleton instances of {@link ExperimentClient}
     * @category Core Usage
     */
    var Experiment = {
        initialize: initialize,
        initializeWithAmplitudeAnalytics: initializeWithAmplitudeAnalytics,
    };

    /**
     * A stub {@link Client} implementation that does nothing for all methods
     */
    var StubExperimentClient = /** @class */ (function () {
        function StubExperimentClient() {
        }
        StubExperimentClient.prototype.getUser = function () {
            return {};
        };
        StubExperimentClient.prototype.setUser = function (user) { };
        StubExperimentClient.prototype.fetch = function (user) {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    return [2 /*return*/, this];
                });
            });
        };
        StubExperimentClient.prototype.getUserProvider = function () {
            return null;
        };
        StubExperimentClient.prototype.setUserProvider = function (uerProvider) {
            return this;
        };
        StubExperimentClient.prototype.variant = function (key, fallback) {
            return Defaults.fallbackVariant;
        };
        StubExperimentClient.prototype.all = function () {
            return {};
        };
        StubExperimentClient.prototype.exposure = function (key) { };
        return StubExperimentClient;
    }());

    exports.AmplitudeAnalyticsProvider = AmplitudeAnalyticsProvider;
    exports.AmplitudeUserProvider = AmplitudeUserProvider;
    exports.Experiment = Experiment;
    exports.ExperimentClient = ExperimentClient;
    exports.StubExperimentClient = StubExperimentClient;

    Object.defineProperty(exports, '__esModule', { value: true });

}));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
(function (global,Buffer){(function (){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define('amplitude', factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.amplitude = factory());
})(this, (function () { 'use strict';

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _objectSpread(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};
      var ownKeys = Object.keys(source);

      if (typeof Object.getOwnPropertySymbols === 'function') {
        ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) {
          return Object.getOwnPropertyDescriptor(source, sym).enumerable;
        }));
      }

      ownKeys.forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    }

    return target;
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

      return arr2;
    }
  }

  function _iterableToArray(iter) {
    if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter);
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance");
  }

  /**
   * Checks whether we're in a Node.js environment
   *
   * @returns Answer to given question
   */
  /**
   * Checks whether we're in a browser environment
   *
   * @returns Answer to given question
   */
  function isBrowserEnv() {
      return typeof window === 'object' && (window === null || window === void 0 ? void 0 : window.document) !== undefined;
  }
  /**
   * Fixes browser edge case where Prototype.js injects Array.prototype.toJSON and breaks the built-in JSON.stringify()
   *
   * @returns true if Array.prototype.toJSON was deleted, false if not
   */
  var prototypeJsFix = function () {
      var _a;
      if (isBrowserEnv()) {
          var augmentedWindow = window;
          var augmentedArray = Array;
          if (augmentedWindow.Prototype !== undefined && ((_a = augmentedArray.prototype) === null || _a === void 0 ? void 0 : _a.toJSON) !== undefined) {
              delete augmentedArray.prototype.toJSON;
              return true;
          }
      }
      return false;
  };

  var Constants = {
    DEFAULT_INSTANCE: '$default_instance',
    API_VERSION: 2,
    MAX_STRING_LENGTH: 4096,
    MAX_PROPERTY_KEYS: 1000,
    IDENTIFY_EVENT: '$identify',
    GROUP_IDENTIFY_EVENT: '$groupidentify',
    EVENT_LOG_URL: 'api.amplitude.com',
    EVENT_LOG_EU_URL: 'api.eu.amplitude.com',
    DYNAMIC_CONFIG_URL: 'regionconfig.amplitude.com',
    DYNAMIC_CONFIG_EU_URL: 'regionconfig.eu.amplitude.com',
    // localStorageKeys
    LAST_EVENT_ID: 'amplitude_lastEventId',
    LAST_EVENT_TIME: 'amplitude_lastEventTime',
    LAST_IDENTIFY_ID: 'amplitude_lastIdentifyId',
    LAST_SEQUENCE_NUMBER: 'amplitude_lastSequenceNumber',
    SESSION_ID: 'amplitude_sessionId',
    // Used in cookie as well
    DEVICE_ID: 'amplitude_deviceId',
    OPT_OUT: 'amplitude_optOut',
    USER_ID: 'amplitude_userId',
    // indexes of properties in cookie v2 storage format
    DEVICE_ID_INDEX: 0,
    USER_ID_INDEX: 1,
    OPT_OUT_INDEX: 2,
    SESSION_ID_INDEX: 3,
    LAST_EVENT_TIME_INDEX: 4,
    EVENT_ID_INDEX: 5,
    IDENTIFY_ID_INDEX: 6,
    SEQUENCE_NUMBER_INDEX: 7,
    COOKIE_TEST_PREFIX: 'amp_cookie_test',
    COOKIE_PREFIX: 'amp',
    // Storage options
    STORAGE_DEFAULT: '',
    STORAGE_COOKIES: 'cookies',
    STORAGE_NONE: 'none',
    STORAGE_LOCAL: 'localStorage',
    STORAGE_SESSION: 'sessionStorage',
    // revenue keys
    REVENUE_EVENT: 'revenue_amount',
    REVENUE_PRODUCT_ID: '$productId',
    REVENUE_QUANTITY: '$quantity',
    REVENUE_PRICE: '$price',
    REVENUE_REVENUE_TYPE: '$revenueType',
    AMP_DEVICE_ID_PARAM: 'amp_device_id',
    // url param
    REFERRER: 'referrer',
    // UTM Params
    UTM_SOURCE: 'utm_source',
    UTM_MEDIUM: 'utm_medium',
    UTM_CAMPAIGN: 'utm_campaign',
    UTM_TERM: 'utm_term',
    UTM_CONTENT: 'utm_content',
    ATTRIBUTION_EVENT: '[Amplitude] Attribution Captured',
    TRANSPORT_HTTP: 'http',
    TRANSPORT_BEACON: 'beacon'
  };

  /*
   * UTF-8 encoder/decoder
   * http://www.webtoolkit.info/
   */
  var UTF8 = {
    encode: function encode(s) {
      var utftext = '';

      for (var n = 0; n < s.length; n++) {
        var c = s.charCodeAt(n);

        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if (c > 127 && c < 2048) {
          utftext += String.fromCharCode(c >> 6 | 192);
          utftext += String.fromCharCode(c & 63 | 128);
        } else {
          utftext += String.fromCharCode(c >> 12 | 224);
          utftext += String.fromCharCode(c >> 6 & 63 | 128);
          utftext += String.fromCharCode(c & 63 | 128);
        }
      }

      return utftext;
    },
    decode: function decode(utftext) {
      var s = '';
      var i = 0;
      var c = 0,
          c1 = 0,
          c2 = 0;

      while (i < utftext.length) {
        c = utftext.charCodeAt(i);

        if (c < 128) {
          s += String.fromCharCode(c);
          i++;
        } else if (c > 191 && c < 224) {
          c1 = utftext.charCodeAt(i + 1);
          s += String.fromCharCode((c & 31) << 6 | c1 & 63);
          i += 2;
        } else {
          c1 = utftext.charCodeAt(i + 1);
          c2 = utftext.charCodeAt(i + 2);
          s += String.fromCharCode((c & 15) << 12 | (c1 & 63) << 6 | c2 & 63);
          i += 3;
        }
      }

      return s;
    }
  };

  /* global globalThis */
  var GlobalScope = function () {
    if (typeof globalThis !== 'undefined') {
      return globalThis;
    }

    if (typeof window !== 'undefined') {
      return window;
    }

    if (typeof self !== 'undefined') {
      return self;
    }

    if (typeof global !== 'undefined') {
      return global;
    }
  }();

  /*
   * Base64 encoder/decoder
   * http://www.webtoolkit.info/
   */

  var Base64 = {
    _keyStr: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
    encode: function encode(input) {
      try {
        if (GlobalScope.btoa && GlobalScope.atob) {
          return GlobalScope.btoa(unescape(encodeURIComponent(input)));
        }
      } catch (e) {//log(e);
      }

      return Base64._encode(input);
    },
    _encode: function _encode(input) {
      var output = '';
      var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
      var i = 0;
      input = UTF8.encode(input);

      while (i < input.length) {
        chr1 = input.charCodeAt(i++);
        chr2 = input.charCodeAt(i++);
        chr3 = input.charCodeAt(i++);
        enc1 = chr1 >> 2;
        enc2 = (chr1 & 3) << 4 | chr2 >> 4;
        enc3 = (chr2 & 15) << 2 | chr3 >> 6;
        enc4 = chr3 & 63;

        if (isNaN(chr2)) {
          enc3 = enc4 = 64;
        } else if (isNaN(chr3)) {
          enc4 = 64;
        }

        output = output + Base64._keyStr.charAt(enc1) + Base64._keyStr.charAt(enc2) + Base64._keyStr.charAt(enc3) + Base64._keyStr.charAt(enc4);
      }

      return output;
    },
    decode: function decode(input) {
      try {
        if (GlobalScope.btoa && GlobalScope.atob) {
          return decodeURIComponent(escape(GlobalScope.atob(input)));
        }
      } catch (e) {//log(e);
      }

      return Base64._decode(input);
    },
    _decode: function _decode(input) {
      var output = '';
      var chr1, chr2, chr3;
      var enc1, enc2, enc3, enc4;
      var i = 0;
      input = input.replace(/[^A-Za-z0-9+/=]/g, '');

      while (i < input.length) {
        enc1 = Base64._keyStr.indexOf(input.charAt(i++));
        enc2 = Base64._keyStr.indexOf(input.charAt(i++));
        enc3 = Base64._keyStr.indexOf(input.charAt(i++));
        enc4 = Base64._keyStr.indexOf(input.charAt(i++));
        chr1 = enc1 << 2 | enc2 >> 4;
        chr2 = (enc2 & 15) << 4 | enc3 >> 2;
        chr3 = (enc3 & 3) << 6 | enc4;
        output = output + String.fromCharCode(chr1);

        if (enc3 !== 64) {
          output = output + String.fromCharCode(chr2);
        }

        if (enc4 !== 64) {
          output = output + String.fromCharCode(chr3);
        }
      }

      output = UTF8.decode(output);
      return output;
    }
  };

  /**
   * toString ref.
   * @private
   */
  var toString = Object.prototype.toString;
  /**
   * Return the type of `val`.
   * @private
   * @param {Mixed} val
   * @return {String}
   * @api public
   */

  function type (val) {
    switch (toString.call(val)) {
      case '[object Date]':
        return 'date';

      case '[object RegExp]':
        return 'regexp';

      case '[object Arguments]':
        return 'arguments';

      case '[object Array]':
        return 'array';

      case '[object Error]':
        return 'error';
    }

    if (val === null) {
      return 'null';
    }

    if (val === undefined) {
      return 'undefined';
    }

    if (val !== val) {
      return 'nan';
    }

    if (val && val.nodeType === 1) {
      return 'element';
    }

    if (typeof Buffer !== 'undefined' && typeof Buffer.isBuffer === 'function' && Buffer.isBuffer(val)) {
      return 'buffer';
    }

    val = val.valueOf ? val.valueOf() : Object.prototype.valueOf.apply(val);
    return _typeof(val);
  }

  var logLevels = {
    DISABLE: 0,
    ERROR: 1,
    WARN: 2,
    INFO: 3
  };
  var logLevel = logLevels.WARN;

  var setLogLevel = function setLogLevel(logLevelName) {
    if (Object.prototype.hasOwnProperty.call(logLevels, logLevelName)) {
      logLevel = logLevels[logLevelName];
    }
  };

  var getLogLevel = function getLogLevel() {
    return logLevel;
  };

  var log = {
    error: function error(s) {
      if (logLevel >= logLevels.ERROR) {
        _log(s);
      }
    },
    warn: function warn(s) {
      if (logLevel >= logLevels.WARN) {
        _log(s);
      }
    },
    info: function info(s) {
      if (logLevel >= logLevels.INFO) {
        _log(s);
      }
    }
  };

  var _log = function _log(s) {
    try {
      console.log('[Amplitude] ' + s);
    } catch (e) {// console logging not available
    }
  };

  var isEmptyString = function isEmptyString(str) {
    return !str || str.length === 0;
  };

  var sessionStorageEnabled = function sessionStorageEnabled() {
    try {
      if (GlobalScope.sessionStorage) {
        return true;
      }
    } catch (e) {// sessionStorage disabled
    }

    return false;
  }; // truncate string values in event and user properties so that request size does not get too large


  var truncate = function truncate(value) {
    if (type(value) === 'array') {
      for (var i = 0; i < value.length; i++) {
        value[i] = truncate(value[i]);
      }
    } else if (type(value) === 'object') {
      for (var key in value) {
        if (key in value) {
          value[key] = truncate(value[key]);
        }
      }
    } else {
      value = _truncateValue(value);
    }

    return value;
  };

  var _truncateValue = function _truncateValue(value) {
    if (type(value) === 'string') {
      return value.length > Constants.MAX_STRING_LENGTH ? value.substring(0, Constants.MAX_STRING_LENGTH) : value;
    }

    return value;
  };

  var validateInput = function validateInput(input, name, expectedType) {
    if (type(input) !== expectedType) {
      log.error('Invalid ' + name + ' input type. Expected ' + expectedType + ' but received ' + type(input));
      return false;
    }

    return true;
  };

  var validateDeviceId = function validateDeviceId(deviceId) {
    if (!validateInput(deviceId, 'deviceId', 'string')) {
      return false;
    }

    if (deviceId.includes('.')) {
      log.error("Device IDs may not contain '.' characters. Value will be ignored: \"".concat(deviceId, "\""));
      return false;
    }

    return true;
  };

  var validateTransport = function validateTransport(transport) {
    if (!validateInput(transport, 'transport', 'string')) {
      return false;
    }

    if (transport !== Constants.TRANSPORT_HTTP && transport !== Constants.TRANSPORT_BEACON) {
      log.error("transport value must be one of '".concat(Constants.TRANSPORT_BEACON, "' or '").concat(Constants.TRANSPORT_HTTP, "'"));
      return false;
    }

    if (transport !== Constants.TRANSPORT_HTTP && !navigator.sendBeacon) {
      log.error("browser does not support sendBeacon, so transport must be HTTP");
      return false;
    }

    return true;
  }; // do some basic sanitization and type checking, also catch property dicts with more than 1000 key/value pairs


  var validateProperties = function validateProperties(properties) {
    var propsType = type(properties);

    if (propsType !== 'object') {
      log.error('Error: invalid properties format. Expecting Javascript object, received ' + propsType + ', ignoring');
      return {};
    }

    if (Object.keys(properties).length > Constants.MAX_PROPERTY_KEYS) {
      log.error('Error: too many properties (more than 1000), ignoring');
      return {};
    }

    var copy = {}; // create a copy with all of the valid properties

    for (var property in properties) {
      if (!Object.prototype.hasOwnProperty.call(properties, property)) {
        continue;
      } // validate key


      var key = property;
      var keyType = type(key);

      if (keyType !== 'string') {
        key = String(key);
        log.warn('WARNING: Non-string property key, received type ' + keyType + ', coercing to string "' + key + '"');
      } // validate value


      var value = validatePropertyValue(key, properties[property]);

      if (value === null) {
        continue;
      }

      copy[key] = value;
    }

    return copy;
  };

  var invalidValueTypes = ['nan', 'function', 'arguments', 'regexp', 'element'];

  var validatePropertyValue = function validatePropertyValue(key, value) {
    var valueType = type(value);

    if (invalidValueTypes.indexOf(valueType) !== -1) {
      log.warn('WARNING: Property key "' + key + '" with invalid value type ' + valueType + ', ignoring');
      value = null;
    } else if (valueType === 'undefined') {
      value = null;
    } else if (valueType === 'error') {
      value = String(value);
      log.warn('WARNING: Property key "' + key + '" with value type error, coercing to ' + value);
    } else if (valueType === 'array') {
      // check for nested arrays or objects
      var arrayCopy = [];

      for (var i = 0; i < value.length; i++) {
        var element = value[i];
        var elemType = type(element);

        if (elemType === 'array') {
          log.warn('WARNING: Cannot have ' + elemType + ' nested in an array property value, skipping');
          continue;
        } else if (elemType === 'object') {
          arrayCopy.push(validateProperties(element));
        } else {
          arrayCopy.push(validatePropertyValue(key, element));
        }
      }

      value = arrayCopy;
    } else if (valueType === 'object') {
      value = validateProperties(value);
    }

    return value;
  };

  var validateGroups = function validateGroups(groups) {
    var groupsType = type(groups);

    if (groupsType !== 'object') {
      log.error('Error: invalid groups format. Expecting Javascript object, received ' + groupsType + ', ignoring');
      return {};
    }

    var copy = {}; // create a copy with all of the valid properties

    for (var group in groups) {
      if (!Object.prototype.hasOwnProperty.call(groups, group)) {
        continue;
      } // validate key


      var key = group;
      var keyType = type(key);

      if (keyType !== 'string') {
        key = String(key);
        log.warn('WARNING: Non-string groupType, received type ' + keyType + ', coercing to string "' + key + '"');
      } // validate value


      var value = validateGroupName(key, groups[group]);

      if (value === null) {
        continue;
      }

      copy[key] = value;
    }

    return copy;
  };

  var validateGroupName = function validateGroupName(key, groupName) {
    var groupNameType = type(groupName);

    if (groupNameType === 'string') {
      return groupName;
    }

    if (groupNameType === 'date' || groupNameType === 'number' || groupNameType === 'boolean') {
      groupName = String(groupName);
      log.warn('WARNING: Non-string groupName, received type ' + groupNameType + ', coercing to string "' + groupName + '"');
      return groupName;
    }

    if (groupNameType === 'array') {
      // check for nested arrays or objects
      var arrayCopy = [];

      for (var i = 0; i < groupName.length; i++) {
        var element = groupName[i];
        var elemType = type(element);

        if (elemType === 'array' || elemType === 'object') {
          log.warn('WARNING: Skipping nested ' + elemType + ' in array groupName');
          continue;
        } else if (elemType === 'string') {
          arrayCopy.push(element);
        } else if (elemType === 'date' || elemType === 'number' || elemType === 'boolean') {
          element = String(element);
          log.warn('WARNING: Non-string groupName, received type ' + elemType + ', coercing to string "' + element + '"');
          arrayCopy.push(element);
        }
      }

      return arrayCopy;
    }

    log.warn('WARNING: Non-string groupName, received type ' + groupNameType + '. Please use strings or array of strings for groupName');
  }; // parses the value of a url param (for example ?gclid=1234&...)


  var getQueryParam = function getQueryParam(name, query) {
    name = name.replace(/[[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(query);
    return results === null ? undefined : decodeURIComponent(results[1].replace(/\+/g, ' '));
  };

  var isWebWorkerEnvironment = function isWebWorkerEnvironment() {
    return typeof WorkerGlobalScope !== 'undefined';
  };

  var validateSessionId = function validateSessionId(sessionId) {
    if (validateInput(sessionId, 'sessionId', 'number') && new Date(sessionId).getTime() > 0) {
      return true;
    }

    log.error("sessionId value must in milliseconds since epoch (Unix Timestamp)");
    return false;
  };

  var utils = {
    setLogLevel: setLogLevel,
    getLogLevel: getLogLevel,
    logLevels: logLevels,
    log: log,
    isEmptyString: isEmptyString,
    isWebWorkerEnvironment: isWebWorkerEnvironment,
    getQueryParam: getQueryParam,
    sessionStorageEnabled: sessionStorageEnabled,
    truncate: truncate,
    validateGroups: validateGroups,
    validateInput: validateInput,
    validateProperties: validateProperties,
    validateDeviceId: validateDeviceId,
    validateTransport: validateTransport,
    validateSessionId: validateSessionId
  };

  var getLocation = function getLocation() {
    return GlobalScope.location;
  };

  // A URL safe variation on the the list of Base64 characters
  var base64Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

  var base64Id = function base64Id() {
    var str = '';

    for (var i = 0; i < 22; ++i) {
      str += base64Chars.charAt(Math.floor(Math.random() * 64));
    }

    return str;
  };

  var get$1 = function get(name) {
    try {
      var ca = document.cookie.split(';');
      var value = null;

      for (var i = 0; i < ca.length; i++) {
        var c = ca[i];

        while (c.charAt(0) === ' ') {
          c = c.substring(1, c.length);
        }

        if (c.indexOf(name) === 0) {
          value = c.substring(name.length, c.length);
          break;
        }
      }

      return value;
    } catch (e) {
      return null;
    }
  };

  var getAll = function getAll(name) {
    try {
      var cookieArray = document.cookie.split(';').map(function (c) {
        return c.trimStart();
      });
      var values = [];
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = cookieArray[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var cookie = _step.value;

          while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1);
          }

          if (cookie.indexOf(name) === 0) {
            values.push(cookie.substring(name.length));
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return != null) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return values;
    } catch (e) {
      return [];
    }
  };

  var set$1 = function set(name, value, opts) {
    var expires = value !== null ? opts.expirationDays : -1;

    if (expires) {
      var date = new Date();
      date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
      expires = date;
    }

    var str = name + '=' + value;

    if (expires) {
      str += '; expires=' + expires.toUTCString();
    }

    str += '; path=/';

    if (opts.domain) {
      str += '; domain=' + opts.domain;
    }

    if (opts.secure) {
      str += '; Secure';
    }

    if (opts.sameSite) {
      str += '; SameSite=' + opts.sameSite;
    }

    document.cookie = str;
  };

  var getLastEventTime = function getLastEventTime() {
    var cookie = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    var strValue = cookie.split('.')[Constants.LAST_EVENT_TIME_INDEX];
    var parsedValue;

    if (strValue) {
      parsedValue = parseInt(strValue, 32);
    }

    if (parsedValue) {
      return parsedValue;
    } else {
      utils.log.warn("unable to parse malformed cookie: ".concat(cookie));
      return 0;
    }
  };

  var sortByEventTime = function sortByEventTime(cookies) {
    return _toConsumableArray(cookies).sort(function (c1, c2) {
      var t1 = getLastEventTime(c1);
      var t2 = getLastEventTime(c2); // sort c1 first if its last event time is more recent
      // i.e its event time integer is larger that c2's

      return t2 - t1;
    });
  }; // test that cookies are enabled - navigator.cookiesEnabled yields false positives in IE, need to test directly


  var areCookiesEnabled = function areCookiesEnabled() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var cookieName = Constants.COOKIE_TEST_PREFIX + base64Id();

    if (typeof document === 'undefined') {
      return false;
    }

    var _areCookiesEnabled = false;

    try {
      var uid = String(Date.now());
      set$1(cookieName, uid, opts);
      utils.log.info("Testing if cookies available");
      _areCookiesEnabled = get$1(cookieName + '=') === uid;
    } catch (e) {
      utils.log.warn("Error thrown when checking for cookies. Reason: \"".concat(e, "\""));
    } finally {
      utils.log.info("Cleaning up cookies availability test");
      set$1(cookieName, null, opts);
    }

    return _areCookiesEnabled;
  };

  var baseCookie = {
    set: set$1,
    get: get$1,
    getAll: getAll,
    getLastEventTime: getLastEventTime,
    sortByEventTime: sortByEventTime,
    areCookiesEnabled: areCookiesEnabled
  };

  var getHost = function getHost(url) {
    if (url) {
      if (typeof document !== 'undefined') {
        var a = document.createElement('a');
        a.href = url;
        return a.hostname || GlobalScope.location.hostname;
      }

      if (typeof URL === 'function') {
        var u = new URL(url);
        return u.hostname || GlobalScope.location.hostname;
      }
    }

    return GlobalScope.location.hostname;
  };

  var topDomain = function topDomain(url) {
    var host = getHost(url);
    var parts = host.split('.');
    var levels = [];
    var cname = '_tldtest_' + base64Id();
    if (utils.isWebWorkerEnvironment()) return '';

    for (var i = parts.length - 2; i >= 0; --i) {
      levels.push(parts.slice(i).join('.'));
    }

    for (var _i = 0; _i < levels.length; ++_i) {
      var domain = levels[_i];
      var opts = {
        domain: '.' + domain
      };
      baseCookie.set(cname, 1, opts);

      if (baseCookie.get(cname)) {
        baseCookie.set(cname, null, opts);
        return domain;
      }
    }

    return '';
  };

  /*
   * Cookie data
   */
  var _options = {
    expirationDays: undefined,
    domain: undefined
  };

  var reset = function reset() {
    _options = {
      expirationDays: undefined,
      domain: undefined
    };
  };

  var options = function options(opts) {
    if (arguments.length === 0) {
      return _options;
    }

    opts = opts || {};
    _options.expirationDays = opts.expirationDays;
    _options.secure = opts.secure;
    _options.sameSite = opts.sameSite;
    var domain = !utils.isEmptyString(opts.domain) ? opts.domain : '.' + topDomain(getLocation().href);
    var token = Math.random();
    _options.domain = domain;
    set('amplitude_test', token);
    var stored = get('amplitude_test');

    if (!stored || stored !== token) {
      domain = null;
    }

    remove('amplitude_test');
    _options.domain = domain;
    return _options;
  };

  var _domainSpecific = function _domainSpecific(name) {
    // differentiate between cookies on different domains
    var suffix = '';

    if (_options.domain) {
      suffix = _options.domain.charAt(0) === '.' ? _options.domain.substring(1) : _options.domain;
    }

    return name + suffix;
  };

  var get = function get(name) {
    var nameEq = _domainSpecific(name) + '=';
    var value = baseCookie.get(nameEq);

    try {
      if (value) {
        return JSON.parse(Base64.decode(value));
      }
    } catch (e) {
      return null;
    }

    return null;
  };

  var set = function set(name, value) {
    try {
      baseCookie.set(_domainSpecific(name), Base64.encode(JSON.stringify(value)), _options);
      return true;
    } catch (e) {
      return false;
    }
  };

  var setRaw = function setRaw(name, value) {
    try {
      baseCookie.set(_domainSpecific(name), value, _options);
      return true;
    } catch (e) {
      return false;
    }
  };

  var getRaw = function getRaw(name) {
    var nameEq = _domainSpecific(name) + '=';
    return baseCookie.get(nameEq);
  };

  var remove = function remove(name) {
    try {
      baseCookie.set(_domainSpecific(name), null, _options);
      return true;
    } catch (e) {
      return false;
    }
  };

  var Cookie = {
    reset: reset,
    options: options,
    get: get,
    set: set,
    remove: remove,
    setRaw: setRaw,
    getRaw: getRaw
  };

  var WorkerStorage =
  /*#__PURE__*/
  function () {
    function WorkerStorage() {
      _classCallCheck(this, WorkerStorage);

      this.map = new Map();
      this.length = 0;
    }

    _createClass(WorkerStorage, [{
      key: "key",
      value: function key(index) {
        var keys = Array.from(this.map.keys());
        var key = keys[index];
        return this.map.get(key);
      }
    }, {
      key: "getItem",
      value: function getItem(key) {
        return this.map.get(key);
      }
    }, {
      key: "setItem",
      value: function setItem(key, value) {
        if (!this.map.has(key)) {
          this.length += 1;
        }

        this.map.set(key, value);
      }
    }, {
      key: "removeItem",
      value: function removeItem(key) {
        if (this.map.has(key)) {
          this.length -= 1;
          this.map.delete(key);
        }
      }
    }, {
      key: "clear",
      value: function clear() {
        this.map.clear();
        this.length = 0;
      }
    }]);

    return WorkerStorage;
  }();

  /*
   * Implement localStorage to support Firefox 2-3 and IE 5-7
   */
  var localStorage;

  {
    // test that Window.localStorage is available and works
    var windowLocalStorageAvailable = function windowLocalStorageAvailable() {
      var uid = new Date();
      var result;

      try {
        GlobalScope.localStorage.setItem(uid, uid);
        result = GlobalScope.localStorage.getItem(uid) === String(uid);
        GlobalScope.localStorage.removeItem(uid);
        return result;
      } catch (e) {// localStorage not available
      }

      return false;
    };

    if (windowLocalStorageAvailable()) {
      localStorage = GlobalScope.localStorage;
    } else if (typeof GlobalScope !== 'undefined' && GlobalScope.globalStorage) {
      // Firefox 2-3 use globalStorage
      // See https://developer.mozilla.org/en/dom/storage#globalStorage
      try {
        localStorage = GlobalScope.globalStorage[GlobalScope.location.hostname];
      } catch (e) {// Something bad happened...
      }
    } else if (typeof document !== 'undefined') {
      // IE 5-7 use userData
      // See http://msdn.microsoft.com/en-us/library/ms531424(v=vs.85).aspx
      var div = document.createElement('div'),
          attrKey = 'localStorage';
      div.style.display = 'none';
      document.getElementsByTagName('head')[0].appendChild(div);

      if (div.addBehavior) {
        div.addBehavior('#default#userdata');
        localStorage = {
          length: 0,
          setItem: function setItem(k, v) {
            div.load(attrKey);

            if (!div.getAttribute(k)) {
              this.length++;
            }

            div.setAttribute(k, v);
            div.save(attrKey);
          },
          getItem: function getItem(k) {
            div.load(attrKey);
            return div.getAttribute(k);
          },
          removeItem: function removeItem(k) {
            div.load(attrKey);

            if (div.getAttribute(k)) {
              this.length--;
            }

            div.removeAttribute(k);
            div.save(attrKey);
          },
          clear: function clear() {
            div.load(attrKey);
            var i = 0;
            var attr;

            while (attr = div.XMLDocument.documentElement.attributes[i++]) {
              div.removeAttribute(attr.name);
            }

            div.save(attrKey);
            this.length = 0;
          },
          key: function key(k) {
            div.load(attrKey);
            return div.XMLDocument.documentElement.attributes[k];
          }
        };
        div.load(attrKey);
        localStorage.length = div.XMLDocument.documentElement.attributes.length;
      }
    } else if (utils.isWebWorkerEnvironment()) {
      // Web worker
      localStorage = new WorkerStorage();
    }

    if (!localStorage) {
      /* eslint-disable no-unused-vars */
      localStorage = {
        length: 0,
        setItem: function setItem(k, v) {},
        getItem: function getItem(k) {},
        removeItem: function removeItem(k) {},
        clear: function clear() {},
        key: function key(k) {}
      };
      /* eslint-enable no-unused-vars */
    }
  }

  var localStorage$1 = localStorage;

  /*
   * Abstraction layer for cookie storage.
   * Uses cookie if available, otherwise fallback to localstorage.
   */

  var cookieStorage = function cookieStorage() {
    this.storage = null;
  };

  cookieStorage.prototype.getStorage = function () {
    if (this.storage !== null) {
      return this.storage;
    }

    if (baseCookie.areCookiesEnabled()) {
      this.storage = Cookie;
    } else {
      // if cookies disabled, fallback to localstorage
      // note: localstorage does not persist across subdomains
      var keyPrefix = 'amp_cookiestore_';
      this.storage = {
        _options: {
          expirationDays: undefined,
          domain: undefined,
          secure: false
        },
        reset: function reset() {
          this._options = {
            expirationDays: undefined,
            domain: undefined,
            secure: false
          };
        },
        options: function options(opts) {
          if (arguments.length === 0) {
            return this._options;
          }

          opts = opts || {};
          this._options.expirationDays = opts.expirationDays || this._options.expirationDays; // localStorage is specific to subdomains

          this._options.domain = opts.domain || this._options.domain || GlobalScope && GlobalScope.location && GlobalScope.location.hostname;
          return this._options.secure = opts.secure || false;
        },
        get: function get(name) {
          try {
            return JSON.parse(localStorage$1.getItem(keyPrefix + name));
          } catch (e) {}
          /* eslint-disable-line no-empty */


          return null;
        },
        set: function set(name, value) {
          try {
            localStorage$1.setItem(keyPrefix + name, JSON.stringify(value));
            return true;
          } catch (e) {}
          /* eslint-disable-line no-empty */


          return false;
        },
        remove: function remove(name) {
          try {
            localStorage$1.removeItem(keyPrefix + name);
          } catch (e) {
            return false;
          }
        }
      };
    }

    return this.storage;
  };

  var _storageOptionExists;
  var storageOptionExists = (_storageOptionExists = {}, _defineProperty(_storageOptionExists, Constants.STORAGE_COOKIES, true), _defineProperty(_storageOptionExists, Constants.STORAGE_NONE, true), _defineProperty(_storageOptionExists, Constants.STORAGE_LOCAL, true), _defineProperty(_storageOptionExists, Constants.STORAGE_SESSION, true), _storageOptionExists);
  /**
   * MetadataStorage involves SDK data persistance
   * storage priority: cookies -> localStorage -> in memory
   * This priority can be overriden by setting the storage options.
   * if in localStorage, unable track users between subdomains
   * if in memory, then memory can't be shared between different tabs
   */

  var MetadataStorage =
  /*#__PURE__*/
  function () {
    function MetadataStorage(_ref) {
      var storageKey = _ref.storageKey,
          disableCookies = _ref.disableCookies,
          domain = _ref.domain,
          secure = _ref.secure,
          sameSite = _ref.sameSite,
          expirationDays = _ref.expirationDays,
          storage = _ref.storage;

      _classCallCheck(this, MetadataStorage);

      this.storageKey = storageKey;
      this.domain = domain;
      this.secure = secure;
      this.sameSite = sameSite;
      this.expirationDays = expirationDays;
      this.cookieDomain = '';
      var writableTopDomain = topDomain(getLocation().href);
      this.cookieDomain = domain || (writableTopDomain ? '.' + writableTopDomain : null);

      if (storageOptionExists[storage]) {
        this.storage = storage;
      } else {
        var disableCookieStorage = disableCookies || !baseCookie.areCookiesEnabled({
          domain: this.cookieDomain,
          secure: this.secure,
          sameSite: this.sameSite,
          expirationDays: this.expirationDays
        });

        if (disableCookieStorage) {
          this.storage = Constants.STORAGE_LOCAL;
        } else {
          this.storage = Constants.STORAGE_COOKIES;
        }
      }
    }

    _createClass(MetadataStorage, [{
      key: "getCookieStorageKey",
      value: function getCookieStorageKey() {
        if (!this.domain) {
          return this.storageKey;
        }

        var suffix = this.domain.charAt(0) === '.' ? this.domain.substring(1) : this.domain;
        return "".concat(this.storageKey).concat(suffix ? "_".concat(suffix) : '');
      }
      /*
       * Data is saved as delimited values rather than JSO to minimize cookie space
       * Should not change order of the items
       */

    }, {
      key: "save",
      value: function save(_ref2) {
        var deviceId = _ref2.deviceId,
            userId = _ref2.userId,
            optOut = _ref2.optOut,
            sessionId = _ref2.sessionId,
            lastEventTime = _ref2.lastEventTime,
            eventId = _ref2.eventId,
            identifyId = _ref2.identifyId,
            sequenceNumber = _ref2.sequenceNumber;

        if (this.storage === Constants.STORAGE_NONE) {
          return;
        }

        var value = [deviceId, Base64.encode(userId || ''), // used to convert not unicode to alphanumeric since cookies only use alphanumeric
        optOut ? '1' : '', sessionId ? sessionId.toString(32) : '0', // generated when instantiated, timestamp (but re-uses session id in cookie if not expired) @TODO clients may want custom session id
        lastEventTime ? lastEventTime.toString(32) : '0', // last time an event was set
        eventId ? eventId.toString(32) : '0', identifyId ? identifyId.toString(32) : '0', sequenceNumber ? sequenceNumber.toString(32) : '0'].join('.');

        switch (this.storage) {
          case Constants.STORAGE_SESSION:
            if (GlobalScope.sessionStorage) {
              GlobalScope.sessionStorage.setItem(this.storageKey, value);
            }

            break;

          case Constants.STORAGE_LOCAL:
            localStorage$1.setItem(this.storageKey, value);
            break;

          case Constants.STORAGE_COOKIES:
            this.saveCookie(value);
            break;
        }
      }
    }, {
      key: "saveCookie",
      value: function saveCookie(value) {
        baseCookie.set(this.getCookieStorageKey(), value, {
          domain: this.cookieDomain,
          secure: this.secure,
          sameSite: this.sameSite,
          expirationDays: this.expirationDays
        });
      }
    }, {
      key: "load",
      value: function load() {
        var _this = this;

        var str;

        if (this.storage === Constants.STORAGE_COOKIES) {
          var cookieKey = this.getCookieStorageKey() + '=';
          var allCookies = baseCookie.getAll(cookieKey);

          if (allCookies.length === 0 || allCookies.length === 1) {
            str = allCookies[0];
          } else {
            // dedup cookies by deleting them all and restoring
            // the one with the most recent event time
            var latestCookie = baseCookie.sortByEventTime(allCookies)[0];
            allCookies.forEach(function () {
              return baseCookie.set(_this.getCookieStorageKey(), null, {});
            });
            this.saveCookie(latestCookie);
            str = baseCookie.get(cookieKey);
          }
        }

        if (!str) {
          str = localStorage$1.getItem(this.storageKey);
        }

        if (!str) {
          try {
            str = GlobalScope.sessionStorage && GlobalScope.sessionStorage.getItem(this.storageKey);
          } catch (e) {
            utils.log.info("window.sessionStorage unavailable. Reason: \"".concat(e, "\""));
          }
        }

        if (!str) {
          return null;
        }

        var values = str.split('.');
        var userId = null;

        if (values[Constants.USER_ID_INDEX]) {
          try {
            userId = Base64.decode(values[Constants.USER_ID_INDEX]);
          } catch (e) {
            userId = null;
          }
        }

        return {
          deviceId: values[Constants.DEVICE_ID_INDEX],
          userId: userId,
          optOut: values[Constants.OPT_OUT_INDEX] === '1',
          sessionId: parseInt(values[Constants.SESSION_ID_INDEX], 32),
          lastEventTime: parseInt(values[Constants.LAST_EVENT_TIME_INDEX], 32),
          eventId: parseInt(values[Constants.EVENT_ID_INDEX], 32),
          identifyId: parseInt(values[Constants.IDENTIFY_ID_INDEX], 32),
          sequenceNumber: parseInt(values[Constants.SEQUENCE_NUMBER_INDEX], 32)
        };
      }
      /**
       * Clears any saved metadata storage
       * @constructor AmplitudeClient
       * @public
       * @return {boolean} True if metadata was cleared, false if none existed
       */

    }, {
      key: "clear",
      value: function clear() {
        var str;

        if (this.storage === Constants.STORAGE_COOKIES) {
          str = baseCookie.get(this.getCookieStorageKey() + '=');
          baseCookie.set(this.getCookieStorageKey(), null, {
            domain: this.cookieDomain,
            secure: this.secure,
            sameSite: this.sameSite,
            expirationDays: 0
          });
        }

        if (!str) {
          str = localStorage$1.getItem(this.storageKey);
          localStorage$1.clear();
        }

        if (!str) {
          try {
            str = GlobalScope.sessionStorage && GlobalScope.sessionStorage.getItem(this.storageKey);
            GlobalScope.sessionStorage.clear();
          } catch (e) {
            utils.log.info("window.sessionStorage unavailable. Reason: \"".concat(e, "\""));
          }
        }

        return !!str;
      }
    }]);

    return MetadataStorage;
  }();

  var getUtmData = function getUtmData(rawCookie, query) {
    // Translate the utmz cookie format into url query string format.
    var cookie = rawCookie ? '?' + rawCookie.split('.').slice(-1)[0].replace(/\|/g, '&') : '';

    var fetchParam = function fetchParam(queryName, query, cookieName, cookie) {
      return utils.getQueryParam(queryName, query) || utils.getQueryParam(cookieName, cookie);
    };

    var utmSource = fetchParam(Constants.UTM_SOURCE, query, 'utmcsr', cookie);
    var utmMedium = fetchParam(Constants.UTM_MEDIUM, query, 'utmcmd', cookie);
    var utmCampaign = fetchParam(Constants.UTM_CAMPAIGN, query, 'utmccn', cookie);
    var utmTerm = fetchParam(Constants.UTM_TERM, query, 'utmctr', cookie);
    var utmContent = fetchParam(Constants.UTM_CONTENT, query, 'utmcct', cookie);
    var utmData = {};

    var addIfNotNull = function addIfNotNull(key, value) {
      if (!utils.isEmptyString(value)) {
        utmData[key] = value;
      }
    };

    addIfNotNull(Constants.UTM_SOURCE, utmSource);
    addIfNotNull(Constants.UTM_MEDIUM, utmMedium);
    addIfNotNull(Constants.UTM_CAMPAIGN, utmCampaign);
    addIfNotNull(Constants.UTM_TERM, utmTerm);
    addIfNotNull(Constants.UTM_CONTENT, utmContent);
    return utmData;
  };

  /*
   * Wrapper for a user properties JSON object that supports operations.
   * Note: if a user property is used in multiple operations on the same Identify object,
   * only the first operation will be saved, and the rest will be ignored.
   */

  var AMP_OP_ADD = '$add';
  var AMP_OP_APPEND = '$append';
  var AMP_OP_CLEAR_ALL = '$clearAll';
  var AMP_OP_PREPEND = '$prepend';
  var AMP_OP_SET = '$set';
  var AMP_OP_SET_ONCE = '$setOnce';
  var AMP_OP_UNSET = '$unset';
  var AMP_OP_PREINSERT = '$preInsert';
  var AMP_OP_POSTINSERT = '$postInsert';
  var AMP_OP_REMOVE = '$remove';
  /**
   * Identify API - instance constructor. Identify objects are a wrapper for user property operations.
   * Each method adds a user property operation to the Identify object, and returns the same Identify object,
   * allowing you to chain multiple method calls together.
   * Note: if the same user property is used in multiple operations on a single Identify object,
   * only the first operation on that property will be saved, and the rest will be ignored.
   * @constructor Identify
   * @public
   * @example var identify = new amplitude.Identify();
   */

  var Identify = function Identify() {
    this.userPropertiesOperations = {};
    this.properties = []; // keep track of keys that have been added
  };
  /**
   * Increment a user property by a given value (can also be negative to decrement).
   * If the user property does not have a value set yet, it will be initialized to 0 before being incremented.
   * @public
   * @param {string} property - The user property key.
   * @param {number|string} value - The amount by which to increment the user property. Allows numbers as strings (ex: '123').
   * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
   * @example var identify = new amplitude.Identify().add('karma', 1).add('friends', 1);
   * amplitude.identify(identify); // send the Identify call
   */


  Identify.prototype.add = function (property, value) {
    if (type(value) === 'number' || type(value) === 'string') {
      this._addOperation(AMP_OP_ADD, property, value);
    } else {
      utils.log.error('Unsupported type for value: ' + type(value) + ', expecting number or string');
    }

    return this;
  };
  /**
   * Append a value or values to a user property.
   * If the user property does not have a value set yet,
   * it will be initialized to an empty list before the new values are appended.
   * If the user property has an existing value and it is not a list,
   * the existing value will be converted into a list with the new values appended.
   * @public
   * @param {string} property - The user property key.
   * @param {number|string|list|object} value - A value or values to append.
   * Values can be numbers, strings, lists, or object (key:value dict will be flattened).
   * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
   * @example var identify = new amplitude.Identify().append('ab-tests', 'new-user-tests');
   * identify.append('some_list', [1, 2, 3, 4, 'values']);
   * amplitude.identify(identify); // send the Identify call
   */


  Identify.prototype.append = function (property, value) {
    this._addOperation(AMP_OP_APPEND, property, value);

    return this;
  };
  /**
   * Clear all user properties for the current user.
   * SDK user should instead call amplitude.clearUserProperties() instead of using this.
   * $clearAll needs to be sent on its own Identify object. If there are already other operations, then don't add $clearAll.
   * If $clearAll already in an Identify object, don't allow other operations to be added.
   * @private
   */


  Identify.prototype.clearAll = function () {
    if (Object.keys(this.userPropertiesOperations).length > 0) {
      if (!Object.prototype.hasOwnProperty.call(this.userPropertiesOperations, AMP_OP_CLEAR_ALL)) {
        utils.log.error('Need to send $clearAll on its own Identify object without any other operations, skipping $clearAll');
      }

      return this;
    }

    this.userPropertiesOperations[AMP_OP_CLEAR_ALL] = '-';
    return this;
  };
  /**
   * Prepend a value or values to a user property.
   * Prepend means inserting the value or values at the front of a list.
   * If the user property does not have a value set yet,
   * it will be initialized to an empty list before the new values are prepended.
   * If the user property has an existing value and it is not a list,
   * the existing value will be converted into a list with the new values prepended.
   * @public
   * @param {string} property - The user property key.
   * @param {number|string|list|object} value - A value or values to prepend.
   * Values can be numbers, strings, lists, or object (key:value dict will be flattened).
   * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
   * @example var identify = new amplitude.Identify().prepend('ab-tests', 'new-user-tests');
   * identify.prepend('some_list', [1, 2, 3, 4, 'values']);
   * amplitude.identify(identify); // send the Identify call
   */


  Identify.prototype.prepend = function (property, value) {
    this._addOperation(AMP_OP_PREPEND, property, value);

    return this;
  };
  /**
   * Sets the value of a given user property. If a value already exists, it will be overwriten with the new value.
   * @public
   * @param {string} property - The user property key.
   * @param {number|string|list|boolean|object} value - A value or values to set.
   * Values can be numbers, strings, lists, or object (key:value dict will be flattened).
   * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
   * @example var identify = new amplitude.Identify().set('user_type', 'beta');
   * identify.set('name', {'first': 'John', 'last': 'Doe'}); // dict is flattened and becomes name.first: John, name.last: Doe
   * amplitude.identify(identify); // send the Identify call
   */


  Identify.prototype.set = function (property, value) {
    this._addOperation(AMP_OP_SET, property, value);

    return this;
  };
  /**
   * Sets the value of a given user property only once. Subsequent setOnce operations on that user property will be ignored;
   * however, that user property can still be modified through any of the other operations.
   * Useful for capturing properties such as 'initial_signup_date', 'initial_referrer', etc.
   * @public
   * @param {string} property - The user property key.
   * @param {number|string|list|boolean|object} value - A value or values to set once.
   * Values can be numbers, strings, lists, or object (key:value dict will be flattened).
   * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
   * @example var identify = new amplitude.Identify().setOnce('sign_up_date', '2016-04-01');
   * amplitude.identify(identify); // send the Identify call
   */


  Identify.prototype.setOnce = function (property, value) {
    this._addOperation(AMP_OP_SET_ONCE, property, value);

    return this;
  };
  /**
   * Unset and remove a user property. This user property will no longer show up in a user's profile.
   * @public
   * @param {string} property - The user property key.
   * @return {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
   * @example var identify = new amplitude.Identify().unset('user_type').unset('age');
   * amplitude.identify(identify); // send the Identify call
   */


  Identify.prototype.unset = function (property) {
    this._addOperation(AMP_OP_UNSET, property, '-');

    return this;
  };
  /**
   * Preinsert a value or values to a user property, if it does not exist in the user property already.
   * Preinsert means inserting the value or values to the beginning of the specified user property.
   * If the item already exists in the user property, it will be a no-op.
   * @public
   * @param {string} property - The user property key.
   * @param {number|string|list|object} value - A value or values to insert.
   * @returns {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
   */


  Identify.prototype.preInsert = function (property, value) {
    this._addOperation(AMP_OP_PREINSERT, property, value);

    return this;
  };
  /**
   * Postinsert a value or values to a user property, if it does not exist in the user property already.
   * Postinsert means inserting the value or values to the beginning of the specified user property.
   * If the item already exists in the user property, it will be a no-op.
   * @param {string} property - The user property key.
   * @param {number|string|list|object} value - A value or values to insert.
   * @returns {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
   */


  Identify.prototype.postInsert = function (property, value) {
    this._addOperation(AMP_OP_POSTINSERT, property, value);

    return this;
  };
  /**
   * Remove a value or values to a user property, if it does exist in the user property.
   * If the item does not exist in the user property, it will be a no-op.
   * @param {string} property - The user property key.
   * @param {number|string|list|object} value - A value or values to remove.
   * @returns {Identify} Returns the same Identify object, allowing you to chain multiple method calls together.
   */


  Identify.prototype.remove = function (property, value) {
    this._addOperation(AMP_OP_REMOVE, property, value);

    return this;
  };
  /**
   * Helper function that adds operation to the Identify's object
   * Handle's filtering of duplicate user property keys, and filtering for clearAll.
   * @private
   */


  Identify.prototype._addOperation = function (operation, property, value) {
    // check that the identify doesn't already contain a clearAll
    if (Object.prototype.hasOwnProperty.call(this.userPropertiesOperations, AMP_OP_CLEAR_ALL)) {
      utils.log.error('This identify already contains a $clearAll operation, skipping operation ' + operation);
      return;
    } // check that property wasn't already used in this Identify


    if (this.properties.indexOf(property) !== -1) {
      utils.log.error('User property "' + property + '" already used in this identify, skipping operation ' + operation);
      return;
    }

    if (!Object.prototype.hasOwnProperty.call(this.userPropertiesOperations, operation)) {
      this.userPropertiesOperations[operation] = {};
    }

    this.userPropertiesOperations[operation][property] = value;
    this.properties.push(property);
  };

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, basedir, module) {
  	return module = {
  		path: basedir,
  		exports: {},
  		require: function (path, base) {
  			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
  		}
  	}, fn(module, module.exports), module.exports;
  }

  function commonjsRequire () {
  	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
  }

  var md5 = createCommonjsModule(function (module) {
  (function ($) {

    /*
    * Add integers, wrapping at 2^32. This uses 16-bit operations internally
    * to work around bugs in some JS interpreters.
    */
    function safeAdd (x, y) {
      var lsw = (x & 0xffff) + (y & 0xffff);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xffff)
    }

    /*
    * Bitwise rotate a 32-bit number to the left.
    */
    function bitRotateLeft (num, cnt) {
      return (num << cnt) | (num >>> (32 - cnt))
    }

    /*
    * These functions implement the four basic operations the algorithm uses.
    */
    function md5cmn (q, a, b, x, s, t) {
      return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b)
    }
    function md5ff (a, b, c, d, x, s, t) {
      return md5cmn((b & c) | (~b & d), a, b, x, s, t)
    }
    function md5gg (a, b, c, d, x, s, t) {
      return md5cmn((b & d) | (c & ~d), a, b, x, s, t)
    }
    function md5hh (a, b, c, d, x, s, t) {
      return md5cmn(b ^ c ^ d, a, b, x, s, t)
    }
    function md5ii (a, b, c, d, x, s, t) {
      return md5cmn(c ^ (b | ~d), a, b, x, s, t)
    }

    /*
    * Calculate the MD5 of an array of little-endian words, and a bit length.
    */
    function binlMD5 (x, len) {
      /* append padding */
      x[len >> 5] |= 0x80 << (len % 32);
      x[((len + 64) >>> 9 << 4) + 14] = len;

      var i;
      var olda;
      var oldb;
      var oldc;
      var oldd;
      var a = 1732584193;
      var b = -271733879;
      var c = -1732584194;
      var d = 271733878;

      for (i = 0; i < x.length; i += 16) {
        olda = a;
        oldb = b;
        oldc = c;
        oldd = d;

        a = md5ff(a, b, c, d, x[i], 7, -680876936);
        d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
        c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
        b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
        a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
        d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
        c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
        b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
        a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
        d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
        c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
        b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
        a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
        d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
        c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
        b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);

        a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
        d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
        c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
        b = md5gg(b, c, d, a, x[i], 20, -373897302);
        a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
        d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
        c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
        b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
        a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
        d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
        c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
        b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
        a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
        d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
        c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
        b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);

        a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
        d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
        c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
        b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
        a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
        d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
        c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
        b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
        a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
        d = md5hh(d, a, b, c, x[i], 11, -358537222);
        c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
        b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
        a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
        d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
        c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
        b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);

        a = md5ii(a, b, c, d, x[i], 6, -198630844);
        d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
        c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
        b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
        a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
        d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
        c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
        b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
        a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
        d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
        c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
        b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
        a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
        d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
        c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
        b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);

        a = safeAdd(a, olda);
        b = safeAdd(b, oldb);
        c = safeAdd(c, oldc);
        d = safeAdd(d, oldd);
      }
      return [a, b, c, d]
    }

    /*
    * Convert an array of little-endian words to a string
    */
    function binl2rstr (input) {
      var i;
      var output = '';
      var length32 = input.length * 32;
      for (i = 0; i < length32; i += 8) {
        output += String.fromCharCode((input[i >> 5] >>> (i % 32)) & 0xff);
      }
      return output
    }

    /*
    * Convert a raw string to an array of little-endian words
    * Characters >255 have their high-byte silently ignored.
    */
    function rstr2binl (input) {
      var i;
      var output = [];
      output[(input.length >> 2) - 1] = undefined;
      for (i = 0; i < output.length; i += 1) {
        output[i] = 0;
      }
      var length8 = input.length * 8;
      for (i = 0; i < length8; i += 8) {
        output[i >> 5] |= (input.charCodeAt(i / 8) & 0xff) << (i % 32);
      }
      return output
    }

    /*
    * Calculate the MD5 of a raw string
    */
    function rstrMD5 (s) {
      return binl2rstr(binlMD5(rstr2binl(s), s.length * 8))
    }

    /*
    * Calculate the HMAC-MD5, of a key and some data (raw strings)
    */
    function rstrHMACMD5 (key, data) {
      var i;
      var bkey = rstr2binl(key);
      var ipad = [];
      var opad = [];
      var hash;
      ipad[15] = opad[15] = undefined;
      if (bkey.length > 16) {
        bkey = binlMD5(bkey, key.length * 8);
      }
      for (i = 0; i < 16; i += 1) {
        ipad[i] = bkey[i] ^ 0x36363636;
        opad[i] = bkey[i] ^ 0x5c5c5c5c;
      }
      hash = binlMD5(ipad.concat(rstr2binl(data)), 512 + data.length * 8);
      return binl2rstr(binlMD5(opad.concat(hash), 512 + 128))
    }

    /*
    * Convert a raw string to a hex string
    */
    function rstr2hex (input) {
      var hexTab = '0123456789abcdef';
      var output = '';
      var x;
      var i;
      for (i = 0; i < input.length; i += 1) {
        x = input.charCodeAt(i);
        output += hexTab.charAt((x >>> 4) & 0x0f) + hexTab.charAt(x & 0x0f);
      }
      return output
    }

    /*
    * Encode a string as utf-8
    */
    function str2rstrUTF8 (input) {
      return unescape(encodeURIComponent(input))
    }

    /*
    * Take string arguments and return either raw or hex encoded strings
    */
    function rawMD5 (s) {
      return rstrMD5(str2rstrUTF8(s))
    }
    function hexMD5 (s) {
      return rstr2hex(rawMD5(s))
    }
    function rawHMACMD5 (k, d) {
      return rstrHMACMD5(str2rstrUTF8(k), str2rstrUTF8(d))
    }
    function hexHMACMD5 (k, d) {
      return rstr2hex(rawHMACMD5(k, d))
    }

    function md5 (string, key, raw) {
      if (!key) {
        if (!raw) {
          return hexMD5(string)
        }
        return rawMD5(string)
      }
      if (!raw) {
        return hexHMACMD5(key, string)
      }
      return rawHMACMD5(key, string)
    }

    if (module.exports) {
      module.exports = md5;
    } else {
      $.md5 = md5;
    }
  })(commonjsGlobal);
  });

  var strictUriEncode = function (str) {
  	return encodeURIComponent(str).replace(/[!'()*]/g, function (c) {
  		return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  	});
  };

  /*
  object-assign
  (c) Sindre Sorhus
  @license MIT
  */
  /* eslint-disable no-unused-vars */
  var getOwnPropertySymbols = Object.getOwnPropertySymbols;
  var hasOwnProperty = Object.prototype.hasOwnProperty;
  var propIsEnumerable = Object.prototype.propertyIsEnumerable;

  function toObject(val) {
  	if (val === null || val === undefined) {
  		throw new TypeError('Object.assign cannot be called with null or undefined');
  	}

  	return Object(val);
  }

  function shouldUseNative() {
  	try {
  		if (!Object.assign) {
  			return false;
  		}

  		// Detect buggy property enumeration order in older V8 versions.

  		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
  		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
  		test1[5] = 'de';
  		if (Object.getOwnPropertyNames(test1)[0] === '5') {
  			return false;
  		}

  		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
  		var test2 = {};
  		for (var i = 0; i < 10; i++) {
  			test2['_' + String.fromCharCode(i)] = i;
  		}
  		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
  			return test2[n];
  		});
  		if (order2.join('') !== '0123456789') {
  			return false;
  		}

  		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
  		var test3 = {};
  		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
  			test3[letter] = letter;
  		});
  		if (Object.keys(Object.assign({}, test3)).join('') !==
  				'abcdefghijklmnopqrst') {
  			return false;
  		}

  		return true;
  	} catch (err) {
  		// We don't expect any of the above to throw, but better to be safe.
  		return false;
  	}
  }

  var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
  	var from;
  	var to = toObject(target);
  	var symbols;

  	for (var s = 1; s < arguments.length; s++) {
  		from = Object(arguments[s]);

  		for (var key in from) {
  			if (hasOwnProperty.call(from, key)) {
  				to[key] = from[key];
  			}
  		}

  		if (getOwnPropertySymbols) {
  			symbols = getOwnPropertySymbols(from);
  			for (var i = 0; i < symbols.length; i++) {
  				if (propIsEnumerable.call(from, symbols[i])) {
  					to[symbols[i]] = from[symbols[i]];
  				}
  			}
  		}
  	}

  	return to;
  };

  var token = '%[a-f0-9]{2}';
  var singleMatcher = new RegExp(token, 'gi');
  var multiMatcher = new RegExp('(' + token + ')+', 'gi');

  function decodeComponents(components, split) {
  	try {
  		// Try to decode the entire string first
  		return decodeURIComponent(components.join(''));
  	} catch (err) {
  		// Do nothing
  	}

  	if (components.length === 1) {
  		return components;
  	}

  	split = split || 1;

  	// Split the array in 2 parts
  	var left = components.slice(0, split);
  	var right = components.slice(split);

  	return Array.prototype.concat.call([], decodeComponents(left), decodeComponents(right));
  }

  function decode(input) {
  	try {
  		return decodeURIComponent(input);
  	} catch (err) {
  		var tokens = input.match(singleMatcher);

  		for (var i = 1; i < tokens.length; i++) {
  			input = decodeComponents(tokens, i).join('');

  			tokens = input.match(singleMatcher);
  		}

  		return input;
  	}
  }

  function customDecodeURIComponent(input) {
  	// Keep track of all the replacements and prefill the map with the `BOM`
  	var replaceMap = {
  		'%FE%FF': '\uFFFD\uFFFD',
  		'%FF%FE': '\uFFFD\uFFFD'
  	};

  	var match = multiMatcher.exec(input);
  	while (match) {
  		try {
  			// Decode as big chunks as possible
  			replaceMap[match[0]] = decodeURIComponent(match[0]);
  		} catch (err) {
  			var result = decode(match[0]);

  			if (result !== match[0]) {
  				replaceMap[match[0]] = result;
  			}
  		}

  		match = multiMatcher.exec(input);
  	}

  	// Add `%C2` at the end of the map to make sure it does not replace the combinator before everything else
  	replaceMap['%C2'] = '\uFFFD';

  	var entries = Object.keys(replaceMap);

  	for (var i = 0; i < entries.length; i++) {
  		// Replace all decoded components
  		var key = entries[i];
  		input = input.replace(new RegExp(key, 'g'), replaceMap[key]);
  	}

  	return input;
  }

  var decodeUriComponent = function (encodedURI) {
  	if (typeof encodedURI !== 'string') {
  		throw new TypeError('Expected `encodedURI` to be of type `string`, got `' + typeof encodedURI + '`');
  	}

  	try {
  		encodedURI = encodedURI.replace(/\+/g, ' ');

  		// Try the built in decoder first
  		return decodeURIComponent(encodedURI);
  	} catch (err) {
  		// Fallback to a more advanced decoder
  		return customDecodeURIComponent(encodedURI);
  	}
  };

  function encoderForArrayFormat(opts) {
  	switch (opts.arrayFormat) {
  		case 'index':
  			return function (key, value, index) {
  				return value === null ? [
  					encode(key, opts),
  					'[',
  					index,
  					']'
  				].join('') : [
  					encode(key, opts),
  					'[',
  					encode(index, opts),
  					']=',
  					encode(value, opts)
  				].join('');
  			};

  		case 'bracket':
  			return function (key, value) {
  				return value === null ? encode(key, opts) : [
  					encode(key, opts),
  					'[]=',
  					encode(value, opts)
  				].join('');
  			};

  		default:
  			return function (key, value) {
  				return value === null ? encode(key, opts) : [
  					encode(key, opts),
  					'=',
  					encode(value, opts)
  				].join('');
  			};
  	}
  }

  function parserForArrayFormat(opts) {
  	var result;

  	switch (opts.arrayFormat) {
  		case 'index':
  			return function (key, value, accumulator) {
  				result = /\[(\d*)\]$/.exec(key);

  				key = key.replace(/\[\d*\]$/, '');

  				if (!result) {
  					accumulator[key] = value;
  					return;
  				}

  				if (accumulator[key] === undefined) {
  					accumulator[key] = {};
  				}

  				accumulator[key][result[1]] = value;
  			};

  		case 'bracket':
  			return function (key, value, accumulator) {
  				result = /(\[\])$/.exec(key);
  				key = key.replace(/\[\]$/, '');

  				if (!result) {
  					accumulator[key] = value;
  					return;
  				} else if (accumulator[key] === undefined) {
  					accumulator[key] = [value];
  					return;
  				}

  				accumulator[key] = [].concat(accumulator[key], value);
  			};

  		default:
  			return function (key, value, accumulator) {
  				if (accumulator[key] === undefined) {
  					accumulator[key] = value;
  					return;
  				}

  				accumulator[key] = [].concat(accumulator[key], value);
  			};
  	}
  }

  function encode(value, opts) {
  	if (opts.encode) {
  		return opts.strict ? strictUriEncode(value) : encodeURIComponent(value);
  	}

  	return value;
  }

  function keysSorter(input) {
  	if (Array.isArray(input)) {
  		return input.sort();
  	} else if (typeof input === 'object') {
  		return keysSorter(Object.keys(input)).sort(function (a, b) {
  			return Number(a) - Number(b);
  		}).map(function (key) {
  			return input[key];
  		});
  	}

  	return input;
  }

  function extract(str) {
  	var queryStart = str.indexOf('?');
  	if (queryStart === -1) {
  		return '';
  	}
  	return str.slice(queryStart + 1);
  }

  function parse(str, opts) {
  	opts = objectAssign({arrayFormat: 'none'}, opts);

  	var formatter = parserForArrayFormat(opts);

  	// Create an object with no prototype
  	// https://github.com/sindresorhus/query-string/issues/47
  	var ret = Object.create(null);

  	if (typeof str !== 'string') {
  		return ret;
  	}

  	str = str.trim().replace(/^[?#&]/, '');

  	if (!str) {
  		return ret;
  	}

  	str.split('&').forEach(function (param) {
  		var parts = param.replace(/\+/g, ' ').split('=');
  		// Firefox (pre 40) decodes `%3D` to `=`
  		// https://github.com/sindresorhus/query-string/pull/37
  		var key = parts.shift();
  		var val = parts.length > 0 ? parts.join('=') : undefined;

  		// missing `=` should be `null`:
  		// http://w3.org/TR/2012/WD-url-20120524/#collect-url-parameters
  		val = val === undefined ? null : decodeUriComponent(val);

  		formatter(decodeUriComponent(key), val, ret);
  	});

  	return Object.keys(ret).sort().reduce(function (result, key) {
  		var val = ret[key];
  		if (Boolean(val) && typeof val === 'object' && !Array.isArray(val)) {
  			// Sort object keys, not values
  			result[key] = keysSorter(val);
  		} else {
  			result[key] = val;
  		}

  		return result;
  	}, Object.create(null));
  }

  var extract_1 = extract;
  var parse_1 = parse;

  var stringify = function (obj, opts) {
  	var defaults = {
  		encode: true,
  		strict: true,
  		arrayFormat: 'none'
  	};

  	opts = objectAssign(defaults, opts);

  	if (opts.sort === false) {
  		opts.sort = function () {};
  	}

  	var formatter = encoderForArrayFormat(opts);

  	return obj ? Object.keys(obj).sort(opts.sort).map(function (key) {
  		var val = obj[key];

  		if (val === undefined) {
  			return '';
  		}

  		if (val === null) {
  			return encode(key, opts);
  		}

  		if (Array.isArray(val)) {
  			var result = [];

  			val.slice().forEach(function (val2) {
  				if (val2 === undefined) {
  					return;
  				}

  				result.push(formatter(key, val2, result.length));
  			});

  			return result.join('&');
  		}

  		return encode(key, opts) + '=' + encode(val, opts);
  	}).filter(function (x) {
  		return x.length > 0;
  	}).join('&') : '';
  };

  var parseUrl = function (str, opts) {
  	return {
  		url: str.split('?')[0] || '',
  		query: parse(extract(str), opts)
  	};
  };

  var queryString = {
  	extract: extract_1,
  	parse: parse_1,
  	stringify: stringify,
  	parseUrl: parseUrl
  };

  /*
   * Simple AJAX request object
   */

  var Request = function Request(url, data, headers) {
    this.url = url;
    this.data = data || {};
    this.headers = headers;
  };

  var CORS_HEADER = 'Cross-Origin-Resource-Policy';

  function setHeaders(xhr, headers) {
    for (var header in headers) {
      if (header === CORS_HEADER && !headers[header]) {
        continue;
      }

      xhr.setRequestHeader(header, headers[header]);
    }
  }

  Request.prototype.send = function (callback) {
    var isIE = GlobalScope.XDomainRequest ? true : false;

    if (isIE) {
      var xdr = new GlobalScope.XDomainRequest();
      xdr.open('POST', this.url, true);

      xdr.onload = function () {
        callback(200, xdr.responseText);
      };

      xdr.onerror = function () {
        // status code not available from xdr, try string matching on responseText
        if (xdr.responseText === 'Request Entity Too Large') {
          callback(413, xdr.responseText);
        } else {
          callback(500, xdr.responseText);
        }
      };

      xdr.ontimeout = function () {};

      xdr.onprogress = function () {};

      xdr.send(queryString.stringify(this.data));
    } else if (typeof XMLHttpRequest !== 'undefined') {
      var xhr = new XMLHttpRequest();
      xhr.open('POST', this.url, true);

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          callback(xhr.status, xhr.responseText);
        }
      };

      setHeaders(xhr, this.headers);
      xhr.send(queryString.stringify(this.data));
    } else {
      var responseStatus = undefined;
      fetch(this.url, {
        method: 'POST',
        headers: this.headers,
        body: queryString.stringify(this.data)
      }).then(function (response) {
        responseStatus = response.status;
        return response.text();
      }).then(function (responseText) {
        callback(responseStatus, responseText);
      });
    } //log('sent request to ' + this.url + ' with data ' + decodeURIComponent(queryString(this.data)));

  };

  /**
   * Revenue API - instance constructor. Wrapper for logging Revenue data. Revenue objects get passed to amplitude.logRevenueV2 to send to Amplitude servers.
   * Each method updates a revenue property in the Revenue object, and returns the same Revenue object,
   * allowing you to chain multiple method calls together.
   *
   * Note: price is a required field to log revenue events.
   * If quantity is not specified then defaults to 1.
   * @constructor Revenue
   * @public
   * @example var revenue = new amplitude.Revenue();
   */

  var Revenue = function Revenue() {
    // required fields
    this._price = null; // optional fields

    this._productId = null;
    this._quantity = 1;
    this._revenueType = null;
    this._properties = null;
  };
  /**
   * Set a value for the product identifer.
   * @public
   * @param {string} productId - The value for the product identifier. Empty and invalid strings are ignored.
   * @return {Revenue} Returns the same Revenue object, allowing you to chain multiple method calls together.
   * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99);
   * amplitude.logRevenueV2(revenue);
   */


  Revenue.prototype.setProductId = function setProductId(productId) {
    if (type(productId) !== 'string') {
      utils.log.error('Unsupported type for productId: ' + type(productId) + ', expecting string');
    } else if (utils.isEmptyString(productId)) {
      utils.log.error('Invalid empty productId');
    } else {
      this._productId = productId;
    }

    return this;
  };
  /**
   * Set a value for the quantity. Note revenue amount is calculated as price * quantity.
   * @public
   * @param {number} quantity - Integer value for the quantity. If not set, quantity defaults to 1.
   * @return {Revenue} Returns the same Revenue object, allowing you to chain multiple method calls together.
   * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99).setQuantity(5);
   * amplitude.logRevenueV2(revenue);
   */


  Revenue.prototype.setQuantity = function setQuantity(quantity) {
    if (type(quantity) !== 'number') {
      utils.log.error('Unsupported type for quantity: ' + type(quantity) + ', expecting number');
    } else {
      this._quantity = parseInt(quantity);
    }

    return this;
  };
  /**
   * Set a value for the price. This field is required for all revenue being logged.
   *
   * Note: revenue amount is calculated as price * quantity.
   * @public
   * @param {number} price - Double value for the quantity.
   * @return {Revenue} Returns the same Revenue object, allowing you to chain multiple method calls together.
   * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99);
   * amplitude.logRevenueV2(revenue);
   */


  Revenue.prototype.setPrice = function setPrice(price) {
    if (type(price) !== 'number') {
      utils.log.error('Unsupported type for price: ' + type(price) + ', expecting number');
    } else {
      this._price = price;
    }

    return this;
  };
  /**
   * Set a value for the revenueType (for example purchase, cost, tax, refund, etc).
   * @public
   * @param {string} revenueType - RevenueType to designate.
   * @return {Revenue} Returns the same Revenue object, allowing you to chain multiple method calls together.
   * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99).setRevenueType('purchase');
   * amplitude.logRevenueV2(revenue);
   */


  Revenue.prototype.setRevenueType = function setRevenueType(revenueType) {
    if (type(revenueType) !== 'string') {
      utils.log.error('Unsupported type for revenueType: ' + type(revenueType) + ', expecting string');
    } else {
      this._revenueType = revenueType;
    }

    return this;
  };
  /**
   * Set event properties for the revenue event.
   * @public
   * @param {object} eventProperties - Revenue event properties to set.
   * @return {Revenue} Returns the same Revenue object, allowing you to chain multiple method calls together.
   * @example var event_properties = {'city': 'San Francisco'};
   * var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99).setEventProperties(event_properties);
   * amplitude.logRevenueV2(revenue);
   */


  Revenue.prototype.setEventProperties = function setEventProperties(eventProperties) {
    if (type(eventProperties) !== 'object') {
      utils.log.error('Unsupported type for eventProperties: ' + type(eventProperties) + ', expecting object');
    } else {
      this._properties = utils.validateProperties(eventProperties);
    }

    return this;
  };
  /**
   * @private
   */


  Revenue.prototype._isValidRevenue = function _isValidRevenue() {
    if (type(this._price) !== 'number') {
      utils.log.error('Invalid revenue, need to set price field');
      return false;
    }

    return true;
  };
  /**
   * @private
   */


  Revenue.prototype._toJSONObject = function _toJSONObject() {
    var obj = type(this._properties) === 'object' ? this._properties : {};

    if (this._productId !== null) {
      obj[Constants.REVENUE_PRODUCT_ID] = this._productId;
    }

    if (this._quantity !== null) {
      obj[Constants.REVENUE_QUANTITY] = this._quantity;
    }

    if (this._price !== null) {
      obj[Constants.REVENUE_PRICE] = this._price;
    }

    if (this._revenueType !== null) {
      obj[Constants.REVENUE_REVENUE_TYPE] = this._revenueType;
    }

    return obj;
  };

  var uaParser = createCommonjsModule(function (module, exports) {
  /////////////////////////////////////////////////////////////////////////////////
  /* UAParser.js v0.7.28
     Copyright © 2012-2021 Faisal Salman <f@faisalman.com>
     MIT License *//*
     Detect Browser, Engine, OS, CPU, and Device type/model from User-Agent data.
     Supports browser & node.js environment.
     Demo   : https://faisalman.github.io/ua-parser-js
     Source : https://github.com/faisalman/ua-parser-js */
  /////////////////////////////////////////////////////////////////////////////////

  (function (window, undefined$1) {

      //////////////
      // Constants
      /////////////


      var LIBVERSION  = '0.7.28',
          EMPTY       = '',
          UNKNOWN     = '?',
          FUNC_TYPE   = 'function',
          UNDEF_TYPE  = 'undefined',
          OBJ_TYPE    = 'object',
          STR_TYPE    = 'string',
          MAJOR       = 'major',
          MODEL       = 'model',
          NAME        = 'name',
          TYPE        = 'type',
          VENDOR      = 'vendor',
          VERSION     = 'version',
          ARCHITECTURE= 'architecture',
          CONSOLE     = 'console',
          MOBILE      = 'mobile',
          TABLET      = 'tablet',
          SMARTTV     = 'smarttv',
          WEARABLE    = 'wearable',
          EMBEDDED    = 'embedded',
          UA_MAX_LENGTH = 255;

      var AMAZON  = 'Amazon',
          APPLE   = 'Apple',
          ASUS    = 'ASUS',
          BLACKBERRY = 'BlackBerry',
          BROWSER = 'Browser',
          CHROME  = 'Chrome',
          EDGE    = 'Edge',
          FIREFOX = 'Firefox',
          GOOGLE  = 'Google',
          HUAWEI  = 'Huawei',
          LG      = 'LG',
          MICROSOFT = 'Microsoft',
          MOTOROLA  = 'Motorola',
          OPERA   = 'Opera',
          SAMSUNG = 'Samsung',
          SONY    = 'Sony',
          XIAOMI  = 'Xiaomi',
          ZEBRA   = 'Zebra';

      ///////////
      // Helper
      //////////

      var extend = function (regexes, extensions) {
              var mergedRegexes = {};
              for (var i in regexes) {
                  if (extensions[i] && extensions[i].length % 2 === 0) {
                      mergedRegexes[i] = extensions[i].concat(regexes[i]);
                  } else {
                      mergedRegexes[i] = regexes[i];
                  }
              }
              return mergedRegexes;
          },
          enumerize = function (arr) {
              var enums = {};
              for (var i = 0; i < arr.length; i++) {
                  enums[arr[i].toUpperCase()] = arr[i];
              }
              return enums;
          },
          has = function (str1, str2) {
              return typeof str1 === STR_TYPE ? lowerize(str2).indexOf(lowerize(str1)) !== -1 : false;
          },
          lowerize = function (str) {
              return str.toLowerCase();
          },
          majorize = function (version) {
              return typeof(version) === STR_TYPE ? version.replace(/[^\d\.]/g, EMPTY).split('.')[0] : undefined$1;
          },
          trim = function (str, len) {
              if (typeof(str) === STR_TYPE) {
                  str = str.replace(/^\s+|\s+$/g, EMPTY);
                  return typeof(len) === UNDEF_TYPE ? str : str.substring(0, UA_MAX_LENGTH);
              }
      };

      ///////////////
      // Map helper
      //////////////

      var rgxMapper = function (ua, arrays) {

              var i = 0, j, k, p, q, matches, match;

              // loop through all regexes maps
              while (i < arrays.length && !matches) {

                  var regex = arrays[i],       // even sequence (0,2,4,..)
                      props = arrays[i + 1];   // odd sequence (1,3,5,..)
                  j = k = 0;

                  // try matching uastring with regexes
                  while (j < regex.length && !matches) {

                      matches = regex[j++].exec(ua);

                      if (!!matches) {
                          for (p = 0; p < props.length; p++) {
                              match = matches[++k];
                              q = props[p];
                              // check if given property is actually array
                              if (typeof q === OBJ_TYPE && q.length > 0) {
                                  if (q.length == 2) {
                                      if (typeof q[1] == FUNC_TYPE) {
                                          // assign modified match
                                          this[q[0]] = q[1].call(this, match);
                                      } else {
                                          // assign given value, ignore regex match
                                          this[q[0]] = q[1];
                                      }
                                  } else if (q.length == 3) {
                                      // check whether function or regex
                                      if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
                                          // call function (usually string mapper)
                                          this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined$1;
                                      } else {
                                          // sanitize match using given regex
                                          this[q[0]] = match ? match.replace(q[1], q[2]) : undefined$1;
                                      }
                                  } else if (q.length == 4) {
                                          this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined$1;
                                  }
                              } else {
                                  this[q] = match ? match : undefined$1;
                              }
                          }
                      }
                  }
                  i += 2;
              }
          },

          strMapper = function (str, map) {

              for (var i in map) {
                  // check if current value is array
                  if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
                      for (var j = 0; j < map[i].length; j++) {
                          if (has(map[i][j], str)) {
                              return (i === UNKNOWN) ? undefined$1 : i;
                          }
                      }
                  } else if (has(map[i], str)) {
                      return (i === UNKNOWN) ? undefined$1 : i;
                  }
              }
              return str;
      };

      ///////////////
      // String map
      //////////////

      // Safari < 3.0
      var oldSafariMap = {
              '1.0'   : '/8',
              '1.2'   : '/1',
              '1.3'   : '/3',
              '2.0'   : '/412',
              '2.0.2' : '/416',
              '2.0.3' : '/417',
              '2.0.4' : '/419',
              '?'     : '/'
          },
          windowsVersionMap = {
              'ME'        : '4.90',
              'NT 3.11'   : 'NT3.51',
              'NT 4.0'    : 'NT4.0',
              '2000'      : 'NT 5.0',
              'XP'        : ['NT 5.1', 'NT 5.2'],
              'Vista'     : 'NT 6.0',
              '7'         : 'NT 6.1',
              '8'         : 'NT 6.2',
              '8.1'       : 'NT 6.3',
              '10'        : ['NT 6.4', 'NT 10.0'],
              'RT'        : 'ARM'
      };

      //////////////
      // Regex map
      /////////////

      var regexes = {

          browser : [[

              /\b(?:crmo|crios)\/([\w\.]+)/i                                      // Chrome for Android/iOS
              ], [VERSION, [NAME, 'Chrome']], [
              /edg(?:e|ios|a)?\/([\w\.]+)/i                                       // Microsoft Edge
              ], [VERSION, [NAME, 'Edge']], [

              // Presto based
              /(opera mini)\/([-\w\.]+)/i,                                        // Opera Mini
              /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i,                 // Opera Mobi/Tablet
              /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i                           // Opera
              ], [NAME, VERSION], [
              /opios[\/ ]+([\w\.]+)/i                                             // Opera mini on iphone >= 8.0
              ], [VERSION, [NAME, OPERA+' Mini']], [
              /\bopr\/([\w\.]+)/i                                                 // Opera Webkit
              ], [VERSION, [NAME, OPERA]], [

              // Mixed
              /(kindle)\/([\w\.]+)/i,                                             // Kindle
              /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i,      // Lunascape/Maxthon/Netfront/Jasmine/Blazer
              // Trident based
              /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i,               // Avant/IEMobile/SlimBrowser
              /(ba?idubrowser)[\/ ]?([\w\.]+)/i,                                  // Baidu Browser
              /(?:ms|\()(ie) ([\w\.]+)/i,                                         // Internet Explorer

              // Webkit/KHTML based                                               // Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon
              /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale|qqbrowserlite|qq)\/([-\w\.]+)/i,
                                                                                  // Rekonq/Puffin/Brave/Whale/QQBrowserLite/QQ, aka ShouQ
              /(weibo)__([\d\.]+)/i                                               // Weibo
              ], [NAME, VERSION], [
              /(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i                 // UCBrowser
              ], [VERSION, [NAME, 'UC'+BROWSER]], [
              /\bqbcore\/([\w\.]+)/i                                              // WeChat Desktop for Windows Built-in Browser
              ], [VERSION, [NAME, 'WeChat(Win) Desktop']], [
              /micromessenger\/([\w\.]+)/i                                        // WeChat
              ], [VERSION, [NAME, 'WeChat']], [
              /konqueror\/([\w\.]+)/i                                             // Konqueror
              ], [VERSION, [NAME, 'Konqueror']], [
              /trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i                       // IE11
              ], [VERSION, [NAME, 'IE']], [
              /yabrowser\/([\w\.]+)/i                                             // Yandex
              ], [VERSION, [NAME, 'Yandex']], [
              /(avast|avg)\/([\w\.]+)/i                                           // Avast/AVG Secure Browser
              ], [[NAME, /(.+)/, '$1 Secure '+BROWSER], VERSION], [
              /\bfocus\/([\w\.]+)/i                                               // Firefox Focus
              ], [VERSION, [NAME, FIREFOX+' Focus']], [
              /\bopt\/([\w\.]+)/i                                                 // Opera Touch
              ], [VERSION, [NAME, OPERA+' Touch']], [
              /coc_coc\w+\/([\w\.]+)/i                                            // Coc Coc Browser
              ], [VERSION, [NAME, 'Coc Coc']], [
              /dolfin\/([\w\.]+)/i                                                // Dolphin
              ], [VERSION, [NAME, 'Dolphin']], [
              /coast\/([\w\.]+)/i                                                 // Opera Coast
              ], [VERSION, [NAME, OPERA+' Coast']], [
              /miuibrowser\/([\w\.]+)/i                                           // MIUI Browser
              ], [VERSION, [NAME, 'MIUI '+BROWSER]], [
              /fxios\/([-\w\.]+)/i                                                // Firefox for iOS
              ], [VERSION, [NAME, FIREFOX]], [
              /\bqihu|(qi?ho?o?|360)browser/i                                     // 360
              ], [[NAME, '360 '+BROWSER]], [
              /(oculus|samsung|sailfish)browser\/([\w\.]+)/i
              ], [[NAME, /(.+)/, '$1 '+BROWSER], VERSION], [                      // Oculus/Samsung/Sailfish Browser
              /(comodo_dragon)\/([\w\.]+)/i                                       // Comodo Dragon
              ], [[NAME, /_/g, ' '], VERSION], [
              /(electron)\/([\w\.]+) safari/i,                                    // Electron-based App
              /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i,                   // Tesla
              /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i            // QQBrowser/Baidu App/2345 Browser
              ], [NAME, VERSION], [
              /(metasr)[\/ ]?([\w\.]+)/i,                                         // SouGouBrowser
              /(lbbrowser)/i                                                      // LieBao Browser
              ], [NAME], [

              // WebView
              /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i       // Facebook App for iOS & Android
              ], [[NAME, 'Facebook'], VERSION], [
              /safari (line)\/([\w\.]+)/i,                                        // Line App for iOS
              /\b(line)\/([\w\.]+)\/iab/i,                                        // Line App for Android
              /(chromium|instagram)[\/ ]([-\w\.]+)/i                              // Chromium/Instagram
              ], [NAME, VERSION], [
              /\bgsa\/([\w\.]+) .*safari\//i                                      // Google Search Appliance on iOS
              ], [VERSION, [NAME, 'GSA']], [

              /headlesschrome(?:\/([\w\.]+)| )/i                                  // Chrome Headless
              ], [VERSION, [NAME, CHROME+' Headless']], [

              / wv\).+(chrome)\/([\w\.]+)/i                                       // Chrome WebView
              ], [[NAME, CHROME+' WebView'], VERSION], [

              /droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i           // Android Browser
              ], [VERSION, [NAME, 'Android '+BROWSER]], [

              /(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i       // Chrome/OmniWeb/Arora/Tizen/Nokia
              ], [NAME, VERSION], [

              /version\/([\w\.]+) .*mobile\/\w+ (safari)/i                        // Mobile Safari
              ], [VERSION, [NAME, 'Mobile Safari']], [
              /version\/([\w\.]+) .*(mobile ?safari|safari)/i                     // Safari & Safari Mobile
              ], [VERSION, NAME], [
              /webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i                      // Safari < 3.0
              ], [NAME, [VERSION, strMapper, oldSafariMap]], [

              /(webkit|khtml)\/([\w\.]+)/i
              ], [NAME, VERSION], [

              // Gecko based
              /(navigator|netscape\d?)\/([-\w\.]+)/i                              // Netscape
              ], [[NAME, 'Netscape'], VERSION], [
              /mobile vr; rv:([\w\.]+)\).+firefox/i                               // Firefox Reality
              ], [VERSION, [NAME, FIREFOX+' Reality']], [
              /ekiohf.+(flow)\/([\w\.]+)/i,                                       // Flow
              /(swiftfox)/i,                                                      // Swiftfox
              /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i,
                                                                                  // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror/Klar
              /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i,
                                                                                  // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
              /(firefox)\/([\w\.]+)/i,                                            // Other Firefox-based
              /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i,                         // Mozilla

              // Other
              /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i,
                                                                                  // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir/Obigo/Mosaic/Go/ICE/UP.Browser
              /(links) \(([\w\.]+)/i                                              // Links
              ], [NAME, VERSION]
          ],

          cpu : [[

              /(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i                     // AMD64 (x64)
              ], [[ARCHITECTURE, 'amd64']], [

              /(ia32(?=;))/i                                                      // IA32 (quicktime)
              ], [[ARCHITECTURE, lowerize]], [

              /((?:i[346]|x)86)[;\)]/i                                            // IA32 (x86)
              ], [[ARCHITECTURE, 'ia32']], [

              /\b(aarch64|arm(v?8e?l?|_?64))\b/i                                 // ARM64
              ], [[ARCHITECTURE, 'arm64']], [

              /\b(arm(?:v[67])?ht?n?[fl]p?)\b/i                                   // ARMHF
              ], [[ARCHITECTURE, 'armhf']], [

              // PocketPC mistakenly identified as PowerPC
              /windows (ce|mobile); ppc;/i
              ], [[ARCHITECTURE, 'arm']], [

              /((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i                            // PowerPC
              ], [[ARCHITECTURE, /ower/, EMPTY, lowerize]], [

              /(sun4\w)[;\)]/i                                                    // SPARC
              ], [[ARCHITECTURE, 'sparc']], [

              /((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i
                                                                                  // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
              ], [[ARCHITECTURE, lowerize]]
          ],

          device : [[

              //////////////////////////
              // MOBILES & TABLETS
              // Ordered by popularity
              /////////////////////////

              // Samsung
              /\b(sch-i[89]0\d|shw-m380s|sm-[pt]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i
              ], [MODEL, [VENDOR, SAMSUNG], [TYPE, TABLET]], [
              /\b((?:s[cgp]h|gt|sm)-\w+|galaxy nexus)/i,
              /samsung[- ]([-\w]+)/i,
              /sec-(sgh\w+)/i
              ], [MODEL, [VENDOR, SAMSUNG], [TYPE, MOBILE]], [

              // Apple
              /((ipod|iphone)\d+,\d+)/i                                           // iPod/iPhone model
              ], [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]], [
              /(ipad\d+,\d+)/i                                                    // iPad model
              ], [MODEL, [VENDOR, APPLE], [TYPE, TABLET]], [
              /\((ip(?:hone|od)[\w ]*);/i                                         // iPod/iPhone
              ], [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]], [
              /\((ipad);[-\w\),; ]+apple/i,                                       // iPad
              /applecoremedia\/[\w\.]+ \((ipad)/i,
              /\b(ipad)\d\d?,\d\d?[;\]].+ios/i
              ], [MODEL, [VENDOR, APPLE], [TYPE, TABLET]], [

              // Huawei
              /\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i
              ], [MODEL, [VENDOR, HUAWEI], [TYPE, TABLET]], [
              /(?:huawei|honor)([-\w ]+)[;\)]/i,
              /\b(nexus 6p|\w{2,4}-[atu]?[ln][01259x][012359][an]?)\b(?!.+d\/s)/i
              ], [MODEL, [VENDOR, HUAWEI], [TYPE, MOBILE]], [

              // Xiaomi
              /\b(poco[\w ]+)(?: bui|\))/i,                                       // Xiaomi POCO
              /\b; (\w+) build\/hm\1/i,                                           // Xiaomi Hongmi 'numeric' models
              /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i,                             // Xiaomi Hongmi
              /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i,                   // Xiaomi Redmi
              /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i // Xiaomi Mi
              ], [[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, MOBILE]], [
              /\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i                        // Mi Pad tablets
              ],[[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, TABLET]], [

              // OPPO
              /; (\w+) bui.+ oppo/i,
              /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007)\b/i
              ], [MODEL, [VENDOR, 'OPPO'], [TYPE, MOBILE]], [

              // Vivo
              /vivo (\w+)(?: bui|\))/i,
              /\b(v[12]\d{3}\w?[at])(?: bui|;)/i
              ], [MODEL, [VENDOR, 'Vivo'], [TYPE, MOBILE]], [

              // Realme
              /\b(rmx[12]\d{3})(?: bui|;|\))/i
              ], [MODEL, [VENDOR, 'Realme'], [TYPE, MOBILE]], [

              // Motorola
              /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i,
              /\bmot(?:orola)?[- ](\w*)/i,
              /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i
              ], [MODEL, [VENDOR, MOTOROLA], [TYPE, MOBILE]], [
              /\b(mz60\d|xoom[2 ]{0,2}) build\//i
              ], [MODEL, [VENDOR, MOTOROLA], [TYPE, TABLET]], [

              // LG
              /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i
              ], [MODEL, [VENDOR, LG], [TYPE, TABLET]], [
              /(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i,
              /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i,
              /\blg-?([\d\w]+) bui/i
              ], [MODEL, [VENDOR, LG], [TYPE, MOBILE]], [

              // Lenovo
              /(ideatab[-\w ]+)/i,
              /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i
              ], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [

              // Nokia
              /(?:maemo|nokia).*(n900|lumia \d+)/i,
              /nokia[-_ ]?([-\w\.]*)/i
              ], [[MODEL, /_/g, ' '], [VENDOR, 'Nokia'], [TYPE, MOBILE]], [

              // Google
              /(pixel c)\b/i                                                      // Google Pixel C
              ], [MODEL, [VENDOR, GOOGLE], [TYPE, TABLET]], [
              /droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i                         // Google Pixel
              ], [MODEL, [VENDOR, GOOGLE], [TYPE, MOBILE]], [

              // Sony
              /droid.+ ([c-g]\d{4}|so[-l]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i
              ], [MODEL, [VENDOR, SONY], [TYPE, MOBILE]], [
              /sony tablet [ps]/i,
              /\b(?:sony)?sgp\w+(?: bui|\))/i
              ], [[MODEL, 'Xperia Tablet'], [VENDOR, SONY], [TYPE, TABLET]], [

              // OnePlus
              / (kb2005|in20[12]5|be20[12][59])\b/i,
              /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i
              ], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [

              // Amazon
              /(alexa)webm/i,
              /(kf[a-z]{2}wi)( bui|\))/i,                                         // Kindle Fire without Silk
              /(kf[a-z]+)( bui|\)).+silk\//i                                      // Kindle Fire HD
              ], [MODEL, [VENDOR, AMAZON], [TYPE, TABLET]], [
              /((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i                     // Fire Phone
              ], [[MODEL, /(.+)/g, 'Fire Phone $1'], [VENDOR, AMAZON], [TYPE, MOBILE]], [

              // BlackBerry
              /(playbook);[-\w\),; ]+(rim)/i                                      // BlackBerry PlayBook
              ], [MODEL, VENDOR, [TYPE, TABLET]], [
              /\b((?:bb[a-f]|st[hv])100-\d)/i,
              /\(bb10; (\w+)/i                                                    // BlackBerry 10
              ], [MODEL, [VENDOR, BLACKBERRY], [TYPE, MOBILE]], [

              // Asus
              /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i
              ], [MODEL, [VENDOR, ASUS], [TYPE, TABLET]], [
              / (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i
              ], [MODEL, [VENDOR, ASUS], [TYPE, MOBILE]], [

              // HTC
              /(nexus 9)/i                                                        // HTC Nexus 9
              ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [
              /(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i,                         // HTC

              // ZTE
              /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i,
              /(alcatel|geeksphone|nexian|panasonic|sony)[-_ ]?([-\w]*)/i         // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
              ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [

              // Acer
              /droid.+; ([ab][1-7]-?[0178a]\d\d?)/i
              ], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [

              // Meizu
              /droid.+; (m[1-5] note) bui/i,
              /\bmz-([-\w]{2,})/i
              ], [MODEL, [VENDOR, 'Meizu'], [TYPE, MOBILE]], [

              // Sharp
              /\b(sh-?[altvz]?\d\d[a-ekm]?)/i
              ], [MODEL, [VENDOR, 'Sharp'], [TYPE, MOBILE]], [

              // MIXED
              /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i,
                                                                                  // BlackBerry/BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
              /(hp) ([\w ]+\w)/i,                                                 // HP iPAQ
              /(asus)-?(\w+)/i,                                                   // Asus
              /(microsoft); (lumia[\w ]+)/i,                                      // Microsoft Lumia
              /(lenovo)[-_ ]?([-\w]+)/i,                                          // Lenovo
              /(jolla)/i,                                                         // Jolla
              /(oppo) ?([\w ]+) bui/i                                             // OPPO
              ], [VENDOR, MODEL, [TYPE, MOBILE]], [

              /(archos) (gamepad2?)/i,                                            // Archos
              /(hp).+(touchpad(?!.+tablet)|tablet)/i,                             // HP TouchPad
              /(kindle)\/([\w\.]+)/i,                                             // Kindle
              /(nook)[\w ]+build\/(\w+)/i,                                        // Nook
              /(dell) (strea[kpr\d ]*[\dko])/i,                                   // Dell Streak
              /(le[- ]+pan)[- ]+(\w{1,9}) bui/i,                                  // Le Pan Tablets
              /(trinity)[- ]*(t\d{3}) bui/i,                                      // Trinity Tablets
              /(gigaset)[- ]+(q\w{1,9}) bui/i,                                    // Gigaset Tablets
              /(vodafone) ([\w ]+)(?:\)| bui)/i                                   // Vodafone
              ], [VENDOR, MODEL, [TYPE, TABLET]], [

              /(surface duo)/i                                                    // Surface Duo
              ], [MODEL, [VENDOR, MICROSOFT], [TYPE, TABLET]], [
              /droid [\d\.]+; (fp\du?)(?: b|\))/i                                 // Fairphone
              ], [MODEL, [VENDOR, 'Fairphone'], [TYPE, MOBILE]], [
              /(u304aa)/i                                                         // AT&T
              ], [MODEL, [VENDOR, 'AT&T'], [TYPE, MOBILE]], [
              /\bsie-(\w*)/i                                                      // Siemens
              ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [
              /\b(rct\w+) b/i                                                     // RCA Tablets
              ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [
              /\b(venue[\d ]{2,7}) b/i                                            // Dell Venue Tablets
              ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [
              /\b(q(?:mv|ta)\w+) b/i                                              // Verizon Tablet
              ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [
              /\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i                       // Barnes & Noble Tablet
              ], [MODEL, [VENDOR, 'Barnes & Noble'], [TYPE, TABLET]], [
              /\b(tm\d{3}\w+) b/i
              ], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [
              /\b(k88) b/i                                                        // ZTE K Series Tablet
              ], [MODEL, [VENDOR, 'ZTE'], [TYPE, TABLET]], [
              /\b(nx\d{3}j) b/i                                                   // ZTE Nubia
              ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [
              /\b(gen\d{3}) b.+49h/i                                              // Swiss GEN Mobile
              ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [
              /\b(zur\d{3}) b/i                                                   // Swiss ZUR Tablet
              ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [
              /\b((zeki)?tb.*\b) b/i                                              // Zeki Tablets
              ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [
              /\b([yr]\d{2}) b/i,
              /\b(dragon[- ]+touch |dt)(\w{5}) b/i                                // Dragon Touch Tablet
              ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [
              /\b(ns-?\w{0,9}) b/i                                                // Insignia Tablets
              ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [
              /\b((nxa|next)-?\w{0,9}) b/i                                        // NextBook Tablets
              ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [
              /\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i                  // Voice Xtreme Phones
              ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [
              /\b(lvtel\-)?(v1[12]) b/i                                           // LvTel Phones
              ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [
              /\b(ph-1) /i                                                        // Essential PH-1
              ], [MODEL, [VENDOR, 'Essential'], [TYPE, MOBILE]], [
              /\b(v(100md|700na|7011|917g).*\b) b/i                               // Envizen Tablets
              ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [
              /\b(trio[-\w\. ]+) b/i                                              // MachSpeed Tablets
              ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [
              /\btu_(1491) b/i                                                    // Rotor Tablets
              ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [
              /(shield[\w ]+) b/i                                                 // Nvidia Shield Tablets
              ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, TABLET]], [
              /(sprint) (\w+)/i                                                   // Sprint Phones
              ], [VENDOR, MODEL, [TYPE, MOBILE]], [
              /(kin\.[onetw]{3})/i                                                // Microsoft Kin
              ], [[MODEL, /\./g, ' '], [VENDOR, MICROSOFT], [TYPE, MOBILE]], [
              /droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i             // Zebra
              ], [MODEL, [VENDOR, ZEBRA], [TYPE, TABLET]], [
              /droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i
              ], [MODEL, [VENDOR, ZEBRA], [TYPE, MOBILE]], [

              ///////////////////
              // CONSOLES
              ///////////////////

              /(ouya)/i,                                                          // Ouya
              /(nintendo) ([wids3utch]+)/i                                        // Nintendo
              ], [VENDOR, MODEL, [TYPE, CONSOLE]], [
              /droid.+; (shield) bui/i                                            // Nvidia
              ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [
              /(playstation [345portablevi]+)/i                                   // Playstation
              ], [MODEL, [VENDOR, SONY], [TYPE, CONSOLE]], [
              /\b(xbox(?: one)?(?!; xbox))[\); ]/i                                // Microsoft Xbox
              ], [MODEL, [VENDOR, MICROSOFT], [TYPE, CONSOLE]], [

              ///////////////////
              // SMARTTVS
              ///////////////////

              /smart-tv.+(samsung)/i                                              // Samsung
              ], [VENDOR, [TYPE, SMARTTV]], [
              /hbbtv.+maple;(\d+)/i
              ], [[MODEL, /^/, 'SmartTV'], [VENDOR, SAMSUNG], [TYPE, SMARTTV]], [
              /(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i        // LG SmartTV
              ], [[VENDOR, LG], [TYPE, SMARTTV]], [
              /(apple) ?tv/i                                                      // Apple TV
              ], [VENDOR, [MODEL, APPLE+' TV'], [TYPE, SMARTTV]], [
              /crkey/i                                                            // Google Chromecast
              ], [[MODEL, CHROME+'cast'], [VENDOR, GOOGLE], [TYPE, SMARTTV]], [
              /droid.+aft(\w)( bui|\))/i                                          // Fire TV
              ], [MODEL, [VENDOR, AMAZON], [TYPE, SMARTTV]], [
              /\(dtv[\);].+(aquos)/i                                              // Sharp
              ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [
              /\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i,                          // Roku
              /hbbtv\/\d+\.\d+\.\d+ +\([\w ]*; *(\w[^;]*);([^;]*)/i               // HbbTV devices
              ], [[VENDOR, trim], [MODEL, trim], [TYPE, SMARTTV]], [
              /\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i                   // SmartTV from Unidentified Vendors
              ], [[TYPE, SMARTTV]], [

              ///////////////////
              // WEARABLES
              ///////////////////

              /((pebble))app/i                                                    // Pebble
              ], [VENDOR, MODEL, [TYPE, WEARABLE]], [
              /droid.+; (glass) \d/i                                              // Google Glass
              ], [MODEL, [VENDOR, GOOGLE], [TYPE, WEARABLE]], [
              /droid.+; (wt63?0{2,3})\)/i
              ], [MODEL, [VENDOR, ZEBRA], [TYPE, WEARABLE]], [

              ///////////////////
              // EMBEDDED
              ///////////////////

              /(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i                              // Tesla
              ], [VENDOR, [TYPE, EMBEDDED]], [

              ////////////////////
              // MIXED (GENERIC)
              ///////////////////

              /droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i           // Android Phones from Unidentified Vendors
              ], [MODEL, [TYPE, MOBILE]], [
              /droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i       // Android Tablets from Unidentified Vendors
              ], [MODEL, [TYPE, TABLET]], [
              /\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i                      // Unidentifiable Tablet
              ], [[TYPE, TABLET]], [
              /(phone|mobile(?:[;\/]| safari)|pda(?=.+windows ce))/i              // Unidentifiable Mobile
              ], [[TYPE, MOBILE]], [
              /(android[-\w\. ]{0,9});.+buil/i                                    // Generic Android Device
              ], [MODEL, [VENDOR, 'Generic']]
          ],

          engine : [[

              /windows.+ edge\/([\w\.]+)/i                                       // EdgeHTML
              ], [VERSION, [NAME, EDGE+'HTML']], [

              /webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i                         // Blink
              ], [VERSION, [NAME, 'Blink']], [

              /(presto)\/([\w\.]+)/i,                                             // Presto
              /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna
              /ekioh(flow)\/([\w\.]+)/i,                                          // Flow
              /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i,                           // KHTML/Tasman/Links
              /(icab)[\/ ]([23]\.[\d\.]+)/i                                       // iCab
              ], [NAME, VERSION], [

              /rv\:([\w\.]{1,9})\b.+(gecko)/i                                     // Gecko
              ], [VERSION, NAME]
          ],

          os : [[

              // Windows
              /microsoft (windows) (vista|xp)/i                                   // Windows (iTunes)
              ], [NAME, VERSION], [
              /(windows) nt 6\.2; (arm)/i,                                        // Windows RT
              /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i,            // Windows Phone
              /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i
              ], [NAME, [VERSION, strMapper, windowsVersionMap]], [
              /(win(?=3|9|n)|win 9x )([nt\d\.]+)/i
              ], [[NAME, 'Windows'], [VERSION, strMapper, windowsVersionMap]], [

              // iOS/macOS
              /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i,              // iOS
              /cfnetwork\/.+darwin/i
              ], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [
              /(mac os x) ?([\w\. ]*)/i,
              /(macintosh|mac_powerpc\b)(?!.+haiku)/i                             // Mac OS
              ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [

              // Mobile OSes
              /droid ([\w\.]+)\b.+(android[- ]x86)/i                              // Android-x86
              ], [VERSION, NAME], [                                               // Android/WebOS/QNX/Bada/RIM/Maemo/MeeGo/Sailfish OS
              /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i,
              /(blackberry)\w*\/([\w\.]*)/i,                                      // Blackberry
              /(tizen|kaios)[\/ ]([\w\.]+)/i,                                     // Tizen/KaiOS
              /\((series40);/i                                                    // Series 40
              ], [NAME, VERSION], [
              /\(bb(10);/i                                                        // BlackBerry 10
              ], [VERSION, [NAME, BLACKBERRY]], [
              /(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i         // Symbian
              ], [VERSION, [NAME, 'Symbian']], [
              /mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i // Firefox OS
              ], [VERSION, [NAME, FIREFOX+' OS']], [
              /web0s;.+rt(tv)/i,
              /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i                              // WebOS
              ], [VERSION, [NAME, 'webOS']], [

              // Google Chromecast
              /crkey\/([\d\.]+)/i                                                 // Google Chromecast
              ], [VERSION, [NAME, CHROME+'cast']], [
              /(cros) [\w]+ ([\w\.]+\w)/i                                         // Chromium OS
              ], [[NAME, 'Chromium OS'], VERSION],[

              // Console
              /(nintendo|playstation) ([wids345portablevuch]+)/i,                 // Nintendo/Playstation
              /(xbox); +xbox ([^\);]+)/i,                                         // Microsoft Xbox (360, One, X, S, Series X, Series S)

              // Other
              /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i,                            // Joli/Palm
              /(mint)[\/\(\) ]?(\w*)/i,                                           // Mint
              /(mageia|vectorlinux)[; ]/i,                                        // Mageia/VectorLinux
              /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i,
                                                                                  // Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware/Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus/Raspbian/Plan9/Minix/RISCOS/Contiki/Deepin/Manjaro/elementary/Sabayon/Linspire
              /(hurd|linux) ?([\w\.]*)/i,                                         // Hurd/Linux
              /(gnu) ?([\w\.]*)/i,                                                // GNU
              /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, // FreeBSD/NetBSD/OpenBSD/PC-BSD/GhostBSD/DragonFly
              /(haiku) (\w+)/i                                                    // Haiku
              ], [NAME, VERSION], [
              /(sunos) ?([\w\.\d]*)/i                                             // Solaris
              ], [[NAME, 'Solaris'], VERSION], [
              /((?:open)?solaris)[-\/ ]?([\w\.]*)/i,                              // Solaris
              /(aix) ((\d)(?=\.|\)| )[\w\.])*/i,                                  // AIX
              /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux)/i,            // BeOS/OS2/AmigaOS/MorphOS/OpenVMS/Fuchsia/HP-UX
              /(unix) ?([\w\.]*)/i                                                // UNIX
              ], [NAME, VERSION]
          ]
      };

      /////////////////
      // Constructor
      ////////////////

      var UAParser = function (ua, extensions) {

          if (typeof ua === OBJ_TYPE) {
              extensions = ua;
              ua = undefined$1;
          }

          if (!(this instanceof UAParser)) {
              return new UAParser(ua, extensions).getResult();
          }

          var _ua = ua || ((typeof window !== UNDEF_TYPE && window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : EMPTY);
          var _rgxmap = extensions ? extend(regexes, extensions) : regexes;

          this.getBrowser = function () {
              var _browser = {};
              _browser[NAME] = undefined$1;
              _browser[VERSION] = undefined$1;
              rgxMapper.call(_browser, _ua, _rgxmap.browser);
              _browser.major = majorize(_browser.version);
              return _browser;
          };
          this.getCPU = function () {
              var _cpu = {};
              _cpu[ARCHITECTURE] = undefined$1;
              rgxMapper.call(_cpu, _ua, _rgxmap.cpu);
              return _cpu;
          };
          this.getDevice = function () {
              var _device = {};
              _device[VENDOR] = undefined$1;
              _device[MODEL] = undefined$1;
              _device[TYPE] = undefined$1;
              rgxMapper.call(_device, _ua, _rgxmap.device);
              return _device;
          };
          this.getEngine = function () {
              var _engine = {};
              _engine[NAME] = undefined$1;
              _engine[VERSION] = undefined$1;
              rgxMapper.call(_engine, _ua, _rgxmap.engine);
              return _engine;
          };
          this.getOS = function () {
              var _os = {};
              _os[NAME] = undefined$1;
              _os[VERSION] = undefined$1;
              rgxMapper.call(_os, _ua, _rgxmap.os);
              return _os;
          };
          this.getResult = function () {
              return {
                  ua      : this.getUA(),
                  browser : this.getBrowser(),
                  engine  : this.getEngine(),
                  os      : this.getOS(),
                  device  : this.getDevice(),
                  cpu     : this.getCPU()
              };
          };
          this.getUA = function () {
              return _ua;
          };
          this.setUA = function (ua) {
              _ua = (typeof ua === STR_TYPE && ua.length > UA_MAX_LENGTH) ? trim(ua, UA_MAX_LENGTH) : ua;
              return this;
          };
          this.setUA(_ua);
          return this;
      };

      UAParser.VERSION = LIBVERSION;
      UAParser.BROWSER =  enumerize([NAME, VERSION, MAJOR]);
      UAParser.CPU = enumerize([ARCHITECTURE]);
      UAParser.DEVICE = enumerize([MODEL, VENDOR, TYPE, CONSOLE, MOBILE, SMARTTV, TABLET, WEARABLE, EMBEDDED]);
      UAParser.ENGINE = UAParser.OS = enumerize([NAME, VERSION]);

      ///////////
      // Export
      //////////

      // check js environment
      {
          // nodejs env
          if (module.exports) {
              exports = module.exports = UAParser;
          }
          exports.UAParser = UAParser;
      }

      // jQuery/Zepto specific (optional)
      // Note:
      //   In AMD env the global scope should be kept clean, but jQuery is an exception.
      //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
      //   and we should catch that.
      var $ = typeof window !== UNDEF_TYPE && (window.jQuery || window.Zepto);
      if ($ && !$.ua) {
          var parser = new UAParser();
          $.ua = parser.getResult();
          $.ua.get = function () {
              return parser.getUA();
          };
          $.ua.set = function (ua) {
              parser.setUA(ua);
              var result = parser.getResult();
              for (var prop in result) {
                  $.ua[prop] = result[prop];
              }
          };
      }

  })(typeof window === 'object' ? window : commonjsGlobal);
  });

  /**
   * Source: [jed's gist]{@link https://gist.github.com/982883}.
   * Returns a random v4 UUID of the form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx,
   * where each x is replaced with a random hexadecimal digit from 0 to f, and
   * y is replaced with a random hexadecimal digit from 8 to b.
   * Used to generate UUIDs for deviceIds.
   * @private
   */
  var uuid = function uuid(a) {
    return a // if the placeholder was passed, return
    ? // a random number from 0 to 15
    (a ^ // unless b is 8,
    Math.random() * // in which case
    16 >> // a random number from
    a / 4). // 8 to 11
    toString(16) // in hexadecimal
    : // or otherwise a concatenated string:
    ([1e7] + // 10000000 +
    -1e3 + // -1000 +
    -4e3 + // -4000 +
    -8e3 + // -80000000 +
    -1e11). // -100000000000,
    replace( // replacing
    /[018]/g, // zeroes, ones, and eights with
    uuid // random hex digits
    );
  };

  var getLanguage = function getLanguage() {
    return typeof navigator !== 'undefined' && (navigator.languages && navigator.languages[0] || navigator.language || navigator.userLanguage) || '';
  };

  var language = {
    getLanguage: getLanguage
  };

  /**
   * AmplitudeServerZone is for Data Residency and handling server zone related properties.
   * The server zones now are US and EU.
   *
   * For usage like sending data to Amplitude's EU servers, you need to configure the serverZone during nitializing.
   */

  var AmplitudeServerZone = {
    US: 'US',
    EU: 'EU'
  };

  var getEventLogApi = function getEventLogApi(serverZone) {
    var eventLogUrl = Constants.EVENT_LOG_URL;

    switch (serverZone) {
      case AmplitudeServerZone.EU:
        eventLogUrl = Constants.EVENT_LOG_EU_URL;
        break;

      case AmplitudeServerZone.US:
        eventLogUrl = Constants.EVENT_LOG_URL;
        break;
    }

    return eventLogUrl;
  };

  var getDynamicConfigApi = function getDynamicConfigApi(serverZone) {
    var dynamicConfigUrl = Constants.DYNAMIC_CONFIG_URL;

    switch (serverZone) {
      case AmplitudeServerZone.EU:
        dynamicConfigUrl = Constants.DYNAMIC_CONFIG_EU_URL;
        break;

      case AmplitudeServerZone.US:
        dynamicConfigUrl = Constants.DYNAMIC_CONFIG_URL;
        break;
    }

    return dynamicConfigUrl;
  };

  var version = "8.18.0";

  /**
   * Options used when initializing Amplitude
   * @typedef {Object} Options
   * @property {string} [apiEndpoint=`api.amplitude.com`] - Endpoint to send amplitude event requests to.
   * @property {boolean} [batchEvents=`false`] -  If `true`, then events are batched together and uploaded only when the number of unsent events is greater than or equal to eventUploadThreshold or after eventUploadPeriodMillis milliseconds have passed since the first unsent event was logged.
   * @property {number} [cookieExpiration=`365`] - The number of days after which the Amplitude cookie will expire. 12 months is for GDPR compliance.
   * @property {string} [cookieName=`amplitude_id`] - *DEPRECATED*
   * @property {string} [sameSiteCookie='None'] -  Sets the SameSite flag on the amplitude cookie. Decides cookie privacy policy.
   * @property {boolean} [cookieForceUpgrade=`false`] - Forces pre-v6.0.0 instances to adopt post-v6.0.0 compat cookie formats.
   * @property {boolean} [deferInitialization=`null`] -  If `true`, disables the core functionality of the sdk, including saving a cookie and all logging, until explicitly enabled. To enable tracking, please call `amplitude.getInstance().enableTracking()` *Note: This will not affect users who already have an amplitude cookie. The decision to track events is determined by whether or not a user has an amplitude analytics cookie. If the `cookieExpiration</code> is manually defined to be a short lifespan, you may need to run `amplitude.getInstance().enableTracking()` upon the cookie expiring or upon logging in.*
   * @property {boolean} [disableCookies=`false`] -  Disable Ampllitude cookies altogether.
   * @property {string} [deviceId=A randomly generated UUID.] -  The custom Device ID to set. *Note: This is not recommended unless you know what you are doing (e.g. you have your own system for tracking user devices).*
   * @property {boolean} [deviceIdFromUrlParam=`false`] -  If `true`, then the SDK will parse Device ID values from the URL parameter amp_device_id if available. Device IDs defined in the configuration options during init will take priority over Device IDs from URL parameters.
   * @property {string} [domain=The top domain of the current page's URL. ('https://amplitude.com')] -  Set a custom domain for the Amplitude cookie. To include subdomains, add a preceding period, eg: `.amplitude.com`.
   * @property {number} [eventUploadPeriodMillis=`30000` (30 sec)] -  Amount of time in milliseconds that the SDK waits before uploading events if batchEvents is true.
   * @property {number} [eventUploadThreshold=`30`] -  Minimum number of events to batch together per request if batchEvents is true.
   * @property {boolean} [forceHttps=`true`] -  If `true`, the events will always be uploaded to HTTPS endpoint. Otherwise, it will use the embedding site's protocol.
   * @property {boolean} [includeFbclid=`false`] -  If `true`, captures the fbclid URL parameter as well as the user's initial_fbclid via a setOnce operation.
   * @property {boolean} [includeGclid=`false`] -  If `true`, captures the gclid URL parameter as well as the user's initial_gclid via a setOnce operation.
   * @property {boolean} [includeReferrer=`false`] -  If `true`, captures the referrer and referring_domain for each session, as well as the user's initial_referrer and initial_referring_domain via a setOnce operation.
   * @property {boolean} [includeUtm=`false`] -  If `true`, finds UTM parameters in the query string or the _utmz cookie, parses, and includes them as user properties on all events uploaded. This also captures initial UTM parameters for each session via a setOnce operation.
   * @property {string} [language=The language determined by the browser] -  Custom language to set.
   * @property {Object} [library=`{ name: 'amplitude-js', version: packageJsonVersion }`] -  Values for the library version
   * @property {string} [logLevel=`WARN`] -  Level of logs to be printed in the developer console. Valid values are 'DISABLE', 'ERROR', 'WARN', 'INFO'. To learn more about the different options, see below.
   * @property {boolean} [logAttributionCapturedEvent=`false`] - If `true`, the SDK will log an Amplitude event anytime new attribution values are captured from the user. **Note: These events count towards your event volume.** Event name being logged: [Amplitude] Attribution Captured. Event Properties that can be logged: `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`, `referrer`, `referring_domain`, `gclid`, `fbclid`. For UTM properties to be logged, `includeUtm` must be set to `true`. For the `referrer` and `referring_domain` properties to be logged, `includeReferrer` must be set to `true`. For the `gclid` property to be logged, `includeGclid` must be set to `true`. For the `fbclid` property to be logged, `includeFbclid` must be set to `true`.
   * @property {boolean} [optOut=`false`] -  Whether or not to disable tracking for the current user.
   * @property {function} [onError=`() => {}`] - Function to call on error.
   * @property {function} [onExitPage=`() => {}`] - Function called when the user exits the browser. Useful logging on page exit.
   * @property {Object} [plan] Tracking plan properties
   * @property {string} [plan.branch] The tracking plan branch name e.g. "main"
   * @property {string} [plan.source] The tracking plan source e.g. "web"
   * @property {string} [plan.version] The tracking plan version e.g. "1", "15"
   * @property {string} [plan.versionId] The tracking plan version Id e.g. "9ec23ba0-275f-468f-80d1-66b88bff9529"
   * @property {string} [platform=`Web`] -  Platform device is running on. Defaults to `Web` (browser, including mobile browsers).
   * @property {number} [savedMaxCount=`1000`] -  Maximum number of events to save in localStorage. If more events are logged while offline, then old events are removed.
   * @property {boolean} [saveEvents=`true`] -  If `true`, saves events to localStorage and removes them upon successful upload. *Note: Without saving events, events may be lost if the user navigates to another page before the events are uploaded.*
   * @property {boolean} [saveParamsReferrerOncePerSession=`true`] -  If `true`, then includeGclid, includeFbclid, includeReferrer, and includeUtm will only track their respective properties once per session. New values that come in during the middle of the user's session will be ignored. Set to false to always capture new values.
   * @property {boolean} [secureCookie=`false`] -  If `true`, the amplitude cookie will be set with the Secure flag.
   * @property {number} [sessionTimeout=`30*60*1000` (30 min)] -  The time between logged events before a new session starts in milliseconds.
   * @property {string[]} [storage=`''`] - Sets storage strategy.  Options are 'cookies', 'localStorage', 'sessionStorage', or `none`. Will override `disableCookies` option
   * @property {Object} [trackingOptions=`{ city: true, country: true, carrier: true, device_manufacturer: true, device_model: true, dma: true, ip_address: true, language: true, os_name: true, os_version: true, platform: true, region: true, version_name: true}`] - Type of data associated with a user.
   * @property {string} [transport=`http`] - Network transport mechanism used to send events. Options are 'http' and 'beacon'.
   * @property {boolean} [unsetParamsReferrerOnNewSession=`false`] -  If `false`, the existing `referrer` and `utm_parameter` values will be carried through each new session. If set to `true`, the `referrer` and `utm_parameter` user properties, which include `referrer`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, and `utm_content`, will be set to `null` upon instantiating a new session. Note: This only works if `includeReferrer` or `includeUtm` is set to `true`.
   * @property {string} [unsentKey=`amplitude_unsent`] - localStorage key that stores unsent events.
   * @property {string} [unsentIdentifyKey=`amplitude_unsent_identify`] - localStorage key that stores unsent identifies.
   * @property {number} [uploadBatchSize=`100`] -  The maximum number of events to send to the server per request.
   * @property {Object} [headers=`{ 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }`] - Headers attached to an event(s) upload network request. Custom header properties are merged with this object.
   * @property {string} [serverZone] - For server zone related configuration, used for server api endpoint and dynamic configuration.
   * @property {boolean} [useDynamicConfig] - Enable dynamic configuration to find best server url for user.
   * @property {boolean} [serverZoneBasedApi] - To update api endpoint with serverZone change or not. For data residency, recommend to enable it unless using own proxy server.
   * @property {number} [sessionId=`null`] - The custom Session ID for the current session. *Note: This is not recommended unless you know what you are doing because the Session ID of a session is utilized for all session metrics in Amplitude.
   */

  var DEFAULT_OPTIONS = {
    apiEndpoint: Constants.EVENT_LOG_URL,
    batchEvents: false,
    cookieExpiration: 365,
    // 12 months is for GDPR compliance
    cookieName: 'amplitude_id',
    // this is a deprecated option
    sameSiteCookie: 'Lax',
    // cookie privacy policy
    cookieForceUpgrade: false,
    deferInitialization: false,
    disableCookies: false,
    // this is a deprecated option
    deviceIdFromUrlParam: false,
    domain: '',
    eventUploadPeriodMillis: 30 * 1000,
    // 30s
    eventUploadThreshold: 30,
    forceHttps: true,
    includeFbclid: false,
    includeGclid: false,
    includeReferrer: false,
    includeUtm: false,
    language: language.getLanguage(),
    library: {
      name: 'amplitude-js',
      version: version
    },
    logLevel: 'WARN',
    logAttributionCapturedEvent: false,
    optOut: false,
    onError: function onError() {},
    onExitPage: function onExitPage() {},
    onNewSessionStart: function onNewSessionStart() {},
    plan: {
      branch: '',
      source: '',
      version: '',
      versionId: ''
    },
    platform: 'Web',
    savedMaxCount: 1000,
    saveEvents: true,
    saveParamsReferrerOncePerSession: true,
    secureCookie: false,
    sessionTimeout: 30 * 60 * 1000,
    storage: Constants.STORAGE_DEFAULT,
    trackingOptions: {
      city: true,
      country: true,
      carrier: true,
      device_manufacturer: true,
      device_model: true,
      dma: true,
      ip_address: true,
      language: true,
      os_name: true,
      os_version: true,
      platform: true,
      region: true,
      version_name: true
    },
    transport: Constants.TRANSPORT_HTTP,
    unsetParamsReferrerOnNewSession: false,
    unsentKey: 'amplitude_unsent',
    unsentIdentifyKey: 'amplitude_unsent_identify',
    uploadBatchSize: 100,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },
    serverZone: AmplitudeServerZone.US,
    useDynamicConfig: false,
    serverZoneBasedApi: false,
    sessionId: null
  };

  /**
   * Dynamic Configuration
   * Find the best server url automatically based on app users' geo location.
   */

  var ConfigManager =
  /*#__PURE__*/
  function () {
    function ConfigManager() {
      _classCallCheck(this, ConfigManager);

      if (!ConfigManager.instance) {
        this.ingestionEndpoint = Constants.EVENT_LOG_URL;
        ConfigManager.instance = this;
      }

      return ConfigManager.instance;
    }

    _createClass(ConfigManager, [{
      key: "refresh",
      value: function refresh(serverZone, forceHttps, callback) {
        var protocol = 'https';

        if (!forceHttps && 'https:' !== GlobalScope.location.protocol) {
          protocol = 'http';
        }

        var dynamicConfigUrl = protocol + '://' + getDynamicConfigApi(serverZone);
        var self = this;
        var isIE = GlobalScope.XDomainRequest ? true : false;

        if (isIE) {
          var xdr = new GlobalScope.XDomainRequest();
          xdr.open('GET', dynamicConfigUrl, true);

          xdr.onload = function () {
            var response = JSON.parse(xdr.responseText);
            self.ingestionEndpoint = response['ingestionEndpoint'];

            if (callback) {
              callback();
            }
          };

          xdr.onerror = function () {};

          xdr.ontimeout = function () {};

          xdr.onprogress = function () {};

          xdr.send();
        } else {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', dynamicConfigUrl, true);

          xhr.onreadystatechange = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
              var response = JSON.parse(xhr.responseText);
              self.ingestionEndpoint = response['ingestionEndpoint'];

              if (callback) {
                callback();
              }
            }
          };

          xhr.send();
        }
      }
    }]);

    return ConfigManager;
  }();

  var instance$1 = new ConfigManager();

  var analyticsConnector_umd = createCommonjsModule(function (module, exports) {
  (function (global, factory) {
  	factory(exports) ;
  })(commonjsGlobal, (function (exports) {
  	var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : typeof self !== 'undefined' ? self : {};

  	function createCommonjsModule(fn, basedir, module) {
  		return module = {
  			path: basedir,
  			exports: {},
  			require: function (path, base) {
  				return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
  			}
  		}, fn(module, module.exports), module.exports;
  	}

  	function commonjsRequire () {
  		throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
  	}

  	var uaParser = createCommonjsModule(function (module, exports) {
  	  /////////////////////////////////////////////////////////////////////////////////

  	  /* UAParser.js v0.7.28
  	     Copyright © 2012-2021 Faisal Salman <f@faisalman.com>
  	     MIT License */

  	  /*
  	  Detect Browser, Engine, OS, CPU, and Device type/model from User-Agent data.
  	  Supports browser & node.js environment.
  	  Demo   : https://faisalman.github.io/ua-parser-js
  	  Source : https://github.com/faisalman/ua-parser-js */
  	  /////////////////////////////////////////////////////////////////////////////////
  	  (function (window, undefined$1) {
  	    // Constants
  	    /////////////

  	    var LIBVERSION = '0.7.28',
  	        EMPTY = '',
  	        UNKNOWN = '?',
  	        FUNC_TYPE = 'function',
  	        UNDEF_TYPE = 'undefined',
  	        OBJ_TYPE = 'object',
  	        STR_TYPE = 'string',
  	        MAJOR = 'major',
  	        MODEL = 'model',
  	        NAME = 'name',
  	        TYPE = 'type',
  	        VENDOR = 'vendor',
  	        VERSION = 'version',
  	        ARCHITECTURE = 'architecture',
  	        CONSOLE = 'console',
  	        MOBILE = 'mobile',
  	        TABLET = 'tablet',
  	        SMARTTV = 'smarttv',
  	        WEARABLE = 'wearable',
  	        EMBEDDED = 'embedded',
  	        UA_MAX_LENGTH = 255;
  	    var AMAZON = 'Amazon',
  	        APPLE = 'Apple',
  	        ASUS = 'ASUS',
  	        BLACKBERRY = 'BlackBerry',
  	        BROWSER = 'Browser',
  	        CHROME = 'Chrome',
  	        EDGE = 'Edge',
  	        FIREFOX = 'Firefox',
  	        GOOGLE = 'Google',
  	        HUAWEI = 'Huawei',
  	        LG = 'LG',
  	        MICROSOFT = 'Microsoft',
  	        MOTOROLA = 'Motorola',
  	        OPERA = 'Opera',
  	        SAMSUNG = 'Samsung',
  	        SONY = 'Sony',
  	        XIAOMI = 'Xiaomi',
  	        ZEBRA = 'Zebra'; ///////////
  	    // Helper
  	    //////////

  	    var extend = function (regexes, extensions) {
  	      var mergedRegexes = {};

  	      for (var i in regexes) {
  	        if (extensions[i] && extensions[i].length % 2 === 0) {
  	          mergedRegexes[i] = extensions[i].concat(regexes[i]);
  	        } else {
  	          mergedRegexes[i] = regexes[i];
  	        }
  	      }

  	      return mergedRegexes;
  	    },
  	        enumerize = function (arr) {
  	      var enums = {};

  	      for (var i = 0; i < arr.length; i++) {
  	        enums[arr[i].toUpperCase()] = arr[i];
  	      }

  	      return enums;
  	    },
  	        has = function (str1, str2) {
  	      return typeof str1 === STR_TYPE ? lowerize(str2).indexOf(lowerize(str1)) !== -1 : false;
  	    },
  	        lowerize = function (str) {
  	      return str.toLowerCase();
  	    },
  	        majorize = function (version) {
  	      return typeof version === STR_TYPE ? version.replace(/[^\d\.]/g, EMPTY).split('.')[0] : undefined$1;
  	    },
  	        trim = function (str, len) {
  	      if (typeof str === STR_TYPE) {
  	        str = str.replace(/^\s+|\s+$/g, EMPTY);
  	        return typeof len === UNDEF_TYPE ? str : str.substring(0, UA_MAX_LENGTH);
  	      }
  	    }; ///////////////
  	    // Map helper
  	    //////////////


  	    var rgxMapper = function (ua, arrays) {
  	      var i = 0,
  	          j,
  	          k,
  	          p,
  	          q,
  	          matches,
  	          match; // loop through all regexes maps

  	      while (i < arrays.length && !matches) {
  	        var regex = arrays[i],
  	            // even sequence (0,2,4,..)
  	        props = arrays[i + 1]; // odd sequence (1,3,5,..)

  	        j = k = 0; // try matching uastring with regexes

  	        while (j < regex.length && !matches) {
  	          matches = regex[j++].exec(ua);

  	          if (!!matches) {
  	            for (p = 0; p < props.length; p++) {
  	              match = matches[++k];
  	              q = props[p]; // check if given property is actually array

  	              if (typeof q === OBJ_TYPE && q.length > 0) {
  	                if (q.length == 2) {
  	                  if (typeof q[1] == FUNC_TYPE) {
  	                    // assign modified match
  	                    this[q[0]] = q[1].call(this, match);
  	                  } else {
  	                    // assign given value, ignore regex match
  	                    this[q[0]] = q[1];
  	                  }
  	                } else if (q.length == 3) {
  	                  // check whether function or regex
  	                  if (typeof q[1] === FUNC_TYPE && !(q[1].exec && q[1].test)) {
  	                    // call function (usually string mapper)
  	                    this[q[0]] = match ? q[1].call(this, match, q[2]) : undefined$1;
  	                  } else {
  	                    // sanitize match using given regex
  	                    this[q[0]] = match ? match.replace(q[1], q[2]) : undefined$1;
  	                  }
  	                } else if (q.length == 4) {
  	                  this[q[0]] = match ? q[3].call(this, match.replace(q[1], q[2])) : undefined$1;
  	                }
  	              } else {
  	                this[q] = match ? match : undefined$1;
  	              }
  	            }
  	          }
  	        }

  	        i += 2;
  	      }
  	    },
  	        strMapper = function (str, map) {
  	      for (var i in map) {
  	        // check if current value is array
  	        if (typeof map[i] === OBJ_TYPE && map[i].length > 0) {
  	          for (var j = 0; j < map[i].length; j++) {
  	            if (has(map[i][j], str)) {
  	              return i === UNKNOWN ? undefined$1 : i;
  	            }
  	          }
  	        } else if (has(map[i], str)) {
  	          return i === UNKNOWN ? undefined$1 : i;
  	        }
  	      }

  	      return str;
  	    }; ///////////////
  	    // String map
  	    //////////////
  	    // Safari < 3.0


  	    var oldSafariMap = {
  	      '1.0': '/8',
  	      '1.2': '/1',
  	      '1.3': '/3',
  	      '2.0': '/412',
  	      '2.0.2': '/416',
  	      '2.0.3': '/417',
  	      '2.0.4': '/419',
  	      '?': '/'
  	    },
  	        windowsVersionMap = {
  	      'ME': '4.90',
  	      'NT 3.11': 'NT3.51',
  	      'NT 4.0': 'NT4.0',
  	      '2000': 'NT 5.0',
  	      'XP': ['NT 5.1', 'NT 5.2'],
  	      'Vista': 'NT 6.0',
  	      '7': 'NT 6.1',
  	      '8': 'NT 6.2',
  	      '8.1': 'NT 6.3',
  	      '10': ['NT 6.4', 'NT 10.0'],
  	      'RT': 'ARM'
  	    }; //////////////
  	    // Regex map
  	    /////////////

  	    var regexes = {
  	      browser: [[/\b(?:crmo|crios)\/([\w\.]+)/i // Chrome for Android/iOS
  	      ], [VERSION, [NAME, 'Chrome']], [/edg(?:e|ios|a)?\/([\w\.]+)/i // Microsoft Edge
  	      ], [VERSION, [NAME, 'Edge']], [// Presto based
  	      /(opera mini)\/([-\w\.]+)/i, // Opera Mini
  	      /(opera [mobiletab]{3,6})\b.+version\/([-\w\.]+)/i, // Opera Mobi/Tablet
  	      /(opera)(?:.+version\/|[\/ ]+)([\w\.]+)/i // Opera
  	      ], [NAME, VERSION], [/opios[\/ ]+([\w\.]+)/i // Opera mini on iphone >= 8.0
  	      ], [VERSION, [NAME, OPERA + ' Mini']], [/\bopr\/([\w\.]+)/i // Opera Webkit
  	      ], [VERSION, [NAME, OPERA]], [// Mixed
  	      /(kindle)\/([\w\.]+)/i, // Kindle
  	      /(lunascape|maxthon|netfront|jasmine|blazer)[\/ ]?([\w\.]*)/i, // Lunascape/Maxthon/Netfront/Jasmine/Blazer
  	      // Trident based
  	      /(avant |iemobile|slim)(?:browser)?[\/ ]?([\w\.]*)/i, // Avant/IEMobile/SlimBrowser
  	      /(ba?idubrowser)[\/ ]?([\w\.]+)/i, // Baidu Browser
  	      /(?:ms|\()(ie) ([\w\.]+)/i, // Internet Explorer
  	      // Webkit/KHTML based                                               // Flock/RockMelt/Midori/Epiphany/Silk/Skyfire/Bolt/Iron/Iridium/PhantomJS/Bowser/QupZilla/Falkon
  	      /(flock|rockmelt|midori|epiphany|silk|skyfire|ovibrowser|bolt|iron|vivaldi|iridium|phantomjs|bowser|quark|qupzilla|falkon|rekonq|puffin|brave|whale|qqbrowserlite|qq)\/([-\w\.]+)/i, // Rekonq/Puffin/Brave/Whale/QQBrowserLite/QQ, aka ShouQ
  	      /(weibo)__([\d\.]+)/i // Weibo
  	      ], [NAME, VERSION], [/(?:\buc? ?browser|(?:juc.+)ucweb)[\/ ]?([\w\.]+)/i // UCBrowser
  	      ], [VERSION, [NAME, 'UC' + BROWSER]], [/\bqbcore\/([\w\.]+)/i // WeChat Desktop for Windows Built-in Browser
  	      ], [VERSION, [NAME, 'WeChat(Win) Desktop']], [/micromessenger\/([\w\.]+)/i // WeChat
  	      ], [VERSION, [NAME, 'WeChat']], [/konqueror\/([\w\.]+)/i // Konqueror
  	      ], [VERSION, [NAME, 'Konqueror']], [/trident.+rv[: ]([\w\.]{1,9})\b.+like gecko/i // IE11
  	      ], [VERSION, [NAME, 'IE']], [/yabrowser\/([\w\.]+)/i // Yandex
  	      ], [VERSION, [NAME, 'Yandex']], [/(avast|avg)\/([\w\.]+)/i // Avast/AVG Secure Browser
  	      ], [[NAME, /(.+)/, '$1 Secure ' + BROWSER], VERSION], [/\bfocus\/([\w\.]+)/i // Firefox Focus
  	      ], [VERSION, [NAME, FIREFOX + ' Focus']], [/\bopt\/([\w\.]+)/i // Opera Touch
  	      ], [VERSION, [NAME, OPERA + ' Touch']], [/coc_coc\w+\/([\w\.]+)/i // Coc Coc Browser
  	      ], [VERSION, [NAME, 'Coc Coc']], [/dolfin\/([\w\.]+)/i // Dolphin
  	      ], [VERSION, [NAME, 'Dolphin']], [/coast\/([\w\.]+)/i // Opera Coast
  	      ], [VERSION, [NAME, OPERA + ' Coast']], [/miuibrowser\/([\w\.]+)/i // MIUI Browser
  	      ], [VERSION, [NAME, 'MIUI ' + BROWSER]], [/fxios\/([-\w\.]+)/i // Firefox for iOS
  	      ], [VERSION, [NAME, FIREFOX]], [/\bqihu|(qi?ho?o?|360)browser/i // 360
  	      ], [[NAME, '360 ' + BROWSER]], [/(oculus|samsung|sailfish)browser\/([\w\.]+)/i], [[NAME, /(.+)/, '$1 ' + BROWSER], VERSION], [// Oculus/Samsung/Sailfish Browser
  	      /(comodo_dragon)\/([\w\.]+)/i // Comodo Dragon
  	      ], [[NAME, /_/g, ' '], VERSION], [/(electron)\/([\w\.]+) safari/i, // Electron-based App
  	      /(tesla)(?: qtcarbrowser|\/(20\d\d\.[-\w\.]+))/i, // Tesla
  	      /m?(qqbrowser|baiduboxapp|2345Explorer)[\/ ]?([\w\.]+)/i // QQBrowser/Baidu App/2345 Browser
  	      ], [NAME, VERSION], [/(metasr)[\/ ]?([\w\.]+)/i, // SouGouBrowser
  	      /(lbbrowser)/i // LieBao Browser
  	      ], [NAME], [// WebView
  	      /((?:fban\/fbios|fb_iab\/fb4a)(?!.+fbav)|;fbav\/([\w\.]+);)/i // Facebook App for iOS & Android
  	      ], [[NAME, 'Facebook'], VERSION], [/safari (line)\/([\w\.]+)/i, // Line App for iOS
  	      /\b(line)\/([\w\.]+)\/iab/i, // Line App for Android
  	      /(chromium|instagram)[\/ ]([-\w\.]+)/i // Chromium/Instagram
  	      ], [NAME, VERSION], [/\bgsa\/([\w\.]+) .*safari\//i // Google Search Appliance on iOS
  	      ], [VERSION, [NAME, 'GSA']], [/headlesschrome(?:\/([\w\.]+)| )/i // Chrome Headless
  	      ], [VERSION, [NAME, CHROME + ' Headless']], [/ wv\).+(chrome)\/([\w\.]+)/i // Chrome WebView
  	      ], [[NAME, CHROME + ' WebView'], VERSION], [/droid.+ version\/([\w\.]+)\b.+(?:mobile safari|safari)/i // Android Browser
  	      ], [VERSION, [NAME, 'Android ' + BROWSER]], [/(chrome|omniweb|arora|[tizenoka]{5} ?browser)\/v?([\w\.]+)/i // Chrome/OmniWeb/Arora/Tizen/Nokia
  	      ], [NAME, VERSION], [/version\/([\w\.]+) .*mobile\/\w+ (safari)/i // Mobile Safari
  	      ], [VERSION, [NAME, 'Mobile Safari']], [/version\/([\w\.]+) .*(mobile ?safari|safari)/i // Safari & Safari Mobile
  	      ], [VERSION, NAME], [/webkit.+?(mobile ?safari|safari)(\/[\w\.]+)/i // Safari < 3.0
  	      ], [NAME, [VERSION, strMapper, oldSafariMap]], [/(webkit|khtml)\/([\w\.]+)/i], [NAME, VERSION], [// Gecko based
  	      /(navigator|netscape\d?)\/([-\w\.]+)/i // Netscape
  	      ], [[NAME, 'Netscape'], VERSION], [/mobile vr; rv:([\w\.]+)\).+firefox/i // Firefox Reality
  	      ], [VERSION, [NAME, FIREFOX + ' Reality']], [/ekiohf.+(flow)\/([\w\.]+)/i, // Flow
  	      /(swiftfox)/i, // Swiftfox
  	      /(icedragon|iceweasel|camino|chimera|fennec|maemo browser|minimo|conkeror|klar)[\/ ]?([\w\.\+]+)/i, // IceDragon/Iceweasel/Camino/Chimera/Fennec/Maemo/Minimo/Conkeror/Klar
  	      /(seamonkey|k-meleon|icecat|iceape|firebird|phoenix|palemoon|basilisk|waterfox)\/([-\w\.]+)$/i, // Firefox/SeaMonkey/K-Meleon/IceCat/IceApe/Firebird/Phoenix
  	      /(firefox)\/([\w\.]+)/i, // Other Firefox-based
  	      /(mozilla)\/([\w\.]+) .+rv\:.+gecko\/\d+/i, // Mozilla
  	      // Other
  	      /(polaris|lynx|dillo|icab|doris|amaya|w3m|netsurf|sleipnir|obigo|mosaic|(?:go|ice|up)[\. ]?browser)[-\/ ]?v?([\w\.]+)/i, // Polaris/Lynx/Dillo/iCab/Doris/Amaya/w3m/NetSurf/Sleipnir/Obigo/Mosaic/Go/ICE/UP.Browser
  	      /(links) \(([\w\.]+)/i // Links
  	      ], [NAME, VERSION]],
  	      cpu: [[/(?:(amd|x(?:(?:86|64)[-_])?|wow|win)64)[;\)]/i // AMD64 (x64)
  	      ], [[ARCHITECTURE, 'amd64']], [/(ia32(?=;))/i // IA32 (quicktime)
  	      ], [[ARCHITECTURE, lowerize]], [/((?:i[346]|x)86)[;\)]/i // IA32 (x86)
  	      ], [[ARCHITECTURE, 'ia32']], [/\b(aarch64|arm(v?8e?l?|_?64))\b/i // ARM64
  	      ], [[ARCHITECTURE, 'arm64']], [/\b(arm(?:v[67])?ht?n?[fl]p?)\b/i // ARMHF
  	      ], [[ARCHITECTURE, 'armhf']], [// PocketPC mistakenly identified as PowerPC
  	      /windows (ce|mobile); ppc;/i], [[ARCHITECTURE, 'arm']], [/((?:ppc|powerpc)(?:64)?)(?: mac|;|\))/i // PowerPC
  	      ], [[ARCHITECTURE, /ower/, EMPTY, lowerize]], [/(sun4\w)[;\)]/i // SPARC
  	      ], [[ARCHITECTURE, 'sparc']], [/((?:avr32|ia64(?=;))|68k(?=\))|\barm(?=v(?:[1-7]|[5-7]1)l?|;|eabi)|(?=atmel )avr|(?:irix|mips|sparc)(?:64)?\b|pa-risc)/i // IA64, 68K, ARM/64, AVR/32, IRIX/64, MIPS/64, SPARC/64, PA-RISC
  	      ], [[ARCHITECTURE, lowerize]]],
  	      device: [[//////////////////////////
  	      // MOBILES & TABLETS
  	      // Ordered by popularity
  	      /////////////////////////
  	      // Samsung
  	      /\b(sch-i[89]0\d|shw-m380s|sm-[pt]\w{2,4}|gt-[pn]\d{2,4}|sgh-t8[56]9|nexus 10)/i], [MODEL, [VENDOR, SAMSUNG], [TYPE, TABLET]], [/\b((?:s[cgp]h|gt|sm)-\w+|galaxy nexus)/i, /samsung[- ]([-\w]+)/i, /sec-(sgh\w+)/i], [MODEL, [VENDOR, SAMSUNG], [TYPE, MOBILE]], [// Apple
  	      /((ipod|iphone)\d+,\d+)/i // iPod/iPhone model
  	      ], [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]], [/(ipad\d+,\d+)/i // iPad model
  	      ], [MODEL, [VENDOR, APPLE], [TYPE, TABLET]], [/\((ip(?:hone|od)[\w ]*);/i // iPod/iPhone
  	      ], [MODEL, [VENDOR, APPLE], [TYPE, MOBILE]], [/\((ipad);[-\w\),; ]+apple/i, // iPad
  	      /applecoremedia\/[\w\.]+ \((ipad)/i, /\b(ipad)\d\d?,\d\d?[;\]].+ios/i], [MODEL, [VENDOR, APPLE], [TYPE, TABLET]], [// Huawei
  	      /\b((?:ag[rs][23]?|bah2?|sht?|btv)-a?[lw]\d{2})\b(?!.+d\/s)/i], [MODEL, [VENDOR, HUAWEI], [TYPE, TABLET]], [/(?:huawei|honor)([-\w ]+)[;\)]/i, /\b(nexus 6p|\w{2,4}-[atu]?[ln][01259x][012359][an]?)\b(?!.+d\/s)/i], [MODEL, [VENDOR, HUAWEI], [TYPE, MOBILE]], [// Xiaomi
  	      /\b(poco[\w ]+)(?: bui|\))/i, // Xiaomi POCO
  	      /\b; (\w+) build\/hm\1/i, // Xiaomi Hongmi 'numeric' models
  	      /\b(hm[-_ ]?note?[_ ]?(?:\d\w)?) bui/i, // Xiaomi Hongmi
  	      /\b(redmi[\-_ ]?(?:note|k)?[\w_ ]+)(?: bui|\))/i, // Xiaomi Redmi
  	      /\b(mi[-_ ]?(?:a\d|one|one[_ ]plus|note lte|max)?[_ ]?(?:\d?\w?)[_ ]?(?:plus|se|lite)?)(?: bui|\))/i // Xiaomi Mi
  	      ], [[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, MOBILE]], [/\b(mi[-_ ]?(?:pad)(?:[\w_ ]+))(?: bui|\))/i // Mi Pad tablets
  	      ], [[MODEL, /_/g, ' '], [VENDOR, XIAOMI], [TYPE, TABLET]], [// OPPO
  	      /; (\w+) bui.+ oppo/i, /\b(cph[12]\d{3}|p(?:af|c[al]|d\w|e[ar])[mt]\d0|x9007)\b/i], [MODEL, [VENDOR, 'OPPO'], [TYPE, MOBILE]], [// Vivo
  	      /vivo (\w+)(?: bui|\))/i, /\b(v[12]\d{3}\w?[at])(?: bui|;)/i], [MODEL, [VENDOR, 'Vivo'], [TYPE, MOBILE]], [// Realme
  	      /\b(rmx[12]\d{3})(?: bui|;|\))/i], [MODEL, [VENDOR, 'Realme'], [TYPE, MOBILE]], [// Motorola
  	      /\b(milestone|droid(?:[2-4x]| (?:bionic|x2|pro|razr))?:?( 4g)?)\b[\w ]+build\//i, /\bmot(?:orola)?[- ](\w*)/i, /((?:moto[\w\(\) ]+|xt\d{3,4}|nexus 6)(?= bui|\)))/i], [MODEL, [VENDOR, MOTOROLA], [TYPE, MOBILE]], [/\b(mz60\d|xoom[2 ]{0,2}) build\//i], [MODEL, [VENDOR, MOTOROLA], [TYPE, TABLET]], [// LG
  	      /((?=lg)?[vl]k\-?\d{3}) bui| 3\.[-\w; ]{10}lg?-([06cv9]{3,4})/i], [MODEL, [VENDOR, LG], [TYPE, TABLET]], [/(lm(?:-?f100[nv]?|-[\w\.]+)(?= bui|\))|nexus [45])/i, /\blg[-e;\/ ]+((?!browser|netcast|android tv)\w+)/i, /\blg-?([\d\w]+) bui/i], [MODEL, [VENDOR, LG], [TYPE, MOBILE]], [// Lenovo
  	      /(ideatab[-\w ]+)/i, /lenovo ?(s[56]000[-\w]+|tab(?:[\w ]+)|yt[-\d\w]{6}|tb[-\d\w]{6})/i], [MODEL, [VENDOR, 'Lenovo'], [TYPE, TABLET]], [// Nokia
  	      /(?:maemo|nokia).*(n900|lumia \d+)/i, /nokia[-_ ]?([-\w\.]*)/i], [[MODEL, /_/g, ' '], [VENDOR, 'Nokia'], [TYPE, MOBILE]], [// Google
  	      /(pixel c)\b/i // Google Pixel C
  	      ], [MODEL, [VENDOR, GOOGLE], [TYPE, TABLET]], [/droid.+; (pixel[\daxl ]{0,6})(?: bui|\))/i // Google Pixel
  	      ], [MODEL, [VENDOR, GOOGLE], [TYPE, MOBILE]], [// Sony
  	      /droid.+ ([c-g]\d{4}|so[-l]\w+|xq-a\w[4-7][12])(?= bui|\).+chrome\/(?![1-6]{0,1}\d\.))/i], [MODEL, [VENDOR, SONY], [TYPE, MOBILE]], [/sony tablet [ps]/i, /\b(?:sony)?sgp\w+(?: bui|\))/i], [[MODEL, 'Xperia Tablet'], [VENDOR, SONY], [TYPE, TABLET]], [// OnePlus
  	      / (kb2005|in20[12]5|be20[12][59])\b/i, /(?:one)?(?:plus)? (a\d0\d\d)(?: b|\))/i], [MODEL, [VENDOR, 'OnePlus'], [TYPE, MOBILE]], [// Amazon
  	      /(alexa)webm/i, /(kf[a-z]{2}wi)( bui|\))/i, // Kindle Fire without Silk
  	      /(kf[a-z]+)( bui|\)).+silk\//i // Kindle Fire HD
  	      ], [MODEL, [VENDOR, AMAZON], [TYPE, TABLET]], [/((?:sd|kf)[0349hijorstuw]+)( bui|\)).+silk\//i // Fire Phone
  	      ], [[MODEL, /(.+)/g, 'Fire Phone $1'], [VENDOR, AMAZON], [TYPE, MOBILE]], [// BlackBerry
  	      /(playbook);[-\w\),; ]+(rim)/i // BlackBerry PlayBook
  	      ], [MODEL, VENDOR, [TYPE, TABLET]], [/\b((?:bb[a-f]|st[hv])100-\d)/i, /\(bb10; (\w+)/i // BlackBerry 10
  	      ], [MODEL, [VENDOR, BLACKBERRY], [TYPE, MOBILE]], [// Asus
  	      /(?:\b|asus_)(transfo[prime ]{4,10} \w+|eeepc|slider \w+|nexus 7|padfone|p00[cj])/i], [MODEL, [VENDOR, ASUS], [TYPE, TABLET]], [/ (z[bes]6[027][012][km][ls]|zenfone \d\w?)\b/i], [MODEL, [VENDOR, ASUS], [TYPE, MOBILE]], [// HTC
  	      /(nexus 9)/i // HTC Nexus 9
  	      ], [MODEL, [VENDOR, 'HTC'], [TYPE, TABLET]], [/(htc)[-;_ ]{1,2}([\w ]+(?=\)| bui)|\w+)/i, // HTC
  	      // ZTE
  	      /(zte)[- ]([\w ]+?)(?: bui|\/|\))/i, /(alcatel|geeksphone|nexian|panasonic|sony)[-_ ]?([-\w]*)/i // Alcatel/GeeksPhone/Nexian/Panasonic/Sony
  	      ], [VENDOR, [MODEL, /_/g, ' '], [TYPE, MOBILE]], [// Acer
  	      /droid.+; ([ab][1-7]-?[0178a]\d\d?)/i], [MODEL, [VENDOR, 'Acer'], [TYPE, TABLET]], [// Meizu
  	      /droid.+; (m[1-5] note) bui/i, /\bmz-([-\w]{2,})/i], [MODEL, [VENDOR, 'Meizu'], [TYPE, MOBILE]], [// Sharp
  	      /\b(sh-?[altvz]?\d\d[a-ekm]?)/i], [MODEL, [VENDOR, 'Sharp'], [TYPE, MOBILE]], [// MIXED
  	      /(blackberry|benq|palm(?=\-)|sonyericsson|acer|asus|dell|meizu|motorola|polytron)[-_ ]?([-\w]*)/i, // BlackBerry/BenQ/Palm/Sony-Ericsson/Acer/Asus/Dell/Meizu/Motorola/Polytron
  	      /(hp) ([\w ]+\w)/i, // HP iPAQ
  	      /(asus)-?(\w+)/i, // Asus
  	      /(microsoft); (lumia[\w ]+)/i, // Microsoft Lumia
  	      /(lenovo)[-_ ]?([-\w]+)/i, // Lenovo
  	      /(jolla)/i, // Jolla
  	      /(oppo) ?([\w ]+) bui/i // OPPO
  	      ], [VENDOR, MODEL, [TYPE, MOBILE]], [/(archos) (gamepad2?)/i, // Archos
  	      /(hp).+(touchpad(?!.+tablet)|tablet)/i, // HP TouchPad
  	      /(kindle)\/([\w\.]+)/i, // Kindle
  	      /(nook)[\w ]+build\/(\w+)/i, // Nook
  	      /(dell) (strea[kpr\d ]*[\dko])/i, // Dell Streak
  	      /(le[- ]+pan)[- ]+(\w{1,9}) bui/i, // Le Pan Tablets
  	      /(trinity)[- ]*(t\d{3}) bui/i, // Trinity Tablets
  	      /(gigaset)[- ]+(q\w{1,9}) bui/i, // Gigaset Tablets
  	      /(vodafone) ([\w ]+)(?:\)| bui)/i // Vodafone
  	      ], [VENDOR, MODEL, [TYPE, TABLET]], [/(surface duo)/i // Surface Duo
  	      ], [MODEL, [VENDOR, MICROSOFT], [TYPE, TABLET]], [/droid [\d\.]+; (fp\du?)(?: b|\))/i // Fairphone
  	      ], [MODEL, [VENDOR, 'Fairphone'], [TYPE, MOBILE]], [/(u304aa)/i // AT&T
  	      ], [MODEL, [VENDOR, 'AT&T'], [TYPE, MOBILE]], [/\bsie-(\w*)/i // Siemens
  	      ], [MODEL, [VENDOR, 'Siemens'], [TYPE, MOBILE]], [/\b(rct\w+) b/i // RCA Tablets
  	      ], [MODEL, [VENDOR, 'RCA'], [TYPE, TABLET]], [/\b(venue[\d ]{2,7}) b/i // Dell Venue Tablets
  	      ], [MODEL, [VENDOR, 'Dell'], [TYPE, TABLET]], [/\b(q(?:mv|ta)\w+) b/i // Verizon Tablet
  	      ], [MODEL, [VENDOR, 'Verizon'], [TYPE, TABLET]], [/\b(?:barnes[& ]+noble |bn[rt])([\w\+ ]*) b/i // Barnes & Noble Tablet
  	      ], [MODEL, [VENDOR, 'Barnes & Noble'], [TYPE, TABLET]], [/\b(tm\d{3}\w+) b/i], [MODEL, [VENDOR, 'NuVision'], [TYPE, TABLET]], [/\b(k88) b/i // ZTE K Series Tablet
  	      ], [MODEL, [VENDOR, 'ZTE'], [TYPE, TABLET]], [/\b(nx\d{3}j) b/i // ZTE Nubia
  	      ], [MODEL, [VENDOR, 'ZTE'], [TYPE, MOBILE]], [/\b(gen\d{3}) b.+49h/i // Swiss GEN Mobile
  	      ], [MODEL, [VENDOR, 'Swiss'], [TYPE, MOBILE]], [/\b(zur\d{3}) b/i // Swiss ZUR Tablet
  	      ], [MODEL, [VENDOR, 'Swiss'], [TYPE, TABLET]], [/\b((zeki)?tb.*\b) b/i // Zeki Tablets
  	      ], [MODEL, [VENDOR, 'Zeki'], [TYPE, TABLET]], [/\b([yr]\d{2}) b/i, /\b(dragon[- ]+touch |dt)(\w{5}) b/i // Dragon Touch Tablet
  	      ], [[VENDOR, 'Dragon Touch'], MODEL, [TYPE, TABLET]], [/\b(ns-?\w{0,9}) b/i // Insignia Tablets
  	      ], [MODEL, [VENDOR, 'Insignia'], [TYPE, TABLET]], [/\b((nxa|next)-?\w{0,9}) b/i // NextBook Tablets
  	      ], [MODEL, [VENDOR, 'NextBook'], [TYPE, TABLET]], [/\b(xtreme\_)?(v(1[045]|2[015]|[3469]0|7[05])) b/i // Voice Xtreme Phones
  	      ], [[VENDOR, 'Voice'], MODEL, [TYPE, MOBILE]], [/\b(lvtel\-)?(v1[12]) b/i // LvTel Phones
  	      ], [[VENDOR, 'LvTel'], MODEL, [TYPE, MOBILE]], [/\b(ph-1) /i // Essential PH-1
  	      ], [MODEL, [VENDOR, 'Essential'], [TYPE, MOBILE]], [/\b(v(100md|700na|7011|917g).*\b) b/i // Envizen Tablets
  	      ], [MODEL, [VENDOR, 'Envizen'], [TYPE, TABLET]], [/\b(trio[-\w\. ]+) b/i // MachSpeed Tablets
  	      ], [MODEL, [VENDOR, 'MachSpeed'], [TYPE, TABLET]], [/\btu_(1491) b/i // Rotor Tablets
  	      ], [MODEL, [VENDOR, 'Rotor'], [TYPE, TABLET]], [/(shield[\w ]+) b/i // Nvidia Shield Tablets
  	      ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, TABLET]], [/(sprint) (\w+)/i // Sprint Phones
  	      ], [VENDOR, MODEL, [TYPE, MOBILE]], [/(kin\.[onetw]{3})/i // Microsoft Kin
  	      ], [[MODEL, /\./g, ' '], [VENDOR, MICROSOFT], [TYPE, MOBILE]], [/droid.+; (cc6666?|et5[16]|mc[239][23]x?|vc8[03]x?)\)/i // Zebra
  	      ], [MODEL, [VENDOR, ZEBRA], [TYPE, TABLET]], [/droid.+; (ec30|ps20|tc[2-8]\d[kx])\)/i], [MODEL, [VENDOR, ZEBRA], [TYPE, MOBILE]], [///////////////////
  	      // CONSOLES
  	      ///////////////////
  	      /(ouya)/i, // Ouya
  	      /(nintendo) ([wids3utch]+)/i // Nintendo
  	      ], [VENDOR, MODEL, [TYPE, CONSOLE]], [/droid.+; (shield) bui/i // Nvidia
  	      ], [MODEL, [VENDOR, 'Nvidia'], [TYPE, CONSOLE]], [/(playstation [345portablevi]+)/i // Playstation
  	      ], [MODEL, [VENDOR, SONY], [TYPE, CONSOLE]], [/\b(xbox(?: one)?(?!; xbox))[\); ]/i // Microsoft Xbox
  	      ], [MODEL, [VENDOR, MICROSOFT], [TYPE, CONSOLE]], [///////////////////
  	      // SMARTTVS
  	      ///////////////////
  	      /smart-tv.+(samsung)/i // Samsung
  	      ], [VENDOR, [TYPE, SMARTTV]], [/hbbtv.+maple;(\d+)/i], [[MODEL, /^/, 'SmartTV'], [VENDOR, SAMSUNG], [TYPE, SMARTTV]], [/(nux; netcast.+smarttv|lg (netcast\.tv-201\d|android tv))/i // LG SmartTV
  	      ], [[VENDOR, LG], [TYPE, SMARTTV]], [/(apple) ?tv/i // Apple TV
  	      ], [VENDOR, [MODEL, APPLE + ' TV'], [TYPE, SMARTTV]], [/crkey/i // Google Chromecast
  	      ], [[MODEL, CHROME + 'cast'], [VENDOR, GOOGLE], [TYPE, SMARTTV]], [/droid.+aft(\w)( bui|\))/i // Fire TV
  	      ], [MODEL, [VENDOR, AMAZON], [TYPE, SMARTTV]], [/\(dtv[\);].+(aquos)/i // Sharp
  	      ], [MODEL, [VENDOR, 'Sharp'], [TYPE, SMARTTV]], [/\b(roku)[\dx]*[\)\/]((?:dvp-)?[\d\.]*)/i, // Roku
  	      /hbbtv\/\d+\.\d+\.\d+ +\([\w ]*; *(\w[^;]*);([^;]*)/i // HbbTV devices
  	      ], [[VENDOR, trim], [MODEL, trim], [TYPE, SMARTTV]], [/\b(android tv|smart[- ]?tv|opera tv|tv; rv:)\b/i // SmartTV from Unidentified Vendors
  	      ], [[TYPE, SMARTTV]], [///////////////////
  	      // WEARABLES
  	      ///////////////////
  	      /((pebble))app/i // Pebble
  	      ], [VENDOR, MODEL, [TYPE, WEARABLE]], [/droid.+; (glass) \d/i // Google Glass
  	      ], [MODEL, [VENDOR, GOOGLE], [TYPE, WEARABLE]], [/droid.+; (wt63?0{2,3})\)/i], [MODEL, [VENDOR, ZEBRA], [TYPE, WEARABLE]], [///////////////////
  	      // EMBEDDED
  	      ///////////////////
  	      /(tesla)(?: qtcarbrowser|\/[-\w\.]+)/i // Tesla
  	      ], [VENDOR, [TYPE, EMBEDDED]], [////////////////////
  	      // MIXED (GENERIC)
  	      ///////////////////
  	      /droid .+?; ([^;]+?)(?: bui|\) applew).+? mobile safari/i // Android Phones from Unidentified Vendors
  	      ], [MODEL, [TYPE, MOBILE]], [/droid .+?; ([^;]+?)(?: bui|\) applew).+?(?! mobile) safari/i // Android Tablets from Unidentified Vendors
  	      ], [MODEL, [TYPE, TABLET]], [/\b((tablet|tab)[;\/]|focus\/\d(?!.+mobile))/i // Unidentifiable Tablet
  	      ], [[TYPE, TABLET]], [/(phone|mobile(?:[;\/]| safari)|pda(?=.+windows ce))/i // Unidentifiable Mobile
  	      ], [[TYPE, MOBILE]], [/(android[-\w\. ]{0,9});.+buil/i // Generic Android Device
  	      ], [MODEL, [VENDOR, 'Generic']]],
  	      engine: [[/windows.+ edge\/([\w\.]+)/i // EdgeHTML
  	      ], [VERSION, [NAME, EDGE + 'HTML']], [/webkit\/537\.36.+chrome\/(?!27)([\w\.]+)/i // Blink
  	      ], [VERSION, [NAME, 'Blink']], [/(presto)\/([\w\.]+)/i, // Presto
  	      /(webkit|trident|netfront|netsurf|amaya|lynx|w3m|goanna)\/([\w\.]+)/i, // WebKit/Trident/NetFront/NetSurf/Amaya/Lynx/w3m/Goanna
  	      /ekioh(flow)\/([\w\.]+)/i, // Flow
  	      /(khtml|tasman|links)[\/ ]\(?([\w\.]+)/i, // KHTML/Tasman/Links
  	      /(icab)[\/ ]([23]\.[\d\.]+)/i // iCab
  	      ], [NAME, VERSION], [/rv\:([\w\.]{1,9})\b.+(gecko)/i // Gecko
  	      ], [VERSION, NAME]],
  	      os: [[// Windows
  	      /microsoft (windows) (vista|xp)/i // Windows (iTunes)
  	      ], [NAME, VERSION], [/(windows) nt 6\.2; (arm)/i, // Windows RT
  	      /(windows (?:phone(?: os)?|mobile))[\/ ]?([\d\.\w ]*)/i, // Windows Phone
  	      /(windows)[\/ ]?([ntce\d\. ]+\w)(?!.+xbox)/i], [NAME, [VERSION, strMapper, windowsVersionMap]], [/(win(?=3|9|n)|win 9x )([nt\d\.]+)/i], [[NAME, 'Windows'], [VERSION, strMapper, windowsVersionMap]], [// iOS/macOS
  	      /ip[honead]{2,4}\b(?:.*os ([\w]+) like mac|; opera)/i, // iOS
  	      /cfnetwork\/.+darwin/i], [[VERSION, /_/g, '.'], [NAME, 'iOS']], [/(mac os x) ?([\w\. ]*)/i, /(macintosh|mac_powerpc\b)(?!.+haiku)/i // Mac OS
  	      ], [[NAME, 'Mac OS'], [VERSION, /_/g, '.']], [// Mobile OSes
  	      /droid ([\w\.]+)\b.+(android[- ]x86)/i // Android-x86
  	      ], [VERSION, NAME], [// Android/WebOS/QNX/Bada/RIM/Maemo/MeeGo/Sailfish OS
  	      /(android|webos|qnx|bada|rim tablet os|maemo|meego|sailfish)[-\/ ]?([\w\.]*)/i, /(blackberry)\w*\/([\w\.]*)/i, // Blackberry
  	      /(tizen|kaios)[\/ ]([\w\.]+)/i, // Tizen/KaiOS
  	      /\((series40);/i // Series 40
  	      ], [NAME, VERSION], [/\(bb(10);/i // BlackBerry 10
  	      ], [VERSION, [NAME, BLACKBERRY]], [/(?:symbian ?os|symbos|s60(?=;)|series60)[-\/ ]?([\w\.]*)/i // Symbian
  	      ], [VERSION, [NAME, 'Symbian']], [/mozilla\/[\d\.]+ \((?:mobile|tablet|tv|mobile; [\w ]+); rv:.+ gecko\/([\w\.]+)/i // Firefox OS
  	      ], [VERSION, [NAME, FIREFOX + ' OS']], [/web0s;.+rt(tv)/i, /\b(?:hp)?wos(?:browser)?\/([\w\.]+)/i // WebOS
  	      ], [VERSION, [NAME, 'webOS']], [// Google Chromecast
  	      /crkey\/([\d\.]+)/i // Google Chromecast
  	      ], [VERSION, [NAME, CHROME + 'cast']], [/(cros) [\w]+ ([\w\.]+\w)/i // Chromium OS
  	      ], [[NAME, 'Chromium OS'], VERSION], [// Console
  	      /(nintendo|playstation) ([wids345portablevuch]+)/i, // Nintendo/Playstation
  	      /(xbox); +xbox ([^\);]+)/i, // Microsoft Xbox (360, One, X, S, Series X, Series S)
  	      // Other
  	      /\b(joli|palm)\b ?(?:os)?\/?([\w\.]*)/i, // Joli/Palm
  	      /(mint)[\/\(\) ]?(\w*)/i, // Mint
  	      /(mageia|vectorlinux)[; ]/i, // Mageia/VectorLinux
  	      /([kxln]?ubuntu|debian|suse|opensuse|gentoo|arch(?= linux)|slackware|fedora|mandriva|centos|pclinuxos|red ?hat|zenwalk|linpus|raspbian|plan 9|minix|risc os|contiki|deepin|manjaro|elementary os|sabayon|linspire)(?: gnu\/linux)?(?: enterprise)?(?:[- ]linux)?(?:-gnu)?[-\/ ]?(?!chrom|package)([-\w\.]*)/i, // Ubuntu/Debian/SUSE/Gentoo/Arch/Slackware/Fedora/Mandriva/CentOS/PCLinuxOS/RedHat/Zenwalk/Linpus/Raspbian/Plan9/Minix/RISCOS/Contiki/Deepin/Manjaro/elementary/Sabayon/Linspire
  	      /(hurd|linux) ?([\w\.]*)/i, // Hurd/Linux
  	      /(gnu) ?([\w\.]*)/i, // GNU
  	      /\b([-frentopcghs]{0,5}bsd|dragonfly)[\/ ]?(?!amd|[ix346]{1,2}86)([\w\.]*)/i, // FreeBSD/NetBSD/OpenBSD/PC-BSD/GhostBSD/DragonFly
  	      /(haiku) (\w+)/i // Haiku
  	      ], [NAME, VERSION], [/(sunos) ?([\w\.\d]*)/i // Solaris
  	      ], [[NAME, 'Solaris'], VERSION], [/((?:open)?solaris)[-\/ ]?([\w\.]*)/i, // Solaris
  	      /(aix) ((\d)(?=\.|\)| )[\w\.])*/i, // AIX
  	      /\b(beos|os\/2|amigaos|morphos|openvms|fuchsia|hp-ux)/i, // BeOS/OS2/AmigaOS/MorphOS/OpenVMS/Fuchsia/HP-UX
  	      /(unix) ?([\w\.]*)/i // UNIX
  	      ], [NAME, VERSION]]
  	    }; /////////////////
  	    // Constructor
  	    ////////////////

  	    var UAParser = function (ua, extensions) {
  	      if (typeof ua === OBJ_TYPE) {
  	        extensions = ua;
  	        ua = undefined$1;
  	      }

  	      if (!(this instanceof UAParser)) {
  	        return new UAParser(ua, extensions).getResult();
  	      }

  	      var _ua = ua || (typeof window !== UNDEF_TYPE && window.navigator && window.navigator.userAgent ? window.navigator.userAgent : EMPTY);

  	      var _rgxmap = extensions ? extend(regexes, extensions) : regexes;

  	      this.getBrowser = function () {
  	        var _browser = {};
  	        _browser[NAME] = undefined$1;
  	        _browser[VERSION] = undefined$1;
  	        rgxMapper.call(_browser, _ua, _rgxmap.browser);
  	        _browser.major = majorize(_browser.version);
  	        return _browser;
  	      };

  	      this.getCPU = function () {
  	        var _cpu = {};
  	        _cpu[ARCHITECTURE] = undefined$1;
  	        rgxMapper.call(_cpu, _ua, _rgxmap.cpu);
  	        return _cpu;
  	      };

  	      this.getDevice = function () {
  	        var _device = {};
  	        _device[VENDOR] = undefined$1;
  	        _device[MODEL] = undefined$1;
  	        _device[TYPE] = undefined$1;
  	        rgxMapper.call(_device, _ua, _rgxmap.device);
  	        return _device;
  	      };

  	      this.getEngine = function () {
  	        var _engine = {};
  	        _engine[NAME] = undefined$1;
  	        _engine[VERSION] = undefined$1;
  	        rgxMapper.call(_engine, _ua, _rgxmap.engine);
  	        return _engine;
  	      };

  	      this.getOS = function () {
  	        var _os = {};
  	        _os[NAME] = undefined$1;
  	        _os[VERSION] = undefined$1;
  	        rgxMapper.call(_os, _ua, _rgxmap.os);
  	        return _os;
  	      };

  	      this.getResult = function () {
  	        return {
  	          ua: this.getUA(),
  	          browser: this.getBrowser(),
  	          engine: this.getEngine(),
  	          os: this.getOS(),
  	          device: this.getDevice(),
  	          cpu: this.getCPU()
  	        };
  	      };

  	      this.getUA = function () {
  	        return _ua;
  	      };

  	      this.setUA = function (ua) {
  	        _ua = typeof ua === STR_TYPE && ua.length > UA_MAX_LENGTH ? trim(ua, UA_MAX_LENGTH) : ua;
  	        return this;
  	      };

  	      this.setUA(_ua);
  	      return this;
  	    };

  	    UAParser.VERSION = LIBVERSION;
  	    UAParser.BROWSER = enumerize([NAME, VERSION, MAJOR]);
  	    UAParser.CPU = enumerize([ARCHITECTURE]);
  	    UAParser.DEVICE = enumerize([MODEL, VENDOR, TYPE, CONSOLE, MOBILE, SMARTTV, TABLET, WEARABLE, EMBEDDED]);
  	    UAParser.ENGINE = UAParser.OS = enumerize([NAME, VERSION]); ///////////
  	    // Export
  	    //////////
  	    // check js environment

  	    {
  	      // nodejs env
  	      if (module.exports) {
  	        exports = module.exports = UAParser;
  	      }

  	      exports.UAParser = UAParser;
  	    } // jQuery/Zepto specific (optional)
  	    // Note:
  	    //   In AMD env the global scope should be kept clean, but jQuery is an exception.
  	    //   jQuery always exports to global scope, unless jQuery.noConflict(true) is used,
  	    //   and we should catch that.


  	    var $ = typeof window !== UNDEF_TYPE && (window.jQuery || window.Zepto);

  	    if ($ && !$.ua) {
  	      var parser = new UAParser();
  	      $.ua = parser.getResult();

  	      $.ua.get = function () {
  	        return parser.getUA();
  	      };

  	      $.ua.set = function (ua) {
  	        parser.setUA(ua);
  	        var result = parser.getResult();

  	        for (var prop in result) {
  	          $.ua[prop] = result[prop];
  	        }
  	      };
  	    }
  	  })(typeof window === 'object' ? window : commonjsGlobal$1);
  	});

  	var ApplicationContextProviderImpl = /** @class */ (function () {
  	    function ApplicationContextProviderImpl() {
  	        this.ua = new uaParser.UAParser(navigator.userAgent).getResult();
  	    }
  	    ApplicationContextProviderImpl.prototype.getApplicationContext = function () {
  	        return {
  	            versionName: this.versionName,
  	            language: getLanguage(),
  	            platform: 'Web',
  	            os: getOs(this.ua),
  	            deviceModel: getDeviceModel(this.ua),
  	        };
  	    };
  	    return ApplicationContextProviderImpl;
  	}());
  	var getOs = function (ua) {
  	    var _a, _b;
  	    return [(_a = ua.browser) === null || _a === void 0 ? void 0 : _a.name, (_b = ua.browser) === null || _b === void 0 ? void 0 : _b.major]
  	        .filter(function (e) { return e !== null && e !== undefined; })
  	        .join(' ');
  	};
  	var getDeviceModel = function (ua) {
  	    var _a;
  	    return (_a = ua.os) === null || _a === void 0 ? void 0 : _a.name;
  	};
  	var getLanguage = function () {
  	    return ((typeof navigator !== 'undefined' &&
  	        ((navigator.languages && navigator.languages[0]) ||
  	            navigator.language)) ||
  	        '');
  	};

  	var EventBridgeImpl = /** @class */ (function () {
  	    function EventBridgeImpl() {
  	        this.queue = [];
  	    }
  	    EventBridgeImpl.prototype.logEvent = function (event) {
  	        if (!this.receiver) {
  	            if (this.queue.length < 512) {
  	                this.queue.push(event);
  	            }
  	        }
  	        else {
  	            this.receiver(event);
  	        }
  	    };
  	    EventBridgeImpl.prototype.setEventReceiver = function (receiver) {
  	        this.receiver = receiver;
  	        if (this.queue.length > 0) {
  	            this.queue.forEach(function (event) {
  	                receiver(event);
  	            });
  	            this.queue = [];
  	        }
  	    };
  	    return EventBridgeImpl;
  	}());

  	/*! *****************************************************************************
  	Copyright (c) Microsoft Corporation.

  	Permission to use, copy, modify, and/or distribute this software for any
  	purpose with or without fee is hereby granted.

  	THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
  	REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
  	AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
  	INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
  	LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
  	OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
  	PERFORMANCE OF THIS SOFTWARE.
  	***************************************************************************** */
  	var __assign = function () {
  	  __assign = Object.assign || function __assign(t) {
  	    for (var s, i = 1, n = arguments.length; i < n; i++) {
  	      s = arguments[i];

  	      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
  	    }

  	    return t;
  	  };

  	  return __assign.apply(this, arguments);
  	};

  	var ID_OP_SET = '$set';
  	var ID_OP_UNSET = '$unset';
  	var ID_OP_CLEAR_ALL = '$clearAll';
  	var IdentityStoreImpl = /** @class */ (function () {
  	    function IdentityStoreImpl() {
  	        this.identity = { userProperties: {} };
  	        this.listeners = new Set();
  	    }
  	    IdentityStoreImpl.prototype.editIdentity = function () {
  	        // eslint-disable-next-line @typescript-eslint/no-this-alias
  	        var self = this;
  	        var actingUserProperties = __assign({}, this.identity.userProperties);
  	        var actingIdentity = __assign(__assign({}, this.identity), { userProperties: actingUserProperties });
  	        return {
  	            setUserId: function (userId) {
  	                actingIdentity.userId = userId;
  	                return this;
  	            },
  	            setDeviceId: function (deviceId) {
  	                actingIdentity.deviceId = deviceId;
  	                return this;
  	            },
  	            setUserProperties: function (userProperties) {
  	                actingIdentity.userProperties = userProperties;
  	                return this;
  	            },
  	            updateUserProperties: function (actions) {
  	                var actingProperties = actingIdentity.userProperties || {};
  	                for (var _i = 0, _a = Object.entries(actions); _i < _a.length; _i++) {
  	                    var _b = _a[_i], action = _b[0], properties = _b[1];
  	                    switch (action) {
  	                        case ID_OP_SET:
  	                            for (var _c = 0, _d = Object.entries(properties); _c < _d.length; _c++) {
  	                                var _e = _d[_c], key = _e[0], value = _e[1];
  	                                actingProperties[key] = value;
  	                            }
  	                            break;
  	                        case ID_OP_UNSET:
  	                            for (var _f = 0, _g = Object.keys(properties); _f < _g.length; _f++) {
  	                                var key = _g[_f];
  	                                delete actingProperties[key];
  	                            }
  	                            break;
  	                        case ID_OP_CLEAR_ALL:
  	                            actingProperties = {};
  	                            break;
  	                    }
  	                }
  	                actingIdentity.userProperties = actingProperties;
  	                return this;
  	            },
  	            commit: function () {
  	                self.setIdentity(actingIdentity);
  	                return this;
  	            },
  	        };
  	    };
  	    IdentityStoreImpl.prototype.getIdentity = function () {
  	        return __assign({}, this.identity);
  	    };
  	    IdentityStoreImpl.prototype.setIdentity = function (identity) {
  	        var originalIdentity = __assign({}, this.identity);
  	        this.identity = __assign({}, identity);
  	        if (!isEqual(originalIdentity, this.identity)) {
  	            this.listeners.forEach(function (listener) {
  	                listener(identity);
  	            });
  	        }
  	    };
  	    IdentityStoreImpl.prototype.addIdentityListener = function (listener) {
  	        this.listeners.add(listener);
  	    };
  	    IdentityStoreImpl.prototype.removeIdentityListener = function (listener) {
  	        this.listeners.delete(listener);
  	    };
  	    return IdentityStoreImpl;
  	}());
  	// eslint-disable-next-line @typescript-eslint/no-explicit-any
  	var isEqual = function (obj1, obj2) {
  	    var primitive = ['string', 'number', 'boolean', 'undefined'];
  	    var typeA = typeof obj1;
  	    var typeB = typeof obj2;
  	    if (typeA !== typeB) {
  	        return false;
  	    }
  	    if (primitive.includes(typeA)) {
  	        return obj1 === obj2;
  	    }
  	    //if got here - objects
  	    if (obj1.length !== obj2.length) {
  	        return false;
  	    }
  	    //check if arrays
  	    var isArrayA = Array.isArray(obj1);
  	    var isArrayB = Array.isArray(obj2);
  	    if (isArrayA !== isArrayB) {
  	        return false;
  	    }
  	    if (isArrayA && isArrayB) {
  	        //arrays
  	        for (var i = 0; i < obj1.length; i++) {
  	            if (!isEqual(obj1[i], obj2[i])) {
  	                return false;
  	            }
  	        }
  	    }
  	    else {
  	        //objects
  	        var sorted1 = Object.keys(obj1).sort();
  	        var sorted2 = Object.keys(obj2).sort();
  	        if (!isEqual(sorted1, sorted2)) {
  	            return false;
  	        }
  	        //compare object values
  	        var result_1 = true;
  	        Object.keys(obj1).forEach(function (key) {
  	            if (!isEqual(obj1[key], obj2[key])) {
  	                result_1 = false;
  	            }
  	        });
  	        return result_1;
  	    }
  	    return true;
  	};

  	var safeGlobal = typeof globalThis !== 'undefined' ? globalThis : commonjsGlobal || self;

  	safeGlobal['analyticsConnectorInstances'] = {};
  	var AnalyticsConnector = /** @class */ (function () {
  	    function AnalyticsConnector() {
  	        this.identityStore = new IdentityStoreImpl();
  	        this.eventBridge = new EventBridgeImpl();
  	        this.applicationContextProvider = new ApplicationContextProviderImpl();
  	    }
  	    AnalyticsConnector.getInstance = function (instanceName) {
  	        if (!safeGlobal['analyticsConnectorInstances'][instanceName]) {
  	            safeGlobal['analyticsConnectorInstances'][instanceName] =
  	                new AnalyticsConnector();
  	        }
  	        return safeGlobal['analyticsConnectorInstances'][instanceName];
  	    };
  	    return AnalyticsConnector;
  	}());

  	exports.AnalyticsConnector = AnalyticsConnector;

  	Object.defineProperty(exports, '__esModule', { value: true });

  }));
  });

  /**
   * AmplitudeClient SDK API - instance constructor.
   * The Amplitude class handles creation of client instances, all you need to do is call amplitude.getInstance()
   * @constructor AmplitudeClient
   * @public
   * @example var amplitudeClient = new AmplitudeClient();
   */

  var AmplitudeClient = function AmplitudeClient(instanceName) {
    if (!isBrowserEnv() && !utils.isWebWorkerEnvironment()) {
      utils.log.warn('amplitude-js will not work in a non-browser environment. If you are planning to add Amplitude to a node environment, please use @amplitude/node');
    }

    this._instanceName = utils.isEmptyString(instanceName) ? Constants.DEFAULT_INSTANCE : instanceName.toLowerCase();
    this._unsentEvents = [];
    this._unsentIdentifys = [];
    this._ua = new uaParser(navigator.userAgent).getResult();
    this.options = _objectSpread({}, DEFAULT_OPTIONS, {
      trackingOptions: _objectSpread({}, DEFAULT_OPTIONS.trackingOptions)
    });
    this.cookieStorage = new cookieStorage().getStorage();
    this._q = []; // queue for proxied functions before script load

    this._sending = false;
    this._updateScheduled = false;
    this._onInitCallbacks = [];
    this._onNewSessionStartCallbacks = []; // event meta data

    this._eventId = 0;
    this._identifyId = 0;
    this._lastEventTime = null;
    this._newSession = false; // sequence used for by frontend for prioritizing event send retries

    this._sequenceNumber = 0;
    this._sessionId = null;
    this._isInitialized = false; // used to integrate with experiment SDK (client-side exposure tracking & real-time user properties)

    this._connector = null;
    this._userAgent = navigator && navigator.userAgent || null;
  };

  AmplitudeClient.prototype.Identify = Identify;
  AmplitudeClient.prototype.Revenue = Revenue;
  /**
   * Initializes the Amplitude Javascript SDK with your apiKey and any optional configurations.
   * This is required before any other methods can be called.
   * @public
   * @param {string} apiKey - The API key for your app.
   * @param {string} opt_userId - (optional) An identifier for this user.
   * @param {object} opt_config - (optional) Configuration options.
   * See [options.js](https://amplitude.github.io/Amplitude-JavaScript/Options) for a list of options and default values.
   * @param {function} opt_callback - (optional) Provide a callback function to run after initialization is complete.
   * @example amplitudeClient.init('API_KEY', 'USER_ID', {includeReferrer: true, includeUtm: true}, function() { alert('init complete'); });
   */

  AmplitudeClient.prototype.init = function init(apiKey, opt_userId, opt_config, opt_callback) {
    var _this = this;

    if (type(apiKey) !== 'string' || utils.isEmptyString(apiKey)) {
      utils.log.error('Invalid apiKey. Please re-initialize with a valid apiKey');
      return;
    }

    try {
      // used to integrate with experiment SDK (client-side exposure tracking & real-time user properties)
      this._connector = analyticsConnector_umd.AnalyticsConnector.getInstance(this._instanceName);

      _parseConfig(this.options, opt_config);

      if ((isBrowserEnv() || utils.isWebWorkerEnvironment()) && GlobalScope.Prototype !== undefined && Array.prototype.toJSON) {
        prototypeJsFix();
        utils.log.warn('Prototype.js injected Array.prototype.toJSON. Deleting Array.prototype.toJSON to prevent double-stringify');
      }

      if (this.options.cookieName !== DEFAULT_OPTIONS.cookieName) {
        utils.log.warn('The cookieName option is deprecated. We will be ignoring it for newer cookies');
      }

      if (this.options.serverZoneBasedApi) {
        this.options.apiEndpoint = getEventLogApi(this.options.serverZone);
      }

      this._refreshDynamicConfig();

      this.options.apiKey = apiKey;
      this._storageSuffix = '_' + apiKey + (this._instanceName === Constants.DEFAULT_INSTANCE ? '' : '_' + this._instanceName);
      this._storageSuffixV5 = apiKey.slice(0, 6);
      this._oldCookiename = this.options.cookieName + this._storageSuffix;
      this._unsentKey = this.options.unsentKey + this._storageSuffix;
      this._unsentIdentifyKey = this.options.unsentIdentifyKey + this._storageSuffix;
      this._cookieName = Constants.COOKIE_PREFIX + '_' + this._storageSuffixV5;
      this.cookieStorage.options({
        expirationDays: this.options.cookieExpiration,
        domain: this.options.domain,
        secure: this.options.secureCookie,
        sameSite: this.options.sameSiteCookie
      });
      this._metadataStorage = new MetadataStorage({
        storageKey: this._cookieName,
        disableCookies: this.options.disableCookies,
        expirationDays: this.options.cookieExpiration,
        domain: this.options.domain,
        secure: this.options.secureCookie,
        sameSite: this.options.sameSiteCookie,
        storage: this.options.storage
      });
      var hasOldCookie = !!this.cookieStorage.get(this._oldCookiename);
      var hasNewCookie = !!this._metadataStorage.load();
      this._useOldCookie = !hasNewCookie && hasOldCookie && !this.options.cookieForceUpgrade;
      var hasCookie = hasNewCookie || hasOldCookie;
      this.options.domain = this.cookieStorage.options().domain;

      if (this.options.deferInitialization && !hasCookie) {
        this._deferInitialization(apiKey, opt_userId, opt_config, opt_callback);

        return;
      }

      if (type(this.options.logLevel) === 'string') {
        utils.setLogLevel(this.options.logLevel);
      }

      var trackingOptions = _generateApiPropertiesTrackingConfig(this);

      this._apiPropertiesTrackingOptions = Object.keys(trackingOptions).length > 0 ? {
        tracking_options: trackingOptions
      } : {};

      if (this.options.cookieForceUpgrade && hasOldCookie) {
        if (!hasNewCookie) {
          _upgradeCookieData(this);
        }

        this.cookieStorage.remove(this._oldCookiename);
      }

      _loadCookieData(this);

      this._pendingReadStorage = true;

      var initFromStorage = function initFromStorage(storedDeviceId) {
        if (opt_config && opt_config.deviceId && !utils.validateDeviceId(opt_config.deviceId)) {
          utils.log.error("Invalid device ID rejected. Randomly generated UUID will be used instead of \"".concat(opt_config.deviceId, "\""));
          delete opt_config.deviceId;
        }

        _this.options.deviceId = _this._getInitialDeviceId(opt_config && opt_config.deviceId, storedDeviceId);
        _this.options.userId = type(opt_userId) === 'string' && !utils.isEmptyString(opt_userId) && opt_userId || type(opt_userId) === 'number' && opt_userId.toString() || _this.options.userId || null;
        var now = new Date().getTime();
        var startNewSession = !_this._sessionId || !_this._lastEventTime || now - _this._lastEventTime > _this.options.sessionTimeout || _this.options.sessionId;

        if (startNewSession) {
          if (_this.options.unsetParamsReferrerOnNewSession) {
            _this._unsetUTMParams();
          }

          _this._newSession = true;
          _this._sessionId = _this.options.sessionId || now; // reset this.options.sessionId to avoid re-usage
          // use instance.getSessionId() to get session id

          _this.options.sessionId = undefined; // only capture UTM params and referrer if new session

          if (_this.options.saveParamsReferrerOncePerSession) {
            _this._trackParamsAndReferrer();
          }
        }

        if (!_this.options.saveParamsReferrerOncePerSession) {
          _this._trackParamsAndReferrer();
        } // load unsent events and identifies before any attempt to log new ones


        if (_this.options.saveEvents) {
          _validateUnsentEventQueue(_this._unsentEvents);

          _validateUnsentEventQueue(_this._unsentIdentifys);
        }

        _this._lastEventTime = now;

        _saveCookieData(_this);

        _this._pendingReadStorage = false;

        _this._sendEventsIfReady(); // try sending unsent events


        for (var i = 0; i < _this._onInitCallbacks.length; i++) {
          _this._onInitCallbacks[i](_this);
        }

        _this._onInitCallbacks = [];
        _this._isInitialized = true;

        if (startNewSession) {
          _this._runNewSessionStartCallbacks();
        }
      };

      if (this.options.saveEvents) {
        this._unsentEvents = this._loadSavedUnsentEvents(this.options.unsentKey).map(function (event) {
          return {
            event: event
          };
        }).concat(this._unsentEvents);
        this._unsentIdentifys = this._loadSavedUnsentEvents(this.options.unsentIdentifyKey).map(function (event) {
          return {
            event: event
          };
        }).concat(this._unsentIdentifys);
      }

      if (opt_config && opt_config.onNewSessionStart) {
        this.onNewSessionStart(this.options.onNewSessionStart);
      }

      initFromStorage();
      this.runQueuedFunctions();

      if (type(opt_callback) === 'function') {
        opt_callback(this);
      }

      var onExitPage = this.options.onExitPage;

      if (type(onExitPage) === 'function') {
        if (!this.pageHandlersAdded) {
          this.pageHandlersAdded = true;

          var handleVisibilityChange = function handleVisibilityChange() {
            var prevTransport = _this.options.transport;

            _this.setTransport(Constants.TRANSPORT_BEACON);

            onExitPage();

            _this.setTransport(prevTransport);
          }; // Monitoring just page exits because that is the most requested feature for now
          // "If you're specifically trying to detect page unload events, the pagehide event is the best option."
          // https://developer.mozilla.org/en-US/docs/Web/API/Window/pagehide_event


          GlobalScope.addEventListener('pagehide', function () {
            handleVisibilityChange();
          }, false);
        }
      } // Sets an event receiver to receive and forward exposure events from the experiment SDK.


      this._connector.eventBridge.setEventReceiver(function (event) {
        _this._logEvent(event.eventType, event.eventProperties, event.userProperties);
      }); // Set the user ID and device ID in the core identity store to enable fetching variants.


      var editor = this._connector.identityStore.editIdentity();

      if (this.options.deviceId) {
        editor.setDeviceId(this.options.deviceId);
      }

      if (this.options.userId) {
        editor.setUserId(this.options.userId);
      }

      editor.commit();
    } catch (err) {
      utils.log.error(err);

      if (opt_config && type(opt_config.onError) === 'function') {
        opt_config.onError(err);
      }
    }
  };

  AmplitudeClient.prototype._runNewSessionStartCallbacks = function () {
    for (var i = 0; i < this._onNewSessionStartCallbacks.length; i++) {
      this._onNewSessionStartCallbacks[i](this);
    }
  };

  AmplitudeClient.prototype.deleteLowerLevelDomainCookies = function () {
    var host = getHost();
    var cookieHost = this.options.domain && this.options.domain[0] === '.' ? this.options.domain.slice(1) : this.options.domain;

    if (!cookieHost || !utils.isWebWorkerEnvironment()) {
      return;
    }

    if (host !== cookieHost) {
      if (new RegExp(cookieHost + '$').test(host)) {
        var hostParts = host.split('.');
        var cookieHostParts = cookieHost.split('.');

        for (var i = hostParts.length; i > cookieHostParts.length; --i) {
          var deleteDomain = hostParts.slice(hostParts.length - i).join('.');
          baseCookie.set(this._cookieName, null, {
            domain: '.' + deleteDomain
          });
        }

        baseCookie.set(this._cookieName, null, {});
      }
    }
  };

  AmplitudeClient.prototype._getInitialDeviceId = function (configDeviceId, storedDeviceId) {
    if (configDeviceId) {
      return configDeviceId;
    }

    if (this.options.deviceIdFromUrlParam) {
      var deviceIdFromUrlParam = this._getDeviceIdFromUrlParam(this._getUrlParams());

      if (deviceIdFromUrlParam) {
        return deviceIdFromUrlParam;
      }
    }

    if (this.options.deviceId) {
      return this.options.deviceId;
    }

    if (storedDeviceId) {
      return storedDeviceId;
    }

    return base64Id();
  }; // validate properties for unsent events


  var _validateUnsentEventQueue = function _validateUnsentEventQueue(queue) {
    for (var i = 0; i < queue.length; i++) {
      var userProperties = queue[i].event.user_properties;
      var eventProperties = queue[i].event.event_properties;
      var groups = queue[i].event.groups;
      queue[i].event.user_properties = utils.validateProperties(userProperties);
      queue[i].event.event_properties = utils.validateProperties(eventProperties);
      queue[i].event.groups = utils.validateGroups(groups);
    }
  };
  /**
   * @private
   */


  AmplitudeClient.prototype._trackParamsAndReferrer = function _trackParamsAndReferrer() {
    var utmProperties;
    var referrerProperties;
    var gclidProperties;
    var fbclidProperties;

    if (this.options.includeUtm) {
      utmProperties = this._initUtmData();
    }

    if (this.options.includeReferrer) {
      referrerProperties = this._saveReferrer(this._getReferrer());
    }

    if (this.options.includeGclid) {
      gclidProperties = this._saveGclid(this._getUrlParams());
    }

    if (this.options.includeFbclid) {
      fbclidProperties = this._saveFbclid(this._getUrlParams());
    }

    if (this.options.logAttributionCapturedEvent) {
      var attributionProperties = _objectSpread({}, utmProperties, referrerProperties, gclidProperties, fbclidProperties);

      if (Object.keys(attributionProperties).length > 0) {
        this.logEvent(Constants.ATTRIBUTION_EVENT, attributionProperties);
      }
    }
  };
  /**
   * Parse and validate user specified config values and overwrite existing option value
   * DEFAULT_OPTIONS provides list of all config keys that are modifiable, as well as expected types for values
   * @private
   */


  var _parseConfig = function _parseConfig(options, config) {
    if (type(config) !== 'object') {
      return;
    } // Add exception in headers


    var freeFormObjectKeys = new Set(['headers']); // validates config value is defined, is the correct type, and some additional value sanity checks

    var parseValidateAndLoad = function parseValidateAndLoad(key) {
      if (!Object.prototype.hasOwnProperty.call(options, key)) {
        return; // skip bogus config values
      }

      var inputValue = config[key];
      var expectedType = type(options[key]);

      if (key === 'transport' && !utils.validateTransport(inputValue)) {
        return;
      } else if (key === 'sessionId' && inputValue !== null) {
        options[key] = utils.validateSessionId(inputValue) ? inputValue : null;
        return;
      } else if (!utils.validateInput(inputValue, key + ' option', expectedType)) {
        return;
      }

      if (expectedType === 'boolean') {
        options[key] = !!inputValue;
      } else if (expectedType === 'string' && !utils.isEmptyString(inputValue) || expectedType === 'number' && inputValue > 0 || expectedType === 'function') {
        options[key] = inputValue;
      } else if (expectedType === 'object') {
        _parseConfig(options[key], inputValue);
      }
    };

    for (var key in config) {
      if (freeFormObjectKeys.has(key)) {
        options[key] = _objectSpread({}, options[key], config[key]);
      } else if (Object.prototype.hasOwnProperty.call(config, key)) {
        parseValidateAndLoad(key);
      }
    }
  };
  /**
   * Run functions queued up by proxy loading snippet
   * @private
   */


  AmplitudeClient.prototype.runQueuedFunctions = function () {
    var queue = this._q;
    this._q = [];

    for (var i = 0; i < queue.length; i++) {
      var fn = this[queue[i][0]];

      if (type(fn) === 'function') {
        fn.apply(this, queue[i].slice(1));
      }
    }
  };
  /**
   * Check that the apiKey is set before calling a function. Logs a warning message if not set.
   * @private
   */


  AmplitudeClient.prototype._apiKeySet = function _apiKeySet(methodName) {
    if (utils.isEmptyString(this.options.apiKey)) {
      utils.log.error('Invalid apiKey. Please set a valid apiKey with init() before calling ' + methodName);
      return false;
    }

    return true;
  };
  /**
   * Load saved events from localStorage. JSON deserializes event array. Handles case where string is corrupted.
   * @private
   */


  AmplitudeClient.prototype._loadSavedUnsentEvents = function _loadSavedUnsentEvents(unsentKey) {
    var savedUnsentEventsString = this._getFromStorage(localStorage$1, unsentKey);

    var unsentEvents = this._parseSavedUnsentEventsString(savedUnsentEventsString, unsentKey);

    this._setInStorage(localStorage$1, unsentKey, JSON.stringify(unsentEvents));

    return unsentEvents;
  };
  /**
   * Load saved events from localStorage. JSON deserializes event array. Handles case where string is corrupted.
   * @private
   */


  AmplitudeClient.prototype._parseSavedUnsentEventsString = function _parseSavedUnsentEventsString(savedUnsentEventsString, unsentKey) {
    if (utils.isEmptyString(savedUnsentEventsString)) {
      return []; // new app, does not have any saved events
    }

    if (type(savedUnsentEventsString) === 'string') {
      try {
        var events = JSON.parse(savedUnsentEventsString);

        if (type(events) === 'array') {
          // handle case where JSON dumping of unsent events is corrupted
          return events;
        }
      } catch (e) {}
      /* eslint-disable-line no-empty */

    }

    utils.log.error('Unable to load ' + unsentKey + ' events. Restart with a new empty queue.');
    return [];
  };
  /**
   * Returns true if a new session was created during initialization, otherwise false.
   * @public
   * @return {boolean} Whether a new session was created during initialization.
   */


  AmplitudeClient.prototype.isNewSession = function isNewSession() {
    return this._newSession;
  };
  /**
   * Add callbacks to call after init. Useful for users who load Amplitude through a snippet.
   * @public
   */


  AmplitudeClient.prototype.onInit = function onInit(callback) {
    if (this._isInitialized) {
      callback(this);
    } else {
      this._onInitCallbacks.push(callback);
    }
  };
  /**
   * Add callbacks to call after new session start.
   * @public
   */


  AmplitudeClient.prototype.onNewSessionStart = function onNewSessionStart(callback) {
    this._onNewSessionStartCallbacks.push(callback);
  };
  /**
   * Returns the id of the current session.
   * @public
   * @return {number} Id of the current session.
   */


  AmplitudeClient.prototype.getSessionId = function getSessionId() {
    return this._sessionId;
  };
  /**
   * Increments the eventId and returns it.
   * @private
   */


  AmplitudeClient.prototype.nextEventId = function nextEventId() {
    this._eventId++;
    return this._eventId;
  };
  /**
   * Increments the identifyId and returns it.
   * @private
   */


  AmplitudeClient.prototype.nextIdentifyId = function nextIdentifyId() {
    this._identifyId++;
    return this._identifyId;
  };
  /**
   * Increments the sequenceNumber and returns it.
   * @private
   */


  AmplitudeClient.prototype.nextSequenceNumber = function nextSequenceNumber() {
    this._sequenceNumber++;
    return this._sequenceNumber;
  };
  /**
   * Returns the total count of unsent events and identifys
   * @private
   */


  AmplitudeClient.prototype._unsentCount = function _unsentCount() {
    return this._unsentEvents.length + this._unsentIdentifys.length;
  };
  /**
   * Send events if ready. Returns true if events are sent.
   * @private
   */


  AmplitudeClient.prototype._sendEventsIfReady = function _sendEventsIfReady() {
    if (this._unsentCount() === 0) {
      return false;
    } // if batching disabled, send any unsent events immediately


    if (!this.options.batchEvents) {
      this.sendEvents();
      return true;
    } // if batching enabled, check if min threshold met for batch size


    if (this._unsentCount() >= this.options.eventUploadThreshold) {
      this.sendEvents();
      return true;
    } // if beacon transport is activated, send events immediately
    // because there is no way to retry them later


    if (this.options.transport === Constants.TRANSPORT_BEACON) {
      this.sendEvents();
      return true;
    } // otherwise schedule an upload after 30s


    if (!this._updateScheduled) {
      // make sure we only schedule 1 upload
      this._updateScheduled = true;
      setTimeout(function () {
        this._updateScheduled = false;
        this.sendEvents();
      }.bind(this), this.options.eventUploadPeriodMillis);
    }

    return false; // an upload was scheduled, no events were uploaded
  };
  /**
   * Clears any stored events and metadata. Storage is then re-created on next event sending.
   * @public
   * @return {boolean} True if metadata was cleared, false if none existed
   */


  AmplitudeClient.prototype.clearStorage = function clearStorage() {
    return this._metadataStorage.clear();
  };
  /**
   * Helper function to fetch values from storage
   * Storage argument allows for localStoraoge and sessionStoraoge
   * @private
   */


  AmplitudeClient.prototype._getFromStorage = function _getFromStorage(storage, key) {
    return storage.getItem(key + this._storageSuffix);
  };
  /**
   * Helper function to set values in storage
   * Storage argument allows for localStoraoge and sessionStoraoge
   * @private
   */


  AmplitudeClient.prototype._setInStorage = function _setInStorage(storage, key, value) {
    storage.setItem(key + this._storageSuffix, value);
  };
  /**
   * Fetches deviceId, userId, event meta data from amplitude cookie
   * @private
   */


  var _loadCookieData = function _loadCookieData(scope) {
    if (!scope._useOldCookie) {
      var props = scope._metadataStorage.load();

      if (type(props) === 'object') {
        _loadCookieDataProps(scope, props);
      }

      return;
    }

    var cookieData = scope.cookieStorage.get(scope._oldCookiename);

    if (type(cookieData) === 'object') {
      _loadCookieDataProps(scope, cookieData);

      return;
    }
  };

  var _upgradeCookieData = function _upgradeCookieData(scope) {
    var cookieData = scope.cookieStorage.get(scope._oldCookiename);

    if (type(cookieData) === 'object') {
      _loadCookieDataProps(scope, cookieData);

      _saveCookieData(scope);
    }
  };

  var _loadCookieDataProps = function _loadCookieDataProps(scope, cookieData) {
    if (cookieData.deviceId) {
      scope.options.deviceId = cookieData.deviceId;
    }

    if (cookieData.userId) {
      scope.options.userId = cookieData.userId;
    }

    if (cookieData.optOut !== null && cookieData.optOut !== undefined) {
      // Do not clobber config opt out value if cookieData has optOut as false
      if (cookieData.optOut !== false) {
        scope.options.optOut = cookieData.optOut;
      }
    }

    if (cookieData.sessionId) {
      scope._sessionId = parseInt(cookieData.sessionId, 10);
    }

    if (cookieData.lastEventTime) {
      scope._lastEventTime = parseInt(cookieData.lastEventTime, 10);
    }

    if (cookieData.eventId) {
      scope._eventId = parseInt(cookieData.eventId, 10);
    }

    if (cookieData.identifyId) {
      scope._identifyId = parseInt(cookieData.identifyId, 10);
    }

    if (cookieData.sequenceNumber) {
      scope._sequenceNumber = parseInt(cookieData.sequenceNumber, 10);
    }
  };
  /**
   * Saves deviceId, userId, event meta data to amplitude cookie
   * @private
   */


  var _saveCookieData = function _saveCookieData(scope) {
    var cookieData = {
      deviceId: scope.options.deviceId,
      userId: scope.options.userId,
      optOut: scope.options.optOut,
      sessionId: scope._sessionId,
      lastEventTime: scope._lastEventTime,
      eventId: scope._eventId,
      identifyId: scope._identifyId,
      sequenceNumber: scope._sequenceNumber
    };

    if (scope._useOldCookie) {
      scope.cookieStorage.set(scope.options.cookieName + scope._storageSuffix, cookieData);
    } else {
      scope._metadataStorage.save(cookieData);
    }
  };
  /**
   * Parse the utm properties out of cookies and query for adding to user properties.
   * @private
   */


  AmplitudeClient.prototype._initUtmData = function _initUtmData(queryParams, cookieParams) {
    queryParams = queryParams || this._getUrlParams();
    cookieParams = cookieParams || this.cookieStorage.get('__utmz');
    var utmProperties = getUtmData(cookieParams, queryParams);

    _sendParamsReferrerUserProperties(this, utmProperties);

    return utmProperties;
  };
  /**
   * Unset the utm params from the Amplitude instance and update the identify.
   * @private
   */


  AmplitudeClient.prototype._unsetUTMParams = function _unsetUTMParams() {
    var identify = new Identify();
    identify.unset(Constants.REFERRER);
    identify.unset(Constants.UTM_SOURCE);
    identify.unset(Constants.UTM_MEDIUM);
    identify.unset(Constants.UTM_CAMPAIGN);
    identify.unset(Constants.UTM_TERM);
    identify.unset(Constants.UTM_CONTENT);
    this.identify(identify);
  };
  /**
   * The calling function should determine when it is appropriate to send these user properties. This function
   * will no longer contain any session storage checking logic.
   * @private
   */


  var _sendParamsReferrerUserProperties = function _sendParamsReferrerUserProperties(scope, userProperties) {
    if (type(userProperties) !== 'object' || Object.keys(userProperties).length === 0) {
      return;
    } // setOnce the initial user properties


    var identify = new Identify();

    for (var key in userProperties) {
      if (Object.prototype.hasOwnProperty.call(userProperties, key)) {
        identify.setOnce('initial_' + key, userProperties[key]);
        identify.set(key, userProperties[key]);
      }
    }

    scope.identify(identify);
  };
  /**
   * @private
   */


  AmplitudeClient.prototype._getReferrer = function _getReferrer() {
    return typeof document !== 'undefined' ? document.referrer : '';
  };
  /**
   * @private
   */


  AmplitudeClient.prototype._getUrlParams = function _getUrlParams() {
    return GlobalScope.location.search;
  };
  /**
   * Try to fetch Google Gclid from url params.
   * @private
   */


  AmplitudeClient.prototype._saveGclid = function _saveGclid(urlParams) {
    var gclid = utils.getQueryParam('gclid', urlParams);

    if (utils.isEmptyString(gclid)) {
      return;
    }

    var gclidProperties = {
      gclid: gclid
    };

    _sendParamsReferrerUserProperties(this, gclidProperties);

    return gclidProperties;
  };
  /**
   * Try to fetch Facebook Fbclid from url params.
   * @private
   */


  AmplitudeClient.prototype._saveFbclid = function _saveFbclid(urlParams) {
    var fbclid = utils.getQueryParam('fbclid', urlParams);

    if (utils.isEmptyString(fbclid)) {
      return;
    }

    var fbclidProperties = {
      fbclid: fbclid
    };

    _sendParamsReferrerUserProperties(this, fbclidProperties);

    return fbclidProperties;
  };
  /**
   * Try to fetch Amplitude device id from url params.
   * @private
   */


  AmplitudeClient.prototype._getDeviceIdFromUrlParam = function _getDeviceIdFromUrlParam(urlParams) {
    return utils.getQueryParam(Constants.AMP_DEVICE_ID_PARAM, urlParams);
  };
  /**
   * Parse the domain from referrer info
   * @private
   */


  AmplitudeClient.prototype._getReferringDomain = function _getReferringDomain(referrer) {
    if (utils.isEmptyString(referrer)) {
      return null;
    }

    var parts = referrer.split('/');

    if (parts.length >= 3) {
      return parts[2];
    }

    return null;
  };
  /**
   * Fetch the referrer information, parse the domain and send.
   * Since user properties are propagated on the server, only send once per session, don't need to send with every event
   * @private
   */


  AmplitudeClient.prototype._saveReferrer = function _saveReferrer(referrer) {
    if (utils.isEmptyString(referrer)) {
      return;
    }

    var referrerInfo = {
      referrer: referrer,
      referring_domain: this._getReferringDomain(referrer)
    };

    _sendParamsReferrerUserProperties(this, referrerInfo);

    return referrerInfo;
  };
  /**
   * Saves unsent events and identifies to localStorage. JSON stringifies event queues before saving.
   * Note: this is called automatically every time events are logged, unless you explicitly set option saveEvents to false.
   * @private
   */


  AmplitudeClient.prototype.saveEvents = function saveEvents() {
    try {
      var serializedUnsentEvents = JSON.stringify(this._unsentEvents.map(function (_ref) {
        var event = _ref.event;
        return event;
      }));

      this._setInStorage(localStorage$1, this.options.unsentKey, serializedUnsentEvents);
    } catch (e) {}
    /* eslint-disable-line no-empty */


    try {
      var serializedIdentifys = JSON.stringify(this._unsentIdentifys.map(function (unsentIdentify) {
        return unsentIdentify.event;
      }));

      this._setInStorage(localStorage$1, this.options.unsentIdentifyKey, serializedIdentifys);
    } catch (e) {}
    /* eslint-disable-line no-empty */

  };
  /**
   * Sets a customer domain for the amplitude cookie. Useful if you want to support cross-subdomain tracking.
   * @public
   * @param {string} domain to set.
   * @example amplitudeClient.setDomain('.amplitude.com');
   */


  AmplitudeClient.prototype.setDomain = function setDomain(domain) {
    if (this._shouldDeferCall()) {
      return this._q.push(['setDomain'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!utils.validateInput(domain, 'domain', 'string')) {
      return;
    }

    try {
      this.cookieStorage.options({
        expirationDays: this.options.cookieExpiration,
        secure: this.options.secureCookie,
        domain: domain,
        sameSite: this.options.sameSiteCookie
      });
      this.options.domain = this.cookieStorage.options().domain;

      _loadCookieData(this);

      _saveCookieData(this);
    } catch (e) {
      utils.log.error(e);
    }
  };
  /**
   * Sets an identifier for the current user.
   * @public
   * @param {string} userId - identifier to set. Can be null.
   * @param {boolean} startNewSession - (optional) if start a new session or not
   * @example amplitudeClient.setUserId('joe@gmail.com');
   */


  AmplitudeClient.prototype.setUserId = function setUserId(userId) {
    var startNewSession = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (!utils.validateInput(startNewSession, 'startNewSession', 'boolean')) {
      return;
    }

    if (this._shouldDeferCall()) {
      return this._q.push(['setUserId'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    try {
      this.options.userId = userId !== undefined && userId !== null && '' + userId || null;

      if (startNewSession) {
        if (this.options.unsetParamsReferrerOnNewSession) {
          this._unsetUTMParams();
        }

        this._newSession = true;
        this._sessionId = new Date().getTime();

        this._runNewSessionStartCallbacks(); // only capture UTM params and referrer if new session


        if (this.options.saveParamsReferrerOncePerSession) {
          this._trackParamsAndReferrer();
        }
      }

      _saveCookieData(this); // Update core identity store to propagate new user info
      // to experiment SDK and trigger a fetch if the ID has changed.


      if (this._connector) {
        this._connector.identityStore.editIdentity().setUserId(this.options.userId).commit();
      }
    } catch (e) {
      utils.log.error(e);
    }
  };
  /**
   * Add user to a group or groups. You need to specify a groupType and groupName(s).
   *
   * For example you can group people by their organization.
   * In that case, groupType is "orgId" and groupName would be the actual ID(s).
   * groupName can be a string or an array of strings to indicate a user in multiple gruups.
   * You can also call setGroup multiple times with different groupTypes to track multiple types of groups (up to 5 per app).
   *
   * Note: this will also set groupType: groupName as a user property.
   * See the [advanced topics article](https://developers.amplitude.com/docs/javascript#user-groups) for more information.
   * @public
   * @param {string} groupType - the group type (ex: orgId)
   * @param {string|list} groupName - the name of the group (ex: 15), or a list of names of the groups
   * @example amplitudeClient.setGroup('orgId', 15); // this adds the current user to orgId 15.
   */


  AmplitudeClient.prototype.setGroup = function (groupType, groupName) {
    if (this._shouldDeferCall()) {
      return this._q.push(['setGroup'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!this._apiKeySet('setGroup()') || !utils.validateInput(groupType, 'groupType', 'string') || utils.isEmptyString(groupType)) {
      return;
    }

    var groups = {};
    groups[groupType] = groupName;
    var identify = new Identify().set(groupType, groupName);

    this._logEvent(Constants.IDENTIFY_EVENT, null, null, identify.userPropertiesOperations, groups, null, null, null);
  };
  /**
   * Sets whether to opt current user out of tracking.
   * @public
   * @param {boolean} enable - if true then no events will be logged or sent.
   * @example: amplitude.setOptOut(true);
   */


  AmplitudeClient.prototype.setOptOut = function setOptOut(enable) {
    if (this._shouldDeferCall()) {
      return this._q.push(['setOptOut'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!utils.validateInput(enable, 'enable', 'boolean')) {
      return;
    }

    try {
      this.options.optOut = enable;

      _saveCookieData(this);
    } catch (e) {
      utils.log.error(e);
    }
  };
  /**
   * Set a custom Session ID for the current session.
   * Note: This is not recommended unless you know what you are doing because the Session ID of a session is utilized for all session metrics in Amplitude.
   * The Session ID to set for the current session must be in milliseconds since epoch (Unix Timestamp).
   * @public
   * @param {int} sessionId to set.
   * @example amplitudeClient.setSessionId(1622158968000);
   */


  AmplitudeClient.prototype.setSessionId = function setSessionId(sessionId) {
    if (!utils.validateInput(sessionId, 'sessionId', 'number')) {
      return;
    }

    try {
      this._sessionId = sessionId;

      _saveCookieData(this);
    } catch (e) {
      utils.log.error(e);
    }
  };
  /**
   * Sets the current Unix timestamp as the new Session ID for the instance.
   * @public
   * @example amplitudeClient.resetSessionId();
   */


  AmplitudeClient.prototype.resetSessionId = function resetSessionId() {
    this.setSessionId(new Date().getTime());
  };
  /**
   * Regenerates a new random deviceId for current user. Note: this is not recommended unless you know what you
   * are doing. This can be used in conjunction with `setUserId(null)` to anonymize users after they log out.
   * With a null userId and a completely new deviceId, the current user would appear as a brand new user in dashboard.
   * This uses src/uuid.js to regenerate the deviceId.
   * @public
   */


  AmplitudeClient.prototype.regenerateDeviceId = function regenerateDeviceId() {
    if (this._shouldDeferCall()) {
      return this._q.push(['regenerateDeviceId'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    this.setDeviceId(base64Id());
  };
  /**
   * Sets a custom deviceId for current user. **Values may not have `.` inside them**
   * Note: this is not recommended unless you know what you are doing (like if you have your own system for managing deviceIds).
   * Make sure the deviceId you set is sufficiently unique
   * (we recommend something like a UUID - see src/uuid.js for an example of how to generate) to prevent conflicts with other devices in our system.
   * @public
   * @param {string} deviceId - custom deviceId for current user.
   * @example amplitudeClient.setDeviceId('45f0954f-eb79-4463-ac8a-233a6f45a8f0');
   */


  AmplitudeClient.prototype.setDeviceId = function setDeviceId(deviceId) {
    if (this._shouldDeferCall()) {
      return this._q.push(['setDeviceId'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!utils.validateDeviceId(deviceId)) {
      return;
    }

    try {
      if (!utils.isEmptyString(deviceId)) {
        this.options.deviceId = '' + deviceId;

        _saveCookieData(this); // Update core identity store to propagate new user info
        // to experiment SDK and trigger a fetch if the ID has changed.


        if (this._connector) {
          this._connector.identityStore.editIdentity().setDeviceId(this.options.deviceId).commit();
        }
      }
    } catch (e) {
      utils.log.error(e);
    }
  };
  /**
   * Sets the network transport type for events. Typically used to set to 'beacon'
   * on an end-of-lifecycle event handler such as `onpagehide` or `onvisibilitychange`
   * @public
   * @param {string} transport - transport mechanism to use for events. Must be one of `http` or `beacon`.
   * @example amplitudeClient.setTransport('beacon');
   */


  AmplitudeClient.prototype.setTransport = function setTransport(transport) {
    if (this._shouldDeferCall()) {
      return this._q.push(['setTransport'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!utils.validateTransport(transport)) {
      return;
    }

    this.options.transport = transport;
  };
  /**
   * Sets user properties for the current user.
   * @public
   * @param {object} - object with string keys and values for the user properties to set.
   * @param {boolean} - DEPRECATED opt_replace: in earlier versions of the JS SDK the user properties object was kept in
   * memory and replace = true would replace the object in memory. Now the properties are no longer stored in memory, so replace is deprecated.
   * @example amplitudeClient.setUserProperties({'gender': 'female', 'sign_up_complete': true})
   */


  AmplitudeClient.prototype.setUserProperties = function setUserProperties(userProperties) {
    if (this._shouldDeferCall()) {
      return this._q.push(['setUserProperties'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!this._apiKeySet('setUserProperties()') || !utils.validateInput(userProperties, 'userProperties', 'object')) {
      return;
    } // sanitize the userProperties dict before converting into identify


    var sanitized = utils.truncate(utils.validateProperties(userProperties));

    if (Object.keys(sanitized).length === 0) {
      return;
    } // convert userProperties into an identify call


    var identify = new Identify();

    for (var property in sanitized) {
      if (Object.prototype.hasOwnProperty.call(sanitized, property)) {
        identify.set(property, sanitized[property]);
      }
    }

    this.identify(identify);
  };
  /**
   * Clear all of the user properties for the current user. Note: clearing user properties is irreversible!
   * @public
   * @example amplitudeClient.clearUserProperties();
   */


  AmplitudeClient.prototype.clearUserProperties = function clearUserProperties() {
    if (this._shouldDeferCall()) {
      return this._q.push(['clearUserProperties'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!this._apiKeySet('clearUserProperties()')) {
      return;
    }

    var identify = new Identify();
    identify.clearAll();
    this.identify(identify);
  };
  /**
   * Applies the proxied functions on the proxied object to an instance of the real object.
   * Used to convert proxied Identify and Revenue objects.
   * @private
   */


  var _convertProxyObjectToRealObject = function _convertProxyObjectToRealObject(instance, proxy) {
    for (var i = 0; i < proxy._q.length; i++) {
      var fn = instance[proxy._q[i][0]];

      if (type(fn) === 'function') {
        fn.apply(instance, proxy._q[i].slice(1));
      }
    }

    return instance;
  };
  /**
   * Send an identify call containing user property operations to Amplitude servers.
   * See the [Identify](https://amplitude.github.io/Amplitude-JavaScript/Identify/)
   * reference page for more information on the Identify API and user property operations.
   * @param {Identify} identify_obj - the Identify object containing the user property operations to send.
   * @param {Amplitude~eventCallback} opt_callback - (optional) callback function to run when the identify event has been sent.
   * Note: the server response code and response body from the identify event upload are passed to the callback function.
   * @param {Amplitude~eventCallback} opt_error_callback - (optional) a callback function to run after the event logging
   * fails. The failure can be from the request being malformed or from a network failure
   * Note: the server response code and response body from the event upload are passed to the callback function.
   * @example
   * var identify = new amplitude.Identify().set('colors', ['rose', 'gold']).add('karma', 1).setOnce('sign_up_date', '2016-03-31');
   * amplitude.identify(identify);
   */


  AmplitudeClient.prototype.identify = function (identify_obj, opt_callback, opt_error_callback, outOfSession) {
    if (this._shouldDeferCall()) {
      return this._q.push(['identify'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!this._apiKeySet('identify()')) {
      _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
        reason: 'API key is not set'
      });

      return;
    } // if identify input is a proxied object created by the async loading snippet, convert it into an identify object


    if (type(identify_obj) === 'object' && Object.prototype.hasOwnProperty.call(identify_obj, '_q')) {
      identify_obj = _convertProxyObjectToRealObject(new Identify(), identify_obj);
    }

    if (identify_obj instanceof Identify) {
      // only send if there are operations
      if (Object.keys(identify_obj.userPropertiesOperations).length > 0) {
        return this._logEvent(Constants.IDENTIFY_EVENT, null, null, identify_obj.userPropertiesOperations, null, null, null, opt_callback, opt_error_callback, outOfSession);
      } else {
        _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
          reason: 'No user property operations'
        });
      }
    } else {
      utils.log.error('Invalid identify input type. Expected Identify object but saw ' + type(identify_obj));

      _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
        reason: 'Invalid identify input type'
      });
    }
  };

  AmplitudeClient.prototype.groupIdentify = function (group_type, group_name, identify_obj, opt_callback, opt_error_callback, outOfSession) {
    if (this._shouldDeferCall()) {
      return this._q.push(['groupIdentify'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!this._apiKeySet('groupIdentify()')) {
      _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
        reason: 'API key is not set'
      });

      return;
    }

    if (!utils.validateInput(group_type, 'group_type', 'string') || utils.isEmptyString(group_type)) {
      _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
        reason: 'Invalid group type'
      });

      return;
    }

    if (group_name === null || group_name === undefined) {
      _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
        reason: 'Invalid group name'
      });

      return;
    } // if identify input is a proxied object created by the async loading snippet, convert it into an identify object


    if (type(identify_obj) === 'object' && Object.prototype.hasOwnProperty.call(identify_obj, '_q')) {
      identify_obj = _convertProxyObjectToRealObject(new Identify(), identify_obj);
    }

    if (identify_obj instanceof Identify) {
      // only send if there are operations
      if (Object.keys(identify_obj.userPropertiesOperations).length > 0) {
        return this._logEvent(Constants.GROUP_IDENTIFY_EVENT, null, null, null, _defineProperty({}, group_type, group_name), identify_obj.userPropertiesOperations, null, opt_callback, opt_error_callback, outOfSession);
      } else {
        _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
          reason: 'No group property operations'
        });
      }
    } else {
      utils.log.error('Invalid identify input type. Expected Identify object but saw ' + type(identify_obj));

      _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
        reason: 'Invalid identify input type'
      });
    }
  };
  /**
   * Set a versionName for your application.
   * @public
   * @param {string} versionName - The version to set for your application.
   * @example amplitudeClient.setVersionName('1.12.3');
   */


  AmplitudeClient.prototype.setVersionName = function setVersionName(versionName) {
    if (this._shouldDeferCall()) {
      return this._q.push(['setVersionName'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!utils.validateInput(versionName, 'versionName', 'string')) {
      return;
    }

    this.options.versionName = versionName;
  };
  /**
   * Private logEvent method. Keeps apiProperties from being publicly exposed.
   * @private
   */


  AmplitudeClient.prototype._logEvent = function _logEvent(eventType, eventProperties, apiProperties, userProperties, groups, groupProperties, timestamp, callback, errorCallback, outOfSession) {
    _loadCookieData(this); // reload cookie before each log event to sync event meta-data between windows and tabs


    if (!eventType) {
      _logErrorsWithCallbacks(callback, errorCallback, 0, 'No request sent', {
        reason: 'Missing eventType'
      });

      return;
    }

    if (this.options.optOut) {
      _logErrorsWithCallbacks(callback, errorCallback, 0, 'No request sent', {
        reason: 'optOut is set to true'
      });

      return;
    }

    try {
      var eventId;

      if (eventType === Constants.IDENTIFY_EVENT || eventType === Constants.GROUP_IDENTIFY_EVENT) {
        eventId = this.nextIdentifyId();
      } else {
        eventId = this.nextEventId();
      }

      var sequenceNumber = this.nextSequenceNumber();
      var eventTime = type(timestamp) === 'number' ? timestamp : new Date().getTime();

      if (outOfSession) {
        this._sessionId = -1;
      } else if (!this._sessionId || !this._lastEventTime || eventTime - this._lastEventTime > this.options.sessionTimeout) {
        this._sessionId = eventTime;

        this._runNewSessionStartCallbacks();
      }

      this._lastEventTime = eventTime;

      _saveCookieData(this);

      var osName = this._ua.browser.name;
      var osVersion = this._ua.browser.major;
      var deviceModel = this._ua.device.model || this._ua.os.name;
      var deviceVendor = this._ua.device.vendor;
      userProperties = userProperties || {};

      var trackingOptions = _objectSpread({}, this._apiPropertiesTrackingOptions);

      apiProperties = _objectSpread({}, apiProperties || {}, trackingOptions);
      eventProperties = eventProperties || {};
      groups = groups || {};
      groupProperties = groupProperties || {};
      var event = {
        device_id: this.options.deviceId,
        user_id: this.options.userId,
        timestamp: eventTime,
        event_id: eventId,
        session_id: this._sessionId || -1,
        event_type: eventType,
        version_name: this.options.versionName || null,
        platform: _shouldTrackField(this, 'platform') ? this.options.platform : null,
        os_name: _shouldTrackField(this, 'os_name') ? osName || null : null,
        os_version: _shouldTrackField(this, 'os_version') ? osVersion || null : null,
        device_model: _shouldTrackField(this, 'device_model') ? deviceModel || null : null,
        device_manufacturer: _shouldTrackField(this, 'device_manufacturer') ? deviceVendor || null : null,
        language: _shouldTrackField(this, 'language') ? this.options.language : null,
        api_properties: apiProperties,
        event_properties: utils.truncate(utils.validateProperties(eventProperties)),
        user_properties: utils.truncate(utils.validateProperties(userProperties)),
        uuid: uuid(),
        library: this.options.library,
        sequence_number: sequenceNumber,
        // for ordering events and identifys
        groups: utils.truncate(utils.validateGroups(groups)),
        group_properties: utils.truncate(utils.validateProperties(groupProperties)),
        user_agent: this._userAgent
      };

      if (_isObservePlanSet(this)) {
        event.plan = {
          branch: this.options.plan.branch || undefined,
          source: this.options.plan.source || undefined,
          version: this.options.plan.version || undefined,
          versionId: this.options.plan.versionId || undefined
        };
      }

      if (eventType === Constants.IDENTIFY_EVENT || eventType === Constants.GROUP_IDENTIFY_EVENT) {
        this._unsentIdentifys.push({
          event: event,
          callback: callback,
          errorCallback: errorCallback
        });

        this._limitEventsQueued(this._unsentIdentifys);
      } else {
        this._unsentEvents.push({
          event: event,
          callback: callback,
          errorCallback: errorCallback
        });

        this._limitEventsQueued(this._unsentEvents);
      }

      if (this.options.saveEvents) {
        this.saveEvents();
      }

      this._sendEventsIfReady(); // In the case of an identify event, update the core user store so the experiment SDK can fetch new variants and
      // utilize user properties in real time.


      if (eventType === Constants.IDENTIFY_EVENT && this._connector) {
        this._connector.identityStore.editIdentity().updateUserProperties(utils.truncate(utils.validateProperties(userProperties))).commit();
      }

      return eventId;
    } catch (e) {
      utils.log.error(e);
    }
  };

  var _isObservePlanSet = function _isObservePlanSet(scope) {
    return scope.options.plan && (scope.options.plan.source || scope.options.plan.branch || scope.options.plan.version || scope.options.plan.versionId);
  };

  var _shouldTrackField = function _shouldTrackField(scope, field) {
    return !!scope.options.trackingOptions[field];
  };

  var _generateApiPropertiesTrackingConfig = function _generateApiPropertiesTrackingConfig(scope) {
    // to limit size of config payload, only send fields that have been disabled
    var fields = ['city', 'country', 'dma', 'ip_address', 'region'];
    var config = {};

    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];

      if (!_shouldTrackField(scope, field)) {
        config[field] = false;
      }
    }

    return config;
  };
  /**
   * Remove old events from the beginning of the array if too many have accumulated. Default limit is 1000 events.
   * @private
   */


  AmplitudeClient.prototype._limitEventsQueued = function _limitEventsQueued(queue) {
    if (queue.length > this.options.savedMaxCount) {
      var deletedEvents = queue.splice(0, queue.length - this.options.savedMaxCount);
      deletedEvents.forEach(function (event) {
        _logErrorsWithCallbacks(event.callback, event.errorCallback, 0, 'No request sent', {
          reason: 'Event dropped because options.savedMaxCount exceeded. User may be offline or have a content blocker'
        });
      });
    }
  };
  /**
   * This is the callback for logEvent and identify calls. It gets called after the event/identify is uploaded,
   * and the server response code and response body from the upload request are passed to the callback function.
   * @callback Amplitude~eventCallback
   * @param {number} responseCode - Server response code for the event / identify upload request.
   * @param {string} responseBody - Server response body for the event / identify upload request.
   * @param {object} details - (optional) Additional information associated with sending event.
   */

  /**
   * Log an event with eventType and eventProperties
   * @public
   * @param {string} eventType - name of event
   * @param {object} eventProperties - (optional) an object with string keys and values for the event properties.
   * @param {Amplitude~eventCallback} opt_callback - (optional) a callback function to run after the event is logged.
   * Note: the server response code and response body from the event upload are passed to the callback function.
   * @param {Amplitude~eventCallback} opt_error_callback - (optional) a callback function to run after the event logging
   * fails. The failure can be from the request being malformed or from a network failure
   * Note: the server response code and response body from the event upload are passed to the callback function.
   * @param {boolean} outOfSession - (optional) if this event is out of session or not
   * @example amplitudeClient.logEvent('Clicked Homepage Button', {'finished_flow': false, 'clicks': 15});
   */


  AmplitudeClient.prototype.logEvent = function logEvent(eventType, eventProperties, opt_callback, opt_error_callback) {
    var outOfSession = arguments.length > 4 && arguments[4] !== undefined ? arguments[4] : false;

    if (this._shouldDeferCall()) {
      return this._q.push(['logEvent'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    return this.logEventWithTimestamp(eventType, eventProperties, null, opt_callback, opt_error_callback, outOfSession);
  };
  /**
   * Log an event with eventType and eventProperties and a custom timestamp
   * @public
   * @param {string} eventType - name of event
   * @param {object} eventProperties - (optional) an object with string keys and values for the event properties.
   * @param {number} timestamp - (optional) the custom timestamp as milliseconds since epoch.
   * @param {Amplitude~eventCallback} opt_callback - (optional) a callback function to run after the event is logged.
   * Note: the server response code and response body from the event upload are passed to the callback function.
   * @param {Amplitude~eventCallback} opt_error_callback - (optional) a callback function to run after the event logging
   * fails. The failure can be from the request being malformed or from a network failure
   * Note: the server response code and response body from the event upload are passed to the callback function.
   * @param {boolean} outOfSession - (optional) if out of the sessioin or not
   * @example amplitudeClient.logEventWithTimestamp('Clicked Homepage Button', {'finished_flow': false, 'clicks': 15}, Date.now());
   */


  AmplitudeClient.prototype.logEventWithTimestamp = function logEvent(eventType, eventProperties, timestamp, opt_callback, opt_error_callback) {
    var outOfSession = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;

    if (this._shouldDeferCall()) {
      return this._q.push(['logEventWithTimestamp'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!this._apiKeySet('logEvent()')) {
      _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
        reason: 'API key not set'
      });

      return -1;
    }

    if (!utils.validateInput(eventType, 'eventType', 'string')) {
      _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
        reason: 'Invalid type for eventType'
      });

      return -1;
    }

    if (utils.isEmptyString(eventType)) {
      _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
        reason: 'Missing eventType'
      });

      return -1;
    }

    if (!utils.validateInput(outOfSession, 'outOfSession', 'boolean')) {
      _logErrorsWithCallbacks(opt_callback, opt_error_callback, 0, 'No request sent', {
        reason: 'Invalid outOfSession value'
      });
    }

    return this._logEvent(eventType, eventProperties, null, null, null, null, timestamp, opt_callback, opt_error_callback, outOfSession);
  };
  /**
   * Log an event with eventType, eventProperties, and groups. Use this to set event-level groups.
   * Note: the group(s) set only apply for the specific event type being logged and does not persist on the user
   * (unless you explicitly set it with setGroup).
   *
   * See the [advanced topics article](https://developers.amplitude.com/docs/javascript#user-groups) for more information
   * about groups and Count by Distinct on the Amplitude platform.
   * @public
   * @param {string} eventType - name of event
   * @param {object} eventProperties - (optional) an object with string keys and values for the event properties.
   * @param {object} groups - (optional) an object with string groupType: groupName values for the event being logged.
   * groupName can be a string or an array of strings.
   * @param {Amplitude~eventCallback} opt_callback - (optional) a callback function to run after the event is logged.
   * Note: the server response code and response body from the event upload are passed to the callback function.
   * @param {Amplitude~eventCallback} opt_error_callback - (optional) a callback function to run after the event logging
   * fails. The failure can be from the request being malformed or from a network failure
   * Note: the server response code and response body from the event upload are passed to the callback function.
   * @example amplitudeClient.logEventWithGroups('Clicked Button', null, {'orgId': 24});
   */


  AmplitudeClient.prototype.logEventWithGroups = function (eventType, eventProperties, groups, opt_callback, opt_error_callback) {
    var outOfSession = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : false;

    if (this._shouldDeferCall()) {
      return this._q.push(['logEventWithGroups'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!this._apiKeySet('logEventWithGroups()')) {
      _logErrorsWithCallbacks(event.callback, event.errorCallback, 0, 'No request sent', {
        reason: 'API key not set'
      });

      return -1;
    }

    if (!utils.validateInput(eventType, 'eventType', 'string')) {
      _logErrorsWithCallbacks(event.callback, event.errorCallback, 0, 'No request sent', {
        reason: 'Invalid type for eventType'
      });

      return -1;
    }

    if (!utils.validateInput(outOfSession, 'outOfSession', 'boolean')) {
      _logErrorsWithCallbacks(event.callback, event.errorCallback, 0, 'No request sent', {
        reason: 'Invalid outOfSession value'
      });
    }

    return this._logEvent(eventType, eventProperties, null, null, groups, null, null, opt_callback, opt_error_callback, outOfSession);
  };
  /**
   * Test that n is a number or a numeric value.
   * @private
   */


  var _isNumber = function _isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  };
  /**
   * Handles errors that are sent to both callbacks
   * @private
   */


  var _logErrorsWithCallbacks = function _logErrorsWithCallbacks(opt_callback, opt_error_callback, status, response, details) {
    if (type(opt_callback) === 'function') {
      opt_callback(status, response, details);
    }

    if (type(opt_error_callback) === 'function') {
      opt_error_callback(status, response, details);
    }
  };
  /**
   * Log revenue with Revenue interface. The new revenue interface allows for more revenue fields like
   * revenueType and event properties.
   *
   * See the [Revenue](https://amplitude.github.io/Amplitude-JavaScript/Revenue/)
   * reference page for more information on the Revenue interface and logging revenue.
   * @public
   * @param {Revenue} revenue_obj - the revenue object containing the revenue data being logged.
   * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99);
   * amplitude.logRevenueV2(revenue);
   */


  AmplitudeClient.prototype.logRevenueV2 = function logRevenueV2(revenue_obj) {
    if (this._shouldDeferCall()) {
      return this._q.push(['logRevenueV2'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    if (!this._apiKeySet('logRevenueV2()')) {
      return;
    } // if revenue input is a proxied object created by the async loading snippet, convert it into an revenue object


    if (type(revenue_obj) === 'object' && Object.prototype.hasOwnProperty.call(revenue_obj, '_q')) {
      revenue_obj = _convertProxyObjectToRealObject(new Revenue(), revenue_obj);
    }

    if (revenue_obj instanceof Revenue) {
      // only send if revenue is valid
      if (revenue_obj && revenue_obj._isValidRevenue()) {
        return this.logEvent(Constants.REVENUE_EVENT, revenue_obj._toJSONObject());
      }
    } else {
      utils.log.error('Invalid revenue input type. Expected Revenue object but saw ' + type(revenue_obj));
    }
  };

  {
    /**
     * Log revenue event with a price, quantity, and product identifier. DEPRECATED - use logRevenueV2
     * @public
     * @deprecated
     * @param {number} price - price of revenue event
     * @param {number} quantity - (optional) quantity of products in revenue event. If no quantity specified default to 1.
     * @param {string} product - (optional) product identifier
     * @example amplitudeClient.logRevenue(3.99, 1, 'product_1234');
     */
    AmplitudeClient.prototype.logRevenue = function logRevenue(price, quantity, product) {
      if (this._shouldDeferCall()) {
        return this._q.push(['logRevenue'].concat(Array.prototype.slice.call(arguments, 0)));
      } // Test that the parameters are of the right type.


      if (!this._apiKeySet('logRevenue()') || !_isNumber(price) || quantity !== undefined && !_isNumber(quantity)) {
        // utils.log('Price and quantity arguments to logRevenue must be numbers');
        return -1;
      }

      return this._logEvent(Constants.REVENUE_EVENT, {}, {
        productId: product,
        special: 'revenue_amount',
        quantity: quantity || 1,
        price: price
      }, null, null, null, null, null);
    };
  }
  /**
   * Calls error callback on unsent events
   * @private
   */


  AmplitudeClient.prototype._logErrorsOnEvents = function _logErrorsOnEvents(maxEventId, maxIdentifyId, status, response) {
    var queues = ['_unsentEvents', '_unsentIdentifys'];

    for (var j = 0; j < queues.length; j++) {
      var queue = queues[j];
      var maxId = queue === '_unsentEvents' ? maxEventId : maxIdentifyId;

      for (var i = 0; i < this[queue].length || 0; i++) {
        var unsentEvent = this[queue][i];

        if (unsentEvent.event.event_id <= maxId) {
          if (unsentEvent.errorCallback) {
            unsentEvent.errorCallback(status, response);
          }
        }
      }
    }
  };
  /**
   * Remove events in storage with event ids up to and including maxEventId.
   * @private
   */


  AmplitudeClient.prototype.removeEvents = function removeEvents(maxEventId, maxIdentifyId, status, response) {
    _removeEvents(this, '_unsentEvents', maxEventId, status, response);

    _removeEvents(this, '_unsentIdentifys', maxIdentifyId, status, response);
  };
  /**
   * Helper function to remove events up to maxId from a single queue.
   * Does a true filter in case events get out of order or old events are removed.
   * @private
   */


  var _removeEvents = function _removeEvents(scope, eventQueue, maxId, status, response) {
    if (maxId < 0) {
      return;
    }

    var filteredEvents = [];

    for (var i = 0; i < scope[eventQueue].length || 0; i++) {
      var unsentEvent = scope[eventQueue][i];

      if (unsentEvent.event.event_id > maxId) {
        filteredEvents.push(unsentEvent);
      } else {
        if (unsentEvent.callback) {
          unsentEvent.callback(status, response);
        }
      }
    }

    scope[eventQueue] = filteredEvents;
  };
  /**
   * Send unsent events. Note: this is called automatically after events are logged if option batchEvents is false.
   * If batchEvents is true, then events are only sent when batch criterias are met.
   * @private
   */


  AmplitudeClient.prototype.sendEvents = function sendEvents() {
    if (!this._apiKeySet('sendEvents()')) {
      this.removeEvents(Infinity, Infinity, 0, 'No request sent', {
        reason: 'API key not set'
      });
      return;
    }

    if (this.options.optOut) {
      this.removeEvents(Infinity, Infinity, 0, 'No request sent', {
        reason: 'Opt out is set to true'
      });
      return;
    } // How is it possible to get into this state?


    if (this._unsentCount() === 0) {
      return;
    } // We only make one request at a time. sendEvents will be invoked again once
    // the last request completes.
    // beacon data is sent synchronously, so don't pause for it


    if (this.options.transport !== Constants.TRANSPORT_BEACON) {
      if (this._sending) {
        return;
      }

      this._sending = true;
    }

    var protocol = this.options.forceHttps ? 'https' : 'https:' === GlobalScope.location.protocol ? 'https' : 'http';
    var url = protocol + '://' + this.options.apiEndpoint; // fetch events to send

    var numEvents = Math.min(this._unsentCount(), this.options.uploadBatchSize);

    var mergedEvents = this._mergeEventsAndIdentifys(numEvents);

    var maxEventId = mergedEvents.maxEventId;
    var maxIdentifyId = mergedEvents.maxIdentifyId;
    var events = JSON.stringify(mergedEvents.eventsToSend.map(function (_ref2) {
      var event = _ref2.event;
      return event;
    }));
    var uploadTime = new Date().getTime();
    var data = {
      client: this.options.apiKey,
      e: events,
      v: Constants.API_VERSION,
      upload_time: uploadTime,
      checksum: md5(Constants.API_VERSION + this.options.apiKey + events + uploadTime)
    };

    if (this.options.transport === Constants.TRANSPORT_BEACON) {
      var success = navigator.sendBeacon(url, new URLSearchParams(data));

      if (success) {
        this.removeEvents(maxEventId, maxIdentifyId, 200, 'success');

        if (this.options.saveEvents) {
          this.saveEvents();
        }
      } else {
        this._logErrorsOnEvents(maxEventId, maxIdentifyId, 0, '');
      }

      return;
    }

    var scope = this;

    try {
      new Request(url, data, this.options.headers).send(function (status, response) {
        scope._sending = false;

        try {
          if (status === 200 && response === 'success') {
            scope.removeEvents(maxEventId, maxIdentifyId, status, response); // Update the event cache after the removal of sent events.

            if (scope.options.saveEvents) {
              scope.saveEvents();
            } // Send more events if any queued during previous send.


            scope._sendEventsIfReady(); // handle payload too large

          } else {
            scope._logErrorsOnEvents(maxEventId, maxIdentifyId, status, response);

            if (status === 413) {
              // utils.log('request too large');
              // Can't even get this one massive event through. Drop it, even if it is an identify.
              if (scope.options.uploadBatchSize === 1) {
                scope.removeEvents(maxEventId, maxIdentifyId, status, response);
              } // The server complained about the length of the request. Backoff and try again.


              scope.options.uploadBatchSize = Math.ceil(numEvents / 2);
              scope.sendEvents();
            }
          } // else {
          //  all the events are still queued, and will be retried when the next
          //  event is sent In the interest of debugging, it would be nice to have
          //  something like an event emitter for a better debugging experince
          //  here.
          // }

        } catch (e) {// utils.log.error('failed upload');
        }
      });
    } catch (e) {
      var status = 0,
          response = 'Request failed to send';
      utils.log.error(response);

      scope._logErrorsOnEvents(maxEventId, maxIdentifyId, status, response);

      scope.removeEvents(maxEventId, maxIdentifyId, status, response, {
        reason: e.message
      });
    }
  };
  /**
   * Merge unsent events and identifys together in sequential order based on their sequence number, for uploading.
   * Identifys given higher priority than Events. Also earlier sequence given priority
   * @private
   */


  AmplitudeClient.prototype._mergeEventsAndIdentifys = function _mergeEventsAndIdentifys(numEvents) {
    // coalesce events from both queues
    var eventsToSend = [];
    var eventIndex = 0;
    var maxEventId = -1;
    var identifyIndex = 0;
    var maxIdentifyId = -1;

    while (eventsToSend.length < numEvents) {
      var unsentEvent = void 0;
      var noIdentifys = identifyIndex >= this._unsentIdentifys.length;
      var noEvents = eventIndex >= this._unsentEvents.length; // case 0: no events or identifys left
      // note this should not happen, this means we have less events and identifys than expected

      if (noEvents && noIdentifys) {
        utils.log.error('Merging Events and Identifys, less events and identifys than expected');
        break;
      } // case 1: no identifys - grab from events
      else if (noIdentifys) {
          unsentEvent = this._unsentEvents[eventIndex++];
          maxEventId = unsentEvent.event.event_id; // case 2: no events - grab from identifys
        } else if (noEvents) {
          unsentEvent = this._unsentIdentifys[identifyIndex++];
          maxIdentifyId = unsentEvent.event.event_id; // case 3: need to compare sequence numbers
        } else {
          // events logged before v2.5.0 won't have a sequence number, put those first
          if (!('sequence_number' in this._unsentEvents[eventIndex].event) || this._unsentEvents[eventIndex].event.sequence_number < this._unsentIdentifys[identifyIndex].event.sequence_number) {
            unsentEvent = this._unsentEvents[eventIndex++];
            maxEventId = unsentEvent.event.event_id;
          } else {
            unsentEvent = this._unsentIdentifys[identifyIndex++];
            maxIdentifyId = unsentEvent.event.event_id;
          }
        }

      eventsToSend.push(unsentEvent);
    }

    return {
      eventsToSend: eventsToSend,
      maxEventId: maxEventId,
      maxIdentifyId: maxIdentifyId
    };
  };

  {
    /**
     * Set global user properties. Note this is deprecated, and we recommend using setUserProperties
     * @public
     * @deprecated
     */
    AmplitudeClient.prototype.setGlobalUserProperties = function setGlobalUserProperties(userProperties) {
      this.setUserProperties(userProperties);
    };
  }
  /**
   * Get the current version of Amplitude's Javascript SDK.
   * @public
   * @returns {number} version number
   * @example var amplitudeVersion = amplitude.__VERSION__;
   */


  AmplitudeClient.prototype.__VERSION__ = function getVersion() {
    return this.options.library.version;
  };
  /**
   * Sets the library name and version. Default is `amplitude-js` and the version defined in package.json. Used if you're building another library on top of amplitude-js and want a custom data source value
   * @public
   * @param {string} name - Custom library name
   * @param {string} version - Custom library version
   */


  AmplitudeClient.prototype.setLibrary = function setLibrary(name, version) {
    if (name !== null && typeof name !== 'undefined') {
      this.options.library.name = name;
    }

    if (version !== null && typeof version !== 'undefined') {
      this.options.library.version = version;
    }
  };
  /**
   * Determines whether or not to push call to this._q or invoke it
   * @private
   */


  AmplitudeClient.prototype._shouldDeferCall = function _shouldDeferCall() {
    return this._pendingReadStorage || this._initializationDeferred;
  };
  /**
   * Defers Initialization by putting all functions into storage until users
   * have accepted terms for tracking
   * @private
   */


  AmplitudeClient.prototype._deferInitialization = function _deferInitialization() {
    this._initializationDeferred = true;

    this._q.push(['init'].concat(Array.prototype.slice.call(arguments, 0)));
  };
  /**
   * Enable tracking via logging events and dropping a cookie
   * Intended to be used with the deferInitialization configuration flag
   * This will drop a cookie and reset initialization deferred
   * @public
   */


  AmplitudeClient.prototype.enableTracking = function enableTracking() {
    // This will call init (which drops the cookie) and will run any pending tasks
    this._initializationDeferred = false;

    _saveCookieData(this);

    this.runQueuedFunctions();
  };
  /**
   * Find best server url if choose to enable dynamic configuration.
   */


  AmplitudeClient.prototype._refreshDynamicConfig = function _refreshDynamicConfig() {
    if (this.options.useDynamicConfig) {
      instance$1.refresh(this.options.serverZone, this.options.forceHttps, function () {
        this.options.apiEndpoint = instance$1.ingestionEndpoint;
      }.bind(this));
    }
  };
  /**
   * Returns the deviceId value.
   * @public
   * @return {string} Id of current device.
   */


  AmplitudeClient.prototype.getDeviceId = function getDeviceId() {
    return this.options.deviceId;
  };
  /**
   * Returns the userId.
   * @public
   * @return {string} Id of current user.
   */


  AmplitudeClient.prototype.getUserId = function getUserId() {
    return this.options.userId;
  };
  /**
   * Set a custom session expiration time.
   * @public
   * @param {number} timeInMillis - session expireation time in milliseconds.
   */


  AmplitudeClient.prototype.setMinTimeBetweenSessionsMillis = function setMinTimeBetweenSessionsMillis(timeInMillis) {
    if (!utils.validateInput(timeInMillis, 'timeInMillis', 'number')) {
      return;
    }

    if (this._shouldDeferCall()) {
      return this._q.push(['setMinTimeBetweenSessionsMillis'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    try {
      this.options.sessionTimeout = timeInMillis;
    } catch (e) {
      utils.log.error(e);
    }
  };
  /**
   * Sets minimum number of events to batch together per request if batchEvents is true.
   * @public
   * @param {number} eventUploadThreshold - The number of the event upload threshold. Default value is 30.
   * @example amplitudeClient.setEventUploadThreshold(10);
   */


  AmplitudeClient.prototype.setEventUploadThreshold = function setEventUploadThreshold(eventUploadThreshold) {
    if (!utils.validateInput(eventUploadThreshold, 'eventUploadThreshold', 'number')) {
      return;
    }

    if (this._shouldDeferCall()) {
      return this._q.push(['setEventUploadThreshold'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    try {
      this.options.eventUploadThreshold = eventUploadThreshold;
    } catch (e) {
      utils.log.error(e);
    }
  };
  /**
   * Dynamically adjust server URL
   * @public
   * @param {bool} useDynamicConfig - if enable dynamic config or not.
   * @example amplitudeClient.setUseDynamicConfig(true);
   */


  AmplitudeClient.prototype.setUseDynamicConfig = function setUseDynamicConfig(useDynamicConfig) {
    if (!utils.validateInput(useDynamicConfig, 'useDynamicConfig', 'boolean')) {
      return;
    }

    if (this._shouldDeferCall()) {
      return this._q.push(['setUseDynamicConfig'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    try {
      this.options.useDynamicConfig = useDynamicConfig;

      this._refreshDynamicConfig();
    } catch (e) {
      utils.log.error(e);
    }
  };
  /**
   * Sets the server zone, used for server api endpoint and dynamic configuration.
   * @public
   * @param {string} serverZone - the server zone value. AmplitudeServerZone.US or AmplitudeServerZone.EU.
   * @param {bool} serverZoneBasedApi - (optional) update api endpoint with serverZone change or not. For data residency, recommend to enable it unless using own proxy server.
   * @example amplitudeClient.setServerZone(AmplitudeServerZone.EU, true);
   */


  AmplitudeClient.prototype.setServerZone = function setServerZone(serverZone) {
    var serverZoneBasedApi = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (serverZone !== AmplitudeServerZone.EU && serverZone !== AmplitudeServerZone.US || !utils.validateInput(serverZoneBasedApi, 'serverZoneBasedApi', 'boolean')) {
      return;
    }

    if (this._shouldDeferCall()) {
      return this._q.push(['setServerZone'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    try {
      this.options.serverZone = serverZone;
      this.options.serverZoneBasedApi = serverZoneBasedApi;

      if (serverZoneBasedApi) {
        this.options.apiEndpoint = getEventLogApi(this.options.serverZone);
      }
    } catch (e) {
      utils.log.error(e);
    }
  };
  /**
   * Sets the server URL for the request.
   * @public
   * @param {string} serverUrl - The value of the server URL.
   * @example amplitudeClient.setServerUrl('api.amplitude.com');
   */


  AmplitudeClient.prototype.setServerUrl = function setServerUrl(serverUrl) {
    if (!utils.validateInput(serverUrl, 'serverUrl', 'string')) {
      return;
    }

    if (this._shouldDeferCall()) {
      return this._q.push(['setServerUrl'].concat(Array.prototype.slice.call(arguments, 0)));
    }

    try {
      this.options.apiEndpoint = serverUrl;
    } catch (e) {
      utils.log.error(e);
    }
  };

  /**
   * Deprecated legacy API of the Amplitude JS SDK - instance manager.
   *
   * Wraps around the current [AmplitudeClient](https://amplitude.github.io/Amplitude-JavaScript/) which provides more features
   * Function calls directly on amplitude have been deprecated. Please call methods on the default shared instance: amplitude.getInstance() instead.
   *
   * See the [3.0.0 changelog](https://github.com/amplitude/Amplitude-JavaScript/blob/ed405afb5f06d5cf5b72539a5d09179abcf7e1fe/README.md#300-update-and-logging-events-to-multiple-amplitude-apps) for more information about this change.
   * @constructor Amplitude
   * @public
   * @deprecated
   * @example var amplitude = new Amplitude();
   */

  var Amplitude = function Amplitude() {
    this.options = _objectSpread({}, DEFAULT_OPTIONS);
    this._q = [];
    this._instances = {}; // mapping of instance names to instances
  };

  Amplitude.prototype.Identify = Identify;
  Amplitude.prototype.Revenue = Revenue;

  Amplitude.prototype.getInstance = function getInstance(instance) {
    instance = utils.isEmptyString(instance) ? Constants.DEFAULT_INSTANCE : instance.toLowerCase();
    var client = this._instances[instance];

    if (client === undefined) {
      client = new AmplitudeClient(instance);
      this._instances[instance] = client;
    }

    return client;
  };

  {
    /**
     * Run functions queued up by proxy loading snippet
     * @private
     */
    Amplitude.prototype.runQueuedFunctions = function () {
      // run queued up old versions of functions
      for (var i = 0; i < this._q.length; i++) {
        var fn = this[this._q[i][0]];

        if (type(fn) === 'function') {
          fn.apply(this, this._q[i].slice(1));
        }
      }

      this._q = []; // clear function queue after running
      // run queued up functions on instances

      for (var instance in this._instances) {
        if (Object.prototype.hasOwnProperty.call(this._instances, instance)) {
          this._instances[instance].runQueuedFunctions();
        }
      }
    };
  }

  {
    /**
     * Initializes the Amplitude Javascript SDK with your apiKey and any optional configurations.
     * This is required before any other methods can be called.
     * @public
     * @param {string} apiKey - The API key for your app.
     * @param {string} opt_userId - (optional) An identifier for this user.
     * @param {object} opt_config - (optional) Configuration options.
     * See [options.js](https://github.com/amplitude/Amplitude-JavaScript/blob/master/src/options.js#L14) for list of options and default values.
     * @param {function} opt_callback - (optional) Provide a callback function to run after initialization is complete.
     * @deprecated Please use amplitude.getInstance().init(apiKey, opt_userId, opt_config, opt_callback);
     * @example amplitude.init('API_KEY', 'USER_ID', {includeReferrer: true, includeUtm: true}, function() { alert('init complete'); });
     */
    Amplitude.prototype.init = function init(apiKey, opt_userId, opt_config, opt_callback) {
      this.getInstance().init(apiKey, opt_userId, opt_config, function (instance) {
        // make options such as deviceId available for callback functions
        this.options = instance.options;

        if (type(opt_callback) === 'function') {
          opt_callback(instance);
        }
      }.bind(this));
    };
    /**
     * Returns true if a new session was created during initialization, otherwise false.
     * @public
     * @return {boolean} Whether a new session was created during initialization.
     * @deprecated Please use amplitude.getInstance().isNewSession();
     */


    Amplitude.prototype.isNewSession = function isNewSession() {
      return this.getInstance().isNewSession();
    };
    /**
     * Returns the id of the current session.
     * @public
     * @return {number} Id of the current session.
     * @deprecated Please use amplitude.getInstance().getSessionId();
     */


    Amplitude.prototype.getSessionId = function getSessionId() {
      return this.getInstance().getSessionId();
    };
    /**
     * Increments the eventId and returns it.
     * @private
     */


    Amplitude.prototype.nextEventId = function nextEventId() {
      return this.getInstance().nextEventId();
    };
    /**
     * Increments the identifyId and returns it.
     * @private
     */


    Amplitude.prototype.nextIdentifyId = function nextIdentifyId() {
      return this.getInstance().nextIdentifyId();
    };
    /**
     * Increments the sequenceNumber and returns it.
     * @private
     */


    Amplitude.prototype.nextSequenceNumber = function nextSequenceNumber() {
      return this.getInstance().nextSequenceNumber();
    };
    /**
     * Saves unsent events and identifies to localStorage. JSON stringifies event queues before saving.
     * Note: this is called automatically every time events are logged, unless you explicitly set option saveEvents to false.
     * @private
     */


    Amplitude.prototype.saveEvents = function saveEvents() {
      this.getInstance().saveEvents();
    };
    /**
     * Sets a customer domain for the amplitude cookie. Useful if you want to support cross-subdomain tracking.
     * @public
     * @param {string} domain to set.
     * @deprecated Please use amplitude.getInstance().setDomain(domain);
     * @example amplitude.setDomain('.amplitude.com');
     */


    Amplitude.prototype.setDomain = function setDomain(domain) {
      this.getInstance().setDomain(domain);
    };
    /**
     * Sets an identifier for the current user.
     * @public
     * @param {string} userId - identifier to set. Can be null.
     * @deprecated Please use amplitude.getInstance().setUserId(userId);
     * @example amplitude.setUserId('joe@gmail.com');
     */


    Amplitude.prototype.setUserId = function setUserId(userId) {
      this.getInstance().setUserId(userId);
    };
    /**
     * Add user to a group or groups. You need to specify a groupType and groupName(s).
     * For example you can group people by their organization.
     * In that case groupType is "orgId" and groupName would be the actual ID(s).
     * groupName can be a string or an array of strings to indicate a user in multiple gruups.
     * You can also call setGroup multiple times with different groupTypes to track multiple types of groups (up to 5 per app).
     * Note: this will also set groupType: groupName as a user property.
     * See the [advanced topics article](https://developers.amplitude.com/docs/javascript#user-groups) for more information.
     * @public
     * @param {string} groupType - the group type (ex: orgId)
     * @param {string|list} groupName - the name of the group (ex: 15), or a list of names of the groups
     * @deprecated Please use amplitude.getInstance().setGroup(groupType, groupName);
     * @example amplitude.setGroup('orgId', 15); // this adds the current user to orgId 15.
     */


    Amplitude.prototype.setGroup = function (groupType, groupName) {
      this.getInstance().setGroup(groupType, groupName);
    };
    /**
     * Sets whether to opt current user out of tracking.
     * @public
     * @param {boolean} enable - if true then no events will be logged or sent.
     * @deprecated Please use amplitude.getInstance().setOptOut(enable);
     * @example: amplitude.setOptOut(true);
     */


    Amplitude.prototype.setOptOut = function setOptOut(enable) {
      this.getInstance().setOptOut(enable);
    };
    /**
     * Regenerates a new random deviceId for current user. Note: this is not recommended unless you know what you
     * are doing. This can be used in conjunction with `setUserId(null)` to anonymize users after they log out.
     * With a null userId and a completely new deviceId, the current user would appear as a brand new user in dashboard.
     * This uses src/uuid.js to regenerate the deviceId.
     * @public
     * @deprecated Please use amplitude.getInstance().regenerateDeviceId();
     */


    Amplitude.prototype.regenerateDeviceId = function regenerateDeviceId() {
      this.getInstance().regenerateDeviceId();
    };
    /**
     * Sets a custom deviceId for current user. Note: this is not recommended unless you know what you are doing
     * (like if you have your own system for managing deviceIds).
     *
     * Make sure the deviceId you set is sufficiently unique
     * (we recommend something like a UUID - see src/uuid.js for an example of how to generate) to prevent conflicts with other devices in our system.
     * @public
     * @param {string} deviceId - custom deviceId for current user.
     * @deprecated Please use amplitude.getInstance().setDeviceId(deviceId);
     * @example amplitude.setDeviceId('45f0954f-eb79-4463-ac8a-233a6f45a8f0');
     */


    Amplitude.prototype.setDeviceId = function setDeviceId(deviceId) {
      this.getInstance().setDeviceId(deviceId);
    };
    /**
     * Sets user properties for the current user.
     * @public
     * @param {object} userProperties - object with string keys and values for the user properties to set.
     * @param {boolean} opt_replace - Deprecated. In earlier versions of the JS SDK the user properties object was kept in
     * memory and replace = true would replace the object in memory. Now the properties are no longer stored in memory, so replace is deprecated.
     * @deprecated Please use amplitude.getInstance().setUserProperties(userProperties);
     * @example amplitude.setUserProperties({'gender': 'female', 'sign_up_complete': true})
     */


    Amplitude.prototype.setUserProperties = function setUserProperties(userProperties) {
      this.getInstance().setUserProperties(userProperties);
    };
    /**
     * Clear all of the user properties for the current user. Note: clearing user properties is irreversible!
     * @public
     * @deprecated Please use amplitude.getInstance().clearUserProperties();
     * @example amplitude.clearUserProperties();
     */


    Amplitude.prototype.clearUserProperties = function clearUserProperties() {
      this.getInstance().clearUserProperties();
    };
    /**
     * Send an identify call containing user property operations to Amplitude servers.
     * See the [Identify](https://amplitude.github.io/Amplitude-JavaScript/Identify/)
     * reference page for more information on the Identify API and user property operations.
     * @param {Identify} identify_obj - the Identify object containing the user property operations to send.
     * @param {Amplitude~eventCallback} opt_callback - (optional) callback function to run when the identify event has been sent.
     * Note: the server response code and response body from the identify event upload are passed to the callback function.
     * @deprecated Please use amplitude.getInstance().identify(identify);
     * @example
     * var identify = new amplitude.Identify().set('colors', ['rose', 'gold']).add('karma', 1).setOnce('sign_up_date', '2016-03-31');
     * amplitude.identify(identify);
     */


    Amplitude.prototype.identify = function (identify_obj, opt_callback) {
      this.getInstance().identify(identify_obj, opt_callback);
    };
    /**
     * Set a versionName for your application.
     * @public
     * @param {string} versionName - The version to set for your application.
     * @deprecated Please use amplitude.getInstance().setVersionName(versionName);
     * @example amplitude.setVersionName('1.12.3');
     */


    Amplitude.prototype.setVersionName = function setVersionName(versionName) {
      this.getInstance().setVersionName(versionName);
    };
    /**
     * This is the callback for logEvent and identify calls. It gets called after the event/identify is uploaded,
     * and the server response code and response body from the upload request are passed to the callback function.
     * @callback Amplitude~eventCallback
     * @param {number} responseCode - Server response code for the event / identify upload request.
     * @param {string} responseBody - Server response body for the event / identify upload request.
     */

    /**
     * Log an event with eventType and eventProperties
     * @public
     * @param {string} eventType - name of event
     * @param {object} eventProperties - (optional) an object with string keys and values for the event properties.
     * @param {Amplitude~eventCallback} opt_callback - (optional) a callback function to run after the event is logged.
     * Note: the server response code and response body from the event upload are passed to the callback function.
     * @deprecated Please use amplitude.getInstance().logEvent(eventType, eventProperties, opt_callback);
     * @example amplitude.logEvent('Clicked Homepage Button', {'finished_flow': false, 'clicks': 15});
     */


    Amplitude.prototype.logEvent = function logEvent(eventType, eventProperties, opt_callback) {
      return this.getInstance().logEvent(eventType, eventProperties, opt_callback);
    };
    /**
     * Log an event with eventType, eventProperties, and groups. Use this to set event-level groups.
     *
     * Note: the group(s) set only apply for the specific event type being logged and does not persist on the user
     * (unless you explicitly set it with setGroup).
     *
     * See the [advanced topics article](https://developers.amplitude.com/docs/javascript#user-groups) for more information
     * about groups and Count by Distinct on the Amplitude platform.
     * @public
     * @param {string} eventType - name of event
     * @param {object} eventProperties - (optional) an object with string keys and values for the event properties.
     * @param {object} groups - (optional) an object with string groupType: groupName values for the event being logged.
     * groupName can be a string or an array of strings.
     * @param {Amplitude~eventCallback} opt_callback - (optional) a callback function to run after the event is logged.
     * Note: the server response code and response body from the event upload are passed to the callback function.
     * @deprecated Please use amplitude.getInstance().logEventWithGroups(eventType, eventProperties, groups, opt_callback);
     * @example amplitude.logEventWithGroups('Clicked Button', null, {'orgId': 24});
     */


    Amplitude.prototype.logEventWithGroups = function (eventType, eventProperties, groups, opt_callback) {
      return this.getInstance().logEventWithGroups(eventType, eventProperties, groups, opt_callback);
    };
    /**
     * Log revenue with Revenue interface. The new revenue interface allows for more revenue fields like
     * revenueType and event properties.
     *
     * See the [Revenue](https://amplitude.github.io/Amplitude-JavaScript/Revenue/)
     * reference page for more information on the Revenue interface and logging revenue.
     * @public
     * @param {Revenue} revenue_obj - the revenue object containing the revenue data being logged.
     * @deprecated Please use amplitude.getInstance().logRevenueV2(revenue_obj);
     * @example var revenue = new amplitude.Revenue().setProductId('productIdentifier').setPrice(10.99);
     * amplitude.logRevenueV2(revenue);
     */


    Amplitude.prototype.logRevenueV2 = function logRevenueV2(revenue_obj) {
      return this.getInstance().logRevenueV2(revenue_obj);
    };
    /**
     * Log revenue event with a price, quantity, and product identifier.
     * @public
     * @param {number} price - price of revenue event
     * @param {number} quantity - (optional) quantity of products in revenue event. If no quantity specified default to 1.
     * @param {string} product - (optional) product identifier
     * @deprecated Please use amplitude.getInstance().logRevenueV2(revenue_obj);
     * @example amplitude.logRevenue(3.99, 1, 'product_1234');
     */


    Amplitude.prototype.logRevenue = function logRevenue(price, quantity, product) {
      return this.getInstance().logRevenue(price, quantity, product);
    };
    /**
     * Remove events in storage with event ids up to and including maxEventId.
     * @private
     */


    Amplitude.prototype.removeEvents = function removeEvents(maxEventId, maxIdentifyId) {
      this.getInstance().removeEvents(maxEventId, maxIdentifyId);
    };
    /**
     * Send unsent events. Note: this is called automatically after events are logged if option batchEvents is false.
     * If batchEvents is true, then events are only sent when batch criterias are met.
     * @private
     * @param {Amplitude~eventCallback} callback - (optional) callback to run after events are sent.
     * Note the server response code and response body are passed to the callback as input arguments.
     */


    Amplitude.prototype.sendEvents = function sendEvents(callback) {
      this.getInstance().sendEvents(callback);
    };
    /**
     * Set global user properties.
     * @public
     * @deprecated Please use amplitudeClient.setUserProperties
     */


    Amplitude.prototype.setGlobalUserProperties = function setGlobalUserProperties(userProperties) {
      this.getInstance().setUserProperties(userProperties);
    };
  }
  /**
   * Get the current version of Amplitude's Javascript SDK.
   * @public
   * @returns {number} version number
   * @example var amplitudeVersion = amplitude.__VERSION__;
   */


  Amplitude.prototype.__VERSION__ = version;

  // Entry point
  var old = typeof GlobalScope !== 'undefined' && GlobalScope.amplitude || {};
  var newInstance = new Amplitude();
  newInstance._q = old._q || [];
  /**
   * Instantiates Amplitude object and runs all queued function logged by stubbed methods provided by snippets
   * Event queue allows async loading of SDK to not blocking client's app
   */

  for (var instance in old._iq) {
    // migrate each instance's queue
    if (Object.prototype.hasOwnProperty.call(old._iq, instance)) {
      newInstance.getInstance(instance)._q = old._iq[instance]._q || [];
    }
  } // If SDK is enabled as snippet, process the events queued by stubbed function


  {
    newInstance.runQueuedFunctions();
  } // export the instance

  return newInstance;

}));

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"buffer":2}]},{},[4]);