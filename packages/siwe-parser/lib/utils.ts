import { id } from '@ethersproject/hash';

/**
 * This method is supposed to check if an address is conforming to EIP-55.
 * @param address Address to be checked if conforms with EIP-55.
 * @returns Either the return is or not in the EIP-55 format.
 */
export const isEIP55Address = (address: string) => {
    const lowerAddress = `${address}`.toLowerCase().replace('0x', '')
    var hash = id(lowerAddress).replace('0x', '')
    var ret = '0x'

    for (var i = 0; i < lowerAddress.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            ret += lowerAddress[i].toUpperCase()
        } else {
            ret += lowerAddress[i]
        }
    }
    return address === ret;
}
