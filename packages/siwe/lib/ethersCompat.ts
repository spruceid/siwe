type Ethers6BigNumberish = string | number | bigint;

// NB: This compatibility type omits the `Signature` class defined in ethers v6;
// however, a `Signature` instance is compatible with the object type defined.
type Ethers6SignatureLike =
  | string
  | {
      r: string;
      s: string;
      v: Ethers6BigNumberish;
      yParity?: 0 | 1;
      yParityAndS?: string;
    }
  | {
      r: string;
      yParityAndS: string;
      yParity?: 0 | 1;
      s?: string;
      v?: number;
    }
  | {
      r: string;
      s: string;
      yParity: 0 | 1;
      v?: Ethers6BigNumberish;
      yParityAndS?: string;
    };

let ethersVerifyMessage = null;
let ethersHashMessage = null;
let ethersGetAddress = null;

try {
  const { utils } = require('ethers');
  ethersVerifyMessage = utils.verifyMessage;
  ethersHashMessage = utils.hashMessage;
  ethersGetAddress = utils.getAddress;
} catch (error) {
  const { verifyMessage, getAddress, hashMessage } = require('ethers');

  ethersVerifyMessage = verifyMessage as (
    message: Uint8Array | string,
    sig: Ethers6SignatureLike
  ) => string;

  ethersHashMessage = hashMessage as (message: Uint8Array | string) => string;

  ethersGetAddress = getAddress as (address: string) => string;
}

export const verifyMessage = ethersVerifyMessage;
export const hashMessage = ethersHashMessage;
export const getAddress = ethersGetAddress;
