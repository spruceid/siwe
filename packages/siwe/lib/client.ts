// TODO: Figure out how to get types from this lib:
import { isEIP55Address, ParsedMessage } from '@spruceid/siwe-parser';
import { providers, Signer } from 'ethers';
import * as uri from 'valid-url';

import { getAddress, verifyMessage } from './ethersCompat';
import {
  SiweError,
  SiweErrorType,
  VerifyOpts,
  VerifyOptsKeys,
  VerifyParams,
  VerifyParamsKeys,
} from './types';
import {
  checkContractWalletSignature,
  checkInvalidKeys,
  isValidISO8601Date,
  exists,
} from './utils';

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
  issuedAt?: string;
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
    if (typeof param === 'string') {
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
      this.domain = param.domain;
      this.address = param.address;
      this.statement = param?.statement;
      this.uri = param.uri;
      this.version = param.version;
      this.chainId = param.chainId;
      this.nonce = param.nonce;
      this.issuedAt = param?.issuedAt;
      this.expirationTime = param?.expirationTime;
      this.notBefore = param?.notBefore;
      this.requestId = param?.requestId;
      this.resources = param?.resources;
    }
    this.validateMessage();
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
    this.validateMessage();

    const header = `${this.domain} wants you to sign in with your Ethereum account:`;
    const uriField = `URI: ${this.uri}`;
    let prefix = [header, this.address].join('\n');
    const versionField = `Version: ${this.version}`;

    const chainField = `Chain ID: ` + this.chainId;

    const nonceField = `Nonce: ${this.nonce}`;

    const suffixArray = [uriField, versionField, chainField, nonceField];

    this.issuedAt = this.issuedAt || new Date().toISOString();

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
        [`Resources:`, ...this.resources.map(x => `- ${x}`)].join('\n')
      );
    }

    const suffix = suffixArray.join('\n');
    prefix = [prefix, this.statement].join('\n\n');
    if (this.statement) {
      prefix += '\n';
    }
    return [prefix, suffix].join('\n');
  }

  /**
   * This method parses all the fields in the object and creates a messaging for signing
   * message according with the type defined.
   * @returns {string} Returns a message ready to be signed according with the
   * type defined in the object.
   */
  prepareMessage(): string {
    let message: string;
    switch (this.version) {
      case '1': {
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
   * Verifies the integrity of the object by matching its signature, nonce, and domain.
   * @param params Parameters to verify the integrity of the message, signature/nonce/domain are required.
   * @returns {Promise<SiweMessage>} This object if valid.
   */
  async verify(params: VerifyParams, opts: VerifyOpts = {}): Promise<void> {
    const invalidParams: Array<keyof VerifyParams> =
      checkInvalidKeys<VerifyParams>(params, VerifyParamsKeys);
    const invalidOpts: Array<keyof VerifyOpts> = checkInvalidKeys<VerifyOpts>(
      opts,
      VerifyOptsKeys
    );
    const { signature, domain, nonce, time } = params;

    if (invalidParams.length > 0) {
      throw new Error(
        `${invalidParams.join(', ')} is/are not valid key(s) for VerifyParams.`
      );
    }

    if (invalidOpts.length > 0) {
      throw new Error(
        `${invalidOpts.join(', ')} is/are not valid key(s) for VerifyOpts.`
      );
    }

    /** Domain binding */
    if (domain !== this.domain) {
      throw new SiweError(SiweErrorType.DOMAIN_MISMATCH, domain, this.domain);
    }

    /** Nonce binding */
    if (nonce !== this.nonce) {
      throw new SiweError(SiweErrorType.NONCE_MISMATCH, nonce, this.nonce);
    }

    /** Check time or now */
    const isValidDateObj = d =>
      d instanceof Date &&
      typeof d.getTime === 'function' &&
      !isNaN(d.getTime());
    const checkTime = new Date(time);

    if (!isValidDateObj(checkTime)) {
      throw new Error(`${checkTime} is not a valid date object`);
    }

    /** Message not expired */
    if (this.expirationTime) {
      const expirationTime = new Date(this.expirationTime);

      if (!isValidDateObj(expirationTime)) {
        throw new Error(`${expirationTime} is not a valid date object`);
      }

      if (checkTime.getTime() >= expirationTime.getTime()) {
        throw new SiweError(
          SiweErrorType.EXPIRED_MESSAGE,
          `${checkTime.toISOString()} < ${expirationTime.toISOString()}`,
          `${checkTime.toISOString()} >= ${expirationTime.toISOString()}`
        );
      }
    }

    /** Message is valid already */
    if (this.notBefore) {
      const notBefore = new Date(this.notBefore);

      if (!isValidDateObj(notBefore)) {
        throw new Error(`${notBefore} is not a valid date object`);
      }

      if (checkTime.getTime() < notBefore.getTime()) {
        throw new SiweError(
          SiweErrorType.NOT_YET_VALID_MESSAGE,
          `${checkTime.toISOString()} >= ${notBefore.toISOString()}`,
          `${checkTime.toISOString()} < ${notBefore.toISOString()}`
        );
      }
    }

    await this.verifySignature(signature, opts.provider);
  }

  /**
   * Verifies the integrity of the object by matching its signature
   * @param signature Message signature to verify
   * @returns {Promise<void>}
   */
  async verifySignature(
    signature: string,
    provider?: providers.Provider | Signer
  ): Promise<void> {
    let EIP4361Message = this.prepareMessage();

    /** Normalize signature before verifying */
    const normalizedSignatureBuf = Buffer.alloc(65); // (drop trailing bytes after recovery byte)
    normalizedSignatureBuf.write(signature.substring(2), 'hex');
    const normalizedSignature = '0x' + normalizedSignatureBuf.toString('hex');

    /** Recover address from signature */
    let addr = verifyMessage(EIP4361Message, normalizedSignature);

    /** Match signature with message's address */
    if (addr === this.address) {
      return;
    }

    const isValid = await checkContractWalletSignature(
      this,
      signature,
      provider
    );

    if (!isValid) {
      throw new SiweError(
        SiweErrorType.INVALID_SIGNATURE,
        addr,
        `Resolved address to be ${this.address}`
      );
    }
  }

  /**
   * Validates the values of this object fields.
   * @throws Throws an {ErrorType} if a field is invalid.
   */
  private validateMessage(...args) {
    /** Checks if the user might be using the function to verify instead of validate. */
    if (args.length > 0) {
      throw new SiweError(
        SiweErrorType.UNABLE_TO_PARSE,
        `Unexpected argument in the validateMessage function.`
      );
    }

    /** `domain` check. */
    if (
      !exists(this.domain) ||
      typeof this.domain !== 'string' ||
      this.domain.length === 0 ||
      !/[^#?]*/.test(this.domain)
    ) {
      throw new SiweError(
        SiweErrorType.INVALID_DOMAIN,
        `${this.domain} to be a valid domain.`
      );
    }

    /** EIP-55 `address` check. */
    if (
      !exists(this.address) ||
      typeof this.address !== 'string' ||
      !isEIP55Address(this.address)
    ) {
      throw new SiweError(
        SiweErrorType.INVALID_ADDRESS,
        getAddress(this.address),
        this.address
      );
    }

    if (
      exists(this.statement) &&
      (typeof this.statement !== 'string' || this.statement.includes('\n'))
    ) {
      throw new SiweError(
        SiweErrorType.INVALID_MESSAGE_STATEMENT,
        '`statement` to be a valid string and not contain \\n',
        this.statement
      );
    }

    /** Check if the URI is valid. */
    if (
      !exists(this.uri) ||
      typeof this.uri !== 'string' ||
      !uri.isUri(this.uri)
    ) {
      throw new SiweError(
        SiweErrorType.INVALID_URI,
        `${this.uri} to be a valid uri.`
      );
    }

    /** Check if the version is 1. */
    if (
      !exists(this.version) ||
      typeof this.version !== 'string' ||
      this.version !== '1'
    ) {
      throw new SiweError(
        SiweErrorType.INVALID_MESSAGE_VERSION,
        '1',
        this.version
      );
    }

    if (!exists(this.chainId) || typeof this.chainId !== 'number') {
      throw new SiweError(
        SiweErrorType.INVALID_CHAIN_ID,
        'Any number representing a `chainId`',
        `${this.chainId}`
      );
    } else {
      if (!Number.isFinite(this.chainId)) {
        throw new SiweError(
          SiweErrorType.INVALID_CHAIN_ID,
          'Any number representing a `chainId`',
          `${this.chainId}`
        );
      }
    }

    /** Check if the nonce is alphanumeric and bigger then 8 characters */
    if (!exists(this.nonce) || this.nonce === '') {
      throw new SiweError(
        SiweErrorType.INVALID_NONCE,
        `Length >= 8. Alphanumeric.`,
        this.nonce
      );
    } else {
      if (typeof this.nonce !== 'string') {
        throw new SiweError(
          SiweErrorType.INVALID_NONCE,
          `Length >= 8. String. Alphanumeric.`,
          this.nonce
        );
      }

      const nonce = this.nonce.match(/[a-zA-Z0-9]{8,}/);
      if (this.nonce.length < 8 || nonce[0] !== this.nonce) {
        throw new SiweError(
          SiweErrorType.INVALID_NONCE,
          `Length >= 8 (${this.nonce.length}). Alphanumeric.`,
          this.nonce
        );
      }
    }

    if (exists(this.issuedAt)) {
      if (typeof this.issuedAt !== 'string') {
        throw new SiweError(SiweErrorType.INVALID_TIME_FORMAT);
      }
    }

    /** `expirationTime` conforms to ISO-8601 and is a valid date. */
    if (exists(this.expirationTime)) {
      if (typeof this.expirationTime !== 'string') {
        throw new SiweError(SiweErrorType.INVALID_TIME_FORMAT);
      }

      if (!isValidISO8601Date(this.expirationTime)) {
        throw new SiweError(SiweErrorType.INVALID_TIME_FORMAT);
      }
    }

    /** `notBefore` conforms to ISO-8601 and is a valid date. */
    if (exists(this.notBefore)) {
      if (typeof this.notBefore !== 'string') {
        throw new SiweError(SiweErrorType.INVALID_TIME_FORMAT);
      }

      if (!isValidISO8601Date(this.notBefore)) {
        throw new SiweError(SiweErrorType.INVALID_TIME_FORMAT);
      }
    }

    /** `requestId` is a string if it exists */
    if (exists(this.requestId)) {
      if (typeof this.requestId !== 'string') {
        throw new SiweError('Invalid field type for `requestId`.');
      }
    }

    /** `resources` is an Array of strings if it exists */
    if (exists(this.resources)) {
      if (Array.isArray(this.resources)) {
        if (!this.resources.every(res => typeof res === 'string'))
          throw new SiweError('Invalid field type for `resources`.');
      }
    }
  }
}
