import Grammar from "../lib/siwe-grammar.js";
import { cb } from "./callbacks";
import apgLib from "apg-js/src/apg-lib/node-exports";
// only needed if doTrace = true (debugging)
// import * as fs from "node:fs";
// import { cwd } from "node:process";

export class ParsedMessage {
  scheme: string | undefined;
  domain: string;
  address: string;
  statement: string | undefined;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expirationTime: string | undefined;
  notBefore: string | undefined;
  requestId: string | undefined;
  resources: Array<string> | undefined;
  uriElements: {
    scheme: string;
    userinfo: string | undefined;
    host: string | undefined;
    port: string | undefined;
    path: string;
    query: string | undefined;
    fragment: string | undefined;
  };

  // For debugging: if doTrace = true apg-js will trace the parse tree
  // and display it on an HTML page.
  constructor(msg: string, doTrace = false) {
    const grammarObj = new Grammar();
    const parser = new apgLib.parser();
    parser.callbacks["sign-in-with-ethereum"] = cb.signInWithEtherium;
    parser.callbacks["oscheme"] = cb.oscheme;
    parser.callbacks["domain"] = cb.domain;
    parser.callbacks["LF"] = cb.lineno;
    parser.callbacks["ex-title"] = cb.exTitle;
    parser.callbacks["nb-title"] = cb.nbTitle;
    parser.callbacks["ri-title"] = cb.riTitle;
    parser.callbacks["re-title"] = cb.reTitle;
    parser.callbacks["address"] = cb.address;
    parser.callbacks["statement"] = cb.statement;
    parser.callbacks["version"] = cb.version;
    parser.callbacks["chain-id"] = cb.chainId;
    parser.callbacks["nonce"] = cb.nonce;
    parser.callbacks["issued-at"] = cb.issuedAt;
    parser.callbacks["expiration-time"] = cb.expirationTime;
    parser.callbacks["not-before"] = cb.notBefore;
    parser.callbacks["request-id"] = cb.requestId;
    parser.callbacks["uri"] = cb.uri;
    parser.callbacks["uri-r"] = cb.uriR;
    parser.callbacks["resource"] = cb.resource;
    parser.callbacks["scheme"] = cb.scheme;
    parser.callbacks["userinfo-at"] = cb.userinfo;
    parser.callbacks["host"] = cb.host;
    parser.callbacks["IP-literal"] = cb.ipLiteral;
    parser.callbacks["port"] = cb.port;
    parser.callbacks["path-abempty"] = cb.pathAbempty;
    parser.callbacks["path-absolute"] = cb.pathAbsolute;
    parser.callbacks["path-rootless"] = cb.pathRootless;
    parser.callbacks["path-empty"] = cb.pathEmpty;
    parser.callbacks["query"] = cb.query;
    parser.callbacks["fragment"] = cb.fragment;
    parser.callbacks["IPv4address"] = cb.ipv4;
    parser.callbacks["nodcolon"] = cb.nodcolon;
    parser.callbacks["dcolon"] = cb.dcolon;
    parser.callbacks["h16"] = cb.h16;
    parser.callbacks["h16c"] = cb.h16;
    parser.callbacks["h16n"] = cb.h16;
    parser.callbacks["h16cn"] = cb.h16;
    parser.callbacks["dec-octet"] = cb.decOctet;
    parser.callbacks["dec-digit"] = cb.decDigit;

    // initialize parsed elements
    const elements = {
      errors: [],
      lineno: 1,
      scheme: undefined,
      domain: undefined,
      address: undefined,
      statement: undefined,
      uri: undefined,
      version: undefined,
      chainId: undefined,
      nonce: undefined,
      issuedAt: undefined,
      expirationTime: undefined,
      notBefore: undefined,
      requestId: undefined,
      resources: undefined,
      uriElements: {
        scheme: undefined,
        userinfo: undefined,
        host: undefined,
        port: undefined,
        path: undefined,
        query: undefined,
        fragment: undefined,
      },
    };
    // uncomment for tracing
    // if (doTrace) {
    //   parser.trace = new apgLib.trace();
    //   parser.trace.filter.operators["<ALL>"] = true;
    // }
    const result = parser.parse(grammarObj, 0, msg, elements);
    // uncomment for tracing
    // if (doTrace) {
    //   const html = parser.trace.toHtmlPage("ascii", "siwe, default trace");
    //   const dir = `${cwd()}/output`;
    //   const name = `${dir}/siwe-trace.html`;
    //   try {
    //     fs.mkdirSync(dir);
    //   } catch (e) {
    //     if (e.code !== "EEXIST") {
    //       throw new Error(`fs.mkdir failed: ${e.message}`);
    //     }
    //   }
    //   fs.writeFileSync(name, html);
    //   console.log(`view "${name}" in any browser to display parser's trace`);
    // }
    let throwMsg = "";
    for (let i = 0; i < elements.errors.length; i += 1) {
      throwMsg += elements.errors[i] + "\n";
    }
    if (!result.success) {
      throwMsg += `Invalid message: ${JSON.stringify(result)}`;
    }
    if (throwMsg !== "") {
      throw new Error(throwMsg);
    }

    this.scheme = elements.scheme;
    this.domain = elements.domain;
    this.address = elements.address;
    this.statement = elements.statement;
    this.uri = elements.uri;
    this.version = elements.version;
    this.chainId = elements.chainId;
    this.nonce = elements.nonce;
    this.issuedAt = elements.issuedAt;
    this.expirationTime = elements.expirationTime;
    this.notBefore = elements.notBefore;
    this.requestId = elements.requestId;
    this.resources = elements.resources;
    this.uriElements = elements.uriElements;

    // This test has already been done in the parser callback functions "domain()".
    // if (this.domain.length === 0) {
    //   throw new Error("Domain cannot be empty.");
    // }

    // This test has already been done in the parser callback functions "address()".
    // if (!isEIP55Address(this.address)) {
    //   throw new Error("Address not conformant to EIP-55.");
    // }
  }
}
