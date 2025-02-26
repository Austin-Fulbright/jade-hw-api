// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  // This tells Jest to transform the cbor2 package (and only that package) even though it’s in node_modules.
  transformIgnorePatterns: [
    "node_modules/(?!cbor2)"
  ],
};
