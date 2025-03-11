import { Route, Switch } from "wouter";
import { AboutPage } from "./components/pages/AboutPage";
import { PasswordPage } from "./components/pages/PasswordPage";
import { TOTPPage } from "./components/pages/TOTPPage";
import { NotFoundPage } from "./components/pages/NotFoundPage";
import { HomePage } from "./components/pages/HomePage";


export const Routes = () => {

  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/password" component={PasswordPage} />
      <Route path="/totp" component={TOTPPage} />
      <Route component={NotFoundPage} />
    </Switch>
  );
};
