/* ============================================================
   TEST CONSTRUCTOR — Main JavaScript Module
   Kerege Admin Panel | 2026
   Handles: State, Sidebar, Editor, Bulk Actions,
            Autosave (localStorage + Supabase),
            Drag-and-Drop Media, Excel/JSON Import, Preview
   ============================================================ */

(function () {
  'use strict';

  // ──────────────────────────────────────────────────────────
  // STATE
  // ──────────────────────────────────────────────────────────
  const ORT_SECTIONS = ['Математика I', 'Математика II', 'Аналогии', 'Чтение', 'Грамматика', 'Прочее'];

  let tc = {
    draftId: null,
    meta: {
      name: '',
      language: 'RU',
      duration: 170,
      type: 'standard'
    },
    questions: [],      // array of question objects
    activeIdx: -1,      // currently edited question index
    selectedIdxs: new Set(), // bulk-selected indices
    autoSaveTimer: null,
    pendingImages: {},  // filename → base64 (for drag-drop matching)
    mediaFiles: [],     // all dragged files list {name, b64, assignedTo}
  };

  // ──────────────────────────────────────────────────────────
  // QUESTION FACTORY
  // ──────────────────────────────────────────────────────────
  function makeQuestion(overrides = {}) {
    return {
      id: Date.now() + Math.random(),
      text: '',
      options: { A: '', B: '', C: '', D: '' },
      correctAnswer: '',
      topic: '',
      weight: 1,
      section: '',
      imageUrl: '',
      explanation: '',
      ...overrides
    };
  }

  // ──────────────────────────────────────────────────────────
  // STATUS LOGIC
  // ──────────────────────────────────────────────────────────
  function getQStatus(q) {
    return {
      hasAnswer: !!q.correctAnswer,
      hasImage:  !!q.imageUrl,
      hasText:   !!q.text.trim()
    };
  }

  // ──────────────────────────────────────────────────────────
  // INIT — called after DOM is ready
  // ──────────────────────────────────────────────────────────
  function initConstructor() {
    // Restore draft from localStorage
    const saved = localStorage.getItem('tc_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        tc.meta      = parsed.meta      || tc.meta;
        tc.questions = (parsed.questions || []).map(q => makeQuestion(q));
        tc.draftId   = parsed.draftId   || null;
      } catch (_) {}
    }

    // If no questions yet, start with 1 blank
    if (tc.questions.length === 0) {
      tc.questions.push(makeQuestion());
    }

    renderMetaBar();
    renderSidebar();

    // Auto-select first question
    if (tc.activeIdx === -1) selectQuestion(0);

    setupGlobalDragEvents();
    updateAutosaveBadge('idle');
  }

  // ──────────────────────────────────────────────────────────
  // META BAR — sync inputs → state
  // ──────────────────────────────────────────────────────────
  function renderMetaBar() {
    const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    setVal('tc-test-name',     tc.meta.name);
    setVal('tc-test-language', tc.meta.language);
    setVal('tc-test-duration', tc.meta.duration);
    setVal('tc-test-type',     tc.meta.type);
  }

  function syncMeta() {
    const getVal = id => { const el = document.getElementById(id); return el ? el.value : ''; };
    tc.meta.name     = getVal('tc-test-name');
    tc.meta.language = getVal('tc-test-language');
    tc.meta.duration = parseInt(getVal('tc-test-duration')) || 170;
    tc.meta.type     = getVal('tc-test-type');
  }

  // ──────────────────────────────────────────────────────────
  // SIDEBAR
  // ──────────────────────────────────────────────────────────
  function renderSidebar() {
    const container = document.getElementById('tc-sidebar-list');
    if (!container) return;

    container.innerHTML = tc.questions.map((q, i) => {
      const st = getQStatus(q);
      const isActive   = i === tc.activeIdx;
      const isSelected = tc.selectedIdxs.has(i);

      const dotAnswer = st.hasAnswer
        ? '<span class="tc-dot tc-dot-ok" title="Правильный ответ указан"></span>'
        : '<span class="tc-dot tc-dot-err" title="Нет правильного ответа"></span>';
      const dotImage = st.hasImage
        ? '<span class="tc-dot tc-dot-ok" title="Фото есть"></span>'
        : '<span class="tc-dot tc-dot-grey" title="Нет фото"></span>';
      const dotText = st.hasText
        ? '<span class="tc-dot tc-dot-ok" title="Текст заполнен"></span>'
        : '<span class="tc-dot tc-dot-warn" title="Нет текста"></span>';

      const preview = q.text
        ? q.text.replace(/<[^>]+>/g, '').substring(0, 28) + (q.text.length > 28 ? '…' : '')
        : '(пусто)';

      return `
        <div class="tc-q-item ${isActive ? 'active' : ''}" onclick="tcSelectQuestion(${i})" 
             data-idx="${i}" id="tc-q-item-${i}">
          <input type="checkbox" class="tc-q-item-cb" 
                 ${isSelected ? 'checked' : ''}
                 onclick="event.stopPropagation(); tcToggleSelect(${i})"
                 title="Выбрать для групповых действий">
          <span class="tc-q-num">${i + 1}</span>
          <span class="tc-q-preview">${preview}</span>
          <div class="tc-q-dots">
            ${dotText}${dotAnswer}${dotImage}
          </div>
        </div>`;
    }).join('');

    // Update counter
    const counter = document.getElementById('tc-q-count');
    if (counter) counter.textContent = `${tc.questions.length} вопросов`;
  }

  // ──────────────────────────────────────────────────────────
  // SELECT QUESTION
  // ──────────────────────────────────────────────────────────
  function selectQuestion(idx) {
    // Save current edit before switching
    if (tc.activeIdx >= 0) saveCurrentEditorToState();

    tc.activeIdx = idx;
    renderSidebar();
    renderEditor(idx);

    // Scroll sidebar item into view
    const el = document.getElementById(`tc-q-item-${idx}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  window.tcSelectQuestion = selectQuestion;

  // ──────────────────────────────────────────────────────────
  // EDITOR
  // ──────────────────────────────────────────────────────────
  function renderEditor(idx) {
    const main = document.getElementById('tc-main');
    if (!main) return;

    if (idx < 0 || idx >= tc.questions.length) {
      main.innerHTML = `
        <div class="tc-empty-state">
          <span class="tc-empty-icon">📝</span>
          <h3>Выберите вопрос</h3>
          <p>Нажмите на вопрос в левой панели или добавьте новый</p>
        </div>`;
      return;
    }

    const q = tc.questions[idx];
    const sectionOpts = ORT_SECTIONS.map(s =>
      `<option value="${s}" ${q.section === s ? 'selected' : ''}>${s}</option>`
    ).join('');

    main.innerHTML = `
      <!-- Q toolbar -->
      <div class="tc-card">
        <div class="tc-card-header">
          <h3>Вопрос №${idx + 1}</h3>
          <div style="display:flex;gap:8px;align-items:center;">
            <button class="tc-btn tc-btn-ghost tc-btn-sm" onclick="tcDuplicateQuestion(${idx})" title="Дублировать">⧉ Копия</button>
            <button class="tc-btn tc-btn-sm" style="background:#fee2e2;color:#dc2626;" onclick="tcDeleteQuestion(${idx})" title="Удалить">🗑 Удалить</button>
          </div>
        </div>
        <div class="tc-card-body">

          <!-- Meta row -->
          <div class="tc-row">
            <div class="tc-field">
              <label>Тема</label>
              <input type="text" id="tc-q-topic" value="${escHtml(q.topic)}" placeholder="Алгебра, Геометрия..." oninput="tcAutoSaveTrigger()">
            </div>
            <div class="tc-field" style="max-width:100px;">
              <label>Вес (баллы)</label>
              <input type="number" id="tc-q-weight" value="${q.weight}" min="0.5" step="0.5" oninput="tcAutoSaveTrigger()">
            </div>
            <div class="tc-field">
              <label>Раздел</label>
              <select id="tc-q-section" onchange="tcAutoSaveTrigger()">
                <option value="">— Не указан —</option>
                ${sectionOpts}
              </select>
            </div>
          </div>

          <!-- Question text with rich-text toolbar -->
          <div class="tc-field" style="margin-bottom:14px;">
            <label>Текст вопроса</label>
            <div class="tc-rt-toolbar">
              <button class="tc-rt-btn" onclick="tcFmt('bold')" title="Жирный"><b>B</b></button>
              <button class="tc-rt-btn" onclick="tcFmt('italic')" title="Курсив"><i>I</i></button>
              <button class="tc-rt-btn" onclick="tcFmt('underline')" title="Подчёркнутый"><u>U</u></button>
              <div class="tc-rt-sep"></div>
              <button class="tc-rt-btn" onclick="tcFmtWrap('sup')" title="Верхний индекс X²">X²</button>
              <button class="tc-rt-btn" onclick="tcFmtWrap('sub')" title="Нижний индекс X₂">X₂</button>
              <div class="tc-rt-sep"></div>
              <button class="tc-rt-btn" onclick="tcFmtWrap('strike')" title="Зачёркнутый"><s>S</s></button>
              <button class="tc-rt-btn" onclick="tcClearFormat()" title="Очистить форматирование" style="font-size:11px;">✕ Формат</button>
            </div>
            <div class="tc-rt-area" id="tc-q-text" contenteditable="true" 
                 spellcheck="false"
                 oninput="tcAutoSaveTrigger()">${q.text}</div>
          </div>

          <!-- Answer options -->
          <div class="tc-field" style="margin-bottom:4px;"><label>Варианты ответов</label></div>
          <div class="tc-options-grid" id="tc-options-grid">
            ${['A','B','C','D'].map(letter => `
              <div class="tc-option-row ${q.correctAnswer === letter ? 'correct' : ''}" 
                   id="tc-opt-row-${letter}" onclick="tcSetCorrect('${letter}')">
                <div class="tc-option-label">${letter}</div>
                <input type="text" class="tc-option-input" id="tc-opt-${letter}"
                       value="${escHtml(q.options[letter])}"
                       placeholder="Вариант ${letter}"
                       onclick="event.stopPropagation()"
                       oninput="tcAutoSaveTrigger()">
                <input type="radio" name="tc-correct" class="tc-correct-radio"
                       value="${letter}" ${q.correctAnswer === letter ? 'checked' : ''}
                       onclick="event.stopPropagation(); tcSetCorrect('${letter}')">
              </div>
            `).join('')}
          </div>
          <p style="font-size:12px;color:var(--tc-muted);margin:4px 0 14px;">
            Кликните на вариант или на ○ чтобы отметить правильный ответ
          </p>

          <!-- Пояснение (Түшүндүрмө) -->
          <div class="tc-field tc-explanation">
            <label>Пояснение / Түшүндүрмө</label>
            <textarea id="tc-q-explanation" rows="3" 
                      placeholder="Объяснение решения, которое увидит студент после теста..."
                      oninput="tcAutoSaveTrigger()">${escHtml(q.explanation)}</textarea>
          </div>
        </div>
      </div>

      <!-- Media section -->
      <div class="tc-card">
        <div class="tc-card-header">
          <h3>📷 Изображение вопроса</h3>
          <button class="tc-btn tc-btn-ghost tc-btn-sm" onclick="tcClearImage(${idx})">✕ Удалить фото</button>
        </div>
        <div class="tc-card-body">
          ${q.imageUrl ? `<img class="tc-current-img" src="${q.imageUrl}" alt="Фото вопроса ${idx+1}">` : ''}
          <div class="tc-drop-zone" id="tc-single-drop" 
               ondragover="event.preventDefault(); this.classList.add('drag-over')"
               ondragleave="this.classList.remove('drag-over')"
               ondrop="tcHandleSingleDrop(event, ${idx})"
               onclick="document.getElementById('tc-single-input').click()">
            <span class="tc-drop-icon">🖼️</span>
            <p>Перетащите изображение сюда или нажмите</p>
            <small>PNG, JPG, GIF — до 10MB</small>
          </div>
          <input type="file" id="tc-single-input" accept="image/*" class="tc-drop-input"
                 onchange="tcHandleSingleInput(event, ${idx})">
        </div>
      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // SAVE EDITOR → STATE
  // ──────────────────────────────────────────────────────────
  function saveCurrentEditorToState() {
    const idx = tc.activeIdx;
    if (idx < 0 || idx >= tc.questions.length) return;
    const q = tc.questions[idx];

    const get = id => document.getElementById(id);
    const el  = get('tc-q-text');

    if (get('tc-q-topic'))       q.topic       = get('tc-q-topic').value;
    if (get('tc-q-weight'))      q.weight      = parseFloat(get('tc-q-weight').value) || 1;
    if (get('tc-q-section'))     q.section     = get('tc-q-section').value;
    if (el)                       q.text        = el.innerHTML;
    if (get('tc-q-explanation')) q.explanation = get('tc-q-explanation').value;

    ['A','B','C','D'].forEach(l => {
      const o = get(`tc-opt-${l}`);
      if (o) q.options[l] = o.value;
    });
  }

  // ──────────────────────────────────────────────────────────
  // RICH TEXT FORMATTING
  // ──────────────────────────────────────────────────────────
  function tcFmt(command) {
    const area = document.getElementById('tc-q-text');
    if (!area) return;
    area.focus();
    document.execCommand(command, false, null);
    tcAutoSaveTrigger();
  }
  window.tcFmt = tcFmt;

  function tcFmtWrap(tag) {
    const area = document.getElementById('tc-q-text');
    if (!area) return;
    area.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.toString() === '') return;
    const range = sel.getRangeAt(0);
    const el = document.createElement(tag);
    try {
      range.surroundContents(el);
    } catch (_) {
      // partial selection – wrap extracted contents
      el.appendChild(range.extractContents());
      range.insertNode(el);
    }
    sel.removeAllRanges();
    tcAutoSaveTrigger();
  }
  window.tcFmtWrap = tcFmtWrap;

  function tcClearFormat() {
    const area = document.getElementById('tc-q-text');
    if (!area) return;
    area.focus();
    document.execCommand('removeFormat', false, null);
    tcAutoSaveTrigger();
  }
  window.tcClearFormat = tcClearFormat;

  // ──────────────────────────────────────────────────────────
  // CORRECT ANSWER
  // ──────────────────────────────────────────────────────────
  function tcSetCorrect(letter) {
    const idx = tc.activeIdx;
    if (idx < 0) return;
    tc.questions[idx].correctAnswer = letter;
    // Update UI without full re-render
    ['A','B','C','D'].forEach(l => {
      const row = document.getElementById(`tc-opt-row-${l}`);
      const radio = document.querySelector(`input[name="tc-correct"][value="${l}"]`);
      if (row)  row.classList.toggle('correct', l === letter);
      if (radio) radio.checked = (l === letter);
    });
    renderSidebar();
    tcAutoSaveTrigger();
  }
  window.tcSetCorrect = tcSetCorrect;

  // ──────────────────────────────────────────────────────────
  // ADD / DUPLICATE / DELETE QUESTION
  // ──────────────────────────────────────────────────────────
  function tcAddQuestion() {
    saveCurrentEditorToState();
    syncMeta();
    tc.questions.push(makeQuestion());
    renderSidebar();
    selectQuestion(tc.questions.length - 1);
    tcAutoSaveTrigger();
    tcToast(`✅ Вопрос ${tc.questions.length} добавлен`, 'success');
  }
  window.tcAddQuestion = tcAddQuestion;

  function tcDuplicateQuestion(idx) {
    saveCurrentEditorToState();
    const copy = makeQuestion({ ...tc.questions[idx], id: Date.now() + Math.random() });
    tc.questions.splice(idx + 1, 0, copy);
    renderSidebar();
    selectQuestion(idx + 1);
    tcAutoSaveTrigger();
  }
  window.tcDuplicateQuestion = tcDuplicateQuestion;

  function tcDeleteQuestion(idx) {
    if (tc.questions.length <= 1) {
      tcToast('Минимум 1 вопрос', 'error'); return;
    }

    // Pretty inline confirmation dialog
    const main = document.getElementById('tc-main');
    if (!main) return;

    // Inject confirm overlay on top of editor area
    const overlay = document.createElement('div');
    overlay.id = 'tc-delete-confirm';
    overlay.style.cssText = `
      position:absolute;inset:0;background:rgba(0,0,0,.45);z-index:200;
      display:flex;align-items:center;justify-content:center;border-radius:12px;
    `;
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:28px 32px;max-width:340px;width:90%;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.25);">
        <div style="font-size:44px;margin-bottom:12px;">🗑️</div>
        <h3 style="margin:0 0 8px;font-size:17px;color:#111;">Удалить вопрос №${idx + 1}?</h3>
        <p style="margin:0 0 24px;font-size:14px;color:#666;">Это действие нельзя отменить.</p>
        <div style="display:flex;gap:10px;">
          <button id="tc-del-cancel"
            style="flex:1;padding:11px;border:2px solid #e5e7eb;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;background:#f9fafb;color:#333;">
            Отмена
          </button>
          <button id="tc-del-confirm"
            style="flex:1;padding:11px;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;background:#e31e24;color:white;">
            Удалить
          </button>
        </div>
      </div>`;

    // Position relative to main panel
    main.style.position = 'relative';
    main.appendChild(overlay);

    document.getElementById('tc-del-cancel').onclick = () => overlay.remove();
    document.getElementById('tc-del-confirm').onclick = () => {
      overlay.remove();
      tc.questions.splice(idx, 1);
      tc.activeIdx = Math.min(tc.activeIdx, tc.questions.length - 1);
      renderSidebar();
      renderEditor(tc.activeIdx);
      tcAutoSaveTrigger();
      tcToast(`🗑️ Вопрос №${idx + 1} удалён`, 'success');
    };
  }
  window.tcDeleteQuestion = tcDeleteQuestion;

  // ──────────────────────────────────────────────────────────
  // BULK SELECT / ACTIONS
  // ──────────────────────────────────────────────────────────
  function tcToggleSelect(idx) {
    if (tc.selectedIdxs.has(idx)) tc.selectedIdxs.delete(idx);
    else tc.selectedIdxs.add(idx);
    updateBulkBar();
    renderSidebar();
  }
  window.tcToggleSelect = tcToggleSelect;

  function tcSelectAll() {
    tc.questions.forEach((_, i) => tc.selectedIdxs.add(i));
    updateBulkBar();
    renderSidebar();
  }
  window.tcSelectAll = tcSelectAll;

  function tcDeselectAll() {
    tc.selectedIdxs.clear();
    updateBulkBar();
    renderSidebar();
  }
  window.tcDeselectAll = tcDeselectAll;

  function updateBulkBar() {
    const bar = document.getElementById('tc-bulk-bar');
    const cnt = document.getElementById('tc-bulk-count');
    if (!bar) return;
    if (tc.selectedIdxs.size > 0) {
      bar.classList.add('visible');
      if (cnt) cnt.textContent = tc.selectedIdxs.size;
    } else {
      bar.classList.remove('visible');
    }
  }

  function tcApplyBulk() {
    const field = document.getElementById('tc-bulk-field')?.value;
    const value = document.getElementById('tc-bulk-value')?.value?.trim();
    if (!field || !value) { tcToast('Выберите поле и введите значение', 'error'); return; }

    tc.selectedIdxs.forEach(i => {
      const q = tc.questions[i];
      if (field === 'topic')   q.topic   = value;
      if (field === 'weight')  q.weight  = parseFloat(value) || 1;
      if (field === 'section') q.section = value;
      if (field === 'correctAnswer' && ['A','B','C','D'].includes(value.toUpperCase()))
        q.correctAnswer = value.toUpperCase();
    });

    tcDeselectAll();
    renderSidebar();
    if (tc.activeIdx >= 0) renderEditor(tc.activeIdx);
    tcAutoSaveTrigger();
    tcToast(`✅ Применено к ${tc.selectedIdxs.size || 'выбранным'} вопросам`, 'success');
  }
  window.tcApplyBulk = tcApplyBulk;

  // ──────────────────────────────────────────────────────────
  // AUTOSAVE
  // ──────────────────────────────────────────────────────────
  function tcAutoSaveTrigger() {
    clearTimeout(tc.autoSaveTimer);
    updateAutosaveBadge('saving');
    tc.autoSaveTimer = setTimeout(doAutoSave, 1800);
  }
  window.tcAutoSaveTrigger = tcAutoSaveTrigger;

  async function doAutoSave() {
    saveCurrentEditorToState();
    syncMeta();

    const payload = {
      meta:      tc.meta,
      questions: tc.questions,
      draftId:   tc.draftId
    };

    // 1. Save to localStorage (always works)
    localStorage.setItem('tc_draft', JSON.stringify(payload));

    // 2. Try Supabase
    try {
      if (window.supabaseClient) {
        const draftData = {
          draft_name: tc.meta.name || '(черновик)',
          draft_data: payload,
          updated_at: new Date().toISOString()
        };

        if (tc.draftId) {
          await window.supabaseClient
            .from('test_drafts')
            .update(draftData)
            .eq('id', tc.draftId);
        } else {
          const { data, error } = await window.supabaseClient
            .from('test_drafts')
            .insert([draftData])
            .select('id')
            .single();
          if (!error && data) tc.draftId = data.id;
        }
        updateAutosaveBadge('saved');
      } else {
        updateAutosaveBadge('saved'); // localStorage only
      }
    } catch (e) {
      console.warn('Autosave to Supabase failed:', e);
      updateAutosaveBadge('saved'); // local still ok
    }
  }

  function updateAutosaveBadge(state) {
    const badge = document.getElementById('tc-autosave-badge');
    if (!badge) return;
    badge.className = 'tc-autosave-badge';
    if (state === 'saving') {
      badge.classList.add('saving');
      badge.innerHTML = '⏳ Сохранение...';
    } else if (state === 'saved') {
      badge.classList.add('saved');
      badge.innerHTML = '💾 Черновик сохранён';
      setTimeout(() => {
        badge.className = 'tc-autosave-badge';
        badge.innerHTML = '💾 Автосохранение';
      }, 3000);
    } else if (state === 'error') {
      badge.classList.add('error');
      badge.innerHTML = '⚠️ Ошибка сохранения';
    } else {
      badge.innerHTML = '💾 Автосохранение';
    }
  }

  // ──────────────────────────────────────────────────────────
  // DRAG-AND-DROP MEDIA (bulk + single)
  // ──────────────────────────────────────────────────────────

  function setupGlobalDragEvents() {
    const zone = document.getElementById('tc-bulk-drop');
    if (!zone) return;

    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handleBulkFiles(Array.from(e.dataTransfer.files));
    });
  }

  function handleBulkFiles(files) {
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (!imageFiles.length) { tcToast('Нет изображений среди файлов', 'error'); return; }

    let processed = 0;
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        const b64 = reader.result;
        const name = file.name.toLowerCase(); // e.g. q1.png, question2.jpg

        // Try to auto-assign: q1.png → question[0], q23.png → question[22]
        const match = name.match(/[qвqв]?(\d+)/i); // q1, в1, 1, q123
        const qNum  = match ? parseInt(match[1]) - 1 : -1; // 0-based

        if (qNum >= 0 && qNum < tc.questions.length) {
          tc.questions[qNum].imageUrl = b64;
          tc.mediaFiles.push({ name: file.name, b64, assignedTo: qNum + 1 });
        } else {
          tc.mediaFiles.push({ name: file.name, b64, assignedTo: null });
        }

        processed++;
        if (processed === imageFiles.length) {
          renderBulkImageGrid();
          if (tc.activeIdx >= 0) renderEditor(tc.activeIdx);
          renderSidebar();
          tcAutoSaveTrigger();
          tcToast(`🖼️ ${processed} фото обработано и привязано`, 'success');
        }
      };
      reader.readAsDataURL(file);
    });
  }
  window.tcHandleBulkInput = function(event) {
    handleBulkFiles(Array.from(event.target.files));
  };

  function renderBulkImageGrid() {
    const grid = document.getElementById('tc-media-grid');
    if (!grid) return;
    if (!tc.mediaFiles.length) { grid.innerHTML = ''; return; }

    grid.innerHTML = tc.mediaFiles.map((f, i) => `
      <div class="tc-img-thumb" title="${f.name}">
        <img src="${f.b64}" alt="${f.name}">
        <div class="tc-img-label">
          ${f.assignedTo ? `В${f.assignedTo}` : '❓'}
        </div>
        <button class="tc-img-del" onclick="tcRemoveMediaFile(${i})" title="Удалить">✕</button>
      </div>`
    ).join('');
  }

  window.tcRemoveMediaFile = function(i) {
    const file = tc.mediaFiles[i];
    if (file.assignedTo) {
      const qIdx = file.assignedTo - 1;
      if (tc.questions[qIdx]) tc.questions[qIdx].imageUrl = '';
    }
    tc.mediaFiles.splice(i, 1);
    renderBulkImageGrid();
    renderSidebar();
    if (tc.activeIdx >= 0) renderEditor(tc.activeIdx);
  };

  // Single question image handlers
  window.tcHandleSingleDrop = function(event, idx) {
    event.preventDefault();
    const zone = document.getElementById('tc-single-drop');
    if (zone) zone.classList.remove('drag-over');
    const file = event.dataTransfer.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    assignImageToQuestion(file, idx);
  };

  window.tcHandleSingleInput = function(event, idx) {
    const file = event.target.files[0];
    if (!file) return;
    assignImageToQuestion(file, idx);
  };

  function assignImageToQuestion(file, idx) {
    const reader = new FileReader();
    reader.onload = () => {
      tc.questions[idx].imageUrl = reader.result;
      renderEditor(idx);
      renderSidebar();
      tcAutoSaveTrigger();
    };
    reader.readAsDataURL(file);
  }

  window.tcClearImage = function(idx) {
    tc.questions[idx].imageUrl = '';
    renderEditor(idx);
    renderSidebar();
    tcAutoSaveTrigger();
  };

  // ──────────────────────────────────────────────────────────
  // IMPORT — Excel / JSON
  // ──────────────────────────────────────────────────────────

  function tcOpenImport() {
    const panel = document.getElementById('tc-import-panel');
    if (panel) panel.classList.toggle('open');
  }
  window.tcOpenImport = tcOpenImport;

  function tcSwitchImportTab(tab) {
    document.querySelectorAll('.tc-import-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tc-import-tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`[data-imptab="${tab}"]`)?.classList.add('active');
    document.getElementById(`tc-imp-${tab}`)?.classList.add('active');
  }
  window.tcSwitchImportTab = tcSwitchImportTab;

  window.tcHandleExcelImport = function(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (typeof XLSX === 'undefined') {
      tcToast('Библиотека Excel (SheetJS) не загружена', 'error'); return;
    }

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        importQuestionsFromArray(rows);
      } catch (err) {
        tcToast('Ошибка парсинга Excel: ' + err.message, 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  window.tcHandleJSONImport = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const parsed = JSON.parse(e.target.result);
        const arr = Array.isArray(parsed) ? parsed : parsed.questions || [];
        importQuestionsFromArray(arr);
      } catch (err) {
        tcToast('Ошибка парсинга JSON: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  function importQuestionsFromArray(rows) {
    if (!rows || rows.length === 0) { tcToast('Нет данных для импорта', 'error'); return; }

    const imported = rows.map(row => makeQuestion({
      text:          row['text']    || row['вопрос']    || row['question'] || '',
      options: {
        A: row['A'] || row['option_a'] || row['а'] || '',
        B: row['B'] || row['option_b'] || row['б'] || '',
        C: row['C'] || row['option_c'] || row['в'] || '',
        D: row['D'] || row['option_d'] || row['г'] || '',
      },
      correctAnswer: (row['answer']  || row['ответ']    || row['correct']  || '').toString().toUpperCase().charAt(0),
      topic:         row['topic']    || row['тема']      || '',
      weight:        parseFloat(row['weight']  || row['вес'] || 1) || 1,
      section:       row['section'] || row['раздел']    || '',
      explanation:   row['explanation'] || row['пояснение'] || row['түшүндүрмө'] || '',
    }));

    if (tc.questions.length === 1 && !tc.questions[0].text) {
      tc.questions = imported; // replace blank default
    } else {
      tc.questions = tc.questions.concat(imported);
    }

    renderSidebar();
    selectQuestion(0);
    tcAutoSaveTrigger();

    const panel = document.getElementById('tc-import-panel');
    if (panel) panel.classList.remove('open');

    tcToast(`✅ Импортировано ${imported.length} вопросов!`, 'success');
  }

  // ──────────────────────────────────────────────────────────
  // PREVIEW MODAL
  // ──────────────────────────────────────────────────────────

  function tcOpenPreview(idx) {
    saveCurrentEditorToState();
    const overlay = document.getElementById('tc-preview-overlay');
    if (overlay) overlay.classList.add('open');
    renderPreviewContent(idx !== undefined ? idx : tc.activeIdx, 'desktop');
  }
  window.tcOpenPreview = tcOpenPreview;

  function tcClosePreview() {
    const overlay = document.getElementById('tc-preview-overlay');
    if (overlay) overlay.classList.remove('open');
  }
  window.tcClosePreview = tcClosePreview;

  function tcSwitchPreviewTab(mode) {
    document.querySelectorAll('.tc-preview-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-pvtab="${mode}"]`)?.classList.add('active');
    renderPreviewContent(tc.activeIdx, mode);
  }
  window.tcSwitchPreviewTab = tcSwitchPreviewTab;

  function renderPreviewContent(idx, mode) {
    const body = document.getElementById('tc-preview-body');
    if (!body) return;

    if (idx < 0 || idx >= tc.questions.length) {
      body.innerHTML = '<p style="color:#888">Нет вопроса для предпросмотра</p>';
      return;
    }

    const q = tc.questions[idx];
    const cardHTML = `
      <div class="tc-pv-card">
        <div class="tc-pv-qnum">Вопрос ${idx + 1} ${q.topic ? '· ' + q.topic : ''}</div>
        ${q.imageUrl ? `<img class="tc-pv-img" src="${q.imageUrl}" alt="Фото">` : ''}
        <div class="tc-pv-qtext">${q.text || '<em style="color:#999">Текст вопроса не заполнен</em>'}</div>
        ${['A','B','C','D'].map(l => `
          <div class="tc-pv-option">
            <div class="tc-pv-option-label">${l}</div>
            <span>${q.options[l] || '<em style="color:#aaa">—</em>'}</span>
          </div>
        `).join('')}
        ${q.explanation ? `
          <div class="tc-pv-explanation">
            <strong>💡 Пояснение:</strong> ${q.explanation}
          </div>` : ''}
      </div>`;

    if (mode === 'mobile') {
      body.innerHTML = `
        <div class="tc-preview-mobile">
          <div class="tc-preview-mobile-inner">${cardHTML}</div>
        </div>`;
    } else {
      body.innerHTML = `<div class="tc-preview-desktop">${cardHTML}</div>`;
    }
  }

  // ──────────────────────────────────────────────────────────
  // FINAL SAVE TO SUPABASE
  // ──────────────────────────────────────────────────────────

  async function tcFinalSave() {
    saveCurrentEditorToState();
    syncMeta();

    if (!tc.meta.name.trim()) {
      tcToast('Введите название теста', 'error'); return;
    }

    const incomplete = tc.questions.filter(q => !q.correctAnswer);
    if (incomplete.length > 0) {
      const ok = confirm(`⚠️ У ${incomplete.length} вопроса(ов) не указан правильный ответ. Всё равно сохранить?`);
      if (!ok) return;
    }

    const btn = document.getElementById('tc-save-btn');
    if (btn) { btn.disabled = true; btn.innerHTML = '⏳ Сохранение...'; }

    try {
      if (!window.supabaseClient) throw new Error('Supabase не подключён');

      // Build answer_key, topics, weights, photo_urls arrays
      const answerKey  = tc.questions.map(q => q.correctAnswer || 'A');
      const topics     = tc.questions.map(q => q.topic || '');
      const weights    = tc.questions.map(q => q.weight || 1);
      const sections   = tc.questions.map(q => q.section || '');
      const photoUrls  = tc.questions.map(q => q.imageUrl || '');
      const explanations = tc.questions.map(q => q.explanation || '');
      const optionsArr = tc.questions.map(q => q.options);

      const testData = {
        name:         tc.meta.name,
        language:     tc.meta.language,
        duration:     tc.meta.duration,
        test_type:    tc.meta.type,
        answer_key:   answerKey,
        topics:       topics,
        weights:      weights,
        sections:     sections,
        photo_urls:   photoUrls,
        explanations: explanations,
        options:      optionsArr,
        question_texts: tc.questions.map(q => q.text),
        is_link_only: false,
        created_at:   new Date().toISOString()
      };

      const { data, error } = await window.supabaseClient
        .from('tests')
        .insert([testData])
        .select();

      if (error) throw error;

      // Delete draft from Supabase
      if (tc.draftId && window.supabaseClient) {
        await window.supabaseClient.from('test_drafts').delete().eq('id', tc.draftId);
      }
      localStorage.removeItem('tc_draft');

      tcToast(`✅ Тест "${tc.meta.name}" сохранён! (${tc.questions.length} вопросов)`, 'success');

      // Reset state
      tc = { ...tc, questions: [makeQuestion()], activeIdx: -1, draftId: null,
             meta: { name: '', language: 'RU', duration: 170, type: 'standard' },
             selectedIdxs: new Set(), mediaFiles: [] };
      renderMetaBar();
      renderSidebar();
      selectQuestion(0);

      // Refresh tests list if function exists
      if (typeof loadAdminTests === 'function') loadAdminTests();

    } catch (err) {
      console.error('Save error:', err);
      tcToast('Ошибка сохранения: ' + err.message, 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '💾 Сохранить тест'; }
    }
  }
  window.tcFinalSave = tcFinalSave;

  // ──────────────────────────────────────────────────────────
  // LOAD EXISTING TESTS LIST actions
  // ──────────────────────────────────────────────────────────

  window.tcEditTest = async function(testId) {
    try {
      const { data, error } = await window.supabaseClient.from('tests').select('*').eq('id', testId).single();
      if (error) throw error;

      tc.meta = {
        name:     data.name,
        language: data.language,
        duration: data.duration,
        type:     data.test_type || 'standard'
      };

      const n = (data.answer_key || []).length;
      tc.questions = Array.from({ length: n }, (_, i) => makeQuestion({
        text:          (data.question_texts || [])[i] || '',
        options:       (data.options || [])[i]       || { A:'', B:'', C:'', D:'' },
        correctAnswer: (data.answer_key  || [])[i]   || '',
        topic:         (data.topics      || [])[i]   || '',
        weight:        (data.weights     || [])[i]   || 1,
        section:       (data.sections    || [])[i]   || '',
        imageUrl:      (data.photo_urls  || [])[i]   || '',
        explanation:   (data.explanations|| [])[i]   || '',
      }));

      if (tc.questions.length === 0) tc.questions.push(makeQuestion());

      renderMetaBar();
      renderSidebar();
      selectQuestion(0);
      switchAdminSection('tests', '📝 Конструктор тестов');
      tcToast(`Тест "${data.name}" загружен для редактирования`, 'info');
    } catch (e) {
      tcToast('Ошибка загрузки теста: ' + e.message, 'error');
    }
  };

  // ──────────────────────────────────────────────────────────
  // UTILITIES
  // ──────────────────────────────────────────────────────────

  function escHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function tcToast(msg, type = 'info') {
    let toast = document.getElementById('tc-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'tc-toast';
      toast.className = 'tc-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.className = `tc-toast ${type}`;
    // Force reflow
    toast.offsetHeight;
    toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
  }
  window.tcToast = tcToast;

  // ──────────────────────────────────────────────────────────
  // BOOT
  // ──────────────────────────────────────────────────────────

  function boot() {
    const wrapper = document.getElementById('test-constructor-wrapper');
    if (!wrapper) return; // Constructor not mounted yet
    initConstructor();
  }

  // Wait for DOM + admin section to be shown
  document.addEventListener('DOMContentLoaded', () => {
    // Observe when #section-tests becomes active
    const observer = new MutationObserver(() => {
      const sec = document.getElementById('section-tests');
      if (sec && sec.classList.contains('active')) {
        const wrapper = document.getElementById('test-constructor-wrapper');
        if (wrapper && !wrapper.dataset.initialized) {
          wrapper.dataset.initialized = '1';
          initConstructor();
        }
      }
    });
    const content = document.getElementById('admin-content');
    if (content) observer.observe(content, { attributes: true, subtree: true, attributeFilter: ['class'] });

    // Also init if already visible
    const sec = document.getElementById('section-tests');
    if (sec && sec.classList.contains('active')) boot();
  });

  // Expose init for manual call
  window.initTestConstructor = boot;

})();
