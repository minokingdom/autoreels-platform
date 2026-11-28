'use strict';
// 외부 분석 결과는 코드가 아닌 제한된 스타일 데이터로만 받습니다.
const ENUMS = {
  category: ['감성','브이로그','타이포','고급','카드뉴스','스포츠','신뢰','재미','테크'],
  layout: ['full','inset','polaroid','diagonal','diagonal-fan','photo-montage','beat-mask','travel-shutter','fold-postcard','magazine-turn','mono-teaser','runway-lookbook','diamond-reveal','type-cutout','stacked','type-echo','type-flow','editorial','news-marker','floating-type','type-rail','repeat-poster','chevron-type','brush-frame'],
  font: ['pretM','pretL','maru','maruL','pen','dohyeon'],
  captionPosition: ['top','middle','bottom'],
  textMotion: ['fade','rise','mask','focus'],
  camera: ['still','zoom-in','zoom-out','pan-left','pan-right'],
  transition: ['cut','fade'],
};
function validateStyle(value) {
  if (!value || typeof value !== 'object') throw Error('invalid_style');
  const out = {};
  for (const [k, values] of Object.entries(ENUMS)) {
    if (!values.includes(value[k]) && !(k==='layout'&&value[k]==='custom')) throw Error('invalid_' + k);
    out[k] = value[k];
  }
  if(out.layout==='custom') {
    if(!/^arCustom_[a-f0-9]{16}$/.test(value.renderer||''))throw Error('invalid_renderer');
    out.renderer=value.renderer;
  }
  for (const k of ['name','summary']) {
    if (typeof value[k] !== 'string' || !value[k].trim() || value[k].length > (k === 'name' ? 24 : 400) || /[<>\x00-\x1f]/.test(value[k])) throw Error('invalid_' + k);
    out[k] = value[k].trim();
  }
  for (const k of ['background','foreground','accent']) {
    if (!/^#[0-9a-f]{6}$/i.test(value[k] || '')) throw Error('invalid_' + k);
    out[k] = value[k];
  }
  const ranges = {captionSize:[0.045,0.085],zoom:[0,0.12],shade:[0,0.8],grain:[0,0.12],entrySeconds:[0.15,0.8]};
  for (const [k,[min,max]] of Object.entries(ranges)) {
    if (!Number.isFinite(value[k]) || value[k]<min || value[k]>max) throw Error('invalid_' + k);
    out[k]=value[k];
  }
  if (value.effects !== undefined) {
    if (!Array.isArray(value.effects) || value.effects.length > 12) throw Error('invalid_effects');
    out.effects = value.effects.map(effect => {
      if (!effect || !['flash','zoom','echo'].includes(effect.kind) ||
          !Number.isFinite(effect.duration) || effect.duration < .05 || effect.duration > 8 ||
          !Number.isFinite(effect.strength) || effect.strength < 0 || effect.strength > 1) throw Error('invalid_effect');
      return {kind:effect.kind,duration:effect.duration,strength:effect.strength};
    });
  }
  return out;
}
function validateCatalog(value) {
  if (!Array.isArray(value) || value.length > 200) throw Error('invalid_catalog');
  const seen = new Set();
  return value.map(row => {
    if (!/^ref_[a-f0-9]{16}$/.test(row.id || '') || seen.has(row.id)) throw Error('invalid_style_id');
    seen.add(row.id);
    const out = {id:row.id,...validateStyle(row)};
    if (row.addedAt !== undefined) {
      if (typeof row.addedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(row.addedAt) || !Number.isFinite(Date.parse(row.addedAt))) throw Error('invalid_addedAt');
      out.addedAt = new Date(row.addedAt).toISOString();
    }
    return out;
  });
}
module.exports = {ENUMS,validateStyle,validateCatalog};
