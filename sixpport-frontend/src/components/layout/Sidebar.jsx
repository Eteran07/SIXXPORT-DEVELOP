import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  DoorOpen,
  CalendarClock,
  CalendarCheck,
  Users,
  ShieldAlert,
  UsersRound,
  FileBarChart,
  XCircle,
  Shield,
  Car,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { label: 'Resumen (Flotter)', icon: LayoutDashboard, to: '/resumen' },
  { label: 'Control de Accesos', icon: DoorOpen, to: '/accesos' },
  { label: 'Turnos y Novedades', icon: CalendarClock, to: '/turnos' },
  { label: 'Visitas Previas', icon: CalendarCheck, to: '/visitas' },
  { label: 'Personas y Vehículos', icon: Car, to: '/vehiculos' },
  { label: 'Lista Negra (Alertas)', icon: ShieldAlert, to: '/lista-negra', badge: 3 },
  {
    label: 'Usuarios y Roles',
    icon: UsersRound,
    to: '/usuarios',
    subItems: [
      { label: 'Usuarios', to: '/usuarios' },
      { label: 'Roles y Permisos', to: '/roles' },
    ],
  },
  { label: 'Reportes', icon: FileBarChart, to: '/reportes' },
];

const Sidebar = () => {
  const { cerrarSesion } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-sixx-sidebar border-r border-sixx-border flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
          <XCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="text-lg font-bold tracking-wider text-white">SIXXPORT</div>
          <div className="text-[10px] tracking-[0.2em] text-sixx-orange font-semibold">OPS SYSTEM</div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-500/15 text-white border-l-2 border-sixx-orange'
                      : 'text-sixx-gray hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="bg-pink-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
              {item.subItems && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.subItems.map((sub) => (
                    <NavLink
                      key={sub.to}
                      to={sub.to}
                      className={({ isActive }) =>
                        `block px-4 py-2 rounded-lg text-xs transition-colors ${
                          isActive
                            ? 'text-sixx-orange font-medium'
                            : 'text-sixx-muted hover:text-white'
                        }`
                      }
                    >
                      {sub.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Perfil inferior */}
      <div className="p-4 border-t border-sixx-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden border border-sixx-border">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=sgto-mendoza"
              alt="Perfil"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-white">Sgto. R. Mendoza</div>
            <div className="text-xs text-sixx-muted">Supervisor General</div>
          </div>
        </div>
        <button
          onClick={cerrarSesion}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-green-400 hover:bg-green-500/20 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Conexión Auditable
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
