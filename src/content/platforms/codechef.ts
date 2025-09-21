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
  // Common CodeChef form fields and generic textareas
  const candidates: string[] = []
  const selectors = [
    'textarea[name="program"]',
    'textarea[name="source"]',
    'textarea[name="content"]',
    'textarea[id="program"]',
    'textarea[id="source"]',
    '#edit-program',
    'form[action*="/submit"] textarea',
    'textarea'
  ]
  for (const sel of selectors) {
    const nodes = Array.from(document.querySelectorAll(sel)) as HTMLTextAreaElement[]
    for (const n of nodes) {
      const v = n?.value || ''
      if (typeof v === 'string' && v.trim().length > 0) candidates.push(v)
    }
  }
  if (candidates.length > 0) {
    // Pick the longest snippet assuming it's the active code
    candidates.sort((a, b) => b.length - a.length)
    return candidates[0]
  }
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

    const parseStatus = (raw: string): SubmissionPayload['submissionStatus'] | null => {
      const text = raw?.toLowerCase() || ''
      if (!text || text.length < 2) return null
      // Only treat fully accepted as accepted. Partially accepted is not accepted.
      if (text.includes('accepted') || /\b(ac)\b/.test(text)) {
        if (text.includes('partially')) {
          return 'wrong_answer'
        }
        return 'accepted'
      }
      if (text.includes('all test files passed')) return 'accepted'
      if (text.includes('correct answer')) return 'accepted'
      if (text.includes('submission successful')) return 'accepted'
      if (text.includes('wrong answer') || /\b(wa)\b/.test(text)) return 'wrong_answer'
      if (text.includes('time limit') || /\b(tle)\b/.test(text)) return 'time_limit'
      if (text.includes('runtime error') || /\b(re)\b/.test(text)) return 'runtime_error'
      if (text.includes('compile error') || text.includes('compilation error') || /\b(ce)\b/.test(text)) return 'runtime_error'
      return null
    }

    // Fallback polling after user clicks Submit button
    const startResultPolling = () => {
      if (cooldown) return
      const startedAt = Date.now()
      const limitMs = 25000
      const interval = setInterval(() => {
        const elapsed = Date.now() - startedAt
        if (elapsed > limitMs) {
          clearInterval(interval)
          return
        }
        // Probe common status containers
        const nodes = [
          ...Array.from(document.querySelectorAll('[class*="status" i]')),
          ...Array.from(document.querySelectorAll('[class*="verdict" i]')),
          ...Array.from(document.querySelectorAll('.result, .submission-status, #result, #status')),
        ] as HTMLElement[]
        for (const n of nodes) {
          const status = parseStatus(n?.textContent || '')
          if (status === 'accepted') {
            clearInterval(interval)
            ;(async () => {
              try {
                const snap = await this.snapshotCodeAndMeta()
                if (snap.code && snap.code.trim().length > 10) {
                  callback({ slug: snap.slug, code: snap.code, language: snap.language, problemTitle: snap.title, submissionStatus: 'accepted' })
                  try { console.log('[CodeChefAdapter] Polling ACCEPTED submission:', { slug: snap.slug, language: snap.language, codeLen: snap.code.length }) } catch {}
                  markCooldown()
                }
              } catch {}
            })()
            return
          }
        }
      }, 800)
    }

    // Attach click listeners to submit buttons/forms
    const hookSubmitButtons = () => {
      const candidates: HTMLElement[] = [
        ...Array.from(document.querySelectorAll('button, input[type="submit"], a')) as HTMLElement[],
      ]
      candidates.forEach((el) => {
        const text = (el.textContent || '').trim().toLowerCase()
        const isSubmitLike =
          (el as HTMLButtonElement).type === 'submit' ||
          text === 'submit' ||
          text.includes('submit solution')
        if (isSubmitLike && !(el as any).__ccHooked) {
          ;(el as any).__ccHooked = true
          el.addEventListener('click', () => {
            try { console.log('[CodeChefAdapter] Submit clicked, starting result polling') } catch {}
            startResultPolling()
          })
        }
      })
    }
    try { hookSubmitButtons() } catch {}

    const observer = new MutationObserver(async (mutations) => {
      if (cooldown) return
      try { hookSubmitButtons() } catch {}
      let status: SubmissionPayload['submissionStatus'] | null = null

      for (const m of mutations) {
        if (m.type === 'childList' && m.addedNodes.length > 0) {
          for (const node of Array.from(m.addedNodes)) {
            const txt = ((node as HTMLElement)?.textContent || '').toLowerCase()
            status = parseStatus(txt) || status
          }
        } else if (m.type === 'characterData') {
          const txt = (m.target as CharacterData).data || ''
          status = parseStatus(txt) || status
        } else if (m.type === 'attributes') {
          const el = m.target as HTMLElement
          const txt = el?.textContent || ''
          status = parseStatus(txt) || status
        }
      }

      if (status === 'accepted') {
        try {
          let code = ''
          let slug = ''
          let language = ''
          let title = ''
          try {
            const snap = await this.snapshotCodeAndMeta()
            code = snap.code
            slug = snap.slug
            language = snap.language
            title = snap.title
          } catch (e) {
            // Fallback to stored snapshot if direct extraction failed
            try {
              const stored: any = await (chrome as any).storage?.local?.get?.([
                '__codechef_code_snapshot__',
                '__codechef_problem_meta__',
              ])
              code = stored?.__codechef_code_snapshot__ || ''
              slug = stored?.__codechef_problem_meta__?.slug || extractSlug()
              language = stored?.__codechef_problem_meta__?.language || extractLanguage()
              title = stored?.__codechef_problem_meta__?.title || extractTitle()
            } catch {}
          }

          // Only submit if we have non-trivial code
          if (code && code.trim().length > 10) {
            callback({ slug, code, language, problemTitle: title, submissionStatus: status })
            try { console.log('[CodeChefAdapter] Detected ACCEPTED submission:', { slug, status, language, codeLen: code?.length || 0 }) } catch {}
          } else {
            try { console.warn('[CodeChefAdapter] Skipping submission: empty/short code for slug', slug) } catch {}
          }
        } catch {}
        markCooldown()
      }
    })

    // Observe entire body; CodeChef updates verdict in various containers
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true })
    return () => observer.disconnect()
  }
}
