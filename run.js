#!/usr/bin/env node
'use strict'

const app = require('commander');
const run = require('./index');

app.version(require('./package.json').version)
	.option('-s, --source [file]', 'Name & path to the YAML containing a list of sites to test.', 'source.yml')
	.parse(process.argv);

run(app);
