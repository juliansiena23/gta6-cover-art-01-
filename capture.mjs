import { chromium } from '/home/hatch/workspace/makefun/gta6-01-shots/node_modules/playwright/index.mjs';
import { mkdir } from 'node:fs/promises';
const root = new URL('.', import.meta.url).pathname;
await mkdir(`${root}screenshots`, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader','--disable-dev-shm-usage'] });
const errors=[];
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
async function open(query, viewport) { await page.setViewportSize(viewport); await page.goto(`http://127.0.0.1:8080/${query}`, { waitUntil: 'networkidle' }); await page.waitForFunction(() => window.__shotReady === true); await page.waitForTimeout(700); }
async function exportCover() { const downloaded=page.waitForEvent('download'); await page.evaluate(() => document.body.classList.remove('shot-cover')); await page.locator('#export').click(); await downloaded; await page.evaluate(() => document.body.classList.add('shot-cover')); await page.waitForTimeout(250); }
await open('?shot=cover&photo=pier&caption=NEON%20TIDELINE&layout=hero&size=landscape', {width:1280,height:720}); await page.locator('#photos').setInputFiles(['/home/hatch/workspace/makefun/gta6-cover-art-01/app/samples/boulevard.jpg','/home/hatch/workspace/makefun/gta6-cover-art-01/app/samples/pier.jpg']); await page.evaluate(() => { for (const [id, value] of [['caption','NEON TIDELINE'],['subtitle','AFTER HOURS / ENDLESS SUMMER'],['badge','COAST 06']]) { const el=document.querySelector('#'+id); el.value=value; el.dispatchEvent(new Event('input',{bubbles:true})); } document.querySelector('[data-grade=neon]').click(); }); await page.evaluate(() => window.__press.fitPreview(1920,1080)); await exportCover(); await page.screenshot({path:`${root}screenshots/1-cover.jpg`,type:'jpeg',quality:84});
await open('?shot=editor&photo=boulevard&caption=BOULEVARD%20QUEEN&layout=hero', {width:1280,height:720}); await page.screenshot({path:`${root}screenshots/2-editor.jpg`,type:'jpeg',quality:82});
await open('?shot=cover&photo=boulevard&caption=BOULEVARD%20QUEEN&layout=nine&size=portrait', {width:864,height:1080}); await page.evaluate(() => window.__press.fitPreview(1080,1350)); await exportCover(); await page.screenshot({path:`${root}screenshots/3-cover-1350.jpg`,type:'jpeg',quality:84});
await open('?shot=cover&photo=pier&caption=NIGHT%20DRIVE&layout=grid&size=square', {width:900,height:900}); await page.evaluate(() => window.__press.fitPreview(1080,1080)); await exportCover(); await page.screenshot({path:`${root}screenshots/4-cover-square.jpg`,type:'jpeg',quality:84});
console.log(JSON.stringify({errors})); await browser.close();
