import { ParsedMessage } from "./abnf";
import * as fs from "fs";

const parsingPositive: object = JSON.parse(fs.readFileSync('../../test/parsing_positive.json', 'utf8'));
const parsingNegative: object = JSON.parse(fs.readFileSync('../../test/parsing_negative.json', 'utf8'));

//
describe("Successfully parses with ABNF Client", () => {
	test.concurrent.each(Object.entries(parsingPositive))(
		"Parses message successfully: %s",
		(test_name, test) => {
			const parsedMessage = new ParsedMessage(test.message);
			for (const [field, value] of Object.entries(test.fields)) {
				if (value === null) {
					expect(parsedMessage[field]).toBeUndefined();
				}
				else if (typeof value === "object") {
					expect(parsedMessage[field]).toStrictEqual(value);
				} else {
					expect(parsedMessage[field]).toBe(value);
				}
			}
		}
	);
});

describe("Successfully fails with ABNF Client", () => {
	test.concurrent.each(Object.entries(parsingNegative))(
		"Fails to parse message: %s",
		(test_name, test) => {
			expect(() => new ParsedMessage(test)).toThrow();
		}
	);
});
