// AutoReels 시네마틱 WebGL 3D 터널 & 파티클 엔진 (Three.js ESM + 2D Canvas 안전 폴백)
(function () {
  var canvas = document.getElementById('lpWebglCanvas');
  if (!canvas) return;
  var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var TUNNEL_IMAGES = [
    '/assets/scenes/auto/11.jpg',
    '/assets/scenes/cafe/4.jpg',
    '/assets/scenes/beauty/4.jpg',
    '/assets/scenes/restaurant/4.jpg',
    '/assets/scenes/interior/4.jpg',
    '/assets/scenes/realestate/4.jpg',
    '/assets/scenes/fitness/4.jpg',
    '/assets/scenes/academy/4.jpg'
  ];

  // 안전 폴백: WebGL 미지원 또는 CDN 차단 시에도 60fps 시네마틱 2D 스타워프/터널 렌더링
  function start2dFallback() {
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var stars = Array.from({ length: 160 }, function () {
      return { x: (Math.random() - 0.5) * 2, y: (Math.random() - 0.5) * 2, z: Math.random() };
    });
    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      canvas.height = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    function loop() {
      var w = canvas.clientWidth || 1, h = canvas.clientHeight || 1;
      var p = window.__arHeroProgress || 0;
      ctx.clearRect(0, 0, w, h);
      var speed = 0.002 + (p > 0.14 && p < 0.48 ? 0.018 : 0.003);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.z -= reducedMotion ? 0 : speed;
        if (s.z <= 0.02) { s.z = 1; s.x = (Math.random() - 0.5) * 2; s.y = (Math.random() - 0.5) * 2; }
        var px = w * 0.5 + (s.x / s.z) * w * 0.36;
        var py = h * 0.5 + (s.y / s.z) * h * 0.36;
        var r = Math.max(0.6, (1 - s.z) * 2.4);
        ctx.fillStyle = 'rgba(210, 255, 235, ' + ((1 - s.z) * 0.65).toFixed(2) + ')';
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js').then(function (THREE) {
    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (e) {
      start2dFallback();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    var scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060609, 0.048);

    var camera = new THREE.PerspectiveCamera(48, 1, 0.1, 80);
    camera.position.set(0, 0, 8.2);

    // 3D 시네마틱 곡면 릴스 스크린 터널 (8개 곡면 메쉬 + 2개 네온 가이드 링)
    var tunnelGroup = new THREE.Group();
    scene.add(tunnelGroup);

    var texLoader = new THREE.TextureLoader();
    var screenMeshes = [];

    // 9:16 비율 곡면 스크린 지오메트리 생성 (CylinderGeometry 일부 호 사용)
    var curvedGeo = new THREE.CylinderGeometry(4.4, 4.4, 3.2, 24, 1, true, -0.22, 0.44);
    curvedGeo.scale(-1, 1, 1); // 안쪽 면을 바라보도록 뒤집기

    TUNNEL_IMAGES.forEach(function (url, idx) {
      var tex = texLoader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      var mat = new THREE.MeshBasicMaterial({
        map: tex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.92
      });
      var mesh = new THREE.Mesh(curvedGeo, mat);
      // 2단 나선형 원형 터널 배치 (z: 1.5 ~ -15.5)
      var angle = (idx / 4) * Math.PI * 2 + (idx >= 4 ? Math.PI / 4 : 0);
      mesh.rotation.y = angle;
      mesh.position.z = 1.8 - idx * 2.25;
      tunnelGroup.add(mesh);
      screenMeshes.push(mesh);
    });

    // 시네마틱 3D 광원 링 4개 (깊이감 가이드)
    var ringMat = new THREE.MeshBasicMaterial({ color: 0x4cc38a, transparent: true, opacity: 0.28 });
    var ringGeo = new THREE.TorusGeometry(4.55, 0.018, 10, 96);
    var rings = [];
    for (var rIdx = 0; rIdx < 4; rIdx++) {
      var ring = new THREE.Mesh(ringGeo, ringMat.clone());
      ring.position.z = 1.2 - rIdx * 5.2;
      tunnelGroup.add(ring);
      rings.push(ring);
    }

    // 320개 3D 시네마틱 빛 입자 (Bokeh Dust)
    var pCount = 320;
    var pPos = new Float32Array(pCount * 3);
    for (var i = 0; i < pCount; i++) {
      var rad = 1.4 + Math.random() * 6.5;
      var th = Math.random() * Math.PI * 2;
      pPos[i * 3] = Math.cos(th) * rad;
      pPos[i * 3 + 1] = Math.sin(th) * rad;
      pPos[i * 3 + 2] = 7 - Math.random() * 28;
    }
    // 부드러운 원형 영화 보케 텍스처 생성 (사각형 점 방지)
    var bokehCanvas = document.createElement('canvas');
    bokehCanvas.width = 64;
    bokehCanvas.height = 64;
    var bCtx = bokehCanvas.getContext('2d');
    var grad = bCtx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.35, 'rgba(180,255,220,0.7)');
    grad.addColorStop(1, 'rgba(76,195,138,0)');
    bCtx.fillStyle = grad;
    bCtx.fillRect(0, 0, 64, 64);
    var bokehTex = new THREE.CanvasTexture(bokehCanvas);

    var pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    var pMat = new THREE.PointsMaterial({
      color: 0xd8fff0,
      map: bokehTex,
      size: 0.18,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    var particles = new THREE.Points(pGeo, pMat);
    scene.add(particles);

    function resize() {
      var w = Math.max(1, canvas.clientWidth);
      var h = Math.max(1, canvas.clientHeight);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize, { passive: true });

    var clock = new THREE.Clock();
    var smoothP = 0;

    function animate() {
      var dt = Math.min(clock.getDelta(), 0.05);
      var elapsed = clock.getElapsedTime();
      var targetP = window.__arHeroProgress || 0;
      smoothP += (targetP - smoothP) * 0.1;

      var mx = (window.__arHeroMouse && window.__arHeroMouse.x) || 0;
      var my = (window.__arHeroMouse && window.__arHeroMouse.y) || 0;

      // 0 ~ 0.45: 3D 터널 관통 비행 (Z: 8.2 -> -18.5)
      var flyP = Math.min(1, Math.max(0, smoothP / 0.45));
      var flyEased = flyP < 0.5 ? 2 * flyP * flyP : 1 - Math.pow(-2 * flyP + 2, 2) / 2;

      camera.position.z = 8.2 - flyEased * 26.5;
      camera.position.x = mx * 0.85 * (1 - flyP * 0.4);
      camera.position.y = -my * 0.55 * (1 - flyP * 0.4);

      // 관통 구간에서 시네마틱 광각 FOV 확장 (48 -> 66 -> 50)
      var fovBoost = Math.sin(flyP * Math.PI) * 18;
      var nextFov = 48 + fovBoost;
      if (Math.abs(camera.fov - nextFov) > 0.05) {
        camera.fov = nextFov;
        camera.updateProjectionMatrix();
      }

      // 터널 느린 시네마틱 회전 + 관통 시 롤 연출
      if (!reducedMotion) {
        tunnelGroup.rotation.z = elapsed * 0.085 + flyEased * 0.72;
        particles.rotation.z = -elapsed * 0.03;
      }
      camera.lookAt(0, 0, camera.position.z - 8);

      // 터널 통과 이후(p > 0.45)에는 스크린을 서서히 어둡게 가라앉혀 본 메인 릴스 집중
      var tunnelFade = 1 - Math.min(1, Math.max(0, (smoothP - 0.40) / 0.12));
      for (var m = 0; m < screenMeshes.length; m++) {
        screenMeshes[m].material.opacity = 0.92 * tunnelFade;
      }
      for (var r = 0; r < rings.length; r++) {
        rings[r].material.opacity = 0.28 * tunnelFade;
      }
      pMat.opacity = 0.35 + 0.45 * tunnelFade;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    requestAnimationFrame(animate);
  }).catch(function () {
    start2dFallback();
  });
})();
