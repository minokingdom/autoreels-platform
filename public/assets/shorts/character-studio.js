(()=>{
  if(!quickEdit || new URLSearchParams(location.search).get('story')!=='1')return;
  const dialog=byId('storyMaker'),preview=byId('storyPreview'),status=byId('storyStatus'),form=byId('storyForm'),cuts=byId('storyCuts');
  const actions={enter:'등장',notice:'손짓',offer:'건네기',surprise:'깜짝 놀람',celebrate:'기뻐하기',think:'고개 기울이기'};
  let scenes=[],selected=0,topic='',style='',pending,editorSession;
  const editButton=document.createElement('button');
  editButton.type='button';editButton.textContent='장면 수정';editButton.hidden=true;
  byId('mixPublish').before(editButton);
  for(const [value,label] of Object.entries(actions))byId('storyAction').add(new Option(label,value));
  function busy(on) {
    for(const control of dialog.querySelectorAll('button:not(#storyBack),input,textarea,select'))control.disabled=on;
    dialog.setAttribute('aria-busy',String(on));
  }
  async function request(body,signal) {
    const response=await fetch('/api/generate-script',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal});
    if(!response.ok){
      const error=await response.json().catch(()=>({}));
      throw Error(response.status===401?'스튜디오에서 로그인한 뒤 다시 열어 주세요.':error.message || '장면을 만들지 못했어요. 다시 시도해 주세요.');
    }
    return response;
  }
  function showScene(i,play=false){
    selected=i;const scene=scenes[i];
    preview.pause();preview.src=scene.url;preview.currentTime=0;
    byId('storyLine').value=scene.line;byId('storyAction').value=scene.action;
    byId('storySubtitle').textContent=scene.line;byId('storySubtitle').hidden=false;
    const buttons=scenes.map((_,j)=>{
      const b=document.createElement('button');b.type='button';b.textContent=(j+1)+'장면';b.setAttribute('aria-pressed',String(i===j));
      b.onclick=()=>showScene(j,true);return b;
    });
    byId('storySceneNav').replaceChildren(...buttons);if(play)preview.play().catch(()=>{});
  }
  function removeDraft(){
    for(const s of scenes) URL.revokeObjectURL(s.url);
    scenes=[];editorSession=null;editButton.hidden=true;
    preview.pause();preview.removeAttribute('src');preview.load();byId('storySubtitle').hidden=true;
    cuts.hidden=true;form.hidden=false;status.textContent='';
  }
  dialog.addEventListener('close',()=>{pending?.abort();preview.pause();});
  dialog.addEventListener('cancel',event=>{event.preventDefault();byId('storyBack').click();});
  byId('storyBack').onclick=()=>{dialog.close();if(!session?.clip)location.href='/studio';};
  byId('storyNew').onclick=()=>{form.hidden=false;cuts.hidden=true;status.textContent='';};
  editButton.onclick=()=>{
    if(session?.exporting)return;
    if(editorSession===session){
      for(const cue of session.captions || [])if(Number.isInteger(cue.storyIndex)&&scenes[cue.storyIndex])scenes[cue.storyIndex].line=cue.text;
    }
    dialog.showModal();form.hidden=Boolean(scenes.length);cuts.hidden=!scenes.length;if(scenes.length)showScene(selected);
  };
  form.onsubmit=async event=>{
    event.preventDefault();
    const value=byId('storyTopic').value.trim();if(!value || pending)return;
    const chosen=new FormData(form).get('art');
    const controller=pending=new AbortController();busy(true);status.textContent='대본을 쓰고 장면 3개를 영상으로 만드는 중이에요.';
    try{
      const res=await request({mode:'character-plan',topic:value,style:chosen},controller.signal);
      const data=await res.json();controller.signal.throwIfAborted();
      if(data.scenes?.length!==3 || data.videos?.length!==3)throw Error('장면을 모두 받지 못했어요.');
      const next=data.scenes.map((s,i)=>{
        const bytes=Uint8Array.from(atob(data.videos[i]),c=>c.charCodeAt(0));
        const file=new File([bytes],'장면 '+(i+1)+'.mp4',{type:'video/mp4'});
        return {...s,file,url:URL.createObjectURL(file),variant:0};
      });
      removeDraft();scenes=next;topic=value;style=chosen;form.hidden=true;cuts.hidden=false;
      showScene(0,true);status.textContent='';
    }catch(e){if(!controller.signal.aborted)status.textContent=e.message;}
    finally{pending=null;busy(false);}
  };
  byId('storyLine').oninput=e=>{scenes[selected].line=e.target.value;byId('storySubtitle').textContent=e.target.value;};
  byId('storyRedo').onclick=async()=>{
    const s=scenes[selected];if(!s || pending)return;
    const action=byId('storyAction').value,variant=s.variant+1;
    const controller=pending=new AbortController();busy(true);status.textContent=(selected+1)+'장면을 다시 만드는 중이에요.';
    try{
      const res=await request({mode:'character-render',topic,style,scene:{line:s.line || '…',place:s.place,actor:s.actor,action},variant},controller.signal);
      const blob=await res.blob();controller.signal.throwIfAborted();
      const file=new File([blob],s.file.name,{type:'video/mp4'});
      URL.revokeObjectURL(s.url);Object.assign(s,{file,url:URL.createObjectURL(file),variant,action});
      showScene(selected,true);status.textContent='';
    }catch(e){if(!controller.signal.aborted)status.textContent=e.message;}
    finally{pending=null;busy(false);}
  };
  byId('storyEdit').onclick=async()=>{
    if(pending || !scenes.length)return;
    busy(true);preview.pause();
    try {
      if(session!==editorSession || !session){
        await openQuickFiles(scenes.map(s=>s.file));
        if(!session?.clip || session.joined?.length!==scenes.length)throw Error('장면을 모두 열지 못했어요. 다시 눌러 주세요.');
        editorSession=session;let at=0;
        session.captions=scenes.map((s,i)=>{
          const item=session.joined[i];s.appliedVariant=s.variant;item.storyIndex=i;
          const duration=item.clip.end-item.clip.start;const cue={storyIndex:i,start:at,duration,text:s.line};at+=duration;return cue;
        });
      } else {
        stopJoinedPreview(session);video.pause();
        for(const item of session.joined){
          const i=item.storyIndex,s=scenes[i];if(!s)continue;
          const cue=session.captions?.find(c=>c.storyIndex===i);if(cue)cue.text=s.line;
          if(s.appliedVariant===s.variant)continue;
          const old=item.url;item.url=URL.createObjectURL(s.file);
          (session.replacementUrls||=[]).push(old);
          for(const take of session.timelineCuts||[])if(take.url===old)take.url=item.url;
          if(session.url===old){session.url=item.url;session.file=s.file;video.src=item.url;}
          s.appliedVariant=s.variant;
        }
      }
      markEdited();renderJoinedList(session);renderMix(session);seekCutTrack(session,0);editButton.hidden=false;dialog.close();
    } catch(e){status.textContent=e.message;}
    finally{busy(false);}
  };
  byId('back').addEventListener('click',()=>{editorSession=null;editButton.hidden=true;dialog.showModal();});
  byId('storyTitle').textContent='캐릭터 쇼츠';
  document.title='오토릴스메이커 · 캐릭터 쇼츠';
  dialog.showModal();
})();
