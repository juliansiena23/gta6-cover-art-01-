import { drawCover, layoutPanels } from './cover.js';
import { runShot } from './shots.js';

const canvas = document.querySelector('#cover');
const $ = (selector) => document.querySelector(selector);
const state = { photos: [], crops: [], layout: 'hero', grade: 'sunset', caption: $('#caption').value, subtitle: $('#subtitle').value, badge: $('#badge').value, tilt: '1', grain: true, halftone: true, vignette: true };
let activePanel = 0;
const panelSelect = $('#panelSelect');

function countPanels() { return state.layout === 'full' ? 1 : state.layout === 'nine' ? 9 : state.layout === 'grid' ? 4 : 4; }
function setPanels() {
  const count = countPanels();
  panelSelect.replaceChildren(...Array.from({ length: count }, (_, i) => new Option(`Panel ${String(i + 1).padStart(2, '0')}`, String(i))));
  activePanel = Math.min(activePanel, count - 1); panelSelect.value = String(activePanel);
  $('#panelCount').textContent = `${String(activePanel + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')} PANELS`;
}
function repaint() { state.caption = $('#caption').value; state.subtitle = $('#subtitle').value; state.badge = $('#badge').value; state.tilt = $('#tilt').value; state.grain = $('#grain').checked; state.halftone = $('#halftone').checked; state.vignette = $('#vignette').checked; drawCover(canvas, state); }
function fitPreview(w, h) { canvas.width = w; canvas.height = h; repaint(); }
function updateCropControls() { const c = state.crops[activePanel] || { zoom: 1, x: 0, y: 0 }; $('#zoom').value = c.zoom; $('#posX').value = c.x; $('#posY').value = c.y; $('#zoomValue').value = `${Number(c.zoom).toFixed(2)}×`; }
function setCrop(key, value) { const c = state.crops[activePanel] || { zoom: 1, x: 0, y: 0 }; c[key] = Number(value); state.crops[activePanel] = c; if (key === 'zoom') $('#zoomValue').value = `${c.zoom.toFixed(2)}×`; repaint(); }
function loadImage(url) { return new Promise((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = url; }); }
async function addFiles(files) { const valid = [...files].filter((f) => f.type.startsWith('image/')).slice(0, 9); if (!valid.length) return; try { state.photos = await Promise.all(valid.map((f) => loadImage(URL.createObjectURL(f)))); state.crops = Array.from({ length: 9 }, () => ({ zoom: 1, x: 0, y: 0 })); setPanels(); updateCropControls(); repaint(); $('#status').textContent = `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} ready · drag the cover to reframe.`; } catch { $('#status').textContent = 'That image could not be opened.'; } }

$('#photos').addEventListener('change', (event) => addFiles(event.target.files));
for (const el of [$('#caption'), $('#subtitle'), $('#badge'), $('#tilt'), $('#grain'), $('#halftone'), $('#vignette')]) el.addEventListener('input', repaint);
$('#layouts').addEventListener('click', (event) => { const button = event.target.closest('[data-layout]'); if (!button) return; state.layout = button.dataset.layout; document.querySelectorAll('.layout').forEach((b) => b.classList.toggle('active', b === button)); canvas.dataset.layout = state.layout; setPanels(); updateCropControls(); repaint(); });
$('#grades').addEventListener('click', (event) => { const button = event.target.closest('[data-grade]'); if (!button) return; state.grade = button.dataset.grade; document.querySelectorAll('.grade').forEach((b) => b.classList.toggle('active', b === button)); repaint(); });
panelSelect.addEventListener('change', () => { activePanel = Number(panelSelect.value); updateCropControls(); $('#panelCount').textContent = `${String(activePanel + 1).padStart(2, '0')} / ${String(countPanels()).padStart(2, '0')} PANELS`; });
$('#zoom').addEventListener('input', (e) => setCrop('zoom', e.target.value)); $('#posX').addEventListener('input', (e) => setCrop('x', e.target.value)); $('#posY').addEventListener('input', (e) => setCrop('y', e.target.value));
$('#fillAll').addEventListener('click', () => { const active = state.photos[activePanel % Math.max(1, state.photos.length)] || state.photos[0]; if (!active) { $('#status').textContent = 'Add a photo first.'; return; } state.photos = Array.from({ length: 9 }, () => active); state.crops = Array.from({ length: 9 }, () => ({ ...(state.crops[activePanel] || { zoom: 1, x: 0, y: 0 }) })); repaint(); $('#status').textContent = 'Active photo repeated across every panel.'; });
const dropzone = $('#dropzone'); for (const type of ['dragenter', 'dragover']) dropzone.addEventListener(type, (e) => { e.preventDefault(); dropzone.classList.add('drag'); }); for (const type of ['dragleave', 'drop']) dropzone.addEventListener(type, (e) => { e.preventDefault(); dropzone.classList.remove('drag'); }); dropzone.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
let drag = null; canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, crop: { ...(state.crops[activePanel] || { zoom: 1, x: 0, y: 0 }) } }; canvas.setPointerCapture(e.pointerId); }); canvas.addEventListener('pointermove', (e) => { if (!drag) return; const rect = canvas.getBoundingClientRect(); const crop = state.crops[activePanel] || { zoom: 1, x: 0, y: 0 }; crop.x = Math.max(-1, Math.min(1, drag.crop.x - (e.clientX - drag.x) / rect.width * 2)); crop.y = Math.max(-1, Math.min(1, drag.crop.y - (e.clientY - drag.y) / rect.height * 2)); state.crops[activePanel] = crop; $('#posX').value = crop.x; $('#posY').value = crop.y; repaint(); }); canvas.addEventListener('pointerup', () => { drag = null; }); canvas.style.touchAction = 'none';

$('#size').addEventListener('change', () => { const [w, h] = $('#size').value.split('x').map(Number); fitPreview(w, h); });
$('#export').addEventListener('click', () => { canvas.toBlob((blob) => { if (!blob) { $('#status').textContent = 'PNG export failed. Try again.'; return; } const [w, h] = $('#size').value.split('x'); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `golden-hour-press-${w}x${h}.png`; a.click(); window.__lastExport = url; $('#status').textContent = `PNG saved · ${w} × ${h}`; setTimeout(() => URL.revokeObjectURL(url), 30000); }, 'image/png'); });

setPanels(); updateCropControls();
const params = new URLSearchParams(location.search);
if (params.get('shot')) {
  await runShot(params.get('shot'), params, async (src, title) => { state.photos = [await loadImage(src)]; $('#caption').value = title; if (params.has('layout')) { state.layout = params.get('layout'); document.querySelector(`[data-layout="${state.layout}"]`)?.click(); } repaint(); });
} else {
  state.photos = [await loadImage('./samples/pier.jpg')]; repaint();
}
window.__press = { state, repaint, fitPreview, setPanels, addFiles };
window.__shotReady = true;
