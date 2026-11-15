export const MAX_DESCRIPTION_LENGTH=32000;

// The editor and API share this rule: paragraph count is a formatting choice,
// not a sign that a translation is missing.
export function normalizeDescription(input,locale){
  const label=locale==='ar'?'arabe':'française';
  const reject=message=>{throw Object.assign(new Error(message),{code:'INVALID_DESCRIPTION',status:400});};
  const parts=typeof input==='string'?[input]:input;
  if(!Array.isArray(parts)||parts.some(part=>typeof part!=='string'))reject(`La description détaillée ${label} doit contenir du texte.`);
  const paragraphs=parts.flatMap(part=>part.replace(/\r\n?/g,'\n').split(/\n\s*\n/)).map(part=>part.trim()).filter(Boolean);
  if(!paragraphs.length)reject(`Renseignez la description détaillée ${label}.`);
  if(paragraphs.join('\n\n').length>MAX_DESCRIPTION_LENGTH)reject(`La description détaillée ${label} dépasse 32 000 caractères. Raccourcissez ce champ.`);
  if(paragraphs.some(part=>/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(part)))reject(`La description détaillée ${label} contient des caractères invalides. Collez-la en texte simple.`);
  return paragraphs;
}
