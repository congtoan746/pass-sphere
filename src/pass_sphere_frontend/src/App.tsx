import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/Auth";
import { Routes } from "./Routes";

function App() {
  return (
    <AuthProvider>
      <Toaster position="bottom-center" />
      <Routes />
    </AuthProvider>
  );
}

export default App;
