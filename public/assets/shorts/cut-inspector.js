// The timeline owns source ranges. Inspector changes replace a single take so
// that copied cuts, split cuts and the timeline undo stack remain independent.
function openShortsCutInspector() {
  const s = session;
  if (!quickEdit || !s?.clip || !editableEffects() || !window.arCutPanel) return;
  if (byId('mixDialog').open) byId('mixDialog').close();
  video.pause();
  stopJoinedPreview(s);
  s.previewTouched = true;

  const takes = () => sequenceTakes(s);
  const currentIndex = () => currentTake(s)?.i ?? 0;
  function select(i) {
    const cuts = takes();
    if (!cuts[i]) return;
    seekCutTrack(s, sequenceDuration(cuts.slice(0, i)));
  }
  function inheritedText(i) {
    const cut = takes()[i];
    const pos = currentTake(s);
    const firstLine = cut.owner.lines?.find(line => line.text && line.end > cut.start && line.start < cut.end);
    return (pos?.i === i && (activeCue(s, s.trackTime || 0)?.text || activeCaption(cut.owner, pos.sourceTime)))
      || firstLine?.text || '';
  }
  function read(i) {
    const cut = takes()[i];
    return {
      duration: takeDuration(cut),
      maxDuration: ((cut.sourceLimit ?? cut.end) - cut.start) * 16,
      caption: {text: inheritedText(i), ...cut.owner.cutCaption},
      chip: {text: '', ...cut.owner.cutChip}
    };
  }
  function remember(cuts, cursor) {
    (s.trackUndo ||= []).push({cuts: s.timelineCuts, cursor: s.trackTime || 0});
    if (s.trackUndo.length > 50) s.trackUndo.shift();
    s.trackRedo = [];
    s.timelineCuts = cuts;
    s.trackTime = cursor;
    byId('work').classList.add('cut-arranged');
  }
  function replace(i, cut) {
    const cuts = takes().slice();
    const pos = currentTake(s);
    cuts[i] = cut;
    const start = sequenceDuration(cuts.slice(0, pos.i));
    const length = takeDuration(cuts[pos.i]);
    remember(cuts, start + Math.max(0, Math.min((s.trackTime || 0) - pos.offset, length * .9999)));
  }
  function write(i, patch) {
    const original = takes()[i];
    if (!original) return;
    const cut = {...original, owner: {...original.owner}};
    if (Number.isFinite(patch.duration) && patch.duration > 0) {
      // Shorten at the current speed. Lengthening restores the selected source
      // range first and then slows it, keeping neighboring footage out.
      cut.sourceLimit = original.sourceLimit ?? original.end;
      cut.sourceRate = original.sourceRate ?? original.owner.rate ?? 1;
      cut.end = Math.min(cut.sourceLimit, cut.start + patch.duration * cut.sourceRate);
      cut.owner.rate = Math.max(1 / 16, (cut.end - cut.start) / patch.duration);
    }
    if (patch.caption) {
      const caption = {...patch.caption};
      if (original.owner.cutCaption?.text === undefined && caption.text === inheritedText(i)) delete caption.text;
      cut.owner.cutCaption = Object.keys(caption).length ? caption : undefined;
    }
    if (patch.chip) {
      const chip = {...patch.chip};
      if (!chip.text) delete chip.text;
      cut.owner.cutChip = Object.keys(chip).length ? chip : undefined;
    }
    replace(i, cut);
  }
  function order(action, i) {
    const cuts = takes().slice();
    const cut = cuts[i];
    if (!cut) return;
    let target = i;
    if (action === 'copy') {
      const owner = {...cut.owner, lines: (cut.owner.lines || []).map(line => ({...line}))};
      if (owner.cutCaption) owner.cutCaption = {...owner.cutCaption};
      if (owner.cutChip) owner.cutChip = {...owner.cutChip};
      cuts.splice(++target, 0, {...cut, owner});
    } else if (action === 'delete') {
      if (cuts.length < 2) return;
      cuts.splice(i, 1);
      target = Math.min(i, cuts.length - 1);
    } else {
      target = i + (action === 'left' ? -1 : 1);
      if (!cuts[target]) return;
      [cuts[i], cuts[target]] = [cuts[target], cuts[i]];
    }
    remember(cuts, sequenceDuration(cuts.slice(0, target)));
  }
  function changeVisual(i, attributes) {
    const cut = takes()[i];
    replace(i, {...cut, owner: {...cut.owner, ...attributes}});
    mixChanged(s);
  }
  function pickPhoto(i) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      const cut = takes()[i], image = new Image(), url = URL.createObjectURL(file);
      try {
        image.src = url;
        await image.decode();
        if (session === s && editableEffects() && takes()[i]?.url === cut.url) {
          changeVisual(i, {cutPhoto: image});
        }
      } catch {
        if (session === s) showMixHint('사진을 열 수 없어요. 다른 사진을 선택해 주세요.');
      } finally { URL.revokeObjectURL(url); }
    };
    input.click();
  }
  function tools(tab, i) {
    if (tab === 'photo') return [
      {label: '이 컷에 사진 넣기', run: () => pickPhoto(i)},
      {label: '원본 영상으로 복원', disabled: !takes()[i].owner.cutPhoto, run: () => changeVisual(i, {cutPhoto: null})},
      {label: '영상 교체', run: () => byId('mixReplace').click()},
      {label: '영상 추가', run: () => byId('joinFiles').click()},
      {label: '재생 속도', run: () => pickSpeed(s)},
      {label: '타임라인 세부 편집', run: () => showTools('editSettings')}
    ];
    if (tab === 'transition') return [
      {label: '컷 사이 전환 선택', run: () => openCutPicker(s, cutBoundaries(s)[Math.max(0, i - 1)])}
    ];
    if (tab === 'deco') return [
      {label: '따뜻한 필름', run: () => changeVisual(i, {cutLook: 'warm'})},
      {label: '흑백', run: () => changeVisual(i, {cutLook: 'mono'})},
      {label: '색감 해제', run: () => changeVisual(i, {cutLook: ''})},
      {label: '필름 프레임', run: () => changeVisual(i, {cutFrame: 'film'})},
      {label: '프레임 해제', run: () => changeVisual(i, {cutFrame: ''})}
    ];
    return [];
  }
  window.arCutPanel.open({
    unit: '컷', count: () => takes().length, index: currentIndex, select, read, write, order, tools,
    changed: () => mixChanged(s)
  });
}

function paintShortsCutTitles(ctx, clip, text, cue, outputTime) {
  const caption = clip.cutCaption;
  const chip = clip.cutChip;
  const showCaptions = !!cue || clip.showCaptions;
  if (!caption && !chip) {
    drawTitles(ctx, cue ? {...clip, showCaptions} : clip, text, cue);
    return;
  }
  const offset = trackPosition(sequenceTakes(session), outputTime)?.offset || 0;
  const elapsed = Math.max(0, outputTime - offset);
  drawTitles(ctx, {...clip, showCaptions}, caption ? '' : text, cue);
  if (caption && (showCaptions || caption.text !== undefined)) {
    window.arCutPanel.paint(ctx, {text, ...caption}, .73, elapsed);
  }
  if (chip) window.arCutPanel.paint(ctx, chip, .87, elapsed);
}
