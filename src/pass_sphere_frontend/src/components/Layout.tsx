import { Link, useLocation } from "wouter";
import { PasswordIcon } from "./icons/Password";
import { TOTPIcon } from "./icons/TOTP";
import clsx from "clsx";
import { AuthContext } from "src/contexts/Auth";
import { useContext, useEffect } from "react";

const navItems = [
  {
    id: 1,
    url: "/password",
    icon: <PasswordIcon />,
    title: "Passwords",
  },
  {
    id: 2,
    url: "/totp",
    icon: <TOTPIcon />,
    title: "TOTPs",
  },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [location, navigate] = useLocation();

  const { authClient, isAuthenticated, login, logout, principalId } =
    useContext(AuthContext);

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate("/");
    }
  }, [isAuthenticated]);

  return (
    <div className="main-layout">
      <nav className="sidebar">
        <h2 className="logo">Pass Sphere</h2>

        <ul className="menu">
          {navItems.map((item) => (
            <li
              key={item.id}
              className={clsx("menu-item", { active: location === item.url })}
            >
              <Link href={item.url}>
                {item.icon}
                <span>{item.title}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div style={{flex: 1}}></div>

        {principalId && <div className="subtitle" style={{
          marginBottom: "8px",
          textAlign: "center",
          fontSize: "12px",
        }}>{principalId?.slice(0, 14) + "..." + principalId?.slice(-14)}</div>}

        <button
          style={{
            color: "white",
            fontWeight: 600,
          }}
          onClick={logout}
        >
          Logout
        </button>
      </nav>
      <main>{children}</main>
    </div>
  );
};
