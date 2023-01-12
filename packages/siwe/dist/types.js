"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SiweErrorType = exports.SiweError = exports.VerifyOptsKeys = exports.VerifyParamsKeys = void 0;
exports.VerifyParamsKeys = [
    'signature',
    'domain',
    'nonce',
    'time',
];
exports.VerifyOptsKeys = [
    'provider',
    'suppressExceptions',
    'verificationFallback',
];
/**
 * Interface used to return errors in SiweResponses.
 */
class SiweError {
    constructor(type, expected, received) {
        this.type = type;
        this.expected = expected;
        this.received = received;
    }
}
exports.SiweError = SiweError;
/**
 * Possible message error types.
 */
var SiweErrorType;
(function (SiweErrorType) {
    /** `expirationTime` is present and in the past. */
    SiweErrorType["EXPIRED_MESSAGE"] = "Expired message.";
    /** `domain` is not a valid authority or is empty. */
    SiweErrorType["INVALID_DOMAIN"] = "Invalid domain.";
    /** `domain` don't match the domain provided for verification. */
    SiweErrorType["DOMAIN_MISMATCH"] = "Domain does not match provided domain for verification.";
    /** `nonce` don't match the nonce provided for verification. */
    SiweErrorType["NONCE_MISMATCH"] = "Nonce does not match provided nonce for verification.";
    /** `address` does not conform to EIP-55 or is not a valid address. */
    SiweErrorType["INVALID_ADDRESS"] = "Invalid address.";
    /** `uri` does not conform to RFC 3986. */
    SiweErrorType["INVALID_URI"] = "URI does not conform to RFC 3986.";
    /** `nonce` is smaller then 8 characters or is not alphanumeric */
    SiweErrorType["INVALID_NONCE"] = "Nonce size smaller then 8 characters or is not alphanumeric.";
    /** `notBefore` is present and in the future. */
    SiweErrorType["NOT_YET_VALID_MESSAGE"] = "Message is not valid yet.";
    /** Signature doesn't match the address of the message. */
    SiweErrorType["INVALID_SIGNATURE"] = "Signature does not match address of the message.";
    /** `expirationTime`, `notBefore` or `issuedAt` not complient to ISO-8601. */
    SiweErrorType["INVALID_TIME_FORMAT"] = "Invalid time format.";
    /** `version` is not 1. */
    SiweErrorType["INVALID_MESSAGE_VERSION"] = "Invalid message version.";
    /** Thrown when some required field is missing. */
    SiweErrorType["UNABLE_TO_PARSE"] = "Unable to parse the message.";
})(SiweErrorType = exports.SiweErrorType || (exports.SiweErrorType = {}));
