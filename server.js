var exec = require('child-process-promise').exec;
var argv = require('yargs').argv;
var quote = require('quote');

var dbhost = argv.host || 'localhost';
var dbport = argv.port || 27017;
var pollFrequency = argv.poll || '*/1 * * * *';

console.log('Using database at ' + dbhost + ':' + dbport);
console.log('Poll frequency ' + pollFrequency);

var CronJob = require('cron').CronJob;
new CronJob({
    cronTime: pollFrequency,
    onTick: function() { 
    	var outputDirectory = 'dump';

    	console.log('Backing database to ' + outputDirectory);

    	exec('mongodump -h ' + quote(dbhost) + ' --port ' + quote(dbport) + ' --out ' + quote(outputDirectory))
    		.then(function () {
    			console.log('Backed up database');
    		})
    		.catch(function (err) {
    			console.error('Failed to backup database.');
    			console.error(err.stack);
    		});
    }, 
    start: true,
});




