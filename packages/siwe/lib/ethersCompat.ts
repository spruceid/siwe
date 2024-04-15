import { ethers } from 'ethers';

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
  // @ts-expect-error -- v6 compatibility hack
  ethersVerifyMessage = ethers.utils.verifyMessage;
  // @ts-expect-error -- v6 compatibility hack
  ethersHashMessage = ethers.utils.hashMessage;
  // @ts-expect-error -- v6 compatibility hack
  ethersGetAddress = ethers.utils.getAddress;
} catch {
  ethersVerifyMessage = ethers.verifyMessage as (
    message: Uint8Array | string,
    sig: Ethers6SignatureLike
  ) => string;

  ethersHashMessage = ethers.hashMessage as (
    message: Uint8Array | string
  ) => string;

  ethersGetAddress = ethers.getAddress as (address: string) => string;
}

// @ts-expect-error -- v6 compatibility hack
type ProviderV5 = ethers.providers.Provider
type ProviderV6 = ethers.Provider

export type Provider = ProviderV6 extends undefined ? ProviderV5 : ProviderV6
export const verifyMessage = ethersVerifyMessage;
export const hashMessage = ethersHashMessage;
export const getAddress = ethersGetAddress;
