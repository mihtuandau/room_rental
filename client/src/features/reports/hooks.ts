'use client';

import { useMutation } from '@tanstack/react-query';
import { createReport } from './api';
import type { ReportInput } from './schemas';

export function useCreateReport(roomId: number) {
  return useMutation({
    mutationFn: (input: ReportInput) => createReport(roomId, input),
  });
}
