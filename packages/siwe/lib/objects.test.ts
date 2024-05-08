import { SiweMessage } from './client';
const makeMsgOb = (uri: string, res = undefined, ad = '') => {
  const msg = {
    domain: 'service.org',
    address: '0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946',
    statement:
      'I accept the ServiceOrg Terms of Service: https://service.org/tos',
    uri: uri,
    version: '1',
    chainId: 1,
    nonce: '12341234',
    issuedAt: '2022-03-17T12:45:13.610Z',
    expirationTime: '2023-03-17T12:45:13.610Z',
    notBefore: '2022-03-17T12:45:13.610Z',
    requestId: 'some_id',
    resources: undefined,
  };
  if (ad !== '') {
    msg.address = ad;
  }
  if (res !== undefined) {
    msg.resources = res;
  }
  return msg;
};
describe('valid siwe message objects', () => {
  test('missing resources', () => {
    const obj = makeMsgOb('https://sample.org', undefined);
    // console.log('message object');
    // console.dir(obj);
    const msgObj = new SiweMessage(obj);
    expect(msgObj.resources).toBeUndefined();
  });
  test('empty resources', () => {
    const obj = makeMsgOb('https://sample.org', []);
    // console.dir(obj);
    const msgObj = new SiweMessage(obj);
    expect(msgObj.resources.length).toBe(0);
  });
  test('single resources URI', () => {
    const obj = makeMsgOb('https://sample.org', ['ftp://mystuff.com']);
    // console.dir(obj);
    const msgObj = new SiweMessage(obj);
    expect(msgObj.resources[0]).toBe('ftp://mystuff.com');
  });
  test('multiple resources URI', () => {
    const obj = makeMsgOb('https://sample.org', ['ftp://mystuff.com', 'uri:']);
    // console.dir(obj);
    const msgObj = new SiweMessage(obj);
    expect(msgObj.resources[0]).toBe('ftp://mystuff.com');
    expect(msgObj.resources[1]).toBe('uri:');
  });
});
describe('invalid siwe message objects', () => {
  test('invalid address', () => {
    const obj = makeMsgOb(
      'https://sample.org',
      undefined,
      '0xe5a12547fe4E872D192E3eCecb76F2Ce1aeA4946'
    );
    // console.log('message object');
    // console.dir(obj);
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      // console.log(error);
      expect(error.shortMessage).toBe('bad address checksum');
    }
  });
  test('invalid URI', () => {
    const obj = makeMsgOb('sample.org');
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      expect(error.type).toBe('URI does not conform to RFC 3986.');
    }
  });
  test('invalid resources URI', () => {
    const obj = makeMsgOb('https://sample.org', ['sample.org']);
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      expect(error.type).toBe('URI does not conform to RFC 3986.');
    }
  });
  test('multiple resources, one invalid resources URI', () => {
    const obj = makeMsgOb('https://sample.org', [
      'https://sample.org',
      '//sample.org',
    ]);
    // console.log('message object');
    // console.dir(obj);
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      // console.log(error);
      expect(error.type).toBe('URI does not conform to RFC 3986.');
    }
  });
});
