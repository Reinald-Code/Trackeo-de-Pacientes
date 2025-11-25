import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Clock, Info, MapPin, User, Search, Monitor, Plus, Edit, Save, X, ShieldAlert, Lock, LogOut, Trash2, FileText, Stethoscope, Eye, EyeOff } from 'lucide-react';
import { io } from 'socket.io-client';

// Conexión al servidor Socket.io
// En producción el endpoint puede venir de la variable Vite `VITE_API_URL`.
// Ej: en Netlify configurar `VITE_API_URL=https://mi-backend.onrender.com`
const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:3000`;
const socket = io(API_URL);

const TRACKER_STEPS = [
  { id: 'admission', title: 'Admisión' },
  { id: 'triage', title: 'Triage' },
  { id: 'waiting', title: 'Sala de Espera' },
  { id: 'box', title: 'Atención Médica' },
  { id: 'exams', title: 'Exámenes' },
  { id: 'discharge', title: 'Alta' },
];

const TRIAGE_CATEGORIES = {
  'C1': { label: 'C1 - Emergencia Vital', color: 'bg-red-600', text: 'text-white', border: 'border-red-600' },
  'C2': { label: 'C2 - Emergencia', color: 'bg-orange-600', text: 'text-white', border: 'border-orange-600' },
  'C3': { label: 'C3 - Urgencia', color: 'bg-yellow-400', text: 'text-black', border: 'border-yellow-400' },
  'C4': { label: 'C4 - Leve', color: 'bg-green-600', text: 'text-white', border: 'border-green-600' },
  'C5': { label: 'C5 - Consulta General', color: 'bg-blue-600', text: 'text-white', border: 'border-blue-600' },
};

const FOOTER_MESSAGES = [
  "Horario de visitas: 10:00 - 12:00 y 16:00 - 18:00",
  "Uso obligatorio de mascarilla en zonas clínicas",
  "Mantenga silencio en las salas de espera",
  "Lave sus manos frecuentemente"
];

// --- Utils ---
const formatRut = (rut) => {
  if (!rut) return '';
  // Limpiar por si acaso viene con puntos
  const cleanRut = rut.replace(/\./g, '');
  const parts = cleanRut.split('-');
  if (parts.length < 2) return cleanRut;
  
  const body = parts[0];
  const dv = parts[1];
  
  // Formatear cuerpo con puntos
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
};

function App() {
  const [view, setView] = useState('mobile-login'); // mobile-login, mobile-tracker, tv-dashboard, admin-panel
  const [patients, setPatients] = useState([]);
  const [currentUserCode, setCurrentUserCode] = useState(''); // For mobile user
  const [isAlertMode, setIsAlertMode] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    // Escuchar actualizaciones del servidor
    socket.on('init_data', (data) => setPatients(data));
    socket.on('update_patients', (data) => setPatients(data));
    socket.on('update_alert_mode', (mode) => setIsAlertMode(mode));

    return () => {
      socket.off('init_data');
      socket.off('update_patients');
      socket.off('update_alert_mode');
    };
  }, []);

  // --- Actions ---
  const addPatient = (patientData) => {
    const newCode = `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}X-${Math.floor(100 + Math.random() * 900)}`;
    const newPatient = {
      id: Date.now(),
      code: newCode,
      rut: patientData.rut,
      name: patientData.name,
      category: patientData.category,
      admissionReason: patientData.admissionReason || 'Consulta General',
      stage: 'admission',
      status: 'EN ADMISIÓN',
      comment: 'Ingreso reciente.',
      lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    // Enviar al servidor en lugar de actualizar localmente
    socket.emit('add_patient', newPatient);
  };

  const updatePatient = (id, updates) => {
    // Enviar al servidor
    socket.emit('update_patient', { id, updates });
  };

  const deletePatient = (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este paciente?')) {
      socket.emit('delete_patient', id);
    }
  };

  const toggleAlert = () => {
    socket.emit('toggle_alert', !isAlertMode);
  };

  // --- Navigation Helpers ---
  const activePatient = patients.find(p => p.code === currentUserCode);

  return (
    <div className="min-h-screen font-sans text-dark bg-background">
      {/* Dev Switcher */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => setView('mobile-login')}
          className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 transition-all ${view.startsWith('mobile') ? 'bg-primary text-white' : 'bg-white text-dark shadow-sm'}`}
        >
          <User size={14} /> Móvil
        </button>
        <button
          onClick={() => setView('tv-dashboard')}
          className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 transition-all ${view === 'tv-dashboard' ? 'bg-primary text-white' : 'bg-white text-dark shadow-sm'}`}
        >
          <Monitor size={14} /> TV
        </button>
        <button
          onClick={() => setView('admin-panel')}
          className={`px-3 py-1 rounded-full text-xs flex items-center gap-2 transition-all ${view === 'admin-panel' ? 'bg-primary text-white' : 'bg-white text-dark shadow-sm'}`}
        >
          <ShieldAlert size={14} /> Admin
        </button>
      </div>

      {view === 'mobile-login' && (
        <MobileLogin 
          patients={patients}
          onLogin={(code) => {
            setCurrentUserCode(code);
            setView('mobile-tracker');
          }} 
        />
      )}

      {view === 'mobile-tracker' && (
        <MobileTracker 
          patient={activePatient}
          onBack={() => {
            setCurrentUserCode('');
            setView('mobile-login');
          }}
        />
      )}

      {view === 'tv-dashboard' && (
        <TVDashboard 
          patients={patients}
          isAlertMode={isAlertMode} 
        />
      )}

      {view === 'admin-panel' && (
        isAdminAuthenticated ? (
          <AdminPanel 
            patients={patients} 
            onAddPatient={addPatient}
            onUpdatePatient={updatePatient}
            onDeletePatient={deletePatient}
            isAlertMode={isAlertMode}
            onToggleAlert={toggleAlert}
            onLogout={() => setIsAdminAuthenticated(false)}
          />
        ) : (
          <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />
        )
      )}
    </div>
  );
}

// --- Admin View ---

function AdminLogin({ onLogin }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === 'cuando_pagan') {
      onLogin();
    } else {
      setError('Clave incorrecta');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full">
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-dark">Acceso Administrativo</h2>
          <p className="text-gray-500 text-sm text-center mt-2">Ingrese su clave de funcionario</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese Clave"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none pr-12"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {error && <p className="text-danger text-xs mt-2">{error}</p>}
          <button
            type="submit"
            className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ patients, onAddPatient, onUpdatePatient, onDeletePatient, isAlertMode, onToggleAlert, onLogout }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  
  // Estado para el modal de nuevo paciente
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatientForm, setNewPatientForm] = useState({ rut: '', name: '', category: 'C5', admissionReason: '' });

  const startEdit = (patient) => {
    setEditingId(patient.id);
    setEditForm({ ...patient });
  };

  const saveEdit = () => {
    onUpdatePatient(editingId, editForm);
    setEditingId(null);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newPatientForm.rut || !newPatientForm.name) return;
    onAddPatient(newPatientForm);
    setNewPatientForm({ rut: '', name: '', category: 'C5', admissionReason: '' });
    setShowAddModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">Panel de Administración</h1>
            <p className="text-gray-500">Gestión de Pacientes y Estados</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={onToggleAlert}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-md ${isAlertMode ? 'bg-danger text-white hover:bg-red-600' : 'bg-white text-danger border border-danger/20 hover:bg-red-50'}`}
            >
              <AlertTriangle size={20} /> {isAlertMode ? 'Desactivar Alerta' : 'Simular Alerta'}
            </button>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-success text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-green-600 transition-colors shadow-md"
            >
              <Plus size={20} /> Admitir Nuevo Paciente
            </button>
            <button 
              onClick={onLogout}
              className="bg-white text-danger border border-danger/20 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-red-50 transition-colors shadow-sm"
            >
              <LogOut size={20} /> Salir
            </button>
          </div>
        </header>

        {/* Modal de Nuevo Paciente */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-dark">Admitir Nuevo Paciente</h2>
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RUT</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Ej: 12345678-9 (Sin puntos)"
                    value={newPatientForm.rut}
                    onChange={e => setNewPatientForm({...newPatientForm, rut: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Nombre del paciente"
                    value={newPatientForm.name}
                    onChange={e => setNewPatientForm({...newPatientForm, name: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoría Triage</label>
                  <select 
                    value={newPatientForm.category}
                    onChange={e => setNewPatientForm({...newPatientForm, category: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                  >
                    {Object.entries(TRIAGE_CATEGORIES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Ingreso</label>
                  <textarea 
                    required
                    placeholder="Ej: Dolor torácico, Accidente de tránsito..."
                    value={newPatientForm.admissionReason}
                    onChange={e => setNewPatientForm({...newPatientForm, admissionReason: e.target.value})}
                    className="w-full p-2 border rounded-lg"
                    rows="2"
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700"
                  >
                    Ingresar Paciente
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left min-w-[1200px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="p-4 font-semibold text-gray-600">Código</th>
                <th className="p-4 font-semibold text-gray-600">RUT</th>
                <th className="p-4 font-semibold text-gray-600">Nombre</th>
                <th className="p-4 font-semibold text-gray-600">Motivo Ingreso</th>
                <th className="p-4 font-semibold text-gray-600">Categoría</th>
                <th className="p-4 font-semibold text-gray-600">Etapa (Sistema)</th>
                <th className="p-4 font-semibold text-gray-600">Estado (Visible)</th>
                <th className="p-4 font-semibold text-gray-600">Comentario</th>
                <th className="p-4 font-semibold text-gray-600 text-right whitespace-nowrap w-24">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {patients.map(patient => (
                <tr key={patient.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono font-bold text-primary">{patient.code}</td>
                  <td className="p-4 font-mono text-sm bg-yellow-50 text-yellow-700 font-medium whitespace-nowrap">
                    {formatRut(patient.rut)}
                  </td>
                  <td className="p-4">{patient.name}</td>
                  
                  {/* Editable Fields */}
                  {editingId === patient.id ? (
                    <>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={editForm.admissionReason || ''}
                          onChange={e => setEditForm({...editForm, admissionReason: e.target.value})}
                          className="w-full p-2 border rounded-lg text-sm"
                          placeholder="Motivo..."
                        />
                      </td>
                      <td className="p-4">
                        <select 
                          value={editForm.category || 'C5'}
                          onChange={e => setEditForm({...editForm, category: e.target.value})}
                          className="w-full p-2 border rounded-lg text-sm"
                        >
                          {Object.entries(TRIAGE_CATEGORIES).map(([key, val]) => (
                            <option key={key} value={key}>{key}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select 
                          value={editForm.stage}
                          onChange={e => setEditForm({...editForm, stage: e.target.value})}
                          className="w-full p-2 border rounded-lg text-sm"
                        >
                          {TRACKER_STEPS.map(step => (
                            <option key={step.id} value={step.id}>{step.title}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <input 
                          type="text" 
                          value={editForm.status}
                          onChange={e => setEditForm({...editForm, status: e.target.value})}
                          className="w-full p-2 border rounded-lg text-sm"
                        />
                      </td>
                      <td className="p-4">
                        <textarea 
                          value={editForm.comment}
                          onChange={e => setEditForm({...editForm, comment: e.target.value})}
                          className="w-full p-2 border rounded-lg text-sm"
                          rows="2"
                        />
                      </td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button onClick={saveEdit} className="p-2 text-success hover:bg-green-50 rounded-lg"><Save size={18} /></button>
                          <button onClick={() => setEditingId(null)} className="p-2 text-danger hover:bg-red-50 rounded-lg"><X size={18} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-4 text-sm text-gray-600 max-w-xs truncate" title={patient.admissionReason}>
                        {patient.admissionReason || '-'}
                      </td>
                      <td className="p-4">
                        {patient.category && TRIAGE_CATEGORIES[patient.category] ? (
                          <span className={`px-2 py-1 rounded text-xs font-bold ${TRIAGE_CATEGORIES[patient.category].color} ${TRIAGE_CATEGORIES[patient.category].text}`}>
                            {patient.category}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium uppercase">{patient.stage}</span>
                      </td>
                      <td className="p-4 font-medium">{patient.status}</td>
                      <td className="p-4 text-sm text-gray-500 max-w-xs truncate">{patient.comment}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => startEdit(patient)} className="p-2 text-primary hover:bg-blue-50 rounded-lg">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => onDeletePatient(patient.id)} className="p-2 text-danger hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Mobile Views ---

function MobileLogin({ patients, onLogin }) {
  const [inputCode, setInputCode] = useState('');
  const [inputRut, setInputRut] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    const found = patients.find(p => p.code.toUpperCase() === inputCode.trim().toUpperCase() && p.rut === inputRut.trim());
    if (found) {
      onLogin(found.code);
    } else {
      setError('Credenciales inválidas. Verifique Código y RUT.');
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="w-full max-w-xs flex flex-col items-center gap-8 my-8">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center text-white">
            <Lock size={40} />
          </div>
          <h1 className="text-2xl font-bold text-primary text-center">Seguimiento de<br/>Paciente</h1>
        </div>

        <div className="w-full space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Código del Paciente</label>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => {
                setInputCode(e.target.value);
                setError('');
              }}
              placeholder="Ingrese código (ej: AX-381)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-lg uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">RUT del Paciente</label>
            <input
              type="password"
              value={inputRut}
              onChange={(e) => {
                setInputRut(e.target.value);
                setError('');
              }}
              placeholder="Ej: 12345678-9 (Sin puntos)"
              className={`w-full px-4 py-3 rounded-xl border ${error ? 'border-danger' : 'border-gray-200'} focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-lg`}
            />
            {error && <p className="text-danger text-xs mt-2 flex items-center gap-1"><AlertTriangle size={12}/> {error}</p>}
          </div>
          
          <button
            onClick={handleLogin}
            disabled={inputCode.length === 0 || inputRut.length === 0}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2
              ${inputCode.length > 0 && inputRut.length > 0 ? 'bg-primary shadow-lg shadow-primary/30' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            <Search size={20} />
            Consultar Estado
          </button>
        </div>

        {/* Help Box for Testing */}
        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-xs text-yellow-800">
          <h3 className="font-bold mb-2 flex items-center gap-2"><Info size={14}/> Datos de Prueba (Solo Demo)</h3>
          <ul className="space-y-1 font-mono">
            {patients.map(p => (
              <li key={p.id} className="flex justify-between border-b border-yellow-100 pb-1 last:border-0">
                <span className="font-bold">{p.code}</span>
                <span className="text-yellow-600">{p.rut}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function MobileTracker({ patient, onBack }) {
  if (!patient) return null;

  // Determine current step index
  const currentStepIndex = TRACKER_STEPS.findIndex(s => s.id === patient.stage);
  const categoryInfo = TRIAGE_CATEGORIES[patient.category];

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white px-6 py-4 shadow-sm flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <Activity size={18} />
          </div>
          <span className="font-semibold text-primary">Urgencias</span>
        </div>
        <button onClick={onBack} className="text-sm text-gray-500 hover:text-primary">Salir</button>
      </header>

      <main className="flex-1 p-6 space-y-6">
        {/* Clinical Summary Card */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <FileText size={80} className="text-primary" />
          </div>
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-primary flex-shrink-0">
              <Stethoscope size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Motivo de Ingreso</h3>
              <p className="text-lg font-semibold text-dark leading-tight">
                {patient.admissionReason || "Consulta General"}
              </p>
            </div>
          </div>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center space-y-2 relative overflow-hidden">
          {/* Category Badge */}
          {categoryInfo && (
            <div className={`absolute top-0 left-0 right-0 h-2 ${categoryInfo.color}`} />
          )}
          
          <span className="text-sm font-medium text-gray-400 uppercase tracking-wider">Estado Actual</span>
          <h2 className="text-2xl font-bold text-primary">{patient.status}</h2>
          
          <div className="flex flex-col items-center gap-2 mt-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600">
              <User size={14} />
              <span>Paciente: {patient.code}</span>
            </div>
            {categoryInfo && (
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${categoryInfo.color} ${categoryInfo.text}`}>
                <span>Categoría {patient.category}</span>
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-info rounded-2xl p-5 border border-blue-100 flex gap-4">
          <div className="flex-shrink-0 text-primary mt-1">
            <Info size={24} />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-primary text-sm">Observaciones del Personal</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {patient.comment || "Sin observaciones recientes."}
            </p>
            <p className="text-xs text-gray-400 mt-2">Actualizado: {patient.lastUpdate}</p>
          </div>
        </div>

        {/* Pizza Tracker */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-6">Progreso de Atención</h3>
          <div className="space-y-0">
            {TRACKER_STEPS.map((step, index) => {
              let status = 'pending';
              if (index < currentStepIndex) status = 'completed';
              if (index === currentStepIndex) status = 'current';

              return (
                <div key={step.id} className="flex gap-4 relative">
                  {/* Line Connector */}
                  {index !== TRACKER_STEPS.length - 1 && (
                    <div className={`absolute left-[11px] top-8 bottom-0 w-0.5 ${
                      index < currentStepIndex ? 'bg-success' : 'bg-gray-200'
                    } -mb-2`} />
                  )}

                  {/* Icon/Dot */}
                  <div className="flex-shrink-0 z-10">
                    {status === 'completed' && (
                      <div className="w-6 h-6 rounded-full bg-success text-white flex items-center justify-center">
                        <CheckCircle size={14} />
                      </div>
                    )}
                    {status === 'current' && (
                      <div className="w-6 h-6 rounded-full bg-warning border-4 border-warning/30 animate-pulse" />
                    )}
                    {status === 'pending' && (
                      <div className="w-6 h-6 rounded-full bg-gray-200" />
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-8 ${status === 'pending' ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <h4 className={`font-medium ${status === 'current' ? 'text-primary' : 'text-gray-800'}`}>
                        {step.title}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

// --- TV Dashboard View ---

function TVDashboard({ patients, isAlertMode }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [footerMsgIndex, setFooterMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const msgTimer = setInterval(() => {
      setFooterMsgIndex((prev) => (prev + 1) % FOOTER_MESSAGES.length);
    }, 4000);
    return () => clearInterval(msgTimer);
  }, []);

  const waitingPatients = patients
    .filter(p => p.stage === 'waiting')
    .sort((a, b) => {
      // Criterio 1: Prioridad por Categoría (C1 > C2 ... > C5)
      const priorities = { 'C1': 1, 'C2': 2, 'C3': 3, 'C4': 4, 'C5': 5 };
      const priorityA = priorities[a.category] || 99;
      const priorityB = priorities[b.category] || 99;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Criterio 2: FIFO por ID (Tiempo de llegada)
      return a.id - b.id;
    });

  const boxPatients = patients.filter(p => p.stage === 'box');
  const examsPatients = patients.filter(p => p.stage === 'exams');

  return (
    <div className="w-full min-h-screen md:h-screen bg-gray-100 flex flex-col overflow-x-hidden md:overflow-hidden relative">
      {/* Alert Banner */}
      {isAlertMode && (
        <div className="bg-danger text-white py-2 px-4 text-center font-bold text-sm md:text-xl animate-pulse flex items-center justify-center gap-3">
          <AlertTriangle size={20} className="md:w-7 md:h-7" />
          <span className="flex-1">ALERTA: EMERGENCIA EN CURSO - POR FAVOR MANTENGA LA CALMA Y DESPEJE LOS PASILLOS</span>
          <AlertTriangle size={20} className="md:w-7 md:h-7" />
        </div>
      )}

      {/* Header */}
      <header className="bg-white px-4 py-3 md:px-8 md:py-5 shadow-md flex flex-col md:flex-row items-center justify-between z-10 gap-3 md:gap-0">
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-center md:justify-start">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-xl flex items-center justify-center text-white">
            <Activity size={20} className="md:w-7 md:h-7" />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-lg md:text-2xl font-bold text-primary leading-none">Urgencias Central</h1>
            <span className="text-xs md:text-sm text-gray-500">Estado de Pacientes en Tiempo Real</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3 bg-gray-50 px-4 py-2 md:px-6 md:py-3 rounded-xl border border-gray-200">
          <Clock className="text-primary w-5 h-5 md:w-6 md:h-6" />
          <span className="text-xl md:text-3xl font-mono font-bold text-dark">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-4 md:p-6 flex flex-col md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-y-auto md:overflow-hidden">
        <Column title="En Sala de Espera" color="border-l-4 border-warning" icon={<User />} patients={waitingPatients} />
        <Column title="En Box de Atención" color="border-l-4 border-primary" icon={<Activity />} patients={boxPatients} />
        <Column title="En Exámenes" color="border-l-4 border-purple-500" icon={<MapPin />} patients={examsPatients} />
      </main>

      {/* Footer */}
      <footer className="bg-dark text-white py-2 md:py-3 px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-4 overflow-hidden">
          <span className="bg-primary px-2 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider">Info</span>
          <p className="text-sm md:text-lg font-medium whitespace-nowrap animate-fade-in key={footerMsgIndex}">
            {FOOTER_MESSAGES[footerMsgIndex]}
          </p>
        </div>
      </footer>
    </div>
  );
}

function Column({ title, color, icon, patients }) {
  // Helper para obtener iniciales (Ej: Juan Pérez -> J.P.)
  const getInitials = (name) => {
    if (!name) return '';
    return name
      .split(' ')
      .filter(part => part.length > 0) // Evitar espacios dobles
      .map(n => n[0].toUpperCase())
      .join('.') + '.';
  };

  // --- Lógica de Paginación Automática ---
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 3; // Cantidad de pacientes por "pantalla"
  const totalPages = Math.ceil(patients.length / ITEMS_PER_PAGE);

  useEffect(() => {
    // Si hay más de 1 página, rotar cada 8 segundos
    if (totalPages <= 1) return;
    
    const interval = setInterval(() => {
      setPage(prev => (prev + 1) % totalPages);
    }, 8000);

    return () => clearInterval(interval);
  }, [totalPages]);

  // Resetear a página 0 si la lista cambia drásticamente
  useEffect(() => {
    setPage(0);
  }, [patients.length]);

  const visiblePatients = patients.slice(
    page * ITEMS_PER_PAGE, 
    (page + 1) * ITEMS_PER_PAGE
  );
  // ---------------------------------------

  return (
    <div className="flex flex-col h-auto min-h-[500px] md:h-full bg-white border-2 border-gray-300 shadow-lg rounded-2xl p-3">
      <div className="flex items-center gap-3 mb-4 px-2 py-2">
        <div className={`p-2 bg-white rounded-lg shadow-sm text-gray-600`}>{icon}</div>
        <h2 className="text-xl font-bold text-gray-700">{title}</h2>
        <span className="ml-auto bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full text-sm font-bold">
          {patients.length}
        </span>
      </div>
      
      {/* Indicador de Página (Solo si hay más de una) */}
      {totalPages > 1 && (
        <div className="px-2 mb-2 flex justify-end">
          <span className="bg-gray-200 text-gray-600 text-xs font-bold px-2 py-1 rounded uppercase">
            Página {page + 1} / {totalPages}
          </span>
        </div>
      )}
      
      <div className="flex-1 md:overflow-hidden space-y-3 pr-2">
        {visiblePatients.map(patient => {
          const categoryInfo = TRIAGE_CATEGORIES[patient.category];
          return (
            <div key={patient.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex justify-between items-center relative overflow-hidden animate-fade-in">
              {/* Category Indicator */}
              {categoryInfo && (
                <div className={`absolute right-0 top-0 bottom-0 w-3 ${categoryInfo.color}`} title={categoryInfo.label} />
              )}
              
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase">Código</span>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-dark">{patient.code}</span>
                  {/* Iniciales del Paciente */}
                  <span className="text-xl font-semibold text-gray-400 tracking-wide">
                    {getInitials(patient.name)}
                  </span>
                  {categoryInfo && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryInfo.color} ${categoryInfo.text}`}>
                      {patient.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right pr-4">
                <div className="text-xs font-bold text-gray-400 uppercase">Actualizado</div>
                <div className="text-lg font-mono text-gray-600">{patient.lastUpdate}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
