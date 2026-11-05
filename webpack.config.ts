import path from 'node:path';
import type { Configuration } from 'webpack';
import grafanaConfig, { type Env } from './.config/webpack/webpack.config';

export default async function config(env: Env): Promise<Configuration> {
  const baseConfig = await grafanaConfig(env);
  return { ...baseConfig, entry: { module: path.resolve(process.cwd(), 'src/module.ts') } };
}
