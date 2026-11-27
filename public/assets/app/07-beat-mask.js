// Vector motion for the approved nine-scene composition. The studio owns cut lengths and media.
const AR_BEAT_BOUNDARIES = [0, 1, 2.917, 4.85, 6.767, 8.667, 10.617, 12.567, 14.45, 18.4];
const AR_BEAT_ARGS = { rect:4, capsule:5, circle:3, angled:5, digits:2, join:4, underlay:1, full:0 };
let arBeatMatte;

function arBeatTime(cut, count, progress) {
  let first, last;
  if (count <= 9) {
    first = Math.floor(cut * 9 / count);
    last = Math.floor((cut + 1) * 9 / count);
  } else {
    first = cut === 0 ? 0 : cut === count - 1 ? 8 : 1 + (cut - 1) % 7;
    last = first + 1;
  }
  return AR_BEAT_BOUNDARIES[first] + (AR_BEAT_BOUNDARIES[last] - AR_BEAT_BOUNDARIES[first]) * progress;
}

function arBeatPose(frame) {
  const track = AR_BEAT_TRACKS.findLast(row => row[0] <= frame);
  const keys = track[2];
  const right = keys.findIndex(key => key[0] > frame);
  if (right < 0) return [track[1], keys[keys.length - 1].slice(1)];
  const a = keys[right - 1], b = keys[right], fraction = (frame - a[0]) / (b[0] - a[0]);
  return [track[1], a.slice(1).map((v, i) => v + (b[i + 1] - v) * fraction)];
}

function arBeatDigits(c, W, H, number, scale) {
  const text = String(Math.round(number)), slot = W * 174 / 768 * scale;
  const height = Math.min(H * .595, W * .46) * scale;
  c.save();
  c.font = '900 160px Impact, "Arial Black", sans-serif';
  c.textBaseline = 'alphabetic';
  for (let i = 0; i < text.length; i++) {
    const bounds = c.measureText(text[i]);
    const width = Math.max(1, bounds.actualBoundingBoxLeft + bounds.actualBoundingBoxRight);
    const glyphHeight = Math.max(1, bounds.actualBoundingBoxAscent + bounds.actualBoundingBoxDescent);
    c.save();
    c.translate(W / 2 + (i - 1.5) * slot - slot * .43, (H - height) / 2);
    c.scale(slot * .86 / width, height / glyphHeight);
    c.fillText(text[i], bounds.actualBoundingBoxLeft, bounds.actualBoundingBoxAscent);
    c.restore();
  }
  c.restore();
}

function arBeatMaskFrame(c, W, H, S, cut, count, progress) {
  const t = arBeatTime(cut, count, progress);
  const [shapes, values] = arBeatPose(Math.min(551, t * 30));
  const sx = W / 768, sy = H / 432, scale = Math.min(sx, sy);
  const res = Math.min(3, Math.max(2, 2 * Math.abs(c.getTransform().a)));
  if (!arBeatMatte) arBeatMatte = document.createElement('canvas');
  const matte = arBeatMatte, width = Math.max(1, Math.round(W * res)), height = Math.max(1, Math.round(H * res));
  if (matte.width !== width || matte.height !== height) { matte.width = width; matte.height = height; }
  const m = matte.getContext('2d');
  m.setTransform(width / W, 0, 0, height / H, 0, 0);
  m.clearRect(0, 0, W, H);
  m.fillStyle = '#fff';
  const joins = [];
  const diagonalPill = H > W && t >= 7.21 && t < 7.325;
  if (diagonalPill) {
    const q = arReferenceFanEase((t - 7.21) / .115);
    const diameter = 168 * scale, length = diameter + (Math.hypot(W,H) * 1.2 - diameter) * q;
    m.save(); m.translate(W/2, H*210/432); m.rotate(-48*Math.PI/180);
    m.beginPath(); m.roundRect(-length/2,-diameter/2,length,diameter,diameter/2); m.fill(); m.restore();
  }
  let offset = 0;
  for (const shape of diagonalPill ? [] : shapes) {
    const [x, y, w, h, radius] = values.slice(offset, offset + AR_BEAT_ARGS[shape]);
    offset += AR_BEAT_ARGS[shape];
    m.beginPath();
    switch (shape) {
      case 'full': m.fillRect(0, 0, W, H); break;
      case 'underlay': m.globalAlpha = x; m.fillRect(0, 0, W, H); m.globalAlpha = 1; break;
      case 'rect': m.fillRect(x * sx, y * sy, w * sx, h * sy); break;
      case 'digits': arBeatDigits(m, W, H, x, y); break;
      case 'circle': m.arc(x * sx, y * sy, w * scale, 0, Math.PI * 2); m.fill(); break;
      case 'capsule':
        m.roundRect((x - w / 2) * sx, (y - h / 2) * sy, w * sx, h * sy, Math.min(w * sx / 2, h * sy / 2, radius * scale));
        m.fill(); break;
      case 'angled': {
        // Size the rectangle in the output frame, then rotate. A stretched,
        // already-rotated rectangle would shear the straight cut into a parallelogram.
        const band = Math.abs(radius) > 30;
        const lengthScale = band ? Math.hypot(W,H) / Math.hypot(768,432) : sx;
        const angle = radius * Math.PI / 180;
        m.save(); m.translate(x * sx, y * sy); m.rotate(angle);
        const width = w * lengthScale, height = h * (band ? scale : sy);
        m.fillRect(-width / 2, -height / 2, width, height);
        m.restore(); break;
      }
      case 'join': joins.push([x, y, w, h]); break;
    }
  }
  m.save();
  m.globalCompositeOperation = 'source-in';
  mPhoto(m, S, 0, 0, 0, W, H, 1.06 + .013 * Math.sin(t * 1.8));
  m.restore();
  c.drawImage(matte, 0, 0, W, H);
  for (const [x, top, bottom, alpha] of joins) {
    c.fillStyle = 'rgba(10,6,9,' + alpha + ')'; c.fillRect(x * sx, top * sy, sx, (bottom - top) * sy);
  }
  if (t > 16.65) {
    c.save();
    c.globalAlpha *= arReferenceFanEase((t - 16.65) / .62);
    const warm = c.createRadialGradient(W*.51,H*.48,0,W*.51,H*.48,W*.28);
    warm.addColorStop(0,'rgba(255,128,87,' + (.45*Math.sin(Math.PI*mClamp((t-16.65)/1.38))) + ')');
    warm.addColorStop(1,'rgba(255,128,87,0)');
    c.fillStyle = warm; c.fillRect(0,0,W,H);
    c.font = 'italic 900 ' + Math.min(W*.155,H*.26) + 'px Arial, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
    c.fillText('2026', W / 2, H * .49);
    c.restore();
  }
}

