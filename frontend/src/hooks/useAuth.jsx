import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);
let restoreInFlight;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    if (!restoreInFlight) {
      restoreInFlight = api.refreshSession().finally(() => { restoreInFlight = null; });
    }
    restoreInFlight
      .then((session) => {
        if (!active) return;
        setUser(session.user);
        setAccessToken(session.accessToken);
      })
      .catch(() => {})
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  async function registerAccount(payload) {
    const session = await api.register(payload);
    setUser(session.user);
    setAccessToken(session.accessToken);
    return session.user;
  }

  async function signIn(identifier, password) {
    const session = await api.login(identifier, password);
    setUser(session.user);
    setAccessToken(session.accessToken);
    return session.user;
  }

  async function signOut() {
    await api.logout().catch(() => {});
    setUser(null);
    setAccessToken("");
  }

  const value = useMemo(() => ({
    user,
    accessToken,
    ready,
    registerAccount,
    signIn,
    signOut,
  }), [user, accessToken, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error("useAuth must be used inside AuthProvider.");
  return auth;
}
