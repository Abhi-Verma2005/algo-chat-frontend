import type { PlatformAdapter, SubmissionPayload } from './leetcode'

async function extractMonacoCode(): Promise<string | null> {
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

async function extractAceCode(): Promise<string | null> {
  const ace = (window as any).ace
  if (!ace) return null
  const editors = Array.from(document.querySelectorAll('.ace_editor')) as HTMLElement[]
  for (const el of editors) {
    try {
      const editor = ace.edit(el)
      const val = editor?.getValue?.()
      if (val && val.trim().length > 10) return val
    } catch {}
  }
  return null
}

async function extractCurrentCode(): Promise<string> {
  const fromMonaco = await extractMonacoCode()
  if (fromMonaco) return fromMonaco
  const fromAce = await extractAceCode()
  if (fromAce) return fromAce
  const ta = Array.from(document.querySelectorAll('textarea')) as HTMLTextAreaElement[]
  for (const t of ta) if (t.value?.trim()) return t.value
  throw new Error('Cannot extract code')
}

function extractSlug(): string {
  const url = new URL(window.location.href)
  const parts = url.pathname.split('/').filter(Boolean)
  // common patterns: /problems/SLUG, /submit/SLUG, /practice/SLUG, contests also include /problems/SLUG
  const idx = parts.findIndex((p) => ['problems', 'submit', 'practice'].includes(p.toLowerCase()))
  if (idx >= 0 && parts[idx + 1]) return parts[idx + 1]
  // fall back to last segment
  return parts[parts.length - 1] || 'unknown'
}

function extractTitle(): string {
  const selectors = [
    'h1',
    'h1.problem-title',
    '[data-testid="problem-title"]',
    '.problem-statement h1',
  ]
  for (const sel of selectors) {
    const el = document.querySelector(sel)
    const t = el?.textContent?.trim()
    if (t) return t
  }
  return document.title.replace(' | CodeChef', '')
}

function extractLanguage(): string {
  const sel =
    (document.querySelector('select[name="language"]') as HTMLSelectElement | null) ||
    (document.querySelector('#language') as HTMLSelectElement | null)
  if (sel) {
    const opt = sel.options[sel.selectedIndex]
    const t = (opt?.text || opt?.value || '').trim().toLowerCase()
    if (t) return t
  }
  const fallback = document.querySelector('[data-testid*="language"]') as HTMLElement | null
  const t = fallback?.textContent?.trim()?.toLowerCase()
  if (t) return t
  return 'cpp'
}

export class CodeChefAdapter implements PlatformAdapter {
  isOnProblemPage(): boolean {
    const href = window.location.href
    return href.includes('codechef.com') && /\/(problems|submit|practice)\//.test(href)
  }

  async snapshotCodeAndMeta(): Promise<{ code: string; slug: string; language: string; title: string }> {
    const code = await extractCurrentCode()
    return { code, slug: extractSlug(), language: extractLanguage(), title: extractTitle() }
  }

  detectAccepted(callback: (payload: SubmissionPayload) => void): () => void {
    let cooldown = false
    const markCooldown = () => {
      cooldown = true
      setTimeout(() => (cooldown = false), 3000)
    }

    const observer = new MutationObserver(async (mutations) => {
      if (cooldown) return
      let status: SubmissionPayload['submissionStatus'] | null = null

      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          for (const node of Array.from(m.addedNodes)) {
            const text = ((node as HTMLElement)?.textContent || '').toLowerCase()
            if (!text || text.length < 2) continue
            if (text.includes('accepted') || /\b(ac)\b/.test(text)) status = 'accepted'
            else if (text.includes('wrong answer') || /\b(wa)\b/.test(text)) status = 'wrong_answer'
            else if (text.includes('time limit') || /\b(tle)\b/.test(text)) status = 'time_limit'
            else if (text.includes('runtime error') || /\b(re)\b/.test(text)) status = 'runtime_error'
          }
        }
      }

      if (status) {
        try {
          const { code, slug, language, title } = await this.snapshotCodeAndMeta()
          callback({ slug, code, language, problemTitle: title, submissionStatus: status })
        } catch {}
        markCooldown()
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }
}
