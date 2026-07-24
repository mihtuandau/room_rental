import { apiRequest } from '@/lib/api-client';
import type { ReportInput } from './schemas';

export function createReport(roomId: number, input: ReportInput) {
  return apiRequest<{ id: number }>(`/rooms/${roomId}/reports`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
