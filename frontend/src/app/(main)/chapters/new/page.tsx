'use client';

import { useSearchParams } from 'next/navigation';
import React from 'react';

import { ChapterForm } from '@/features/chapters/components/chapter-form';

const NewChapterPage = (): React.ReactElement => {
  const searchParams = useSearchParams();
  const workId = searchParams.get('workId');

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">New Chapter</h1>
      {workId && <ChapterForm workId={parseInt(workId, 10)} />}
    </div>
  );
};

export default NewChapterPage;
