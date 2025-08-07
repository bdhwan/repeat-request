const http = require('http');
const https = require('https');
const { CronJob } = require('cron');

const schedules = [];
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '60') * 1000;

function parseSchedule(scheduleString) {
    const lines = scheduleString.trim().split('\n');
    return lines.map(line => {
        const parts = line.trim().split(',').map(p => p.trim());
        if (parts.length < 3) return null;
        
        const [interval, method, url] = parts;
        return { interval, method, url };
    }).filter(Boolean);
}

function parseInterval(interval) {
    if (interval.includes('*')) {
        return { type: 'cron', value: interval };
    }
    
    const match = interval.match(/^(\d+)([smh])$/);
    if (match) {
        const [, value, unit] = match;
        const multipliers = { 's': 1000, 'm': 60000, 'h': 3600000 };
        return { 
            type: 'interval', 
            value: parseInt(value) * multipliers[unit] 
        };
    }
    
    return null;
}

function makeRequest(method, url) {
    const startTime = new Date();
    const protocol = url.startsWith('https') ? https : http;
    
    console.log(`[${startTime.toISOString()}] ${method} ${url}`);
    
    try {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: method,
            timeout: REQUEST_TIMEOUT
        };
        
        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const endTime = new Date();
                const duration = endTime - startTime;
                console.log(`[${endTime.toISOString()}] ${duration}ms ${method} ${url} ${res.statusCode} ${res.statusMessage}`);
            });
        });
        
        req.on('error', (err) => {
            const endTime = new Date();
            const duration = endTime - startTime;
            console.error(`[${endTime.toISOString()}] ${duration}ms ${method} ${url} ERROR ${err.message}`);
        });
        
        req.on('timeout', () => {
            req.destroy();
            const endTime = new Date();
            const duration = endTime - startTime;
            console.error(`[${endTime.toISOString()}] ${duration}ms ${method} ${url} ERROR Request timeout (${REQUEST_TIMEOUT/1000}s)`);
        });
        
        req.end();
    } catch (err) {
        const endTime = new Date();
        const duration = endTime - startTime;
        console.error(`[${endTime.toISOString()}] ${duration}ms ${method} ${url} ERROR ${err.message}`);
    }
}

function setupSchedule(scheduleConfig) {
    const { interval, method, url } = scheduleConfig;
    const parsed = parseInterval(interval);
    
    if (!parsed) {
        console.error(`Invalid interval: ${interval}`);
        return;
    }
    
    if (parsed.type === 'cron') {
        console.log(`Setting up cron job: ${interval} ${method} ${url}`);
        const job = new CronJob(parsed.value, () => {
            try {
                makeRequest(method, url);
            } catch (err) {
                console.error(`Error executing cron job for ${url}: ${err.message}`);
            }
        });
        job.start();
        schedules.push(job);
    } else if (parsed.type === 'interval') {
        console.log(`Setting up interval: ${interval} ${method} ${url}`);
        const intervalId = setInterval(() => {
            try {
                makeRequest(method, url);
            } catch (err) {
                console.error(`Error executing interval for ${url}: ${err.message}`);
            }
        }, parsed.value);
        schedules.push(intervalId);
    }
}

function main() {
    const cronSchedule = process.env.CRON_SCHEDULE;
    
    if (!cronSchedule) {
        console.error('CRON_SCHEDULE environment variable not set');
        process.exit(1);
    }
    
    console.log('Starting repeat-request server...');
    console.log(`Request timeout: ${REQUEST_TIMEOUT/1000} seconds`);
    console.log('Schedule configuration:');
    console.log(cronSchedule);
    
    const configs = parseSchedule(cronSchedule);
    
    if (configs.length === 0) {
        console.error('No valid schedules found');
        process.exit(1);
    }
    
    configs.forEach(config => {
        setupSchedule(config);
    });
    
    console.log(`${configs.length} schedule(s) configured and running`);
    
    process.on('SIGTERM', () => {
        console.log('Received SIGTERM, shutting down gracefully...');
        schedules.forEach(schedule => {
            if (schedule instanceof CronJob) {
                schedule.stop();
            } else {
                clearInterval(schedule);
            }
        });
        process.exit(0);
    });
    
    process.on('SIGINT', () => {
        console.log('Received SIGINT, shutting down gracefully...');
        schedules.forEach(schedule => {
            if (schedule instanceof CronJob) {
                schedule.stop();
            } else {
                clearInterval(schedule);
            }
        });
        process.exit(0);
    });
}

main();