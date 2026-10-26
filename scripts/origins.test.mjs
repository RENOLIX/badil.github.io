import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.mjs';

const env={STORE_ORIGIN:'https://badeeldz.com',ADDITIONAL_STORE_ORIGINS:['https://www.badeeldz.com','https://renolix.github.io']};
const preflight=origin=>worker.fetch(new Request('https://badil-api.example/api/orders',{
  method:'OPTIONS',headers:origin?{Origin:origin,'Access-Control-Request-Method':'POST'}:{}
}),env,{});

test('store, www, legacy Pages, and local previews can preflight the order API',async()=>{
  for(const origin of ['https://badeeldz.com','https://www.badeeldz.com','https://renolix.github.io','http://127.0.0.1:4173','http://localhost:4173']){
    const response=await preflight(origin);
    assert.equal(response.status,204,origin);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'),origin);
    assert.match(response.headers.get('Access-Control-Allow-Methods'),/POST/);
    assert.equal(response.headers.get('Vary'),'Origin');
  }
});

test('lookalike domains, unapproved subdomains, HTTP and null origins stay denied',async()=>{
  for(const origin of ['https://badeeldz.com.attacker.example','https://evil.badeeldz.com','https://badeeldz-com.example','http://badeeldz.com','https://other.github.io','null']){
    const response=await preflight(origin);
    assert.equal(response.status,403,origin);
    assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
    assert.equal((await response.json()).error.code,'ORIGIN_DENIED');
  }
});

test('requests without an Origin do not receive a wildcard CORS permission',async()=>{
  const response=await preflight();
  assert.equal(response.status,204);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'),null);
});
