import React, { useEffect, useState } from 'react';
import { ClipboardList, Loader, Info, CheckCircle, Sparkles, PlayCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { getNumericRatingOptions } from '../utils/ratingOptions';

export interface AssessmentCompetency {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

interface SelfAssessmentExperienceProps {
  competencies: AssessmentCompetency[];
}

export const SelfAssessmentExperience: React.FC<SelfAssessmentExperienceProps> = ({ competencies }) => {
  const [assessmentState, setAssessmentState] = useState<'select' | 'taking' | 'results'>('select');
  const [selectedCompetencyIds, setSelectedCompetencyIds] = useState<Set<string>>(new Set());
  const [currentAssessment, setCurrentAssessment] = useState<any>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentRating, setCurrentRating] = useState<number | null>(null);
  const [currentComment, setCurrentComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<any>(null);
  const [myAssessments, setMyAssessments] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    loadMyAssessments();
  }, []);

  const loadMyAssessments = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await apiService.getMyAssessments();
      setMyAssessments(response.data || []);
    } catch (err: any) {
      console.error('Failed to load assessments:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const competenciesWithQuestions = competencies.filter(() => true);

  const toggleCompetencySelection = (competencyId: string) => {
    const newSelected = new Set(selectedCompetencyIds);
    if (newSelected.has(competencyId)) {
      newSelected.delete(competencyId);
    } else {
      newSelected.add(competencyId);
    }
    setSelectedCompetencyIds(newSelected);
  };

  const startAssessment = async () => {
    if (selectedCompetencyIds.size === 0) {
      setError('Please select at least one competency to assess');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const response = await apiService.createAssessment({
        competencyIds: Array.from(selectedCompetencyIds),
      });

      setCurrentAssessment(response.data);
      setAssessmentState('taking');
      setCurrentQuestionIndex(0);
      setCurrentRating(null);
      setCurrentComment('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitResponse = async () => {
    if (currentRating === null) {
      setError('Please select a rating');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await apiService.submitAssessmentResponse(currentAssessment.id, {
        questionId: currentAssessment.questions[currentQuestionIndex].id,
        rating: currentRating,
        comment: currentComment || undefined,
      });

      if (currentQuestionIndex < currentAssessment.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentRating(null);
        setCurrentComment('');
      } else {
        await completeAssessment();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeAssessment = async () => {
    setIsSubmitting(true);
    try {
      const response = await apiService.completeAssessment(currentAssessment.id);
      setResults(response.data);
      setAssessmentState('results');
      await loadMyAssessments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete assessment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAssessment = () => {
    setAssessmentState('select');
    setSelectedCompetencyIds(new Set());
    setCurrentAssessment(null);
    setCurrentQuestionIndex(0);
    setCurrentRating(null);
    setCurrentComment('');
    setResults(null);
    setError('');
  };

  const viewPastResults = async (assessmentId: string) => {
    try {
      const response = await apiService.getAssessmentResults(assessmentId);
      setResults(response.data);
      setAssessmentState('results');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load results');
    }
  };

  if (assessmentState === 'select') {
    return (
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Take Assessment</h2>
          <p className="text-gray-600 mb-6">
            Select the competencies you want to assess yourself on. You'll be asked a series of questions for each
            selected competency.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {competenciesWithQuestions.length === 0 ? (
            <div className="text-center py-12">
              <ClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No competencies available</h3>
              <p className="text-gray-600 mb-6">Add competencies with assessment questions to get started.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {competenciesWithQuestions.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => toggleCompetencySelection(comp.id)}
                    className={`card cursor-pointer border-2 transition-colors ${
                      selectedCompetencyIds.has(comp.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCompetencyIds.has(comp.id)}
                        onChange={() => toggleCompetencySelection(comp.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{comp.name}</h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{comp.description}</p>
                        {comp.type && (
                          <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {comp.type.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={startAssessment}
                  disabled={isSubmitting || selectedCompetencyIds.size === 0}
                  className="btn btn-primary"
                >
                  {isSubmitting ? (
                    <>
                      <Loader className="animate-spin mr-2" size={16} />
                      Starting...
                    </>
                  ) : (
                    `Start Assessment (${selectedCompetencyIds.size} selected)`
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {myAssessments.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Assessments</h3>
            {isLoadingHistory ? (
              <div className="flex justify-center py-8">
                <Loader className="animate-spin text-primary-600" size={24} />
              </div>
            ) : (
              <div className="space-y-3">
                {myAssessments.map((assessment) => (
                  <div key={assessment.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              assessment.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {assessment.status}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(assessment.startedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {assessment.answeredCount} / {assessment.totalQuestions} questions answered
                        </p>
                        {assessment.averageScore !== null && (
                          <p className="text-sm font-medium text-primary-600 mt-1">
                            Average Score: {assessment.averageScore.toFixed(2)}
                          </p>
                        )}
                      </div>
                      {assessment.status === 'COMPLETED' && (
                        <button onClick={() => viewPastResults(assessment.id)} className="btn btn-secondary text-sm">
                          View Results
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (assessmentState === 'taking' && currentAssessment) {
    const currentQuestion = currentAssessment.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentAssessment.questions.length) * 100;
    const ratingOptions = getNumericRatingOptions(currentQuestion.ratingOptions);

    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {currentAssessment.questions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-primary-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="card">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-800 mb-4">
              {currentQuestion.competencyName}
            </span>
            <div className="flex items-start space-x-2 mb-2">
              <h2 className="text-xl font-bold text-gray-900" title={currentQuestion.examples?.[0] || undefined}>
                {currentQuestion.statement}
              </h2>
              {currentQuestion.examples && currentQuestion.examples.length > 0 && (
                <span className="mt-1" title={currentQuestion.examples[0]}>
                  <Info size={16} className="text-gray-400 cursor-help" />
                </span>
              )}
            </div>
            {currentQuestion.proficiencyLevelName && (
              <p className="text-sm text-gray-600 mb-2">Expected level: {currentQuestion.proficiencyLevelName}</p>
            )}
            <p className="text-sm text-gray-600 mb-6">
              Use the scale below to reflect how consistently you demonstrate this behavior.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {ratingOptions.map((option) => (
                <button
                  key={`${currentQuestion.id}-${option.value}`}
                  onClick={() => setCurrentRating(option.value)}
                  className={`border border-gray-200 rounded-lg p-4 text-left transition-colors ${
                    currentRating === option.value
                      ? 'border-primary-600 bg-primary-50 text-primary-900'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <div className="text-2xl font-bold">{option.value}</div>
                  <div className="text-xs mt-1 text-left">{option.label}</div>
                </button>
              ))}
            </div>
            {ratingOptions.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Scale details</p>
                <ol className="space-y-2 text-sm text-gray-700 list-decimal ml-4">
                  {ratingOptions.map((option) => (
                    <li key={`descriptor-${currentQuestion.id}-${option.value}`}>
                      <span className="font-semibold text-primary-700 mr-2">{option.value}.</span>
                      {option.label}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Comments (Optional)</label>
            <textarea
              value={currentComment}
              onChange={(e) => setCurrentComment(e.target.value)}
              className="input"
              rows={3}
              placeholder="Add any notes or context about your rating..."
            />
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => {
                if (currentQuestionIndex > 0) {
                  setCurrentQuestionIndex(currentQuestionIndex - 1);
                  setCurrentRating(null);
                  setCurrentComment('');
                }
              }}
              disabled={currentQuestionIndex === 0}
              className="btn btn-secondary"
            >
              Previous
            </button>
            <button onClick={submitResponse} disabled={isSubmitting || currentRating === null} className="btn btn-primary">
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin mr-2" size={16} />
                  Submitting...
                </>
              ) : currentQuestionIndex === currentAssessment.questions.length - 1 ? (
                'Complete Assessment'
              ) : (
                'Next Question'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (assessmentState === 'results' && results) {
    return (
      <div className="space-y-6">
        <div className="card">
          <div className="flex items-center space-x-3 mb-6">
            <CheckCircle className="text-green-600" size={32} />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Assessment Complete!</h2>
              <p className="text-gray-600">Here are your results</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-primary-50 rounded-lg p-4">
              <p className="text-sm text-primary-700 mb-1">Average Score</p>
              <p className="text-3xl font-bold text-primary-900">{results.averageScore.toFixed(2)}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Questions Answered</p>
              <p className="text-3xl font-bold text-blue-900">
                {results.answeredCount} / {results.totalQuestions}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">Competencies Assessed</p>
              <p className="text-3xl font-bold text-green-900">{results.competencyBreakdown.length}</p>
            </div>
          </div>

          <button onClick={resetAssessment} className="btn btn-primary w-full">
            Take Another Assessment
          </button>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Competency Breakdown</h3>
          <div className="space-y-6">
            {results.competencyBreakdown.map((comp: any) => (
              <div key={comp.competencyId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{comp.competencyName}</h4>
                    <p className="text-sm text-gray-600">Average Score: {comp.averageScore.toFixed(2)}</p>
                  </div>
                  <span className="text-sm text-gray-500">{comp.totalQuestions} questions</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500">Self-reflection</p>
          <h2 className="text-xl font-semibold text-gray-900">Self-assessments</h2>
        </div>
        <CheckCircle className="text-primary-500" size={20} />
      </div>
      <div className="p-4 border border-dashed border-primary-200 rounded-xl bg-primary-50">
        {myAssessments.some((assessment) => assessment.status === 'IN_PROGRESS') ? (
          <>
            <p className="text-sm text-primary-600">In progress</p>
            <p className="text-lg font-semibold text-primary-900">Tap to resume where you left off</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={() => setAssessmentState('select')} className="btn btn-primary flex items-center space-x-2">
                <PlayCircle size={18} />
                <span>Continue self-assessment</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-primary-600">Ready when you are</p>
            <p className="text-lg font-semibold text-primary-900">Start a self-assessment to unlock fresh insights</p>
            <div className="flex flex-wrap gap-3 mt-4">
              <button onClick={() => setAssessmentState('select')} className="btn btn-primary flex items-center space-x-2">
                <Sparkles size={18} />
                <span>Start new assessment</span>
              </button>
              <button onClick={() => setAssessmentState('select')} className="btn btn-secondary">
                View competency library
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
