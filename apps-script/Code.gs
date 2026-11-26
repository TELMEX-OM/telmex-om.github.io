/**
 * Squad OM — API de Dudas, Notas y Grabaciones y Pendientes.
 * Se pega en Extensiones > Apps Script del Google Sheet y se publica como Web App
 * (Ejecutar como: Yo · Acceso: Cualquier usuario). Ver README.md.
 *
 * Seguridad: cualquier escritura requiere la clave del equipo, guardada en
 * Configuración del proyecto > Propiedades del script > TEAM_KEY. La lectura es pública.
 */
const SHEETS = {
  dudas: {
    name: 'Dudas',
    fields: ['id', 'tema', 'sprint', 'descripcion', 'comentarios', 'status', 'actualizado'],
    headers: ['ID', 'Tema', 'Sprint', 'Descripción', 'Comentarios', 'Status', 'Actualizado']
  },
  notas: {
    name: 'Notas y Grabaciones',
    fields: ['id', 'titulo', 'sprint', 'fecha', 'notas', 'url', 'actualizado'],
    headers: ['ID', 'Título', 'Sprint', 'Fecha', 'Notas', 'URL grabación', 'Actualizado']
  },
  pendientes: {
    name: 'Pendientes',
    fields: ['id', 'tarea', 'responsable', 'sprint', 'color', 'status', 'actualizado'],
    headers: ['ID', 'Pendiente', 'Responsable', 'Sprint', 'Color', 'Status', 'Actualizado']
  }
};

function doGet(e) {
  try {
    return json({ ok: true, items: readAll(e.parameter.type) });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    const key = PropertiesService.getScriptProperties().getProperty('TEAM_KEY');
    if (!key || body.key !== key) return json({ ok: false, error: 'Clave del equipo incorrecta' });

    const [sheet, cfg] = sheetFor(body.type);
    const now = new Date();

    if (body.action === 'add') {
      const item = body.item || {};
      sheet.appendRow(cfg.fields.map(f => {
        if (f === 'id') return Utilities.getUuid().slice(0, 8);
        if (f === 'actualizado') return now;
        if (f === 'status') return normalizeStatus(item.status);
        return clean(item[f]);
      }));
    } else if (body.action === 'update') {
      const row = rowOf(sheet, body.id);
      Object.entries(body.changes || {}).forEach(([field, value]) => {
        const col = cfg.fields.indexOf(field);
        if (col <= 0 || field === 'actualizado') return;
        sheet.getRange(row, col + 1).setValue(field === 'status' ? normalizeStatus(value) : clean(value));
      });
      sheet.getRange(row, cfg.fields.indexOf('actualizado') + 1).setValue(now);
    } else if (body.action === 'delete') {
      sheet.deleteRow(rowOf(sheet, body.id));
    } else {
      throw new Error('Acción inválida');
    }

    return json({ ok: true, items: readAll(body.type) });
  } catch (err) {
    return json({ ok: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function sheetFor(type) {
  const cfg = SHEETS[type];
  if (!cfg) throw new Error('Tipo inválido');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(cfg.name);
  if (!sheet) {
    sheet = ss.insertSheet(cfg.name);
    sheet.appendRow(cfg.headers);
    sheet.setFrozenRows(1);
  }
  return [sheet, cfg];
}

function rowOf(sheet, id) {
  const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getDisplayValues().map(r => r[0]);
  const index = ids.indexOf(String(id));
  if (index < 0) throw new Error('Registro no encontrado');
  return index + 2;
}

function readAll(type) {
  const [sheet, cfg] = sheetFor(type);
  return sheet.getDataRange().getDisplayValues().slice(1)
    .filter(r => r[0])
    .map(r => Object.fromEntries(cfg.fields.map((f, i) => [f, r[i]])));
}

function normalizeStatus(value) {
  return value === 'Cerrado' ? 'Cerrado' : 'Abierto';
}

// Evita que un texto se interprete como fórmula en el Sheet
function clean(value) {
  const text = String(value == null ? '' : value).slice(0, 5000);
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
