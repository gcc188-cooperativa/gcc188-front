import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, type Schemas } from "../../shared/api/client";

type Ctx = {
  user: Schemas["SessaoUsuario"] | null;
  loading: boolean;
  setUser: (u: Schemas["SessaoUsuario"] | null) => void;
  logout: () => Promise<void>;
};
const S = createContext<Ctx>(null as never);
export const useSession = () => useContext(S);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Schemas["SessaoUsuario"] | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();
  // O token não é legível pelo JS: usuário, papel e vínculo vêm de /auth/me.
  useEffect(() => {
    api
      .GET("/auth/me")
      .then((r) => setUser(r.data ?? null))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    const f = () => {
      setUser(null);
      qc.clear();
    };
    addEventListener("sessao-expirada", f);
    return () => removeEventListener("sessao-expirada", f);
  }, [qc]);
  const logout = async () => {
    await api.POST("/auth/logout");
    setUser(null);
    qc.clear();
  };
  return <S.Provider value={{ user, loading, setUser, logout }}>{children}</S.Provider>;
}
