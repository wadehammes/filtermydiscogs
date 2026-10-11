import { beforeEach, describe, expect, it } from "@jest/globals";
import { DiscogsOutageToastPageObject } from "src/components/DiscogsOutageToast/DiscogsOutageToast.po";

describe("DiscogsOutageToast", () => {
  let po: DiscogsOutageToastPageObject;

  beforeEach(() => {
    po = new DiscogsOutageToastPageObject();
  });

  it("shows the outage toast when auth reports discogsUnavailable", () => {
    po.renderDiscogsOutageToast({ discogsUnavailable: true });

    expect(po.mockShowDiscogsOutageToast).toHaveBeenCalledTimes(1);
    expect(po.mockDismissDiscogsOutageToast).not.toHaveBeenCalled();
  });

  it("shows the outage toast when collection reports discogsUpstreamOutage", () => {
    po.renderDiscogsOutageToast({ discogsUpstreamOutage: true });

    expect(po.mockShowDiscogsOutageToast).toHaveBeenCalledTimes(1);
  });

  it("does not dismiss the outage toast on initial mount when outage flags are false", () => {
    po.renderDiscogsOutageToast();

    expect(po.mockShowDiscogsOutageToast).not.toHaveBeenCalled();
    expect(po.mockDismissDiscogsOutageToast).not.toHaveBeenCalled();
  });

  it("dismisses the outage toast when discogsUpstreamOutage clears after being true", () => {
    const { rerender } = po.renderDiscogsOutageToast({
      discogsUpstreamOutage: true,
    });

    expect(po.mockShowDiscogsOutageToast).toHaveBeenCalledTimes(1);

    po.rerenderDiscogsOutageToast(rerender, { discogsUpstreamOutage: false });

    expect(po.mockDismissDiscogsOutageToast).toHaveBeenCalledTimes(1);
  });
});
