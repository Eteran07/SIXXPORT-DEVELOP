import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ShieldAlert, AlertTriangle, Search, User, Car } from 'lucide-react';
import { getListaNegra, createBloqueo, updateBloqueo, deleteBloqueo } from '../services/api';
import Modal from '../components/Modal';

const nivelesRiesgo = ['Crítico', 'Alto', 'Bajo'];
const tiposEntidad = [
  { value: 'Persona', label: 'Persona (DNI)', icon: User },
  { value: 'Vehiculo', label: 'Vehículo (Placa)', icon: Car },
];

const colorPorRiesgo = {
  Crítico: 'bg-red-500/10 border-red-500/30 text-red-400',
  Alto: 'bg-orange-500/10 border-orange-500/30 text-sixx-orange',
  Bajo: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

const ListaNegra = () => {
  const [bloqueos, setBloqueos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [bloqueoEditando, setBloqueoEditando] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    tipo_entidad: 'Persona',
    identificador: '',
    motivo_bloqueo: '',
    nivel_riesgo: 'Alto',
  });

  const cargar = async () => {
    try {
      setCargando(true);
      const data = await getListaNegra();
      setBloqueos(data);
    } catch (err) {
      setError('No se pudo cargar la lista negra.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirCrear = () => {
    setBloqueoEditando(null);
    setForm({ tipo_entidad: 'Persona', identificador: '', motivo_bloqueo: '', nivel_riesgo: 'Alto' });
    setModalAbierto(true);
  };

  const abrirEditar = (b) => {
    setBloqueoEditando(b);
    setForm({
      tipo_entidad: b.tipo_entidad,
      identificador: b.identificador,
      motivo_bloqueo: b.motivo_bloqueo,
      nivel_riesgo: b.nivel_riesgo,
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (bloqueoEditando) {
        await updateBloqueo(bloqueoEditando.id_bloqueo, form);
      } else {
        await createBloqueo(form);
      }
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar bloqueo');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    try {
      await deleteBloqueo(modalEliminar.id_bloqueo);
      setModalEliminar(null);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar bloqueo');
    }
  };

  const filtrados = bloqueos.filter((b) =>
    b.identificador?.toLowerCase().includes(busqueda.toLowerCase()) ||
    b.motivo_bloqueo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    b.reportado_por_nombre?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sixx-orange mb-1">
            Seguridad
            <span className="text-sixx-muted font-normal">• Control de riesgos</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Lista Negra</h1>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center justify-center gap-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold px-5 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Vetar DNI / Placa
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="bg-sixx-panel border border-sixx-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <p className="text-sm text-sixx-muted">Registro de personas y vehículos vetados del ingreso a las instalaciones.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sixx-muted" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar DNI, placa o motivo..."
              className="pl-9 pr-4 py-2 rounded-lg bg-[#0b0c10] border border-sixx-border text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none w-full sm:w-72"
            />
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-sixx-muted">Cargando lista negra...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sixx-border text-sixx-muted">
                  <th className="pb-3 font-medium pl-4">Tipo</th>
                  <th className="pb-3 font-medium">Identificador</th>
                  <th className="pb-3 font-medium">Motivo</th>
                  <th className="pb-3 font-medium">Riesgo</th>
                  <th className="pb-3 font-medium">Reportado por</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium text-right pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((b) => {
                  const IconTipo = b.tipo_entidad === 'Persona' ? User : Car;
                  return (
                    <tr key={b.id_bloqueo} className="border-b border-sixx-border/50 hover:bg-white/[0.02]">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-2">
                          <IconTipo className="w-4 h-4 text-sixx-muted" />
                          <span className="text-white">{b.tipo_entidad}</span>
                        </div>
                      </td>
                      <td className="py-4 font-mono text-sixx-cyan">{b.identificador}</td>
                      <td className="py-4 text-sixx-gray max-w-xs truncate">{b.motivo_bloqueo}</td>
                      <td className="py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${colorPorRiesgo[b.nivel_riesgo]}`}>
                          {b.nivel_riesgo}
                        </span>
                      </td>
                      <td className="py-4 text-sixx-gray">{b.reportado_por_nombre || 'Sistema'}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${b.estado === 'Activo' ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-gray-500/10 border-gray-500/30 text-gray-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${b.estado === 'Activo' ? 'bg-red-400' : 'bg-gray-400'}`} />
                          {b.estado}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => abrirEditar(b)}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-sixx-gray hover:text-white transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setModalEliminar(b)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-sixx-gray hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtrados.length === 0 && (
              <div className="text-center py-8 text-sixx-muted">No se encontraron registros.</div>
            )}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      <Modal titulo={bloqueoEditando ? 'Editar Bloqueo' : 'Nuevo Bloqueo'} abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Tipo de Entidad</label>
            <div className="grid grid-cols-2 gap-3">
              {tiposEntidad.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, tipo_entidad: t.value })}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                      form.tipo_entidad === t.value
                        ? 'bg-sixx-orange/10 border-sixx-orange text-white'
                        : 'border-sixx-border text-sixx-gray hover:text-white hover:border-sixx-orange/50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">
              {form.tipo_entidad === 'Persona' ? 'DNI' : 'Placa'}
            </label>
            <input
              type="text"
              value={form.identificador}
              onChange={(e) => setForm({ ...form, identificador: e.target.value })}
              required
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Motivo del Bloqueo</label>
            <textarea
              value={form.motivo_bloqueo}
              onChange={(e) => setForm({ ...form, motivo_bloqueo: e.target.value })}
              rows={3}
              required
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Nivel de Riesgo</label>
            <select
              value={form.nivel_riesgo}
              onChange={(e) => setForm({ ...form, nivel_riesgo: e.target.value })}
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white focus:border-sixx-orange focus:outline-none"
            >
              {nivelesRiesgo.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
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
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Eliminar */}
      <Modal titulo="Eliminar Bloqueo" abierto={!!modalEliminar} onCerrar={() => setModalEliminar(null)} maxWidth="max-w-sm">
        <p className="text-sm text-sixx-gray mb-6">
          ¿Eliminar el bloqueo de <span className="text-white font-semibold">{modalEliminar?.identificador}</span>? El registro se borrará permanentemente.
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

export default ListaNegra;
