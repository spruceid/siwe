import { ParsedMessage } from "./abnf";
const doResources = function doResources(uri: string) {
  let msg = "";
  msg += "service.org wants you to sign in with your Ethereum account:\n";
  msg += "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n";
  msg += "\n";
  msg += "\n";
  msg += `URI: https://example.com\n`;
  msg += "Version: 1\n";
  msg += "Chain ID: 1\n";
  msg += "Nonce: 32891757\n";
  msg += "Issued At: 2021-09-30T16:25:24.000Z\n";
  msg += "Resources:\n";
  msg += `- ${uri}`;
  // console.log(msg);
  return new ParsedMessage(msg);
};
let result;
let uri;

describe("test resource URI with IPv4 addresses", () => {
  // NOTE: The reason for using the IP-literal form for host to test the IPv4address
  //       is that attempting to test the IPv4address form directly does not correctly
  //       identify malformed IPv4address. If it fails, for example with 1.1.1.256, then
  //       the host rule will simply move on to the reg-name alternative and it will succeed.
  //       That is, host = 1.1.1.256 is valid, but because it is a reg-name not an IPv4address.
  test("bad octets", () => {
    expect(() => {
      doResources("uri://[::0.0.0.256]/p/path");
    }).toThrow();
    expect(() => {
      doResources("uri://[::300.0.0.0]/p/path");
    }).toThrow();
    expect(() => {
      doResources("uri://[::0.ff.0.255]/p/path");
    }).toThrow();
    expect(() => {
      doResources("uri://[::0.0.256.0]/p/path");
    }).toThrow();
  });
  test("resource URI - simple uri", () => {
    result = doResources("uri://example.com");
    // console.dir(result);
    expect(result.resources[0]).toBe("uri://example.com");
  });
  test("resource URI - IPv4address 1", () => {
    uri = "uri://[::10.10.10.10]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
  });
  test("resource URI - IPv4address 2", () => {
    uri = "uri://[::000.000.010.001]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
  });
  test("resource URI - IPv4address 3", () => {
    uri = "uri://[::001.099.200.255]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
  });
});
describe("resource URI - test IPv6 addresses", () => {
  test("IPv6address no double colon", () => {
    uri = "uri://[ffff:abcd:0:10:200:3000:f8a:1]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[ffff:abcd:0:10:200:3000:255.255.255.255]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    expect(() => {
      // too many 16-bit digits
      doResources("uri://[ffff:abcd:0:10:200:3000:f8a:1:ffff]");
    }).toThrow();
    expect(() => {
      // too few 16-bit digits
      doResources("uri://[ffff:abcd:0:10:200:3000:f8a]");
    }).toThrow();
    expect(() => {
      // too many 16-bit digits
      doResources("uri://[ffff:abcd:0:10:200:3000:ff:255.255.255.255]");
    }).toThrow();
    expect(() => {
      // too few 16-bit digits
      doResources("uri://[ffff:abcd:0:10:200:255.255.255.255]");
    }).toThrow();
  });
  test("resource URI - IPv6address leading double colon WITHOUT IPv4", () => {
    uri = "uri://[::]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[::ffff]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[::1:2:3:4:5:6:7]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    expect(() => {
      // too many 16-bit digits
      doResources("uri://[::1:2:3:4:5:6:7:8]");
    }).toThrow();
  });
  test("resource URI - IPv6address leading double colon WITH IPv4", () => {
    uri = "uri://[::198.162.10.255]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[::ffff:198.162.10.255]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[::1:2:3:4:5:198.162.10.255]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    expect(() => {
      // too many 16-bit digits
      doResources("uri://[::1:2:3:4:5:6:198.162.10.255]");
    }).toThrow();
  });
  test("resource URI - IPv6address trailing double colon WITHOUT IPv4", () => {
    uri = "uri://[1::]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[1:2:3:4:5:6:7::]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    expect(() => {
      // too many 16-bit digits
      doResources("uri://[1:2:3:4:5:6:7:8::]");
    }).toThrow();
  });
  test("resource URI - IPv6address trailing double colon WITH IPv4", () => {
    uri = "uri://[1::198.162.10.255]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[1:2:3:4:5::198.162.10.255]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    expect(() => {
      // too many 16-bit digits
      doResources("uri://[1:2:3:4:5:6::198.162.10.255]");
    }).toThrow();
  });
  test("resource URI - IPv6address leading & trailing double colon WITHOUT IPv4", () => {
    uri = "uri://[1::2]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[1:2:3:4:5:6::7]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[ffff:aaaa:bbbb::cccc:dddd:eeee:9999]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    expect(() => {
      // too many 16-bit digits
      doResources("uri://[1:2:3:4:5::6:7:8]");
    }).toThrow();
  });
  test("resource URI - IPv6address leading & trailing double colon WITH IPv4", () => {
    uri = "uri://[1::2:198.162.10.255]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[1:2:3:4::7:198.162.10.255]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    uri = "uri://[ffff:aaaa:bbbb::cccc:dddd:198.162.10.255]";
    result = doResources(uri);
    expect(result.resources[0]).toBe(uri);
    expect(() => {
      // too many 16-bit digits
      doResources("uri://[1:2:3:4:5::6:198.162.10.255]");
    }).toThrow();
  });
});
