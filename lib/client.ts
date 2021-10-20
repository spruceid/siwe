import { v4 as uuidv4 } from 'uuid';
// TODO: Figure out how to get types from this lib:
// @ts-ignore
import ENS, { getEnsAddress } from '@ensdomains/ensjs';
import Web3Modal from 'web3modal';
import type { ICoreOptions } from 'web3modal';
import * as sigUtil from '@metamask/eth-sig-util';

import { ParsedMessage } from './abnf';

export interface LoginResult {
	message: string;
	signature: string;
	pubkey: string;
	ens?: string;
}

export interface MessageOpts {
	address: string;
	chainId?: string;
	statement?: string;
	notBefore?: string;
	requestId?: string;
	resources?: Array<string>;
}

export interface SessionOpts {
	domain: string;
	url: string;
	useENS: boolean;
	// Defaults to 48 hours.
	expiration?: number;
	// TODO: Add a way pass a function to determine notBefore
}

export interface ClientOpts {
	session: SessionOpts;
	modal?: Partial<ICoreOptions>;
	message?: Partial<MessageOpts>;
}

export class Client {
	// TODO: Type properly
	provider: any;
	modalOpts: Partial<ICoreOptions>;
	messageGenerator: MessageGenerator | false;
	messageOpts: Partial<MessageOpts>;
	sessionOpts: SessionOpts;
	pubkey: string;
	ens: string;

	constructor(opts: ClientOpts) {
		this.provider = false;
		this.messageGenerator = false;

		this.modalOpts = opts?.modal || {};
		this.messageOpts = opts?.message || {};
		this.pubkey = '';
		this.ens = '';
		this.sessionOpts = opts.session;

		const sanity =
			this.sessionOpts?.expiration &&
			typeof this.sessionOpts.expiration === 'number' &&
			this.sessionOpts.expiration > 0;

		if (!sanity) {
			// Default to 48 hours.
			this.sessionOpts.expiration = 2 * 24 * 60 * 60 * 1000;
		}
	}

	logout() {
		this.provider = false;
		this.messageGenerator = false;
		this.pubkey = '';
		this.ens = '';
	}

	async login(): Promise<LoginResult> {
		const web3Modal = new Web3Modal({ ...this.modalOpts });

		this.provider = await web3Modal.connect();
		this.messageGenerator = await makeMessageGenerator(
			this.sessionOpts.domain,
			this.sessionOpts.url,
			this.sessionOpts.useENS,
			this.provider,
			this.sessionOpts.expiration,
		);

		const arr = await this.provider.request({ method: 'eth_requestAccounts' });
		this.pubkey = Array.isArray(arr) && typeof arr[0] === 'string' ? arr[0] : '';
		if (!this.pubkey) {
			throw new Error('Address not found');
		}

		const message = await this.messageGenerator(Object.assign(this.messageOpts, { address: this.pubkey }));

		const signature = await this.provider.request({
			method: 'personal_sign',
			params: [this.pubkey, message],
		});

		const result: LoginResult = {
			message,
			signature,
			pubkey: this.pubkey,
		};

		// const maybeENS = await checkENS(this.provider, this.pubkey);
		// if (maybeENS) {
		// 	result.ens = maybeENS;
		// }

		return result;
	}

	valitate(msg: string, textSig: string, pubkey: string) {
		const addr = sigUtil.recoverPersonalSignature({
			data: msg,
			signature: textSig,
		});

		if (addr !== pubkey) {
			throw new Error(`Invalid Signature`);
		}

		const parsedMessage = new ParsedMessage(msg);

		if (parsedMessage.expirationTime && new Date().getTime() >= new Date(parsedMessage.expirationTime).getTime()) {
			throw new Error(`Expired Signature`);
		}
	}
}

export type MessageGenerator = (opts: MessageOpts) => Promise<string>;

// Personal Sign Impl.
export function makeMessageGenerator(
	domain: string,
	url: string,
	useENS: boolean,
	// TODO: Properly type.
	provider: any,
	expiresIn?: number,
): MessageGenerator {
	const header = `${domain} wants you to sign in with your Ethereum account:`;
	const urlField = `URI: ${url}`;
	return async (opts: MessageOpts): Promise<string> => {
		const addrStr = opts.address;

		// if (useENS) {
		// 	const ensStr = await checkENS(provider, opts.address);
		// 	if (ensStr) {
		// 		addrStr = `${opts.address} (${ensStr})`
		// 	}
		// }

		let prefix = [header, addrStr].join('\n');
		const versionField = `Version: 1`;
		const nonceField = `Nonce: ${(Math.random() + 1).toString(36).substring(4)}`;
		const current = new Date();

		const suffixArray = [urlField, versionField, nonceField];

		suffixArray.push(`Issued At: ${current.toISOString()}`);

		if (expiresIn) {
			const expiryField = `Expiration Time: ${new Date(current.getTime() + expiresIn).toISOString()}`;

			suffixArray.push(expiryField);
		}

		if (opts.notBefore) {
			suffixArray.push(`Not Before: ${opts.notBefore}`);
		}

		if (opts.requestId) {
			suffixArray.push(`Request ID: ${opts.requestId}`);
		}

		if (opts.chainId) {
			suffixArray.push(`Chain ID: ${opts.chainId}`);
		}

		if (opts.resources) {
			suffixArray.push([`Resources:`, ...opts.resources.map((x) => `- ${x}`)].join('\n'));
		}

		let suffix = suffixArray.join('\n');
		if (!opts.resources) {
			suffix += '\n'
		}

		if (opts.statement) {
			prefix = [prefix, opts.statement].join('\n\n');
		}

		return [prefix, suffix].join('\n\n');
	};
}

// TODO: Get type of provider.
export async function checkENS(provider: any, address: string): Promise<string | false> {
	const ens = new ENS({ provider, ensAddress: getEnsAddress('1') });

	const name = await ens.getName(address);
	return (await ens.name(name).getAddress()) === address && name;
}

export default Client;
