import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para incluir el token JWT en cada petición protegida
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Autenticación
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Usuarios
export const getUsuarios = async () => {
  const response = await api.get('/usuarios');
  return response.data;
};

export const getUsuario = async (id) => {
  const response = await api.get(`/usuarios/${id}`);
  return response.data;
};

export const createUsuario = async (usuario) => {
  const response = await api.post('/usuarios', usuario);
  return response.data;
};

export const updateUsuario = async (id, usuario) => {
  const response = await api.put(`/usuarios/${id}`, usuario);
  return response.data;
};

export const changePasswordUsuario = async (id, password) => {
  const response = await api.patch(`/usuarios/${id}/password`, { password });
  return response.data;
};

export const deleteUsuario = async (id, permanente = false) => {
  const response = await api.delete(`/usuarios/${id}`, { params: { permanente } });
  return response.data;
};

// Roles
export const getRoles = async () => {
  const response = await api.get('/roles');
  return response.data;
};

export const createRol = async (rol) => {
  const response = await api.post('/roles', rol);
  return response.data;
};

export const updateRol = async (id, rol) => {
  const response = await api.put(`/roles/${id}`, rol);
  return response.data;
};

export const deleteRol = async (id) => {
  const response = await api.delete(`/roles/${id}`);
  return response.data;
};

// Lista Negra
export const getListaNegra = async () => {
  const response = await api.get('/lista-negra');
  return response.data;
};

export const createBloqueo = async (bloqueo) => {
  const response = await api.post('/lista-negra', bloqueo);
  return response.data;
};

export const updateBloqueo = async (id, bloqueo) => {
  const response = await api.put(`/lista-negra/${id}`, bloqueo);
  return response.data;
};

export const deleteBloqueo = async (id) => {
  const response = await api.delete(`/lista-negra/${id}`);
  return response.data;
};

// Vehículos
export const getVehiculos = async () => {
  const response = await api.get('/vehiculos');
  return response.data;
};

export const createVehiculo = async (vehiculo) => {
  const response = await api.post('/vehiculos', vehiculo);
  return response.data;
};

export const updateVehiculo = async (id, vehiculo) => {
  const response = await api.put(`/vehiculos/${id}`, vehiculo);
  return response.data;
};

export const deleteVehiculo = async (id) => {
  const response = await api.delete(`/vehiculos/${id}`);
  return response.data;
};

// Conductores
export const getConductores = async () => {
  const response = await api.get('/conductores');
  return response.data;
};

export const createConductor = async (conductor) => {
  const response = await api.post('/conductores', conductor);
  return response.data;
};

export const updateConductor = async (id, conductor) => {
  const response = await api.put(`/conductores/${id}`, conductor);
  return response.data;
};

export const deleteConductor = async (id) => {
  const response = await api.delete(`/conductores/${id}`);
  return response.data;
};

export default api;
