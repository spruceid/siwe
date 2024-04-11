import ethers from 'ethers';

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

export const verifyMessage =
  // @ts-expect-error -- ethers v6 compatibility hack
  ethers?.utils.verifyMessage ??
  (ethers?.verifyMessage as (
    message: Uint8Array | string,
    sig: Ethers6SignatureLike
  ) => string);

export const hashMessage =
  // @ts-expect-error -- ethers v6 compatibility hack
  ethers.utils?.hashMessage ??
  (ethers?.hashMessage as (message: Uint8Array | string) => string);

export const getAddress =
  // @ts-expect-error -- ethers v6 compatibility hack
  ethers.utils?.getAddress ??
  (ethers?.getAddress as (address: string) => string);
