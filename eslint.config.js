const js = require("@eslint/js");
const globals = require("globals");
const jest = require("eslint-plugin-jest");
const prettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: ["node_modules/", "coverage/", "data/"],
  },
  js.configs.recommended,
  {
    rules: {
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      eqeqeq: ["error", "always"],
      "prefer-const": "error",
      "no-var": "error",
    },
  },
  {
    files: ["**/*.js"],
    ignores: ["frontend/**"],
    languageOptions: {
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  {
    files: ["frontend/**/*.js"],
    languageOptions: {
      sourceType: "script",
      globals: globals.browser,
    },
  },
  {
    files: ["backend/tests/**/*.js"],
    ...jest.configs["flat/recommended"],
  },
  prettier,
];
