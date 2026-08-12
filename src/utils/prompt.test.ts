import { constructPrompt, interpolatePrompt } from './prompt';

describe('prompt construction', () => {
  it('interpolates all supported variables and preserves unknown tokens', () => {
    expect(
      interpolatePrompt('{{panelTitle}} {{timeRange}} {{data}} {{panelId}} {{skills}} {{sourcePanel}} {{unknown}}', {
        panelTitle: 'CPU',
        timeRange: 'last hour',
        data: '42',
        panelId: '7',
        skills: 'SRE',
        sourcePanel: 'Node metrics',
      })
    ).toBe('CPU last hour 42 7 SRE Node metrics {{unknown}}');
  });

  it('injects a useful fallback when skills are empty', () => {
    const result = constructPrompt(
      {
        systemPrompt: 'System',
        userPromptTemplate: '{{skills}} / {{data}}',
        skillsContext: '',
        responseLengthTokens: 0,
      },
      { data: 'payload', timeRange: 'range', panelTitle: 'Panel', panelId: '1', sourcePanel: 'Source' }
    );
    expect(result).toEqual({ system: 'System', user: '[No additional context configured.] / payload' });
  });

  it('adds a soft visible-answer token instruction when configured', () => {
    const result = constructPrompt(
      {
        systemPrompt: 'System',
        userPromptTemplate: '{{data}}',
        skillsContext: '',
        responseLengthTokens: 256000,
      },
      { data: 'payload', timeRange: 'range', panelTitle: 'Panel', panelId: '1', sourcePanel: 'Source' }
    );

    expect(result.system).toContain('at most approximately 256,000 tokens');
    expect(result.system).toContain('soft instruction');
  });
});
