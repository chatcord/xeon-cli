import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ncp from 'ncp';
import { promisify } from 'util';
import execa from 'execa';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';
import { Templatelist } from './template.js';
import replaceStream from '../utils/streamReplace.js';

const access = promisify(fs.access);
const copy = ncp;
var templateDir;

async function checkDir(options) {
      await access(options.targetDir.toLowerCase(), fs.constants.R_OK, err => {
            if (!err) {
                  fs.readdir(options.targetDir.toLowerCase(), (err, files) => {
                        if (err) throw err;
                        if (files.length) {
                              console.log(chalk.red.bold(`${options.targetDir} already exists.And it is not empty.`));
                              console.log(chalk.red.bold(`xeon-cli requires an empty directory or it will create that.`));
                              console.log(chalk.red.bold(`Terminating All Current Task ...`));
                              process.exit(1);
                        }
                  });
            } else {
                  fs.mkdir(options.targetDir.toLowerCase(), err => {
                        if (!err) {
                              console.log(chalk.green(`${options.targetDir} is created.
                              `));
                        }
                  });
            }
      });
      return;
}
async function copyProject(options) {
      const templateIndex = Object.keys(Templatelist).indexOf(options.template);
      if (templateIndex !== -1) {
            templateDir = path.join(__dirname, "../..", Templatelist[Object.keys(Templatelist)[templateIndex]]);
            return copy(templateDir, options.targetDir, {
                  clobber: false,
                  filter: (source) => {
                        return source.match("xeon-cli.config.json") === null;
                  },
                  transform: (read, write) => {
                        read.pipe(replaceStream(/{%name%}/g, options.name.toLowerCase().split("/")[options.name.toLowerCase().split("/").length - 1])).pipe(write);
                  },
            }, err => {
                  if (err) throw err;
            });
      } else {
            templateDir = options.template;
            return copy(options.template, options.targetDir, {
                  clobber: false,
                  filter: (source) => {
                        return source.match("xeon-cli.config.json") === null;
                  },
                  transform: (read, write) => {
                        read.pipe(replaceStream(/{%name%}/g, options.name.toLowerCase().split("/")[options.name.toLowerCase().split("/").length - 1])).pipe(write);
                  },
            }, err => {
                  if (err) throw err;
            });
      }
}

async function initGit(options) {
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
async function updatePackage(options) {
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

export default async function initProject(options) {
      options["targetDir"] = path.resolve(process.cwd(), options.name.toLowerCase());
      checkDir(options);

      const tasks = new Listr([
            {
                  title: 'Checking For Directory',
                  task: () => copyProject(options),
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
      await tasks.run();

      fs.readFile(path.join(templateDir, "xeon-cli.config.json"), "utf-8", (err, data) => {
            if (err) throw err;
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
}
