import { providers } from 'ethers';

export interface VerifyParams {
  /** Signature of the message signed by the wallet */
  signature: string;

  /** RFC 4501 dns authority that is requesting the signing. */
  domain?: string;

  /** Randomized token used to prevent replay attacks, at least 8 alphanumeric characters. */
  nonce?: string;

  /**ISO 8601 datetime string of the current time. */
  time?: string;
}

export const VerifyParamsKeys: Array<keyof VerifyParams> = [
  'signature',
  'domain',
  'nonce',
  'time',
];

export interface VerifyOpts {
  /** ethers provider to be used for EIP-1271 validation */
  provider?: providers.Provider;
}

export const VerifyOptsKeys: Array<keyof VerifyOpts> = ['provider'];

/**
 * Interface used to return errors in SiweResponses.
 */
export class SiweError {
  constructor(
    type: SiweErrorType | string,
    expected?: string,
    received?: string
  ) {
    this.type = type;
    this.expected = expected;
    this.received = received;
  }

  /** Type of the error. */
  type: SiweErrorType | string;

  /** Expected value or condition to pass. */
  expected?: string;

  /** Received value that caused the failure. */
  received?: string;
}

/**
 * Possible message error types.
 */
export enum SiweErrorType {
  /** `expirationTime` is present and in the past. */
  EXPIRED_MESSAGE = 'Expired message.',

  /** `domain` is not a valid authority or is empty. */
  INVALID_DOMAIN = 'Invalid domain.',

  /** `domain` don't match the domain provided for verification. */
  DOMAIN_MISMATCH = 'Domain does not match provided domain for verification.',

  /** `nonce` don't match the nonce provided for verification. */
  NONCE_MISMATCH = 'Nonce does not match provided nonce for verification.',

  /** `address` does not conform to EIP-55 or is not a valid address. */
  INVALID_ADDRESS = 'Invalid address.',

  /** `uri` does not conform to RFC 3986. */
  INVALID_URI = 'URI does not conform to RFC 3986.',

  /** `nonce` is smaller then 8 characters or is not alphanumeric */
  INVALID_NONCE = 'Nonce size smaller then 8 characters or is not alphanumeric.',

  /** `notBefore` is present and in the future. */
  NOT_YET_VALID_MESSAGE = 'Message is not valid yet.',

  /** Signature doesn't match the address of the message. */
  INVALID_SIGNATURE = 'Signature does not match address of the message.',

  /** `expirationTime`, `notBefore` or `issuedAt` not complient to ISO-8601. */
  INVALID_TIME_FORMAT = 'Invalid time format.',

  /** `version` is not 1. */
  INVALID_MESSAGE_VERSION = 'Invalid message version.',

  /** `statement` is not valid. */
  INVALID_MESSAGE_STATEMENT = 'Invalid message statement.',

  /** `chainId` is not valid. */
  INVALID_CHAIN_ID = 'Invalid chainId.',

  /** `requestId` is not valid. */
  INVALID_REQUEST_ID = 'Invalid requestId.',

  /** `resources` is not valid. */
  INVALID_RESOURCES = 'Invalid resources.',

  /** Thrown when some required field is missing. */
  UNABLE_TO_PARSE = 'Unable to parse the message.',
}
