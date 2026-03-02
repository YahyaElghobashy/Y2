#!/usr/bin/env node

const url = process.argv[2] || 'http://localhost:3000';
const output = process.argv[3] || '/tmp/y2-audit-home.png';

const puppeteer = await import('puppeteer');
const browser = await puppeteer.default.launch({ headless: true });
const page = await browser.newPage();

await page.setViewport({ width: 375, height: 812 });
await page.goto(url, { waitUntil: 'networkidle0' });
await page.screenshot({ path: output, fullPage: true });

await browser.close();

console.log(output);
