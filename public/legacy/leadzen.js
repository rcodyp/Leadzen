/* ════════════════════════════════════════════════════════════
   Leadzen.ai homepage — interactions
   ════════════════════════════════════════════════════════════ */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = Object.assign({accent:'#FFD23F', headline1:'', headline2:'', ctaLabel:'', glow:100, network:true, pipelineSpeed:100}, window.LEADZEN_TWEAKS || {});

  /* ─── mobile menu ─── */
  (function(){
    var burger = document.getElementById('hamburger');
    var menu = document.getElementById('mobileMenu');
    if(!burger || !menu) return;
    burger.addEventListener('click', function(){
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); burger.setAttribute('aria-expanded','false'); });
    });
  })();

  /* ─── nav dropdowns / mega ─── */
  (function(){
    var items = Array.prototype.slice.call(document.querySelectorAll('.nav-item.has-mega'));
    if(!items.length) return;

    function closeAll(except){
      items.forEach(function(it){
        if(it === except) return;
        it.classList.remove('open');
        var t = it.querySelector('.nav-trigger');
        if(t) t.setAttribute('aria-expanded','false');
      });
    }

    items.forEach(function(it){
      var trigger = it.querySelector('.nav-trigger');
      if(!trigger) return;
      // click / tap toggles (works on touch where hover doesn't)
      trigger.addEventListener('click', function(e){
        e.preventDefault();
        var willOpen = !it.classList.contains('open');
        closeAll(it);
        it.classList.toggle('open', willOpen);
        trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
      // close after choosing something
      it.querySelectorAll('.mega a').forEach(function(a){
        a.addEventListener('click', function(){ closeAll(null); });
      });
    });

    // outside click closes
    document.addEventListener('click', function(e){
      if(!e.target.closest('.nav-item.has-mega')) closeAll(null);
    });
    // escape closes
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') closeAll(null);
    });

    // Platform mega → jump straight to a tour tab
    document.querySelectorAll('.mega-platform [data-tab]').forEach(function(a){
      a.addEventListener('click', function(){
        var tab = a.getAttribute('data-tab');
        var btn = document.querySelector('.tour-tab[data-tab="'+tab+'"]');
        if(btn) setTimeout(function(){ btn.click(); }, 420);
      });
    });
  })();

  /* ─── scroll reveals + count-up + bars ─── */
  (function(){
    var reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    var counters = Array.prototype.slice.call(document.querySelectorAll('[data-target]'));
    var cmp = document.getElementById('compare');
    var barsDone = false;
    var counted = [];

    function show(el){ if(!el.classList.contains('in')) el.classList.add('in'); }

    function animateCount(el){
      if(counted.indexOf(el) > -1) return; counted.push(el);
      var target = parseFloat(el.getAttribute('data-target'));
      var suffix = el.getAttribute('data-suffix') || '';
      var comma = el.getAttribute('data-comma');
      if(reduce){ el.textContent = (comma?target.toLocaleString('en-US'):target) + suffix; return; }
      var dur = 1500, start = performance.now();
      function frame(now){
        var p = Math.min((now-start)/dur, 1);
        var val = Math.round(target*(1 - Math.pow(1-p,3)));
        el.textContent = (comma ? val.toLocaleString('en-US') : val) + suffix;
        if(p<1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    function fillBars(){ if(cmp) cmp.querySelectorAll('.bar-fill').forEach(function(b){ b.style.width = b.getAttribute('data-w') + '%'; }); }

    function inView(el, frac){
      var vh = window.innerHeight || document.documentElement.clientHeight || 0;
      if(!vh) return true;
      var r = el.getBoundingClientRect();
      return r.top < vh*(frac||0.9) && r.bottom > 0;
    }
    function tick(){
      for(var i=0;i<reveals.length;i++){ if(inView(reveals[i],0.92)) show(reveals[i]); }
      for(var j=0;j<counters.length;j++){ if(inView(counters[j],0.85)) animateCount(counters[j]); }
      if(!barsDone && cmp && inView(cmp,0.8)){ barsDone = true; fillBars(); }
    }

    if(reduce){
      reveals.forEach(show); counters.forEach(animateCount); fillBars();
    } else {
      document.documentElement.classList.add('js-reveal');
      window.addEventListener('scroll', tick, {passive:true});
      window.addEventListener('resize', tick);
      window.addEventListener('load', tick);
      document.addEventListener('visibilitychange', function(){ if(!document.hidden) tick(); });
      tick(); requestAnimationFrame(tick);
      [120,400,900,1800].forEach(function(t){ setTimeout(tick, t); });
      setTimeout(function(){ reveals.forEach(show); counters.forEach(animateCount); if(!barsDone){ barsDone=true; fillBars(); } }, 2600);
    }
  })();

  /* ─── hero prospect network (canvas) ─── */
  (function(){
    var canvas = document.getElementById('heroNet');
    var hero = document.querySelector('.hero');
    if(!canvas || !hero) return;
    var ctx = canvas.getContext('2d');
    var PALETTE = ['#8B5CF6','#8B5CF6','#A78BFA','#22D3EE','#FFD23F'];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W=0,H=0,nodes=[],ripples=[],mouse={x:0,y:0,on:false},pingTimer=0,raf=null;
    var LINK=132, MOUSE_R=196;

    function rgba(hex,a){ var n=parseInt(hex.slice(1),16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
    function rand(a,b){ return a+Math.random()*(b-a); }

    function build(){
      var r = hero.getBoundingClientRect(); W=r.width; H=r.height;
      canvas.width=W*dpr; canvas.height=H*dpr; canvas.style.width=W+'px'; canvas.style.height=H+'px';
      ctx.setTransform(dpr,0,0,dpr,0,0);
      var count = Math.max(28, Math.min(72, Math.round(W/22)));
      nodes=[];
      for(var i=0;i<count;i++) nodes.push({x:rand(0,W),y:rand(0,H),vx:rand(-0.16,0.16),vy:rand(-0.16,0.16),r:rand(1.2,2.7),c:PALETTE[(Math.random()*PALETTE.length)|0],ping:0});
    }
    function frame(){
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<nodes.length;i++){
        var a=nodes[i]; a.x+=a.vx; a.y+=a.vy;
        if(a.x<-20)a.x=W+20; else if(a.x>W+20)a.x=-20;
        if(a.y<-20)a.y=H+20; else if(a.y>H+20)a.y=-20;
        for(var j=i+1;j<nodes.length;j++){
          var b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy);
          if(d<LINK){ ctx.strokeStyle=rgba('#8B5CF6',(1-d/LINK)*0.16); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); }
        }
      }
      if(mouse.on){
        for(var k=0;k<nodes.length;k++){
          var p=nodes[k],mdx=mouse.x-p.x,mdy=mouse.y-p.y,md=Math.sqrt(mdx*mdx+mdy*mdy);
          if(md<MOUSE_R){ var t=1-md/MOUSE_R; ctx.strokeStyle=rgba(p.c,t*0.5); ctx.lineWidth=1.1; ctx.beginPath(); ctx.moveTo(mouse.x,mouse.y); ctx.lineTo(p.x,p.y); ctx.stroke(); p.vx+=mdx/(md||1)*0.006*t; p.vy+=mdy/(md||1)*0.006*t; }
          p.vx*=0.992; p.vy*=0.992;
        }
        ctx.fillStyle=rgba('#FFD23F',0.9); ctx.beginPath(); ctx.arc(mouse.x,mouse.y,3,0,6.283); ctx.fill();
        ctx.strokeStyle=rgba('#FFD23F',0.4); ctx.lineWidth=1; ctx.beginPath(); ctx.arc(mouse.x,mouse.y,9,0,6.283); ctx.stroke();
      }
      pingTimer--; if(pingTimer<=0){ nodes.length && (nodes[(Math.random()*nodes.length)|0].ping=1); pingTimer=90+(Math.random()*60|0); }
      for(var n=0;n<nodes.length;n++){
        var nd=nodes[n],grow=0;
        if(mouse.on){ var gx=mouse.x-nd.x,gy=mouse.y-nd.y,gd=Math.sqrt(gx*gx+gy*gy); if(gd<MOUSE_R) grow=(1-gd/MOUSE_R)*2.4; }
        ctx.fillStyle=rgba(nd.c,0.85); ctx.beginPath(); ctx.arc(nd.x,nd.y,nd.r+grow,0,6.283); ctx.fill();
        if(nd.ping>0){
          ctx.strokeStyle=rgba('#FFD23F',nd.ping*0.8); ctx.lineWidth=1.5; ctx.beginPath(); ctx.arc(nd.x,nd.y,(1-nd.ping)*16+3,0,6.283); ctx.stroke();
          ctx.fillStyle=rgba('#FFD23F',nd.ping); ctx.beginPath(); ctx.arc(nd.x,nd.y,nd.r+1,0,6.283); ctx.fill();
          nd.ping-=0.018; if(nd.ping<0)nd.ping=0;
        }
      }
      for(var ri=ripples.length-1;ri>=0;ri--){ var rp=ripples[ri]; rp.t+=0.02; ctx.strokeStyle=rgba('#FFD23F',(1-rp.t)*0.5); ctx.lineWidth=1.4; ctx.beginPath(); ctx.arc(rp.x,rp.y,rp.t*70,0,6.283); ctx.stroke(); if(rp.t>=1) ripples.splice(ri,1); }
      raf=requestAnimationFrame(frame);
    }
    function staticFrame(){
      ctx.clearRect(0,0,W,H);
      for(var i=0;i<nodes.length;i++){ var a=nodes[i];
        for(var j=i+1;j<nodes.length;j++){ var b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.sqrt(dx*dx+dy*dy); if(d<LINK){ ctx.strokeStyle=rgba('#8B5CF6',(1-d/LINK)*0.16); ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke(); } }
        ctx.fillStyle=rgba(a.c,0.8); ctx.beginPath(); ctx.arc(a.x,a.y,a.r,0,6.283); ctx.fill();
      }
    }
    function rectXY(e){ var r=canvas.getBoundingClientRect(); return {x:e.clientX-r.left,y:e.clientY-r.top}; }

    var enabled = (typeof T.network !== 'undefined') ? !!T.network : true;
    function start(){ build(); if(reduce || !enabled){ staticFrame(); return; } if(!raf) raf=requestAnimationFrame(frame); }
    function stop(){ if(raf){ cancelAnimationFrame(raf); raf=null; } }

    if(!reduce){
      hero.addEventListener('mousemove', function(e){ var p=rectXY(e); mouse.x=p.x; mouse.y=p.y; mouse.on=true; });
      hero.addEventListener('mouseleave', function(){ mouse.on=false; });
      hero.addEventListener('click', function(e){ var p=rectXY(e); ripples.push({x:p.x,y:p.y,t:0}); });
      document.addEventListener('visibilitychange', function(){ if(document.hidden) stop(); else if(enabled) raf = raf || requestAnimationFrame(frame); });
    }
    var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt=setTimeout(function(){ stop(); start(); }, 180); });
    window.__heroNet = { set:function(on){ enabled=on; canvas.style.display=on?'':'none'; if(on) start(); else stop(); } };
    start();
  })();

  /* ─── pipeline animation ─── */
  (function(){
    var pipe = document.getElementById('pipeline');
    var track = document.getElementById('pipeTrack');
    var stagesEl = document.getElementById('pipeStages');
    if(!pipe || !track || !stagesEl) return;
    var stages = Array.prototype.slice.call(stagesEl.querySelectorAll('.pipe-stage'));
    var COLORS = ['#8B5CF6','#22D3EE','#6EE7B7','#FFD23F','#F87171'];
    var counts = stages.map(function(s){ return parseInt((s.querySelector('.pipe-count').getAttribute('data-seed')||'0'),10); });
    var countEls = stages.map(function(s){ return s.querySelector('.pipe-count'); });
    var icoEls = stages.map(function(s){ return s.querySelector('.pipe-ico'); });
    var fracs = [], tokens = [], raf=null, lastT=0, spawnAcc=0, started=false;
    var speedMult = (typeof T.pipelineSpeed === 'number' ? T.pipelineSpeed : 100)/100;

    function measure(){
      var tr = track.getBoundingClientRect();
      fracs = icoEls.map(function(ic){ var r=ic.getBoundingClientRect(); return Math.max(0,Math.min(1,(r.left+r.width/2 - tr.left)/tr.width)); });
    }
    function weightedMax(){ var r=Math.random(); if(r<0.08) return 0; if(r<0.20) return 1; if(r<0.34) return 2; if(r<0.52) return 3; return 4; }
    function spawn(){
      if(tokens.length>16) return;
      var maxStage = weightedMax();
      var el = document.createElement('div'); el.className='pipe-token';
      var c = COLORS[maxStage]; el.style.color=c; el.style.background=c; el.style.left='0%';
      track.appendChild(el);
      tokens.push({el:el, x:0, max:maxStage, passed:-1, speed:(0.00022+Math.random()*0.00006)*speedMult, fading:false, alpha:1});
    }
    function bump(i){
      counts[i]++; countEls[i].textContent = counts[i].toLocaleString('en-US');
      var ic = icoEls[i]; ic.classList.remove('pulse'); void ic.offsetWidth; ic.classList.add('pulse');
    }
    function loop(now){
      var dt = Math.min(now-lastT, 50); lastT=now;
      spawnAcc += dt;
      var interval = 620/speedMult;
      if(spawnAcc >= interval){ spawnAcc=0; spawn(); }
      for(var i=tokens.length-1;i>=0;i--){
        var t=tokens[i];
        if(!t.fading){
          t.x += t.speed*dt;
          for(var s=t.passed+1;s<fracs.length;s++){ if(t.x>=fracs[s]){ t.passed=s; if(s<=t.max) bump(s); if(s===t.max && s<4){ t.fading=true; } } }
          t.el.style.left=(t.x*100).toFixed(2)+'%';
          if(t.x>=1){ t.el.remove(); tokens.splice(i,1); }
        } else {
          t.alpha -= 0.04; t.el.style.opacity=t.alpha; t.el.style.transform='translate(-50%,-50%) scale('+(1+(1-t.alpha))+')';
          if(t.alpha<=0){ t.el.remove(); tokens.splice(i,1); }
        }
      }
      raf=requestAnimationFrame(loop);
    }
    function start(){ if(reduce || started) return; started=true; measure(); lastT=performance.now(); raf=requestAnimationFrame(loop); }
    function stop(){ if(raf){ cancelAnimationFrame(raf); raf=null; } started=false; tokens.forEach(function(t){ t.el.remove(); }); tokens=[]; }

    window.__pipeline = { setSpeed:function(v){ speedMult=v/100; } };

    if(reduce){ return; }
    /* start when scrolled into view */
    function check(){
      var r = pipe.getBoundingClientRect(); var vh=window.innerHeight||0;
      if(r.top < vh*0.8 && r.bottom > 0){ start(); window.removeEventListener('scroll', check); }
    }
    window.addEventListener('scroll', check, {passive:true});
    window.addEventListener('resize', function(){ if(started) measure(); });
    document.addEventListener('visibilitychange', function(){ if(document.hidden) stop(); });
    setTimeout(check, 300);
  })();

  /* ─── platform tour tabs ─── */
  (function(){
    var tabsWrap = document.getElementById('tourTabs');
    if(!tabsWrap) return;
    var tabs = Array.prototype.slice.call(tabsWrap.querySelectorAll('.tour-tab'));
    var panels = Array.prototype.slice.call(document.querySelectorAll('.tour-panel'));
    var url = document.getElementById('tourUrl');
    var URLS = { find:'app.leadzen.ai/search', enrich:'app.leadzen.ai/contact', engage:'app.leadzen.ai/sequences', analyze:'app.leadzen.ai/analytics' };
    function activate(name){
      tabs.forEach(function(t){ var on=t.getAttribute('data-tab')===name; t.classList.toggle('active',on); t.setAttribute('aria-selected', on?'true':'false'); });
      panels.forEach(function(p){ p.classList.toggle('active', p.getAttribute('data-panel')===name); });
      if(url && URLS[name]) url.textContent = URLS[name];
      if(name==='analyze'){ /* re-trigger bar grow */
        var bars = document.querySelectorAll('.snip-bar');
        bars.forEach(function(b){ var h=b.style.getPropertyValue('--h'); b.style.setProperty('--h','0%'); void b.offsetWidth; requestAnimationFrame(function(){ b.style.setProperty('--h',h); }); });
      }
    }
    tabs.forEach(function(t){ t.addEventListener('click', function(){ activate(t.getAttribute('data-tab')); }); });
  })();

  /* ─── find-tab filter chips ─── */
  (function(){
    var wrap = document.getElementById('snipFilters');
    var countEl = document.getElementById('snipCount');
    if(!wrap || !countEl) return;
    var chips = Array.prototype.slice.call(wrap.querySelectorAll('.snip-chip'));
    var COUNTS = [8420,4610,2140,1180,680,410];
    function update(){
      var active = chips.filter(function(c){ return c.classList.contains('active'); }).length;
      var target = COUNTS[Math.min(active, COUNTS.length-1)];
      var start = parseInt(countEl.textContent.replace(/[^0-9]/g,''),10) || target;
      if(reduce){ countEl.textContent = target.toLocaleString('en-US'); return; }
      var t0=performance.now(), dur=420;
      function fr(now){ var p=Math.min((now-t0)/dur,1); var v=Math.round(start+(target-start)*(1-Math.pow(1-p,3))); countEl.textContent=v.toLocaleString('en-US'); if(p<1) requestAnimationFrame(fr); }
      requestAnimationFrame(fr);
    }
    chips.forEach(function(c){ c.addEventListener('click', function(){ c.classList.toggle('active'); update(); }); });
  })();

  /* ─── feature card expand ─── */
  (function(){
    var cards = Array.prototype.slice.call(document.querySelectorAll('.feat-card'));
    cards.forEach(function(card){
      function toggle(){ card.classList.toggle('open'); var ex=card.querySelector('.feat-expand'); if(ex) ex.textContent = card.classList.contains('open') ? 'Close −' : 'Details +'; }
      card.addEventListener('click', toggle);
      card.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); toggle(); } });
    });
  })();

  /* ─── Tweaks panel ─── */
  (function(){
    var state = Object.assign({}, T);
    var root = document.documentElement;
    var hl1 = document.getElementById('hl1');
    var hl2 = document.getElementById('hl2');
    var cta = document.getElementById('heroCta');

    var ACCENTS = [
      {name:'Yellow', val:'#FFD23F', gold:'#F5B913'},
      {name:'Amber',  val:'#FBBF24', gold:'#D97706'},
      {name:'Teal',   val:'#22D3EE', gold:'#0E91A8'},
      {name:'Mint',   val:'#6EE7B7', gold:'#34B88A'},
      {name:'Violet', val:'#A78BFA', gold:'#8B5CF6'}
    ];
    function goldFor(v){ for(var i=0;i<ACCENTS.length;i++){ if(ACCENTS[i].val.toLowerCase()===v.toLowerCase()) return ACCENTS[i].gold; } return v; }

    function apply(t){
      root.style.setProperty('--yellow', t.accent);
      root.style.setProperty('--gold', goldFor(t.accent));
      root.style.setProperty('--yellow-soft', 'color-mix(in srgb, '+t.accent+' 14%, transparent)');
      if(hl1) hl1.textContent = t.headline1;
      if(hl2) hl2.textContent = t.headline2;
      if(cta) cta.textContent = t.ctaLabel;
      root.style.setProperty('--glow', (t.glow/100).toFixed(2));
      window.__tweakNetwork = !!t.network;
      if(window.__heroNet) window.__heroNet.set(!!t.network);
      if(window.__pipeline && typeof t.pipelineSpeed==='number') window.__pipeline.setSpeed(t.pipelineSpeed);
    }
    apply(state);

    function persist(edits){ try{ window.parent.postMessage({type:'__edit_mode_set_keys', edits:edits}, '*'); }catch(e){} }
    function set(key,value){ state[key]=value; apply(state); var o={}; o[key]=value; persist(o); }

    var panel = document.createElement('div');
    panel.id='tweaks-panel'; panel.setAttribute('aria-label','Tweaks');
    panel.innerHTML =
      '<div class="tw-head"><div class="tw-title"><span class="live-dot"></span>Tweaks</div><button class="tw-close" aria-label="Close tweaks">&times;</button></div>'+
      '<div class="tw-body">'+
        '<div class="tw-sec"><div class="tw-sec-label">Contrast accent</div><div class="tw-swatches" id="tw-acc"></div></div>'+
        '<div class="tw-sec"><div class="tw-sec-label">Hero copy</div>'+
          '<div class="tw-field"><label class="tw-flabel">Headline · line 1</label><input class="tw-input" id="tw-h1" type="text"/></div>'+
          '<div class="tw-field"><label class="tw-flabel">Headline · line 2</label><input class="tw-input" id="tw-h2" type="text"/></div>'+
          '<div class="tw-field"><label class="tw-flabel">Primary CTA label</label><input class="tw-input" id="tw-cta" type="text"/></div></div>'+
        '<div class="tw-sec"><div class="tw-sec-label">Motion</div>'+
          '<div class="tw-field"><label class="tw-flabel">Pipeline speed <b id="tw-ps-v"></b></label><input class="tw-range" id="tw-ps" type="range" min="40" max="180" step="10"/></div>'+
          '<div class="tw-field"><label class="tw-flabel">Ambient glow <b id="tw-glow-v"></b></label><input class="tw-range" id="tw-glow" type="range" min="0" max="140" step="5"/></div>'+
          '<div class="tw-field"><div class="tw-toggle" id="tw-net"><span>Prospect network</span><span class="tw-knob"></span></div></div></div>'+
      '</div>';
    document.body.appendChild(panel);

    var accWrap = panel.querySelector('#tw-acc');
    ACCENTS.forEach(function(a){
      var sw=document.createElement('button'); sw.className='tw-sw'; sw.style.background=a.val; sw.title=a.name; sw.setAttribute('aria-label',a.name);
      if(a.val.toLowerCase()===(state.accent||'').toLowerCase()) sw.classList.add('active');
      sw.addEventListener('click', function(){ accWrap.querySelectorAll('.tw-sw').forEach(function(s){s.classList.remove('active');}); sw.classList.add('active'); set('accent', a.val); });
      accWrap.appendChild(sw);
    });
    var h1i=panel.querySelector('#tw-h1'); h1i.value=state.headline1||''; h1i.addEventListener('input', function(){ set('headline1',h1i.value); });
    var h2i=panel.querySelector('#tw-h2'); h2i.value=state.headline2||''; h2i.addEventListener('input', function(){ set('headline2',h2i.value); });
    var ctai=panel.querySelector('#tw-cta'); ctai.value=state.ctaLabel||''; ctai.addEventListener('input', function(){ set('ctaLabel',ctai.value); });

    var ps=panel.querySelector('#tw-ps'), psV=panel.querySelector('#tw-ps-v');
    ps.value=state.pipelineSpeed||100; psV.textContent=ps.value+'%';
    ps.addEventListener('input', function(){ psV.textContent=ps.value+'%'; set('pipelineSpeed', parseInt(ps.value,10)); });

    var glow=panel.querySelector('#tw-glow'), glowV=panel.querySelector('#tw-glow-v');
    glow.value=state.glow!=null?state.glow:100; glowV.textContent=glow.value+'%';
    glow.addEventListener('input', function(){ glowV.textContent=glow.value+'%'; set('glow', parseInt(glow.value,10)); });

    var netT=panel.querySelector('#tw-net');
    if(state.network) netT.classList.add('on');
    netT.addEventListener('click', function(){ var on=!netT.classList.contains('on'); netT.classList.toggle('on',on); set('network',on); });

    panel.querySelector('.tw-close').addEventListener('click', function(){ panel.classList.remove('open'); try{ window.parent.postMessage({type:'__edit_mode_dismissed'},'*'); }catch(e){} });

    window.addEventListener('message', function(e){
      var d=e.data||{};
      if(d.type==='__activate_edit_mode') panel.classList.add('open');
      else if(d.type==='__deactivate_edit_mode') panel.classList.remove('open');
    });
    try{ window.parent.postMessage({type:'__edit_mode_available'}, '*'); }catch(e){}
  })();

})();
