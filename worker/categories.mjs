import {localProductImage,mediaImageKey} from '../product-data.mjs';
export {mergeCategories} from '../category-data.mjs';
const reject=(code,message)=>{throw Object.assign(new Error(message),{code,status:400});};
export function normalizeCategoryInput(body,origin,existing=null){
  if(!body||typeof body!=='object'||Array.isArray(body))reject('INVALID_CATEGORY','Données de la catégorie invalides.');
  const category=existing?{...existing}:{};
  for(const locale of ['fr','ar']){
    const name=body[locale]??category[locale];
    if(typeof name!=='string'||!name.trim()||name.trim().length>100||/[\u0000-\u001f]/.test(name))reject('INVALID_CATEGORY','Renseignez le nom de la catégorie dans les deux langues (100 caractères maximum).');
    category[locale]=name.trim();
  }
  const image=body.image??category.image;
  if(!localProductImage(image)&&!mediaImageKey(image,origin))reject('INVALID_IMAGE','Ajoutez une photo pour cette catégorie.');
  category.image=image;
  const order=body.order??category.order??1000;
  if(!Number.isInteger(order)||order<0||order>10000)reject('INVALID_CATEGORY','La position doit être un nombre entre 0 et 10 000.');
  category.order=order;return category;
}
