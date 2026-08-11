import { extractModelIds, extractResponseText } from './aiClient';

describe('extractResponseText', () => {
  it('reads an OpenAI chat completion', () => {
    expect(extractResponseText({ choices: [{ message: { content: ' Assessment ' } }] })).toBe('Assessment');
  });

  it('reads a messaging activity response', () => {
    expect(extractResponseText({ activities: [{ text: 'Copilot response' }] })).toBe('Copilot response');
  });

  it('rejects empty provider responses', () => {
    expect(() => extractResponseText({ choices: [] })).toThrow('no text content');
  });

  it('explains when reasoning consumes the output-token limit', () => {
    expect(() =>
      extractResponseText({
        choices: [
          {
            finish_reason: 'length',
            message: { content: '', reasoning_content: 'The model was still reasoning.' },
          },
        ],
      })
    ).toThrow('entire output-token limit for reasoning');
  });
});

describe('extractModelIds', () => {
  it('reads, deduplicates, and sorts OpenAI model-list responses', () => {
    expect(extractModelIds({ data: [{ id: 'model-b' }, { id: 'model-a' }, { id: 'model-b' }] })).toEqual([
      'model-a',
      'model-b',
    ]);
  });

  it('supports common custom model-list shapes', () => {
    expect(extractModelIds({ models: ['local-model', { name: 'named-model' }] })).toEqual([
      'local-model',
      'named-model',
    ]);
  });
});
