
// TODO: Figure out how to get types from this lib:
import { Contract, ethers, utils } from 'ethers';
import { ParsedMessage as ABNFParsedMessage } from './abnf';
import { ParsedMessage as RegExpParsedMessage } from './regex';

/**
 * Possible message error types.
 */
export enum ErrorTypes {
	/**Thrown when the `validate()` function can verify the message. */
	INVALID_SIGNATURE = 'Invalid signature.',
	/**Thrown when the `expirationTime` is present and in the past. */
	EXPIRED_MESSAGE = 'Expired message.',
	/**Thrown when some required field is missing. */
	MALFORMED_SESSION = 'Malformed session.',
}

/**
 * Possible signature types that this library supports.
 */
export enum SignatureType {
	/**EIP-191 signature scheme */
	PERSONAL_SIGNATURE = 'Personal signature',
}

export class SiweMessage {
	/**RFC 4501 dns authority that is requesting the signing. */
	domain: string;
	/**Ethereum address performing the signing conformant to capitalization
	 * encoded checksum specified in EIP-55 where applicable. */
	address: string;
	/**Human-readable ASCII assertion that the user will sign, and it must not
	 * contain `\n`. */
	statement?: string;
	/**RFC 3986 URI referring to the resource that is the subject of the signing
	 *  (as in the __subject__ of a claim). */
	uri: string;
	/**Current version of the message. */
	version: string;
	/**EIP-155 Chain ID to which the session is bound, and the network where
	 * Contract Accounts must be resolved. */
	chainId: string;
	/**Randomized token used to prevent replay attacks, at least 8 alphanumeric
	 * characters. */
	nonce: string;
	/**ISO 8601 datetime string of the current time. */
	issuedAt: string;
	/**ISO 8601 datetime string that, if present, indicates when the signed
	 * authentication message is no longer valid. */
	expirationTime?: string;
	/**ISO 8601 datetime string that, if present, indicates when the signed
	 * authentication message will become valid. */
	notBefore?: string;
	/**System-specific identifier that may be used to uniquely refer to the
	 * sign-in request. */
	requestId?: string;
	/**List of information or references to information the user wishes to have
	 * resolved as part of authentication by the relying party. They are
	 * expressed as RFC 3986 URIs separated by `\n- `. */
	resources?: Array<string>;
	/**Signature of the message signed by the wallet. */
	signature?: string;
	/**Type of sign message to be generated. */
	type?: SignatureType;

	/**
	 * Creates a parsed Sign-In with Ethereum Message (EIP-4361) object from a
	 * string or an object. If a string is used an ABNF parser is called to
	 * validate the parameter, otherwise the fields are attributed.
	 * @param param {string | SiweMessage} Sign message as a string or an object.
	 */
	constructor(param: string | Partial<SiweMessage>) {
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
			Object.assign(this, param);
		}
	}

	/**
	 * Given a sign message (EIP-4361) returns the correct matching groups.
	 * @param message {string}
	 * @returns {RegExpExecArray} The matching groups for the message
	 */
	regexFromMessage(message: string): RegExpExecArray {
		const parsedMessage = new RegExpParsedMessage(message);
		return parsedMessage.match;
	}

	/**
	 * This function can be used to retrieve an EIP-4361 formated message for
	 * signature, although you can call it directly it's advised to use
	 * [signMessage()] instead which will resolve to the correct method based
	 * on the [type] attribute of this object, in case of other formats being
	 * implemented.
	 * @returns {string} EIP-4361 formated message, ready for EIP-191 signing.
	 */
	toMessage(): string {
		const header = `${this.domain} wants you to sign in with your Ethereum account:`;
		const uriField = `URI: ${this.uri}`;
		let prefix = [header, this.address].join('\n');
		const versionField = `Version: ${this.version}`;

		if (!this.nonce) {
			this.nonce = generateNonce();
		}

		const chainField = `Chain ID: ` + this.chainId || "1";

		const nonceField = `Nonce: ${this.nonce}`;

		const suffixArray = [uriField, versionField, chainField, nonceField];

		if (this.issuedAt) {
			Date.parse(this.issuedAt);
		}
		this.issuedAt = this.issuedAt
			? this.issuedAt
			: new Date().toISOString();
		suffixArray.push(`Issued At: ${this.issuedAt}`);

		if (this.expirationTime) {
			const expiryField = `Expiration Time: ${this.expirationTime}`;

			suffixArray.push(expiryField);
		}

		if (this.notBefore) {
			suffixArray.push(`Not Before: ${this.notBefore}`);
		}

		if (this.requestId) {
			suffixArray.push(`Request ID: ${this.requestId}`);
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

	/**
	 * This method parses all the fields in the object and creates a sign
	 * message according with the type defined.
	 * @returns {string} Returns a message ready to be signed according with the
	 * type defined in the object.
	 */
	signMessage(): string {
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

	/**
	 * Validates the integrity of the fields of this objects by matching it's
	 * signature.
	 * @param provider A Web3 provider able to perform a contract check, this is
	 * required if support for Smart Contract Wallets that implement EIP-1271 is
	 * needed.
	 * @returns {Promise<SiweMessage>} This object if valid.
	 */
	async validate(
		provider?: ethers.providers.Provider | any
	): Promise<SiweMessage> {
		return new Promise<SiweMessage>(async (resolve, reject) => {
			const message = this.signMessage();
			try {
				let missing: Array<string> = [];
				if (!message) {
					missing.push('`message`');
				}

				if (!this.signature) {
					missing.push('`signature`');
				}
				if (!this.address) {
					missing.push('`address`');
				}
				if (missing.length > 0) {
					throw new Error(
						`${ErrorTypes.MALFORMED_SESSION
						} missing: ${missing.join(', ')}.`
					);
				}

				const addr = ethers.utils.verifyMessage(
					message,
					this.signature
				);

				if (addr !== this.address) {
					try {
						//EIP-1271
						const isValidSignature =
							await checkContractWalletSignature(this, provider);
						if (!isValidSignature) {
							throw new Error(
								`${ErrorTypes.INVALID_SIGNATURE}: ${addr} !== ${this.address}`
							);
						}
					} catch (e) {
						throw e;
					}
				}
				const parsedMessage = new SiweMessage(message);

				if (
					parsedMessage.expirationTime
				) {
					const exp = new Date(parsedMessage.expirationTime).getTime();
					if (isNaN(exp)) {
						throw new Error(`${ErrorTypes.MALFORMED_SESSION} invalid expiration date.`)
					}
					if (
						new Date().getTime() >=
						exp
					) {
						throw new Error(ErrorTypes.EXPIRED_MESSAGE);
					}
				}
				resolve(parsedMessage);
			} catch (e) {
				reject(e);
			}
		});
	}
}

/**
 * This method calls the EIP-1271 method for Smart Contract wallets
 * @param message The EIP-4361 parsed message
 * @param provider Web3 provider able to perform a contract check (Web3/EthersJS).
 * @returns {Promise<boolean>} Checks for the smart contract (if it exists) if
 * the signature is valid for given address.
 */
export const checkContractWalletSignature = async (
	message: SiweMessage,
	provider?: any
): Promise<boolean> => {
	if (!provider) {
		return false;
	}

	const abi = [
		'function isValidSignature(bytes32 _message, bytes _signature) public view returns (bool)',
	];
	try {
		const walletContract = new Contract(message.address, abi, provider);
		const hashMessage = utils.hashMessage(message.signMessage());
		return await walletContract.isValidSignature(
			hashMessage,
			message.signature
		);
	} catch (e) {
		throw e;
	}
};

// Get ourselves a cryptographically secure random number generator
// Largely inspired by this gist which brings together many of the 
// disparate concerns in the space: https://gist.github.com/dchest/751fd00ee417c947c252
const getRandomBytes = (
	(typeof self !== 'undefined' && (self.crypto || self.msCrypto))
	? function() { // Browsers
		const crypto = (self.crypto || self.msCrypto), QUOTA = 65536;
		return function(n) {
			const a = new Uint8Array(n);
			for (let i = 0; i < n; i += QUOTA) {
				crypto.getRandomValues(a.subarray(i, i + Math.min(n - i, QUOTA)));
			}
			return a;
		};
	}
	: function() { // Node
		return require("crypto").randomBytes;
	}
)();

const makeGenerator = function(charset) {
	if (charset.length < 2) {
		throw new Error('charset must have at least 2 characters');
	}

	const generate = function(length) {
		if (!length) return generate.entropy(128);
		let out = '';
		const charsLen = charset.length;
		const maxByte = 256 - (256 % charsLen);
		while (length > 0) {
			let buf = getRandomBytes(Math.ceil(length * 256 / maxByte));
			for (var i = 0; i < buf.length && length > 0; i++) {
				let randomByte = buf[i];
				if (randomByte < maxByte) {
					out += charset.charAt(randomByte % charsLen);
					length--;
				}
			}
		}
		return out;
	};

	generate.entropy = function(bits) { 
		return generate(Math.ceil(bits / (Math.log(charset.length) / Math.LN2)));
	};

	generate.charset = charset;

	return generate;
};

const numbers = '0123456789', letters = 'abcdefghijklmnopqrstuvwxyz';
const alphanumerics = numbers + letters + letters.toUpperCase();
const alphanumGenerator = makeGenerator(alphanumerics);

/**
 * This method leverages a native CSPRNG with support for both browser and Node.js
 * environments in order generate a cryptographically secure nonce for use in the
 * SiweMessage in order to prevent replay attacks.
 * 
 * @returns cryptographically generated random nonce with over 64 bits of entropy encoded with
 * an alphanumeric character set.
 */
export const generateNonce = (): string => {
	return alphanumGenerator(11);
}
