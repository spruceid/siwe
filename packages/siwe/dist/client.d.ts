import { providers } from 'ethers';
import { SiweResponse, VerifyOpts, VerifyParams } from './types';
export declare class SiweMessage {
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
    constructor(param: string | Partial<SiweMessage>);
    /**
     * This function can be used to retrieve an EIP-4361 formated message for
     * signature, although you can call it directly it's advised to use
     * [prepareMessage()] instead which will resolve to the correct method based
     * on the [type] attribute of this object, in case of other formats being
     * implemented.
     * @returns {string} EIP-4361 formated message, ready for EIP-191 signing.
     */
    toMessage(): string;
    /**
     * This method parses all the fields in the object and creates a messaging for signing
     * message according with the type defined.
     * @returns {string} Returns a message ready to be signed according with the
     * type defined in the object.
     */
    prepareMessage(): string;
    /**
     * @deprecated
     * Verifies the integrity of the object by matching its signature.
     * @param signature Signature to match the address in the message.
     * @param provider Ethers provider to be used for EIP-1271 validation
     */
    validate(signature: string, provider?: providers.Provider): Promise<SiweMessage>;
    /**
     * Verifies the integrity of the object by matching its signature.
     * @param params Parameters to verify the integrity of the message, signature is required.
     * @returns {Promise<SiweMessage>} This object if valid.
     */
    verify(params: VerifyParams, opts?: VerifyOpts): Promise<SiweResponse>;
    /**
     * Validates the values of this object fields.
     * @throws Throws an {ErrorType} if a field is invalid.
     */
    private validateMessage;
}
