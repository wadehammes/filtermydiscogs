export const suppressConsoleError = () =>
  jest.spyOn(console, "error").mockImplementation(() => {});
