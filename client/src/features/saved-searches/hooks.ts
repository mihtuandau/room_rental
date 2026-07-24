'use client';

import { useMutation } from '@tanstack/react-query';
import { createSavedSearch } from './api';

export function useCreateSavedSearch() {
  return useMutation({ mutationFn: createSavedSearch });
}
