import * as fs from "node:fs";
// import { cwd } from "node:process";
// console.log(`Current Working Directory: ${cwd()}`);
import { grammar as Grammar } from "./siwe-grammar";
import apgLib from "apg-js/src/apg-lib/node-exports";
const grammarObj = new Grammar();
const alpha = "abcdefghijklmnopqrstuvwxyz";
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const digit = "0123456789";
const unreservedS = "-._~";
const unreserved = alpha + ALPHA + digit + unreservedS;
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
const dir = "./output";
const doParse = function doParse(rule, input, doTrace) {
  const parser = new apgLib.parser();
  if (doTrace) {
    parser.trace = new apgLib.trace();
    parser.trace.filter.operators["<ALL>"] = true;
  }
  const result = parser.parse(grammarObj, rule, input);
  if (doTrace) {
    const html = parser.trace.toHtmlPage("ascii", "siwe, default trace");
    const name = `${dir}/siwe-${rule}.html`;
    try {
      fs.mkdirSync(dir);
    } catch (e) {
      if (e.code !== "EEXIST") {
        throw new Error(`fs.mkdir failed: ${e.message}`);
      }
    }
    fs.writeFileSync(name, html);
    console.log(`view "${name}" in any browser to display parser's trace`);
    console.dir(result);
  }
  return result;
};
describe("test strings with explicit special character definitions", () => {
  test("test pchar", () => {
    const rule = "segment-nz";
    let result = doParse(rule, pchar, false);
    expect(result.success).toBe(true);
    result = doParse(rule, pchar + "/", false);
    expect(result.success).toBe(false);
    result = doParse(rule, pchar + "?", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "/", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "?", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "#", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "[", false);
    expect(result.success).toBe(false);
  });
  test("test statment", () => {
    const rule = "statement";
    let result = doParse(rule, statement, false);
    expect(result.success).toBe(true);
    result = doParse(rule, "<", false);
    expect(result.success).toBe(false);
    result = doParse(rule, ">", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "{", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "|", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "}", false);
    expect(result.success).toBe(false);
  });
  test("test scheme", () => {
    const rule = "scheme";
    let result = doParse(rule, scheme, false);
    expect(result.success).toBe(true);
    result = doParse(rule, ":", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "#", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "?", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "@", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "!", false);
    expect(result.success).toBe(false);
  });
  test("test userinfo", () => {
    const rule = "userinfo";
    let result = doParse(rule, userinfo, false);
    expect(result.success).toBe(true);
    result = doParse(rule, "/", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "#", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "?", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "@", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "[", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "]", false);
    expect(result.success).toBe(false);
  });
  test("test IPvFuture", () => {
    const rule = "IPvFuture";
    let result = doParse(rule, IPvFuture, false);
    expect(result.success).toBe(true);
    result = doParse(rule, "/", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "#", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "?", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "@", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "[", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "]", false);
    expect(result.success).toBe(false);
  });
  test("test reg-name", () => {
    const rule = "reg-name";
    let result = doParse(rule, regName, false);
    expect(result.success).toBe(true);
    result = doParse(rule, "/", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "#", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "?", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "@", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "[", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "]", false);
    expect(result.success).toBe(false);
  });
  test("test fragment", () => {
    const rule = "fragment";
    let result = doParse(rule, fragment, false);
    expect(result.success).toBe(true);
    result = doParse(rule, "#", false);
    expect(result.success).toBe(false);
    result = doParse(rule, "[", false);
    expect(result.success).toBe(false);
  });
});
