/**
 * Only localhost:{3000,3010,4000,4010,4361,9080} are allowed to use the provided Infura ID
 */
const PORT = 4361;

import { config } from 'dotenv';
import { providers } from 'ethers';
import Express from 'express';
import Session from 'express-session';
import fs from 'fs';
import Helmet from 'helmet';
import Morgan from 'morgan';
import Path from 'path';
import FileStore from 'session-file-store';
import { ErrorTypes, SiweMessage } from 'siwe';
const FileStoreStore = FileStore(Session);

config();
const PROD = process.env.ENVIRONMENT === 'production';
const STAGING = process.env.ENVIRONMENT === 'staging';

declare module 'express-session' {
    interface SessionData {
        siwe: SiweMessage;
        nonce: string;
        ens: string;
    }
}

const app = Express();

/**
 * CSP Policies
 */
app.use(
    Helmet({
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
                ],
            },
        },
    }),
);
app.use(Express.json());
app.use(Express.urlencoded({ extended: true }));
app.use(Morgan('combined'));

app.use(
    Session({
        name: process.env.SESSION_COOKIE_NAME,
        secret: process.env.SECRET,
        resave: true,
        saveUninitialized: true,
        store: new FileStoreStore({
            path: Path.resolve(__dirname, '../db'),
        }),
        cookie: {
            httpOnly: true,
            secure: PROD || STAGING,
        },
    }),
);
app.use(Express.static(Path.resolve(__dirname, '../public')));

app.get('/api/nonce', async (req, res) => {
    req.session.nonce = (Math.random() + 1).toString(36).substring(4);
    res.status(200).send(req.session.nonce).end();
});

app.get('/api/me', async (req, res) => {
    if (!req.session.siwe) {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }
    res.status(200)
        .json({
            text: getText(req.session.siwe.address),
            address: req.session.siwe.address,
            ens: req.session.ens,
        })
        .end();
});

app.post('/api/sign_in', async (req, res) => {
    try {
        const { ens } = req.body;
        if (!req.body.message) {
            res.status(422).json({ message: 'Expected signMessage object as body.' });
            return;
        }

        const message = new SiweMessage(req.body.message);

        const infuraProvider = new providers.JsonRpcProvider(
            {
                allowGzip: true,
                url: `${getInfuraUrl(message.chainId)}/8fcacee838e04f31b6ec145eb98879c8`,
                headers: {
                    Accept: '*/*',
                    Origin: `http://localhost:${PORT}`,
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Content-Type': 'application/json',
                },
            },
            Number.parseInt(message.chainId),
        );

        await infuraProvider.ready;

        const fields: SiweMessage = await message.validate(infuraProvider);

        if (fields.nonce !== req.session.nonce) {
            res.status(422).json({
                message: `Invalid nonce.`,
            });
            return;
        }

        req.session.siwe = fields;
        req.session.ens = ens;
        req.session.nonce = null;
        req.session.cookie.expires = new Date(fields.expirationTime);
        res.status(200)
            .json({
                text: getText(req.session.siwe.address),
                address: req.session.siwe.address,
                ens: req.session.ens,
            })
            .end();
    } catch (e) {
        req.session.siwe = null;
        req.session.nonce = null;
        req.session.ens = null;
        console.error(e);
        switch (e) {
            case ErrorTypes.EXPIRED_MESSAGE: {
                res.status(440).json({ message: e.message });
                break;
            }
            case ErrorTypes.INVALID_SIGNATURE: {
                res.status(422).json({ message: e.message });
                break;
            }
            default: {
                res.status(500).json({ message: e.message });
                break;
            }
        }
    }
});

app.post('/api/sign_out', async (req, res) => {
    if (!req.session.siwe) {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }

    req.session.destroy(() => {
        res.status(205).send();
    });
});

app.put('/api/save', async (req, res) => {
    if (!req.session.siwe) {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }
    updateText(req.body.text, req.session.siwe.address);
    res.status(204).send().end();
});

app.listen(PORT, () => {
    console.log(`Listening at port ${PORT}, visit http://localhost:${PORT}/`);
}).on('error', console.error);

const updateText = (text: string, address: string) =>
    fs.writeFileSync(Path.resolve(__dirname, `../db/${address}`), text, { flag: 'wx' });

const getText = (address: string) => {
    try {
        return fs.readFileSync(Path.resolve(__dirname, `../db/${address}`), 'utf-8');
    } catch (e) {
        return '';
    }
};

const getInfuraUrl = (chainId: string) => {
    switch (Number.parseInt(chainId)) {
        case 1:
            return 'https://mainnet.infura.io/v3';
        case 3:
            return 'https://ropsten.infura.io/v3';
        case 4:
            return 'https://rinkeby.infura.io/v3';
        case 5:
            return 'https://goerli.infura.io/v3';
        case 137:
            return 'https://polygon-mainnet.infura.io/v3';
    }
};
