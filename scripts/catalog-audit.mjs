import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourcePath=path.resolve(process.argv[2]||path.join(root,'../badil-reference/all-products.json'));
assert.ok(fs.existsSync(sourcePath),`Source WooCommerce JSON missing. Pass its path: node scripts/catalog-audit.mjs <all-products.json>`);
const products=JSON.parse(fs.readFileSync(path.join(root,'catalog.json'),'utf8'));
const raw=JSON.parse(fs.readFileSync(sourcePath,'utf8'));
const arabic=raw.filter(p=>p.categories.length&&!p.categories[0].slug.match(/-(fr|en)$/));
const originals=new Map(arabic.map(p=>[p.id,p]));

assert.equal(arabic.length,80,'Expected exactly 80 Arabic source products');
assert.equal(products.length,80,'Expected exactly 80 consolidated products');
assert.equal(new Set(products.map(p=>p.id)).size,80,'Product IDs must be unique');
assert.equal(new Set(products.map(p=>p.sourceId)).size,80,'Source IDs must be unique');
const counts={};
let minDescriptionChars=Infinity;
for(const p of products){
  const source=originals.get(p.sourceId);
  assert.ok(source,`Unknown Arabic source ID: ${p.sourceId}`);
  assert.equal(p.id,`p-${p.sourceId}`);
  assert.equal(source.prices.currency_code,'DZD',`Source ${p.id} must use DZD`);
  assert.equal(source.prices.currency_minor_unit,0,`Source ${p.id} price scale changed`);
  assert.equal(p.price,Number(source.prices.price),`Exact source price mismatch: ${p.id}`);
  assert.equal(p.name.ar,source.name,`Arabic name mismatch: ${p.id}`);
  assert.ok(p.name.fr?.length>2,`Missing French name: ${p.id}`);
  assert.deepEqual(p.categories,source.categories.map(c=>c.slug),`Source categories mismatch: ${p.id}`);
  assert.equal(p.sourceImage,source.images[0].src,`Canonical Arabic image mismatch: ${p.id}`);
  assert.equal(p.available,true,`Product unavailable: ${p.id}`);
  assert.equal(p.isHoney,p.categories.includes('honey'),`Honey flag mismatch: ${p.id}`);
  for(const lang of ['fr','ar']){
    assert.ok(Array.isArray(p.description[lang])&&p.description[lang].length>=3,`Missing long ${lang} paragraphs: ${p.id}`);
    const length=p.description[lang].join(' ').length;
    assert.ok(length>=400,`${p.id} ${lang} description too short (${length})`);
    assert.ok(p.description[lang].every(s=>typeof s==='string'&&s.length>=80),`${p.id} ${lang} paragraph too short`);
    minDescriptionChars=Math.min(minDescriptionChars,length);
  }
  assert.ok(!path.isAbsolute(p.image)&&!p.image.includes('..'),`Unsafe local image path: ${p.id}`);
  assert.ok(fs.existsSync(path.join(root,p.image)),`Missing catalogue image: ${p.image}`);
  assert.ok(fs.statSync(path.join(root,p.image)).size>1000,`Empty catalogue image: ${p.image}`);
  const sourceImagePath=path.join(root,`assets/products/product-${p.sourceId}.jpg`);
  assert.ok(fs.existsSync(sourceImagePath),`Missing canonical source image: ${sourceImagePath}`);
  if(p.isHoney){
    assert.deepEqual(p.variants.map(v=>v.id),['125g','250g','500g','1kg'],`Honey formats mismatch: ${p.id}`);
    assert.equal(p.variants.find(v=>v.id==='500g').price,p.price,`Honey 500 g source price mismatch: ${p.id}`);
    for(const v of p.variants.filter(v=>v.id!=='500g')) assert.equal(v.price,null,`Unknown honey price must remain null: ${p.id}/${v.id}`);
  }else{
    assert.deepEqual(p.variants,[{id:'standard',label:'',price:p.price}],`Standard variant mismatch: ${p.id}`);
  }
  for(const category of p.categories) counts[category]=(counts[category]||0)+1;
}
assert.deepEqual(new Set(products.map(p=>p.sourceId)),new Set(arabic.map(p=>p.id)),'Catalogue must contain every Arabic original');
assert.equal(counts.honey,5,'Expected five distinct honey products');
console.log(JSON.stringify({status:'PASS',distinctProducts:products.length,exactDzdPrices:products.length,categoryCounts:counts,honeySourceIds:products.filter(p=>p.isHoney).map(p=>p.sourceId),localImagesVerified:products.length,minimumDescriptionChars:minDescriptionChars},null,2));
