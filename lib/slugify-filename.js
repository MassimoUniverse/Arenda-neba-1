'use strict';

/** Транслитерация кириллицы и slug: только [a-z0-9-] для имён файлов в uploads/ и public/. */
const RU_TO_LATIN = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
};

function slugifyAsciiFilename(str, maxLen = 50) {
  let out = '';
  for (const ch of String(str).toLowerCase()) {
    if (RU_TO_LATIN[ch]) out += RU_TO_LATIN[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else if (/\s/.test(ch) || ch === '_' || ch === '-') out += '-';
  }
  out = out.replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (!out) out = 'file';
  return out.substring(0, maxLen);
}

module.exports = { slugifyAsciiFilename };
