import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import worker from '../worker/index.mjs';
import {mergeCategories,normalizeCategoryInput} from '../worker/categories.mjs';
import {normalizeProductInput} from '../worker/products.mjs';

const origin='https://badil-api.mimflo-renolix.workers.dev',storeOrigin='https://badeeldz.com';
const root='projects/badeldz/databases/(default)/documents';
const catalog=JSON.parse(await readFile(new URL('../catalog.json',import.meta.url)));
const pair=await crypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk={...await crypto.subtle.exportKey('jwk',pair.publicKey),kid:'local-regression-test',alg:'RS256',use:'sig'};
const encode=data=>Buffer.from(typeof data==='string'?data:JSON.stringify(data)).toString('base64url');
const seconds=Math.floor(Date.now()/1000),unsigned=encode({alg:'RS256',kid:jwk.kid})+'.'+encode({aud:'badeldz',iss:'https://securetoken.google.com/badeldz',sub:'local-admin-fixture',iat:seconds,auth_time:seconds,exp:seconds+3600});
const token=unsigned+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(unsigned))).toString('base64url');
const privateKey='-----BEGIN PRIVATE KEY-----\n'+Buffer.from(await crypto.subtle.exportKey('pkcs8',pair.privateKey)).toString('base64')+'\n-----END PRIVATE KEY-----';
const json=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
function field(value){if(value===null)return {nullValue:null};if(typeof value==='string')return {stringValue:value};if(typeof value==='boolean')return {booleanValue:value};if(typeof value==='number')return {integerValue:String(value)};if(Array.isArray(value))return {arrayValue:{values:value.map(field)}};return {mapValue:{fields:Object.fromEntries(Object.entries(value).map(([k,v])=>[k,field(v)]))}};}

async function withApi(run){
  const originalFetch=globalThis.fetch,originalCaches=globalThis.caches;
  const documents=new Map(),media=new Map(),actor={uid:'local-admin-fixture',displayName:'Local test',role:'admin',disabled:false};let version=0;
  function put(path,data){documents.set(path,{name:root+'/'+path,fields:field(data).mapValue.fields,updateTime:'version-'+(++version)});}
  put('users/'+actor.uid,actor);
  globalThis.caches={default:{match:async()=>{throw new Error('Stale catalog caches must never be read');},delete:async()=>{throw new Error('A cache failure must not reject a completed catalog save');},put:async()=>{}}};
  globalThis.fetch=async(url,options={})=>{
    url=String(url);if(url.includes('/service_accounts/v1/jwk/'))return json({keys:[jwk]});if(url==='https://oauth2.googleapis.com/token')return json({access_token:'local-test-token',expires_in:3600});
    assert.ok(url.startsWith('https://firestore.googleapis.com/'),'Unexpected external request: '+url);
    const parsed=new URL(url),path=decodeURIComponent(parsed.pathname.split('/documents')[1]||''),method=options.method||'GET',body=options.body?JSON.parse(options.body):null;
    if(path===':commit'){
      for(const write of body.writes){const key=write.update.name.slice(root.length+1),old=documents.get(key);if(write.currentDocument?.updateTime!==old?.updateTime)return new Response(JSON.stringify({error:{status:'FAILED_PRECONDITION'}}),{status:409});documents.set(key,{...write.update,updateTime:'version-'+(++version)});}
      return json({writeResults:[]});
    }
    if(path===':runQuery'){
      const image=body.structuredQuery.where.compositeFilter.filters[0].fieldFilter.value.stringValue;
      return json([...documents.entries()].filter(([key,doc])=>key.startsWith('products/')&&JSON.stringify(doc.fields).includes(image)).slice(0,1).map(([,document])=>({document})));
    }
    const key=path.slice(1);
    if(method==='PATCH'){const doc={name:root+'/'+key,fields:body.fields,updateTime:'version-'+(++version)};documents.set(key,doc);return json(doc);}
    if(method==='POST'){const id=parsed.searchParams.get('documentId'),doc={name:root+'/'+key+'/'+id,fields:body.fields,updateTime:'version-'+(++version)};documents.set(key+'/'+id,doc);return json(doc);}
    if(method==='DELETE'){documents.delete(key);return json({});}
    if(!key.includes('/'))return json({documents:[...documents.entries()].filter(([p])=>p.startsWith(key+'/')).map(([,doc])=>doc)});
    return documents.has(key)?json(documents.get(key)):new Response('{}',{status:404});
  };
  const env={STORE_ORIGIN:storeOrigin,FIREBASE_SERVICE_ACCOUNT:JSON.stringify({client_email:'local@test.invalid',private_key:privateKey}),PRODUCT_MEDIA:{put:async(key,bytes)=>media.set(key,bytes),delete:async key=>media.delete(key),get:async key=>media.get(key)}};
  const call=async(path,method='GET',body,authenticated=true)=>{
    const binary=body instanceof Uint8Array,request=new Request(origin+'/api/'+path,{method,headers:{Origin:storeOrigin,...(authenticated?{Authorization:'Bearer '+token}:{}),'Content-Type':binary?'image/png':'application/json'},...(body===undefined?{}:{body:binary?body:JSON.stringify(body)})});
    const response=await worker.fetch(request,env,{waitUntil:promise=>promise.catch(()=>{})});return {status:response.status,body:await response.json(),headers:response.headers};
  };
  try{await run({call,put,documents,media,actor});}finally{globalThis.fetch=originalFetch;if(originalCaches===undefined)delete globalThis.caches;else globalThis.caches=originalCaches;}
}

test('category defaults retain photo identity after reordering, overrides and additions',()=>{
  const original=mergeCategories(),edited=mergeCategories([{...original[10],fr:'Notre miel',order:0},{id:'cat-test',fr:'Coffrets',ar:'هدايا',image:'assets/logo.png',order:1}]);
  assert.equal(edited.length,16);assert.equal(edited.find(c=>c.id==='honey').image,'assets/categories/category-11.jpg');assert.equal(original[10].fr,'Miels');
});
test('category input validates translations, image origin and display position',()=>{
  const valid={fr:'Coffrets',ar:'هدايا',image:'assets/categories/category-1.jpg',order:15};assert.equal(normalizeCategoryInput(valid,origin).ar,'هدايا');
  for(const change of [{ar:''},{image:'https://other.test/image.jpg'},{order:-1},{order:1.5}])assert.throws(()=>normalizeCategoryInput({...valid,...change},origin));
});
test('creating a category immediately exposes it in public catalog and accepts it on a new product',async()=>withApi(async({call})=>{
  const id='cat-11111111-2222-4333-8444-555555555555';
  const created=await call('admin/categories','POST',{id,fr:'Coffrets',ar:'هدايا',image:'assets/logo.png',order:15});assert.equal(created.status,200);
  const publicCatalog=await call('catalog','GET',undefined,false);assert.equal(publicCatalog.body.categories.length,16);assert.equal(publicCatalog.headers.get('Cache-Control'),'no-store');
  const product={...catalog[0],id:'p-1793000000123456789',categories:[id],formatType:'unit',referenceVariantId:'standard',variantPrices:{standard:1250},stock:7};
  const saved=await call('admin/products','POST',product);assert.equal(saved.status,200,JSON.stringify(saved.body));assert.deepEqual(saved.body.categories,[id]);assert.equal(saved.body.stock,7);
  const live=await call('catalog','GET',undefined,false);assert.equal(live.body.products[0].id,product.id);assert.equal(live.body.products[0].price,1250);
}));
test('photo upload plus text/price edit persists and returns fresh data without a stale edge cache',async()=>withApi(async({call,put})=>{
  const product={...catalog.find(p=>p.id==='p-256'),stock:6};put('products/'+product.id,product);
  const png=new Uint8Array(await readFile(new URL('../assets/honey/honey-256.png',import.meta.url))),upload=await call('admin/uploads','POST',png);assert.equal(upload.status,200,JSON.stringify(upload.body));
  const saved=await call('admin/products/'+product.id,'PATCH',{name:{...product.name,fr:'Miel de printemps'},shortDescription:{fr:'Un résumé modifié.',ar:'وصف جديد للعسل.'},images:[upload.body.image],formatType:'honey',variantPrices:{'500g':4100}});
  assert.equal(saved.status,200,JSON.stringify(saved.body));assert.equal(saved.body.price,4100);assert.equal(saved.body.stock,6);assert.equal(saved.body.image,upload.body.image);
  const fresh=await call('catalog','GET',undefined,false);assert.equal(fresh.body.products[0].shortDescription.fr,'Un résumé modifié.');assert.equal(fresh.body.products[0].image,upload.body.image);
  const again=await call('admin/products/'+product.id,'PATCH',{available:false});assert.equal(again.status,200);assert.equal(again.body.image,upload.body.image);assert.equal(again.body.available,false);
}));
test('editing category name and uploaded photo protects the image from cleanup',async()=>withApi(async({call})=>{
  const png=new Uint8Array(await readFile(new URL('../assets/categories/category-11.jpg',import.meta.url)));
  // The upload endpoint deliberately checks the binary signature, not the filename.
  const invalid=await call('admin/uploads','POST',png);assert.equal(invalid.status,400);
  const actual=new Uint8Array(await readFile(new URL('../assets/honey/honey-256.png',import.meta.url))),upload=await call('admin/uploads','POST',actual);
  const saved=await call('admin/categories/honey','PATCH',{fr:'Nos miels',ar:'عسلنا',image:upload.body.image});assert.equal(saved.status,200,JSON.stringify(saved.body));
  const catalog=await call('catalog','GET',undefined,false);assert.equal(catalog.body.categories.find(c=>c.id==='honey').fr,'Nos miels');
  const removal=await call('admin/uploads/'+upload.body.key,'DELETE',{});assert.equal(removal.status,409);assert.equal(removal.body.error.code,'IMAGE_IN_USE');
}));
test('bad product data cannot overwrite the saved item; concurrent stock changes are preserved',async()=>withApi(async({call,put})=>{
  const product={...catalog[0],stock:4};put('products/'+product.id,product);
  const invalid=await call('admin/products/'+product.id,'PATCH',{categories:['not-created']});assert.equal(invalid.status,400);assert.equal(invalid.body.error.code,'INVALID_CATEGORY');
  const stale=await call('admin/products/'+product.id,'PATCH',{stock:8,expectedStock:5});assert.equal(stale.status,409);assert.equal(stale.body.error.code,'STOCK_CHANGED');
  const current=await call('products/'+product.id,'GET',undefined,false);assert.equal(current.body.product.stock,4);
}));
test('category and product mutations require authentication and management privileges',async()=>withApi(async({call,put,actor})=>{
  assert.equal((await call('admin/categories','GET',undefined,false)).status,401);
  put('users/'+actor.uid,{...actor,role:'operator'});
  assert.equal((await call('admin/categories','GET')).status,403);assert.equal((await call('admin/categories','POST',{})).status,403);assert.equal((await call('admin/products','POST',{})).status,403);
}));
test('every legacy catalog product supports a full editor save followed by a photo-only edit',()=>{
  for(const product of catalog){const updated=normalizeProductInput({...product,formatType:product.isHoney?'honey':'unit',referenceVariantId:product.isHoney?'500g':'standard',variantPrices:Object.fromEntries(product.variants.map(v=>[v.id,v.price]))},origin,product);
    const photoEdit=normalizeProductInput({images:['assets/logo.png']},origin,updated);assert.equal(photoEdit.price,product.price,product.id);assert.equal(photoEdit.name.fr,product.name.fr);assert.equal(photoEdit.image,'assets/logo.png');assert.deepEqual(photoEdit.description,product.description);
  }
});
