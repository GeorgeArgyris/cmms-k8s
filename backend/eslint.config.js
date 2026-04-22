const js = require("@eslint/js");

module.exports = [
    js.configs.recommended,
    {
        // Tell ESLint this is a Node.js + CommonJS project.
        // This adds require, module, process, console etc. as known globals.
        languageOptions: {
            globals: {
                require: "readonly",
                module: "writable",
                exports: "writable",
                process: "readonly",
                console: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
            },
        },
        rules: {
            "no-unused-vars": "warn",
            "no-console": "off",
        },
    },
    {
        // Apply Jest globals ONLY to test files, not your whole codebase.
        files: ["**/__tests__/**/*.js", "**/*.test.js"],
        languageOptions: {
            globals: {
                describe: "readonly",
                it: "readonly",
                test: "readonly",
                expect: "readonly",
                beforeAll: "readonly",
                afterAll: "readonly",
                beforeEach: "readonly",
                afterEach: "readonly",
                jest: "readonly",
            },
        },
    },
];