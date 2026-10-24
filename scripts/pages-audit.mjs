import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url),catalog=JSON.parse(await readFile(new URL('catalog.json',root),'utf8'));
const pages=['index.html',...catalog.map(p=>'produit-'+p.id.replace('p-','')+'.html'),'panier.html','commande.html','favoris.html','merci.html','aide.html','a-propos.html','confidentialite.html'];
for(const path of pages){
  const html=await readFile(new URL(path,root),'utf8');
  assert.doesNotMatch(html,/href=["'][^"']*admin\/|data-action="account"|id="info-dialog"|id="product-dialog"|id="basket-dialog"|id="checkout-dialog"/,path+' must keep public pages separate from admin and modal commerce');
  assert.match(html,/latin\.css/);assert.match(html,/commerce\.mjs\?v=6/);
  if(path!=='index.html'){assert.match(html,/data-page=/);assert.match(html,new RegExp('rel="canonical" href="https://renolix.github.io/badil.github.io/'+path.replace('.','\\.')));}
}
for(const product of catalog){const page=await readFile(new URL('produit-'+product.id.replace('p-','')+'.html',root),'utf8');assert.ok(page.includes('data-product-id="'+product.id+'"'));assert.ok(page.includes(product.name.ar.replaceAll('&','&amp;')));}
console.log('Pages audit passed: 80 distinct product documents, 7 shopping/information documents, no public admin/profile links or commerce dialogs.');
