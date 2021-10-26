const DOMAIN = "(([a-zA-Z]([a-zA-Z\\d-]*[a-zA-Z\\d])*)\\.)+[a-zA-Z]{2,}";
const ADDRESS = "0x[a-zA-Z0-9]{40}";
const URI = "(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?";
const DATETIME = "([0-9]+)-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])[Tt]([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]|60)(\\.[0-9]+)?(([Zz])|([\\+|\\-]([01][0-9]|2[0-3]):[0-5][0-9]))";
const REQUESTID = "[-._~!$&'()*+,;=:@%a-zA-Z0-9]*";

export class ParsedMessage {
	domain: string;
	address: string;
	statement: string;
	uri: string;
	version: string;
	nonce: string;
	issuedAt: string;
	expirationTime: string | null;
	notBefore: string | null;
	requestId: string | null;
	chainId: string | null;
	resources: string[] | null;

	constructor(msg: string) {
		const REGEX = new RegExp(`(?<domain>${DOMAIN})\\ wants\\ you\\ to\\ sign\\ in\\ with\\ your\\ Ethereum\\ account\\:\\n(?<address>${ADDRESS})\\n\\n(?<statement>[^\\n]+)\\n?\\nURI\\:\\ (?<uri>${URI})\\nVersion\\:\\ (?<version>1)\\nNonce\\:\\ (?<nonce>[a-zA-Z0-9]{8})\\nIssued\\ At\\:\\ (?<issuedAt>${DATETIME})(\\nExpiration\\ Time\\:\\ (?<expirationTime>${DATETIME}))?(\\nNot\\ Before\\:\\ (?<notBefore>${DATETIME}))?(\\nRequest\\ ID\\:\\ (?<requestId>${REQUESTID}))?(\\nChain\\ ID\\:\\ (?<chainId>[0-9]+))?(\\nResources\\:(?<resources>(\\n-\\ ${URI})+))?$`, 'g');

		let match = REGEX.exec(msg);
		if (!match) {
			throw new Error("Message did not match the regular expression.");
		}

		this.domain = match?.groups?.domain;
		this.address = match?.groups?.address;
		this.statement = match?.groups?.statement;
		this.uri = match?.groups?.uri;
		this.version = match?.groups?.version;
		this.nonce = match?.groups?.nonce;
		this.chainId = match?.groups?.chainId;
		this.issuedAt = match?.groups?.issuedAt;
		this.expirationTime = match?.groups?.expirationTime;
		this.notBefore = match?.groups?.notBefore;
		this.requestId = match?.groups?.requestId;
		this.resources = match?.groups?.resources?.split('\n- ').slice(1);
	}
}
