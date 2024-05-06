import { ParsedMessage } from "./abnf";
const doSpec = function doSpec(statement = undefined, resource = undefined) {
  let msg = "";
  msg += "service.org wants you to sign in with your Ethereum account:\n";
  msg += "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2\n";
  msg += "\n";
  if (statement !== undefined) {
    msg += `${statement}\n`;
  }
  msg += "\n";
  msg += `URI: https://example.com\n`;
  msg += "Version: 1\n";
  msg += "Chain ID: 1\n";
  msg += "Nonce: 32891757\n";
  msg += "Issued At: 2021-09-30T16:25:24.000Z";
  if (resource !== undefined) {
    msg += "\nResources:";
    if (resource !== "") {
      msg += `\n- ${resource}`;
    }
  }
  // console.log(msg);
  return new ParsedMessage(msg);
};
let result;

describe("statement may be present empty or missing", () => {
  test("statement present", () => {
    result = doSpec("present");
    // console.dir(result);
    expect(result.statement).toBe("present");
  });
  test("statement empty", () => {
    result = doSpec("");
    expect(result.statement).toBe("");
  });
  test("statement missing", () => {
    result = doSpec();
    expect(result.statement).toBeUndefined();
  });
});
describe("resources may be present empty or missing", () => {
  test("resources present", () => {
    result = doSpec("present", "ftp://source.com");
    expect(result.resources[0]).toBe("ftp://source.com");
  });
  test("resources empty", () => {
    result = doSpec("present", "");
    // console.dir(result);
    expect(result.resources).toEqual([]);
  });
  test("resources missing", () => {
    result = doSpec("present");
    expect(result.resources).toBeUndefined();
  });
});
