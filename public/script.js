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
    
    // Закрытие меню при клике на ссылку
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenuBtn.classList.remove('active');
        mobileNav.classList.remove('active');
        document.body.style.overflow = '';
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
});

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
    image: '/images/avtovyshka-13m.png',
    url: '/equipment/avtovyshka-15m.html',
  },
  {
    title: 'Автовышка-платформа 16 метров',
    price: 'от 20 000 ₽/смена',
    short: 'Оптимальна для сервисных и монтажных работ. Платформа 2x4м, грузоподъемность 1000 кг',
    image: '/images/avtovyshka-13m.png',
    url: '/equipment/avtovyshka-16m.html',
  },
  {
    title: 'Автовышка 18 метров',
    price: 'от 24 000 ₽/смена',
    short: 'Работы на фасадах и рекламных конструкциях',
    image: '/images/avtovyshka-18m.png',
    url: '/equipment/avtovyshka-18m.html',
  },
  {
    title: 'Автовышка-платформа 21 метр',
    price: 'от 21 000 ₽/смена',
    short: 'Платформа 2x4м с грузоподъемностью 1000 кг. Хороший запас высоты и вылета стрелы',
    image: '/images/avtovyshka-21m.png',
    url: '/equipment/avtovyshka-21m.html',
  },
  {
    title: 'Автовышка 25 метров',
    price: 'от 21 000 ₽/смена',
    short: 'Работы на высоте до 8–9 этажа',
    image: '/images/avtovyshka-13m.png',
    url: '/equipment/avtovyshka-25m.html',
  },
  {
    title: 'Автовышка 29 метров',
    price: 'от 26 000 ₽/смена',
    short: 'Монтажные и высотные работы повышенной сложности',
    image: '/images/avtovyshka-29m.png',
    url: '/equipment/avtovyshka-29m.html',
  },
  {
    title: 'Автовышка 45 метров',
    price: 'от 22 000 ₽/смена',
    short: 'Крупные объекты, промышленные площадки',
    image: '/images/avtovyshka-13m.png',
    url: '/equipment/avtovyshka-45m.html',
  },
  {
    title: 'Автовышка-вездеход 30 метров',
    price: 'от 28 000 ₽/смена',
    short: 'Работа там, где обычная техника не проедет',
    image: '/images/avtovyshka-13m.png',
    url: '/equipment/avtovyshka-vezdehod-35m.html',
  },
  {
    title: 'Самоходная автовышка',
    price: 'от 28 000 ₽/смена',
    short: 'Манёвренная техника для внутренних работ',
    image: '/images/avtovyshka-13m.png',
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
    baseShift: 30000,
    includedKm: 50,
    extraPerKm: 85,
    height: 30,
    capacity: 300,
    boom: 18,
    image: '/images/avtovyshka-13m.png',
  },
  self: {
    name: 'Самоходная автовышка',
    baseShift: 18000,
    includedKm: 20,
    extraPerKm: 85,
    height: 12,
    capacity: 230,
    boom: 6,
    image: '/images/avtovyshka-13m.png',
  },
};

// Динамический CALC_EQUIPMENT будет заполняться из API
let CALC_EQUIPMENT = {
  // Статические данные для специальных случаев
  ...STATIC_CALC_EQUIPMENT,
  // Временные данные для совместимости (будут заменены при загрузке из API)
  13: {
    name: 'Автовышка-платформа 13 м',
    baseHalfShift: 15000,
    baseShift: 18000,
    includedKm: 30,
    extraPerKm: 85,
    height: 13,
    capacity: 400,
    boom: 7,
    image: '/images/avtovyshka-13m.png',
  },
  15: {
    name: 'Автовышка 15 м',
    baseHalfShift: 15000,
    baseShift: 18000,
    includedKm: 30,
    extraPerKm: 85,
    height: 15,
    capacity: 200,
    boom: 8,
    image: '/images/avtovyshka-13m.png',
  },
  16: {
    name: 'Автовышка 16 м',
    baseHalfShift: 15000,
    baseShift: 18000,
    includedKm: 30,
    extraPerKm: 85,
    height: 16,
    capacity: 200,
    boom: 9,
    image: '/images/avtovyshka-16m.png',
  },
  17: {
    name: 'Автовышка 17 м',
    baseHalfShift: 15000,
    baseShift: 18000,
    includedKm: 30,
    extraPerKm: 85,
    height: 17,
    capacity: 200,
    boom: 10,
    image: '/images/avtovyshka-18m.png', // Используем 18м как fallback
  },
  18: {
    name: 'Автовышка 18 м',
    baseHalfShift: 16000,
    baseShift: 20000,
    includedKm: 30,
    extraPerKm: 85,
    height: 18,
    capacity: 230,
    boom: 11,
    image: '/images/avtovyshka-18m.png',
  },
  21: {
    name: 'Автовышка 21 м',
    baseHalfShift: 16000,
    baseShift: 21000,
    includedKm: 30,
    extraPerKm: 85,
    height: 21,
    capacity: 250,
    boom: 12,
    image: '/images/avtovyshka-21m.png',
  },
  25: {
    name: 'Автовышка 25 м',
    baseShift: 21000,
    includedKm: 40,
    extraPerKm: 85,
    height: 25,
    capacity: 250,
    boom: 14,
    image: '/images/avtovyshka-25m.png',
  },
  29: {
    name: 'Автовышка 29 м',
    baseShift: 26000,
    includedKm: 40,
    extraPerKm: 85,
    height: 29,
    capacity: 300,
    boom: 16,
    image: '/images/avtovyshka-29m.png',
  },
  45: {
    name: 'Автовышка 45 м',
    baseShift: 22000,
    includedKm: 50,
    extraPerKm: 85,
    height: 45,
    capacity: 320,
    boom: 20,
    image: '/images/avtovyshka-29m.png', // Fallback на 29м, пока нет 45м
  },
  '30offroad': {
    name: 'Автовышка‑вездеход 30 м',
    baseShift: 30000,
    includedKm: 50,
    extraPerKm: 85,
    height: 30,
    capacity: 300,
    boom: 18,
    image: '/images/avtovyshka-13m.png',
  },
  self: {
    name: 'Самоходная автовышка',
    baseShift: 18000,
    includedKm: 20,
    extraPerKm: 85,
    height: 12,
    capacity: 230,
    boom: 6,
    image: '/images/avtovyshka-13m.png',
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

// Функция для определения изображения по URL или названию
function getImageForService(service) {
  console.log('🔍 getImageForService called for:', service.title, {
    image_url: service.image_url,
    url: service.url,
    height_lift: service.height_lift,
    images: service.images
  });
  
  // Если есть image_url в базе, используем его (приоритет 1)
  if (service.image_url && service.image_url.trim() !== '') {
    let imageUrl = service.image_url.trim();
    
    // Если это полный URL (http://localhost:3000/...), преобразуем в относительный путь
    if (imageUrl.startsWith('http://localhost:3000/')) {
      imageUrl = imageUrl.replace('http://localhost:3000', '');
    }
    if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
      console.log('   ✅ Using full URL:', imageUrl);
      return imageUrl;
    }
    // Если это относительный путь, добавляем префикс если нужно
    if (imageUrl.startsWith('/')) {
      console.log('   ✅ Using relative path:', imageUrl);
      return imageUrl;
    }
    const finalUrl = '/' + imageUrl;
    console.log('   ✅ Using normalized path:', finalUrl);
    return finalUrl;
  }
  
  // Если есть массив images, используем первое изображение (приоритет 2)
  if (service.images) {
    let imagesArray = [];
    
    // Парсим JSON если это строка
    if (typeof service.images === 'string') {
      try {
        imagesArray = JSON.parse(service.images);
      } catch (e) {
        // Если не JSON, возможно это одна строка с URL
        if (service.images.trim()) {
          imagesArray = [service.images.trim()];
        }
      }
    } else if (Array.isArray(service.images)) {
      imagesArray = service.images;
    }
    
    if (imagesArray.length > 0) {
      const firstImage = imagesArray[0];
      let imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage);
      
      if (imageUrl && imageUrl.trim()) {
        imageUrl = imageUrl.trim();
        
        // Преобразуем localhost URL в относительный путь
        if (imageUrl.startsWith('http://localhost:3000/')) {
          imageUrl = imageUrl.replace('http://localhost:3000', '');
        }
        
        if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
          console.log('   ✅ Using image from images array (full URL):', imageUrl);
          return imageUrl;
        }
        if (imageUrl.startsWith('/')) {
          console.log('   ✅ Using image from images array:', imageUrl);
          return imageUrl;
        }
        const finalUrl = '/' + imageUrl;
        console.log('   ✅ Using image from images array (normalized):', finalUrl);
        return finalUrl;
      }
    }
  }
  
  // Определяем по URL (fallback)
  const url = (service.url || '').toLowerCase();
  console.log('   🔄 Trying to determine image from URL:', url);
  
  if (url.includes('13m')) {
    console.log('   ✅ Matched 13m');
    return '/images/avtovyshka-13m.png';
  }
  if (url.includes('15m')) {
    console.log('   ✅ Matched 15m');
    return '/images/avtovyshka-15m.png';
  }
  if (url.includes('16m')) {
    console.log('   ✅ Matched 16m');
    return '/images/avtovyshka-16m.png';
  }
  if (url.includes('17m')) {
    console.log('   ✅ Matched 17m -> 18m');
    return '/images/avtovyshka-18m.png';
  }
  if (url.includes('18m')) {
    console.log('   ✅ Matched 18m');
    return '/images/avtovyshka-18m.png';
  }
  if (url.includes('21m')) {
    console.log('   ✅ Matched 21m');
    return '/images/avtovyshka-21m.png';
  }
  if (url.includes('25m')) {
    console.log('   ✅ Matched 25m');
    return '/images/avtovyshka-25m.png';
  }
  if (url.includes('29m')) {
    console.log('   ✅ Matched 29m');
    return '/images/avtovyshka-29m.png';
  }
  if (url.includes('45m')) {
    console.log('   ✅ Matched 45m');
    return '/images/avtovyshka-45m.png';
  }
  if (url.includes('vezdehod') || url.includes('вездеход')) {
    console.log('   ✅ Matched vezdehod');
    return '/images/avtovyshka-vezdehod-30m.png';
  }
  if (url.includes('samohodnaya') || url.includes('самоходная')) {
    console.log('   ✅ Matched samohodnaya');
    return '/images/avtovyshka-13m.png';
  }
  
  // Определяем по высоте из названия
  const height = extractHeightFromTitle(service.title);
  console.log('   🔄 Trying to determine image from height:', height);
  
  if (height) {
    if (height === 13) {
      console.log('   ✅ Matched height 13');
      return '/images/avtovyshka-13m.png';
    }
    if (height === 15) {
      console.log('   ✅ Matched height 15');
      return '/images/avtovyshka-15m.png';
    }
    if (height === 16) {
      console.log('   ✅ Matched height 16');
      return '/images/avtovyshka-16m.png';
    }
    if (height === 17) {
      console.log('   ✅ Matched height 17 -> 18m');
      return '/images/avtovyshka-18m.png';
    }
    if (height === 18) {
      console.log('   ✅ Matched height 18');
      return '/images/avtovyshka-18m.png';
    }
    if (height === 21) {
      console.log('   ✅ Matched height 21');
      return '/images/avtovyshka-21m.png';
    }
    if (height === 25) {
      console.log('   ✅ Matched height 25');
      return '/images/avtovyshka-25m.png';
    }
    if (height === 29) {
      console.log('   ✅ Matched height 29');
      return '/images/avtovyshka-29m.png';
    }
    if (height === 45) {
      console.log('   ✅ Matched height 45');
      return '/images/avtovyshka-45m.png';
    }
  }
  
  // Fallback
  console.log('   ⚠️ Using default fallback image');
  return '/images/avtovyshka-13m.png';
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
    
    services.forEach(service => {
      if (!service.active) return; // Пропускаем неактивные услуги
      
      const url = (service.url || '').toLowerCase();
      const title = (service.title || '').toLowerCase();
      
      // Сначала проверяем, является ли это самоходной, вездеходом или погрузчиком
      const isSamohodnaya = url.includes('samohodnaya') || url.includes('самоходная') || title.includes('самоходная');
      const isVezdehod = url.includes('vezdehod') || url.includes('вездеход') || title.includes('вездеход');
      const isPogruzchik = url.includes('pogruzchik') || url.includes('погрузчик') || title.includes('погрузчик');
      
      let key;
      let height = null;
      
      if (isSamohodnaya) {
        // Самоходная вышка - всегда используем ключ 'self'
        key = 'self';
      } else if (isPogruzchik) {
        // Телескопический погрузчик - используем ключ 'loader'
        key = 'loader';
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
      
      // Получаем delivery_per_km из базы или используем значение по умолчанию
      const extraPerKm = service.delivery_per_km || 85;
      
      dynamicEquipment[key] = {
        name: service.title,
        baseShift: prices.baseShift,
        baseHalfShift: prices.baseHalfShift,
        includedKm: 30, // По умолчанию
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
  
  // Сортируем ключи по высоте (числовые значения)
  // Погрузчик ('loader') всегда в конце списка
  const sortedKeys = Object.keys(CALC_EQUIPMENT).sort((a, b) => {
    // Погрузчик всегда в конце
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
  const img = document.createElement('img');
  img.src = service.image || '/images/avtovyshka-13m.png';
  img.alt = service.title;
  // Улучшение качества изображения
  img.loading = 'eager'; // Загружаем сразу в полном качестве
  img.decoding = 'async'; // Асинхронная декодировка для лучшей производительности
  // Если изображение не загружается, используем изображение по умолчанию
  img.onerror = function() {
    this.src = '/images/avtovyshka-13m.png';
  };
  imgWrap.appendChild(img);

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
    const response = await fetch('/api/services');
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
          short: service.description || '',
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

  function updatePreview() {
    if (!selectEl || !previewImage || !previewTitle) return;
    const key = selectEl.value;
    const config = CALC_EQUIPMENT[key];
    if (!config) return;
    
    const previewContainer = document.getElementById('calculator-preview');
    const gsapLib = window.gsap || gsap;
    
    // Анимация исчезновения
    if (previewContainer && gsapLib) {
      gsapLib.to(previewContainer, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        ease: 'power2.in',
        onComplete: () => {
          // Обновляем контент
          // Убеждаемся, что путь к изображению правильный
          let imagePath = config.image || '/images/avtovyshka-13m.png';
          if (!imagePath.startsWith('/') && !imagePath.startsWith('http')) {
            imagePath = '/' + imagePath;
          }
          console.log('🖼️ Setting image:', imagePath, 'for equipment:', config.name);
          previewImage.src = imagePath;
          previewImage.alt = config.name;
          previewTitle.textContent = config.name;
          
          // Обработка ошибок загрузки изображения
          previewImage.onerror = function() {
            console.error('❌ Failed to load image:', imagePath);
            console.error('   Trying fallback image');
            // Используем fallback изображение
            const fallbackImage = '/images/avtovyshka-13m.png';
            if (this.src !== fallbackImage) {
              console.log('   Using fallback:', fallbackImage);
              this.src = fallbackImage;
            } else {
              console.error('   Fallback also failed!');
            }
            this.onerror = null; // Предотвращаем бесконечный цикл
          };
          
          previewImage.onload = function() {
            console.log('✅ Image loaded successfully:', imagePath);
          };

          if (specsList) {
            specsList.innerHTML = '';
            const items = [];
            if (config.height) items.push(`Рабочая высота: ${config.height} м`);
            if (config.capacity) items.push(`Грузоподъёмность люльки: ${config.capacity} кг`);
            if (config.boom) items.push(`Вылет стрелы: до ${config.boom} м`);
            items.forEach((text) => {
              const li = document.createElement('li');
              li.textContent = text;
              specsList.appendChild(li);
            });
          }
          
          // Анимация появления
          gsapLib.fromTo(previewContainer, 
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
          );
          // Убеждаемся, что изображение не затемнено
          if (previewImage) {
            previewImage.style.opacity = '1';
            previewImage.style.filter = 'none';
          }
        }
      });
    } else {
      // Fallback без анимации, если контейнер не найден или GSAP недоступен
      // Убеждаемся, что путь к изображению правильный
      let imagePath = config.image || '/images/avtovyshka-13m.png';
      if (!imagePath.startsWith('/') && !imagePath.startsWith('http')) {
        imagePath = '/' + imagePath;
      }
      console.log('🖼️ Setting image (fallback):', imagePath, 'for equipment:', config.name);
      previewImage.src = imagePath;
      previewImage.alt = config.name;
      previewTitle.textContent = config.name;
      
      // Обработка ошибок загрузки изображения
      previewImage.onerror = function() {
        console.error('❌ Failed to load image:', imagePath);
        console.error('   Trying fallback image');
        // Используем fallback изображение
        const fallbackImage = '/images/avtovyshka-13m.png';
        if (this.src !== fallbackImage) {
          console.log('   Using fallback:', fallbackImage);
          this.src = fallbackImage;
        } else {
          console.error('   Fallback also failed!');
        }
        this.onerror = null; // Предотвращаем бесконечный цикл
      };
      
      previewImage.onload = function() {
        console.log('✅ Image loaded successfully:', imagePath);
      };

      if (specsList) {
        specsList.innerHTML = '';
        const items = [];
        if (config.height) items.push(`Рабочая высота: ${config.height} м`);
        if (config.capacity) items.push(`Грузоподъёмность люльки: ${config.capacity} кг`);
        if (config.boom) items.push(`Вылет стрелы: до ${config.boom} м`);
        items.forEach((text) => {
          const li = document.createElement('li');
          li.textContent = text;
          specsList.appendChild(li);
        });
      }
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

    document.addEventListener('click', (evt) => {
      if (!customSelect.contains(evt.target)) {
        customSelect.classList.remove('open');
        if (equipmentField) equipmentField.classList.remove('is-open');
      }
    });

    // Обработчик изменения select (для обновления при динамической загрузке)
    selectEl.addEventListener('change', () => {
      updatePreview();
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
        
        // Триггерим пересчет
        if (distanceInput) {
          distanceInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
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

    document.addEventListener('click', (evt) => {
      if (!customShiftsSelect.contains(evt.target)) {
        customShiftsSelect.classList.remove('open');
        if (shiftsField) {
          shiftsField.classList.remove('is-open');
        }
      }
    });
  }

  // Кнопки увеличения/уменьшения расстояния
  const distanceInput = document.getElementById('calc-distance');
  const numberButtons = document.querySelectorAll('.number-btn');
  
  // Функция для сброса активного состояния всех кнопок
  function resetAllButtons() {
    numberButtons.forEach(b => {
      b.classList.remove('number-btn--active');
      // Принудительно сбрасываем стили
      b.style.transform = '';
      b.style.boxShadow = '';
    });
  }

  numberButtons.forEach((btn) => {
    // Обработчик нажатия - добавляем класс активной кнопки
    btn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      // Сбрасываем все кнопки
      resetAllButtons();
      
      // Добавляем класс только к нажатой кнопке
      btn.classList.add('number-btn--active');
    });
    
    // Обработчик отпускания - убираем класс
    btn.addEventListener('mouseup', (e) => {
      e.stopPropagation();
      resetAllButtons();
    });
    
    // Обработчик ухода мыши - убираем класс
    btn.addEventListener('mouseleave', () => {
      resetAllButtons();
    });
    
    btn.addEventListener('click', (e) => {
      // Останавливаем всплытие события
      e.stopPropagation();
      
      if (!distanceInput) return;
      const step = Number(distanceInput.step) || 1;
      const min = Number(distanceInput.min) || 0;
      const current = Number(distanceInput.value) || 0;
      const isPlus = btn.classList.contains('number-btn--plus');
      let next = current + (isPlus ? step : -step);
      if (next < min) next = min;
      distanceInput.value = next;
      
      // Триггерим событие input для пересчета
      distanceInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Сбрасываем активное состояние после клика
      setTimeout(() => {
        resetAllButtons();
      }, 150);
    });
    
    // Touch события
    btn.addEventListener('touchstart', (e) => {
      e.stopPropagation();
      resetAllButtons();
      btn.classList.add('number-btn--active');
    });
    
    btn.addEventListener('touchend', (e) => {
      e.stopPropagation();
      resetAllButtons();
    });
  });
  
  // Обработчик изменения расстояния для автоматического пересчета
  if (distanceInput) {
    distanceInput.addEventListener('input', () => {
      // Триггерим пересчет формы
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const equipmentKey = document.getElementById('calc-equipment').value;
    const shiftsValue = document.getElementById('calc-shifts').value;
    const customShiftsInput = document.getElementById('calc-shifts-custom');
    let shifts;
    if (shiftsValue === 'more') {
      shifts = Number(customShiftsInput?.value) || 4;
      if (shifts < 4) shifts = 4; // Минимум 4 смены для "Более 3 смен"
    } else {
      shifts = Number(shiftsValue) || 1;
    }
    const distance = Number(document.getElementById('calc-distance').value) || 0;

    const config = CALC_EQUIPMENT[equipmentKey];
    if (!config) {
      console.error('Config not found for equipment:', equipmentKey);
      return;
    }

    // Поддержка полсмены (0.5)
    let base;
    if (shifts === 0.5 && config.baseHalfShift) {
      base = config.baseHalfShift;
    } else if (shifts === 0.5 && !config.baseHalfShift) {
      // Если полсмены нет, но выбрана полсмена, используем 83% от полной смены
      base = Math.round((config.baseShift || 0) * 0.83);
    } else {
      base = (config.baseShift || 0) * Math.max(shifts, 1);
    }
    
    // Считаем стоимость за км (уже с учетом обеих сторон - в каждую сторону)
    const pricePerKm = (config.extraPerKm || 85);
    const kmCost = distance * pricePerKm * 2; // Стоимость доставки за км в обе стороны

    const total = base + kmCost; // Итоговая сумма с учетом доставки
    const formatted = total.toLocaleString('ru-RU');
    
    
    let shiftsText;
    let timeText = '';
    
    // Определяем время работы для одной смены/полсмены
    if (shifts === 0.5) {
      shiftsText = 'полсмены';
      timeText = 'Полсмены включает в себя 3 часа работы и один час подачи';
    } else {
      // Для всех остальных вариантов показываем время одной смены
      timeText = 'Смена включает в себя 7 часов работы и один час подачи';
      
      if (shiftsValue === 'more') {
        shiftsText = shifts === 4 ? '4 смены' : `${shifts} смен`;
      } else if (shifts === 1) {
        shiftsText = 'смену';
      } else if (shifts === 2) {
        shiftsText = 'смены';
      } else if (shifts === 3) {
        shiftsText = 'смены';
      } else if (shifts < 5) {
        shiftsText = 'смены';
      } else {
        shiftsText = 'смен';
      }
    }
    
    // Формируем информацию о стоимости километра
    let kmInfo = '';
    if (distance > 0) {
      kmInfo = `<span class="calculator-km-info">Доставка: ${distance} км × ${pricePerKm} ₽ × 2 = ${kmCost.toLocaleString('ru-RU')} ₽ (в каждую сторону)</span>`;
    }
    
    if (shiftsValue === 'more') {
      sumEl.innerHTML = `${formatted} ₽ за ${shiftsText} <span class="price-vat">без НДС</span>${timeText ? `<br><span class="calculator-time">${timeText}</span>` : ''}${kmInfo ? `<br>${kmInfo}` : ''}`;
    } else {
      sumEl.innerHTML = `${formatted} ₽ за ${shifts === 0.5 ? 'полсмены' : shifts} ${shifts === 0.5 ? '' : shiftsText} <span class="price-vat">без НДС</span>${timeText ? `<br><span class="calculator-time">${timeText}</span>` : ''}${kmInfo ? `<br>${kmInfo}` : ''}`;
    }
  });
}

// =============================================
// POPULAR EQUIPMENT SLIDER - данные слайдов
// =============================================
const POPULAR_EQUIPMENT_SLIDES = [
  {
    id: '1',
    index: '01',
    title: 'Автовышка-платформа 13 метров',
    text: '',
    bullets: [
      'Большая корзина 2/4 метра',
      'Грузоподъёмность 1000 кг',
      'Стоимость от 18 000 ₽/смена'
    ],
    image: '/images/avtovyshka-13m.png',
    url: '/equipment/avtovyshka-13m.html',
    price: 'от 18 000 ₽/смена'
  },
  {
    id: '2',
    index: '02',
    title: 'Автовышка-платформа 16 метров',
    text: '',
    bullets: [
      'Большая корзина 2/4 метра',
      'Грузоподъёмность 1000 кг',
      'Стоимость от 20 000 ₽/смена'
    ],
    image: '/images/avtovyshka-18m.png',
    url: '/equipment/avtovyshka-16m.html',
    price: 'от 20 000 ₽/смена'
  },
  {
    id: '3',
    index: '03',
    title: 'Автовышка-платформа 21 метр',
    text: '',
    bullets: [
      'Большая корзина 2/4 метра',
      'Грузоподъёмность 1000 кг',
      'Стоимость от 21 000 ₽/смена'
    ],
    image: '/images/avtovyshka-21m.png',
    url: '/equipment/avtovyshka-21m.html',
    price: 'от 21 000 ₽/смена'
  },
  {
    id: '4',
    index: '04',
    title: 'Автовышка телескоп-колено 25 метров',
    text: '',
    bullets: [
      'Корзина 1/2 метра',
      'Грузоподъёмность 300 кг',
      'Стоимость от 21 000 ₽/смена'
    ],
    image: '/images/avtovyshka-25m.png',
    url: '/equipment/avtovyshka-25m.html',
    price: 'от 21 000 ₽/смена'
  }
];

// =============================================
// POPULAR EQUIPMENT SLIDER - инициализация
// =============================================
async function initOurCapabilitiesSlider() {
  console.log('🔄 Initializing slider...');
  
  // Функция для ожидания появления элемента
  const waitForElement = (selector, maxAttempts = 50) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (attempts < maxAttempts) {
          attempts++;
          // Используем более длинную задержку для первых попыток
          const delay = attempts < 10 ? 50 : 100;
          setTimeout(() => requestAnimationFrame(checkElement), delay);
        } else {
          // Перед ошибкой выводим диагностику
          console.error(`❌ Element ${selector} not found after ${maxAttempts} attempts`);
          console.error('Available sections:', Array.from(document.querySelectorAll('section')).map(s => ({ id: s.id, className: s.className })));
          console.error('All elements with id:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
          reject(new Error(`Element ${selector} not found after ${maxAttempts} attempts`));
        }
      };
      checkElement();
    });
  };
  
  try {
    // Ждем появления секции
    const section = await waitForElement('#popular-equipment');
    console.log('✅ Section found:', section);
    
    // Ждем появления контейнера слайдов
    const sliderContainer = await waitForElement('#our-capabilities-slider');
    console.log('✅ Slider container found:', sliderContainer);
    
    // Определяем URL популярных машин
    const popularUrls = [
      '/equipment/avtovyshka-13m.html',
      '/equipment/avtovyshka-16m.html',
      '/equipment/avtovyshka-21m.html',
      '/equipment/avtovyshka-25m.html'
    ];
    
    let slidesData = POPULAR_EQUIPMENT_SLIDES;
    
    try {
    const response = await fetch('/api/services');
    if (response.ok) {
      const services = await response.json();
      // Фильтруем популярные машины по URL
      const popularServices = services.filter(service => 
        popularUrls.includes(service.url)
      );
      
      if (popularServices.length > 0) {
        // Преобразуем данные из API в формат слайдов
        slidesData = popularServices.map((service, index) => {
          // Исправляем кодировку текстовых полей
          const fixTextEncoding = (text) => {
            if (!text || typeof text !== 'string') return text;
            // Удаляем проблемные последовательности с неправильной кодировкой
            let fixed = text;
            // Исправляем двойную кодировку кириллицы
            if (/Р[Р-Я]/.test(fixed) || /С[Р-Я]/.test(fixed)) {
              try {
                // Пробуем исправить через декодирование
                const buffer = Buffer.from(fixed, 'latin1');
                const decoded = buffer.toString('utf8');
                if (decoded && /[А-Яа-яЁё]/.test(decoded) && !/Р[Р-Я]/.test(decoded)) {
                  fixed = decoded;
                }
              } catch (e) {
                // Игнорируем ошибки
              }
            }
            return fixed;
          };
          
          // Парсим specifications для получения характеристик
          const specs = fixTextEncoding(service.specifications || '');
          const bullets = specs.split(',').filter(s => s.trim()).map(s => s.trim());
          
          // Определяем изображение по URL или используем из базы данных
          let slideImage = service.image_url || '/images/avtovyshka-13m.png';
          const serviceUrl = (service.url || '').toLowerCase();
          
          if (!service.image_url) {
            // Если нет изображения в базе, используем локальные файлы
            if (serviceUrl.includes('13m')) {
              slideImage = '/images/avtovyshka-13m.png';
            } else if (serviceUrl.includes('16m')) {
              slideImage = '/images/avtovyshka-16m.png';
            } else if (serviceUrl.includes('21m')) {
              slideImage = '/images/avtovyshka-21m.png';
            } else if (serviceUrl.includes('25m')) {
              slideImage = '/images/avtovyshka-25m.png';
            } else {
              slideImage = '/images/avtovyshka-13m.png';
            }
          }
          
          // Используем fallback данные, если данные из базы содержат неправильную кодировку
          const title = fixTextEncoding(service.title);
          const text = fixTextEncoding(service.description || '');
          const price = fixTextEncoding(service.price || '');
          
          // Проверяем, есть ли признаки неправильной кодировки
          const hasBadEncoding = /Р[Р-Я]/.test(title) || /С[Р-Я]/.test(title) || 
                                 /Р[Р-Я]/.test(text) || /С[Р-Я]/.test(text) ||
                                 /Р[Р-Я]/.test(price) || /С[Р-Я]/.test(price);
          
          // Если есть проблемы с кодировкой, используем fallback данные
          const fallbackSlide = POPULAR_EQUIPMENT_SLIDES[index];
          if (hasBadEncoding && fallbackSlide) {
            console.warn('⚠️ Bad encoding detected for service, using fallback data:', service.title);
            // Убираем информацию о полсмене из fallback цены
            let cleanedFallbackPrice = extractShiftPrice(fallbackSlide.price);
            
            // Убеждаемся, что цена начинается с "от"
            if (cleanedFallbackPrice && !cleanedFallbackPrice.toLowerCase().startsWith('от')) {
              cleanedFallbackPrice = 'от ' + cleanedFallbackPrice;
            } else if (!cleanedFallbackPrice && fallbackSlide.price && !fallbackSlide.price.toLowerCase().startsWith('от')) {
              cleanedFallbackPrice = 'от ' + fallbackSlide.price;
            } else if (!cleanedFallbackPrice) {
              cleanedFallbackPrice = fallbackSlide.price || '';
            }
            
            return {
              id: String(index + 1),
              index: String(index + 1).padStart(2, '0'),
              title: fallbackSlide.title,
              text: '', // Убираем описательный текст
              bullets: fallbackSlide.bullets || [],
              image: slideImage,
              url: service.url || popularUrls[index],
              price: cleanedFallbackPrice
            };
          }
          
          // Убираем информацию о полсмене из цены для слайдов
          let cleanedPrice = extractShiftPrice(price);
          
          // Убеждаемся, что цена начинается с "от"
          if (cleanedPrice && !cleanedPrice.toLowerCase().startsWith('от')) {
            cleanedPrice = 'от ' + cleanedPrice;
          } else if (!cleanedPrice && price && !price.toLowerCase().startsWith('от')) {
            cleanedPrice = 'от ' + price;
          } else if (!cleanedPrice) {
            cleanedPrice = price || '';
          }
          
          return {
            id: String(index + 1),
            index: String(index + 1).padStart(2, '0'),
            title: title,
            text: '', // Убираем описательный текст
            bullets: bullets.length > 0 ? bullets : (fallbackSlide?.bullets || []),
            image: slideImage,
            url: service.url || popularUrls[index],
            price: cleanedPrice
          };
        });
      }
      }
    } catch (error) {
      console.error('Error loading popular equipment:', error);
      // Используем FALLBACK данные
    }
    
    // Проверяем данные слайдов
    if (!slidesData || slidesData.length === 0) {
      console.error('❌ No slides data available');
      return;
    }
    
    console.log('✅ Slides data loaded:', slidesData.length, 'slides');
    
    // Очищаем контейнер перед созданием слайдов
    sliderContainer.innerHTML = '';
  
  // Создаём слайды
  slidesData.forEach((slide, index) => {
    const slideEl = document.createElement('div');
    slideEl.className = `our-capabilities-slide ${index === 0 ? 'active' : ''}`;
    slideEl.dataset.index = index;
    
    const bulletsHtml = slide.bullets ? `
      <ul class="our-capabilities-slide-bullets">
        ${slide.bullets.map(bullet => `<li>${bullet}</li>`).join('')}
      </ul>
    ` : '';
    
    const slideNumber = String(index + 1).padStart(2, '0');
    const totalSlidesStr = String(slidesData.length).padStart(2, '0');
    
    const priceHtml = slide.price ? `<p class="our-capabilities-slide-price">${slide.price} <span class="price-vat">без НДС</span></p>` : '';
    const linkHtml = slide.url ? `<a href="${slide.url}" class="our-capabilities-slide-link">Подробнее →</a>` : '';
    
    slideEl.innerHTML = `
      <div class="our-capabilities-slide-bg">
        <img src="${slide.image}" alt="${slide.title}" loading="lazy" />
      </div>
      <div class="our-capabilities-slide-gradient"></div>
      <div class="our-capabilities-slide-counter">${slideNumber}/${totalSlidesStr}</div>
      <div class="our-capabilities-slide-content">
        <h3 class="our-capabilities-slide-title">${slide.title}</h3>
        ${slide.text && slide.text.trim() ? `<p class="our-capabilities-slide-text">${slide.text}</p>` : ''}
        ${bulletsHtml}
        ${priceHtml}
        ${linkHtml}
      </div>
    `;
    
    sliderContainer.appendChild(slideEl);
  });
  
  const slides = sliderContainer.querySelectorAll('.our-capabilities-slide');
  console.log('✅ Slides created:', slides.length);
  
  if (slides.length === 0) {
    console.error('❌ No slides were created');
    return;
  }
  const totalSlides = slides.length;
  let previousIndex = 0;
  
  // Находим кнопку "Посмотреть весь автопарк"
  const buttonContainer = section.querySelector('.popular-equipment-button');
  
  // Функция обновления активного слайда с эффектом колоды карт
  function updateActiveSlide(activeIndex) {
    if (activeIndex < 0 || activeIndex >= totalSlides) return;
    
    // Если индекс не изменился, не обновляем
    if (activeIndex === previousIndex) return;
    
    // Плавное переключение без задержек для более быстрого отклика
    slides.forEach((slide, index) => {
      slide.classList.remove('active', 'prev');
      
      if (index === activeIndex) {
        // Текущий активный слайд - появляется снизу
        slide.classList.add('active');
      } else if (index < activeIndex) {
        // Прошедшие слайды уходят наверх и исчезают
        slide.classList.add('prev');
      }
      // Будущие слайды остаются внизу (translateY(100%))
    });
    
    // Показываем кнопку когда показывается последний слайд (индекс 3 из 4)
    if (buttonContainer) {
      if (activeIndex >= totalSlides - 1) {
        // Последний слайд - показываем кнопку
        buttonContainer.classList.add('visible');
      } else if (activeIndex < totalSlides - 2) {
        // Не предпоследний и не последний слайд - скрываем кнопку
        buttonContainer.classList.remove('visible');
      }
    }
    
    // Обновляем счётчики на слайдах (они уже есть в HTML каждого слайда)
    // Счётчики обновляются автоматически, так как они встроены в каждый слайд
    
    previousIndex = activeIndex;
  }
  
  // Функция вычисления прогресса прокрутки
  function calculateProgress() {
    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionTop = rect.top;
    const sectionHeight = rect.height;
    
    // Если секция еще не достигла верха экрана, прогресс = 0
    if (sectionTop > windowHeight) {
      return 0;
    }
    
    // Вычисляем прогресс: когда секция входит в viewport (top < windowHeight)
    // и прокручивается до конца (top < -sectionHeight + windowHeight)
    const startPoint = windowHeight; // когда верх секции достигает верха экрана
    const endPoint = -sectionHeight + windowHeight; // когда низ секции достигает верха экрана
    
    // Добавляем большую задержку для первого слайда - он должен показываться дольше
    // Вычитаем 80% высоты окна из начала, чтобы можно было прокрутить ниже перед началом слайдов
    const delayOffset = windowHeight * 0.8; // 80% высоты экрана задержки - можно прокрутить ниже
    const adjustedStartPoint = startPoint - delayOffset;
    
    // Нормализуем прогресс от 0 до 1 с учетом задержки
    const scrolled = adjustedStartPoint - sectionTop;
    const totalScroll = adjustedStartPoint - endPoint;
    let progress = Math.max(0, Math.min(1, scrolled / totalScroll));
    
    // Если прогресс еще в зоне задержки, возвращаем 0 (первый слайд)
    if (sectionTop > adjustedStartPoint) {
      progress = 0;
    }
    
    return progress;
  }
  
  // Функция обновления слайда на основе прогресса
  function updateSlideFromScroll() {
    const progress = calculateProgress();
    
    // Вычисляем индекс слайда на основе прогресса
    // Первый слайд должен показываться дольше - добавляем задержку
    // Для 4 слайдов: первые 30% прогресса = слайд 0, затем равномерно распределяем остальные
    const firstSlideDelay = 0.3; // 30% прогресса для первого слайда - больше времени на чтение
    let slideProgress;
    
    if (progress < firstSlideDelay) {
      // Первый слайд - показываем его дольше
      slideProgress = 0;
    } else {
      // Остальные слайды - распределяем равномерно по оставшемуся прогрессу
      const remainingProgress = progress - firstSlideDelay;
      const remainingSlides = totalSlides - 1;
      slideProgress = 1 + (remainingProgress / (1 - firstSlideDelay)) * remainingSlides;
    }
    
    // Используем плавное округление для более естественного переключения
    const activeIndex = Math.min(
      totalSlides - 1,
      Math.max(0, Math.floor(slideProgress + 0.1)) // Небольшое смещение для более раннего переключения
    );
    
    updateActiveSlide(activeIndex);
  }
  
  // Обработчик прокрутки - используем Lenis, если доступен
  let ticking = false;
  function handleScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateSlideFromScroll();
        ticking = false;
      });
      ticking = true;
    }
  }
  
  // Подключаем обработчик прокрутки
  function setupScrollHandler() {
    if (window.lenis) {
      // Используем Lenis события
      window.lenis.on('scroll', handleScroll);
    } else {
      // Fallback на нативный scroll
      window.addEventListener('scroll', handleScroll, { passive: true });
    }
  }
  
  setupScrollHandler();
  
  // Переключимся на Lenis, когда он загрузится
  const checkLenisSlider = setInterval(() => {
    if (window.lenis) {
      window.removeEventListener('scroll', handleScroll);
      window.lenis.on('scroll', handleScroll);
      clearInterval(checkLenisSlider);
    }
  }, 100);
  
  // Инициализация при загрузке
  updateSlideFromScroll();
  
  // Дополнительная проверка: если секция уже прокручена, показываем кнопку
  if (buttonContainer) {
    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    // Если секция уже прошла (верх секции выше верха экрана), показываем кнопку
    if (rect.top < windowHeight * 0.5) {
      const progress = calculateProgress();
      if (progress >= 0.7) {
        buttonContainer.classList.add('visible');
      }
    }
  }
  
    // Также обновляем при изменении размера окна
    window.addEventListener('resize', () => {
      updateSlideFromScroll();
    }, { passive: true });
    
  } catch (error) {
    console.error('❌ Error initializing slider:', error);
    console.error('Error details:', error.message, error.stack);
  }
}

// Обработчик формы быстрой заявки
function initQuickContactForm() {
  const form = document.getElementById('quick-contact-form');
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

// Функция инициализации всех компонентов
async function initializePage() {
  try {
    await displayServices();
  } catch (error) {
    console.error('Error displaying services:', error);
  }
  
  try {
    await displayReviews();
  } catch (error) {
    console.error('Error displaying reviews:', error);
  }
  
  // Загружаем данные для калькулятора из API перед инициализацией
  try {
    await loadCalculatorEquipmentFromAPI();
    initCalculator();
  } catch (error) {
    console.error('Error initializing calculator:', error);
  }
  
  try {
    await initOurCapabilitiesSlider();
  } catch (error) {
    console.error('Error initializing slider:', error);
  }
  
  try {
    initQuickContactForm();
  } catch (error) {
    console.error('Error initializing contact form:', error);
  }
  
  try {
    initEquipmentDropdown();
  } catch (error) {
    console.error('Error initializing equipment dropdown:', error);
  }
}

// Множественная инициализация для надежности
function startInitialization() {
  // Проверяем наличие секции перед инициализацией
  const section = document.getElementById('popular-equipment');
  if (!section) {
    console.warn('⚠️ Section #popular-equipment not found yet, will retry...');
    // Повторяем попытку через небольшую задержку
    setTimeout(() => {
      if (document.getElementById('popular-equipment')) {
        initializePage();
      } else {
        console.error('❌ Section #popular-equipment still not found after delay');
        // Пробуем еще раз при полной загрузке страницы
        window.addEventListener('load', initializePage, { once: true });
      }
    }, 500);
    return;
  }
  
  initializePage();
}

// Запускаем инициализацию при загрузке DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startInitialization);
} else {
  // DOM уже загружен
  startInitialization();
}

// Резервная инициализация при полной загрузке страницы
window.addEventListener('load', () => {
  // Проверяем, инициализирован ли слайдер
  const slider = document.getElementById('our-capabilities-slider');
  if (slider && slider.children.length === 0) {
    console.log('🔄 Retrying slider initialization on window load...');
    initOurCapabilitiesSlider().catch(err => {
      console.error('❌ Slider initialization failed on window load:', err);
    });
  }
}, { once: true });

 