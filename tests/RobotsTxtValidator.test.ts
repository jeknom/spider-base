import { URL } from 'url';
import RobotsTxtValidator from '../src/RobotsTxtValidator';

const TEST_PATH_ONE = 'api';
const TEST_PATH_TWO = 'user';
const TEST_AGENT_NAME = 'testAgent';
const TEST_TEXT = createTestText();

function createTestText(): string {
  let result = `User-agent: *\n\n`;
  createPermissionVariants(TEST_PATH_ONE).forEach(variant => result = result + `${variant}`);

  result = result + `\n\nUser-agent: ${TEST_AGENT_NAME}\n\n`;
  createPermissionVariants(TEST_PATH_TWO).forEach(variant => result = result + `${variant}`);

  return result;
}

function createPermissionVariants(value: string): string[] {
  return [
    `Disallow: /${value}\n`,
    `Disallow: /*/${value}\n`,
    `Disallow: */${value}\n`,
    `Disallow: /*${value}\n`,
    `Disallow: ${value}/\n`,
    `Disallow: ${value}/*/\n`,
    `Disallow: ${value}*/\n`,
    `Disallow: ${value}/*\n`,
    `Disallow: /${value}/\n`,
    `Disallow: /*/${value}/*/\n`,
    `Disallow: */${value}*/\n`,
    `Disallow: /*${value}/*\n`,
    `Disallow: /${value}-${value}\n`,
    `Disallow: /${value}/${value}\n`
  ]
}

function createTestUrl(path: string): URL {
  return new URL(`https://test.com/${path}`);
}

test('global user agent disallowed', () => {
  const validator = new RobotsTxtValidator(TEST_TEXT);
  const testUrl = createTestUrl(TEST_PATH_ONE);

  expect(validator.isUrlAllowed(testUrl)).toBeFalsy();
});

test('other user agent disallowed', () => {
  const validator = new RobotsTxtValidator(TEST_TEXT, TEST_AGENT_NAME);
  const testUrl = createTestUrl(TEST_PATH_ONE);
  const testUrl2 = createTestUrl(TEST_PATH_TWO);

  expect(validator.isUrlAllowed(testUrl)).toBeFalsy();
  expect(validator.isUrlAllowed(testUrl2)).toBeFalsy();
});

test('global user agent allowed', () => {
  const validator = new RobotsTxtValidator(TEST_TEXT);
  const testUrl = createTestUrl(TEST_PATH_TWO);

  expect(validator.isUrlAllowed(testUrl)).toBeTruthy();
});