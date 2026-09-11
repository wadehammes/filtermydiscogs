import {
  installViewTransitionDocumentGuard,
  installViewTransitionRecoverableErrorFilter,
} from "src/utils/viewTransitionInterruptions";

installViewTransitionDocumentGuard();
installViewTransitionRecoverableErrorFilter();
