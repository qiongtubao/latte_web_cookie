let decode = decodeURIComponent;
let encode = encodeURIComponent;
let pairSplitRegExp = /; */;
let fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;
/**
 * 
 *  server => client
 *    Set-Cookie : {{name}}={{val}}; Path=/; 
 * 
 * client => server
 *      Cookie: {{name}}={{value}};
 */

class Cookie {
    cookies: any;
    sets: any;
    constructor(cookies) {
        this.cookies = cookies;
        this.sets = {};
    };
    set(key, value, option) {
        if(value == undefined) {
            return delete this.sets[key];
        }
        this.sets[key] = {
            value: value,
            option: option
        };
    };
    get(key) {
        return this.cookies[key];
    }
}

class CookieUtil {
    options: any;
    constructor(options) {
        this.options = options || {};
    };
    parse(str) {
        let obj = {};
        let pairs = str.split(pairSplitRegExp);
        let dec = this.options.decode || decode;
        for(let i = 0; i < pairs.length; i++) {
            let pair = pairs[i];
            let eq_idx = pair.indexOf('=');
            if (eq_idx < 0) {
                continue;
            }
            let key = pair.substr(0, eq_idx).trim()
            let val = pair.substr(++eq_idx, pair.length).trim();
            if ('"' == val[0]) {
                val = val.slice(1, -1);
            }
        
            // only assign once
            if (undefined == obj[key]) {
                try {
                    obj[key] = dec(val, dec);
                }catch(err) {
                    obj[key] = val;
                }
            }
        }
        return obj  
    };
    stringify(name:string, val:string, options:any) {
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
            if (isNaN(maxAge)) throw new Error('maxAge should be a Number');
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
    before() {
        var self = this;
        return function(ctx, next) {
            console.log('aaaa');
            if(ctx.cookie) {
                return next();
            }
            let cookies = self.parse(ctx.req.headers.cookie);
            ctx.cookie = new Cookie(cookies);
            next();
        }
    };
    after(ctx, next) {
        let self = this;
        return (ctx, next) => {
            if(ctx.cookie) {
                Object.keys(ctx.cookie.sets).forEach((c) => {
                   let v = ctx.cookie.sets[c];
                   ctx.res.setHeader('Set-Cookie', self.stringify(c, v.value, v.option)); 
                });
            }
            next();
        }
        
    }
}
export function create(options) {
    return new CookieUtil(options);
}