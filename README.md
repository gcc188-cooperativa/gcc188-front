# gcc188-front

Interface web (SPA) do sistema da **Cooperativa de Transportes** — GCC188/UFLA (2026-2).

> **Repositório reservado.** A implementação fica para a próxima sprint, conforme o plano de marcos do [Design](https://github.com/gcc188-cooperativa/gcc188-docs) (M2). Este repositório existe para reservar o nome e manter a estrutura da organização (decisão D03/Δ01).

## O que virá aqui

- **Stack** (Design, cap. 8): TypeScript em modo estrito, Vite, React 19.2, Mantine 9 (`core`, `hooks`, `dates`, `notifications`, `modals`, `charts`), React Router, TanStack Query, React Hook Form + Zod, Orval (geração de cliente a partir do contrato) e MSW (mock nos testes e no `dev:mock`);
- **Telas por perfil** (RF-WEB-01 a 11): o protótipo navegável que as define está publicado em <https://gcc188-cooperativa.github.io/gcc188-docs/>;
- **Contrato**: consumido a partir de [`gcc188-api-contract`](https://github.com/gcc188-cooperativa/gcc188-api-contract) (tipos TypeScript gerados);
- **Testes**: Vitest + Testing Library (unidade) e Playwright (ponta a ponta, executado pelo [`gcc188-infra`](https://github.com/gcc188-cooperativa/gcc188-infra)).

## Regras de uso do Git (tarefa #21)

- **Ramos:** _Git Flow_ adaptado (Design, cap. 3) — `master` recebe somente PR de `develop` (ou o PR automático de _release_); trabalho em `feat/*`, `fix/*` e `docs/*`, com PR revisado e _squash merge_. Versionamento SemVer por Release Please.
- **Commits:** _Conventional Commits_ `tipo(escopo): descrição (RF-xxx-NN)`; escopos do front (`auth`, `usuarios`, `cooperandos`, `clientes`, `contratos`, `pagamentos`, `despesas`, `relatorios`, `ui`, `routing`). Ex.: `feat(usuarios): tela de inativação (RF-USR-04)`.
- **Pastas:** código em `src/`, contrato gerado em `src/shared/generated/`, mocks em `mocks/`; documentação de requisitos/design permanece em `gcc188-docs`. Artefatos de build, cobertura e dados locais não são versionados.
- **`.gitignore`:** ao iniciar o código, versionar arquivo que ignore `node_modules/`, `dist/`, `coverage/`, `.env`, `playwright-report/` e `test-results/` — extensões/pastas geradas nunca devem ir para o repositório.
- **Verificação:** `lefthook` com `commit-msg` (commitlint) e, quando houver suíte, `pre-push` com testes; o CI valida título de PR e commits. O repositório `gcc188-front` ainda não tem código, mas as regras já valem para o primeiro commit.

## Status

| Marco | Descrição | Situação |
|---|---|---|
| M0 | Documentação, contrato da API e backend essencial | em andamento (Sprints 0–1) |
| M2 | Implementação da interface | próxima sprint |
