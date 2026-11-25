import js from "@eslint/js";
import a11y from "eslint-plugin-jsx-a11y";
import hooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// RC01 a RC06 (Design): sem any, complexidade e parâmetros limitados, hooks e acessibilidade.
export default tseslint.config(
  { ignores: ["dist", "coverage", "src/shared/api/schema.d.ts"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  a11y.flatConfigs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": hooks },
    rules: {
      ...hooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      complexity: ["warn", 10],
      "max-params": ["error", 4],
      "max-lines-per-function": ["warn", { max: 60, skipBlankLines: true, skipComments: true }],
    },
  },
  {
    files: ["src/mocks/**", "src/test/**"],
    rules: { "max-params": "off", complexity: "off", "max-lines-per-function": "off" },
  },
);
