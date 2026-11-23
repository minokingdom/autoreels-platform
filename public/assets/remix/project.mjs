import {zipSync, strToU8} from './fflate.mjs';

function assetPath(file, index) {
  const suffix = file.name.split('.').pop().toLowerCase();
  return 'assets/video'+index+'.'+(/^[a-z0-9]{1,5}$/.test(suffix) ? suffix : 'mp4');
}

function mediaIndex(scene,i,media) { return scene.mediaIndex ?? i % media.length; }

function overlayFrames(scene,index) {
  const caption = !!scene.caption && !scene.captionStyle?.hidden;
  const chip = !!scene.chip?.text && !scene.chip.hidden;
  const motion = (caption && ['pop','fade'].includes(scene.captionStyle?.motion)) ||
    (chip && ['pop','fade'].includes(scene.chip?.motion));
  if (!caption && !chip && !scene.decoration && !scene.transition) return [];
  const base = 'caption'+index, length = scene.end-scene.start;
  if (!motion && !scene.transition) return [{id:base,window:'shot'+index,frame:0,length}];
  const intro = Math.min(length,Math.ceil((scene.transition ? .35 : .32)*30));
  const frames = Array.from({length:intro},(_,frame)=>({id:base+'f'+frame,window:'overlay'+index+'f'+frame,frame,length:1}));
  if (length > intro && (caption || chip || scene.decoration)) {
    frames.push({id:base,window:'overlay'+index+'end',frame:intro,length:length-intro});
  }
  return frames;
}

export function projectSource(scenes, media = [], offsetFrames = i => scenes[i].mediaOffset || 0) {
  const videos = media.flatMap((item,index)=>item.file ? [{index,file:item.file}] : []);
  const itemAt = i => media[mediaIndex(scenes[i],i,media)];
  const overlays = scenes.map(overlayFrames);
  const imports = [['space','spatial'],['time','timeline-author'],['asset','media'],['visual','visual-track'],['film','film'],['html','html-video']];
  if (videos.length) imports.push(['op','media-operations'],['audio','audio-track']);
  const lines = ['<?svml using="@hypit/markup@1"?>', '<svml>',
    ...imports.map(([alias,pkg]) => '  <import as="'+alias+'" from="@hypit/'+pkg+'@1"/>'),
    '  <import as="look" source="./look.svs"/>',
    '  <space:Canvas id="canvas" width="1080" height="1920"/>',
    '  <space:Extent id="size" width="1080" height="1920"/>',
    '  <space:Frame id="full" within={canvas.bounds} left="0%" top="0%" right="100%" bottom="100%"/>',
    '  <time:Clock id="clock" frame-rate="30"/>',
    '  <time:Timeline id="program" clock={clock} end="shot'+(scenes.length-1)+'.end">'];
  scenes.forEach((s,i) => lines.push('    <time:Window id="shot'+i+'" from="'+(i ? 'shot'+(i-1)+'.end' : 'start')+'" for="'+(s.end-s.start)+'f"/>'));
  overlays.forEach((frames,i)=>frames.forEach((frame,j)=>{
    if (frame.window === 'shot'+i) return;
    const from = j ? frames[j-1].window+'.end' : (i ? 'shot'+(i-1)+'.end' : 'start');
    lines.push('    <time:Window id="'+frame.window+'" from="'+from+'" for="'+frame.length+'f"/>');
  }));
  lines.push('  </time:Timeline>');
  for (const {index,file} of videos) {
    lines.push('  <asset:Video id="source'+index+'" src="./'+assetPath(file,index)+'"/>',
      '  <op:Normalize id="media'+index+'" source={source'+index+'} clock={clock} video="primary-moving" audio="default" span-authority="video"/>');
  }
  function timedClip(i, audio) {
    const index = mediaIndex(scenes[i],i,media), type = audio ? 'audio' : 'visual';
    const attrs = audio ? 'source={media'+index+'.media}' : 'media={media'+index+'.media} frame={full} fit="cover" z="10"';
    const offset = offsetFrames(i) % Math.max(1,Math.round(media[index].duration*30));
    return '    <'+type+':Clip id="'+type+i+'" '+attrs+' during={program.shot'+i+'}>\n'
      +'      <'+type+':Map target-at="start" source-at="'+(offset ? offset+'f' : 'start')+'" rate="1" wrap-from="start" wrap-until="end"/>\n'
      +'    </'+type+':Clip>';
  }
  scenes.forEach((s,i) => {
    if (!itemAt(i)?.file) lines.push('  <asset:Image id="photo'+i+'" src="./assets/photo'+i+'.jpg"/>');
    for (const frame of overlays[i]) lines.push('  <asset:Image id="'+frame.id+'" src="./assets/'+frame.id+'.png"/>');
  });
  lines.push('  <visual:Track id="picture" timeline={program.timeline}>');
  scenes.forEach((s,i) => {
    const clip = (name,z) => '    <visual:Clip id="'+name+i+'" image={'+name+i+'} extent={size} during={program.shot'+i+'} frame={full} fit="contain" z="'+z+'"/>';
    lines.push(itemAt(i)?.file ? timedClip(i,false) : clip('photo',10));
    for (const frame of overlays[i]) lines.push('    <visual:Clip id="layer'+frame.id+'" image={'+frame.id+'} extent={size} during={program.'+frame.window+'} frame={full} fit="contain" z="20"/>');
  });
  lines.push('  </visual:Track>');
  if (videos.length) {
    lines.push('  <audio:Track id="mix" timeline={program.timeline}>');
    scenes.forEach((s,i)=>{if (itemAt(i)?.file) lines.push(timedClip(i,true));});
    lines.push('  </audio:Track>');
  }
  lines.push('  <film:Film id="main" canvas={canvas.canvas} timeline={program.timeline} appearance={look.film.main}>','    <film:Track source={picture.visual}/>',...(videos.length ? ['    <film:Track source={mix.audio}/>'] : []),'  </film:Film>','  <html:Video id="final" composition={main.composition} timeline={program.timeline}/>','</svml>');
  return lines.join('\n');
}

export async function projectZip(scenes, draw, media = [], offsetFrames) {
  const files = {
    'package.json':strToU8("{\n  \"name\": \"autoreelsmaker-remix\",\n  \"private\": true,\n  \"type\": \"module\",\n  \"hypit\": {\n    \"project\": true\n  }\n}"),
    'main.svml':strToU8(projectSource(scenes,media,offsetFrames)),
    'look.svs':strToU8('<?svml using="@hypit/recipe@1"?>\n<sheet version="1" id="look">\n  film.main { background: #131313; }\n</sheet>'),
    'build.svrun':strToU8('<?svml using="@hypit/markup/run@1"?>\n<svrun version="1"><author source="./main.svml"/><target output="final.video"/></svrun>'),
    'scenes.json':strToU8(JSON.stringify({fps:30,scenes},null,2))
  };
  const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920;
  async function add(path, type) {
    const blob = await new Promise(resolve => canvas.toBlob(resolve,type,.91));
    if (!blob) throw Error('프로젝트 이미지를 만들 수 없어요.');
    files[path] = new Uint8Array(await blob.arrayBuffer());
  }
  for (const [i,item] of media.entries()) {
    if (item.file) files[assetPath(item.file,i)] = new Uint8Array(await item.file.arrayBuffer());
  }
  for (const [i,scene] of scenes.entries()) {
    if (!media[mediaIndex(scene,i,media)]?.file) {
      draw(canvas, i, 'photo');
      await add('assets/photo'+i+'.jpg','image/jpeg');
    }
    for (const frame of overlayFrames(scene,i)) {
      draw(canvas, i, 'caption',frame.frame/30);
      await add('assets/'+frame.id+'.png','image/png');
    }
  }
  return new Blob([zipSync(files,{level:0})],{type:'application/zip'});
}
