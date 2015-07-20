
var CronJob = require('cron').CronJob;
new CronJob({
    cronTime: '*/1 * * * *',
    onTick: function() { 
    	console.log('Backing database');
    }, 
    start: true,
});




