import {adminImage} from './product-editor.mjs?v=3';
import {optimizePhoto} from './media.mjs?v=1';
import {mediaImageKey} from '../product-data.mjs?v=2';
const $=s=>document.querySelector(s),e=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export function createCategoryEditor({api,editor,state}){
  let current=null;
  function cleanup(){if(!current)return;const previous=current;current=null;if(previous.preview)URL.revokeObjectURL(previous.preview);if(previous.upload)api('/uploads/'+previous.upload.key,{method:'DELETE'}).catch(()=>{});}
  function open(id){
    const category=state.categories.find(c=>c.id===id);
    current={category,id:id||'cat-'+crypto.randomUUID(),image:category?.image,processing:false};
    editor(category?'Modifier la catégorie':'Ajouter une catégorie','Visible dans la boutique dès l’enregistrement',
      '<section class="category-photo-editor"><div class="category-photo-preview"><img id="category-preview" src="'+e(adminImage(category?.image||'assets/logo.png'))+'" alt="Aperçu de la catégorie" width="160" height="160"></div><div><h3>Photo de la catégorie</h3><p>Choisissez une photo depuis votre PC ou votre téléphone.</p><label class="button secondary small photo-picker">Choisir une photo<input id="category-photo" type="file" accept="image/*" aria-label="Photo de la catégorie"></label><p id="category-photo-status" role="status">JPG, PNG ou WebP · optimisation automatique.</p></div></section><div class="editor-grid"><label class="field">Nom français<input name="categoryFr" required maxlength="100" value="'+e(category?.fr)+'" placeholder="Ex. : Coffrets cadeaux"></label><label class="field">Nom arabe<input name="categoryAr" required maxlength="100" value="'+e(category?.ar)+'" dir="rtl" lang="ar" class="arabic" placeholder="مثال: علب هدايا"></label><label class="field">Position d’affichage<input name="categoryOrder" type="number" min="0" max="10000" step="1" required value="'+(category?.order??Math.max(-1,...state.categories.map(c=>c.order??0))+1)+'"><small class="help">Les positions les plus petites apparaissent en premier.</small></label></div><p class="category-publish-note">Cette catégorie sera proposée dans le menu, le défilement des catégories et les formulaires d’ajout et de modification des produits.</p>',
      'category',current.id);
    $('#category-photo').addEventListener('change',async event=>{
      const file=event.target.files[0],target=current;if(!file||target.processing)return;
      target.processing=true;$('#editor-submit').disabled=true;$('#category-photo-status').textContent='Préparation de la photo…';
      try{const blob=await optimizePhoto(file);if(current!==target)return;if(target.preview)URL.revokeObjectURL(target.preview);target.blob=blob;target.preview=URL.createObjectURL(blob);$('#category-preview').src=target.preview;$('#category-photo-status').textContent='Photo prête à être enregistrée.';}
      catch(error){$('#category-photo-status').textContent=error.message;}
      finally{if(current===target){target.processing=false;$('#editor-submit').disabled=false;event.target.value='';}}
    });
  }
  async function save(form){
    const target=current;if(!target||target.processing)throw new Error('Attendez la préparation de la photo.');
    if(!target.image&&!target.blob)throw new Error('Ajoutez une photo de la catégorie.');
    const data={id:target.id,fr:form.elements.categoryFr.value,ar:form.elements.categoryAr.value,order:Number(form.elements.categoryOrder.value)};
    const body=form.querySelector('.editor-body');body.inert=true;
    try{
      if(target.blob&&!target.upload){$('#editor-submit').textContent='Téléversement de la photo…';target.upload=await api('/uploads',{method:'POST',headers:{'Content-Type':target.blob.type},body:target.blob});}
      data.image=target.upload?.image||target.image;$('#editor-submit').textContent='Enregistrement de la catégorie…';
      const updated=await api('/categories'+(target.category?'/'+target.id:''),{method:target.category?'PATCH':'POST',body:JSON.stringify(data)});
      state.categories=state.categories.some(c=>c.id===updated.id)?state.categories.map(c=>c.id===updated.id?updated:c):[...state.categories,updated];state.categories.sort((a,b)=>a.order-b.order||a.id.localeCompare(b.id));
      target.upload=null;window.BADIL_STORE.categories=state.categories;
      const oldImage=target.category?.image,key=mediaImageKey(oldImage,window.BADIL_API);if(key&&oldImage!==updated.image)api('/uploads/'+key,{method:'DELETE'}).catch(()=>{});
      cleanup();
    }finally{body.inert=false;}
  }
  return {open,save,cleanup};
}
