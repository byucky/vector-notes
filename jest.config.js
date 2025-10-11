module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/tests/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/src/'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/utilities/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000, // 30 seconds for DB operations
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        resolveJsonModule: true
      }
    }]
  }
};

