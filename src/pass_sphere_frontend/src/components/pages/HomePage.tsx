import { useContext, useEffect } from "react";
import { useLocation } from "wouter";
import { AuthContext } from "../../contexts/Auth";

export const HomePage = () => {
  const [_, navigate] = useLocation();
  const { authClient, isAuthenticated, login } = useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/password");
    }
  }, [authClient, isAuthenticated]);

  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <p style={{ marginBottom: 10, fontSize: 18, fontWeight: 600 }}>
        Please authenticated with Internet Identity before using Pass Sphere
      </p>
      <button className="button" onClick={login}>
        Connect
      </button>

      <img
        src="/logo2.svg"
        height={40}
        style={{ position: "fixed", bottom: 20, right: 20 }}
      />
    </div>
  );
};
