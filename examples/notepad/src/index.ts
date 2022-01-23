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
import { Issuer, generators, BaseClient, TokenSet } from 'openid-client';
import { ErrorTypes, SiweMessage, generateNonce } from 'siwe';
const FileStoreStore = FileStore(Session);

let oidc_client: BaseClient = null;

const get_oidc_client = async () => {
    if (oidc_client === null) {
        const issuer = await Issuer.discover('https://oidc.login.xyz');
        // @ts-ignore
        oidc_client = await issuer.Client.register({
            redirect_uris: [`http://localhost:${PORT}/oidc/cb`],
            response_types: ['code'],
            // id_token_signed_response_alg (default "RS256")
            // token_endpoint_auth_method (default "client_secret_basic")
        });
    }
    return oidc_client;
}
let state = "";
let nonce = "";
let access_token = "";
let address = "";
const code_verifier = generators.codeVerifier();


config();
const PROD = process.env.ENVIRONMENT === 'production';
const STAGING = process.env.ENVIRONMENT === 'staging';

if (!process.env.SESSION_COOKIE_NAME || !process.env.SECRET) {
    setTimeout(
        () =>
            console.log(
                '\n\n\n\nProject running with default values!\n\n\n\n',
                'To get rid of this message please define SESSION_COOKIE_NAME and SECRET in a .env file.\n\n',
            ),
        5000,
    );
}

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
        contentSecurityPolicy: false,
    }),
);
app.use(Express.json({ limit: 43610 }));
app.use(Express.urlencoded({ extended: true }));
app.use(Morgan('combined'));

app.use(
    Session({
        name: process.env.SESSION_COOKIE_NAME ?? 'siwe-notepad-session',
        secret: process.env.SECRET ?? 'siwe',
        resave: true,
        saveUninitialized: true,
        store: new FileStoreStore({
            path: Path.resolve(__dirname, '../db/sessions'),
        }),
        cookie: {
            httpOnly: true,
            secure: PROD || STAGING,
        },
    }),
);
app.use(Express.static(Path.resolve(__dirname, '../public')));

app.get('/api/nonce', async (req, res) => {
    req.session.nonce = generateNonce();
    req.session.save(() => res.status(200).send(req.session.nonce).end());
});

app.get('/api/me', async (req, res) => {
    if (!req.session.siwe && access_token == "") {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }
    let address_;
    if (req.session.siwe) {
        address_ = req.session.siwe.address;
    } else {
        address_ = address;
    }
    res.status(200)
        .json({
            text: getText(address_),
            address: address_,
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
        req.session.save(() =>
            res
                .status(200)
                .json({
                    text: getText(req.session.siwe.address),
                    address: req.session.siwe.address,
                    ens: req.session.ens,
                })
                .end(),
        );
    } catch (e) {
        req.session.siwe = null;
        req.session.nonce = null;
        req.session.ens = null;
        console.error(e);
        switch (e) {
            case ErrorTypes.EXPIRED_MESSAGE: {
                req.session.save(() => res.status(440).json({ message: e.message }));
                break;
            }
            case ErrorTypes.INVALID_SIGNATURE: {
                req.session.save(() => res.status(422).json({ message: e.message }));
                break;
            }
            default: {
                req.session.save(() => res.status(500).json({ message: e.message }));
                break;
            }
        }
    }
});

app.get('/oidc/sign_in', async (req, res) => {
    const client = await get_oidc_client();
    state = generators.state();
    nonce = generators.nonce();
    const code_challenge = generators.codeChallenge(code_verifier);
    const url = client.authorizationUrl({
        scope: 'openid',
        // resource: 'https://my.api.example.com/resource/32178',
        code_challenge,
        code_challenge_method: 'S256',
        state,
        nonce,
    });
    res.redirect(url);
});

app.get('/oidc/cb', async (req, res) => {
    const client = await get_oidc_client();
    const params = client.callbackParams(req);
    await client.callback(`http://localhost:${PORT}/oidc/cb`, params, { state, nonce, code_verifier })
        .then(function(tokenSet: TokenSet) {
            const claims = tokenSet.claims();
            console.log('received and validated tokens %j', tokenSet);
            console.log('validated ID Token claims %j', claims);
            console.log('access token %j', tokenSet.access_token);
            access_token = tokenSet.access_token;
            address = claims.sub;
        });
    res.redirect(`/?access_token=${access_token}`);
    // client.userinfo(access_token)
    //     .then(function(userinfo) {
    //         console.log('userinfo %j', userinfo);
    //     });
});

app.post('/api/sign_out', async (req, res) => {
    if (!req.session.siwe && access_token === "") {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }
    access_token = "";
    address = "";

    req.session.destroy(() => {
        res.status(205).send();
    });
});

app.put('/api/save', async (req, res) => {
    if (!req.session.siwe && access_token == "") {
        res.status(401).json({ message: 'You have to first sign_in' });
        return;
    }

    await fs.readdir(Path.resolve(__dirname, `../db`), (err, files) => {
        if (files.length === 1000001) {
            res.status(500).json({ message: 'File limit reached!' });
            return;
        }
    });

    let address_;
    if (req.session.siwe) {
        address_ = req.session.siwe.address;
    } else {
        address_ = address;
    }
    updateText(req.body.text, address_);
    res.status(204).send().end();
});

app.listen(PORT, () => {
    setTimeout(
        () => console.log(`Listening at port ${PORT}, visit http://localhost:${PORT}/`),
        5000,
    );
}).on('error', console.error);

const updateText = (text: string, address: string) =>
    fs.writeFileSync(Path.resolve(__dirname, `../db/${address}.txt`), text, { flag: 'w' });

const getText = (address: string) => {
    try {
        return fs.readFileSync(Path.resolve(__dirname, `../db/${address}.txt`), 'utf-8');
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
