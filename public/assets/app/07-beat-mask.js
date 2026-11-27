// Vector motion for the approved nine-scene composition. The studio owns cut lengths and media.
const AR_BEAT_BOUNDARIES = [0, 1, 2.917, 4.85, 6.767, 8.667, 10.617, 12.567, 14.45, 18.4];
const AR_BEAT_ARGS = { rect:4, capsule:5, circle:3, title:1, join:4, underlay:1, full:0 };
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

// 사진 마스크와 엔딩 제목은 편집기의 현재 컷 문구를 사용합니다.
function arBeatTitle(c, W, H, text, font, scale) {
  const fit = arReferenceFit(c, text, W * .86, H * .46, W * .22, font, 3);
  c.save();
  c.translate(W / 2, H * .49);
  c.scale(scale, scale);
  c.font = gFont(900, fit.size, (KIT_FONTS[font] || KIT_FONTS.sans).f);
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  fit.lines.forEach((line, i) => {
    c.fillText(line, 0, (i - (fit.lines.length - 1) / 2) * fit.lh, W * .86);
  });
  c.restore();
}

// 하나의 바깥 윤곽을 먼저 그립니다. 내부 패널의 등장 순서가 경계를 꺾지 않게 합니다.
function arBeatDiagonalBand(t, W, H) {
  let start, expand, end, degrees, panels;
  if (t >= 3.397 && t < 4.85) {
    start = 3.397; expand = 3.86; end = 4.76; degrees = -14; panels = 4;
  } else if (t >= 5.33 && t < 6.767) {
    start = 5.33; expand = 5.78; end = 6.65; degrees = 14; panels = 4;
  } else if (t >= 7.21 && t < 8.667) {
    start = 7.21; expand = 7.73; end = 8.43; degrees = -48; panels = 1;
  } else {
    return null;
  }
  const angle = degrees * Math.PI / 180;
  const cos = Math.abs(Math.cos(angle)), sin = Math.abs(Math.sin(angle));
  const enter = arReferenceFanEase((t - start) / .17);
  const open = arReferenceFanEase((t - expand) / (end - expand));
  const diameter = (panels === 1 ? 168 : 214) * Math.min(W / 768, H / 432);
  const span = W * cos + H * sin + 4;
  const depth = W * sin + H * cos + 4;
  const thickness = diameter * (1 - enter) + Math.min(W * .39, H * .42) * enter;
  return {
    angle, panels, enter, open,
    width: diameter + (span - diameter) * enter,
    height: thickness + (depth - thickness) * open,
    radius: diameter * .5 * (1 - enter),
    y: H * (.5 - (panels === 1 ? (1 - enter) * 6 / 432 : 0))
  };
}

function arBeatMaskFrame(c, W, H, S, cut, count, progress, caption, font) {
  const t = arBeatTime(cut, count, progress);
  const band = arBeatDiagonalBand(t, W, H);
  const [shapes, values] = band ? [[], []] : arBeatPose(Math.min(551, t * 30));
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
  if (band) {
    m.save();
    m.translate(W / 2, band.y);
    m.rotate(band.angle);
    m.beginPath();
    m.roundRect(-band.width / 2, -band.height / 2, band.width, band.height, band.radius);
    m.fill();
    m.restore();
  }
  let offset = 0;
  for (const shape of shapes) {
    const [x, y, w, h, radius] = values.slice(offset, offset + AR_BEAT_ARGS[shape]);
    offset += AR_BEAT_ARGS[shape];
    m.beginPath();
    switch (shape) {
      case 'full': m.fillRect(0, 0, W, H); break;
      case 'underlay': m.globalAlpha = x; m.fillRect(0, 0, W, H); m.globalAlpha = 1; break;
      case 'rect': m.fillRect(x * sx, y * sy, w * sx, h * sy); break;
      case 'title':
        if (caption) {
          m.save();
          m.rect(0, 0, W * arReferenceFanEase(t / .72), H);
          m.clip();
          arBeatTitle(m, W, H, caption, font, x);
          m.restore();
        } else {
          m.fillRect(0, 0, W, H);
        }
        break;
      case 'circle': m.arc(x * sx, y * sy, w * scale, 0, Math.PI * 2); m.fill(); break;
      case 'capsule':
        m.roundRect((x - w / 2) * sx, (y - h / 2) * sy, w * sx, h * sy, Math.min(w * sx / 2, h * sy / 2, radius * scale));
        m.fill(); break;
      case 'join': joins.push([x, y, w, h]); break;
    }
  }
  m.save();
  m.globalCompositeOperation = 'source-in';
  mPhoto(m, S, 0, 0, 0, W, H, 1.06 + .013 * Math.sin(t * 1.8));
  m.restore();
  if (band && band.panels > 1 && band.enter > 0 && band.open < 1) {
    m.save();
    m.globalCompositeOperation = 'source-atop';
    m.fillStyle = '#000';
    for (let i = 0; i < band.panels; i++) {
      const shown = arReferenceFanEase((band.open * 1.55 - i * .16) / .5);
      m.globalAlpha = .16 * (1 - shown) * band.enter;
      const left = i * W / band.panels;
      m.fillRect(left, 0, W / band.panels, H);
    }
    m.restore();
  }
  c.save();
  c.imageSmoothingEnabled = true;
  c.imageSmoothingQuality = 'high';
  c.drawImage(matte, 0, 0, W, H);
  c.restore();
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
    if (caption) {
      c.fillStyle = '#fff';
      arBeatTitle(c, W, H, caption, font, 1);
    }
    c.restore();
  }
  return Boolean(caption) && (t < 1 || t > 16.65);
}
