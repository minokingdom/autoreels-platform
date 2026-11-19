import {zipSync, strToU8} from './fflate.mjs';

export function projectSource(scenes) {
  const imports = [['space','spatial'],['time','timeline-author'],['asset','media'],['visual','visual-track'],['film','film'],['html','html-video']];
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
  scenes.forEach((s,i) => {
    lines.push('  <asset:Image id="photo'+i+'" src="./assets/photo'+i+'.jpg"/>');
    if (s.caption) lines.push('  <asset:Image id="caption'+i+'" src="./assets/caption'+i+'.png"/>');
  });
  lines.push('  <visual:Track id="picture" timeline={program.timeline}>');
  scenes.forEach((s,i) => {
    const clip = (name,z) => '    <visual:Clip id="'+name+i+'" image={'+name+i+'} extent={size} during={program.shot'+i+'} frame={full} fit="contain" z="'+z+'"/>';
    lines.push(clip('photo',10));
    if (s.caption) lines.push(clip('caption',20));
  });
  lines.push('  </visual:Track>', '  <film:Film id="main" canvas={canvas.canvas} timeline={program.timeline} appearance={look.film.main}>','    <film:Track source={picture.visual}/>','  </film:Film>','  <html:Video id="final" composition={main.composition} timeline={program.timeline}/>','</svml>');
  return lines.join('\n');
}

export async function projectZip(scenes, draw) {
  const files = {
    'package.json':strToU8("{\n  \"name\": \"autoreelsmaker-remix\",\n  \"private\": true,\n  \"type\": \"module\",\n  \"hypit\": {\n    \"project\": true\n  }\n}"),
    'main.svml':strToU8(projectSource(scenes)),
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
  for (const [i,scene] of scenes.entries()) {
    draw(canvas, i, 'photo');
    await add('assets/photo'+i+'.jpg','image/jpeg');
    if (scene.caption) {
      draw(canvas, i, 'caption');
      await add('assets/caption'+i+'.png','image/png');
    }
  }
  return new Blob([zipSync(files,{level:0})],{type:'application/zip'});
}
