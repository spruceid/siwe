"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkInvalidKeys = exports.isValidISO8601Date = exports.generateNonce = exports.checkContractWalletSignature = void 0;
const random_1 = require("@stablelib/random");
const ethers_1 = require("ethers");
const EIP1271_ABI = ["function isValidSignature(bytes32 _message, bytes _signature) public view returns (bytes4)"];
const EIP1271_MAGICVALUE = "0x1626ba7e";
const ISO8601 = /^(?<date>[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/;
/**
 * This method calls the EIP-1271 method for Smart Contract wallets
 * @param message The EIP-4361 parsed message
 * @param provider Web3 provider able to perform a contract check (Web3/EthersJS).
 * @returns {Promise<boolean>} Checks for the smart contract (if it exists) if
 * the signature is valid for given address.
 */
const checkContractWalletSignature = async (message, signature, provider) => {
    if (!provider) {
        return false;
    }
    const walletContract = new ethers_1.Contract(message.address, EIP1271_ABI, provider);
    const hashMessage = ethers_1.utils.hashMessage(message.prepareMessage());
    const res = await walletContract.isValidSignature(hashMessage, signature);
    return res == EIP1271_MAGICVALUE;
};
exports.checkContractWalletSignature = checkContractWalletSignature;
/**
 * This method leverages a native CSPRNG with support for both browser and Node.js
 * environments in order generate a cryptographically secure nonce for use in the
 * SiweMessage in order to prevent replay attacks.
 *
 * 96 bits has been chosen as a number to sufficiently balance size and security considerations
 * relative to the lifespan of it's usage.
 *
 * @returns cryptographically generated random nonce with 96 bits of entropy encoded with
 * an alphanumeric character set.
 */
const generateNonce = () => {
    const nonce = (0, random_1.randomStringForEntropy)(96);
    if (!nonce || nonce.length < 8) {
        throw new Error('Error during nonce creation.');
    }
    return nonce;
};
exports.generateNonce = generateNonce;
/**
 * This method matches the given date string against the ISO-8601 regex and also
 * performs checks if it's a valid date.
 * @param inputDate any string to be validated against ISO-8601
 * @returns boolean indicating if the providade date is valid and conformant to ISO-8601
 */
const isValidISO8601Date = (inputDate) => {
    /* Split groups and make sure inputDate is in ISO8601 format */
    const inputMatch = ISO8601.exec(inputDate);
    /* if inputMatch is null the date is not ISO-8601 */
    if (!inputDate) {
        return false;
    }
    /* Creates a date object with input date to parse for invalid days e.g. Feb, 30 -> Mar, 01 */
    const inputDateParsed = new Date(inputMatch.groups.date).toISOString();
    /* Get groups from new parsed date to compare with the original input */
    const parsedInputMatch = ISO8601.exec(inputDateParsed);
    /* Compare remaining fields */
    return inputMatch.groups.date === parsedInputMatch.groups.date;
};
exports.isValidISO8601Date = isValidISO8601Date;
const checkInvalidKeys = (obj, keys) => {
    const invalidKeys = [];
    Object.keys(obj).forEach(key => {
        if (!keys.includes(key)) {
            invalidKeys.push(key);
        }
    });
    return invalidKeys;
};
exports.checkInvalidKeys = checkInvalidKeys;
