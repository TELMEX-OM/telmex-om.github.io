// Notas de sesión de un refinamiento: se guardan al instante en el navegador y se sincronizan con el Google Sheet.
(() => {
  const API = window.NOTES_API_URL;
  const KEY_STORAGE = 'squad-om-team-key';
  const SYNC_DELAY_MS = 3000;
  const REFRESH_MS = 30000;

  const $ = id => document.getElementById(id);
  const editor = $('ref-notes');
  const id = editor.dataset.id;
  const titulo = editor.dataset.title;
  const DRAFT_STORAGE = `squad-om-ref-${id}`;
  const keyInput = $('ref-key');
  const time = d => d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  // draft.text = lo escrito; draft.synced = lo último que confirmó el Sheet
  let draft = JSON.parse(localStorage.getItem(DRAFT_STORAGE) || 'null') || { text: '', synced: '' };
  let timer = null;
  let saving = false;
  let backendReady = !!API;

  function setStatus(text, kind) {
    $('ref-status').textContent = text;
    $('ref-status').className = `ref-status ${kind || ''}`;
  }

  function persistLocal() {
    draft.text = editor.value;
    localStorage.setItem(DRAFT_STORAGE, JSON.stringify(draft));
  }

  function updateCount() {
    const words = editor.value.trim() ? editor.value.trim().split(/\s+/).length : 0;
    $('ref-count').textContent = `${words} palabras`;
  }

  async function load() {
    if (!backendReady) return;
    try {
      const res = await fetch(`${API}?type=refinamientos`);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      const remote = (data.items.find(x => x.id === id) || {}).notas || '';
      const dirty = draft.text !== draft.synced;
      // Solo se reemplaza lo local si no hay cambios pendientes de subir
      if (!dirty && remote !== editor.value && document.activeElement !== editor) {
        editor.value = remote;
        draft = { text: remote, synced: remote };
        localStorage.setItem(DRAFT_STORAGE, JSON.stringify(draft));
        updateCount();
      }
      if (dirty) setStatus('Cambios sin sincronizar — se guardan en este navegador', 'warn');
      else setStatus(`Sincronizado con el Sheet ${time(new Date())}`, 'ok');
    } catch (err) {
      if (/Tipo inválido/.test(err.message)) {
        backendReady = false;
        setStatus('Guardando solo en este navegador (falta actualizar Apps Script)', 'warn');
      } else {
        setStatus('Sin conexión con el Sheet — tus notas se guardan en este navegador', 'warn');
      }
    }
  }

  async function sync() {
    clearTimeout(timer);
    if (!backendReady || saving || draft.text === draft.synced) return;
    const key = keyInput.value.trim();
    if (!key) return setStatus('Guardado en este navegador. Escribe la clave del equipo para compartirlo.', 'warn');
    saving = true;
    const text = editor.value;
    setStatus('Sincronizando…');
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ type: 'refinamientos', action: 'save', id, item: { titulo, notas: text }, key })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      localStorage.setItem(KEY_STORAGE, key);
      draft.synced = text;
      localStorage.setItem(DRAFT_STORAGE, JSON.stringify(draft));
      setStatus(`Sincronizado con el Sheet ${time(new Date())}`, 'ok');
    } catch (err) {
      setStatus(`${err.message} — tus notas siguen guardadas en este navegador`, 'error');
    }
    saving = false;
    // Si se siguió escribiendo durante el envío, se sube lo nuevo
    if (editor.value !== draft.synced) schedule();
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(sync, SYNC_DELAY_MS);
  }

  function insertAtCursor(text) {
    const { selectionStart: start, selectionEnd: end, value } = editor;
    editor.value = value.slice(0, start) + text + value.slice(end);
    editor.selectionStart = editor.selectionEnd = start + text.length;
    editor.focus();
    editor.dispatchEvent(new Event('input'));
  }

  editor.value = draft.text;
  keyInput.value = localStorage.getItem(KEY_STORAGE) || '';
  updateCount();
  setStatus(API ? 'Conectando…' : 'Guardando solo en este navegador', API ? '' : 'warn');

  editor.addEventListener('input', () => {
    persistLocal();
    updateCount();
    setStatus(backendReady ? 'Escribiendo… se guardó en este navegador' : 'Guardado en este navegador', backendReady ? '' : 'warn');
    if (backendReady) schedule();
  });
  editor.addEventListener('blur', sync);
  keyInput.addEventListener('change', sync);

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); sync(); }
  });

  $('ref-time').addEventListener('click', () => {
    const before = editor.value.slice(0, editor.selectionStart);
    insertAtCursor(`${before && !before.endsWith('\n') ? '\n' : ''}[${time(new Date())}] `);
  });
  $('ref-bullet').addEventListener('click', () => {
    const before = editor.value.slice(0, editor.selectionStart);
    insertAtCursor(`${before && !before.endsWith('\n') ? '\n' : ''}• `);
  });

  $('ref-copy').addEventListener('click', async e => {
    await navigator.clipboard.writeText(editor.value);
    e.target.textContent = '¡Copiado!';
    setTimeout(() => e.target.textContent = 'Copiar todo', 1500);
  });

  $('ref-download').addEventListener('click', () => {
    const blob = new Blob([`${titulo}\n${new Date().toLocaleDateString('es-MX')}\n\n${editor.value}`], { type: 'text/plain' });
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `${id}-notas.txt` });
    a.click();
    URL.revokeObjectURL(a.href);
  });

  $('ref-focus').addEventListener('click', () => {
    const on = document.body.classList.toggle('focus-mode');
    $('ref-focus').textContent = on ? 'Salir de pantalla completa' : 'Pantalla completa';
    editor.focus();
  });

  // Avisar antes de cerrar si algo no llegó al Sheet (lo local sigue a salvo)
  window.addEventListener('beforeunload', e => {
    if (backendReady && draft.text !== draft.synced) { sync(); e.preventDefault(); }
  });

  load();
  setInterval(() => { if (!document.hidden) load(); }, REFRESH_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); else sync(); });
})();
