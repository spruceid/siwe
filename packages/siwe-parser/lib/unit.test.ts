import { ParsedMessage } from "./abnf";
import apgLib from "apg-js/src/apg-lib/node-exports";
import { grammar } from "./siwe-grammar";
import * as fs from "fs";

const validChars: object = JSON.parse(
  fs.readFileSync("../../test/valid_chars.json", "utf-8")
);
const invalidChars: object = JSON.parse(
  fs.readFileSync("../../test/invalid_chars.json", "utf-8")
);
const validUris: object = JSON.parse(
  fs.readFileSync("../../test/valid_uris.json", "utf-8")
);
const invalidUris: object = JSON.parse(
  fs.readFileSync("../../test/invalid_uris.json", "utf-8")
);
const validResources: object = JSON.parse(
  fs.readFileSync("../../test/valid_resources.json", "utf-8")
);
const invalidResources: object = JSON.parse(
  fs.readFileSync("../../test/invalid_resources.json", "utf-8")
);
const validSpec: object = JSON.parse(
  fs.readFileSync("../../test/valid_specification.json", "utf-8")
);

const grammarObj = new grammar();
const apgParser = new apgLib.parser();
let result;

/*
  The ABNF in the siwe message format and RFC3986 have a number of rules
  for primitive strings that are processed many times during the parsing of a message.
  apg-js processes the terminal nodes the strings are defined by much more
  efficiently than the rule names themselves.
  The terminal nodes are processed most efficiently in the order
  TRG(%d65-90) > TBS(%d65.66.67) > TLS("some string") > rule
  Therefore, in siwe-abnf.txt these strings have been expanded into terminal nodes.
  The "valid character" and "invalid character" tests check that these
  expansions have been done correctly.
*/
describe("Valid character tests - rules with characters expanded to primitives.", () => {
  test.concurrent.each(Object.entries(validChars))(
    "Rule: %s",
    (test_name, test) => {
      result = apgParser.parse(grammarObj, test.rule, test.input);
      expect(result.success).toBe(test.answer);
    }
  );
});
describe("Invalid character tests - rules with characters expanded to primitives.", () => {
  test.concurrent.each(Object.entries(invalidChars))(
    "Rule + invalid character: %s",
    (test_name, test) => {
      result = apgParser.parse(grammarObj, test.rule, test.input);
      expect(result.success).toBe(test.answer);
    }
  );
});
describe("Valid URIs", () => {
  test.concurrent.each(Object.entries(validUris))("%s", (test_name, test) => {
    const parsedMessage = new ParsedMessage(test.msg);
    for (const [field, value] of Object.entries(test.uri)) {
      if (value === null) {
        expect(parsedMessage.uriElements[field]).toBeUndefined();
      } else {
        expect(parsedMessage.uriElements[field]).toBe(value);
      }
    }
  });
});
describe("Invalid URIs", () => {
  test.concurrent.each(Object.entries(invalidUris))("%s", (test_name, test) => {
    expect(() => new ParsedMessage(test)).toThrow();
  });
});
describe("Valid Resource URIs", () => {
  test.concurrent.each(Object.entries(validResources))(
    "%s",
    (test_name, test) => {
      const parsedMessage = new ParsedMessage(test.msg);
      for (let i = 0; i < test.resources.length; i += 1) {
        expect(parsedMessage.resources[i]).toBe(test.resources[i]);
      }
    }
  );
});
describe("Invalid resources URI", () => {
  test.concurrent.each(Object.entries(invalidResources))(
    "%s",
    (test_name, test) => {
      expect(() => new ParsedMessage(test)).toThrow();
    }
  );
});
/*
  A close look at the siwe message format reveals that "statement",
  "request-id" and "resources" may be present, empty or missing entirely.
  These tests verify that the siwe-parser matches the specification on
  these points.
*/
describe("Statement, request-id & resources may be present, empty or missing.", () => {
  test.concurrent.each(Object.entries(validSpec))("%s", (test_name, test) => {
    const parsedMessage = new ParsedMessage(test.msg);
    for (const [field, value] of Object.entries(test.items)) {
      if (value === null) {
        expect(parsedMessage[field]).toBeUndefined();
      } else if (typeof value === "object") {
        expect(parsedMessage[field]).toStrictEqual(value);
      } else {
        expect(parsedMessage[field]).toBe(value);
      }
    }
  });
});
