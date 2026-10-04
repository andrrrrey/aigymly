'use client';

import { useParams } from 'next/navigation';
import { ProgramBuilder } from '@/components/programs/ProgramBuilder';

export default function EditProgramPage() {
  const params = useParams<{ id: string }>();
  return <ProgramBuilder programId={params.id} />;
}
