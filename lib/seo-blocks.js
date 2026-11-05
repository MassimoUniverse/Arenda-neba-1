// Серверная отрисовка блоков для поисковых роботов (главная и страницы техники).
// Робот Яндекса в основном читает HTML без выполнения скриптов: раньше каталог, отзывы
// и меню «Наш автопарк» появлялись только после JS, и для робота главная была без
// ссылок на технику. Скрипты в браузере потом перерисовывают эти блоки как и раньше.

function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function formatRub(n) {
  return Number(n).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₽';
}

// «от 18 000 ₽/полсмена, от 20 000 ₽/смена» → { half: 18000, full: 20000, unit: 'смена' }
function parsePrices(service) {
  const str = String(service.price || '');
  const result = { half: null, full: null, unit: service.price_type === 'day' ? 'сутки' : 'смена' };
  for (const m of str.matchAll(/(\d[\d\s]*)\s*₽\s*\/\s*([а-яё]+)/gi)) {
    const amount = parseInt(m[1].replace(/\s/g, ''), 10);
    if (!amount) continue;
    if (/^пол/i.test(m[2])) result.half = amount;
    else result.full = amount;
  }
  return result;
}

function findSpec(service, re) {
  const spec = parseJsonArray(service.custom_specs).find((s) => s && re.test(String(s.label || '')));
  return spec ? String(spec.value || '').trim() : '';
}

function heightOf(service) {
  const fromTitle = String(service.title || '').match(/(\d+)\s*метр/i);
  if (fromTitle) return parseInt(fromTitle[1], 10);
  const fromSpec = findSpec(service, /высота подъ[её]ма/i).match(/(\d+)/);
  return fromSpec ? parseInt(fromSpec[1], 10) : null;
}

function capacityOf(service) {
  return findSpec(service, /грузоподъ[её]мност/i);
}

function basketOf(service) {
  return findSpec(service, /корзин|платформ/i);
}

// Короткая подпись для меню «Наш автопарк»: «13 м», «Вездеход 30 м», «Самоходный подъёмник»
function shortLabel(service) {
  const title = String(service.title || '');
  const h = /(\d+)\s*метр/i.test(title) ? heightOf(service) : null;
  if (!h) return title;
  if (/вездеход/i.test(title)) return `Вездеход ${h} м`;
  if (/коленчат/i.test(title)) return `Коленчатая ${h} м`;
  if (/корзин/i.test(title)) return `${h} м, большая корзина`;
  return `${h} м`;
}

function priceText(service) {
  const p = parsePrices(service);
  return p.full ? `от ${formatRub(p.full)}/${p.unit}` : (service.price ? String(service.price) : 'по запросу');
}

function withVersion(url, updatedAt) {
  if (!url) return '/images/avtovyshka-13m.webp';
  const t = Date.parse(String(updatedAt || '').replace(' ', 'T') + 'Z');
  return isNaN(t) ? url : url + (url.includes('?') ? '&' : '?') + 'v=' + t;
}

// Диапазон высот, который компания указывает на всём сайте (описание, соцсети, плашка на главной).
// В таблице цен — фактические машины из базы.
const ADVERTISED_HEIGHT_RANGE = 'от 13 до 45 метров';

function heightRange(services) {
  const heights = services.map(heightOf).filter(Boolean);
  if (!heights.length) return '';
  return `от ${Math.min(...heights)} до ${Math.max(...heights)} метров`;
}

// ---------- Главная ----------

function renderDropdown(services) {
  return services.map((s) => `
              <a href="${escapeHtml(s.url)}" class="dropdown-menu-item"><span class="dropdown-menu-item-title">${escapeHtml(shortLabel(s))}</span></a>`).join('');
}

function renderServiceCards(services) {
  return services.map((s) => `
            <a class="service-card-link" href="${escapeHtml(s.url)}"><article class="service-card">
              <div class="service-card-image"><picture><img src="${escapeHtml(withVersion(s.image_url, s.updated_at))}" alt="${escapeHtml(s.title)}" loading="lazy" decoding="async"></picture></div>
              <div class="service-card-body">
                <h3 class="service-card-title">${escapeHtml(s.title)}</h3>
                <p class="service-card-meta">${escapeHtml(stripHtml(s.short_description))}</p>
                <div class="service-card-price">${escapeHtml(priceText(s))} <span class="price-vat">без НДС</span></div>
              </div>
            </article></a>`).join('');
}

function renderPopularCards(services) {
  const popular = services
    .filter((s) => Number(s.is_popular) === 1)
    .sort((a, b) => (a.popular_order || 0) - (b.popular_order || 0));
  const total = String(popular.length).padStart(2, '0');
  return popular.map((s, i) => {
    const bullets = parseJsonArray(s.card_bullets).slice(0, 2);
    return `
              <li class="stack-cards__item js-stack-cards__item">
                <div class="card__content">
                  <div class="card__bg"><img src="${escapeHtml(withVersion(s.image_url, s.updated_at))}" alt="${escapeHtml(s.title)}" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async"></div>
                  <div class="card__gradient"></div>
                  <div class="card__counter">${String(i + 1).padStart(2, '0')}/${total}</div>
                  <div class="card__body">
                    <h3 class="card__title">${escapeHtml(s.title)}</h3>
                    <p class="card__text">${escapeHtml(stripHtml(s.short_description))}</p>
                    ${bullets.length ? `<ul class="card__bullets">${bullets.map((b) => `<li>${escapeHtml(b)}</li>`).join('')}</ul>` : ''}
                    <div class="card__footer"><p class="card__price">${escapeHtml(priceText(s))} <span class="price-vat">без НДС</span></p></div>
                  </div>
                  <a href="${escapeHtml(s.url)}" class="card__link">Подробнее →</a>
                </div>
              </li>`;
  }).join('');
}

function renderReviews(reviews) {
  return reviews.map((r) => {
    const meta = [r.client_name, r.company].filter(Boolean).join(', ');
    return `
        <article class="review-card">
          <p class="review-text">${escapeHtml(r.text)}</p>
          ${meta ? `<p class="review-meta">${escapeHtml(meta)}</p>` : ''}
        </article>`;
  }).join('');
}

function renderCalcOptions(services) {
  return services.map((s, i) => `
              <option value="${escapeHtml(s.id)}"${i === 0 ? ' selected' : ''}>${escapeHtml(s.title)}</option>`).join('');
}

function homeFaq(services) {
  const prices = services.map(parsePrices);
  const fulls = prices.filter((p) => p.unit === 'смена' && p.full).map((p) => p.full);
  const halves = prices.filter((p) => p.half).map((p) => p.half);
  const kms = services.filter((s) => s.delivery_type !== 'negotiable' && s.delivery_per_km).map((s) => Number(s.delivery_per_km));
  const range = ADVERTISED_HEIGHT_RANGE;
  const faq = [];
  if (fulls.length) {
    faq.push({
      q: 'Сколько стоит аренда автовышки в Санкт-Петербурге?',
      a: `Смена (7 часов работы + 1 час подачи) — от ${formatRub(Math.min(...fulls))} без НДС.`
        + (halves.length ? ` Для части техники есть полсмены (3 часа + 1 час подачи) — от ${formatRub(Math.min(...halves))}.` : '')
        + ' Цены на каждую машину — в таблице выше и на её странице.'
    });
  }
  if (kms.length) {
    faq.push({
      q: 'Сколько стоит подача техники за КАД?',
      a: `Выезд за КАД оплачивается по километражу — от ${formatRub(Math.min(...kms))} за километр в каждую сторону, в зависимости от техники.`
    });
  }
  if (range) {
    faq.push({
      q: 'На какую высоту можно подняться?',
      a: `В автопарке техника с высотой подъёма ${range}: автовышки с большой корзиной, телескопические, вездеход и коленчатая автовышка, а также самоходный подъёмник и телескопический погрузчик.`
    });
  }
  faq.push(
    { q: 'Автовышка сдаётся с оператором?', a: 'Да, техника работает с нашим оператором — опытным специалистом с допусками.' },
    { q: 'Работаете ли вы ночью и в выходные?', a: 'Да, принимаем заявки и выезжаем на объекты круглосуточно, 24/7.' },
    { q: 'Как можно оплатить аренду?', a: 'Работаем с оплатой с НДС и без НДС, возможен перевод на карту банка.' }
  );
  return faq;
}

function faqHtml(faq) {
  return faq.map((f) => `
          <details class="faq-item">
            <summary>${escapeHtml(f.q)}</summary>
            <p>${escapeHtml(f.a)}</p>
          </details>`).join('');
}

function faqJsonLd(faq) {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
  }).replace(/</g, '\\u003c');
}

function renderSeoSection(services) {
  const range = ADVERTISED_HEIGHT_RANGE;
  const rows = services.map((s) => {
    const h = heightOf(s);
    return `
              <tr>
                <td><a href="${escapeHtml(s.url)}">${escapeHtml(s.title)}</a></td>
                <td>${h ? `${h} м` : '—'}</td>
                <td>${escapeHtml(capacityOf(s) || '—')}</td>
                <td class="price-cell">${escapeHtml(priceText(s))}</td>
              </tr>`;
  }).join('');
  const faq = homeFaq(services);
  return `
    <section id="prices" class="section seo-section">
      <div class="container">
        <div class="section-header">
          <h2>Аренда автовышек в Санкт-Петербурге и Ленинградской области</h2>
          <p>«Аренда Неба» сдаёт в аренду автовышки с оператором для работ на высоте ${escapeHtml(range)}. Вся техника в собственности и проходит регулярное ТО.</p>
        </div>

        <h3>Цены на аренду автовышек</h3>
        <div class="seo-table-wrap">
          <table class="seo-price-table">
            <thead><tr><th>Техника</th><th>Высота подъёма</th><th>Грузоподъёмность корзины</th><th>Цена</th></tr></thead>
            <tbody>${rows}
            </tbody>
          </table>
        </div>
        <p class="seo-note">Цены указаны без НДС. Смена — 7 часов работы + 1 час подачи. Выезд за КАД оплачивается по километражу.</p>

        <div class="seo-columns">
          <div>
            <h3>Для каких работ</h3>
            <ul class="seo-list">
              <li>ремонт, покраска и мойка фасадов, герметизация швов;</li>
              <li>монтаж и ремонт кровли, водостоков, очистка от снега и наледи;</li>
              <li>монтаж наружной рекламы, вывесок и баннеров;</li>
              <li>электромонтаж, обслуживание освещения и опор;</li>
              <li>обрезка и спил деревьев;</li>
              <li>подъём бригады с материалами — на автовышках с большой корзиной.</li>
            </ul>
          </div>
          <div>
            <h3>Как заказать</h3>
            <ol class="seo-list">
              <li>Позвоните или оставьте заявку на сайте — работаем 24/7.</li>
              <li>Менеджер подберёт технику под задачу и назовёт итоговую стоимость.</li>
              <li>Автовышка с оператором приезжает на объект в согласованное время.</li>
            </ol>
            <p>Работаем во всех районах Санкт-Петербурга и по Ленинградской области.</p>
          </div>
        </div>

        <h3>Частые вопросы</h3>
        <div class="faq-list">${faqHtml(faq)}
        </div>
      </div>
      <script type="application/ld+json">${faqJsonLd(faq)}</script>
    </section>`;
}

// ---------- Страницы техники ----------

function renderOtherEquipment(services, currentUrl) {
  const others = services.filter((s) => s.url !== currentUrl);
  if (!others.length) return '';
  return `
    <section class="other-equipment">
      <div class="container">
        <h2>Другая техника в аренду</h2>
        <div class="other-equipment-grid">${others.map((s) => {
          const h = heightOf(s);
          const cap = capacityOf(s);
          return `
          <a class="other-equipment-item" href="${escapeHtml(s.url)}">
            <span class="other-equipment-title">${escapeHtml(s.title)}</span>
            <span class="other-equipment-meta">${[h ? `${h} м` : '', cap].filter(Boolean).map(escapeHtml).join(' · ')}</span>
            <span class="other-equipment-price">${escapeHtml(priceText(s))}</span>
          </a>`;
        }).join('')}
        </div>
        <p class="other-equipment-all"><a href="/#prices">Цены на всю технику</a></p>
      </div>
    </section>`;
}

module.exports = {
  escapeHtml,
  heightRange,
  renderDropdown,
  renderServiceCards,
  renderPopularCards,
  renderReviews,
  renderCalcOptions,
  renderSeoSection,
  renderOtherEquipment,
  // для тестов
  parsePrices,
  heightOf,
  capacityOf,
  shortLabel
};
