import { randomStringForEntropy } from '@stablelib/random';
import { Contract, utils } from 'ethers';
import type { SiweMessage } from './client';

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

/**
 * This method is supposed to check if an address is conforming to EIP-55.
 * @param address Address to be checked if conforms with EIP-55.
 * @returns Either the return is or not in the EIP-55 format.
 */
export const isEIP55Address = (address: string) => {
	return address === utils.getAddress(address)
}
