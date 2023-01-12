"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseIntegerNumber = exports.isEIP55Address = void 0;
const sha3_1 = require("@noble/hashes/sha3");
const utils_1 = require("@noble/hashes/utils");
/**
 * This method is supposed to check if an address is conforming to EIP-55.
 * @param address Address to be checked if conforms with EIP-55.
 * @returns Either the return is or not in the EIP-55 format.
 */
const isEIP55Address = (address) => {
    if (address.length != 42) {
        return false;
    }
    const lowerAddress = `${address}`.toLowerCase().replace("0x", "");
    var hash = (0, utils_1.bytesToHex)((0, sha3_1.keccak_256)(lowerAddress));
    var ret = "0x";
    for (var i = 0; i < lowerAddress.length; i++) {
        if (parseInt(hash[i], 16) >= 8) {
            ret += lowerAddress[i].toUpperCase();
        }
        else {
            ret += lowerAddress[i];
        }
    }
    return address === ret;
};
exports.isEIP55Address = isEIP55Address;
const parseIntegerNumber = (number) => {
    const parsed = parseInt(number);
    //if(parsed === NaN) throw new Error("Invalid number.");
    if (parsed === Infinity)
        throw new Error("Invalid number.");
    return parsed;
};
exports.parseIntegerNumber = parseIntegerNumber;
