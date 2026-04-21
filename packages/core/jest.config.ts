import base from '../../jest.base.config.ts';
import type { Config } from 'jest';

const config: Config = {
  ...base,
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.spec.ts', '<rootDir>/test/**/*.bench-spec.ts'],
};

export default config;
