import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, XCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);

    try {
      await iniciarSesion(email, password);
      navigate('/usuarios');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-sixx-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <XCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
          </div>
          <div className="leading-tight">
            <div className="text-2xl font-bold tracking-wider text-white">SIXXPORT</div>
            <div className="text-xs tracking-[0.25em] text-sixx-orange font-semibold">OPS SYSTEM</div>
          </div>
        </div>

        <div className="bg-sixx-panel border border-sixx-border rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-sixx-orange" />
            <h1 className="text-xl font-bold text-white">Acceso Operativo</h1>
          </div>
          <p className="text-sm text-sixx-muted mb-6">
            Ingrese sus credenciales de seguridad para continuar
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-sixx-muted mb-2">
                Correo institucional
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@sixxport.com"
                required
                className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-3 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none focus:ring-1 focus:ring-sixx-orange transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wide text-sixx-muted mb-2">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={mostrarPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-3 pr-10 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none focus:ring-1 focus:ring-sixx-orange transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sixx-muted hover:text-white"
                >
                  {mostrarPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full rounded-lg bg-sixx-orange hover:bg-orange-600 text-white font-semibold py-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {cargando ? 'Verificando...' : 'Ingresar al Sistema'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-sixx-muted">
            Sistema auditado · Conexión segura
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
