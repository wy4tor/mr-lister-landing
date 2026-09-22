# Pizzeria Mr. Lister landing page

Statički sajt: `index.html`, `styles.css`, `script.js`.

## Animacija i optimizacija

- Svih 160 frejmova koristi se iz `assets/frames-webp/` (1280 × 720, WebP kvalitet 80).
- WebP sekvenca ukupno ima 12.889.194 bajta, naspram 172.983.684 bajta originalnih PNG fajlova (92,5% manje).
- Skrol od vrha stranice do početka sekcije Ponuda pomera animaciju od prvog do poslednjeg frejma. Poslednji frejm ostaje iza svih narednih sekcija; skrol unazad vraća animaciju.
- Najviše četiri paralelna zahteva, dva paralelna dekodiranja i 24 dekodirana frejma u kešu. Kompresovani frejmovi ostaju dostupni za povratni skrol.
- Frejmovi blizu trenutnog skrola imaju prioritet. Iscrtavanje koristi requestAnimationFrame i vremenski zasnovano ublažavanje pomeranja; mirna stranica nema stalnu render petlju.
- Canvas rezolucija je ograničena radi manjeg GPU opterećenja. Skriven tab pauzira rad, a reduced-motion prikazuje statičan poslednji frejm.
- Vraćeni su originalni tekstualni logo, fontovi i vizuelni stil iz mr-lister-landing-v2.zip.

## Provera

Provereno u headless Chrome na 1440 × 900 i 390 × 844: učitavanje logotipa, prvi frejm na vrhu, frejm 160 u drugoj sekciji i kontaktu, povratak na prvi frejm, bez JavaScript grešaka i horizontalnog overflow-a. Proveren i reduced-motion prikaz.

## Objavljivanje

Objaviti `index.html`, `styles.css`, `script.js` i `assets/`. Originalni PNG frejmovi su sačuvani kao izvorni materijal; animacija učitava WebP verzije.

## Ispravka lokalnog prikaza

Direktno otvaranje index.html sada koristi Image učitavanje umesto fetch zahteva koje pregledač blokira za lokalne fajlove. HTTP prikaz zadržava kompresovani keš i koristi Image dekoder ako createImageBitmap nije dostupan. Provereni frejmovi 1, 41, 81, 120 i 160, zadržavanje poslednjeg i povratak na prvi, u lokalnom i HTTP prikazu na širinama 1440 i 390 px.

## Originalni stil

HTML i CSS su vraćeni iz korisnikovog v2 ZIP-a. Zadržan je optimizovani JavaScript sa svih 160 WebP frejmova. Blur kartica je smanjen sa 14 na 12,6 px, navigacije sa 16 na 14,4 px (10%). Donje zatamnjenje fiksirane pozadine je ublaženo sa 82% na 76%. Provereni desktop i mobilni prikaz, originalni tekstualni logo i animacija napred/nazad.


## GitHub

Repozitorijum: https://github.com/wy4tor/mr-lister-landing . Za objavljivanje dovoljni su HTML, CSS, JavaScript i assets/frames-webp. Izvorni PNG frejmovi i nekorišćeni JPG logo ostaju lokalno i isključeni su kroz .gitignore. Potpis wy4tor je običan tekst bez linka.

