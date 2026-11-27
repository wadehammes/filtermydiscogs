const MODIFIER_PARTS = new Set([
  "mod",
  "shift",
  "alt",
  "meta",
  "ctrl",
  "control",
]);

export const normalizeKeyboardShortcut = (parts: readonly string[]): string =>
  parts
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .join("+");

export const parseKeyboardShortcut = (shortcut: string): string[] =>
  shortcut
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

const isEditableElement = (element: Element | null): boolean => {
  if (!element) {
    return false;
  }

  const tag = element.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }

  if (element.getAttribute("contenteditable") === "true") {
    return true;
  }

  return element.closest("[contenteditable='true']") !== null;
};

export const isTypingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (isEditableElement(target)) {
    return true;
  }

  return target.closest('[role="combobox"]') !== null;
};

const modKeyMatches = (event: KeyboardEvent): boolean =>
  event.metaKey || event.ctrlKey;

const partMatchesEvent = (part: string, event: KeyboardEvent): boolean => {
  switch (part) {
    case "mod":
      return modKeyMatches(event);
    case "shift":
      return event.shiftKey;
    case "alt":
      return event.altKey;
    case "meta":
      return event.metaKey;
    case "ctrl":
    case "control":
      return event.ctrlKey;
    default: {
      const key = part.length === 1 ? part.toUpperCase() : part;
      return event.key.toLowerCase() === key.toLowerCase();
    }
  }
};

export const eventMatchesShortcut = (
  event: KeyboardEvent,
  shortcut: string,
): boolean => {
  const parts = parseKeyboardShortcut(shortcut);
  if (parts.length === 0) {
    return false;
  }

  const mainKeyPart = parts.find((part) => !MODIFIER_PARTS.has(part));
  if (!mainKeyPart) {
    return false;
  }

  if (event.key.toLowerCase() !== mainKeyPart.toLowerCase()) {
    return false;
  }

  const partSet = new Set(parts);
  if (!partSet.has("shift") && event.shiftKey) {
    return false;
  }
  if (!partSet.has("alt") && event.altKey) {
    return false;
  }
  if (!(partSet.has("mod") || partSet.has("meta") || partSet.has("ctrl"))) {
    if (event.metaKey || event.ctrlKey) {
      return false;
    }
  }

  return parts.every((part) => partMatchesEvent(part, event));
};

const isApplePlatform = (): boolean =>
  typeof navigator !== "undefined" &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform);

export const formatShortcutKeyForDisplay = (part: string): string => {
  const isMac = isApplePlatform();

  if (part === "mod") {
    return isMac ? "⌘" : "Ctrl";
  }
  if (part === "shift") {
    return isMac ? "⇧" : "Shift";
  }
  if (part === "alt") {
    return isMac ? "⌥" : "Alt";
  }
  if (part.length === 1) {
    return part.toUpperCase();
  }

  return part.charAt(0).toUpperCase() + part.slice(1);
};

export const formatShortcutForDisplay = (shortcut: string): string => {
  const isMac = isApplePlatform();

  return parseKeyboardShortcut(shortcut)
    .map((part) => formatShortcutKeyForDisplay(part))
    .join(isMac ? "" : "+");
};

export const formatShortcutChipAbbreviation = (shortcut: string): string => {
  const isMac = isApplePlatform();

  return parseKeyboardShortcut(shortcut)
    .map((part) => {
      if (part === "mod") {
        return isMac ? "CMD" : "CTRL";
      }
      if (part === "shift") {
        return "SFT";
      }
      if (part === "alt") {
        return isMac ? "OPT" : "ALT";
      }
      return part.toUpperCase();
    })
    .join("+");
};
