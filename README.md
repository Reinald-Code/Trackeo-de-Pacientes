# Sistema de Triage y Seguimiento de Pacientes (Tiempo Real)

Este proyecto es una aplicación web de **seguimiento de pacientes en urgencias en tiempo real**, diseñada para mejorar la comunicación entre el personal médico, los pacientes y sus familiares. Utiliza **WebSockets** para sincronizar instantáneamente el estado de los pacientes en todas las pantallas conectadas.

## Características Principales

El sistema cuenta con 4 vistas principales integradas en una sola aplicación (SPA):

1.  **📱 Vista Móvil - Login Paciente**:
    *   Permite a los familiares ingresar el **Código del Paciente** y su **RUT** para consultar su estado.
    *   Validación de credenciales en tiempo real.

2.  **📍 Vista Móvil - Tracker (Seguimiento)**:
    *   Visualización paso a paso del proceso de urgencia: **Admisión → Triage → Sala de Espera → Atención Médica → Exámenes → Alta**.
    *   Muestra el estado actual, observaciones del personal médico y la hora de la última actualización.

3.  **📺 Vista TV - Dashboard Público**:
    *   Diseñado para pantallas grandes en salas de espera.
    *   Muestra listas de pacientes clasificados por estado (En Espera, En Box, En Exámenes).
    *   Reloj en tiempo real y carrusel de mensajes informativos en el pie de página.
    *   **Modo Alerta**: Banner de emergencia que se activa remotamente para notificar situaciones críticas.

4.  **🛡️ Panel de Administración**:
    *   Acceso protegido por contraseña para el personal de salud.
    *   **Gestión de Pacientes**: Crear, editar (cambiar etapa, estado, comentarios) y eliminar pacientes.
    *   **Control de Alerta**: Activar/Desactivar el modo de emergencia en las pantallas de TV.

## Tecnologías Utilizadas

*   **Frontend**: React, Tailwind CSS, Lucide React (Iconos), Vite.
*   **Backend**: Node.js, Express, Socket.io (para comunicación bidireccional en tiempo real).

## Instalación y Ejecución

Para ejecutar el sistema completo, necesitas iniciar tanto el servidor backend como el frontend.

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Iniciar el Servidor Backend (Socket.io)**:
    En una terminal, ejecuta:
    ```bash
    node server.js
    ```
    *El servidor escuchará en el puerto 3000.*

3.  **Iniciar el Servidor Frontend (Vite)**:
    En **otra** terminal, ejecuta:
    ```bash
    npm run dev
    ```
    *La aplicación web estará disponible generalmente en `http://localhost:5173`.*

## Guía de Uso

### 1. Acceso al Panel de Administración
*   En la esquina superior derecha de la pantalla, verás botones para cambiar de vista. Haz clic en **"Admin"**.
*   Ingresa la contraseña maestra: **`admin`**.
*   Desde aquí podrás **Admitir Nuevos Pacientes** y gestionar los existentes.

### 2. Crear un Paciente
*   En el Panel Admin, haz clic en **"Admitir Nuevo Paciente"**.
*   Ingresa el RUT y Nombre.
*   El sistema generará automáticamente un **Código** (ej: `AX-381`). **Anota este código y el RUT**, ya que son necesarios para el seguimiento.

### 3. Seguimiento del Paciente (Vista Móvil)
*   Cambia a la vista **"Móvil"** (botón superior derecho).
*   Ingresa el **Código** y **RUT** del paciente que creaste.
*   Verás el progreso del paciente. Prueba cambiar su estado desde el Panel Admin y verás cómo se actualiza automáticamente aquí.

### 4. Pantalla Pública (TV)
*   Cambia a la vista **"TV"** (botón superior derecho).
*   Verás a los pacientes listados según su etapa.
*   Desde el Panel Admin, prueba el botón **"Simular Alerta"** para ver cómo cambia la pantalla de TV instantáneamente.
