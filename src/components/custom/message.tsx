'use client'

import { Attachment, ToolInvocation } from 'ai'
import { motion } from 'framer-motion'
import { ReactNode, useState } from 'react'

import { BotIcon, UserIcon } from './icons'
import { Markdown } from './markdown'
import { PreviewAttachment } from './preview-attachment'
import { useSidebar } from '@/context/SidebarProvider'
import DSAProgressDashboard from '../dsa/Progress'
import CompactQuestionsViewer from '../dsa/Questions'
import UserSubmission from '../dsa/UserSubmission'
import { ShiningText } from '../ui/shining-text'
import { Button } from '../ui/button'

// Backend API base URL
const API_BASE_URL =
  (import.meta as any).env?.VITE_BACKEND_API_BASE_URL ||
  'http://localhost:3001/api'

export const Message = ({
  role,
  content,
  toolInvocations,
  attachments,
  append,
  isStreaming = false,
}: {
  role: string
  content: string | ReactNode
  toolInvocations: Array<ToolInvocation> | undefined
  attachments?: Array<Attachment>
  append?: (message: any) => void
  isStreaming?: boolean
}) => {
  const { setSidebarContent } = useSidebar()
  const [isVerifying, setIsVerifying] = useState(false)
  const [isAIVerifying, setIsAIVerifying] = useState(false)

  // Handle Done button click
  const handleDone = (question: any) => {
    const message = `I'm done with the question "${question.title}" (${question.slug}). Please check my submission and provide feedback.`
    append?.({
      role: 'user',
      content: message,
    })
  }

  // Handle Check button click
  const handleCheck = (question: any) => {
    const message = `Please examine my submission for "${question.title}" (${question.slug}) and provide detailed feedback on my solution.`
    append?.({
      role: 'user',
      content: message,
    })
  }

  // Function to extract question data from tool invocations
  const getQuestionDataFromTools = (toolInvocations: Array<ToolInvocation>) => {
    if (!toolInvocations) return null

    for (const invocation of toolInvocations) {
      const { toolName, state } = invocation
      const result = (invocation as any).result

      if (state === 'result' && result) {
        // Check for question-related tools
        if (
          toolName === 'getFilteredQuestionsToSolve' ||
          toolName === 'getPlatformQuestions'
        ) {
          // Extract question data from the result
          let questions = []

          if (Array.isArray(result)) {
            questions = result
          } else if (
            result.questionsWithSolvedStatus &&
            Array.isArray(result.questionsWithSolvedStatus)
          ) {
            questions = result.questionsWithSolvedStatus
          }

          if (questions.length > 0) {
            return {
              toolName,
              questions,
              totalCount: result.totalCount || questions.length,
              fullResult: result,
            }
          }
        }
      }
    }
    return null
  }

  // Function to verify code with AI and mark question as done
  const verifyCodeWithAI = async (
    question: any,
    code: string,
    questionText: string
  ) => {
    try {
      const stored = await chrome.storage.local.get(['token'])
      const token = stored.token

      if (!token) {
        console.error('❌ No authentication token found')
        return false
      }

      // Make AI call to verify the code
      const verificationResponse = await fetch(
        `${API_BASE_URL}/verify-solution`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            questionId: question.id,
            questionTitle: question.title,
            questionText: questionText,
            code: code,
            platform: 'codechef',
          }),
        }
      )

      if (verificationResponse.ok) {
        const verificationResult = await verificationResponse.json()

        if (verificationResult.isLegitimate) {
          // Mark question as done in storage
          const markDoneResponse = await fetch(
            `${API_BASE_URL}/mark-question-done`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                questionId: question.id,
                platform: 'codechef',
                code: code,
                verificationDetails: verificationResult,
              }),
            }
          )

          if (markDoneResponse.ok) {
            console.log('✅ Question marked as completed successfully')
            return true
          } else {
            console.error('❌ Failed to mark question as done')
            return false
          }
        } else {
          console.log('❌ Code appears to be hardcoded or invalid')
          if (append) {
            append({
              role: 'assistant',
              content: `❌ **Code Verification Failed**\n\n Your solution for "${question.title}" appears to be hardcoded or doesn't properly solve the problem.\n\n**AI Feedback:** ${verificationResult.feedback}\n\n💡 **Please:**\n- Write a general solution that works for all test cases\n- Avoid hardcoding specific outputs\n- Make sure your logic is correct and robust`,
            })
          }
          return false
        }
      } else {
        console.error('❌ AI verification request failed')
        return false
      }
    } catch (error) {
      console.error('❌ Error during AI verification:', error)
      return false
    }
  }

  // Handle verify button click
  const handleVerifyQuestion = async (questionData: any) => {
    console.log('🗃️ Full Tool Result:', questionData.fullResult)
    console.log(questionData.questions[0].title)
    console.log(
      questionData.questions[0].codechefUrl ||
        questionData.questions[0].leetcodeUrl
    )

    // Check if it's a CodeChef question
    const question = questionData.questions[0]
    const isCodeChefQuestion =
      question.codechefUrl ||
      (question.url && question.url.includes('codechef.com')) ||
      (question.platform &&
        question.platform.toLowerCase().includes('codechef'))

    if (isCodeChefQuestion) {
      setIsVerifying(true)

      try {
        // Get the active tab
        const [tab] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        })

        if (tab && tab.id) {
          // Inject script to check submission status and extract code
          const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
              // Check for submission status divs
              const successContainer = document.querySelector(
                '._run__container_1xnpw_42._dark_1xnpw_34._status-success_1xnpw_254'
              )
              const errorContainer = document.querySelector(
                '._run__container_1xnpw_42._dark_1xnpw_34._status-error_1xnpw_292'
              )

              // Extract code from CodeChef's ACE editor
              const aceContent = document.getElementsByClassName(
                'ace_content'
              )[0] as HTMLElement
              const code = aceContent
                ? aceContent.innerText
                : 'No code found in editor'

              // Extract question text
              const problemStatement = document.getElementById(
                'problem-statement'
              ) as HTMLElement
              const questionText = problemStatement
                ? problemStatement.innerText
                : 'No problem statement found'

              return {
                hasSuccessfulSubmission: !!successContainer,
                hasFailedSubmission: !!errorContainer,
                code: code,
                questionText: questionText,
              }
            },
          })

          if (results && results[0] && results[0].result) {
            const {
              hasSuccessfulSubmission,
              hasFailedSubmission,
              code,
              questionText,
            } = results[0].result

            if (hasSuccessfulSubmission) {
              // User has successfully submitted code
              console.group('🎉 CodeChef Code Verification - SUCCESS')
              console.log('✅ Successful submission detected!')
              console.log('📝 Extracted Code:', code)
              console.log('📖 Question Text:', questionText)
              console.log('🎯 Question:', question.title)
              console.log('🔗 URL:', question.codechefUrl || question.url)
              console.log('🤖 Starting AI verification...')
              console.groupEnd()

              // Set AI verification state and provide user feedback
              setIsAIVerifying(true)
              if (append) {
                append({
                  role: 'assistant',
                  content: `🤖 **AI Verification in Progress...**\n\nAnalyzing your solution for "${question.title}" to ensure it's not hardcoded and properly solves the problem.\n\nThis may take a few moments...`,
                })
              }

              // Verify code with AI
              const isVerified = await verifyCodeWithAI(
                question,
                code,
                questionText
              )
              setIsAIVerifying(false)

              if (isVerified) {
                console.log('🎉 Question marked as completed!')
                if (append) {
                  append({
                    role: 'assistant',
                    content: `🎉 **Verification Successful!**\n\nCongratulations! Your solution for "${question.title}" has been verified by AI and marked as completed.\n\n✅ **Verified:**\n- Code is not hardcoded\n- Solution appears legitimate\n- Question marked as done\n\nGreat job solving this problem! 🚀`,
                  })
                }

                // Dispatch event to refresh sidebar
                window.dispatchEvent(
                  new CustomEvent('questionCompleted', {
                    detail: { questionId: question.id, platform: 'codechef' },
                  })
                )
              }
            } else if (hasFailedSubmission) {
              // User has failed submission
              console.group('❌ CodeChef Code Verification - FAILED')
              console.log('❌ Failed submission detected!')
              console.log('📝 Current Code:', code)
              console.log('🎯 Question:', question.title)
              console.log('💡 Try debugging and resubmit your solution')
              console.groupEnd()

              // Show message in chat to resubmit
              if (append) {
                append({
                  role: 'assistant',
                  content: `❌ **Submission Failed**\n\nI detected that your submission for "${question.title}" failed. Please debug your code and submit it again before verification.\n\n💡 **Tips:**\n- Check your logic and test cases\n- Verify input/output format\n- Look for any runtime errors\n\nOnce you've successfully submitted, click the verify button again.`,
                })
              }
            } else {
              // No submission detected
              console.log('⚠️ No submission status detected')

              if (append) {
                append({
                  role: 'assistant',
                  content: `⚠️ **No Submission Detected**\n\nPlease submit your code for "${question.title}" on CodeChef first, then click the verify button.\n\n📝 **Steps:**\n1. Write your solution in the CodeChef editor\n2. Click the "Submit" button\n3. Wait for the result (success/failure)\n4. Then click the verify button again\n\nMake sure you're on the correct CodeChef problem page: ${question.codechefUrl || question.url}`,
                })
              }
            }
          } else {
            console.error('❌ Failed to check submission status')
          }
        } else {
          console.error('❌ No active tab found')
        }
      } catch (error) {
        console.error('❌ Error checking submission status:', error)
        console.log(
          '💡 Make sure you are on the CodeChef problem page with your solution submitted'
        )
      } finally {
        setIsVerifying(false)
      }
    }

    // Log individual question details for non-CodeChef questions
    if (!isCodeChefQuestion) {
      questionData.questions.forEach((question: any, index: number) => {
        console.log(`📌 Question ${index + 1}:`, {
          id: question.id,
          title: question.title,
          slug: question.slug,
          difficulty: question.difficulty,
          platform: question.platform || 'Unknown',
          url: question.url || question.questionUrl,
          codechefUrl: question.codechefUrl,
          leetcodeUrl: question.leetcodeUrl,
          isSolved: question.isSolved,
          isBookmarked: question.isBookmarked,
          points: question.points,
          tags: question.questionTags || [],
        })
      })
    }

    console.groupEnd()
  }

  // Function to get component and show in sidebar
  const showInSidebar = (toolName: string, result: any) => {
    let component = null

    switch (toolName) {
      case 'getFilteredQuestionsToSolve':
        component = (
          <CompactQuestionsViewer
            data={result}
            onDone={handleDone}
            onCheck={handleCheck}
          />
        )
        break
      case 'getUserProgressOverview':
        component = <DSAProgressDashboard data={result} />
        break
      case 'getUserSubmissionForProblem':
        component = <UserSubmission data={result} />
        break
      case 'getRecentActivity':
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Recent Activity
              </h3>
              <p className="text-sm text-muted-foreground">
                Your latest learning milestones
              </p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.isArray(result) &&
                result.slice(0, 5).map((activity: any, index: number) => (
                  <div
                    key={index}
                    className="bg-card rounded-lg p-3 border border-border"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {activity.problem ||
                          activity.title ||
                          `Activity ${index + 1}`}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.difficulty === 'easy'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : activity.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}
                      >
                        {activity.difficulty || 'Unknown'}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )
        break
      case 'getAvailableTags':
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🏷️</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Available Topics
              </h3>
              <p className="text-sm text-muted-foreground">
                Master these DSA concepts
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.isArray(result) &&
                result.slice(0, 8).map((tag: any, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-2 bg-card text-primary rounded-lg text-sm border border-border text-center"
                  >
                    {tag.name || tag}
                  </span>
                ))}
            </div>
          </div>
        )
        break
      case 'getUserContext':
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Learning Profile
              </h3>
              <p className="text-sm text-muted-foreground">
                Personalized insights for your journey
              </p>
            </div>
            <div className="space-y-3">
              {result?.weakAreas && (
                <div className="bg-card rounded-lg p-3 border border-border">
                  <h4 className="font-semibold text-foreground text-sm mb-2">
                    Focus Areas
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(result.weakAreas)
                      ? result.weakAreas.join(', ')
                      : result.weakAreas}
                  </p>
                </div>
              )}
              {result?.preferences && (
                <div className="bg-card rounded-lg p-3 border border-border">
                  <h4 className="font-semibold text-foreground text-sm mb-2">
                    Learning Preferences
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {result.preferences}
                  </p>
                </div>
              )}
            </div>
          </div>
        )
        break
      case 'searchWeb':
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">
                Search Results
              </h3>
              <p className="text-sm text-muted-foreground">
                Latest information from the web
              </p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result?.results &&
                Array.isArray(result.results) &&
                result.results
                  .slice(0, 3)
                  .map((searchResult: any, index: number) => (
                    <div
                      key={index}
                      className="bg-card rounded-lg p-3 border border-border"
                    >
                      <h5 className="font-semibold text-foreground text-sm mb-2 line-clamp-2">
                        {searchResult.title}
                      </h5>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {searchResult.snippet}
                      </p>
                      <a
                        href={searchResult.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View Source →
                      </a>
                    </div>
                  ))}
            </div>
          </div>
        )
        break
      case 'getPlatformQuestions':
        {
          const toTitle = (slug: string) =>
            slug
              ?.replace(/[-_]/g, ' ')
              .replace(/\b\w/g, (m) => m.toUpperCase()) || 'Question'
          console.log(toTitle)
          const normalized = Array.isArray(result)
            ? {
                questionsWithSolvedStatus: result.map((q: any, i: number) => {
                  const slug = q.slug || `question-${i + 1}`
                  const title = q.title || toTitle(slug)
                  const platform = (q.platform || '').toString().toLowerCase()
                  // Prefer DB questionUrl, then generic url, then platform-based guess
                  const codechefGuess = `https://www.codechef.com/problems/${slug}`
                  const guessedUrl = platform.includes('codechef')
                    ? codechefGuess
                    : undefined
                  return {
                    id: q.id || String(i + 1),
                    title,
                    slug,
                    difficulty: (q.difficulty || 'EASY') as any,
                    points: typeof q.points === 'number' ? q.points : 0,
                    questionUrl: q.questionUrl,
                    url: q.url || q.questionUrl || guessedUrl,
                    leetcodeUrl: q.leetcodeUrl,
                    isSolved: !!q.isSolved,
                    isBookmarked: !!q.isBookmarked,
                    questionTags: Array.isArray(q.questionTags)
                      ? q.questionTags
                      : [],
                  }
                }),
                individualPoints: 0,
                totalCount: result.length,
              }
            : result

          component = (
            <CompactQuestionsViewer
              data={normalized}
              onDone={handleDone}
              onCheck={handleCheck}
            />
          )
        }
        break
        break
      default:
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Tool Result</h3>
              <p className="text-sm text-muted-foreground">
                Data from {toolName}
              </p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )
    }

    if (component) {
      setSidebarContent(component)
    }
  }

  return (
    <motion.div
      className={`flex px-4 w-full md:px-0 first-of-type:pt-20 ${
        role === 'assistant'
          ? 'flex-row-reverse gap-4 justify-start' // AI messages: icon on right, content aligned right
          : 'flex-row gap-4 justify-start' // User messages: icon on left, content aligned left
      }`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === 'assistant' ? <BotIcon /> : <UserIcon />}
      </div>

      <div
        className={`flex flex-col gap-2 ${
          role === 'assistant'
            ? 'max-w-[80%] md:max-w-[500px] items-end' // AI messages: right-aligned with max width
            : 'max-w-[80%] md:max-w-[500px] items-start' // User messages: left-aligned with max width
        }`}
      >
        {/* Shimmer above AI message when streaming */}
        {role === 'assistant' && isStreaming && (
          <div className="mb-2">
            <ShiningText text="Thinking..." />
          </div>
        )}

        {/* Main content */}
        {content && typeof content === 'string' && (
          <div
            className={`text-zinc-800 dark:text-zinc-300 flex flex-col gap-4 text-base leading-relaxed ${
              role === 'assistant'
                ? 'bg-gray-100 dark:bg-gray-800 rounded-lg p-3 border' // AI messages: styled background
                : 'bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 border' // User messages: different colored background
            }`}
          >
            <Markdown>{content}</Markdown>
          </div>
        )}

        {/* Tool invocations with proper result display */}
        {toolInvocations && (
          <div
            className={`flex flex-col gap-3 ${
              role === 'assistant' ? 'items-end' : 'items-start'
            }`}
          >
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation
              const result = (toolInvocation as any).result
              if (state === 'result' && result) {
                // Display button like algo-chat does to show in sidebar
                return (
                  <div key={toolCallId}>
                    <button
                      onClick={() => showInSidebar(toolName, result)}
                      className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors text-sm font-medium"
                    >
                      View {toolName.replace(/([A-Z])/g, ' $1').trim()} →
                    </button>
                  </div>
                )
              } else if (state === 'call') {
                // Show tool call in progress
                return (
                  <div
                    key={toolCallId}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-base text-gray-600 dark:text-gray-400">
                        Calling {toolName.replace(/([A-Z])/g, ' $1').trim()}...
                      </span>
                    </div>
                  </div>
                )
              } else {
                // Show loading state
                return (
                  <div
                    key={toolCallId}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <span className="text-base text-gray-600 dark:text-gray-400">
                        Loading {toolName.replace(/([A-Z])/g, ' $1').trim()}...
                      </span>
                    </div>
                  </div>
                )
              }
            })}
          </div>
        )}

        {/* Verify button for question-related messages */}
        {role === 'assistant' &&
          toolInvocations &&
          (() => {
            const questionData = getQuestionDataFromTools(toolInvocations)
            if (!questionData) return null

            const question = questionData.questions[0]
            const isCodeChefQuestion =
              question.codechefUrl ||
              (question.url && question.url.includes('codechef.com')) ||
              (question.platform &&
                question.platform.toLowerCase().includes('codechef'))

            return (
              <div className="flex justify-start mt-2">
                <Button
                  onClick={() => handleVerifyQuestion(questionData)}
                  variant="outline"
                  size="sm"
                  disabled={isVerifying || isAIVerifying}
                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200 text-xs px-3 py-1 dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-300 dark:border-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying || isAIVerifying ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isAIVerifying ? 'AI Verifying...' : 'Verifying...'}
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {isCodeChefQuestion
                        ? `Extract Code from CodeChef (${questionData.questions.length})`
                        : `Verify Questions (${questionData.questions.length})`}
                    </>
                  )}
                </Button>
              </div>
            )
          })()}

        {attachments && (
          <div
            className={`flex flex-row gap-2 ${
              role === 'assistant' ? 'justify-end' : 'justify-start'
            }`}
          >
            {attachments.map((attachment) => (
              <PreviewAttachment key={attachment.url} attachment={attachment} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}
