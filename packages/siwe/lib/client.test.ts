const parsingPositive: Object = require('../../../test/parsing_positive.json');
const parsingNegative: Object = require('../../../test/parsing_negative.json');
const verificationPositive: Object = require('../../../test/verification_positive.json');
const verificationNegative: Object = require('../../../test/verification_negative.json');

import { Wallet } from 'ethers';
import { SiweMessage } from './client';
import { SiweErrorType } from './types';

describe(`Message Generation`, () => {
	test.concurrent.each(Object.entries(parsingPositive))(
		'Generates message successfully: %s',
		(_, test) => {
			const msg = new SiweMessage(test.fields);
			expect(msg.toMessage()).toBe(test.message);
		}
	);

	test.concurrent.each(Object.entries(parsingNegative))(
		'Fails to generate message: %s',
		(_, test) => {
			try {
				new SiweMessage(test.fields);
			} catch (error) {
				expect(Object.values(SiweErrorType).includes(error));
			}
		}
	);
});

describe(`Message verification`, () => {
	test.concurrent.each(Object.entries(verificationPositive))(
		'Verificates message successfully: %s',
		async (_, test_fields) => {
			const msg = new SiweMessage(test_fields);
			await expect(
				msg.verify({
					signature: test_fields.signature,
					time: test_fields.time,
					domain: test_fields.domainBinding,
					nonce: test_fields.matchNonce,
				}).then(({ success }) => success)
			).resolves.toBeTruthy();
		}
	);
	test.concurrent.each(Object.entries(verificationNegative))(
		'Fails to verify message: %s',
		async (n, test_fields) => {
			try {
				const msg = new SiweMessage(test_fields);
				await expect(msg.verify({
					signature: test_fields.signature,
					time: test_fields.time || test_fields.issuedAt,
					domain: test_fields.domainBinding,
					nonce: test_fields.matchNonce,
				}).then(({ success }) => success)).resolves.toBeFalsy();
			} catch (error) {
				expect(Object.values(SiweErrorType).includes(error));
			}
		}
	);
});

describe(`Round Trip`, () => {
	let wallet = Wallet.createRandom();
	test.concurrent.each(Object.entries(parsingPositive))(
		'Generates a Successfully Verifying message: %s',
		async (_, test) => {
			const msg = new SiweMessage(test.fields);
			msg.address = wallet.address;
			const signature = await wallet.signMessage(msg.toMessage());
			await expect(msg.verify({ signature }).then(({ success }) => success)).resolves.toBeTruthy();
		}
	);
});
