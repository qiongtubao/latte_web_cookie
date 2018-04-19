"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var decode = decodeURIComponent;
var encode = encodeURIComponent;
var pairSplitRegExp = /; */;
var fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
var Cookie = (function () {
    function Cookie(cookies) {
        this.cookies = cookies;
        this.sets = {};
    }
    ;
    Cookie.prototype.set = function (key, value, option) {
        if (value == undefined) {
            return delete this.sets[key];
        }
        this.sets[key] = {
            value: value,
            option: option
        };
    };
    ;
    Cookie.prototype.get = function (key) {
        return this.cookies[key];
    };
    return Cookie;
}());
var CookieUtil = (function () {
    function CookieUtil(options) {
        this.options = options || {};
    }
    ;
    CookieUtil.prototype.parse = function (str) {
        var obj = {};
        var pairs = str.split(pairSplitRegExp);
        var dec = this.options.decode || decode;
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i];
            var eq_idx = pair.indexOf('=');
            if (eq_idx < 0) {
                continue;
            }
            var key = pair.substr(0, eq_idx).trim();
            var val = pair.substr(++eq_idx, pair.length).trim();
            if ('"' == val[0]) {
                val = val.slice(1, -1);
            }
            if (undefined == obj[key]) {
                try {
                    obj[key] = dec(val, dec);
                }
                catch (err) {
                    obj[key] = val;
                }
            }
        }
        return obj;
    };
    ;
    CookieUtil.prototype.stringify = function (name, val, options) {
        var opt = options || {};
        var enc = opt.encode || encode;
        if (typeof enc !== 'function') {
            throw new TypeError('option encode is invalid');
        }
        if (!fieldContentRegExp.test(name)) {
            throw new TypeError('argument name is invalid');
        }
        var value = enc(val);
        if (value && !fieldContentRegExp.test(value)) {
            throw new TypeError('argument val is invalid');
        }
        var str = name + '=' + value;
        if (null != opt.maxAge) {
            var maxAge = opt.maxAge - 0;
            if (isNaN(maxAge))
                throw new Error('maxAge should be a Number');
            str += '; Max-Age=' + Math.floor(maxAge);
        }
        if (opt.domain) {
            if (!fieldContentRegExp.test(opt.domain)) {
                throw new TypeError('option domain is invalid');
            }
            str += '; Domain=' + opt.domain;
        }
        if (opt.path) {
            if (!fieldContentRegExp.test(opt.path)) {
                throw new TypeError('option path is invalid');
            }
            str += '; Path=' + opt.path;
        }
        if (opt.expires) {
            if (typeof opt.expires.toUTCString !== 'function') {
                throw new TypeError('option expires is invalid');
            }
            str += '; Expires=' + opt.expires.toUTCString();
        }
        if (opt.httpOnly) {
            str += '; HttpOnly';
        }
        if (opt.secure) {
            str += '; Secure';
        }
        if (opt.sameSite) {
            var sameSite = typeof opt.sameSite === 'string'
                ? opt.sameSite.toLowerCase() : opt.sameSite;
            switch (sameSite) {
                case true:
                    str += '; SameSite=Strict';
                    break;
                case 'lax':
                    str += '; SameSite=Lax';
                    break;
                case 'strict':
                    str += '; SameSite=Strict';
                    break;
                default:
                    throw new TypeError('option sameSite is invalid');
            }
        }
        return str;
    };
    ;
    CookieUtil.prototype.before = function () {
        var self = this;
        return function (ctx, next) {
            if (ctx.cookie) {
                return next();
            }
            var cookies = self.parse(ctx.req.headers.cookie);
            ctx.cookie = new Cookie(cookies);
            next();
        };
    };
    ;
    CookieUtil.prototype.after = function (ctx, next) {
        var self = this;
        return function (ctx, next) {
            if (ctx.cookie) {
                Object.keys(ctx.cookie.sets).forEach(function (c) {
                    var v = ctx.cookie.sets[c];
                    ctx.res.setHeader('Set-Cookie', self.stringify(c, v.value, v.option));
                });
            }
            next();
        };
    };
    return CookieUtil;
}());
function create(options) {
    return new CookieUtil(options);
}
exports.create = create;
