"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
exports.__esModule = true;
/**
 * Only localhost:{3000,3010,4000,4010,4361,9080} are allowed to use the provided Infura ID
 */
var PORT = 4361;
var dotenv_1 = require("dotenv");
var ethers_1 = require("ethers");
var express_1 = require("express");
var express_session_1 = require("express-session");
var helmet_1 = require("helmet");
var morgan_1 = require("morgan");
var path_1 = require("path");
var session_file_store_1 = require("session-file-store");
var siwe_1 = require("siwe");
var FileStoreStore = (0, session_file_store_1["default"])(express_session_1["default"]);
(0, dotenv_1.config)();
var PROD = process.env.ENVIRONMENT === 'production';
var STAGING = process.env.ENVIRONMENT === 'staging';
var app = (0, express_1["default"])();
/**
 * CSP Policies
 */
app.use((0, helmet_1["default"])({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", 'cdn-cors.ethers.io', 'cdnjs.cloudflare.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'unpkg.com'],
            fontSrc: ["'self'", 'unpkg.com'],
            imgSrc: ["'self'", 'data:'],
            connectSrc: [
                "'self'",
                'wss://*.walletconnect.org',
                'https://*.walletconnect.org',
                'https://*.infura.io',
            ]
        }
    }
}));
app.use(express_1["default"].json());
app.use(express_1["default"].urlencoded({ extended: true }));
app.use((0, morgan_1["default"])('combined'));
app.use((0, express_session_1["default"])({
    name: process.env.SESSION_COOKIE_NAME,
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    store: new FileStoreStore({
        path: path_1["default"].resolve(__dirname, '../db')
    }),
    cookie: {
        httpOnly: true,
        secure: PROD || STAGING
    }
}));
app.use(express_1["default"].static(path_1["default"].resolve(__dirname, '../public')));
app.get('/api/nonce', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        req.session.nonce = (Math.random() + 1).toString(36).substring(4);
        res.status(200).send(req.session.nonce).end();
        return [2 /*return*/];
    });
}); });
app.get('/api/me', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (!req.session.siwe) {
            res.status(401).json({ message: 'You have to first sign_in' });
            return [2 /*return*/];
        }
        res.status(200)
            .json({
            text: req.session.text,
            address: req.session.siwe.address,
            ens: req.session.ens
        })
            .end();
        return [2 /*return*/];
    });
}); });
app.post('/api/sign_in', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var ens, message, fields, e_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                ens = req.body.ens;
                if (!req.body.message) {
                    res.status(422).json({ message: 'Expected signMessage object as body.' });
                    return [2 /*return*/];
                }
                message = new siwe_1.SiweMessage(req.body.message);
                return [4 /*yield*/, message.validate(ethers_1.providers.getDefaultProvider())];
            case 1:
                fields = _a.sent();
                if (fields.nonce !== req.session.nonce) {
                    res.status(422).json({
                        message: "Invalid nonce."
                    });
                    return [2 /*return*/];
                }
                req.session.siwe = fields;
                req.session.ens = ens;
                req.session.nonce = null;
                req.session.cookie.expires = new Date(fields.expirationTime);
                res.status(200)
                    .json({
                    text: req.session.text,
                    address: req.session.siwe.address,
                    ens: req.session.ens
                })
                    .end();
                return [3 /*break*/, 3];
            case 2:
                e_1 = _a.sent();
                req.session.siwe = null;
                req.session.nonce = null;
                req.session.ens = null;
                console.error(e_1);
                switch (e_1) {
                    case siwe_1.ErrorTypes.EXPIRED_MESSAGE: {
                        res.status(440).json({ message: e_1.message });
                        break;
                    }
                    case siwe_1.ErrorTypes.INVALID_SIGNATURE: {
                        res.status(422).json({ message: e_1.message });
                        break;
                    }
                    default: {
                        res.status(500).json({ message: e_1.message });
                        break;
                    }
                }
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.post('/api/sign_out', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (!req.session.siwe) {
            res.status(401).json({ message: 'You have to first sign_in' });
            return [2 /*return*/];
        }
        res.status(205).send();
        return [2 /*return*/];
    });
}); });
app.put('/api/save', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        if (!req.session.siwe) {
            res.status(401).json({ message: 'You have to first sign_in' });
            return [2 /*return*/];
        }
        req.session.text = req.body.text;
        res.status(204).send().end();
        return [2 /*return*/];
    });
}); });
app.listen(PORT, function () {
    console.log("Listening at port " + PORT + ", visit http://localhost:" + PORT + "/");
}).on('error', console.error);
