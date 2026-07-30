/* ============================================================
   OMÈRTA — Portfolio Animation Engine
   Dark Luxury Kinetic — Layered Hero Edition
   ============================================================ */

;(function () {
  'use strict';

  // ─── CONFIG ───────────────────────────────────────────────
  const CONFIG = {
    lenis: { lerp: 0.08, duration: 1.2, smoothWheel: true, syncTouch: true },
    skew: { multiplier: 0.1, clampMin: -3, clampMax: 3 },
    cursor: { followerCount: 5, baseLerp: 0.28, lerpDecay: 0.03 },
    magnetic: { radius: 50 },
    breakpoints: { mobile: 768, tablet: 1024 },
  };

  // Prevent browser scroll restoration / page jump on reload
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  // ─── STATE ────────────────────────────────────────────────
  const state = {
    lenis: null,
    mouse: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    scrollVelocity: 0,
    isMobile: window.innerWidth <= CONFIG.breakpoints.mobile,
    isTablet: window.innerWidth <= CONFIG.breakpoints.tablet,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    loaded: false,
    fluidBg: null,
  };

  // ─── UTILITIES ────────────────────────────────────────────
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
  const lerp = (a, b, t) => a + (b - a) * t;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // ─── 1. LOADER ────────────────────────────────────────────
  function initLoader() {
    return new Promise((resolve) => {
      const loader = $('#loader');
      const brand = $('.loader-brand');
      const progress = $('#loader-progress');
      const counter = $('#loader-counter');

      if (!loader || state.reducedMotion) {
        if (loader) loader.style.display = 'none';
        resolve();
        return;
      }

      gsap.to(brand, { opacity: 1, duration: 0.4, ease: 'power4.out', delay: 0.1 });
      gsap.to(counter, { opacity: 1, duration: 0.3, delay: 0.2 });

      const target = { value: 0 };
      gsap.to(target, {
        value: 100,
        duration: 0.8,
        ease: 'power2.inOut',
        onUpdate: () => {
          const prog = Math.round(target.value);
          progress.style.width = prog + '%';
          counter.textContent = prog;
        },
        onComplete: () => {
          gsap.to(loader, {
            yPercent: -100,
            duration: 0.6,
            ease: 'power4.inOut',
            delay: 0.1,
            onComplete: () => {
              loader.style.display = 'none';
              state.loaded = true;
              resolve();
            },
          });
        },
      });
    });
  }

  // ─── 2. LENIS + SCROLLTRIGGER ─────────────────────────────
  function initSmoothScroll() {
    if (state.reducedMotion || state.isMobile || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) return;

    state.lenis = new Lenis({
      lerp: CONFIG.lenis.lerp,
      duration: CONFIG.lenis.duration,
      smoothWheel: CONFIG.lenis.smoothWheel,
      syncTouch: false,
    });

    state.lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { state.lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    state.lenis.on('scroll', (e) => { state.scrollVelocity = e.velocity; });
  }

  // ─── 3. VELOCITY SKEW ────────────────────────────────────
  function initVelocitySkew() {
    if (state.reducedMotion || state.isMobile) return;

    const wrapper = $('#main-wrapper');
    if (!wrapper) return;

    let currentSkew = 0;
    gsap.ticker.add(() => {
      const velocity = state.scrollVelocity || 0;
      const targetSkew = clamp(velocity * 0.04, -1.5, 1.5);
      currentSkew = lerp(currentSkew, targetSkew, 0.1);
      if (Math.abs(currentSkew) > 0.01) {
        wrapper.style.setProperty('--skew', currentSkew.toFixed(2) + 'deg');
      } else if (currentSkew !== 0) {
        currentSkew = 0;
        wrapper.style.setProperty('--skew', '0deg');
      }
    });
  }

  // ─── 4. CUSTOM CURSOR ────────────────────────────────────
  function initCursor() {
    if (state.isMobile || state.reducedMotion) return;

    const cursorDot = $('#cursor-dot');
    const followers = $$('.cursor-follower');
    if (!cursorDot) return;

    const dotX = gsap.quickTo(cursorDot, 'left', { duration: 0.05, ease: 'power2.out' });
    const dotY = gsap.quickTo(cursorDot, 'top', { duration: 0.05, ease: 'power2.out' });

    const followerAnimators = followers.map((el, i) => ({
      el,
      xTo: gsap.quickTo(el, 'left', { duration: 0.12 + i * 0.04, ease: 'power2.out' }),
      yTo: gsap.quickTo(el, 'top', { duration: 0.12 + i * 0.04, ease: 'power2.out' }),
      prevX: window.innerWidth / 2,
      prevY: window.innerHeight / 2,
    }));

    document.addEventListener('mousemove', (e) => {
      state.mouse.x = e.clientX;
      state.mouse.y = e.clientY;
      dotX(e.clientX);
      dotY(e.clientY);

      followerAnimators.forEach((f, i) => {
        const targetX = i === 0 ? e.clientX : followerAnimators[i - 1].prevX;
        const targetY = i === 0 ? e.clientY : followerAnimators[i - 1].prevY;
        f.xTo(targetX);
        f.yTo(targetY);
        const t = 0.25 - i * 0.03;
        f.prevX = lerp(f.prevX, targetX, t);
        f.prevY = lerp(f.prevY, targetY, t);
      });
    });

    // State changes
    $$('a, button, [data-magnetic]').forEach((el) => {
      el.addEventListener('mouseenter', () => cursorDot.classList.add('is-link'));
      el.addEventListener('mouseleave', () => cursorDot.classList.remove('is-link'));
    });

    $$('.hero-image-layer, .about-image-wrap').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursorDot.classList.add('is-image');
        cursorDot.classList.remove('is-link');
      });
      el.addEventListener('mouseleave', () => cursorDot.classList.remove('is-image'));
    });
  }

  // ─── 5. SPLIT TEXT ANIMATIONS ─────────────────────────────
  function initSplitText() {
    if (typeof SplitType === 'undefined') return;

    // Hero title — character reveal
    const heroTitle = $('[data-split-chars]', $('#hero'));
    if (heroTitle) {
      const split = new SplitType(heroTitle, { types: 'chars', charClass: 'char-reveal' });
      gsap.from(split.chars, {
        y: '120%',
        opacity: 0,
        stagger: 0.02,
        ease: 'power4.out',
        duration: 0.8,
        delay: 0.1,
      });
    }

    // Hero label — word reveal
    const heroLabel = $('[data-split-words]', $('#hero'));
    if (heroLabel) {
      const split = new SplitType(heroLabel, { types: 'words', wordClass: 'word-reveal' });
      gsap.from(split.words, {
        y: '100%',
        opacity: 0,
        stagger: 0.03,
        ease: 'power4.out',
        duration: 0.6,
        delay: 0.4,
      });
    }

    // Hero tagline
    const heroTagline = $('.hero-tagline[data-split-words]');
    if (heroTagline) {
      const split = new SplitType(heroTagline, { types: 'words', wordClass: 'word-reveal' });
      gsap.from(split.words, {
        y: '100%',
        opacity: 0,
        stagger: 0.02,
        ease: 'power4.out',
        duration: 0.6,
        delay: 0.7,
      });
    }

    // Section titles — scroll-triggered
    $$('.section-title[data-split-chars]').forEach((el) => {
      const split = new SplitType(el, { types: 'chars', charClass: 'char-reveal' });
      gsap.from(split.chars, {
        y: '120%',
        opacity: 0,
        stagger: 0.02,
        ease: 'power4.out',
        duration: 0.8,
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    });
  }

  // ─── 6. MAGNETIC BUTTONS ──────────────────────────────────
  function initMagneticButtons() {
    if (state.isMobile || state.reducedMotion) return;

    $$('[data-magnetic]').forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.4, ease: 'elastic.out(1, 0.5)' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.4, ease: 'elastic.out(1, 0.5)' });
      const padding = CONFIG.magnetic.radius;

      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const distX = e.clientX - centerX;
        const distY = e.clientY - centerY;
        const distance = Math.sqrt(distX * distX + distY * distY);
        const maxDist = Math.max(rect.width, rect.height) / 2 + padding;

        if (distance < maxDist) {
          const strength = 1 - distance / maxDist;
          xTo(distX * strength * 0.4);
          yTo(distY * strength * 0.4);
        }
      });

      el.addEventListener('mouseleave', () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.3)' });
      });
    });
  }

  // ─── 7. PARALLAX IMAGES ───────────────────────────────────
  function initParallax() {
    if (state.reducedMotion) return;

    const intensity = state.isTablet ? 0.5 : 1;

    $$('[data-parallax-container]').forEach((container) => {
      const image = container.querySelector('[data-parallax]');
      if (!image) return;

      gsap.to(image, {
        yPercent: 15 * intensity,
        ease: 'none',
        scrollTrigger: {
          trigger: container,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    });
  }

  // ─── 8. SVG TIMELINE PATH ────────────────────────────────
  function initTimeline() {
    const timelineLine = $('#timeline-line');
    const nodes = $$('.timeline-node');
    const wrapper = $('.timeline-wrapper');

    if (!timelineLine || !wrapper) return;

    // Animate the line drawing
    gsap.fromTo(timelineLine,
      { attr: { y2: '0%' } },
      {
        attr: { y2: '100%' },
        ease: 'none',
        scrollTrigger: {
          trigger: wrapper,
          start: 'top 60%',
          end: 'bottom 40%',
          scrub: 1,
        },
      }
    );

    // Animate nodes appearing
    nodes.forEach((node) => {
      gsap.to(node, {
        opacity: 1,
        x: 0,
        duration: 0.6,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: node,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
          onEnter: () => node.querySelector('.node-dot')?.classList.add('active'),
          onLeaveBack: () => node.querySelector('.node-dot')?.classList.remove('active'),
        },
      });
    });
  }

  // ─── 9. STATS COUNTER ────────────────────────────────────
  function initStatsCounter() {
    $$('.stat-number[data-count]').forEach((el) => {
      const target = parseInt(el.dataset.count, 10);
      let animated = false;

      ScrollTrigger.create({
        trigger: el.closest('.stat-item'),
        start: 'top 80%',
        onEnter: () => {
          if (animated) return;
          animated = true;

          el.style.filter = 'blur(2px)';
          const obj = { value: 0 };
          gsap.to(obj, {
            value: target,
            duration: 2,
            ease: 'power4.out',
            onUpdate: () => { el.textContent = Math.round(obj.value); },
            onComplete: () => {
              el.style.filter = 'none';
              el.textContent = target;
            },
          });
        },
      });
    });
  }

  // ─── 10. SCROLL REVEALS ───────────────────────────────────
  function initScrollReveals() {
    $$('.reveal-up').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    });
  }

  // ─── 11. NAVIGATION ──────────────────────────────────────
  function initNavigation() {
    const nav = $('#main-nav');
    if (!nav) return;

    ScrollTrigger.create({
      start: 100,
      onUpdate: (self) => {
        nav.classList.toggle('scrolled', self.scroll() > 100);
      },
    });

    $$('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = $(link.getAttribute('href'));
        if (target && state.lenis) {
          state.lenis.scrollTo(target, { offset: -80 });
        } else if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });

    // Hero CTA buttons smooth scroll
    $$('.hero-cta-btn, .hero-cta-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const target = $(href);
          if (target && state.lenis) {
            state.lenis.scrollTo(target, { offset: -80 });
          }
        }
      });
    });
  }



  // ─── 12. FOOTER CTA TEXT FILL ─────────────────────────────
  function initFooterCTA() {
    const ctaTitle = $('.cta-title');
    if (!ctaTitle) return;

    ScrollTrigger.create({
      trigger: ctaTitle,
      start: 'top 75%',
      onEnter: () => ctaTitle.classList.add('filled'),
      onLeaveBack: () => ctaTitle.classList.remove('filled'),
    });
  }

  // ─── 13. CONTACT FORM (DUMMY BUTTON) ──────────────────────
  function initContactForm() {
    const dummyBtn = $('#dummy-email-btn') || $('.submit-btn');
    const form = $('#contact-form');
    if (!dummyBtn) return;

    function handleDummySubmit(e) {
      if (e) e.preventDefault();
      const btnText = dummyBtn.querySelector('.btn-text');
      const originalText = btnText ? btnText.textContent : 'SEND MESSAGE →';

      if (btnText) btnText.textContent = 'MESSAGE SENT ✓';
      gsap.to(dummyBtn, { scale: 0.95, duration: 0.12, yoyo: true, repeat: 1 });

      setTimeout(() => {
        if (btnText) btnText.textContent = originalText;
        if (form) form.reset();
      }, 2500);
    }

    dummyBtn.addEventListener('click', handleDummySubmit);
    if (form) form.addEventListener('submit', handleDummySubmit);
  }

  // ─── 14. WEBGL FLUID BACKGROUND ──────────────────────────
  class FluidBackground {
    constructor(canvas) {
      this.canvas = canvas;

      // Disable WebGL context on mobile devices to prevent GPU memory crashes
      if (state.isMobile || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        this.fallback();
        return;
      }

      this.gl = canvas.getContext('webgl', { alpha: false, antialias: false, preserveDrawingBuffer: false });

      if (!this.gl) { this.fallback(); return; }

      this.mouse = { x: 0.5, y: 0.5 };
      this.time = 0;
      this.init();
    }

    fallback() {
      this.canvas.style.display = 'none';
      document.body.style.background = `
        radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 70% 30%, rgba(232,168,124,0.05) 0%, transparent 50%),
        #0A0A0F
      `;
    }

    init() {
      const gl = this.gl;
      this.resize();
      window.addEventListener('resize', () => this.resize());

      document.addEventListener('mousemove', (e) => {
        this.mouse.x = e.clientX / window.innerWidth;
        this.mouse.y = 1.0 - e.clientY / window.innerHeight;
      });

      const vertSrc = `
        attribute vec2 position;
        void main() { gl_Position = vec4(position, 0.0, 1.0); }
      `;

      const fragSrc = `
        precision highp float;
        uniform float uTime;
        uniform vec2 uMouse;
        uniform vec2 uResolution;

        vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
        vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}

        float snoise(vec2 v){
          const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
          vec2 i=floor(v+dot(v,C.yy));
          vec2 x0=v-i+dot(i,C.xx);
          vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
          vec4 x12=x0.xyxy+C.xxzz;
          x12.xy-=i1;
          i=mod289(i);
          vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
          vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
          m=m*m;m=m*m;
          vec3 x=2.0*fract(p*C.www)-1.0;
          vec3 h=abs(x)-0.5;
          vec3 ox=floor(x+0.5);
          vec3 a0=x-ox;
          m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
          vec3 g;
          g.x=a0.x*x0.x+h.x*x0.y;
          g.yz=a0.yz*x12.xz+h.yz*x12.yw;
          return 130.0*dot(m,g);
        }

        void main(){
          vec2 uv=gl_FragCoord.xy/uResolution;
          vec2 mouseUV=uMouse;
          float mouseDist=length(uv-mouseUV);
          float mouseInfluence=smoothstep(0.35,0.0,mouseDist)*0.15;

          vec2 dUV=uv;
          dUV.x+=sin(uv.y*3.0+uTime*0.15)*0.015;
          dUV.y+=cos(uv.x*3.0+uTime*0.12)*0.015;
          dUV+=(mouseUV-uv)*mouseInfluence;

          float n1=snoise(dUV*1.5+uTime*0.05)*0.5+0.5;
          float n2=snoise(dUV*3.0-uTime*0.08)*0.5+0.5;
          float n3=snoise(dUV*0.8+uTime*0.03+10.0)*0.5+0.5;

          vec3 bg=vec3(0.039,0.039,0.059);
          vec3 indigo=vec3(0.388,0.400,0.945);
          vec3 copper=vec3(0.910,0.659,0.486);
          vec3 elev=vec3(0.071,0.071,0.102);

          vec3 color=bg;
          color=mix(color,elev,n3*0.5);
          color=mix(color,indigo*0.3,smoothstep(0.5,0.8,n1)*0.2+mouseInfluence*0.5);
          color=mix(color,copper*0.3,smoothstep(0.6,0.9,n2)*0.12);

          float vignette=smoothstep(1.5,0.5,length(uv-0.5)*1.5);
          color*=vignette*0.9+0.1;

          gl_FragColor=vec4(color,1.0);
        }
      `;

      const vert = this.compileShader(gl.VERTEX_SHADER, vertSrc);
      const frag = this.compileShader(gl.FRAGMENT_SHADER, fragSrc);
      if (!vert || !frag) { this.fallback(); return; }

      this.program = gl.createProgram();
      gl.attachShader(this.program, vert);
      gl.attachShader(this.program, frag);
      gl.linkProgram(this.program);
      if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) { this.fallback(); return; }

      gl.useProgram(this.program);

      const quad = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);

      const posAttrib = gl.getAttribLocation(this.program, 'position');
      gl.enableVertexAttribArray(posAttrib);
      gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

      this.uniforms = {
        time: gl.getUniformLocation(this.program, 'uTime'),
        mouse: gl.getUniformLocation(this.program, 'uMouse'),
        resolution: gl.getUniformLocation(this.program, 'uResolution'),
      };

      this.render();
    }

    compileShader(type, source) {
      const gl = this.gl;
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      this.canvas.width = window.innerWidth * dpr;
      this.canvas.height = window.innerHeight * dpr;
      if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    render() {
      const gl = this.gl;
      if (!gl) return;
      this.time += 0.016;
      gl.uniform1f(this.uniforms.time, this.time);
      gl.uniform2f(this.uniforms.mouse, this.mouse.x, this.mouse.y);
      gl.uniform2f(this.uniforms.resolution, this.canvas.width, this.canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      requestAnimationFrame(() => this.render());
    }
  }

  function initFluidBackground() {
    if (state.isMobile || state.reducedMotion) {
      const canvas = $('#fluid-canvas');
      if (canvas) {
        canvas.style.display = 'none';
        document.body.style.background = `
          radial-gradient(ellipse at 30% 50%, rgba(99,102,241,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 30%, rgba(232,168,124,0.05) 0%, transparent 50%),
          #0A0A0F
        `;
      }
      return;
    }
    const canvas = $('#fluid-canvas');
    if (canvas) state.fluidBg = new FluidBackground(canvas);
  }

  // ─── 15. HERO ENTRANCE ────────────────────────────────────
  function initHeroEntrance() {
    if (state.reducedMotion) return;

    const heroImage = $('.hero-bg-image');
    const heroImageLayer = $('.hero-image-layer');
    const labelLine = $('.label-line');
    const scrollIndicator = $('.hero-scroll-indicator');
    const ctaRow = $('.hero-cta-row');
    const metas = $$('.hero-meta');
    const videoLayer = $('.hero-video-layer');
    const bgVideo = $('#hero-bg-video');

    // Reveal video layer cleanly as hero enters
    if (videoLayer) {
      videoLayer.classList.add('is-visible');
    }
    if (bgVideo) {
      bgVideo.muted = true;
      bgVideo.play().catch(() => {});
    }

    // Image layer reveal — cinematic curtain
    if (heroImageLayer) {
      gsap.from(heroImageLayer, {
        clipPath: 'inset(100% 0 0 0)',
        duration: 1.5,
        ease: 'power4.inOut',
        delay: 0.1,
      });
    }

    // Image zoom settle
    if (heroImage) {
      gsap.from(heroImage, {
        scale: 1.4,
        duration: 2,
        ease: 'power3.out',
        delay: 0.3,
      });
    }

    // Label line
    if (labelLine) {
      gsap.from(labelLine, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 0.8,
        ease: 'power4.out',
        delay: 0.8,
      });
    }

    // CTA row
    if (ctaRow) {
      gsap.from(ctaRow, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: 'power4.out',
        delay: 1.2,
      });
    }

    // Scroll indicator
    if (scrollIndicator) {
      gsap.from(scrollIndicator, {
        opacity: 0,
        y: 20,
        duration: 0.8,
        ease: 'power4.out',
        delay: 1.5,
      });
    }

    // Corner metadata
    metas.forEach((meta, i) => {
      gsap.from(meta, {
        opacity: 0,
        duration: 1,
        delay: 1.5 + i * 0.2,
      });
    });

    // Hero image parallax on scroll (zooms out slightly as you scroll down)
    if (heroImage) {
      gsap.to(heroImage, {
        yPercent: 20,
        scale: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    // Fade out hero content on scroll
    const heroContent = $('.hero-content-layer');
    if (heroContent) {
      gsap.to(heroContent, {
        opacity: 0,
        y: -60,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero-section',
          start: '60% top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }
  }

  // ─── 16. SCROLL AUDIO CONTROL ─────────────────────────────
  function initScrollAudioControl() {
    const bgVideo = $('#hero-bg-video');
    const soundBtn = $('#hero-sound-btn');
    const soundText = soundBtn ? soundBtn.querySelector('.sound-text') : null;

    if (!bgVideo) return;

    bgVideo.loop = true;
    bgVideo.muted = true;
    bgVideo.playsInline = true;
    bgVideo.setAttribute('playsinline', '');
    bgVideo.setAttribute('webkit-playsinline', '');

    // Attempt instant autoplay with fallback for iOS Low Power Mode
    const startVideo = () => {
      const p = bgVideo.play();
      if (p !== undefined) {
        p.catch(() => {
          const forcePlayOnTouch = () => {
            bgVideo.muted = true;
            bgVideo.play().catch(() => {});
            ['touchstart', 'pointerdown', 'scroll'].forEach((evt) => {
              window.removeEventListener(evt, forcePlayOnTouch);
            });
          };
          ['touchstart', 'pointerdown', 'scroll'].forEach((evt) => {
            window.addEventListener(evt, forcePlayOnTouch, { passive: true, once: true });
          });
        });
      }
    };
    startVideo();

    function setAudioState(unmuted) {
      bgVideo.muted = !unmuted;
      if (unmuted) {
        bgVideo.volume = 1.0;
        bgVideo.play().catch(() => {});
        if (soundBtn) soundBtn.classList.add('is-active');
        if (soundText) soundText.textContent = 'SOUND / ON';
      } else {
        if (soundBtn) soundBtn.classList.remove('is-active');
        if (soundText) soundText.textContent = 'SOUND / OFF';
      }
    }

    if (soundBtn) {
      soundBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        setAudioState(bgVideo.muted);
      });
    }

    // Auto-unmute on first click/tap anywhere on page
    const unmuteOnFirstClick = () => {
      if (bgVideo.muted) {
        setAudioState(true);
      }
      ['click', 'touchstart'].forEach((evt) => {
        window.removeEventListener(evt, unmuteOnFirstClick);
      });
    };
    ['click', 'touchstart'].forEach((evt) => {
      window.addEventListener(evt, unmuteOnFirstClick, { once: true });
    });

    // Diminish audio volume smoothly as user scrolls down from Hero
    ScrollTrigger.create({
      trigger: '.hero-section',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        if (!bgVideo.muted) {
          bgVideo.volume = clamp(1.0 - self.progress * 1.4, 0, 1);
        }
      },
    });
  }

  // ─── 17. DYNAMIC SECTION COLOR SHIFTS ─────────────────────
  function initSectionColorShifts() {
    const root = document.documentElement;

    const sections = [
      {
        trigger: '#hero',
        bg: '#0A0A0F',
        accent: '#6366F1',
        warm: '#E8A87C',
      },
      {
        trigger: '#about',
        bg: '#120E18',
        accent: '#E8A87C',
        warm: '#6366F1',
      },
      {
        trigger: '.timeline-section',
        bg: '#0A0D1A',
        accent: '#6366F1',
        warm: '#E8A87C',
      },
      {
        trigger: '.stats-section',
        bg: '#12121A',
        accent: '#818CF8',
        warm: '#E8A87C',
      },
      {
        trigger: '#contact',
        bg: '#08080C',
        accent: '#E8A87C',
        warm: '#6366F1',
      },
    ];

    sections.forEach((sec) => {
      const el = $(sec.trigger);
      if (!el) return;

      ScrollTrigger.create({
        trigger: el,
        start: 'top 50%',
        end: 'bottom 50%',
        onEnter: () => {
          gsap.to(root, {
            '--bg-primary': sec.bg,
            '--accent-electric': sec.accent,
            '--accent-warm': sec.warm,
            duration: 1,
            ease: 'power2.out',
          });
        },
        onEnterBack: () => {
          gsap.to(root, {
            '--bg-primary': sec.bg,
            '--accent-electric': sec.accent,
            '--accent-warm': sec.warm,
            duration: 1,
            ease: 'power2.out',
          });
        },
      });
    });
  }

  // ─── INIT ─────────────────────────────────────────────────
  async function init() {
    gsap.registerPlugin(ScrollTrigger);
    if (typeof Flip !== 'undefined') gsap.registerPlugin(Flip);

    if (state.reducedMotion) {
      $$('.reveal-up').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
      $$('.timeline-node').forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
      const loader = $('#loader');
      if (loader) loader.style.display = 'none';
      initNavigation();
      initContactForm();
      return;
    }

    initFluidBackground();
    await initLoader();

    // Start background video looping automatically as soon as loader completes
    const bgVideo = $('#hero-bg-video');
    if (bgVideo) {
      bgVideo.muted = true;
      bgVideo.play().catch(() => {});
    }

    initSmoothScroll();
    initCursor();
    initSplitText();
    initHeroEntrance();
    initVelocitySkew();
    initMagneticButtons();
    initParallax();
    initTimeline();
    initStatsCounter();
    initScrollReveals();
    initNavigation();
    initScrollAudioControl();
    initSectionColorShifts();
    initFooterCTA();
    initContactForm();

    // Ensure window and Lenis scroll reset to 0,0 top on init
    window.scrollTo(0, 0);
    if (state.lenis) {
      state.lenis.scrollTo(0, { immediate: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
