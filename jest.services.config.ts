import { Config } from 'jest';

const baseTestDir = '<rootDir>/test/services';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    `${baseTestDir}/**/*test.ts`
  ]
};

export default config;
