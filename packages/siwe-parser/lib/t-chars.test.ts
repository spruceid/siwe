// The ABNF in the siwe message format and RFC3986
// have a number of rules for primative strings which are
// processed many times during the parsing of a message.
// apg-js processes the terminal nodes the strings are defined by
// much more effeciently than the rule names themselves.
// The terminal nodes are processed most effeciently in the order
// TRG(%d65-90) > TBS(%d65.66.67) > TLS(%s"some string") > rule.
// Therefore, in siwe-abnf.txt these strings have been expanded
// in there terminal nodes. These tests check that the
// expansions have been done correctly.

import { grammar } from "./siwe-grammar";
import apgLib from "apg-js/src/apg-lib/node-exports";

const grammarObj = new grammar();
const parser = new apgLib.parser();
const alpha = "abcdefghijklmnopqrstuvwxyz";
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const digit = "0123456789";
const unreserved = alpha + ALPHA + digit + "-._~";
const genDelims = ":/?#[]@";
const subDelims = "!$&'()*+,;=";
const reserved = genDelims + subDelims;
const pctEncoded = "%00%ff%FF%0a%0A%20";
const pchar = unreserved + subDelims + ":@" + pctEncoded;
const statement = reserved + unreserved + " ";
const scheme = alpha + ALPHA + digit + "+-.";
const userinfo = unreserved + subDelims + ":" + pctEncoded;
const IPvFuture = "v123." + unreserved + subDelims + ":";
const regName = unreserved + subDelims + pctEncoded;
const fragment = pchar + "/?";
let result;

const doParse = function doParse(rule, input) {
  result = parser.parse(grammarObj, rule, input);
  return result;
};

describe("test strings with explicit special character definitions", () => {
  test("test pchar", () => {
    const rule = "segment-nz";
    let result = doParse(rule, pchar);
    expect(result.success).toBe(true);
    result = doParse(rule, pchar + "/");
    expect(result.success).toBe(false);
    result = doParse(rule, pchar + "?");
    expect(result.success).toBe(false);
    result = doParse(rule, "/");
    expect(result.success).toBe(false);
    result = doParse(rule, "?");
    expect(result.success).toBe(false);
    result = doParse(rule, "#");
    expect(result.success).toBe(false);
    result = doParse(rule, "[");
    expect(result.success).toBe(false);
  });
  test("test statment", () => {
    const rule = "statement";
    let result = doParse(rule, statement);
    expect(result.success).toBe(true);
    result = doParse(rule, "<");
    expect(result.success).toBe(false);
    result = doParse(rule, ">");
    expect(result.success).toBe(false);
    result = doParse(rule, "{");
    expect(result.success).toBe(false);
    result = doParse(rule, "|");
    expect(result.success).toBe(false);
    result = doParse(rule, "}");
    expect(result.success).toBe(false);
  });
  test("test scheme", () => {
    const rule = "scheme";
    let result = doParse(rule, scheme);
    expect(result.success).toBe(true);
    result = doParse(rule, ":");
    expect(result.success).toBe(false);
    result = doParse(rule, "#");
    expect(result.success).toBe(false);
    result = doParse(rule, "?");
    expect(result.success).toBe(false);
    result = doParse(rule, "@");
    expect(result.success).toBe(false);
    result = doParse(rule, "!");
    expect(result.success).toBe(false);
  });
  test("test userinfo", () => {
    const rule = "userinfo";
    let result = doParse(rule, userinfo);
    expect(result.success).toBe(true);
    result = doParse(rule, "/");
    expect(result.success).toBe(false);
    result = doParse(rule, "#");
    expect(result.success).toBe(false);
    result = doParse(rule, "?");
    expect(result.success).toBe(false);
    result = doParse(rule, "@");
    expect(result.success).toBe(false);
    result = doParse(rule, "[");
    expect(result.success).toBe(false);
    result = doParse(rule, "]");
    expect(result.success).toBe(false);
  });
  test("test IPvFuture", () => {
    const rule = "IPvFuture";
    let result = doParse(rule, IPvFuture);
    expect(result.success).toBe(true);
    result = doParse(rule, "/");
    expect(result.success).toBe(false);
    result = doParse(rule, "#");
    expect(result.success).toBe(false);
    result = doParse(rule, "?");
    expect(result.success).toBe(false);
    result = doParse(rule, "@");
    expect(result.success).toBe(false);
    result = doParse(rule, "[");
    expect(result.success).toBe(false);
    result = doParse(rule, "]");
    expect(result.success).toBe(false);
  });
  test("test reg-name", () => {
    const rule = "reg-name";
    let result = doParse(rule, regName);
    expect(result.success).toBe(true);
    result = doParse(rule, "/");
    expect(result.success).toBe(false);
    result = doParse(rule, "#");
    expect(result.success).toBe(false);
    result = doParse(rule, "?");
    expect(result.success).toBe(false);
    result = doParse(rule, "@");
    expect(result.success).toBe(false);
    result = doParse(rule, "[");
    expect(result.success).toBe(false);
    result = doParse(rule, "]");
    expect(result.success).toBe(false);
  });
  test("test fragment", () => {
    const rule = "fragment";
    let result = doParse(rule, fragment);
    expect(result.success).toBe(true);
    result = doParse(rule, "#");
    expect(result.success).toBe(false);
    result = doParse(rule, "[");
    expect(result.success).toBe(false);
  });
});
