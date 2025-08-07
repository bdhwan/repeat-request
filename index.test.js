const { parseSchedule, parseInterval } = require('./test-utils');

describe('parseSchedule', () => {
    test('should parse single schedule line', () => {
        const input = '10s, POST, http://localhost:8080/api/v1/test';
        const result = parseSchedule(input);
        expect(result).toEqual([
            { interval: '10s', method: 'POST', url: 'http://localhost:8080/api/v1/test' }
        ]);
    });

    test('should parse multiple schedule lines', () => {
        const input = `10s, POST, http://localhost:8080/api/v1/test
        1m, GET, http://localhost:8080/api/v1/test
        1h, GET, http://localhost:8080/api/v1/test`;
        const result = parseSchedule(input);
        expect(result).toHaveLength(3);
        expect(result[0]).toEqual({ interval: '10s', method: 'POST', url: 'http://localhost:8080/api/v1/test' });
        expect(result[1]).toEqual({ interval: '1m', method: 'GET', url: 'http://localhost:8080/api/v1/test' });
        expect(result[2]).toEqual({ interval: '1h', method: 'GET', url: 'http://localhost:8080/api/v1/test' });
    });

    test('should parse cron schedule', () => {
        const input = '0 10 * * *, GET, http://localhost:8080/api/v1/test';
        const result = parseSchedule(input);
        expect(result).toEqual([
            { interval: '0 10 * * *', method: 'GET', url: 'http://localhost:8080/api/v1/test' }
        ]);
    });

    test('should filter out invalid lines', () => {
        const input = `10s, POST, http://localhost:8080/api/v1/test
        invalid line
        1m, GET, http://localhost:8080/api/v1/test`;
        const result = parseSchedule(input);
        expect(result).toHaveLength(2);
    });
});

describe('parseInterval', () => {
    test('should parse seconds interval', () => {
        const result = parseInterval('10s');
        expect(result).toEqual({ type: 'interval', value: 10000 });
    });

    test('should parse minutes interval', () => {
        const result = parseInterval('5m');
        expect(result).toEqual({ type: 'interval', value: 300000 });
    });

    test('should parse hours interval', () => {
        const result = parseInterval('2h');
        expect(result).toEqual({ type: 'interval', value: 7200000 });
    });

    test('should parse cron expression', () => {
        const result = parseInterval('0 10 * * *');
        expect(result).toEqual({ type: 'cron', value: '0 10 * * *' });
    });

    test('should parse complex cron expression', () => {
        const result = parseInterval('*/5 * * * *');
        expect(result).toEqual({ type: 'cron', value: '*/5 * * * *' });
    });

    test('should return null for invalid interval', () => {
        expect(parseInterval('invalid')).toBeNull();
        expect(parseInterval('10x')).toBeNull();
        expect(parseInterval('m10')).toBeNull();
    });
});