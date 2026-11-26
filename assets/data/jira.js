// Foto del sprint activo del tablero "Equipo OM" (Jira TAC, board 312).
// Actualizar a mano: lista de historias (sin sub-tareas) del sprint. Los conteos por columna se calculan solos.
// JQL: project = TAC AND sprint = <id del sprint> AND issuetype != Sub-task ORDER BY rank
window.JIRA_SPRINT = {
  name: 'OM Sprint 2',
  start: '2026-11-24',
  end: '2026-12-12',
  updated: '2026-11-25',
  site: 'https://tmxrncomosi1.atlassian.net',
  boardUrl: 'https://tmxrncomosi1.atlassian.net/jira/software/projects/TAC/boards/312?filter=&groupBy=subtask',
  // Columnas del tablero que se muestran, con el estado de Jira que agrupan
  columns: [
    { name: 'Lista para desarrollo', status: 'LISTA PARA DESARROLLO' },
    { name: 'En desarrollo', status: 'EN DESARROLLO' },
    { name: 'Revisión PR', status: 'REVISIÓN PR' },
    { name: 'En despliegue', status: 'EN DESPLIEGUE' },
    { name: 'Lista para QA', status: 'LISTA PARA QA' },
    { name: 'En pruebas', status: 'EN PRUEBAS' },
    { name: 'Demo', status: 'DEMO' }
  ],
  stories: [
    { key: 'TAC-505', summary: 'OM-TMX Envío del ticket de servicio Cloud en la orden de aprovisionamiento (TMF641 Custom)', status: 'LISTA PARA DESARROLLO', assignee: 'adiegodecastrocosta', points: 1 },
    { key: 'TAC-5782', summary: 'OM TMX- Envío de acompañamiento para el registro y Bienvenida de Internet recuperado', status: 'LISTA PARA DESARROLLO', assignee: 'josecarlos.padilla', points: 3 },
    { key: 'TAC-7064', summary: 'OM-TMX Alta de Internet Recuperado SOM', status: 'LISTA PARA DESARROLLO', assignee: 'Gonzalo Lozano', points: 1 },
    { key: 'TAC-9245', summary: 'OM-TMX Orquestación OTT Negocios: mismo flujo que Residencial, eliminar NOT10 y avanzar a Facturación tras NOT08', status: 'EN DESARROLLO', assignee: 'Gonzalo Lozano', points: 1 },
    { key: 'TAC-9555', summary: 'OM-TMX - Mapeo, Configuración del Catálogo Técnico y Descomposición de la Orden para Infinitum Negocio (Solo Datos)', status: 'EN DESARROLLO', assignee: 'josecarlos.padilla', points: 1 },
    { key: 'TAC-9556', summary: 'OM-TMX - Generar Plan de Orquestación para Infinitum Negocio (Solo Datos)', status: 'LISTA PARA DESARROLLO', assignee: 'josecarlos.padilla', points: 1 },
    { key: 'TAC-9730', summary: 'OM-TMX Envío de acompañamiento para Altas nuevas y Portabilidad de un cliente negocio', status: 'LISTA PARA DESARROLLO', assignee: 'Gonzalo Lozano', points: null },
    { key: 'TAC-9935', summary: 'OM-B1 · Credenciales y autenticación gestionada por la plataforma', status: 'EN DESARROLLO', assignee: 'adiegodecastrocosta', points: 1 },
    { key: 'TAC-10969', summary: 'OM-TMX Crear estado custom de Asset para OTTs y actualizar assetización de Entretenimiento Negocios', status: 'LISTA PARA DESARROLLO', assignee: 'adiegodecastrocosta', points: 1 },
    { key: 'TAC-10970', summary: 'OM-TMX Almacenar Cuenta Maestra, Cuenta Maestra Padre y Clave de Giro en la Suscripción', status: 'LISTA PARA DESARROLLO', assignee: 'adiegodecastrocosta', points: 1 },
    { key: 'TAC-10971', summary: 'OM-TMX Envío de Cuenta Maestra y Giro Comercial en la orden de aprovisionamiento TMF641', status: 'LISTA PARA DESARROLLO', assignee: 'adiegodecastrocosta', points: 1 },
    { key: 'TAC-10972', summary: 'OM-TMX Envío de Cuenta Maestra para la facturación de Productos TMF666', status: 'LISTA PARA DESARROLLO', assignee: 'adiegodecastrocosta', points: 1 }
  ]
};

// Sprint cerrado: historias entregadas de OM Sprint 1 (sprint 829). JQL: sprint = 829 AND issuetype != Sub-task ORDER BY rank
window.JIRA_SPRINT_1 = {
  name: 'OM Sprint 1',
  start: '2026-11-02',
  end: '2026-11-21',
  completed: '2026-11-23',
  stories: [
    { key: 'TAC-9569', summary: '[OM] Actualizar Orchestration Plan de altas nuevas: agregar Automatic Task para crear Suscripción y Billing Group en la assetización', status: 'FINALIZADO', assignee: 'Carolina Muñoz Fonseca', points: 1 },
    { key: 'TAC-274', summary: 'OM TMX- Recibir y guardar la fecha de instalación de servicios', status: 'FINALIZADO', assignee: 'adriana.gonzalez', points: 5 },
    { key: 'TAC-9353', summary: 'OM-TMX - Mapeo, Configuracion del Catalogo Tecnico y Descomposicion de la Orden para Paquetes Negocio Voz y Datos', status: 'FINALIZADO', assignee: 'adriana.gonzalez', points: 1 },
    { key: 'TAC-295', summary: 'OM -TMX-Guardar en el asset las fechas de los productos aprovisionados', status: 'FINALIZADO', assignee: 'adriana.gonzalez', points: 1 },
    { key: 'TAC-9354', summary: 'OM-TMX - Generar Plan de Orquestacion para Paquetes Negocio Voz y Datos', status: 'FINALIZADO', assignee: 'adriana.gonzalez', points: 1 },
    { key: 'TAC-9369', summary: '[OM] Ajuste del mapeo de datos de contacto y cuenta enviados en TMF641 por nuevo modelo de identidad', status: 'FINALIZADO', assignee: 'adriana.gonzalez', points: 1 },
    { key: 'TAC-9370', summary: '[OM] Ajuste del mapeo de datos de contacto y cuenta enviados en TMF666 por nuevo modelo de identidad', status: 'FINALIZADO', assignee: 'adriana.gonzalez', points: 1 },
    { key: 'TAC-9371', summary: '[OM] Alta de Persona Moral y Cambio de Segmento en el Envío a Aprovisionamiento (TMF641)', status: 'FINALIZADO', assignee: 'adriana.gonzalez', points: 1 },
    { key: 'TAC-9416', summary: '[OM] Homologación de IDs hacia PISA: enviar identificadores SF y funcionales de las entidades clave del modelo vía TMF666 PATCH', status: 'FINALIZADO', assignee: 'Gonzalo Lozano', points: 1 },
    { key: 'TAC-9372', summary: '[OM] Alta de Persona Moral y Cambio de Segmento en el Envío a Facturación (TMF666)', status: 'FINALIZADO', assignee: 'Eduardo Rafael Ramirez Briones', points: 1 },
    { key: 'TAC-9373', summary: '[OM] Alta de Persona Moral y Cambio de Segmento en el Envío de Notificaciones de Acompañamiento (TMF681)', status: 'FINALIZADO', assignee: 'adriana.gonzalez', points: 1 },
    { key: 'TAC-9415', summary: '[OM] Auto-crear Suscripción y Billing Group al assetizar una orden nueva', status: 'FINALIZADO', assignee: 'Carolina Muñoz Fonseca', points: 1 },
    { key: 'TAC-10339', summary: 'OM-B5 · Código productivo sin simulaciones ni datos de prueba', status: 'FINALIZADO', assignee: 'Julia Peñafiel', points: 2 },
    { key: 'TAC-10801', summary: 'OM-B6 · Arquitectura de código: trigger único, capas, lote y sharing', status: 'FINALIZADO', assignee: 'Gonzalo Lozano', points: 2 }
  ]
};
