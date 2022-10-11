import { randomStringForEntropy } from '@stablelib/random';
import { Contract, providers, Signer, utils } from 'ethers';
import type { SiweMessage } from './client';

const EIP1271_ABI = ["function isValidSignature(bytes32 _message, bytes _signature) public view returns (bytes4)"];
const EIP1271_MAGICVALUE = "0x1626ba7e";

/**
 * This method calls the EIP-1271 method for Smart Contract wallets
 * @param message The EIP-4361 parsed message
 * @param provider Web3 provider able to perform a contract check (Web3/EthersJS).
 * @returns {Promise<boolean>} Checks for the smart contract (if it exists) if
 * the signature is valid for given address.
 */
export const checkContractWalletSignature = async (
  message: SiweMessage,
  signature: string,
  provider?: providers.Provider | Signer
): Promise<boolean> => {
  if (!provider) {
    return false;
  }

  const walletContract = new Contract(message.address, EIP1271_ABI, provider);
  const hashMessage = utils.hashMessage(message.prepareMessage());
  const res = await walletContract.isValidSignature(
    hashMessage,
    signature
  );
  return res == EIP1271_MAGICVALUE;
};

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
export const generateNonce = (): string => {
  const nonce = randomStringForEntropy(96);
  if (!nonce || nonce.length < 8) {
    throw new Error('Error during nonce creation.');
  }
  return nonce;
};

/**
 * This method matches the given date string against the ISO-8601 regex and also
 * performs checks if it's a valid date.
 * @param date any string to be validated against ISO-8601
 * @returns boolean indicating if the providade date is valid and conformant to ISO-8601
 */
export const isValidISO8601Date = (date: string): boolean => {
  const ISO8601 =
    /^[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/;

  /** Fails if it's not ISO-8601 */
  if (!ISO8601.test(date)) {
    return false;
  }

  /* Parses date and compare if the generated date matches the input */
  const parsedDate = new Date(date).toISOString();

  /* Since milliseconds are optional and toISOString() adds .000 if none it's still needed to validate that case */
  if (parsedDate !== date) {
    /* Splits dateTime from milliseconds and timezone */
    const [dateTime, milliseconds] = date.split(".");
    const [parsedDateTime, parsedMilliseconds] = parsedDate.split(".");

    /* Removes timezone from milliseconds */
    milliseconds?.replace(/(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))/, "");
    parsedMilliseconds?.replace(/(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))/, "");

    /* If milliseconds they should match */
    if (milliseconds && (parsedMilliseconds !== milliseconds)) {
      return false;
    }

    /* Date and time doesn't match */
    if (dateTime !== parsedDateTime) {
      return false;
    }
  }
  return true;
}

export const checkInvalidKeys = <T>(obj: T, keys: Array<keyof T>) : Array<keyof T> => {
  const invalidKeys: Array<keyof T> = [];
  Object.keys(obj).forEach(key => {
    if (!keys.includes(key as keyof T)) {
      invalidKeys.push(key as keyof T);
    }
  });
  return invalidKeys;
}
