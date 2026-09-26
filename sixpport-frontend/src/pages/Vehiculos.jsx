import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Car,
  User,
  Search,
  Users,
  Briefcase,
  ShieldAlert,
  Clock,
  CalendarClock,
} from 'lucide-react';
import {
  getVehiculos,
  createVehiculo,
  updateVehiculo,
  deleteVehiculo,
  getConductores,
  createConductor,
  updateConductor,
  deleteConductor,
  getListaNegra,
  createBloqueo,
} from '../services/api';
import Modal from '../components/Modal';

const categorias = ['Trabajador', 'Visitante', 'Contratista', 'Proveedor', 'Organismo Oficial'];

const categoriaColor = {
  Trabajador: 'text-sixx-orange bg-sixx-orange/10 border-sixx-orange/20',
  Visitante: 'text-sixx-cyan bg-sixx-cyan/10 border-sixx-cyan/20',
  Contratista: 'text-sixx-green bg-sixx-green/10 border-sixx-green/20',
  Proveedor: 'text-sixx-gray bg-white/5 border-sixx-border',
  'Organismo Oficial': 'text-sixx-purple bg-sixx-purple/10 border-sixx-purple/20',
};

const formatearRut = (dni) => {
  if (!dni) return '-';
  const limpio = String(dni).replace(/\D/g, '');
  if (limpio.length < 8) return dni;
  return `${limpio.slice(0, -1)}.${limpio.slice(-1)}`;
};

const formatearFechaUTC = (fecha) => {
  if (!fecha) return null;
  const d = new Date(fecha);
  return d.toISOString().replace('T', ' ').slice(0, 19);
};

const obtenerTurnoActual = () => {
  const ahora = new Date();
  const hora = ahora.getUTCHours();
  if (hora >= 6 && hora < 18) {
    return { turno: 'A', inicio: '06:00', fin: '18:00' };
  }
  return { turno: 'B', inicio: '18:00', fin: '06:00' };
};

const Vehiculos = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [listaNegra, setListaNegra] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [horaUTC, setHoraUTC] = useState(new Date().toISOString().slice(11, 19));

  const [seleccionado, setSeleccionado] = useState(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState(null);
  const [modalEliminar, setModalEliminar] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [modalListaNegra, setModalListaNegra] = useState(false);
  const [motivoListaNegra, setMotivoListaNegra] = useState('');
  const [riesgoListaNegra, setRiesgoListaNegra] = useState('Alto');
  const [guardandoListaNegra, setGuardandoListaNegra] = useState(false);

  const [formVehiculo, setFormVehiculo] = useState({ placa: '', modelo: '', color: '' });
  const [formConductor, setFormConductor] = useState({
    dni: '',
    nombre_completo: '',
    empresa: '',
    categoria: 'Contratista',
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraUTC(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cargar = async () => {
    try {
      setCargando(true);
      const [v, c, ln] = await Promise.all([getVehiculos(), getConductores(), getListaNegra()]);
      setVehiculos(v);
      setConductores(c);
      setListaNegra(ln);
      if (c.length > 0 && !seleccionado) {
        setSeleccionado(c[0]);
      }
    } catch (err) {
      setError('No se pudieron cargar los datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = useMemo(() => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return conductores;
    return conductores.filter((item) => {
      return (
        item.nombre_completo?.toLowerCase().includes(term) ||
        item.dni?.toLowerCase().includes(term) ||
        item.patente_asociada?.toLowerCase().includes(term) ||
        item.categoria?.toLowerCase().includes(term)
      );
    });
  }, [conductores, busqueda]);

  const estadisticas = useMemo(() => {
    return {
      trabajadores: conductores.filter((c) => c.categoria === 'Trabajador').length,
      contratistas: conductores.filter((c) => c.categoria === 'Contratista').length,
      vehiculos: vehiculos.length,
      listaNegra: listaNegra.length,
    };
  }, [conductores, vehiculos, listaNegra]);

  const turno = useMemo(() => obtenerTurnoActual(), []);

  const abrirCrear = () => {
    setItemEditando(null);
    setFormVehiculo({ placa: '', modelo: '', color: '' });
    setFormConductor({ dni: '', nombre_completo: '', empresa: '', categoria: 'Contratista' });
    setModalAbierto(true);
  };

  const abrirEditar = (item) => {
    setItemEditando(item);
    setFormConductor({
      dni: item.dni,
      nombre_completo: item.nombre_completo,
      empresa: item.empresa || '',
      categoria: item.categoria,
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      if (itemEditando) {
        await updateConductor(itemEditando.id_persona, formConductor);
      } else {
        await createConductor(formConductor);
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
      await deleteConductor(modalEliminar.id_persona);
      setModalEliminar(null);
      if (seleccionado?.id_persona === modalEliminar.id_persona) {
        setSeleccionado(null);
      }
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar');
    }
  };

  const handleAgregarListaNegra = async (e) => {
    e.preventDefault();
    if (!seleccionado) return;
    setGuardandoListaNegra(true);
    try {
      await createBloqueo({
        tipo_entidad: 'Persona',
        identificador: seleccionado.dni,
        motivo_bloqueo: motivoListaNegra,
        nivel_riesgo: riesgoListaNegra,
      });
      setModalListaNegra(false);
      setMotivoListaNegra('');
      setRiesgoListaNegra('Alto');
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al agregar a lista negra');
    } finally {
      setGuardandoListaNegra(false);
    }
  };

  const avatarUrl = (seed) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-sixx-orange mb-1">
            Plataforma Gerencial
            <span className="text-sixx-muted font-normal">• Sede Corporativa Norte-Alamar</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Personas, Empleados y Vehículos</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-sixx-panel border border-sixx-border px-3 py-2">
            <CalendarClock className="w-4 h-4 text-sixx-orange" />
            <div className="text-xs">
              <div className="text-sixx-muted uppercase tracking-wide">Turno activo</div>
              <div className="text-white font-semibold">
                {turno.turno} ({turno.inicio} - {turno.fin})
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-sixx-panel border border-sixx-border px-3 py-2">
            <Clock className="w-4 h-4 text-sixx-cyan" />
            <div className="text-xs">
              <div className="text-sixx-muted uppercase tracking-wide">Hora UTC</div>
              <div className="text-white font-semibold font-mono">{horaUTC} UTC</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
            ×
          </button>
        </div>
      )}

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-5">
          <div className="text-xs text-sixx-muted uppercase tracking-wide mb-1">Trabajadores Registrados</div>
          <div className="text-2xl font-bold text-sixx-cyan">{estadisticas.trabajadores} pax</div>
          <div className="text-[11px] text-sixx-muted mt-1">Personal de planta</div>
        </div>
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-5">
          <div className="text-xs text-sixx-muted uppercase tracking-wide mb-1">Contratistas Activos</div>
          <div className="text-2xl font-bold text-sixx-orange">{estadisticas.contratistas} pax</div>
          <div className="text-[11px] text-sixx-muted mt-1">Soporte y mantención</div>
        </div>
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-5">
          <div className="text-xs text-sixx-muted uppercase tracking-wide mb-1">Vehículos Autorizados</div>
          <div className="text-2xl font-bold text-sixx-green">{estadisticas.vehiculos} unidades</div>
          <div className="text-[11px] text-sixx-muted mt-1">Flota interna autorizada</div>
        </div>
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-5">
          <div className="text-xs text-sixx-muted uppercase tracking-wide mb-1">En Lista Negra</div>
          <div className="text-2xl font-bold text-rose-500">{estadisticas.listaNegra} registros</div>
          <div className="text-[11px] text-sixx-muted mt-1">Bloqueos activos permanentes</div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabla */}
        <div className="xl:col-span-2 rounded-xl bg-sixx-panel border border-sixx-border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <h2 className="text-lg font-semibold text-white">Listado General de Registros</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sixx-muted" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar empleado o patente..."
                  className="pl-9 pr-4 py-2 rounded-lg bg-[#0b0c10] border border-sixx-border text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none w-full sm:w-64"
                />
              </div>
              <button
                onClick={abrirCrear}
                className="flex items-center justify-center gap-2 rounded-lg bg-sixx-orange hover:bg-orange-600 text-white font-semibold px-4 py-2 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nuevo
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="text-center py-12 text-sixx-muted">Cargando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sixx-border text-sixx-muted">
                    <th className="pb-3 font-medium pl-4">Nombre Completo</th>
                    <th className="pb-3 font-medium">DNI</th>
                    <th className="pb-3 font-medium">Categoría</th>
                    <th className="pb-3 font-medium">Patente Asoc.</th>
                    <th className="pb-3 font-medium">Estado en Sede</th>
                    <th className="pb-3 font-medium text-right pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((item) => (
                    <tr
                      key={item.id_persona}
                      onClick={() => setSeleccionado(item)}
                      className={`border-b border-sixx-border/50 cursor-pointer transition-colors ${
                        seleccionado?.id_persona === item.id_persona
                          ? 'bg-white/[0.04]'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      <td className="py-3.5 pl-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden border border-sixx-border shrink-0">
                            <img
                              src={avatarUrl(item.dni)}
                              alt={item.nombre_completo}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="text-white font-medium">{item.nombre_completo}</span>
                        </div>
                      </td>
                      <td className="py-3.5 font-mono text-sixx-cyan">{formatearRut(item.dni)}</td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                            categoriaColor[item.categoria] || categoriaColor.Proveedor
                          }`}
                        >
                          {item.categoria}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {item.patente_asociada ? (
                          <span className="font-mono text-sixx-cyan">{item.patente_asociada}</span>
                        ) : (
                          <span className="text-sixx-muted">Peatonal</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        {item.estado_en_sede === 'Dentro de Sede' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-sixx-green/10 text-sixx-green border border-sixx-green/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-sixx-green" />
                            Dentro de Sede
                          </span>
                        ) : item.estado_en_sede === 'Fuera' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-white/5 text-sixx-gray border border-sixx-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-sixx-gray" />
                            Fuera
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                            No registra
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirEditar(item);
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-sixx-gray hover:text-white transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalEliminar(item);
                            }}
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

        {/* Ficha operativa */}
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-6 h-fit">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Ficha Operativa de Persona</h2>
            <span className="text-xs font-mono text-sixx-cyan">
              ID: #{String(seleccionado?.id_persona || 0).padStart(5, '0')}
            </span>
          </div>

          {seleccionado ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-700 overflow-hidden border-2 border-sixx-border">
                  <img
                    src={avatarUrl(seleccionado.dni)}
                    alt={seleccionado.nombre_completo}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-lg font-bold text-white">{seleccionado.nombre_completo}</div>
                  <div className="text-sm text-sixx-muted">{seleccionado.categoria}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-sixx-muted mt-0.5" />
                  <div>
                    <div className="text-xs text-sixx-muted uppercase tracking-wide">DNI / RUT Registrado</div>
                    <div className="text-sm text-white font-mono">{formatearRut(seleccionado.dni)}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Car className="w-4 h-4 text-sixx-muted mt-0.5" />
                  <div>
                    <div className="text-xs text-sixx-muted uppercase tracking-wide">Vehículo Vinculado</div>
                    {seleccionado.patente_asociada ? (
                      <div className="text-sm text-white">
                        {vehiculos.find((v) => v.placa === seleccionado.patente_asociada)?.modelo || 'Vehículo autorizado'} — Placa{' '}
                        <span className="font-mono text-sixx-cyan">{seleccionado.patente_asociada}</span>
                      </div>
                    ) : (
                      <div className="text-sm text-sixx-muted">Sin vehículo vinculado (Peatonal)</div>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-sixx-muted mt-0.5" />
                  <div>
                    <div className="text-xs text-sixx-muted uppercase tracking-wide">Último Movimiento</div>
                    {seleccionado.ultimo_ingreso ? (
                      <div className="text-sm text-white">
                        {seleccionado.ultimo_movimiento === 'Entrada' ? 'Ingreso' : 'Egreso'} hoy a las{' '}
                        <span className="text-sixx-cyan font-mono">{formatearFechaUTC(seleccionado.ultimo_ingreso)}</span> UTC
                      </div>
                    ) : (
                      <div className="text-sm text-sixx-muted">Sin registros de acceso</div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setModalListaNegra(true)}
                className="w-full rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-400 hover:bg-rose-500/20 transition-colors"
              >
                Agregar a Lista Negra perimetral
              </button>
            </div>
          ) : (
            <div className="text-center py-8 text-sixx-muted text-sm">Seleccione un registro para ver su ficha operativa.</div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <Modal titulo={itemEditando ? 'Editar Persona' : 'Nueva Persona'} abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
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
                <option key={c} value={c}>
                  {c}
                </option>
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
          ¿Eliminar a <span className="text-white font-semibold">{modalEliminar?.nombre_completo}</span>?
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

      {/* Modal Lista Negra */}
      <Modal titulo="Agregar a Lista Negra" abierto={modalListaNegra} onCerrar={() => setModalListaNegra(false)} maxWidth="max-w-md">
        <form onSubmit={handleAgregarListaNegra} className="space-y-4">
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Identificador</label>
            <input
              type="text"
              value={seleccionado?.dni || ''}
              disabled
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-sixx-gray cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Motivo de bloqueo</label>
            <textarea
              value={motivoListaNegra}
              onChange={(e) => setMotivoListaNegra(e.target.value)}
              required
              rows={3}
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Nivel de riesgo</label>
            <select
              value={riesgoListaNegra}
              onChange={(e) => setRiesgoListaNegra(e.target.value)}
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white focus:border-sixx-orange focus:outline-none"
            >
              <option value="Bajo">Bajo</option>
              <option value="Alto">Alto</option>
              <option value="Crítico">Crítico</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalListaNegra(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-sixx-gray hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardandoListaNegra}
              className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
            >
              {guardandoListaNegra ? 'Guardando...' : 'Bloquear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehiculos;
