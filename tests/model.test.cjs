const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../model.js');

test('dois lanches e uma cópia mantêm escolhas independentes', () => {
  const ana = M.updateItem(M.createItem(1), {name:'Ana', ingredients:['milho'], sauces:['mel']});
  const bia = M.updateItem(M.createItem(2,'brioche'), {name:'Bia', ingredients:['ervilha']});
  const copy = M.duplicateItem(ana);
  copy.ingredients.push('passas');
  copy.sauces.length = 0;
  assert.deepEqual(ana.ingredients,['milho']);
  assert.deepEqual(ana.sauces,['mel']);
  assert.deepEqual(bia.ingredients,['ervilha']);
  assert.notEqual(copy.id,ana.id);
  assert.equal(M.subtotal([ana,bia]),4300);
  assert.equal(M.subtotal([ana]),1800);
  assert.equal(M.subtotal([]),0);
});
test('editar ou duplicar invalida conferência e preserva original', () => {
  const item = {...M.createItem(1),checked:true};
  const edited = M.updateItem(item,{bread:'brioche'});
  assert.equal(edited.checked,false);
  assert.equal(item.checked,true);
  assert.equal(M.duplicateItem(item).checked,false);
  assert.equal(M.subtotal([edited]),2500);
});
test('persistência recupera escolhas e descarta entradas inválidas', () => {
  const item = M.updateItem(M.createItem(1),{name:'<Ana & Bia>',ingredients:['milho'],sauces:['mel']});
  const data = new Map();
  const storage = {setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)};
  assert.equal(M.save(storage,[item]),true);
  assert.deepEqual(M.load(storage).items,[item]);
  assert.equal(M.load(storage).available,true);
  assert.deepEqual(M.decode('{broken'),[]);
  assert.deepEqual(M.decode('{"version":1,"items":[null,{},3]}'),[]);
  const restored=M.decode(JSON.stringify({version:1,items:[item,{...item,id:'second',bread:'fake'}, {...item,id:'third',ingredients:['unknown','milho','milho']}]}));
  assert.equal(restored.length,2);
  assert.deepEqual(restored[1].ingredients,['milho']);
  assert.equal(M.decode(JSON.stringify({version:1,items:[item,item]})).length,1);
});
test('armazenamento bloqueado permite manter os dados em memória', () => {
  const storage = {setItem(){throw Error('blocked')},getItem(){throw Error('blocked')}};
  const items = [M.createItem(1)];
  assert.equal(M.save(storage,items),false);
  assert.deepEqual(M.load(storage),{items:[],available:false});
  assert.equal(items.length,1);
});
test('nomes vazios restaurados recebem identificação legível', () => {
  const first={...M.createItem(1),name:'  '};
  const second={...M.createItem(2),name:'  Ana  '};
  const restored=M.decode(JSON.stringify({version:1,items:[first,second]}));
  assert.equal(restored[0].name,'Pessoa 1');
  assert.equal(restored[1].name,'Ana');
});
