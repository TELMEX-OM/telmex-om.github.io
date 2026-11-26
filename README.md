# Squad OM

Sitio: https://telmex-om.github.io/

## Estructura

```
index.html                      # Portal principal
assets/css/styles.css           # Estilos del portal
assets/data/jira.js             # Foto del sprint activo (tablero Jira TAC 312)
docs/mappings/*.html            # Mappings TMF editables (enlazados desde Documentación)
docs/sprints/*.html             # Story maps de sprints cerrados (Sprint 1)
docs/refinamientos/*.html       # Refinamientos para el Sprint 3
```

## Agregar documentación

- **Enlace externo** (Drive, Lucid, NotebookLM…): copia un bloque `link-card` en "Enlaces del proyecto" de `index.html`.
- **Mapping TMF**: copia el HTML a `docs/mappings/`, agrégale la barra `squad-bar` del encabezado
  (ver cualquier mapping existente) y copia un bloque `link-card` en "Mappings de APIs TMF".
- **Refinamiento (Sprint 3)**: reemplaza el HTML correspondiente en `docs/refinamientos/`
  conservando el header con `squad-bar` (botón "Volver a Sprint 3").
- Commit y push a `main`.

## Actualizar el tablero del sprint

Edita `assets/data/jira.js`: nombre y fechas del sprint, fecha de `updated` y la lista `stories`
(clave, resumen, estado, responsable y story points de cada historia, sin sub-tareas). Los conteos
por columna y el filtro por responsable se calculan solos. JQL de referencia:

```
project = TAC AND sprint = <id del sprint> AND issuetype != Sub-task ORDER BY rank
```
(sprint activo del tablero 312, "Equipo OM"; OM Sprint 2 = 833)

`JIRA_SPRINT_1` en el mismo archivo guarda las HDUs entregadas de OM Sprint 1 (sprint 829, cerrado).

## Dudas, Notas y Grabaciones (Google Sheet)

Las secciones **Dudas** (tabla con status Abierto/Cerrado) y **Notas y Grabaciones** (minutas de reuniones con enlace a la grabación) leen y escriben en un Google Sheet a través de una Web App de Apps Script (`apps-script/Code.gs`). Cualquiera con el portal puede leer; para guardar cambios se pide la **clave del equipo**, que se recuerda en el navegador. El portal se resincroniza cada 30 segundos.

1. Crea un Google Sheet nuevo (ej. "Squad OM - Notas").
2. **Extensiones > Apps Script**, borra el contenido y pega `apps-script/Code.gs`. Guarda.
3. **Configuración del proyecto > Propiedades de la secuencia de comandos**: agrega `TEAM_KEY` con la clave que compartirás con el equipo.
4. **Implementar > Nueva implementación > Aplicación web**: Ejecutar como **Yo**, Acceso **Cualquier usuario**. Autoriza los permisos.
5. Copia la URL que termina en `/exec` y pégala en `assets/data/notas-config.js`:
   ```js
   window.NOTES_API_URL = 'https://script.google.com/macros/s/XXXX/exec';
   ```
6. Las hojas `Dudas` y `Notas y Grabaciones` se crean solas en la primera escritura. También se pueden editar directo en el Sheet.

Si cambias `Code.gs`, publica con **Implementar > Gestionar implementaciones > Editar > Nueva versión** para conservar la misma URL.

## Flujo OM/Salesforce

Guía paso a paso (sección **Flujo OM/Salesforce** de `index.html`) recreada del PDF "Flujo para llegar a OM - Paso a paso". Las figuras están en `assets/img/flujo/fig-NN.jpg`. Los bloques de URL y Request Body están en cajas `.code-box`; el botón **Copiar** copia el contenido exacto con comillas rectas. Para un valor suelto usa `<button class="copy-btn inline" data-copy="VALOR">Copiar</button>`.
