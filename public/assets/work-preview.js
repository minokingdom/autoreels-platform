// 원본 작업물을 시트에 표시하고 닫을 때 같은 DOM 위치에 돌려놓는다.
(() => {
  let active;
  function open({title='미리보기', node, trigger=document.activeElement, onOpen, onClose}) {
    if (!(node instanceof Element)) return;
    if (active?.node === node) return active.sheet;
    active?.close();
    const anchor=document.createComment('미리보기 원래 위치');
    if (node.parentNode) node.before(anchor);
    const sheet=document.createElement('dialog');
    sheet.className='ar-work-preview';
    sheet.setAttribute('aria-label',title);
    sheet.innerHTML='<div class="ar-work-preview-head"><span class="ar-work-preview-handle" aria-hidden="true"><span></span></span><div class="ar-work-preview-title"></div><button type="button" class="ar-work-preview-close" aria-label="미리보기 닫기">×</button></div><div class="ar-work-preview-body"></div>';
    sheet.querySelector('.ar-work-preview-title').textContent=title;
    const body=sheet.querySelector('.ar-work-preview-body');
    let restored=false;
    function close() {
      if (restored) return;
      restored=true;
      if (sheet.open) sheet.close();
      if (anchor.parentNode) anchor.replaceWith(node);
      else node.remove();
      sheet.remove();
      active=null;
      if (trigger?.isConnected) trigger.focus({preventScroll:true});
      onClose?.(body);
    }
    sheet.querySelector('.ar-work-preview-close').addEventListener('click',close);
    sheet.addEventListener('cancel',e=>{e.preventDefault();close();});
    sheet.addEventListener('close',close,{once:true});
    sheet.addEventListener('click',e=>{
      if(e.target!==sheet)return;
      const r=sheet.getBoundingClientRect();
      if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();
    });
    body.append(node);document.body.append(sheet);
    active={sheet,node,close};
    try {sheet.showModal();onOpen?.(body);}
    catch(error){close();throw error;}
    return sheet;
  }
  window.arWorkPreview={open,close:()=>active?.close()};
})();
