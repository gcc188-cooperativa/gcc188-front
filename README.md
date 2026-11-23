# gcc188-front

SPA React + TypeScript + Mantine, gerada contra o contrato `index.d.ts` (openapi-typescript).

| Comando                                       | O que faz                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                                 | Vite com proxy de `/api` para `localhost:8080` (mesma origem, D28)                                                         |
| `npm run dev:mock`                            | API simulada por MSW, sem backend. Login: `adm@`, `fin@`, `mot@`, `cli@` ou `novo@coop.example`, senha `senha-correta-123` |
| `npm test`                                    | Vitest + Testing Library + MSW + vitest-axe, com cobertura                                                                 |
| `npm run lint` / `format:check` / `typecheck` | Verificações do CI                                                                                                         |

Os dados e cenários simulados ficam em `src/mocks/` (contrato pendente, rascunho, pagamento em atraso, erros 409/422) e são os mesmos dos testes.
