export interface SubmissionPayload {
  slug: string
  code: string
  language: string
  problemTitle: string
  submissionStatus: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'unknown'
}

export interface PlatformAdapter {
  isOnProblemPage(): boolean
  detectAccepted(callback: (payload: SubmissionPayload) => void): () => void
  snapshotCodeAndMeta(): Promise<{ code: string; slug: string; language: string; title: string }>
}

// Utilities to extract LeetCode code and metadata
async function extractMonacoCode(): Promise<string | null> {
  // @ts-ignore
  const monaco = (window as any).monaco
  if (!monaco?.editor) return null
  const editors = monaco.editor.getEditors?.() || []
  for (const ed of editors) {
    const model = ed.getModel?.()
    const value = model?.getValue?.()
    if (value && value.trim().length > 10) return value
  }
  return null
}

function extractSlug(): string {
  const m = window.location.href.match(/\/problems\/([^\/]+)/)
  return m ? m[1] : 'unknown'
}

function extractTitle(): string {
  const selectors = ['[data-cy="question-title"]', '.question-title', 'h1']
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    const t = el?.textContent?.trim()
    if (t) return t
  }
  return document.title.replace(' - LeetCode', '')
}

function extractLanguage(): string {
  const selectors = [
    '[data-cy="lang-select"] .ant-select-selection-item',
    '.language-select .selected',
    '.editor-language',
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    const t = el?.textContent?.trim()
    if (t) return t.toLowerCase()
  }
  return 'python'
}

async function extractCurrentCode(): Promise<string> {
  const fromMonaco = await extractMonacoCode()
  if (fromMonaco) return fromMonaco
  // Fallbacks
  const cm = document.querySelector('.CodeMirror') as any
  if (cm?.CodeMirror) return cm.CodeMirror.getValue()
  const ta = Array.from(document.querySelectorAll('textarea')) as HTMLTextAreaElement[]
  for (const t of ta) if (t.value?.trim()) return t.value
  throw new Error('Cannot extract code')
}

export class LeetCodeAdapter implements PlatformAdapter {
  isOnProblemPage(): boolean {
    return window.location.href.includes('leetcode.com/problems/')
  }

  async snapshotCodeAndMeta(): Promise<{ code: string; slug: string; language: string; title: string }> {
    const code = await extractCurrentCode()
    return { code, slug: extractSlug(), language: extractLanguage(), title: extractTitle() }
  }

  detectAccepted(callback: (payload: SubmissionPayload) => void): () => void {
    const observer = new MutationObserver(async (mutations) => {
      let accepted = false
      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          for (const node of Array.from(m.addedNodes)) {
            const text = (node as HTMLElement)?.textContent || ''
            if (text.includes('Accepted') || text.includes('Success')) {
              accepted = true
            }
          }
        }
      }
      if (accepted) {
        try {
          const { code, slug, language, title } = await this.snapshotCodeAndMeta()
          callback({
            slug,
            code,
            language,
            problemTitle: title,
            submissionStatus: 'accepted',
          })
        } catch {
          // ignore
        }
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }
}


