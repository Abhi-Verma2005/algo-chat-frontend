// Utility for manually saving code submissions
const API_BASE_URL = (import.meta as any).env?.VITE_BACKEND_API_BASE_URL || 'http://localhost:3001/api';

export interface ManualSubmissionData {
  questionSlug: string;
  problemTitle: string;
  language: string;
  code: string;
  submissionStatus?: 'accepted' | 'wrong_answer' | 'time_limit' | 'runtime_error' | 'unknown';
}

export async function saveManualSubmission(submissionData: ManualSubmissionData): Promise<{success: boolean, error?: string, data?: any}> {
  try {
    // Get auth token from chrome storage
    const stored = await chrome.storage.local.get(['token']);
    const token = stored.token;
    
    if (!token) {
      return { success: false, error: 'No authentication token found. Please log in first.' };
    }

    const submittedAt = new Date().toISOString();
    
    const response = await fetch(`${API_BASE_URL}/submissions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        questionSlug: submissionData.questionSlug,
        problemTitle: submissionData.problemTitle,
        language: submissionData.language,
        code: submissionData.code,
        submittedAt,
        submissionStatus: submissionData.submissionStatus || 'accepted'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const result = await response.json();
    
    // Update local stats
    try {
      const storedStats = await chrome.storage.local.get(['problemsSynced', 'syncStatus', 'lastSync']);
      const problemsSynced = (storedStats.problemsSynced || 0) + 1;
      await chrome.storage.local.set({
        syncStatus: 'Synced',
        problemsSynced,
        lastSync: submittedAt
      });
    } catch (e) {
      console.warn('Failed to update local stats:', e);
    }

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: `Failed to save submission: ${error}` };
  }
}

// Helper to detect language from code content
export function detectLanguageFromCode(code: string): string {
  const codeLines = code.toLowerCase().trim();
  
  // Python indicators
  if (codeLines.includes('def ') || codeLines.includes('import ') || 
      codeLines.includes('print(') || codeLines.includes('range(') ||
      codeLines.includes('.append(') || codeLines.includes('.sort(')) {
    return 'python';
  }
  
  // Java indicators
  if (codeLines.includes('public class') || codeLines.includes('public static void main') ||
      codeLines.includes('system.out.println')) {
    return 'java';
  }
  
  // C++ indicators
  if (codeLines.includes('#include') || codeLines.includes('cout') || 
      codeLines.includes('std::') || codeLines.includes('vector<')) {
    return 'cpp';
  }
  
  // JavaScript indicators
  if (codeLines.includes('console.log') || codeLines.includes('function ') ||
      codeLines.includes('const ') || codeLines.includes('let ')) {
    return 'javascript';
  }
  
  // Default fallback
  return 'unknown';
}

// Helper to parse common problem titles from slugs
export function generateProblemTitle(slug: string): string {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}