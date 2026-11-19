import {zipSync, strToU8} from './fflate.mjs';

function assetPath(file, index) {
  const suffix = file.name.split('.').pop().toLowerCase();
  return 'assets/video'+index+'.'+(/^[a-z0-9]{1,5}$/.test(suffix) ? suffix : 'mp4');
}

export function projectSource(scenes, media = [], offsetFrames = () => 0) {
  const videos = media.flatMap((item,index)=>item.file ? [{index,file:item.file}] : []);
  const itemAt = i => media[i % media.length];
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
  lines.push('  </time:Timeline>');
  for (const {index,file} of videos) {
    lines.push('  <asset:Video id="source'+index+'" src="./'+assetPath(file,index)+'"/>',
      '  <op:Normalize id="media'+index+'" source={source'+index+'} clock={clock} video="primary-moving" audio="default" span-authority="video"/>');
  }
  function timedClip(i, audio) {
    const index = i % media.length, type = audio ? 'audio' : 'visual';
    const attrs = audio ? 'source={media'+index+'.media}' : 'media={media'+index+'.media} frame={full} fit="cover" z="10"';
    const offset = offsetFrames(i) % Math.max(1,Math.round(media[index].duration*30));
    return '    <'+type+':Clip id="'+type+i+'" '+attrs+' during={program.shot'+i+'}>\n'
      +'      <'+type+':Map target-at="start" source-at="'+(offset ? offset+'f' : 'start')+'" rate="1" wrap-from="start" wrap-until="end"/>\n'
      +'    </'+type+':Clip>';
  }
  scenes.forEach((s,i) => {
    if (!itemAt(i)?.file) lines.push('  <asset:Image id="photo'+i+'" src="./assets/photo'+i+'.jpg"/>');
    if (s.caption) lines.push('  <asset:Image id="caption'+i+'" src="./assets/caption'+i+'.png"/>');
  });
  lines.push('  <visual:Track id="picture" timeline={program.timeline}>');
  scenes.forEach((s,i) => {
    const clip = (name,z) => '    <visual:Clip id="'+name+i+'" image={'+name+i+'} extent={size} during={program.shot'+i+'} frame={full} fit="contain" z="'+z+'"/>';
    lines.push(itemAt(i)?.file ? timedClip(i,false) : clip('photo',10));
    if (s.caption) lines.push(clip('caption',20));
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
    'scenes.json':strToU8(JSON.stringify({fps:30,scenes:scenes.map(({start,end,caption,position,accent})=>({start,end,caption,position,accent}))},null,2))
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
    if (!media[i % media.length]?.file) {
      draw(canvas, i, 'photo');
      await add('assets/photo'+i+'.jpg','image/jpeg');
    }
    if (scene.caption) {
      draw(canvas, i, 'caption');
      await add('assets/caption'+i+'.png','image/png');
    }
  }
  return new Blob([zipSync(files,{level:0})],{type:'application/zip'});
}
