import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { getRoles, createRol, updateRol, deleteRol } from '../services/api';
import Modal from '../components/Modal';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [rolEditando, setRolEditando] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({ nombre: '', descripcion: '' });

  const cargarRoles = async () => {
    try {
      setCargando(true);
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      setError('No se pudieron cargar los roles.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarRoles();
  }, []);

  const abrirCrear = () => {
    setRolEditando(null);
    setForm({ nombre: '', descripcion: '' });
    setModalAbierto(true);
  };

  const abrirEditar = (r) => {
    setRolEditando(r);
    setForm({ nombre: r.nombre, descripcion: r.descripcion || '' });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (rolEditando) {
        await updateRol(rolEditando.id_rol, form);
      } else {
        await createRol(form);
      }
      setModalAbierto(false);
      await cargarRoles();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar rol');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    try {
      await deleteRol(modalEliminar.id_rol);
      setModalEliminar(null);
      await cargarRoles();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar rol');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sixx-orange mb-1">
            Plataforma Gerencial
            <span className="text-sixx-muted font-normal">• Configuración del sistema</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Roles y Permisos</h1>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center justify-center gap-2 rounded-lg bg-sixx-orange hover:bg-orange-600 text-white font-semibold px-5 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nuevo Rol
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-sixx-panel border border-sixx-border rounded-xl p-6">
        <p className="text-sm text-sixx-muted mb-6">
          Gestión de perfiles jerárquicos y permisos asignados a cada tipo de usuario.
        </p>

        {cargando ? (
          <div className="text-center py-12 text-sixx-muted">Cargando roles...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div
                key={r.id_rol}
                className="rounded-xl border border-sixx-border bg-[#0b0c10] p-5 hover:border-sixx-orange/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-fuchsia-500/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-fuchsia-400" />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => abrirEditar(r)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-sixx-gray hover:text-white transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setModalEliminar(r)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-sixx-gray hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{r.nombre}</h3>
                <p className="text-sm text-sixx-muted line-clamp-2">{r.descripcion || 'Sin descripción'}</p>
                <div className="mt-4 text-xs font-mono text-sixx-cyan">ID: #{String(r.id_rol).padStart(3, '0')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      <Modal titulo={rolEditando ? 'Editar Rol' : 'Nuevo Rol'} abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Nombre del Rol</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              rows={3}
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none resize-none"
            />
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
      <Modal titulo="Eliminar Rol" abierto={!!modalEliminar} onCerrar={() => setModalEliminar(null)} maxWidth="max-w-sm">
        <p className="text-sm text-sixx-gray mb-6">
          ¿Eliminar el rol <span className="text-white font-semibold">{modalEliminar?.nombre}</span>? Solo se podrá si no tiene usuarios asignados.
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
            Eliminar
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Roles;
