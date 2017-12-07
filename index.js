#!/usr/bin/env node

"use strict";

const path = require('path');
var chalk       = require('chalk');
var clear       = require('clear');
var figlet      = require('figlet');
var GitHubApi   = require('github');
var _           = require('lodash');
var git         = require('simple-git');  // https://github.com/steveukx/git-js
var fs          = require('fs-extra');
var minimist    = require('minimist');
const { execSync } = require('child_process');



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
  console.log('       --source  <sourceDir>@branch');
  console.log('       --local');
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

  // console.log('###argv', argv);
  let docsTemplate = path.resolve(__dirname, 'docsTemplate');
  let siteRoot = null;
  let title = null;
  let baseURL = null;
  let error = false;
  let help = false;
  const localMode = !!argv.local;
  let tejs =
`
    <script type="text/javascript" src="https://incatools.github.io/table-editor/vendor.js"></script>
    <script type="text/javascript" src="https://incatools.github.io/table-editor/bundle.js"></script>
`;

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
  let siteDir = path.resolve(siteRoot, 'docs/');

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
  let configNames = [];

  const siteBasename = path.basename(path.resolve(siteRoot));
  console.log('siteBasename', siteBasename);
  logoFile = 'INCA.png';
  title = argv.title || siteBasename;
  baseURL = '/' + siteBasename + '/';
  if (localMode) {
    baseURL = '/';
    tejs =
`
  <script type="text/javascript" src="http://127.0.0.1:8085/bundle.js"></script>
`;
  }

  const indexFile = path.join(configurationsDir, 'index.json');
  var indexJSON;
  if (!fs.existsSync(indexFile)) {
    console.log(chalk.yellow('index.json will be created:', indexFile));

    indexJSON = {
      "configNames": configNames,
      "logoImage": logoFile,
      "baseURL": baseURL,
      "title": title
    };
    const content = JSON.stringify(indexJSON, null, 2);

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
    indexJSON = JSON.parse(content);
    console.log('indexJSON:', indexJSON);
    logoFile = indexJSON.logoImage;
    configNames = indexJSON.configNames;
    title = indexJSON.title;
  }

  // Ensure that INCA.png is copied, even if the index.json indicates a different logo.

  const defaultLogoFile = path.join(siteDir, 'INCA.png');
  if (!fs.existsSync(defaultLogoFile)) {
    console.log(chalk.yellow('Default logo file will be copied:', defaultLogoFile));

    const logoTemplate = path.join(docsTemplate, 'INCA.png');
    try {
      fs.copySync(logoTemplate, defaultLogoFile);
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

    const templateIndexHTMLFile = path.join(docsTemplate, 'index.html');
    const template = fs.readFileSync(templateIndexHTMLFile, 'utf8');

    console.log(title, baseURL);
    var titleAdded = template.replace(/\$\{title\}/g, title);
    var baseAdded = titleAdded.replace(/\$\{baseURL\}/g, baseURL);
    var tejsAdded = baseAdded.replace(/\$\{tableEditorJSInclude\}/g, tejs);
    fs.writeFileSync(indexHTMLFile, tejsAdded, 'utf8');

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

  if (localMode) {
    let symlinkFilename = path.join(siteDir, siteBasename);
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

  if (argv.source) {
    const sources = (typeof argv.source === 'string') ? [argv.source] : argv.source;

    console.log('');
    console.log('');
    console.log(chalk.green('Generate configurations from sources'));

    sources.forEach(function(sourceAndBranch) {
      console.log(chalk.green('SourceAndBranch:', sourceAndBranch));

      let sourceAndBranchSplit = sourceAndBranch.split(/@/);
      let source = sourceAndBranchSplit[0];
      let branch = sourceAndBranchSplit.length === 1 ? 'master' : sourceAndBranchSplit[1];
      if (!directoryExists(source)) {
        console.log(chalk.red('...Source does not exist:', source));
        process.exit();
      }

      const sourceGitDir = path.join(source, '.git');
      if (!directoryExists(sourceGitDir)) {
        console.log(chalk.red('...Source .git directory does not exist:', sourceGitDir));
        process.exit();
      }

      const sourceGitRemoteURL = execSync(
        'git ls-remote --get-url',
        {
          cwd: source,
          encoding:'utf8'
        }).trim();
      console.log('...### sourceGitRemoteURL', sourceGitRemoteURL);
      let rawPrefix = sourceGitRemoteURL
                        .replace('git@github.com:', 'https://raw.githubusercontent.com/')
                        .replace('https://github.com/', 'https://raw.githubusercontent.com/')
                        .replace(/\.git$/, '/' + branch + '/');
      console.log('...### rawPrefix', rawPrefix);

      if (localMode) {
        rawPrefix = 'http://127.0.0.1:8888/';
      }
      // console.log('...### BEFORE');
      // const sourceGit = git(source);  // Use source as working dir
      // sourceGit.listRemote(['--get-url'], function(err, data) {
      //   if (!err) {
      //     console.log('...### Remote url for repository at ' + __dirname + ':', data);
      //   }
      // });
      // console.log('...### AFTER');

      // const sourceGitConfig = path.join(sourceGitDir, 'config');
      // if (!fs.existsSync(sourceGitConfig)) {
      //   console.log(chalk.red('...No .git/config found:', sourceGitConfig));
      //   process.exit();
      // }

      // const sourceGitConfigContent = fs.readFileSync(sourceGitConfig, 'utf8');
      // console.log('...####sourceGitConfig', sourceGitConfigContent);

      const patternsPath1 = 'src/patterns';
      const patternsPath2 = 'patterns';
      const patternsPath3 = 'src/ontology/patterns';
      const patternsFullPath1 = path.join(source, patternsPath1);
      const patternsFullPath2 = path.join(source, patternsPath2);
      const patternsFullPath3 = path.join(source, patternsPath3);
      let patternsPath = null;
      let patternsFullPath = null;
      if (!directoryExists(patternsFullPath1)) {
        if (!directoryExists(patternsFullPath2)) {
          if (!directoryExists(patternsFullPath3)) {
            console.log(chalk.red('...Ontology patterns directory does not exist:', patternsFullPath1, patternsFullPath2, patternsFullPath3));
            process.exit();
          }

          patternsPath = patternsPath3;
          patternsFullPath = patternsFullPath3;
        }
        else {
          patternsPath = patternsPath2;
          patternsFullPath = patternsFullPath2;
        }
      }
      else {
        patternsPath = patternsPath1;
        patternsFullPath = patternsFullPath1;
      }

      // Deal with new vs old-style xsv dirs
      const xsvPath1 = 'src/ontology/modules';
      const xsvPath2 = 'patterns';
      const xsvFullPath1 = path.join(source, xsvPath1);
      const xsvFullPath2 = path.join(source, xsvPath2);
      let xsvPath = null;
      let xsvFullPath = null;
      if (!directoryExists(xsvFullPath1)) {
        if (!directoryExists(xsvFullPath2)) {
          console.log(chalk.red('...XSV directory does not exist:', xsvFullPath1, xsvFullPath2));
          process.exit();
        }
        xsvPath = xsvPath2;
        xsvFullPath = xsvFullPath2;
      }
      else {
        xsvPath = xsvPath1;
        xsvFullPath = xsvFullPath1;
      }



      let patternsContents = fs.readdirSync(patternsFullPath, 'utf8');
      let patternFiles = [];
      for (let patternFile of patternsContents) {
        let extension = path.extname(patternFile);
        if (extension !== '.yaml') {
          console.log(chalk.yellow('...Skipping non-YAML file in pattern directory', patternFile));
        }
        else {
          // const prefix = 'https://raw.githubusercontent.com/EnvironmentOntology/environmental-exposure-ontology/master/src/patterns/';
          patternFiles.push(patternFile);
        }
      }
      console.log(chalk.green('...patternFiles', patternFiles));


      let xsvContents = fs.readdirSync(xsvFullPath, 'utf8');
      let xsvFiles = [];
      for (let xsvFile of xsvContents) {
        let extension = path.extname(xsvFile);
        if (extension === '') {
          console.log(chalk.yellow('...Trying directory in ontology directory', xsvFile, xsvFullPath));
          let subFileCSV = path.resolve(xsvFullPath, xsvFile, xsvFile + '.csv');
          let subFileTSV = path.resolve(xsvFullPath, xsvFile, xsvFile + '.tsv');
          if (fs.existsSync(subFileCSV)) {
            console.log(chalk.yellow('...... resolvedTo', subFileCSV));
            xsvFiles.push(xsvFile + '/' + xsvFile + '.csv');
          }
          else if (fs.existsSync(subFileTSV)) {
            console.log(chalk.yellow('...... resolvedTo', subFileTSV));
            xsvFiles.push(xsvFile + '/' + xsvFile + '.tsv');
          }
          else {
            console.log(chalk.yellow('...Skipping non-XSV file in ontology sub-directory', xsvFile, xsvFullPath));
          }
        }
        else if ((extension !== '.tsv') && (extension !== '.csv')) {
          console.log(chalk.yellow('...Skipping non-XSV file in ontology directory', xsvFile, xsvFullPath));
        }
        else {
          console.log(chalk.yellow('...Including XSV file in ontology directory', xsvFile, xsvFullPath));
          xsvFiles.push(xsvFile);
        }
      }
      console.log(chalk.green('...xsvFiles', xsvFiles));

      //
      // Create the named directory and config.yaml for this configuration
      //
      const configName = path.basename(source);
      console.log(chalk.yellow('...configName', configName));

      if (configNames.indexOf(configName) < 0) {
        configNames.push(configName);
      }

      const configDir = path.join(configurationsDir, configName);
      if (!directoryExists(configDir)) {
        console.log(chalk.yellow('...Configuration directory will be created:', configDir));
        fs.mkdirSync(configDir);
        if (!directoryExists(configDir)) {
          console.log(chalk.red('...Error creating Configuration directory:', configDir));
          process.exit();
        }
      }
      else {
        console.log(chalk.green('...Configuration directory exists:', configDir));
      }

      const configFile = path.join(configDir, 'config.yaml');
      if (!fs.existsSync(configFile)) {
        console.log(chalk.yellow('...config.yaml will be generated:', configFile));

        const configTemplate = path.join(docsTemplate, 'configurations/config.yaml');
        try {
          fs.copySync(configTemplate, configFile);
          console.log(chalk.green('Default config.yaml copied:', configFile));
        }
        catch (err) {
          console.log(chalk.red('Error copying default config.yaml:', configFile), err);
          process.exit();
        }
      }
      else {
        console.log(chalk.green('...config.yaml exists:', configFile));
      }


      const menuFile = path.join(configDir, 'menu.yaml');
      if (!fs.existsSync(menuFile)) {
        console.log(chalk.yellow('...menu.yaml will be generated:', menuFile));

        let menuContents = '';

        menuContents += 'defaultPatterns:\n';
        patternFiles.forEach(function(patternFile) {
          menuContents += '  - url: ' + rawPrefix + path.join(patternsPath, patternFile) + '\n';
          menuContents += '    title: ' + patternFile + '\n';
          //deleteme menuContents += '    type: yaml\n';
        });

        menuContents += '\n';
        menuContents += 'defaultXSVs:\n';
        xsvFiles.forEach(function(xsvFile) {
          menuContents += '  - url: ' + rawPrefix + path.join(xsvPath, xsvFile) + '\n';
          let xsvFileTitle = xsvFile.split('/'); // I'm sorry for this hack. Make planteome conform!!!
          if (xsvFileTitle.length > 1) {
            xsvFileTitle = xsvFileTitle[1];
          }
          else {
            xsvFileTitle = xsvFileTitle[0];
          }
          menuContents += '    title: ' + xsvFileTitle + '\n';
        });

        menuContents += '\n';

        fs.writeFileSync(menuFile, menuContents, 'utf8');
      }
      else {
        console.log(chalk.green('...menu.yaml exists:', menuFile));
      }
    });

    // Update index.json with the configuration names

    indexJSON.configNames = configNames;
    fs.writeFileSync(indexFile, JSON.stringify(indexJSON, null, 2), 'utf8');
  }
}

main();

