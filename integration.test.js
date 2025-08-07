const http = require('http');
const { spawn } = require('child_process');

describe('Integration Tests', () => {
    let server;
    let serverPort;
    let requestCount = 0;

    beforeAll((done) => {
        server = http.createServer((req, res) => {
            requestCount++;
            console.log(`Test server received: ${req.method} ${req.url}`);
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');
        });

        server.listen(0, () => {
            serverPort = server.address().port;
            console.log(`Test server listening on port ${serverPort}`);
            done();
        });
    });

    afterAll((done) => {
        server.close(done);
    });

    beforeEach(() => {
        requestCount = 0;
    });

    test('should make repeated requests with interval', (done) => {
        const env = {
            ...process.env,
            CRON_SCHEDULE: `1s, GET, http://localhost:${serverPort}/test`
        };

        const child = spawn('node', ['index.js'], { env });

        child.stdout.on('data', (data) => {
            console.log(`stdout: ${data}`);
        });

        child.stderr.on('data', (data) => {
            console.error(`stderr: ${data}`);
        });

        setTimeout(() => {
            child.kill('SIGTERM');
            expect(requestCount).toBeGreaterThanOrEqual(2);
            done();
        }, 3500);
    }, 10000);

    test('should handle multiple schedules', (done) => {
        const env = {
            ...process.env,
            CRON_SCHEDULE: `1s, GET, http://localhost:${serverPort}/endpoint1
1s, POST, http://localhost:${serverPort}/endpoint2`
        };

        const child = spawn('node', ['index.js'], { env });

        setTimeout(() => {
            child.kill('SIGTERM');
            expect(requestCount).toBeGreaterThanOrEqual(4);
            done();
        }, 2500);
    }, 10000);

    test('should handle invalid URL gracefully', (done) => {
        const env = {
            ...process.env,
            CRON_SCHEDULE: `1s, GET, http://invalid-host-that-does-not-exist:9999/test`
        };

        const child = spawn('node', ['index.js'], { env });
        let errorLogged = false;

        child.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.includes('ERROR')) {
                errorLogged = true;
            }
        });

        child.stderr.on('data', (data) => {
            const output = data.toString();
            if (output.includes('ERROR')) {
                errorLogged = true;
            }
        });

        setTimeout(() => {
            child.kill('SIGTERM');
            expect(errorLogged).toBe(true);
            done();
        }, 2000);
    }, 10000);
});