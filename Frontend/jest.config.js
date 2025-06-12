export default {
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  testEnvironment: 'jsdom',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};