export const containerClass = "ngx-sn-container";
export const ignoredClass = "ngx-sn-ignore";
export const dataBlockDirectionAttribute = "data-ngx-sn-block-direction";
export const dataContainerPrioritizedChildrenAttribute = "data-ngx-sn-container-prioritized-children";
export const dataContainerConsiderDistanceAttribute = "data-ngx-sn-container-consider-distance";
export const dataOverlapAttribute = "'data-ngx-sn-overlap-threshold'";
export const dataContainerLastFocusChildId = "data-ngx-sn-container-last-focus-child-id";
export const dataRememberLastFocusedChildId = "data-ngx-sn-container-remember-last-focused-child-id";

const focusableSelector = "[tabindex], a, input, button";
const containerSelector = `nav, section, .${containerClass}`;
const focusableContainerSelector = `[${dataContainerConsiderDistanceAttribute}]`;

const toArray = (nodeList: NodeList): HTMLElement[] => Array.prototype.slice.call(nodeList) as HTMLElement[];

const getParentContainer = (elem: HTMLElement): HTMLElement | null => {
  if (!elem.parentElement || elem.parentElement.tagName === "BODY") {
    return null;
  } else if (elem.parentElement.matches(containerSelector)) {
    return elem.parentElement;
  }
  return getParentContainer(elem.parentElement);
};

const containerRememberChildId = (container: HTMLElement): boolean => {
  return container.getAttribute(dataRememberLastFocusedChildId) !== "false";
};

const getFocusables = (scope: HTMLElement | null): HTMLElement[] => {
  if (!scope) {
    return [];
  }
  const ignoredElements = toArray(scope.querySelectorAll("." + ignoredClass));
  if (scope.className.indexOf(ignoredClass) > -1) {
    ignoredElements.push(scope);
  }
  return toArray(scope.querySelectorAll(focusableSelector))
    .filter((node) => !ignoredElements.some((ignored) => ignored == node || ignored.contains(node)))
    .filter((node) => parseInt(node.getAttribute("tabindex") ?? "0", 10) > -1);
};

const getAllFocusables = (scope: HTMLElement): HTMLElement[] => {
  const contained = new Set<HTMLElement>();
  const containers = toArray(scope.querySelectorAll(containerSelector)).filter((container) => {
    const containerRemembersChildId = containerRememberChildId(container);
    if (containerRemembersChildId) {
      const inContainer = getFocusables(container);
      if (inContainer.length > 0) {
        inContainer.forEach((focusable) => contained.add(focusable));
        return true;
      }
    }
    return false;
  });
  const focusables = getFocusables(scope).filter((focusable) => !contained.has(focusable));
  return [...containers, ...focusables];
};

const collectContainers = (initialContainer: HTMLElement | null): HTMLElement[] => {
  if (!initialContainer) {
    return [];
  }
  const acc = [initialContainer];
  let cur: HTMLElement | null = initialContainer;
  while (cur) {
    cur = getParentContainer(cur);
    if (cur !== null) {
      acc.push(cur);
    }
  }
  return acc;
};

interface Point {
  x: number;
  y: number;
}

const getMidpointForEdge = (rect: DOMRect, dir: Direction): Point => {
  switch (dir) {
    case MappedDirection.LEFT:
      return { x: rect.left, y: (rect.top + rect.bottom) / 2 };
    case MappedDirection.RIGHT:
      return { x: rect.right, y: (rect.top + rect.bottom) / 2 };
    case MappedDirection.UP:
      return { x: (rect.left + rect.right) / 2, y: rect.top };
    case MappedDirection.DOWN:
      return { x: (rect.left + rect.right) / 2, y: rect.bottom };
  }
};

const getNearestPoint = (point: Point, dir: Direction, rect: DOMRect): Point => {
  if (dir === MappedDirection.LEFT || dir === MappedDirection.RIGHT) {
    // When moving horizontally...
    // The nearest X is always the nearest edge, left or right
    const x = dir === MappedDirection.LEFT ? rect.right : rect.left;

    // If the start point is higher than the rect, nearest Y is the top corner
    if (point.y < rect.top) {
      return { x, y: rect.top };
    }
    // If the start point is lower than the rect, nearest Y is the bottom corner
    if (point.y > rect.bottom) {
      return { x, y: rect.bottom };
    }
    // Else the nearest Y is aligned with where we started
    return { x, y: point.y };
  } else {
    // When moving vertically...
    // The nearest Y is always the nearest edge, top or bottom
    const y = dir === MappedDirection.UP ? rect.bottom : rect.top;

    // If the start point is left-er than the rect, nearest X is the left corner
    if (point.x < rect.left) {
      return { x: rect.left, y };
    }
    // If the start point is right-er than the rect, nearest X is the right corner
    if (point.x > rect.right) {
      return { x: rect.right, y };
    }
    // Else the nearest X is aligned with where we started
    return { x: point.x, y };
  }
};

const getDistanceBetweenPoints = (a: Point, b: Point): number =>
  Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));

const isBelow = (a: Point, b: Point): boolean => a.y > b.y;

const isRight = (a: Point, b: Point): boolean => a.x > b.x;

const getBlockedExitDirs = (container: HTMLElement | null, candidateContainer: HTMLElement | null): Set<Direction> => {
  const currentAncestorContainers = collectContainers(container);
  const candidateAncestorContainers = collectContainers(candidateContainer);
  // Find common container for current container and candidate container and
  // remove everything above it
  for (let i = 0; i < candidateAncestorContainers.length; i++) {
    const commonCandidate = candidateAncestorContainers[i];
    const spliceIndex = currentAncestorContainers.indexOf(commonCandidate);
    if (spliceIndex > -1) {
      currentAncestorContainers.splice(spliceIndex);
      break;
    }
  }
  return currentAncestorContainers.reduce((acc: Set<Direction>, cur: HTMLElement) => {
    (cur.getAttribute(dataBlockDirectionAttribute) ?? "")
      .split(" ")
      .filter((dirAttributeValue) => dirAttributeValue in MappedDirection)
      .forEach((dir) => acc.add(dir as Direction));
    return acc;
  }, new Set<Direction>());
};

const isValidCandidate = (
  entryRect: DOMRect,
  exitDir: Direction,
  exitPoint: Point,
  entryWeighting: number | null
): boolean => {
  if (entryRect.width === 0 && entryRect.height === 0) {
    return false;
  }
  if (!entryWeighting && entryWeighting != 0) {
    entryWeighting = 0.3;
  }

  const weightedEntryPoint = {
    x:
      entryRect.left +
      entryRect.width *
        (exitDir === MappedDirection.LEFT
          ? 1 - entryWeighting
          : exitDir === MappedDirection.RIGHT
            ? entryWeighting
            : 0.5),
    y:
      entryRect.top +
      entryRect.height *
        (exitDir === MappedDirection.UP ? 1 - entryWeighting : exitDir === MappedDirection.DOWN ? entryWeighting : 0.5),
  };

  return (
    (exitDir === MappedDirection.LEFT && isRight(exitPoint, weightedEntryPoint)) ||
    (exitDir === MappedDirection.RIGHT && isRight(weightedEntryPoint, exitPoint)) ||
    (exitDir === MappedDirection.UP && isBelow(exitPoint, weightedEntryPoint)) ||
    (exitDir === MappedDirection.DOWN && isBelow(weightedEntryPoint, exitPoint))
  );
};

const sortValidCandidates = (candidates: HTMLElement[], elem: HTMLElement, exitDir: Direction): HTMLElement[] => {
  const exitRect = elem.getBoundingClientRect();
  const exitPoint = getMidpointForEdge(exitRect, exitDir);
  return candidates
    .filter((candidate) => {
      // Filter out candidates that are in the opposite direction or have no dimensions
      const entryRect = candidate.getBoundingClientRect();
      const allowedOverlapAttribute = candidate.getAttribute(dataOverlapAttribute);
      const allowedOverlap = allowedOverlapAttribute ? parseFloat(allowedOverlapAttribute) : null;
      return isValidCandidate(entryRect, exitDir, exitPoint, allowedOverlap);
    })
    .map((candidate) => {
      const entryRect = candidate.getBoundingClientRect();
      const nearestPoint = getNearestPoint(exitPoint, exitDir, entryRect);
      const distance = getDistanceBetweenPoints(exitPoint, nearestPoint);
      return {
        candidate,
        distance,
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .map(({ candidate }) => candidate);
};

const getParentFocusableContainer = (startingCandidate: HTMLElement | null): HTMLElement | null => {
  if (!startingCandidate) {
    return null;
  }
  do {
    startingCandidate = getParentContainer(startingCandidate);
  } while (startingCandidate && !startingCandidate.matches(focusableContainerSelector));
  return startingCandidate;
};

export const getNextFocus = (elem: HTMLElement | null, exitDir: Direction, scope: HTMLElement | null) => {
  if (!scope) {
    scope = document.body;
  }
  if (!elem) {
    return getFocusables(scope)[0];
  }
  const focusable = findNextFocusable(elem, exitDir, scope);
  if (focusable) {
    return focusable;
  }
  let alternateDirection: Direction;
  switch (exitDir) {
    case MappedDirection.LEFT:
      alternateDirection = MappedDirection.UP;
      break;
    case MappedDirection.RIGHT:
      alternateDirection = MappedDirection.DOWN;
      break;
    case MappedDirection.UP:
      alternateDirection = MappedDirection.LEFT;
      break;
    case MappedDirection.DOWN:
      alternateDirection = MappedDirection.RIGHT;
      break;
  }
  const newStart = getParentContainer(elem);
  if (newStart) {
    return findNextFocusable(newStart, alternateDirection, scope);
  } else {
    return null;
  }
};

const findNextFocusable = (elem: HTMLElement, exitDir: Direction, scope: HTMLElement): HTMLElement | null => {
  // Get parent focus container
  const parentContainer = getParentContainer(elem);
  if (parentContainer && elem.matches(focusableSelector) && containerRememberChildId(parentContainer)) {
    parentContainer.setAttribute(dataContainerLastFocusChildId, elem.id);
    getParentFocusableContainer(parentContainer)?.setAttribute(dataContainerLastFocusChildId, elem.id);
  }
  let focusableCandidates: HTMLElement[] = [];
  // Get all siblings within a prioritised container
  if (
    parentContainer?.getAttribute(dataContainerPrioritizedChildrenAttribute) !== "false" &&
    scope.contains(parentContainer)
  ) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const focusableSiblings = getAllFocusables(parentContainer!);
    focusableCandidates = sortValidCandidates(focusableSiblings, elem, exitDir);
  }
  if (focusableCandidates.length === 0) {
    const candidates = getAllFocusables(scope);
    focusableCandidates = sortValidCandidates(candidates, elem, exitDir);
  }
  for (const candidate of focusableCandidates) {
    const candidateIsContainer = candidate.matches(containerSelector);
    const candidateContainer = candidateIsContainer ? candidate : getParentContainer(candidate);
    const isCurrentContainer = candidateContainer === parentContainer;
    const isNestedContainer = parentContainer?.contains(candidateContainer);
    const isAncestorContainer = candidateContainer?.contains(parentContainer);
    if (!isCurrentContainer && (!isNestedContainer || candidateIsContainer)) {
      const blockedExitDirs = getBlockedExitDirs(parentContainer, candidateContainer);
      if (blockedExitDirs.has(exitDir)) {
        continue;
      }
      if (candidateContainer && !isAncestorContainer && containerRememberChildId(candidateContainer)) {
        // Ignore active child behaviour when moving into a container that we
        // are already nested in
        const lastActiveChildId = candidateContainer.getAttribute(dataContainerLastFocusChildId);
        const lastActiveChild = lastActiveChildId ? document.getElementById(lastActiveChildId) : null;
        const newFocus = lastActiveChild || getFocusables(candidateContainer)[0];
        getParentFocusableContainer(candidateContainer)?.setAttribute(dataContainerLastFocusChildId, newFocus.id);
        candidateContainer.setAttribute(dataContainerLastFocusChildId, newFocus.id);
        return newFocus;
      }
    }
    if (!candidateIsContainer && parentContainer && containerRememberChildId(parentContainer)) {
      getParentFocusableContainer(candidateContainer)?.setAttribute(dataContainerLastFocusChildId, candidate.id);
      candidateContainer?.setAttribute(dataContainerLastFocusChildId, candidate.id);
    }
    return candidate;
  }
  return null;
};

export const isSnKeyboardEvent: (event: KeyboardEvent) => { direction?: Direction; substitueEvent?: KeyboardEvent } = (
  event: KeyboardEvent
) => {
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const mappedDirection = _keyCodeMap[event.key] || _keyCodeMap[event.keyCode];
  if (mappedDirection === MappedDirection.BACK || mappedDirection === MappedDirection.EXIT) {
    const substitueEvent = new KeyboardEvent("keydown", {
      key: "Escape",
      keyCode: 27,
      which: 27,
    });
    return {
      substitueEvent,
    };
  } else {
    if (eventShouldBeIgnored(mappedDirection, event)) {
      return {};
    } else {
      return {
        direction: mappedDirection,
      };
    }
  }
};

const eventShouldBeIgnored: (direction: Direction | undefined, event: KeyboardEvent) => boolean = (
  direction,
  event
) => {
  if (direction === MappedDirection.LEFT || direction === MappedDirection.RIGHT) {
    const element = event.target as HTMLElement;
    return element.tagName === "INPUT" && element.getAttribute("type") === "text";
  }
  return false;
};

export type Direction = MappedDirection.UP | MappedDirection.DOWN | MappedDirection.LEFT | MappedDirection.RIGHT;

export enum MappedDirection {
  LEFT = "left",
  RIGHT = "right",
  UP = "up",
  DOWN = "down",
  BACK = "back",
  EXIT = "exit",
}

type KeyCodeMap = { [key: number | string]: MappedDirection | undefined };

const _keyCodeMap: KeyCodeMap = {
  4: MappedDirection.LEFT,
  21: MappedDirection.LEFT,
  37: MappedDirection.LEFT,
  214: MappedDirection.LEFT,
  205: MappedDirection.LEFT,
  218: MappedDirection.LEFT,
  5: MappedDirection.RIGHT,
  22: MappedDirection.RIGHT,
  39: MappedDirection.RIGHT,
  213: MappedDirection.RIGHT,
  206: MappedDirection.RIGHT,
  217: MappedDirection.RIGHT,
  29460: MappedDirection.UP,
  19: MappedDirection.UP,
  38: MappedDirection.UP,
  211: MappedDirection.UP,
  203: MappedDirection.UP,
  215: MappedDirection.UP,
  29461: MappedDirection.DOWN,
  20: MappedDirection.DOWN,
  40: MappedDirection.DOWN,
  212: MappedDirection.DOWN,
  204: MappedDirection.DOWN,
  216: MappedDirection.DOWN,
  10009: MappedDirection.BACK,
  10182: MappedDirection.EXIT,
  ArrowLeft: MappedDirection.LEFT,
  ArrowRight: MappedDirection.RIGHT,
  ArrowUp: MappedDirection.UP,
  ArrowDown: MappedDirection.DOWN,
  Back: MappedDirection.BACK,
  Exit: MappedDirection.EXIT,
};
