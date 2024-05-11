import { SiweMessage } from './client';
const makeMsgObj = (uri: string, res = undefined, ad = '') => {
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
const makeDateObj = (
  issued = undefined,
  expiration = undefined,
  not = undefined
) => {
  const msg = {
    domain: 'service.org',
    address: '0xe5A12547fe4E872D192E3eCecb76F2Ce1aeA4946',
    statement:
      'I accept the ServiceOrg Terms of Service: https://service.org/tos',
    uri: 'https://service.org',
    version: '1',
    chainId: 1,
    nonce: '12341234',
    issuedAt: '2022-03-17T12:45:13.610Z',
    expirationTime: '2023-03-17T12:45:13.610Z',
    notBefore: '2022-03-17T12:45:13.610Z',
    requestId: 'some_id',
  };
  if (issued) {
    msg.issuedAt = issued;
  }
  if (expiration) {
    msg.expirationTime = expiration;
  }
  if (not) {
    msg.notBefore = not;
  }
  return msg;
};
describe('valid siwe message objects', () => {
  test('missing resources', () => {
    const obj = makeMsgObj('https://sample.org', undefined);
    // console.log('message object');
    // console.dir(obj);
    const msgObj = new SiweMessage(obj);
    expect(msgObj.resources).toBeUndefined();
  });
  test('empty resources', () => {
    const obj = makeMsgObj('https://sample.org', []);
    // console.dir(obj);
    const msgObj = new SiweMessage(obj);
    expect(msgObj.resources.length).toBe(0);
  });
  test('single resources URI', () => {
    const obj = makeMsgObj('https://sample.org', ['ftp://mystuff.com']);
    // console.dir(obj);
    const msgObj = new SiweMessage(obj);
    expect(msgObj.resources[0]).toBe('ftp://mystuff.com');
  });
  test('multiple resources URI', () => {
    const obj = makeMsgObj('https://sample.org', ['ftp://mystuff.com', 'uri:']);
    // console.dir(obj);
    const msgObj = new SiweMessage(obj);
    expect(msgObj.resources[0]).toBe('ftp://mystuff.com');
    expect(msgObj.resources[1]).toBe('uri:');
  });
});
describe('invalid siwe message objects', () => {
  test('invalid address', () => {
    const obj = makeMsgObj(
      'https://sample.org',
      undefined,
      '0xe5a12547fe4E872D192E3eCecb76F2Ce1aeA4946'
    );
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      const re = /.*invalid EIP-55 address/;
      expect(re.test(error)).toBe(true);
    }
  });
  test('invalid URI', () => {
    const obj = makeMsgObj('sample.org');
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      const re = /.*invalid URI/;
      expect(re.test(error)).toBe(true);
    }
  });
  test('invalid resources URI', () => {
    const obj = makeMsgObj('https://sample.org', ['sample.org']);
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      const re = /.*invalid resource URI/;
      expect(re.test(error)).toBe(true);
    }
  });
  test('multiple resources, one invalid resources URI', () => {
    const obj = makeMsgObj('https://sample.org', [
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
      const re = /.*invalid resource URI/;
      // console.log(error);
      expect(re.test(error)).toBe(true);
    }
  });
  test('issuedAt date time - bad syntax', () => {
    const obj = makeMsgObj('https://sample.org', [
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
      const re = /.*invalid resource URI/;
      // console.log(error);
      expect(re.test(error)).toBe(true);
    }
  });
});
describe('invalid date-times', () => {
  test('invalid issuedAt date time syntax', () => {
    const obj = makeDateObj('garbage');
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      const re = /.*invalid issued-at date time syntax/;
      expect(re.test(error)).toBe(true);
    }
  });
  test('invalid issuedAt date time incorrect month', () => {
    const obj = makeDateObj('2022-13-17T12:45:13.610Z');
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      const re = /.*invalid issued-at date time semantics/;
      expect(re.test(error)).toBe(true);
    }
  });
  test('invalid expirationTime syntax', () => {
    const obj = makeDateObj(undefined, 'garbage');
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      const re = /.*invalid expiration-time date time syntax/;
      expect(re.test(error)).toBe(true);
    }
  });
  test('invalid expirationTime incorrect day', () => {
    const obj = makeDateObj(undefined, '2023-03-32T12:45:13.610Z');
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      const re = /.*invalid expiration-time date time semantics/;
      expect(re.test(error)).toBe(true);
    }
  });
  test('invalid notBefore syntax', () => {
    const obj = makeDateObj(undefined, undefined, 'garbage');
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      const re = /.*invalid not-before date time syntax/;
      expect(re.test(error)).toBe(true);
    }
  });
  test('invalid notBefore incorrect hour', () => {
    const obj = makeDateObj(undefined, undefined, '2023-03-32T25:45:13.610Z');
    // console.log('message object');
    // console.dir(obj);
    try {
      new SiweMessage(obj);
      // force the test to fail if the new SiweMessage does not throw
      expect(true).toBe(false);
    } catch (error) {
      // console.log(error);
      const re = /.*invalid not-before date time semantics/;
      expect(re.test(error)).toBe(true);
    }
  });
});
