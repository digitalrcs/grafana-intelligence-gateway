import { discoverCapturePanels, findDashboardScroller, panelPosition, panelUnavailableReason } from './dom';

function addPanel(parent: HTMLElement, id: string, top = 0): HTMLElement {
  const panel = document.createElement('section');
  panel.dataset.vizPanelId = id;
  panel.innerHTML = `<h2>Panel ${id}</h2>`;
  panel.getBoundingClientRect = () => ({ top, left: 20, width: 800, height: 300 }) as DOMRect;
  parent.append(panel);
  return panel;
}

describe('vision panel discovery', () => {
  afterEach(() => {
    document.body.replaceChildren();
    jest.restoreAllMocks();
  });

  test('excludes every Intelligence Gateway instance, including nested DOM markers', () => {
    addPanel(document.body, 'panel-1');
    const firstGateway = addPanel(document.body, 'panel-2');
    firstGateway.innerHTML = '<div data-digitalrcs-intelligence-gateway="true">Analysis and image previews</div>';
    const secondGateway = addPanel(document.body, 'panel-3');
    secondGateway.dataset.pluginId = 'digitalrcs-intelligencegateway-panel';
    expect(discoverCapturePanels().map((panel) => panel.id)).toEqual(['1']);
  });

  test('retains repeated opaque identities and orders panels by location', () => {
    addPanel(document.body, 'panel-7-clone-2', 500);
    addPanel(document.body, 'panel-7', 100);
    expect(discoverCapturePanels().map((panel) => panel.id)).toEqual(['7', 'panel-7-clone-2']);
    expect(discoverCapturePanels()[1].panelPathId).toBe('panel-7-clone-2');
  });

  test('reads only the heading when Grafana labels the whole panel as its header', () => {
    const element = addPanel(document.body, 'panel-4');
    element.innerHTML = `
      <section data-testid="data-testid Panel header Business notes" aria-labelledby="notes-title">
        <div data-testid="data-testid Panel header container"><h2 id="notes-title">Business notes</h2></div>
        <div data-testid="data-testid panel content"><h2>Body heading</h2><p>${'Purpose: confidential body. '.repeat(40)}</p></div>
      </section>`;
    expect(discoverCapturePanels()[0].title).toBe('Business notes');
  });

  test('never substitutes a body heading or toolbar wrapper for an absent title', () => {
    const element = addPanel(document.body, 'panel-4');
    element.innerHTML = `
      <section data-testid="data-testid Panel header ">
        <div data-testid="Panel header item menu">Menu and controls</div>
        <div data-testid="data-testid panel content"><h2>Body heading</h2><div role="heading">Body detail</div></div>
      </section>`;
    expect(discoverCapturePanels()[0].title).toBe('Panel 4');
  });

  test('ignores nested panel headings and normalizes long actual titles', () => {
    const element = addPanel(document.body, 'panel-4');
    element.innerHTML = '<div data-panelid="5"><h2>Nested title</h2></div>';
    expect(discoverCapturePanels().find((panel) => panel.id === '4')?.title).toBe('Panel 4');
    element.innerHTML = '<h2></h2>';
    element.querySelector('h2')!.textContent = '界'.repeat(100) + '\nlong title';
    const title = discoverCapturePanels()[0].title;
    expect(title.endsWith('…')).toBe(true);
    expect(new Blob([title]).size).toBeLessThanOrEqual(256);
    expect(title).not.toContain('\n');
  });

  test('hides unknown lazy placeholders and rechecks their identity after materialization', () => {
    const element = addPanel(document.body, 'panel-3');
    element.innerHTML = '<h2>Lazy panel</h2><div data-testid="data-testid panel content"></div>';
    expect(discoverCapturePanels()).toHaveLength(0);
    const traversal = discoverCapturePanels(document, undefined, true);
    expect(traversal).toHaveLength(1);
    expect(panelUnavailableReason(traversal[0])).toContain('not been rendered');
    element.querySelector('div')!.innerHTML = '<div data-digitalrcs-intelligence-gateway="true">Old answer</div>';
    expect(discoverCapturePanels()).toHaveLength(0);
    expect(discoverCapturePanels(document, undefined, true)).toHaveLength(0);
    expect(panelUnavailableReason(traversal[0])).toContain('no longer available');
  });

  test('supports legacy panel keys and deduplicates nested roots', () => {
    const legacy = document.createElement('div');
    legacy.dataset.vizPanelKey = 'panel-8';
    document.body.append(legacy);
    expect(discoverCapturePanels()[0].id).toBe('8');
    document.body.replaceChildren();
    const outer = addPanel(document.body, 'panel-2');
    const inner = document.createElement('div');
    inner.dataset.panelid = '2';
    outer.append(inner);
    expect(discoverCapturePanels()).toHaveLength(1);
    expect(discoverCapturePanels()[0].element).toBe(outer);
  });

  test('chooses the dashboard scroller rather than an unrelated sidebar', () => {
    const sidebar = document.createElement('aside');
    sidebar.style.overflowY = 'auto';
    Object.defineProperties(sidebar, { scrollHeight: { value: 10000 }, clientHeight: { value: 400 } });
    const dashboard = document.createElement('main');
    dashboard.style.overflowY = 'auto';
    Object.defineProperties(dashboard, { scrollHeight: { value: 2000 }, clientHeight: { value: 600 } });
    document.body.append(sidebar, dashboard);
    addPanel(dashboard, 'panel-1');
    expect(findDashboardScroller()).toBe(dashboard);
  });

  test('calculates stable positions in an inner scrolling dashboard', () => {
    const scroller = document.createElement('main');
    scroller.scrollTop = 400;
    scroller.getBoundingClientRect = () => ({ top: 100, left: 20 }) as DOMRect;
    const panel = addPanel(scroller, 'panel-2', 250);
    expect(panelPosition(panel, scroller)).toEqual({ x: 0, y: 550, width: 800, height: 300 });
  });

  test('refuses to capture a currently loading, removed, or newly excluded panel', () => {
    const element = addPanel(document.body, 'panel-1');
    const descriptor = discoverCapturePanels()[0];
    element.innerHTML = '<div aria-label="Loading data"></div>';
    expect(panelUnavailableReason(descriptor)).toContain('still loading');
    element.innerHTML = '<div data-digitalrcs-intelligence-gateway="true"></div>';
    expect(panelUnavailableReason(descriptor)).toContain('no longer available');
    element.remove();
    expect(panelUnavailableReason(descriptor)).toContain('no longer available');
  });
});
