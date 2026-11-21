// Small deterministic scene helper used only by the local screenshot workflow.
export async function runShot(shot, query, load) {
  if (shot === 'cover') { document.body.classList.add('shot-cover'); const size = query.get('size'); if (size === 'portrait') document.body.classList.add('shot-portrait'); if (size === 'square') document.body.classList.add('shot-square'); }
  const photo = query.get('photo') === 'boulevard' ? 'boulevard' : 'pier';
  await load(`./samples/${photo}.jpg`, query.get('caption') || 'SUNSET HEIST');
  if (query.get('layout')) document.querySelector(`[data-layout="${query.get('layout')}"]`)?.click();
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
