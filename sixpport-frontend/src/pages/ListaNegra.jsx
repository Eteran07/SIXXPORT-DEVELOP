import { useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Search,
  User,
  Car,
  ShieldAlert,
  Filter,
  Camera,
  Clock,
  CalendarClock,
  CheckCircle2,
  Shield,
  Ban,
} from 'lucide-react';
import {
  getListaNegra,
  createBloqueo,
  updateBloqueo,
  deleteBloqueo,
  getConductores,
  getVehiculos,
} from '../services/api';
import Modal from '../components/Modal';

const nivelesRiesgo = ['Crítico', 'Alto', 'Bajo'];
const tiposEntidad = [
  { value: 'Persona', label: 'Persona (DNI)', icon: User },
  { value: 'Vehiculo', label: 'Vehículo (Placa)', icon: Car },
];

const colorPorRiesgo = {
  Crítico: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  Alto: 'bg-orange-500/10 border-orange-500/30 text-sixx-orange',
  Bajo: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
};

const esHoy = (fecha) => {
  if (!fecha) return false;
  const d = new Date(fecha);
  const hoy = new Date();
  return (
    d.getUTCFullYear() === hoy.getUTCFullYear() &&
    d.getUTCMonth() === hoy.getUTCMonth() &&
    d.getUTCDate() === hoy.getUTCDate()
  );
};

const formatearFechaUTC = (fecha) => {
  if (!fecha) return '-';
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

const imagenPlaceholder = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80';

const ListaNegra = () => {
  const [bloqueos, setBloqueos] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [horaUTC, setHoraUTC] = useState(new Date().toISOString().slice(11, 19));

  const [seleccionado, setSeleccionado] = useState(null);

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

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraUTC(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const cargar = async () => {
    try {
      setCargando(true);
      const [ln, c, v] = await Promise.all([getListaNegra(), getConductores(), getVehiculos()]);
      setBloqueos(ln);
      setConductores(c);
      setVehiculos(v);
      if (ln.length > 0 && !seleccionado) {
        setSeleccionado(ln[0]);
      }
    } catch (err) {
      setError('No se pudo cargar la lista negra.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const nombreAsociado = (b) => {
    if (!b) return '-';
    if (b.tipo_entidad === 'Persona') {
      const p = conductores.find((c) => c.dni === b.identificador);
      return p?.nombre_completo || 'Desconocido';
    }
    const v = vehiculos.find((veh) => veh.placa === b.identificador);
    return v?.modelo || 'Desconocido';
  };

  const filtrados = useMemo(() => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return bloqueos;
    return bloqueos.filter((b) => {
      const nombre = nombreAsociado(b).toLowerCase();
      return (
        b.identificador?.toLowerCase().includes(term) ||
        b.motivo_bloqueo?.toLowerCase().includes(term) ||
        b.tipo_entidad?.toLowerCase().includes(term) ||
        b.nivel_riesgo?.toLowerCase().includes(term) ||
        nombre.includes(term)
      );
    });
  }, [bloqueos, busqueda, conductores, vehiculos]);

  const estadisticas = useMemo(() => {
    return {
      total: bloqueos.length,
      criticasHoy: bloqueos.filter((b) => b.nivel_riesgo === 'Crítico' && esHoy(b.created_at)).length,
      vehiculos: bloqueos.filter((b) => b.tipo_entidad === 'Vehiculo').length,
      resueltos: bloqueos.filter((b) => b.estado === 'Inactivo').length,
    };
  }, [bloqueos]);

  const turno = useMemo(() => obtenerTurnoActual(), []);

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
      if (seleccionado?.id_bloqueo === modalEliminar.id_bloqueo) {
        setSeleccionado(null);
      }
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar bloqueo');
    }
  };

  const handleResolver = async () => {
    if (!seleccionado) return;
    try {
      await updateBloqueo(seleccionado.id_bloqueo, { estado: 'Inactivo' });
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al levantar bloqueo');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-sixx-orange mb-1">
            Plataforma Gerencial
            <span className="text-sixx-muted font-normal">• Sede Corporativa Norte-Alamar</span>
          </div>
          <h1 className="text-3xl font-bold text-white">Gestión de Lista Negra y Alertas</h1>
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
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-sixx-muted uppercase tracking-wide">Total Bloqueados</span>
            <Ban className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-500">{estadisticas.total}</div>
          <div className="text-[11px] text-sixx-muted mt-1">Personas y vehículos</div>
        </div>
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-sixx-muted uppercase tracking-wide">Alertas Críticas Hoy</span>
            <ShieldAlert className="w-4 h-4 text-sixx-orange" />
          </div>
          <div className="text-2xl font-bold text-sixx-orange">{String(estadisticas.criticasHoy).padStart(2, '0')}</div>
          <div className="text-[11px] text-sixx-muted mt-1">Emergencias activas en vivo</div>
        </div>
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-sixx-muted uppercase tracking-wide">Vehículos Vetados</span>
            <Car className="w-4 h-4 text-sixx-cyan" />
          </div>
          <div className="text-2xl font-bold text-sixx-cyan">{estadisticas.vehiculos}</div>
          <div className="text-[11px] text-sixx-muted mt-1">En los perímetros starWatch</div>
        </div>
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-sixx-muted uppercase tracking-wide">Casos Resueltos</span>
            <CheckCircle2 className="w-4 h-4 text-sixx-green" />
          </div>
          <div className="text-2xl font-bold text-sixx-green">{estadisticas.resueltos}</div>
          <div className="text-[11px] text-sixx-muted mt-1">Levantamientos autorizados</div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Tabla */}
        <div className="xl:col-span-2 rounded-xl bg-sixx-panel border border-sixx-border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">Listado de Bloqueos Activos</h2>
              <p className="text-xs text-sixx-muted mt-0.5">Detección cruzada perimetral en puntos de acceso</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sixx-muted" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar DNI, patente, motivo..."
                  className="pl-9 pr-4 py-2 rounded-lg bg-[#0b0c10] border border-sixx-border text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none w-full sm:w-64"
                />
              </div>
              <button className="flex items-center gap-2 rounded-lg border border-sixx-border bg-[#0b0c10] px-3 py-2 text-sm text-sixx-gray hover:text-white transition-colors">
                <Filter className="w-4 h-4" />
                Filtrar
              </button>
            </div>
          </div>

          {cargando ? (
            <div className="text-center py-12 text-sixx-muted">Cargando lista negra...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-sixx-border text-sixx-muted">
                    <th className="pb-3 font-medium pl-4">Nombre / Patente</th>
                    <th className="pb-3 font-medium">Tipo</th>
                    <th className="pb-3 font-medium">Identificador</th>
                    <th className="pb-3 font-medium">Motivo de Bloqueo</th>
                    <th className="pb-3 font-medium">Nivel Riesgo</th>
                    <th className="pb-3 font-medium">Estado</th>
                    <th className="pb-3 font-medium text-right pr-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((b) => {
                    const IconTipo = b.tipo_entidad === 'Persona' ? User : Car;
                    return (
                      <tr
                        key={b.id_bloqueo}
                        onClick={() => setSeleccionado(b)}
                        className={`border-b border-sixx-border/50 cursor-pointer transition-colors ${
                          seleccionado?.id_bloqueo === b.id_bloqueo ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                        }`}
                      >
                        <td className="py-3.5 pl-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[#0b0c10] border border-sixx-border flex items-center justify-center shrink-0">
                              <IconTipo className="w-4 h-4 text-sixx-muted" />
                            </div>
                            <div>
                              <div className="text-white font-medium">{nombreAsociado(b)}</div>
                              {b.tipo_entidad === 'Vehiculo' && (
                                <div className="text-[11px] text-sixx-muted">Vehículo vetado</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className="text-sixx-gray">{b.tipo_entidad}</span>
                        </td>
                        <td className="py-3.5 font-mono text-sixx-cyan">{b.identificador}</td>
                        <td className="py-3.5 text-sixx-gray max-w-xs truncate">{b.motivo_bloqueo}</td>
                        <td className="py-3.5">
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold border ${colorPorRiesgo[b.nivel_riesgo]}`}>
                            {b.nivel_riesgo}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border ${
                              b.estado === 'Activo'
                                ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                : 'bg-sixx-green/10 border-sixx-green/20 text-sixx-green'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${b.estado === 'Activo' ? 'bg-rose-400' : 'bg-sixx-green'}`} />
                            {b.estado}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirEditar(b);
                              }}
                              className="p-1.5 rounded-lg hover:bg-white/10 text-sixx-gray hover:text-white transition-colors"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModalEliminar(b);
                              }}
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

        {/* Inspección de alerta */}
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-6 h-fit">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-semibold text-white">Inspección de Alerta</h2>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-rose-500 px-2 py-0.5 rounded">Detalle</span>
          </div>

          {seleccionado ? (
            <div className="space-y-5">
              <div>
                <h3 className="text-base font-semibold text-white mb-1">
                  Última Incidencia en Garita Oriente 2
                </h3>
                <p className="text-xs text-sixx-muted">Bloqueo #{String(seleccionado.id_bloqueo).padStart(5, '0')}</p>
              </div>

              <div className="relative rounded-lg overflow-hidden border border-sixx-border aspect-video bg-[#0b0c10]">
                <img
                  src={imagenPlaceholder}
                  alt="Vista de cámara"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded text-[10px] text-white">
                  <Camera className="w-3 h-3" />
                  Cámara 04
                </div>
                <div className="absolute bottom-2 right-2 text-[10px] text-white bg-black/60 px-2 py-0.5 rounded font-mono">
                  {formatearFechaUTC(seleccionado.created_at)}
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[11px] text-sixx-muted uppercase tracking-wide">Reportado por</div>
                  <div className="text-sm text-white">
                    {seleccionado.reportado_por_nombre || 'Supervisor R. Mendoza'} (ID-{String(seleccionado.reportado_por || 642).padStart(3, '0')})
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-sixx-muted uppercase tracking-wide">Timestamp del evento</div>
                  <div className="text-sm text-white font-mono">{formatearFechaUTC(seleccionado.created_at)} UTC</div>
                </div>
                <div>
                  <div className="text-[11px] text-sixx-muted uppercase tracking-wide">Descripción</div>
                  <p className="text-sm text-sixx-gray leading-relaxed">
                    {seleccionado.motivo_bloqueo}. Detectado en pre-registro Alarma Garita 1 hace {Math.max(1, Math.floor((Date.now() - new Date(seleccionado.created_at).getTime()) / 60000))} minutos.
                  </p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={abrirCrear}
                  className="w-full rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
                >
                  Registrar Nueva Alerta
                </button>
                <button className="w-full rounded-lg border border-sixx-border bg-[#0b0c10] text-sixx-gray hover:text-white text-sm font-medium px-4 py-2.5 transition-colors">
                  Revisar Evidencia Histórica
                </button>
                {seleccionado.estado === 'Activo' ? (
                  <button
                    onClick={handleResolver}
                    className="w-full rounded-lg border border-sixx-green/30 bg-sixx-green/10 text-sixx-green hover:bg-sixx-green/20 text-sm font-semibold px-4 py-2.5 transition-colors"
                  >
                    Levantar Bloqueo / Resolver
                  </button>
                ) : (
                  <button
                    disabled
                    className="w-full rounded-lg border border-sixx-border bg-[#0b0c10] text-sixx-muted text-sm font-semibold px-4 py-2.5 cursor-not-allowed"
                  >
                    Caso ya resuelto
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-sixx-muted text-sm">Seleccione un bloqueo para inspeccionar la alerta.</div>
          )}
        </div>
      </div>

      {/* Modal Crear/Editar */}
      <Modal titulo={bloqueoEditando ? 'Editar Bloqueo' : 'Nueva Alerta'} abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} maxWidth="max-w-md">
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
                <option key={n} value={n}>
                  {n}
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
              className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold transition-colors disabled:opacity-60"
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
