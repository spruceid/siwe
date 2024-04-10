import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex } from '@noble/hashes/utils';
/**
 * This method is supposed to check if an address is conforming to EIP-55.
 * @param address Address to be checked if conforms with EIP-55.
 * @returns Either the return is or not in the EIP-55 format.
 */
export const isEIP55Address = (address: string) => {
    if (address.length != 42) {
        return false;
    }

    const lowerAddress = `${address}`.toLowerCase().replace('0x', '');
    const hash = bytesToHex(keccak_256(lowerAddress));
    let ret = '0x';

    for (let i = 0; i < lowerAddress.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            ret += lowerAddress[i].toUpperCase();
        } else {
            ret += lowerAddress[i];
        }
    }
    return address === ret;
}

export const parseIntegerNumber = (number: string): number => {
    const parsed = parseInt(number);
    if (isNaN(parsed)) throw new Error("Invalid number.");
    if (parsed === Infinity) throw new Error("Invalid number.");
    return parsed;
}
