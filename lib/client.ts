// TODO: Figure out how to get types from this lib:
import ENS, { getEnsAddress } from '@ensdomains/ensjs';
import * as sigUtil from '@metamask/eth-sig-util';
import axios from 'axios';
import { Contract, ethers, utils } from 'ethers';
import EventEmitter from 'events';
import Cookies from 'js-cookie';
import Web3 from 'web3';
import type { ICoreOptions } from 'web3modal';
import Web3Modal from 'web3modal';
import { ParsedMessage } from './abnf';

export interface SiweSession {
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

export enum ErrorTypes {
	INVALID_SIGNATURE = 'Invalid signature.',
	EXPIRED_MESSAGE = 'Expired signature.',
	MALFORMED_SESSION = 'Malformed session.',
}

export interface SessionOpts {
	domain: string;
	url: string;
	useENS: boolean;
	// Defaults to 48 hours.
	expiration?: number;
	// TODO: Add a way pass a function to determine notBefore
	fetchNonce?: string;
}

export interface ClientOpts {
	session: SessionOpts;
	modal?: Partial<ICoreOptions>;
	message?: Partial<MessageOpts>;
}

export class Client extends EventEmitter {
	// TODO: Type properly
	provider: any;
	modalOpts: Partial<ICoreOptions>;
	messageGenerator: MessageGenerator | false;
	messageOpts: Partial<MessageOpts>;
	sessionOpts: SessionOpts;
	pubkey: string;
	message: string;
	signature: string;
	ens: string;
	web3Modal: Web3Modal;
	infuraId: string;

	constructor(opts: ClientOpts) {
		super();

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

		const login_cookie = Cookies.get('siwe');
		if (login_cookie) {
			const result: SiweSession = JSON.parse(login_cookie);
			this.pubkey = result.pubkey;
			this.message = result.message;
			this.signature = result.signature;
		}

		this.web3Modal = new Web3Modal({ ...this.modalOpts, cacheProvider: true });
	}

	logout() {
		this.provider = false;
		this.messageGenerator = false;
		this.pubkey = '';
		this.message = '';
		this.signature = '';
		this.ens = '';
		try {
			this.provider.disconnect();
		} catch {}
		this.web3Modal.clearCachedProvider();

		Cookies.remove('siwe');
		this.emit('logout');
	}

	async login(): Promise<SiweSession> {
		return new Promise(async (resolve, reject) => {
			if (!this.provider) {
				this.provider = await this.web3Modal.connect();
			}
			this.emit('modalClosed');
			this.messageGenerator = makeMessageGenerator(
				this.sessionOpts.domain,
				this.sessionOpts.url,
				this.sessionOpts.useENS,
				this.provider,
				this.sessionOpts.expiration,
				this.sessionOpts.fetchNonce
			);
			const web3 = new Web3(this.provider);

			// Get list of accounts of the connected wallet
			const accounts = await web3.eth.getAccounts();

			// MetaMask does not give you all accounts, only the selected account
			this.pubkey = accounts[0]?.toLowerCase();
			if (!this.pubkey) {
				try {
					this.provider.disconnect();
				} catch {}
				reject(new Error('Address not found'));
			}

			const message = await this.messageGenerator(Object.assign(this.messageOpts, { address: this.pubkey }));

			const signature = await web3.eth.personal.sign(message, this.pubkey, '');

			const maybeENS = await checkENS(this.provider, this.pubkey);
			if (maybeENS) {
				this.ens = maybeENS;
			}

			const result: SiweSession = {
				message,
				signature,
				pubkey: this.pubkey,
				ens: this.ens,
			};

			Cookies.set('siwe', JSON.stringify(result), {
				expires: new Date(new Date().getTime() + this.sessionOpts.expiration),
			});

			this.emit('login', result);

			resolve(result);
		});
	}

	async valitate(cookie: SiweSession = null): Promise<SiweSession> {
		return new Promise(async (resolve, reject) => {
			if (!cookie) {
				try {
					const { message, signature, pubkey, ens } = JSON.parse(Cookies.get('siwe'));
					cookie = {
						message,
						signature,
						pubkey,
						ens,
					};
					if (!message || !signature || !pubkey) {
						throw new Error(ErrorTypes.MALFORMED_SESSION);
					}
				} catch (e) {
					this.emit('validate', null);
					reject(e);
					return;
				}
			}

			const addr = sigUtil.recoverPersonalSignature({
				data: cookie.message,
				signature: cookie.signature,
			});

			if (addr !== cookie.pubkey) {
				//EIP1271
				try {
					const abi = [
						'function isValidSignature(bytes32 _message, bytes _signature) public view returns (bool)',
					];
					this.provider = await this.web3Modal.connect();
					const ethersProvider = new ethers.providers.Web3Provider(this.provider);
					const walletContract = new Contract(cookie.pubkey, abi, ethersProvider);
					const hashMessage = utils.hashMessage(cookie.message);
					const isValidSignature = await new Promise((resolve, reject) =>
						walletContract.isValidSignature(hashMessage, cookie.signature).then(resolve).catch(reject)
					);
					if (!isValidSignature) {
						throw new Error(
							`${ErrorTypes.INVALID_SIGNATURE}: ${addr} !== ${cookie.pubkey} contract ${isValidSignature}`
						);
					}
				} catch (e) {
					throw e;
				}
			}

			const parsedMessage = new ParsedMessage(cookie.message);

			if (
				parsedMessage.expirationTime &&
				new Date().getTime() >= new Date(parsedMessage.expirationTime).getTime()
			) {
				this.emit('validate', false);
				reject(new Error(ErrorTypes.EXPIRED_MESSAGE));
			}

			this.emit('validate', cookie);
			resolve(cookie);
		});
	}
}

export const validate = async (session: SiweSession, provider: ethers.providers.Provider): Promise<ParsedMessage> => {
	if (!session.message || !session.signature || !session.pubkey) {
		throw new Error(ErrorTypes.MALFORMED_SESSION);
	}

	const addr = sigUtil.recoverPersonalSignature({
		data: session.message,
		signature: session.signature,
	});

	if (addr !== session.pubkey) {
		//EIP1271
		try {
			const abi = ['function isValidSignature(bytes32 _message, bytes _signature) public view returns (bool)'];
			const walletContract = new Contract(session.pubkey, abi, provider);
			const hashMessage = utils.hashMessage(session.message);
			const isValidSignature = await walletContract.isValidSignature(hashMessage, session.signature);
			if (!isValidSignature) {
				throw new Error(
					`${ErrorTypes.INVALID_SIGNATURE}: ${addr} !== ${session.pubkey} contract ${isValidSignature}`
				);
			}
		} catch (e) {
			throw e;
		}
	}
	const parsedMessage = new ParsedMessage(session.message);

	if (parsedMessage.expirationTime && new Date().getTime() >= new Date(parsedMessage.expirationTime).getTime()) {
		throw new Error(ErrorTypes.EXPIRED_MESSAGE);
	}
	return parsedMessage;
};

export type MessageGenerator = (opts: MessageOpts) => Promise<string>;

// Personal Sign Impl.
export function makeMessageGenerator(
	domain: string,
	url: string,
	useENS: boolean,
	// TODO: Properly type.
	provider: any,
	expiresIn?: number,
	fetchNonce?: string
): MessageGenerator {
	const header = `${domain} wants you to sign in with your Ethereum account:`;
	const urlField = `URI: ${url}`;
	return async (opts: MessageOpts): Promise<string> => {
		let addrStr = opts.address;

		let ens;
		if (useENS) {
			ens = await checkENS(provider, opts.address);
			if (ens !== '') {
				addrStr = `${addrStr} (${ens})`;
			}
		}

		let prefix = [header, addrStr].join('\n');
		const versionField = `Version: 1`;

		let nonceField;
		if (fetchNonce) {
			nonceField = await axios.get(fetchNonce, { withCredentials: true }).then((res) => res.data);
		} else {
			nonceField = `Nonce: ${(Math.random() + 1).toString(36).substring(4)}`;
		}
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

		if (opts.statement) {
			prefix = [prefix, opts.statement].join('\n\n');
		}

		return [prefix, suffix].join('\n\n');
	};
}

// TODO: Get type of provider.
export async function checkENS(provider: any, address: string): Promise<string> {
	const ens = new ENS({ provider, ensAddress: getEnsAddress('1') });

	const name = (await ens.getName(address)).name;
	if ((await ens.name(name).getAddress()).toLowerCase() === address.toLowerCase()) {
		return name;
	}
	return '';
}

export type Message = ParsedMessage;

export default { Client, validate };
