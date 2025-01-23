// Utility function for logging errors
export const logError = (message: string, error?: unknown) => {
  // In development, log to console
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.error(message, error);
  }
  
  // In production, you could send to an error tracking service
  // if (process.env.NODE_ENV === 'production') {
  //   // Send to error tracking service
  // }
};
