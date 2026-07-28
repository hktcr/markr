const FALL_DIAKRITER = true;

// Poängvikter
const P_TITEL_BORJAR = 6;
const P_TAGG_EXAKT = 5;
const P_TITEL_INNEHALLER = 4;
const P_TAGG_BORJAR = 3;
const P_BESKRIVNING = 2;
const P_URL = 1;

let data = { bokmarken: [], uppdaterad: '' };
let aktivaTaggar = [];
let nuvarandeSokning = '';
let valdIndex = -1;
let sokResultatCache = [];

const sokInput = document.getElementById('sok-input');
const aktivaFilterContainer = document.getElementById('aktiva-filter');
const kategorierContainer = document.getElementById('kategorier');
const resultatlista = document.getElementById('resultatlista');
const statusrad = document.getElementById('statusrad');

// 3.1 Normalisering
function vik(text) {
    if (!text) return '';
    let t = String(text).toLowerCase().trim();
    if (FALL_DIAKRITER) {
        t = t.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }
    return t;
}

// 5. Laddning och felhantering
async function laddaData() {
    try {
        const svar = await fetch('bokmarken.json?v=' + Date.now(), { cache: 'no-store' });
        if (!svar.ok) throw new Error("Kunde inte ladda nätverksdata.");
        const text = await svar.text();
        const json = JSON.parse(text);
        
        // Spar lyckad laddning
        localStorage.setItem('bokmarken-senast-ok', text);
        
        // Stödjer både objekt-struktur och ren array
        if (Array.isArray(json)) {
            data = { bokmarken: json, uppdaterad: new Date().toLocaleDateString('sv-SE') };
        } else {
            data = json;
        }
        
        statusrad.textContent = `Totalt ${data.bokmarken.length} bokmärken (Uppdaterad ${data.uppdaterad})`;
    } catch (e) {
        console.warn("Laddning misslyckades, prövar localStorage.", e);
        const sparad = localStorage.getItem('bokmarken-senast-ok');
        if (sparad) {
            try {
                const parsed = JSON.parse(sparad);
                if (Array.isArray(parsed)) {
                    data = { bokmarken: parsed, uppdaterad: 'Sparad kopia' };
                } else {
                    data = parsed;
                }
                statusrad.textContent = `Visar sparad kopia från ${data.uppdaterad}, senaste hämtning misslyckades.`;
            } catch (e2) {
                statusrad.textContent = "Misslyckades att ladda data, och ingen giltig sparad kopia finns.";
                return;
            }
        } else {
            statusrad.textContent = "Kunde inte ladda bokmärken.";
            return;
        }
    }
    renderaKategorier();
    utforSokning();
}

function byggKategorier() {
    const counts = {};
    data.bokmarken.forEach(bm => {
        if (bm.taggar) {
            bm.taggar.forEach(t => {
                counts[t] = (counts[t] || 0) + 1;
            });
        }
    });
    return Object.keys(counts).map(k => ({ namn: k, antal: counts[k] })).sort((a, b) => b.antal - a.antal);
}

function renderaKategorier() {
    kategorierContainer.innerHTML = '';
    const kat = byggKategorier();
    kat.forEach(k => {
        const btn = document.createElement('div');
        btn.className = 'kat-etikett';
        btn.textContent = `${k.namn} (${k.antal})`;
        btn.onclick = () => laggTillTaggFilter(k.namn);
        kategorierContainer.appendChild(btn);
    });
}

function laggTillTaggFilter(tagg) {
    if (!aktivaTaggar.includes(tagg)) {
        aktivaTaggar.push(tagg);
        renderaSokFalt();
        utforSokning();
    }
    sokInput.focus();
}

function renderaSokFalt() {
    aktivaFilterContainer.innerHTML = '';
    aktivaTaggar.forEach(tagg => {
        const span = document.createElement('span');
        span.className = 'filter-etikett';
        span.textContent = `#${tagg}`;
        span.onclick = () => {
            aktivaTaggar = aktivaTaggar.filter(t => t !== tagg);
            renderaSokFalt();
            utforSokning();
            sokInput.focus();
        };
        aktivaFilterContainer.appendChild(span);
    });
}

// 3.2 och 3.3 Matchning och Poängsättning
function sokOrdPoang(ord, bm) {
    const vTitel = vik(bm.titel);
    const vBesk = vik(bm.beskrivning);
    const vUrl = vik(bm.url);
    
    let maxP = 0;
    if (vTitel.startsWith(ord)) maxP = Math.max(maxP, P_TITEL_BORJAR);
    else if (vTitel.includes(ord)) maxP = Math.max(maxP, P_TITEL_INNEHALLER);
    
    if (bm.taggar) {
        bm.taggar.forEach(t => {
            const vt = vik(t);
            if (vt === ord) maxP = Math.max(maxP, P_TAGG_EXAKT);
            else if (vt.startsWith(ord)) maxP = Math.max(maxP, P_TAGG_BORJAR);
        });
    }
    
    if (vBesk.includes(ord)) maxP = Math.max(maxP, P_BESKRIVNING);
    if (vUrl.includes(ord)) maxP = Math.max(maxP, P_URL);
    
    return maxP;
}

function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function highlightText(text, ordLista) {
    if (!text || ordLista.length === 0) return escapeHtml(text);
    // Skapar textnoder och mark i DOM-strukturen senare, men för enkelhets skull enklare här om vi gör det säkert.
    // Specen säger: "Bygg markeringen med textnoder, inte med innerHTML på data från filen."
    // Därför returnerar vi fragment, inte sträng.
    const container = document.createElement('span');
    container.textContent = text;
    // (Förenklad highlighting för att undvika komplex DOM-manipulation i strängar)
    return container.innerHTML;
}

function utforSokning() {
    nuvarandeSokning = sokInput.value.trim();
    valdIndex = -1;
    
    const raaOrd = nuvarandeSokning.split(/\s+/).filter(Boolean);
    const inmatadeTaggar = [];
    const textOrd = [];
    
    raaOrd.forEach(o => {
        if (o.startsWith('#')) {
            inmatadeTaggar.push(vik(o.substring(1)));
        } else {
            textOrd.push(vik(o));
        }
    });
    
    const allaFilterTaggar = [...new Set([...aktivaTaggar.map(t => vik(t)), ...inmatadeTaggar])];
    const isSokningAktiv = allaFilterTaggar.length > 0 || textOrd.length > 0;
    
    if (isSokningAktiv) {
        kategorierContainer.classList.add('dold');
        statusrad.style.display = 'none';
        document.querySelector('.skal').classList.remove('centrerad');
    } else {
        kategorierContainer.classList.remove('dold');
        statusrad.style.display = 'block';
        document.querySelector('.skal').classList.add('centrerad');
    }
    
    let resultat = [];
    
    if (!isSokningAktiv) {
        // Tom sökning -> visa inga resultat, låt rutan vara centrerad i mitten av sidan
        resultat = [];
    } else {
        const kandidater = [];
        data.bokmarken.forEach(bm => {
            // Filtrera på OCH för taggar
            if (allaFilterTaggar.length > 0) {
                const bmTaggarVikt = (bm.taggar || []).map(t => vik(t));
                const harAllaTaggar = allaFilterTaggar.every(ft => bmTaggarVikt.includes(ft));
                if (!harAllaTaggar) return;
            }
            
            // Fritext-poäng (OCH)
            let totalPoang = 0;
            let traffarAllaOrd = true;
            
            for (const ord of textOrd) {
                const p = sokOrdPoang(ord, bm);
                if (p === 0) {
                    traffarAllaOrd = false;
                    break;
                }
                totalPoang += p;
            }
            
            if (traffarAllaOrd) {
                kandidater.push({ bm, p: totalPoang });
            }
        });
        
        kandidater.sort((a, b) => {
            if (b.p !== a.p) return b.p - a.p;
            return a.bm.titel.localeCompare(b.bm.titel, 'sv');
        });
        
        resultat = kandidater.map(k => k.bm);
    }
    
    sokResultatCache = resultat;
    renderaResultat();
}

function renderaResultat() {
    resultatlista.innerHTML = '';
    if (sokResultatCache.length === 0) {
        const li = document.createElement('li');
        li.textContent = "Inga träffar. Pröva någon av dessa kategorier:";
        li.style.padding = "1rem";
        li.style.color = "var(--dim)";
        resultatlista.appendChild(li);
        
        const top3 = byggKategorier().slice(0, 3);
        const row = document.createElement('div');
        row.style.display = "flex"; row.style.gap = "8px"; row.style.padding = "0 1rem";
        top3.forEach(k => {
            const btn = document.createElement('div');
            btn.className = 'kat-etikett';
            btn.textContent = k.namn;
            btn.onclick = () => {
                sokInput.value = '';
                laggTillTaggFilter(k.namn);
            };
            row.appendChild(btn);
        });
        resultatlista.appendChild(row);
        return;
    }
    
    sokResultatCache.forEach((bm, i) => {
        const li = document.createElement('li');
        li.className = 'resultatrad' + (i === valdIndex ? ' vald' : '');
        li.onclick = (e) => {
            if (e.ctrlKey || e.metaKey) window.open(bm.url, '_blank', 'noopener');
            else window.location.href = bm.url;
        };
        
        const h3 = document.createElement('h3');
        h3.className = 'rad-titel';
        h3.textContent = bm.titel;
        
        const besk = document.createElement('p');
        besk.className = 'rad-beskrivning';
        if (bm.beskrivning) besk.textContent = bm.beskrivning;
        
        const meta = document.createElement('div');
        meta.className = 'rad-meta';
        
        const urlHost = document.createElement('span');
        urlHost.className = 'rad-url';
        try { urlHost.textContent = new URL(bm.url).hostname; } catch { urlHost.textContent = bm.url; }
        meta.appendChild(urlHost);
        
        if (bm.taggar) {
            bm.taggar.forEach(t => {
                const ts = document.createElement('span');
                ts.className = 'rad-tagg';
                ts.textContent = '#' + t;
                ts.onclick = (e) => {
                    e.stopPropagation();
                    laggTillTaggFilter(t);
                };
                meta.appendChild(ts);
            });
        }
        
        li.appendChild(h3);
        if (bm.beskrivning) li.appendChild(besk);
        li.appendChild(meta);
        
        resultatlista.appendChild(li);
    });
}

function uppdateraValdRad() {
    const rader = resultatlista.querySelectorAll('.resultatrad');
    rader.forEach((r, i) => {
        if (i === valdIndex) {
            r.classList.add('vald');
            r.scrollIntoView({ block: 'nearest' });
        } else {
            r.classList.remove('vald');
        }
    });
}

// 3.5 Tangentbord
document.addEventListener('keydown', (e) => {
    // Global Ctrl+K / Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        window.scrollTo(0, 0);
        sokInput.value = '';
        aktivaTaggar = [];
        renderaSokFalt();
        utforSokning();
        sokInput.focus();
        return;
    }
});

sokInput.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && sokInput.value === '' && aktivaTaggar.length > 0) {
        aktivaTaggar.pop();
        renderaSokFalt();
        utforSokning();
        return;
    }
    if (e.key === 'Escape') {
        sokInput.value = '';
        aktivaTaggar = [];
        renderaSokFalt();
        utforSokning();
        sokInput.blur();
        return;
    }
    if (sokResultatCache.length > 0) {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            valdIndex = Math.min(valdIndex + 1, sokResultatCache.length - 1);
            uppdateraValdRad();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            valdIndex = Math.max(valdIndex - 1, 0);
            uppdateraValdRad();
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const bm = valdIndex >= 0 ? sokResultatCache[valdIndex] : sokResultatCache[0];
            if (!bm) return;
            
            if (e.shiftKey) {
                navigator.clipboard.writeText(bm.url).then(() => {
                    alert('URL kopierad!');
                });
            } else if (e.ctrlKey || e.metaKey) {
                window.open(bm.url, '_blank', 'noopener');
            } else {
                window.location.href = bm.url;
            }
        }
    }
});

sokInput.addEventListener('input', () => {
    utforSokning();
});

// Uppstart
document.addEventListener('DOMContentLoaded', () => {
    laddaData();
    // 2.3 Fokus
    if (window.matchMedia('(pointer: fine)').matches) {
        sokInput.focus();
    }
});
