// TODO: Figure out how to get types from this lib:
import { providers, utils } from "ethers";
import {
	isEIP55Address, ParsedMessage, ParsedMessageRegExp
} from "siwe-parser";
import * as uri from "valid-url";
import { SiweError, SiweErrorType, SiweResponse, VerifyParams } from "./types";
import { checkContractWalletSignature, generateNonce } from "./utils";

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
	chainId: number;
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

	/**
	 * Creates a parsed Sign-In with Ethereum Message (EIP-4361) object from a
	 * string or an object. If a string is used an ABNF parser is called to
	 * validate the parameter, otherwise the fields are attributed.
	 * @param param {string | SiweMessage} Sign message as a string or an object.
	 */
	constructor(param: string | Partial<SiweMessage>) {
		if (typeof param === "string") {
			const parsedMessage = new ParsedMessage(param);
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
			if (typeof this.chainId === "string") {
				this.chainId = parseInt(this.chainId);
			}
		}
		this.validate();
	}

	/**
	 * Given a sign message (EIP-4361) returns the correct matching groups.
	 * @param message {string}
	 * @returns {RegExpExecArray} The matching groups for the message
	 */
	regexFromMessage(message: string): RegExpExecArray {
		const parsedMessage = new ParsedMessageRegExp(message);
		return parsedMessage.match;
	}

	/**
	 * This function can be used to retrieve an EIP-4361 formated message for
	 * signature, although you can call it directly it's advised to use
	 * [prepareMessage()] instead which will resolve to the correct method based
	 * on the [type] attribute of this object, in case of other formats being
	 * implemented.
	 * @returns {string} EIP-4361 formated message, ready for EIP-191 signing.
	 */
	toMessage(): string {
		/** Validates all fields of the object */
		this.validate();

		const header = `${this.domain} wants you to sign in with your Ethereum account:`;
		const uriField = `URI: ${this.uri}`;
		let prefix = [header, this.address].join("\n");
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
		this.issuedAt = this.issuedAt ? this.issuedAt : new Date().toISOString();
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
				[`Resources:`, ...this.resources.map((x) => `- ${x}`)].join("\n")
			);
		}

		let suffix = suffixArray.join("\n");
		prefix = [prefix, this.statement].join("\n\n");
		if (this.statement) {
			prefix += "\n";
		}
		return [prefix, suffix].join("\n");
	}

	/**
	 * This method parses all the fields in the object and creates a sign
	 * message according with the type defined.
	 * @returns {string} Returns a message ready to be signed according with the
	 * type defined in the object.
	 */
	prepareMessage(): string {
		let message: string;
		switch (this.version) {
			case "1": {
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
	 * Validates the integrity of the object by matching it's signature.
	 * @param params Parameters to verify the integrity of the message, signature is required.
	 * @returns {Promise<SiweMessage>} This object if valid.
	 */
	async verify(
		params: VerifyParams,
		provider?: providers.Provider
	): Promise<SiweResponse> {
		return new Promise<SiweResponse>(async (resolve) => {
			const { signature, domain, nonce, time } = params;

			/** Domain binding */
			if (domain && domain !== this.domain) {
				resolve({
					success: false,
					data: this,
					error: new SiweError(
						SiweErrorType.DOMAIN_MISMATCH,
						domain,
						this.domain
					),
				});
			}

			/** Nonce binding */
			if (nonce && nonce !== this.nonce) {
				resolve({
					success: false,
					data: this,
					error: new SiweError(SiweErrorType.NONCE_MISMATCH, nonce, this.nonce),
				});
			}

			/** Check time or now */
			const checkTime = new Date(time || new Date());

			/** Message not expired */
			if (this.expirationTime) {
				const expirationDate = new Date(this.expirationTime);
				if (checkTime.getTime() >= expirationDate.getTime()) {
					resolve({
						success: false,
						data: this,
						error: new SiweError(
							SiweErrorType.EXPIRED_MESSAGE,
							`${checkTime.toISOString()} < ${expirationDate.toISOString()}`,
							`${checkTime.toISOString()} >= ${expirationDate.toISOString()}`
						),
					});
				}
			}

			/** Message is valid already */
			if (this.notBefore) {
				const notBefore = new Date(this.notBefore);
				if (checkTime.getTime() < notBefore.getTime()) {
					resolve({
						success: false,
						data: this,
						error: new SiweError(
							SiweErrorType.EXPIRED_MESSAGE,
							`${checkTime.toISOString()} >= ${notBefore.toISOString()}`,
							`${checkTime.toISOString()} < ${notBefore.toISOString()}`
						),
					});
				}
			}
			let EIP4361Message;
			try {
				EIP4361Message = this.prepareMessage();
			} catch (e) {
				resolve({
					success: false,
					data: this,
					error: e,
				});
			}

			/** Recover address from signature */
			let addr;
			try {
				addr = utils.verifyMessage(EIP4361Message, signature);
			} catch (_) {
			} finally {
				/** Match signature with message's address */
				if (addr !== this.address) {
					let isValid = false;
					try {
						/** Try resolving EIP-1271 if address doesn't match */
						isValid = await checkContractWalletSignature(
							this,
							signature,
							provider
						);
					} catch (_) {
						isValid = false;
					} finally {
						if (!isValid) {
							resolve({
								success: false,
								data: this,
								error: new SiweError(
									SiweErrorType.INVALID_SIGNATURE,
									addr,
									`Resolved address to be ${this.address}`
								),
							});
						}
					}
				}
			}

			resolve({
				success: true,
				data: this,
			});
		});
	}

	/**
	 * Validates the value of this object fields.
	 * @throws Throws an {ErrorType} if a field is invalid.
	 */
	validate() {
		/** `domain` check. */
		if (this.domain.length === 0 || !/[^#?]*/.test(this.domain)) {
			throw new SiweError(SiweErrorType.INVALID_DOMAIN, `${this.domain} to be a valid domain.`);
		}

		/** EIP-55 `address` check. */
		if (!isEIP55Address(this.address)) {
			throw new SiweError(
				SiweErrorType.INVALID_ADDRESS,
				utils.getAddress(this.address),
				this.address
			);
		}

		/** Check if the URI is valid. */
		if (!uri.isUri(this.uri)) {
			throw new SiweError(SiweErrorType.INVALID_URI, `${this.uri} to be a valid uri.`);
		}

		/** Check if the version is 1. */
		if (this.version !== "1") {
			throw new SiweError(
				SiweErrorType.INVALID_MESSAGE_VERSION,
				"1",
				this.version
			);
		}

		/** Check if the nonce is alphanumeric and bigger then 8 characters */
		const nonce = this.nonce.match(/[a-zA-Z0-9]{8,}/);
		if (!nonce || this.nonce.length < 8 || nonce[0] !== this.nonce) {
			throw new SiweError(
				SiweErrorType.INVALID_NONCE,
				`Length > 8 (${nonce.length}). Alphanumeric.`,
				this.nonce
			);
		}

		const ISO8601 =
			/([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\.[0-9]+)?(([Zz])|([+|\-]([01][0-9]|2[0-3]):[0-5][0-9]))/;
		/** `issuedAt` conforms to ISO-8601 */
		if (this.issuedAt) {
			if (!ISO8601.test(this.issuedAt)) {
				throw new Error(SiweErrorType.INVALID_TIME_FORMAT);
			}
		}

		/** `expirationTime` conforms to ISO-8601 */
		if (this.expirationTime) {
			if (!ISO8601.test(this.expirationTime)) {
				throw new Error(SiweErrorType.INVALID_TIME_FORMAT);
			}
		}

		/** `notBefore` conforms to ISO-8601 */
		if (this.notBefore) {
			if (!ISO8601.test(this.notBefore)) {
				throw new Error(SiweErrorType.INVALID_TIME_FORMAT);
			}
		}
	}
}
