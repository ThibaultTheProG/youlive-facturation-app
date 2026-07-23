import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [...nextCoreWebVitals, ...nextTypescript, {
  ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
}, {
  settings: {
    react: {
      // eslint-config-next impose `version: "detect"`, ce qui fait appeler à
      // eslint-plugin-react l'API `context.getFilename()` supprimée dans
      // ESLint 10 → crash au chargement de la règle `react/display-name`.
      // Fixer la version court-circuite la détection. À resynchroniser avec
      // la version de `react` dans package.json.
      version: "19.2",
    },
  },
}];

export default eslintConfig;
