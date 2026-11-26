// Dudas y Notas/Grabaciones: leen y escriben en el Google Sheet vía la Web App de Apps Script.
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

  const state = {
    dudas: { items: [], sprint: 'all', status: 'Abierto', editing: null },
    notas: { items: [], sprint: 'all', editing: null }
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

      const rows = s.items
        .filter(d => s.sprint === 'all' || d.sprint === s.sprint)
        .filter(d => s.status === 'all' || (d.status || 'Abierto') === s.status);

      $('dudas-body').innerHTML = rows.length ? rows.map(d => {
        const closed = d.status === 'Cerrado';
        return `
          <tr>
            <td><strong>${esc(d.tema)}</strong></td>
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

      markChips('dudas-sprint-filter', s.sprint);
      markChips('dudas-status-filter', s.status);
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
    }
  };

  function resetForm(type) {
    const form = $(type === 'dudas' ? 'duda-form' : 'nota-form');
    const key = form.querySelector('.team-key').value;
    state[type].editing = null;
    form.reset();
    form.querySelector('.team-key').value = key;
    form.querySelector('[type=submit]').textContent = type === 'dudas' ? 'Agregar duda' : 'Agregar';
    form.querySelector('.form-cancel').hidden = true;
  }

  function startEdit(type, id, fields) {
    const item = state[type].items.find(x => x.id === id);
    if (!item) return;
    const form = $(type === 'dudas' ? 'duda-form' : 'nota-form');
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
    const results = await Promise.allSettled([load('dudas'), load('notas')]);
    render.dudas();
    render.notas();
    const ok = results.every(r => r.status === 'fulfilled');
    const time = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    document.querySelectorAll('.notes-sync').forEach(el => el.textContent = ok ? `Sincronizado ${time}` : 'Sin conexión con el Sheet');
  }

  document.querySelectorAll('.sprint-select').forEach(sel => sel.innerHTML = SPRINTS.map(s => `<option>${s}</option>`).join(''));
  document.querySelectorAll('.team-key').forEach(i => i.value = localStorage.getItem(KEY_STORAGE) || '');
  const sprintChips = [['all', 'Todos'], ...SPRINTS.map(s => [s, s])];
  chips('dudas-sprint-filter', sprintChips, 'dudas', 'sprint');
  chips('dudas-status-filter', [['Abierto', 'Abiertas'], ['Cerrado', 'Cerradas'], ['all', 'Todas']], 'dudas', 'status');
  chips('notas-sprint-filter', sprintChips, 'notas', 'sprint');

  const dudaFields = ['tema', 'sprint', 'descripcion', 'comentarios'];
  const notaFields = ['titulo', 'sprint', 'fecha', 'notas', 'url'];
  wireForm('dudas', 'duda-form', dudaFields, () => null, item => ({ ...item, status: 'Abierto' }));
  wireForm('notas', 'nota-form', notaFields,
    item => item.url && !isUrl(item.url) ? 'El enlace debe empezar con https://' : (!item.notas && !item.url ? 'Agrega notas o un enlace a la grabación.' : null),
    item => item);

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

  $('dudas-body').addEventListener('click', async e => {
    const toggle = e.target.closest('.toggle');
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (edit) startEdit('dudas', edit.dataset.edit, dudaFields);
    if (del) remove('dudas', 'duda-form', del.dataset.delete, state.dudas.items.find(d => d.id === del.dataset.delete)?.tema);
    if (!toggle) return;
    const form = $('duda-form');
    toggle.disabled = true;
    try {
      await send('dudas', form, { action: 'update', id: toggle.dataset.id, changes: { status: toggle.dataset.next } });
      render.dudas();
      flash(form, `Status actualizado a ${toggle.dataset.next}.`);
    } catch (err) { flash(form, err.message, true); toggle.disabled = false; }
  });

  $('notas-list').addEventListener('click', e => {
    const edit = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (edit) startEdit('notas', edit.dataset.edit, notaFields);
    if (del) remove('notas', 'nota-form', del.dataset.delete, state.notas.items.find(n => n.id === del.dataset.delete)?.titulo);
  });

  refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
