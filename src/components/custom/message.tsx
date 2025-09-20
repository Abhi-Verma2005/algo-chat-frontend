"use client";

import { Attachment, ToolInvocation } from "ai";
import { motion } from "framer-motion";
import { ReactNode } from "react";

import { BotIcon, UserIcon } from "./icons";
import { Markdown } from "./markdown";
import { PreviewAttachment } from "./preview-attachment";
import { useSidebar } from "@/context/SidebarProvider";
import DSAProgressDashboard from "../dsa/Progress";
import CompactQuestionsViewer from "../dsa/Questions";
import UserSubmission from "../dsa/UserSubmission";
import { ShiningText } from "../ui/shining-text";

export const Message = ({
  role,
  content,
  toolInvocations,
  attachments,
  append,
  isStreaming = false,
}: {
  role: string;
  content: string | ReactNode;
  toolInvocations: Array<ToolInvocation> | undefined;
  attachments?: Array<Attachment>;
  append?: (message: any) => void;
  isStreaming?: boolean;
}) => {
  const { setSidebarContent } = useSidebar();

  // Handle Done button click
  const handleDone = (question: any) => {
    const message = `I'm done with the question "${question.title}" (${question.slug}). Please check my submission and provide feedback.`;
    append?.({
      role: 'user',
      content: message,
    });
  };

  // Handle Check button click
  const handleCheck = (question: any) => {
    const message = `Please examine my submission for "${question.title}" (${question.slug}) and provide detailed feedback on my solution.`;
    append?.({
      role: 'user',
      content: message,
    });
  };

  // Function to get component and show in sidebar
  const showInSidebar = (toolName: string, result: any) => {
    let component = null;

    switch (toolName) {
      case "getFilteredQuestionsToSolve":
        component = (
          <CompactQuestionsViewer 
            data={result} 
            onDone={handleDone}
            onCheck={handleCheck}
          />
        );
        break;
      case "getUserProgressOverview":
        component = <DSAProgressDashboard data={result} />;
        break;
      case "getUserSubmissionForProblem":
        component = <UserSubmission data={result} />;
        break;
      case "getRecentActivity":
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Recent Activity</h3>
              <p className="text-sm text-muted-foreground">Your latest learning milestones</p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Array.isArray(result) && result.slice(0, 5).map((activity: any, index: number) => (
                <div key={index} className="bg-card rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {activity.problem || activity.title || `Activity ${index + 1}`}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      activity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {activity.difficulty || 'Unknown'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        break;
      case "getAvailableTags":
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🏷️</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Available Topics</h3>
              <p className="text-sm text-muted-foreground">Master these DSA concepts</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Array.isArray(result) && result.slice(0, 8).map((tag: any, index: number) => (
                <span key={index} className="px-3 py-2 bg-card text-primary rounded-lg text-sm border border-border text-center">
                  {tag.name || tag}
                </span>
              ))}
            </div>
          </div>
        );
        break;
      case "getUserContext":
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Learning Profile</h3>
              <p className="text-sm text-muted-foreground">Personalized insights for your journey</p>
            </div>
            <div className="space-y-3">
              {result?.weakAreas && (
                <div className="bg-card rounded-lg p-3 border border-border">
                  <h4 className="font-semibold text-foreground text-sm mb-2">Focus Areas</h4>
                  <p className="text-sm text-muted-foreground">
                    {Array.isArray(result.weakAreas) ? result.weakAreas.join(', ') : result.weakAreas}
                  </p>
                </div>
              )}
              {result?.preferences && (
                <div className="bg-card rounded-lg p-3 border border-border">
                  <h4 className="font-semibold text-foreground text-sm mb-2">Learning Preferences</h4>
                  <p className="text-sm text-muted-foreground">{result.preferences}</p>
                </div>
              )}
            </div>
          </div>
        );
        break;
      case "searchWeb":
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🔍</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Search Results</h3>
              <p className="text-sm text-muted-foreground">Latest information from the web</p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result?.results && Array.isArray(result.results) && result.results.slice(0, 3).map((searchResult: any, index: number) => (
                <div key={index} className="bg-card rounded-lg p-3 border border-border">
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
        );
        break;
      case "getPlatformQuestions": {
        const toTitle = (slug: string) => slug?.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()) || 'Question';
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🏁</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Platform Questions</h3>
              <p className="text-sm text-muted-foreground">Slug and URL only</p>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {Array.isArray(result) && result.slice(0, 10).map((q: any, index: number) => {
                const slug = q.slug || '';
                const title = toTitle(slug);
                return (
                  <div key={index} className="bg-card rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-foreground truncate" title={title}>{title}</div>
                        <div className="text-xs text-muted-foreground break-all">{slug}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Solve */}
                        {q.url && (
                          <a
                            href={q.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1 rounded-full text-xs border-green-700 text-green-300 bg-green-900/20 hover:bg-green-900/40 hover:text-white"
                          >
                            Solve
                          </a>
                        )}
                        {/* Check */}
                        <button
                          onClick={() => handleCheck({ title, slug })}
                          className="px-2 py-1 rounded-full text-xs border-sky-700 text-sky-300 bg-sky-900/20 hover:bg-sky-900/40 hover:text-white"
                        >
                          Check
                        </button>
                        {/* Done */}
                        <button
                          onClick={() => handleDone({ title, slug })}
                          className="px-2 py-1 rounded-full text-xs border-fuchsia-700 text-fuchsia-300 bg-fuchsia-900/20 hover:bg-fuchsia-900/40 hover:text-white"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
        break;
      }
        break;
      default:
        component = (
          <div className="max-w-md mx-auto bg-background border border-border rounded-xl p-4 space-y-4 shadow-lg">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">⚙️</span>
              </div>
              <h3 className="text-lg font-bold text-foreground">Tool Result</h3>
              <p className="text-sm text-muted-foreground">Data from {toolName}</p>
            </div>
            <div className="bg-card rounded-lg p-3 border border-border">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        );
    }

    if (component) {
      setSidebarContent(component);
    }
  };

  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-20`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] border rounded-sm p-1 flex flex-col justify-center items-center shrink-0 text-zinc-500">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div className="flex flex-col gap-2 w-full">
        {/* Shimmer above AI message when streaming */}
        {role === "assistant" && isStreaming && (
          <div className="mb-2">
            <ShiningText text="Thinking..." />
          </div>
        )}
        
        {/* Main content */}
        {content && typeof content === "string" && (
          <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4 text-base leading-relaxed">
            <Markdown>{content}</Markdown>
          </div>
        )}

        {/* Tool invocations with proper result display */}
        {toolInvocations && (
          <div className="flex flex-col gap-3">
            {toolInvocations.map((toolInvocation) => {
              const { toolName, toolCallId, state } = toolInvocation;
              const result = (toolInvocation as any).result;
              
              if (state === "result" && result) {
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
                );
              } else if (state === "call") {
                // Show tool call in progress
                return (
                  <div key={toolCallId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-base text-gray-600 dark:text-gray-400">
                        Calling {toolName.replace(/([A-Z])/g, ' $1').trim()}...
                      </span>
                    </div>
                  </div>
                );
              } else {
                // Show loading state
                return (
                  <div key={toolCallId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <span className="text-base text-gray-600 dark:text-gray-400">
                        Loading {toolName.replace(/([A-Z])/g, ' $1').trim()}...
                      </span>
                    </div>
                  </div>
                );
              }
            })}
          </div>
        )}

        {attachments && (
          <div className="flex flex-row gap-2">
            {attachments.map((attachment) => (
              <PreviewAttachment key={attachment.url} attachment={attachment} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};