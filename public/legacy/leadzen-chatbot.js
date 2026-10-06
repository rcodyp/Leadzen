(function(){
'use strict';
var SITE_MAP = "Leadzen.ai site map — Platform pillars: Find (Leadzen Platform - Find.html) global company/contact search; Enrich (Leadzen Platform - Enrich.html) verified email + firmographics; Analyze (Leadzen Platform - Analyze.html) pipeline by stage/rep/region, in development; Engage (Leadzen Platform - Engage.html) multi-channel outreach planning. Platform overview: Leadzen Platform.html. Agents: ZEN (Leadzen Agent - ZEN.html) guided prospecting; LENZ (Leadzen Agent - LENZ.html) on-demand prospect analysis; LENZ PLUS (Leadzen Agent - LENZ PLUS.html) turns analysis into an outreach angle + drafted message, user sends it themselves; LENZ PRO (Leadzen Agent - LENZ PRO.html) multi-persona outreach across a whole buying committee, coming in V2 / not live yet. Solutions by region: Americas, EMEA, APAC (Leadzen Solutions - Americas.html / EMEA.html / APAC.html). Industries hub: Leadzen Industries.html (SaaS, HR & Staffing, Manufacturing, Banking & Finance, Wealth Management, Real Estate, Healthcare, Technology & IT Services). Intelligence / positioning page: Leadzen Intelligence.html — Leadzen positions itself as an intelligence company, not just a data company; its intelligence database is refreshed on a quarterly cycle. Company: About Us (Leadzen About Us.html), Careers (Leadzen Careers.html), Investors (Leadzen Investors.html), Contact Us (Leadzen Contact Us.html). Pricing lives on the homepage at Leadzen Homepage.html#pricing. Primary conversion action across the site is 'Connect with an Expert' (Leadzen Connect with an Expert.html), a booking page — there is no self-serve free trial CTA.";
var SYSTEM = "You are the Leadzen.ai website assistant, embedded on every page of the site. Help visitors find the right page and answer quick questions about Leadzen's product (Find/Enrich/Analyze/Engage platform, ZEN/LENZ/LENZ PLUS/LENZ PRO agents, regional solutions, industries, and the fact Leadzen positions itself as an intelligence company). Keep answers short (2-4 sentences), friendly, concrete. When relevant, point to a specific page by name and wrap it as a markdown-free HTML link like <a href=\"PAGE.html\">Page Title</a> using exact filenames from the site map below. If someone wants to talk to sales, book a demo, get pricing specifics, or asks something you can't answer confidently, direct them to <a href=\"Leadzen Connect with an Expert.html\">Connect with an Expert</a>. Never invent features. Site map:\n" + SITE_MAP;

function el(tag, cls, html){ var e = document.createElement(tag); if(cls) e.className = cls; if(html!=null) e.innerHTML = html; return el._ret(e); }
el._ret = function(e){ return e; };

function build(){
  var launch = document.createElement('button');
  launch.id = 'lz-chat-launch'; launch.setAttribute('aria-label','Open Leadzen assistant');
  launch.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5Z" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/><circle cx="9" cy="10.5" r="1" fill="#fff"/><circle cx="12" cy="10.5" r="1" fill="#fff"/><circle cx="15" cy="10.5" r="1" fill="#fff"/></svg>';

  var panel = document.createElement('div');
  panel.id = 'lz-chat-panel';
  panel.innerHTML =
    '<div class="lz-chat-head"><span class="dot"></span><span class="lz-chat-title">Ask Leadzen</span><button class="lz-chat-close" aria-label="Close">&times;</button></div>'+
    '<div class="lz-chat-body" id="lz-chat-body"></div>'+
    '<div class="lz-chat-foot"><input class="lz-chat-input" id="lz-chat-input" type="text" placeholder="Ask about Find, agents, pricing…" /><button class="lz-chat-send" id="lz-chat-send">Send</button></div>';

  document.body.appendChild(launch);
  document.body.appendChild(panel);

  var body = panel.querySelector('#lz-chat-body');
  var input = panel.querySelector('#lz-chat-input');
  var send = panel.querySelector('#lz-chat-send');
  var history = [];
  var busy = false;

  function addMsg(role, html){
    var m = document.createElement('div');
    m.className = 'lz-msg ' + (role==='user' ? 'user' : 'bot');
    m.innerHTML = html;
    body.appendChild(m);
    body.scrollTop = body.scrollHeight;
    return m;
  }

  function greet(){
    if(body.children.length) return;
    addMsg('bot', "Hi! I can help you find the right page — ask me about Find, Enrich, Engage, Analyze, the agents (ZEN, LENZ, LENZ Plus, LENZ Pro), regions, industries, or how to talk to someone on the team.");
  }

  async function ask(text){
    if(busy || !text.trim()) return;
    busy = true; send.disabled = true;
    addMsg('user', text.replace(/</g,'&lt;'));
    history.push({role:'user', content:text});
    var typing = addMsg('bot', '<span class="chat-typing"><span></span><span></span><span></span></span>');
    try{
      var reply = await window.claude.complete({
        system: SYSTEM,
        messages: history.slice(-8)
      });
      typing.innerHTML = reply;
      history.push({role:'assistant', content: reply});
    }catch(err){
      typing.innerHTML = "Sorry, I couldn't reach the assistant just now. Try <a href=\"Leadzen Connect with an Expert.html\">Connect with an Expert</a> and the team can help directly.";
    }
    busy = false; send.disabled = false; body.scrollTop = body.scrollHeight;
  }

  launch.addEventListener('click', function(){
    panel.classList.add('open'); greet(); input.focus();
  });
  panel.querySelector('.lz-chat-close').addEventListener('click', function(){ panel.classList.remove('open'); });
  send.addEventListener('click', function(){ var v = input.value; input.value=''; ask(v); });
  input.addEventListener('keydown', function(e){ if(e.key==='Enter'){ var v = input.value; input.value=''; ask(v); } });
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
else build();
})();
