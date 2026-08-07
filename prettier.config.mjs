/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config}
 */

const config = {
  printWidth: 100,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  trailingComma: "all",
  arrowParens: "always",
  plugins: ['@trivago/prettier-plugin-sort-imports', 'prettier-plugin-tailwindcss'],

  importOrder: [
    '^react',
    '^next',
    '<THIRD_PARTY_MODULES>',
    '^@/hooks/(.*)$',
    '^@/components/(.*)$',
    '^@/lib/(.*)$',
    '^@/types/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}

export default config;
