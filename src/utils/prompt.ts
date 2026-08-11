import { ConstructedPrompt, IntelligenceGatewayOptions, PromptVariables } from '../types';

const TOKEN_PATTERN = /{{\s*(data|timeRange|panelTitle|panelId|skills|sourcePanel)\s*}}/g;

export const interpolatePrompt = (template: string, variables: PromptVariables): string =>
  template.replace(TOKEN_PATTERN, (_match, key: keyof PromptVariables) => variables[key] ?? '');

export const constructPrompt = (
  options: Pick<IntelligenceGatewayOptions, 'systemPrompt' | 'userPromptTemplate' | 'skillsContext'>,
  variables: Omit<PromptVariables, 'skills'>
): ConstructedPrompt => {
  const allVariables: PromptVariables = {
    ...variables,
    skills: options.skillsContext || '[No additional context configured.]',
  };
  return {
    system: interpolatePrompt(options.systemPrompt, allVariables),
    user: interpolatePrompt(options.userPromptTemplate, allVariables),
  };
};
