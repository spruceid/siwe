for (const client of ['abnf', 'regex'].values()) {
	describe(`${client.toUpperCase()} Client`, () => {
		let ParsedMessage;
		beforeEach(async () => ParsedMessage = (await import(`./${client}`)).ParsedMessage);

		it('Parses message successfully: couple of optional fields', () => {
			const msg = `service.org wants you to sign in with your Ethereum account:
0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2

I accept the ServiceOrg Terms of Service: https://service.org/tos

URI: https://service.org/login
Version: 1
Nonce: 32891757
Issued At: 2021-09-30T16:25:24Z
Chain ID: 1
Resources:
- ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu
- https://example.com/my-web2-claim.json`;
			const parsedMessage = new ParsedMessage(msg);
			expect(parsedMessage.domain).toBe('service.org');
			expect(parsedMessage.address).toBe('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
			expect(parsedMessage.statement).toBe('I accept the ServiceOrg Terms of Service: https://service.org/tos');
			expect(parsedMessage.uri).toBe('https://service.org/login');
			expect(parsedMessage.version).toBe('1');
			expect(parsedMessage.nonce).toBe('32891757');
			expect(parsedMessage.issuedAt).toBe('2021-09-30T16:25:24Z');
			expect(parsedMessage.chainId).toBe('1');
			expect(parsedMessage.resources).toStrictEqual([
				'ipfs://Qme7ss3ARVgxv6rXqVPiikMJ8u2NLgmgszg13pYrDKEoiu',
				'https://example.com/my-web2-claim.json',
			]);
		});
		it('Parses message successfully: no optional field', () => {
			const msg = `service.org wants you to sign in with your Ethereum account:
0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2

I accept the ServiceOrg Terms of Service: https://service.org/tos

URI: https://service.org/login
Version: 1
Nonce: 32891757
Issued At: 2021-09-30T16:25:24Z`;
			const parsedMessage = new ParsedMessage(msg);
			expect(parsedMessage.domain).toBe('service.org');
			expect(parsedMessage.address).toBe('0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
			expect(parsedMessage.statement).toBe('I accept the ServiceOrg Terms of Service: https://service.org/tos');
			expect(parsedMessage.uri).toBe('https://service.org/login');
			expect(parsedMessage.version).toBe('1');
			expect(parsedMessage.nonce).toBe('32891757');
			expect(parsedMessage.issuedAt).toBe('2021-09-30T16:25:24Z');
		});

		const negativeParsingCases = {
			'missing mandatory field': `service.org wants you to sign in with your Ethereum account:
0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2

I accept the ServiceOrg Terms of Service: https://service.org/tos

Version: 1
Nonce: 32891757
Issued At: 2021-09-30T16:25:24Z`,
			'extra line break': `service.org wants you to sign in with your Ethereum account:
0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2


I accept the ServiceOrg Terms of Service: https://service.org/tos

Version: 1
Nonce: 32891757
Issued At: 2021-09-30T16:25:24Z`,
		};
		for (const [testName, testMessage] of Object.entries(negativeParsingCases)) {
			it(`Fails to parse message: ${testName}`, () => {
				expect(() => new ParsedMessage(testMessage)).toThrow();
			});
		}
	});
}
