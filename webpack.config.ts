import path from 'node:path';
import type { Configuration } from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import grafanaConfig, { type Env } from './.config/webpack/webpack.config';

// This repository contains one plugin. Archived source/release evidence outside
// src must never become an additional plugin entry in the distributed bundle.
export default async function config(env: Env): Promise<Configuration> {
  const baseConfig = await grafanaConfig(env);
  return {
    ...baseConfig,
    entry: { module: path.resolve(process.cwd(), 'src/module.ts') },
    plugins: [
      ...(baseConfig.plugins ?? []),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: path.resolve(process.cwd(), 'node_modules/html-to-image/LICENSE'),
            to: 'licenses/html-to-image-LICENSE.txt',
          },
        ],
      }),
    ],
  };
}
