// SPDX-License-Identifier: Apache-2.0
// Adapted from DigitalRCS Current View Exporter; see PROVENANCE.md.
import type { CapturePanel } from './types';
import { captureImageName } from './limits';

/** All Grafana-version-dependent DOM selectors live here. */
const SELECTORS = {
  panels: '[data-viz-panel-id], [data-panelid], [data-panel-id]',
  legacyPanels: '[data-viz-panel-key]',
  intelligence:
    '[data-digitalrcs-intelligence-gateway], [data-plugin-id="digitalrcs-intelligencegateway-panel"], [data-plugin-type="digitalrcs-intelligencegateway-panel"]',
  loading: '[aria-label*="Loading" i], [data-testid*="loading" i], [data-testid*="query running" i], .panel-loading',
  error: '[aria-label*="Panel error" i], [data-testid*="panel error" i], .panel-alert',
  title: 'h2, [role="heading"]',
  content: '[data-testid="data-testid panel content"], .panel-content',
} as const;

function isMaterialized(element: HTMLElement): boolean {
  const content = element.querySelector<HTMLElement>(SELECTORS.content);
  // Grafana scene placeholders have a title and an empty content container.
  // Their plugin identity is not known until mounting, so never offer/capture
  // them as if they were rendered charts. Older roots without this container
  // retain the legacy renderer path and are rechecked for exclusion on capture.
  return !content || content.childElementCount > 0 || Boolean(content.textContent?.trim());
}

function roots(root: ParentNode): HTMLElement[] {
  const primary = Array.from(root.querySelectorAll<HTMLElement>(SELECTORS.panels));
  return primary.length ? primary : Array.from(root.querySelectorAll<HTMLElement>(SELECTORS.legacyPanels));
}

function panelTitle(element: HTMLElement, id: string): string {
  const content = element.querySelector<HTMLElement>(SELECTORS.content);
  // Grafana's "Panel header ..." test ID can label the entire panel wrapper,
  // including its body. Only read a heading outside the visualization content;
  // never fall back to the wrapper's innerText or a Markdown body heading.
  const heading = Array.from(element.querySelectorAll<HTMLElement>(SELECTORS.title)).find(
    (candidate) =>
      !candidate.closest(SELECTORS.content) &&
      (!content || !candidate.contains(content)) &&
      candidate.closest(`${SELECTORS.panels}, ${SELECTORS.legacyPanels}`) === element
  );
  return captureImageName((heading?.innerText ?? heading?.textContent ?? '').trim() || `Panel ${id}`);
}

export function isExcludedElement(element: Element): boolean {
  return Boolean(
    element.matches(SELECTORS.intelligence) ||
    element.closest(SELECTORS.intelligence) ||
    element.querySelector(SELECTORS.intelligence)
  );
}

export function findDashboardScroller(root: ParentNode = document): HTMLElement | undefined {
  const panels = roots(root);
  if (!panels.length) {
    return undefined;
  }
  let layout: HTMLElement | undefined;
  let ancestor = panels[0].parentElement;
  while (ancestor) {
    const candidate = ancestor;
    const doc = candidate.ownerDocument;
    // Grafana 12.4 propagates body overflow to the viewport. In standards
    // mode that body can look scrollable while only scrollingElement moves.
    const viewportBody =
      candidate === doc.body &&
      doc.scrollingElement !== candidate &&
      window.getComputedStyle(doc.documentElement).overflowY === 'visible';
    const overflow = window.getComputedStyle(candidate).overflowY;
    if (
      !viewportBody &&
      panels.every((panel) => candidate.contains(panel)) &&
      (overflow === 'auto' || overflow === 'scroll')
    ) {
      if (candidate.scrollHeight > candidate.clientHeight) {
        return candidate;
      }
      layout ??= candidate;
    }
    ancestor = candidate.parentElement;
  }
  const doc = panels[0].ownerDocument;
  const page = (doc.scrollingElement ?? doc.documentElement) as HTMLElement;
  return page.scrollHeight > page.clientHeight ? page : (layout ?? page);
}

export function panelPosition(element: HTMLElement, scroller?: HTMLElement): CapturePanel['position'] {
  const rect = element.getBoundingClientRect();
  if (
    scroller &&
    scroller !== element.ownerDocument.scrollingElement &&
    scroller !== element.ownerDocument.documentElement
  ) {
    const parent = scroller.getBoundingClientRect();
    return {
      x: Math.round(rect.left - parent.left + scroller.scrollLeft),
      y: Math.round(rect.top - parent.top + scroller.scrollTop),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  }
  return {
    x: Math.round(rect.left + window.scrollX),
    y: Math.round(rect.top + window.scrollY),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

export function discoverCapturePanels(
  root: ParentNode = document,
  scroller = findDashboardScroller(root),
  includeUnrendered = false
): CapturePanel[] {
  const found = new Map<string, CapturePanel>();
  for (const element of roots(root)) {
    if (isExcludedElement(element) || (!includeUnrendered && !isMaterialized(element))) {
      continue;
    }
    const panelPathId =
      element.getAttribute('data-viz-panel-id') ?? element.getAttribute('data-viz-panel-key') ?? undefined;
    const rawId = panelPathId ?? element.getAttribute('data-panelid') ?? element.getAttribute('data-panel-id');
    if (!rawId) {
      continue;
    }
    // Preserve repeated-panel and opaque scene identities without constructing paths.
    const id = /^panel-(\d+)$/.exec(rawId)?.[1] ?? rawId;
    if (found.has(id)) {
      continue;
    }
    found.set(id, {
      id,
      title: panelTitle(element, id),
      element,
      panelPathId,
      position: panelPosition(element, scroller),
    });
  }
  return [...found.values()].sort(
    (left, right) => left.position.y - right.position.y || left.position.x - right.position.x
  );
}

export function panelUnavailableReason(panel: CapturePanel): string | undefined {
  if (!panel.element.isConnected || isExcludedElement(panel.element)) {
    return 'the panel is no longer available for capture';
  }
  if (!isMaterialized(panel.element)) {
    return 'the panel content has not been rendered; scroll it into view and wait for its data';
  }
  const rect = panel.element.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1 || window.getComputedStyle(panel.element).visibility === 'hidden') {
    return 'the panel is hidden or has not been rendered';
  }
  if (panel.element.querySelector(SELECTORS.loading)) {
    return 'the panel is still loading; wait for its data before capturing';
  }
  if (panel.element.querySelector(SELECTORS.error)) {
    return 'Grafana reports an error in this panel';
  }
  return undefined;
}

export function setScroll(scroller: HTMLElement, top: number, left: number): void {
  // Direct property assignment is immediate even when the dashboard uses smooth scrolling.
  scroller.scrollTop = top;
  scroller.scrollLeft = left;
}
