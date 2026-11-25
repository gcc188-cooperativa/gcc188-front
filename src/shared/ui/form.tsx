import {
  Group,
  PasswordInput,
  Radio,
  Select,
  Text,
  TextInput,
  type MantineColor,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import type { UseFormReturnType } from "@mantine/form";
import type { ReactNode } from "react";
import { msgErro, type Schemas } from "../api/client";

export type Valores = Record<string, unknown>;
export type Resultado = { error?: unknown };
export type Op = string | { value: string; label: string };
type Props<T extends Valores> = {
  form: UseFormReturnType<T>;
  name: string;
  label: string;
  type?: string;
  opcoes?: Op[];
  vazio?: string;
  hint?: string;
  extra?: ReactNode;
  desabilitado?: boolean;
  min?: number;
  max?: number;
  placeholder?: string;
};
const dados = (opcoes: Op[]) =>
  opcoes.map((o) => (typeof o === "string" ? { value: o, label: o } : o));

/** Campo de formulário Mantine com erro 422 junto ao controle (RF-WEB-04, CA-09). */
export function Campo<T extends Valores>(p: Props<T>) {
  const g = p.form.getInputProps(p.name as never) as unknown as {
    value?: unknown;
    onChange: (e: unknown) => void;
    error?: ReactNode;
  };
  const valor = String(g.value ?? "");
  const comum = {
    label: p.label,
    description: p.hint,
    error: g.error,
    disabled: p.desabilitado,
  };
  const definir = (v: string | null) => p.form.setFieldValue(p.name as never, (v ?? "") as never);
  let campo: ReactNode;
  if (p.opcoes)
    campo = (
      <Select
        {...comum}
        data={dados(p.opcoes)}
        value={valor || null}
        onChange={definir}
        placeholder={p.vazio}
        allowDeselect={false}
      />
    );
  else if (p.type === "password")
    campo = (
      <PasswordInput
        {...comum}
        value={valor}
        onChange={(e) => definir(e.currentTarget.value)}
        visibilityToggleButtonProps={{ "aria-label": "Mostrar" }}
        autoComplete="off"
      />
    );
  else
    campo = (
      <TextInput
        {...comum}
        type={p.type ?? "text"}
        value={valor}
        onChange={(e) => definir(e.currentTarget.value)}
        min={p.min}
        max={p.max}
        placeholder={p.placeholder}
      />
    );
  return (
    <div>
      {campo}
      {p.extra}
    </div>
  );
}

/** Grupo de opções exclusivas com Radio do Mantine. */
export function Seg<T extends Valores>({
  form,
  name,
  label,
  opcoes,
}: {
  form: UseFormReturnType<T>;
  name: string;
  label: string;
  opcoes: { value: string; label: string }[];
}) {
  const atual = String(
    (form.getInputProps(name as never) as unknown as { value?: unknown }).value ?? "",
  );
  return (
    <Radio.Group
      label={label}
      value={atual}
      onChange={(v) => form.setFieldValue(name as never, v as never)}
      mb="md"
    >
      <Group gap="md">
        {opcoes.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Group>
    </Radio.Group>
  );
}

/** Mostra erros 400/422 junto ao campo; sem campo, vira notificação. */
export function aplicarErros(form: { setErrors: (e: Record<string, string>) => void }, e: unknown) {
  const campos = (e as Schemas["ProblemDetail"])?.campos_invalidos;
  if (campos?.length) form.setErrors(Object.fromEntries(campos.map((c) => [c.campo, c.mensagem])));
  else notifications.show({ color: "red", message: msgErro(e) });
}

export const corErro: MantineColor = "red";
export const Erro = ({ children }: { children: ReactNode }) => (
  <Text c={corErro} size="sm" mt={4}>
    {children}
  </Text>
);
