import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Calendar, CheckCircle, XCircle, Clock } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface PIP {
  id: string;
  employeeId: string;
  managerId: string;
  status: 'ACTIVE' | 'ON_TRACK' | 'AT_RISK' | 'COMPLETED' | 'TERMINATED';
  startDate: string;
  endDate: string;
  objectives: any[];
  checkIns: any[];
  finalOutcome?: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    department?: string;
    position?: string;
  };
}

export const PIPs: React.FC = () => {
  const { user } = useAuth();
  const [pips, setPips] = useState<PIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPIP, setSelectedPIP] = useState<PIP | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadPIPs();
  }, [filterStatus]);

  const loadPIPs = async () => {
    try {
      setLoading(true);
      const data = await apiService.getPIPs({ status: filterStatus });
      setPips(data);
    } catch (error) {
      console.error('Failed to load PIPs:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCreatePIP = ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER'].includes(user?.role || '');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'badge-primary';
      case 'ON_TRACK': return 'badge-success';
      case 'AT_RISK': return 'badge-warning';
      case 'COMPLETED': return 'badge-success';
      case 'TERMINATED': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ON_TRACK': return <CheckCircle size={16} />;
      case 'AT_RISK': return <AlertTriangle size={16} />;
      case 'COMPLETED': return <CheckCircle size={16} />;
      case 'TERMINATED': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Improvement Plans</h1>
          <p className="text-gray-600 mt-1">Track and manage performance interventions</p>
        </div>
        {canCreatePIP && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={20} />
            Create PIP
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2 rounded-lg ${!filterStatus ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'ACTIVE' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('ON_TRACK')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'ON_TRACK' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            On Track
          </button>
          <button
            onClick={() => setFilterStatus('AT_RISK')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'AT_RISK' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            At Risk
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-4 py-2 rounded-lg ${filterStatus === 'COMPLETED' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'}`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* PIPs List */}
      {pips.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No PIPs found</h3>
          <p className="text-gray-600 mb-4">
            {filterStatus ? 'No PIPs match the selected filter' : 'No performance improvement plans have been created yet'}
          </p>
          {canCreatePIP && !filterStatus && (
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Create First PIP
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {pips.map((pip) => (
            <div key={pip.id} className="card hover:shadow-lg transition-shadow cursor-pointer"
                 onClick={() => setSelectedPIP(pip)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(pip.status)}
                    <h3 className="text-lg font-semibold">
                      {pip.employee.firstName} {pip.employee.lastName}
                    </h3>
                    <span className={`badge ${getStatusColor(pip.status)}`}>
                      {pip.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Email:</strong> {pip.employee.email}</p>
                      <p><strong>Department:</strong> {pip.employee.department || 'N/A'}</p>
                      <p><strong>Position:</strong> {pip.employee.position || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="flex items-center gap-1">
                        <Calendar size={16} />
                        <strong>Start:</strong> {new Date(pip.startDate).toLocaleDateString()}
                      </p>
                      <p className="flex items-center gap-1">
                        <Calendar size={16} />
                        <strong>End:</strong> {new Date(pip.endDate).toLocaleDateString()}
                      </p>
                      <p><strong>Check-ins:</strong> {pip.checkIns?.length || 0}</p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Objectives:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {pip.objectives?.slice(0, 2).map((obj: any, idx: number) => (
                        <li key={idx}>{obj.title || obj.description}</li>
                      ))}
                      {pip.objectives?.length > 2 && (
                        <li className="text-gray-500">+{pip.objectives.length - 2} more</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create PIP Modal */}
      {showCreateModal && (
        <CreatePIPModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadPIPs();
          }}
        />
      )}

      {/* PIP Details Modal */}
      {selectedPIP && (
        <PIPDetailsModal
          pip={selectedPIP}
          onClose={() => setSelectedPIP(null)}
          onUpdate={loadPIPs}
        />
      )}
    </div>
  );
};

interface CreatePIPModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreatePIPModal: React.FC<CreatePIPModalProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    objectives: [{ title: '', description: '', metrics: '' }],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addObjective = () => {
    setFormData({
      ...formData,
      objectives: [...formData.objectives, { title: '', description: '', metrics: '' }],
    });
  };

  const updateObjective = (index: number, field: string, value: string) => {
    const newObjectives = [...formData.objectives];
    newObjectives[index] = { ...newObjectives[index], [field]: value };
    setFormData({ ...formData, objectives: newObjectives });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiService.createPIP(formData);
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create PIP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Create Performance Improvement Plan</h2>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Employee ID *</label>
            <input
              type="text"
              value={formData.employeeId}
              onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
              className="input"
              placeholder="Enter employee ID"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Enter the UUID of the employee</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="label">Objectives *</label>
              <button
                type="button"
                onClick={addObjective}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                + Add Objective
              </button>
            </div>

            <div className="space-y-3">
              {formData.objectives.map((obj, idx) => (
                <div key={idx} className="border rounded-lg p-3 space-y-2">
                  <input
                    type="text"
                    placeholder="Objective title"
                    value={obj.title}
                    onChange={(e) => updateObjective(idx, 'title', e.target.value)}
                    className="input"
                    required
                  />
                  <textarea
                    placeholder="Description"
                    value={obj.description}
                    onChange={(e) => updateObjective(idx, 'description', e.target.value)}
                    className="input"
                    rows={2}
                  />
                  <input
                    type="text"
                    placeholder="Success metrics"
                    value={obj.metrics}
                    onChange={(e) => updateObjective(idx, 'metrics', e.target.value)}
                    className="input"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create PIP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface PIPDetailsModalProps {
  pip: PIP;
  onClose: () => void;
  onUpdate: () => void;
}

const PIPDetailsModal: React.FC<PIPDetailsModalProps> = ({ pip, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [checkInData, setCheckInData] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    progress: 50,
    actionItems: [''],
  });

  const canEdit = ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER'].includes(user?.role || '');

  const handleAddCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.addPIPCheckIn(pip.id, checkInData);
      setShowCheckInForm(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to add check-in:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold">Performance Improvement Plan</h2>
            <p className="text-gray-600">{pip.employee.firstName} {pip.employee.lastName}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Status */}
          <div>
            <span className={`badge ${getStatusColor(pip.status)}`}>
              {pip.status.replace('_', ' ')}
            </span>
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Start Date</p>
              <p className="font-medium">{new Date(pip.startDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">End Date</p>
              <p className="font-medium">{new Date(pip.endDate).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Objectives */}
          <div>
            <h3 className="font-semibold mb-2">Objectives</h3>
            <div className="space-y-2">
              {pip.objectives?.map((obj: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-3">
                  <p className="font-medium">{obj.title}</p>
                  {obj.description && <p className="text-sm text-gray-600 mt-1">{obj.description}</p>}
                  {obj.metrics && <p className="text-sm text-gray-500 mt-1">Metrics: {obj.metrics}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Check-ins */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold">Check-ins ({pip.checkIns?.length || 0})</h3>
              {canEdit && !showCheckInForm && (
                <button
                  onClick={() => setShowCheckInForm(true)}
                  className="btn btn-sm btn-primary"
                >
                  Add Check-in
                </button>
              )}
            </div>

            {showCheckInForm && (
              <form onSubmit={handleAddCheckIn} className="border rounded-lg p-4 mb-4 space-y-3">
                <div>
                  <label className="label">Date</label>
                  <input
                    type="date"
                    value={checkInData.date}
                    onChange={(e) => setCheckInData({ ...checkInData, date: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="label">Notes</label>
                  <textarea
                    value={checkInData.notes}
                    onChange={(e) => setCheckInData({ ...checkInData, notes: e.target.value })}
                    className="input"
                    rows={3}
                    required
                  />
                </div>
                <div>
                  <label className="label">Progress (%)</label>
                  <input
                    type="number"
                    value={checkInData.progress}
                    onChange={(e) => setCheckInData({ ...checkInData, progress: parseInt(e.target.value) })}
                    className="input"
                    min="0"
                    max="100"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary">Save Check-in</button>
                  <button
                    type="button"
                    onClick={() => setShowCheckInForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-2">
              {pip.checkIns?.map((checkIn: any, idx: number) => (
                <div key={idx} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{new Date(checkIn.date).toLocaleDateString()}</p>
                    <span className="text-sm text-gray-600">Progress: {checkIn.progress}%</span>
                  </div>
                  <p className="text-sm text-gray-700">{checkIn.notes}</p>
                </div>
              ))}
              {(!pip.checkIns || pip.checkIns.length === 0) && !showCheckInForm && (
                <p className="text-gray-500 text-sm">No check-ins recorded yet</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

function getStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE': return 'badge-primary';
    case 'ON_TRACK': return 'badge-success';
    case 'AT_RISK': return 'badge-warning';
    case 'COMPLETED': return 'badge-success';
    case 'TERMINATED': return 'badge-danger';
    default: return 'badge-secondary';
  }
}
