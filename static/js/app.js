/**
 * MarkItDown Studio - Frontend Application Script
 */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    fileQueue: [], // Array of { id, file, filename, size, status: 'pending'|'converting'|'done'|'error', result: null, error: null }
    activeFileId: null,
    targetDirectory: '',
    suggestedPaths: [],
    theme: localStorage.getItem('markitdown_theme') || 'dark',
    currentTab: 'view-rendered'
  };

  // DOM Elements
  const htmlElement = document.documentElement;
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const btnBrowseFiles = document.getElementById('btn-browse-files');
  const queueList = document.getElementById('queue-list');
  const queueEmptyState = document.getElementById('queue-empty-state');
  const queueCountBadge = document.getElementById('queue-count-badge');
  const btnClearQueue = document.getElementById('btn-clear-queue');
  const btnConvertAll = document.getElementById('btn-convert-all');
  
  const targetDirInput = document.getElementById('target-directory-input');
  const btnValidatePath = document.getElementById('btn-validate-path');
  const pathFeedback = document.getElementById('path-feedback-message');
  const suggestedPathsList = document.getElementById('suggested-paths-list');
  const saveModeStatus = document.getElementById('save-mode-status');

  const activeFileSelect = document.getElementById('active-file-select');
  const docStatsStrip = document.getElementById('doc-stats-strip');
  const statChars = document.getElementById('stat-chars');
  const statWords = document.getElementById('stat-words');
  const statLines = document.getElementById('stat-lines');
  const statTime = document.getElementById('stat-time');

  const tabPreview = document.getElementById('tab-preview');
  const tabSource = document.getElementById('tab-source');
  const viewRendered = document.getElementById('view-rendered');
  const viewSource = document.getElementById('view-source');
  const emptyViewerRendered = document.getElementById('empty-viewer-rendered');
  const emptyViewerSource = document.getElementById('empty-viewer-source');
  const markdownRenderedContent = document.getElementById('markdown-rendered-content');
  const markdownRawTextarea = document.getElementById('markdown-raw-textarea');

  const btnCopyMd = document.getElementById('btn-copy-md');
  const btnDownloadSingle = document.getElementById('btn-download-single');
  const btnSaveLocalSingle = document.getElementById('btn-save-local-single');
  const btnDownloadAllZip = document.getElementById('btn-download-all-zip');
  
  const globalStatusText = document.getElementById('global-status-text');
  const activeFilenameDisplay = document.getElementById('active-filename-display');

  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnHelpModal = document.getElementById('btn-help-modal');
  const helpModal = document.getElementById('help-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnModalOk = document.getElementById('btn-modal-ok');
  const toastContainer = document.getElementById('toast-container');

  // Configure Marked.js
  if (window.marked) {
    marked.setOptions({
      gfm: true,
      breaks: true,
      headerIds: true,
      mangle: false,
      highlight: function (code, lang) {
        if (window.hljs && lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (err) {}
        }
        if (window.hljs) {
          try {
            return hljs.highlightAuto(code).value;
          } catch (err) {}
        }
        return code;
      }
    });
  }

  // Initialize
  initApp();

  async function initApp() {
    applyTheme(state.theme);
    setupEventListeners();
    await fetchAppInfo();
  }

  // Fetch initial info & suggestions
  async function fetchAppInfo() {
    try {
      const res = await fetch('/api/info');
      if (res.ok) {
        const data = await res.json();
        state.suggestedPaths = data.suggested_paths || [];
        renderSuggestedPaths();
        if (state.suggestedPaths.length > 0 && !targetDirInput.value) {
          // Set default path to outputs folder or Documents
          const defaultPath = state.suggestedPaths.find(p => p.name.includes('Carpeta del Proyecto')) || state.suggestedPaths[0];
          if (defaultPath) {
            targetDirInput.value = defaultPath.path;
            state.targetDirectory = defaultPath.path;
            validatePath(defaultPath.path, false);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load app info:', err);
    }
  }

  function renderSuggestedPaths() {
    suggestedPathsList.innerHTML = '';
    state.suggestedPaths.forEach(item => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'suggested-btn';
      btn.innerHTML = `<i class="fa-solid fa-folder-open"></i> ${item.name}`;
      btn.title = item.path;
      btn.addEventListener('click', () => {
        targetDirInput.value = item.path;
        state.targetDirectory = item.path;
        validatePath(item.path, true);
      });
      suggestedPathsList.appendChild(btn);
    });
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Theme Toggle
    btnThemeToggle.addEventListener('click', () => {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(newTheme);
    });

    // Modal
    btnHelpModal.addEventListener('click', () => helpModal.classList.add('show'));
    btnCloseModal.addEventListener('click', () => helpModal.classList.remove('show'));
    btnModalOk.addEventListener('click', () => helpModal.classList.remove('show'));
    helpModal.addEventListener('click', (e) => {
      if (e.target === helpModal) helpModal.classList.remove('show');
    });

    // File Input & Dropzone
    btnBrowseFiles.addEventListener('click', () => fileInput.click());
    dropzone.addEventListener('click', (e) => {
      if (e.target !== btnBrowseFiles && !btnBrowseFiles.contains(e.target)) {
        fileInput.click();
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        addFilesToQueue(Array.from(e.target.files));
        fileInput.value = ''; // Reset
      }
    });

    // Drag & Drop
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        addFilesToQueue(Array.from(files));
      }
    });

    // Global dragover prevention
    window.addEventListener('dragover', (e) => e.preventDefault(), false);
    window.addEventListener('drop', (e) => e.preventDefault(), false);

    // Queue buttons
    btnClearQueue.addEventListener('click', clearQueue);
    btnConvertAll.addEventListener('click', convertAllPending);

    // Path Validation
    btnValidatePath.addEventListener('click', () => {
      validatePath(targetDirInput.value.trim(), true);
    });
    targetDirInput.addEventListener('change', () => {
      state.targetDirectory = targetDirInput.value.trim();
      validatePath(state.targetDirectory, false);
    });

    // Active File Dropdown
    activeFileSelect.addEventListener('change', (e) => {
      selectActiveFile(e.target.value);
    });

    // Tab Switching
    tabPreview.addEventListener('click', () => switchTab('view-rendered'));
    tabSource.addEventListener('click', () => switchTab('view-source'));

    // Actions
    btnCopyMd.addEventListener('click', copyActiveMarkdown);
    btnDownloadSingle.addEventListener('click', downloadActiveMarkdown);
    btnSaveLocalSingle.addEventListener('click', saveActiveToLocalDirectory);
    btnDownloadAllZip.addEventListener('click', downloadAllAsZip);

    // Live update when editing textarea
    markdownRawTextarea.addEventListener('input', () => {
      const activeItem = getActiveFileItem();
      if (activeItem && activeItem.result) {
        activeItem.result.markdown = markdownRawTextarea.value;
        updateDocStats(activeItem.result.markdown);
        if (state.currentTab === 'view-rendered') {
          renderMarkdownHTML(activeItem.result.markdown);
        }
      }
    });
  }

  // Theme Management
  function applyTheme(theme) {
    state.theme = theme;
    htmlElement.setAttribute('data-theme', theme);
    localStorage.setItem('markitdown_theme', theme);
    btnThemeToggle.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    
    // Switch highlight theme
    const hljsTheme = document.getElementById('highlight-theme');
    if (hljsTheme) {
      hljsTheme.href = theme === 'dark' 
        ? 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css'
        : 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css';
    }
  }

  // Toast Notification
  function showToast(message, type = 'info', duration = 3500) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-info';
    if (type === 'success') icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-triangle-exclamation';
    
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('removing');
      setTimeout(() => toast.remove(), 250);
    }, duration);
  }

  // File Queue Management
  function addFilesToQueue(files) {
    let addedCount = 0;
    files.forEach(file => {
      const id = 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
      const item = {
        id: id,
        file: file,
        filename: file.name,
        size: file.size,
        status: 'pending',
        result: null,
        error: null
      };
      state.fileQueue.push(item);
      addedCount++;
    });

    renderQueue();
    updateQueueActions();
    showToast(`Se agregaron ${addedCount} archivo(s) a la cola`, 'info');
  }

  function clearQueue() {
    state.fileQueue = [];
    state.activeFileId = null;
    renderQueue();
    updateQueueActions();
    resetViewer();
    showToast('Cola de archivos vaciada', 'info');
  }

  function removeQueueItem(id) {
    state.fileQueue = state.fileQueue.filter(item => item.id !== id);
    if (state.activeFileId === id) {
      const firstDone = state.fileQueue.find(i => i.status === 'done');
      state.activeFileId = firstDone ? firstDone.id : null;
      if (state.activeFileId) {
        selectActiveFile(state.activeFileId);
      } else {
        resetViewer();
      }
    }
    renderQueue();
    updateQueueActions();
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function getFileIconClass(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    switch (ext) {
      case 'pdf': return { class: 'pdf', icon: 'fa-file-pdf' };
      case 'docx':
      case 'doc': return { class: 'word', icon: 'fa-file-word' };
      case 'xlsx':
      case 'xls': return { class: 'excel', icon: 'fa-file-excel' };
      case 'pptx':
      case 'ppt': return { class: 'pptx', icon: 'fa-file-powerpoint' };
      case 'csv': return { class: 'csv', icon: 'fa-file-csv' };
      default: return { class: 'generic', icon: 'fa-file-lines' };
    }
  }

  function renderQueue() {
    const total = state.fileQueue.length;
    queueCountBadge.textContent = `${total} archivo${total !== 1 ? 's' : ''}`;

    if (total === 0) {
      queueList.innerHTML = '';
      queueList.appendChild(queueEmptyState);
      return;
    }

    queueList.innerHTML = '';
    state.fileQueue.forEach(item => {
      const li = document.createElement('li');
      li.className = `queue-item ${state.activeFileId === item.id ? 'active' : ''}`;
      li.dataset.id = item.id;

      const fileType = getFileIconClass(item.filename);

      let statusBadgeHtml = '';
      if (item.status === 'pending') {
        statusBadgeHtml = `<span class="status-badge pending"><i class="fa-regular fa-clock"></i> Pendiente</span>`;
      } else if (item.status === 'converting') {
        statusBadgeHtml = `<span class="status-badge converting"><i class="fa-solid fa-spinner fa-spin"></i> Convirtiendo</span>`;
      } else if (item.status === 'done') {
        statusBadgeHtml = `<span class="status-badge success"><i class="fa-solid fa-check"></i> Listo</span>`;
      } else if (item.status === 'error') {
        statusBadgeHtml = `<span class="status-badge error" title="${item.error || 'Error'}"><i class="fa-solid fa-triangle-exclamation"></i> Error</span>`;
      }

      li.innerHTML = `
        <div class="queue-item-left">
          <div class="file-type-icon ${fileType.class}">
            <i class="fa-solid ${fileType.icon}"></i>
          </div>
          <div class="file-meta-info">
            <span class="name" title="${item.filename}">${item.filename}</span>
            <span class="details">${formatBytes(item.size)}</span>
          </div>
        </div>
        <div class="queue-item-right">
          ${statusBadgeHtml}
          ${item.status === 'pending' ? `<button type="button" class="icon-btn-sm btn-convert-single" title="Convertir ahora"><i class="fa-solid fa-play text-primary"></i></button>` : ''}
          <button type="button" class="icon-btn-sm btn-remove-item" title="Eliminar"><i class="fa-solid fa-xmark"></i></button>
        </div>
      `;

      // Event listeners for item
      li.addEventListener('click', (e) => {
        if (!e.target.closest('.icon-btn-sm')) {
          if (item.status === 'done') {
            selectActiveFile(item.id);
          }
        }
      });

      const btnRemove = li.querySelector('.btn-remove-item');
      btnRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        removeQueueItem(item.id);
      });

      const btnConvertSingle = li.querySelector('.btn-convert-single');
      if (btnConvertSingle) {
        btnConvertSingle.addEventListener('click', (e) => {
          e.stopPropagation();
          convertSingleItem(item);
        });
      }

      queueList.appendChild(li);
    });

    updateDropdownOptions();
  }

  function updateQueueActions() {
    const hasItems = state.fileQueue.length > 0;
    const hasPending = state.fileQueue.some(i => i.status === 'pending');
    const hasDone = state.fileQueue.some(i => i.status === 'done');

    btnClearQueue.disabled = !hasItems;
    btnConvertAll.disabled = !hasPending;
    btnDownloadAllZip.disabled = !hasDone;
  }

  function updateDropdownOptions() {
    const doneItems = state.fileQueue.filter(i => i.status === 'done');
    activeFileSelect.innerHTML = '';

    if (doneItems.length === 0) {
      activeFileSelect.innerHTML = '<option value="">Ningún archivo convertido aún</option>';
      activeFileSelect.disabled = true;
      return;
    }

    activeFileSelect.disabled = false;
    doneItems.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.id;
      opt.textContent = `${item.result?.output_filename || item.filename} (${formatBytes(item.size)})`;
      if (item.id === state.activeFileId) opt.selected = true;
      activeFileSelect.appendChild(opt);
    });
  }

  // Conversion Logic
  async function convertSingleItem(item) {
    item.status = 'converting';
    renderQueue();
    updateQueueActions();
    globalStatusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-primary"></i> Procesando <strong>${item.filename}</strong> con MarkItDown...`;

    const formData = new FormData();
    formData.append('files', item.file, item.filename);

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error en servidor: ${response.statusText}`);
      }

      const data = await response.json();
      const res = data.results && data.results[0];

      if (res && res.success) {
        item.status = 'done';
        item.result = res;
        showToast(`"${item.filename}" convertido exitosamente`, 'success');
        
        // If no active file or this was explicitly converted, select it
        selectActiveFile(item.id);
      } else {
        item.status = 'error';
        item.error = res?.error || 'Error desconocido';
        showToast(`Error al convertir "${item.filename}": ${item.error}`, 'error');
      }
    } catch (err) {
      item.status = 'error';
      item.error = err.message;
      showToast(`Error de red o servidor: ${err.message}`, 'error');
    } finally {
      renderQueue();
      updateQueueActions();
      globalStatusText.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> Procesamiento finalizado.`;
    }
  }

  async function convertAllPending() {
    const pendingItems = state.fileQueue.filter(i => i.status === 'pending');
    if (pendingItems.length === 0) return;

    btnConvertAll.disabled = true;
    pendingItems.forEach(i => i.status = 'converting');
    renderQueue();

    globalStatusText.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-primary"></i> Procesando ${pendingItems.length} documento(s) con MarkItDown...`;

    const formData = new FormData();
    pendingItems.forEach(item => {
      formData.append('files', item.file, item.filename);
    });

    try {
      const response = await fetch('/api/convert', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.statusText}`);
      }

      const data = await response.json();
      const results = data.results || [];

      results.forEach((res, index) => {
        const item = pendingItems[index];
        if (item) {
          if (res.success) {
            item.status = 'done';
            item.result = res;
          } else {
            item.status = 'error';
            item.error = res.error;
          }
        }
      });

      showToast(`${data.successful} de ${pendingItems.length} archivos convertidos correctamente`, 'success');

      // Select first done item
      const firstDone = state.fileQueue.find(i => i.status === 'done');
      if (firstDone) {
        selectActiveFile(firstDone.id);
      }
    } catch (err) {
      pendingItems.forEach(i => {
        i.status = 'error';
        i.error = err.message;
      });
      showToast(`Error durante la conversión por lotes: ${err.message}`, 'error');
    } finally {
      renderQueue();
      updateQueueActions();
      globalStatusText.innerHTML = `<i class="fa-solid fa-circle-check text-success"></i> Conversión completada.`;
    }
  }

  // Viewer & Active File Selection
  function selectActiveFile(id) {
    state.activeFileId = id;
    const item = state.fileQueue.find(i => i.id === id);

    if (!item || !item.result) {
      resetViewer();
      return;
    }

    renderQueue();
    updateDropdownOptions();

    // Enable toolbar buttons
    btnCopyMd.disabled = false;
    btnDownloadSingle.disabled = false;
    btnSaveLocalSingle.disabled = false;

    // Display filename and metadata
    activeFilenameDisplay.textContent = item.result.output_filename || `${item.filename}.md`;
    docStatsStrip.style.display = 'flex';
    
    // Update stats
    updateDocStats(item.result.markdown, item.result.stats?.time_seconds);

    // Update raw textarea
    markdownRawTextarea.value = item.result.markdown;

    // Render HTML
    renderMarkdownHTML(item.result.markdown);

    // Show content panes, hide empty states
    emptyViewerRendered.style.display = 'none';
    markdownRenderedContent.style.display = 'block';
    emptyViewerSource.style.display = 'none';
    sourceEditorWrapper = document.getElementById('source-editor-wrapper');
    if (sourceEditorWrapper) sourceEditorWrapper.style.display = 'block';
  }

  function resetViewer() {
    state.activeFileId = null;
    activeFilenameDisplay.textContent = 'Ningún archivo activo';
    docStatsStrip.style.display = 'none';
    
    btnCopyMd.disabled = true;
    btnDownloadSingle.disabled = true;
    btnSaveLocalSingle.disabled = true;

    emptyViewerRendered.style.display = 'flex';
    markdownRenderedContent.style.display = 'none';
    markdownRenderedContent.innerHTML = '';

    emptyViewerSource.style.display = 'flex';
    const sourceEditorWrapper = document.getElementById('source-editor-wrapper');
    if (sourceEditorWrapper) sourceEditorWrapper.style.display = 'none';
    markdownRawTextarea.value = '';

    updateDropdownOptions();
  }

  function updateDocStats(markdownText, timeSeconds = null) {
    const chars = markdownText.length;
    const words = markdownText.trim() ? markdownText.trim().split(/\s+/).length : 0;
    const lines = markdownText.split('\n').length;

    statChars.textContent = chars.toLocaleString();
    statWords.textContent = words.toLocaleString();
    statLines.textContent = lines.toLocaleString();
    if (timeSeconds !== null && timeSeconds !== undefined) {
      statTime.textContent = `${timeSeconds}s`;
    }
  }

  function renderMarkdownHTML(markdownText) {
    if (!window.marked) {
      markdownRenderedContent.textContent = markdownText;
      return;
    }
    const html = marked.parse(markdownText || '');
    markdownRenderedContent.innerHTML = html;

    // Apply syntax highlighting to any code blocks
    if (window.hljs) {
      markdownRenderedContent.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });
    }
  }

  function switchTab(targetId) {
    state.currentTab = targetId;
    tabPreview.classList.toggle('active', targetId === 'view-rendered');
    tabSource.classList.toggle('active', targetId === 'view-source');

    viewRendered.classList.toggle('active', targetId === 'view-rendered');
    viewSource.classList.toggle('active', targetId === 'view-source');

    // If switching to rendered tab, re-render from textarea in case of edits
    if (targetId === 'view-rendered') {
      const activeItem = getActiveFileItem();
      if (activeItem && activeItem.result) {
        renderMarkdownHTML(markdownRawTextarea.value);
      }
    }
  }

  function getActiveFileItem() {
    return state.fileQueue.find(i => i.id === state.activeFileId);
  }

  // Export Actions
  async function copyActiveMarkdown() {
    const textToCopy = markdownRawTextarea.value;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      showToast('¡Markdown copiado al portapapeles!', 'success');
    } catch (err) {
      // Fallback
      markdownRawTextarea.select();
      document.execCommand('copy');
      showToast('¡Markdown copiado al portapapeles!', 'success');
    }
  }

  function downloadActiveMarkdown() {
    const activeItem = getActiveFileItem();
    if (!activeItem || !activeItem.result) return;

    const content = markdownRawTextarea.value;
    const filename = activeItem.result.output_filename || `${activeItem.filename}.md`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Descargando "${filename}"`, 'success');
  }

  async function validatePath(directoryPath, showNotification = true) {
    if (!directoryPath) {
      pathFeedback.className = 'path-feedback error';
      pathFeedback.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Por favor ingresa una ruta válida.';
      saveModeStatus.textContent = 'Ruta Requerida';
      return false;
    }

    try {
      const res = await fetch('/api/validate-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ directory_path: directoryPath })
      });

      const data = await res.json();
      if (data.valid) {
        pathFeedback.className = 'path-feedback success';
        pathFeedback.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${data.message} (${data.resolved_path})`;
        saveModeStatus.textContent = 'Directorio Válido';
        state.targetDirectory = data.resolved_path;
        if (showNotification) showToast('Ruta de destino validada correctamente', 'success');
        return true;
      } else {
        pathFeedback.className = 'path-feedback error';
        pathFeedback.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${data.message}`;
        saveModeStatus.textContent = 'Ruta no válida';
        if (showNotification) showToast(data.message, 'error');
        return false;
      }
    } catch (err) {
      pathFeedback.className = 'path-feedback error';
      pathFeedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> No se pudo validar la ruta.`;
      return false;
    }
  }

  async function saveActiveToLocalDirectory() {
    const activeItem = getActiveFileItem();
    if (!activeItem || !activeItem.result) {
      showToast('No hay ningún documento activo para guardar', 'error');
      return;
    }

    const targetDir = targetDirInput.value.trim();
    if (!targetDir) {
      showToast('Especifica la ruta de la carpeta donde deseas guardar', 'error');
      targetDirInput.focus();
      return;
    }

    const filename = activeItem.result.output_filename || `${activeItem.filename}.md`;
    const content = markdownRawTextarea.value;

    btnSaveLocalSingle.disabled = true;
    try {
      const res = await fetch('/api/save-local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directory_path: targetDir,
          files: [{ filename: filename, content: content }],
          overwrite: true
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const savedPath = data.details && data.details[0] ? data.details[0].saved_path : data.directory;
        showToast(`Guardado en: ${savedPath}`, 'success', 5000);
      } else {
        showToast(data.error || 'Error al guardar archivo en disco', 'error');
      }
    } catch (err) {
      showToast(`Error al comunicarse con el servidor: ${err.message}`, 'error');
    } finally {
      btnSaveLocalSingle.disabled = false;
    }
  }

  async function downloadAllAsZip() {
    const doneItems = state.fileQueue.filter(i => i.status === 'done' && i.result);
    if (doneItems.length === 0) {
      showToast('No hay documentos convertidos para empaquetar', 'error');
      return;
    }

    btnDownloadAllZip.disabled = true;
    showToast('Generando archivo ZIP con todos los Markdown...', 'info');

    const filesPayload = doneItems.map(item => ({
      filename: item.result.output_filename || `${item.filename}.md`,
      content: item.id === state.activeFileId ? markdownRawTextarea.value : item.result.markdown
    }));

    try {
      const res = await fetch('/api/download-zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: filesPayload,
          zip_name: 'documentos_markdown.zip'
        })
      });

      if (!res.ok) throw new Error('Error al generar el ZIP');

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'documentos_markdown.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('¡Archivo ZIP descargado exitosamente!', 'success');
    } catch (err) {
      showToast(`Error al descargar ZIP: ${err.message}`, 'error');
    } finally {
      btnDownloadAllZip.disabled = false;
    }
  }
});
