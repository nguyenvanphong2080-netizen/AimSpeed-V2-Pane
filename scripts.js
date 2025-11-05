/* script.js
 - Điều khiển toggle, swipe, âm thanh, log, slider
 - Không can thiệp game — UI mô phỏng
*/

(() => {
  // Elements
  const logEl = document.getElementById('log');
  const fnCards = Array.from(document.querySelectorAll('.card.fn'));
  const enableAllBtn = document.getElementById('enableAll');
  const disableAllBtn = document.getElementById('disableAll');
  const toggleSwipeModeBtn = document.getElementById('toggleSwipeMode');

  const speed = document.getElementById('speed');
  const sens = document.getElementById('sensitivity');
  const buffScreen = document.getElementById('buffScreen');
  const speedVal = document.getElementById('speedVal');
  const sensVal = document.getElementById('sensVal');
  const buffScreenVal = document.getElementById('buffScreenVal');

  // audio
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audioCtx = new AudioCtx();
  function clickSound(on=true){
    try {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = on ? 'sawtooth' : 'sine';
      o.frequency.setValueAtTime(on ? 900 : 420, audioCtx.currentTime);
      g.gain.setValueAtTime(on ? 0.06 : 0.04, audioCtx.currentTime);
      o.connect(g); g.connect(audioCtx.destination);
      o.start(); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.09);
      o.stop(audioCtx.currentTime + 0.11);
    } catch(e){ console.warn('audio blocked', e); }
  }

  // utils
  function appendLog(msg){
    const p = document.createElement('div');
    p.textContent = `${new Date().toLocaleTimeString()} — ${msg}`;
    logEl.prepend(p);
    while(logEl.childElementCount > 80) logEl.removeChild(logEl.lastChild);
  }

  // toggle function
  function setActive(card, active){
    if(active){
      card.classList.add('active');
      card.querySelector('.toggle').textContent = 'ON';
      card.querySelector('.toggle').classList.remove('off');
    } else {
      card.classList.remove('active');
      card.querySelector('.toggle').textContent = 'OFF';
      card.querySelector('.toggle').classList.add('off');
    }
  }

  // init toggles
  fnCards.forEach(card => {
    const btn = card.querySelector('.toggle');
    setActive(card, false);

    btn.addEventListener('click', () => {
      // resume audio on first user action
      if(audioCtx.state === 'suspended') audioCtx.resume();
      const isActive = card.classList.contains('active');
      setActive(card, !isActive);
      clickSound(!isActive);
      appendLog(`${card.dataset.key} → ${!isActive ? 'ON' : 'OFF'}`);
    });

    // swipe handling (touch + mouse)
    let startX = 0, moved=false;
    function touchStart(e){
      moved=false;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
    }
    function touchMove(e){
      moved = true;
    }
    function touchEnd(e){
      if(!moved) return;
      const endX = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
      const dx = endX - startX;
      if(Math.abs(dx) > 30){
        // right swipe -> toggle on, left swipe -> toggle off (you can reverse)
        const action = dx > 0;
        setActive(card, action);
        clickSound(action);
        appendLog(`${card.dataset.key} → ${action ? 'ON (swipe)' : 'OFF (swipe)'}`);
      }
    }
    // touch listeners
    card.addEventListener('touchstart', touchStart);
    card.addEventListener('touchmove', touchMove);
    card.addEventListener('touchend', touchEnd);
    // mouse (drag) support
    card.addEventListener('mousedown', (e)=> startX = e.clientX);
    card.addEventListener('mouseup', (e)=> {
      const dx = e.clientX - startX;
      if(Math.abs(dx) > 60){
        const action = dx > 0;
        setActive(card, action);
        clickSound(action);
        appendLog(`${card.dataset.key} → ${action ? 'ON (drag)' : 'OFF (drag)'}`);
      }
    });
  });

  // bulk
  enableAllBtn.addEventListener('click', ()=> {
    fnCards.forEach(c => setActive(c, true));
    clickSound(true);
    appendLog('Bật tất cả chức năng');
  });
  disableAllBtn.addEventListener('click', ()=> {
    fnCards.forEach(c => setActive(c, false));
    clickSound(false);
    appendLog('Tắt tất cả chức năng');
  });

  // toggle swipe-mode: adds a small visual hint
  let swipeMode = true;
  toggleSwipeModeBtn.addEventListener('click', ()=>{
    swipeMode = !swipeMode;
    toggleSwipeModeBtn.textContent = swipeMode ? 'Tắt chế độ vuốt' : 'Bật chế độ vuốt';
    appendLog(`Chế độ vuốt: ${swipeMode ? 'ON' : 'OFF'}`);
    fnCards.forEach(c => c.querySelector('.swipe-hint').style.opacity = swipeMode ? 1 : 0.25);
  });

  // sliders events
  speed.addEventListener('input', ()=> { speedVal.textContent = speed.value; appendLog(`Speed set ${speed.value}`); });
  sens.addEventListener('input', ()=> { sensVal.textContent = sens.value; appendLog(`Sensitivity set ${sens.value}`); });
  buffScreen.addEventListener('input', ()=> { buffScreenVal.textContent = buffScreen.value; appendLog(`BUFF MÀN set ${buffScreen.value}`); });

  // Try resume audio on first gesture
  window.addEventListener('click', ()=> { if(audioCtx.state === 'suspended') audioCtx.resume(); }, {once:true});

  // ------------------ background 3D particle effect ------------------
  const canvas = document.getElementById('bg');
  const ctx = canvas.getContext('2d');
  let W, H, particles=[];
  function resize(){ W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  window.addEventListener('resize', resize);
  resize();

  class Part {
    constructor(){ this.reset(); }
    reset(){
      this.x = Math.random()*W; this.y = Math.random()*H;
      this.vx = (Math.random()-0.5)*0.6; this.vy = (Math.random()-0.5)*0.6;
      this.r = 2 + Math.random()*12; this.life = 40 + Math.random()*200; this.age=0;
      this.h = 15 + Math.random()*40;
    }
    step(){
      this.x += this.vx; this.y += this.vy; this.age++;
      if(this.x<-50||this.x>W+50||this.y<-50||this.y>H+50||this.age>this.life) this.reset();
    }
    draw(){
      const g = ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,this.r*2.2);
      g.addColorStop(0, `hsla(${this.h},100%,60%,0.9)`);
      g.addColorStop(0.3, `hsla(${this.h+15},100%,50%,0.4)`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(this.x,this.y,this.r,0,Math.PI*2); ctx.fill();
    }
  }
  function init(n=Math.max(40, Math.floor((W*H)/90000))){ particles=[]; for(let i=0;i<n;i++) particles.push(new Part()); }
  init();
  function drawBg(){
    // bg gradient
    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0, '#07060a'); g.addColorStop(1, '#0b0710');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
    // glow
    const rg = ctx.createRadialGradient(W*0.15,H*0.15,0,W*0.15,H*0.15,Math.max(W,H));
    rg.addColorStop(0, 'rgba(255,110,40,0.06)'); rg.addColorStop(0.6, 'rgba(0,0,0,0)');
    ctx.fillStyle = rg; ctx.fillRect(0,0,W,H);
    // particles
    particles.forEach(p => { p.step(); p.draw(); });
    requestAnimationFrame(drawBg);
  }
  drawBg();

  appendLog('Interface loaded — sẵn sàng sử dụng.');
})();