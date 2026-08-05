/* Privat gAIa-tillägg till MärkR. Laddas före app.js och fogar in
   godkända interna verktyg utan att skriva om huvudregistret. */

'use strict';

(() => {
  const ursprungligFetch = window.fetch.bind(window);

  const extraBokmarken = [
    {
      url: 'https://github.com/hktcr/hktcr-1/tree/main/gaia-kunskapsvav',
      titel: 'gAIa kunskapsväv, privat förhandsversion',
      beskrivning: 'Privat, levande kunskapsyta för AI ULF, vetenskap och omvärld, Naturveckan, Nautilus och Quanta samt svensk valopinion 2026. Visar senaste verifierade fynd, tidslinjer, källor, metodisk osäkerhet och versionssparade synteser. Nuvarande länk går till det privata källagret och byts till den privata ChatGPT Site adressen när publiceringen är klar.',
      taggar: [
        'gAIa',
        'Eget Projekt',
        'Webbapp',
        'Privat',
        'Forskning',
        'Syntes',
        'Omvärldsbevakning',
        'AI',
        'Natur',
        'Val 2026'
      ],
      tillagd: '2026-08-05',
      id: 'gaia-kunskapsvav'
    }
  ];

  window.fetch = async function markrFetch(resurs, alternativ) {
    const adress = typeof resurs === 'string' ? resurs : resurs && resurs.url;
    const svar = await ursprungligFetch(resurs, alternativ);

    if (!adress || !adress.startsWith('bokmarken.json') || !svar.ok) return svar;

    try {
      const data = await svar.clone().json();
      const lista = Array.isArray(data) ? data : (Array.isArray(data.bokmarken) ? data.bokmarken : []);
      const befintliga = new Set(lista.map(post => String(post.url || '').trim()));

      for (const post of extraBokmarken) {
        if (!befintliga.has(post.url)) lista.push(post);
      }

      const sammanslaget = Array.isArray(data)
        ? lista
        : { ...data, uppdaterad: '2026-08-05', bokmarken: lista };

      return new Response(JSON.stringify(sammanslaget), {
        status: svar.status,
        statusText: svar.statusText,
        headers: { 'Content-Type': 'application/json; charset=utf-8' }
      });
    } catch (fel) {
      console.warn('gAIa-tillägget kunde inte fogas in i MärkR.', fel);
      return svar;
    }
  };
})();
