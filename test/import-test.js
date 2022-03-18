// this test should be run after builds
const { ABNFParsedMessage } = require("../dist/siwe"); 
const { RegExpParsedMessage } = require("../dist/siwe"); 
const parsingPositive = require('./parsing_positive.json');
const parsingNegative = require('./parsing_negative.json');

describe(`ABNF Client`, () => {
    test.concurrent.each(Object.entries(parsingPositive))('Parses message successfully: %s', (test_name, test) => {
        const parsedMessage = new ABNFParsedMessage(test.message);
        for (const [field, value] of Object.entries(test.fields)) {
            if (typeof value === 'object') {
                expect(parsedMessage[field]).toStrictEqual(value);
            } else {
                expect(parsedMessage[field]).toBe(value);
            }
        }
    });
    test.concurrent.each(Object.entries(parsingNegative))('Fails to parse message: %s', (test_name, test) => {
        expect(() => new ParsedMessage(test)).toThrow();
    });
});

describe(`RegExp Client`, () => {
    test.concurrent.each(Object.entries(parsingPositive))('Parses message successfully: %s', (test_name, test) => {
        const parsedMessage = new RegExpParsedMessage(test.message);
        for (const [field, value] of Object.entries(test.fields)) {
            if (typeof value === 'object') {
                expect(parsedMessage[field]).toStrictEqual(value);
            } else {
                expect(parsedMessage[field]).toBe(value);
            }
        }
    });
    test.concurrent.each(Object.entries(parsingNegative))('Fails to parse message: %s', (test_name, test) => {
        expect(() => new ParsedMessage(test)).toThrow();
    });
});
