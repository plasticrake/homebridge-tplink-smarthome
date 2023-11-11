/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['jest-chain'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/lib/'],
};
