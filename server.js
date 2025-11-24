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
  { 
    id: 1, 
    code: 'VS-100', 
    rut: '22.152.183-8',
    name: 'Vicente Alejandro Saa Vargas', 
    stage: 'waiting', 
    status: 'EN SALA DE ESPERA', 
    category: 'C3',
    comment: 'Paciente ingresado para demostración.', 
    lastUpdate: '08:30' 
  },
  { 
    id: 2, 
    code: 'VG-200', 
    rut: '22.102.520-2',
    name: 'Vicente Alfonso García Tapia', 
    stage: 'box', 
    status: 'EN UCI', 
    category: 'C1',
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
    comment: 'Consulta general por alergia estacional.', 
    lastUpdate: '10:20' 
  }
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
