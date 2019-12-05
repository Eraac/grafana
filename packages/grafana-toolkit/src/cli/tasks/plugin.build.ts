import { Task, TaskRunner } from './task';
import { resolve as resolvePath } from 'path';
import globby from 'globby';
import { constants as fsConstants, promises as fs } from 'fs';

// @ts-ignore
import execa = require('execa');
import { Linter, Configuration, RuleFailure } from 'tslint';
import * as prettier from 'prettier';

import { useSpinner } from '../utils/useSpinner';
import { testPlugin } from './plugin/tests';
import { bundlePlugin as bundleFn, PluginBundleOptions } from './plugin/bundle';

const { copyFile, readFile, writeFile } = fs;
const { COPYFILE_EXCL } = fsConstants;

interface PluginBuildOptions {
  coverage: boolean;
}

interface Fixable {
  fix?: boolean;
}

export const bundlePlugin = useSpinner<PluginBundleOptions>('Compiling...', async options => await bundleFn(options));

// @ts-ignore
export const clean = useSpinner<void>('Cleaning', async () => await execa('rimraf', [`${process.cwd()}/dist`]));

const copyIfNonExistent = (srcPath, destPath) =>
  copyFile(srcPath, destPath, COPYFILE_EXCL)
    .then(() => console.log(`Created: ${destPath}`))
    .catch(error => {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    });

export const prepare = useSpinner<void>('Preparing', async () => {
  await Promise.all([
    // Copy only if local tsconfig does not exist.  Otherwise this will work, but have odd behavior
    copyIfNonExistent(
      resolvePath(process.cwd(), 'tsconfig.json'),
      resolvePath(__dirname, '../../config/tsconfig.plugin.local.json')
    ),
    // Copy only if local prettierrc does not exist.  Otherwise this will work, but have odd behavior
    copyIfNonExistent(
      resolvePath(process.cwd(), '.prettierrc.js'),
      resolvePath(__dirname, '../../config/prettier.plugin.rc.js')
    ),
  ]);

  // Nothing is returned
});

// @ts-ignore
const typecheckPlugin = useSpinner<void>('Typechecking', async () => {
  await execa('tsc', ['--noEmit']);
});

const getTypescriptSources = () => globby(resolvePath(process.cwd(), 'src/**/*.+(ts|tsx)'));

const getStylesSources = () => globby(resolvePath(process.cwd(), 'src/**/*.+(scss|css)'));

export const prettierCheckPlugin = useSpinner<Fixable>('Prettier check', async ({ fix }) => {
  const [prettierConfig, paths] = await Promise.all([
    readFile(resolvePath(__dirname, '../../config/prettier.plugin.config.json'), 'utf8').then(
      contents => JSON.parse(contents) as object
    ),

    Promise.all([getStylesSources(), getTypescriptSources()]).then(results => results.flat()),
  ]);

  const promises: Promise<{ path: string; success: boolean }>[] = paths.map(path =>
    readFile(path, 'utf8')
      .then(contents => {
        const config = {
          ...prettierConfig,
          filepath: path,
        };

        if (fix && !prettier.check(contents, config)) {
          return prettier.format(contents, config);
        }
      })
      .then(newContents => {
        if (fix && newContents && newContents.length > 10) {
          return writeFile(path, newContents)
            .then(() => {
              console.log(`Fixed: ${path}`);
              return true;
            })
            .catch(error => {
              console.log(`Error fixing ${path}`, error);
              return false;
            });
        } else if (fix) {
          console.log(`No automatic fix for: ${path}`);
          return false;
        } else {
          return false;
        }
      })
      .then(success => ({ path, success }))
  );

  const failures = (await Promise.all(promises)).filter(({ success }) => !success);

  if (failures.length) {
    console.log('\nFix Prettier issues in following files:');
    failures.forEach(({ path }) => console.log(path));
    console.log('\nRun toolkit:dev to fix errors');
    throw new Error('Prettier failed');
  }
});

// @ts-ignore
export const lintPlugin = useSpinner<Fixable>('Linting', async ({ fix }) => {
  let tsLintConfigPath = resolvePath(process.cwd(), 'tslint.json');
  if (!fs.existsSync(tsLintConfigPath)) {
    tsLintConfigPath = resolvePath(__dirname, '../../config/tslint.plugin.json');
  }
  const options = {
    fix: fix === true,
    formatter: 'json',
  };

  const configuration = Configuration.findConfiguration(tsLintConfigPath).results;
  const sourcesToLint = getTypescriptSources();

  const lintResults = sourcesToLint
    .map(fileName => {
      const linter = new Linter(options);
      const fileContents = fs.readFileSync(fileName, 'utf8');
      linter.lint(fileName, fileContents, configuration);
      return linter.getResult();
    })
    .filter(result => {
      return result.errorCount > 0 || result.warningCount > 0;
    });

  if (lintResults.length > 0) {
    console.log('\n');
    const failures = lintResults.reduce<RuleFailure[]>((failures, result) => {
      return [...failures, ...result.failures];
    }, []);
    failures.forEach(f => {
      // tslint:disable-next-line
      console.log(
        `${f.getRuleSeverity() === 'warning' ? 'WARNING' : 'ERROR'}: ${
          f.getFileName().split('src')[1]
        }[${f.getStartPosition().getLineAndCharacter().line + 1}:${
          f.getStartPosition().getLineAndCharacter().character
        }]: ${f.getFailure()}`
      );
    });
    console.log('\n');
    throw new Error(`${failures.length} linting errors found in ${lintResults.length} files`);
  }
});

export const pluginBuildRunner: TaskRunner<PluginBuildOptions> = async ({ coverage }) => {
  await clean();
  await prepare();
  await prettierCheckPlugin({ fix: false });
  await lintPlugin({ fix: false });
  await testPlugin({ updateSnapshot: false, coverage, watch: false });
  await bundlePlugin({ watch: false, production: true });
};

export const pluginBuildTask = new Task<PluginBuildOptions>('Build plugin', pluginBuildRunner);
