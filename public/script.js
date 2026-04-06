// Вспомогательная функция: берёт первый абзац из HTML-описания (без тегов), обрезает до maxLen
function getShortDescription(html, maxLen) {
  if (!html) return '';
  maxLen = maxLen || 160;
  const plain = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return plain.length > maxLen ? plain.substring(0, maxLen).replace(/\s+\S*$/, '') + '…' : plain;
}

// Мобильное меню
document.addEventListener('DOMContentLoaded', () => {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenuBtn.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });
    
    // Закрытие меню при клике на ссылку и плавный скролл
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (href && href.startsWith('#')) {
          e.preventDefault();
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          
          if (targetElement) {
            // Закрываем меню
            mobileMenuBtn.classList.remove('active');
            mobileNav.classList.remove('active');
            document.body.style.overflow = '';
            
            // Плавный скролл с учетом фиксированного хедера
            const headerHeight = document.querySelector('.site-header')?.offsetHeight || 80;
            // Дополнительный отступ для формы "Быстрая заявка"
            const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
            
            window.scrollTo({
              top: Math.max(0, targetPosition),
              behavior: 'smooth'
            });
          }
        } else {
          // Для внешних ссылок просто закрываем меню
          mobileMenuBtn.classList.remove('active');
          mobileNav.classList.remove('active');
          document.body.style.overflow = '';
        }
      });
    });
    
    // Закрытие меню при клике вне его
    document.addEventListener('click', (e) => {
      if (!mobileNav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }
  
  // Load homepage data
  loadHomepageData();
  
  // Make contact cards clickable
  initContactCards();
});

// Make contact cards clickable
function initContactCards() {
  const phoneCard = document.querySelector('.contact-card-phone');
  const emailCard = document.querySelector('.contact-card-email');
  const addressCard = document.querySelector('.contact-card-address');
  
  // If cards are still divs (not converted to links yet), make them clickable
  if (phoneCard) {
    if (phoneCard.tagName === 'DIV') {
      phoneCard.style.cursor = 'pointer';
      phoneCard.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'tel:+79910009111';
      });
    }
    // Also make icon clickable
    const phoneIcon = phoneCard.querySelector('.contact-card-icon');
    if (phoneIcon) {
      phoneIcon.style.pointerEvents = 'auto';
      phoneIcon.style.cursor = 'pointer';
    }
  }
  
  if (emailCard) {
    if (emailCard.tagName === 'DIV') {
      emailCard.style.cursor = 'pointer';
      emailCard.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = 'mailto:suedima@rambler.ru';
      });
    }
    // Also make icon clickable
    const emailIcon = emailCard.querySelector('.contact-card-icon');
    if (emailIcon) {
      emailIcon.style.pointerEvents = 'auto';
      emailIcon.style.cursor = 'pointer';
    }
  }
  
  if (addressCard) {
    if (addressCard.tagName === 'DIV') {
      addressCard.style.cursor = 'pointer';
      addressCard.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.open('https://yandex.ru/maps/?text=Санкт-Петербург,+улица+Беринга+27+корпус+6', '_blank', 'noopener');
      });
    }
    // Also make icon clickable
    const addressIcon = addressCard.querySelector('.contact-card-icon');
    if (addressIcon) {
      addressIcon.style.pointerEvents = 'auto';
      addressIcon.style.cursor = 'pointer';
    }
  }
}

// Load homepage data from API
async function loadHomepageData() {
  try {
    const response = await fetch('/api/homepage');
    if (!response.ok) {
      console.warn('Failed to load homepage data, using defaults');
      return;
    }
    
    const data = await response.json();
    
    // Update hero title
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle && data.title) {
      heroTitle.textContent = data.title;
    }
    
    // Update hero subtitle
    const heroSubtitle = document.querySelector('.hero-subtitle');
    if (heroSubtitle && data.subtitle) {
      heroSubtitle.textContent = data.subtitle;
    }
    
    // Update hero video
    const heroVideo = document.querySelector('.hero-video');
    if (heroVideo && data.video_url) {
      heroVideo.src = data.video_url;
      heroVideo.load(); // Reload video
    }
  } catch (error) {
    console.error('Error loading homepage data:', error);
  }
}

// Простая инициализация данных для автопарка и отзывов.
// Позже можно заменить на реальные данные из API, как было раньше.

const FALLBACK_SERVICES = [
  {
    title: 'Автовышка 15 метров',
    price: 'от 18 000 ₽/смена',
    short: 'Компактная автовышка для работ во дворах и стеснённых условиях',
    image: '/images/avtovyshka-13m.webp',
    url: '/equipment/avtovyshka-15m.html',
  },
  {
    title: 'Автовышка-платформа 16 метров',
    price: 'от 20 000 ₽/смена',
    short: 'Оптимальна для сервисных и монтажных работ. Платформа 2x4м, грузоподъемность 1000 кг',
    image: '/images/avtovyshka-13m.webp',
    url: '/equipment/avtovyshka-16m.html',
  },
  {
    title: 'Автовышка 18 метров',
    price: 'от 24 000 ₽/смена',
    short: 'Работы на фасадах и рекламных конструкциях',
    image: '/images/avtovyshka-18m.webp',
    url: '/equipment/avtovyshka-18m.html',
  },
  {
    title: 'Автовышка-платформа 21 метр',
    price: 'от 21 000 ₽/смена',
    short: 'Платформа 2x4м с грузоподъемностью 1000 кг. Хороший запас высоты и вылета стрелы',
    image: '/images/avtovyshka-21m.webp',
    url: '/equipment/avtovyshka-21m.html',
  },
  {
    title: 'Автовышка 25 метров',
    price: 'от 21 000 ₽/смена',
    short: 'Работы на высоте до 8–9 этажа',
    image: '/images/avtovyshka-13m.webp',
    url: '/equipment/avtovyshka-25m.html',
  },
  {
    title: 'Автовышка 29 метров',
    price: 'от 26 000 ₽/смена',
    short: 'Монтажные и высотные работы повышенной сложности',
    image: '/images/avtovyshka-29m.webp',
    url: '/equipment/avtovyshka-29m.html',
  },
  {
    title: 'Автовышка 45 метров',
    price: 'от 22 000 ₽/смена',
    short: 'Крупные объекты, промышленные площадки',
    image: '/images/avtovyshka-13m.webp',
    url: '/equipment/avtovyshka-45m.html',
  },
  {
    title: 'Автовышка-вездеход 30 метров',
    price: 'от 28 000 ₽/смена',
    short: 'Работа там, где обычная техника не проедет',
    image: '/images/avtovyshka-13m.webp',
    url: '/equipment/avtovyshka-vezdehod-35m.html',
  },
  {
    title: 'Самоходная автовышка',
    price: 'от 28 000 ₽/смена',
    short: 'Манёвренная техника для внутренних работ',
    image: '/images/avtovyshka-13m.webp',
    url: '/equipment/samohodnaya-avtovyshka.html',
  },
];

const FALLBACK_REVIEWS = [
  {
    text: 'Регулярно заказываем автовышку для обслуживания наружной рекламы. Всегда приезжают вовремя, техника в хорошем состоянии, операторы работают аккуратно.',
    meta: 'Алексей, рекламное агентство',
  },
  {
    text: 'Нужна была автовышка 25 м для монтажа фасадных панелей. Всё сделали чётко, помогли подобрать нужную технику под объект.',
    meta: 'Ирина, строительная компания',
  },
  {
    text: 'Заказывали автовышку для обрезки деревьев во дворе. Приехали быстро, отработали без нареканий, помогли с оформлением перекрытия участка.',
    meta: 'Сергей, управляющая компания',
  },
];

// Данные для калькулятора (примерные базовые смены и километраж)
// Статический CALC_EQUIPMENT для специальных случаев (fallback)
const STATIC_CALC_EQUIPMENT = {
  '30offroad': {
    name: 'Автовышка‑вездеход 30 м',
    description: 'Работа там, где обычная техника не проедет. Полноприводное шасси для бездорожья, стройплощадок и грунтовых дорог.',
    baseShift: 30000,
    baseHalfShift: null,
    includedKm: 50,
    extraPerKm: 85,
    height: 30,
    capacity: 300,
    boom: 18,
    image: '/images/avtovyshka-13m.webp',
  },
  self: {
    name: 'Самоходная автовышка',
    description: 'Манёвренная техника для внутренних работ в помещениях, складах и торговых центрах. Компактные габариты позволяют проезжать через стандартные дверные проёмы.',
    baseShift: 18000,
    baseHalfShift: null,
    includedKm: 20,
    extraPerKm: 85,
    height: 12,
    capacity: 230,
    boom: 6,
    image: '/images/avtovyshka-13m.webp',
  },
};

// Динамический CALC_EQUIPMENT будет заполняться из API
let CALC_EQUIPMENT = {
  // Статические данные для специальных случаев
  ...STATIC_CALC_EQUIPMENT,
  // Временные данные для совместимости (будут заменены при загрузке из API)
  13: {
    name: 'Автовышка-платформа 13 м',
    description: 'Компактная автовышка-платформа для работ на небольшой высоте. Удобная для дворов и стеснённых условий города.',
    baseHalfShift: 15000,
    baseShift: 18000,
    includedKm: 30,
    extraPerKm: 85,
    height: 13,
    capacity: 400,
    boom: 7,
    image: '/images/avtovyshka-13m.webp',
  },
  15: {
    name: 'Автовышка 15 м',
    description: 'Компактная автовышка для работ во дворах и стеснённых условиях. Подходит для обслуживания фасадов, рекламы и освещения.',
    baseShift: 20000,
    includedKm: 30,
    extraPerKm: 85,
    height: 15,
    capacity: 200,
    boom: 8,
    image: '/images/avtovyshka-13m.webp',
  },
  16: {
    name: 'Автовышка 16 м',
    description: 'Оптимальна для сервисных и монтажных работ. Платформа 2×4 м, грузоподъёмность 1000 кг — удобна для бригады с инструментом.',
    baseHalfShift: 15000,
    baseShift: 20000,
    includedKm: 30,
    extraPerKm: 85,
    height: 16,
    capacity: 200,
    boom: 9,
    image: '/images/avtovyshka-13m.webp',
  },
  17: {
    name: 'Автовышка 17 м',
    description: 'Универсальная автовышка для высотных работ до 5–6 этажа. Подходит для монтажа, обслуживания фасадов и рекламных конструкций.',
    baseShift: 20000,
    includedKm: 30,
    extraPerKm: 85,
    height: 17,
    capacity: 200,
    boom: 10,
    image: '/images/avtovyshka-13m.webp',
  },
  18: {
    name: 'Автовышка 18 м',
    description: 'Популярная модель для работ на фасадах и рекламных конструкциях. Большая корзина СУПЕРДЕК для удобной работы.',
    baseHalfShift: 18000,
    baseShift: 22000,
    includedKm: 30,
    extraPerKm: 85,
    height: 18,
    capacity: 1000,
    boom: 11,
    image: '/images/avtovyshka-18m.webp',
  },
  21: {
    name: 'Автовышка 21 м',
    description: 'Универсальная техника с большой платформой и хорошим запасом высоты. Подходит для работ до 7 этажа.',
    baseHalfShift: 20000,
    baseShift: 24000,
    includedKm: 30,
    extraPerKm: 85,
    height: 21,
    capacity: 250,
    boom: 12,
    image: '/images/avtovyshka-21m.webp',
  },
  25: {
    name: 'Автовышка 25 м',
    description: 'Работы на высоте до 8–9 этажа. Подходит для промышленных объектов, высотного монтажа и обслуживания зданий.',
    baseHalfShift: 20000,
    baseShift: 23000,
    includedKm: 40,
    extraPerKm: 85,
    height: 25,
    capacity: 250,
    boom: 14,
    image: '/images/avtovyshka-25m.webp',
  },
  29: {
    name: 'Автовышка 29 м',
    description: 'Мощная техника для высотных работ повышенной сложности. Монтаж, обслуживание высотных зданий и промышленных объектов.',
    baseShift: 26000,
    includedKm: 40,
    extraPerKm: 85,
    height: 29,
    capacity: 300,
    boom: 16,
    image: '/images/avtovyshka-29m.webp',
  },
  45: {
    name: 'Автовышка 45 м',
    description: 'Для крупных объектов и промышленных площадок. Максимальная высота подъёма для сложных строительных и монтажных задач.',
    baseShift: 36000,
    includedKm: 50,
    extraPerKm: 85,
    height: 45,
    capacity: 320,
    boom: 20,
    image: '/images/avtovyshka-13m.webp',
  },
};

// Функция для извлечения высоты из названия услуги
function extractHeightFromTitle(title) {
  if (!title) return null;
  const match = title.match(/(\d+)\s*м/i);
  return match ? parseInt(match[1]) : null;
}

// Функция для извлечения характеристик из specifications
function parseSpecifications(specs) {
  if (!specs) return {};
  const result = {};
  
  // Извлекаем грузоподъемность
  const capacityMatch = specs.match(/грузопод[ъё]мность[^:]*:\s*(\d+)\s*кг/i);
  if (capacityMatch) result.capacity = parseInt(capacityMatch[1]);
  
  // Извлекаем вылет стрелы
  const boomMatch = specs.match(/вылет[^:]*:\s*(?:до\s*)?(\d+)\s*м/i);
  if (boomMatch) result.boom = parseInt(boomMatch[1]);
  
  return result;
}

// Функция для добавления параметра обхода кэша к URL изображения
function addCacheBuster(url, updatedAt) {
  if (!url) return url;
  // Если URL уже содержит параметры запроса, добавляем timestamp
  // Если нет, добавляем ?v=timestamp
  const separator = url.includes('?') ? '&' : '?';
  // Используем timestamp последнего обновления услуги или текущее время
  let timestamp;
  if (updatedAt) {
    // Преобразуем дату в timestamp (если это строка даты)
    try {
      const date = new Date(updatedAt);
      timestamp = date.getTime();
    } catch (e) {
      timestamp = Date.now();
    }
  } else {
    timestamp = Date.now();
  }
  return url + separator + 'v=' + timestamp;
}

/** Пути из админки: image_url + галерея images[], без дубликатов. Сначала /uploads/ (загрузки), затем прочее, статика avtovyshka в конце. */
function collectAdminImagePaths(service) {
  const paths = [];
  const seen = new Set();
  function push(raw) {
    if (!raw || typeof raw !== 'string') return;
    let p = raw.trim();
    if (!p) return;
    if (p.startsWith('http://localhost:3000/')) {
      p = p.replace('http://localhost:3000', '');
    }
    if (p.startsWith('http://') || p.startsWith('https://')) {
      try {
        p = new URL(p).pathname;
      } catch (e) {
        return;
      }
    }
    if (!p.startsWith('/')) p = '/' + p;
    if (!seen.has(p)) {
      seen.add(p);
      paths.push(p);
    }
  }
  if (service.image_url) push(service.image_url);
  let imgs = service.images;
  if (imgs && typeof imgs === 'string') {
    try {
      imgs = JSON.parse(imgs);
    } catch (e) {
      imgs = String(imgs).split(/[\n\r,]+/).map((u) => u.trim()).filter(Boolean);
    }
  }
  if (imgs && Array.isArray(imgs)) {
    for (const im of imgs) {
      const s = typeof im === 'string' ? im : (im && (im.url || im.src || im));
      push(s);
    }
  }
  function priority(path) {
    if (path.startsWith('/uploads/')) return 0;
    if (/^\/images\/avtovyshka-.*\.webp$/i.test(path)) return 2;
    if (path.startsWith('/images/')) return 1;
    return 1;
  }
  return paths.sort((a, b) => priority(a) - priority(b));
}

/** Как в админке: сначала главное image_url, затем галерея по порядку (без перестановки uploads вперёд). */
function collectAdminImagePathsOrdered(service) {
  const paths = [];
  const seen = new Set();
  function push(raw) {
    if (!raw || typeof raw !== 'string') return;
    let p = raw.trim();
    if (!p) return;
    if (p.startsWith('http://localhost:3000/')) {
      p = p.replace('http://localhost:3000', '');
    }
    if (p.startsWith('http://') || p.startsWith('https://')) {
      try {
        p = new URL(p).pathname;
      } catch (e) {
        return;
      }
    }
    if (!p.startsWith('/')) p = '/' + p;
    if (!seen.has(p)) {
      seen.add(p);
      paths.push(p);
    }
  }
  if (service.image_url) push(service.image_url);
  let imgs = service.images;
  if (imgs && typeof imgs === 'string') {
    try {
      imgs = JSON.parse(imgs);
    } catch (e) {
      imgs = String(imgs).split(/[\n\r,]+/).map((u) => u.trim()).filter(Boolean);
    }
  }
  if (imgs && Array.isArray(imgs)) {
    for (const im of imgs) {
      const s = typeof im === 'string' ? im : (im && (im.url || im.src || im));
      push(s);
    }
  }
  return paths;
}

// Функция для определения изображения по URL или названию
function getImageForService(service, useCacheBuster = true) {
  const updatedAt = service.updated_at || service.updatedAt;
  let imageUrl = null;
  
  // Если есть image_url в базе, используем его (приоритет 1)
  if (service.image_url) {
    // Если это полный URL (http://localhost:3000/...), преобразуем в относительный путь
    if (service.image_url.startsWith('http://localhost:3000/')) {
      imageUrl = service.image_url.replace('http://localhost:3000', '');
    } else if (service.image_url.startsWith('https://') || service.image_url.startsWith('http://')) {
      imageUrl = service.image_url;
    } else if (service.image_url.startsWith('/')) {
      imageUrl = service.image_url;
    } else {
      imageUrl = '/' + service.image_url;
    }
  }
  
  // Если есть массив images, используем первое изображение (приоритет 2)
  if (!imageUrl && service.images && Array.isArray(service.images) && service.images.length > 0) {
    const firstImage = service.images[0];
    let imgUrl = typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage);
    
    // Преобразуем localhost URL в относительный путь
    if (imgUrl.startsWith('http://localhost:3000/')) {
      imgUrl = imgUrl.replace('http://localhost:3000', '');
    }
    
    if (imgUrl.startsWith('https://') || imgUrl.startsWith('http://')) {
      imageUrl = imgUrl;
    } else if (imgUrl.startsWith('/')) {
      imageUrl = imgUrl;
    } else {
      imageUrl = '/' + imgUrl;
    }
  }
  
  // Если изображение не найдено, определяем по URL (fallback)
  if (!imageUrl) {
    const url = (service.url || '').toLowerCase();
    if (url.includes('13m')) imageUrl = '/images/avtovyshka-13m.webp';
    else if (url.includes('15m')) imageUrl = '/images/avtovyshka-15m.webp';
    else if (url.includes('16m')) imageUrl = '/images/avtovyshka-16m.webp';
    else if (url.includes('17m')) imageUrl = '/images/avtovyshka-17m.webp';
    else if (url.includes('18m')) imageUrl = '/images/avtovyshka-18m.webp';
    else if (url.includes('21m')) imageUrl = '/images/avtovyshka-21m.webp';
    else if (url.includes('25m')) imageUrl = '/images/avtovyshka-25m.webp';
    else if (url.includes('29m')) imageUrl = '/images/avtovyshka-29m.webp';
    else if (url.includes('45m')) imageUrl = '/images/avtovyshka-45m.webp';
    else if (url.includes('vezdehod') || url.includes('вездеход')) imageUrl = '/images/avtovyshka-vezdehod-30m.webp';
    else if (url.includes('samohodnaya') || url.includes('самоходная')) imageUrl = '/images/avtovyshka-13m.webp';
    else {
      // Определяем по высоте из названия
      const height = extractHeightFromTitle(service.title);
      if (height) {
        if (height === 13) imageUrl = '/images/avtovyshka-13m.webp';
        else if (height === 15) imageUrl = '/images/avtovyshka-15m.webp';
        else if (height === 16) imageUrl = '/images/avtovyshka-16m.webp';
        else if (height === 17) imageUrl = '/images/avtovyshka-17m.webp';
        else if (height === 18) imageUrl = '/images/avtovyshka-18m.webp';
        else if (height === 21) imageUrl = '/images/avtovyshka-21m.webp';
        else if (height === 25) imageUrl = '/images/avtovyshka-25m.webp';
        else if (height === 29) imageUrl = '/images/avtovyshka-29m.webp';
        else if (height === 45) imageUrl = '/images/avtovyshka-45m.webp';
      }
    }
    
    // Если всё ещё не найдено, используем fallback
    if (!imageUrl) {
      imageUrl = '/images/avtovyshka-13m.webp';
    }
  }
  
  // Если нашли изображение, добавляем параметр обхода кэша
  if (imageUrl && useCacheBuster) {
    return addCacheBuster(imageUrl, updatedAt);
  }
  
  return imageUrl;
}

// Функция для определения базовой цены из price
function parsePrice(priceStr) {
  if (!priceStr) return { baseShift: 18000, baseHalfShift: null };
  
  let baseShift = 18000;
  let baseHalfShift = null;
  
  // Ищем цену за полсмену (до запятой или если есть слово "полсмен")
  const halfShiftMatch = priceStr.match(/(\d+[\s\d]*)\s*₽\s*\/\s*полсмен/i);
  if (halfShiftMatch) {
    baseHalfShift = parseInt(halfShiftMatch[1].replace(/\s/g, ''));
  } else {
    // Пробуем найти до запятой
    const beforeComma = priceStr.split(',')[0];
    if (beforeComma && beforeComma.includes('полсмен')) {
      const match = beforeComma.match(/(\d+[\s\d]*)/);
      if (match) baseHalfShift = parseInt(match[1].replace(/\s/g, ''));
    }
  }
  
  // Ищем цену за смену (после запятой или если нет полсмены)
  const shiftMatch = priceStr.match(/(\d+[\s\d]*)\s*₽\s*\/\s*смен/i);
  if (shiftMatch) {
    baseShift = parseInt(shiftMatch[1].replace(/\s/g, ''));
  } else {
    // Пробуем найти после запятой
    const afterComma = priceStr.split(',')[1] || priceStr;
    if (afterComma && afterComma.includes('смен')) {
      const match = afterComma.match(/(\d+[\s\d]*)/);
      if (match) baseShift = parseInt(match[1].replace(/\s/g, ''));
    } else if (!baseHalfShift) {
      // Если нет полсмены, ищем любое число в строке
      const match = priceStr.match(/(\d+[\s\d]*)/);
      if (match) baseShift = parseInt(match[1].replace(/\s/g, ''));
    }
  }
  
  return { baseShift, baseHalfShift };
}

/** Обновить нативный select «смен» и кастомный dropdown: полусмена только если в конфиге есть baseHalfShift */
function syncMainCalcHalfShiftOption() {
  const shiftsSelectEl = document.getElementById('calc-shifts');
  const equipSel = document.getElementById('calc-equipment');
  if (!shiftsSelectEl || !equipSel) return;
  const config = CALC_EQUIPMENT[equipSel.value];
  if (!config) return;
  const allowHalf = config.baseHalfShift != null && config.baseHalfShift !== '' && config.baseHalfShift !== undefined;
  let halfOpt = shiftsSelectEl.querySelector('option[value="0.5"]');
  if (allowHalf) {
    if (!halfOpt) {
      halfOpt = document.createElement('option');
      halfOpt.value = '0.5';
      halfOpt.textContent = 'Полсмены';
      shiftsSelectEl.insertBefore(halfOpt, shiftsSelectEl.firstChild);
    }
  } else {
    if (halfOpt) halfOpt.remove();
    if (shiftsSelectEl.value === '0.5') shiftsSelectEl.value = '1';
  }
  const custom = shiftsSelectEl.previousElementSibling;
  if (!custom || !custom.classList.contains('calc-select')) return;
  const list = custom.querySelector('.calc-select-options-list');
  const btn = custom.querySelector('.calc-select-current');
  if (!list || !btn) return;
  list.innerHTML = '';
  Array.from(shiftsSelectEl.options).forEach((opt) => {
    const li = document.createElement('li');
    li.className = 'calc-select-option';
    li.dataset.value = opt.value;
    li.textContent = opt.textContent;
    if (opt.selected) li.classList.add('is-active');
    li.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      shiftsSelectEl.value = opt.value;
      btn.textContent = opt.textContent;
      list.querySelectorAll('.calc-select-option').forEach((el) => el.classList.remove('is-active'));
      li.classList.add('is-active');
      custom.classList.remove('open');
      const shiftsField = shiftsSelectEl.closest('.field');
      if (shiftsField) shiftsField.classList.remove('is-open');
      const customInput = document.getElementById('calc-shifts-custom');
      if (customInput) {
        if (opt.value === 'more') {
          customInput.style.display = 'block';
          customInput.required = true;
        } else {
          customInput.style.display = 'none';
          customInput.required = false;
        }
      }
      if (typeof window.updateCalculatorSum === 'function') window.updateCalculatorSum();
    });
    list.appendChild(li);
  });
  btn.textContent = shiftsSelectEl.options[shiftsSelectEl.selectedIndex]?.textContent || '';
  list.querySelectorAll('.calc-select-option').forEach((el) => {
    el.classList.toggle('is-active', el.dataset.value === shiftsSelectEl.value);
  });
}

// Загрузка данных для калькулятора из API
async function loadCalculatorEquipmentFromAPI() {
  try {
    const response = await fetch('/api/services');
    if (!response.ok) {
      console.warn('Failed to load services for calculator, using static data');
      return;
    }
    
    const services = await response.json();
    
    // Преобразуем услуги в формат CALC_EQUIPMENT
    const dynamicEquipment = {};
    const fallbackCalc = CALC_EQUIPMENT;
    
    services.forEach(service => {
      if (!service.active) return; // Пропускаем неактивные услуги
      
      const url = (service.url || '').toLowerCase();
      const title = (service.title || '').toLowerCase();
      
      // Сначала проверяем, является ли это самоходной, вездеходом или погрузчиком
      const isSamohodnaya = url.includes('samohodnaya') || url.includes('самоходная') || title.includes('самоходная');
      const isVezdehod = url.includes('vezdehod') || url.includes('вездеход') || title.includes('вездеход');
      const isPogruzchik = url.includes('pogruzchik') || url.includes('погрузчик') || title.includes('погрузчик') || title.includes('телескопический');
      
      let key;
      let height = null;
      
      if (isSamohodnaya) {
        // Самоходная вышка - всегда используем ключ 'self'
        key = 'self';
      } else if (isVezdehod) {
        // Вездеход - всегда используем ключ '30offroad', даже если есть высота в названии
        key = '30offroad';
        // Извлекаем высоту для отображения, но не используем как ключ
        height = extractHeightFromTitle(service.title);
        if (!height && service.height_lift) {
          const heightMatch = service.height_lift.match(/(\d+(?:\.\d+)?)/);
          if (heightMatch) {
            height = Math.round(parseFloat(heightMatch[1]));
          }
        }
        if (!height) height = 30; // По умолчанию для вездехода
      } else if (isPogruzchik) {
        // Телескопический погрузчик - используем специальный ключ для сортировки в конец
        key = 'loader';
        // Извлекаем высоту для отображения, если есть
        height = extractHeightFromTitle(service.title);
        if (!height && service.height_lift) {
          const heightMatch = service.height_lift.match(/(\d+(?:\.\d+)?)/);
          if (heightMatch) {
            height = Math.round(parseFloat(heightMatch[1]));
          }
        }
      } else {
        // Обычная автовышка - извлекаем высоту и используем как ключ
        height = extractHeightFromTitle(service.title);
        if (!height && service.height_lift) {
          const heightMatch = service.height_lift.match(/(\d+(?:\.\d+)?)/);
          if (heightMatch) {
            height = Math.round(parseFloat(heightMatch[1]));
          }
        }
        
        if (!height) {
          // Пропускаем услуги без высоты и без специального типа
          return;
        }
        
        key = height.toString();
      }
      
      // Получаем изображение (функция getImageForService уже обрабатывает image_url и images)
      const image = getImageForService(service);
      
      // Парсим цены
      const prices = parsePrice(service.price);
      
      // Извлекаем характеристики из новых полей или из specifications
      const specs = parseSpecifications(service.specifications);
      let capacity = specs.capacity || 200;
      let boom = specs.boom;
      
      // Используем данные из новых полей если они есть
      if (service.max_capacity) {
        const capacityMatch = service.max_capacity.match(/(\d+)/);
        if (capacityMatch) {
          capacity = parseInt(capacityMatch[1]);
        }
      }
      
      if (service.max_reach) {
        const reachMatch = service.max_reach.match(/(\d+(?:\.\d+)?)/);
        if (reachMatch) {
          boom = Math.round(parseFloat(reachMatch[1]));
        }
      }
      
      // Если вылет не найден, используем формулу
      if (!boom && height) {
        boom = Math.round(height * 0.6);
      } else if (!boom) {
        boom = 6; // Для самоходной по умолчанию
      }

      // Если API не отдал нормальные значения в новых полях (часто пустые строки),
      // не перезаписываем численные характеристики из статического fallback.
      const hasStructuredSpecs =
        (service.height_lift && String(service.height_lift).trim()) ||
        (service.max_reach && String(service.max_reach).trim()) ||
        (service.max_capacity && String(service.max_capacity).trim());
      if (!hasStructuredSpecs) {
        const fb = fallbackCalc && fallbackCalc[key];
        if (fb) {
          height = fb.height;
          capacity = fb.capacity;
          boom = fb.boom;
        }
      }
      
      // Получаем delivery_per_km из базы или используем значение по умолчанию
      const extraPerKm = service.delivery_per_km || 85;
      
      dynamicEquipment[key] = {
        name: service.title,
        description: service.short_description || getShortDescription(service.description),
        baseShift: prices.baseShift,
        baseHalfShift: prices.baseHalfShift,
        includedKm: 30,
        extraPerKm: extraPerKm,
        height: height || (key === 'self' ? 12 : key === '30offroad' ? 30 : null),
        capacity: capacity,
        boom: boom,
        image: image
      };
    });
    
    // Объединяем данные: сначала статические (fallback), потом динамические (приоритет)
    // Это гарантирует, что данные из базы перезапишут статические данные
    CALC_EQUIPMENT = {
      ...STATIC_CALC_EQUIPMENT,
      ...dynamicEquipment
    };
    
    // Заполняем select опциями
    populateCalculatorSelect();
    if (typeof syncMainCalcHalfShiftOption === 'function') syncMainCalcHalfShiftOption();
    if (typeof window.updateCalculatorSum === 'function') window.updateCalculatorSum();
    
    console.log('✅ Calculator equipment loaded from API:', Object.keys(CALC_EQUIPMENT).length, 'items');
  } catch (error) {
    console.error('Error loading calculator equipment from API:', error);
    // Используем статические данные при ошибке
  }
}

// Заполнение select опциями из CALC_EQUIPMENT
function populateCalculatorSelect() {
  const selectEl = document.getElementById('calc-equipment');
  if (!selectEl) return;
  
  // Сохраняем выбранное значение
  const currentValue = selectEl.value;
  
  // Очищаем существующие опции
  selectEl.innerHTML = '';
  
  // Сортируем ключи по высоте (числовые значения), телескопический погрузчик в конце
  const sortedKeys = Object.keys(CALC_EQUIPMENT).sort((a, b) => {
    // Телескопический погрузчик всегда в конце
    if (a === 'loader') return 1;
    if (b === 'loader') return -1;
    
    const numA = parseInt(a) || 999;
    const numB = parseInt(b) || 999;
    if (numA !== 999 && numB !== 999) return numA - numB;
    if (numA === 999) return 1;
    if (numB === 999) return -1;
    return a.localeCompare(b);
  });
  
  // Добавляем опции
  sortedKeys.forEach(key => {
    const config = CALC_EQUIPMENT[key];
    if (!config) return;
    
    const option = document.createElement('option');
    option.value = key;
    option.textContent = config.name;
    
    // Восстанавливаем выбранное значение или выбираем первую опцию
    if (key === currentValue) {
      option.selected = true;
    } else if (selectEl.options.length === 0 && !currentValue) {
      option.selected = true;
    }
    
    selectEl.appendChild(option);
  });
  
  // Если выбранное значение не найдено, выбираем первую опцию
  if (selectEl.value !== currentValue && selectEl.options.length > 0) {
    selectEl.options[0].selected = true;
  }
  
  // Обновляем кастомный select если он уже создан
  const customSelect = selectEl.parentNode.querySelector('.calc-select');
  if (customSelect) {
    const currentBtn = customSelect.querySelector('.calc-select-current');
    const list = customSelect.querySelector('.calc-select-options-list');
    
    if (currentBtn && list) {
      currentBtn.textContent = selectEl.options[selectEl.selectedIndex]?.textContent || '';
      list.innerHTML = '';
      
      Array.from(selectEl.options).forEach((opt) => {
        const li = document.createElement('li');
        li.className = 'calc-select-option';
        li.dataset.value = opt.value;
        li.textContent = opt.textContent;
        if (opt.selected) {
          li.classList.add('is-active');
        }
        li.addEventListener('click', () => {
          selectEl.value = opt.value;
          currentBtn.textContent = opt.textContent;
          list.querySelectorAll('.calc-select-option').forEach((el) => el.classList.remove('is-active'));
          li.classList.add('is-active');
          // Триггерим событие change для обновления превью
          selectEl.dispatchEvent(new Event('change'));
          customSelect.classList.remove('open');
          const equipmentField = selectEl.closest('.field-equipment');
          if (equipmentField) equipmentField.classList.remove('is-open');
        });
        list.appendChild(li);
      });
    }
  }
  
  // Триггерим событие change для обновления превью
  selectEl.dispatchEvent(new Event('change'));
}

// Функция для извлечения только цены за смену из строки цены (для карточек каталога)
function extractShiftPrice(priceStr) {
  if (!priceStr) return '';
  
  // Удаляем все части с полсменой
  let cleaned = priceStr;
  
  // Удаляем часть с полсменой (до запятой)
  cleaned = cleaned.replace(/[^,]*полсмен[^,]*/gi, '').trim();
  // Удаляем запятую в начале, если осталась
  cleaned = cleaned.replace(/^,\s*/, '').trim();
  
  // Если после удаления полсмены ничего не осталось, значит была только полсмена
  // В этом случае ищем цену за смену другим способом
  if (!cleaned || cleaned.length === 0) {
    // Пробуем найти цену за смену в исходной строке (может быть указана отдельно)
    const shiftMatch = priceStr.match(/(\d+[\s\d]*\s*₽\s*\/\s*смен[^,]*)/i);
    if (shiftMatch) {
      return shiftMatch[1].trim();
    }
    // Если не нашли, возвращаем пустую строку
    return '';
  }
  
  // Если осталась только одна часть, проверяем что это не полсмена
  if (cleaned.includes('полсмен')) {
    // Если все еще есть полсмена, значит формат нестандартный - ищем цену за смену напрямую
    const shiftMatch = priceStr.match(/(\d+[\s\d]*\s*₽\s*\/\s*смен[^,]*)/i);
    if (shiftMatch) {
      return shiftMatch[1].trim();
    }
    return '';
  }
  
  // Если в очищенной строке есть "смен", возвращаем её
  if (cleaned.includes('смен')) {
    return cleaned;
  }
  
  // Если нет слова "смен", но есть число и ₽, добавляем "/смена"
  const priceMatch = cleaned.match(/(\d+[\s\d]*)\s*₽/);
  if (priceMatch) {
    return cleaned.replace(/(\d+[\s\d]*\s*₽)/, '$1 / смена');
  }
  
  return cleaned;
}

function createServiceCard(service) {
  const link = document.createElement('a');
  link.className = 'service-card-link';
  link.href = service.url;

  const card = document.createElement('article');
  card.className = 'service-card';

  const imgWrap = document.createElement('div');
  imgWrap.className = 'service-card-image';
  
  // Создаем picture element для WebP с fallback
  const picture = document.createElement('picture');
  
  // WebP source
  const sourceWebp = document.createElement('source');
  const imageSrc = service.image || '/images/avtovyshka-13m.webp';
  // Не заменяем расширение, если это уже правильный формат
  let webpSrc = imageSrc;
  if (!imageSrc.includes('.webp') && !imageSrc.includes('?')) {
    webpSrc = imageSrc.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  }
  // Добавляем cache busting, если его еще нет
  if (!webpSrc.includes('?') && !webpSrc.includes('&')) {
    webpSrc = webpSrc + '?t=' + Date.now();
  }
  sourceWebp.srcset = webpSrc;
  sourceWebp.type = 'image/webp';
  
  // JPEG fallback source
  const sourceJpeg = document.createElement('source');
  let jpegSrc = imageSrc;
  if (!imageSrc.includes('.jpg') && !imageSrc.includes('.jpeg') && !imageSrc.includes('?')) {
    jpegSrc = imageSrc.replace(/\.(png|webp)$/i, '.jpg');
  }
  // Добавляем cache busting, если его еще нет
  if (!jpegSrc.includes('?') && !jpegSrc.includes('&')) {
    jpegSrc = jpegSrc + '?t=' + Date.now();
  }
  sourceJpeg.srcset = jpegSrc;
  sourceJpeg.type = 'image/jpeg';
  
  // IMG fallback - используем оригинальный путь с cache busting
  const img = document.createElement('img');
  // Принудительно добавляем cache busting
  let finalImageSrc = imageSrc;
  if (!finalImageSrc.includes('?') && !finalImageSrc.includes('&')) {
    finalImageSrc = imageSrc + '?t=' + Date.now();
  }
  img.src = finalImageSrc;
  img.alt = service.title;
  img.loading = 'eager';
  img.decoding = 'async';
  img.setAttribute('crossorigin', 'anonymous');
  
  img.onerror = function() {
    // При ошибке загрузки используем fallback с cache busting
    this.src = '/images/avtovyshka-13m.webp?t=' + Date.now();
    // Удаляем source элементы, чтобы браузер использовал img
    const picture = this.parentElement;
    if (picture && picture.tagName === 'PICTURE') {
      const sources = picture.querySelectorAll('source');
      sources.forEach(s => s.remove());
    }
  };
  
  picture.appendChild(sourceWebp);
  picture.appendChild(sourceJpeg);
  picture.appendChild(img);
  imgWrap.appendChild(picture);

  const body = document.createElement('div');
  body.className = 'service-card-body';

  const title = document.createElement('h3');
  title.className = 'service-card-title';
  title.textContent = service.title;

  const meta = document.createElement('p');
  meta.className = 'service-card-meta';
  meta.textContent = service.short;

  const price = document.createElement('div');
  price.className = 'service-card-price';
  // Извлекаем только цену за смену для карточек (без полсмены)
  const priceText = extractShiftPrice(service.price);
  price.innerHTML = `${priceText} <span class="price-vat">без НДС</span>`;

  body.appendChild(title);
  body.appendChild(meta);
  body.appendChild(price);

  card.appendChild(imgWrap);
  card.appendChild(body);
  link.appendChild(card);

  return link;
}

async function displayServices() {
  const grid = document.getElementById('services-grid');
  if (!grid) return;

  grid.innerHTML = '';
  
  try {
    // Добавляем cache busting к запросу API, чтобы получить свежие данные
    const response = await fetch('/api/services?t=' + Date.now(), {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    if (!response.ok) throw new Error('Failed to load services');
    const services = await response.json();
    
    // Преобразуем данные из API в формат для карточек
    // Фильтруем только активные услуги
    const servicesData = services
      .filter(service => service.active !== 0 && service.active !== false)
      .map(service => {
        // Используем ту же функцию для определения изображения
        const image = getImageForService(service);
        
        return {
          title: service.title,
          price: service.price || '',
          short: service.short_description || getShortDescription(service.description),
          image: image,
          url: service.url || `/equipment/${service.title.toLowerCase().replace(/\s+/g, '-')}.html`
        };
      });
    
    servicesData.forEach((service) => {
      grid.appendChild(createServiceCard(service));
    });
  } catch (error) {
    console.error('Error loading services:', error);
    // Fallback to FALLBACK_SERVICES if API fails
    FALLBACK_SERVICES.forEach((service) => {
      grid.appendChild(createServiceCard(service));
    });
  }

  initServicesCarousel();
}

function initServicesCarousel() {
  const viewport = document.querySelector('.services-viewport');
  const grid = document.querySelector('.services-grid');
  const prevBtn = document.querySelector('.carousel-btn.prev');
  const nextBtn = document.querySelector('.carousel-btn.next');
  const dotsContainer = document.getElementById('carousel-dots');

  if (!viewport || !grid || !prevBtn || !nextBtn || !dotsContainer) return;

  const cards = Array.from(grid.children);
  if (!cards.length) return;

  let currentIndex = 0;
  let scrollTimeout;
  let rafId = null;
  let isScrolling = false;
  let cachedMetrics = null;
  let resizeTimeout;

  // Кэшируем метрики и пересчитываем только при необходимости
  function recalculate(force = false) {
    if (cachedMetrics && !force) {
      return cachedMetrics;
    }
    
    const cardWidth = cards[0].getBoundingClientRect().width;
    const gap = 20; // gap между карточками из CSS
    const viewportWidth = viewport.offsetWidth;
    
    const visibleCount = Math.floor((viewportWidth + gap) / (cardWidth + gap));
    const maxIndex = Math.max(0, cards.length - visibleCount);
    
    cachedMetrics = { cardWidth, gap, visibleCount, maxIndex };
    return cachedMetrics;
  }

  const { cardWidth, gap, visibleCount, maxIndex } = recalculate();

  dotsContainer.innerHTML = '';
  const dots = [];
  for (let i = 0; i <= maxIndex; i++) {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    if (i === 0) dot.classList.add('active');
    dot.type = 'button';
    dot.addEventListener('click', () => {
      currentIndex = i;
      updateCarousel();
    });
    dotsContainer.appendChild(dot);
    dots.push(dot);
  }

  function updateDots() {
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentIndex);
    });
  }

  function updateButtons() {
    const { maxIndex: newMaxIndex } = recalculate();
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= newMaxIndex;
  }

  function updateCarousel() {
    const { cardWidth, gap, maxIndex: newMaxIndex } = recalculate();
    let targetScroll;

    if (currentIndex >= newMaxIndex) {
      // Если это последняя позиция, прокручиваем так, чтобы последняя карточка была полностью видна
      // Используем реальные размеры элементов вместо расчетов
      const gridScrollWidth = grid.scrollWidth; // Реальная ширина содержимого grid
      const viewportWidth = viewport.offsetWidth; // Видимая ширина viewport
      
      // Максимальная прокрутка = реальная ширина содержимого - видимая ширина viewport
      // Это гарантирует, что последняя карточка будет полностью видна
      // Добавляем небольшой запас для гарантии полной видимости
      const maxScroll = Math.max(0, gridScrollWidth - viewportWidth + 1);
      targetScroll = maxScroll;
    } else {
      targetScroll = currentIndex * (cardWidth + gap);
    }
    
    // Устанавливаем флаг, чтобы не обрабатывать программную прокрутку
    isScrolling = true;
    viewport.scrollTo({ left: targetScroll, behavior: 'smooth' });
    updateDots();
    updateButtons();
    
    // Сбрасываем флаг после завершения прокрутки
    setTimeout(() => {
      isScrolling = false;
    }, 500);
  }

  // Оптимизированная обработка прокрутки с requestAnimationFrame
  function handleScroll() {
    if (isScrolling) return; // Пропускаем обработку при программной прокрутке
    
    if (rafId) {
      cancelAnimationFrame(rafId);
    }
    
    rafId = requestAnimationFrame(() => {
      const { cardWidth, gap, maxIndex: newMaxIndex } = recalculate();
      const scrollLeft = viewport.scrollLeft;
      const newIndex = Math.round(scrollLeft / (cardWidth + gap));
      
      if (newIndex !== currentIndex && newIndex >= 0 && newIndex <= newMaxIndex) {
        currentIndex = newIndex;
        updateDots();
        updateButtons();
      }
      
      rafId = null;
    });
  }

  // Обновляем currentIndex при прокрутке с оптимизацией
  viewport.addEventListener('scroll', handleScroll, { passive: true });

  prevBtn.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      updateCarousel();
    }
  });

  nextBtn.addEventListener('click', () => {
    const { maxIndex: newMaxIndex } = recalculate();
    if (currentIndex < newMaxIndex) {
      currentIndex += 1;
      updateCarousel();
    } else if (currentIndex === newMaxIndex) {
      // Если уже на последней позиции, убеждаемся что последняя карточка полностью видна
      updateCarousel();
    }
  });

  updateButtons();
  
  // При загрузке страницы и изменении размера окна пересчитываем и проверяем последнюю карточку
  const checkLastCard = () => {
    const { maxIndex: checkMaxIndex } = recalculate();
    if (currentIndex >= checkMaxIndex) {
      updateCarousel();
    }
  };
  
  // Оптимизированная обработка изменения размера окна
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      cachedMetrics = null; // Сбрасываем кэш при изменении размера
      checkLastCard();
    }, 150);
  }, { passive: true });
  
  // Проверяем после небольшой задержки при загрузке (когда карточки уже отрендерены)
  setTimeout(() => {
    checkLastCard();
  }, 100);
}

async function displayReviews() {
  const container = document.getElementById('reviews-grid');
  if (!container) return;

  container.innerHTML = '<div class="loading">Загрузка отзывов...</div>';

  try {
    // Загружаем отзывы из API
    const response = await fetch('/api/reviews');
    const reviews = await response.json();

    // Если отзывов нет, используем fallback
    const reviewsToShow = reviews && reviews.length > 0 ? reviews : FALLBACK_REVIEWS;

    container.innerHTML = '';
    
    reviewsToShow.forEach((review) => {
      const card = document.createElement('article');
      card.className = 'review-card';
      // Убеждаемся, что карточка видна
      card.style.opacity = '1';
      card.style.visibility = 'visible';
      card.style.display = 'flex';

      const text = document.createElement('p');
      text.className = 'review-text';
      text.textContent = review.text || review.review_text;

      const meta = document.createElement('p');
      meta.className = 'review-meta';
      
      // Формируем мета-информацию из разных форматов данных
      if (review.client_name && review.company) {
        meta.textContent = `${review.client_name}, ${review.company}`;
      } else if (review.meta) {
        meta.textContent = review.meta;
      } else if (review.client_name) {
        meta.textContent = review.client_name;
      }

      card.appendChild(text);
      if (meta.textContent) {
        card.appendChild(meta);
      }
      container.appendChild(card);
    });
    
    // Убеждаемся, что все карточки видны после загрузки
    setTimeout(() => {
      const allCards = container.querySelectorAll('.review-card');
      allCards.forEach((card) => {
        if (window.gsap) {
          window.gsap.set(card, { opacity: 1, y: 0, x: 0 });
        }
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.display = 'flex';
      });
    }, 100);
  } catch (error) {
    console.error('Ошибка загрузки отзывов:', error);
    // В случае ошибки используем fallback
    container.innerHTML = '';
    FALLBACK_REVIEWS.forEach((review) => {
      const card = document.createElement('article');
      card.className = 'review-card';
      // Убеждаемся, что карточка видна
      card.style.opacity = '1';
      card.style.visibility = 'visible';
      card.style.display = 'flex';

      const text = document.createElement('p');
      text.className = 'review-text';
      text.textContent = review.text;

      const meta = document.createElement('p');
      meta.className = 'review-meta';
      meta.textContent = review.meta;

      card.appendChild(text);
      card.appendChild(meta);
      container.appendChild(card);
    });
    
    // Убеждаемся, что все карточки видны после загрузки
    setTimeout(() => {
      const allCards = container.querySelectorAll('.review-card');
      allCards.forEach((card) => {
        if (window.gsap) {
          window.gsap.set(card, { opacity: 1, y: 0, x: 0 });
        }
        card.style.opacity = '1';
        card.style.visibility = 'visible';
        card.style.display = 'flex';
      });
    }, 100);
  }
}

function initReviewsSlider() {
  // Слайдер отключен, так как показываем все отзывы сразу
  // Эта функция оставлена для совместимости, но ничего не делает
  const cards = Array.from(document.querySelectorAll('.review-card'));
  if (!cards.length) return;
  
  // Убеждаемся, что все карточки видны
  cards.forEach((card) => {
    card.style.opacity = '1';
    card.style.visibility = 'visible';
    card.style.display = 'flex';
    card.style.transform = 'none';
    card.style.x = '0';
  });
}

function initCalculator() {
  const form = document.getElementById('calculator-form');
  const sumEl = document.getElementById('calculator-sum');
  const selectEl = document.getElementById('calc-equipment');
  const equipmentField = selectEl ? selectEl.closest('.field-equipment') : null;
  const previewImage = document.getElementById('calculator-image');
  const previewTitle = document.getElementById('calculator-title');
  const specsList = document.getElementById('calculator-specs');
  if (!form || !sumEl) return;

  // Возвращает результат расчёта для отображения и отправки в заявке
  function getCalculatorResult() {
    const equipmentKey = document.getElementById('calc-equipment')?.value;
    const shiftsValue = document.getElementById('calc-shifts')?.value;
    const customShiftsInput = document.getElementById('calc-shifts-custom');
    let shifts;
    if (shiftsValue === 'more') {
      shifts = Number(customShiftsInput?.value) || 4;
      if (shifts < 4) shifts = 4;
    } else {
      shifts = Number(shiftsValue) || 1;
    }
    const config = equipmentKey ? CALC_EQUIPMENT[equipmentKey] : null;
    if (!config) return null;
    let total;
    if (shifts === 0.5) {
      total = (config.baseHalfShift != null && config.baseHalfShift !== '')
        ? config.baseHalfShift
        : (config.baseShift || 0);
    } else {
      total = (config.baseShift || 0) * Math.max(shifts, 1);
    }
    const formatted = total.toLocaleString('ru-RU');
    let shiftsText;
    let timeText = '';
    if (shifts === 0.5) {
      shiftsText = 'полсмены';
      timeText = 'Полсмены включает в себя 3 часа работы и один час подачи';
    } else {
      timeText = 'Смена включает в себя 7 часов работы и один час подачи';
      if (shiftsValue === 'more') {
        shiftsText = shifts === 4 ? '4 смены' : `${shifts} смен`;
      } else if (shifts === 1) shiftsText = 'смену';
      else if (shifts === 2 || shifts === 3) shiftsText = 'смены';
      else if (shifts < 5) shiftsText = 'смены';
      else shiftsText = 'смен';
    }
    return {
      total,
      formatted,
      equipmentName: config.name,
      shiftsText,
      timeText,
      shiftsValue
    };
  }

  function updateCalculatorSum() {
    const result = getCalculatorResult();
    if (!result) return;
    const { formatted, shiftsText, timeText, shiftsValue } = result;
    const shiftsVal = document.getElementById('calc-shifts')?.value;
    const customShiftsInput = document.getElementById('calc-shifts-custom');
    let shiftsNum;
    if (shiftsVal === 'more') {
      shiftsNum = Number(customShiftsInput?.value) || 4;
      if (shiftsNum < 4) shiftsNum = 4;
    } else {
      shiftsNum = Number(shiftsVal) || 1;
    }
    if (shiftsValue === 'more') {
      sumEl.innerHTML = `${formatted} ₽ за ${shiftsText} <span class="price-vat">без НДС</span>${timeText ? `<br><span class="calculator-time">${timeText}</span>` : ''}`;
    } else {
      sumEl.innerHTML = `${formatted} ₽ за ${shiftsNum === 0.5 ? 'полсмены' : shiftsNum} ${shiftsNum === 0.5 ? '' : shiftsText} <span class="price-vat">без НДС</span>${timeText ? `<br><span class="calculator-time">${timeText}</span>` : ''}`;
    }
  }

  function updatePreview() {
    if (!selectEl || !previewImage || !previewTitle) return;
    const key = selectEl.value;
    const config = CALC_EQUIPMENT[key];
    if (!config) return;
    
    const previewContainer = document.getElementById('calculator-preview');
    const gsapLib = window.gsap || gsap;
    
    function fillPreviewContent() {
      previewImage.src = config.image;
      previewImage.alt = config.name;
      previewTitle.textContent = config.name;

      const priceEl = document.getElementById('calculator-preview-price');
      if (priceEl && config.baseShift) {
        priceEl.innerHTML = `от <strong>${config.baseShift.toLocaleString('ru-RU')} ₽</strong> / смена`;
      }

      if (specsList) {
        specsList.innerHTML = '';
        const items = [];
        if (config.height) items.push({ icon: '📏', text: `Рабочая высота: ${config.height} м` });
        if (config.capacity) items.push({ icon: '⚖️', text: `Грузоподъёмность: ${config.capacity} кг` });
        if (config.boom) items.push({ icon: '🏗️', text: `Вылет стрелы: до ${config.boom} м` });
        if (config.includedKm) items.push({ icon: '🚚', text: `Подача: ${config.includedKm} км включено` });
        items.forEach(({ icon, text }) => {
          const li = document.createElement('li');
          li.innerHTML = `<span class="spec-icon">${icon}</span> ${text}`;
          specsList.appendChild(li);
        });
      }

      const descEl = document.getElementById('calculator-preview-desc');
      if (descEl) {
        descEl.textContent = config.description || '';
        descEl.style.display = config.description ? '' : 'none';
      }

      if (previewImage) {
        previewImage.style.opacity = '1';
        previewImage.style.filter = 'none';
      }
    }

    if (previewContainer && gsapLib) {
      gsapLib.to(previewContainer, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          fillPreviewContent();
          gsapLib.fromTo(previewContainer,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
          );
        }
      });
    } else {
      fillPreviewContent();
    }
  }

  if (selectEl) {
    // Создаём кастомный выпадающий список на основе существующего select
    const customSelect = document.createElement('div');
    customSelect.className = 'calc-select';

    const currentBtn = document.createElement('button');
    currentBtn.type = 'button';
    currentBtn.className = 'calc-select-current';
    currentBtn.textContent = selectEl.options[selectEl.selectedIndex]?.textContent || '';

    const optionsWrap = document.createElement('div');
    optionsWrap.className = 'calc-select-options';

    const list = document.createElement('ul');
    list.className = 'calc-select-options-list';

    Array.from(selectEl.options).forEach((opt) => {
      const li = document.createElement('li');
      li.className = 'calc-select-option';
      li.dataset.value = opt.value;
      li.textContent = opt.textContent;
      if (opt.selected) {
        li.classList.add('is-active');
      }
      li.addEventListener('click', () => {
        selectEl.value = opt.value;
        currentBtn.textContent = opt.textContent;
        list.querySelectorAll('.calc-select-option').forEach((el) => el.classList.remove('is-active'));
        li.classList.add('is-active');
        updatePreview();
        customSelect.classList.remove('open');
        if (equipmentField) equipmentField.classList.remove('is-open');
      });
      list.appendChild(li);
    });

    optionsWrap.appendChild(list);
    customSelect.appendChild(currentBtn);
    customSelect.appendChild(optionsWrap);

    // Вставляем кастомный select перед нативным
    selectEl.parentNode.insertBefore(customSelect, selectEl);
    
    // Скрываем нативный select
    selectEl.style.position = 'absolute';
    selectEl.style.opacity = '0';
    selectEl.style.pointerEvents = 'none';
    selectEl.style.width = '1px';
    selectEl.style.height = '1px';
    selectEl.style.overflow = 'hidden';
    selectEl.style.clip = 'rect(0, 0, 0, 0)';

    currentBtn.addEventListener('click', () => {
      const isOpen = customSelect.classList.toggle('open');
      if (equipmentField) {
        equipmentField.classList.toggle('is-open', isOpen);
      }
    });

    // Обработчик wheel-событий для работы скролла при наведении
    optionsWrap.addEventListener('wheel', (e) => {
      e.stopPropagation();
      const scrollTop = optionsWrap.scrollTop;
      const scrollHeight = optionsWrap.scrollHeight;
      const height = optionsWrap.clientHeight;
      const wheelDelta = e.deltaY;
      
      // Если достигли верха или низа, предотвращаем дальнейший скролл страницы
      if ((scrollTop === 0 && wheelDelta < 0) || 
          (scrollTop + height >= scrollHeight && wheelDelta > 0)) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('click', (evt) => {
      if (!customSelect.contains(evt.target)) {
        customSelect.classList.remove('open');
        if (equipmentField) equipmentField.classList.remove('is-open');
      }
    });

    // Обработчик изменения select (для обновления при динамической загрузке)
    selectEl.addEventListener('change', () => {
      updatePreview();
      syncMainCalcHalfShiftOption();
      updateCalculatorSum();
      // Обновляем кастомный select
      const customSelect = selectEl.parentNode.querySelector('.calc-select');
      if (customSelect) {
        const currentBtn = customSelect.querySelector('.calc-select-current');
        const list = customSelect.querySelector('.calc-select-options-list');
        if (currentBtn) {
          currentBtn.textContent = selectEl.options[selectEl.selectedIndex]?.textContent || '';
        }
        if (list) {
          list.querySelectorAll('.calc-select-option').forEach((el) => {
            el.classList.toggle('is-active', el.dataset.value === selectEl.value);
          });
        }
      }
    });

    // стартовое состояние
    updatePreview();
    updateCalculatorSum();
  }

  // Создаём кастомный выпадающий список для количества смен
  const shiftsSelectEl = document.getElementById('calc-shifts');
  const shiftsField = shiftsSelectEl ? shiftsSelectEl.closest('.field') : null;
  
  if (shiftsSelectEl) {
    const customShiftsSelect = document.createElement('div');
    customShiftsSelect.className = 'calc-select';

    const currentShiftsBtn = document.createElement('button');
    currentShiftsBtn.type = 'button';
    currentShiftsBtn.className = 'calc-select-current';
    currentShiftsBtn.textContent = shiftsSelectEl.options[shiftsSelectEl.selectedIndex]?.textContent || '';

    const shiftsOptionsWrap = document.createElement('div');
    shiftsOptionsWrap.className = 'calc-select-options';

    const shiftsList = document.createElement('ul');
    shiftsList.className = 'calc-select-options-list';

    Array.from(shiftsSelectEl.options).forEach((opt) => {
      const li = document.createElement('li');
      li.className = 'calc-select-option';
      li.dataset.value = opt.value;
      li.textContent = opt.textContent;
      if (opt.selected) {
        li.classList.add('is-active');
      }
      li.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        shiftsSelectEl.value = opt.value;
        currentShiftsBtn.textContent = opt.textContent;
        shiftsList.querySelectorAll('.calc-select-option').forEach((el) => el.classList.remove('is-active'));
        li.classList.add('is-active');
        
        // Закрываем выпадающий список
        customShiftsSelect.classList.remove('open');
        if (shiftsField) shiftsField.classList.remove('is-open');
        
        // Показываем/скрываем поле для ввода количества смен
        const customInput = document.getElementById('calc-shifts-custom');
        if (customInput) {
          if (opt.value === 'more') {
            customInput.style.display = 'block';
            customInput.required = true;
          } else {
            customInput.style.display = 'none';
            customInput.required = false;
          }
        }
        
        // Обновляем отображение цены
        updateCalculatorSum();
      });
      shiftsList.appendChild(li);
    });

    shiftsOptionsWrap.appendChild(shiftsList);
    customShiftsSelect.appendChild(currentShiftsBtn);
    customShiftsSelect.appendChild(shiftsOptionsWrap);

    // Вставляем кастомный select перед нативным
    shiftsSelectEl.parentNode.insertBefore(customShiftsSelect, shiftsSelectEl);
    
    // Скрываем нативный select
    shiftsSelectEl.style.position = 'absolute';
    shiftsSelectEl.style.opacity = '0';
    shiftsSelectEl.style.pointerEvents = 'none';
    shiftsSelectEl.style.width = '1px';
    shiftsSelectEl.style.height = '1px';
    shiftsSelectEl.style.overflow = 'hidden';
    shiftsSelectEl.style.clip = 'rect(0, 0, 0, 0)';

    currentShiftsBtn.addEventListener('click', () => {
      const isOpen = customShiftsSelect.classList.toggle('open');
      if (shiftsField) {
        shiftsField.classList.toggle('is-open', isOpen);
      }
    });

    // Обработчик wheel-событий для работы скролла при наведении
    shiftsOptionsWrap.addEventListener('wheel', (e) => {
      e.stopPropagation();
      const scrollTop = shiftsOptionsWrap.scrollTop;
      const scrollHeight = shiftsOptionsWrap.scrollHeight;
      const height = shiftsOptionsWrap.clientHeight;
      const wheelDelta = e.deltaY;
      
      // Если достигли верха или низа, предотвращаем дальнейший скролл страницы
      if ((scrollTop === 0 && wheelDelta < 0) || 
          (scrollTop + height >= scrollHeight && wheelDelta > 0)) {
        e.preventDefault();
      }
    }, { passive: false });

    document.addEventListener('click', (evt) => {
      if (!customShiftsSelect.contains(evt.target)) {
        customShiftsSelect.classList.remove('open');
        if (shiftsField) {
          shiftsField.classList.remove('is-open');
        }
      }
    });

    const customShiftsInput = document.getElementById('calc-shifts-custom');
    if (customShiftsInput) {
      customShiftsInput.addEventListener('input', updateCalculatorSum);
      customShiftsInput.addEventListener('change', updateCalculatorSum);
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const result = getCalculatorResult();
    const formData = new FormData(form);
    const messageDiv = document.getElementById('form-message');
    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn ? submitBtn.textContent : '';

    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email') || '',
      message: formData.get('message') || '',
      privacy_agreed: true
    };
    if (result) {
      data.equipment = result.equipmentName;
      data.price = result.formatted + ' ₽';
      data.price_raw = result.total;
    }

    if (messageDiv) messageDiv.classList.remove('show', 'success', 'error');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка...';
    }

    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const res = await response.json();

      if (response.ok && res.success) {
        if (messageDiv) {
          messageDiv.textContent = res.message || 'Заявка отправлена. Мы свяжемся с вами в ближайшее время.';
          messageDiv.classList.add('show', 'success');
        }
        form.reset();
        updateCalculatorSum();
      } else {
        if (messageDiv) {
          messageDiv.textContent = res.error || 'Ошибка при отправке. Попробуйте позже.';
          messageDiv.classList.add('show', 'error');
        }
      }
    } catch (err) {
      console.error('Ошибка отправки формы:', err);
      if (messageDiv) {
        messageDiv.textContent = 'Ошибка подключения. Проверьте интернет.';
        messageDiv.classList.add('show', 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });

  window.updateCalculatorSum = updateCalculatorSum;
  syncMainCalcHalfShiftOption();
  updateCalculatorSum();
}

// =============================================
// POPULAR EQUIPMENT SLIDER - данные слайдов
// =============================================
const POPULAR_EQUIPMENT_SLIDES = [
  {
    id: '1',
    index: '01',
    title: 'Автовышка 16 метров',
    text: 'Компактная автовышка для работ на средних высотах.',
    bullets: [
      'Грузоподъёмность корзины: 200 кг',
      'Размеры корзины (платформы): 2х4 м'
    ],
    image: '/images/avtovyshka-16m.webp',
    url: '/equipment/avtovyshka-16m.html',
    price: 'от 18 000 ₽/смена'
  },
  {
    id: '2',
    index: '02',
    title: 'Автовышка 18 метров',
    text: 'Популярная модель для работ на фасадах и рекламных конструкциях.',
    bullets: [
      'Грузоподъёмность корзины: 1000 кг',
      'Размеры корзины (платформы): 2х4 м'
    ],
    image: '/images/avtovyshka-18m.webp',
    url: '/equipment/avtovyshka-18m.html',
    price: 'от 24 000 ₽/смена'
  },
  {
    id: '3',
    index: '03',
    title: 'Автовышка 21 метр',
    text: 'Универсальная техника с большой платформой и хорошим запасом высоты.',
    bullets: [
      'Грузоподъёмность корзины: 1000 кг',
      'Размеры корзины (платформы): 2х4 м'
    ],
    image: '/images/avtovyshka-21m.webp',
    url: '/equipment/avtovyshka-21m.html',
    price: 'от 21 000 ₽/смена'
  },
  {
    id: '4',
    index: '04',
    title: 'Автовышка 25 метров',
    text: 'Мощная техника для высотных работ на зданиях и конструкциях.',
    bullets: [
      'Грузоподъёмность корзины: 200 кг',
      'Размер корзины: 1,4 x 0,8 м'
    ],
    image: '/images/avtovyshka-25m.webp',
    url: '/equipment/avtovyshka-25m.html',
    price: 'от 26 000 ₽/смена'
  }
];

// =============================================
// POPULAR EQUIPMENT (Stacking Cards) - инициализация
// =============================================
async function initOurCapabilitiesSlider() {
  const section = document.getElementById('popular-equipment');
  const cardsWrapper = document.querySelector('.js-stack-cards');
  
  if (!section || !cardsWrapper) return;
  
  // Определяем URL популярных машин
  const popularUrls = [
    '/equipment/avtovyshka-16m.html',
    '/equipment/avtovyshka-18m.html',
    '/equipment/avtovyshka-21m.html',
    '/equipment/avtovyshka-25m.html'
  ];
  
  let slidesData = POPULAR_EQUIPMENT_SLIDES;
  
  try {
    // Сначала пробуем загрузить из нового API для популярных карточек
    // Добавляем cache busting к запросу API, чтобы получить свежие данные
    // ВАЖНО: Добавляем cache busting для получения свежих данных
    const cacheBuster = 't=' + Date.now() + '&_=' + Math.random();
    const popularResponse = await fetch('/api/popular-cards?' + cacheBuster, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    if (popularResponse.ok) {
      const popularCards = await popularResponse.json();
      console.log('📸 Загружены популярные карточки:', popularCards.length, 'шт.');
      popularCards.forEach((card, idx) => {
        console.log(`   ${idx + 1}. ${card.title}: image_url=${card.image_url || '(нет)'}, updated_at=${card.updated_at || '(нет)'}`);
      });
      if (popularCards.length > 0) {
        // Используем данные из базы для популярных карточек
        slidesData = popularCards.map((service, index) => {
          const fallbackSlide = POPULAR_EQUIPMENT_SLIDES[index];
          
          // Используем card_bullets из базы или fallback
          let bullets = service.card_bullets || [];
          if (bullets.length < 2 && fallbackSlide && fallbackSlide.bullets) {
            bullets = fallbackSlide.bullets;
          }
          
          const adminPaths = collectAdminImagePathsOrdered(service);
          let slideImage;
          let imageCandidates;
          if (adminPaths.length > 0) {
            imageCandidates = adminPaths.map((p) => addCacheBuster(p, service.updated_at));
            slideImage = imageCandidates[0];
          } else {
            slideImage = getImageForService(service, true);
            imageCandidates = [slideImage];
            console.warn('[Popular slider] Нет фото из админки для', service.title || service.url, '— показан fallback');
          }

          const cleanedPrice = extractShiftPrice(service.price || '');

          return {
            id: String(service.id),
            index: String(index + 1).padStart(2, '0'),
            title: service.title,
            text: service.short_description || (fallbackSlide && fallbackSlide.text) || '',
            bullets: bullets,
            image: slideImage,
            imageCandidates: imageCandidates,
            updated_at: service.updated_at,
            url: service.url,
            price: cleanedPrice || service.price
          };
        });
      }
    } else {
      // Fallback: используем старый метод с фильтрацией по URL
      const response = await fetch('/api/services');
      if (response.ok) {
        const services = await response.json();
        // Фильтруем популярные машины по URL
        const popularServices = services.filter(service => 
          popularUrls.includes(service.url)
        );
        
        if (popularServices.length > 0) {
        // Преобразуем данные из API в формат карточек (без Buffer/iconv — чистый браузерный код)
        slidesData = popularServices.map((service, index) => {
          // Fallback данные
          const fallbackSlide = POPULAR_EQUIPMENT_SLIDES[index];
          
          // Парсим specifications для получения характеристик
          const specs = String(service.specifications || '');
          let bullets = specs
            .split(/[,\n]/)  // Разделяем по запятой или переносу строки
            .map(s => s.trim())
            .filter(Boolean)
            .slice(0, 6);
          
          // Если bullets меньше 4, используем fallback
          if (bullets.length < 2 && fallbackSlide && fallbackSlide.bullets) {
            bullets = fallbackSlide.bullets;
          }

          const adminPathsFb = collectAdminImagePathsOrdered(service);
          let slideImage;
          let imageCandidates;
          if (adminPathsFb.length > 0) {
            imageCandidates = adminPathsFb.map((p) => addCacheBuster(p, service.updated_at));
            slideImage = imageCandidates[0];
          } else {
            slideImage = getImageForService(service, true);
            imageCandidates = [slideImage];
          }

          // Если сервер всё же вернул битую кодировку — берём fallback текст, но оставляем картинку/URL из базы
          const title = String(service.title || '');
          const text = service.short_description || getShortDescription(service.description);
          const price = String(service.price || '');

          const hasBadEncoding =
            /Р[Р-Я]/.test(title) || /С[Р-Я]/.test(title) ||
            /Р[Р-Я]/.test(text) || /С[Р-Я]/.test(text) ||
            /Р[Р-Я]/.test(price) || /С[Р-Я]/.test(price);

          if (hasBadEncoding && fallbackSlide) {
            const cleanedFallbackPrice = extractShiftPrice(fallbackSlide.price);
            return {
              id: String(index + 1),
              index: String(index + 1).padStart(2, '0'),
              title: fallbackSlide.title,
              text: fallbackSlide.text,
              bullets: fallbackSlide.bullets || [],
              image: slideImage,
              imageCandidates: imageCandidates,
              updated_at: service.updated_at,
              url: service.url || popularUrls[index],
              price: cleanedFallbackPrice || fallbackSlide.price
            };
          }

          const cleanedPrice = extractShiftPrice(price);
          return {
            id: String(index + 1),
            index: String(index + 1).padStart(2, '0'),
            title,
            text,
            bullets: bullets.length >= 2 ? bullets : (fallbackSlide?.bullets || []),
            image: slideImage,
            imageCandidates: imageCandidates,
            updated_at: service.updated_at,
            url: service.url || popularUrls[index],
            price: cleanedPrice || price
          };
        });
        }
      }
    }
  } catch (error) {
    console.error('Error loading popular equipment:', error);
    // Используем FALLBACK данные
  }

  // Рендерим карточки
  cardsWrapper.innerHTML = '';
  const totalCardsStr = String(slidesData.length).padStart(2, '0');

  slidesData.forEach((slide, index0) => {
    const li = document.createElement('li');
    li.className = 'stack-cards__item js-stack-cards__item';

    const bullets = Array.isArray(slide.bullets) ? slide.bullets : [];
    const limitedBullets = bullets.slice(0, 2);
    const bulletsHtml = limitedBullets.length
      ? `<ul class="card__bullets">${limitedBullets.map(b => `<li>${b}</li>`).join('')}</ul>`
      : '';

    const priceHtml = slide.price
      ? `<p class="card__price">${slide.price} <span class="price-vat">без НДС</span></p>`
      : '';

    const linkHtml = slide.url
      ? `<a href="${slide.url}" class="card__link">Подробнее →</a>`
      : '';

    const counter = `${String(index0 + 1).padStart(2, '0')}/${totalCardsStr}`;

    const candidatesRaw = (slide.imageCandidates && slide.imageCandidates.length)
      ? slide.imageCandidates
      : (slide.image ? [slide.image] : []);
    const updatedAtSlide = slide.updated_at || slide.updatedAt;
    const normalizedCandidates = candidatesRaw.map((src) => {
      if (!src) return src;
      if (/[?&](?:t|v)=/.test(src)) return src;
      return updatedAtSlide
        ? addCacheBuster(src, updatedAtSlide)
        : src + (src.includes('?') ? '&' : '?') + 'v=' + Date.now();
    });
    const imageSrc = normalizedCandidates[0] || '';
    // encodeURI нужен чтобы кирилличные имена файлов корректно работали через innerHTML
    const imageSrcEncoded = imageSrc ? imageSrc.replace(/[^\x00-\x7F]/g, c => encodeURIComponent(c)) : '';

    li.innerHTML = `
      <div class="card__content">
        <div class="card__bg">
          <img src="${imageSrcEncoded}" alt="${slide.title}" loading="eager" fetchpriority="high" />
        </div>
        <div class="card__gradient"></div>
        <div class="card__counter">${counter}</div>
        <div class="card__body">
          <h3 class="card__title">${slide.title}</h3>
          <p class="card__text">${slide.text}</p>
          ${bulletsHtml}
          <div class="card__footer">
            ${priceHtml}
          </div>
        </div>
        ${linkHtml}
      </div>
    `;

    cardsWrapper.appendChild(li);
    const imgEl = li.querySelector('.card__bg img');
    if (imgEl && normalizedCandidates.length > 1) {
      let candIdx = 0;
      imgEl.addEventListener('error', function onPopularCardImgErr() {
        candIdx += 1;
        if (candIdx < normalizedCandidates.length) {
          imgEl.src = normalizedCandidates[candIdx];
        } else {
          imgEl.removeEventListener('error', onPopularCardImgErr);
        }
      });
    }
  });

  // Initialize stacking cards effect (CodyHouse method)
  initStackCardsEffect(cardsWrapper);
}

// Stacking Cards Effect - based on CodyHouse tutorial
function initStackCardsEffect(element) {
  const items = element.querySelectorAll('.js-stack-cards__item');
  if (items.length === 0) return;

  const intersectionObserverSupported = ('IntersectionObserver' in window && 
    'IntersectionObserverEntry' in window && 
    'intersectionRatio' in window.IntersectionObserverEntry.prototype);
  
  if (!intersectionObserverSupported) return;

  const cardStyle = window.getComputedStyle(items[0]);
  const cardTop = parseFloat(cardStyle.top) || 90;
  const cardHeight = items[0].offsetHeight;
  const cardMarginBottom = parseFloat(cardStyle.marginBottom) || 24;

  const currentScale = new Float32Array(items.length).fill(1);
  const targetScale = new Float32Array(items.length).fill(1);
  const LERP = 0.18;
  const SNAP_THRESHOLD = 0.0005;

  let scrollListener = null;
  let rafId = null;
  let ticking = false;

  function stackCardsCallback(entries) {
    if (entries[0].isIntersecting) {
      if (scrollListener) return;
      
      scrollListener = function() {
        if (ticking) return;
        ticking = true;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(animateStackCards);
      };
      
      window.addEventListener('scroll', scrollListener, { passive: true });
    } else {
      if (!scrollListener) return;
      window.removeEventListener('scroll', scrollListener);
      scrollListener = null;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    }
  }

  function animateStackCards() {
    const elTop = element.getBoundingClientRect().top;
    let needsNextFrame = false;

    for (let i = 0; i < items.length; i++) {
      const raw = cardTop - elTop - i * (cardHeight + cardMarginBottom);
      const scrollVal = Math.max(0, raw);
      const desired = Math.max(0.85, (cardHeight - scrollVal * 0.05) / cardHeight);

      targetScale[i] = desired;
      const diff = targetScale[i] - currentScale[i];

      if (Math.abs(diff) < SNAP_THRESHOLD) {
        currentScale[i] = targetScale[i];
      } else {
        currentScale[i] += diff * LERP;
        needsNextFrame = true;
      }

      const translateY = cardMarginBottom * i;
      items[i].style.transform = 'translateY(' + translateY + 'px) scale(' + currentScale[i] + ')';
    }

    ticking = false;

    if (needsNextFrame) {
      rafId = requestAnimationFrame(animateStackCards);
    }
  }

  const observer = new IntersectionObserver(stackCardsCallback, {
    threshold: [0, 0.1]
  });
  observer.observe(element);
  
  animateStackCards();
}

// Обработчик формы быстрой заявки
function initQuickContactForm() {
  const form = document.querySelector('.quick-contact-form');
  const messageDiv = document.getElementById('form-message');
  
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const data = {
      name: formData.get('name'),
      phone: formData.get('phone'),
      email: formData.get('email') || '',
      message: formData.get('message') || ''
    };
    
    // Скрываем предыдущее сообщение
    messageDiv.classList.remove('show', 'success', 'error');
    
    // Отключаем кнопку отправки
    const submitBtn = form.querySelector('.btn-submit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Отправка...';
    
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Успешная отправка
        messageDiv.textContent = result.message || 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.';
        messageDiv.classList.add('show', 'success');
        form.reset();
      } else {
        // Ошибка
        messageDiv.textContent = result.error || 'Произошла ошибка при отправке заявки. Попробуйте позже.';
        messageDiv.classList.add('show', 'error');
      }
    } catch (error) {
      console.error('Ошибка отправки формы:', error);
      messageDiv.textContent = 'Ошибка подключения к серверу. Проверьте интернет-соединение.';
      messageDiv.classList.add('show', 'error');
    } finally {
      // Включаем кнопку обратно
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// Инициализация выпадающего меню автопарка
async function initEquipmentDropdown() {
  const dropdown = document.getElementById('equipment-dropdown');
  if (!dropdown) return;

  // Упрощённый список техники - только высоты и специальные типы
  const equipmentList = [
    { title: '13м', url: '/equipment/avtovyshka-13m.html' },
    { title: '15м', url: '/equipment/avtovyshka-15m.html' },
    { title: '16м', url: '/equipment/avtovyshka-16m.html' },
    { title: '18м', url: '/equipment/avtovyshka-18m.html' },
    { title: '21м', url: '/equipment/avtovyshka-21m.html' },
    { title: '25м', url: '/equipment/avtovyshka-25m.html' },
    { title: '29м', url: '/equipment/avtovyshka-29m.html' },
    { title: '45м', url: '/equipment/avtovyshka-45m.html' },
    { title: 'Вездеход 30м', url: '/equipment/avtovyshka-vezdehod-35m.html' },
    { title: 'Самоходная', url: '/equipment/samohodnaya-avtovyshka.html' }
  ];

  dropdown.innerHTML = equipmentList.map(item => `
    <a href="${item.url}" class="dropdown-menu-item">
      <span class="dropdown-menu-item-title">${item.title}</span>
    </a>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  displayServices();
  displayReviews();
  // Загружаем данные для калькулятора из API перед инициализацией
  await loadCalculatorEquipmentFromAPI();
  initCalculator();
  initOurCapabilitiesSlider();
  initQuickContactForm();
  initEquipmentDropdown();
});

 