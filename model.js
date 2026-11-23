(function (root) {
  'use strict';
  const breads = [{id:'tradicional',name:'Tradicional',price:1800},{id:'brioche',name:'Brioche',price:2500}];
  const ingredients = [
    ['molho','Molho de tomate Hot Dog','Tomate, cebola e pimentão'],
    ['ervilha','Ervilha'],['milho','Milho'],['passas','Passas'],['ovo','Ovo de codorna'],
    ['maionese','Maionese'],['ketchup','Ketchup'],['mostarda','Mostarda'],['queijo','Queijo ralado'],['batata','Batata palha']
  ].map(([id,name,description])=>({id,name,description}));
  const sauces = [{id:'mel',name:'Mostarda com mel'},{id:'goiabada',name:'Ketchup com goiabada'}];
  const key = 'cachorrao-banka-lista-v1';
  const id = () => root.crypto?.randomUUID?.() || `lanche-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  function createItem(index,bread='tradicional') {return {id:id(),name:`Pessoa ${index}`,bread,ingredients:[],sauces:[],checked:false};}
  function updateItem(item,patch) {return {...item,...patch,id:item.id,ingredients:[...(patch.ingredients||item.ingredients)],sauces:[...(patch.sauces||item.sauces)],checked:false};}
  function duplicateItem(item) {return {...updateItem(item,{}),id:id(),name:`${item.name} (cópia)`.slice(0,60)};}
  function subtotal(items) {return items.reduce((sum,item)=>sum+(breads.find(b=>b.id===item.bread)?.price||0),0);}
  function decode(raw) {
    try {
      const parsed = JSON.parse(raw);
      if(parsed?.version!==1 || !Array.isArray(parsed.items)) return [];
      const seen = new Set();
      return parsed.items.filter(item=> {
        if(!item || typeof item.id!=='string' || !item.id || seen.has(item.id) || typeof item.name!=='string' || !breads.some(b=>b.id===item.bread) || !Array.isArray(item.ingredients) || !Array.isArray(item.sauces)) return false;
        seen.add(item.id); return true;
      }).map((item,index)=>({id:item.id,name:item.name.trim().slice(0,60)||`Pessoa ${index+1}`,bread:item.bread,
        ingredients:[...new Set(item.ingredients.filter(v=>ingredients.some(i=>i.id===v)))],
        sauces:[...new Set(item.sauces.filter(v=>sauces.some(s=>s.id===v)))],checked:item.checked===true}));
    } catch {return [];}
  }
  function save(storage,items) {try {storage.setItem(key,JSON.stringify({version:1,items})); return true;} catch {return false;}}
  function load(storage) {try {return {items:decode(storage.getItem(key)),available:true};} catch {return {items:[],available:false};}}
  const api={breads,ingredients,sauces,createItem,updateItem,duplicateItem,subtotal,decode,save,load};
  if(typeof module!=='undefined' && module.exports) module.exports=api;
  else root.MenuModel=api;
})(globalThis);
