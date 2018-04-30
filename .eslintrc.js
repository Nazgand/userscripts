/* globals module */

module.exports = {
  env: {
    es6: true,
    greasemonkey: true,
    browser: true,
  },
  extends: 'eslint:recommended',
  parserOptions: {
    sourceType: 'module',
  },
  rules: {
    'accessor-pairs': 'error',
    'array-bracket-spacing': 'error',
    'array-callback-return': 'error',
    'arrow-body-style': 'error',
    'arrow-parens': 'error',
    'arrow-spacing': 'error',
    'block-scoped-var': 'error',
    'block-spacing': 'error',
    'brace-style': 'error',
    'callback-return': 'error',
    'camelcase': ['error', {
      properties: 'never',
    }],
    'class-methods-use-this': 'error',
    'comma-dangle': ['error', 'always-multiline'],
    'comma-spacing': ['error', {
      after: true,
      before: false,
    }],
    'comma-style': 'error',
    'complexity': 'error',
    'computed-property-spacing': 'error',
    'consistent-return': 'error',
    'consistent-this': ['error', '_this'],
    'curly': 'error',
    'default-case': 'error',
    'dot-location': ['error', 'property'],
    'dot-notation': ['error', {
      allowKeywords: true,
    }],
    'eol-last': 'error',
    'eqeqeq': 'error',
    'func-call-spacing': 'error',
    'func-name-matching': 'error',
    'func-names': [
      'error',
      'never',
    ],
    'func-style': 'off',
    'generator-star-spacing': 'error',
    'global-require': 'off',
    'guard-for-in': 'error',
    'handle-callback-err': 'error',
    'id-blacklist': 'error',
    'id-length': 'off',
    'id-match': 'error',
    'indent': [
      'error',
      2,
    ],
    'init-declarations': 'off',
    'jsx-quotes': 'error',
    'key-spacing': 'error',
    'keyword-spacing': 'error',
    'line-comment-position': 'off',
    'linebreak-style': [
      'error',
      'unix',
    ],
    'lines-around-comment': 'error',
    'lines-around-directive': 'error',
    'max-depth': 'error',
    'max-len': ['warn', {
      ignoreUrls: true,
    }],
    'max-lines': 'error',
    'max-nested-callbacks': 'error',
    'max-params': 'off',
    'max-statements': 'off',
    'max-statements-per-line': 'error',
    'multiline-ternary': [
      'error',
      'always',
    ],
    'new-cap': 'off',
    'new-parens': 'error',
    'newline-after-var': 'off',
    'newline-before-return': 'error',
    'newline-per-chained-call': 'off',
    'no-alert': 'error',
    'no-array-constructor': 'error',
    'no-bitwise': 'error',
    'no-caller': 'error',
    'no-catch-shadow': 'error',
    'no-confusing-arrow': 'error',
    'no-console': 'off',
    'no-continue': 'off',
    'no-div-regex': 'error',
    'no-duplicate-imports': 'error',
    'no-else-return': 'error',
    'no-empty-function': 'error',
    'no-eq-null': 'error',
    'no-eval': 'error',
    'no-extend-native': 'error',
    'no-extra-bind': 'error',
    'no-extra-label': 'error',
    'no-extra-parens': 'off',
    'no-floating-decimal': 'error',
    'no-implicit-coercion': 'off',
    'no-implicit-globals': 'error',
    'no-implied-eval': 'error',
    'no-inline-comments': 'off',
    'no-invalid-this': 'error',
    'no-iterator': 'error',
    'no-label-var': 'error',
    'no-labels': 'error',
    'no-lone-blocks': 'error',
    'no-lonely-if': 'error',
    'no-loop-func': 'error',
    'no-magic-numbers': 'off',
    'no-mixed-operators': 'error',
    'no-mixed-requires': 'error',
    'no-multi-spaces': 'error',
    'no-multi-str': 'error',
    'no-multiple-empty-lines': 'error',
    'no-native-reassign': 'error',
    'no-negated-condition': 'error',
    'no-negated-in-lhs': 'error',
    'no-nested-ternary': 'error',
    'no-new': 'error',
    'no-new-func': 'error',
    'no-new-object': 'error',
    'no-new-require': 'error',
    'no-new-wrappers': 'error',
    'no-octal-escape': 'error',
    'no-param-reassign': 'off',
    'no-path-concat': 'error',
    'no-plusplus': 'off',
    'no-process-env': 'off',
    'no-process-exit': 'error',
    'no-proto': 'error',
    'no-prototype-builtins': 'error',
    'no-restricted-globals': 'error',
    'no-restricted-imports': 'error',
    'no-restricted-modules': 'error',
    'no-restricted-properties': 'error',
    'no-restricted-syntax': 'error',
    'no-return-assign': 'error',
    'no-return-await': 'error',
    'no-script-url': 'error',
    'no-self-compare': 'error',
    'no-sequences': 'error',
    'no-shadow': 'error',
    'no-shadow-restricted-names': 'error',
    'no-spaced-func': 'error',
    'no-sync': 'error',
    'no-tabs': 'error',
    'no-template-curly-in-string': 'error',
    'no-ternary': 'off',
    'no-throw-literal': 'error',
    'no-trailing-spaces': 'error',
    'no-undef-init': 'error',
    'no-undefined': 'error',
    'no-underscore-dangle': ['error', {
      allow: [
        '_this',
      ],
    }],
    'no-unmodified-loop-condition': 'error',
    'no-unneeded-ternary': 'error',
    'no-unused-expressions': 'warn',
    'no-use-before-define': ['error', {
      functions: false,
    }],
    'no-useless-call': 'error',
    'no-useless-computed-key': 'error',
    'no-useless-concat': 'error',
    'no-useless-constructor': 'error',
    'no-useless-escape': 'error',
    'no-useless-rename': 'error',
    'no-useless-return': 'error',
    'no-var': 'error',
    'no-void': 'error',
    'no-warning-comments': 'error',
    'no-whitespace-before-property': 'error',
    'no-with': 'error',
    'object-curly-newline': 'off',
    'object-curly-spacing': [
      'error',
      'always',
    ],
    'object-property-newline': 'error',
    'object-shorthand': 'off',
    'one-var': 'off',
    'one-var-declaration-per-line': 'error',
    'operator-assignment': 'error',
    'operator-linebreak': ['error', 'before'],
    'padded-blocks': ['error', 'never'],
    'prefer-arrow-callback': 'off',
    'prefer-const': 'error',
    'prefer-numeric-literals': 'error',
    'prefer-reflect': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    'prefer-template': 'off',
    'quote-props': ['error', 'consistent-as-needed'],
    'quotes': [
      'error',
      'single',
    ],
    'radix': 'error',
    'require-jsdoc': 'off',
    'rest-spread-spacing': 'error',
    'semi': 'error',
    'semi-spacing': 'error',
    'sort-imports': 'error',
    'sort-keys': 'off',
    'sort-vars': 'off',
    'space-before-blocks': 'error',
    'space-before-function-paren': ['error', 'never'],
    'space-in-parens': [
      'error',
      'never',
    ],
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'spaced-comment': 'off',
    'strict': [
      'error',
      'never',
    ],
    'symbol-description': 'error',
    'template-curly-spacing': 'error',
    'unicode-bom': [
      'error',
      'never',
    ],
    'valid-jsdoc': 'error',
    'vars-on-top': 'off',
    'wrap-iife': ['error', 'inside'],
    'wrap-regex': 'error',
    'yield-star-spacing': 'error',
    'yoda': [
      'error',
      'never',
    ],
  },
};
