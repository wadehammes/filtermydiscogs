import { UIProviderProps } from "src/context/ui.context";

export const mockUiContext: UIProviderProps = {
  state: {
    mobileNavOpen: false,
    hasBanner: false,
    pageParams: "",
    pagePhoneNumber: "",
  },
  toggleMobileNav: jest.fn(),
  setHasBanner: jest.fn(),
  setPageParams: jest.fn(),
  setPagePhoneNumber: jest.fn(),
};
