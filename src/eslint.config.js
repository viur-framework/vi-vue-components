import pluginVue from "eslint-plugin-vue"
import eslintConfigPrettier from "eslint-config-prettier"
import eslintPluginPrettier from "eslint-plugin-prettier"
import globals from "globals"

export default [
  // Vue plugin configurations (must come first)
  ...pluginVue.configs["flat/recommended"], // Use essential instead of recommended to avoid formatting rules

  // Main configuration
  {
    // Language options with global variables
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },

    // Plugins
    plugins: {
      prettier: eslintPluginPrettier,
    },

    // Rules
    rules: {
      // Prettier integration - now uses .prettierrc
      "prettier/prettier": "warn",

      // General rules
      "no-unused-vars": "off",

      // Vue specific rules
      "vue/order-in-components": "warn",
      "vue/no-deprecated-slot-attribute": "off",
      "vue/multi-word-component-names": "warn",
      "vue/component-definition-name-casing": "off",
      "vue/attributes-order": "warn",
      "vue/multiline-html-element-content-newline": "warn",
      "vue/html-self-closing": "warn",
      "vue/max-attributes-per-line": [
        "warn",
        {
          singleline: {
            max: 3,
          },
          multiline: {
            max: 1,
          },
        },
      ],
    },
  },

  // Prettier config to disable conflicting rules (must come last)
  eslintConfigPrettier,
]
