/* Decorative, schematic pixel scenes. These illustrations are not site plans,
   measured locations, or representations of a particular approved development. */
(function () {
  'use strict';
  const c = {
    sky: '#263c50', skyLight: '#314c5d', ground: '#334a4e', path: '#b6a285',
    cream: '#e8cf9e', gold: '#edca85', goldLight: '#ffe2a1', wall: '#c89c88',
    pink: '#b9857d', shadow: '#1b2d3c', window: '#304658', light: '#f1d394',
    green: '#759065', greenLight: '#a6b77c', greenDark: '#496e59', trunk: '#96735a',
    teal: '#6bb6b4', tealDark: '#427d85', red: '#bf695f', white: '#f3e4c4',
    skin: '#dba982', ink: '#243440', pavement: '#74817b'
  };
  const rect = (x, y, w, h, fill) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"/>';
  const poly = (points, fill) => '<polygon points="' + points + '" fill="' + fill + '"/>';
  function tree(x, y, scale) {
    const s = scale || 1;
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      rect(7, 12, 4, 17, c.trunk) + rect(2, 5, 14, 14, c.greenDark) +
      rect(5, 1, 13, 13, c.green) + rect(0, 7, 9, 10, c.greenLight) +
      rect(6, 2, 6, 5, c.greenLight) + '</g>';
  }
  function person(x, y, shirt, skin, accessory) {
    let s = rect(x + 1, y, 5, 2, c.ink) + rect(x + 1, y + 2, 5, 5, skin || c.skin) +
      rect(x, y + 7, 7, 7, shirt || c.teal) + rect(x, y + 14, 3, 6, c.ink) +
      rect(x + 4, y + 14, 3, 6, c.ink) + rect(x - 2, y + 8, 2, 5, skin || c.skin) +
      rect(x + 7, y + 8, 2, 5, skin || c.skin);
    if (accessory === 'cane') s += rect(x + 9, y + 12, 2, 8, c.goldLight) + rect(x + 7, y + 11, 4, 2, c.goldLight);
    if (accessory === 'bag') s += rect(x + 8, y + 12, 5, 6, c.gold) + rect(x + 9, y + 10, 3, 2, c.gold);
    return s;
  }
  function block(x, y, w, h, options) {
    const o = options || {}, cols = o.cols || 4, rows = o.rows || 4;
    let s = poly((x + w) + ',' + y + ' ' + (x + w + 6) + ',' + (y + 4) + ' ' + (x + w + 6) + ',' + (y + h) + ' ' + (x + w) + ',' + (y + h - 4), c.pink) +
      rect(x, y, w, h, o.color || c.wall) + rect(x - 2, y - 3, w + 4, 4, c.cream) +
      rect(x + 2, y + h - 10, w - 4, 10, c.shadow);
    const stepX = (w - 8) / cols, stepY = (h - 16) / rows;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const wx = Math.round(x + 4 + col * stepX), wy = Math.round(y + 5 + row * stepY);
        s += rect(wx, wy, Math.max(3, Math.round(stepX) - 4), Math.max(3, Math.round(stepY) - 4), (row + col) % 4 === 0 ? c.light : c.window);
      }
    }
    s += rect(x + 5, y + h - 10, 3, 10, c.cream) + rect(x + w - 8, y + h - 10, 3, 10, c.cream);
    if (o.details) {
      s += rect(x + 4, y + 12, 7, 2, c.cream) + rect(x + 5, y + 14, 2, 5, c.teal) +
        rect(x + 8, y + 14, 3, 4, c.white) + rect(x + w - 10, y + 7, 6, 4, c.white) +
        rect(x + w - 9, y + 8, 1, 2, c.pavement) + rect(x + w - 7, y + 8, 2, 2, c.pavement) +
        rect(x + 3, y + 26, 8, 3, c.red) + rect(x + 3, y + 29, 8, 3, c.white) +
        rect(x + 4, y + 27, 2, 1, c.white);
    }
    return s;
  }
  const ground = () => rect(0, 58, 160, 22, c.ground) + rect(0, 68, 160, 12, c.path);
  const clouds = () => rect(8, 9, 15, 3, c.skyLight) + rect(14, 6, 14, 3, c.skyLight) + rect(127, 12, 22, 3, c.skyLight);
  const scenes = {
    history: function () {
      let s = ground() + clouds();
      s += rect(8, 42, 31, 22, c.trunk) + poly('4,43 24,28 44,43', c.cream) + rect(13, 49, 6, 7, c.window) + rect(25, 50, 7, 14, c.shadow);
      s += block(58, 27, 37, 39, { rows: 3, cols: 3 });
      s += block(115, 13, 31, 53, { rows: 5, cols: 3, color: c.cream });
      s += rect(13, 73, 126, 2, c.gold) + rect(20, 70, 6, 6, c.goldLight) + rect(73, 70, 6, 6, c.goldLight) + rect(130, 70, 6, 6, c.goldLight);
      return s;
    },
    homes: function () {
      return ground() + clouds() + block(10, 17, 53, 49, { rows: 4, cols: 4, details: true }) +
        block(88, 8, 48, 58, { rows: 5, cols: 4, color: c.cream }) + tree(139, 36, 1) +
        rect(72, 50, 8, 15, c.tealDark) + rect(70, 48, 12, 3, c.gold) + person(72, 51, c.red, c.skin, 'bag');
    },
    market: function () {
      let s = ground() + clouds() + block(109, 13, 31, 44, { rows: 4, cols: 3 });
      s += rect(10, 36, 96, 28, c.cream) + rect(6, 31, 104, 7, c.tealDark) + rect(14, 41, 20, 19, c.shadow) + rect(42, 41, 22, 19, c.shadow) + rect(72, 41, 22, 19, c.shadow);
      for (let i = 0; i < 8; i++) s += rect(10 + i * 12, 38, 12, 5, i % 2 ? c.cream : c.gold);
      s += rect(14, 54, 20, 9, c.trunk) + rect(16, 51, 5, 3, c.greenLight) + rect(23, 51, 5, 3, c.red) + rect(30, 51, 3, 3, c.gold);
      s += rect(43, 54, 20, 9, c.trunk) + rect(47, 50, 6, 4, c.white) + rect(55, 51, 6, 3, c.gold) + tree(140, 37, 1);
      return s + person(78, 49, c.pink, c.skin, 'bag') + person(117, 52, c.teal, '#b78161');
    },
    nature: function () {
      let s = rect(0, 54, 160, 26, c.greenDark) + clouds() + poly('0,74 41,64 78,64 116,52 160,52 160,60 117,60 80,71 44,71 0,80', c.path);
      s += tree(7, 26, 1.3) + tree(29, 17, 1.5) + tree(62, 28, 1) + tree(104, 13, 1.6) + tree(135, 29, 1.2);
      s += rect(77, 17, 4, 2, c.gold) + rect(81, 19, 4, 2, c.gold) + rect(85, 17, 4, 2, c.gold) + rect(91, 10, 3, 2, c.gold) + rect(94, 12, 3, 2, c.gold) + rect(97, 10, 3, 2, c.gold);
      return s + person(85, 49, c.gold, c.skin);
    },
    clinic: function () {
      let s = ground() + clouds() + rect(24, 24, 91, 41, c.cream) + rect(20, 20, 99, 5, c.pink) + rect(62, 13, 16, 13, c.white);
      s += rect(68, 15, 4, 10, c.tealDark) + rect(65, 18, 10, 4, c.tealDark);
      s += rect(31, 34, 19, 12, c.tealDark) + rect(57, 34, 19, 12, c.tealDark) + rect(83, 34, 23, 31, c.tealDark) + rect(94, 36, 2, 27, c.cream);
      s += rect(30, 39, 19, 2, c.teal) + rect(57, 39, 19, 2, c.teal) + rect(18, 61, 98, 5, c.pavement);
      s += poly('83,65 121,65 133,72 83,72', c.cream) + rect(112, 59, 19, 2, c.gold) + rect(112, 59, 2, 8, c.gold) + rect(129, 60, 2, 10, c.gold);
      return s + tree(2, 36, 1) + tree(139, 34, 1.1) + person(54, 51, c.teal, c.skin, 'cane');
    },
    access: function () {
      let s = ground() + clouds() + block(8, 10, 45, 48, { rows: 4, cols: 4 }) + tree(128, 24, 1.4);
      s += rect(58, 57, 32, 4, c.cream) + rect(59, 61, 3, 7, c.trunk) + rect(84, 61, 3, 7, c.trunk) + rect(58, 50, 32, 5, c.trunk);
      s += rect(49, 66, 70, 3, c.cream) + rect(109, 57, 24, 2, c.gold) + rect(109, 57, 2, 10, c.gold) + rect(131, 57, 2, 13, c.gold);
      s += person(66, 44, c.pink, c.skin, 'cane') + person(97, 45, c.teal, '#b78161');
      s += rect(112, 57, 12, 7, c.gold) + rect(111, 64, 4, 4, c.ink) + rect(122, 64, 4, 4, c.ink) + rect(110, 54, 4, 2, c.gold);
      return s;
    },
    rail: function () {
      let s = clouds() + rect(0, 56, 160, 24, c.ground) + rect(0, 64, 160, 16, c.path) + block(13, 16, 31, 37, { rows: 3, cols: 3 });
      s += rect(0, 54, 160, 3, c.cream) + rect(0, 60, 160, 3, c.cream);
      for (let x = 3; x < 160; x += 13) s += rect(x, 53, 4, 11, c.trunk);
      s += rect(53, 30, 83, 22, c.cream) + rect(49, 34, 4, 18, c.cream) + rect(136, 35, 5, 17, c.cream) + rect(49, 45, 92, 5, c.red);
      for (let x = 57; x < 130; x += 15) s += rect(x, 34, 10, 9, c.window);
      s += rect(60, 51, 9, 4, c.ink) + rect(119, 51, 9, 4, c.ink) + rect(141, 13, 2, 19, c.gold) + rect(131, 12, 22, 3, c.gold);
      s += rect(144, 16, 1, 10, c.gold) + rect(142, 25, 5, 2, c.gold);
      s += poly('22,68 27,77 17,77', c.red) + rect(20, 73, 5, 2, c.cream) + rect(15, 77, 14, 2, c.ink);
      return s;
    },
    planning: function () {
      let s = clouds() + rect(0, 56, 160, 24, c.greenDark) + tree(7, 24, 1.4) + tree(31, 16, 1.6) + tree(56, 29, 1.1);
      s += block(98, 18, 35, 48, { rows: 4, cols: 3, color: c.cream }) + block(133, 30, 22, 36, { rows: 3, cols: 2 });
      s += poly('0,75 49,66 80,66 99,69 160,69 160,77 98,77 79,73 50,73 0,80', c.path);
      s += rect(79, 29, 2, 23, c.gold) + rect(77, 28, 6, 2, c.gold) + rect(75, 52, 10, 2, c.gold) + rect(70, 55, 20, 2, c.gold);
      s += person(77, 50, c.teal, c.skin) + tree(87, 44, .6);
      return s;
    }
  };
  function render(key) {
    const draw = scenes[key] || scenes.homes;
    return '<svg class="community-pixel-art" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 80" aria-hidden="true" focusable="false" shape-rendering="crispEdges">' + rect(0, 0, 160, 80, c.sky) + draw() + '</svg>';
  }
  window.CM_COMMUNITY_ART = Object.freeze({ render: render });
}());
