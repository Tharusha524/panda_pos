/** @type {import('jest').Config} */
const phase1Coverage = [
  "src/utils/**/*.ts",
  "!src/utils/**/*.test.ts",
  "src/hooks/**/*.ts",
  "src/hooks/**/*.tsx",
  "!src/hooks/**/*.test.*",
  "src/**/*Utils.ts",
  "src/views/POS/**/*FormUtils.ts",
  "src/views/POS/sales/posSalePricing.ts",
  "src/views/POS/sales/posSaleUom.ts",
  "src/views/POS/sales/posCustomerSelection.ts",
  "src/routing/routeGuards.tsx",
];

module.exports = {
  roots: ["<rootDir>/src"],
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  testMatch: ["**/__tests__/**/*.{ts,tsx}", "**/*.{test,spec}.{ts,tsx}"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/src/test/__mocks__/fileMock.ts",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.test.json",
      },
    ],
  },
  collectCoverageFrom: phase1Coverage,
  coverageThreshold: {
    global: {
      branches: 82,
      functions: 99,
      lines: 99,
      statements: 98,
    },
  },
  coverageDirectory: "coverage",
  clearMocks: true,
};
