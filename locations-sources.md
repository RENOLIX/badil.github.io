# Algerian delivery locations — sources and validation

Verified on 24 October 2026. `locations.json` contains 69 wilayas and all 1,541 communes, with French and Arabic names. It uses the 2026 territorial organization, including the 11 new wilayas.

## Sources

1. **Official law: Loi n° 26-06 du 4 avril 2026**, Journal officiel n° 25 of 5 April 2026, pages 3–9. Article 3 confirms 69 wilayas and 1,541 communes; articles 52 bis 10 through 52 bis 20 enumerate the communes of all 11 new wilayas. The complete French commune lists were extracted from this PDF and compared, after accent/apostrophe normalization, against the downloaded dataset: all 11 lists matched exactly.
   https://www.joradp.dz/FTP/jo-francais/2026/F2026025.pdf

2. **Official numbering and capitals: Décret présidentiel n° 26-206 du 25 mai 2026**, Journal officiel n° 40 of 3 June 2026, page 5. The PDF was downloaded and its text read directly. It establishes the numbered names 59 through 69 used below.
   https://www.joradp.dz/FTP/jo-francais/2026/F2026040.pdf

3. **GeoAlgeria 2.4.0**, by Yasser's studio. Public npm package downloaded with `npm pack geoalgeria@2.4.0 --ignore-scripts`; no package code or install script was executed. Package `data/algeria.json` supplied the complete bilingual compilation and administrative commune codes. Its metadata states an update date of 21 October 2026 and cites ONS, Journal officiel, and the 2019/2026 territorial reforms.
   - https://geoalgeria.com/fr/data/docs/geoalgeria
   - https://github.com/yasserstudio/geoalgeria
   - https://www.npmjs.com/package/geoalgeria/v/2.4.0
   - https://registry.npmjs.org/geoalgeria/-/geoalgeria-2.4.0.tgz
   - npm SHA-1: `1a8036455c76c44adbb05121f5566da81522b533`

4. **Secondary cross-check**, Algérie Eco, 5 June 2026. Its published numbering agrees with the official decree.
   https://algerie-eco.com/2026/06/05/algerie-les-noms-et-les-numeros-des-nouvelles-wilayas-fixes/

## Numbering of new wilayas

| Code | French | Arabic | Communes |
| --- | --- | --- | ---: |
| 59 | Aflou | آفلو | 12 |
| 60 | Barika | بريكة | 8 |
| 61 | El Kantara | القنطرة | 5 |
| 62 | Bir El Ater | بئر العاتر | 4 |
| 63 | El Aricha | العريشة | 4 |
| 64 | Ksar Chellala | قصر الشلالة | 6 |
| 65 | Aïn Ouessara | عين وسارة | 10 |
| 66 | Messaad | مسعد | 8 |
| 67 | Ksar El Boukhari | قصر البخاري | 21 |
| 68 | Bou Saâda | بوسعادة | 23 |
| 69 | El Abiodh Sidi Cheikh | الأبيض سيدي الشيخ | 7 |

The 108 communes assigned to those 11 wilayas were moved from their parent wilayas in the source, with no duplicate entries.

## Format and identifiers

The root array has records of the form:

```json
{
  "code": "35",
  "name": { "fr": "Boumerdès", "ar": "بومرداس" },
  "communes": [
    { "id": "3528", "name": { "fr": "Dellys", "ar": "دلس" } }
  ]
}
```

Wilaya codes are zero-padded two-character strings. Commune IDs are zero-padded four-character **administrative commune codes** from the source; they are not postal codes. A commune moved to a new wilaya keeps its source administrative code, which must not be interpreted as its current wilaya prefix.

This replaces the old local 58-wilaya list. Its database row IDs are different: **Dellys is now `35 / 3528`, replacing legacy row ID `1210`**. Free delivery must match Dellys specifically, not every commune in wilaya 35.

No postal codes, coordinates, OpenStreetMap IDs, or personal data were included. No delivery prices or carrier coverage were inferred. Actual carrier acceptance of the new codes may follow its own transition schedule; the admin controls the shop's enabled delivery methods and rates.

## Validation

Run:

```sh
node scripts/audit-locations.cjs
```

The audit passes for 69 unique sequential wilayas, all 1,541 globally unique commune IDs, French/Arabic names, counts for the 11 new wilayas, and Dellys in Boumerdès. In addition, all 108 new-wilaya commune names were compared directly against the official law during preparation.

## Attribution and licence

Administrative names and codes were compiled by **GeoAlgeria — Yasser's studio**, https://geoalgeria.com and https://yasser.studio. This subset contains only the bilingual administrative compilation, which the package explicitly offers under MIT. The package's separately licensed coordinates, boundary polygons, OpenStreetMap links, and postal-office records are not used here.

MIT License

Copyright (c) 2025-2026 Yasser's studio (https://yasser.studio)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
