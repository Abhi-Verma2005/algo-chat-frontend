import React from 'react';
import { X, ExternalLink, BarChart3, BookOpen, Code, Activity, Tag, Search, Trophy, TrendingUp, Target, Clock, Star, CheckCircle, XCircle, Copy, Sparkles, Users, Bookmark, Zap, Calendar, FileCode, List } from 'lucide-react';
import { Button } from '../ui/button';

interface ToolResponsePopupProps {
  isOpen: boolean;
  onClose: () => void;
  toolName: string;
  result: any;
  append?: (message: any) => void;
}

export const ToolResponsePopup: React.FC<ToolResponsePopupProps> = ({
  isOpen,
  onClose,
  toolName,
  result,
  append
}) => {
  if (!isOpen) return null;

  // Handle Done button click
  const handleDone = (question: any) => {
    const message = `I'm done with the question "${question.title}" (${question.slug}). Please check my submission and provide feedback.`;
    append?.({
      role: 'user',
      content: message,
    });
    onClose();
  };

  // Handle Check button click
  const handleCheck = (question: any) => {
    const message = `Please examine my submission for "${question.title}" (${question.slug}) and provide detailed feedback on my solution.`;
    append?.({
      role: 'user',
      content: message,
    });
    onClose();
  };

  // Custom Progress Dashboard Component
  const CustomProgressDashboard = ({ data }: { data: any }) => {
    try {
      return (
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Learning Progress</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Your DSA learning journey</p>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {data?.totalProblems || data?.total || 0}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-xl border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {data?.solvedProblems || data?.solved || 0}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Solved</div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                    {Math.round(((data?.solvedProblems || 0) / (data?.totalProblems || 1)) * 100)}%
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Success</div>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty Progress */}
          {data?.difficultyBreakdown && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-yellow-500" />
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Difficulty Progress</h4>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(data.difficultyBreakdown).map(([difficulty, count]: [string, any]) => (
                  <div key={difficulty} className="text-center">
                    <div className={`text-lg font-bold ${
                      difficulty === 'easy' ? 'text-green-600 dark:text-green-400' :
                      difficulty === 'medium' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {count}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                      {difficulty}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topics */}
          {data?.topics && Array.isArray(data.topics) && data.topics.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Topics Covered</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.topics.map((topic: string, index: number) => (
                  <span key={index} className="px-2 py-1 bg-indigo-200 dark:bg-indigo-800 text-indigo-800 dark:text-indigo-200 text-xs rounded-full capitalize">
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {data?.recentActivity && Array.isArray(data.recentActivity) && data.recentActivity.length > 0 && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Recent Activity</h4>
              </div>
              <div className="space-y-2">
                {data.recentActivity.slice(0, 3).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      {activity.problem}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.difficulty === 'easy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                      activity.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    }`}>
                      {activity.difficulty}
                    </span>
                  </div>
                ))}
                {data.recentActivity.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-1">
                    ... and {data.recentActivity.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      );
    } catch (error) {
      return (
        <div className="text-center p-4">
          <div className="text-red-500 text-sm">Error displaying progress data</div>
          <div className="text-xs text-gray-500 mt-1">Check console for details</div>
        </div>
      );
    }
  };

  // Custom Questions Viewer Component
  const CustomQuestionsViewer = ({ data, onDone, onCheck }: { data: any; onDone: (question: any) => void; onCheck: (question: any) => void }) => {
    try {
      const questions = data?.questions || data || [];
      
      if (!Array.isArray(questions) || questions.length === 0) {
        return (
          <div className="text-center p-4">
            <div className="text-gray-500 dark:text-gray-400 text-sm">No questions found</div>
          </div>
        );
      }

      return (
        <div className="space-y-4">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
              <List className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Questions to Solve</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Recommended problems for you</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{questions.length}</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-xl border border-green-200 dark:border-green-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {questions.filter((q: any) => q.isSolved).length}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">Solved</div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {questions.filter((q: any) => q.isBookmarked).length}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Saved</div>
              </div>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {questions.slice(0, 5).map((question: any, index: number) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white mb-2 text-base">
                      {question.title || question.slug || `Question ${index + 1}`}
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                        question.difficulty === 'Easy' ? 'border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300' :
                        question.difficulty === 'Medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300' :
                        question.difficulty === 'Hard' ? 'border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300' :
                        'border-gray-200 text-gray-700 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                      }`}>
                        {question.difficulty || 'Unknown'}
                      </span>
                      {question.points && (
                        <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                          +{question.points} pts
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onDone(question)}
                        className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-lg hover:bg-green-200 dark:hover:bg-green-800/40 transition-colors font-medium"
                      >
                        Done
                      </button>
                      <button
                        onClick={() => onCheck(question)}
                        className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors font-medium"
                      >
                        Check
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {questions.length > 5 && (
              <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                ... and {questions.length - 5} more questions
              </div>
            )}
          </div>
        </div>
      );
    } catch (error) {
      return (
        <div className="text-center p-4">
          <div className="text-red-500 text-sm">Error displaying questions</div>
          <div className="text-xs text-gray-500 mt-1">Check console for details</div>
        </div>
      );
    }
  };

  // Custom User Submission Component
  const CustomUserSubmission = ({ data }: { data: any }) => {
    if (!data?.found) {
      return (
        <div className="space-y-6">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-full flex items-center justify-center mx-auto">
              <FileCode className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">No Submission Found</h3>
              <p className="text-gray-600 dark:text-gray-400">{data?.message || 'Try solving this problem first'}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center mx-auto">
            <Code className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your Submission</h3>
            <p className="text-gray-600 dark:text-gray-400">{data.problemTitle || data.questionSlug}</p>
          </div>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {data.language || 'Unknown'}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Language</div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-xl border border-green-200 dark:border-green-800">
            <div className="text-center">
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                {data.submissionStatus || 'Unknown'}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Status</div>
            </div>
          </div>
          
          {data.createdAt && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="text-center">
                <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {new Date(data.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Created</div>
              </div>
            </div>
          )}
          
          {data.code && (
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-3 rounded-xl border border-orange-200 dark:border-orange-800">
              <div className="text-center">
                <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
                  {data.code.split('\n').length}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">Lines</div>
              </div>
            </div>
          )}
        </div>

        {/* Code Display */}
        {data.code && (
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Your Solution
                </span>
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-900 px-2 py-1 rounded-full">
                {data.code.split('\n').length} lines
              </span>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
              <pre className="text-sm overflow-x-auto whitespace-pre-wrap break-words font-mono text-gray-700 dark:text-gray-300 leading-relaxed">
                <code>{data.code}</code>
              </pre>
            </div>
          </div>
        )}
        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-border/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-1 h-1 bg-primary rounded-full"></span>
              Question: {data.questionSlug}
            </span>
            <a
              href={`https://leetcode.com/problems/${data.questionSlug}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-primary transition-colors hover:bg-primary/10 px-3 py-1 rounded-md text-sm font-medium"
            >
              View on LeetCode
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Get the appropriate component based on tool name
  const getToolContent = () => {
    switch (toolName) {
      case "getFilteredQuestionsToSolve":
        return (
          <CustomQuestionsViewer 
            data={result} 
            onDone={handleDone}
            onCheck={handleCheck}
          />
        );
      case "getUserProgressOverview":
        return <CustomProgressDashboard data={result} />;
      case "getUserSubmissionForProblem":
        return <CustomUserSubmission data={result} />;
      case "getRecentActivity":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
                <Activity className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Activity</h3>
                <p className="text-gray-600 dark:text-gray-400">Your latest learning milestones</p>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {Array.isArray(result) ? result.filter((a: any) => a.type === 'solved').length : 0}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">Solved</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {Array.isArray(result) ? result.filter((a: any) => a.type === 'bookmarked').length : 0}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">Bookmarked</div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {Array.isArray(result) ? result.length : 0}
                    </div>
                    <div className="text-sm text-purple-700 dark:text-purple-300">Total</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity List */}
            {Array.isArray(result) && result.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {result.slice(0, 6).map((activity: any, index: number) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-full flex items-center justify-center">
                        {activity.type === 'solved' ? (
                          <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : activity.type === 'bookmarked' ? (
                          <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <Activity className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {activity.title || activity.type || 'Activity'}
                        </div>
                        {activity.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {activity.description}
                          </div>
                        )}
                        {activity.timestamp && (
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500 mt-2">
                            <Clock className="w-3 h-3" />
                            {new Date(activity.timestamp).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {result.length > 6 && (
                  <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                    ... and {result.length - 6} more activities
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "getAvailableTags":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
                <Tag className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Available Topics</h3>
                <p className="text-gray-600 dark:text-gray-400">Master these DSA concepts</p>
              </div>
            </div>

            {/* Tags Grid */}
            {Array.isArray(result) && result.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                {result.slice(0, 9).map((tag: any, index: number) => (
                  <div key={index} className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-indigo-900 dark:text-indigo-100 text-sm">
                          {tag.name || tag}
                        </div>
                        {tag.count && (
                          <div className="text-sm text-indigo-700 dark:text-indigo-300 mt-1">
                            {tag.count} problems
                          </div>
                        )}
                      </div>
                      <div className="w-8 h-8 bg-indigo-200 dark:bg-indigo-800 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-200">
                          {index + 1}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {result.length > 9 && (
                  <div className="col-span-full text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                    ... and {result.length - 9} more tags
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "getUserContext":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Your Learning Profile</h3>
                <p className="text-gray-600 dark:text-gray-400">Personalized insights for your journey</p>
              </div>
            </div>

            {/* Profile Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {result?.weakAreas && (
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 p-5 rounded-xl border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">Focus Areas</h4>
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    {Array.isArray(result.weakAreas) ? result.weakAreas.join(', ') : result.weakAreas}
                  </div>
                </div>
              )}
              
              {result?.preferences && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-5 rounded-xl border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Star className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100">Learning Preferences</h4>
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    {typeof result.preferences === 'string' ? result.preferences : 'Custom settings configured'}
                  </div>
                </div>
              )}
              
              {result?.progress && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-5 rounded-xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3 mb-3">
                    <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Current Progress</h4>
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    {typeof result.progress === 'string' ? result.progress : 'Progress tracking active'}
                  </div>
                </div>
              )}
              
              {result?.level && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-5 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-3 mb-3">
                    <Trophy className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">Skill Level</h4>
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">
                    {result.level}
                  </div>
                </div>
              )}
            </div>

            {/* Raw Data Debug - Only show if no structured data */}
            {(!result?.weakAreas && !result?.preferences && !result?.progress && !result?.level) && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Code className="w-5 h-5 text-gray-500" />
                  <h4 className="font-medium text-gray-700 dark:text-gray-300">Raw Data</h4>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        );
      case "searchWeb":
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Search Results</h3>
                <p className="text-gray-600 dark:text-gray-400">Latest information from the web</p>
              </div>
            </div>

            {/* Search Stats */}
            {result?.results && Array.isArray(result.results) && (
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-xl border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-3">
                  <Search className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  <div>
                    <div className="text-xl font-semibold text-orange-900 dark:text-orange-100">
                      Found {result.results.length} results
                    </div>
                    <div className="text-base text-orange-700 dark:text-orange-300">
                      {result.message || 'Search completed successfully'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Search Results */}
            {result?.results && Array.isArray(result.results) && result.results.length > 0 && (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {result.results.slice(0, 4).map((searchResult: any, index: number) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/30 rounded-full flex items-center justify-center">
                        <Search className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 text-sm">
                          {searchResult.title}
                        </h5>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
                          {searchResult.snippet}
                        </p>
                        <a 
                          href={searchResult.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 hover:underline font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View Source
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                {result.results.length > 4 && (
                  <div className="text-center text-xs text-gray-500 dark:text-gray-400 py-2">
                    ... and {result.results.length - 4} more results
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-600 text-white rounded-full flex items-center justify-center mx-auto">
                <Code className="w-8 h-8" />
              </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Tool Result</h3>
              <p className="text-gray-600 dark:text-gray-400">Data from {toolName}</p>
            </div>
          </div>

            {/* Raw Data Display */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-3">
                <Code className="w-5 h-5 text-gray-500" />
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Result Data</h4>
              </div>
              <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        );
    }
  };

  // Get tool display name
  const getToolDisplayName = () => {
    const toolNames: { [key: string]: string } = {
      getUserProgressOverview: 'Learning Progress',
      getFilteredQuestionsToSolve: 'Recommended Questions',
      getUserSubmissionForProblem: 'Your Submission',
      getRecentActivity: 'Recent Activity',
      getAvailableTags: 'Available Topics',
      getUserContext: 'Learning Profile',
      searchWeb: 'Search Results'
    };
    return toolNames[toolName] || toolName.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {getToolDisplayName()}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {getToolContent()}
        </div>
      </div>
    </div>
  );
};
