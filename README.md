# gcc188-front

SPA React + TypeScript + Mantine, gerada contra o contrato `index.d.ts` (openapi-typescript).

| Comando                                       | O que faz                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                 | Vite com proxy de `/api` para `localhost:8080` (mesma origem, D28)                                                         |
| `npm run dev:mock`                            | API simulada por MSW, sem backend. Login: `adm@`, `fin@`, `mot@`, `cli@` ou `novo@coop.example`, senha `senha-correta-123` |
| `npm test`                                    | Vitest + Testing Library + MSW + vitest-axe, com cobertura                                                                 |
| `npm run lint` / `format:check` / `typecheck` | Verificações do CI                                                                                                         |

Os dados e cenários simulados ficam em `src/mocks/` (contrato pendente, rascunho, pagamento em atraso, erros 409/422) e são os mesmos dos testes.

## Regras de uso do Git (tarefa #21)

- **Ramos:** _Git Flow_ adaptado (Design, cap. 3) — `develop` recebe PRs de `feat/*`, `fix/*`, `docs/*` e `test/*`, revisados e integrados por _squash merge_; `master` fica reservado às versões publicadas. Tags de versão (ex.: `v0.1.0`) marcam baselines.
- **Commits:** _Conventional Commits_ `tipo(escopo): descrição (RF-xxx-NN)`, com escopo da área tocada (`app`, `auth`, `ui`, `usuarios`, `cooperados`, `clientes`, `contratos`, `pagamentos`, `despesas`, `painel`, `relatorios`, `shared`, `test`, `deps`, `docs`, `docker`). Ex.: `feat(contratos): ajusta formulário de contrato (RF-CTR-02)`. O hook de _commit_ valida com commitlint; o de _pre-commit_ aplica Prettier e ESLint; o de _pre-push_ executa `typecheck` e os testes.
- **Pastas:** código em `src/`, testes ao lado dos módulos e em `src/test/`, mocks em `src/mocks/`, fontes versionadas em `public/fonts/` com origens e hashes em `FONTES.md`.
- **Artefatos:** `.gitignore` cobre dependências, `dist/`, cobertura e ambiente local; `.dockerignore` evita copiar esses arquivos para a imagem.
