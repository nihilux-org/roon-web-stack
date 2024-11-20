export const containerClass = "ngx-sn-container";
export const ignoredClass = "ngx-sn-ignore";
export const dataBlockDirectionAttribute = "data-ngx-sn-block-direction";
export const dataContainerPrioritizedChildrenAttribute = "data-ngx-sn-container-prioritized-children";
export const dataContainerConsiderDistanceAttribute = "data-ngx-sn-container-consider-distance";
export const dataOverlapAttribute = "'data-ngx-sn-overlap-threshold'";

const containerFocusedChildAttribute = "data-ngx-sn-container-focused";
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
    const inContainer = getFocusables(container);
    if (inContainer.length > 0) {
      inContainer.forEach((focusable) => contained.add(focusable));
      return true;
    } else {
      return false;
    }
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
    case Direction.LEFT:
      return { x: rect.left, y: (rect.top + rect.bottom) / 2 };
    case Direction.RIGHT:
      return { x: rect.right, y: (rect.top + rect.bottom) / 2 };
    case Direction.UP:
      return { x: (rect.left + rect.right) / 2, y: rect.top };
    case Direction.DOWN:
      return { x: (rect.left + rect.right) / 2, y: rect.bottom };
  }
};

const getNearestPoint = (point: Point, dir: Direction, rect: DOMRect): Point => {
  if (dir === Direction.LEFT || dir === Direction.RIGHT) {
    // When moving horizontally...
    // The nearest X is always the nearest edge, left or right
    const x = dir === Direction.LEFT ? rect.right : rect.left;

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
    const y = dir === Direction.UP ? rect.bottom : rect.top;

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
      .filter((dirAttributeValue) => dirAttributeValue in Direction)
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
        (exitDir === Direction.LEFT ? 1 - entryWeighting : exitDir === Direction.RIGHT ? entryWeighting : 0.5),
    y:
      entryRect.top +
      entryRect.height *
        (exitDir === Direction.UP ? 1 - entryWeighting : exitDir === Direction.DOWN ? entryWeighting : 0.5),
  };

  return (
    (exitDir === Direction.LEFT && isRight(exitPoint, weightedEntryPoint)) ||
    (exitDir === Direction.RIGHT && isRight(weightedEntryPoint, exitPoint)) ||
    (exitDir === Direction.UP && isBelow(exitPoint, weightedEntryPoint)) ||
    (exitDir === Direction.DOWN && isBelow(weightedEntryPoint, exitPoint))
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

export const getNextFocus = (elem: HTMLElement | null, event: KeyboardEvent, scope: HTMLElement | null) => {
  if (!scope) {
    scope = document.body;
  }
  if (!elem) {
    return getFocusables(scope)[0];
  }
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  const exitDir = event.key ? _keyCodeMap[event.key] : _keyCodeMap[event.keyCode];
  const focusable = findNextFocusable(elem, exitDir, scope);
  if (focusable) {
    return focusable;
  }
  let alternateDirection: Direction;
  switch (exitDir) {
    case Direction.LEFT:
      alternateDirection = Direction.UP;
      break;
    case Direction.RIGHT:
      alternateDirection = Direction.DOWN;
      break;
    case Direction.UP:
      alternateDirection = Direction.LEFT;
      break;
    case Direction.DOWN:
      alternateDirection = Direction.RIGHT;
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
  if (parentContainer && elem.matches(focusableSelector)) {
    parentContainer.setAttribute(containerFocusedChildAttribute, elem.id);
    getParentFocusableContainer(parentContainer)?.setAttribute(containerFocusedChildAttribute, elem.id);
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
      if (candidateContainer && !isAncestorContainer) {
        // Ignore active child behaviour when moving into a container that we
        // are already nested in
        const lastActiveChildId = candidateContainer.getAttribute(containerFocusedChildAttribute);
        const lastActiveChild = lastActiveChildId ? document.getElementById(lastActiveChildId) : null;
        const newFocus = lastActiveChild || getFocusables(candidateContainer)[0];
        getParentFocusableContainer(candidateContainer)?.setAttribute(containerFocusedChildAttribute, newFocus.id);
        candidateContainer.setAttribute(containerFocusedChildAttribute, newFocus.id);
        return newFocus;
      }
    }
    if (!candidateIsContainer) {
      getParentFocusableContainer(candidateContainer)?.setAttribute(containerFocusedChildAttribute, candidate.id);
      candidateContainer?.setAttribute(containerFocusedChildAttribute, candidate.id);
    }
    return candidate;
  }
  return null;
};

enum Direction {
  LEFT = "left",
  RIGHT = "right",
  UP = "up",
  DOWN = "down",
}

type KeyCodeMap = { [key: number | string]: Direction };

const _keyCodeMap: KeyCodeMap = {
  4: Direction.LEFT,
  21: Direction.LEFT,
  37: Direction.LEFT,
  214: Direction.LEFT,
  205: Direction.LEFT,
  218: Direction.LEFT,
  5: Direction.RIGHT,
  22: Direction.RIGHT,
  39: Direction.RIGHT,
  213: Direction.RIGHT,
  206: Direction.RIGHT,
  217: Direction.RIGHT,
  29460: Direction.UP,
  19: Direction.UP,
  38: Direction.UP,
  211: Direction.UP,
  203: Direction.UP,
  215: Direction.UP,
  29461: Direction.DOWN,
  20: Direction.DOWN,
  40: Direction.DOWN,
  212: Direction.DOWN,
  204: Direction.DOWN,
  216: Direction.DOWN,
  ArrowLeft: Direction.LEFT,
  ArrowRight: Direction.RIGHT,
  ArrowUp: Direction.UP,
  ArrowDown: Direction.DOWN,
};
