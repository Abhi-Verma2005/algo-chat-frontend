export async function extractCurrentCode(): Promise<string> {
  const strategies: Array<() => Promise<string> | string> = [
    tryExtractFromMonaco,
    tryExtractFromCodeMirror,
    tryExtractFromGenericEditors,
    tryExtractFromTextareas,
  ];

  for (const s of strategies) {
    try {
      const value = await s();
      if (value && value.trim().length >= 10) return value;
    } catch {}
  }
  throw new Error('Unable to extract code from page');
}

function tryExtractFromMonaco(): string {
  // @ts-ignore
  if (window.monaco?.editor) {
    // @ts-ignore
    const editors = window.monaco.editor.getEditors?.() || [];
    if (editors.length > 0) {
      const model = editors[0]?.getModel?.();
      if (model) {
        const code = model.getValue?.();
        if (code && code.trim()) return code;
      }
    }
  }
  throw new Error('Monaco not available');
}

function tryExtractFromCodeMirror(): string {
  const cmEl = document.querySelector('.CodeMirror') as any;
  if (cmEl?.CodeMirror) {
    const value = cmEl.CodeMirror.getValue?.();
    if (value && value.trim()) return value;
  }
  throw new Error('CodeMirror not available');
}

function tryExtractFromGenericEditors(): string {
  const candidates = document.querySelectorAll(
    '[data-cy="code-editor"], .monaco-editor, .editor-container, [data-e2e-locator="code-editor"], [class*="editor"], [class*="code"]'
  );
  for (const el of Array.from(candidates)) {
    const text = (el.textContent || '').trim();
    if (text && text.length > 20) return text;
  }
  throw new Error('No generic editor text');
}

function tryExtractFromTextareas(): string {
  const textareas = document.querySelectorAll('textarea');
  for (const ta of Array.from(textareas)) {
    const val = (ta as HTMLTextAreaElement).value;
    if (val && val.trim().length > 10) return val;
  }
  throw new Error('No textarea with code');
}

export function extractProblemMeta() {
  const slugMatch = window.location.href.match(/\/problems\/([^\/]+)/);
  const slug = slugMatch ? slugMatch[1] : 'unknown';
  const titleSelectors = ['[data-cy="question-title"]', '.question-title', 'h1', '.css-v3d350'];
  let title = document.title.replace(' - LeetCode', '');
  for (const sel of titleSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim()) {
      title = el.textContent.trim();
      break;
    }
  }
  const langSelectors = ['[data-cy="lang-select"] .ant-select-selection-item', '.language-select .selected', '.editor-language'];
  let language = 'python';
  for (const sel of langSelectors) {
    const el = document.querySelector(sel);
    if (el?.textContent?.trim()) {
      language = el.textContent.trim().toLowerCase();
      break;
    }
  }
  return { slug, title, language };
}
