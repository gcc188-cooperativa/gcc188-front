# gcc188-front

Interface web (SPA) do sistema da **Cooperativa de Transportes** — GCC188/UFLA (2026-2).

> **Repositório reservado.** A implementação fica para a próxima sprint, conforme o plano de marcos do [Design](https://github.com/gcc188-cooperativa/gcc188-docs) (M2). Este repositório existe para reservar o nome e manter a estrutura da organização (decisão D03/Δ01).

## O que virá aqui

- **Stack** (Design, cap. 8): TypeScript em modo estrito, Vite, React 19.2, Mantine 9 (`core`, `hooks`, `dates`, `notifications`, `modals`, `charts`), React Router, TanStack Query, React Hook Form + Zod, Orval (geração de cliente a partir do contrato) e MSW (mock nos testes e no `dev:mock`);
- **Telas por perfil** (RF-WEB-01 a 11): o protótipo navegável que as define está publicado em <https://gcc188-cooperativa.github.io/gcc188-docs/>;
- **Contrato**: consumido a partir de [`gcc188-api-contract`](https://github.com/gcc188-cooperativa/gcc188-api-contract) (tipos TypeScript gerados);
- **Testes**: Vitest + Testing Library (unidade) e Playwright (ponta a ponta, executado pelo [`gcc188-infra`](https://github.com/gcc188-cooperativa/gcc188-infra)).

## Status

| Marco | Descrição | Situação |
|---|---|---|
| M0 | Documentação, contrato da API e backend essencial | em andamento (Sprints 0–1) |
| M2 | Implementação da interface | próxima sprint |
