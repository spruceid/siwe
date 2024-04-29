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

describe("reproduce uri-js tests", () => {
  test("scheme", () => {
    const result = doUri("uri:");
    // console.dir(result);
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBeUndefined();
    expect(result.uriElements.port).toBeUndefined();
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("userinfo", () => {
    const result = doUri("uri://@");
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBe("");
    expect(result.uriElements.host).toBe("");
    expect(result.uriElements.port).toBeUndefined();
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("empty host", () => {
    const result = doUri("uri://@:");
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBe("");
    expect(result.uriElements.host).toBe("");
    expect(result.uriElements.port).toBe("");
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("host", () => {
    const result = doUri("uri://");
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBe("");
    expect(result.uriElements.port).toBeUndefined();
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("port", () => {
    const result = doUri("uri://:");
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBe("");
    expect(result.uriElements.port).toBe("");
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("query", () => {
    const result = doUri("uri:?");
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBeUndefined();
    expect(result.uriElements.port).toBeUndefined();
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBe("");
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("fragment", () => {
    const result = doUri("uri:#");
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBeUndefined();
    expect(result.uriElements.port).toBeUndefined();
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBe("");
  });
  test("all", () => {
    const result = doUri(
      "uri://user:pass@example.com:123/one/two.three?q1=a1&q2=a2#body"
    );
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBe("user:pass");
    expect(result.uriElements.host).toBe("example.com");
    expect(result.uriElements.port).toBe(123);
    expect(result.uriElements.path).toBe("/one/two.three");
    expect(result.uriElements.query).toBe("q1=a1&q2=a2");
    expect(result.uriElements.fragment).toBe("body");
  });
  test("IPv4address", () => {
    const result = doUri("uri://10.10.10.10");
    // console.dir(result);
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBe("10.10.10.10");
    expect(result.uriElements.port).toBeUndefined();
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("IPv6address", () => {
    const result = doUri("uri://[2001:db8::7]");
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBe("2001:db8::7");
    expect(result.uriElements.port).toBeUndefined();
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("mixed IPv6address & IPv4address", () => {
    const result = doUri("uri://[::ffff:129.144.52.38]");
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBe("::ffff:129.144.52.38");
    expect(result.uriElements.port).toBeUndefined();
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("mixed IPv4address & reg-name, example from terion-name (https://github.com/garycourt/uri-js/issues/4)", () => {
    const result = doUri("uri://10.10.10.10.example.com/en/process");
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBe("10.10.10.10.example.com");
    expect(result.uriElements.port).toBeUndefined();
    expect(result.uriElements.path).toBe("/en/process");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("IPv6address, example from bkw (https://github.com/garycourt/uri-js/pull/16)", () => {
    const result = doUri("uri://[2606:2800:220:1:248:1893:25c8:1946]/test");
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBe("2606:2800:220:1:248:1893:25c8:1946");
    expect(result.uriElements.port).toBeUndefined();
    expect(result.uriElements.path).toBe("/test");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
  test("IPv6address, example from RFC 5952)", () => {
    const result = doUri("uri://[2001:db8::1]:80");
    // console.dir(result);
    expect(result.uriElements.scheme).toBe("uri");
    expect(result.uriElements.userinfo).toBeUndefined();
    expect(result.uriElements.host).toBe("2001:db8::1");
    expect(result.uriElements.port).toBe(80);
    expect(result.uriElements.path).toBe("");
    expect(result.uriElements.query).toBeUndefined();
    expect(result.uriElements.fragment).toBeUndefined();
  });
});
