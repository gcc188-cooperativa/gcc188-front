import { notifications } from "@mantine/notifications";

/** Aviso curto no rodapé (pílula verde; vermelha em erro), como o toast do protótipo. */
export const toast = (message: string, erro = false): void => {
  notifications.show({
    message,
    withCloseButton: false,
    autoClose: 3200,
    classNames: { root: erro ? "toast erro" : "toast" },
  });
};
