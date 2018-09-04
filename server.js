'use strict';

//
// Scheduled or immediate backup.
//

var exec = require('child-process-promise').exec;
var argv = require('yargs').argv;
var quote = require('quote');
var moment = require('moment');
var path = require('path');
var Q = require("q");

var conf = require('confucious');

conf.pushJsonFile("config.json");
conf.pushArgv();

var databases = conf.get("databases") || [];

if (process.env.DBHOST && process.env.DBNAME) {
	// Database to backup is specified via env vars.
	databases.push({
		host: process.env.DBHOST,
		port: parseInt(process.env.DBPORT) || 27017,
		name: process.env.DBNAME,
	});
}

if (databases.length <= 0) {
	console.log('No databases set in the to backup.');
	process.exit(1);
}

// Validate databases.

console.log('Using databases:');
databases.forEach(function(database) {
	console.log(database.host + ':' + database.port);
}, this);

var baseOutputDirectory = argv.out || 'dump';
console.log('Base output directory: ' + baseOutputDirectory);

//
// Backup a single database.
//
var backupDb = function (database, path) {

	console.log('Backing up database to: ' + path);

	var cmd = 'mongodump -h ' + quote(database.host) + ' --port ' + quote(database.port) + ' --out ' + quote(path);

	if (database.name) {
		cmd += ' --db ' + quote(database.name);
	}

	if (database.username && database.password) {
		cmd += ' --username ' + quote(database.username) + ' --password ' + quote(database.password); 
	}

	console.log("> " + cmd);

	return exec(cmd)
		.then(function () {
			console.log('Backed up database' + database.name);
		});
};

//
// Run the database backup.
//
var doBackup = function () {

	var year = moment().format('YYYY');
	var month = moment().format('MM');
	var timeStamp = moment().format('YYYY_MM_DD__HH_m');

	var outputDirectory = path.join(baseOutputDirectory, year, month, timeStamp);

	return databases.reduce(function (promise, database) {
		return promise.then(function () { return backupDb(database, outputDirectory)})
			.catch(function (err) {
				console.error('Failed to backup database.');
				console.error(err.stack);
				return Q();
			});
		}, Q())
		.then(function () {
			console.log("Database backup complete.");
		})
		.catch(function (err) {
			console.log("Error.");
			console.log(err);
		});
}

if (conf.get("immediate")) {
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

