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
    image: '/images/avtovyshka-13m.png',
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
    image: '/images/avtovyshka-13m.png',
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
    image: '/images/avtovyshka-13m.png',
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
  // Если есть image_url в базе, используем его (приоритет 1)
  if (service.image_url) {
    // Если это полный URL (http://localhost:3000/...), преобразуем в относительный путь
    if (service.image_url.startsWith('http://localhost:3000/')) {
      return service.image_url.replace('http://localhost:3000', '');
    }
    if (service.image_url.startsWith('https://') || service.image_url.startsWith('http://')) {
      return service.image_url;
    }
    // Если это относительный путь, добавляем префикс если нужно
    if (service.image_url.startsWith('/')) {
      return service.image_url;
    }
    return '/' + service.image_url;
  }
  
  // Если есть массив images, используем первое изображение (приоритет 2)
  if (service.images && Array.isArray(service.images) && service.images.length > 0) {
    const firstImage = service.images[0];
    let imageUrl = typeof firstImage === 'string' ? firstImage : (firstImage.url || firstImage);
    
    // Преобразуем localhost URL в относительный путь
    if (imageUrl.startsWith('http://localhost:3000/')) {
      imageUrl = imageUrl.replace('http://localhost:3000', '');
    }
    
    if (imageUrl.startsWith('https://') || imageUrl.startsWith('http://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('/')) {
      return imageUrl;
    }
    return '/' + imageUrl;
  }
  
  // Определяем по URL (fallback)
  const url = (service.url || '').toLowerCase();
  if (url.includes('13m')) return '/images/avtovyshka-13m.png';
  if (url.includes('15m')) return '/images/avtovyshka-15m.png';
  if (url.includes('16m')) return '/images/avtovyshka-16m.png';
  if (url.includes('17m')) return '/images/avtovyshka-17m.png';
  if (url.includes('18m')) return '/images/avtovyshka-18m.png';
  if (url.includes('21m')) return '/images/avtovyshka-21m.png';
  if (url.includes('25m')) return '/images/avtovyshka-25m.png';
  if (url.includes('29m')) return '/images/avtovyshka-29m.png';
  if (url.includes('45m')) return '/images/avtovyshka-45m.png';
  if (url.includes('vezdehod') || url.includes('вездеход')) return '/images/avtovyshka-vezdehod-30m.png';
  if (url.includes('samohodnaya') || url.includes('самоходная')) return '/images/avtovyshka-13m.png';
  
  // Определяем по высоте из названия
  const height = extractHeightFromTitle(service.title);
  if (height) {
    if (height === 13) return '/images/avtovyshka-13m.png';
    if (height === 15) return '/images/avtovyshka-15m.png';
    if (height === 16) return '/images/avtovyshka-16m.png';
    if (height === 17) return '/images/avtovyshka-17m.png';
    if (height === 18) return '/images/avtovyshka-18m.png';
    if (height === 21) return '/images/avtovyshka-21m.png';
    if (height === 25) return '/images/avtovyshka-25m.png';
    if (height === 29) return '/images/avtovyshka-29m.png';
    if (height === 45) return '/images/avtovyshka-45m.png';
  }
  
  // Fallback
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
      
      // Сначала проверяем, является ли это самоходной или вездеходом
      const isSamohodnaya = url.includes('samohodnaya') || url.includes('самоходная') || title.includes('самоходная');
      const isVezdehod = url.includes('vezdehod') || url.includes('вездеход') || title.includes('вездеход');
      
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
  const sortedKeys = Object.keys(CALC_EQUIPMENT).sort((a, b) => {
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
  // ВАЖНО: слушаем только прокрутку viewport (горизонтальную), НЕ прокрутку страницы
  viewport.addEventListener('scroll', handleScroll, { passive: true });
  
  // Убеждаемся, что нет inline стилей transform от предыдущей scroll-driven версии
  if (grid.style.transform) {
    grid.style.transform = '';
  }

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
          previewImage.src = config.image;
          previewImage.alt = config.name;
          previewTitle.textContent = config.name;

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
      previewImage.src = config.image;
      previewImage.alt = config.name;
      previewTitle.textContent = config.name;

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
    text: 'Компактная и маневренная машина с большой платформой для работ на небольших высотах. Идеально подходит для фасадных работ, установки кондиционеров, монтажа вывесок и освещения.',
    bullets: [
      'Высота подъёма: 13 метров',
      'Вылет стрелы: до 7 метров',
      'Грузоподъёмность корзины: 400 кг',
      'Размер корзины: 1.2 x 1.2 м'
    ],
    image: '/images/avtovyshka-13m.png',
    url: '/equipment/avtovyshka-13m.html',
    price: 'от 18 000 ₽/смена'
  },
  {
    id: '2',
    index: '02',
    title: 'Автовышка 18 метров',
    text: 'Популярная модель для работ на фасадах и рекламных конструкциях. Хороший баланс высоты и манёвренности.',
    bullets: [
      'Высота подъёма: 18 метров',
      'Вылет стрелы: до 11 метров',
      'Грузоподъёмность люльки: 200 кг'
    ],
    image: '/images/avtovyshka-18m.png',
    url: '/equipment/avtovyshka-18m.html',
    price: 'от 24 000 ₽/смена'
  },
  {
    id: '3',
    index: '03',
    title: 'Автовышка-платформа 21 метр',
    text: 'Универсальная техника с большой платформой (2x4м) и хорошим запасом высоты. Подходит для большинства городских задач с крупногабаритными материалами.',
    bullets: [
      'Высота подъёма: 21 метр',
      'Вылет стрелы: до 11 метров',
      'Грузоподъёмность корзины: 1000 кг',
      'Размер корзины: 2 x 4 м'
    ],
    image: '/images/avtovyshka-21m.png',
    url: '/equipment/avtovyshka-21m.html',
    price: 'от 21 000 ₽/смена'
  },
  {
    id: '4',
    index: '04',
    title: 'Автовышка 29 метров',
    text: 'Мощная техника для монтажных и высотных работ повышенной сложности. Работа на высоте до 8–9 этажа.',
    bullets: [
      'Высота подъёма: 29 метров',
      'Вылет стрелы: до 14 метров',
      'Грузоподъёмность люльки: 200 кг',
      'Проезд в арку: 3300 мм'
    ],
    image: '/images/avtovyshka-29m.png',
    url: '/equipment/avtovyshka-29m.html',
    price: 'от 26 000 ₽/смена'
  }
];

// =============================================
// POPULAR EQUIPMENT SLIDER - инициализация
// =============================================
async function initOurCapabilitiesSlider() {
  const section = document.getElementById('popular-equipment');
  const sliderContainer = document.getElementById('our-capabilities-slider');
  
  if (!section || !sliderContainer) return;
  
  // Определяем URL популярных машин
  const popularUrls = [
    '/equipment/avtovyshka-13m.html',
    '/equipment/avtovyshka-18m.html',
    '/equipment/avtovyshka-21m.html',
    '/equipment/avtovyshka-29m.html'
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
            } else if (serviceUrl.includes('18m')) {
              slideImage = '/images/avtovyshka-18m.png';
            } else if (serviceUrl.includes('21m')) {
              slideImage = '/images/avtovyshka-21m.png';
            } else if (serviceUrl.includes('29m')) {
              slideImage = '/images/avtovyshka-29m.png';
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
            const cleanedFallbackPrice = extractShiftPrice(fallbackSlide.price);
            return {
              id: String(index + 1),
              index: String(index + 1).padStart(2, '0'),
              title: fallbackSlide.title,
              text: fallbackSlide.text,
              bullets: fallbackSlide.bullets || [],
              image: slideImage,
              url: service.url || popularUrls[index],
              price: cleanedFallbackPrice || fallbackSlide.price
            };
          }
          
          // Убираем информацию о полсмене из цены для слайдов
          const cleanedPrice = extractShiftPrice(price);
          
          return {
            id: String(index + 1),
            index: String(index + 1).padStart(2, '0'),
            title: title,
            text: text,
            bullets: bullets.length > 0 ? bullets : (fallbackSlide?.bullets || []),
            image: slideImage,
            url: service.url || popularUrls[index],
            price: cleanedPrice || price
          };
        });
      }
    }
  } catch (error) {
    console.error('Error loading popular equipment:', error);
    // Используем FALLBACK данные
  }
  
  // Создаём слайды
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1678',message:'Creating slides',data:{slidesDataLength:slidesData.length,sliderContainerExists:!!sliderContainer},timestamp:Date.now()},sessionId:'debug-session',runId:'run3',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
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
        <p class="our-capabilities-slide-text">${slide.text}</p>
        ${bulletsHtml}
        ${priceHtml}
        ${linkHtml}
      </div>
    `;
    
    sliderContainer.appendChild(slideEl);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1710',message:'Slide created',data:{index,hasActiveClass:slideEl.classList.contains('active'),slideRect:slideEl.getBoundingClientRect(),opacity:window.getComputedStyle(slideEl).opacity},timestamp:Date.now()},sessionId:'debug-session',runId:'run3',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  });
  
  const slides = sliderContainer.querySelectorAll('.our-capabilities-slide');
  const totalSlides = slides.length;
  let previousIndex = 0;
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1720',message:'Slides initialized',data:{totalSlides,sliderContainerHeight:sliderContainer.offsetHeight,sliderContainerRect:sliderContainer.getBoundingClientRect(),firstSlideRect:slides[0]?.getBoundingClientRect(),firstSlideHasActive:slides[0]?.classList.contains('active'),firstSlideOpacity:slides[0]?window.getComputedStyle(slides[0]).opacity:null},timestamp:Date.now()},sessionId:'debug-session',runId:'run3',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  // Находим кнопку "Посмотреть весь автопарк"
  const buttonContainer = section.querySelector('.popular-equipment-button');
  
  // Функция обновления активного слайда с эффектом колоды карт
  function updateActiveSlide(activeIndex) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1722',message:'updateActiveSlide entry',data:{activeIndex,previousIndex,totalSlides,slidesLength:slides.length},timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (activeIndex < 0 || activeIndex >= totalSlides) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1724',message:'updateActiveSlide invalid index',data:{activeIndex,totalSlides},timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return;
    }
    
    // Если индекс не изменился, не обновляем
    if (activeIndex === previousIndex) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1727',message:'updateActiveSlide same index skip',data:{activeIndex,previousIndex},timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return;
    }
    
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
    
    // Показываем кнопку когда показывается последний слайд
    if (buttonContainer) {
      if (activeIndex >= totalSlides - 1) {
        // Последний слайд - показываем кнопку
        buttonContainer.classList.add('visible');
      } else if (activeIndex < totalSlides - 2) {
        // Не предпоследний и не последний слайд - скрываем кнопку
        buttonContainer.classList.remove('visible');
      }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1754',message:'updateActiveSlide completed',data:{activeIndex,previousIndex,buttonVisible:buttonContainer?.classList.contains('visible')},timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    previousIndex = activeIndex;
  }
  
  // Функция вычисления прогресса прокрутки
  function calculateProgress() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1757',message:'calculateProgress entry',data:{timestamp:Date.now()},sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const rect = section.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const sectionTop = rect.top;
    // Используем scrollHeight вместо height для правильного расчета с учетом sticky
    const sectionHeight = section.scrollHeight || rect.height;
    const stickyElement = section.querySelector('.our-capabilities-sticky');
    const stickyRect = stickyElement?.getBoundingClientRect();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1762',message:'calculateProgress rect data',data:{sectionTop,sectionHeight,sectionScrollHeight:section.scrollHeight,rectHeight:rect.height,windowHeight,rectTop:rect.top,rectBottom:rect.bottom,stickyTop:stickyRect?.top,stickyHeight:stickyRect?.height,stickyBottom:stickyRect?.bottom,windowScrollY:window.scrollY},timestamp:Date.now()},sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    // Если секция еще не достигла верха экрана, прогресс = 0
    if (sectionTop > windowHeight) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1765',message:'calculateProgress early return 0',data:{sectionTop,windowHeight},timestamp:Date.now()},sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      return 0;
    }
    
    // Вычисляем прогресс: когда секция входит в viewport
    const startPoint = windowHeight;
    const endPoint = -sectionHeight + windowHeight;
    
    // Добавляем большую задержку для первого слайда
    const delayOffset = windowHeight * 0.8;
    const adjustedStartPoint = startPoint - delayOffset;
    
    // Нормализуем прогресс от 0 до 1
    const scrolled = adjustedStartPoint - sectionTop;
    const totalScroll = adjustedStartPoint - endPoint;
    let progress = Math.max(0, Math.min(1, scrolled / totalScroll));
    
    // Если прогресс еще в зоне задержки, возвращаем 0
    if (sectionTop > adjustedStartPoint) {
      progress = 0;
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1786',message:'calculateProgress result',data:{progress,startPoint,endPoint,delayOffset,adjustedStartPoint,scrolled,totalScroll,sectionTop,sectionHeight},timestamp:Date.now()},sessionId:'debug-session',runId:'run2',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    return progress;
  }
  
  // Функция обновления слайда на основе прогресса
  function updateSlideFromScroll() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1790',message:'updateSlideFromScroll entry',data:{totalSlides},timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    const progress = calculateProgress();
    
    // Вычисляем индекс слайда на основе прогресса
    const firstSlideDelay = 0.3;
    let slideProgress;
    
    if (progress < firstSlideDelay) {
      slideProgress = 0;
    } else {
      const remainingProgress = progress - firstSlideDelay;
      const remainingSlides = totalSlides - 1;
      slideProgress = 1 + (remainingProgress / (1 - firstSlideDelay)) * remainingSlides;
    }
    
    const activeIndex = Math.min(
      totalSlides - 1,
      Math.max(0, Math.floor(slideProgress + 0.1))
    );
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1810',message:'updateSlideFromScroll computed index',data:{progress,firstSlideDelay,slideProgress,activeIndex,totalSlides},timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    updateActiveSlide(activeIndex);
  }
  
  // Обработчик прокрутки - используем Lenis, если доступен
  let ticking = false;
  function handleScroll() {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1815',message:'handleScroll called',data:{ticking,windowScrollY:window.scrollY,hasLenis:!!window.lenis},timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    
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
      window.lenis.on('scroll', handleScroll);
    } else {
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
  const stickyElement = section.querySelector('.our-capabilities-sticky');
  
  // #region agent log
  const sectionRect = section?.getBoundingClientRect();
  const stickyRect = stickyElement?.getBoundingClientRect();
  fetch('http://127.0.0.1:7242/ingest/49be1b02-d5ae-4b50-af2c-257f5ea883de',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'script.js:1852',message:'initOurCapabilitiesSlider initialization',data:{totalSlides,sectionExists:!!section,sliderContainerExists:!!sliderContainer,stickyExists:!!stickyElement,sectionRect:{top:sectionRect?.top,height:sectionRect?.height,bottom:sectionRect?.bottom},stickyRect:{top:stickyRect?.top,height:stickyRect?.height,bottom:stickyRect?.bottom},windowHeight:window.innerHeight,windowScrollY:window.scrollY},timestamp:Date.now()},sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  updateSlideFromScroll();
  
  // Обновление при изменении размера окна
  window.addEventListener('resize', () => {
    updateSlideFromScroll();
  }, { passive: true });
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

 