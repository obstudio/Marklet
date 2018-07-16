var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function (o) {
    var m = typeof Symbol === "function" && o[Symbol.iterator], i = 0;
    if (m) return m.call(o);
    return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
};
/** Marklet Main Lexer */
var Lexer = /** @class */ (function () {
    /** Lexer Constructor */
    function Lexer(rules, macros, options) {
        if (macros === void 0) { macros = {}; }
        if (options === void 0) { options = {}; }
        function resolve(rule) {
            if (rule.regex) {
                var src = rule.regex.source;
                for (var key in macros) {
                    src = src.replace(new RegExp("{{" + key + "}}", 'g'), "(?:" + macros[key] + ")");
                }
                rule.regex = new RegExp(src);
            }
            if (rule.push instanceof Array)
                rule.push.forEach(resolve);
            return rule;
        }
        this.rules = {};
        for (var key in rules) {
            this.rules[key] = rules[key].map(resolve);
        }
        this.options = options;
    }
    Lexer.prototype.getContext = function (context) {
        function walk(context) {
            var result, _i, result_1, rule;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        result = typeof context === 'string'
                            ? this.rules[context]
                            : context;
                        _i = 0, result_1 = result;
                        _a.label = 1;
                    case 1:
                        if (!(_i < result_1.length)) return [3 /*break*/, 6];
                        rule = result_1[_i];
                        if (!rule.include) return [3 /*break*/, 3];
                        return [5 /*yield**/, __values(walk(rule.include))];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, rule];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        }
        return Array.from(walk(context));
    };
    Lexer.prototype.getToken = function (token, capture, content) {
        var result;
        if (typeof token === 'string') {
            result = token;
        }
        else if (token instanceof Function) {
            result = token.call(this, capture, content);
        }
        if (result instanceof Array) {
            result = { content: result };
        }
        else if (typeof result === 'string') {
            result = { text: result };
        }
        return result;
    };
    Lexer.prototype.parse = function (source, context) {
        var index = 0;
        var result = [];
        var rules = this.getContext(context);
        while (source) {
            /**
             * Matching status:
             * 0. No match was found
             * 1. Found match and continue
             * 2. Found match and pop
             */
            var status_1 = 0;
            for (var _i = 0, rules_1 = rules; _i < rules_1.length; _i++) {
                var rule = rules_1[_i];
                var capture = new RegExp(rule.regex).exec(source);
                if (capture) {
                    source = source.slice(capture[0].length);
                    status_1 = rule.pop ? 2 : 1;
                    index += capture[0].length;
                    var content = [];
                    if (rule.push) {
                        var subtoken = this.parse(source, rule.push);
                        source = source.slice(subtoken.index);
                        index += subtoken.index;
                        content = subtoken.content;
                    }
                    var data = this.getToken(rule.token, capture, content);
                    if (data) {
                        data.type = data.type || rule.type;
                        result.push(data);
                    }
                    break;
                }
            }
            if (!status_1 && source) {
                throw new Error('Infinite loop encountered.');
            }
            if (status_1 === 2)
                break;
        }
        return {
            index: index,
            content: result
        };
    };
    return Lexer;
}());
module.exports = Lexer;
