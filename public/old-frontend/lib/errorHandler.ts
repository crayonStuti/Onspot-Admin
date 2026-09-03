export const handleApiError = (error: any) => {
  if (error?.statusCode === 401) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('onSpot:unauthorized'));
    }
    return;
  }

  const err = error instanceof Error ? error : new Error(error?.message || 'An error occurred');
  throw err;
};
