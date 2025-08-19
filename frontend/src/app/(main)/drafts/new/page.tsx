'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';

import { DraftForm } from '@/features/drafts/components/draft-form';

const NewDraftPage = (): React.ReactElement => {
  const searchParams = useSearchParams();
  const workId = searchParams.get('workId');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">New Draft</h1>
      <DraftForm workId={workId ? parseInt(workId, 10) : undefined} />
    </div>
  );
};

export default NewDraftPage;
