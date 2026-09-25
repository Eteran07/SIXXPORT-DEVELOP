import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Usuarios from './pages/Usuarios';
import Roles from './pages/Roles';
import ListaNegra from './pages/ListaNegra';
import Vehiculos from './pages/Vehiculos';

const RutaProtegida = ({ children }) => {
  const { autenticado, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen bg-sixx-bg flex items-center justify-center text-sixx-muted">
        Cargando sistema...
      </div>
    );
  }

  return autenticado ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
};

const RutaPublica = ({ children }) => {
  const { autenticado, cargando } = useAuth();
  if (cargando) return null;
  return autenticado ? <Navigate to="/usuarios" replace /> : children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <RutaPublica>
                <Login />
              </RutaPublica>
            }
          />
          <Route
            path="/usuarios"
            element={
              <RutaProtegida>
                <Usuarios />
              </RutaProtegida>
            }
          />
          <Route
            path="/roles"
            element={
              <RutaProtegida>
                <Roles />
              </RutaProtegida>
            }
          />
          <Route
            path="/lista-negra"
            element={
              <RutaProtegida>
                <ListaNegra />
              </RutaProtegida>
            }
          />
          <Route
            path="/vehiculos"
            element={
              <RutaProtegida>
                <Vehiculos />
              </RutaProtegida>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
