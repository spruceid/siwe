import apgLib from "apg-js/src/apg-lib/node-exports";
const utils = apgLib.utils;
const id = apgLib.ids;
import { isEIP55Address, parseIntegerNumber } from "./utils";

/* copied from siwe/lib/utils.ts */
const ISO8601 =
  /^(?<date>[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01]))[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(.[0-9]+)?(([Zz])|([+|-]([01][0-9]|2[0-3]):[0-5][0-9]))$/;
const isValidISO8601Date = (inputDate: string): boolean => {
  /* Split groups and make sure inputDate is in ISO8601 format */
  const inputMatch = ISO8601.exec(inputDate);

  /* if inputMatch is null the date is not ISO-8601 */
  if (!inputMatch) {
    return false;
  }

  /* Creates a date object with input date to parse for invalid days e.g. Feb, 30 -> Mar, 01 */
  const inputDateParsed = new Date(inputMatch.groups.date).toISOString();

  /* Get groups from new parsed date to compare with the original input */
  const parsedInputMatch = ISO8601.exec(inputDateParsed);

  /* Compare remaining fields */
  return inputMatch.groups.date === parsedInputMatch.groups.date;
};

export const cb = {
  signInWithEtherium: function (result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        if (typeof data !== "object" || data === null) {
          throw new Error("data must be an object");
        }
        break;
      case id.NOMATCH:
        data.errors.push(`invalid message: max line number was ${data.lineno}`);
    }
  },
  lineno: function lineno(result, chars, phraseIndex, data) {
    if (result.state === id.MATCH) {
      data.lineno += 1;
    }
  },
  exTitle: function exTitle(result, chars, phraseIndex, data) {
    if (result.state === id.NOMATCH) {
      data.lineno -= 1;
    }
  },
  nbTitle: function nbTitle(result, chars, phraseIndex, data) {
    if (result.state === id.NOMATCH) {
      data.lineno -= 1;
    }
  },
  riTitle: function riTitle(result, chars, phraseIndex, data) {
    if (result.state === id.NOMATCH) {
      data.lineno -= 1;
    }
  },
  reTitle: function reTitle(result, chars, phraseIndex, data) {
    if (result.state === id.MATCH) {
      data.resources = [];
    } else if (result.state === id.NOMATCH) {
      data.lineno -= 1;
    }
  },
  oscheme: function oscheme(result, chars, phraseIndex, data) {
    if (result.state === id.MATCH) {
      // if matched, remove :// from oscheme
      data.scheme = utils.charsToString(
        chars,
        phraseIndex,
        result.phraseLength - 3
      );
    }
  },
  domain: function domain(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.domain = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
      case id.EMPTY:
        data.errors.push(`line ${data.lineno}: domain cannot be empty`);
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid domain`);
    }
  },
  address: function address(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.address = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        if (!isEIP55Address(data.address)) {
          data.errors.push(
            `line ${data.lineno}: invalid EIP-55 address - ${data.address}`
          );
        }
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid address`);
        break;
    }
  },
  statement: function statement(result, chars, phraseIndex, data) {
    if (result.state === id.MATCH) {
      data.statement = utils.charsToString(
        chars,
        phraseIndex,
        result.phraseLength
      );
    }
  },
  emptyStatement: function emptyStatement(result, chars, phraseIndex, data) {
    if (result.state === id.MATCH) {
      data.statement = "";
    }
  },
  version: function version(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.version = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid version`);
        break;
    }
  },
  nonce: function nonce(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.nonce = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid nonce`);
        break;
    }
  },
  issuedAt: function issuedAt(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.issuedAt = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        if (!isValidISO8601Date(data.issuedAt)) {
          data.errors.push(
            `line ${data.lineno}: invalid issued-at date time semantics`
          );
        }
        break;
      case id.NOMATCH:
        data.errors.push(
          `line ${data.lineno}: invalid issued-at date time syntax`
        );
        break;
    }
  },
  expirationTime: function expirationTime(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.expirationTime = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        if (!isValidISO8601Date(data.expirationTime)) {
          data.errors.push(
            `line ${data.lineno}: invalid expiration-time date time semantics`
          );
        }
        break;
      case id.NOMATCH:
        data.errors.push(
          `line ${data.lineno}: invalid expiration-time date time syntax`
        );
        break;
    }
  },
  notBefore: function notBefore(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.notBefore = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        if (!isValidISO8601Date(data.notBefore)) {
          data.errors.push(
            `line ${data.lineno}: invalid not-before date time semantics`
          );
        }
        break;
      case id.NOMATCH:
        data.errors.push(
          `line ${data.lineno}: invalid not-before date time syntax`
        );
        break;
    }
  },
  requestId: function requestId(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.requestId = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
      case id.EMPTY:
        data.requestId = "";
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid requestID`);
        break;
    }
  },
  chainId: function chainId(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.chainId = parseIntegerNumber(
          utils.charsToString(chars, phraseIndex, result.phraseLength)
        );
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid chain-id`);
        break;
    }
  },
  uriR: function uriR(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.uriR = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid resource URI`);
        break;
    }
  },
  resource: function resource(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.resources.push(data.uriR);
        delete data.uriR;
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid resource`);
        break;
    }
  },
  // handle the URI
  scheme: function scheme(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.uriElements.scheme = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid URI scheme`);
        break;
    }
  },
  userinfo: function userinfo(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.uriElements.userinfo = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength - 1
        );
        break;
    }
  },
  host: function host(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        data.iplit = false;
        break;
      case id.MATCH:
        if (data.iplit) {
          // strip leading "[" and trailing "]" brackets
          data.uriElements.host = utils.charsToString(
            chars,
            phraseIndex + 1,
            result.phraseLength - 2
          );
        } else {
          data.uriElements.host = utils.charsToString(
            chars,
            phraseIndex,
            result.phraseLength
          );
        }
        break;
      case id.EMPTY:
        data.uriElements.host = "";
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid URI host`);
        break;
    }
  },
  ipLiteral: function ipLiteral(result, chars, phraseIndex, data) {
    if (result.state === id.MATCH) {
      data.iplit = true;
    }
  },
  port: function port(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.uriElements.port = parseIntegerNumber(
          utils.charsToString(chars, phraseIndex, result.phraseLength)
        );
        break;
      case id.EMPTY:
        data.uriElements.port = "";
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid URI port`);
        break;
    }
  },
  pathAbempty: function pathAbempty(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.uriElements.path = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
      case id.EMPTY:
        data.uriElements.path = "";
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid URI path-abempty`);
        break;
    }
  },
  pathAbsolute: function pathAbsolute(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.uriElements.path = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
    }
  },
  pathRootless: function pathRootless(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.uriElements.path = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
    }
  },
  pathEmpty: function pathEmpty(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
      case id.NOMATCH:
        data.errors.push(
          `line ${data.lineno}: invalid URI - path-empty must be empty`
        );
        break;
      case id.EMPTY:
        data.uriElements.path = "";
        break;
    }
  },
  query: function query(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.uriElements.query = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
      case id.EMPTY:
        data.uriElements.query = "";
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid URI query`);
        break;
    }
  },
  fragment: function fragment(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.uriElements.fragment = utils.charsToString(
          chars,
          phraseIndex,
          result.phraseLength
        );
        break;
      case id.EMPTY:
        data.uriElements.fragment = "";
        break;
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid URI fragment`);
        break;
    }
  },
  uri: function URI(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        //NOTE: all "valid-url" tests are satisfied if URI ABNF parses without error.
        data.uri = utils.charsToString(chars, phraseIndex, result.phraseLength);
        break;
      case id.EMPTY:
      case id.NOMATCH:
        data.errors.push(`line ${data.lineno}: invalid URI`);
        break;
    }
  },
  ipv4: function ipv4(result, chars, phraseIndex, data) {
    if (result.state === id.MATCH) {
      data.ipv4 = true;
    }
  },
  h16: function h16(result, chars, phraseIndex, data) {
    if (result.state === id.MATCH) {
      data.h16count += 1;
    }
  },
  nodcolon: function nodcolon(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        data.h16count = 0;
        data.ipv4 = false;
        break;
      case id.MATCH:
        // semantically validate the number of 16-bit digits
        if (data.ipv4) {
          if (data.h16count === 6) {
            result.state = id.MATCH;
          } else {
            result.state = id.NOMATCH;
            result.phraseLength = 0;
          }
        } else {
          if (data.h16count === 8) {
            result.state = id.MATCH;
          } else {
            result.state = id.NOMATCH;
            result.phraseLength = 0;
          }
        }
        break;
    }
  },
  dcolon: function dcolon(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        data.h16count = 0;
        data.ipv4 = false;
        break;
      case id.MATCH:
        // semantically validate the number of 16-bit digits
        if (data.ipv4) {
          if (data.h16count < 6) {
            result.state = id.MATCH;
          } else {
            result.state = id.NOMATCH;
            result.phraseLength = 0;
          }
        } else {
          if (data.h16count < 8) {
            result.state = id.MATCH;
          } else {
            result.state = id.NOMATCH;
            result.phraseLength = 0;
          }
        }
        break;
    }
  },
  decOctet: function decOctet(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.ACTIVE:
        data.octet = 0;
        break;
      case id.MATCH:
        // semantically validate the octet
        if (data.octet > 255) {
          result.state = id.NOMATCH;
          result.phraseLength = 0;
        } else {
          result.state = id.MATCH;
        }
        break;
    }
  },
  decDigit: function decDigit(result, chars, phraseIndex, data) {
    switch (result.state) {
      case id.MATCH:
        data.octet = 10 * data.octet + chars[phraseIndex] - 48;
        break;
    }
  },
};
