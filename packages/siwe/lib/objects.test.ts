import { SiweMessage } from './client';
import * as fs from 'fs';

const messages: object = JSON.parse(
  fs.readFileSync('../../test/message_objects.json', 'utf8')
);

let siweMsg;
let re;
describe(`Message Generation`, () => {
  test.concurrent.each(Object.entries(messages))('%s', (n, test) => {
    try {
      siweMsg = new SiweMessage(test.msg);
      expect(siweMsg).toBeDefined();
    } catch (tryError) {
      re = new RegExp(`(.|\n)*${test.error}`);
      console.error(test.error);
      expect(n.startsWith('invalid')).toBe(true);
    }
  });
});
