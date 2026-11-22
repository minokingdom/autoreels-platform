const postPanel = byId('quickPublish'), postButton = byId('postVideo'), postTarget = byId('postTarget');
const postStatus = byId('postStatus'), postCaption = byId('postCaption');
const postNames = {instagram:'인스타그램',facebook:'페이스북',youtube:'유튜브',tiktok:'틱톡',threads:'스레드'};

async function openEditorPublish(s) {
  postCaption.disabled=postTarget.disabled=false;
  postPanel.hidden=false; postTarget.replaceChildren(); postCaption.value='';
  postStatus.textContent='연결된 계정 확인 중…'; postButton.disabled=true; postButton.textContent='SNS에 발행';
  try {
    const result=await arSnsApi('status');
    if(session!==s) return;
    if(!result.ok) throw Error(result.body.message || '스튜디오에서 로그인한 뒤 연결 계정을 확인해 주세요.');
    s.postAccounts=result.body.targets || {};
    for(const [key,name] of Object.entries(postNames)) {
      const account=result.body.targets?.[key];
      if(account?.ready && account.connected) postTarget.add(new Option(name+' · '+account.name,key));
    }
    postButton.disabled=!postTarget.value;
    postButton.textContent=postTarget.value ? postNames[postTarget.value]+'에 발행' : 'SNS에 발행';
    postStatus.textContent=postTarget.value ? '' : '스튜디오 발행 탭에서 SNS 계정을 연결해 주세요.';
  } catch(error) { if(session===s) postStatus.textContent=error.message; }
}

postTarget.addEventListener('change',()=>{postButton.textContent=postNames[postTarget.value]+'에 발행';});
function clearEditorPost(s) {
  if (!s || s.postBusy || !s.post) return;
  s.post=null; postButton.disabled=!postTarget.value;
  postCaption.disabled=postTarget.disabled=false;
  postStatus.textContent=''; postButton.textContent=postNames[postTarget.value]+'에 발행';
}

postButton.addEventListener('click',async()=>{
  const s=session, target=postTarget.value;
  if(!s?.clip || !target || s.postBusy) return;
  if(s.exporting || s.adding || save.disabled) {postStatus.textContent='영상 준비가 끝난 뒤 발행해 주세요.';return;}
  s.postBusy=true; byId('work').inert=true; postButton.disabled=true;
  try {
    const draft=s.post ||= {requestId:crypto.randomUUID(),target,caption:postCaption.value,title:s.clip.title||''};
    if (!draft.url) {
      const current=(await arSnsApi('status')).body.targets?.[target];
      if(!current?.ready || !current.connected || current.name!==s.postAccounts?.[target]?.name) throw Error('연결된 발행 계정이 변경됐어요. 스튜디오에서 계정을 확인해 주세요.');
      postStatus.textContent='발행할 MP4를 준비하고 있어요.';
      const blob=s.saved ? await fetch(s.saved).then(r=>r.blob()) : await exportShortClip(true);
      if(!blob || session!==s) throw Error(statusLine.textContent || '영상 준비를 마치지 못했어요.');
      postStatus.textContent='영상 업로드 중…';
      draft.url=await arUploadSnsVideo(blob,pct=>{if(session===s)postStatus.textContent='영상 업로드 중 · '+pct+'%';});
    }
    if(session!==s) return;
    postTarget.disabled=postCaption.disabled=true;
    postStatus.textContent=postNames[draft.target]+'에 발행 중…';
    const response=draft.job ? await arSnsApi('jobs',{ids:[draft.job.id]}) :
      await arSnsApi('publish',{targets:[draft.target],videoUrl:draft.url,title:draft.title,caption:draft.caption,requestId:draft.requestId});
    if(session!==s) return;
    if (response.body.jobs?.[0]) draft.job=response.body.jobs[0];
    if(!response.ok && !draft.job) throw Error(response.body.message || '발행 결과를 확인하지 못했어요. 다시 눌러 확인해 주세요.');
    for(let i=0;i<12 && ['pending','processing'].includes(draft.job?.status);i++) {
      await new Promise(resolve=>setTimeout(resolve,2500));
      if(session!==s) return;
      const next=await arSnsApi('jobs',{ids:[draft.job.id]});
      if(!next.ok || !next.body.jobs?.length) break;
      draft.job=next.body.jobs[0];
    }
    if(session!==s) return;
    const job=draft.job;
    if(!job) throw Error('발행 결과를 다시 확인해 주세요.');
    const name=postNames[draft.target];
    if(job.status==='done') postStatus.textContent=name+' · '+(job.note || (draft.target==='tiktok'?'틱톡 알림함에서 게시를 마무리해 주세요.':'게시 완료'));
    else if(job.status==='failed') postStatus.textContent=job.error || '게시하지 못했어요. 발행 기록을 확인해 주세요.';
    else if(job.status==='review') postStatus.textContent='게시 여부 확인이 필요해요. 스튜디오 발행 기록을 확인해 주세요.';
    else postStatus.textContent='아직 처리 중이에요. 발행 상태를 다시 확인할 수 있어요.';
    if(job.status==='done' && job.url && /^https:\/\//i.test(job.url)) {
      const link=document.createElement('a'); link.href=job.url;link.target='_blank';link.rel='noopener';link.textContent='게시물 보기';
      postStatus.append(' · ',link);
    }
    postButton.textContent=job.status==='done'?'게시 완료':'발행 상태 확인';
    statusLine.textContent=postStatus.textContent;
  } catch(error) {
    if(session===s) {
      postStatus.textContent=error.message || '발행 결과를 확인하지 못했어요.';
      if(!s.post?.url) s.post=null;
      else postButton.textContent='발행 상태 확인';
    }
  } finally {
    byId('work').inert=false; s.postBusy=false;
    if(session===s) postButton.disabled=['done','failed','review'].includes(s.post?.job?.status);
  }
});
