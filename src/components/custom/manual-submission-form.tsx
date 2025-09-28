import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Save, Code, CheckCircle, XCircle } from 'lucide-react';
import { saveManualSubmission, detectLanguageFromCode, generateProblemTitle, type ManualSubmissionData } from '@/lib/manual-submission';

const SUPPORTED_LANGUAGES = [
  'python', 'java', 'javascript', 'typescript', 'cpp', 'c', 'csharp', 
  'go', 'rust', 'php', 'ruby', 'swift', 'kotlin', 'scala', 'dart'
];

interface ManualSubmissionFormProps {
  initialCode?: string;
  initialLanguage?: string;
  onSubmissionSaved?: (data: any) => void;
}

export const ManualSubmissionForm: React.FC<ManualSubmissionFormProps> = ({
  initialCode = '',
  initialLanguage = '',
  onSubmissionSaved
}) => {
  const [formData, setFormData] = useState<ManualSubmissionData>({
    questionSlug: '',
    problemTitle: '',
    language: initialLanguage || detectLanguageFromCode(initialCode),
    code: initialCode,
    submissionStatus: 'accepted' as const
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{success: boolean, message: string} | null>(null);

  const handleInputChange = (field: keyof ManualSubmissionData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate problem title from slug
    if (field === 'questionSlug' && value && !formData.problemTitle) {
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        problemTitle: generateProblemTitle(value)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.questionSlug || !formData.code || !formData.language) {
      setSubmitResult({ success: false, message: 'Please fill in all required fields' });
      return;
    }

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const result = await saveManualSubmission(formData);
      
      if (result.success) {
        setSubmitResult({ success: true, message: 'Submission saved successfully!' });
        onSubmissionSaved?.(result.data);
        
        // Reset form
        setFormData({
          questionSlug: '',
          problemTitle: '',
          language: 'python',
          code: '',
          submissionStatus: 'accepted'
        });
      } else {
        setSubmitResult({ success: false, message: result.error || 'Failed to save submission' });
      }
    } catch (error) {
      setSubmitResult({ success: false, message: `Error: ${error}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Code className="w-6 h-6 text-primary" />
          <CardTitle>Save Code Submission</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">
          Manually save your code solution with problem details
        </p>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Question Slug */}
          <div className="space-y-2">
            <Label htmlFor="questionSlug">Problem Slug *</Label>
            <Input
              id="questionSlug"
              placeholder="e.g., two-sum, array-sorting"
              value={formData.questionSlug}
              onChange={(e) => handleInputChange('questionSlug', e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              A unique identifier for the problem (usually kebab-case)
            </p>
          </div>

          {/* Problem Title */}
          <div className="space-y-2">
            <Label htmlFor="problemTitle">Problem Title</Label>
            <Input
              id="problemTitle"
              placeholder="e.g., Two Sum, Array Sorting"
              value={formData.problemTitle}
              onChange={(e) => handleInputChange('problemTitle', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Will be auto-generated from slug if left empty
            </p>
          </div>

          {/* Language */}
          <div className="space-y-2">
            <Label htmlFor="language">Programming Language *</Label>
            <Select 
              value={formData.language} 
              onValueChange={(value) => handleInputChange('language', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map(lang => (
                  <SelectItem key={lang} value={lang}>
                    {lang.charAt(0).toUpperCase() + lang.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code">Code Solution *</Label>
            <Textarea
              id="code"
              placeholder="Paste your code here..."
              value={formData.code}
              onChange={(e) => handleInputChange('code', e.target.value)}
              className="min-h-[200px] font-mono text-sm"
              required
            />
          </div>

          {/* Submission Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Submission Status</Label>
            <Select 
              value={formData.submissionStatus} 
              onValueChange={(value) => handleInputChange('submissionStatus', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="wrong_answer">Wrong Answer</SelectItem>
                <SelectItem value="time_limit">Time Limit Exceeded</SelectItem>
                <SelectItem value="runtime_error">Runtime Error</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Submission
              </>
            )}
          </Button>
        </form>

        {/* Result Message */}
        {submitResult && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
            submitResult.success 
              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/30 dark:text-green-300' 
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-300'
          }`}>
            {submitResult.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <XCircle className="w-4 h-4" />
            )}
            <span className="text-sm">{submitResult.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};