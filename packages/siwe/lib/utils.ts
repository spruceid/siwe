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
  return randomStringForEntropy(96);
};

export const checkInvalidKeys = <T>(obj: T, keys: Array<keyof T>) : Array<keyof T> => {
  const invalidKeys: Array<keyof T> = [];
  Object.keys(obj).forEach(key => {
    if (!keys.includes(key as keyof T)) {
      invalidKeys.push(key as keyof T);
    }
  });
  return invalidKeys;
}
