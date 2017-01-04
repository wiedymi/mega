'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var through = _interopDefault(require('through'));
var pipeline = _interopDefault(require('stream-combiner'));
var secureRandom = _interopDefault(require('secure-random'));
var crypto = _interopDefault(require('crypto'));
var events = require('events');
var request = _interopDefault(require('request'));
var querystring = _interopDefault(require('querystring'));
var CombinedStream = _interopDefault(require('combined-stream'));
var url = require('url');

function streamToCb(stream, cb) {
  var chunks = [];
  var complete = void 0;
  stream.on('data', function (d) {
    chunks.push(d);
  });
  stream.on('end', function () {
    if (!complete) {
      complete = true;
      cb(null, Buffer.concat(chunks));
    }
  });
  stream.on('error', function (e) {
    if (!complete) {
      complete = true;
      cb(e);
    }
  });
}

function chunkSizeSafe(size) {
  var last = void 0;
  return through(function (d) {
    if (last) d = Buffer.concat([last, d]);

    var end = Math.floor(d.length / size) * size;

    if (!end) {
      last = last ? Buffer.concat([last, d]) : d;
    } else if (d.length > end) {
      last = d.slice(end);
      this.emit('data', d.slice(0, end));
    } else {
      last = undefined;
      this.emit('data', d);
    }
  }, function () {
    if (last) this.emit('data', last);
    this.emit('end');
  });
}

function detectSize(cb) {
  var chunks = [];
  var size = 0;

  return through(function (d) {
    chunks.push(d);
    size += d.length;
  }, function () {
    // function IS needed
    cb(size);
    chunks.forEach(this.emit.bind(this, 'data'));
    this.emit('end');
  });
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};











var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();







var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};



var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};

// convert user-supplied password array
function prepareKey(password) {
  var i = void 0,
      j = void 0,
      r = void 0;
  var pkey = Buffer.from([147, 196, 103, 227, 125, 176, 199, 164, 209, 190, 63, 129, 1, 82, 203, 86]);

  for (r = 65536; r--;) {
    for (j = 0; j < password.length; j += 16) {
      var key = Buffer.alloc(16);

      for (i = 0; i < 16; i += 4) {
        if (i + j < password.length) {
          password.copy(key, i, i + j, i + j + 4);
        }
      }

      pkey = crypto.createCipheriv('aes-128-ecb', key, Buffer.alloc(0)).setAutoPadding(false).update(pkey);
    }
  }

  return pkey;
}

var AES = function () {
  function AES(key) {
    classCallCheck(this, AES);

    this.key = key;
  }

  createClass(AES, [{
    key: 'encryptCBC',
    value: function encryptCBC(buffer) {
      var iv = Buffer.alloc(16, 0);
      var cipher = crypto.createCipheriv('aes-128-cbc', this.key, iv).setAutoPadding(false);

      var result = Buffer.concat([cipher.update(buffer), cipher.final()]);
      result.copy(buffer);
      return result;
    }
  }, {
    key: 'decryptCBC',
    value: function decryptCBC(buffer) {
      var iv = Buffer.alloc(16, 0);
      var decipher = crypto.createDecipheriv('aes-128-cbc', this.key, iv).setAutoPadding(false);

      var result = Buffer.concat([decipher.update(buffer), decipher.final()]);
      result.copy(buffer);
      return result;
    }
  }, {
    key: 'stringhash',
    value: function stringhash(buffer) {
      var h32 = [0, 0, 0, 0];
      for (var i = 0; i < buffer.length; i += 4) {
        h32[i / 4 & 3] ^= buffer.readInt32BE(i, true);
      }

      var hash = new Buffer(16);
      for (var _i = 0; _i < 4; _i++) {
        hash.writeInt32BE(h32[_i], _i * 4, true);
      }

      var cipher = crypto.createCipheriv('aes-128-ecb', this.key, Buffer.alloc(0));
      for (var _i2 = 16384; _i2--;) {
        hash = cipher.update(hash);
      }var result = new Buffer(8);
      hash.copy(result, 0, 0, 4);
      hash.copy(result, 4, 8, 12);
      return result;
    }
  }, {
    key: 'encryptECB',
    value: function encryptECB(buffer) {
      var cipher = crypto.createCipheriv('aes-128-ecb', this.key, Buffer.alloc(0)).setAutoPadding(false);

      var result = cipher.update(buffer);
      result.copy(buffer);
      return result;
    }
  }, {
    key: 'decryptECB',
    value: function decryptECB(buffer) {
      var decipher = crypto.createDecipheriv('aes-128-ecb', this.key, Buffer.alloc(0)).setAutoPadding(false);

      var result = decipher.update(buffer);
      result.copy(buffer);
      return result;
    }
  }]);
  return AES;
}();

var CTR = function () {
  function CTR(aes, nonce) {
    var _this = this;

    classCallCheck(this, CTR);

    this.key = aes.key;
    this.nonce = nonce.slice(0, 8);

    var iv = Buffer.alloc(16);
    this.nonce.copy(iv, 0);

    // create ciphers on demand
    this.encrypt = function (buffer) {
      _this.encryptCipher = crypto.createCipheriv('aes-128-ctr', _this.key, iv);
      _this.encrypt = _this._encrypt;
      return _this.encrypt(buffer);
    };

    this.decrypt = function (buffer) {
      _this.decryptCipher = crypto.createDecipheriv('aes-128-ctr', _this.key, iv);
      _this.decrypt = _this._decrypt;
      return _this.decrypt(buffer);
    };

    // MEGA's MAC implementation is... strange
    this.macCipher = crypto.createCipheriv('aes-128-ecb', this.key, Buffer.alloc(0));

    this.posNext = this.increment = 131072; // 2**17
    this.pos = 0;

    this.macs = [];

    this.mac = Buffer.alloc(16);
    this.nonce.copy(this.mac, 0);
    this.nonce.copy(this.mac, 8);
  }

  createClass(CTR, [{
    key: 'condensedMac',
    value: function condensedMac() {
      if (this.mac) {
        this.macs.push(this.mac);
        this.mac = undefined;
      }

      var mac = Buffer.alloc(16, 0);

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.macs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var item = _step.value;

          for (var j = 0; j < 16; j++) {
            mac[j] ^= item[j];
          }mac = this.macCipher.update(mac);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      var macBuffer = new Buffer(8);
      macBuffer.writeInt32BE(mac.readInt32BE(0) ^ mac.readInt32BE(4), 0);
      macBuffer.writeInt32BE(mac.readInt32BE(8) ^ mac.readInt32BE(12), 4);
      return macBuffer;
    }
  }, {
    key: '_encrypt',
    value: function _encrypt(buffer) {
      for (var i = 0; i < buffer.length; i += 16) {
        for (var j = 0; j < 16; j++) {
          this.mac[j] ^= buffer[i + j];
        }this.mac = this.macCipher.update(this.mac);
        this.checkMacBounding();
      }

      return this.encryptCipher.update(buffer).copy(buffer);
    }
  }, {
    key: '_decrypt',
    value: function _decrypt(buffer) {
      this.decryptCipher.update(buffer).copy(buffer);

      for (var i = 0; i < buffer.length; i += 16) {
        for (var j = 0; j < 16; j++) {
          this.mac[j] ^= buffer[i + j];
        }this.mac = this.macCipher.update(this.mac);
        this.checkMacBounding();
      }
      return buffer;
    }
  }, {
    key: 'checkMacBounding',
    value: function checkMacBounding() {
      this.pos += 16;
      if (this.pos >= this.posNext) {
        this.macs.push(Buffer.from(this.mac));
        this.nonce.copy(this.mac, 0);
        this.nonce.copy(this.mac, 8);

        if (this.increment < 1048576) {
          this.increment += 131072;
        }
        this.posNext += this.increment;
      }
    }
  }]);
  return CTR;
}();

function formatKey(key) {
  return typeof key === 'string' ? d64(key) : key;
}

// URL Safe Base64 encode/decode
function e64(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function d64(s) {
  s += '=='.substr(2 - s.length * 3 & 3);
  s = s.replace(/-/g, '+').replace(/_/g, '/').replace(/,/g, '');
  return new Buffer(s, 'base64');
}
function getCipher(key) {
  // 256 -> 128
  var k = new Buffer(16);
  for (var i = 0; i < 16; i++) {
    k.writeUInt8(key.readUInt8(i) ^ key.readUInt8(i + 16, true), i);
  }
  return new AES(k);
}

function megaEncrypt(key, options) {
  if (!options) options = {};
  key = formatKey(key);

  if (!key) {
    key = secureRandom(24);
  }
  if (!(key instanceof Buffer)) {
    key = new Buffer(key);
  }

  var stream = through(write, end);

  if (key.length !== 24) {
    return process.nextTick(function () {
      stream.emit('error', Error('Wrong key length. Key must be 192bit.'));
    });
  }

  var aes = new AES(key.slice(0, 16));
  var ctr = new CTR(aes, key.slice(16));

  function write(d) {
    ctr.encrypt(d);
    this.emit('data', d);
  }

  function end() {
    var mac = ctr.condensedMac();
    var newkey = new Buffer(32);
    key.copy(newkey);
    mac.copy(newkey, 24);

    for (var i = 0; i < 16; i++) {
      newkey.writeUInt8(newkey.readUInt8(i) ^ newkey.readUInt8(16 + i), i);
    }

    stream.key = newkey;
    this.emit('end');
  }

  stream = pipeline(chunkSizeSafe(16), stream);
  return stream;
}

function megaDecrypt(key, options) {
  if (!options) options = {};
  key = formatKey(key);

  var stream = through(write, end);

  var aes = getCipher(key);
  var ctr = new CTR(aes, key.slice(16));

  function write(d) {
    ctr.decrypt(d);
    this.emit('data', d);
  }

  function end() {
    var mac = ctr.condensedMac();
    if (!mac.equals(key.slice(24)) && !options.ignoreMac) {
      return this.emit('error', Error('MAC verification failed'));
    }
    this.emit('end');
  }

  return pipeline(chunkSizeSafe(16), stream);
}

function constantTimeCompare(bufferA, bufferB) {
  if (bufferA.length !== bufferB.length) return false;

  var len = bufferA.length;
  var result = 0;

  for (var i = 0; i < len; i++) {
    result |= bufferA[i] ^ bufferB[i];
  }

  return result === 0;
}

/* RSA public key encryption/decryption
 * The following functions are (c) 2000 by John M Hanna and are
 * released under the terms of the Gnu Public License.
 * You must freely redistribute them with their source -- see the
 * GPL for details.
 *  -- Latest version found at http://sourceforge.net/projects/shop-js
 *
 * Modifications and GnuPG multi precision integer (mpi) conversion added
 * 2004 by Herbert Hanewinkel, www.haneWIN.de
 */

// The original script assumes `this` to be a object (like `window`)
// Then `this` was replaced with `globalState`
var globalState = {};

// --- Arbitrary Precision Math ---
// badd(a,b), bsub(a,b), bsqr(a), bmul(a,b)
// bdiv(a,b), bmod(a,b), bexpmod(g,e,m), bmodexp(g,e,m)

// bs is the shift, bm is the mask
// set single precision bits to 28
var bs = 28;
var bx2 = 1 << bs;
var bm = bx2 - 1;
var bd = bs >> 1;
var bdm = (1 << bd) - 1;

var log2 = Math.log(2);

function zeros(n) {
  var r = [];

  while (n-- > 0) {
    r[n] = 0;
  }return r;
}

function zclip(r) {
  var n = r.length;
  if (r[n - 1]) return r;
  while (n > 1 && r[n - 1] === 0) {
    n--;
  }return r.slice(0, n);
}

// returns bit length of integer x
function nbits(x) {
  var n = 1;
  var t = void 0;
  if ((t = x >>> 16) !== 0) {
    x = t;n += 16;
  }
  if ((t = x >> 8) !== 0) {
    x = t;n += 8;
  }
  if ((t = x >> 4) !== 0) {
    x = t;n += 4;
  }
  if ((t = x >> 2) !== 0) {
    x = t;n += 2;
  }
  if ((t = x >> 1) !== 0) {
    x = t;n += 1;
  }
  return n;
}

function badd(a, b) {
  var al = a.length;
  var bl = b.length;

  if (al < bl) return badd(b, a);

  var r = [];
  var c = 0;
  var n = 0;

  for (; n < bl; n++) {
    c += a[n] + b[n];
    r[n] = c & bm;
    c >>>= bs;
  }
  for (; n < al; n++) {
    c += a[n];
    r[n] = c & bm;
    c >>>= bs;
  }
  if (c) r[n] = c;
  return r;
}

function bsub(a, b) {
  var al = a.length;
  var bl = b.length;

  if (bl > al) return [];
  if (bl === al) {
    if (b[bl - 1] > a[bl - 1]) return [];
    if (bl === 1) return [a[0] - b[0]];
  }

  var r = [];
  var c = 0;
  var n = void 0;

  for (n = 0; n < bl; n++) {
    c += a[n] - b[n];
    r[n] = c & bm;
    c >>= bs;
  }
  for (; n < al; n++) {
    c += a[n];
    r[n] = c & bm;
    c >>= bs;
  }
  if (c) return [];

  return zclip(r);
}

function ip(w, n, x, y, c) {
  var xl = x & bdm;
  var xh = x >> bd;

  var yl = y & bdm;
  var yh = y >> bd;

  var m = xh * yl + yh * xl;
  var l = xl * yl + ((m & bdm) << bd) + w[n] + c;
  w[n] = l & bm;
  c = xh * yh + (m >> bd) + (l >> bs);
  return c;
}

// Multiple-precision squaring, HAC Algorithm 14.16

function bsqr(x) {
  var t = x.length;
  var n = 2 * t;
  var r = zeros(n);
  var c = 0;
  var i = void 0,
      j = void 0;

  for (i = 0; i < t; i++) {
    c = ip(r, 2 * i, x[i], x[i], 0);
    for (j = i + 1; j < t; j++) {
      c = ip(r, i + j, 2 * x[j], x[i], c);
    }
    r[i + t] = c;
  }

  return zclip(r);
}

// Multiple-precision multiplication, HAC Algorithm 14.12

function bmul(x, y) {
  var n = x.length;
  var t = y.length;
  var r = zeros(n + t - 1);
  var c = void 0,
      i = void 0,
      j = void 0;

  for (i = 0; i < t; i++) {
    c = 0;
    for (j = 0; j < n; j++) {
      c = ip(r, i + j, x[j], y[i], c);
    }
    r[i + n] = c;
  }

  return zclip(r);
}

function toppart(x, start, len) {
  var n = 0;
  while (start >= 0 && len-- > 0) {
    n = n * bx2 + x[start--];
  }return n;
}

// Multiple-precision division, HAC Algorithm 14.20

function bdiv(a, b) {
  var n = a.length - 1;
  var t = b.length - 1;
  var nmt = n - t;
  var x = void 0,
      y = void 0,
      qq = void 0,
      xx = void 0;

  // trivial cases; a < b
  if (n < t || n === t && (a[n] < b[n] || n > 0 && a[n] === b[n] && a[n - 1] < b[n - 1])) {
    globalState.q = [0];
    globalState.mod = a;
    return globalState;
  }

  // trivial cases; q < 4
  if (n === t && toppart(a, t, 2) / toppart(b, t, 2) < 4) {
    x = a.concat();
    qq = 0;
    xx;
    for (;;) {
      xx = bsub(x, b);
      if (xx.length === 0) break;
      x = xx;qq++;
    }
    globalState.q = [qq];
    globalState.mod = x;
    return globalState;
  }

  // normalize
  var shift2 = Math.floor(Math.log(b[t]) / log2) + 1;
  var shift = bs - shift2;

  x = a.concat();
  y = b.concat();

  if (shift) {
    for (i = t; i > 0; i--) {
      y[i] = y[i] << shift & bm | y[i - 1] >> shift2;
    }y[0] = y[0] << shift & bm;
    if (x[n] & (bm << shift2 & bm)) {
      x[++n] = 0;nmt++;
    }
    for (i = n; i > 0; i--) {
      x[i] = x[i] << shift & bm | x[i - 1] >> shift2;
    }x[0] = x[0] << shift & bm;
  }

  var i = void 0,
      x2 = void 0;
  var q = zeros(nmt + 1);
  var y2 = zeros(nmt).concat(y);
  for (;;) {
    x2 = bsub(x, y2);
    if (x2.length === 0) break;
    q[nmt]++;
    x = x2;
  }

  var yt = y[t];
  var top = toppart(y, t, 2);
  var m = void 0;
  for (i = n; i > t; i--) {
    m = i - t - 1;
    if (i >= x.length) {
      q[m] = 1;
    } else if (x[i] === yt) {
      q[m] = bm;
    } else {
      q[m] = Math.floor(toppart(x, i, 2) / yt);
    }

    var topx = toppart(x, i, 3);
    while (q[m] * top > topx) {
      q[m]--;
    } // x-=q[m]*y*b^m
    y2 = y2.slice(1);
    x2 = bsub(x, bmul([q[m]], y2));
    if (x2.length === 0) {
      q[m]--;
      x2 = bsub(x, bmul([q[m]], y2));
    }
    x = x2;
  }
  // de-normalize
  if (shift) {
    for (i = 0; i < x.length - 1; i++) {
      x[i] = x[i] >> shift | x[i + 1] << shift2 & bm;
    }x[x.length - 1] >>= shift;
  }

  globalState.q = zclip(q);
  globalState.mod = zclip(x);
  return globalState;
}

// returns the mod where m < 2^bd
function simplemod(i, m) {
  var c = 0;
  var v = void 0;
  for (var n = i.length - 1; n >= 0; n--) {
    v = i[n];
    c = ((v >> bd) + (c << bd)) % m;
    c = ((v & bdm) + (c << bd)) % m;
  }
  return c;
}

function bmod(p, m) {
  if (m.length === 1) {
    if (p.length === 1) return [p[0] % m[0]];
    if (m[0] < bdm) return [simplemod(p, m[0])];
  }

  var r = bdiv(p, m);
  return r.mod;
}

// Barrett's modular reduction, HAC Algorithm 14.42

function bmod2(x, m, mu) {
  var xl = x.length - (m.length << 1);
  if (xl > 0) return bmod2(x.slice(0, xl).concat(bmod2(x.slice(xl), m, mu)), m, mu);

  var ml1 = m.length + 1;
  var ml2 = m.length - 1;
  var rr = void 0;
  var q3 = bmul(x.slice(ml2), mu).slice(ml1);
  var r1 = x.slice(0, ml1);
  var r2 = bmul(q3, m).slice(0, ml1);
  var r = bsub(r1, r2);

  if (r.length === 0) {
    r1[ml1] = 1;
    r = bsub(r1, r2);
  }
  for (var n = 0;; n++) {
    rr = bsub(r, m);
    if (rr.length === 0) break;
    r = rr;
    if (n >= 3) return bmod2(r, m, mu);
  }
  return r;
}

// Modular exponentiation using Barrett reduction

function bmodexp(g, e, m) {
  var a = g.concat();
  var l = e.length - 1;
  var n = m.length * 2;
  var mu = zeros(n + 1);
  mu[n] = 1;
  mu = bdiv(mu, m).q;

  n = nbits(e[l]) - 2;

  for (; l >= 0; l--) {
    for (; n >= 0; n -= 1) {
      a = bmod2(bsqr(a), m, mu);
      if (e[l] & 1 << n) a = bmod2(bmul(a, g), m, mu);
    }
    n = bs - 1;
  }
  return a;
}

// Compute m**d mod p*q for RSA private key operations.

function RSAdecrypt(m, d, p, q, u) {
  var xp = bmodexp(bmod(m, p), bmod(d, bsub(p, [1])), p);
  var xq = bmodexp(bmod(m, q), bmod(d, bsub(q, [1])), q);

  var t = bsub(xq, xp);
  if (t.length === 0) {
    t = bsub(xp, xq);
    t = bmod(bmul(t, u), q);
    t = bsub(q, t);
  } else {
    t = bmod(bmul(t, u), q);
  }
  return badd(bmul(t, p), xp);
}

// -----------------------------------------------------------------
// conversion functions: num array <-> multi precision integer (mpi)
// mpi: 2 octets with length in bits + octets in big endian order

function mpi2b(s) {
  var bn = 1;
  var r = [0];
  var rn = 0;
  var sb = 256;
  var sn = s.length;
  var c = void 0;

  if (sn < 2) return 0;

  var len = (sn - 2) * 8;
  var bits = s.charCodeAt(0) * 256 + s.charCodeAt(1);
  if (bits > len || bits < len - 8) return 0;

  for (var n = 0; n < len; n++) {
    if ((sb <<= 1) > 255) {
      sb = 1;
      c = s.charCodeAt(--sn);
    }
    if (bn > bm) {
      bn = 1;
      r[++rn] = 0;
    }
    if (c & sb) r[rn] |= bn;
    bn <<= 1;
  }
  return r;
}

function b2s(b) {
  var bn = 1;
  var bc = 0;
  var r = [0];
  var rb = 1;
  var rn = 0;
  var bits = b.length * bs;
  var rr = '';
  var n = void 0;

  for (n = 0; n < bits; n++) {
    if (b[bc] & bn) r[rn] |= rb;
    if ((rb <<= 1) > 255) {
      rb = 1;
      r[++rn] = 0;
    }
    if ((bn <<= 1) > bm) {
      bn = 1;
      bc++;
    }
  }

  while (rn >= 0 && r[rn] === 0) {
    rn--;
  }for (n = 0; n <= rn; n++) {
    rr = String.fromCharCode(r[n]) + rr;
  }return rr;
}

/**
 * cryptoDecodePrivKey
 * @public
 * @argv privk Buffer Private key
 * @return Private Key
 * @source https://github.com/meganz/webclient/blob/542d98ec61340b1e4fbf0dae0ae457c1bc5d49aa/js/crypto.js#L1448
 */
function cryptoDecodePrivKey(privk) {
  var pubkey = [];

  // decompose private key
  for (var i = 0; i < 4; i++) {
    var l = (privk[0] * 256 + privk[1] + 7 >> 3) + 2;
    pubkey[i] = mpi2b(privk.toString('binary').substr(0, l));
    if (typeof pubkey[i] === 'number') {
      if (i !== 4 || privk.length >= 16) return false;
      break;
    }
    privk = privk.slice(l);
  }

  return pubkey;
}

/**
 * cryptoRsaDecrypt
 * @public
 * @argv ciphertext Buffer
 * @argv privkey Private Key
 * @return Buffer Decrypted plaintext
 * @source https://github.com/meganz/webclient/blob/4d95863d2cdbfb7652d16acdff8bae4b64056549/js/crypto.js#L1468
 */
function cryptoRsaDecrypt(ciphertext, privkey) {
  var integerCiphertext = mpi2b(ciphertext.toString('binary'));
  var plaintext = b2s(RSAdecrypt(integerCiphertext, privkey[2], privkey[0], privkey[1], privkey[3]));
  return new Buffer(plaintext, 'binary');
}

var MAX_RETRIES = 4;
var ERRORS = {
  1: 'EINTERNAL (-1): An internal error has occurred. Please submit a bug report, detailing the exact circumstances in which this error occurred.',
  2: 'EARGS (-2): You have passed invalid arguments to this command.',
  3: 'EAGAIN (-3): A temporary congestion or server malfunction prevented your request from being processed. No data was altered. Retried ' + MAX_RETRIES + ' times.',
  4: 'ERATELIMIT (-4): You have exceeded your command weight per time quota. Please wait a few seconds, then try again (this should never happen in sane real-life applications).',
  5: 'EFAILED (-5): The upload failed. Please restart it from scratch.',
  6: 'ETOOMANY (-6): Too many concurrent IP addresses are accessing this upload target URL.',
  7: 'ERANGE (-7): The upload file packet is out of range or not starting and ending on a chunk boundary.',
  8: 'EEXPIRED (-8): The upload target URL you are trying to access has expired. Please request a fresh one.',
  9: 'ENOENT (-9): Object (typically, node or user) not found. Wrong password?',
  10: 'ECIRCULAR (-10): Circular linkage attempted',
  11: 'EACCESS (-11): Access violation (e.g., trying to write to a read-only share)',
  12: 'EEXIST (-12): Trying to create an object that already exists',
  13: 'EINCOMPLETE (-13): Trying to access an incomplete resource',
  14: 'EKEY (-14): A decryption operation failed (never returned by the API)',
  15: 'ESID (-15): Invalid or expired user session, please relogin',
  16: 'EBLOCKED (-16): User blocked',
  17: 'EOVERQUOTA (-17): Request over quota',
  18: 'ETEMPUNAVAIL (-18): Resource temporarily not available, please try again later'
};

var DEFAULT_GATEWAY = 'https://g.api.mega.co.nz/';

var API = function (_EventEmitter) {
  inherits(API, _EventEmitter);

  function API(keepalive) {
    classCallCheck(this, API);

    var _this = possibleConstructorReturn(this, (API.__proto__ || Object.getPrototypeOf(API)).call(this));

    _this.keepalive = keepalive;
    _this.counterId = Math.random().toString().substr(2, 10);
    _this.gateway = DEFAULT_GATEWAY;
    _this.requestModule = request;
    return _this;
  }

  createClass(API, [{
    key: 'request',
    value: function request(json, cb) {
      var _this2 = this;

      var retryno = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

      var qs = { id: (this.counterId++).toString() };
      if (this.sid) {
        qs.sid = this.sid;
      }

      if (_typeof(json._querystring) === 'object') {
        Object.assign(qs, json._querystring);
        delete json._querystring;
      }

      this.requestModule({
        uri: this.gateway + 'cs',
        qs: qs,
        method: 'POST',
        json: [json]
      }, function (err, req, resp) {
        if (err) return cb(err);

        if (!resp) return cb(Error('Empty response'));

        // Some error codes are returned as num, some as array with number.
        if (resp.length) resp = resp[0];

        if (!err && typeof resp === 'number' && resp < 0) {
          if (resp === -3) {
            if (retryno < MAX_RETRIES) {
              return setTimeout(function () {
                _this2.request(json, cb, retryno + 1);
              }, Math.pow(2, retryno + 1) * 1e3);
            }
          }
          err = Error(ERRORS[-resp]);
        } else {
          if (_this2.keepalive && resp && resp.sn) {
            _this2.pull(resp.sn);
          }
        }
        cb(err, resp);
      });
    }
  }, {
    key: 'pull',
    value: function pull(sn) {
      var _this3 = this;

      var retryno = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;

      this.sn = this.requestModule({
        uri: this.gateway + 'sc',
        qs: { sn: sn, sid: this.sid },
        method: 'POST',
        json: true,
        body: 'sc?' + querystring.stringify({ sn: sn })
      }, function (err, req, resp) {
        _this3.sn = undefined;

        if (!err && typeof resp === 'number' && resp < 0) {
          if (resp === -3) {
            if (retryno < MAX_RETRIES) {
              return setTimeout(function () {
                _this3.pull(sn, retryno + 1);
              }, Math.pow(2, retryno + 1) * 1e3);
            }
          }
          err = Error(ERRORS[-resp]);
        }
        if (err) throw err;

        if (resp.w) {
          _this3.wait(resp.w, sn);
        } else if (resp.sn) {
          if (resp.a) {
            _this3.emit('sc', resp.a);
          }
          _this3.pull(resp.sn);
        }
      });
    }
  }, {
    key: 'wait',
    value: function wait(url$$1, sn) {
      var _this4 = this;

      this.sn = this.requestModule({
        uri: url$$1,
        method: 'POST'
      }, function (err, req, body) {
        _this4.sn = undefined;
        if (err) throw Error('mega server wait req failed');

        _this4.pull(sn);
      });
    }
  }, {
    key: 'close',
    value: function close() {
      if (this.sn) this.sn.abort();
    }
  }]);
  return API;
}(events.EventEmitter);

var notLoggedApi = new API(false);

var File = function (_EventEmitter) {
  inherits(File, _EventEmitter);

  function File(opt) {
    classCallCheck(this, File);

    var _this = possibleConstructorReturn(this, (File.__proto__ || Object.getPrototypeOf(File)).call(this));

    _this.downloadId = opt.downloadId;
    _this.key = opt.key ? formatKey(opt.key) : null;
    _this.type = opt.directory ? 1 : 0;
    _this.directory = !!opt.directory;
    _this.api = notLoggedApi;
    return _this;
  }

  createClass(File, [{
    key: 'loadMetadata',
    value: function loadMetadata(aes, opt) {
      this.size = opt.s || 0;
      this.timestamp = opt.ts || 0;
      this.type = opt.t;
      this.name = null;

      if (!aes || !opt.k) return;

      var parts = opt.k.split(':');
      this.key = formatKey(parts[parts.length - 1]);
      aes.decryptECB(this.key);
      if (opt.a) {
        this.decryptAttributes(opt.a);
      }
    }
  }, {
    key: 'decryptAttributes',
    value: function decryptAttributes(at) {
      var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

      at = d64(at);
      getCipher(this.key).decryptCBC(at);

      try {
        at = File.unpackAttributes(at);
      } catch (e) {
        return cb(e);
      }

      this.parseAttributes(at);
      cb(null, this);
      return this;
    }
  }, {
    key: 'parseAttributes',
    value: function parseAttributes(at) {
      this.attributes = at;
      this.name = at.n;
      this.label = File.LABEL_NAMES[at.lbl || 0];
      this.favorited = !!at.fav;
    }
  }, {
    key: 'loadAttributes',
    value: function loadAttributes(cb) {
      var _this2 = this;

      if (typeof cb !== 'function') {
        cb = function cb(err) {
          if (err) throw err;
        };
      }

      var req = this.directory ? { a: 'f', qs: { n: this.downloadId } } : { a: 'g', p: this.downloadId }; // todo: nodeId version ('n')

      this.api.request(req, function (err, response) {
        if (err) return cb(err);

        if (_this2.directory) {
          var filesMap = new Map();
          var folder = response.f[0];
          var aes = _this2.key ? new AES(_this2.key) : null;
          _this2.nodeId = folder.h;
          _this2.timestamp = folder.ts;
          filesMap.set(folder.h, _this2);

          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = response.f[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var file = _step.value;

              if (file.t === 0) {
                var parent = filesMap.get(file.p);
                if (!parent.children) parent.children = [];

                var fileObj = new File(file, _this2.storage);
                fileObj.loadMetadata(aes, file);
                // is it the best way to handle this?
                fileObj.downloadId = [_this2.downloadId, file.h];
                parent.children.push(fileObj);
                file.parent = parent;
              }
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }

          _this2.loadMetadata(aes, folder);
          cb(null, _this2);
        } else {
          _this2.size = response.s;
          _this2.decryptAttributes(response.at, cb);
        }
      });

      return this;
    }
  }, {
    key: 'download',
    value: function download(options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      if (!options) options = {};
      var maxConnections = options.maxConnections || 4;
      var initialChunkSize = options.initialChunkSize || 128 * 1024;
      var chunkSizeIncrement = options.chunkSizeIncrement || 128 * 1024;
      var maxChunkSize = options.maxChunkSize || 1024 * 1024;

      var req = { a: 'g', g: 1, ssl: 2 };
      if (this.nodeId) {
        req.n = this.nodeId;
      } else if (Array.isArray(this.downloadId)) {
        req._querystring = { n: this.downloadId[0] };
        req.n = this.downloadId[1];
      } else {
        req.p = this.downloadId;
      }

      if (this.directory) throw Error("Can't download: folder download isn't supported");
      if (!this.key) throw Error("Can't download: key isn't defined");
      var stream = megaDecrypt(this.key);

      var cs = this.api || notLoggedApi;
      var requestModule = options.requestModule || this.api.requestModule;

      cs.request(req, function (err, response) {
        if (err) return stream.emit('error', err);
        if (typeof response.g !== 'string' || response.g.substr(0, 4) !== 'http') {
          return stream.emit('error', Error('MEGA servers returned an invalid response, maybe caused by rate limit'));
        }

        var activeStreams = 0;
        var currentOffset = 0;
        var chunkSize = initialChunkSize;
        var combined = CombinedStream.create();

        function getChunk() {
          var currentMax = Math.min(response.s, currentOffset + chunkSize);
          if (currentMax <= currentOffset) return;
          var r = requestModule(response.g + '/' + currentOffset + '-' + (currentMax - 1));

          r.on('end', getChunk);
          combined.append(r, { contentLength: currentMax - currentOffset });

          currentOffset = currentMax;
          if (chunkSize < maxChunkSize) {
            chunkSize = chunkSize + chunkSizeIncrement;
          }

          activeStreams += 1;
          if (activeStreams < maxConnections) {
            setTimeout(getChunk, 1000);
          }
        }

        getChunk();
        combined.pipe(stream);

        var i = 0;
        stream.on('data', function (d) {
          i += d.length;
          stream.emit('progress', { bytesLoaded: i, bytesTotal: response.s });
        });
      });

      if (cb) streamToCb(stream, cb);
      return stream;
    }
  }]);
  return File;
}(events.EventEmitter);

File.LABEL_NAMES = ['', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'grey'];

File.fromURL = function (opt) {
  if ((typeof opt === 'undefined' ? 'undefined' : _typeof(opt)) === 'object') {
    // todo: warn to use File directly
    return new File(opt);
  }

  var url$$1 = url.parse(opt);
  if (url$$1.hostname !== 'mega.nz' && url$$1.hostname !== 'mega.co.nz') throw Error('Wrong URL supplied: wrong hostname');
  if (!url$$1.hash) throw Error('Wrong URL supplied: no hash');

  var split = url$$1.hash.split('!');
  if (split.length <= 1) throw Error('Wrong URL supplied: too few arguments');
  if (split.length >= 4) throw Error('Wrong URL supplied: too many arguments');
  if (split[0] !== '#' && split[0] !== '#F') throw Error('Wrong URL supplied: not recognized');

  return new File({
    downloadId: split[1],
    key: split[2],
    directory: split[0] === '#F'
  });
};

File.unpackAttributes = function (at) {
  // read until the first null byte
  var end = 0;
  while (end < at.length && at.readUInt8(end)) {
    end++;
  }at = at.slice(0, end).toString();
  if (at.substr(0, 6) !== 'MEGA{"') {
    throw Error('Attributes could not be decrypted with provided key.');
  }

  return JSON.parse(at.substr(4).replace(/\0|[^}]*$/g, ''));
};

// the metadata can be mutated, not the content

var MutableFile = function (_File) {
  inherits(MutableFile, _File);

  function MutableFile(opt, storage) {
    classCallCheck(this, MutableFile);

    var _this = possibleConstructorReturn(this, (MutableFile.__proto__ || Object.getPrototypeOf(MutableFile)).call(this, opt));

    _this.storage = storage;
    _this.api = storage.api;
    _this.nodeId = opt.h;
    _this.timestamp = opt.ts;
    _this.type = opt.t;
    _this.directory = !!_this.type;

    if (opt.k) {
      _this.loadMetadata(storage.aes, opt);
    }
    return _this;
  }

  createClass(MutableFile, [{
    key: 'loadAttributes',
    value: function loadAttributes() {
      throw Error('This is not needed for files loaded from logged in sessions');
    }

    // todo: handle sharing, it can create new shares

  }, {
    key: 'mkdir',
    value: function mkdir(opt, cb) {
      var _this2 = this;

      if (!this.directory) throw Error("node isn't a directory");
      if (typeof opt === 'string') {
        opt = { name: opt };
      }
      if (!opt.attributes) opt.attributes = {};
      if (opt.name) opt.attributes.n = opt.name;

      if (!opt.attributes.n) {
        return process.nextTick(function () {
          cb(Error('File name is required.'));
        });
      }

      if (!opt.target) opt.target = this;
      if (!opt.key) opt.key = new Buffer(secureRandom(32));

      if (opt.key.length !== 32) {
        return process.nextTick(function () {
          cb(Error('Wrong key length. Key must be 256bit'));
        });
      }

      var key = opt.key;
      var at = MutableFile.packAttributes(opt.attributes);

      getCipher(key).encryptCBC(at);
      this.storage.aes.encryptECB(key);

      this.api.request({
        a: 'p',
        t: opt.target.nodeId ? opt.target.nodeId : opt.target,
        n: [{
          h: 'xxxxxxxx',
          t: 1,
          a: e64(at),
          k: e64(key)
        }]
      }, function (err, response) {
        if (err) return returnError(err);
        var file = _this2.storage._importFile(response.f[0]);
        _this2.storage.emit('add', file);

        if (cb) {
          cb(null, file);
        }
      });

      function returnError(e) {
        if (cb) cb(e);
      }
    }

    // todo: handle sharing, it can create new shares

  }, {
    key: 'upload',
    value: function upload(opt, source, cb) {
      var _this3 = this;

      if (!this.directory) throw Error('node is not a directory');
      if (arguments.length === 2 && typeof source === 'function') {
        var _ref = [source, null];
        cb = _ref[0];
        source = _ref[1];
      }

      if (typeof opt === 'string') {
        opt = { name: opt };
      }

      if (!opt.attributes) opt.attributes = {};
      if (opt.name) opt.attributes.n = opt.name;

      if (!opt.attributes.n) {
        throw Error('File name is required.');
      }

      if (!opt.target) opt.target = this;

      var key = formatKey(opt.key);
      if (!key) key = secureRandom(24);
      if (!(key instanceof Buffer)) key = new Buffer(key);
      if (key.length !== 24) {
        throw Error('Wrong key length. Key must be 192bit');
      }
      opt.key = key;

      var finalKey = void 0;

      var hashes = [];
      var checkCallbacks = function checkCallbacks(err, type, hash, encrypter) {
        if (err) return returnError(err);
        hashes[type] = hash;
        if (type === 0) finalKey = encrypter.key;

        if (opt.thumbnailImage && !hashes[1]) return;
        if (opt.previewImage && !hashes[2]) return;
        if (!hashes[0]) return;

        var at = MutableFile.packAttributes(opt.attributes);
        getCipher(finalKey).encryptCBC(at);

        _this3.storage.aes.encryptECB(finalKey);

        var fileObject = {
          h: hashes[0].toString(),
          t: 0,
          a: e64(at),
          k: e64(finalKey)
        };

        if (hashes.length !== 1) {
          fileObject.fa = hashes.slice(1).map(function (hash, index) {
            return index + '*' + e64(hash);
          }).filter(function (e) {
            return e;
          }).join('/');
        }

        _this3.api.request({
          a: 'p',
          t: opt.target.nodeId ? opt.target.nodeId : opt.target,
          n: [fileObject]
        }, function (err, response) {
          if (err) return returnError(err);
          var file = _this3.storage._importFile(response.f[0]);
          _this3.storage.emit('add', file);
          stream.emit('complete', file);

          if (cb) cb(null, file);
        });
      };

      if (opt.thumbnailImage) {
        this._uploadAttribute(opt, opt.thumbnailImage, 1, checkCallbacks);
      }
      if (opt.previewImage) {
        this._uploadAttribute(opt, opt.previewImage, 2, checkCallbacks);
      }

      var stream = this._uploadAndReturnHash(opt, source, 0, checkCallbacks);

      var returnError = function returnError(e) {
        if (cb) {
          cb(e);
        } else {
          stream.emit('error', e);
        }
      };

      return stream;
    }
  }, {
    key: '_uploadAndReturnHash',
    value: function _uploadAndReturnHash(opt, source, type, cb) {
      var _this4 = this;

      var encrypter = megaEncrypt(opt.key);
      var pause = through().pause();
      var stream = pipeline(pause, encrypter);

      // Size is needed before upload. Kills the streaming otherwise.
      var size = opt.size;

      // handle buffer
      if (source && typeof source.pipe !== 'function') {
        size = source.length;
        stream.write(source);
        stream.end();
      }

      if (size) {
        this._uploadWithSize(stream, size, encrypter, pause, type, cb);
      } else {
        stream = pipeline(detectSize(function (size) {
          _this4._uploadWithSize(stream, size, encrypter, pause, type, cb);
        }), stream);
      }

      // handle stream
      if (source && typeof source.pipe === 'function') {
        source.pipe(stream);
      }

      return stream;
    }
  }, {
    key: '_uploadAttribute',
    value: function _uploadAttribute(opt, source, type, cb) {
      var _this5 = this;

      var gotBuffer = function gotBuffer(err, buffer) {
        if (err) return cb(err);

        var len = buffer.length;
        var rest = Math.ceil(len / 16) * 16 - len;

        if (rest !== 0) {
          buffer = Buffer.concat([buffer, Buffer.alloc(rest)]);
        }

        new AES(opt.key.slice(0, 16)).encryptCBC(buffer);

        var pause = through().pause();
        var stream = pipeline(pause);
        stream.write(buffer);
        stream.end();

        _this5._uploadWithSize(stream, buffer.length, stream, pause, type, cb);
      };

      // handle buffer
      if (source instanceof Buffer) {
        gotBuffer(null, source);
        return;
      }

      streamToCb(source, gotBuffer);
    }
  }, {
    key: '_uploadWithSize',
    value: function _uploadWithSize(stream, size, source, pause, type, cb) {
      var _this6 = this;

      var request$$1 = type === 0 ? { a: 'u', ssl: 0, s: size, ms: '-1', r: 0, e: 0 } : { a: 'ufa', ssl: 0, s: size };

      this.api.request(request$$1, function (err, resp) {
        if (err) return cb(err);

        var httpreq = _this6.api.requestModule({
          uri: resp.p + (type === 0 ? '' : '/' + (type - 1)),
          headers: { 'Content-Length': size },
          method: 'POST'
        });

        streamToCb(httpreq, function (err, hash) {
          cb(err, type, hash, source);
        });

        var sizeCheck = 0;
        source.on('data', function (d) {
          sizeCheck += d.length;
          stream.emit('progress', { bytesLoaded: sizeCheck, bytesTotal: size });
        });

        source.on('end', function () {
          if (size && sizeCheck !== size) {
            return stream.emit('error', Error('Specified data size does not match: ' + size + ' !== ' + sizeCheck));
          }
        });

        source.pipe(httpreq);
        pause.resume();
      });
    }

    // todo: handle sharing, it can remove shares

  }, {
    key: 'delete',
    value: function _delete(permanent, cb) {
      if (typeof permanent === 'function') {
        cb = permanent;
        permanent = false;
      }

      if (permanent) {
        this.api.request({ a: 'd', n: this.nodeId }, cb);
      } else {
        this.moveTo(this.storage.trash, cb);
      }

      return this;
    }

    // todo: handle sharing, it can create or remove shares

  }, {
    key: 'moveTo',
    value: function moveTo(target, cb) {
      if (target instanceof File) {
        target = target.nodeId;
      } else if (typeof target !== 'string') {
        throw Error('target must be a folder or a nodeId');
      }

      this.api.request({ a: 'm', n: this.nodeId, t: target }, cb);

      // todo: reload storage

      return this;
    }
  }, {
    key: 'setAttributes',
    value: function setAttributes(attributes, cb) {
      var _this7 = this;

      Object.assign(this.attributes, attributes);

      var newAttributes = MutableFile.packAttributes(this.attributes);
      getCipher(this.key).encryptCBC(newAttributes);

      this.api.request({ a: 'a', n: this.nodeId, at: e64(newAttributes) }, function () {
        _this7.parseAttributes(_this7.attributes);
        if (cb) cb();
      });

      return this;
    }
  }, {
    key: 'rename',
    value: function rename(filename, cb) {
      this.setAttributes({
        n: filename
      }, cb);

      return this;
    }
  }, {
    key: 'setLabel',
    value: function setLabel(label, cb) {
      if (typeof label === 'string') label = File.LABEL_NAMES.indexOf(label);
      if (typeof label !== 'number' || Math.floor(label) !== label || label < 0 || label > 7) {
        throw Error('label must be a integer between 0 and 7 or a valid label name');
      }

      this.setAttributes({
        lbl: label
      }, cb);

      return this;
    }
  }, {
    key: 'setFavorite',
    value: function setFavorite(isFavorite, cb) {
      this.setAttributes({
        fav: isFavorite ? 1 : 0
      }, cb);

      return this;
    }
  }, {
    key: 'link',
    value: function link(options, cb) {
      var _this8 = this;

      if (arguments.length === 1 && typeof options === 'function') {
        cb = options;
        options = {
          noKey: false
        };
      }

      if (typeof options === 'boolean') {
        options = {
          noKey: options
        };
      }

      var folderKey = options.__folderKey;
      if (this.directory && !folderKey) {
        this.shareFolder(options, cb);
        return this;
      }

      this.api.request({ a: 'l', n: this.nodeId }, function (err, id) {
        if (err) return cb(err);

        var url$$1 = 'https://mega.nz/#' + (folderKey ? 'F' : '') + '!' + id;
        if (!options.noKey && _this8.key) url$$1 += '!' + e64(folderKey || _this8.key);

        cb(null, url$$1);
      });

      return this;
    }
  }, {
    key: 'shareFolder',
    value: function shareFolder(options, cb) {
      var _this9 = this;

      if (!this.directory) throw Error("node isn't a folder");

      var handler = this.nodeId;
      var storedShareKey = this.storage.shareKeys[handler];
      if (storedShareKey) {
        this.link(Object.assign({
          __folderKey: storedShareKey
        }, options), cb);

        return this;
      }

      var shareKey = formatKey(options.key);

      if (!shareKey) {
        shareKey = secureRandom(16);
      }

      if (!(shareKey instanceof Buffer)) {
        shareKey = new Buffer(shareKey);
      }

      if (shareKey.length !== 16) {
        process.nextTick(function () {
          cb(Error('share key must be 16 byte / 22 characters'));
        });
        return;
      }

      this.storage.shareKeys[handler] = shareKey;

      var authKey = new Buffer(handler + handler);
      this.storage.aes.encryptECB(authKey);

      var request$$1 = {
        a: 's2',
        n: handler,
        s: [{ u: 'EXP', r: 0 }],
        ok: e64(this.storage.aes.encryptECB(new Buffer(shareKey))),
        ha: e64(authKey),
        cr: makeCryptoRequest(this.storage, this)
      };

      this.api.request(request$$1, function () {
        _this9.link(Object.assign({
          __folderKey: shareKey
        }, options), cb);
      });

      return this;
    }
  }, {
    key: 'unshareFolder',
    value: function unshareFolder(options, cb) {
      var request$$1 = {
        a: 's2',
        n: this.nodeId,
        s: [{ u: 'EXP', r: '' }]
      };

      delete this.storage.shareKeys[this.nodeId];

      this.api.request(request$$1, function () {
        if (cb) cb();
      });

      return this;
    }
  }]);
  return MutableFile;
}(File);

MutableFile.packAttributes = function (attributes) {
  var at = JSON.stringify(attributes);
  at = new Buffer('MEGA' + at);
  var ret = Buffer.alloc(Math.ceil(at.length / 16) * 16);
  at.copy(ret);
  return ret;
};

// source: https://github.com/meganz/webclient/blob/918222d5e4521c8777b1c8da528f79e0110c1798/js/crypto.js#L3728
// generate crypto request response for the given nodes/shares matrix
function makeCryptoRequest(storage, sources) {
  var shareKeys = storage.shareKeys;

  if (!Array.isArray(sources)) {
    sources = selfAndChildren(sources);
  }

  var shares = sources.map(function (source) {
    return getShares(shareKeys, source);
  }).reduce(function (arr, el) {
    return arr.concat(el);
  }).filter(function (el, index, arr) {
    return index === arr.indexOf(el);
  });

  var cryptoRequest = [shares, sources.map(function (node) {
    return node.nodeId;
  }), []];

  // TODO: optimize - keep track of pre-existing/sent keys, only send new ones
  for (var i = shares.length; i--;) {
    var aes = new AES(shareKeys[shares[i]]);

    for (var j = sources.length; j--;) {
      var fileKey = sources[j].key;

      if (fileKey && (fileKey.length === 32 || fileKey.length === 16)) {
        cryptoRequest[2].push(i, j, e64(aes.encryptECB(fileKey)));
      }
    }
  }

  return cryptoRequest;
}

function selfAndChildren(node) {
  return [node].concat((node.children || []).map(selfAndChildren).reduce(function (arr, el) {
    return arr.concat(el);
  }, []));
}

function getShares(shareKeys, node) {
  var handle = node.nodeId;
  var parent = node.parent;
  var shares = [];

  if (shareKeys[handle]) {
    shares.push(handle);
  }

  return parent ? shares.concat(getShares(shareKeys, parent)) : shares;
}

var Storage = function (_EventEmitter) {
  inherits(Storage, _EventEmitter);

  function Storage(options, cb) {
    classCallCheck(this, Storage);

    var _this = possibleConstructorReturn(this, (Storage.__proto__ || Object.getPrototypeOf(Storage)).call(this));

    if (arguments.length === 1 && typeof options === 'function') {
      cb = options;
      options = {};
    }

    if (!cb) {
      cb = function cb(err) {
        // Would be nicer to emit error event?
        if (err) throw err;
      };
    }

    // Defaults
    options.keepalive = options.keepalive === undefined ? true : !!options.keepalive;
    options.autoload = options.autoload === undefined ? true : !!options.autoload;
    options.autologin = options.autologin === undefined ? true : !!options.autologin;

    _this.api = new API(options.keepalive);
    _this.files = {};
    _this.options = options;

    if (!options.email) {
      throw Error("starting a session without credentials isn't supported");
    }

    if (options.autologin) {
      _this.login(cb);
    } else {
      cb(null, _this);
    }

    _this.status = 'closed';
    return _this;
  }

  createClass(Storage, [{
    key: 'login',
    value: function login(cb) {
      var _this2 = this;

      var ready = function ready() {
        _this2.status = 'ready';
        cb(null, _this2);
        _this2.emit('ready', _this2);
      };

      var loadUser = function loadUser(cb) {
        _this2.api.request({ a: 'ug' }, function (err, response) {
          if (err) return cb(err);
          _this2.name = response.name;
          _this2.user = response.u;

          if (_this2.options.autoload) {
            _this2.reload(true, function (err) {
              if (err) return cb(err);
              ready();
            });
          } else {
            ready();
          }
        });
      };

      this.email = this.options.email;
      var pw = prepareKey(new Buffer(this.options.password));

      // after generating the AES key the password isn't needed anymore
      delete this.options.password;

      var aes = new AES(pw);
      var uh = e64(aes.stringhash(new Buffer(this.email)));

      this.api.request({ a: 'us', user: this.email, uh: uh }, function (err, response) {
        if (err) return cb(err);
        _this2.key = formatKey(response.k);
        aes.decryptECB(_this2.key);
        _this2.aes = new AES(_this2.key);

        var t = formatKey(response.csid);
        var privk = _this2.aes.decryptECB(formatKey(response.privk));
        var rsaPrivk = cryptoDecodePrivKey(privk);
        if (!rsaPrivk) throw Error('invalid credentials');

        var sid = e64(cryptoRsaDecrypt(t, rsaPrivk).slice(0, 43));

        _this2.api.sid = _this2.sid = sid;
        _this2.RSAPrivateKey = rsaPrivk;

        loadUser(cb);
      });

      this.status = 'connecting';
    }
  }, {
    key: 'reload',
    value: function reload(force, cb) {
      var _this3 = this;

      if (typeof force === 'function') {
        
        var _ref = [cb, force];
        force = _ref[0];
        cb = _ref[1];
      }if (this.status === 'connecting' && !force) {
        return this.once('ready', this.reload.bind(this, force, cb));
      }
      this.mounts = [];
      this.api.request({ a: 'f', c: 1 }, function (err, response) {
        if (err) return cb(err);

        _this3.shareKeys = response.ok.reduce(function (shares, share) {
          var handler = share.h;

          // MEGA handles share authenticity by checking the value below
          var auth = _this3.aes.encryptECB(new Buffer(handler + handler));

          // original implementation doesn't compare in constant time, but...
          if (constantTimeCompare(formatKey(share.ha), auth)) {
            shares[handler] = _this3.aes.decryptECB(formatKey(share.k));
          }

          // If verification fails the share was tampered... by MEGA servers.
          // Well, never trust the server, the code says...

          return shares;
        }, {});

        response.f.forEach(function (file) {
          return _this3._importFile(file);
        });
        cb(null, _this3.mounts);
      });

      this.api.on('sc', function (arr) {
        var deleted = {};
        arr.forEach(function (o) {
          if (o.a === 'u') {
            var file = _this3.files[o.n];
            if (file) {
              file.timestamp = o.ts;
              file.decryptAttributes(o.at, function () {});
              file.emit('update');
              _this3.emit('update', file);
            }
          } else if (o.a === 'd') {
            deleted[o.n] = true; // Don't know yet if move or delete.
          } else if (o.a === 't') {
            o.t.f.forEach(function (f) {
              var file = _this3.files[f.h];
              if (file) {
                delete deleted[f.h];
                var oldparent = file.parent;
                if (oldparent.nodeId === f.p) return;
                // todo: move to setParent() to avoid duplicate.
                oldparent.children.splice(oldparent.children.indexOf(file), 1);
                file.parent = _this3.files[f.p];
                if (!file.parent.children) file.parent.children = [];
                file.parent.children.push(file);
                file.emit('move', oldparent);
                _this3.emit('move', file, oldparent);
              } else {
                _this3.emit('add', _this3._importFile(f));
              }
            });
          }
        });

        Object.keys(deleted).forEach(function (n) {
          var file = _this3.files[n];
          var parent = file.parent;
          parent.children.splice(parent.children.indexOf(file), 1);
          _this3.emit('delete', file);
          file.emit('delete');
        });
      });
    }
  }, {
    key: '_importFile',
    value: function _importFile(f) {
      // todo: no support for updates
      if (!this.files[f.h]) {
        var fo = this.files[f.h] = new MutableFile(f, this);
        if (f.t === Storage.NODE_TYPE_DRIVE) {
          this.root = fo;
          fo.name = 'Cloud Drive';
        }
        if (f.t === Storage.NODE_TYPE_RUBBISH_BIN) {
          this.trash = fo;
          fo.name = 'Rubbish Bin';
        }
        if (f.t === Storage.NODE_TYPE_INBOX) {
          this.inbox = fo;
          fo.name = 'Inbox';
        }
        if (f.t > 1) {
          this.mounts.push(fo);
        }
        if (f.p) {
          var parent = this.files[f.p];
          if (!parent.children) parent.children = [];
          parent.children.push(fo);
          fo.parent = parent;
        }
      }
      return this.files[f.h];
    }

    // alternative to this.root.mkdir

  }, {
    key: 'mkdir',
    value: function mkdir(opt, cb) {
      var _this4 = this;

      // Wait for ready event.
      if (this.status !== 'ready') {
        this.on('ready', function () {
          return _this4.root.mkdir(opt, cb);
        });
        return;
      }
      return this.root.mkdir(opt, cb);
    }

    // alternative to this.root.upload

  }, {
    key: 'upload',
    value: function upload(opt, buffer, cb) {
      var _this5 = this;

      // Wait for ready event.
      if (this.status !== 'ready') {
        this.on('ready', function () {
          return _this5.root.upload(opt, buffer, cb);
        });
        return;
      }
      return this.root.upload(opt, buffer, cb);
    }
  }, {
    key: 'close',
    value: function close() {
      // does not handle, if still connecting or incomplete streams.
      this.status = 'closed';
      this.api.close();
    }
  }]);
  return Storage;
}(events.EventEmitter);

Storage.NODE_TYPE_FILE = 0;
Storage.NODE_TYPE_DIR = 1;
Storage.NODE_TYPE_DRIVE = 2;
Storage.NODE_TYPE_INBOX = 3;
Storage.NODE_TYPE_RUBBISH_BIN = 4;

// just for backyards compatibility: is better requiring
// File and Storage directly as built sizes will be smaller

function mega(options, cb) {
  return new Storage(options, cb);
}

mega.Storage = Storage;
mega.File = File;
mega.file = File.fromURL;
mega.encrypt = megaEncrypt;
mega.decrypt = megaDecrypt;

module.exports = mega;
