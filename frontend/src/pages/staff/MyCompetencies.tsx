import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Brain, BookOpen, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { SelfAssessmentExperience, AssessmentCompetency } from '../../components/SelfAssessmentExperience';

interface RoleCompetencyAssignment {
  id: string;
  isMandatory: boolean;
  competency: {
    id: string;
    name: string;
    description?: string | null;
    type?: string | null;
  };
  level?: {
    id: string;
    name: string;
    numericLevel: number;
  };
}

interface RoleProfileAssignment {
  id: string;
  title: string;
  department: string;
  seniority?: string;
  description?: string | null;
  roleCompetencies?: RoleCompetencyAssignment[];
}

export const MyCompetencies: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const staffQuery = new URLSearchParams(location.search).get('view') === 'staff' ? '?view=staff' : '';
  const staffPath = (path: string) => `${path}${staffQuery}`;

  const [roles, setRoles] = useState<RoleProfileAssignment[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = user?.department ? { department: user.department } : undefined;
      const response = await apiService.getRoleProfiles(params);
      const roleList = Array.isArray(response.data) ? response.data : [];
      setRoles(roleList);
      if (roleList.length) {
        const normalizedPosition = user?.position?.toLowerCase();
        const preferred = normalizedPosition
          ? roleList.find((role) => role.title?.toLowerCase() === normalizedPosition)
          : null;
        const fallback = preferred || roleList[0];
        setSelectedRoleId(fallback.id);
      } else {
        setSelectedRoleId(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Unable to load assigned competencies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [user?.department, user?.position]);

  const selectedRole = useMemo(() => roles.find((role) => role.id === selectedRoleId) || null, [roles, selectedRoleId]);

  const assignedCompetencies = useMemo(() => {
    if (!selectedRole?.roleCompetencies) return [];
    return selectedRole.roleCompetencies;
  }, [selectedRole]);

  const assessmentCompetencies: AssessmentCompetency[] = useMemo(
    () =>
      assignedCompetencies.map((assignment) => ({
        id: assignment.competency.id,
        name: assignment.competency.name,
        description: assignment.competency.description || undefined,
        type: assignment.competency.type || undefined,
      })),
    [assignedCompetencies]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-primary-600" size={36} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="card bg-red-50 border border-red-200 text-red-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button className="text-sm underline" onClick={loadAssignments}>
            Retry
          </button>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500 uppercase tracking-wide">Competency focus</p>
            <h1 className="text-3xl font-bold text-gray-900 mt-1">Skills aligned to your role</h1>
            <p className="text-gray-600 mt-2">
              These competencies come from the role profiles defined by your HR team. Grow mastery to stay on track for your next opportunity.
            </p>
          </div>
          {roles.length > 1 && (
            <div className="flex flex-col">
              <label className="text-sm text-gray-500 mb-1">Role profile</label>
              <select
                value={selectedRoleId || ''}
                onChange={(e) => setSelectedRoleId(e.target.value)}
                className="input"
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.title} · {role.department}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {selectedRole ? (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Assigned competencies</p>
              <h2 className="text-xl font-semibold text-gray-900">{selectedRole.title}</h2>
              <p className="text-sm text-gray-500">
                {selectedRole.department} · {selectedRole.seniority || 'All levels'}
              </p>
            </div>
          </div>
          {assignedCompetencies.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-600">No competencies linked to this role yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedCompetencies.map((assignment) => (
                <div key={assignment.id} className="border border-gray-100 rounded-xl p-4 flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{assignment.competency.name}</p>
                    {assignment.competency.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{assignment.competency.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
                      {assignment.competency.type && (
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 capitalize">{assignment.competency.type.toLowerCase()}</span>
                      )}
                      {assignment.isMandatory && <span className="px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">Mandatory</span>}
                    </div>
                  </div>
                  {assignment.level && (
                    <div className="text-right text-sm text-gray-500">
                      <p>Target level</p>
                      <p className="text-base font-semibold text-gray-900">{assignment.level.name}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-12">
          <Brain className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-600">No role profile assigned. Ask your manager which competency model applies to you.</p>
        </div>
      )}

      <SelfAssessmentExperience competencies={assessmentCompetencies} />

      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">Need more context?</p>
            <h3 className="text-lg font-semibold text-gray-900">Browse the full library</h3>
            <p className="text-sm text-gray-600">See every competency available and the behaviors managers look for.</p>
          </div>
          <Link to={staffPath('/competencies')} className="btn btn-secondary flex items-center space-x-2">
            <BookOpen size={18} />
            <span>Open library</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
