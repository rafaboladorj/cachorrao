(() => {
  'use strict';
  const M=window.MenuModel;
  const $=id=>document.getElementById(id);
  const money=value=>(value/100).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  const el=(tag,className,text)=>{const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n;};
  let storage; try{storage=window.localStorage;}catch{}
  const initial=M.load(storage);
  let items=initial.items, storageAvailable=initial.available, editingId=null, defaultName='', removed=null, toastTimer;
  function storageNote(){ $('storage-note').textContent=storageAvailable?'Salva só neste navegador. Você pode apagar quando quiser.':'Não foi possível salvar neste navegador. Sua lista fica disponível apenas nesta sessão.'; $('storage-note').classList.toggle('warning',!storageAvailable); }
  let lastSnapshot=JSON.stringify(initial.items);
  function focusItem(id){const card=[...document.querySelectorAll('.list-item')].find(c=>c.dataset.itemId===id);(card?.querySelector('.item-actions button')||document.querySelector('#list-items button'))?.focus();}
  function syncExternal(current){items=current.items;lastSnapshot=JSON.stringify(items);removed=null;if($('editor').open)$('editor').close();if($('confirm-clear').open)$('confirm-clear').close();renderList();focusItem(items[0]?.id);notice('Lista atualizada em outra aba. Confira as escolhas antes de editar.');}
  function persist(){
    const current=M.load(storage);
    if(current.available && JSON.stringify(current.items)!==lastSnapshot){syncExternal(current);setTimeout(()=>notice('A lista mudou em outra aba. Sua ação não foi aplicada; confira e tente novamente.'),0);return false;}
    storageAvailable=M.save(storage,items);if(storageAvailable)lastSnapshot=JSON.stringify(items);storageNote();return true;
  }
  window.addEventListener('storage',event=>{if(event.key===null || event.key==='cachorrao-banka-lista-v1'){const current=M.load(storage);if(current.available && JSON.stringify(current.items)!==lastSnapshot)syncExternal(current);}});
  function notice(message,undo=false){clearTimeout(toastTimer);$('toast-message').textContent=message;$('undo').hidden=!undo;$('toast').hidden=false;if(!undo)toastTimer=setTimeout(()=>$('toast').hidden=true,5500);}
  $('dismiss-toast').addEventListener('click',()=>{$('toast').hidden=true;removed=null;});
  $('undo').addEventListener('click',()=>{if(!removed)return;const restoredId=removed.item.id;items.splice(Math.min(removed.index,items.length),0,removed.item);removed=null;persist();renderList();notice('Lanche restaurado.');focusItem(restoredId);});
  function action(text,handler,label){const b=el('button','',text);b.type='button';if(label)b.setAttribute('aria-label',label);b.addEventListener('click',handler);return b;}
  function renderList(){
    $('nav-count').textContent=items.length;$('list-count').textContent=items.length;$('list-footer').hidden=!items.length;
    const container=$('list-items');container.replaceChildren();
    if(!items.length){const empty=el('div','empty-list');empty.append(el('div','empty-icon','＋'),el('h3','','Todo mundo tem um favorito.'),el('p','','Comece pelo primeiro lanche e deixe cada combinação com a cara de quem vai comer.'));const b=action('Montar o primeiro lanche',()=>openEditor());b.className='button secondary full';empty.append(b,el('p','list-disclaimer','Uma lista para conferir. Nenhum pedido é enviado.'));container.append(empty);return;}
    for(const item of items){
      const card=el('article',`list-item${item.checked?' is-checked':''}`);card.dataset.itemId=item.id;const heading=el('div','item-heading');const title=el('h3','',item.name);heading.append(title,el('strong','',money(M.subtotal([item]))));
      const bread=M.breads.find(b=>b.id===item.bread);card.append(heading,el('p','item-bread',`Cachorrão ${bread.name.toLowerCase()}`));
      card.append(el('p','item-ingredients',item.ingredients.length?item.ingredients.map(id=>M.ingredients.find(i=>i.id===id).name).join(' • '):'Nenhum ingrediente selecionado'));
      card.append(el('p','item-sauces',item.sauces.length?`Molhos: ${item.sauces.map(id=>M.sauces.find(s=>s.id===id).name).join(' e ')}`:'Sem molhos especiais'));
      const actions=el('div','item-actions');actions.append(action('Editar',()=>openEditor(item.bread,item),`Editar lanche de ${item.name}`),action('Duplicar',()=>{const copy=M.duplicateItem(item);items.splice(items.indexOf(item)+1,0,copy);persist();renderList();notice('Lanche duplicado. Edite o nome e as escolhas da cópia.');focusItem(copy.id);},`Duplicar lanche de ${item.name}`),action('Remover',()=>{const index=items.indexOf(item);removed={item,index};items.splice(index,1);const applied=persist();renderList();if(applied){notice('Lanche removido da lista.',true);$('undo').focus();}},`Remover lanche de ${item.name}`));card.append(actions);
      const label=el('label','check-done');const check=el('input');check.type='checkbox';check.checked=item.checked;check.setAttribute('aria-label',`Conferido: ${item.name}`);check.addEventListener('change',()=>{item.checked=check.checked;card.classList.toggle('is-checked',check.checked);persist();});label.append(check,document.createTextNode('Conferido na hora de montar'));card.append(label);container.append(card);
    }
    $('subtotal').textContent=money(M.subtotal(items));
  }
  const editor=$('editor');
  function toggleModalClass(){document.body.classList.toggle('modal-open',!!document.querySelector('dialog[open]'));}
  function openEditor(bread='tradicional',item=null){
    editingId=item?.id||null;defaultName=item?.name||`Pessoa ${items.length+1}`;
    $('editor-title').textContent=item?'Edite seu Cachorrão':'Monte seu Cachorrão';$('save-item').textContent=item?'Salvar alterações':'Adicionar à lista';
    $('editor-form').reset();$('person-name').value=item?item.name:'';$('person-name').placeholder=`Nome ou apelido (ex.: ${defaultName})`;
    document.querySelectorAll('[name="bread"]').forEach(input=>input.checked=input.value===bread);
    document.querySelectorAll('[name="ingredient"]').forEach(input=>input.checked=!!item?.ingredients.includes(input.value));
    document.querySelectorAll('[name="sauce"]').forEach(input=>input.checked=!!item?.sauces.includes(input.value));
    updatePrice();editor.showModal();toggleModalClass();$('person-name').focus();editor.querySelector('.dialog-content').scrollTop=0;
  }
  function updatePrice(){const bread=document.querySelector('[name="bread"]:checked')?.value||'tradicional';$('editor-price').textContent=money(M.breads.find(b=>b.id===bread).price);}
  $('close-editor').addEventListener('click',()=>editor.close());editor.addEventListener('close',toggleModalClass);
  $('editor-form').addEventListener('submit',event=>{
    event.preventDefault();const form=new FormData(event.currentTarget);const original=items.find(i=>i.id===editingId)||M.createItem(items.length+1);
    const updated=M.updateItem(original,{name:String(form.get('person')||'').trim()||defaultName,bread:form.get('bread'),ingredients:form.getAll('ingredient'),sauces:form.getAll('sauce')});
    if(editingId)items=items.map(i=>i.id===editingId?updated:i);else items.push(updated);
    persist();renderList();editor.close();focusItem(updated.id);notice(editingId?'Alterações salvas. Confira novamente este lanche.':'Lanche adicionado à sua lista.');
  });
  for(const bread of M.breads){const label=el('label','bread-option');const input=el('input');input.type='radio';input.name='bread';input.value=bread.id;input.required=true;input.addEventListener('change',updatePrice);label.append(input,el('span','',bread.name),el('strong','',money(bread.price)));$('bread-options').append(label);}
  function checks(options,name,target){for(const option of options){const label=el('label','check-option');const input=el('input');input.type='checkbox';input.name=name;input.value=option.id;const text=el('span','',option.name);if(option.description)text.append(el('small','',option.description));label.append(input,text);$(target).append(label);}}
  checks(M.ingredients,'ingredient','ingredient-options');checks(M.sauces,'sauce','sauce-options');
  M.ingredients.forEach(i=>$('available-ingredients').append(el('span','',i.name)));
  $('select-all').addEventListener('click',()=>document.querySelectorAll('[name="ingredient"]').forEach(i=>i.checked=true));
  $('select-none').addEventListener('click',()=>document.querySelectorAll('[name="ingredient"]').forEach(i=>i.checked=false));
  document.querySelectorAll('[data-new]').forEach(button=>button.addEventListener('click',()=>openEditor(button.dataset.new||'tradicional')));
  const clear=$('confirm-clear');$('clear-list').addEventListener('click',()=>{clear.showModal();toggleModalClass();$('cancel-clear').focus();});$('cancel-clear').addEventListener('click',()=>clear.close());clear.addEventListener('close',toggleModalClass);
  $('confirm-clear-button').addEventListener('click',()=>{items=[];removed=null;persist();renderList();clear.close();focusItem();notice('Lista apagada.');});
  const tabs=[...document.querySelectorAll('[data-tab]')];
  function activateTab(tab){for(const t of tabs){const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;$(`panel-${t.dataset.tab}`).hidden=!active;}}
  tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>activateTab(tab));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(index+1)%tabs.length;if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();activateTab(tabs[next]);tabs[next].focus();}});});
  function catalog(target,rows){for(const [name,price,description] of rows){const row=el('article','catalog-row'),copy=el('div');copy.append(el('h3','',name));if(description)copy.append(el('p','',description));row.append(copy,el('strong','',money(price)));$(target).append(row);}}
  catalog('drinks', [['Refrigerante em lata',700],['Limoneto',900],['Garacamp',300],['Água sem gás',300],['Água com gás',300]]);
  catalog('icecreams', [
    ['Almond',1600,'Baunilha ou chocolate, com cobertura de chocolate e amêndoas'],['Choco Meets Oats',1500,'Baunilha, chocolate crocante e aveia'],['Histeria',1400,'Baunilha ou pêssego, em camadas com chocolate'],['Bingo Cookies Cone',1100,'Sorvete de baunilha'],['Chocolate Crispy',1000,'Baunilha com duas camadas de chocolate crocante'],['Crispy Balls Cookies & Cream',1000,'Baunilha, biscoito e bolinhas crocantes'],['Crispy Balls',1000,'Chocolate maltado com bolinhas crocantes'],['Strawberry Crispy',900,'Baunilha e morango, com chocolate branco e Red Velvet'],['Coffee Crispy',900,'Café com cobertura de chocolate e amendoim'],['Taro Crispy',900,'Taro com cobertura de chocolate e amendoim'],['Sweet Corn',900,'Picolé cremoso de milho com casquinha crocante'],['Milk Melon',700,'Picolé cremoso de melão'],['Sundae',700,'Chocolate ou morango'],['Frutyroll',700,'Picolé com mix de frutas'],['Jeruk',600,'Laranja'],['Fruitaice',600,'Limão, maracujá, uva ou coco ao leite'],['Nanas',600,'Abacaxi']
  ]);
  storageNote();renderList();
})();
