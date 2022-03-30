import { SiweMessage } from "./client";

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


/** 
 * Returned on verifications.
*/
export interface SiweResponse {
    /** Boolean representing if the message was verified with success. */
    success: boolean;

    /** If present `success` MUST be false and will provide extra information on the failure reason. */
    error?: SiweError;

    /** Original message that was verified. */
    data: SiweMessage;
}

/**
 * Interface used to return errors in SiweResponses.
 */
export class SiweError {

    constructor(type: SiweErrorType, expected?: string, received?: string) {
        this.type = type;
        this.expected = expected;
        this.received = received;
    }

    /** Type of the error. */
    type: SiweErrorType;

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

    /** `domain` don't match the domain provided for validation. */
    DOMAIN_MISMATCH = 'Domain do not match provided domain for validation.',

    /** `nonce` don't match the nonce provided for validation. */
    NONCE_MISMATCH = 'Nonce do not match provided nonce for validation.',

    /** `address` does not conform to EIP-55 or is not a valid address. */
    INVALID_ADDRESS = 'Invalid address.',

    /** `uri` does not conform to RFC 3986. */
    INVALID_URI = 'Invalid address.',

    /** `nonce` is smaller then 8 characters or is not alphanumeric */
    INVALID_NONCE = 'Nonce size smaller then 8 characters or is not alphanumeric',

    /** `notBefore` is present and in the future. */
    NOT_YET_VALID_MESSAGE = 'Message is not valid yet.',

    /** Signature doesn't match the address of the message. */
    INVALID_SIGNATURE = 'Signature do not match address of the message.',

    /** `expirationTime`, `notBefore` or `issuedAt` not complient to ISO-8601. */
    INVALID_TIME_FORMAT = 'Invalid time format.',

    /** `version` is not 1. */
    INVALID_MESSAGE_VERSION = 'Invalid message version.',

    /** Thrown when some required field is missing. */
    UNABLE_TO_PARSE = 'Unable to parse the message.',
}
