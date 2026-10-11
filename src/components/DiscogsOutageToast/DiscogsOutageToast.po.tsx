import type { RenderResult } from "@testing-library/react";
import { useEffect } from "react";
import { DiscogsOutageToast } from "src/components/DiscogsOutageToast/DiscogsOutageToast.component";
import {
  dismissDiscogsOutageToast,
  showDiscogsOutageToast,
} from "src/components/DiscogsOutageToast/discogsOutageToast";
import type { AuthState } from "src/context/auth.context";
import { useCollectionContext } from "src/context/collection.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render } from "test-utils";

jest.mock("src/components/DiscogsOutageToast/discogsOutageToast", () => ({
  showDiscogsOutageToast: jest.fn(),
  dismissDiscogsOutageToast: jest.fn(),
}));

export type DiscogsOutageToastRenderProps = {
  discogsUnavailable?: boolean;
  discogsUpstreamOutage?: boolean;
};

const DiscogsOutageToastHarness = ({
  discogsUpstreamOutage = false,
}: Pick<DiscogsOutageToastRenderProps, "discogsUpstreamOutage">) => {
  const { dispatchDiscogsUpstreamOutage } = useCollectionContext();

  useEffect(() => {
    dispatchDiscogsUpstreamOutage(discogsUpstreamOutage);
  }, [discogsUpstreamOutage, dispatchDiscogsUpstreamOutage]);

  return <DiscogsOutageToast />;
};

export class DiscogsOutageToastPageObject extends BasePageObject {
  public mockShowDiscogsOutageToast = jest.mocked(showDiscogsOutageToast);

  public mockDismissDiscogsOutageToast = jest.mocked(dismissDiscogsOutageToast);

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private authState({
    discogsUnavailable = false,
  }: DiscogsOutageToastRenderProps): AuthState {
    if (!discogsUnavailable) {
      return {
        ...testAuthenticatedAuthState,
        discogsUnavailable: false,
      };
    }

    const status = authStatusFactory.discogsOutage();

    return {
      ...testAuthenticatedAuthState,
      username: status.username,
      userId: status.userId,
      rateLimited: status.rateLimited,
      discogsUnavailable: status.discogsUnavailable,
    };
  }

  private discogsOutageToastElement({
    discogsUpstreamOutage = false,
  }: DiscogsOutageToastRenderProps) {
    return (
      <DiscogsOutageToastHarness
        discogsUpstreamOutage={discogsUpstreamOutage}
      />
    );
  }

  renderDiscogsOutageToast(
    overrides: DiscogsOutageToastRenderProps = {},
  ): RenderResult {
    return render(this.discogsOutageToastElement(overrides), {
      authInitialState: this.authState(overrides),
      includeCrate: false,
      includeCollectionSync: false,
    });
  }

  rerenderDiscogsOutageToast(
    rerender: RenderResult["rerender"],
    overrides: DiscogsOutageToastRenderProps = {},
  ): void {
    rerender(this.discogsOutageToastElement(overrides));
  }
}
