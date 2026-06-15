# PRD: ChronoCal - Local Time Tracker para Google Calendar

| Propiedad | Detalle |
| :---- | :---- |
| Nombre del Producto | ChronoCal (Add-on local de tracking para Google Workspace) |
| Fecha | Junio de 2026 |
| Autor | Product Manager Expert |
| Estado | Revisado para Ingenieria |
| Version | v1.1 |

## 1. Introduccion y Vision del Producto

### 1.1. Contexto y Problema

Los profesionales que gestionan su dia en Google Calendar y Google Tasks suelen necesitar registrar el tiempo real dedicado a reuniones, bloques de trabajo y tareas. Muchas soluciones existentes dependen de plataformas externas, lo que introduce riesgos de privacidad, costes adicionales y duplicidad de herramientas.

ChronoCal resuelve ese problema dentro del propio ecosistema de Google Workspace, sin backend propio y sin servicios externos.

### 1.2. Vision del Producto

Crear un Google Workspace Add-on para Google Calendar que permita iniciar y detener un registro de tiempo desde un panel lateral contextual. El add-on almacenara el estado de sesion de forma nativa en Google Apps Script y aplicara el resultado al evento mediante la API de Calendar o, opcionalmente, a Google Sheets.

### 1.3. Supuestos de Viabilidad

- El producto es desktop-first y se usa desde Google Calendar web.
- El panel lateral se construye con CardService y no puede ejecutar JavaScript de cliente ni un reloj en vivo por segundo.
- El estado activo se recalcula por marcas de tiempo absolutas cuando el usuario interactua con la UI.
- El producto no usa servidores externos ni bases de datos de terceros.

## 2. Objetivos del Negocio y del Usuario

### 2.1. Objetivos del Usuario

- Privacidad total: mantener el registro dentro de Google Workspace.
- Simplicidad extrema: iniciar y detener el tracking desde el propio evento.
- Flexibilidad de salida: elegir entre escribir la duracion en la descripcion, ajustar el horario del evento o exportar a Sheets.

### 2.2. Metricas de Exito (KPIs)

- Adopcion: usuarios activos que registran al menos 3 sesiones por semana.
- Rendimiento: tiempo desde Stop hasta confirmacion visible inferior a 2 segundos en condiciones normales.
- Retencion: 30 dias con 60% de retencion en usuarios que usan el add-on al menos una vez por semana.

## 3. Personas de Usuario

### 3.1. Carlos, consultor freelance consciente de la privacidad

- Necesidades: registrar horas reales para facturacion y reporting.
- Problema: trabaja con NDA y no quiere enviar eventos o titulos a servicios externos.
- Uso esperado: abre un evento en Calendar, inicia el registro y al finalizar guarda la duracion real en el mismo ecosistema de Google.

## 4. Alcance Funcional

### 4.1. Flujo Principal

1. El usuario abre un evento en Google Calendar.
2. El add-on contextual se muestra en el panel lateral.
3. El add-on identifica el evento activo mediante el contexto del trigger.
4. El usuario pulsa Iniciar registro.
5. El sistema guarda event_id, calendar_id, start_time y status en UserProperties.
6. El usuario trabaja en su tarea.
7. El usuario pulsa Detener y guardar.
8. El sistema calcula la duracion usando marcas de tiempo absolutas, limpia la sesion activa y guarda el resultado en Calendar o Sheets segun la configuracion.

### 4.2. Requisitos Funcionales Detallados

#### FR-01: Interfaz del panel lateral

- La UI debe estar construida con CardService.
- Debe mostrar el titulo del evento activo y el estado de la sesion.
- Debe soportar estos estados: sin iniciar, activo, pausado.
- La UI debe ser declarativa y actualizarse solo mediante acciones del usuario.

#### FR-02: Integracion con Google Calendar

- Al detener la sesion, el add-on debe poder aplicar una de estas salidas:
  - Opcion A: anadir una linea estandar en la descripcion del evento.
  - Opcion B: ajustar la hora de fin del evento si el usuario lo habilita.
  - Opcion C: registrar una fila en una hoja de calculo de Google Sheets.
- El formato base para descripcion debe ser: Duracion Real: HH:MM:SS (Fecha: DD/MM/AAAA).
- Si el evento no existe, fue borrado o no hay permisos, el add-on debe mostrar un mensaje claro y no perder la sesion guardada hasta resolver el error.

#### FR-03: Gestion del estado de sesion

- El add-on debe usar PropertiesService.getUserProperties() para guardar la sesion activa.
- El estado debe ser pequeno y no superar los limites de PropertiesService.
- Si el usuario vuelve a abrir Calendar, el add-on debe recuperar el estado y reconstruir la sesion activa.

#### FR-04: Exportacion a Google Sheets

- La exportacion a Sheets es opcional y desactivada por defecto.
- Si el usuario la activa, el add-on debe anadir una fila por cada Stop con fecha, ID de evento, titulo, duracion y descripcion.
- Si no se ha configurado una hoja destino, el add-on debe pedir al usuario que la indique.

## 5. Diseno de Arquitectura

La arquitectura se mantiene nativa dentro de Google:

```text
[Google Calendar en el navegador]
          |
          v
[Apps Script / CardService]
          |
          |-- Calendar service
          |-- UserProperties
          '-- Sheets service (opcional)
```

### 5.1. Principios de diseno

- Sin backend propio.
- Sin llamadas HTTPS externas.
- Sin dependencia de estado en el navegador.
- Calculo de duracion basado en timestamps absolutos.

## 6. Diseno de UI/UX

- La UI debe seguir el estilo de Google Workspace.
- Los botones principales deben ser claros, con prioridad visual para iniciar y detener.
- La confirmacion de guardado debe mostrarse como notificacion no intrusiva.
- La experiencia debe ser estable cuando el usuario cambia de evento o refresca el panel.

## 7. Requisitos No Funcionales

### 7.1. Seguridad y Privacidad

- No usar servicios externos.
- No usar UrlFetchApp salvo que en el futuro exista una integracion de Google aprobada.
- Solicitar solo los scopes necesarios para la funcionalidad activada.

### 7.2. Scopes previstos

- Modo base: acceso a datos del evento actual de Calendar segun el contexto del add-on.
- Modo escritura en Calendar: scope de escritura para el evento actual de Calendar.
- Modo Sheets: scope de Sheets solo cuando el usuario active exportacion.

### 7.3. Limites y Escalabilidad

- El add-on debe respetar las cuotas y limites de Apps Script.
- El estado almacenado en propiedades debe ser pequeno.
- La logica debe tolerar suspension del navegador y reanudacion posterior.

## 8. Plan de Lanzamiento y Fases

### Fase 1: MVP

- Panel lateral contextual al abrir un evento.
- Boton de iniciar y boton de detener.
- Persistencia de sesion en UserProperties.
- Guardado de duracion en la descripcion del evento.
- Notificacion de exito al finalizar.

### Fase 2: Automatizacion horaria

- Opcion para extender o recortar la duracion del evento.
- Boton para pausar, reanudar y descartar la sesion activa.
- Manejo mejorado de eventos repetidos y conflictos.

### Fase 3: Analiticas locales

- Exportacion a Google Sheets.
- Resumenes por fecha, duracion y calendario.
- Preparacion de graficos simples dentro de la hoja de calculo.

## 9. Riesgos y Mitigacion

| Riesgo identificado | Severidad | Plan de mitigacion |
| :---- | :---- | :---- |
| Cambio de evento con temporizador activo. | Media | Mostrar claramente el evento registrado y estado persistente. |
| Suspension o cierre del navegador. | Alta | Calcular duracion con timestamps absolutos. |
| Evento eliminado o cambiado antes de detener. | Media | Validar al guardar y mostrar error recuperable sin perder estado. |
| Sheets sin hoja destino configurada. | Baja | Solicitar configuracion antes del primer export. |
| Exceso de permisos solicitados. | Alta | Mantener scopes minimos y separar Sheets como opcion. |

## 10. Criterios de Aceptacion

- El add-on abre el panel contextual al abrir un evento en Calendar.
- El usuario puede iniciar y detener una sesion sin servidores externos.
- La duracion queda persistida y visible tras recargar el panel.
- El resultado se escribe correctamente en la descripcion del evento en la Fase 1.
- La implementacion puede crecer a edicion de fin de evento y Sheets sin redisenar la arquitectura base.

## 11. Fuera de Alcance Inicial

- Cronometro visual con tick por segundo dentro de CardService.
- Soporte movil como objetivo principal.
- Concurrencia de multiples sesiones activas por usuario.
- Backend propio o base de datos externa.
- Integraciones con servicios de terceros.

## 12. Resumen Ejecutivo

ChronoCal es viable como add-on de Google Calendar si se respeta el modelo real de Apps Script: UI declarativa, estado persistente por usuario y actualizaciones por acciones. La propuesta de valor de privacidad sigue intacta, pero el MVP debe ser sobrio: panel contextual, start/stop, persistencia y escritura en Calendar.

## 13. Desarrollo Local

### 13.1. Arranque del proyecto

1. Entra al directorio del proyecto.
2. Activa direnv para cargar el shell de Nix.
3. Entra al entorno con nix develop --no-pure-eval si no usas direnv.
4. Inicia sesion en Apps Script con npx @google/clasp login.

Comandos habituales:

```bash
cd /home/ivan/Source/ChronoCal
direnv allow
npx @google/clasp login
```

### 13.2. Subir el proyecto a Apps Script

1. Crea o vincula un proyecto de Apps Script con clasp.
2. Sube los archivos con npx @google/clasp push.
3. Abre el editor remoto si necesitas revisar configuracion o despliegues.

```bash
npx @google/clasp create --type standalone --title "ChronoCal" --rootDir .
npx @google/clasp push
npx @google/clasp open
```

### 13.3. Como probarlo

1. Asegurate de que el proyecto este subido a Apps Script.
2. Abre Google Calendar en escritorio.
3. Abre un evento para ver el panel lateral de ChronoCal.
4. Pulsa Iniciar registro y luego Detener y guardar.
5. Verifica que la descripcion del evento reciba la linea de duracion real.

### 13.4. Que validar en cada cambio

- Que el panel lateral siga abriendo desde un evento contextual.
- Que el estado activo se recupere tras refrescar.
- Que Stop escriba la duracion en la descripcion sin duplicar entradas.
- Que el manifiesto siga usando solo los scopes activados por la funcionalidad.
