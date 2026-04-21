import base from '../../jest.base.config.ts';
import type { Config } from 'jest';

const config: Config = {
  ...base,
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.spec.ts'],
  moduleNameMapper: {
    '^@nestjs-audit-log/core$': '<rootDir>/../core/src/index.ts',
  },
};

export default config;
