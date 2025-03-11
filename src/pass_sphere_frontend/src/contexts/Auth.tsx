import { HttpAgent, Identity } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { createActor } from "declarations/pass_sphere_backend";
import {
  createContext,
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { getAES256GCMKey } from "src/utils/crypto";

type AuthContextValue = {
  symmetricKey: Uint8Array | undefined;
  authClient: AuthClient | undefined;
  identity: Identity | undefined;
  principalId: string | undefined;
  agent: HttpAgent | undefined;
  isAuthenticated: boolean | undefined;
  hasLoggedIn: boolean;
  login: () => void;
  logout: () => void;
};

const DEFAULT_AUTH_CONTEXT_VALUE = {
  symmetricKey: undefined,
  authClient: undefined,
  identity: undefined,
  agent: undefined,
  isAuthenticated: false,
  hasLoggedIn: false,
  principalId: undefined,
  login: () => {},
  logout: () => {},
};

const isDev = process.env.DFX_NETWORK !== "ic";

const AGENT_HOST = isDev ? "http://localhost:4943" : "https://icp0.io";

const iiUrl = isDev
  ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
  : `https://${process.env.CANISTER_ID_INTERNET_IDENTITY}.ic0.app`;
export const AuthContext = createContext<AuthContextValue>(
  DEFAULT_AUTH_CONTEXT_VALUE,
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authClient, setAuthClient] = useState<AuthClient | undefined>();
  const [identity, setIdentity] = useState<Identity | undefined>(undefined);
  const [agent, setAgent] = useState<HttpAgent | undefined>(undefined);
  const [principalId, setPrincipalId] = useState<string | undefined>(undefined);
  const [symmetricKey, setSymmetricKey] = useState<Uint8Array | undefined>();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(
    undefined,
  );
  const [hasLoggedIn, setHasLoggedIn] = useState<boolean>(false);

  useEffect(() => {
    AuthClient.create({
      idleOptions: {
        disableDefaultIdleCallback: true,
        disableIdle: true,
      },
    }).then(async (client) => {
      const isAuthenticated = await client.isAuthenticated();
      const identity = client.getIdentity();

      const agent: HttpAgent = await HttpAgent.create({
        identity,
        host: AGENT_HOST,
      });

      if (isDev) await agent.fetchRootKey();

      setAgent(agent);
      setIdentity(identity);
      setAuthClient(client);
      setIsAuthenticated(isAuthenticated);
    });
  }, []);

  const login = useCallback(() => {
    if (!authClient) return;
    console.log({ authClient, env: process.env });

    authClient.login({
      maxTimeToLive: BigInt(24 * 60 * 60 * 1000 * 1000 * 1000),
      identityProvider: iiUrl,
      onSuccess: async () => {
        const identity = authClient.getIdentity();
        setIdentity(identity);

        const agent: HttpAgent = await HttpAgent.create({
          identity,
          host: AGENT_HOST,
        });

        if (isDev) await agent.fetchRootKey();

        setAgent(agent);
        setIsAuthenticated(true);
        setHasLoggedIn(true);
      },
    });
  }, [authClient]);

  useLayoutEffect(() => {
    if (isAuthenticated && identity) {
      const principalId = identity.getPrincipal().toText();

      setPrincipalId(principalId);
    }
  }, [identity, isAuthenticated]);

  useEffect(() => {
    if (!agent || !isAuthenticated || !identity) return;

    const principal = identity.getPrincipal();
    const actor = createActor(process.env.CANISTER_ID_PASS_SPHERE_BACKEND!, {
      agent,
    });

    getAES256GCMKey({
      principal,
      actor,
    }).then(setSymmetricKey);
  }, [agent, isAuthenticated]);

  const logout = useCallback(() => {
    authClient?.logout();
    setIsAuthenticated(false);
    setIdentity(undefined);
    setPrincipalId(undefined);
  }, [authClient]);

  return (
    <AuthContext.Provider
      value={{
        symmetricKey,
        authClient,
        identity,
        agent,
        isAuthenticated,
        hasLoggedIn,
        principalId,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
