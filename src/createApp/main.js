import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { promisify } from 'util';
import execa from 'execa';
import Listr from 'listr';
import { projectInstall } from 'pkg-install';
import { Templatelist } from './template.js';

const access = promisify(fs.access);

async function checkDir(options) {
      await access(options.targetDir, fs.constants.R_OK, err => {
            if (!err) {
                  console.log(chalk.red.bold(`${options.targetDir} already exists.`));
                  console.log(chalk.red.bold(`Terminating All Current Task ...`));
                  process.exit(1);
            } else {
                  fs.mkdir(options.targetDir, err => {
                        if (!err) {
                              console.log(chalk.green(`${options.targetDir} is created.
                              `));
                        }
                  });
            }
      });
}
function createFiles(rootDir, templateDir, options) {
      fs.readFile(path.join(templateDir, "xeon-cli.config.json"), "utf-8", (err, data) => {
            if (err) throw err;
            const config = JSON.parse(data);
            const appName = options.name.split("/")[options.name.split("/").length - 1];
            for (let j = 0; j < config.files.length; j++) {
                  var value;
                  fs.readFile(path.join(templateDir, config.files[j]), "utf-8", (err, data) => {
                        if (err) throw err;
                        value = data.replace(/{%name%}/gi, appName);
                        fs.outputFile(path.join(rootDir, config.files[j]), value, err => {
                              if (err) throw err;
                        });
                  });
            };
      });
}
var templateDir;
function insertFiles(options) {
      checkDir(options);
      const rootDir = options.targetDir;
      const templateKeys = Object.keys(Templatelist);
      for (let i = 0; i < templateKeys.length; i++) {
            if (templateKeys[i] === options.template) {
                  templateDir = path.join(__dirname, "../..", Templatelist[templateKeys[i]]);
                  createFiles(rootDir, templateDir, options);
                  break;
            } else {
                  templateDir = options.template;
                  createFiles(rootDir, templateDir, options);
                  break;
            }
      }
}

async function initGit(options) {
      const result = await execa('git', ['init'], {
            cwd: options.targetDir,
      });
      if (result.failed) {
            return Promise.reject(new Error('Failed to initialize git'));
      }
      return;
}

export default async function initProject(options) {
      options["targetDir"] = path.resolve(process.cwd(), options.name);

      const tasks = new Listr([
            {
                  title: 'Checking For Directory',
                  task: () => insertFiles(options),
            },
            {
                  title: 'Initialize git',
                  task: () => initGit(options),
                  enabled: () => options.git,
            },
            {
                  title: 'Install dependencies',
                  task: () =>
                        projectInstall({
                              cwd: options.targetDir,
                        }),
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
            console.log();
            console.log(chalk.blue.bold('Please Check The Settings : '), options);
            console.log(chalk.blueBright.bold(`
A new xeon app named '${options.name.split("/")[options.name.split("/").length - 1]}' is created at '${options.targetDir}' .

You can now run the project using : 
${chalk.yellow.bold('cd')} ${chalk.white( "."+options.targetDir.split(process.cwd())[options.targetDir.split(process.cwd()).length - 1] )}
${chalk.yellow.bold("npm")} ${chalk.white("start")}

${chalk.cyanBright.bold("Enjoy😊...")}
            `));
      });
}
