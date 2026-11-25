import { Button, TextInput } from "@mantine/core";
import { modals } from "@mantine/modals";
import { useState } from "react";

export type CfgConfirmar = {
  titulo: string;
  mensagem?: string;
  perigo?: boolean;
  campo?: { rotulo: string; tipo?: string };
  aoConfirmar: (texto: string) => void | Promise<void>;
};

function Corpo({ c, id }: { c: CfgConfirmar; id: string }) {
  const [txt, setTxt] = useState("");
  return (
    <>
      <p style={{ margin: "0 0 12px" }}>
        {c.mensagem ?? "Esta ação não pode ser desfeita. Deseja continuar?"}
      </p>
      {c.campo && (
        <TextInput
          mb="md"
          data-autofocus
          label={c.campo.rotulo}
          type={c.campo.tipo ?? "text"}
          value={txt}
          onChange={(e) => setTxt(e.currentTarget.value)}
        />
      )}
      <div className="acts" style={{ justifyContent: "flex-end" }}>
        <Button variant="default" className="bt" onClick={() => modals.close(id)}>
          Voltar
        </Button>
        <Button
          variant="default"
          className={`bt ${c.perigo ? "danger" : "pri"}`}
          disabled={!!c.campo && !txt.trim()}
          onClick={() => {
            modals.close(id);
            void c.aoConfirmar(txt.trim());
          }}
        >
          Confirmar
        </Button>
      </div>
    </>
  );
}
/** Diálogo de confirmação (RF-WEB-10); `campo` pede um texto obrigatório (motivo, justificativa, senha). */
export function confirmar(c: CfgConfirmar) {
  const id = `confirmar-${Date.now()}`;
  modals.open({
    modalId: id,
    title: c.titulo,
    centered: true,
    size: 420,
    transitionProps: { duration: 0 },
    classNames: { content: "dlg", title: "dlg-t" },
    children: <Corpo c={c} id={id} />,
  });
}
