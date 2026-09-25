import { useEffect, useState } from 'react';
import { Search, Clock, ShieldCheck, UsersRound, UserCog, Activity } from 'lucide-react';
import { getUsuarios } from '../services/api';

// Datos complementarios de ejemplo para la UI
const sedes = ['Norte-Alamar', 'Corporativa Central', 'Multisede', 'Sur-Industrial'];
const horarios = ['06:00:15 UTC', '05:58:30 UTC', 'Ayer 18:24 UTC', '07:11:45 UTC', '04:32:10 UTC'];

const formatearRol = (rol) => {
  const map = {
    'Gerencia': 'Gerencia General',
    'Vigilancia': 'Vigilante de Turno',
    'RRHH': 'RRHH / Administración',
  };
  return map[rol] || rol;
};

const Usuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [hora, setHora] = useState(new Date().toISOString().split('T')[1].split('.')[0] + ' UTC');

  useEffect(() => {
    const interval = setInterval(() => {
      setHora(new Date().toISOString().split('T')[1].split('.')[0] + ' UTC');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cargar = async () => {
      try {
        const data = await getUsuarios();
        // Enriquecer datos con sede/último ingreso de ejemplo
        const conDetalles = data.map((u, i) => ({
          ...u,
          sede: sedes[i % sedes.length],
          ultimoIngreso: horarios[i % horarios.length],
        }));
        setUsuarios(conDetalles);
      } catch (err) {
        setError('No se pudo cargar el listado de usuarios.');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  const filtrados = usuarios.filter((u) =>
    u.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.rol?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.sede?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalUsuarios = usuarios.length;
  const vigilantesActivos = usuarios.filter((u) => u.rol === 'Vigilancia' && u.estado === 'Activo').length;
  const rolesConfigurados = new Set(usuarios.map((u) => u.rol)).size;
  const sesionesConcurrentes = 3; // Valor fijo de ejemplo

  return (
    <div className="space-y-6">
      {/* Header superior */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sixx-orange mb-1">
            Plataforma Gerencial
            <span className="text-sixx-muted font-normal">• Sede Corporativa: Norte-Alamar</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Usuarios, Roles y Permisos</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-center">
            <div className="text-[10px] uppercase tracking-wide text-sixx-muted">Turno Activo</div>
            <div className="text-sm font-semibold text-sixx-cyan">Alfa (06:00 - 18:00)</div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-sixx-border bg-sixx-panel px-4 py-2">
            <Clock className="w-4 h-4 text-sixx-muted" />
            <span className="text-sm font-mono text-white">{hora}</span>
          </div>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Usuarios"
          value={totalUsuarios.toString().padStart(2, '0')}
          sub="Cuentas activas en sistema"
          color="cyan"
          icon={UsersRound}
        />
        <StatCard
          label="Vigilantes Activos"
          value={vigilantesActivos.toString().padStart(2, '0')}
          sub="En garitas de la sede"
          color="orange"
          icon={ShieldCheck}
        />
        <StatCard
          label="Roles Configurados"
          value={rolesConfigurados.toString().padStart(2, '0')}
          sub="Perfiles jerárquicos"
          color="purple"
          icon={UserCog}
        />
        <StatCard
          label="Sesiones Concurrentes"
          value={sesionesConcurrentes.toString().padStart(2, '0')}
          sub="Auditoría de firmas activas"
          color="green"
          icon={Activity}
        />
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabla de usuarios */}
        <div className="xl:col-span-2 bg-sixx-panel border border-sixx-border rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Control de Cuentas y Accesos de Personal</h2>
              <p className="text-sm text-sixx-muted">Gestión de identidades del equipo de seguridad</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sixx-muted" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar usuario..."
                className="pl-9 pr-4 py-2 rounded-lg bg-[#0b0c10] border border-sixx-border text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none w-full sm:w-64"
              />
            </div>
          </div>

          {cargando ? (
            <div className="text-center py-12 text-sixx-muted">Cargando personal...</div>
          ) : error ? (
            <div className="text-center py-12 text-red-400">{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sixx-border text-sixx-muted">
                    <th className="pb-3 font-medium pl-4">Usuario</th>
                    <th className="pb-3 font-medium">Rol / Perfil</th>
                    <th className="pb-3 font-medium">Último Ingreso</th>
                    <th className="pb-3 font-medium">Sede</th>
                    <th className="pb-3 font-medium">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((u) => (
                    <tr key={u.id_usuario} className="border-b border-sixx-border/50 hover:bg-white/[0.02]">
                      <td className="py-4 pl-4 font-medium text-white">{u.nombre_completo}</td>
                      <td className="py-4 text-sixx-gray">{formatearRol(u.rol)}</td>
                      <td className="py-4 text-sixx-cyan font-mono">{u.ultimoIngreso}</td>
                      <td className="py-4 text-sixx-gray">{u.sede}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${
                            u.estado === 'Activo'
                              ? 'bg-green-500/10 border-green-500/30 text-green-400'
                              : 'bg-gray-500/10 border-gray-500/30 text-gray-400'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.estado === 'Activo' ? 'bg-green-400' : 'bg-gray-400'}`} />
                          {u.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtrados.length === 0 && (
                <div className="text-center py-8 text-sixx-muted">No se encontraron usuarios.</div>
              )}
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Ficha operativa */}
          <div className="bg-sixx-panel border border-sixx-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">Ficha Operativa Vigilante</h3>
              <span className="text-xs font-mono text-sixx-cyan">ID: #VIG-402</span>
            </div>
            <div className="flex items-center gap-3 mb-5">
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=tomas-caceres"
                alt="Tomás Cáceres"
                className="w-14 h-14 rounded-full bg-gray-700 border border-sixx-border"
              />
              <div>
                <div className="font-bold text-white">Tomás Cáceres V.</div>
                <div className="text-xs text-sixx-muted">Vigilante Principal Sede Norte</div>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-sixx-muted mb-2">Capacitaciones Vigentes</div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded border border-green-500/40 bg-green-500/10 px-2 py-1 text-xs text-green-400">Armas No Letales</span>
                <span className="rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-xs text-sixx-cyan">CCTV Nivel 1</span>
                <span className="rounded border border-orange-500/40 bg-orange-500/10 px-2 py-1 text-xs text-sixx-orange">Protocolo de Incendios</span>
              </div>
            </div>
          </div>

          {/* Añadir operador */}
          <div className="bg-sixx-panel border border-sixx-border rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Añadir Operador / Vigilante</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej. Carlos Fuentes L."
                  className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">DNI</label>
                <input
                  type="text"
                  placeholder="Ej. 18.245.922-1"
                  className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
                />
              </div>
              <button
                type="button"
                className="w-full rounded-lg bg-sixx-orange hover:bg-orange-600 text-white font-semibold py-3 transition-colors"
              >
                Registrar Operador sin Auto-Registro
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, sub, color, icon: Icon }) => {
  const colorClasses = {
    cyan: { text: 'text-sixx-cyan', glow: 'text-glow-cyan', iconBg: 'bg-cyan-500/10', iconColor: 'text-cyan-400' },
    orange: { text: 'text-sixx-orange', glow: 'text-glow-orange', iconBg: 'bg-orange-500/10', iconColor: 'text-orange-400' },
    purple: { text: 'text-fuchsia-500', glow: 'text-glow-purple', iconBg: 'bg-fuchsia-500/10', iconColor: 'text-fuchsia-400' },
    green: { text: 'text-emerald-500', glow: 'text-glow-green', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
  };
  const c = colorClasses[color];

  return (
    <div className="bg-sixx-panel border border-sixx-border rounded-xl p-5 flex items-start justify-between">
      <div>
        <div className="text-sm text-sixx-gray mb-1">{label}</div>
        <div className={`text-4xl font-bold ${c.text} ${c.glow} font-mono`}>{value}</div>
        <div className="text-xs text-sixx-muted mt-2">{sub}</div>
      </div>
      <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center`}>
        <Icon className={`w-5 h-5 ${c.iconColor}`} />
      </div>
    </div>
  );
};

export default Usuarios;
