class StockError extends Error{constructor(code,message){super(message);Object.assign(this,{status:409,code});}}
export function stockChanges(items,products,release=false){
  const quantities=new Map();for(const item of items)quantities.set(item.productId,(quantities.get(item.productId)||0)+item.quantity);
  const changes=[];for(const [id,quantity] of quantities){const product=products.find(p=>p?.id===id);if(!product){if(release)continue;throw new StockError('PRODUCT_UNAVAILABLE','Un produit n’est plus disponible.');}if(product.stock===null||product.stock===undefined)continue;
    if(!Number.isInteger(product.stock)||product.stock<0||!Number.isInteger(quantity)||quantity<1)throw new StockError('INVALID_STOCK','Le stock de ce produit doit être vérifié.');
    if(!release&&quantity>product.stock)throw new StockError('INSUFFICIENT_STOCK','La quantité demandée dépasse le stock disponible.');
    changes.push({productId:id,quantity,stock:product.stock+(release?quantity:-quantity)});
  }return changes;
}
