export const latinDigits=value=>String(value).replace(/[٠-٩۰-۹]/g,d=>String(d.charCodeAt(0)-(d<='٩'?1632:1776)));
const pattern=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+?\d(?:[\d \u00a0\u202f().:/×+-]*\d)?)(?: ?(?:DA|DZD|kg|g|ml|cl|L|%))?/gi;
export function isolateLatin(root=document.body){
  if(!root)return;
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){
    return !node.parentElement?.closest('script,style,title,textarea,input,select,option,.latin-data,svg')&&/\d|[٠-٩۰-۹]|@/.test(node.data)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
    const value=latinDigits(node.data),matches=[...value.matchAll(pattern)];if(!matches.length)continue;
    const fragment=document.createDocumentFragment();let end=0;
    for(const match of matches){fragment.append(document.createTextNode(value.slice(end,match.index)));const bdi=document.createElement('bdi');bdi.className='latin-data';bdi.dir='ltr';bdi.lang='fr';bdi.textContent=match[0];fragment.append(bdi);end=match.index+match[0].length;}
    fragment.append(document.createTextNode(value.slice(end)));node.replaceWith(fragment);
  }
  root.querySelectorAll?.('input[type="tel"],input[type="email"],input[type="number"]').forEach(input=>{input.dir='ltr';input.lang='fr';});
}
let scheduled=false;
const observer=new MutationObserver(()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;observer.disconnect();isolateLatin();observer.observe(document.body,{childList:true,subtree:true,characterData:true});});});
isolateLatin();observer.observe(document.body,{childList:true,subtree:true,characterData:true});
document.addEventListener('input',event=>{const input=event.target;if(input.matches('input[type="tel"],input[type="email"],input[type="number"]')){const value=latinDigits(input.value);if(value!==input.value)input.value=value;}});
