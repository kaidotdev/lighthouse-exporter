'use strict';

const { createServer } = require('http');
const { URL } = require('url');
const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const { Gauge, collectDefaultMetrics, register } = require('prom-client');
const { program } = require('commander');

program.requiredOption('--target <uri>', 'URI of a target to run lighthouse');
program.parse(process.argv);

const gauge = new Gauge({
    name: 'lighthouse_score',
    help: 'Score of results of running lighthouse',
    labelNames: ['uri', 'category'],
});
collectDefaultMetrics();

createServer(async (req, res) => {
    if (req.url === '/metrics') {
        const browser = await puppeteer.launch({
            headless: true,
        });
        await lighthouse(program.target, {
            port: new URL(browser.wsEndpoint()).port,
            output: 'json',
        }).then((results) => {
            Object.keys(results.lhr.categories).forEach((key) => {
                gauge.set({uri: program.target, category: key}, results.lhr.categories[key].score * 100);
            });
        });
        await browser.close();

        res.writeHead(200, {'Content-Type': register.contentType});
        res.write(register.metrics());
    } else if (req.url === '/health') {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write('OK');
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.write('Not Found');
    }
    res.end();
}).listen(8000);
