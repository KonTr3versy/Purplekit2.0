import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { TechniquesList } from '@/components/techniques/TechniquesList';
import { AddTechniquesModal } from '@/components/techniques/AddTechniquesModal';

interface Engagement {
  id: string;
  name: string;
  status: string;
}

interface EngagementTechnique {
  id: string;
  techniqueId: string;
}

export function TechniquesManagementPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch engagement
  const { data: engagement, isLoading: engagementLoading } = useQuery<Engagement>({
    queryKey: ['engagement', id],
    queryFn: async () => {
      const response = await api.get(`/engagements/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch existing techniques (to exclude from browser)
  const { data: techniquesData } = useQuery({
    queryKey: ['engagement-techniques', id],
    queryFn: async () => {
      const response = await api.get(`/engagements/${id}/techniques?limit=100`);
      return response.data;
    },
    enabled: !!id,
  });

  const existingTechniqueIds = (techniquesData?.data || []).map(
    (t: EngagementTechnique) => t.techniqueId
  );

  if (engagementLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!engagement) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Engagement not found</p>
        <button onClick={() => navigate('/engagements')} className="btn-secondary">
          Back to Engagements
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`/engagements/${id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Engagement
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Techniques Management
            </h1>
            <p className="text-gray-600">{engagement.name}</p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Techniques
          </button>
        </div>
      </div>

      {/* Techniques List */}
      {id && <TechniquesList engagementId={id} />}

      {/* Add Techniques Modal */}
      {showAddModal && id && (
        <AddTechniquesModal
          engagementId={id}
          existingTechniqueIds={existingTechniqueIds}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
