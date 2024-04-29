import { ParsedMessage } from "./abnf";
const doUri = function doUri(uri: string) {
  let msg14 = "";
  msg14 += "service.org wants you to sign in with your Ethereum account:\n";
  msg14 += "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n";
  msg14 += "\n";
  msg14 += "\n";
  msg14 += `URI: ${uri}\n`;
  msg14 += "Version: 1\n";
  msg14 += "Chain ID: 1\n";
  msg14 += "Nonce: 32891757\n";
  msg14 += "Issued At: 2021-09-30T16:25:24.000Z";
  return new ParsedMessage(msg14);
};
let result;

describe("test IPv4 addresses", () => {
  // NOTE: The reason for using the IP-literal form for host to test the IPv4address
  //       is that attempting to test the IPv4address form directly does not correctly
  //       identify malformed IPv4address. If it fails, for example with 1.1.1.256, then
  //       the host rule will simply move on to the reg-name alternative and it will succeed.
  //       That is, host = 1.1.1.256 is valid, but because it is a reg-name not an IPv4address.
  test("bad octets", () => {
    expect(() => {
      doUri("uri://[::0.0.0.256]/p/path");
    }).toThrow();
    expect(() => {
      doUri("uri://[::300.0.0.0]/p/path");
    }).toThrow();
    expect(() => {
      doUri("uri://[::0.ff.0.255]/p/path");
    }).toThrow();
    expect(() => {
      doUri("uri://[::0.0.256.0]/p/path");
    }).toThrow();
  });
  test("IPv4address 1", () => {
    result = doUri("uri://[::10.10.10.10]");
    expect(result.uriElements.host).toBe("::10.10.10.10");
  });
  test("IPv4address 2", () => {
    result = doUri("uri://[::000.000.010.001]");
    expect(result.uriElements.host).toBe("::000.000.010.001");
  });
  test("IPv4address 3", () => {
    result = doUri("uri://[::001.099.200.255]");
    expect(result.uriElements.host).toBe("::001.099.200.255");
  });
});
describe("test IPv6 addresses", () => {
  test("IPv6address no double colon", () => {
    result = doUri("uri://[ffff:abcd:0:10:200:3000:f8a:1]");
    expect(result.uriElements.host).toBe("ffff:abcd:0:10:200:3000:f8a:1");
    result = doUri("uri://[ffff:abcd:0:10:200:3000:255.255.255.255]");
    expect(result.uriElements.host).toBe(
      "ffff:abcd:0:10:200:3000:255.255.255.255"
    );
    expect(() => {
      // too many 16-bit digits
      doUri("uri://[ffff:abcd:0:10:200:3000:f8a:1:ffff]");
    }).toThrow();
    expect(() => {
      // too few 16-bit digits
      doUri("uri://[ffff:abcd:0:10:200:3000:f8a]");
    }).toThrow();
    expect(() => {
      // too many 16-bit digits
      doUri("uri://[ffff:abcd:0:10:200:3000:ff:255.255.255.255]");
    }).toThrow();
    expect(() => {
      // too few 16-bit digits
      doUri("uri://[ffff:abcd:0:10:200:255.255.255.255]");
    }).toThrow();
  });
  test("IPv6address leading double colon WITHOUT IPv4", () => {
    result = doUri("uri://[::]");
    expect(result.uriElements.host).toBe("::");
    result = doUri("uri://[::ffff]");
    expect(result.uriElements.host).toBe("::ffff");
    result = doUri("uri://[::1:2:3:4:5:6:7]");
    expect(result.uriElements.host).toBe("::1:2:3:4:5:6:7");
    expect(() => {
      // too many 16-bit digits
      doUri("uri://[::1:2:3:4:5:6:7:8]");
    }).toThrow();
  });
  test("IPv6address leading double colon WITH IPv4", () => {
    result = doUri("uri://[::198.162.10.255]");
    expect(result.uriElements.host).toBe("::198.162.10.255");
    result = doUri("uri://[::ffff:198.162.10.255]");
    expect(result.uriElements.host).toBe("::ffff:198.162.10.255");
    result = doUri("uri://[::1:2:3:4:5:198.162.10.255]");
    expect(result.uriElements.host).toBe("::1:2:3:4:5:198.162.10.255");
    expect(() => {
      // too many 16-bit digits
      doUri("uri://[::1:2:3:4:5:6:198.162.10.255]");
    }).toThrow();
  });
  test("IPv6address trailing double colon WITHOUT IPv4", () => {
    result = doUri("uri://[1::]");
    expect(result.uriElements.host).toBe("1::");
    result = doUri("uri://[1:2:3:4:5:6:7::]");
    expect(result.uriElements.host).toBe("1:2:3:4:5:6:7::");
    expect(() => {
      // too many 16-bit digits
      doUri("uri://[1:2:3:4:5:6:7:8::]");
    }).toThrow();
  });
  test("IPv6address trailing double colon WITH IPv4", () => {
    result = doUri("uri://[1::198.162.10.255]");
    expect(result.uriElements.host).toBe("1::198.162.10.255");
    result = doUri("uri://[1:2:3:4:5::198.162.10.255]");
    expect(result.uriElements.host).toBe("1:2:3:4:5::198.162.10.255");
    expect(() => {
      // too many 16-bit digits
      doUri("uri://[1:2:3:4:5:6::198.162.10.255]");
    }).toThrow();
  });
  test("IPv6address leading & trailing double colon WITHOUT IPv4", () => {
    result = doUri("uri://[1::2]");
    expect(result.uriElements.host).toBe("1::2");
    result = doUri("uri://[1:2:3:4:5:6::7]");
    expect(result.uriElements.host).toBe("1:2:3:4:5:6::7");
    result = doUri("uri://[ffff:aaaa:bbbb::cccc:dddd:eeee:9999]");
    expect(result.uriElements.host).toBe("ffff:aaaa:bbbb::cccc:dddd:eeee:9999");
    expect(() => {
      // too many 16-bit digits
      doUri("uri://[1:2:3:4:5::6:7:8]");
    }).toThrow();
  });
  test("IPv6address leading & trailing double colon WITH IPv4", () => {
    result = doUri("uri://[1::2:198.162.10.255]");
    expect(result.uriElements.host).toBe("1::2:198.162.10.255");
    result = doUri("uri://[1:2:3:4::7:198.162.10.255]");
    expect(result.uriElements.host).toBe("1:2:3:4::7:198.162.10.255");
    result = doUri("uri://[ffff:aaaa:bbbb::cccc:dddd:198.162.10.255]");
    expect(result.uriElements.host).toBe(
      "ffff:aaaa:bbbb::cccc:dddd:198.162.10.255"
    );
    expect(() => {
      // too many 16-bit digits
      doUri("uri://[1:2:3:4:5::6:198.162.10.255]");
    }).toThrow();
  });
});
