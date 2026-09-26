import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronDown,
  Download,
  FileText,
  BarChart3,
  Clock,
  CalendarClock,
  Filter,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  getReportes,
  getReportesDashboard,
  createReporte,
  downloadReporte,
} from '../services/api';
import Modal from '../components/Modal';

const obtenerTurnoActual = () => {
  const ahora = new Date();
  const hora = ahora.getUTCHours();
  if (hora >= 6 && hora < 18) {
    return { turno: 'A', inicio: '06:00', fin: '18:00' };
  }
  return { turno: 'B', inicio: '18:00', fin: '06:00' };
};

const formatearFechaLarga = (fecha) => {
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const categoriasReporte = ['Accesos', 'Seguridad', 'Turnos', 'Visitas', 'General'];

const colorCategoria = {
  Trabajador: 'bg-sixx-cyan',
  Visitante: 'bg-sixx-green',
  Contratista: 'bg-sixx-orange',
  Proveedor: 'bg-sixx-purple',
};

const Reportes = () => {
  const [reportes, setReportes] = useState([]);
  const [dashboard, setDashboard] = useState({ cargasPorCategoria: [], flujoPorPunto: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [horaUTC, setHoraUTC] = useState(new Date().toISOString().slice(11, 19));

  const [rango, setRango] = useState('hoy');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todos los flujos');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    periodo_inicio: '',
    periodo_fin: '',
    categoria: 'Accesos',
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setHoraUTC(new Date().toISOString().slice(11, 19));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fechas = useMemo(() => {
    const hoy = new Date();
    const desde = new Date(hoy);
    switch (rango) {
      case 'semana':
        desde.setDate(hoy.getDate() - 7);
        break;
      case 'mes':
        desde.setDate(hoy.getDate() - 30);
        break;
      case 'hoy':
      default:
        break;
    }
    return {
      desde: desde.toISOString().slice(0, 10),
      hasta: hoy.toISOString().slice(0, 10),
      label: rango === 'hoy' ? `Hoy (${formatearFechaLarga(hoy)})` : `${formatearFechaLarga(desde)} - ${formatearFechaLarga(hoy)}`,
    };
  }, [rango]);

  const cargar = async () => {
    try {
      setCargando(true);
      const [rep, dash] = await Promise.all([
        getReportes(),
        getReportesDashboard({ desde: fechas.desde, hasta: fechas.hasta }),
      ]);
      setReportes(rep);
      setDashboard(dash);
    } catch (err) {
      setError('No se pudieron cargar los reportes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechas.desde, fechas.hasta]);

  const turno = useMemo(() => obtenerTurnoActual(), []);

  const maxCargas = useMemo(() => {
    return Math.max(...dashboard.cargasPorCategoria.map((c) => Number(c.total)), 1);
  }, [dashboard.cargasPorCategoria]);

  const maxFlujo = useMemo(() => {
    return Math.max(...dashboard.flujoPorPunto.map((p) => Number(p.total)), 1);
  }, [dashboard.flujoPorPunto]);

  const reportesFiltrados = useMemo(() => {
    if (categoriaFiltro === 'Todos los flujos') return reportes;
    return reportes.filter((r) => r.categoria === categoriaFiltro);
  }, [reportes, categoriaFiltro]);

  const abrirCrear = () => {
    setForm({
      nombre: '',
      periodo_inicio: fechas.desde,
      periodo_fin: fechas.hasta,
      categoria: 'Accesos',
    });
    setModalAbierto(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await createReporte(form);
      setModalAbierto(false);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear reporte');
    } finally {
      setGuardando(false);
    }
  };

  const handleDownload = async (reporte) => {
    try {
      const blob = await downloadReporte(reporte.id_reporte);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reporte.nombre.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error al descargar el reporte');
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
          <h1 className="text-3xl font-bold text-white">Centro de Reportes y Auditoría</h1>
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

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sixx-muted" />
            <select
              value={rango}
              onChange={(e) => setRango(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-lg bg-sixx-panel border border-sixx-border text-sm text-white focus:border-sixx-orange focus:outline-none appearance-none"
            >
              <option value="hoy">Hoy ({formatearFechaLarga(new Date())})</option>
              <option value="semana">Últimos 7 días</option>
              <option value="mes">Últimos 30 días</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sixx-muted pointer-events-none" />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sixx-muted" />
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="pl-9 pr-8 py-2 rounded-lg bg-sixx-panel border border-sixx-border text-sm text-white focus:border-sixx-orange focus:outline-none appearance-none"
            >
              <option value="Todos los flujos">Categoría: Todos los flujos</option>
              {categoriasReporte.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sixx-muted pointer-events-none" />
          </div>
        </div>
        <button
          onClick={abrirCrear}
          className="flex items-center justify-center gap-2 rounded-lg bg-sixx-orange hover:bg-orange-600 text-white font-semibold px-5 py-2.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Parametrizar Reporte
        </button>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cargas por categoría */}
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-6">
          <h2 className="text-base font-semibold text-white mb-6">Cargas por Categoría de Acceso</h2>
          {cargando ? (
            <div className="h-48 flex items-center justify-center text-sixx-muted">Cargando...</div>
          ) : dashboard.cargasPorCategoria.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sixx-muted text-sm">Sin datos para el período seleccionado</div>
          ) : (
            <div className="flex items-end justify-around h-48 gap-4">
              {dashboard.cargasPorCategoria.map((item) => {
                const altura = Math.max(8, (Number(item.total) / maxCargas) * 100);
                return (
                  <div key={item.categoria} className="flex flex-col items-center gap-3 flex-1">
                    <div className="text-sm font-bold text-white">{item.total}</div>
                    <div className="w-full flex justify-center h-32 items-end">
                      <div
                        className={`w-10 rounded-t-md ${colorCategoria[item.categoria] || 'bg-sixx-gray'}`}
                        style={{ height: `${altura}%` }}
                      />
                    </div>
                    <div className="text-xs text-sixx-muted text-center">{item.categoria}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Flujo por punto de control */}
        <div className="rounded-xl bg-sixx-panel border border-sixx-border p-6">
          <h2 className="text-base font-semibold text-white mb-6">Flujo de Accesos por Punto de Control</h2>
          {cargando ? (
            <div className="h-48 flex items-center justify-center text-sixx-muted">Cargando...</div>
          ) : dashboard.flujoPorPunto.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-sixx-muted text-sm">Sin datos para el período seleccionado</div>
          ) : (
            <div className="space-y-5">
              {dashboard.flujoPorPunto.map((item, idx) => {
                const ancho = Math.max(5, (Number(item.total) / maxFlujo) * 100);
                const color = idx === 0 ? 'bg-sixx-orange' : 'bg-sixx-cyan';
                return (
                  <div key={item.punto || idx}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-white">{item.punto || 'Sin punto'}</span>
                      <span className="text-white font-semibold">{item.total} pax</span>
                    </div>
                    <div className="h-2.5 bg-[#0b0c10] rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full`} style={{ width: `${ancho}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Tabla historial */}
      <div className="rounded-xl bg-sixx-panel border border-sixx-border p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white">Historial de Reportes Exportables</h2>
          <p className="text-xs text-sixx-muted mt-0.5">Registro de auditoría generada por usuarios habilitados del sistema.</p>
        </div>

        {cargando ? (
          <div className="text-center py-12 text-sixx-muted">Cargando reportes...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sixx-border text-sixx-muted">
                  <th className="pb-3 font-medium pl-4">Nombre de Reporte</th>
                  <th className="pb-3 font-medium">Período</th>
                  <th className="pb-3 font-medium">Categoría</th>
                  <th className="pb-3 font-medium">Generador por</th>
                  <th className="pb-3 font-medium">Estado / Acción</th>
                </tr>
              </thead>
              <tbody>
                {reportesFiltrados.map((r) => (
                  <tr key={r.id_reporte} className="border-b border-sixx-border/50 hover:bg-white/[0.02]">
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0b0c10] border border-sixx-border flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-sixx-muted" />
                        </div>
                        <span className="text-white font-medium">{r.nombre}</span>
                      </div>
                    </td>
                    <td className="py-4 text-sixx-gray">
                      {formatearFechaLarga(new Date(r.periodo_inicio))} - {formatearFechaLarga(new Date(r.periodo_fin))}
                    </td>
                    <td className="py-4 text-sixx-gray">{r.categoria}</td>
                    <td className="py-4 text-sixx-gray">{r.generado_por_nombre || 'Sistema'}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {r.estado === 'Listo para Descargar' ? (
                          <>
                            <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border bg-sixx-green/10 text-sixx-green border-sixx-green/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Listo para Descargar
                            </span>
                            <button
                              onClick={() => handleDownload(r)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-sixx-cyan hover:text-white transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Descargar CSV
                            </button>
                          </>
                        ) : r.estado === 'Procesando' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border bg-sixx-orange/10 text-sixx-orange border-sixx-orange/20">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Procesando
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border bg-red-500/10 text-red-400 border-red-500/30">
                            Error
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reportesFiltrados.length === 0 && (
              <div className="text-center py-8 text-sixx-muted">No se encontraron reportes.</div>
            )}
          </div>
        )}
      </div>

      {/* Modal parametrizar reporte */}
      <Modal titulo="Parametrizar Reporte" abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} maxWidth="max-w-md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Nombre del reporte</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              required
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white placeholder-sixx-muted focus:border-sixx-orange focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-sixx-muted mb-1.5">Desde</label>
              <input
                type="date"
                value={form.periodo_inicio}
                onChange={(e) => setForm({ ...form, periodo_inicio: e.target.value })}
                required
                className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white focus:border-sixx-orange focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-sixx-muted mb-1.5">Hasta</label>
              <input
                type="date"
                value={form.periodo_fin}
                onChange={(e) => setForm({ ...form, periodo_fin: e.target.value })}
                required
                className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white focus:border-sixx-orange focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-sixx-muted mb-1.5">Categoría</label>
            <select
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              className="w-full rounded-lg bg-[#0b0c10] border border-sixx-border px-4 py-2.5 text-sm text-white focus:border-sixx-orange focus:outline-none"
            >
              {categoriasReporte.map((c) => (
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
              {guardando ? 'Generando...' : 'Generar Reporte'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Reportes;
