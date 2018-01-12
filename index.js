'use strict'

const YAML = require('yamljs');
const fs = require('fs');
const shell = require('shelljs');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const ReportGeneratorV2 = require('lighthouse/lighthouse-core/report/v2/report-generator');

const OUTPUT = './reports';

run.OUTPUT = OUTPUT;
module.exports = run;

function run(options) {
  const output = options.output || OUTPUT;

  shell.rm('-rf', output);
  shell.mkdir('-p', output);

  var source = YAML.parse(fs.readFileSync(options.source, 'utf8'));

  // Iterate all listed sites and execute lighthouse per url of that site.
  const sites = source.sites
  let siteQueue = generateSiteQueue(sites);
  // console.log(siteQueue);
  const flags = {
    // chromeFlags: ['--headless']
  };
  const results = runJobs(siteQueue, null, output, flags);
}

function runJobs(jobs, config, outputDir, flags = {}) {
  let job = jobs.shift();
  return launchChromeAndRunLighthouse(job.url, flags, config).then(results => {
    const html = new ReportGeneratorV2().generateReportHtml(results);
    fs.writeFile(outputDir + '/' + job.parentId + '-' + job.id + '.html', html, (err) => {
      if (err) throw err;
      console.log('Saved result for ' + job.parentId + ':' + job.id);
    });
    if (jobs.length != 0) {
      runJobs(jobs, config, outputDir, flags);  
    }
  });
}

function generateSiteQueue(sites) {
  // For each url create an executable job.
  return sites.map(site => {
    return site.urls.map(url => {
      return Object.keys(url).map(k => {
        return {
          'parentId': site.id,
          'id': k,
          'url': site.domain + url[k]
        };
      });
    }).reduce((p, c) => p.concat(c)); // Flatten array
  }).reduce((p, c) => p.concat(c)); // Flatten array
}

function launchChromeAndRunLighthouse(url, flags = {}, config = null) {
  return chromeLauncher.launch(flags).then(chrome => {
    flags.port = chrome.port;
    return lighthouse(url, flags, config).then(results =>
      chrome.kill().then(() => results));
  });
}
