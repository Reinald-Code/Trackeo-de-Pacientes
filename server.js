import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Permitir conexiones desde cualquier origen (Vite dev server, móviles, etc)
    methods: ["GET", "POST"]
  }
});

// --- Base de Datos en Memoria ---
let patients = [
  // --- Tus Amigos (Demo) ---
  { 
    id: 2, 
    code: 'VG-200', 
    rut: '22.102.520-2',
    name: 'Vicente Alfonso García Tapia', 
    stage: 'box', 
    status: 'EN UCI', 
    category: 'C1',
    admissionReason: 'Insuficiencia cardíaca severa',
    comment: 'Daños generales en el corazón. Pronóstico reservado.', 
    lastUpdate: '09:15' 
  },
  { 
    id: 3, 
    code: 'WJ-300', 
    rut: '20.525.065-4',
    name: 'Wilson Alexis Jara Pérez', 
    stage: 'exams', 
    status: 'EN IMAGENOLOGÍA', 
    category: 'C4',
    admissionReason: 'Traumatismo en rodilla derecha',
    comment: 'Chequeo de meniscos por dolor crónico.', 
    lastUpdate: '10:00' 
  },
  { 
    id: 4, 
    code: 'BL-400', 
    rut: '22.204.706-4',
    name: 'Benjamín Amaro Lazo Roldán', 
    stage: 'box', 
    status: 'EN REANIMACIÓN', 
    category: 'C1',
    admissionReason: 'Paro cardiorrespiratorio',
    comment: 'Paro cardíaco por exceso de bebidas energéticas.', 
    lastUpdate: '09:45' 
  },
  { 
    id: 5, 
    code: 'DA-500', 
    rut: '19.622.479-3',
    name: 'Diego Alberto Allendes Zepeda', 
    stage: 'waiting', 
    status: 'EN SALA DE ESPERA', 
    category: 'C5',
    admissionReason: 'Reacción alérgica cutánea',
    comment: 'Consulta general por alergia estacional.', 
    lastUpdate: '10:20' 
  },
  // --- Pacientes de Relleno (Originales) ---
  { 
    id: 6, 
    code: 'AX-381', 
    rut: '12.345.678-9',
    name: 'Juan Parra', 
    stage: 'waiting', 
    status: 'EN SALA DE ESPERA', 
    category: 'C3',
    admissionReason: 'Hipertensión descompensada',
    comment: 'Paciente ingresado, signos vitales estables.', 
    lastUpdate: '10:30' 
  },
  { 
    id: 7, 
    code: 'BX-202', 
    rut: '9.876.543-2',
    name: 'María González', 
    stage: 'box', 
    status: 'EN BOX 3', 
    category: 'C2',
    admissionReason: 'Sospecha de apendicitis',
    comment: 'Evaluación médica en curso.', 
    lastUpdate: '10:15' 
  },
  { 
    id: 8, 
    code: 'CX-105', 
    rut: '11.222.333-4',
    name: 'Carlos Ruiz', 
    stage: 'exams', 
    status: 'EN RAYOS X', 
    category: 'C4',
    admissionReason: 'Esguince de tobillo',
    comment: 'Traslado a imagenología.', 
    lastUpdate: '09:45' 
  },
  { 
    id: 9, 
    code: 'DX-991', 
    rut: '5.555.555-5',
    name: 'Ana López', 
    stage: 'waiting', 
    status: 'EN SALA DE ESPERA', 
    category: 'C5',
    admissionReason: 'Cefalea tensional',
    comment: 'Esperando llamado para triage.', 
    lastUpdate: '10:40' 
  },
  { 
    id: 10, 
    code: 'EX-112', 
    rut: '15.111.222-3',
    name: 'Pedro Pascal', 
    stage: 'waiting', 
    status: 'EN SALA DE ESPERA', 
    category: 'C4',
    admissionReason: 'Gastroenteritis aguda',
    comment: 'Dolor abdominal leve.', 
    lastUpdate: '10:45' 
  },
  { 
    id: 11, 
    code: 'FX-334', 
    rut: '18.444.555-6',
    name: 'Laura Bozzo', 
    stage: 'waiting', 
    status: 'EN SALA DE ESPERA', 
    category: 'C3',
    admissionReason: 'Síndrome febril',
    comment: 'Fiebre alta.', 
    lastUpdate: '10:50' 
  },
  { 
    id: 12, 
    code: 'GX-556', 
    rut: '20.777.888-9',
    name: 'Roberto Gómez', 
    stage: 'waiting', 
    status: 'EN SALA DE ESPERA', 
    category: 'C5',
    admissionReason: 'Control post-operatorio',
    comment: 'Control rutinario.', 
    lastUpdate: '10:55' 
  },
  { 
    id: 13, 
    code: 'HX-778', 
    rut: '10.999.000-1',
    name: 'Gabriela Mistral', 
    stage: 'waiting', 
    status: 'EN SALA DE ESPERA', 
    category: 'C2',
    admissionReason: 'Crisis asmática',
    comment: 'Dificultad respiratoria.', 
    lastUpdate: '11:00' 
  },
];

let isAlertMode = false;

io.on('connection', (socket) => {
  console.log('Cliente conectado:', socket.id);

  // Enviar estado actual al conectarse
  socket.emit('init_data', patients);
  socket.emit('update_alert_mode', isAlertMode);

  // Escuchar nuevo paciente
  socket.emit('update_patients', patients);

  socket.on('add_patient', (newPatient) => {
    patients.push(newPatient);
    io.emit('update_patients', patients); // Emitir a TODOS
  });

  // Escuchar actualización de paciente
  socket.on('update_patient', ({ id, updates }) => {
    patients = patients.map(p => 
      p.id === id ? { ...p, ...updates, lastUpdate: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : p
    );
    io.emit('update_patients', patients); // Emitir a TODOS
  });

  // Escuchar eliminación de paciente
  socket.on('delete_patient', (id) => {
    patients = patients.filter(p => p.id !== id);
    io.emit('update_patients', patients); // Emitir a TODOS
  });

  // Escuchar cambio de alerta
  socket.on('toggle_alert', (newState) => {
    isAlertMode = newState;
    io.emit('update_alert_mode', isAlertMode); // Emitir a TODOS
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor Socket.io corriendo en http://0.0.0.0:${PORT}`);
});
