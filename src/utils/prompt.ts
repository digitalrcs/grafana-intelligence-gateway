import { ConstructedPrompt, IntelligenceGatewayOptions, PromptVariables } from '../types';

const TOKEN_PATTERN = /{{\s*(data|timeRange|panelTitle|panelId|skills|sourcePanel)\s*}}/g;

export const interpolatePrompt = (template: string, variables: PromptVariables): string =>
  template.replace(TOKEN_PATTERN, (_match, key: keyof PromptVariables) => variables[key] ?? '');

export const constructPrompt = (
  options: Pick<
    IntelligenceGatewayOptions,
    'systemPrompt' | 'userPromptTemplate' | 'skillsContext' | 'responseLengthTokens'
  >,
  variables: Omit<PromptVariables, 'skills'>
): ConstructedPrompt => {
  const allVariables: PromptVariables = {
    ...variables,
    skills: options.skillsContext || '[No additional context configured.]',
  };
  const requestedResponseTokens = Math.max(0, Math.floor(options.responseLengthTokens ?? 0));
  const responseLengthInstruction =
    requestedResponseTokens > 0
      ? `\n\nResponse length requirement: Keep the visible final answer to at most approximately ${requestedResponseTokens.toLocaleString(
          'en-US'
        )} tokens. Prioritize conclusions and next steps. This is a soft instruction because models cannot guarantee an exact token count.`
      : '';
  return {
    system: `${interpolatePrompt(options.systemPrompt, allVariables)}${responseLengthInstruction}`,
    user: interpolatePrompt(options.userPromptTemplate, allVariables),
  };
};
