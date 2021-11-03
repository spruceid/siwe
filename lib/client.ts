// TODO: Figure out how to get types from this lib:
import * as sigUtil from '@metamask/eth-sig-util';
import axios from 'axios';
import { Contract, ethers, utils } from 'ethers';
import EventEmitter from 'events';
import Cookies from 'js-cookie';
import type { ICoreOptions } from 'web3modal';
import Web3Modal from 'web3modal';
import { ParsedMessage } from './abnf';

export interface SiweSession {
	message: string;
	signature: string;
	pubkey: string;
	ens?: string;
	ensAvatar?: string;
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
	EXPIRED_MESSAGE = 'Expired message.',
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
	currentSession?: SiweSession;
}

export class Client extends EventEmitter {
	provider: ethers.providers.JsonRpcProvider;
	modalOpts: Partial<ICoreOptions>;
	messageGenerator: MessageGenerator;
	messageOpts: Partial<MessageOpts>;
	sessionOpts: SessionOpts;
	session: SiweSession;
	web3Modal: Web3Modal;

	constructor(opts: ClientOpts) {
		super();

		this.modalOpts = opts?.modal || {};
		this.messageOpts = opts?.message || {};
		this.session = opts?.currentSession;
		this.sessionOpts = opts.session;

		const sanity =
			this.sessionOpts?.expiration &&
			typeof this.sessionOpts.expiration === 'number' &&
			this.sessionOpts.expiration > 0;

		if (!sanity) {
			// Default to 48 hours.
			this.sessionOpts.expiration = 2 * 24 * 60 * 60 * 1000;
		}

		const sessionCookie = Cookies.get('siwe');
		if (sessionCookie) {
			this.session = JSON.parse(sessionCookie);
		}

		this.web3Modal = new Web3Modal({ ...this.modalOpts, cacheProvider: true });
	}

	async logout() {
		this.provider = null;
		this.session = null;
		this.web3Modal.clearCachedProvider();

		Cookies.remove('siwe');
		this.emit('logout');
	}

	async login(): Promise<SiweSession> {
		return new Promise(async (resolve, reject) => {
			try {
				await this.initializeProvider();

				this.emit('modalClosed');

				this.messageGenerator = makeMessageGenerator(
					this.sessionOpts.domain,
					this.sessionOpts.url,
					this.sessionOpts.expiration,
					this.sessionOpts.fetchNonce
				);

				// Get list of accounts of the connected wallet
				const accounts = await this.provider.listAccounts();

				// MetaMask does not give you all accounts, only the selected account
				const pubkey = accounts[0]?.toLowerCase();
				if (!pubkey) {
					throw new Error('Address not found');
				}
				const ens = await this.provider.lookupAddress(pubkey);

				const ensAvatar = ens && await this.provider.getAvatar(ens);

				const message = await this.messageGenerator(Object.assign(this.messageOpts, { address: pubkey }));

				const signature = await this.provider.getSigner().signMessage(message);

				const session: SiweSession = {
					message,
					signature,
					pubkey,
					ens,
					ensAvatar,
				};

				Cookies.set('siwe', JSON.stringify(session), {
					expires: new Date(new Date().getTime() + this.sessionOpts.expiration),
				});

				this.emit('login', session);

				resolve(session);
			} catch (e) {
				this.logout();
				reject(e);
			}
		});
	}

	async valitate(): Promise<SiweSession> {
		return new Promise<SiweSession>(async (resolve, reject) => {
			let session: SiweSession;

			try {
				session = JSON.parse(Cookies.get('siwe'));
				if (!session.message || !session.signature || !session.pubkey) {
					this.emit('validate', null);
					throw new Error(ErrorTypes.MALFORMED_SESSION);
				}

				const addr = sigUtil.recoverPersonalSignature({
					data: session.message,
					signature: session.signature,
				});

				if (addr !== session.pubkey) {
					//EIP1271
					await this.initializeProvider();
					const isValidSignature = await checkContractWalletSignature(session, this.provider);
					if (!isValidSignature) {
						throw new Error(`${ErrorTypes.INVALID_SIGNATURE}: ${addr} !== ${session.pubkey}`);
					}
				}

				const parsedMessage = new ParsedMessage(session.message);

				if (
					parsedMessage.expirationTime &&
					new Date().getTime() >= new Date(parsedMessage.expirationTime).getTime()
				) {
					this.emit('validate', false);
					throw new Error(ErrorTypes.EXPIRED_MESSAGE);
				}

				this.session = session;
				this.emit('validate', session);
				resolve(session);
			} catch (e) {
				reject(e);
			}
		});
	}

	async initializeProvider(): Promise<ethers.providers.JsonRpcProvider> {
		return new Promise<ethers.providers.JsonRpcProvider>((resolve, reject) => {
			if (!this.provider) {
				return this.web3Modal
					.connect()
					.then((provider) => {
						this.provider = new ethers.providers.Web3Provider(provider);
						resolve(this.provider);
					})
					.catch(reject);
			} else {
				resolve(this.provider);
			}
		});
	}
}

export const checkContractWalletSignature = async (
	session: SiweSession,
	provider: ethers.providers.Provider | ethers.providers.Web3Provider
): Promise<boolean> => {
	const abi = ['function isValidSignature(bytes32 _message, bytes _signature) public view returns (bool)'];
	const walletContract = new Contract(session.pubkey, abi, provider);
	const hashMessage = utils.hashMessage(session.message);
	return await walletContract.isValidSignature(hashMessage, session.signature);
};

export const validate = async (session: SiweSession, provider: ethers.providers.Provider): Promise<ParsedMessage> => {
	return new Promise<ParsedMessage>(async (resolve, reject) => {
		try {
			if (!session.message || !session.signature || !session.pubkey) {
				throw new Error(ErrorTypes.MALFORMED_SESSION);
			}

			const addr = sigUtil.recoverPersonalSignature({
				data: session.message,
				signature: session.signature,
			});

			if (addr !== session.pubkey) {
				//EIP1271
				const isValidSignature = await checkContractWalletSignature(session, provider);
				if (!isValidSignature) {
					throw new Error(`${ErrorTypes.INVALID_SIGNATURE}: ${addr} !== ${session.pubkey}`);
				}
			}
			const parsedMessage = new ParsedMessage(session.message);

			if (
				parsedMessage.expirationTime &&
				new Date().getTime() >= new Date(parsedMessage.expirationTime).getTime()
			) {
				throw new Error(ErrorTypes.EXPIRED_MESSAGE);
			}
			resolve(parsedMessage);
		} catch (e) {
			reject(e);
		}
	});
};

export type MessageGenerator = (opts: MessageOpts) => Promise<string>;

// Personal Sign Impl.
export function makeMessageGenerator(
	domain: string,
	url: string,
	expiresIn?: number,
	fetchNonce?: string
): MessageGenerator {
	const header = `${domain} wants you to sign in with your Ethereum account:`;
	const urlField = `URI: ${url}`;
	return async (opts: MessageOpts): Promise<string> => {
		let prefix = [header, opts.address].join('\n');
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

export type Message = ParsedMessage;

export default { Client, validate };
