const paths = {
 leaf: '<path d="M20 4c-9-1-16 3-16 10a6 6 0 0 0 6 6c7 0 11-7 10-16Z"/><path d="M4 20 15 9"/>',
 coins: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v6c0 4 16 4 16 0V6M4 12v6c0 4 16 4 16 0v-6"/>',
 people: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.9"/><circle cx="9" cy="7" r="4"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
 building: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h1m4 0h1M9 11h1m4 0h1M9 15h1m4 0h1M10 21v-3h4v3"/>',
 spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z"/>',
 sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4m11.2 11.2L19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',
 arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
 chevron: '<path d="m9 5 7 7-7 7"/>',
 close: '<path d="m6 6 12 12M6 18 18 6"/>',
 plus: '<path d="M12 5v14M5 12h14"/>',
 minus: '<path d="M5 12h14"/>',
 check: '<path d="m5 12 4 4L19 6"/>',
 target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
 layers: '<path d="m12 3 10 6-10 6L2 9ZM2 13l10 6 10-6M2 17l10 6 10-6"/>',
 reset: '<path d="M3 11a9 9 0 1 1 2 7M3 4v7h7"/>',
 help: '<circle cx="12" cy="12" r="9"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2-3 4m.1 3h.01"/>',
 settings: '<path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1Z"/>',
 shield: '<path d="m12 3 8 3v6c0 6-8 10-8 10S4 18 4 12V6Z"/><path d="m8 12 3 3 5-6"/>',
 tree: '<path d="m12 2-6 7h3l-5 7h6v6h4v-6h6l-5-7h3Z"/>',
 map: '<path d="m9 3 6 3 6-3v18l-6 3-6-3-6 3V6Z"/><path d="M9 3v18m6-15v18"/>',
 calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2M8 18h2"/>',
 clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 park: '<path d="m7 2-5 6h3L1 14h12L9 8h3Zm0 12v8m9-9h6m-6 3h6m-5-3v8m4-8v8"/>',
 home: '<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>',
 book: '<path d="M12 6C8 3 4 3 2 4v15c4-1 7 0 10 2m0-15c4-3 8-3 10-2v15c-4-1-7 0-10 2Z"/>',
 pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
 report: '<path d="M6 3h9l4 4v14H6ZM14 3v5h5M9 12h7m-7 4h7"/>',
 bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M9 21h6"/>',
 wind: '<path d="M2 8h13a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M2 16h7"/>'
};
export function icon(name, cls='') { return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.leaf}</svg>`; }

export function illustration(type='green') {
 const colors={green:['#d6e6c5','#79a862'],park:['#d3e6cb','#67906d'],funds:['#f4e6c4','#d0ad5c'],people:['#e1e7d7','#98a57d'],cool:['#d6e8e9','#82b5b2']};
 const c=colors[type]||colors.green;
 let drawing;
 const tree=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 15V0" stroke="#877c52" stroke-width="3"/><ellipse cy="-2" rx="10" ry="12" fill="${c[1]}"/><ellipse cx="-5" cy="-4" rx="6" ry="7" fill="#97b982"/></g>`;
 if(type==='funds') drawing=`<path d="M38 45 85 18 140 42 90 72Z" fill="#dbc88d"/><path d="m38 45 52 28 50-28v14L90 87 38 59Z" fill="#bdab77"/><path d="m61 36 53 29 12-7-53-29Z" fill="#faf3da"/><ellipse cx="95" cy="45" rx="15" ry="8" fill="#eac16a"/><ellipse cx="95" cy="42" rx="15" ry="8" fill="#fbe0a0"/><path d="M95 37v9m-4-6h7" stroke="#c2953d" stroke-width="2"/>${tree(33,63,.7)}`;
 else if(type==='people') drawing=`<path d="M30 69c15-24 103-24 120 0" fill="#ccd8b7"/><path d="M65 67h64v8H65Z" fill="#a59572"/><path d="M72 75v10m50-10v10" stroke="#8b7d5e" stroke-width="3"/><g fill="#d49770"><circle cx="76" cy="42" r="8"/><circle cx="107" cy="42" r="8"/></g><path d="M63 68V55q13-16 25 0v13" fill="#417f65"/><path d="M95 68V55q13-16 25 0v13" fill="#d69560"/><path d="M73 43v-8q13-8 14 8m12-2v-7q12-5 15 9" fill="#445044"/>${tree(41,60,1.15)}${tree(142,61,.9)}`;
 else if(type==='cool') drawing=`<path d="m43 46 48-25 45 25-45 25Z" fill="#eee8d3"/><path d="m50 48 41 22 39-22v29l-39 20-41-22Z" fill="#c4d4c9"/><path d="m41 44 51-27 48 26-8 5-40-20-41 22Z" fill="#7fae9e"/><path d="M73 57v23m37-23v23" stroke="#729b91" stroke-width="3"/><path d="M90 9v9m52 14h10m-20-15 7-7" stroke="#d8b66d" stroke-width="3"/>${tree(37,73,.8)}${tree(146,69,.8)}`;
 else if(type==='park') drawing=`<path d="m26 59 68-28 66 29-68 31Z" fill="#aac28b"/><path d="m27 67 68-28 64 29-65 30Z" fill="#bad39d"/><path d="M44 74q25-22 39-11t47-3" fill="none" stroke="#f2e6c9" stroke-width="8"/>${tree(52,47,1.2)}${tree(101,50,1.4)}${tree(136,66,.8)}<path d="m77 77 23 9" stroke="#937b54" stroke-width="5"/>`;
 else drawing=`<path d="m35 34 58-21 51 26-56 25Z" fill="#f4efdc"/><path d="m35 34 53 29v34L35 69Z" fill="#dddbcf"/><path d="m88 63 56-25v35L88 98Z" fill="#b8c6bc"/><path d="m42 34 50-16 43 21-47 20Z" fill="#8fb775"/><g fill="#70928a">${[0,1,2,3].map(i=>`<path d="m${44+i*10} ${47+i*5} 6 3v10l-6-3Z"/><path d="m${98+i*10} ${64-i*4.6} 6-3v10l-6 3Z"/>`).join('')}</g>${tree(72,27,.7)}${tree(102,31,.7)}${tree(125,37,.5)}`;
 return `<svg class="illustration" viewBox="0 0 180 100" aria-hidden="true"><rect width="180" height="100" fill="${c[0]}"/><circle cx="145" cy="20" r="12" fill="#f9f0cf" opacity=".8"/><path d="M0 83Q40 57 86 77t94-9v32H0Z" fill="${c[1]}" opacity=".16"/>${drawing}</svg>`;
}
