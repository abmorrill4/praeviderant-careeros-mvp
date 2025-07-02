import React, { useState } from 'react';
import { useLatestEntities, useCreateEntity } from '@/hooks/useVersionedEntities';
import { ProfileDataSection } from './ProfileDataSection';
import { certificationFields } from './entityFieldConfigs';
import { useEntityActions } from '@/hooks/useEntityActions';
import { Plus, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Certification } from '@/types/versioned-entities';

interface CertificationsSectionProps {
  focusedCard: string | null;
  onCardFocus: (cardId: string | null) => void;
}

export const CertificationsSection: React.FC<CertificationsSectionProps> = ({
  focusedCard,
  onCardFocus,
}) => {
  const { data: certifications, isLoading } = useLatestEntities<Certification>('certification');
  const createCertification = useCreateEntity<Certification>('certification');
  const { handleAccept, handleEdit } = useEntityActions<Certification>('certification');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      await createCertification.mutateAsync({
        entityData: {
          name: 'New Certification',
          issuing_organization: '',
          user_id: '', // This will be set by the backend
        },
        source: 'USER_MANUAL'
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating certification:', error);
    }
  };

  const renderCertification = (certification: Certification) => (
    <div>
      <h4 className="font-semibold text-career-text-light">{certification.name}</h4>
      <p className="text-sm text-career-text-muted-light">
        {certification.issuing_organization}
      </p>
      {(certification.issue_date || certification.expiration_date) && (
        <p className="text-xs text-career-text-muted-light mt-1">
          {certification.issue_date && `Issued: ${certification.issue_date}`}
          {certification.issue_date && certification.expiration_date && ' • '}
          {certification.expiration_date && `Expires: ${certification.expiration_date}`}
        </p>
      )}
      {certification.credential_id && (
        <p className="text-xs text-career-text-muted-light mt-1">
          ID: {certification.credential_id}
        </p>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="text-center py-8">Loading certifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-career-text-light">Certifications</h2>
        <Button
          onClick={() => setIsCreating(true)}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Certification
        </Button>
      </div>

      <ProfileDataSection
        title="Certifications"
        icon={<Award className="w-5 h-5" />}
        items={certifications || []}
        editFields={certificationFields}
        onAccept={handleAccept}
        onEdit={handleEdit}
        renderItem={renderCertification}
      />

      {isCreating && (
        <div className="p-4 border rounded-lg bg-career-panel-light border-career-gray-light">
          <p className="text-sm text-career-text-muted-light mb-4">
            Create a new certification entry
          </p>
          <div className="flex gap-2">
            <Button onClick={handleCreate} size="sm">
              Create Certification
            </Button>
            <Button 
              onClick={() => setIsCreating(false)} 
              variant="outline" 
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};