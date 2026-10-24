const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const locations = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'locations.json'), 'utf8'));
assert.equal(locations.length, 69, 'Expected 69 wilayas');
assert.deepEqual(locations.map(w => w.code), Array.from({ length: 69 }, (_, i) => String(i + 1).padStart(2, '0')));

const communes = locations.flatMap(w => w.communes);
assert.equal(communes.length, 1541, 'Expected all 1541 communes');
assert.equal(new Set(communes.map(c => c.id)).size, 1541, 'Commune IDs must be globally unique');
for (const w of locations) {
  assert.ok(w.name.fr && w.name.ar && w.communes.length, `Missing bilingual wilaya information for ${w.code}`);
  for (const c of w.communes) {
    assert.match(c.id, /^\d{4}$/, `Invalid administrative commune code: ${c.id}`);
    assert.ok(c.name.fr && /[\u0600-\u06ff]/u.test(c.name.ar), `Missing bilingual commune names: ${c.id}`);
  }
}

const expectedNew = [
  ['59', 'Aflou', 12], ['60', 'Barika', 8], ['61', 'El Kantara', 5],
  ['62', 'Bir El Ater', 4], ['63', 'El Aricha', 4], ['64', 'Ksar Chellala', 6],
  ['65', 'Aïn Ouessara', 10], ['66', 'Messaad', 8], ['67', 'Ksar El Boukhari', 21],
  ['68', 'Bou Saâda', 23], ['69', 'El Abiodh Sidi Cheikh', 7]
];
for (const [code, name, count] of expectedNew) {
  const wilaya = locations.find(w => w.code === code);
  assert.equal(wilaya.name.fr, name);
  assert.equal(wilaya.communes.length, count, `Law 26-06 commune count mismatch for ${code}`);
}

const dellys = locations.find(w => w.code === '35').communes.find(c => c.id === '3528');
assert.deepEqual(dellys, { id: '3528', name: { fr: 'Dellys', ar: 'دلس' } });
console.log('Locations audit passed: 69 unique wilayas (01–69), 1541 unique bilingual communes, all 11 new wilaya counts, Dellys in Boumerdès (35 / 3528).');
