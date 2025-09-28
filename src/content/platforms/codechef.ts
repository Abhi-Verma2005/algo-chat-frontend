import type { PlatformAdapter, SubmissionPayload } from './leetcode'

async function extractMonacoCode(): Promise<string | null> {
  console.log(" inside before extract monaco code...................")
  const monaco = (window as any).monaco
  if (!monaco?.editor) return null

  // Function to check if content is source code vs output
  const isSourceCode = (content: string): boolean => {
    const trimmed = content.trim().toLowerCase()
    // Look for programming language keywords
    const sourceKeywords = [
      'def ',
      'class ',
      'import ',
      'function',
      'if ',
      'for ',
      'while ',
      'var ',
      'let ',
      'const ',
    ]
    const hasKeywords = sourceKeywords.some((keyword) =>
      trimmed.includes(keyword)
    )

    // Avoid pure numeric output
    const isNumericOutput =
      /^\d+(\s+\d+)*$/.test(trimmed) || /^\d+(\n\d+)*$/.test(trimmed)

    return hasKeywords || (!isNumericOutput && content.length > 20)
  }

  // Get all Monaco editors and prioritize those with source code
  const editors = monaco.editor.getEditors?.() || []
  const codeEditors = []

  for (const ed of editors) {
    const model = ed.getModel?.()
    const value = model?.getValue?.()
    if (value && value.trim().length > 10) {
      const priority = isSourceCode(value) ? 2 : 1
      codeEditors.push({ editor: ed, value, priority })
      try {
        console.log(
          '[CodeChef] Monaco editor found:',
          value.length,
          'chars, source code:',
          isSourceCode(value)
        )
      } catch {}
    }
  }

  // Sort by priority (source code first)
  codeEditors.sort((a, b) => b.priority - a.priority)

  if (codeEditors.length > 0) {
    const selected = codeEditors[0]
    try {
      console.log(
        '[CodeChef] Extracted Monaco code (priority:',
        selected.priority,
        '):',
        selected.value.length,
        'chars'
      )
    } catch {}
    return selected.value
  }

  // Fallback: try to find Monaco models directly
  try {
    const models = monaco.editor.getModels?.() || []
    for (const model of models) {
      const value = model.getValue?.()
      if (value && value.trim().length > 10 && isSourceCode(value)) {
        try {
          console.log(
            '[CodeChef] Extracted Monaco model code:',
            value.length,
            'chars'
          )
        } catch {}
        return value
      }
    }
  } catch {}

  return null
}

async function extractAceCode(): Promise<string | null> {
  console.log("inside before extract ace code...................------>")
  const ace = (window as any).ace
  console.log("acceeee hai????----->>>>>>>", ace)
  if (!ace) return null

  // Function to check if content is source code vs output
  // const isSourceCode = (content: string): boolean => {
  //   const trimmed = content.trim().toLowerCase()
  //   const sourceKeywords = ['def ', 'class ', 'import ', 'function', 'if ', 'for ', 'while ', 'var ', 'let ', 'const ']
  //   const hasKeywords = sourceKeywords.some(keyword => trimmed.includes(keyword))
  //   const isNumericOutput = /^\d+(\s+\d+)*$/.test(trimmed) || /^\d+(\n\d+)*$/.test(trimmed)
  //   return hasKeywords || (!isNumericOutput && content.length > 20)
  // }

  // Try to get all Ace editors
  // const editors = Array.from(document.querySelectorAll('.ace_editor')) as HTMLElement[]
  // const codeEditors = []

  // for (const el of editors) {
  //   try {
  //     const editor = ace.edit(el)
  //     const val = editor?.getValue?.()
  //     if (val && val.trim().length > 1) {
  //       const priority = isSourceCode(val) ? 2 : 1
  //       codeEditors.push({ element: el, value: val, priority })
  //       try {
  //         console.log('[CodeChef] Ace editor found:', val.length, 'chars, source code:', isSourceCode(val))
  //       } catch {}
  //     }
  //   } catch {}
  // }

  // Sort by priority (source code first)
  // codeEditors.sort((a, b) => b.priority - a.priority)

  // if (codeEditors.length > 0) {
  //   const selected = codeEditors[0]
  //   try {
  //     console.log('[CodeChef] Extracted Ace code (priority:', selected.priority, '):', selected.value.length, 'chars')
  //   } catch {}
  //   return selected.value
  // }

  // Fallback: try ace.edit without element
  // try {
  //   const editor = ace.edit('code-editor') // Common CodeChef editor ID
  //   const val = editor?.getValue?.()
  //   if (val && val.trim().length > 10 && isSourceCode(val)) {
  //     try { console.log('[CodeChef] Extracted Ace code via ID:', val.length, 'chars') } catch {}
  //     return val
  //   }
  // } catch {}
  console.log("----------->",ace
    .edit(
      Array.from(document.querySelectorAll('.ace_editor')).find((el) => {
        return (
          el?.previousSibling &&
          ((el?.previousSibling as any).classList as any).contains(
            'MuiBackdrop-root'
          )
        )
      })
    )
    .getValue())

  return ace
    .edit(
      Array.from(document.querySelectorAll('.ace_editor')).find((el) => {
        return (
          el?.previousSibling &&
          ((el?.previousSibling as any).classList as any).contains(
            'MuiBackdrop-root'
          )
        )
      })
    )
    .getValue()
}

async function extractCodeMirrorCode(): Promise<string | null> {
  // Function to check if content is source code vs output
  const isSourceCode = (content: string): boolean => {
    const trimmed = content.trim().toLowerCase()
    const sourceKeywords = [
      'def ',
      'class ',
      'import ',
      'function',
      'if ',
      'for ',
      'while ',
      'var ',
      'let ',
      'const ',
    ]
    const hasKeywords = sourceKeywords.some((keyword) =>
      trimmed.includes(keyword)
    )
    const isNumericOutput =
      /^\d+(\s+\d+)*$/.test(trimmed) || /^\d+(\n\d+)*$/.test(trimmed)
    return hasKeywords || (!isNumericOutput && content.length > 20)
  }

  // CodeMirror detection
  const cmElements = Array.from(
    document.querySelectorAll('.CodeMirror')
  ) as any[]
  const codeEditors = []

  for (const cm of cmElements) {
    try {
      if (cm.CodeMirror) {
        const value = cm.CodeMirror.getValue()
        if (value && value.trim().length > 10) {
          const priority = isSourceCode(value) ? 2 : 1
          codeEditors.push({ element: cm, value, priority })
          try {
            console.log(
              '[CodeChef] CodeMirror found:',
              value.length,
              'chars, source code:',
              isSourceCode(value)
            )
          } catch {}
        }
      }
    } catch {}
  }

  // Sort by priority (source code first)
  codeEditors.sort((a, b) => b.priority - a.priority)

  if (codeEditors.length > 0) {
    const selected = codeEditors[0]
    try {
      console.log(
        '[CodeChef] Extracted CodeMirror code (priority:',
        selected.priority,
        '):',
        selected.value.length,
        'chars'
      )
    } catch {}
    return selected.value
  }

  // Global CodeMirror instances
  try {
    const CodeMirror = (window as any).CodeMirror
    if (CodeMirror && CodeMirror.instances) {
      for (const instance of CodeMirror.instances) {
        const value = instance.getValue?.()
        if (value && value.trim().length > 10 && isSourceCode(value)) {
          try {
            console.log(
              '[CodeChef] Extracted global CodeMirror code:',
              value.length,
              'chars'
            )
          } catch {}
          return value
        }
      }
    }
  } catch {}

  return null
}

async function extractCurrentCode(): Promise<string> {
  try {
    console.log('[CodeChef] Starting code extraction...')
  } catch {}

  // Try Monaco editor first (most reliable)
  console.log("before extract monaco code...................")
  const fromMonaco = await extractMonacoCode()
  if (fromMonaco) {
    try {
      console.log('[CodeChef] Successfully extracted from Monaco')
    } catch {}
    return fromMonaco
  }

  // Try Ace editor
  console.log("before extract ace code...................")
  const fromAce = await extractAceCode()
  console.log("after calling ace here is the response:------",fromAce)
  if (fromAce) {
    try {
      console.log('[CodeChef] Successfully extracted from Ace')
    } catch {}
    return fromAce
  }

  // Try CodeMirror
  const fromCodeMirror = await extractCodeMirrorCode()
  if (fromCodeMirror) {
    try {
      console.log('[CodeChef] Successfully extracted from CodeMirror')
    } catch {}
    return fromCodeMirror
  }

  // Enhanced textarea detection with priority-based selection and source code filtering
  const candidates: {
    value: string
    priority: number
    source: string
    isSourceCode: boolean
  }[] = []

  // High priority selectors (specific to CodeChef source code)
  const highPrioritySelectors = [
    'textarea[name="program"]',
    'textarea[name="source"]',
    'textarea[id="program"]',
    'textarea[id="source"]',
    '#edit-program',
    '#source-editor',
    '.editor-textarea',
    'form[action*="/submit"] textarea',
  ]

  // Medium priority selectors (common coding platforms)
  const mediumPrioritySelectors = [
    'textarea[name="content"]',
    'textarea[id="content"]',
    'textarea.code-input',
    'textarea.source-code',
    'div[contenteditable="true"]', // Rich text editors
  ]

  // Low priority (generic, but filtered for source code)
  const lowPrioritySelectors = ['textarea']

  // Output/result selectors to avoid (these contain execution results, not source code)
  const outputSelectors = [
    '.output',
    '.result',
    '.execution-result',
    '#output',
    '#result',
    '.console-output',
    '.program-output',
    '.test-output',
    '[class*="output"]',
    '[id*="output"]',
    '[class*="result"]',
  ]

  // Function to determine if content looks like source code vs output
  const isLikelySourceCode = (content: string): boolean => {
    const lines = content.split('\n')
    const trimmedContent = content.trim().toLowerCase()

    // Check for obvious source code patterns
    const sourceCodeIndicators = [
      'def ',
      'class ',
      'import ',
      'from ',
      'if ',
      'for ',
      'while ',
      'function',
      'var ',
      'let ',
      'const ',
      'public class',
      '#include',
      '<?php',
      'package ',
      'using ',
      'namespace ',
    ]

    const hasSourceCodePattern = sourceCodeIndicators.some((indicator) =>
      trimmedContent.includes(indicator)
    )

    // Check for obvious output patterns (numbers only, simple results)
    const looksLikeOutput =
      /^\d+(\s+\d+)*$/.test(trimmedContent) || // Only numbers with spaces
      /^\d+(\n\d+)*$/.test(trimmedContent) || // Only numbers with newlines
      (lines.length < 3 && /^[\d\s\n]+$/.test(trimmedContent)) || // Short numeric output
      trimmedContent.includes('test case') ||
      trimmedContent.includes('expected') ||
      trimmedContent.includes('actual')

    // Prefer source code indicators, avoid output patterns
    if (hasSourceCodePattern) return true
    if (looksLikeOutput) return false

    // For ambiguous content, prefer longer, more complex content
    return content.length > 20 && lines.length > 2
  }

  // Collect high priority candidates
  for (const sel of highPrioritySelectors) {
    const nodes = Array.from(document.querySelectorAll(sel))
    for (const node of nodes) {
      const value =
        (node as HTMLTextAreaElement | HTMLElement).textContent ||
        (node as HTMLTextAreaElement).value ||
        ''
      if (value.trim().length > 5) {
        const isSourceCode = isLikelySourceCode(value)
        candidates.push({
          value: value.trim(),
          priority: isSourceCode ? 4 : 3, // Boost priority for actual source code
          source: sel,
          isSourceCode,
        })
        try {
          console.log(
            '[CodeChef] High priority candidate:',
            sel,
            'Length:',
            value.length,
            'Source code:',
            isSourceCode
          )
        } catch {}
      }
    }
  }

  // Collect medium priority candidates
  for (const sel of mediumPrioritySelectors) {
    const nodes = Array.from(document.querySelectorAll(sel))
    for (const node of nodes) {
      const value =
        (node as HTMLTextAreaElement | HTMLElement).textContent ||
        (node as HTMLTextAreaElement).value ||
        ''
      if (value.trim().length > 5) {
        const isSourceCode = isLikelySourceCode(value)
        candidates.push({
          value: value.trim(),
          priority: isSourceCode ? 3 : 2,
          source: sel,
          isSourceCode,
        })
        try {
          console.log(
            '[CodeChef] Medium priority candidate:',
            sel,
            'Length:',
            value.length,
            'Source code:',
            isSourceCode
          )
        } catch {}
      }
    }
  }

  // Collect low priority candidates only if no high/medium priority found
  if (candidates.length === 0) {
    for (const sel of lowPrioritySelectors) {
      const nodes = Array.from(document.querySelectorAll(sel))
      for (const node of nodes) {
        // Skip nodes that are clearly output containers
        const isOutputNode = outputSelectors.some((outputSel) => {
          try {
            return node.matches && node.matches(outputSel)
          } catch {
            return false
          }
        })

        if (isOutputNode) {
          try {
            console.log('[CodeChef] Skipping output node:', sel)
          } catch {}
          continue
        }

        const value = (node as HTMLTextAreaElement).value || ''
        if (value.trim().length > 10) {
          // Higher threshold for generic selectors
          const isSourceCode = isLikelySourceCode(value)
          // Only include if it looks like source code
          if (isSourceCode) {
            candidates.push({
              value: value.trim(),
              priority: 2,
              source: sel,
              isSourceCode: true,
            })
            try {
              console.log(
                '[CodeChef] Low priority candidate (source code):',
                sel,
                'Length:',
                value.length
              )
            } catch {}
          } else {
            try {
              console.log(
                '[CodeChef] Rejected low priority candidate (looks like output):',
                sel,
                'Content preview:',
                value.substring(0, 50)
              )
            } catch {}
          }
        }
      }
    }
  }

  if (candidates.length > 0) {
    // Sort by priority first (source code gets boosted priority), then by length
    candidates.sort((a, b) => {
      // Prioritize actual source code
      if (a.isSourceCode !== b.isSourceCode) {
        return b.isSourceCode ? 1 : -1
      }
      // Then by priority
      if (a.priority !== b.priority) {
        return b.priority - a.priority
      }
      // Finally by length
      return b.value.length - a.value.length
    })

    const selected = candidates[0]
    try {
      console.log(
        '[CodeChef] Selected code from:',
        selected.source,
        'Length:',
        selected.value.length,
        'Priority:',
        selected.priority,
        'Is source code:',
        selected.isSourceCode,
        'Preview:',
        selected.value.substring(0, 100).replace(/\n/g, '\\n')
      )
    } catch {}

    return selected.value
  }

  // Final fallback: check for any non-empty input/textarea elements
  const allInputs = Array.from(
    document.querySelectorAll(
      'input[type="text"], textarea, div[contenteditable]'
    )
  )
  for (const input of allInputs) {
    const value =
      (input as HTMLInputElement | HTMLTextAreaElement).value ||
      (input as HTMLElement).textContent ||
      ''
    if (value.trim().length > 20) {
      // Even higher threshold for final fallback
      try {
        console.log(
          '[CodeChef] Fallback extraction from:',
          input.tagName,
          value.length,
          'chars'
        )
      } catch {}
      return value.trim()
    }
  }

  throw new Error('Cannot extract code from any source')
}

function extractSlug(): string {
  try {
    console.log('[CodeChef] Extracting slug from URL:', window.location.href)
  } catch {}

  const url = new URL(window.location.href)
  const parts = url.pathname.split('/').filter(Boolean)

  // Enhanced patterns for CodeChef URLs
  const patterns = [
    // Direct problem patterns
    { keywords: ['problems'], offset: 1 }, // /problems/SLUG
    { keywords: ['submit'], offset: 1 }, // /submit/SLUG
    { keywords: ['practice'], offset: 1 }, // /practice/SLUG

    // Contest patterns
    { keywords: ['contests'], offset: 2 }, // /contests/CONTEST/problems/SLUG
    { keywords: ['challenge'], offset: 1 }, // /challenge/SLUG

    // IDE patterns
    { keywords: ['ide'], offset: 0 }, // /ide (check URL params)
    { keywords: ['playground'], offset: 0 }, // /playground (check URL params)
  ]

  // Try pattern matching first
  for (const { keywords, offset } of patterns) {
    for (const keyword of keywords) {
      const idx = parts.findIndex((p) => p.toLowerCase() === keyword)
      if (idx >= 0) {
        if (offset === 0) {
          // Check URL parameters for problem slug
          const problemParam =
            url.searchParams.get('problem') ||
            url.searchParams.get('problemCode') ||
            url.searchParams.get('slug')
          if (problemParam) {
            try {
              console.log(
                '[CodeChef] Extracted slug from URL params:',
                problemParam
              )
            } catch {}
            return problemParam
          }
        } else if (parts[idx + offset]) {
          const slug = parts[idx + offset]
          try {
            console.log('[CodeChef] Extracted slug from path:', slug)
          } catch {}
          return slug
        }
      }
    }
  }

  // Fallback: try to get from page content
  try {
    const metaElements = Array.from(
      document.querySelectorAll(
        'meta[name*="problem"], meta[property*="problem"]'
      )
    )
    for (const meta of metaElements) {
      const content = meta.getAttribute('content')
      if (content && content.length > 0 && content.length < 50) {
        try {
          console.log('[CodeChef] Extracted slug from meta:', content)
        } catch {}
        return content
      }
    }
  } catch {}

  // Final fallback: last URL segment
  const lastSegment = parts[parts.length - 1] || 'unknown'
  try {
    console.log('[CodeChef] Using last URL segment as slug:', lastSegment)
  } catch {}
  return lastSegment
}

function extractTitle(): string {
  try {
    console.log('[CodeChef] Extracting problem title...')
  } catch {}

  const selectors = [
    // High priority: specific problem title selectors
    'h1.problem-title',
    '.problem-title h1',
    '.problem-statement h1',
    '#problem-title',
    '.title h1',

    // Medium priority: common heading patterns
    '[data-testid="problem-title"]',
    '.problem-heading',
    '.challenge-title',
    '.contest-problem-title',

    // Lower priority: generic headings
    'h1',
    'h2.title',
    '.main-title',
  ]

  for (const sel of selectors) {
    try {
      const el = document.querySelector(sel)
      const title = el?.textContent?.trim()
      if (title && title.length > 0 && title.length < 200) {
        // Clean up common prefixes/suffixes
        const cleanTitle = title
          .replace(/^\d+\.\s*/, '') // Remove leading numbers like "1. "
          .replace(/\s*\|\s*CodeChef$/, '') // Remove " | CodeChef" suffix
          .replace(/\s*-\s*CodeChef$/, '') // Remove " - CodeChef" suffix
          .replace(/Problem\s*:\s*/i, '') // Remove "Problem: " prefix
          .trim()

        if (cleanTitle.length > 0) {
          try {
            console.log(
              '[CodeChef] Extracted title:',
              cleanTitle,
              'from selector:',
              sel
            )
          } catch {}
          return cleanTitle
        }
      }
    } catch {}
  }

  // Fallback: extract from page title
  const pageTitle = document.title
    .replace(/\s*\|\s*CodeChef$/, '')
    .replace(/\s*-\s*CodeChef$/, '')
    .replace(/CodeChef\s*\|\s*/, '')
    .trim()

  if (pageTitle && pageTitle.length > 0) {
    try {
      console.log('[CodeChef] Extracted title from page title:', pageTitle)
    } catch {}
    return pageTitle
  }

  // Final fallback: use slug as title
  const slug = extractSlug()
  const titleFromSlug = slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase())
  try {
    console.log('[CodeChef] Generated title from slug:', titleFromSlug)
  } catch {}
  return titleFromSlug
}

function extractLanguage(): string {
  try {
    console.log('[CodeChef] Starting language detection...')
  } catch {}

  // Priority-based language detection
  const selectors = [
    // Highest priority: explicit language selectors
    { selector: 'select[name="language"]', priority: 5 },
    { selector: '#language', priority: 5 },
    { selector: '.language-select select', priority: 4 },
    { selector: '[data-testid*="language"] select', priority: 4 },

    // Medium priority: language display elements
    { selector: '.selected-language', priority: 3 },
    { selector: '.current-language', priority: 3 },
    { selector: '[data-testid*="language"]', priority: 2 },
    { selector: '.language-label', priority: 2 },

    // Lower priority: generic elements that might contain language info
    { selector: '.editor-language', priority: 1 },
    { selector: '.lang-info', priority: 1 },
  ]

  for (const { selector, priority } of selectors) {
    try {
      const element = document.querySelector(selector) as
        | HTMLSelectElement
        | HTMLElement
        | null

      if (element) {
        let languageText = ''

        // Handle select elements specially
        if (element.tagName === 'SELECT') {
          const selectEl = element as HTMLSelectElement
          const selectedOption = selectEl.options[selectEl.selectedIndex]
          languageText = selectedOption?.text || selectedOption?.value || ''
        } else {
          // Handle regular elements
          languageText =
            element.textContent?.trim() ||
            element.getAttribute('data-language') ||
            ''
        }

        if (languageText) {
          const normalizedLang = normalizeLanguageName(languageText)
          if (normalizedLang !== 'unknown') {
            try {
              console.log(
                '[CodeChef] Detected language:',
                normalizedLang,
                'from selector:',
                selector,
                'priority:',
                priority
              )
            } catch {}
            return normalizedLang
          }
        }
      }
    } catch (e) {
      try {
        console.warn('[CodeChef] Error checking selector:', selector, e)
      } catch {}
    }
  }

  // Fallback: try to detect from URL parameters
  try {
    const urlParams = new URLSearchParams(window.location.search)
    const langParam = urlParams.get('language') || urlParams.get('lang')
    if (langParam) {
      const normalizedLang = normalizeLanguageName(langParam)
      if (normalizedLang !== 'unknown') {
        try {
          console.log('[CodeChef] Detected language from URL:', normalizedLang)
        } catch {}
        return normalizedLang
      }
    }
  } catch {}

  // Fallback: try to detect from page content
  try {
    const pageText = document.body.textContent?.toLowerCase() || ''
    const languageIndicators = [
      { keywords: ['python', 'py'], lang: 'python' },
      { keywords: ['java'], lang: 'java' },
      { keywords: ['c++', 'cpp', 'g++'], lang: 'cpp' },
      { keywords: ['javascript', 'js', 'node'], lang: 'javascript' },
      { keywords: ['c#', 'csharp'], lang: 'csharp' },
      { keywords: ['golang', 'go'], lang: 'go' },
    ]

    for (const { keywords, lang } of languageIndicators) {
      if (keywords.some((keyword) => pageText.includes(keyword))) {
        try {
          console.log('[CodeChef] Detected language from page content:', lang)
        } catch {}
        return lang
      }
    }
  } catch {}

  // Final fallback
  try {
    console.log('[CodeChef] Using default language: cpp')
  } catch {}
  return 'cpp'
}

function normalizeLanguageName(rawLanguage: string): string {
  const lang = rawLanguage.toLowerCase().trim()

  // Common language mappings
  const mappings: { [key: string]: string } = {
    // Python variants
    python: 'python',
    python3: 'python',
    py: 'python',
    'python 3': 'python',
    'python3.8': 'python',
    'python3.9': 'python',

    // Java variants
    java: 'java',
    java8: 'java',
    'java 8': 'java',
    java11: 'java',
    'java 11': 'java',

    // C++ variants
    'c++': 'cpp',
    cpp: 'cpp',
    'c++14': 'cpp',
    'c++17': 'cpp',
    'c++20': 'cpp',
    'g++': 'cpp',
    gcc: 'cpp',
    'gnu c++': 'cpp',

    // C variants
    c: 'c',
    'gcc c': 'c',
    'gnu c': 'c',

    // JavaScript variants
    javascript: 'javascript',
    js: 'javascript',
    'node.js': 'javascript',
    nodejs: 'javascript',
    node: 'javascript',

    // Other languages
    'c#': 'csharp',
    csharp: 'csharp',
    'c sharp': 'csharp',
    go: 'go',
    golang: 'go',
    rust: 'rust',
    php: 'php',
    ruby: 'ruby',
    swift: 'swift',
    kotlin: 'kotlin',
    scala: 'scala',
    typescript: 'typescript',
    ts: 'typescript',
  }

  // Direct match
  if (mappings[lang]) {
    return mappings[lang]
  }

  // Partial match
  for (const [key, value] of Object.entries(mappings)) {
    if (lang.includes(key) || key.includes(lang)) {
      return value
    }
  }

  return 'unknown'
}

export class CodeChefAdapter implements PlatformAdapter {
  isOnProblemPage(): boolean {
    const href = window.location.href
    return (
      href.includes('codechef.com') &&
      /\/(problems|submit|practice)\//.test(href)
    )
  }

  async snapshotCodeAndMeta(): Promise<{
    code: string
    slug: string
    language: string
    title: string
  }> {
    console.log("before extract code...................")
    const code = await extractCurrentCode()
    console.log("after extract code...................", code)
    return {
      code,
      slug: extractSlug(),
      language: extractLanguage(),
      title: extractTitle(),
    }
  }

  detectAccepted(callback: (payload: SubmissionPayload) => void): () => void {
    let cooldown = false
    let submissionCode = '' // Store code at time of submission

    const markCooldown = () => {
      cooldown = true
      setTimeout(() => (cooldown = false), 3000)
    }

    const parseStatus = (
      raw: string
    ): SubmissionPayload['submissionStatus'] | null => {
      const text = raw?.toLowerCase()?.trim() || ''
      if (!text || text.length < 2) return null

      try {
        console.log('[CodeChef] Parsing status text:', text.substring(0, 50))
      } catch {}

      // Accepted patterns (most specific first)
      const acceptedPatterns = [
        /\b(accepted|ac)\b/,
        /all test files? passed/,
        /correct answer/,
        /submission successful/,
        /solution accepted/,
        /\baccepted\b.*\d+\/\d+/, // "Accepted 15/15" pattern
        /100\s*points?/,
        /full\s*points?/,
        /perfect\s*score/,
      ]

      // Check for accepted first (but not partially accepted)
      for (const pattern of acceptedPatterns) {
        if (pattern.test(text)) {
          // Make sure it's not partially accepted
          if (text.includes('partially') || text.includes('partial')) {
            try {
              console.log(
                '[CodeChef] Found partial acceptance, treating as wrong answer'
              )
            } catch {}
            return 'wrong_answer'
          }
          try {
            console.log('[CodeChef] Found accepted submission')
          } catch {}
          return 'accepted'
        }
      }

      // Wrong answer patterns
      const wrongAnswerPatterns = [
        /\b(wrong answer|wa)\b/,
        /incorrect/,
        /failed.*test/,
        /\d+\/\d+.*passed/, // "5/10 test cases passed"
        /partially accepted/,
        /partial.*points?/,
      ]

      for (const pattern of wrongAnswerPatterns) {
        if (pattern.test(text)) {
          try {
            console.log('[CodeChef] Found wrong answer')
          } catch {}
          return 'wrong_answer'
        }
      }

      // Time limit patterns
      const timeLimitPatterns = [
        /\b(time limit|tle)\b/,
        /timeout/,
        /time.*exceed/,
        /too slow/,
      ]

      for (const pattern of timeLimitPatterns) {
        if (pattern.test(text)) {
          try {
            console.log('[CodeChef] Found time limit exceeded')
          } catch {}
          return 'time_limit'
        }
      }

      // Runtime error patterns
      const runtimeErrorPatterns = [
        /\b(runtime error|re)\b/,
        /\b(compile error|ce)\b/,
        /compilation error/,
        /segmentation fault/,
        /memory.*exceed/,
        /stack overflow/,
        /null pointer/,
        /index.*bound/,
      ]

      for (const pattern of runtimeErrorPatterns) {
        if (pattern.test(text)) {
          try {
            console.log('[CodeChef] Found runtime/compile error')
          } catch {}
          return 'runtime_error'
        }
      }

      return null
    }

    // Enhanced polling with better selectors and timing
    const startResultPolling = () => {
      if (cooldown) return

      try {
        console.log('[CodeChef] Starting result polling...')
      } catch {}
      const startedAt = Date.now()
      const limitMs = 30000 // Extended timeout
      const checkInterval = 500 // More frequent checks

      const interval = setInterval(() => {
        const elapsed = Date.now() - startedAt
        if (elapsed > limitMs) {
          try {
            console.log('[CodeChef] Polling timeout reached')
          } catch {}
          clearInterval(interval)
          return
        }

        // Enhanced selectors for CodeChef submission status
        const statusSelectors = [
          // High priority: specific result containers
          '.submission-result',
          '.verdict-container',
          '.status-container',
          '#submission-status',
          '#verdict',

          // Medium priority: common patterns
          '[class*="status" i]',
          '[class*="verdict" i]',
          '[class*="result" i]',

          // Lower priority: generic containers
          '.result',
          '.submission-status',
          '#result',
          '#status',

          // Table-based results (common in CodeChef)
          'table tr td',
          '.submission-table td',
          '.status-table td',

          // Alert/notification containers
          '.alert',
          '.notification',
          '.message',
          '.success',
          '.error',
          '.warning',
        ]

        const nodes: HTMLElement[] = []
        for (const selector of statusSelectors) {
          try {
            const elements = Array.from(
              document.querySelectorAll(selector)
            ) as HTMLElement[]
            nodes.push(...elements)
          } catch {}
        }

        // Check each node for status
        for (const node of nodes) {
          const textContent = node?.textContent?.trim() || ''
          if (textContent.length > 0) {
            const status = parseStatus(textContent)
            if (status === 'accepted') {
              try {
                console.log('[CodeChef] Found accepted status during polling')
              } catch {}
              clearInterval(interval)
              ;(async () => {
                try {
                  console.log("Processing accepted submission...------->>>>>>------", submissionCode)
                  let codeToSubmit = submissionCode // Use code captured at submit time
                  let slug = ''
                  let language = ''
                  let title = ''

                  try {
                    const snap = await this.snapshotCodeAndMeta()
                    // Use captured submission code if available and looks like source code
                    if (!codeToSubmit || codeToSubmit.trim().length < 10) {
                      codeToSubmit = snap.code
                      try {
                        console.log(
                          '[CodeChef] Using current snapshot code as fallback:',
                          codeToSubmit.length,
                          'chars'
                        )
                      } catch {}
                    } else {
                      try {
                        console.log(
                          '[CodeChef] Using captured submission code:',
                          codeToSubmit.length,
                          'chars'
                        )
                      } catch {}
                    }
                    slug = snap.slug
                    language = snap.language
                    title = snap.title
                  } catch (e) {
                    // Fallback to stored snapshot if direct extraction failed
                    try {
                      const stored: any = await (
                        chrome as any
                      ).storage?.local?.get?.([
                        '__codechef_code_snapshot__',
                        '__codechef_problem_meta__',
                      ])
                      if (!codeToSubmit) {
                        codeToSubmit = stored?.__codechef_code_snapshot__ || ''
                      }
                      slug =
                        stored?.__codechef_problem_meta__?.slug || extractSlug()
                      language =
                        stored?.__codechef_problem_meta__?.language ||
                        extractLanguage()
                      title =
                        stored?.__codechef_problem_meta__?.title ||
                        extractTitle()
                    } catch {}
                  }

                  // Only submit if we have non-trivial code
                  console.log("codeToSubmit------------------>>>>>>------", codeToSubmit)
                  if (codeToSubmit && codeToSubmit.trim().length > 10) {
                    callback({
                      slug,
                      code: codeToSubmit,
                      language,
                      problemTitle: title,
                      submissionStatus: 'accepted',
                    })
                    try {
                      console.log('[CodeChef] Polling ACCEPTED submission:', {
                        slug,
                        language,
                        codeLen: codeToSubmit.length,
                      })
                    } catch {}
                    markCooldown()
                  } else {
                    try {
                      console.warn(
                        '[CodeChef] No valid code found for submission:',
                        slug
                      )
                    } catch {}
                  }
                } catch (e) {
                  try {
                    console.error(
                      '[CodeChef] Error during accepted submission processing:',
                      e
                    )
                  } catch {}
                }
              })()
              return
            }
          }
        }
      }, checkInterval)
    }

    // Enhanced submit button detection and hooking
    const hookSubmitButtons = () => {
      const submitSelectors = [
        // High priority: specific submit buttons
        'button[type="submit"]',
        'input[type="submit"]',

        // Medium priority: buttons with submit text
        'button:contains("submit")',
        'button:contains("Submit")',
        'button:contains("SUBMIT")',

        // Common CodeChef patterns
        '.submit-btn',
        '.submission-btn',
        '#submit-btn',
        '#submit-button',
        '.btn-submit',

        // Generic button and link selectors
        'button',
        'a[href*="submit"]',
        'a[onclick*="submit"]',
      ]

      const candidates: HTMLElement[] = []
      for (const selector of submitSelectors) {
        try {
          const elements = Array.from(
            document.querySelectorAll(selector)
          ) as HTMLElement[]
          candidates.push(...elements)
        } catch {}
      }

      candidates.forEach((el) => {
        const text = (el.textContent || '').trim().toLowerCase()
        const isSubmitLike =
          (el as HTMLButtonElement).type === 'submit' ||
          text === 'submit' ||
          text.includes('submit solution') ||
          text.includes('submit code') ||
          text.includes('run code') ||
          text.includes('submit answer') ||
          el.id.includes('submit') ||
          el.className.includes('submit')

        if (isSubmitLike && !(el as any).__ccHooked) {
          ;(el as any).__ccHooked = true

          // Add both click and mousedown listeners for better coverage
          const submitHandler = async () => {
            try {
              console.log(
                '[CodeChef] Submit clicked, capturing code and starting result polling for element:',
                el.tagName,
                el.className,
                text
              )
            } catch {}

            // Capture the current code at the moment of submission
            try {
              const currentSnap = await this.snapshotCodeAndMeta()
              submissionCode = currentSnap.code
              try {
                console.log(
                  '[CodeChef] Captured submission code:',
                  submissionCode.length,
                  'chars at submit time'
                )
              } catch {}
            } catch (e) {
              try {
                console.warn(
                  '[CodeChef] Failed to capture code at submit time:',
                  e
                )
              } catch {}
            }

            startResultPolling()
          }

          el.addEventListener('click', submitHandler)
          el.addEventListener('mousedown', submitHandler)

          try {
            console.log(
              '[CodeChef] Hooked submit element:',
              el.tagName,
              el.className,
              text
            )
          } catch {}
        }
      })
    }
    try {
      hookSubmitButtons()
    } catch {}

    const observer = new MutationObserver(async (mutations) => {
      if (cooldown) return
      try {
        hookSubmitButtons()
      } catch {}
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
          console.log("inside status = accepted...................with submission", submissionCode)
          let codeToSubmit = submissionCode // Use code captured at submit time
          let slug = ''
          let language = ''
          let title = ''

          try {
            const snap = await this.snapshotCodeAndMeta()
            // Use captured submission code if available and looks like source code
            if (!codeToSubmit || codeToSubmit.trim().length < 10) {
              codeToSubmit = snap.code
              try {
                console.log(
                  '[CodeChef] Using current snapshot code as fallback:',
                  codeToSubmit.length,
                  'chars'
                )
              } catch {}
            } else {
              try {
                console.log(
                  '[CodeChef] Using captured submission code:',
                  codeToSubmit.length,
                  'chars'
                )
              } catch {}
            }
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
              if (!codeToSubmit) {
                codeToSubmit = stored?.__codechef_code_snapshot__ || ''
              }
              slug = stored?.__codechef_problem_meta__?.slug || extractSlug()
              language =
                stored?.__codechef_problem_meta__?.language || extractLanguage()
              title = stored?.__codechef_problem_meta__?.title || extractTitle()
            } catch {}
          }

          // Only submit if we have non-trivial code
          console.log("codetosubmit----->>>>>>", codeToSubmit)
          if (codeToSubmit && codeToSubmit.trim().length > 10) {
            callback({
              slug,
              code: codeToSubmit,
              language,
              problemTitle: title,
              submissionStatus: status,
            })
            try {
              console.log('[CodeChef] Detected ACCEPTED submission:', {
                slug,
                status,
                language,
                codeLen: codeToSubmit?.length || 0,
              })
            } catch {}
          } else {
            try {
              console.warn(
                '[CodeChef] Skipping submission: empty/short code for slug',
                slug
              )
            } catch {}
          }
        } catch {}
        markCooldown()
      }
    })

    // Observe entire body; CodeChef updates verdict in various containers
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })
    return () => observer.disconnect()
  }
}
