const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const url='http://127.0.0.1:8080';
async function setup(t,viewport={width:1365,height:1000}){const browser=await chromium.launch();t.after(()=>browser.close());const context=await browser.newContext({viewport});const page=await context.newPage();return {browser,context,page};}
async function add(page,name,bread='tradicional'){await page.locator(`[data-new="${bread}"]`).click();await page.locator('#person-name').fill(name);await page.getByLabel('Milho',{exact:true}).check();await page.getByLabel('Mostarda com mel',{exact:true}).check();await page.locator('#save-item').click();}
test('abertura não faz requisições externas',async t=>{const {page}=await setup(t);const requests=[];page.on('request',r=>{if(!r.url().startsWith(url))requests.push(r.url());});await page.goto(url);await page.evaluate(()=>document.fonts.ready);assert.deepEqual(requests,[]);});
test('foco acompanha salvar, duplicar, editar, remover e desfazer',async t=>{
 const {page}=await setup(t);await page.goto(url);await add(page,'Ana');
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Editar lanche de Ana');
 await page.getByRole('button',{name:'Duplicar lanche de Ana',exact:true}).click();
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Editar lanche de Ana (cópia)');
 await page.keyboard.press('Enter');await page.locator('#person-name').fill('Bia');await page.locator('#save-item').click();
 assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Editar lanche de Bia');
 await page.getByRole('button',{name:'Remover lanche de Bia',exact:true}).click();assert.equal(await page.evaluate(()=>document.activeElement.id),'undo');
 await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('aria-label')),'Editar lanche de Bia');
});
test('apagar em uma aba atualiza outra e não ressuscita nomes',async t=>{
 const {page,context}=await setup(t);await page.goto(url);await add(page,'Ana');const second=await context.newPage();await second.goto(url);
 await page.locator('#clear-list').click();await page.locator('#confirm-clear-button').click();
 await second.waitForFunction(()=>document.querySelectorAll('.list-item').length===0,{},{timeout:2500});
 assert.equal(await second.locator('.list-item').count(),0);
});
test('fluxo completo em celular: pessoas, resumo, persistência e categorias',async t=>{
 const {page}=await setup(t,{width:390,height:844});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);
 await add(page,'Ana <&>');await add(page,'Bia','brioche');assert.equal(await page.locator('#subtotal').textContent(),'R$ 43,00');
 await page.getByLabel('Conferido: Bia',{exact:true}).check();await page.getByRole('button',{name:'Editar lanche de Bia',exact:true}).click();await page.getByLabel('Milho',{exact:true}).uncheck();await page.getByLabel('Ervilha',{exact:true}).check();await page.locator('#save-item').click();
 assert.equal(await page.getByLabel('Conferido: Bia',{exact:true}).isChecked(),false);
 assert.equal(await page.locator('.list-item').nth(0).locator('.item-ingredients').textContent(),'Milho');assert.equal(await page.locator('.list-item').nth(1).locator('.item-ingredients').textContent(),'Ervilha');
 await page.reload();assert.equal(await page.locator('.list-item').count(),2);assert.equal(await page.locator('.list-item h3').first().textContent(),'Ana <&>');
 await page.getByRole('tab',{name:'Bebidas',exact:true}).click();assert.equal(await page.locator('#drinks .catalog-row').count(),5);
 await page.keyboard.press('ArrowRight');assert.equal(await page.getByRole('tab',{name:'Sorvetes',exact:true}).getAttribute('aria-selected'),'true');assert.equal(await page.locator('#icecreams .catalog-row').count(),17);
 await page.getByRole('tab',{name:'Cachorros-quentes',exact:true}).click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 fs.mkdirSync(path.join(__dirname,'../qa'),{recursive:true});await page.screenshot({path:path.join(__dirname,'../qa/mobile.png'),fullPage:true});
 await page.getByRole('button',{name:'Editar lanche de Bia',exact:true}).click();assert.equal(await page.evaluate(()=>document.querySelector('#editor').scrollWidth<=document.querySelector('#editor').clientWidth),true);await page.screenshot({path:path.join(__dirname,'../qa/editor-mobile.png')});await page.keyboard.press('Escape');
 await page.locator('#clear-list').click();await page.locator('#cancel-clear').click();assert.equal(await page.locator('.list-item').count(),2);
 await page.locator('#clear-list').click();await page.locator('#confirm-clear-button').click();assert.equal(await page.locator('.list-item').count(),0);assert.deepEqual(errors,[]);
 await page.setViewportSize({width:1365,height:1000});await page.goto(url);await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:path.join(__dirname,'../qa/desktop.png'),fullPage:true});
});
test('armazenamento bloqueado e dados corrompidos não impedem montar',async t=>{
 const {page,context}=await setup(t);await page.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw Error('blocked')}}));await page.goto(url);await add(page,'Sessão');assert.equal(await page.locator('.list-item').count(),1);assert.match(await page.locator('#storage-note').textContent(),/apenas nesta sessão/);
 const corrupt=await context.newPage();await corrupt.goto(url);await corrupt.evaluate(()=>localStorage.setItem('cachorrao-banka-lista-v1','{broken'));await corrupt.reload();await add(corrupt,'Nova');assert.equal(await corrupt.locator('.list-item').count(),1);
});
test('abertura direta do HTML funciona sem servidor',async t=>{
 const {page}=await setup(t);const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);await add(page,'Local');assert.equal(await page.locator('.list-item').count(),1);assert.deepEqual(errors,[]);
});
