import { safeStringify } from '@/utils/logger';

export default function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return safeStringify(error);
}