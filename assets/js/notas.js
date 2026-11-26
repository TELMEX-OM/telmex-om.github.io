// Dudas, Notas/Grabaciones y Pendientes: leen y escriben en el Google Sheet vía la Web App de Apps Script.
(() => {
  const API = window.NOTES_API_URL;
  if (!API) {
    document.querySelectorAll('.notes-stats').forEach(el => el.hidden = true);
    return;
  }

  const KEY_STORAGE = 'squad-om-team-key';
  const REFRESH_MS = 30000;
  const SPRINTS = ['General', 'Sprint 1', 'Sprint 2', 'Sprint 3', 'Sprint 4', 'Sprint 5'];

  const $ = id => document.getElementById(id);
  const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const isUrl = u => /^https?:\/\//i.test(u);
  const norm = t => String(t ?? '').replace(/\s+/g, ' ').trim();
  const initials = name => norm(name).split(/[\s._-]+/).filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  const COLORS = ['amarillo', 'rosa', 'azul', 'verde'];
  const FORMS = { dudas: 'duda-form', notas: 'nota-form', pendientes: 'pendiente-form' };
  const ADD_LABELS = { dudas: 'Agregar duda', notas: 'Agregar', pendientes: 'Agregar pendiente' };

  const state = {
    dudas: { items: [], filters: { tema: '', sprint: '', descripcion: '', comentarios: '', status: 'Abierto' }, editing: null },
    notas: { items: [], sprint: 'all', editing: null },
    pendientes: { items: [], responsable: '', status: 'Abierto', editing: null }
  };

  async function load(type) {
    const res = await fetch(`${API}?type=${type}`);
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    state[type].items = data.items;
  }

  async function send(type, form, payload) {
    const key = form.querySelector('.team-key').value.trim();
    if (!key) throw new Error('Escribe la clave del equipo para guardar cambios.');
    // text/plain evita el preflight de CORS que Apps Script no soporta
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ ...payload, type, key }) });
    const data = await res.json();
    if (!data.ok) throw new Error(data.error);
    localStorage.setItem(KEY_STORAGE, key);
    document.querySelectorAll('.team-key').forEach(i => i.value = key);
    state[type].items = data.items;
  }

  function flash(form, message, isError) {
    const el = form.querySelector('.notes-message');
    el.textContent = message;
    el.className = `notes-message${isError ? ' error' : ''}`;
    clearTimeout(el.timer);
    el.timer = setTimeout(() => el.textContent = '', 4000);
  }

  function markChips(containerId, value) {
    $(containerId).querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.value === value));
  }

  function chips(containerId, values, type, key) {
    $(containerId).innerHTML = values.map(([value, label]) => `<button class="chip" data-value="${esc(value)}">${esc(label)}</button>`).join('');
    $(containerId).querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => { state[type][key] = c.dataset.value; render[type](); }));
  }

  const render = {
    dudas() {
      const s = state.dudas;
      const open = s.items.filter(d => d.status !== 'Cerrado').length;
      $('dudas-open').textContent = open;
      $('dudas-closed').textContent = s.items.length - open;

      const f = s.filters;
      const matches = (text, query) => norm(text).toLowerCase().includes(query.toLowerCase());
      const rows = s.items
        .filter(d => !f.tema || norm(d.tema) === f.tema)
        .filter(d => !f.sprint || d.sprint === f.sprint)
        .filter(d => !f.status || (d.status || 'Abierto') === f.status)
        .filter(d => matches(d.descripcion, f.descripcion) && matches(d.comentarios, f.comentarios));

      // Opciones tipo Excel: valores únicos de cada columna con su conteo
      const options = (field, values) => {
        const select = $('dudas-filters').querySelector(`[data-filter="${field}"]`);
        select.innerHTML = [['', 'Todos'], ...values.map(v => [v, `${v} (${s.items.filter(d => (field === 'tema' ? norm(d.tema) : d[field] || 'Abierto') === v).length})`])]
          .map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('');
        select.value = values.includes(f[field]) ? f[field] : '';
      };
      options('tema', [...new Set(s.items.map(d => norm(d.tema)))].sort());
      options('sprint', [...new Set(s.items.map(d => d.sprint))].sort());
      options('status', ['Abierto', 'Cerrado']);
      const active = Object.values(f).some(Boolean);
      $('dudas-shown').textContent = `${rows.length} de ${s.items.length}`;
      $('dudas-clear').hidden = !active;

      $('dudas-body').innerHTML = rows.length ? rows.map(d => {
        const closed = d.status === 'Cerrado';
        return `
          <tr>
            <td class="pre"><strong>${esc(d.tema)}</strong></td>
            <td><span class="status">${esc(d.sprint)}</span></td>
            <td class="pre">${esc(d.descripcion)}</td>
            <td class="pre">${esc(d.comentarios)}</td>
            <td>
              <button class="toggle ${closed ? 'closed' : 'open'}" data-id="${esc(d.id)}" data-next="${closed ? 'Abierto' : 'Cerrado'}" title="Cambiar a ${closed ? 'Abierto' : 'Cerrado'}">
                ${closed ? 'Cerrado' : 'Abierto'}
              </button>
            </td>
            <td class="muted">${esc(d.actualizado)}</td>
            <td class="row-actions">
              <button class="link-btn" data-edit="${esc(d.id)}">Editar</button>
              <button class="link-btn danger" data-delete="${esc(d.id)}">Borrar</button>
            </td>
          </tr>`;
      }).join('') : '<tr><td colspan="7" class="muted">No hay dudas con estos filtros.</td></tr>';

    },

    notas() {
      const s = state.notas;
      $('notas-count').textContent = s.items.length;
      const items = s.items
        .filter(n => s.sprint === 'all' || n.sprint === s.sprint)
        .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));

      $('notas-list').innerHTML = items.length ? items.map(n => `
        <article class="meeting">
          <span class="ref-icon" style="background:${isUrl(n.url) ? '#ba0517' : 'var(--accent)'}">
            ${isUrl(n.url)
              ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="14" height="14" rx="2"/><path d="m22 8-6 4 6 4z"/></svg>'
              : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></svg>'}
          </span>
          <div>
            <h3>${esc(n.titulo)}</h3>
            <span class="muted">${esc(n.sprint)}${n.fecha ? ' · ' + esc(n.fecha) : ''}</span>
            ${n.notas ? `<p class="pre">${esc(n.notas)}</p>` : ''}
            <div class="meeting-actions">
              ${isUrl(n.url) ? `<a href="${esc(n.url)}" target="_blank" rel="noopener">Ver grabación →</a>` : ''}
              <button class="link-btn" data-edit="${esc(n.id)}">Editar</button>
              <button class="link-btn danger" data-delete="${esc(n.id)}">Borrar</button>
            </div>
          </div>
        </article>`).join('') : '<p class="muted">No hay notas ni grabaciones con este filtro.</p>';

      markChips('notas-sprint-filter', s.sprint);
    },

    pendientes() {
      const s = state.pendientes;
      const open = s.items.filter(p => p.status !== 'Cerrado').length;
      $('pendientes-open').textContent = open;
      $('pendientes-done').textContent = s.items.length - open;

      const people = [...new Set(s.items.map(p => norm(p.responsable)).filter(Boolean))].sort();
      const select = $('pendientes-responsable');
      select.innerHTML = [['', 'Todos'], ...people.map(p => [p, `${p} (${s.items.filter(x => norm(x.responsable) === p).length})`])]
        .map(([value, label]) => `<option value="${esc(value)}">${esc(label)}</option>`).join('');
      select.value = people.includes(s.responsable) ? s.responsable : '';
      $('pendientes-people').innerHTML = people.map(p => `<option value="${esc(p)}">`).join('');

      const items = s.items
        .filter(p => !s.responsable || norm(p.responsable) === s.responsable)
        .filter(p => s.status === 'all' || (p.status || 'Abierto') === s.status);

      $('pendientes-list').innerHTML = items.length ? items.map(p => {
        const done = p.status === 'Cerrado';
        const color = COLORS.includes(p.color) ? p.color : 'amarillo';
        return `
          <article class="postit ${color}${done ? ' done' : ''}">
            <p class="pre">${esc(p.tarea)}</p>
            <div class="postit-owner">
              <span class="avatar">${esc(initials(p.responsable))}</span>
              <div><strong>${esc(p.responsable)}</strong><span>${esc(p.sprint)}</span></div>
            </div>
            <div class="postit-actions">
              <button class="toggle ${done ? 'closed' : 'open'}" data-id="${esc(p.id)}" data-next="${done ? 'Abierto' : 'Cerrado'}">${done ? '✓ Hecho' : 'Marcar hecho'}</button>
              <button class="link-btn" data-edit="${esc(p.id)}">Editar</button>
              <button class="link-btn danger" data-delete="${esc(p.id)}">Borrar</button>
            </div>
          </article>`;
      }).join('') : '<p class="muted">No hay pendientes con este filtro.</p>';

      markChips('pendientes-status-filter', s.status);
    }
  };

  function resetForm(type) {
    const form = $(FORMS[type]);
    const key = form.querySelector('.team-key').value;
    state[type].editing = null;
    form.reset();
    form.querySelector('.team-key').value = key;
    form.querySelector('[type=submit]').textContent = ADD_LABELS[type];
    form.querySelector('.form-cancel').hidden = true;
  }

  function startEdit(type, id, fields) {
    const item = state[type].items.find(x => x.id === id);
    if (!item) return;
    const form = $(FORMS[type]);
    state[type].editing = id;
    fields.forEach(f => form.elements[f].value = item[f] || '');
    form.querySelector('[type=submit]').textContent = 'Guardar cambios';
    form.querySelector('.form-cancel').hidden = false;
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function wireForm(type, formId, fields, validate, onAdd) {
    const form = $(formId);
    form.querySelector('.form-cancel').addEventListener('click', () => resetForm(type));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const item = Object.fromEntries(fields.map(f => [f, form.elements[f].value.trim()]));
      const error = validate(item);
      if (error) return flash(form, error, true);
      const editing = state[type].editing;
      const button = form.querySelector('[type=submit]');
      button.disabled = true;
      try {
        if (editing) await send(type, form, { action: 'update', id: editing, changes: item });
        else await send(type, form, { action: 'add', item: onAdd(item) });
        resetForm(type);
        render[type]();
        flash(form, editing ? 'Cambios guardados.' : 'Registro agregado.');
      } catch (err) { flash(form, err.message, true); }
      button.disabled = false;
    });
  }

  async function refresh() {
    const results = await Promise.allSettled([load('dudas'), load('notas'), load('pendientes')]);
    render.dudas();
    render.notas();
    render.pendientes();
    const ok = results.every(r => r.status === 'fulfilled');
    const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('.notes-sync').forEach(el => el.textContent = ok ? `Sincronizado ${time}` : 'Sin conexión con el Sheet');
  }

  document.querySelectorAll('.sprint-select').forEach(sel => sel.innerHTML = SPRINTS.map(s => `<option>${s}</option>`).join(''));
  document.querySelectorAll('.team-key').forEach(i => i.value = localStorage.getItem(KEY_STORAGE) || '');
  const sprintChips = [['all', 'Todos'], ...SPRINTS.map(s => [s, s])];
  $('dudas-filters').addEventListener('input', e => {
    const field = e.target.dataset.filter;
    if (!field) return;
    state.dudas.filters[field] = e.target.value.trim();
    render.dudas();
  });
  $('dudas-clear').addEventListener('click', () => {
    Object.keys(state.dudas.filters).forEach(k => state.dudas.filters[k] = '');
    $('dudas-filters').querySelectorAll('input').forEach(i => i.value = '');
    render.dudas();
  });
  chips('notas-sprint-filter', sprintChips, 'notas', 'sprint');
  chips('pendientes-status-filter', [['Abierto', 'Pendientes'], ['Cerrado', 'Hechos'], ['all', 'Todos']], 'pendientes', 'status');
  $('pendientes-responsable').addEventListener('change', e => { state.pendientes.responsable = e.target.value; render.pendientes(); });

  const dudaFields = ['tema', 'sprint', 'descripcion', 'comentarios'];
  const notaFields = ['titulo', 'sprint', 'fecha', 'notas', 'url'];
  wireForm('dudas', 'duda-form', dudaFields, () => null, item => ({ ...item, status: 'Abierto' }));
  wireForm('notas', 'nota-form', notaFields,
    item => item.url && !isUrl(item.url) ? 'El enlace debe empezar con https://' : (!item.notas && !item.url ? 'Agrega notas o un enlace a la grabación.' : null),
    item => item);
  const pendienteFields = ['tarea', 'responsable', 'sprint', 'color'];
  wireForm('pendientes', 'pendiente-form', pendienteFields, () => null, item => ({ ...item, status: 'Abierto' }));

  async function remove(type, formId, id, label) {
    const form = $(formId);
    if (!confirm(`¿Borrar “${label}”? Esta acción no se puede deshacer.`)) return;
    try {
      await send(type, form, { action: 'delete', id });
      if (state[type].editing === id) resetForm(type);
      render[type]();
      flash(form, 'Registro borrado.');
    } catch (err) { flash(form, err.message, true); }
  }

  async function setStatus(type, toggle, message) {
    const form = $(FORMS[type]);
    toggle.disabled = true;
    try {
      await send(type, form, { action: 'update', id: toggle.dataset.id, changes: { status: toggle.dataset.next } });
      render[type]();
      flash(form, message);
    } catch (err) { flash(form, err.message, true); toggle.disabled = false; }
  }

  $('dudas-body').addEventListener('click', async e => {
    const toggle = e.target.closest('.toggle');
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (edit) startEdit('dudas', edit.dataset.edit, dudaFields);
    if (del) remove('dudas', 'duda-form', del.dataset.delete, state.dudas.items.find(d => d.id === del.dataset.delete)?.tema);
    if (toggle) setStatus('dudas', toggle, `Status actualizado a ${toggle.dataset.next}.`);
  });

  $('notas-list').addEventListener('click', e => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (edit) startEdit('notas', edit.dataset.edit, notaFields);
    if (del) remove('notas', 'nota-form', del.dataset.delete, state.notas.items.find(n => n.id === del.dataset.delete)?.titulo);
  });

  $('pendientes-list').addEventListener('click', e => {
    const toggle = e.target.closest('.toggle');
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (edit) startEdit('pendientes', edit.dataset.edit, pendienteFields);
    if (del) remove('pendientes', 'pendiente-form', del.dataset.delete, state.pendientes.items.find(p => p.id === del.dataset.delete)?.tarea);
    if (toggle) setStatus('pendientes', toggle, toggle.dataset.next === 'Cerrado' ? 'Pendiente marcado como hecho.' : 'Pendiente reabierto.');
  });

  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
