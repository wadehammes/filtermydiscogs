import { act } from "@testing-library/react";

export const settleProviderEffects = async () => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });

  if (jest.isMockFunction(setTimeout)) {
    await act(async () => {
      jest.advanceTimersByTime(0);
    });
  }
};
