export const shouldReportHttpFailure = (status?: number): boolean => {
  if (status === undefined) {
    return false;
  }

  return status >= 500;
};
