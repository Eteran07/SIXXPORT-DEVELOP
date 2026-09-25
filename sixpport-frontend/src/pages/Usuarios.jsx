import { useEffect, useState } from 'react';
import { Search, Clock, ShieldCheck, UsersRound, UserCog, Activity, Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, getRoles } from '../services/api';
import Modal from '../components/Modal';

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
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [hora, setHora] = useState(new Date().toISOString().split('T')[1].split('.')[0] + ' UTC');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    id_rol: '',
    nombre_completo: '',
    dni: '',
    email: '',
    password: '',
    estado: 'Activo',
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setHora(new Date().toISOString().split('T')[1].split('.')[0] + ' UTC');
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      const [dataUsuarios, dataRoles] = await Promise.all([getUsuarios(), getRoles()]);
      const conDetalles = dataUsuarios.map((u, i) => ({
        ...u,
        sede: sedes[i % sedes.length],
        ultimo_ingreso_fmt: horarios[i % horarios.length],
      }));
      setUsuarios(conDetalles);
      setRoles(dataRoles);
    } catch (err) {
      setError('No se pudo cargar el listado de usuarios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirCrear = () => {
    setUsuarioEditando(null);
    setForm({ id_rol: roles[0]?.id_rol || '', nombre_completo: '', dni: '', email: '', password: '', estado: 'Activo' });
    setModalAbierto(true);
  };

  const abrirEditar = (u) => {
    setUsuarioEditando(u);
    setForm({
      id_rol: u.id_rol,
      nombre_completo: u.nombre_completo,
      dni: u.dni,
      email: u.email,
      password: '',
      estado: u.estado,
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (usuarioEditando) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await updateUsuario(usuarioEditando.id_usuario, payload);
      } else {
        await createUsuario(form);
      }
      setModalAbierto(false);
      await cargarDatos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar usuario');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    try {
      await deleteUsuario(modalEliminar.id_usuario);
      setModalEliminar(null);
      await cargarDatos();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const filtrados = usuarios.filter((u) =>
    u.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.rol?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.sede?.toLowerCase().includes(busqueda.toLowerCase())
  );

  const totalUsuarios = usuarios.length;
  const vigilantesActivos = usuarios.filter((u) => u.rol === 'Vigilante Garita' && u.estado === 'Activo').length;
  const rolesConfigurados = roles.length;
  const sesionesConcurrentes = 3;

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
        <StatCard label="Total Usuarios" value={String(totalUsuarios).padStart(2, '0')} sub="Cuentas activas en sistema" color="cyan" icon={UsersRound} />
        <StatCard label="Vigilantes Activos" value={String(vigilantesActivos).padStart(2, '0')} sub="En garitas de la sede" color="orange" icon={ShieldCheck} />
        <StatCard label="Roles Configurados" value={String(rolesConfigurados).padStart(2, '0')} sub="Perfiles jerárquicos" color="purple" icon={UserCog} />
        <StatCard label="Sesiones Concurrentes" value={String(sesionesConcurrentes).padStart(2, '0')} sub="Auditoría de firmas activas" color="green" icon={Activity} />
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Contenido principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabla de usuarios */}
        <div className="xl:col-span-2 bg-sixx-panel border border-sixx-border rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Control de Cuentas y Accesos de Personal</h2>
              <p className="text-sm text-sixx-muted">Gestión de identidades del equipo de seguridad</p>
            </div>
            <div className="flex items-center gap-3">
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
              <button
                onClick={abrirCrear}
                className="flex items-center gap-2 rounded-lg bg-sixx-orange hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="text-center py-12 text-sixx-muted">Cargando personal...</div>
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
                    <th className="pb-3 font-medium text-right pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((u) => (
                    <tr key={u.id_usuario} className="border-b border-sixx-border/50 hover:bg-white/[0.02]">
                      <td className="py-4 pl-4 font-medium text-white">{u.nombre_completo}</td>
                      <td className="py-4 text-sixx-gray">{formatearRol(u.rol)}</td>
                      <td className="py-4 text-sixx-cyan font-mono">{u.ultimo_ingreso_fmt}</td>
                      <td className="py-4 text-sixx-gray">{u.sede}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${u.estado === 'Activo' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-gray-500/10 border-gray-500/30 text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.estado === 'Activo' ? 'bg-green-400' : 'bg-gray-400'}`} />
                          {u.estado}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(u)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-sixx-gray hover:text-white transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setModalEliminar(u)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-sixx-gray hover:text-red-400 transition-colors"
                            title="Inactivar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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

          <div className="bg-sixx-panel border border-sixx-border rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Añadir Operador / Vigilante</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">Nombre Completo</label>
                <input type="text" placeholder="Ej. Carlos Fuentes L." className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">DNI</label>
                <input type="text" placeholder="Ej. 18.245.922-1" className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none" />
              </div>
              <button type="button" className="w-full rounded-lg bg-sixx-orange hover:bg-orange-600 text-white font-semibold py-3 transition-colors">
                Registrar Operador sin Auto-Registro
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <Modal titulo={usuarioEditando ? 'Editar Usuario' : 'Nuevo Usuario'} abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Nombre Completo</label>
            <input
              type="text"
              value={form.nombre_completo}
              onChange={(e) => setForm({ ...form, nombre_completo: e.target.value })}
              required
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-sixx-muted mb-1.5">DNI</label>
              <input
                type="text"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
                required
                className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-sixx-muted mb-1.5">Rol</label>
              <select
                value={form.id_rol}
                onChange={(e) => setForm({ ...form, id_rol: parseInt(e.target.value) })}
                required
                className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white focus:border-sixx-orange focus:outline-none"
              >
                {roles.map((r) => (
                  <option key={r.id_rol} value={r.id_rol}>{r.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">
              {usuarioEditando ? 'Nueva Contraseña (dejar vacío para mantener)' : 'Contraseña'}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required={!usuarioEditando}
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Estado</label>
            <select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white focus:border-sixx-orange focus:outline-none"
            >
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-sixx-gray hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-4 py-2 rounded-lg bg-sixx-orange hover:bg-orange-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Eliminar */}
      <Modal titulo="Inactivar Usuario" abierto={!!modalEliminar} onCerrar={() => setModalEliminar(null)} maxWidth="max-w-sm">
        <p className="text-sm text-sixx-gray mb-6">
          ¿Está seguro de inactivar al usuario <span className="text-white font-semibold">{modalEliminar?.nombre_completo}</span>? Esta acción lo deshabilitará del sistema.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setModalEliminar(null)}
            className="px-4 py-2 rounded-lg text-sm font-medium text-sixx-gray hover:text-white transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleEliminar}
            className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-sm font-semibold transition-colors"
          >
            Inactivar
          </button>
        </div>
      </Modal>
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
