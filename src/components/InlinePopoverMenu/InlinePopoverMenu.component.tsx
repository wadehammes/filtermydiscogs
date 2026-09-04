"use client";

import type { MenuPositioner } from "@base-ui/react/menu";
import { Menu } from "@base-ui/react/menu";
import classNames from "classnames";
import type {
  ComponentProps,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";
import {
  useOverlayStackPositionerStyle,
  usePortaledOverlayContainer,
} from "src/components/OverlayStack/OverlayStack.component";
import { definedProps } from "src/utils/definedProps";
import styles from "./InlinePopoverMenu.module.css";

type MenuPositionerProps = MenuPositioner.Props;

export type InlinePopoverMenuPanelProps = {
  children: ReactNode;
  popupClassName?: string;
  positionerClassName?: string;
  container?: HTMLElement;
  scrollable?: boolean;
  testId?: string;
  align?: MenuPositionerProps["align"];
  side?: MenuPositionerProps["side"];
  sideOffset?: number;
  alignOffset?: number;
  positionMethod?: MenuPositionerProps["positionMethod"];
  useOverlayStack?: boolean;
};

const InlinePopoverMenuPanel = ({
  children,
  popupClassName,
  positionerClassName,
  container: containerProp,
  scrollable = false,
  testId,
  align = "start",
  side = "bottom",
  sideOffset = 8,
  alignOffset,
  positionMethod = "fixed",
  useOverlayStack = true,
}: InlinePopoverMenuPanelProps) => {
  const overlayContainer = usePortaledOverlayContainer();
  const positionerStyle = useOverlayStackPositionerStyle();
  const container =
    containerProp ?? (useOverlayStack ? overlayContainer : undefined);

  return (
    <Menu.Portal {...definedProps({ container })}>
      <Menu.Positioner
        align={align}
        alignOffset={alignOffset}
        className={classNames(styles.positioner, positionerClassName)}
        positionMethod={positionMethod}
        side={side}
        sideOffset={sideOffset}
        {...definedProps({
          style: useOverlayStack ? positionerStyle : undefined,
        })}
      >
        <Menu.Popup
          className={classNames(
            scrollable ? styles.popupScroll : styles.popup,
            popupClassName,
          )}
          {...definedProps({ "data-testid": testId })}
        >
          {children}
        </Menu.Popup>
      </Menu.Positioner>
    </Menu.Portal>
  );
};

type InlinePopoverMenuElementProps = ComponentPropsWithoutRef<"div">;

const InlinePopoverMenuList = ({
  className,
  ...props
}: InlinePopoverMenuElementProps) => (
  <div className={classNames(styles.list, className)} {...props} />
);

const InlinePopoverMenuFooter = ({
  className,
  ...props
}: InlinePopoverMenuElementProps) => (
  <div className={classNames(styles.footer, className)} {...props} />
);

const InlinePopoverMenuFooterInset = ({
  className,
  ...props
}: InlinePopoverMenuElementProps) => (
  <div className={classNames(styles.footerInset, className)} {...props} />
);

const InlinePopoverMenuHeading = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) => (
  <p className={classNames(styles.heading, className)} {...props} />
);

const InlinePopoverMenuEmpty = ({
  className,
  ...props
}: ComponentPropsWithoutRef<"p">) => (
  <p className={classNames(styles.empty, className)} {...props} />
);

const InlinePopoverMenuItemGroup = ({
  className,
  ...props
}: InlinePopoverMenuElementProps) => (
  <div className={classNames(styles.itemGroup, className)} {...props} />
);

type InlinePopoverMenuItemProps = ComponentProps<typeof Menu.Item>;

const InlinePopoverMenuItem = ({
  className,
  ...props
}: InlinePopoverMenuItemProps) => (
  <Menu.Item className={classNames(styles.item, className)} {...props} />
);

const InlinePopoverMenuItemDanger = ({
  className,
  ...props
}: InlinePopoverMenuItemProps) => (
  <Menu.Item className={classNames(styles.itemDanger, className)} {...props} />
);

const InlinePopoverMenuItemNeutral = ({
  className,
  ...props
}: InlinePopoverMenuItemProps) => (
  <Menu.Item className={classNames(styles.itemNeutral, className)} {...props} />
);

type InlinePopoverMenuLinkProps = ComponentPropsWithoutRef<"a">;

const InlinePopoverMenuLink = ({
  className,
  ...props
}: InlinePopoverMenuLinkProps) => (
  <a className={classNames(styles.link, className)} {...props} />
);

const InlinePopoverMenuLinkRow = ({
  className,
  ...props
}: InlinePopoverMenuLinkProps) => (
  <a className={classNames(styles.linkRow, className)} {...props} />
);

export const InlinePopoverMenu = {
  Panel: InlinePopoverMenuPanel,
  List: InlinePopoverMenuList,
  Footer: InlinePopoverMenuFooter,
  FooterInset: InlinePopoverMenuFooterInset,
  Heading: InlinePopoverMenuHeading,
  Empty: InlinePopoverMenuEmpty,
  ItemGroup: InlinePopoverMenuItemGroup,
  Item: InlinePopoverMenuItem,
  ItemDanger: InlinePopoverMenuItemDanger,
  ItemNeutral: InlinePopoverMenuItemNeutral,
  Link: InlinePopoverMenuLink,
  LinkRow: InlinePopoverMenuLinkRow,
};

export { styles as inlinePopoverMenuStyles };
