export const MAX_PHOTO_BYTES=1572864;
export async function optimizePhoto(file){
  if(!file.type.startsWith('image/')||file.size>15*1024*1024)throw new Error('Choisissez une image de moins de 15 Mo.');
  let source,release=()=>{};
  try{source=await createImageBitmap(file,{imageOrientation:'from-image'});release=()=>source.close();}
  catch{
    const url=URL.createObjectURL(file),image=new Image();
    try{await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('Photo illisible. Exportez-la en JPG, PNG ou WebP puis réessayez.'));image.src=url;});source=image;release=()=>URL.revokeObjectURL(url);}
    catch(error){URL.revokeObjectURL(url);throw error;}
  }
  try{
    const width=source.width||source.naturalWidth,height=source.height||source.naturalHeight;
    if(!width||!height)throw new Error('Photo illisible. Choisissez une autre image.');
    const scale=Math.min(1,1600/Math.max(width,height)),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(width*scale));canvas.height=Math.max(1,Math.round(height*scale));
    const context=canvas.getContext('2d');if(!context)throw new Error('Impossible de préparer la photo dans ce navigateur.');
    context.drawImage(source,0,0,canvas.width,canvas.height);
    for(const quality of [.86,.74,.6]){const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/webp',quality));if(blob&&blob.size<=MAX_PHOTO_BYTES)return blob;}
    throw new Error('La photo reste trop volumineuse. Choisissez une image plus petite.');
  }finally{release();}
}
