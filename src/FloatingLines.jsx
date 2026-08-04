import { useEffect, useRef } from 'react';
import './FloatingLines.css';

// Gradient wave lines, rendered with raw WebGL.
//
// History worth knowing: this was originally a three.js ShaderMaterial. A perf
// pass replaced it with canvas-2D strokes, which lost the soft anti-aliased
// glow the shader gave it. This version restores the shader look but talks to
// WebGL directly — three.js was ~500 KB for what is one full-screen fragment
// program, which needs none of its scene graph, loaders or math library.
//
// GLSL ES 1.00 (WebGL1) deliberately: iOS Safari support is broader, and this
// shader needs nothing WebGL2 offers. No derivatives extension either — line
// edges are softened with a fixed-width smoothstep instead of fwidth().

const MAX_LINES = 14;

const VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;

uniform vec2  iResolution;
uniform float iTime;
uniform vec3  gradFrom;
uniform vec3  gradTo;
uniform vec3  bandY;      // vertical centre of each band, 0..1
uniform vec3  bandCount;  // lines per band
uniform vec3  bandGap;    // spacing between lines, px
uniform vec3  bandOn;     // 1 = enabled
uniform vec2  iMouse;
uniform float interactive;
uniform float bendRadius;
uniform float bendStrength;
uniform float parallaxOffset;

void main() {
  vec2 frag = gl_FragCoord.xy;
  float H = max(iResolution.y, 1.0);
  float x = frag.x / max(iResolution.x, 1.0);

  vec3 col = vec3(0.0);
  float alpha = 0.0;

  // Line spacing and wave height are fractions of the canvas, not fixed
  // pixels. With pixel spacing, a tall container left three thin ribbons
  // stranded in a lot of empty blue; proportional geometry keeps the bands
  // reading at the same visual weight whatever the section height is.
  float unit = H / 620.0;

  for (int b = 0; b < 3; b++) {
    float on    = (b == 0) ? bandOn.x    : (b == 1) ? bandOn.y    : bandOn.z;
    if (on < 0.5) continue;
    float count = (b == 0) ? bandCount.x : (b == 1) ? bandCount.y : bandCount.z;
    float gap   = ((b == 0) ? bandGap.x  : (b == 1) ? bandGap.y   : bandGap.z) * unit;
    float cy    = (b == 0) ? bandY.x     : (b == 1) ? bandY.y     : bandY.z;

    float baseY = cy * H + parallaxOffset * (float(b) - 1.0);
    float fb = float(b);
    float amp = unit * 26.0;

    for (int i = 0; i < ${MAX_LINES}; i++) {
      if (float(i) >= count) break;

      float fi = float(i);
      float t = count > 1.0 ? fi / (count - 1.0) : 0.0;
      float spread = (fi - count * 0.5) * gap;

      // Three summed sines, each line phase-shifted a little further than the
      // last, so the group fans and folds instead of moving as one rigid ribbon.
      float ph = fi * 0.42 + fb * 2.1;
      float y = baseY + spread
              + sin(x * 5.2 + iTime * 1.05 + ph) * amp
              + sin(x * 2.1 - iTime * 0.68 + ph * 0.6) * amp * 0.65
              + sin(x * 9.4 + iTime * 0.42 + ph * 1.7) * amp * 0.22;

      // Cursor pushes nearby lines away with a gaussian falloff.
      if (interactive > 0.5) {
        float d = distance(frag, iMouse);
        y += bendStrength * 60.0 * exp(-(d * d) / (2.0 * bendRadius * bendRadius));
      }

      // Thicker toward the middle of each band reads as depth, like strands
      // nearer the viewer, rather than a flat comb of identical hairlines.
      float w = mix(0.9, 2.0, 1.0 - abs(t - 0.5) * 2.0) * max(1.0, unit * 0.9);
      float dist = abs(frag.y - y);
      float a = 1.0 - smoothstep(w * 0.45, w * 1.5, dist);
      if (a <= 0.0) continue;

      vec3 lineCol = mix(gradFrom, gradTo, t);
      float edge = 0.32 + 0.68 * (1.0 - abs(t - 0.5) * 2.0);
      // Slow travelling brightness so the field breathes across its width.
      float shimmer = 0.78 + 0.22 * sin(x * 3.1 - iTime * 0.55 + fb);

      float aw = a * edge * shimmer;
      col += lineCol * aw;
      alpha = max(alpha, aw);
    }
  }

  if (alpha <= 0.001) discard;
  gl_FragColor = vec4(col / max(alpha, 0.001) , alpha);
}
`;

function hexToRgb(hex) {
  const v = parseInt(String(hex).replace('#', ''), 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error('FloatingLines shader:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export default function FloatingLines({
  linesGradient = ['#5aa9f0', '#0d4f7c'],
  enabledWaves = ['top', 'middle', 'bottom'],
  lineCount = [8, 10, 8],
  lineDistance = [9, 7, 9],
  animationSpeed = 0.6,
  interactive = false,
  bendRadius = 5,
  bendStrength = -0.5,
  parallax = false,
  parallaxStrength = 0.12,
  mixBlendMode = 'normal',
  className = '',
  style = {}
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const canvas = document.createElement('canvas');
    canvas.style.mixBlendMode = mixBlendMode;
    container.appendChild(canvas);

    const gl =
      canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: false }) ||
      canvas.getContext('experimental-webgl');
    if (!gl) {
      canvas.remove();
      return undefined;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) {
      canvas.remove();
      return undefined;
    }
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    // Single full-screen triangle — cheaper than a quad, no index buffer.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const U = name => gl.getUniformLocation(prog, name);
    const uRes = U('iResolution');
    const uTime = U('iTime');
    const uMouse = U('iMouse');
    const uParallax = U('parallaxOffset');

    const has = k => (enabledWaves.includes(k) ? 1 : 0);
    gl.uniform3f(U('gradFrom'), ...hexToRgb(linesGradient[0] ?? '#5aa9f0'));
    gl.uniform3f(U('gradTo'), ...hexToRgb(linesGradient[linesGradient.length - 1] ?? '#0d4f7c'));
    // Pushed out toward the edges (was 0.22/0.5/0.78). The container is masked
    // to fade at top and bottom anyway, so keeping the bands bunched centrally
    // wasted the full height of the section.
    gl.uniform3f(U('bandY'), 0.16, 0.5, 0.84);
    // Denser than the props ask for: these counts set how solid each band
    // looks, and the sparse defaults read as a few stray hairlines once the
    // section is tall.
    const dense = n => Math.min(MAX_LINES, Math.max(10, Math.round(n * 1.5)));
    gl.uniform3f(
      U('bandCount'),
      dense(lineCount[0] ?? 8),
      dense(lineCount[1] ?? 10),
      dense(lineCount[2] ?? 8)
    );
    gl.uniform3f(U('bandGap'), lineDistance[0] ?? 9, lineDistance[1] ?? 7, lineDistance[2] ?? 9);
    gl.uniform3f(U('bandOn'), has('top'), has('middle'), has('bottom'));
    gl.uniform1f(U('interactive'), interactive ? 1 : 0);
    gl.uniform1f(U('bendRadius'), Math.max(1, bendRadius) * 20);
    gl.uniform1f(U('bendStrength'), bendStrength);

    // Capped at 1.5: these are soft out-of-focus lines, so extra device pixels
    // cost fill rate without being visible.
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let width = 0;
    let height = 0;

    const resize = () => {
      width = container.offsetWidth;
      height = container.offsetHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    resize();
    window.addEventListener('resize', onResize);

    const mouse = { x: -9999, y: -9999 };
    const onMove = e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * dpr;
      mouse.y = (r.height - (e.clientY - r.top)) * dpr; // GL origin is bottom-left
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };
    if (interactive) {
      container.addEventListener('pointermove', onMove);
      container.addEventListener('pointerleave', onLeave);
    }

    let visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(container);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();

    const render = t => {
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      if (parallax) {
        const r = container.getBoundingClientRect();
        const centred = (r.top + r.height / 2 - window.innerHeight / 2) / window.innerHeight;
        gl.uniform1f(uParallax, -centred * parallaxStrength * height * dpr);
      } else {
        gl.uniform1f(uParallax, 0);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    if (reduceMotion) {
      render(0);
      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        container.removeEventListener('pointermove', onMove);
        container.removeEventListener('pointerleave', onLeave);
        io.disconnect();
        canvas.remove();
      };
    }

    let raf = 0;
    const frame = now => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      render(((now - start) * 0.001) * animationSpeed);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerleave', onLeave);
      io.disconnect();
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
      const lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      canvas.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animationSpeed, interactive, parallax]);

  return <div ref={containerRef} className={`floating-lines-container ${className}`} style={style} />;
}
