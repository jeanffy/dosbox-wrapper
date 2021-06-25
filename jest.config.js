module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testRunner: 'jest-circus/runner',
  roots: [
    'src',
    'test'
  ],
  reporters: [
    'default',
    [ 'jest-junit', { outputDirectory: 'output/unit-tests' } ]
  ],
  collectCoverageFrom: [
    'src/**/*.ts'
  ],
  coverageReporters: [
    'lcov',
    'cobertura'
  ],
  coverageDirectory: 'output/coverage'
};
