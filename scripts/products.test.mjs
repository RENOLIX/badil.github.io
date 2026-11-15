import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {normalizeProductInput,validateImageBytes,MAX_IMAGE_BYTES} from '../worker/products.mjs';
import {summarizeProduct,mediaImageKey,productImageUrl} from '../product-data.mjs';
import {normalizeDescription,MAX_DESCRIPTION_LENGTH} from '../product-description.mjs';
const origin='https://badil-api.mimflo-renolix.workers.dev';
const photo=origin+'/media/11111111-2222-4333-8444-555555555555.webp';
const input=()=>({name:{fr:'Huile naturelle',ar:'زيت طبيعي'},shortDescription:{fr:'Une huile pour vos soins quotidiens.',ar:'زيت للعناية اليومية.'},description:{fr:['Présentation détaillée du produit.'],ar:['وصف مفصل للمنتج.']},categories:['natural-oils'],image:photo,variantPrices:{standard:900},available:true});
test('new products retain both short descriptions, uploaded photo and exact price',()=>{const p=normalizeProductInput(input(),origin);assert.equal(p.price,900);assert.equal(p.shortDescription.ar,'زيت للعناية اليومية.');assert.equal(p.image,photo);assert.equal(p.variants[0].id,'standard');});
test('honey creation keeps four distinct formats and unknown weight prices',()=>{const p=normalizeProductInput({...input(),categories:['honey'],variantPrices:{'500g':4000}},origin);assert.deepEqual(p.variants.map(v=>[v.id,v.price]),[['125g',null],['250g',null],['500g',4000],['1kg',null]]);assert.equal(p.price,4000);});
test('partial edits preserve all existing product fields and fill a short summary',()=>{const p=normalizeProductInput(input(),origin);delete p.shortDescription;p.sourceId=123;const updated=normalizeProductInput({available:false},origin,p);assert.equal(updated.sourceId,123);assert.equal(updated.price,900);assert.equal(updated.available,false);assert.equal(updated.shortDescription.fr,p.description.fr[0]);assert.equal(p.available,true);});
test('creation rejects missing image, missing reference price and invalid category',()=>{const p=input();delete p.image;assert.throws(()=>normalizeProductInput(p,origin),{code:'MISSING_IMAGE'});assert.throws(()=>normalizeProductInput({...input(),variantPrices:{}},origin),{code:'MISSING_PRICE'});assert.throws(()=>normalizeProductInput({...input(),categories:['unknown']},origin),{code:'INVALID_CATEGORY'});assert.throws(()=>normalizeProductInput({...input(),variantPrices:{standard:-5}},origin),{code:'INVALID_PRICE'});});
test('image references reject foreign hosts, scripts, traversal, queries and fragments',()=>{for(const image of ['javascript:alert(1)','https://evil.test/media/'+photo.split('/').at(-1),photo+'?x=1',photo+'#x','assets/../private.png']){assert.equal(mediaImageKey(image,origin),null);assert.equal(productImageUrl(image,origin),'assets/logo.png');assert.throws(()=>normalizeProductInput({...input(),image},origin),{code:'INVALID_IMAGE'});}assert.equal(productImageUrl('assets/logo.png',origin),'assets/logo.png');});
test('short descriptions prefer editorial text and fallback summaries stay short',()=>{assert.equal(summarizeProduct({shortDescription:{fr:'Présentation courte'},description:{fr:['Longue description.']}},'fr'),'Présentation courte');assert.equal(summarizeProduct({description:{fr:['Une première phrase. Une autre phrase.']}},'fr'),'Une première phrase.');assert.ok(summarizeProduct({description:{fr:['mot '.repeat(200)]}},'fr').length<=261);});
test('photo validation accepts a real local PNG and rejects mislabeled or oversized data',async()=>{const bytes=new Uint8Array(await readFile(new URL('../assets/honey/honey-256.png',import.meta.url)));assert.equal(validateImageBytes(bytes,'image/png'),'png');assert.throws(()=>validateImageBytes(bytes,'image/jpeg'),{code:'INVALID_IMAGE'});assert.throws(()=>validateImageBytes(new TextEncoder().encode('<svg onload="alert(1)"></svg>'),'image/png'),{code:'INVALID_IMAGE'});assert.throws(()=>validateImageBytes(new Uint8Array(MAX_IMAGE_BYTES+1),'image/png'),{code:'IMAGE_TOO_LARGE'});});
test('media URLs cannot carry credentials or raw HTML attribute delimiters',()=>{for(const image of [photo.replace('https://','https://user@'),photo.replace('https://','https://foo" onerror="alert(1)@'),' '+photo]){assert.equal(mediaImageKey(image,origin),null);assert.equal(productImageUrl(image,origin),'assets/logo.png');}});

test('both descriptions accept more than eight paragraphs on creation and full editor updates',()=>{
  const description={fr:Array.from({length:12},(_,i)=>`Paragraphe ${i+1} : présentation du produit.`),ar:Array.from({length:15},(_,i)=>`فقرة ${i+1} : وصف المنتج وطريقة استخدامه.`)};
  const created=normalizeProductInput({...input(),description},origin);assert.deepEqual(created.description,description);
  const edited=normalizeProductInput({...input(),description,available:false},origin,created);assert.deepEqual(edited.description,description);assert.equal(edited.available,false);assert.equal(edited.price,900);
});
test('pasted Windows and phone text preserves every nonempty paragraph without a count limit',()=>{
  for(const separator of ['\n\n','\r\n\r\n','\r\r','\n \t\n']){
    const paragraphs=Array.from({length:20},(_,i)=>`Description ${i+1}`);
    assert.deepEqual(normalizeDescription('  '+paragraphs.join(separator)+'  ','fr'),paragraphs);
  }
  assert.deepEqual(normalizeDescription(['','  وصف المنتج  ','\n\n','فقرة ثانية'],'ar'),['وصف المنتج','فقرة ثانية']);
});
test('long single paragraphs are accepted; oversized text names the real language and size limit',()=>{
  const long='ز'.repeat(6000);assert.deepEqual(normalizeDescription(long,'ar'),[long]);
  assert.equal(normalizeDescription('a'.repeat(MAX_DESCRIPTION_LENGTH),'fr')[0].length,MAX_DESCRIPTION_LENGTH);
  assert.throws(()=>normalizeDescription('a'.repeat(MAX_DESCRIPTION_LENGTH+1),'fr'),error=>error.code==='INVALID_DESCRIPTION'&&error.message.includes('française')&&error.message.includes('32 000'));
});
test('missing or invalid translations name the exact field and never alter the saved product',()=>{
  const saved=normalizeProductInput(input(),origin),before=structuredClone(saved);
  for(const locale of ['fr','ar']){
    const description={...input().description,[locale]:[' ','\n\n']};
    assert.throws(()=>normalizeProductInput({description},origin,saved),error=>error.code==='INVALID_DESCRIPTION'&&error.message.includes(locale==='ar'?'arabe':'française'));
    assert.deepEqual(saved,before);
  }
  for(const bad of [42,{},['valid',null],['valid',{}]])assert.throws(()=>normalizeDescription(bad,'fr'),{code:'INVALID_DESCRIPTION'});
});
