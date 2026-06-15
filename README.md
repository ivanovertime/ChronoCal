# **PRD: ChronoCal \- Local Time Tracker para Google Calendar**

| Propiedad | Detalle |
| :---- | :---- |
| **Nombre del Producto** | ChronoCal (Add-on Local de Tracking para Google Workspace) |
| **Fecha** | Junio de 2026 |
| **Autor** | Product Manager Expert |
| **Estado** | Listo para Revisión de Ingeniería (Ready for Dev) |
| **Versión** | v1.0 |

## **1\. Introducción y Visión del Producto**

### **1.1. Contexto y Problema**

Los profesionales que gestionan su día en Google Calendar y Google Tasks a menudo necesitan registrar cuánto tiempo real les toma completar sus tareas y eventos. Las soluciones existentes (como Toggl o Clockify) requieren el uso de plataformas y bases de datos externas de terceros. Esto introduce:

1. **Riesgos de privacidad:** Transferencia de agendas y datos sensibles fuera del entorno de Google.  
2. **Costes o dependencias:** Modelos de suscripción y dependencias de APIs externas.  
3. **Fricción de sincronización:** Duplicidad de interfaces y configuraciones.

### **1.2. Visión del Producto**

Crear un **Google Workspace Add-on** de panel lateral que actúe de manera 100% nativa y local dentro de Google Calendar. La extensión permitirá iniciar y detener un temporizador para cualquier evento o tarea seleccionada, utilizando la propia **API de Google Calendar** para actualizar el evento (ajustando la duración real o escribiendo en la descripción), almacenando los datos intermedios en la caché local del usuario o en una hoja de cálculo personal (Google Sheets), garantizando **privacidad absoluta y cero dependencias de servidores externos**.

## **2\. Objetivos del Negocio y del Usuario**

### **2.1. Objetivos del Usuario**

* **Privacidad Total:** Que ningún dato de su agenda salga de los servidores de Google de su cuenta.  
* **Sencillez Extrema:** Un botón de "Play / Stop" directamente al hacer clic en cualquier evento de Google Calendar.  
* **Flexibilidad de Registro:** Poder elegir si el tiempo registrado modifica la duración visual del evento en la cuadrícula o si se guarda como metadatos/texto en la descripción del evento.

### **2.2. Métricas de Éxito (KPIs)**

* **Adopción:** Número de usuarios activos que registran al menos 3 tareas por semana.  
* **Rendimiento:** Latencia de actualización del evento tras dar clic en "Detener" inferior a 2 segundos.  
* **Retención:** Retención de usuarios a 30 días del 60% (alta fidelidad debido a la propuesta de privacidad).

## **3\. Personas de Usuario (User Personas)**

### **3.1. Carlos, Desarrollador/Consultor Freelance Consciente de la Privacidad**

* **Necesidades:** Registrar horas exactas de reuniones y tareas de código para facturar a clientes.  
* **Problema:** Trabaja con clientes bajo acuerdos de confidencialidad estrictos (NDA) y no puede subir los títulos de sus tareas o nombres de clientes a plataformas de terceros como Toggl.  
* **Caso de uso de ChronoCal:** Abre Google Calendar, hace clic en el evento "Debug de base de datos Cliente X", inicia el temporizador en el panel lateral de ChronoCal y, al terminar, el evento se actualiza automáticamente con la duración real y un tag \[Tiempo Real: 01:42:00\] en la descripción.

## **4\. Requisitos Funcionales (Functional Requirements)**

### **4.1. Core Loop (Flujo Principal)**

1. El usuario selecciona un evento en su interfaz de Google Calendar.  
2. El Add-on contextual se abre en el panel lateral derecho de la pantalla.  
3. El Add-on reconoce el ID del evento seleccionado.  
4. El usuario hace clic en **"Iniciar Registro"** (Start).  
5. El sistema guarda la hora de inicio en el almacenamiento persistente nativo del usuario (PropertiesService de Google Apps Script) y arranca un cronómetro visual.  
6. El usuario trabaja en su tarea. (Puede cerrar la pestaña de Calendar, el estado se preserva en los servidores de Google mediante Apps Script).  
7. Al completar la tarea, el usuario hace clic en **"Detener y Guardar"** (Stop).  
8. El sistema calcula la diferencia horaria, limpia la caché de registro activa y aplica la acción seleccionada por el usuario (modificar hora de fin o añadir nota en la descripción).

### **4.2. Módulos y Requisitos Detallados**

#### **FR-01: Interfaz del Panel Lateral (Sidebar Card UI)**

* **Descripción:** Interfaz construida con el framework nativo de tarjetas de Google Workspace (CardService).  
* **Sub-requisitos:**  
  * Debe mostrar el nombre del evento seleccionado de forma dinámica.  
  * Estado **Sin Iniciar:** Botón verde grande de **"Iniciar Temporizador"**.  
  * Estado **Activo:** Muestra el tiempo transcurrido en tiempo real (HH:MM:SS), botón de **"Pausar"** (opcional/deseable) y botón rojo de **"Detener y Guardar"**.  
  * Estado **Pausado:** Botón para **"Reanudar"** y botón para **"Descartar"**.

#### **FR-02: Integración con Google Calendar API (Modificación de Eventos)**

* **Descripción:** Interacción directa con los datos del evento actual sin intermediación de backends externos.  
* **Acciones Disponibles al Detener el Tiempo:**  
  * **Opción A (Ajustar duración del evento):** Modifica el parámetro end del evento en Calendar. El evento se desplaza visualmente en la cuadrícula para reflejar la duración real de lo trabajado.  
    * *Ejemplo:* Evento agendado de 10:00 a 11:00. Si el usuario trabajó 1h 30m, la API modifica el fin del evento a las 11:30 de manera automática.  
  * **Opción B (Registro en Descripción):** Añade una línea al final de la descripción del evento con formato estandarizado.  
    * *Formato:* ⌛ Registro de Tiempo: {HH:MM:SS} (Fecha: DD/MM/AAAA)  
  * **Opción C (Exportar a Google Sheets):** Al detenerse, si el usuario tiene configurada una Spreadsheet propia, la extensión añade una fila con \[Fecha, ID\_Evento, Título, Duración, Descripción\].

#### **FR-03: Gestión del Estado de Sesión (No-Backend DB)**

* **Descripción:** Almacenamiento del estado del cronómetro (para evitar que se pierda si el usuario cierra el navegador o refresca la página).  
* **Sub-requisitos:**  
  * Uso de **PropertiesService.getUserProperties()** de Google Apps Script. Este servicio es un almacén clave-valor integrado directamente en la infraestructura de la cuenta de Google de cada usuario.  
  * Al dar "Play", se guarda:  
    {  
      "active\_event\_id": "google\_event\_id\_xyz",  
      "start\_time": "2026-06-13T12:00:00.000Z",  
      "status": "RUNNING"  
    }

  * Al abrir el calendario en cualquier momento o dispositivo, el Add-on consulta getUserProperties() y, si hay una sesión activa para ese evento, inicializa el temporizador en el punto correcto.

## **5\. Diseño de Arquitectura (Nativa y Serverless de Google)**

La arquitectura no requiere servidores externos gracias a la estructura nativa de los Add-ons de Google Workspace:

\[ Navegador del Usuario (Google Calendar) \]  
                     │  
                     ▼ (Acciones de la UI: Play / Stop)  
   \[ Código de Apps Script (Google Server) \]  ◄─── No es un tercero, corre bajo la cuenta de Google  
          │                     │  
          ├─────────────────────┼─────────────────────┐  
          ▼                     ▼                     ▼  
 ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐  
 │ Google Calendar │   │ Properties      │   │ Google Sheets   │  
 │ API             │   │ Service         │   │ API (Opcional)  │  
 │ (Ajusta evento) │   │ (Caché local)   │   │ (Log personal)  │  
 └─────────────────┘   └─────────────────┘   └─────────────────┘

## **6\. Diseño de UI/UX (Directrices)**

Dado que es un Google Workspace Add-on nativo, la UI debe seguir estrictamente los lineamientos de diseño de Google:

* **Colores:** Azul Google (\#1a73e8) para interacciones normales, Verde (\#1e8e3e) para "Iniciar", Rojo (\#d93025) para "Detener".  
* **Comportamiento Adaptativo:** El panel lateral debe ajustarse fluidamente en ancho cuando el usuario redimensiona la barra lateral de Google Calendar.  
* **Retroalimentación No Intrusiva:** Al guardar con éxito un registro de tiempo, debe aparecer un pequeño "Toast" (notificación emergente inferior) indicando *"Evento actualizado con éxito"*, en lugar de alertas molestas.

## **7\. Requisitos No Funcionales (Non-Functional Requirements)**

* **Seguridad y Privacidad (Crítico):**  
  * **Cero llamadas HTTPS externas:** La extensión no puede realizar peticiones a dominios externos (UrlFetchApp deshabilitado o restringido a APIs de Google). Esto garantiza que la extensión pueda pasar cualquier auditoría de seguridad corporativa inmediatamente.  
  * **Scopes mínimos de OAuth:** Solo solicitar permisos estrictamente necesarios:  
    * https://www.googleapis.com/auth/calendar.events (Para ver y editar eventos).  
    * https://www.googleapis.com/auth/spreadsheets (Solo si el usuario activa el log en Google Sheets).  
* **Escalabilidad y Límites:**  
  * El sistema hereda las cuotas nativas de Google Apps Script de forma gratuita para el usuario (hasta 20,000 llamadas a la API de Calendar por día), lo cual es infinitamente superior al uso de un solo individuo.

## **8\. Plan de Lanzamiento y Fases (Milestones)**

### **Fase 1: MVP (Producto Mínimo Viable)**

* Interfaz básica con Play / Stop en el panel lateral al seleccionar un evento.  
* Al dar "Stop", se actualiza la descripción del evento añadiendo la cadena ⌛ Duración Real: \[HH:MM:SS\].  
* Estado guardado en PropertiesService para evitar pérdidas por desconexión.

### **Fase 2: Automatización Horaria**

* Opción para extender o recortar la duración física del evento en la cuadrícula de Google Calendar.  
* Implementación de un botón para "Descartar sesión de tiempo activa".

### **Fase 3: Analíticas Locales (Google Sheets Sync)**

* Sincronización automática de cada "Stop" a una pestaña de una hoja de cálculo elegida por el usuario.  
* Generación de gráficos simples dentro de esa misma hoja de cálculo (por categorías de colores de Google Calendar).

## **9\. Riesgos y Mitigación**

| Riesgo identificado | Severidad | Plan de Mitigación |
| :---- | :---- | :---- |
| El usuario cambia de evento en la interfaz de Calendar mientras el temporizador del evento original sigue corriendo. | Media | La UI del panel lateral debe mostrar de forma clara qué evento se está registrando actualmente (por ejemplo: *"Registrando: \[Título de Evento A\]"*) con un indicador visual parpadeante, sin importar qué evento tenga seleccionado el usuario en ese momento. |
| El navegador entra en suspensión prolongada o se apaga la computadora del usuario. | Alta | La lógica se calcula comparando marcas de tiempo absolutas (Timestamp actual \- Timestamp de inicio). No dependemos de que el navegador esté ejecutando activamente un proceso segundo a segundo. Al reactivar, la diferencia horaria será exacta. |

