/* Privat gAIa-tillägg till MärkR. Laddas före app.js och fogar in
   godkända interna verktyg utan att skriva om huvudregistret. */

'use strict';

(() => {
  const ursprungligFetch = window.fetch.bind(window);

  const extraBokmarken = [
    {
      url: 'https://gaia-kunskapsvav.hlgk.chatgpt.site',
      titel: 'gAIa Kunskapsväv',
      beskrivning: 'Privat och inloggningsskyddad kunskapsyta för AI ULF, vetenskap och omvärld, Naturveckan, Nautilus och Quanta, teknisk systemstatus samt svensk valopinion 2026. Visar nya verifierade fynd, senaste körningsdatum, kronologiska tidslinjer, originalkällor, metodisk osäkerhet, samband och versionssparade synteser. Endast uttryckligen godkända kunskapsflöden får visas.',
      taggar: [
        'gAIa',
        'Eget Projekt',
        'Webbapp',
        'Privat',
        'Forskning',
        'Syntes',
        'Källkritik',
        'Tidslinje',
        'Omvärldsbevakning',
        'AI',
        'Natur',
        'Valopinion',
        'Val 2026'
      ],
      tillagd: '2026-08-05',
      id: 'gaia-kunskapsvav'
    },
    {
      url: 'https://hktcr.github.io/gaia-tools/geor/',
      titel: 'GeoR, rese- och upptäcktskartor',
      beskrivning: 'gAIa-systemets samlade bibliotek för klickbara rese- och upptäcktskartor. Natur, kultur, historia, hållpunkter och navigationslänkar samlas per resa. Första kartan går från Sarpsborg till Beito via Hadeland och Valdres.',
      taggar: [
        'gAIa',
        'Eget Projekt',
        'Webbapp',
        'Karta',
        'Resa',
        'Natur',
        'Kultur',
        'Norge',
        'GeoR'
      ],
      tillagd: '2026-08-05',
      id: 'geor'
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
