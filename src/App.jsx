import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { activatePageHead, activatePageScripts, keepLeadzenLinksLocal, legacyAssetUrl } from './interaction.js';

const pageFiles = [
  'Leadzen Homepage.html', 'Leadzen Homepage (standalone).html', 'Leadzen Homepage v1.html', 'Leadzen About Us.html', 'Leadzen Platform.html', 'Leadzen Platform - Find.html', 'Leadzen Platform - Enrich.html', 'Leadzen Platform - Analyze.html', 'Leadzen Platform - Engage.html', 'Leadzen Find (standalone).html', 'Leadzen Enrich (standalone).html', 'Leadzen Analyze (standalone).html', 'Leadzen Engage (standalone).html', 'Leadzen Platform (standalone).html', 'Leadzen Agent - ZEN.html', 'Leadzen Agent - LENZ.html', 'Leadzen Agent - LENZ PLUS.html', 'Leadzen Agent - LENZ PRO.html', 'Leadzen Agent ZEN (standalone).html', 'Leadzen Agent LENZ (standalone).html', 'Leadzen Agent LENZ PRO (standalone).html', 'Leadzen Solutions - Americas.html', 'Leadzen Solutions - EMEA.html', 'Leadzen Solutions - APAC.html', 'Leadzen Industries.html', 'Leadzen Intelligence.html', 'Leadzen Connect with an Expert.html', 'Leadzen Contact Us.html', 'Leadzen Careers.html', 'Leadzen Investors.html', 'Leadzen Newsroom.html', 'Leadzen Press Release.html', 'Leadzen Case Study.html', 'Leadzen Success Story.html', 'Leadzen About Resources.html', 'Leadzen Archives.html', 'Leadzen Guides.html', 'Leadzen Explore Our Data Lists.html', 'Leadzen Lead Scoring.html', 'Leadzen Outreach For Leads.html', 'Leadzen ROI Calculator.html', 'Leadzen Email Signature.html', 'Leadzen Privacy Policy.html', 'Leadzen Cookie Policy.html', 'Leadzen Terms And Conditions.html', 'Leadzen Dont Sell My Info.html', 'Leadzen Layout Blueprint.html', 'Invest India Carousel.html', 'Invest India Carousel-print-muhdjq.html', 'Janjatiya Pride - Design Sample.html', 'Janjatiya Pride - Design Sample-print-g0s0ne.html', 'MoTA Deck - Templates.html'
];

const slugFor = (file) => `/${file.replace(/\.html$/i, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
const fileByRoute = new Map(pageFiles.map((file) => [slugFor(file), file]));
fileByRoute.set('/', 'Leadzen Homepage.html');

const canonicalSource = new Map([
  ['Leadzen Homepage (standalone).html', 'Leadzen Homepage.html'],
  ['Leadzen Find (standalone).html', 'Leadzen Platform - Find.html'],
  ['Leadzen Enrich (standalone).html', 'Leadzen Platform - Enrich.html'],
  ['Leadzen Analyze (standalone).html', 'Leadzen Platform - Analyze.html'],
  ['Leadzen Engage (standalone).html', 'Leadzen Platform - Engage.html'],
  ['Leadzen Platform (standalone).html', 'Leadzen Platform.html'],
  ['Leadzen Agent ZEN (standalone).html', 'Leadzen Agent - ZEN.html'],
  ['Leadzen Agent LENZ (standalone).html', 'Leadzen Agent - LENZ.html'],
  ['Leadzen Agent LENZ PRO (standalone).html', 'Leadzen Agent - LENZ PRO.html']
]);

function currentLocation() {
  const path = decodeURIComponent(window.location.pathname).replace(/\/+$/, '') || '/';
  return { path: fileByRoute.has(path) ? path : '/', hash: window.location.hash };
}

export default function App() {
  const mount = useRef(null);
  const [location, setLocation] = useState(currentLocation);
  const [documentText, setDocumentText] = useState('');
  const [homeHeader, setHomeHeader] = useState(null);
  const selectedFile = useMemo(() => fileByRoute.get(location.path) || fileByRoute.get('/'), [location.path]);
  const sourceFile = canonicalSource.get(selectedFile) || selectedFile;

  const navigate = useCallback((path, hash = '') => {
    const resolved = fileByRoute.has(path) ? path : '/';
    window.history.pushState({}, '', `${resolved}${hash}`);
    setLocation({ path: resolved, hash });
  }, []);

  useEffect(() => {
    const popstate = () => setLocation(currentLocation());
    window.addEventListener('popstate', popstate);
    return () => window.removeEventListener('popstate', popstate);
  }, []);

  useEffect(() => {
    fetch(legacyAssetUrl('Leadzen Homepage.html'))
      .then((response) => response.text())
      .then((html) => {
        const source = new DOMParser().parseFromString(html, 'text/html');
        const nav = source.querySelector('nav.nav');
        const mobileMenu = source.querySelector('#mobileMenu');
        if (nav && mobileMenu) setHomeHeader({ nav: nav.outerHTML, mobileMenu: mobileMenu.outerHTML });
      });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(legacyAssetUrl(sourceFile))
      .then((response) => response.ok ? response.text() : Promise.reject(new Error(`Unable to load ${sourceFile}`)))
      .then((html) => { if (!cancelled) setDocumentText(html); });
    return () => { cancelled = true; };
  }, [sourceFile]);

  const source = useMemo(() => {
    if (!documentText) return null;
    const parsed = new DOMParser().parseFromString(documentText, 'text/html');
    if (homeHeader && sourceFile.startsWith('Leadzen ')) {
      const nav = parsed.querySelector('nav.nav');
      const mobileMenu = parsed.querySelector('#mobileMenu');
      if (nav) nav.outerHTML = homeHeader.nav;
      if (mobileMenu) mobileMenu.outerHTML = homeHeader.mobileMenu;
    }
    return parsed;
  }, [documentText, homeHeader, sourceFile]);

  useLayoutEffect(() => {
    if (!source || !mount.current) return undefined;
    const headNodes = activatePageHead(documentText, selectedFile);
    const root = mount.current;
    root.querySelectorAll('[src]:not(script)').forEach((node) => {
      const value = node.getAttribute('src');
      if (value) node.setAttribute('src', legacyAssetUrl(value));
    });
    root.querySelectorAll('link[href]').forEach((node) => {
      const value = node.getAttribute('href');
      if (value) node.setAttribute('href', legacyAssetUrl(value));
    });
    keepLeadzenLinksLocal(root);
    activatePageScripts(root);
    if (location.hash) requestAnimationFrame(() => root.querySelector(CSS.escape(location.hash))?.scrollIntoView());
    return () => headNodes.forEach((node) => node.remove());
  }, [documentText, location.hash, sourceFile, source]);

  const interceptLinks = useCallback((event) => {
    const anchor = event.target.closest('a[href]');
    if (!anchor || anchor.target === '_blank' || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) return;
    const file = decodeURIComponent(href.split('#')[0].split('/').pop());
    if (!pageFiles.includes(file)) return;
    event.preventDefault();
    navigate(slugFor(file), href.includes('#') ? `#${href.split('#').slice(1).join('#')}` : '');
  }, [navigate]);

  return <main ref={mount} className="legacy-react-page" onClickCapture={interceptLinks} dangerouslySetInnerHTML={{ __html: source?.body.innerHTML || '' }} />;
}
