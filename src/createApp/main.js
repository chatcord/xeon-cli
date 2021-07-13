// XEON CLI - A Command Line Interface For XEONJS.
/**
 * Copyright (c) 2021-present, ChatCord, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
'use strict';
// Import all require files.
import fs from 'fs';
import path from 'path';
import https from 'https';
import chalk from 'chalk';
import { promisify } from 'util';
import execa from 'execa';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';
import { Templatelist } from './template.js';
import copyFolder from '../utils/copyFolder.js';
// Some promisify functions to make them asyncronus.
const access = promisify(fs.access);
// templateDir variable to make it global.
var templateDir;
// check the target directory.
// exit if there is an directory with the same name and it is not empty.
async function checkDir(options) {
      await access(options.targetDir.toLowerCase(), fs.constants.R_OK, err => {
            if (!err) {
                  fs.readdir(options.targetDir.toLowerCase(), (err, files) => {
                        if (err) throw err; // this may never execute.
                        if (files.length) {
                              // log the errors.
                              console.log(chalk.red.bold(`${options.targetDir} already exists.And it is not empty.`));
                              console.log(chalk.red.bold(`xeon-cli requires an empty directory or it will create that.`));
                              console.log(chalk.red.bold(`Terminating All Current Task ...`));
                              process.exit(1);
                        }
                  });
            }
      });
      return;
}
// asyncronus function to copy template files.
async function copyProject(options) {
      // check the target directory.
      checkDir(options);
      // get the template index of the template name from the template list.
      // this will be usefull leter.
      const templateIndex = Object.keys(Templatelist).indexOf(options.template);
      // if template index is not equal to -1, it means the template exists in the template list.
      if (templateIndex !== -1) {
            // get the absolute template directory.
            templateDir = Templatelist[Object.keys(Templatelist)[templateIndex]];
            // get configuration file.
            await copyFolder(templateDir, options.targetDir, options.name.split("/")[options.name.split("/").length - 1]);
      } else {
            // if template name is not in template list.
            // it means template is from another host.
            templateDir = options.template;
            await copyFolder(templateDir, options.targetDir, options.name.split("/")[options.name.split("/").length - 1]);
      }
      return;
}
// asyncronus function to initialize git.
async function initGit(options) {
      // we have used execa package to execute "git init" in the cmd.
      const result = await execa('git', ['init'], {
            cwd: options.targetDir,
      }).catch(err => {
            if (err) throw err;
      });
      if (result.failed) {
            return Promise.reject(new Error('Failed to initialize git'));
      }
      return;
}
// asyncronus function to update npm packages.
async function updatePackage(options) {
      // we have used execa package to execute "npm update" in the cmd.
      const result = await execa('npm', ['update'], {
            cwd: options.targetDir,
      }).catch(err => {
            if (err) throw err;
      });
      if (result.failed) {
            return Promise.reject(new Error('Failed to update npm'));
      }
      return;
}
// main initProject function.
// it will be exported as default export.
export default async function initProject(options) {
      // get the absolute path of target directory, and set it in options object.
      // app name will be in lowercase.
      options["targetDir"] = path.resolve(process.cwd(), options.name.toLowerCase());
      // initialize a new listr.
      const tasks = new Listr([
            {
                  title: 'Checking For Directory',
                  task: async () => await copyProject(options),
            },
            {
                  title: 'Install dependencies',
                  task: () =>
                        projectInstall({
                              cwd: options.targetDir,
                        }),
            },
            {
                  title: 'Initialize git',
                  task: () => initGit(options),
                  enabled: () => options.git,
            },
            {
                  title: 'Updating npm packages',
                  task: () => updatePackage(options),
                  enabled: () => options.updatePackages,
            },
      ]);
      // run the listr.
      await tasks.run();
      // Extra details to show in the cmd.
      https.get(templateDir + "xeon-cli.config.json", async res => {
            res.setEncoding('utf8');
            res.on('data', data => {
                  const config = JSON.parse(data);
                  console.log();
                  console.log(`
${chalk.green.bold("Template Name: ")}${chalk.cyanBright(config.name)}
${chalk.green.bold("Template Author: ")}${chalk.cyanBright(config.author)}
${chalk.green.bold("Template Version: ")}${chalk.cyanBright(config.version)}
            `);
                  console.log(chalk.blueBright.bold(`
A new xeon app named '${options.name.split("/")[options.name.split("/").length - 1]}' is created at '${options.targetDir}' .

You can now run the project using : 
${chalk.yellow.bold('cd')} ${chalk.white("." + options.targetDir.split(process.cwd())[options.targetDir.split(process.cwd()).length - 1])}
${chalk.yellow.bold("npm")} ${chalk.white("start")}

${chalk.cyanBright.bold("Let's Code Together...")}
                  `));
            });
      });
}
