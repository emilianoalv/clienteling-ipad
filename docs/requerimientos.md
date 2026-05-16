# Requerimientos — L'Oréal App Clienteling

> Fuente: `docss/REQUERIMIENTOS (1).pdf` (14 páginas, RFP L'Oréal México).
> Esta versión es una transcripción estructurada en Markdown con correcciones puntuales a errores de numeración / referencias cruzadas del PDF original. Cada corrección está marcada con `⚠️ Nota`.

## Índice

- [1. Requerimientos Funcionales (RF)](#1-requerimientos-funcionales-rf)
  - [1.1 Perfil del consumidor y captura de datos](#11-perfil-del-consumidor-y-captura-de-datos)
  - [1.2 Recomendación y catálogo](#12-recomendación-y-catálogo)
  - [1.3 Compras y POS](#13-compras-y-pos)
  - [1.4 Citas y agenda](#14-citas-y-agenda)
  - [1.5 Comunicación y seguimiento](#15-comunicación-y-seguimiento)
  - [1.6 Reportes y dashboards](#16-reportes-y-dashboards)
  - [1.7 Roles, permisos y autenticación](#17-roles-permisos-y-autenticación)
  - [1.8 Atributos avanzados e integraciones de consultoría](#18-atributos-avanzados-e-integraciones-de-consultoría)
- [2. Requerimientos No Funcionales (RNF)](#2-requerimientos-no-funcionales-rnf)
- [3. Requerimientos de Implementación (RI)](#3-requerimientos-de-implementación-ri)
- [4. Restricciones del proyecto](#4-restricciones-del-proyecto)
- [5. Supuestos del proyecto](#5-supuestos-del-proyecto)
- [6. Criterios de aceptación (CA)](#6-criterios-de-aceptación-ca)
- [Apéndice — Notas sobre el documento fuente](#apéndice--notas-sobre-el-documento-fuente)

---

## 1. Requerimientos Funcionales (RF)

### 1.1 Perfil del consumidor y captura de datos

| ID | Requerimiento |
|---|---|
| **RF-01** | Registro de consumidor con datos básicos: nombre(s), apellido(s), género (incluyendo opción "prefiero no decir"), fecha de nacimiento, rango de edad, teléfono celular y correo electrónico. |
| **RF-02** | Captura y almacenamiento del aviso de privacidad con fecha, versión y aceptación explícita del consumidor (cumplimiento LFPDPPP México). |
| **RF-03** | Búsqueda de consumidor existente por correo electrónico, número de celular o nombre. |
| **RF-04** | Vista unificada del perfil del consumidor: historial de compras, historial de recomendaciones, citas previas e intereses capturados. |
| **RF-05** | Captura de intereses de belleza: categorías (Fragancia, Skincare, Makeup), rutina (día/noche/ambos), preocupaciones de piel, preferencias de maquillaje y fragancia. |
| **RF-06** | Registro de motivo de visita del consumidor (nueva compra, recompra, regalo, preocupación, promoción, conocer productos). |
| **RF-07** | Historial de tipo de piel, tono, subtono e ingredientes preferidos / no preferidos. |
| **RF-08** | Registro de muestras entregadas al consumidor y seguimiento de conversión a compra. |
| **RF-09** | Alertas automáticas de eventos de vida: cumpleaños, aniversario como cliente, período de reposición estimado de producto. |
| **RF-10** | Capacidad de enriquecer el perfil con datos de comportamiento digital (si existe integración con e-commerce de la marca). |
| **RF-11** | Segmentación automática del consumidor (VIP, recurrente, nuevo, en riesgo de abandono). |
| **RF-12** | Soporte multilingüe en la interfaz (español como idioma primario en México). |

### 1.2 Recomendación y catálogo

| ID | Requerimiento |
|---|---|
| **RF-13** | Registro manual de productos recomendados con fecha, SKU, marca, nombre del producto y notas adicionales. |
| **RF-14** | Escaneo de SKU mediante cámara del dispositivo (código de barras / QR) para agilizar el registro. |
| **RF-15** | Motor de recomendación inteligente basado en perfil del consumidor (intereses, historial de compras, tipo de piel). |
| **RF-16** | El motor de recomendación debe soportar lógica de reposición: estimar cuándo el consumidor estará agotando un producto comprado previamente. |
| **RF-17** | Acceso a catálogo de productos en tiempo real con descripción, precio, disponibilidad en tienda y atributos clave. |
| **RF-18** | Generación de lookbooks o rutinas personalizadas compatibles con el consumidor (digital). |
| **RF-19** | Registro de historial completo de recomendaciones por consumidor, consultable por el BA. |

### 1.3 Compras y POS

| ID | Requerimiento |
|---|---|
| **RF-20** | Registro de compras realizadas: fecha, SKU, nombre del producto, marca, precio de compra y cantidad. |
| **RF-21** | Consulta del historial transaccional completo del consumidor. |
| **RF-22** | Integración bidireccional con el sistema de punto de venta (POS) para captura automática de transacciones. |
| **RF-23** | Capacidad de registrar compras manuales cuando no existe integración automática con POS. |
| **RF-24** | Escaneo de SKU para registro de compras mediante cámara del dispositivo. |
| **RF-25** | Atribución de venta al BA que realizó la consulta / recomendación. |

### 1.4 Citas y agenda

| ID | Requerimiento |
|---|---|
| **RF-26** | Creación de citas con consumidores: tipo de evento, fecha, hora, comentarios y BA asignado. |
| **RF-27** | Vista de calendario por BA y por tienda (semanal y mensual). |
| **RF-28** | Reporte de agenda con columnas: nombre, apellido, teléfono, fecha, tipo de evento y comentario. |
| **RF-29** | Tipos de evento configurables: Servicio de Cabina, Facial, Evento Aniversario, Cabina VIP, Seguimiento de productos, entre otros. |
| **RF-30** | Sistema de recordatorios automáticos al BA previo a la cita. |
| **RF-31** | Envío de confirmación / recordatorio de cita al consumidor vía SMS o WhatsApp. |
| **RF-32** | Control de citas reagendadas y citas canceladas para métricas de gestión. |
| **RF-33** | Posibilidad de programar citas virtuales / videoconsultas con el consumidor. |

### 1.5 Comunicación y seguimiento

| ID | Requerimiento |
|---|---|
| **RF-34** | Módulo de seguimiento post-visita: el BA puede registrar acciones realizadas y resultado de la interacción. |
| **RF-35** | Comunicación con el consumidor integrada en la plataforma vía WhatsApp Business API (sin usar teléfonos personales del BA). |
| **RF-36** | Plantillas de mensajes personalizables por marca y tipo de comunicación (seguimiento, cumpleaños, promoción, reposición). |
| **RF-37** | Registro de todas las comunicaciones enviadas al consumidor en su perfil (trazabilidad completa). |
| **RF-38** | Clasificación del tipo de seguimiento: 3 meses, 6 meses, cumpleaños, reposición, evento especial. |
| **RF-39** | Atribución de ventas online generadas como resultado de la comunicación de un BA (link tracking). |

### 1.6 Reportes y dashboards

| ID | Requerimiento |
|---|---|
| **RF-40** | Dashboard ejecutivo de tienda con KPIs: objetivo de venta, avance ($), % avance, total sell-out, total transacciones, registros nuevos, seguimientos. |
| **RF-41** | Métricas de citas: objetivo semanal, total citas, nuevas citas, citas reagendadas. |
| **RF-42** | Reportes filtrables por rango de fechas, tienda, franquicia / marca, BA. |
| **RF-43** | Reporte de clientes (listado exportable) con columnas: nombre, apellido, teléfono, fecha de nacimiento, último BA, cliente desde, fecha último contacto, fecha última transacción, tipo de seguimiento. |
| **RF-44** | Visualización gráfica del desempeño: Top Franquicias / Marcas y ventas por Categoría. |
| **RF-45** | Reporte de desempeño por BA: transacciones, registros, seguimientos, recomendaciones. |
| **RF-46** | Reporte de agenda (Agenda Report) exportable. |
| **RF-47** | Indicadores de tasa de conversión: recomendación → compra, seguimiento → revisita. |
| **RF-48** | Dashboard de retención: clientes activos vs. en riesgo de abandono. |
| **RF-49** | Exportación de reportes en formato Excel / CSV. |
| **RF-50** | Acceso a reportes en tiempo real desde dispositivos móviles y escritorio. |

### 1.7 Roles, permisos y autenticación

| ID | Requerimiento |
|---|---|
| **RF-51** | Roles diferenciados con permisos específicos: BA, Gerente de Tienda, Supervisor de Zona, Administrador Central. |
| **RF-52** | El BA solo puede ver y gestionar los clientes y datos de su tienda/franquicia asignada. |
| **RF-53** | El Gerente tiene acceso a los reportes de todos los BAs de su tienda. |
| **RF-54** | El Supervisor de Zona puede visualizar resultados de múltiples tiendas bajo su responsabilidad. |
| **RF-55** | El Administrador Central puede gestionar configuraciones, marcas, tiendas y usuarios a nivel nacional. |
| **RF-56** | Autenticación segura por usuario (login individual por BA, no compartido). |

> ⚠️ **Nota:** El PDF original brinca de **RF-56** directamente a **RF-58**. **No existe RF-57** en el documento fuente — probablemente fue eliminado y la numeración no se reajustó. Se mantiene la numeración del PDF para no romper referencias externas.

### 1.8 Atributos avanzados e integraciones de consultoría

| ID | Requerimiento |
|---|---|
| **RF-58** | Captura de atributos de piel en el perfil del consumidor: tipo de piel, preocupaciones específicas, tono y subtono. |
| **RF-59** | Capacidad de asociar al perfil del consumidor su shade / tono exacto por categoría (fondo de maquillaje, corrector, labiales). |
| **RF-60** | Registro de historial de muestras entregadas y seguimiento de conversión. |
| **RF-61** | Acceso desde la plataforma a fichas técnicas de producto, tutoriales y argumentarios de venta para apoyo al BA durante la consulta. |
| **RF-62** | Integración con herramientas de Virtual Try-On (prueba virtual de maquillaje en tiempo real). |

---

## 2. Requerimientos No Funcionales (RNF)

| ID | Requerimiento |
|---|---|
| **RNF-01** | Disponibilidad mínima del sistema: 99.5% SLA mensual. |
| **RNF-02** | Tiempo de respuesta de la aplicación en operaciones comunes (búsqueda, carga de perfil): ≤ 2 segundos. |
| **RNF-03** | Capacidad de soportar carga simultánea de todos los BAs activos a nivel nacional sin degradación del servicio. |
| **RNF-04** | Cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de Particulares (LFPDPPP) de México. |
| **RNF-05** | Funcionalidad de "derecho al olvido": eliminación completa de datos personales de un consumidor a solicitud. |
| **RNF-06** | Los datos personales de consumidores mexicanos deben residir en servidores ubicados en México o en jurisdicciones aprobadas por L'Oréal. |
| **RNF-07** | Gestión de consentimientos de marketing diferenciada por canal (SMS, email, WhatsApp). |
| **RNF-08** | Compatibilidad con iPad (iOS 15 o superior) como dispositivo principal. |
| **RNF-09** | Compatibilidad con Android (versión 12 o superior) como dispositivo alternativo. |
| **RNF-10** | Integración con plataformas de e-commerce de marcas L'Oréal México para enriquecer perfil omnicanal. |
| **RNF-11** | Integración con WhatsApp Business API (Meta) para comunicación oficial con consumidores. |
| **RNF-12** | Capacidad de integración con herramientas de diagnóstico de piel físico/digital. |
| **RNF-13** | La plataforma debe ser multi-marca: soportar la operación de distintas marcas del portafolio L'Oréal con interfaces y configuraciones independientes por marca. |
| **RNF-14** | La plataforma debe ser multi-tienda: gestionar cientos de puntos de venta con configuraciones independientes. |
| **RNF-15** | Arquitectura escalable que soporte el crecimiento del número de usuarios, tiendas y volumen de datos sin rediseño. |
| **RNF-16** | Proceso de configuración de nuevas tiendas / marcas gestionable por el equipo L'Oréal sin dependencia total del proveedor. |

---

## 3. Requerimientos de Implementación (RI)

| ID | Requerimiento |
|---|---|
| **RI-01** | Plan de migración de datos desde el sistema actual (Beauty Connect) con mapeo de campos y validación. |
| **RI-02** | Programa de capacitación para BAs, Gerentes, Supervisores y Administradores. |
| **RI-03** | Materiales de entrenamiento en español, adaptados a perfiles con distintos niveles de alfabetización digital. |
| **RI-04** | Soporte técnico en español, disponible de lunes a domingo en horario comercial (mínimo 11:00–21:00 CST). |
| **RI-05** | Canal de soporte de urgencia (P1) con tiempo de respuesta ≤ 2 horas en días hábiles. |
| **RI-06** | Entorno de pruebas (sandbox / staging) para validación previa a cada release. |
| **RI-07** | Actualizaciones de la plataforma sin interrupción del servicio productivo (zero-downtime deployments). |
| **RI-08** | SLA de corrección de bugs críticos: ≤ 24 horas; bugs mayores: ≤ 5 días hábiles. |
| **RI-09** | Documentación técnica y manual de usuario actualizados con cada nueva versión. |
| **RI-10** | Propuesta de plan de implementación por fases (piloto → rollout nacional) con hitos y entregables claros. |

---

## 4. Restricciones del proyecto

| Tipo | Restricción | Descripción |
|---|---|---|
| **Tecnológica** | Plataforma Low-Code / No-Code | La solución debe construirse únicamente con tecnologías Low-Code o No-Code. No se contemplan desarrollos de software a medida en esta fase. |
| **Tecnológica** | Dispositivo estándar: iPad | El uso principal de la app del BA se dará en iPad. La solución debe estar optimizada para este dispositivo. |
| **Tecnológica** | Conectividad variable | Las tiendas pueden tener conectividad limitada; la solución debe operar de forma híbrida online/offline. |
| **Regulatoria** | LFPDPPP México | Toda la solución debe cumplir con la Ley Federal de Protección de Datos Personales en Posesión de Particulares, incluyendo consentimiento, derecho al olvido y residencia de datos. |
| **Regulatoria** | Residencia de datos | Los datos personales de consumidores mexicanos deben alojarse en servidores en México o en jurisdicciones aprobadas por L'Oréal. |
| **Organizacional** | Alcance geográfico y de marcas | El proyecto aplica únicamente a las marcas Lancôme y YSL, en tiendas de Liverpool y Palacio de Hierro a nivel nacional. |
| **Organizacional** | Resistencia al cambio | Los Beauty Advisors están habituados a procesos manuales. La adopción de la herramienta depende de un plan sólido de change management y capacitación. |
| **Organizacional** | Idioma | Toda la interfaz, materiales de entrenamiento y soporte técnico deben estar en español. |
| **Presupuestaria** | TCO competitivo | La propuesta debe demostrar viabilidad financiera. El costo total de propiedad a 3 años es uno de los criterios de evaluación formal del RFP. |
| **Temporal** | Piloto previo a rollout nacional | Antes del despliegue nacional, se debe ejecutar un piloto en una o dos tiendas para validar la solución en condiciones reales. |

---

## 5. Supuestos del proyecto

| ID | Supuesto |
|---|---|
| **S-01** | Los Beauty Advisors cuentan con un iPad asignado como dispositivo de trabajo en el punto de venta. |
| **S-02** | L'Oréal México proporcionará acceso al CIO y al equipo técnico para clarificar requerimientos, revisar integraciones y validar la solución. |
| **S-03** | Existe disposición institucional de L'Oréal para migrar del sistema actual (Beauty Connect México) a una nueva plataforma. |
| **S-04** | Los datos actuales registrados en libretas o medios manuales se consideran no migrables en su totalidad; se partirá de cero en el sistema nuevo, salvo datos históricos de POS disponibles en formato estructurado. |
| **S-05** | L'Oréal cuenta con acceso a los sistemas POS de Liverpool y Palacio de Hierro, o bien puede negociar integraciones con dichas cadenas. |
| **S-06** | El uso de WhatsApp Business API para comunicación con consumidores es viable desde el punto de vista legal y operativo para L'Oréal México. |
| **S-07** | El presupuesto del proyecto permite adquirir licencias de plataformas Low-Code/No-Code (Airtable, AppSheet, Make, etc.) en sus planes adecuados para uso empresarial. |
| **S-08** | El equipo de proyecto tendrá disponibilidad para ejecutar un piloto en al menos una tienda antes del rollout nacional. |
| **S-09** | El cambio de sistema contará con respaldo de la dirección comercial, lo cual facilitará la adopción por parte de los BAs y gerentes. |

---

## 6. Criterios de aceptación (CA)

| ID | Criterio | Condición de cumplimiento | Peso RFP |
|---|---|---|---|
| **CA-01** | Cobertura funcional | La solución cubre el 100% de los requerimientos funcionales marcados como Obligatorios (RF-01 al RF-33), verificables en demo funcional. | 30% |
| **CA-02** | Cumplimiento regulatorio | La plataforma demuestra cumplimiento con la LFPDPPP: aviso de privacidad, consentimiento, derecho al olvido y logs de auditoría operativos. | — |
| **CA-03** | Seguridad técnica | Se verifica encriptación SSL/TLS en tránsito y en reposo, autenticación MFA para administradores, y control de acceso por roles. | 15% |
| **CA-04** | Capacidades de IA y personalización | El motor de recomendación (**RF-15**) produce sugerencias relevantes basadas en perfil del consumidor. La segmentación automática (**RF-11**) clasifica correctamente a los clientes. | 15% |
| **CA-05** | Experiencia del usuario (BA) | La app del BA permite registrar un nuevo consumidor completo en menos de 3 minutos. La interfaz es intuitiva y no requiere capacitación técnica avanzada. | — |
| **CA-06** | Performance y disponibilidad | Tiempos de respuesta iguales o menores a 2 segundos en operaciones comunes. Uptime demostrable de 99.5% en entorno de pruebas. | — |
| **CA-07** | Dashboards y reportes | El dashboard ejecutivo (**RF-40 a RF-48**) muestra KPIs en tiempo real. Los reportes son exportables en Excel/CSV y filtrables por tienda, marca y BA. | — |
| **CA-08** | Plan de implementación | Se presenta un plan de implementación por fases (piloto en 1-2 tiendas seguido de rollout nacional) con hitos, responsables y criterios de éxito definidos. | 10% |
| **CA-09** | Propuesta económica (TCO 3 años) | El análisis financiero incluye costos de implementación, licencias, capacitación y soporte. El ROI proyectado es positivo dentro del primer año de operación. | 10% |
| **CA-10** | Escalabilidad y multi-marca | La plataforma puede agregar nuevas marcas o tiendas sin rediseño arquitectural. Se demuestra la independencia de configuración entre YSL y Lancôme. | — |

> Pesos del RFP suman **80%**. El 20% restante no se asigna explícitamente en el documento fuente.

---

## Apéndice — Notas sobre el documento fuente

Durante la transcripción del PDF se detectaron las siguientes inconsistencias menores en el documento original. Esta versión las corrige inline (con aviso) para evitar referencias rotas.

### N-1 — Falta RF-57

El PDF brinca de RF-56 a RF-58. No hay un RF-57 definido. **Acción:** se respeta la numeración del PDF (no se renumera) y se anota la ausencia en la sección 1.7.

### N-2 — Referencias cruzadas incorrectas en CA-04

El PDF original decía:
- "El motor de recomendación **(RF-11)**" → RF-11 es *segmentación*, no recomendación.
- "La segmentación automática **(RF-08)**" → RF-08 es *muestras*, no segmentación.

**Corrección aplicada:** se reemplazó por **RF-15** (motor de recomendación) y **RF-11** (segmentación) respectivamente.

### N-3 — Rango incorrecto en CA-07

El PDF original decía "El dashboard ejecutivo **(RF-29 a RF-33)**" — pero ese rango corresponde a *tipos de evento de citas*. El dashboard ejecutivo y sus métricas viven en **RF-40 a RF-48**.

**Corrección aplicada:** se reemplazó el rango por **RF-40 a RF-48**.

---

_Última actualización: 2026-05-15 — transcripción inicial._
