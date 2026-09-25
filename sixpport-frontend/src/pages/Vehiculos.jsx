import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Car, User, Search } from 'lucide-react';
import { getVehiculos, createVehiculo, updateVehiculo, deleteVehiculo, getConductores, createConductor, updateConductor, deleteConductor } from '../services/api';
import Modal from '../components/Modal';

const categorias = ['Trabajador', 'Visitante', 'Contratista', 'Proveedor', 'Organismo Oficial'];

const Vehiculos = () => {
  const [tab, setTab] = useState('vehiculos');
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [formVehiculo, setFormVehiculo] = useState({ placa: '', modelo: '', color: '' });
  const [formConductor, setFormConductor] = useState({ dni: '', nombre_completo: '', empresa: '', categoria: 'Contratista' });

  const cargar = async () => {
    try {
      setCargando(true);
      const [v, c] = await Promise.all([getVehiculos(), getConductores()]);
      setVehiculos(v);
      setConductores(c);
    } catch (err) {
      setError('No se pudieron cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const abrirCrear = () => {
    setItemEditando(null);
    setFormVehiculo({ placa: '', modelo: '', color: '' });
    setFormConductor({ dni: '', nombre_completo: '', empresa: '', categoria: 'Contratista' });
    setModalAbierto(true);
  };

  const abrirEditar = (item) => {
    setItemEditando(item);
    if (tab === 'vehiculos') {
      setFormVehiculo({ placa: item.placa, modelo: item.modelo || '', color: item.color || '' });
    } else {
      setFormConductor({ dni: item.dni, nombre_completo: item.nombre_completo, empresa: item.empresa || '', categoria: item.categoria });
    }
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (tab === 'vehiculos') {
        if (itemEditando) {
          await updateVehiculo(itemEditando.id_vehiculo, formVehiculo);
        } else {
          await createVehiculo(formVehiculo);
        }
      } else {
        if (itemEditando) {
          await updateConductor(itemEditando.id_persona, formConductor);
        } else {
          await createConductor(formConductor);
        }
      }
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const handleEliminar = async () => {
    if (!modalEliminar) return;
    try {
      if (tab === 'vehiculos') {
        await deleteVehiculo(modalEliminar.id_vehiculo);
      } else {
        await deleteConductor(modalEliminar.id_persona);
      }
      setModalEliminar(null);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const dataActual = tab === 'vehiculos' ? vehiculos : conductores;
  const filtrados = dataActual.filter((item) => {
    const term = busqueda.toLowerCase();
    if (tab === 'vehiculos') {
      return item.placa?.toLowerCase().includes(term) || item.modelo?.toLowerCase().includes(term) || item.color?.toLowerCase().includes(term);
    }
    return item.dni?.toLowerCase().includes(term) || item.nombre_completo?.toLowerCase().includes(term) || item.empresa?.toLowerCase().includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sixx-orange mb-1">
            Operaciones
            <span className="text-sixx-muted font-normal">• Control de flota y personal</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Vehículos y Conductores</h1>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center justify-center gap-2 rounded-lg bg-sixx-orange hover:bg-orange-600 text-white font-semibold px-5 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {tab === 'vehiculos' ? 'Nuevo Vehículo' : 'Nuevo Conductor'}
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
          <div className="flex items-center gap-2 p-1 rounded-lg bg-[#0b0c10] border border-sixx-border">
            <button
              onClick={() => { setTab('vehiculos'); setBusqueda(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'vehiculos' ? 'bg-sixx-orange text-white' : 'text-sixx-gray hover:text-white'
              }`}
            >
              <Car className="w-4 h-4" />
              Vehículos
            </button>
            <button
              onClick={() => { setTab('conductores'); setBusqueda(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'conductores' ? 'bg-sixx-orange text-white' : 'text-sixx-gray hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              Conductores
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sixx-muted" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder={tab === 'vehiculos' ? 'Buscar placa o modelo...' : 'Buscar DNI o nombre...'}
              className="pl-9 pr-4 py-2 rounded-lg bg-[#0b0c10] border border-sixx-border text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none w-full sm:w-72"
            />
          </div>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-sixx-muted">Cargando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sixx-border text-sixx-muted">
                  {tab === 'vehiculos' ? (
                    <>
                      <th className="pb-3 font-medium pl-4">Placa</th>
                      <th className="pb-3 font-medium">Modelo</th>
                      <th className="pb-3 font-medium">Color</th>
                    </>
                  ) : (
                    <>
                      <th className="pb-3 font-medium pl-4">DNI</th>
                      <th className="pb-3 font-medium">Nombre Completo</th>
                      <th className="pb-3 font-medium">Categoría</th>
                      <th className="pb-3 font-medium">Empresa</th>
                    </>
                  )}
                  <th className="pb-3 font-medium text-right pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((item) => (
                  <tr key={tab === 'vehiculos' ? item.id_vehiculo : item.id_persona} className="border-b border-sixx-border/50 hover:bg-white/[0.02]">
                    {tab === 'vehiculos' ? (
                      <>
                        <td className="py-4 pl-4 font-mono text-sixx-cyan">{item.placa}</td>
                        <td className="py-4 text-white">{item.modelo || '-'}</td>
                        <td className="py-4 text-sixx-gray">{item.color || '-'}</td>
                      </>
                    ) : (
                      <>
                        <td className="py-4 pl-4 font-mono text-sixx-cyan">{item.dni}</td>
                        <td className="py-4 text-white">{item.nombre_completo}</td>
                        <td className="py-4 text-sixx-gray">{item.categoria}</td>
                        <td className="py-4 text-sixx-gray">{item.empresa || '-'}</td>
                      </>
                    )}
                    <td className="py-4 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => abrirEditar(item)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-sixx-gray hover:text-white transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setModalEliminar(item)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-sixx-gray hover:text-red-400 transition-colors"
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
              <div className="text-center py-8 text-sixx-muted">No se encontraron registros.</div>
            )}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      <Modal titulo={itemEditando ? 'Editar' : 'Nuevo'} abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'vehiculos' ? (
            <>
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">Placa</label>
                <input
                  type="text"
                  value={formVehiculo.placa}
                  onChange={(e) => setFormVehiculo({ ...formVehiculo, placa: e.target.value })}
                  required
                  className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">Modelo</label>
                <input
                  type="text"
                  value={formVehiculo.modelo}
                  onChange={(e) => setFormVehiculo({ ...formVehiculo, modelo: e.target.value })}
                  className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">Color</label>
                <input
                  type="text"
                  value={formVehiculo.color}
                  onChange={(e) => setFormVehiculo({ ...formVehiculo, color: e.target.value })}
                  className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">DNI</label>
                <input
                  type="text"
                  value={formConductor.dni}
                  onChange={(e) => setFormConductor({ ...formConductor, dni: e.target.value })}
                  required
                  className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  value={formConductor.nombre_completo}
                  onChange={(e) => setFormConductor({ ...formConductor, nombre_completo: e.target.value })}
                  required
                  className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">Empresa</label>
                <input
                  type="text"
                  value={formConductor.empresa}
                  onChange={(e) => setFormConductor({ ...formConductor, empresa: e.target.value })}
                  className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-sixx-muted mb-1.5">Categoría</label>
                <select
                  value={formConductor.categoria}
                  onChange={(e) => setFormConductor({ ...formConductor, categoria: e.target.value })}
                  className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white focus:border-sixx-orange focus:outline-none"
                >
                  {categorias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </>
          )}
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
      <Modal titulo="Eliminar" abierto={!!modalEliminar} onCerrar={() => setModalEliminar(null)} maxWidth="max-w-sm">
        <p className="text-sm text-sixx-gray mb-6">
          ¿Eliminar {tab === 'vehiculos' ? 'el vehículo con placa' : 'al conductor'}{' '}
          <span className="text-white font-semibold">
            {tab === 'vehiculos' ? modalEliminar?.placa : modalEliminar?.nombre_completo}
          </span>?
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

export default Vehiculos;
