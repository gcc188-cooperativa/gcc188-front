import { Group, NativeSelect, PasswordInput, Radio, TextInput } from "@mantine/core";
import type { UseFormReturnType } from "@mantine/form";
import type { ReactNode } from "react";
import { msgErro, type Schemas } from "../api/client";
import { Icone } from "./icons";
import { toast } from "./toast";

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
type Ligacao = { value?: unknown; onChange: (e: unknown) => void; error?: ReactNode };

/** Campo do protótipo sobre os inputs do Mantine: rótulo, controle, dica e erro com ícone junto ao campo. */
export function Campo<T extends Valores>(p: Props<T>) {
  const g = p.form.getInputProps(p.name as never) as unknown as Ligacao;
  const id = `f-${p.name}`,
    v = String(g.value ?? "");
  const erro = g.error ? (
    <span className="msg-i">
      <Icone n="alert" />
      {g.error}
    </span>
  ) : undefined;
  const comum = {
    id,
    label: p.label,
    error: erro,
    description: p.hint,
    inputWrapperOrder: ["label", "input", "description", "error"] as (
      "label" | "input" | "description" | "error"
    )[],
    mb: "sm" as const,
  };
  return (
    <div className="fd">
      {p.opcoes ? (
        <NativeSelect
          {...comum}
          value={v}
          disabled={p.desabilitado}
          onChange={g.onChange}
          data={[...(p.vazio !== undefined ? [{ value: "", label: p.vazio }] : []), ...p.opcoes]}
        />
      ) : p.type === "password" ? (
        <PasswordInput {...comum} value={v} onChange={g.onChange} />
      ) : (
        <TextInput
          {...comum}
          type={p.type ?? "text"}
          value={v}
          min={p.min}
          max={p.max}
          placeholder={p.placeholder}
          disabled={p.desabilitado}
          onChange={g.onChange}
        />
      )}
      {p.extra}
    </div>
  );
}
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
  const atual = String((form.getInputProps(name as never) as unknown as Ligacao).value ?? "");
  return (
    <Radio.Group
      label={label}
      value={atual}
      onChange={(x) => form.setFieldValue(name as never, x as never)}
      mb="sm"
    >
      <Group mt={4}>
        {opcoes.map((o) => (
          <Radio key={o.value} value={o.value} label={o.label} />
        ))}
      </Group>
    </Radio.Group>
  );
}
/** Mostra erros 400/422 junto ao campo (RF-WEB-04, CA-09); sem campo, vira aviso. */
export function aplicarErros(form: { setErrors: (e: Record<string, string>) => void }, e: unknown) {
  const campos = (e as Schemas["ProblemDetail"])?.campos_invalidos;
  if (campos?.length) form.setErrors(Object.fromEntries(campos.map((c) => [c.campo, c.mensagem])));
  else toast(msgErro(e), true);
}
