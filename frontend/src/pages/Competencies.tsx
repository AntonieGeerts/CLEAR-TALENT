import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { Competency } from '../types';
import { BookOpen, Plus, Sparkles, Loader, Trash2, Edit, ClipboardList, CheckCircle } from 'lucide-react';

type TabType = 'competencies' | 'questions' | 'assessment';

export const Competencies: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('competencies');
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [allQuestions, setAllQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showGenerateByCategoryModal, setShowGenerateByCategoryModal] = useState(false);
  const [showAssessmentQuestionsModal, setShowAssessmentQuestionsModal] = useState(false);
  const [selectedCompetency, setSelectedCompetency] = useState<Competency | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCompetencies();
  }, []);

  useEffect(() => {
    if (activeTab === 'questions' || activeTab === 'assessment') {
      loadAllQuestions();
    }
  }, [activeTab, competencies]);

  const loadCompetencies = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCompetencies();
      setCompetencies(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load competencies');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllQuestions = async () => {
    try {
      const allQs: any[] = [];
      for (const comp of competencies) {
        const response = await apiService.getCompetencyQuestions(comp.id);
        const questions = (response.data || []).map((q: any) => ({
          ...q,
          competency: comp,
        }));
        allQs.push(...questions);
      }
      setAllQuestions(allQs);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load questions');
    }
  };

  const handleEdit = (competency: Competency) => {
    setSelectedCompetency(competency);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this competency?')) return;

    try {
      await apiService.deleteCompetency(id);
      loadCompetencies();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete competency');
    }
  };

  const handleViewAssessmentQuestions = (competency: Competency) => {
    setSelectedCompetency(competency);
    setShowAssessmentQuestionsModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Competency Library</h1>
          <p className="text-gray-600 mt-1">Manage competencies, questions, and assessments</p>
        </div>
        {activeTab === 'competencies' && (
          <div className="flex space-x-3">
            <button
              onClick={() => setShowGenerateByCategoryModal(true)}
              className="btn btn-secondary flex items-center space-x-2"
            >
              <Sparkles size={20} />
              <span>Generate by Category</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>New Competency</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('competencies')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'competencies'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BookOpen className="inline-block mr-2" size={18} />
            Competencies
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'questions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ClipboardList className="inline-block mr-2" size={18} />
            Questions ({allQuestions.length})
          </button>
          <button
            onClick={() => setActiveTab('assessment')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'assessment'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <CheckCircle className="inline-block mr-2" size={18} />
            Take Assessment
          </button>
        </nav>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'competencies' && (
        <>
          {/* Loading State */}
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="animate-spin text-primary-600" size={32} />
            </div>
          ) : competencies.length === 0 ? (
            /* Empty State */
            <div className="card text-center py-12">
              <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No competencies yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by generating competencies by category using AI or creating them manually.
              </p>
              <div className="flex justify-center space-x-3">
                <button
                  onClick={() => setShowGenerateByCategoryModal(true)}
                  className="btn btn-secondary flex items-center space-x-2"
                >
                  <Sparkles size={20} />
                  <span>Generate by Category</span>
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Plus size={20} />
                  <span>Create Manually</span>
                </button>
              </div>
            </div>
          ) : (
            /* Competencies Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competencies.map((competency) => (
            <div key={competency.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{competency.name}</h3>
                    {competency.aiGenerated && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                        <Sparkles size={12} className="mr-1" />
                        AI
                      </span>
                    )}
                  </div>
                  <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                    {competency.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{competency.description}</p>
              {competency.category && (
                <p className="text-xs text-gray-500 mb-4">Category: {competency.category}</p>
              )}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(competency)}
                    className="flex-1 btn btn-secondary text-sm py-2"
                  >
                    <Edit size={16} className="inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(competency.id)}
                    className="btn btn-danger text-sm py-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <button
                  onClick={() => handleViewAssessmentQuestions(competency)}
                  className="w-full btn btn-secondary text-sm py-2 flex items-center justify-center space-x-1"
                >
                  <Sparkles size={16} />
                  <span>Assessment Questions</span>
                </button>
              </div>
            </div>
          ))}
        </div>
          )}
        </>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          {allQuestions.length === 0 ? (
            <div className="card text-center py-12">
              <ClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
              <p className="text-gray-600 mb-6">
                Generate assessment questions for your competencies to get started.
              </p>
              <button
                onClick={() => setActiveTab('competencies')}
                className="btn btn-primary"
              >
                Go to Competencies
              </button>
            </div>
          ) : (
            <>
              <div className="card">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  All Assessment Questions ({allQuestions.length})
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  View and manage all generated assessment questions across your competencies.
                </p>
              </div>

              <div className="space-y-6">
                {Object.entries(
                  allQuestions.reduce((acc: any, q) => {
                    const compName = q.competency.name;
                    if (!acc[compName]) acc[compName] = [];
                    acc[compName].push(q);
                    return acc;
                  }, {})
                ).map(([compName, questions]: [string, any]) => (
                  <div key={compName} className="card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">{compName}</h3>
                      <span className="text-sm text-gray-500">{questions.length} questions</span>
                    </div>
                    <div className="space-y-3">
                      {questions.map((q: any, index: number) => (
                        <div key={q.id} className="border-l-4 border-primary-200 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-900 mb-2">
                                <span className="font-semibold text-primary-600 mr-2">
                                  Q{index + 1}.
                                </span>
                                {q.statement}
                              </p>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                                  {q.type.toLowerCase()}
                                </span>
                                {q.aiGenerated && (
                                  <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded flex items-center">
                                    <Sparkles size={12} className="mr-1" />
                                    AI Generated
                                  </span>
                                )}
                              </div>
                              {q.examples && q.examples.length > 0 && (
                                <div className="mt-2 pl-3 border-l-2 border-gray-200">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">
                                    Examples:
                                  </p>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {q.examples.map((ex: string, i: number) => (
                                      <li key={i}>• {ex}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Assessment Tab */}
      {activeTab === 'assessment' && (
        <AssessmentTab competencies={competencies} />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCompetencyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadCompetencies();
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCompetency && (
        <EditCompetencyModal
          competency={selectedCompetency}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCompetency(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedCompetency(null);
            loadCompetencies();
          }}
        />
      )}

      {/* Generate by Category Modal */}
      {showGenerateByCategoryModal && (
        <GenerateByCategoryModal
          onClose={() => setShowGenerateByCategoryModal(false)}
          onSuccess={() => {
            setShowGenerateByCategoryModal(false);
            loadCompetencies();
          }}
        />
      )}

      {/* Assessment Questions Modal */}
      {showAssessmentQuestionsModal && selectedCompetency && (
        <AssessmentQuestionsModal
          competency={selectedCompetency}
          onClose={() => {
            setShowAssessmentQuestionsModal(false);
            setSelectedCompetency(null);
          }}
        />
      )}
    </div>
  );
};

// Create Competency Modal Component
const CreateCompetencyModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('CORE');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiService.createCompetency({
        name,
        description,
        type,
        category: category || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create competency');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Competency</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="input">
              <option value="CORE">Core</option>
              <option value="LEADERSHIP">Leadership</option>
              <option value="FUNCTIONAL">Functional</option>
              <option value="TECHNICAL">Technical</option>
            </select>
          </div>

          <div>
            <label className="label">Category (Optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
              placeholder="e.g., Software Development, Communication"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Creating...' : 'Create Competency'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit Competency Modal Component
const EditCompetencyModal: React.FC<{
  competency: Competency;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ competency, onClose, onSuccess }) => {
  const [name, setName] = useState(competency.name);
  const [description, setDescription] = useState(competency.description);
  const [type, setType] = useState(competency.type);
  const [category, setCategory] = useState(competency.category || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await apiService.updateCompetency(competency.id, {
        name,
        description,
        type,
        category: category || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update competency');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Competency</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input"
              rows={4}
              required
            />
          </div>

          <div>
            <label className="label">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)} className="input">
              <option value="CORE">Core</option>
              <option value="LEADERSHIP">Leadership</option>
              <option value="FUNCTIONAL">Functional</option>
              <option value="TECHNICAL">Technical</option>
            </select>
          </div>

          <div>
            <label className="label">Category (Optional)</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input"
              placeholder="e.g., Software Development, Communication"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Generate by Category Modal Component
const GenerateByCategoryModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<'CORE' | 'LEADERSHIP' | 'FUNCTIONAL'>('CORE');
  const [count, setCount] = useState(5);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [companyValues, setCompanyValues] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [generatedCompetencies, setGeneratedCompetencies] = useState<any[]>([]);
  const [selectedCompetencies, setSelectedCompetencies] = useState<Set<number>>(new Set());

  const categoryDescriptions = {
    CORE: 'Core competencies are fundamental skills and behaviors essential for all employees across the organization, such as Customer Orientation, Personal Accountability, Work Standard Compliance, Communication, and Teamwork.',
    LEADERSHIP: 'Leadership competencies are skills required for managing and leading teams, including Strategic Thinking, Business Acumen, Managing Performance, and Empowering Others.',
    FUNCTIONAL: 'Functional competencies are role-specific technical skills and knowledge required to perform specific job functions effectively.',
  };

  const handleGenerate = async () => {
    setError('');

    // Validate required fields
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (!industry.trim()) {
      setError('Industry is required');
      return;
    }

    setIsGenerating(true);
    setGeneratedCompetencies([]);

    try {
      const response = await apiService.generateCompetenciesByCategory({
        category,
        count,
        companyContext: {
          companyName: companyName.trim(),
          industry: industry.trim(),
          companySize: companySize || undefined,
          companyValues: companyValues.trim() || undefined,
          companyDescription: companyDescription.trim() || undefined,
        },
      });
      setGeneratedCompetencies(response.data || []);
      setSelectedCompetencies(new Set(response.data?.map((_: any, i: number) => i) || []));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate competencies');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedCompetencies);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedCompetencies(newSelected);
  };

  const handleSave = async () => {
    setError('');
    setIsSaving(true);

    try {
      const competenciesToSave = generatedCompetencies.filter((_, i) =>
        selectedCompetencies.has(i)
      );

      for (const comp of competenciesToSave) {
        await apiService.createCompetency({
          name: comp.name,
          description: comp.description,
          type: comp.type,
          category: comp.category,
        });
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save competencies');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center space-x-3 mb-6">
          <Sparkles className="text-primary-600" size={28} />
          <h2 className="text-2xl font-bold text-gray-900">Generate Competencies by Category</h2>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              <strong>About Company Context:</strong> Providing your company information helps AI generate competencies tailored to your organization's specific industry, values, and culture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="input"
                placeholder="e.g., Acme Corporation"
                disabled={isGenerating || generatedCompetencies.length > 0}
                required
              />
            </div>

            <div>
              <label className="label">
                Industry <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="input"
                placeholder="e.g., Technology, Healthcare, Retail"
                disabled={isGenerating || generatedCompetencies.length > 0}
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Company Size (Optional)</label>
            <select
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
              className="input"
              disabled={isGenerating || generatedCompetencies.length > 0}
            >
              <option value="">Select size...</option>
              <option value="Small">Small (1-50 employees)</option>
              <option value="Medium">Medium (51-200 employees)</option>
              <option value="Large">Large (201-1000 employees)</option>
              <option value="Enterprise">Enterprise (1000+ employees)</option>
            </select>
          </div>

          <div>
            <label className="label">Company Values (Optional)</label>
            <textarea
              value={companyValues}
              onChange={(e) => setCompanyValues(e.target.value)}
              className="input"
              rows={2}
              placeholder="e.g., Innovation, Customer First, Integrity, Teamwork"
              disabled={isGenerating || generatedCompetencies.length > 0}
            />
            <p className="text-xs text-gray-500 mt-1">
              List your core values to help AI align competencies with your culture
            </p>
          </div>

          <div>
            <label className="label">Company Description (Optional)</label>
            <textarea
              value={companyDescription}
              onChange={(e) => setCompanyDescription(e.target.value)}
              className="input"
              rows={3}
              placeholder="Brief description of your company, products/services, and what makes you unique"
              disabled={isGenerating || generatedCompetencies.length > 0}
            />
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div>
              <label className="label">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="input"
                disabled={isGenerating || generatedCompetencies.length > 0}
              >
                <option value="CORE">Core Competencies</option>
                <option value="LEADERSHIP">Leadership Competencies</option>
                <option value="FUNCTIONAL">Functional Competencies</option>
              </select>
              <p className="text-sm text-gray-600 mt-2">{categoryDescriptions[category]}</p>
            </div>
          </div>

          <div>
            <label className="label">Number of Competencies</label>
            <input
              type="number"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              className="input"
              disabled={isGenerating || generatedCompetencies.length > 0}
            />
          </div>

          {generatedCompetencies.length === 0 && (
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="btn btn-primary"
              >
                {isGenerating ? (
                  <>
                    <Loader className="animate-spin mr-2" size={16} />
                    Generating...
                  </>
                ) : (
                  'Generate Competencies'
                )}
              </button>
            </div>
          )}
        </div>

        {generatedCompetencies.length > 0 && (
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Generated Competencies ({selectedCompetencies.size} selected)
              </h3>
              <button
                onClick={() => {
                  setGeneratedCompetencies([]);
                  setSelectedCompetencies(new Set());
                  setError('');
                }}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Start Over
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {generatedCompetencies.map((comp, index) => (
                <div
                  key={index}
                  className={`card cursor-pointer border-2 transition-colors ${
                    selectedCompetencies.has(index)
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleSelection(index)}
                >
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={selectedCompetencies.has(index)}
                      onChange={() => toggleSelection(index)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{comp.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{comp.description}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">{comp.type}</span>
                        {comp.category && (
                          <span className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded">
                            {comp.category}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || selectedCompetencies.size === 0}
                className="btn btn-primary"
              >
                {isSaving ? (
                  <>
                    <Loader className="animate-spin mr-2" size={16} />
                    Saving...
                  </>
                ) : (
                  `Save Selected (${selectedCompetencies.size})`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Assessment Questions Modal Component
const AssessmentQuestionsModal: React.FC<{
  competency: Competency;
  onClose: () => void;
}> = ({ competency, onClose }) => {
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [scoringSystems, setScoringSystems] = useState<any[]>([]);
  const [selectedScoringSystem, setSelectedScoringSystem] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [newQuestion, setNewQuestion] = useState({
    statement: '',
    type: 'BEHAVIORAL' as 'BEHAVIORAL' | 'SITUATIONAL' | 'TECHNICAL' | 'KNOWLEDGE',
    examples: [''],
    weight: 1.0,
    scoreMin: 1,
    scoreMax: 5,
  });

  // Load existing questions and scoring systems on mount
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadQuestions(), loadScoringSystems()]);
    };
    loadData();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getCompetencyQuestions(competency.id);
      setQuestions(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadScoringSystems = async () => {
    try {
      const response = await apiService.getScoringSystems();
      setScoringSystems(response.data || []);

      // Set default scoring system as selected
      const defaultSystem = response.data?.find((s: any) => s.isDefault);
      if (defaultSystem) {
        setSelectedScoringSystem(defaultSystem);
      } else if (response.data && response.data.length > 0) {
        setSelectedScoringSystem(response.data[0]);
      }
    } catch (err: any) {
      console.error('Failed to load scoring systems:', err);
    }
  };

  const handleGenerate = async () => {
    setError('');
    setIsGenerating(true);

    try {
      await apiService.generateAssessmentQuestions(competency.id, count, true);
      await loadQuestions(); // Reload to show saved questions
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate assessment questions');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.statement.trim()) {
      setError('Question statement is required');
      return;
    }

    try {
      await apiService.createCompetencyQuestion(competency.id, {
        statement: newQuestion.statement,
        type: newQuestion.type,
        examples: newQuestion.examples.filter((ex) => ex.trim()),
      });
      setNewQuestion({
        statement: '',
        type: 'BEHAVIORAL',
        examples: [''],
        weight: 1.0,
        scoreMin: 1,
        scoreMax: 5,
      });
      setShowAddForm(false);
      await loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add question');
    }
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    setShowAddForm(false);
  };

  const handleUpdateQuestion = async () => {
    if (!editingQuestion.statement.trim()) {
      setError('Question statement is required');
      return;
    }

    try {
      await apiService.updateCompetencyQuestion(editingQuestion.id, {
        statement: editingQuestion.statement,
        type: editingQuestion.type,
        examples: editingQuestion.examples.filter((ex: string) => ex.trim()),
      });
      setEditingQuestion(null);
      await loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update question');
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;

    try {
      await apiService.deleteCompetencyQuestion(questionId);
      await loadQuestions();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete question');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Sparkles className="text-primary-600" size={28} />
            <h2 className="text-2xl font-bold text-gray-900">Assessment Questions</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-gray-900 mb-2">{competency.name}</h3>
          <p className="text-sm text-gray-600 mb-2">{competency.description}</p>
          <div className="flex items-center space-x-2">
            <span className="text-xs px-2 py-1 bg-gray-100 rounded">{competency.type}</span>
            {competency.category && (
              <span className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded">
                {competency.category}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {/* Existing Questions */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin text-primary-600" size={32} />
          </div>
        ) : (
          <>
            {questions.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Existing Questions ({questions.length})
                </h3>
                <div className="space-y-3">
                  {questions.map((q, index) => (
                    <div key={q.id} className="card">
                      {editingQuestion?.id === q.id ? (
                        /* Edit Form */
                        <div className="space-y-4">
                          <div>
                            <label className="label">Question Statement</label>
                            <textarea
                              value={editingQuestion.statement}
                              onChange={(e) =>
                                setEditingQuestion({ ...editingQuestion, statement: e.target.value })
                              }
                              className="input min-h-[80px]"
                              placeholder="Enter the assessment question..."
                            />
                          </div>
                          <div>
                            <label className="label">Question Type</label>
                            <select
                              value={editingQuestion.type}
                              onChange={(e) =>
                                setEditingQuestion({ ...editingQuestion, type: e.target.value })
                              }
                              className="input"
                            >
                              <option value="BEHAVIORAL">Behavioral</option>
                              <option value="SITUATIONAL">Situational</option>
                              <option value="TECHNICAL">Technical</option>
                              <option value="KNOWLEDGE">Knowledge</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">Examples (Optional)</label>
                            {editingQuestion.examples.map((ex: string, i: number) => (
                              <div key={i} className="flex space-x-2 mb-2">
                                <input
                                  type="text"
                                  value={ex}
                                  onChange={(e) => {
                                    const newExamples = [...editingQuestion.examples];
                                    newExamples[i] = e.target.value;
                                    setEditingQuestion({ ...editingQuestion, examples: newExamples });
                                  }}
                                  className="input flex-1"
                                  placeholder="Example..."
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newExamples = editingQuestion.examples.filter(
                                      (_: any, idx: number) => idx !== i
                                    );
                                    setEditingQuestion({ ...editingQuestion, examples: newExamples });
                                  }}
                                  className="btn btn-secondary"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingQuestion({
                                  ...editingQuestion,
                                  examples: [...editingQuestion.examples, ''],
                                });
                              }}
                              className="btn btn-secondary text-sm"
                            >
                              <Plus size={14} className="inline mr-1" />
                              Add Example
                            </button>
                          </div>
                          <div className="flex justify-end space-x-3">
                            <button
                              onClick={() => setEditingQuestion(null)}
                              className="btn btn-secondary"
                            >
                              Cancel
                            </button>
                            <button onClick={handleUpdateQuestion} className="btn btn-primary">
                              Update Question
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Display Mode */
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold text-sm">
                              {index + 1}
                            </span>
                            <div className="flex-1">
                              <p className="text-gray-900 mb-2">{q.statement}</p>
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                                  {q.type.toLowerCase()}
                                </span>
                                {q.aiGenerated && (
                                  <span className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded flex items-center">
                                    <Sparkles size={12} className="mr-1" />
                                    AI
                                  </span>
                                )}
                              </div>
                              {q.examples && q.examples.length > 0 && (
                                <div className="mt-3 pl-3 border-l-2 border-gray-200">
                                  <p className="text-xs font-semibold text-gray-700 mb-1">
                                    Examples:
                                  </p>
                                  <ul className="text-xs text-gray-600 space-y-1">
                                    {q.examples.map((ex: string, i: number) => (
                                      <li key={i}>• {ex}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditQuestion(q)}
                              className="text-primary-600 hover:text-primary-800"
                              title="Edit question"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete question"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Question Form */}
            {showAddForm && (
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Add New Question</h3>
                <div className="space-y-4">
                  <div>
                    <label className="label">Question Statement</label>
                    <textarea
                      value={newQuestion.statement}
                      onChange={(e) =>
                        setNewQuestion({ ...newQuestion, statement: e.target.value })
                      }
                      className="input"
                      rows={3}
                      placeholder="Enter the assessment question..."
                    />
                  </div>
                  <div>
                    <label className="label">Question Type</label>
                    <select
                      value={newQuestion.type}
                      onChange={(e) =>
                        setNewQuestion({
                          ...newQuestion,
                          type: e.target.value as any,
                        })
                      }
                      className="input"
                    >
                      <option value="BEHAVIORAL">Behavioral</option>
                      <option value="SITUATIONAL">Situational</option>
                      <option value="TECHNICAL">Technical</option>
                      <option value="KNOWLEDGE">Knowledge</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Examples (Optional)</label>
                    {newQuestion.examples.map((ex, i) => (
                      <div key={i} className="flex items-center space-x-2 mb-2">
                        <input
                          type="text"
                          value={ex}
                          onChange={(e) => {
                            const updated = [...newQuestion.examples];
                            updated[i] = e.target.value;
                            setNewQuestion({ ...newQuestion, examples: updated });
                          }}
                          className="input flex-1"
                          placeholder="Example answer or scenario..."
                        />
                        {i > 0 && (
                          <button
                            onClick={() => {
                              const updated = newQuestion.examples.filter((_, idx) => idx !== i);
                              setNewQuestion({ ...newQuestion, examples: updated });
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        setNewQuestion({
                          ...newQuestion,
                          examples: [...newQuestion.examples, ''],
                        })
                      }
                      className="text-sm text-primary-600 hover:text-primary-800"
                    >
                      + Add Example
                    </button>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowAddForm(false);
                        setNewQuestion({
                          statement: '',
                          type: 'BEHAVIORAL',
                          examples: [''],
                          weight: 1.0,
                          scoreMin: 1,
                          scoreMax: 5,
                        });
                      }}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button onClick={handleAddQuestion} className="btn btn-primary">
                      Add Question
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Generate Section */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">AI Generation</h3>
                {!showAddForm && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="btn btn-secondary text-sm"
                  >
                    <Plus size={16} className="inline mr-1" />
                    Add Manual Question
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="label">Scoring System</label>
                  <select
                    value={selectedScoringSystem?.id || ''}
                    onChange={(e) => {
                      const system = scoringSystems.find((s) => s.id === e.target.value);
                      setSelectedScoringSystem(system);
                    }}
                    className="input"
                    disabled={isGenerating}
                  >
                    {scoringSystems.map((system) => (
                      <option key={system.id} value={system.id}>
                        {system.name}
                        {system.isDefault ? ' (Default)' : ''}
                      </option>
                    ))}
                  </select>
                  {selectedScoringSystem && (
                    <p className="text-xs text-gray-600 mt-1">
                      {selectedScoringSystem.description}
                    </p>
                  )}
                </div>
                <div>
                  <label className="label">Number of Questions to Generate</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 5)}
                    className="input"
                    disabled={isGenerating}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={onClose} className="btn btn-secondary">
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="btn btn-primary"
                  >
                    {isGenerating ? (
                      <>
                        <Loader className="animate-spin mr-2" size={16} />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} className="inline mr-1" />
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Assessment Tab Component
const AssessmentTab: React.FC<{ competencies: Competency[] }> = ({ competencies }) => {
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

  const competenciesWithQuestions = competencies.filter((c) => {
    // Check if competency has questions (we'll assume it does if it exists)
    return true;
  });

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
      setCurrentQuestionIndex(0);
      setCurrentRating(null);
      setCurrentComment('');
      setAssessmentState('taking');
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

      // Move to next question or complete
      if (currentQuestionIndex < currentAssessment.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentRating(null);
        setCurrentComment('');
      } else {
        // Complete assessment
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

  // Selection State
  if (assessmentState === 'select') {
    return (
      <div className="space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Take Assessment</h2>
          <p className="text-gray-600 mb-6">
            Select the competencies you want to assess yourself on. You'll be asked a series of questions
            for each selected competency.
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
              <p className="text-gray-600 mb-6">
                Create and generate assessment questions for competencies first.
              </p>
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
                        <span className="inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                          {comp.type.replace('_', ' ')}
                        </span>
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

        {/* Assessment History */}
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
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            assessment.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
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
                        <button
                          onClick={() => viewPastResults(assessment.id)}
                          className="btn btn-secondary text-sm"
                        >
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

  // Taking Assessment State
  if (assessmentState === 'taking' && currentAssessment) {
    const currentQuestion = currentAssessment.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentAssessment.questions.length) * 100;

    return (
      <div className="space-y-6">
        {/* Progress Bar */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} of {currentAssessment.questions.length}
            </span>
            <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="card">
          <div className="mb-4">
            <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-primary-100 text-primary-800 mb-4">
              {currentQuestion.competencyName}
            </span>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {currentQuestion.statement}
            </h2>
            {currentQuestion.examples && currentQuestion.examples.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">Examples:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {currentQuestion.examples.map((example: string, i: number) => (
                    <li key={i}>• {example}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* Rating Scale */}
          <div className="space-y-4 mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Rate your proficiency (1 = Lowest, 5 = Highest)
            </label>
            <div className="flex space-x-4">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setCurrentRating(rating)}
                  className={`flex-1 py-4 rounded-lg border-2 transition-colors ${
                    currentRating === rating
                      ? 'border-primary-600 bg-primary-50 text-primary-900'
                      : 'border-gray-300 hover:border-gray-400 text-gray-700'
                  }`}
                >
                  <div className="text-2xl font-bold">{rating}</div>
                  <div className="text-xs mt-1">
                    {rating === 1 && 'Beginner'}
                    {rating === 2 && 'Basic'}
                    {rating === 3 && 'Intermediate'}
                    {rating === 4 && 'Advanced'}
                    {rating === 5 && 'Expert'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Optional Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Comments (Optional)
            </label>
            <textarea
              value={currentComment}
              onChange={(e) => setCurrentComment(e.target.value)}
              className="input"
              rows={3}
              placeholder="Add any notes or context about your rating..."
            />
          </div>

          {/* Navigation */}
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
            <button
              onClick={submitResponse}
              disabled={isSubmitting || currentRating === null}
              className="btn btn-primary"
            >
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

  // Results State
  if (assessmentState === 'results' && results) {
    return (
      <div className="space-y-6">
        {/* Results Summary */}
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
              <p className="text-3xl font-bold text-primary-900">
                {results.averageScore.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-700 mb-1">Questions Answered</p>
              <p className="text-3xl font-bold text-blue-900">
                {results.answeredCount} / {results.totalQuestions}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">Competencies Assessed</p>
              <p className="text-3xl font-bold text-green-900">
                {results.competencyBreakdown.length}
              </p>
            </div>
          </div>

          <button
            onClick={resetAssessment}
            className="btn btn-primary w-full"
          >
            Take Another Assessment
          </button>
        </div>

        {/* Competency Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Competency Breakdown</h3>
          <div className="space-y-6">
            {results.competencyBreakdown.map((comp: any) => (
              <div key={comp.competencyId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">{comp.competencyName}</h4>
                    <p className="text-sm text-gray-600">{comp.questionsCount} questions</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600">
                      {comp.averageScore.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">Average Score</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {comp.responses.map((response: any, index: number) => (
                    <div key={response.questionId} className="border-l-4 border-primary-200 pl-4">
                      <p className="text-sm text-gray-900 mb-1">
                        <span className="font-semibold text-primary-600 mr-2">Q{index + 1}.</span>
                        {response.statement}
                      </p>
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-600">
                          Rating: <span className="font-semibold">{response.rating}/5</span>
                        </span>
                        <span className="text-gray-600">
                          Score: <span className="font-semibold">{response.score.toFixed(2)}</span>
                        </span>
                      </div>
                      {response.comment && (
                        <p className="text-sm text-gray-600 mt-2 italic">"{response.comment}"</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
};
