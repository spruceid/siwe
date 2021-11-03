// TODO: Figure out how to get types from this lib:
import { Contract, ethers, utils } from 'ethers';
import { ParsedMessage as ABNFParsedMessage } from './abnf';
import { ParsedMessage as RegExpParsedMessage } from './regex';

export enum ErrorTypes {
	INVALID_SIGNATURE = 'Invalid signature.',
	EXPIRED_MESSAGE = 'Expired message.',
	MALFORMED_SESSION = 'Malformed session.',
}

export enum SignatureType {
	PERSONAL_SIGNATURE = 'Personal signature',
}

export class SiweMessage {
	domain: string;
	address: string;
	statement?: string;
	uri: string;
	version: string;
	nonce?: string;
	issuedAt?: string;
	expirationTime?: string;
	notBefore?: string;
	requestId?: string;
	chainId?: string;
	resources?: Array<string>;
	signature?: string;
	pubkey?: string;
	//maybe get this from version?
	type?: SignatureType;

	constructor(
		param:
			| string
			| {
					domain: string;
					address: string;
					statement?: string;
					uri: string;
					version: string;
					nonce?: string;
					issuedAt?: string;
					expirationTime?: string;
					notBefore?: string;
					requestId?: string;
					chainId?: string;
					resources?: Array<string>;
					signature?: string;
					pubkey?: string;
					type?: SignatureType;
			  }
	) {
		if (typeof param === 'string') {
			const parsedMessage = new ABNFParsedMessage(param);
			this.domain = parsedMessage.domain;
			this.address = parsedMessage.address;
			this.statement = parsedMessage.statement;
			this.uri = parsedMessage.uri;
			this.version = parsedMessage.version;
			this.nonce = parsedMessage.nonce;
			this.issuedAt = parsedMessage.issuedAt;
			this.expirationTime = parsedMessage.expirationTime;
			this.notBefore = parsedMessage.notBefore;
			this.requestId = parsedMessage.requestId;
			this.chainId = parsedMessage.chainId;
			this.resources = parsedMessage.resources;
		} else {
			this.domain = param.domain;
			this.address = param.address;
			this.statement = param.statement;
			this.uri = param.uri;
			this.version = param.version;
			this.nonce = param.nonce;
			this.issuedAt = param.issuedAt;
			this.expirationTime = param.expirationTime;
			this.notBefore = param.notBefore;
			this.requestId = param.requestId;
			this.chainId = param.chainId;
			this.resources = param.resources;
			this.signature = param.signature;
			this.pubkey = param.pubkey;
			this.type = param.type;
		}
	}

	regexFromMessage(message: string) {
		const parsedMessage = new RegExpParsedMessage(message);
		return parsedMessage.match;
	}

	toMessage(): string {
		this.type = SignatureType.PERSONAL_SIGNATURE;
		const header = `${this.domain} wants you to sign in with your Ethereum account:`;
		const uriField = `URI: ${this.uri}`;
		let prefix = [header, this.address].join('\n');
		const versionField = `Version: ${this.version}`;

		if (!this.nonce) {
			this.nonce = (Math.random() + 1).toString(36).substring(4);
		}

		const nonceField = `Nonce: ${this.nonce}`;

		const suffixArray = [uriField, versionField, nonceField];

		const current = new Date(this.issuedAt ?? '');
		this.issuedAt = current.toISOString();
		suffixArray.push(`Issued At: ${current.toISOString()}`);

		if (this.expirationTime) {
			const expiryField = `Expiration Time: ${new Date(
				current.getTime() + this.expirationTime
			).toISOString()}`;

			suffixArray.push(expiryField);
		}

		if (this.notBefore) {
			suffixArray.push(`Not Before: ${this.notBefore}`);
		}

		if (this.requestId) {
			suffixArray.push(`Request ID: ${this.requestId}`);
		}

		if (this.chainId) {
			suffixArray.push(`Chain ID: ${this.chainId}`);
		}

		if (this.resources) {
			suffixArray.push(
				[`Resources:`, ...this.resources.map((x) => `- ${x}`)].join(
					'\n'
				)
			);
		}

		let suffix = suffixArray.join('\n');

		if (this.statement) {
			prefix = [prefix, this.statement].join('\n\n');
		}

		return [prefix, suffix].join('\n\n');
	}

	signMessage() {
		let message: string;
		switch (this.type) {
			case SignatureType.PERSONAL_SIGNATURE: {
				message = this.toMessage();
				break;
			}

			default: {
				message = this.toMessage();
				break;
			}
		}
		return message;
	}

	async validate(
		provider?: ethers.providers.Provider | any
	): Promise<SiweMessage> {
		return new Promise<SiweMessage>(async (resolve, reject) => {
			const message = this.signMessage();
			try {
				if (!message || !this.signature || !this.pubkey) {
					throw new Error(ErrorTypes.MALFORMED_SESSION);
				}

				const addr = ethers.utils.recoverAddress(
					message,
					this.signature
				);

				if (addr !== this.pubkey) {
					try {
						//EIP1271
						const isValidSignature =
							await checkContractWalletSignature(this, provider);
						if (!isValidSignature) {
							throw new Error(
								`${ErrorTypes.INVALID_SIGNATURE}: ${addr} !== ${this.pubkey}`
							);
						}
					} catch (e) {
						throw e;
					}
				}
				const parsedMessage = new SiweMessage(message);

				if (
					parsedMessage.expirationTime &&
					new Date().getTime() >=
						new Date(parsedMessage.expirationTime).getTime()
				) {
					throw new Error(ErrorTypes.EXPIRED_MESSAGE);
				}
				resolve(parsedMessage);
			} catch (e) {
				reject(e);
			}
		});
	}
}

export const checkContractWalletSignature = async (
	message: SiweMessage,
	provider?: ethers.providers.Provider | any
): Promise<boolean> => {
	if (!provider) {
		return false;
	}

	const abi = [
		'function isValidSignature(bytes32 _message, bytes _signature) public view returns (bool)',
	];
	if (typeof provider !== typeof ethers.providers.Provider) {
		try {
			provider = new ethers.providers.Web3Provider(provider);
		} catch (e) {
			throw e;
		}
	}
	const walletContract = new Contract(message.pubkey, abi, provider);
	const hashMessage = utils.hashMessage(message.signMessage());
	return await walletContract.isValidSignature(
		hashMessage,
		message.signature
	);
};
