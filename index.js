#!/usr/bin/env node

"use strict";

const path = require('path');
var chalk       = require('chalk');
var clear       = require('clear');
var CLI         = require('clui');
var figlet      = require('figlet');
var inquirer    = require('inquirer');
var Preferences = require('preferences');
var Spinner     = CLI.Spinner;
var GitHubApi   = require('github');
var _           = require('lodash');
var git         = require('simple-git')();
var touch       = require('touch');
var fs          = require('fs-extra');
var minimist    = require('minimist');



// function template(strings, ...keys) {
//   return (function(...values) {
//     var dict = values[values.length - 1] || {};
//     var result = [strings[0]];
//     keys.forEach(function(key, i) {
//       var value = Number.isInteger(key) ? values[key] : dict[key];
//       result.push(value, strings[i + 1]);
//     });
//     return result.join('');
//   });
// }

// var t1Closure = template`${0}${1}${0}!`;
// console.log('1:', t1Closure('Y', 'A'));  // "YAY!"
// var t2Closure = template`${0} ${'foo'}!`;
// console.log('2:', t2Closure('Hello', {foo: 'World'}));  // "Hello World!"

// const t3TemplateStr = "`${0} ${'foo'}!`";
// var t3Closure = template;
// console.log('2:', t2Closure('Hello', {foo: 'World'}));  // "Hello World!"

// process.exit();



function usage() {
  // clear();
  console.log(
    chalk.green(
      figlet.textSync('tetool help', { horizontalLayout: 'full' })
    )
  );
  console.log('tetool --site    <siteDir>');
  console.log('       --title   <siteTitle>');
  console.log('       --source  <sourceDir>');
}

function directoryExists(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
}


function main() {
  var argv = minimist(process.argv.slice(2));

  // clear();
  console.log(
    chalk.yellow(
      figlet.textSync('tetool', { horizontalLayout: 'full' })
    )
  );

  console.log('argv', argv);

  let siteRoot = null;
  let title = null;
  let baseURL = null;
  let symlinkFilename = null;
  let error = false;
  let help = false;

  if (argv.help) {
    help = true;
  }
  else if (argv.site) {
    siteRoot = argv.site;
  }
  else {
    error = true;
  }

  if (help || error) {
    usage();
    process.exit();
  }

  console.log('siteRoot:', siteRoot);
  let siteDir = path.join(siteRoot, 'docs/');

  // ensure siteRoot exists
  if (!directoryExists(siteRoot)) {
    console.log(chalk.red('Site root directory does not exist:', siteRoot));
    process.exit();
  }
  else {
    if (!directoryExists(siteDir)) {
      console.log(chalk.yellow('Site will be created:', siteDir));
      fs.mkdirSync(siteDir);
      if (!directoryExists(siteDir)) {
        console.log(chalk.red('Error creating docs/ directory:', siteDir));
        process.exit();
      }
    }
    else {
      console.log(chalk.green('Site exists:', siteDir));
    }
  }

  // OK, we have a docs/ directory now, or we've exited the process
  // Let's ensure there is a /configurations dir

  let configurationsDir = path.join(siteDir, 'configurations/');
  if (!directoryExists(configurationsDir)) {
    console.log(chalk.yellow('configurations/ will be created:', configurationsDir));
    fs.mkdirSync(configurationsDir);
    if (!directoryExists(configurationsDir)) {
      console.log(chalk.red('Error creating configurations/ directory:', configurationsDir));
      process.exit();
    }
  }
  else {
    console.log(chalk.green('configurations/ exists:', configurationsDir));
  }

  let logoFile = null;

  const indexFile = path.join(configurationsDir, 'index.json');
  if (!fs.existsSync(indexFile)) {
    console.log(chalk.yellow('index.json will be created:', indexFile));

    const siteElements = siteRoot.split('/');
    const lastElement = siteElements[siteElements.length - 2];
    console.log('siteElements', siteElements);
    console.log('lastElement', lastElement);

    logoFile = 'INCA.png';
    title = lastElement;
    baseURL = '/' + lastElement + '/';
    symlinkFilename = path.join(siteDir, lastElement);

    const indexJSON = {
      "configNames":
        [
        ],
      "logoImage": logoFile,
      "baseURL": baseURL,
      "title": lastElement
    };
    const content = JSON.stringify(indexJSON);

    fs.writeFileSync(indexFile, content, 'utf8');

    if (!fs.existsSync(indexFile)) {
      console.log(chalk.red('Error creating index file:', indexFile));
      process.exit();
    }
    else {
      console.log(chalk.green('index.json created:', indexFile));
    }
  }
  else {
    console.log(chalk.green('index.json exists:', indexFile));
    const content = fs.readFileSync(indexFile, 'utf8');
    const indexJSON = JSON.parse(content);
    console.log('indexJSON:', indexJSON);
    logoFile = indexJSON.logoImage;
    title = indexJSON.title;
  }

  // Ensure that INCA.png is copied, even if the index.json indicates a different logo.

  const defaultLogoFile = path.join(siteDir, 'INCA.png');
  if (!fs.existsSync(defaultLogoFile)) {
    console.log(chalk.yellow('Default logo file will be copied:', defaultLogoFile));

    // Sync:
    try {
      fs.copySync('docsTemplate/INCA.png', defaultLogoFile);
      console.log(chalk.green('Default logo file copied:', defaultLogoFile));
    }
    catch (err) {
      console.log(chalk.red('Error copying default logo file:', defaultLogoFile), err);
      process.exit();
    }

    if (!fs.existsSync(defaultLogoFile)) {
      console.log(chalk.red('Default logo file not copied:', defaultLogoFile));
      process.exit();
    }
    else {
      console.log(chalk.green('Default logo file copied:', defaultLogoFile));
    }
  }
  else {
    console.log(chalk.green('Default logo file exists:', defaultLogoFile));
  }

  //
  // Generate index.html in the target, using Template Literals
  //

  const indexHTMLFile = path.join(siteDir, 'index.html');
  if (!fs.existsSync(indexHTMLFile)) {
    console.log(chalk.yellow('Default index.html file will be generated:', indexHTMLFile));

    const templateIndexHTMLFile = 'docsTemplate/index.html';
    const template = fs.readFileSync(templateIndexHTMLFile, 'utf8');

    console.log(title, baseURL);
    var titleAdded = template.replace(/\$\{title\}/g, title);
    var baseAdded = titleAdded.replace(/\$\{baseURL\}/g, baseURL);

    fs.writeFileSync(indexHTMLFile, baseAdded, 'utf8');

    if (!fs.existsSync(indexHTMLFile)) {
      console.log(chalk.red('Error writing index.html file:', indexHTMLFile));
      process.exit();
    }
    else {
      console.log(chalk.green('index.html generated:', indexHTMLFile));
    }
  }
  else {
    console.log(chalk.green('index.html exists:', indexHTMLFile));
  }

  if (!fs.existsSync(symlinkFilename)) {
    console.log(chalk.yellow('Symlink will be generated:', symlinkFilename));
    // Make a symlink so that local debugging is easier
    console.log('symlink:', symlinkFilename);
    fs.symlinkSync('.', symlinkFilename);
  }
  else {
    console.log(chalk.green('Symlink exists:', symlinkFilename));
  }
}

main();

