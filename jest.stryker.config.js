const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  // Stryker needs its instrumented jsdom env to collect per-test coverage.
  testEnvironment: '@stryker-mutator/jest-runner/jest-env/jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.test.json'
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testPathIgnorePatterns: ['<rootDir>/e2e/', '<rootDir>/coverage/', '<rootDir>/.stryker-tmp/', '<rootDir>/reports/'],
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  collectCoverage: false,
  coverageReporters: ['json-summary', 'html', 'text'],
};

module.exports = createJestConfig(customJestConfig);
