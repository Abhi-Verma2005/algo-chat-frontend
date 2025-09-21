import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Bot, Settings } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useChromeStorage } from '@/hooks/useChromeStorage'
import { VALID_MODELS, ValidModel } from '@/constants/valid_modals'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Chat from '@/components/Chat'
import { LeetCodeAdapter } from './platforms/leetcode'
import { CodeChefAdapter } from './platforms/codechef'

interface ChatBoxProps {
  visible: boolean
  context: {
    problemStatement: string
  }
  model: ValidModel
  apikey: string
  heandelModel: (v: ValidModel) => void
  selectedModel: ValidModel | undefined
}

// render bot logo and scripts which will send data to backend

const ChatBox: React.FC<ChatBoxProps> = ({
  context: _context,
  visible,
  model: _model,
  apikey: _apikey,
  heandelModel: _heandelModel,
  selectedModel: _selectedModel,
}) => {
  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="w-[400px] h-[600px] min-w-[320px] min-h-[400px]">
        {/* The in-app Chat component expects id and initialMessages in this build */}
        {/* Provide a stable id and start with empty messages */}
        <Chat id="content-chat" initialMessages={[]} />
      </div>
    </div>
  )
}

const ContentPage: React.FC = () => {
  const [chatboxExpanded, setChatboxExpanded] = React.useState<boolean>(false)
  const [, setCurrentCode] = React.useState<string>('')
  const isProcessingRef = React.useRef<boolean>(false)

  const metaDescriptionEl = document.querySelector('meta[name=description]')
  const problemStatement = metaDescriptionEl?.getAttribute('content') as string

  const [modal, setModal] = React.useState<ValidModel | null | undefined>(null)
  const [apiKey, setApiKey] = React.useState<string | null | undefined>(null)
  const [selectedModel, setSelectedModel] = React.useState<ValidModel>()

  const ref = useRef<HTMLDivElement>(null)

  const handleDocumentClick = (e: MouseEvent) => {
    if (
      ref.current &&
      e.target instanceof Node &&
      !ref.current.contains(e.target)
    ) {
      // if (chatboxExpanded) setChatboxExpanded(false)
    }
  }

  React.useEffect(() => {
    document.addEventListener('click', handleDocumentClick)
    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [])
  // Load model and key once mounted
  React.useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const { getKeyModel, selectModel } = useChromeStorage()
        const selected = await selectModel()
        const { model, apiKey } = await getKeyModel(selected)
        if (!cancelled) {
          setModal(model)
          setApiKey(apiKey)
        }
      } catch {}
    }
    load()
    return () => { cancelled = true }
  }, [])

  const heandelModel = (v: ValidModel) => {
    if (v) {
      const { setSelectModel } = useChromeStorage()
      setSelectModel(v)
      setSelectedModel(v)
    }
  }

  React.useEffect(() => {
    const hostname = window.location.hostname
    const isLeetCode = hostname.includes('leetcode.com')
    const isCodeChef = hostname.includes('codechef.com')
    const adapter = isLeetCode ? new LeetCodeAdapter() : isCodeChef ? new CodeChefAdapter() : null
    if (!adapter || !adapter.isOnProblemPage()) return

    const platformKey = isLeetCode ? 'leetcode' : 'codechef'

    const updateCodeSnapshot = async () => {
      try {
        const snap = await adapter.snapshotCodeAndMeta()
        setCurrentCode(snap.code)
        await chrome.storage.local.set({
          [`__${platformKey}_code_snapshot__`]: snap.code,
          [`__${platformKey}_problem_meta__`]: {
            slug: snap.slug,
            language: snap.language,
            title: snap.title,
          },
        })
      } catch {}
    }

    updateCodeSnapshot()

    const disconnect = adapter.detectAccepted(async (payload) => {
      try { console.log('[Content] Accepted detected, preparing to relay', { slug: payload?.slug, lang: payload?.language, codeLen: payload?.code?.length || 0 }) } catch {}
      if (isProcessingRef.current) return
      isProcessingRef.current = true
      try {
        setCurrentCode(payload.code)
        const authStored = await chrome.storage.local.get(['token'])
        const token = authStored?.token
        if (!token) {
          try { console.warn('[Content] Missing auth token, cannot send submission for', payload?.slug) } catch {}
          return
        }
        await new Promise((resolve, reject) => {
          ;(chrome as any).runtime.sendMessage(
            {
              action: 'send_to_backend',
              data: payload,
              token,
            },
            undefined,
            (response: any) => {
              try { console.log('[Content] Relay response', response) } catch {}
              if ((chrome as any).runtime.lastError) {
                reject(new Error((chrome as any).runtime.lastError.message))
              } else if (response?.error) {
                reject(new Error(response.error))
              } else {
                resolve(response)
              }
            }
          )
        })
      } catch (e) {
        try { console.error('[Content] Submission relay failed:', e) } catch {}
      } finally {
        setTimeout(() => {
          isProcessingRef.current = false
        }, 1500)
      }
    })

    const interval = setInterval(updateCodeSnapshot, 4000)

    return () => {
      disconnect()
      clearInterval(interval)
    }
  }, [])

  React.useEffect(() => {
    const loadChromeStorage = async () => {
      if (!chrome) return

      const { selectModel } = useChromeStorage()

      setSelectedModel(await selectModel())
    }

    loadChromeStorage()
  }, [])

  return (
    <div
      ref={ref}
      className="dark z-50"
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
      }}
    >
      {!modal || !apiKey ? (
        !chatboxExpanded ? null : (
          <>
            <Card className="mb-5">
              <CardContent className="h-[500px] grid place-items-center">
                <div className="grid place-items-center gap-4">
                  {!selectedModel && (
                    <>
                      <p className="text-center">
                        Please configure the extension before using this
                        feature.
                      </p>
                      <Button
                        onClick={() => {
                          chrome.runtime.sendMessage({ action: 'openPopup' })
                        }}
                      >
                        configure
                      </Button>
                    </>
                  )}
                  {selectedModel && (
                    <>
                      <p>
                        We couldn't find any API key for selected model{' '}
                        <b>
                          <u>{selectedModel}</u>
                        </b>
                      </p>
                      <p>you can select another models</p>
                      <Select
                        onValueChange={(v: ValidModel) => heandelModel(v)}
                        value={selectedModel}
                      >
                        <SelectTrigger className="w-56">
                          <SelectValue placeholder="Select a model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Model</SelectLabel>
                            <SelectSeparator />
                            {VALID_MODELS.map((modelOption) => (
                              <SelectItem
                                key={modelOption.name}
                                value={modelOption.name}
                              >
                                {modelOption.display}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )
      ) : (
        <ChatBox
          visible={chatboxExpanded}
          context={{ problemStatement }}
          model={modal}
          apikey={apiKey}
          heandelModel={heandelModel}
          selectedModel={selectedModel}
        />
      )}
      <div className="flex justify-end gap-2">
        <Button
          size={'icon'}
          onClick={() => {
            chrome.runtime.sendMessage({ action: 'openSidePanel' })
          }}
          className="bg-blue-600 hover:bg-blue-700"
          title="Open in Side Panel"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          size={'icon'}
          onClick={() => setChatboxExpanded(!chatboxExpanded)}
        >
          <Bot />
        </Button>
      </div>
    </div>
  )
}

export default ContentPage
