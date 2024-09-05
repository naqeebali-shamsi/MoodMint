import type { NextApiResponse } from 'next';
import { logger } from '@/utils/logger';
import getErrorMessage from '@/utils/getErrorMessage';

export function handleApiError(error: unknown, res: NextApiResponse) {
  const errorMessage = getErrorMessage(error);
  logger.error(`API Error: ${errorMessage}`);
  
  if (error instanceof Error) {
    return res.status(500).json({
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
  
  return res.status(500).json({ error: 'An unexpected error occurred' });
}