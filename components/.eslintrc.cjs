/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution")

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  root: true,
  extends: ["plugin:vue/vue3-recommended", "plugin:prettier/recommended"],
  plugins: ["vue", "prettier"],
  parserOptions: {
    ecmaVersion: "latest",
    parser: "@typescript-eslint/parser"
  },
  rules: {
    "vue/html-self-closing": 0,
    "no-unused-vars": 1,
    "vue/order-in-components": 0,
    "vue/no-deprecated-slot-attribute":0,
  }
}
