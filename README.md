# **PRD: ChronoCal - Local Time Tracker para Google Calendar**

| Propiedad | Detalle |
| :---- | :---- |
| **Nombre del Producto** | ChronoCal (Add-on local de tracking para Google Workspace) |
| **Fecha** | Junio de 2026 |
| **Autor** | Product Manager Expert |
| **Estado** | Revisado para Ingeniería |
| **Versión** | v1.1 |

## **1. Introducción y Visión del Producto**

### **1.1. Contexto y Problema**

Los profesionales que gestionan su día en Google Calendar y Google Tasks suelen necesitar registrar el tiempo real dedicado a reuniones, bloques de trabajo y tareas. Muchas soluciones existentes dependen de plataformas externas, lo que introduce riesgos de privacidad, costes adicionales y duplicidad de herramientas.

ChronoCal resuelve ese problema dentro del propio ecosistema de Google Workspace, sin backend propio y sin servicios externos.

### **1.2. Visión del Producto**

Crear un **Google Workspace Add-on** para Google Calendar que permita iniciar y detener un registro de tiempo desde un panel lateral contextual. El add-on almacenará el estado de sesión de forma nativa en Google Apps Script y aplicará el resultado al evento mediante la API de Calendar o, opcionalmente, a Google Sheets.

### **1.3. Supuestos de Viabilidad**

* El producto es **desktop-first** y se usa desde Google Calendar web.
* El panel lateral se construye con **CardService** y no puede ejecutar JavaScript de cliente ni un reloj en vivo por segundo.
* El estado activo se recalcula por marcas de tiempo absolutas cuando el usuario interactúa con la UI.
* El producto no usa servidores externos ni bases de datos de terceros.

## **2. Objetivos del Negocio y del Usuario**

### **2.1. Objetivos del Usuario**

* **Privacidad total:** mantener el registro dentro de Google Workspace.
* **Simplicidad extrema:** iniciar y detener el tracking desde el propio evento.
* **Flexibilidad de salida:** elegir entre escribir la duración en la descripción, ajustar el horario del evento o exportar a Sheets.

### **2.2. Métricas de Éxito (KPIs)**

* **Adopción:** usuarios activos que registran al menos 3 sesiones por semana.
* **Rendimiento:** tiempo desde Stop hasta confirmación visible inferior a 2 segundos en condiciones normales.
* **Retención:** 30 días con 60% de retención en usuarios que usan el add-on al menos una vez por semana.

## **3. Personas de Usuario**

### **3.1. Carlos, consultor freelance consciente de la privacidad**

* **Necesidades:** registrar horas reales para facturación y reporting.
* **Problema:** trabaja con NDA y no quiere enviar eventos o títulos a servicios externos.
* **Uso esperado:** abre un evento en Calendar, inicia el registro y al finalizar guarda la duración real en el mismo ecosistema de Google.

## **4. Alcance Funcional**

### **4.1. Flujo Principal**

1. El usuario abre un evento en Google Calendar.
2. El add-on contextual se muestra en el panel lateral.
3. El add-on identifica el evento activo mediante el contexto del trigger.
4. El usuario pulsa **Iniciar registro**.
5. El sistema guarda `event_id`, `calendar_id`, `start_time` y `status` en `UserProperties`.
6. El usuario trabaja en su tarea.
7. El usuario pulsa **Detener y guardar**.
8. El sistema calcula la duración usando marcas de tiempo absolutas, limpia la sesión activa y guarda el resultado en Calendar o Sheets según la configuración.

### **4.2. Requisitos Funcionales Detallados**

#### **FR-01: Interfaz del panel lateral**

* La UI debe estar construida con **CardService**.
* Debe mostrar el título del evento activo y el estado de la sesión.
* Debe soportar estos estados:
  * **Sin iniciar:** botón principal para iniciar.
  * **Activo:** muestra tiempo transcurrido calculado al recargar la tarjeta o al pulsar acciones; incluye detener y, opcionalmente, pausar.
  * **Pausado:** permite reanudar o descartar.
* La UI debe ser declarativa y actualizarse solo mediante acciones del usuario.

#### **FR-02: Integración con Google Calendar**

* Al detener la sesión, el add-on debe poder aplicar una de estas salidas:
  * **Opción A:** añadir una línea estándar en la descripción del evento.
  * **Opción B:** ajustar la hora de fin del evento si el usuario lo habilita.
  * **Opción C:** registrar una fila en una hoja de cálculo de Google Sheets.
* El formato base para descripción debe ser:
  * `⌛ Duración Real: HH:MM:SS (Fecha: DD/MM/AAAA)`
* Si el evento no existe, fue borrado o no hay permisos, el add-on debe mostrar un mensaje claro y no perder la sesión guardada hasta resolver el error.

#### **FR-03: Gestión del estado de sesión**

* El add-on debe usar `PropertiesService.getUserProperties()` para guardar la sesión activa.
* El estado mínimo guardado debe incluir:

```json
{
  "active_event_id": "google_event_id_xyz",
  "calendar_id": "primary",
  "start_time": "2026-06-13T12:00:00.000Z",
  "status": "RUNNING"
}
```

* El estado debe ser pequeño y no superar los límites de `PropertiesService`.
* Si el usuario vuelve a abrir Calendar, el add-on debe recuperar el estado y reconstruir la sesión activa.

#### **FR-04: Exportación a Google Sheets**

* La exportación a Sheets es opcional y desactivada por defecto.
* Si el usuario la activa, el add-on debe añadir una fila por cada Stop con:
  * fecha
  * ID de evento
  * título
  * duración
  * descripción
* Si no se ha configurado una hoja destino, el add-on debe pedir al usuario que la indique.

## **5. Diseño de Arquitectura**

La arquitectura se mantiene nativa dentro de Google:

```text
[Google Calendar en el navegador]
          │
          ▼
[Apps Script / CardService]
          │
          ├── Calendar service
          ├── UserProperties
          └── Sheets service (opcional)
```

### **5.1. Principios de diseño**

* Sin backend propio.
* Sin llamadas HTTPS externas.
* Sin dependencia de estado en el navegador.
* Cálculo de duración basado en timestamps absolutos.

## **6. Diseño de UI/UX**

* La UI debe seguir el estilo de Google Workspace.
* Los botones principales deben ser claros, con prioridad visual para iniciar y detener.
* Los colores sugeridos son:
  * azul para acciones neutras,
  * verde para iniciar,
  * rojo para detener.
* La confirmación de guardado debe mostrarse como notificación no intrusiva.
* La experiencia debe ser estable cuando el usuario cambia de evento o refresca el panel.

## **7. Requisitos No Funcionales**

### **7.1. Seguridad y Privacidad**

* No usar servicios externos.
* No usar `UrlFetchApp` salvo que en el futuro exista una integración de Google aprobada.
* Solicitar solo los scopes necesarios para la funcionalidad activada.

### **7.2. Scopes previstos**

* Modo base:
  * acceso a datos del evento actual de Calendar según el contexto del add-on.
* Modo escritura en Calendar:
  * scope de escritura para el evento actual de Calendar.
* Modo Sheets:
  * scope de Sheets solo cuando el usuario active exportación.

### **7.3. Límites y Escalabilidad**

* El add-on debe respetar las cuotas y límites de Apps Script.
* El estado almacenado en propiedades debe ser pequeño.
* La lógica debe tolerar suspensión del navegador y reanudación posterior.

## **8. Plan de Lanzamiento y Fases**

### **Fase 1: MVP**

* Panel lateral contextual al abrir un evento.
* Botón de iniciar y botón de detener.
* Persistencia de sesión en `UserProperties`.
* Guardado de duración en la descripción del evento.
* Notificación de éxito al finalizar.

### **Fase 2: Automatización horaria**

* Opción para extender o recortar la duración del evento.
* Botón para pausar, reanudar y descartar la sesión activa.
* Manejo mejorado de eventos repetidos y conflictos.

### **Fase 3: Analíticas locales**

* Exportación a Google Sheets.
* Resúmenes por fecha, duración y calendario.
* Preparación de gráficos simples dentro de la hoja de cálculo.

## **9. Riesgos y Mitigación**

| Riesgo identificado | Severidad | Plan de mitigación |
| :---- | :---- | :---- |
| El usuario cambia de evento mientras el temporizador del original sigue activo. | Media | Mostrar claramente el evento que se está registrando, con nombre y estado de sesión persistente. |
| El navegador se suspende o se cierra. | Alta | Calcular duración con timestamps absolutos y no con un contador dependiente del cliente. |
| El evento se elimina o cambia antes de detener. | Media | Validar el evento al guardar y mostrar un error recuperable sin perder el estado de sesión hasta resolverlo. |
| El usuario habilita Sheets sin haber configurado una hoja destino. | Baja | Solicitar configuración explícita antes del primer export. |
| El add-on requiere más permisos de los necesarios. | Alta | Mantener scopes mínimos y separar la exportación a Sheets como característica opcional. |

## **10. Criterios de Aceptación**

* El add-on abre el panel contextual al abrir un evento en Calendar.
* El usuario puede iniciar y detener una sesión sin depender de servidores externos.
* La duración queda persistida y visible tras recargar el panel.
* El resultado se escribe correctamente en la descripción del evento en la Fase 1.
* La implementación puede crecer a edición de fin de evento y Sheets sin rediseñar la arquitectura base.

## **11. Fuera de Alcance Inicial**

* Cronómetro visual con tick por segundo dentro de CardService.
* Soporte móvil como objetivo principal.
* Concurrencia de múltiples sesiones activas por usuario.
* Backend propio o base de datos externa.
* Integraciones con servicios de terceros.

## **12. Resumen Ejecutivo**

ChronoCal es viable como add-on de Google Calendar si se respeta el modelo real de Apps Script: UI declarativa, estado persistente por usuario, y actualizaciones por acciones. La propuesta de valor de privacidad sigue intacta, pero el MVP debe ser más sobrio: panel contextual, start/stop, persistencia y escritura en Calendar. El resto debe salir por fases.

