import { isUri } from "./abnf";
const goodUris = [
  "uri:",
  "uri://@",
  "uri://@:",
  "uri://",
  "uri://:",
  "uri:?",
  "uri:#",
  "uri://user:pass@example.com:123/one/two.three?q1=a1&q2=a2#body",
  "uri://10.10.10.10",
  "uri://[2001:db8::7]",
  "uri://[::ffff:129.144.52.38]",
  "uri://10.10.10.10.example.com/en/process",
  "uri://[2606:2800:220:1:248:1893:25c8:1946]/test",
  "uri://[2001:db8::1]:80",
  "uri://[::000.000.010.001]",
  "uri://[::001.099.200.255]",
  "uri://[ffff:abcd:0:10:200:3000:f8a:1]",
  "uri://[ffff:abcd:0:10:200:3000:255.255.255.255]",
  "uri://[::]",
  "uri://[::ffff]",
  "uri://[::1:2:3:4:5:6:7]",
  "uri://[::198.162.10.255]",
  "uri://[::ffff:198.162.10.255]",
  "uri://[::1:2:3:4:5:198.162.10.255]",
  "uri://[1::]",
  "uri://[1:2:3:4:5:6:7::]",
  "uri://[1::198.162.10.255]",
  "uri://[1:2:3:4:5::198.162.10.255]",
  "uri://[1::2]",
  "uri://[1:2:3:4:5:6::7]",
  "uri://[ffff:aaaa:bbbb::cccc:dddd:eeee:9999]",
  "uri://[1::2:198.162.10.255]",
  "uri://[1:2:3:4::7:198.162.10.255]",
  "uri://[ffff:aaaa:bbbb::cccc:dddd:198.162.10.255]",
];
const badUris = [
  "uri://[::0.0.0.256]/p/path",
  "uri://[::300.0.0.0]/p/path",
  "uri://[::0.ff.0.255]/p/path",
  "uri://[::0.0.256.0]/p/path",
  "uri://[ffff:abcd:0:10:200:3000:f8a:1:ffff]",
  "uri://[ffff:abcd:0:10:200:3000:f8a]",
  "uri://[ffff:abcd:0:10:200:3000:ff:255.255.255.255]",
  "uri://[ffff:abcd:0:10:200:255.255.255.255]",
  "uri://[::1:2:3:4:5:6:7:8]",
  "uri://[::1:2:3:4:5:6:198.162.10.255]",
  "uri://[1:2:3:4:5:6:7:8::]",
  "uri://[1:2:3:4:5:6::198.162.10.255]",
  "uri://[1:2:3:4:5::6:7:8]",
  "uri://[1:2:3:4:5::6:198.162.10.255]",
  "example.com",
  "://example.com",
];
describe("isUri()", () => {
  test("good URIs", () => {
    goodUris.forEach((uri) => expect(isUri(uri)).toBe(true));
  });
  test("bad URIs", () => {
    badUris.forEach((uri) => expect(isUri(uri)).toBe(false));
  });
});
