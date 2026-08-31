import { Toast } from "@base-ui/react/toast";
import type { ReactNode } from "react";

export type FmdToastClassNames = {
  toast?: string;
  title?: string;
  description?: string;
  icon?: string;
  content?: string;
  close?: string;
};

export type FmdToastData = {
  icon?: ReactNode;
  action?: ReactNode;
  cancel?: ReactNode;
  showClose?: boolean;
  classNames?: FmdToastClassNames;
};

export const toastManager = Toast.createToastManager<FmdToastData>();
export const centerToastManager = Toast.createToastManager<FmdToastData>();
