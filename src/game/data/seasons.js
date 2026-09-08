// src/game/data/seasons.js
// Описание четырёх сезонов гербария: наборы символов, палитры, русские названия.
// Каждый сезон — 6 видов растений + набор из 6 special-символов (snow/crocus/etc).
// Единый источник истины для SEASON_SYMS — все модули должны импортировать отсюда.

export const SEASONS = {
  summer: {
    syms: ['f-daisy', 'f-poppy', 'f-tulip', 'f-cornflower', 'f-sun', 'f-greens'],
    colors: ['#E8B33B', '#C2472E', '#DE7A84', '#5B6FB5', '#DCA43F', '#7E9270'],
    ru_gen: ['ромашек', 'маков', 'тюльпанов', 'васильков', 'подсолнухов', 'веточек зелени'],
    ru_sing: ['ромашки', 'маки', 'тюльпаны', 'васильки', 'подсолнухи', 'зелень'],
    ru_alm: ['ромашка', 'мак', 'тюльпан', 'василёк', 'подсол.', 'зелень'],
  },
  spring: {
    syms: ['s-snow', 's-crocus', 's-narc', 's-lily', 's-willow', 's-colts'],
    colors: ['#C2472E', '#A56CC7', '#E8A020', '#F6F9F2', '#D06090', '#E8A020'],
    ru_gen: ['бутонов розы', 'крокусов', 'нарциссов', 'ландышей', 'эхинацей', 'одуванчиков'],
    ru_sing: ['бутон розы', 'крокус', 'нарцисс', 'ландыш', 'эхинацея', 'одуванчик'],
    ru_alm: ['бутон розы', 'крокус', 'нарцисс', 'ландыш', 'эхинацея', 'одуванчик'],
  },
  autumn: {
    syms: ['a-maple', 'a-oak', 'a-rowan', 'a-acorn', 'a-wheat', 'a-mush'],
    colors: ['#9B6FC7', '#A62646', '#E8873A', '#E8763A', '#D8D4C8', '#C23030'],
    ru_gen: ['астр', 'георгинов', 'физалиса', 'георгинов медных', 'лунника', 'морозника алого'],
    ru_sing: ['астра', 'георгин пурпурный', 'физалис', 'георгин медный', 'лунник', 'морозник алый'],
    ru_alm: ['астра', 'георгин п.', 'физалис', 'георгин м.', 'лунник', 'морозник а.'],
  },
  winter: {
    syms: ['w-cone', 'w-snow', 'w-spruce', 'w-rowan', 'w-holly', 'w-mist'],
    colors: ['#C23030', '#FCFAF2', '#F2C94C', '#C23030', '#DE7A84', '#80A8F0'],
    ru_gen: ['пуансеттий', 'пуансеттий белых', 'зимников', 'остолистов', 'камелий', 'льнов'],
    ru_sing: ['пуансеттия', 'пуансеттия белая', 'зимник', 'остолист', 'камелия', 'лён'],
    ru_alm: ['пуансеттия', 'пуансет. бел.', 'зимник', 'остолист', 'камелия', 'лён'],
  },
};

export const SEASON_NAMES = {
  summer: 'Летний',
  spring: 'Весенний',
  autumn: 'Осенний',
  winter: 'Зимний',
};

// Порядок автосмены сезонов в дневнике.
export const SEASON_ORDER = ['summer', 'autumn', 'winter', 'spring'];

// Короткий accessor для символа по (сезон, тип).
export function seasonSym(season, t) {
  if (t === WILD) return 'f-wild';
  if (t === BULB) return 'g-bulb';
  if (t === BF) return 'g-butterfly';
  return SEASONS[season].syms[t];
}

// Константы типов особых тайлов (отрицательные id).
export const N = 8;
export const TYPES = 6;
export const MAX_BLOOM = 60;
export const WILD = -1;
export const STONE = -2;
export const BULB = -3;
export const BF = -4;

export default SEASONS;
