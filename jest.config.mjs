const config = {
  bail: true,
  collectCoverageFrom: [
    'src/**/*.ts'
  ],
  coverageDirectory: 'output/coverage',
  coverageReporters: [
    'text-summary',
    'lcov',
    'cobertura',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  logHeapUsage: true,
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.{js,mjs}$': '$1',
  },
  preset: 'ts-jest/presets/default-esm',
  randomize: true,
  reporters: [
    'default',
    [ 'jest-junit', { outputDirectory: 'output/unit-tests' } ]
  ],
  resolver: 'ts-jest-resolver',
  roots: [
    'src',
    'test'
  ],
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  transform: {},
};

export default config;
