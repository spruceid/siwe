import { Wallet } from 'ethers';
import { SiweMessage } from './client';
import * as ethersCompat from './ethersCompat';
import * as utils from './utils';

function exampleMessage(address: string): SiweMessage {
  return new SiweMessage({
    address,
    domain: 'login.xyz',
    statement: 'Sign-In With Ethereum Example Statement',
    uri: 'https://login.xyz',
    version: '1',
    nonce: 'bTyXgcQxn2htgkjJn',
    issuedAt: '2022-01-27T17:09:38.578Z',
    chainId: 1,
  });
}

describe('Multisig / EIP-1271 signature routing', () => {
  let errorSpy: jest.SpyInstance;
  let verifySpy: jest.SpyInstance;
  let eip1271Spy: jest.SpyInstance;

  beforeEach(() => {
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    verifySpy = jest.spyOn(ethersCompat, 'verifyMessage');
    eip1271Spy = jest
      .spyOn(utils, 'checkContractWalletSignature')
      .mockResolvedValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('skips ecrecover for contract-wallet signatures longer than 65 bytes', async () => {
    const msg = exampleMessage('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    // 80-byte signature, typical of concatenated Safe / multisig owner sigs
    const signature = `0x${'ab'.repeat(80)}`;

    const result = await msg.verify(
      { signature },
      { provider: {} as any, suppressExceptions: true }
    );

    expect(verifySpy).not.toHaveBeenCalled();
    expect(eip1271Spy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  test('skips ecrecover for 66-byte contract-wallet signatures', async () => {
    const msg = exampleMessage('0x0e565A6dFc43DE21455a67bbF196f7F7b15447A7');
    // Loopring-style: 65-byte ECDSA plus a trailing type byte
    const signature = `0x${'cd'.repeat(66)}`;

    const result = await msg.verify(
      { signature },
      { provider: {} as any, suppressExceptions: true }
    );

    expect(verifySpy).not.toHaveBeenCalled();
    expect(eip1271Spy).toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(result.success).toBe(true);
  });

  test('still recovers 65-byte EOA signatures with ecrecover', async () => {
    const wallet = Wallet.createRandom();
    const msg = exampleMessage(wallet.address);
    const signature = await wallet.signMessage(msg.toMessage());
    const hex = signature.startsWith('0x') ? signature.slice(2) : signature;
    expect(hex.length).toBe(130);

    const result = await msg.verify({ signature });

    expect(verifySpy).toHaveBeenCalled();
    expect(result.success).toBeTruthy();
  });

  test('still attempts ecrecover for 64-byte compact signatures', async () => {
    const msg = exampleMessage('0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');
    const signature = `0x${'ab'.repeat(64)}`;

    await msg.verify(
      { signature },
      { provider: {} as any, suppressExceptions: true }
    );

    expect(verifySpy).toHaveBeenCalled();
  });
});
