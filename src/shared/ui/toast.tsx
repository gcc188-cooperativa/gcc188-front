import { notifications } from "@mantine/notifications";

/** Resultado de cada operação (RF-WEB-10) via @mantine/notifications. */
export function toast(msg: string, erro = false) {
  notifications.show({
    message: msg,
    color: erro ? "red" : "teal",
    autoClose: 3200,
    withCloseButton: true,
  });
}
