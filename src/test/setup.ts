import { cleanup, configure } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";
import { resetDb } from "../mocks/db";
import { server } from "../mocks/server";

// O hook de pre-push roda typecheck e testes em paralelo: consultas assíncronas precisam de mais tempo.
configure({ asyncUtilTimeout: 5000 });

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetDb();
  sessionStorage.clear();
});
afterAll(() => server.close());
// O Mantine precisa destas APIs, ausentes no jsdom.
window.matchMedia ??= ((q: string) => ({
  matches: false,
  media: q,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  onchange: null,
  dispatchEvent: () => false,
})) as never;
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
Element.prototype.scrollIntoView ??= () => {}; // Combobox/Select do Mantine
HTMLCanvasElement.prototype.getContext = (() => null) as never; // axe consulta o canvas; o jsdom não o implementa
