import {summarizeProduct,productImageUrl} from '../product-data.mjs?v=1';
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const $=selector=>document.querySelector(selector);
const LIMIT=1572864;
const variants=honey=>honey?[{id:'125g',label:'125 g'},{id:'250g',label:'250 g'},{id:'500g',label:'500 g'},{id:'1kg',label:'1 kg'}]:[{id:'standard',label:'Prix unitaire'}];
export function adminImage(value){const image=productImageUrl(value,window.BADIL_API);return image.startsWith('assets/')?'../'+image:image;}
export function createProductEditor({api,editor,state}){
  let current=null;
  function prices(honey,existing){return '<h3>'+(honey?'Prix par poids · DA':'Prix de vente · DA')+'</h3>'+variants(honey).map(v=>'<label class="field">'+v.label+'<input type="number" min="0" max="1000000" step="1" name="price-'+v.id+'" value="'+(existing?.variants.find(x=>x.id===v.id)?.price??'')+'" '+(!existing&&v.id===(honey?'500g':'standard')?'required':'')+' placeholder="À confirmer"></label>').join('')+(honey?'<p class="help full">Le prix de référence est celui de 500 g. Les autres formats peuvent rester à confirmer.</p>':'');}
  function open(id){
    const product=state.products.find(p=>p.id===id),isNew=!product;
    const categories=window.BADIL_STORE.categories;
    editor(isNew?'Ajouter un produit':product.name.fr,'Photo, prix et descriptions · français / العربية',
      '<div class="editor-grid"><section class="photo-upload full"><div class="photo-preview"><img id="product-image-preview" src="'+adminImage(product?.image)+'" alt="Aperçu du produit" '+(isNew?'hidden':'')+'><span id="photo-placeholder" '+(!isNew?'hidden':'')+'>↥</span></div><div><h3>Photo du produit</h3><p>Sélectionnez une image depuis votre ordinateur ou la galerie de votre téléphone.</p><label class="button secondary small photo-picker">Choisir une photo<input id="product-photo" type="file" accept="image/*" aria-label="Choisir une photo du produit"></label><small id="photo-status" class="help" role="status">JPG, PNG ou WebP · jusqu’à 15 Mo. Optimisation automatique.</small></div></section>'+
      (!isNew?'<div class="full"><a class="row-action" href="../produit.html?id='+encodeURIComponent(id)+'&amp;lang=fr" target="_blank" rel="noopener">Voir la page produit ↗</a></div>':'')+
      '<label class="field">Nom français<input name="nameFr" required minlength="2" maxlength="180" value="'+escape(product?.name.fr)+'"></label><label class="field">Nom arabe<input name="nameAr" required minlength="2" maxlength="180" value="'+escape(product?.name.ar)+'" dir="rtl" lang="ar" class="arabic"></label>'+
      '<label class="field">Catégorie principale<select name="category">'+categories.map(c=>'<option value="'+c.id+'" '+((product?.categories[0]||'natural-oils')===c.id?'selected':'')+'>'+escape(c.fr)+'</option>').join('')+'</select></label><label class="field">Format de vente<select name="format" '+(!isNew?'disabled':'')+'><option value="standard" '+(!product?.isHoney?'selected':'')+'>Produit à prix unitaire</option><option value="honey" '+(product?.isHoney?'selected':'')+'>Miel · 125 g, 250 g, 500 g, 1 kg</option></select></label>'+
      '<label class="field">Description courte française<textarea name="shortFr" required minlength="2" maxlength="400" rows="3" placeholder="Une ou deux phrases pour présenter le produit.">'+escape(product?summarizeProduct(product,'fr'):'')+'</textarea><small class="help">Affichée entre le titre et le prix sur la page produit.</small></label><label class="field">Description courte arabe<textarea name="shortAr" required minlength="2" maxlength="400" rows="3" dir="rtl" lang="ar" class="arabic">'+escape(product?summarizeProduct(product,'ar'):'')+'</textarea></label>'+
      '<div class="price-fields" id="product-prices">'+prices(product?.isHoney,product)+'</div><label class="availability-edit"><input class="switch" name="available" type="checkbox" '+(product?.available!==false?'checked':'')+'> Produit disponible à la commande</label>'+
      '<label class="field full">Description détaillée française<textarea name="descriptionFr" required rows="7">'+escape(product?.description.fr.join('\n\n'))+'</textarea><small class="help">Séparez les paragraphes par une ligne vide.</small></label><label class="field full">Description détaillée arabe<textarea name="descriptionAr" required rows="7" dir="rtl" lang="ar" class="arabic">'+escape(product?.description.ar.join('\n\n'))+'</textarea></label></div>','product',id||'new');
    current={product,isNew,id:id||'p-'+Date.now()+String(crypto.getRandomValues(new Uint32Array(1))[0]%1000000).padStart(6,'0'),image:product?.image,blob:null,preview:null,upload:null,processing:false,selection:0};
    const form=$('#editor-form');form.elements.format.addEventListener('change',()=>{$('#product-prices').innerHTML=prices(form.elements.format.value==='honey');});
    form.elements.category.addEventListener('change',()=>{if(isNew){form.elements.format.value=form.elements.category.value==='honey'?'honey':'standard';$('#product-prices').innerHTML=prices(form.elements.format.value==='honey');}});
    $('#product-photo').addEventListener('change',selectPhoto);
  }
  async function selectPhoto(event){
    const file=event.target.files[0];if(!file||!current)return;const target=current,selection=++target.selection,status=$('#photo-status');target.processing=true;$('#editor-submit').disabled=true;status.textContent='Préparation de la photo…';
    try{
      if(!file.type.startsWith('image/')||file.size>15*1024*1024)throw new Error('Choisissez une image de moins de 15 Mo.');
      const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
      let blob;try{const scale=Math.min(1,1600/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);for(const quality of [.86,.74,.6]){blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(blob&&blob.size<=LIMIT)break;}}finally{bitmap.close();}
      if(!blob||blob.size>LIMIT)throw new Error('Cette photo est trop volumineuse. Choisissez une image plus petite.');
      if(current!==target||target.selection!==selection)return;
      if(target.upload){await api('/uploads/'+target.upload.key,{method:'DELETE'});target.upload=null;}
      if(target.preview)URL.revokeObjectURL(target.preview);target.blob=blob;target.preview=URL.createObjectURL(blob);$('#product-image-preview').src=target.preview;$('#product-image-preview').hidden=false;$('#photo-placeholder').hidden=true;status.textContent=file.name+' · '+Math.ceil(blob.size/1024)+' Ko · prête à enregistrer';
    }catch(error){if(current===target&&target.selection===selection)status.textContent=error.message||'Image illisible. Utilisez une photo JPG, PNG ou WebP.';}
    finally{if(current===target&&target.selection===selection){target.processing=false;$('#editor-submit').disabled=false;}}
  }
  async function save(form){
    const target=current;if(!target||target.processing)throw new Error('Attendez la préparation de la photo.');
    if(!target.image&&!target.blob)throw new Error('Choisissez une photo du produit avant de l’enregistrer.');
    if(target.blob&&!target.upload){$('#editor-submit').textContent='Téléversement de la photo…';target.upload=await api('/uploads',{method:'POST',headers:{'Content-Type':target.blob.type},body:target.blob});}
    const honey=target.isNew?form.elements.format.value==='honey':target.product.isHoney;
    const data={id:target.id,name:{fr:form.elements.nameFr.value,ar:form.elements.nameAr.value},categories:target.product?[form.elements.category.value,...target.product.categories.slice(1).filter(id=>id!==form.elements.category.value)]:[form.elements.category.value],isHoney:honey,shortDescription:{fr:form.elements.shortFr.value,ar:form.elements.shortAr.value},description:{fr:form.elements.descriptionFr.value.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean),ar:form.elements.descriptionAr.value.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean)},variantPrices:Object.fromEntries(variants(honey).map(v=>[v.id,form.elements['price-'+v.id].value===''?null:Number(form.elements['price-'+v.id].value)])),available:form.elements.available.checked,image:target.upload?.image||target.image};
    $('#editor-submit').textContent='Enregistrement du produit…';
    const updated=await api('/products'+(target.isNew?'':'/'+target.id),{method:target.isNew?'POST':'PATCH',body:JSON.stringify(data)});
    state.products=state.products.some(p=>p.id===updated.id)?state.products.map(p=>p.id===updated.id?updated:p):[updated,...state.products];target.upload=null;cleanup();
  }
  function cleanup(){if(!current)return;const target=current;current=null;if(target.preview)URL.revokeObjectURL(target.preview);if(target.upload)api('/uploads/'+target.upload.key,{method:'DELETE'}).catch(()=>{});}
  return {open,save,cleanup};
}
