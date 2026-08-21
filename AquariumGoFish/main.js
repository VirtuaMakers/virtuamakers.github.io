(function () {
  "use strict";

  document.getElementById("year").textContent = new Date().getFullYear();

  var STORE = {
    feedCount: "vmAquariumGoFish_feedCount",
    lastFed: "vmAquariumGoFish_lastFed",
    dayNight: "vmAquariumGoFish_dayNight",
    soundOn: "vmAquariumGoFish_soundOn"
  };

  function loadNum(key, fallback) {
    try {
      var v = parseInt(localStorage.getItem(key), 10);
      return isNaN(v) ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function loadStr(key, fallback) {
    try {
      var v = localStorage.getItem(key);
      return v === null ? fallback : v;
    } catch (e) {
      return fallback;
    }
  }
  function save(key, value) {
    try { localStorage.setItem(key, value); } catch (e) {}
  }

  var state = {
    feedCount: loadNum(STORE.feedCount, 0),
    lastFed: loadNum(STORE.lastFed, 0),
    isNight: loadStr(STORE.dayNight, "day") === "night"
  };

  var canvas = document.getElementById("tank-canvas");
  var ctx = canvas.getContext("2d");
  var frame = canvas.parentElement;
  var width = 0, height = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function resize() {
    var rect = frame.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener("resize", resize);
  resize();

  function rand(min, max) { return min + Math.random() * (max - min); }

  function makeFish(type) {
    var isAngel = type === "angel";
    return {
      type: type,
      x: rand(width * 0.2, width * 0.8),
      y: rand(height * 0.25, height * 0.75),
      restY: rand(height * 0.3, height * 0.7),
      dir: Math.random() < 0.5 ? 1 : -1,
      speed: isAngel ? rand(18, 26) : rand(30, 46),
      size: isAngel ? rand(46, 54) : rand(16, 22),
      wobble: rand(0, Math.PI * 2),
      wobbleSpeed: rand(4, 6),
      hue: isAngel ? null : rand(0, 360),
      targetFood: null,
      turnCooldown: rand(1, 4),
      bobPhase: rand(0, Math.PI * 2)
    };
  }

  var fish = [makeFish("angel"), makeFish("tropical"), makeFish("tropical"), makeFish("tropical")];

  var bubbles = [];
  for (var i = 0; i < 14; i++) {
    bubbles.push({
      x: rand(0, width || 640),
      y: rand(0, height || 480),
      r: rand(1.5, 4),
      speed: rand(12, 26),
      drift: rand(-6, 6)
    });
  }

  var food = [];

  function spawnFood() {
    var count = 5 + Math.floor(Math.random() * 3);
    for (var i = 0; i < count; i++) {
      food.push({
        x: rand(width * 0.2, width * 0.8),
        y: -rand(0, 30),
        vy: rand(14, 22),
        r: rand(2.5, 4),
        settled: false
      });
    }
  }

  var seaweedClusters = [
    { x: 0.08, blades: 5, height: 0.42 },
    { x: 0.5, blades: 4, height: 0.3 },
    { x: 0.92, blades: 3, height: 0.24 }
  ];

  function drawBackground(t) {
    var night = state.isNight;
    var top = night ? "#0a1636" : "#7fd8f2";
    var bottom = night ? "#02142e" : "#0a5a94";
    var grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, top);
    grad.addColorStop(1, bottom);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    if (!night) {
      ctx.save();
      ctx.globalAlpha = 0.10;
      ctx.fillStyle = "#ffffff";
      for (var i = 0; i < 3; i++) {
        var rx = width * (0.15 + i * 0.32) + Math.sin(t * 0.1 + i) * 14;
        ctx.beginPath();
        ctx.moveTo(rx, 0);
        ctx.lineTo(rx + 60, 0);
        ctx.lineTo(rx + 10, height);
        ctx.lineTo(rx - 50, height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else {
      ctx.save();
      ctx.fillStyle = "#cfe3ff";
      var starSeed = 7;
      for (var s = 0; s < 20; s++) {
        var sx = (Math.sin(s * 999) * 0.5 + 0.5) * width;
        var sy = (Math.sin(s * 555 + starSeed) * 0.5 + 0.5) * height * 0.5;
        ctx.globalAlpha = 0.15 + (Math.sin(t * 2 + s) * 0.5 + 0.5) * 0.2;
        ctx.beginPath();
        ctx.arc(sx, sy, 1, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawSand() {
    var sandH = height * 0.08;
    var grad = ctx.createLinearGradient(0, height - sandH, 0, height);
    grad.addColorStop(0, state.isNight ? "#2a2318" : "#d9c08a");
    grad.addColorStop(1, state.isNight ? "#1a1610" : "#b89a5f");
    ctx.fillStyle = grad;
    ctx.fillRect(0, height - sandH, width, sandH);
  }

  function drawSeaweed(t) {
    seaweedClusters.forEach(function (cluster) {
      var baseX = cluster.x * width;
      var h = cluster.height * height;
      for (var b = 0; b < cluster.blades; b++) {
        var offset = (b - cluster.blades / 2) * 8;
        var phase = t * 1.4 + b * 0.7 + cluster.x * 10;
        ctx.beginPath();
        ctx.moveTo(baseX + offset, height * 0.94);
        var segments = 6;
        for (var seg = 1; seg <= segments; seg++) {
          var frac = seg / segments;
          var sway = Math.sin(phase + frac * 2.4) * (10 * frac);
          ctx.lineTo(baseX + offset + sway, height * 0.94 - h * frac);
        }
        ctx.strokeStyle = state.isNight ? "rgba(30,80,50,0.7)" : "rgba(46,125,50,0.85)";
        ctx.lineWidth = 5 - (b % 3);
        ctx.lineCap = "round";
        ctx.stroke();
      }
    });
  }

  function drawCoral() {
    var cx = width * 0.85;
    var cy = height * 0.9;
    var branches = [
      [0, 0, -14, -30, -6, -55],
      [0, 0, 10, -25, 4, -50],
      [0, 0, 26, -18, 30, -40],
      [0, 0, -26, -14, -34, -32]
    ];
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = state.isNight ? "rgba(150,70,40,0.6)" : "#ff7a3d";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    branches.forEach(function (b) {
      ctx.beginPath();
      ctx.moveTo(b[0], b[1]);
      ctx.quadraticCurveTo(b[2], b[3], b[4], b[5]);
      ctx.stroke();
    });
    ctx.fillStyle = state.isNight ? "rgba(140,50,90,0.55)" : "#ff5fa2";
    [[-10, -20, 7], [8, -18, 6], [-2, -34, 5], [20, -28, 5]].forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], p[2], 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawBubble(b) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function updateBubbles(dt) {
    bubbles.forEach(function (b) {
      b.y -= b.speed * dt;
      b.x += Math.sin(b.y * 0.05) * b.drift * dt;
      if (b.y < -10) {
        b.y = height + rand(0, 20);
        b.x = rand(0, width);
      }
      drawBubble(b);
    });
  }

  function drawFood() {
    food.forEach(function (f) {
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fillStyle = "#6b4a2f";
      ctx.fill();
    });
  }

  function updateFood(dt) {
    for (var i = food.length - 1; i >= 0; i--) {
      var f = food[i];
      var floor = height * 0.88;
      if (f.y < floor) {
        f.y += f.vy * dt;
      } else {
        f.y = floor;
      }
    }
  }

  function nearestFood(f) {
    var best = null, bestD = Infinity;
    food.forEach(function (item) {
      var d = Math.hypot(item.x - f.x, item.y - f.y);
      if (d < bestD) { bestD = d; best = item; }
    });
    return best;
  }

  function drawAngelfish(f, t) {
    var bob = Math.sin(t * f.wobbleSpeed * 0.4 + f.bobPhase) * 4;
    ctx.save();
    ctx.translate(f.x, f.y + bob);
    ctx.scale(f.dir, 1);
    var wave = Math.sin(t * f.wobbleSpeed + f.wobble);
    ctx.rotate(wave * 0.03);

    var s = f.size;
    var grad = ctx.createLinearGradient(-s * 0.6, -s, s * 0.6, s);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.45, "#f4f1fb");
    grad.addColorStop(0.75, "#dcd7ef");
    grad.addColorStop(1, "#c9c4e8");

    ctx.beginPath();
    ctx.moveTo(0, -s * 0.95);
    ctx.bezierCurveTo(s * 0.55, -s * 0.6, s * 0.55, s * 0.6, 0, s * 0.95);
    ctx.bezierCurveTo(-s * 0.55, s * 0.6, -s * 0.55, -s * 0.6, 0, -s * 0.95);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(150,140,190,0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    var tailWave = Math.sin(t * f.wobbleSpeed * 1.6 + f.wobble) * s * 0.18;
    ctx.beginPath();
    ctx.moveTo(-s * 0.5, 0);
    ctx.lineTo(-s * 1.05, -s * 0.35 + tailWave);
    ctx.lineTo(-s * 0.85, 0 + tailWave * 0.3);
    ctx.lineTo(-s * 1.05, s * 0.35 + tailWave);
    ctx.closePath();
    ctx.fillStyle = "rgba(220,215,240,0.85)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(s * 0.28, -s * 0.12, s * 0.06, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1a2e";
    ctx.fill();

    ctx.restore();
  }

  function drawTropicalFish(f, t) {
    var bob = Math.sin(t * f.wobbleSpeed * 0.5 + f.bobPhase) * 3;
    ctx.save();
    ctx.translate(f.x, f.y + bob);
    ctx.scale(f.dir, 1);

    var s = f.size;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fillStyle = "hsl(" + f.hue + ", 80%, 58%)";
    ctx.fill();

    var tailWave = Math.sin(t * f.wobbleSpeed * 1.8 + f.wobble) * s * 0.25;
    ctx.beginPath();
    ctx.moveTo(-s * 0.85, 0);
    ctx.lineTo(-s * 1.5, -s * 0.5 + tailWave);
    ctx.lineTo(-s * 1.5, s * 0.5 + tailWave);
    ctx.closePath();
    ctx.fillStyle = "hsl(" + f.hue + ", 80%, 48%)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(s * 0.55, -s * 0.1, s * 0.12, 0, Math.PI * 2);
    ctx.fillStyle = "#12131a";
    ctx.fill();

    ctx.restore();
  }

  function updateFish(dt, t) {
    fish.forEach(function (f) {
      var target = f.targetFood;
      if (!target || food.indexOf(target) === -1) {
        target = nearestFood(f);
        f.targetFood = target;
      }
      var slow = state.isNight ? 0.35 : 1;
      if (target) {
        var dx = target.x - f.x;
        var dy = target.y - f.y;
        var dist = Math.hypot(dx, dy);
        if (dist < 10) {
          food.splice(food.indexOf(target), 1);
          f.targetFood = null;
        } else {
          f.dir = dx >= 0 ? 1 : -1;
          f.x += (dx / dist) * f.speed * slow * dt;
          f.y += (dy / dist) * f.speed * slow * dt;
        }
      } else {
        f.turnCooldown -= dt;
        if (f.turnCooldown <= 0) {
          f.dir = Math.random() < 0.5 ? 1 : -1;
          f.restY = rand(height * 0.2, state.isNight ? height * 0.85 : height * 0.75);
          f.turnCooldown = rand(2, 5);
        }
        f.x += f.dir * f.speed * slow * dt;
        f.y += (f.restY - f.y) * dt * 0.5;
      }

      var margin = f.size * 1.2;
      if (f.x < margin) { f.x = margin; f.dir = 1; }
      if (f.x > width - margin) { f.x = width - margin; f.dir = -1; }
      if (f.y < margin) f.y = margin;
      if (f.y > height - margin * 0.6) f.y = height - margin * 0.6;

      if (f.type === "angel") drawAngelfish(f, t);
      else drawTropicalFish(f, t);
    });
  }

  var lastTime = null;
  function loop(now) {
    if (lastTime === null) lastTime = now;
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    var t = now / 1000;

    ctx.clearRect(0, 0, width, height);
    drawBackground(t);
    drawSeaweed(t);
    drawCoral();
    drawSand();
    updateBubbles(dt);
    drawFood();
    updateFood(dt);
    updateFish(dt, t);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function formatAgo(ms) {
    if (!ms) return "never";
    var diff = Date.now() - ms;
    var mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + " minute" + (mins === 1 ? "" : "s") + " ago";
    var hours = Math.floor(mins / 60);
    if (hours < 24) return hours + " hour" + (hours === 1 ? "" : "s") + " ago";
    var days = Math.floor(hours / 24);
    return days + " day" + (days === 1 ? "" : "s") + " ago";
  }

  var statusEl = document.getElementById("tank-status");
  function updateStatus() {
    statusEl.textContent = "Feedings: " + state.feedCount + " · Last fed: " + formatAgo(state.lastFed);
  }
  updateStatus();
  setInterval(updateStatus, 30000);

  document.getElementById("feed-btn").addEventListener("click", function () {
    spawnFood();
    state.feedCount += 1;
    state.lastFed = Date.now();
    save(STORE.feedCount, state.feedCount);
    save(STORE.lastFed, state.lastFed);
    updateStatus();
  });

  var dayNightBtn = document.getElementById("daynight-btn");
  function applyDayNightLabel() {
    dayNightBtn.textContent = state.isNight ? "☀️ Day" : "🌙 Night";
  }
  applyDayNightLabel();
  dayNightBtn.addEventListener("click", function () {
    state.isNight = !state.isNight;
    save(STORE.dayNight, state.isNight ? "night" : "day");
    applyDayNightLabel();
  });

  var audioCtx = null, ambienceGain = null, soundOn = false;
  function startAmbience() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var bufferSize = audioCtx.sampleRate * 2;
      var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      var data = buffer.getChannelData(0);
      var lastOut = 0;
      for (var i = 0; i < bufferSize; i++) {
        var white = Math.random() * 2 - 1;
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }
      var noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      var filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 700;

      ambienceGain = audioCtx.createGain();
      ambienceGain.gain.value = 0;

      var lfo = audioCtx.createOscillator();
      lfo.frequency.value = 0.15;
      var lfoGain = audioCtx.createGain();
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain);
      lfoGain.connect(ambienceGain.gain);

      noise.connect(filter);
      filter.connect(ambienceGain);
      ambienceGain.connect(audioCtx.destination);

      noise.start();
      lfo.start();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    ambienceGain.gain.setTargetAtTime(0.14, audioCtx.currentTime, 0.5);
  }
  function stopAmbience() {
    if (ambienceGain && audioCtx) {
      ambienceGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.4);
    }
  }

  var soundBtn = document.getElementById("sound-btn");
  soundBtn.addEventListener("click", function () {
    soundOn = !soundOn;
    if (soundOn) {
      startAmbience();
      soundBtn.textContent = "🔊 Sound On";
      soundBtn.classList.add("is-active");
    } else {
      stopAmbience();
      soundBtn.textContent = "🔈 Sound Off";
      soundBtn.classList.remove("is-active");
    }
  });

  canvas.addEventListener("pointerdown", function (e) {
    var rect = canvas.getBoundingClientRect();
    var px = e.clientX - rect.left;
    var py = e.clientY - rect.top;
    for (var i = 0; i < 6; i++) {
      bubbles.push({ x: px + rand(-8, 8), y: py, r: rand(1, 3), speed: rand(20, 40), drift: rand(-8, 8) });
    }
    if (bubbles.length > 60) bubbles.splice(0, bubbles.length - 60);
    fish.forEach(function (f) {
      var d = Math.hypot(f.x - px, f.y - py);
      if (d < 90) {
        f.dir = f.x < px ? -1 : 1;
        f.x += f.dir * -18;
      }
    });
  });
})();
