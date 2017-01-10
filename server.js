'use strict';

//
// Scheduled or immediate backup.
//

var exec = require('child-process-promise').exec;
var argv = require('yargs').argv;
var quote = require('quote');
var moment = require('moment');
var path = require('path');

var dbhost = argv.host || 'localhost';
var dbport = argv.port || 27017;

console.log('Using database at ' + dbhost + ':' + dbport);

var baseOutputDirectory = argv.out || 'dump';
console.log('Base output directory: ' + baseOutputDirectory);

//
// Execute a backup now.
//
var doBackup = function () {
	var year = moment().format('YYYY');
	var month = moment().format('MM');
	var outputDirectory = path.join(baseOutputDirectory, year, month, moment().format('YYYY_MM_DD__HH_m'));

	console.log('Backing database to ' + outputDirectory);

	var cmd = 'mongodump -h ' + quote(dbhost) + ' --port ' + quote(dbport) + ' --out ' + quote(outputDirectory);
	console.log("> " + cmd);

	exec(cmd)
		.then(function () {
			console.log('Backed up database');
		})
		.catch(function (err) {
			console.error('Failed to backup database.');
			console.error(err.stack);
		});
};

if (argv.immediate) {
	doBackup();
}
else {
	var pollFrequency = argv.poll || '0 0 * * *';

	console.log('Scheduled frequency ' + pollFrequency);

	// Scheduled backup.
	var CronJob = require('cron').CronJob;
	new CronJob({
		cronTime: pollFrequency,
		onTick: doBackup, 
		start: true,
	});
}

