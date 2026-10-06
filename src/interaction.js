const LEGACY_ROOT = '/legacy/';

export function legacyAssetUrl(value) {
  if (!value || value.startsWith('#') || /^(?:[a-z]+:|\/\/)/i.test(value)) return value;
  return `${LEGACY_ROOT}${value.split('/').map(encodeURIComponent).join('/')}`;
}

export function activatePageScripts(container) {
  [...container.querySelectorAll('script')].forEach((oldScript) => {
    const script = document.createElement('script');
    [...oldScript.attributes].forEach((attribute) => script.setAttribute(attribute.name, attribute.value));
    if (script.src) script.src = legacyAssetUrl(oldScript.getAttribute('src'));
    else script.textContent = oldScript.textContent;
    oldScript.replaceWith(script);
  });
}

export function keepLeadzenLinksLocal(container) {
  container.querySelectorAll('a[href]').forEach((anchor) => {
    const href = anchor.getAttribute('href');
    if (!href || !/^https?:\/\/(?:www\.)?leadzen\.ai(?:\/|$)/i.test(href)) return;
    const url = new URL(href);
    const path = url.pathname.replace(/\/$/, '');
    const destination = path === '/blog'
      ? 'Leadzen About Resources.html'
      : path === '/pricing' || path === '/signup'
        ? 'Leadzen Homepage.html#pricing'
        : 'Leadzen Homepage.html';
    anchor.setAttribute('href', destination);
    anchor.removeAttribute('target');
    anchor.removeAttribute('rel');
  });
}

export function activatePageHead(documentText, key) {
  const source = new DOMParser().parseFromString(documentText, 'text/html');
  document.title = source.title || 'Leadzen.ai';
  const injected = [];
  source.head.querySelectorAll('link[rel="stylesheet"], style').forEach((node, index) => {
    const clone = node.cloneNode(true);
    clone.dataset.reactLegacyHead = `${key}-${index}`;
    if (clone.tagName === 'LINK') clone.href = legacyAssetUrl(node.getAttribute('href'));
    document.head.appendChild(clone);
    injected.push(clone);
  });
  return injected;
}
