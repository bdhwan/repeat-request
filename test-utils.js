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

module.exports = {
    parseSchedule,
    parseInterval
};