const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const iconv = require('iconv-lite');
const axios = require('axios');
require('dotenv').config();
const { slugifyAsciiFilename } = require('./lib/slugify-filename.js');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

// Telegram Bot Configuration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Function to send Telegram notification
async function sendTelegramNotification(message) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram bot token or chat ID not set. Skipping notification.');
    return;
  }
  
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  try {
    await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    });
    console.log('✅ Telegram notification sent.');
  } catch (error) {
    console.error('❌ Error sending Telegram notification:', error.response ? error.response.data : error.message);
  }
}

// Function to generate URL from title
function generateUrlFromTitle(title) {
  if (!title) return '';
  
  // Транслитерация кириллицы в латиницу
  const translitMap = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
    'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
    'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'E',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
    'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
    'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
    'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
  };
  
  let result = title.toLowerCase()
    .split('')
    .map(char => translitMap[char] || char)
    .join('')
    .replace(/[^a-z0-9\s-]/g, '') // Удаляем спецсимволы
    .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
    .replace(/-+/g, '-') // Убираем множественные дефисы
    .replace(/^-|-$/g, ''); // Убираем дефисы в начале и конце
  
  // Если результат пустой, используем fallback
  if (!result) {
    result = 'equipment-' + Date.now();
  }
  
  // Добавляем расширение .html если его нет
  if (!result.endsWith('.html')) {
    result += '.html';
  }
  
  return result;
}

// Function to generate equipment page HTML
function generateEquipmentPageHTML(service) {
  // title — без fixEncoding, чтобы сохранялся дефис (Автовышка-платформа)
  const title = (service.title != null && String(service.title).trim()) ? String(service.title).trim() : 'Автовышка';
  const description = service.description || '';
  const price = service.price ? fixEncoding(service.price) : '';
  const imageUrl = service.image_url || '/images/avtovyshka-13m.webp';
  const url = service.url || '';
  
  // Парсим схемы вылета стрелы
  let reachDiagrams = [];
  if (service.reach_diagrams) {
    if (Array.isArray(service.reach_diagrams)) {
      reachDiagrams = service.reach_diagrams;
    } else if (typeof service.reach_diagrams === 'string' && service.reach_diagrams.trim()) {
      try {
        const parsed = JSON.parse(service.reach_diagrams);
        if (Array.isArray(parsed) && parsed.length > 0) {
          reachDiagrams = parsed;
        }
      } catch (e) {
        // Если не JSON, считаем это одной схемой
        reachDiagrams = [{ url: service.reach_diagrams, title: 'Схема вылета стрелы' }];
      }
    }
  }
  
  // Если массив пустой, но есть reach_diagram_url, используем его
  if (reachDiagrams.length === 0 && service.reach_diagram_url) {
    reachDiagrams = [{ url: service.reach_diagram_url, title: 'Схема вылета стрелы' }];
  }
  
  // Парсим цены из строки
  let priceHalfShift = '';
  let priceShift = '';
  let deliveryPerKm = service.delivery_per_km || 85;
  const priceType = service.price_type || 'shift';
  const deliveryType = service.delivery_type || 'per_km';
  const unitLabel = priceType === 'day' ? 'сутки (24 часа)' : 'смена (7+1 час)';
  const halfUnitLabel = priceType === 'day' ? 'Полсуток (12 часов)' : 'Полсмены (3+1 час)';
  
  if (price) {
    const halfShiftMatch = price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*(?:полсмен|полсуток)/i);
    if (halfShiftMatch) {
      priceHalfShift = halfShiftMatch[1].replace(/\s/g, '');
    }

    const shiftMatch = price.match(/(\d+[\s\d]*)\s*₽\s*\/\s*(?:смен|сутк)/i);
    if (shiftMatch) {
      priceShift = shiftMatch[1].replace(/\s/g, '');
    } else {
      const anyPriceMatch = price.match(/(\d+[\s\d]*)/);
      if (anyPriceMatch) {
        priceShift = anyPriceMatch[1].replace(/\s/g, '');
      }
    }
  }
  
  if (!priceShift && priceHalfShift) {
    const halfShiftNum = parseInt(priceHalfShift.replace(/\s/g, ''), 10);
    if (halfShiftNum && halfShiftNum > 0) {
      priceShift = Math.round(halfShiftNum / 0.83).toString();
      console.log(`💡 Цена за смену вычислена из полсмены: ${priceShift} (полсмена: ${priceHalfShift})`);
    }
  }
  
  if (!priceShift) {
    priceShift = '18000';
    console.warn(`⚠️ Цена за смену не найдена, используется значение по умолчанию: ${priceShift}`);
  }
  
  // Характеристики из новых полей (применяем fixEncoding)
  const heightLift = service.height_lift ? fixEncoding(service.height_lift) : '';
  const maxReach = service.max_reach ? fixEncoding(service.max_reach) : '';
  const maxCapacity = service.max_capacity ? fixEncoding(service.max_capacity) : '';
  const liftType = service.lift_type ? fixEncoding(service.lift_type) : '';
  const transportLength = service.transport_length ? fixEncoding(service.transport_length) : '';
  const transportHeight = service.transport_height ? fixEncoding(service.transport_height) : '';
  const width = service.width ? fixEncoding(service.width) : '';
  const boomRotationAngle = service.boom_rotation_angle ? fixEncoding(service.boom_rotation_angle) : '';
  const basketRotationAngle = service.basket_rotation_angle ? fixEncoding(service.basket_rotation_angle) : '';

  // Парсим custom_specs (динамические характеристики из админки)
  let customSpecs = [];
  if (service.custom_specs) {
    try {
      const parsed = typeof service.custom_specs === 'string' ? JSON.parse(service.custom_specs) : service.custom_specs;
      if (Array.isArray(parsed)) customSpecs = parsed;
    } catch(e) { /* ignore */ }
  }
  
  // Формируем breadcrumb
  const breadcrumbTitle = title.length > 30 ? title.substring(0, 30) + '...' : title;
  
  // Формируем meta description
  const metaDescription = description.length > 150 
    ? description.substring(0, 150) + '...' 
    : description || `Аренда ${title.toLowerCase()} в Санкт-Петербурге. ☎ +7 (991) 000-91-11`;
  
  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Аренда в СПб | Аренда Неба</title>
    <meta name="description" content="${metaDescription}">
    <link rel="canonical" href="https://avtovyshka-spb.ru${url}">

    <!-- Open Graph -->
    <meta property="og:type" content="product">
    <meta property="og:locale" content="ru_RU">
    <meta property="og:site_name" content="Аренда Неба">
    <meta property="og:title" content="${title} - Аренда в СПб">
    <meta property="og:description" content="${metaDescription}">
    <meta property="og:url" content="https://avtovyshka-spb.ru${url}">
    <meta property="og:image" content="https://avtovyshka-spb.ru${imageUrl}">

    <!-- JSON-LD: Product + BreadcrumbList -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": "${title}",
      "description": "${metaDescription.replace(/"/g, '\\"')}",
      "image": "https://avtovyshka-spb.ru${imageUrl}",
      "url": "https://avtovyshka-spb.ru${url}",
      "brand": { "@type": "Brand", "name": "Аренда Неба" },
      "offers": {
        "@type": "Offer",
        "priceCurrency": "RUB",
        "price": "${priceShift}",
        "availability": "https://schema.org/InStock",
        "seller": {
          "@type": "Organization",
          "name": "Аренда Неба",
          "telephone": "+7-991-000-91-11"
        }
      }
    }
    </script>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://avtovyshka-spb.ru/" },
        { "@type": "ListItem", "position": 2, "name": "Автопарк", "item": "https://avtovyshka-spb.ru/#autopark" },
        { "@type": "ListItem", "position": 3, "name": "${title}", "item": "https://avtovyshka-spb.ru${url}" }
      ]
    }
    </script>

    <link rel="stylesheet" href="../styles.css">
    <link rel="stylesheet" href="../equipment-page.css">
    
    <!-- Yandex.Metrika counter -->
    <script type="text/javascript">
       (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
       m[i].l=1*new Date();
       for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
       k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
       (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

       ym(40444210, "init", {
            clickmap:true,
            trackLinks:true,
            accurateTrackBounce:true,
            webvisor:true
       });
    </script>
    <noscript><div><img src="https://mc.yandex.ru/watch/40444210" style="position:absolute; left:-9999px;" alt="" /></div></noscript>
    <!-- /Yandex.Metrika counter -->
    
    <!-- calltouch -->
    <script>
    (function(w,d,n,c){w.CalltouchDataObject=n;w[n]=function(){w[n]["callbacks"].push(arguments)};if(!w[n]["callbacks"]){w[n]["callbacks"]=[]}w[n]["loaded"]=false;if(typeof c!=="object"){c=[c]}w[n]["counters"]=c;for(var i=0;i<c.length;i+=1){p(c[i])}function p(cId){var a=d.getElementsByTagName("script")[0],s=d.createElement("script"),i=function(){a.parentNode.insertBefore(s,a)},m=typeof Array.prototype.find === 'function',n=m?"init-min.js":"init.js";s.async=true;s.src="https://mod.calltouch.ru/"+n+"?id="+cId;if(w.opera=="[object Opera]"){d.addEventListener("DOMContentLoaded",i,false)}else{i()}}})(window,document,"ct","k2vlrfd9");
    </script>
    <!-- calltouch -->
</head>
<body class="equipment-page">
    <!-- Progress Bar -->
    <div class="scroll-progress-wrapper">
        <div class="scroll-progress" id="scrollProgress"></div>
    </div>

    <!-- Navigation -->
    <header class="site-header" id="siteHeader">
        <div class="container header-inner">
            <a href="/" class="logo">Аренда Неба</a>
            <div class="header-right">
                <nav class="main-nav">
                    <a href="/#calculator">Калькулятор</a>
                    <a href="/#autopark">Наш автопарк</a>
                    <a href="/#reviews">Отзывы</a>
                    <a href="/#contacts">Контакты</a>
                </nav>
                <div class="header-contacts-mini">
                    <a href="tel:+79910009111" class="header-messenger phone" data-ct="phone" aria-label="Позвонить">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                            <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                        </svg>
                        <span style="display:none;">+7 (991) 000-91-11</span>
                    </a>
                    <div class="header-messengers-mini">
                        <a href="https://t.me/+79910009111" target="_blank" class="header-messenger tg" title="Telegram">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M20.5 4.4 4.3 10.8c-.8.3-.8 1.1-.1 1.3l3.5 1.1 1.4 4.5c.1.4.5.6.9.3l2-1.6 3.3 2.4c.6.4 1.1.2 1.3-.6l2.2-12c.2-.8-.2-1.2-.8-1zM9.3 13.2l7.2-4.7c.2-.1.4 0 .2.2l-5.9 5.4-.2 2.6-1.3-3.5z" />
                            </svg>
                        </a>
                        <a href="https://max.ru/u/f9LHodD0cOJKO3OAwk4K6TkpnuLAN43TGG_qBrsn3ftm9j4pV7icx5M-tDw" class="header-messenger max" target="_blank" rel="noopener" aria-label="MAX">
                            <img src="../images/max-logo.svg" alt="" class="header-max-logo-img" width="40" height="40" decoding="async" />
                        </a>
                    </div>
                </div>
                <button class="mobile-menu-btn" id="mobile-menu-btn" aria-label="Меню" type="button">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
            </div>
        </div>
        <nav class="mobile-nav" id="mobile-nav">
            <a href="/">Главная</a>
            <a href="/#calculator">Калькулятор</a>
            <a href="/#autopark">Наш автопарк</a>
            <a href="/#reviews">Отзывы</a>
            <a href="/#quick-contact-form">Оставить заявку</a>
            <a href="/#contacts">Контакты</a>
        </nav>
    </header>

    <!-- Breadcrumbs -->
    <div class="breadcrumbs">
        <div class="container">
            <a href="/">Главная</a>
            <span>/</span>
            <a href="/#services">Автопарк</a>
            <span>/</span>
            <span>${breadcrumbTitle}</span>
        </div>
    </div>

    <!-- Equipment Detail -->
    <section class="equipment-detail">
        <div class="container">
            <div class="equipment-header">
                <h1>${title}</h1>
                <div class="equipment-price">
                    <span class="price-label">Цена аренды:</span>
                    <span class="price-value">${price || 'По запросу'} <span class="price-vat">без НДС</span></span>
                </div>
            </div>

            <div class="equipment-content">
                <div class="equipment-left">
                    <div class="equipment-gallery">
                        <div class="main-image">
                            <img src="${imageUrl.startsWith('http') ? imageUrl : (imageUrl.startsWith('/') ? '..' + imageUrl : '../' + imageUrl)}" alt="${title}" id="mainEquipmentImage" style="border-radius: 12px; overflow: hidden;">
                        </div>
                        <div class="gallery-thumbnails" id="galleryThumbnails">
                            <img src="${imageUrl.startsWith('http') ? imageUrl : (imageUrl.startsWith('/') ? '..' + imageUrl : '../' + imageUrl)}" alt="Вид 1" class="active">
                        </div>
                    </div>
                </div>

                <div class="equipment-info">
                    <div class="equipment-info-wrapper">
                        <div class="equipment-tabs">
                            <button class="equipment-tab active" data-tab="specs">
                                <span class="equipment-tab-icon">🔧</span>
                                <span>Технические характеристики</span>
                            </button>
                            <button class="equipment-tab" data-tab="description">
                                <span class="equipment-tab-icon">📖</span>
                                <span>Подробное описание</span>
                            </button>
                        </div>

                        <div class="equipment-tab-content active" id="tab-specs">
                            <div class="info-section" style="padding: 0; margin: 0;">
                                <div class="specs-grid">
                                    ${(() => {
                                      if (customSpecs.length > 0) {
                                        return customSpecs.filter(s => s && s.label && s.value).map(s => `<div class="spec-item">
                                            <div class="spec-icon">${s.icon || '📏'}</div>
                                            <div class="spec-info">
                                                <div class="spec-label">${s.label}</div>
                                                <div class="spec-value">${s.value}</div>
                                            </div>
                                        </div>`).join('\n                                    ');
                                      }
                                      let html = '';
                                      const legacySpecs = [
                                        { icon: '📏', label: 'Высота подъема', value: heightLift },
                                        { icon: '📐', label: 'Вылет стрелы', value: maxReach },
                                        { icon: '⚖️', label: 'Грузоподъемность корзины', value: maxCapacity },
                                        { icon: '📦', label: 'Размер корзины (платформы)', value: service.basket_size ? fixEncoding(service.basket_size) : '' },
                                        { icon: '🚗', label: 'Тип', value: liftType },
                                        { icon: '🔋', label: 'Напряжение', value: service.voltage ? fixEncoding(service.voltage) : '' },
                                        { icon: '🎯', label: 'Маневренность', value: service.maneuverability ? fixEncoding(service.maneuverability) : '' },
                                        { icon: '⏱️', label: 'Время установки', value: service.setup_time ? fixEncoding(service.setup_time) : '' },
                                        { icon: '📏', label: 'Длина в транспортном положении', value: transportLength },
                                        { icon: '📏', label: 'Высота в транспортном положении', value: transportHeight },
                                        { icon: '📏', label: 'Ширина', value: width },
                                        { icon: '🔄', label: 'Угол поворота стрелы', value: boomRotationAngle },
                                        { icon: '🔄', label: 'Угол поворота корзины', value: basketRotationAngle }
                                      ];
                                      legacySpecs.forEach(s => {
                                        if (s.value) html += `<div class="spec-item"><div class="spec-icon">${s.icon}</div><div class="spec-info"><div class="spec-label">${s.label}</div><div class="spec-value">${s.value}</div></div></div>\n`;
                                      });
                                      return html;
                                    })()}
                                </div>
                                <div class="reach-diagrams-container" id="reachDiagramsContainer" style="display: ${reachDiagrams.length > 0 ? 'block' : 'none'};">
                                    <h3 class="reach-diagrams-title">Схемы вылета стрелы</h3>
                                    <div class="reach-diagrams-grid" id="reachDiagramsGrid"></div>
                                </div>
                                <script>
                                // Данные схем вылета стрелы для JavaScript
                                window.serviceReachDiagrams = ${JSON.stringify(reachDiagrams)};
                                window.serviceReachDiagramUrl = ${JSON.stringify(service.reach_diagram_url || '')};
                                window.servicePriceType = ${JSON.stringify(priceType)};
                                window.serviceDeliveryType = ${JSON.stringify(deliveryType)};
                                </script>
                            </div>
                        </div>

                        <div class="equipment-tab-content" id="tab-description">
                            <div class="info-section" style="padding: 0; margin: 0;">
                                <h2 style="margin-top: 0; margin-bottom: 16px;">Описание</h2>
                                <div class="equipment-description">${description || '<p>Описание техники</p>'}</div>
                            </div>
                        </div>
                    </div>

                    <div class="info-section">
                        <h2>Стоимость аренды</h2>
                        <div class="pricing-table">
                            ${priceHalfShift ? `<div class="pricing-row">
                                <span>${halfUnitLabel}</span>
                                <span class="pricing-value">${parseInt(priceHalfShift).toLocaleString('ru-RU')} ₽ <span class="price-vat">без НДС</span></span>
                            </div>` : ''}
                            ${priceShift ? `<div class="pricing-row">
                                <span>1 ${unitLabel}</span>
                                <span class="pricing-value">${parseInt(priceShift).toLocaleString('ru-RU')} ₽ <span class="price-vat">без НДС</span></span>
                            </div>` : ''}
                            <div class="pricing-row">
                                <span>${deliveryType === 'negotiable' ? 'Подача техники' : 'Подача техники (за КАД)'}</span>
                                <span class="pricing-value">${deliveryType === 'negotiable' ? 'По договорённости' : `${deliveryPerKm} ₽/км × 2 (в каждую сторону)`}</span>
                            </div>
                        </div>
                        ${priceHalfShift ? `<p class="pricing-note">* ${halfUnitLabel} согласовывается отдельно по началу времени работы</p>` : ''}
                    </div>
                </div>

                <!-- Мини-калькулятор для конкретной техники с формой заказа -->
                <div class="equipment-calculator" id="equipmentCalculator">
                    <div class="equipment-calculator-header">
                        <h3>Рассчитать стоимость аренды</h3>
                        <p>Укажите параметры для расчета стоимости</p>
                    </div>
                    <form class="equipment-calculator-form" id="equipmentCalculatorForm">
                        <input type="hidden" name="equipment" value="${title}">
                        <label class="calc-field">
                            <span class="calc-field-label">${priceType === 'day' ? 'Количество суток' : 'Количество смен'}</span>
                            <select id="equip-calc-shifts" name="duration" required>
                                ${priceHalfShift ? `<option value="0.5">${priceType === 'day' ? 'Полсуток' : 'Полсмены'}</option>` : ''}
                                <option value="1" selected>1 ${priceType === 'day' ? 'сутки' : 'смена'}</option>
                                <option value="2">2 ${priceType === 'day' ? 'суток' : 'смены'}</option>
                                <option value="3">3 ${priceType === 'day' ? 'суток' : 'смены'}</option>
                                <option value="more">${priceType === 'day' ? 'Более 3 суток' : 'Более 3 смен'}</option>
                            </select>
                        </label>
                        <input type="number" id="equip-calc-shifts-custom" min="4" step="1" value="4" placeholder="${priceType === 'day' ? 'Введите количество суток' : 'Введите количество смен'}" style="display: none; margin-top: 8px; padding: 14px 16px; font-size: 15px; font-family: inherit; color: var(--text-dark); background: var(--bg-light); border: 1px solid var(--border); border-radius: 10px; transition: all 0.2s ease; width: 100%; box-sizing: border-box;">
                        <div class="calc-result" id="equipmentCalcResult">
                            <p class="calc-result-text">Загрузка...</p>
                        </div>
                        <p class="calc-note">Цена примерная и не является публичной офертой. Позвоните нам для точного расчета.</p>
                        
                        <!-- Форма заказа -->
                        <div class="calc-order-form" id="calcOrderForm" style="margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border);">
                            <h4 style="margin-bottom: 15px; font-size: 18px; font-weight: 600;">Оформить заказ</h4>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <input type="text" name="name" placeholder="Ваше имя *" required style="width: 100%; padding: 14px 16px; font-size: 15px; font-family: inherit; color: var(--text-dark); background: var(--bg-light); border: 1px solid var(--border); border-radius: 10px; transition: all 0.2s ease;">
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <input type="tel" name="phone" placeholder="Телефон *" required style="width: 100%; padding: 14px 16px; font-size: 15px; font-family: inherit; color: var(--text-dark); background: var(--bg-light); border: 1px solid var(--border); border-radius: 10px; transition: all 0.2s ease;">
                            </div>
                            <div class="form-group" style="margin-bottom: 15px;">
                                <input type="date" name="date" placeholder="Дата аренды" style="width: 100%; padding: 14px 16px; font-size: 15px; font-family: inherit; color: var(--text-dark); background: var(--bg-light); border: 1px solid var(--border); border-radius: 10px; transition: all 0.2s ease;">
                            </div>
                            <div class="form-group" style="margin-bottom: 20px;">
                                <textarea name="message" placeholder="Комментарий к заказу" rows="3" style="width: 100%; padding: 14px 16px; font-size: 15px; font-family: inherit; color: var(--text-dark); background: var(--bg-light); border: 1px solid var(--border); border-radius: 10px; transition: all 0.2s ease; resize: vertical;"></textarea>
                            </div>
                            <div class="file-upload-wrapper">
                                <input type="file" name="attachment" id="eq-form-attachment" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" style="display:none">
                                <label for="eq-form-attachment" class="file-upload-btn">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>
                                    <span class="file-upload-label">Прикрепить реквизиты</span>
                                </label>
                                <span class="file-name-display" id="eq-file-name-display"></span>
                            </div>
                            <label class="privacy-checkbox">
                                <input type="checkbox" name="privacy_agreed" id="privacy-checkbox" required>
                                <span>Нажимая кнопку, вы соглашаетесь на <a href="/privacy-policy.html" target="_blank">обработку персональных данных</a></span>
                            </label>
                            <button type="submit" class="btn btn-primary" style="width: 100%;">
                                <span>Отправить заявку</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </section>

    <!-- Payment Methods -->
    <section class="payment-methods-equip">
        <div class="container payment-methods-header">
            <h2 class="payment-methods-title">Форма оплаты</h2>
            <p class="payment-methods-subtitle">Выберите удобный способ расчёта.</p>
        </div>
        <div class="container">
            <div class="payment-methods-grid">
                <div class="payment-method-item">
                    <div class="payment-method-icon pm-icon--vat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    </div>
                    <span>Оплата с НДС</span>
                </div>
                <div class="payment-method-item">
                    <div class="payment-method-icon pm-icon--no-vat">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
                    </div>
                    <span>Оплата без НДС</span>
                </div>
                <div class="payment-method-item">
                    <div class="payment-method-icon pm-icon--transfer">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    </div>
                    <span>Перевод на карту банка</span>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <div class="logo">
                        <a href="/" class="logo-text" style="font-size: 20px; font-weight: 700; color: rgba(255, 255, 255, 0.9); text-decoration: none;">Аренда Неба</a>
                    </div>
                    <p>Аренда спецтехники в Санкт-Петербурге и Ленинградской области</p>
                </div>
                <div class="footer-section">
                    <h3>Контакты</h3>
                    <p>Телефон: <a href="tel:+79910009111" data-ct="phone">+7 (991) 000-91-11</a></p>
                    <p>Email: arendaneba@mail.ru</p>
                    <p>Адрес: Санкт-Петербург, улица Беринга 27 корпус 6</p>
                </div>
                <div class="footer-section">
                    <h3>Режим работы</h3>
                    <p>Круглосуточно, без выходных</p>
                    <div style="margin-top: 15px;">
                        <a href="https://max.ru/u/f9LHodD0cOJKO3OAwk4K6TkpnuLAN43TGG_qBrsn3ftm9j4pV7icx5M-tDw" target="_blank" rel="noopener" style="display: inline-block; margin-right: 8px; padding: 8px 14px; background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); color: white; text-decoration: none; border-radius: 5px; font-size: 14px;" aria-label="MAX">MAX</a>
                        <a href="https://t.me/+79910009111" target="_blank" rel="noopener" style="display: inline-block; margin-right: 8px; padding: 8px 14px; background: #0088cc; color: white; text-decoration: none; border-radius: 5px; font-size: 14px;" aria-label="Telegram">Telegram</a>
                        <a href="https://wa.me/79910009111" target="_blank" rel="noopener" style="display: inline-block; padding: 8px 14px; background: #25D366; color: white; text-decoration: none; border-radius: 5px; font-size: 14px;" aria-label="WhatsApp">WhatsApp</a>
                    </div>
                </div>
            </div>
            <div style="text-align: center; padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.1);">
                <a href="/privacy-policy.html" style="color: rgba(255,255,255,0.5); font-size: 13px; text-decoration: none;">Политика конфиденциальности</a>
            </div>
            <div class="footer-bottom" style="position: relative;">
                <p>2016-2025 © ООО «Аренда Неба»</p>
                <!-- Скрытая ссылка на админ-панель - кликните по копирайту -->
                <a href="/admin.html" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; z-index: 10;" aria-label="Админ-панель"></a>
            </div>
        </div>
    </footer>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/studio-freight/lenis@1.0.19/bundled/lenis.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>
    <script src="https://cdn.jsdelivr.net/npm/flatpickr/dist/l10n/ru.js"></script>
    <script src="../equipment-page.js"></script>
    <script src="../cookie-consent.js" defer></script>
    
    <!-- calltouch -->
    <script>
    (function(w,d,n,c){w.CalltouchDataObject=n;w[n]=function(){w[n]["callbacks"].push(arguments)};if(!w[n]["callbacks"]){w[n]["callbacks"]=[]}w[n]["loaded"]=false;if(typeof c!=="object"){c=[c]}w[n]["counters"]=c;for(var i=0;i<c.length;i+=1){p(c[i])}function p(cId){var a=d.getElementsByTagName("script")[0],s=d.createElement("script"),i=function(){a.parentNode.insertBefore(s,a)},m=typeof Array.prototype.find === 'function',n=m?"init-min.js":"init.js";s.async=true;s.src="https://mod.calltouch.ru/"+n+"?id="+cId;if(w.opera=="[object Opera]"){d.addEventListener("DOMContentLoaded",i,false)}else{i()}}})(window,document,"ct","k2vlrfd9");
    </script>
    <!-- calltouch -->
</body>
</html>`;
}

// Function to create equipment page file
function createEquipmentPage(service) {
  try {
    console.log('🔧 createEquipmentPage called with service:', {
      title: service.title,
      url: service.url,
      hasImage: !!service.image_url
    });
    
    // Генерируем URL если его нет
    let serviceUrl = service.url;
    if (!serviceUrl || serviceUrl.trim() === '') {
      serviceUrl = generateUrlFromTitle(service.title);
      console.log('📝 Generated URL from title:', serviceUrl);
    }
    
    // Убираем начальный слэш и /avtopark/ или /equipment/ если есть
    let filename = serviceUrl.replace(/^\/+/, '').replace(/^(avtopark|equipment)\//, '');
    if (!filename.endsWith('.html')) {
      filename += '.html';
    }

    console.log('📄 Final filename:', filename);

    // Путь к файлу
    const avtoparkDir = path.join(__dirname, 'public', 'avtopark');
    const filePath = path.join(avtoparkDir, filename);

    console.log('📂 __dirname:', __dirname);
    console.log('📂 Avtopark directory:', avtoparkDir);
    console.log('📂 Full file path:', filePath);
    console.log('📂 File path exists check:', fs.existsSync(avtoparkDir));

    // Создаем директорию если её нет
    if (!fs.existsSync(avtoparkDir)) {
      console.log('📁 Creating avtopark directory...');
      fs.mkdirSync(avtoparkDir, { recursive: true });
      console.log('✅ Avtopark directory created');
    } else {
      console.log('✅ Avtopark directory exists');
    }
    
    // Генерируем HTML
    console.log('🔄 Generating HTML...');
    const html = generateEquipmentPageHTML(service);
    console.log('✅ HTML generated, length:', html.length);
    
    // Записываем файл (всегда перезаписываем, даже если файл существует)
    console.log('💾 Writing/updating file with new template...');
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`✅ Equipment page created/updated successfully with new template: ${filename}`);
    console.log(`   Full path: ${filePath}`);
    
    // Проверяем, что файл действительно создан
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`   File size: ${stats.size} bytes`);
    } else {
      console.error('❌ File was not created!');
      return null;
    }
    
    // Возвращаем URL для сохранения в базу
    const returnUrl = '/avtopark/' + filename;
    console.log('🔗 Returning URL:', returnUrl);
    return returnUrl;
  } catch (error) {
    console.error('❌ Error creating equipment page:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    return null;
  }
}

// Database connection
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error connecting to database:', err);
  } else {
    console.log('✅ Connected to database');
    
    // КРИТИЧЕСКИ ВАЖНО: Создаем папку uploads при запуске сервера
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      console.log('📁 Папка uploads не существует, создаем...');
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Папка uploads создана');
    } else {
      console.log('☑ Папка uploads существует');
    }
    
    // Проверяем права доступа на запись
    try {
      const testFile = path.join(uploadsDir, '.test-write');
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      console.log('☑ Папка uploads доступна для записи');
    } catch (writeErr) {
      console.error('❌ ОШИБКА: Папка uploads НЕ доступна для записи!', writeErr.message);
      console.error('   Решение: chmod 755 uploads');
    }
    // Проверяем существование таблицы services перед добавлением колонок
    db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='services'", (err, tableExists) => {
      if (err) {
        console.error('Error checking services table:', err);
        return;
      }
      
      if (!tableExists) {
        console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Таблица services не существует!');
        console.error('   Запустите: node fix-services-table.js');
        return;
      }
      
      // Таблица существует - добавляем колонки
      // Add url column to services table if it doesn't exist
      db.run(`ALTER TABLE services ADD COLUMN url TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding url column:', err);
        }
      });
      
      // Add reach_diagram_url column to services table if it doesn't exist
      db.run(`ALTER TABLE services ADD COLUMN reach_diagram_url TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding reach_diagram_url column:', err);
        }
      });
      
      // Add reach_diagrams column to services table if it doesn't exist (JSON array of diagrams with url and title)
      db.run(`ALTER TABLE services ADD COLUMN reach_diagrams TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding reach_diagrams column:', err);
        }
      });
      
      // Add images column to services table if it doesn't exist (JSON array of image URLs)
      db.run(`ALTER TABLE services ADD COLUMN images TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding images column:', err);
        }
      });
      
      // Add popular card settings
      db.run(`ALTER TABLE services ADD COLUMN is_popular INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding is_popular column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN popular_order INTEGER DEFAULT 0`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding popular_order column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN card_bullets TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding card_bullets column:', err);
        }
      });
      
      // Add equipment specifications columns
      db.run(`ALTER TABLE services ADD COLUMN height_lift TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding height_lift column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN max_reach TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding max_reach column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN max_capacity TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding max_capacity column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN lift_type TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding lift_type column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN transport_length TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding transport_length column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN transport_height TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding transport_height column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN width TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding width column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN boom_rotation_angle TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding boom_rotation_angle column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN basket_rotation_angle TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding basket_rotation_angle column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN basket_size TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding basket_size column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN voltage TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding voltage column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN maneuverability TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding maneuverability column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN setup_time TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding setup_time column:', err);
        }
      });
      
      db.run(`ALTER TABLE services ADD COLUMN delivery_per_km INTEGER DEFAULT 85`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding delivery_per_km column:', err);
        }
      });

      db.run(`ALTER TABLE services ADD COLUMN price_type TEXT DEFAULT 'shift'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {}
      });
      db.run(`ALTER TABLE services ADD COLUMN delivery_type TEXT DEFAULT 'per_km'`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {}
      });

      db.run(`ALTER TABLE services ADD COLUMN custom_specs TEXT DEFAULT '[]'`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding custom_specs column:', err);
        }
      });
      db.run(`ALTER TABLE services ADD COLUMN short_description TEXT DEFAULT ''`, (err) => {
        if (err && !err.message.includes('duplicate column name') && !err.message.includes('no such table')) {
          console.error('Error adding short_description column:', err);
        }
      });
    });
    
    // Create homepage table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS homepage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      subtitle TEXT,
      video_url TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Error creating homepage table:', err);
      } else {
        // Insert default values if table is empty
        db.get('SELECT COUNT(*) as count FROM homepage', [], (err, row) => {
          if (!err && row && row.count === 0) {
            db.run('INSERT INTO homepage (title, subtitle, video_url) VALUES (?, ?, ?)', 
              ['Поднимем ваши задачи на нужную высоту', 'Современный автопарк, опытные операторы и быстрый выезд на объект.', 'video.mp4'],
              (err) => {
                if (err) {
                  console.error('Error inserting default homepage data:', err);
                } else {
                  console.log('✅ Default homepage data inserted');
                }
              });
          }
        });
      }
    });
  }
});

// Добавляем колонку attachment в requests если её нет
db.run("ALTER TABLE requests ADD COLUMN attachment TEXT", () => {});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Explicit route for equipment pages (MUST be BEFORE static files)
// Используем (*) для захвата всего пути, включая специальные символы
// Редирект /equipment/* → /avtopark/* (для старых ссылок)
app.get('/equipment/:filename(*)', (req, res) => {
  res.redirect(301, '/avtopark/' + req.params.filename);
});

app.get('/avtopark/:filename(*)', (req, res) => {
  try {
    // Декодируем имя файла из URL (на случай кириллицы в URL)
    let filename = req.params.filename ? decodeURIComponent(req.params.filename) : '';

    console.log(`\n🔍 [AVTOPARK ROUTE] Request received`);
    console.log(`   Raw param: ${req.params.filename}`);
    console.log(`   Decoded: ${filename}`);
    console.log(`   Full URL: ${req.url}`);
    console.log(`   Method: ${req.method}`);
    
    // Security: only allow HTML files
    if (!filename || !filename.endsWith('.html')) {
      console.error(`❌ Invalid filename: ${filename}`);
      return res.status(400).send('Invalid file type');
    }
  
  // Маппинг кириллических имен на латинские имена файлов
  const filenameMap = {
    'автовышка-13-метров.html': 'avtovyshka-13m.html',
    'автовышка-15-метров.html': 'avtovyshka-15m.html',
    'автовышка-16-метров.html': 'avtovyshka-16m.html',
    'автовышка-18-метров.html': 'avtovyshka-18m.html',
    'автовышка-21-метр.html': 'avtovyshka-21m.html',
    'автовышка-25-метров.html': 'avtovyshka-25m.html',
    'автовышка-29-метров.html': 'avtovyshka-29m.html',
    'автовышка-45-метров.html': 'avtovyshka-45m.html',
    'автовышка-вездеход-30-метров.html': 'avtovyshka-vezdehod-35m.html',
    'автовышка-вездеход-35-метров.html': 'avtovyshka-vezdehod-35m.html',
    'самоходная-автовышка.html': 'samohodnaya-avtovyshka.html',
    'телескопический-погрузчик.html': 'teleskopicheskiy-pogruzchik.html'
  };
  
  // Если имя файла в кириллице, заменяем на латинское
  if (filenameMap[filename]) {
    console.log(`   🔄 Mapping: ${filename} -> ${filenameMap[filename]}`);
    filename = filenameMap[filename];
  }
  
  // Используем абсолютный путь
  const filePath = path.resolve(__dirname, 'public', 'avtopark', filename);
  
  console.log(`📂 Looking for file at: ${filePath}`);
  
  // Проверяем существование файла
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Equipment page not found: ${filename}`);
    console.error(`   Full path: ${filePath}`);
    
    // Показываем список доступных файлов для отладки
    const avtoparkDir2 = path.join(__dirname, 'public', 'avtopark');
    if (fs.existsSync(avtoparkDir2)) {
      const files = fs.readdirSync(avtoparkDir2).filter(f => f.endsWith('.html'));
      console.log(`   📋 Available files: ${files.join(', ')}`);
    }
    
    return res.status(404).send(`Page not found: ${filename}`);
  }
  
    console.log(`✅ File found, serving: ${filename}`);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`❌ Error serving ${filename}:`, err.message);
        if (!res.headersSent) {
          res.status(500).send('Error loading page');
        }
      } else {
        console.log(`✅ Successfully served: ${filename}\n`);
      }
    });
  } catch (error) {
    console.error(`❌ Error in equipment route:`, error);
    if (!res.headersSent) {
      res.status(500).send('Internal server error');
    }
  }
});

// Serve static files from public directory (must be after specific routes)
// ============================================
// 301 редиректы со старого сайта (avtovyshka-spb.ru) — только несовпадающие URL
// ============================================
const oldToNewRedirects = {
  '/avtopark/avtovyshka-17m/': '/avtopark/avtovyshka-18m.html',       // 17м → 18м (ближайший)
  '/avtopark/avtovyshka-24m/': '/avtopark/avtovyshka-25m.html',       // 24м → 25м (ближайший)
  '/avtopark/avtovyshka-50m/': '/avtopark/avtovyshka-45m.html',       // 50м → 45м (ближайший)
  '/avtopark/avtokran-25t-ivanovets/': '/#autopark',
  '/avtopark/avtokran-25t-kobelco/':   '/#autopark',
};

Object.entries(oldToNewRedirects).forEach(([oldPath, newPath]) => {
  app.get(oldPath, (req, res) => res.redirect(301, newPath));
  if (oldPath.endsWith('/')) {
    app.get(oldPath.slice(0, -1), (req, res) => res.redirect(301, newPath));
  }
});

// Старые URL /avtopark/avtovyshka-XXm/ (со слешем) → /avtopark/avtovyshka-XXm.html
// Это нужно чтобы старые URL вида /avtopark/avtovyshka-13m/ (папка) вели на .html файл
app.get('/avtopark/:slug/', (req, res, next) => {
  const slug = req.params.slug;
  if (slug && !slug.includes('.')) {
    return res.redirect(301, `/avtopark/${slug}.html`);
  }
  next();
});

// Редирект с /index.html на /
app.get('/index.html', (req, res) => {
  res.redirect(301, '/');
});

// Динамический sitemap.xml
app.get('/sitemap.xml', (req, res) => {
  const host = 'https://avtovyshka-spb.ru';
  const today = new Date().toISOString().split('T')[0];

  db.all("SELECT url, updated_at FROM services WHERE active=1 ORDER BY order_num", (err, rows) => {
    const staticPages = [
      { loc: '/', priority: '1.0', changefreq: 'weekly' },
      { loc: '/privacy-policy.html', priority: '0.3', changefreq: 'yearly' },
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    staticPages.forEach(p => {
      xml += `  <url>\n    <loc>${host}${p.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${p.changefreq}</changefreq>\n    <priority>${p.priority}</priority>\n  </url>\n`;
    });

    if (!err && rows) {
      rows.forEach(r => {
        const lastmod = r.updated_at ? r.updated_at.split(' ')[0] : today;
        xml += `  <url>\n    <loc>${host}${r.url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      });
    }

    xml += '</urlset>';
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  });
});

// Явный маршрут для корневого пути
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use(express.static('public'));

// Serve uploads with no-cache headers to prevent browser caching
app.use('/uploads', (req, res, next) => {
  // Set headers to prevent caching of uploaded images
  res.set({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  next();
}, express.static('uploads'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Получаем serviceId, serviceTitle и fileType из query параметров
    const serviceId = req.query.serviceId || 'unknown';
    const serviceTitle = req.query.serviceTitle || '';
    const fileType = slugifyAsciiFilename(String(req.query.fileType || 'image'), 20) || 'image';
    
    // Только латиница в пути (транслитерация с русского)
    const slug = serviceTitle ? slugifyAsciiFilename(serviceTitle, 50) : '';
    
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    
    let filename;
    if (slug) {
      filename = `${slug}-${fileType}-${timestamp}${ext}`;
    } else {
      filename = `service-${serviceId}-${fileType}-${timestamp}${ext}`;
    }
    
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Multer для вложений к заявкам (реквизиты)
const attachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'attachments');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `attachment-${timestamp}${ext}`);
  }
});
const attachmentUpload = multer({
  storage: attachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExt = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
    if (allowedExt.test(path.extname(file.originalname))) cb(null, true);
    else cb(new Error('Недопустимый тип файла'));
  }
});

// Function to fix image URL - removes localhost and converts .png to .webp
function fixImageUrl(url) {
  if (!url || typeof url !== 'string') {
    console.warn('⚠️ fixImageUrl: пустой или неверный URL:', url);
    return url || '';
  }
  
  let fixed = url;
  
  // Remove localhost URLs
  fixed = fixed.replace(/http:\/\/localhost:\d+/g, '');
  fixed = fixed.replace(/https:\/\/localhost:\d+/g, '');
  
  // Remove any domain (keep only path)
  fixed = fixed.replace(/https?:\/\/[^\/]+/g, '');
  
  // Только статика в /images/: легаси-имена .png → .webp. Файлы в /uploads/ не трогаем —
  // в админке часто лежит реальный .png, подмена на .webp даёт 404 и «битую» картинку.
  if (fixed.startsWith('/images/') && fixed.endsWith('.png')) {
    fixed = fixed.replace('.png', '.webp');
  }
  
  // Логируем изменения для диагностики
  if (fixed !== url) {
    console.log('🔧 fixImageUrl:', url, '->', fixed);
  }
  
  return fixed;
}

// Function to fix JSON array of image URLs
function fixImageUrlsArray(jsonStr) {
  if (!jsonStr) return jsonStr;
  
  try {
    let arr = JSON.parse(jsonStr);
    if (!Array.isArray(arr)) return jsonStr;
    
    arr = arr.map(item => {
      if (typeof item === 'string') {
        return fixImageUrl(item);
      } else if (typeof item === 'object' && item.url) {
        return { ...item, url: fixImageUrl(item.url) };
      }
      return item;
    });
    
    return JSON.stringify(arr);
  } catch (e) {
    return jsonStr;
  }
}

// Function to fix encoding issues
function fixEncoding(text) {
  if (!text || typeof text !== 'string') return text;

  // Quick check: if text is clean UTF-8 (normal Russian/Latin chars + standard punctuation + HTML), skip all transformations
  if (/^[А-Яа-яЁёA-Za-z0-9\s.,;:!?()\/"'\-—–×«»₽%°+\n\r<>&;=#\t\u00a0✅]*$/.test(text)) {
    return text;
  }

  try {
    let fixed = text;

    // Универсальная функция для удаления искаженных последовательностей
    // Находит и удаляет все последовательности, которые содержат смесь кириллицы и латиницы в неправильном контексте
    const removeCorruptedSequences = (str) => {
      // Удаляем последовательности типа: РС"РС, PjPC-PC, PC"PC и т.д.
      // Паттерн: смесь P, C, Р, С с кавычками, дефисами, скобками и другими спецсимволами
      str = str.replace(/[РС]"[РС][^А-Яа-яЁё\s]*/g, '');
      str = str.replace(/P[SCj]PC[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
      str = str.replace(/\[PjPC[^\]]*\][^А-Яа-яЁё\s]*/g, '');
      
      // Удаляем искаженные последовательности после нормальных слов, НО НЕ трогаем обычные пробелы и дефисы между словами (например "Автовышка-платформа").
      // В "плохой" набор не включаем \s и \- чтобы не удалять пробелы и дефисы в названиях.
      str = str.replace(/([А-Яа-яЁёA-Za-z0-9]+)([РС"РС•РС\[\],PjPC-PC[•PB»\[\],]+)(?![А-Яа-яЁёA-Za-z0-9])/g, '$1');
      
      // Удаляем последовательности, которые начинаются с квадратных скобок и содержат искаженные символы (без удаления дефисов после скобки)
      str = str.replace(/\[[^\]]*[РСPjPC][^\]]*\][\s,•]*/g, '');
      
      // Удаляем последовательности с повторяющимися РС, PC, PjPC
      str = str.replace(/[РС]{2,}[^А-Яа-яЁё\s]*/g, '');
      str = str.replace(/P[SCj]{2,}P[SCj]*[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
      
      // Удаляем последовательности с кавычками и спецсимволами после кириллических букв Р и С (дефис не удаляем — для "Автовышка-платформа")
      str = str.replace(/[РС]"[РС][•\[\],\s]*/g, '');
      str = str.replace(/[РС]•[РС][\[\],\s]*/g, '');
      
      return str;
    };
    
    // Применяем универсальную очистку
    fixed = removeCorruptedSequences(fixed);
    
    // Проверяем, есть ли признаки неправильной кодировки (включая пробелы между символами и сложные случаи)
    const hasBadEncoding = /Р[Р-Я]/.test(fixed) || /С[Р-Я]/.test(fixed) || /РІ,Р/.test(fixed) || 
                          /Р\s+[Р-Я]/.test(fixed) || /С\s+[Р-Я]/.test(fixed) ||
                          /P[SC]P/.test(fixed) || /PC"PC/.test(fixed) || /PµPSP/.test(fixed) ||
                          /CЋСЂС‹/.test(fixed) || /PSCЂP/.test(fixed) || /CŕP»/.test(fixed) ||
                          /РС"РС/.test(fixed) || /PjPC-PC/.test(fixed);
    
    if (hasBadEncoding) {
      // Удаляем пробелы ТОЛЬКО между символами двойной кодировки (Р С -> РС), но НЕ между словами
      // Используем negative lookahead чтобы не удалять пробелы между разными словами
      fixed = fixed.replace(/([Р-Я])\s+([Р-Я])(?![а-яёА-ЯЁ])/g, '$1$2');
      fixed = fixed.replace(/([PC])\s+([PC])(?![a-zA-Z])/g, '$1$2');
      
      // Удаляем проблемные последовательности перед декодированием
      fixed = fixed.replace(/PC"PC[PC\s-\[\],•]*/g, '');
      fixed = fixed.replace(/РС"РС[•РС\-\[\],\s]*/g, '');
      fixed = fixed.replace(/\[PjPC-PC[•P\sB»\-\[\],]*/g, '');
      fixed = fixed.replace(/PjPC-PC[•P\sB»\-\[\],]*/g, '');
      fixed = fixed.replace(/PSCЂP[°PSPJPµPIP°CЏ\s]*/g, '');
      fixed = fixed.replace(/CŕP»CFCFC/g, '');
      fixed = fixed.replace(/PµPSP[°\s]*PsP[+CЂР°P+PSC,\s]*/g, '');
      fixed = fixed.replace(/PëCЃPEP°PJPµPSPSPsPiPs\s*C/g, '');
      fixed = fixed.replace(/,PµPECЃC,\s*Po/g, '');
      fixed = fixed.replace(/C,CЋСЂС‹,/g, '');
      
      // Пробуем исправить через декодирование из latin1 в utf8
      try {
        const buffer = Buffer.from(fixed, 'latin1');
        const decoded = buffer.toString('utf8');
        if (decoded && /[А-Яа-яЁё]/.test(decoded) && !/Р[Р-Я]/.test(decoded) && !/Р\s+[Р-Я]/.test(decoded) && !/P[SC]P/.test(decoded)) {
          fixed = decoded;
        }
      } catch (e) {
        // Игнорируем ошибки
      }
      
      // Если все еще есть проблемы, пробуем через win1251
      if (/Р[Р-Я]/.test(fixed) || /С[Р-Я]/.test(fixed) || /Р\s+[Р-Я]/.test(fixed) || /P[SC]P/.test(fixed)) {
        try {
          // Удаляем пробелы ТОЛЬКО между символами двойной кодировки, но НЕ между словами
          let cleaned = fixed.replace(/([Р-Я])\s+([Р-Я])(?![а-яёА-ЯЁ])/g, '$1$2');
          cleaned = cleaned.replace(/([PC])\s+([PC])(?![a-zA-Z])/g, '$1$2');
          cleaned = cleaned.replace(/PC"PC[PC\s-\[\],]*/g, '');
          cleaned = cleaned.replace(/P[SC]P[°µPSPJPIPCЏ\s]*/g, '');
          
          const utf8Bytes = Buffer.from(cleaned, 'utf8');
          const decoded = iconv.decode(utf8Bytes, 'win1251');
          if (decoded && /[А-Яа-яЁё]/.test(decoded) && !/Р[Р-Я]/.test(decoded) && !/Р\s+[Р-Я]/.test(decoded) && !/P[SC]P/.test(decoded)) {
            fixed = decoded;
          }
        } catch (e) {
          // Игнорируем ошибки
        }
      }
    }
    
    // Исправляем различные варианты неправильной кодировки "₽/смена"
    fixed = fixed.replace(/в,Ѕ\/смена/gi, '₽/смена');
    fixed = fixed.replace(/Р\/смена/gi, '₽/смена'); // Кириллическая Р вместо символа рубля
    fixed = fixed.replace(/в,Ѕ\/СЃРјРµРЅа/gi, '₽/смена');
    fixed = fixed.replace(/в,Ѕ\/СЃРјРµРЅР°/gi, '₽/смена');
    fixed = fixed.replace(/в,Ѕ\/СЃРмРµРЅ/gi, '₽/смен'); // Добавлено для "Р/смен"
    fixed = fixed.replace(/СЃРјРµРЅа/gi, 'смена');
    fixed = fixed.replace(/СЃРмРµРЅР°/gi, 'смена');
    fixed = fixed.replace(/СЃРмРµРЅ/gi, 'смен');
    
    // Исправляем только символ рубля
    fixed = fixed.replace(/в,Ѕ/gi, '₽');
    fixed = fixed.replace(/Р\//g, '₽/'); // Заменяем "Р/" на "₽/"
    
    // Исправляем другие проблемные последовательности
    fixed = fixed.replace(/РІ,Р/gi, '₽');
    fixed = fixed.replace(/РІ,РЅ/gi, '₽');
    
    // Проверяем, есть ли признаки двойной кодировки (включая пробелы)
    const hasDoubleEncoding = /Р[Р-Я]/.test(fixed) || /С[Р-Я]/.test(fixed) || /Р\s+[Р-Я]/.test(fixed);
    
    if (hasDoubleEncoding) {
      // Удаляем пробелы ТОЛЬКО между символами двойной кодировки, но НЕ между словами
      fixed = fixed.replace(/([Р-Я])\s+([Р-Я])(?![а-яёА-ЯЁ])/g, '$1$2');
      
      try {
        const utf8Bytes = Buffer.from(fixed, 'utf8');
        const decoded = iconv.decode(utf8Bytes, 'win1251');
        if (decoded && /[А-Яа-яЁё]/.test(decoded) && !/Р[Р-Я]/.test(decoded) && !/Р\s+[Р-Я]/.test(decoded)) {
          fixed = decoded;
        }
      } catch (e) {
        // Игнорируем ошибки
      }
      
      if (/Р[Р-Я]/.test(fixed)) {
        try {
          // Удаляем пробелы только между символами двойной кодировки перед декодированием
          let cleaned = fixed.replace(/([Р-Я])\s+([Р-Я])(?![а-яёА-ЯЁ])/g, '$1$2');
          const buffer = Buffer.from(cleaned, 'latin1');
          const decoded = buffer.toString('utf8');
          if (decoded && /[А-Яа-яЁё]/.test(decoded) && !/Р[Р-Я]/.test(decoded)) {
            fixed = decoded;
          }
        } catch (e2) {
          // Игнорируем ошибки
        }
      }
    }
    
    // Финальная проверка - если все еще есть искаженные символы, пробуем более агрессивное исправление
    const stillHasBadEncoding = /Р[Р-Я]/.test(fixed) || /С[Р-Я]/.test(fixed) || /Р\s+[Р-Я]/.test(fixed) || 
                                /РЎР/.test(fixed) || /PC"PC/.test(fixed) || /P[SC]P/.test(fixed) ||
                                /PµPSP/.test(fixed) || /CЋСЂС‹/.test(fixed) || /PSCЂP/.test(fixed) ||
                                /CŕP»/.test(fixed) || /PëCЃ/.test(fixed) ||
                                /РС"РС/.test(fixed) || /PjPC-PC/.test(fixed);
    
    if (stillHasBadEncoding) {
      // Удаляем пробелы ТОЛЬКО между символами двойной кодировки, но НЕ между словами
      let cleaned = fixed.replace(/([Р-Я])\s+([Р-Я])(?![а-яёА-ЯЁ])/g, '$1$2');
      cleaned = cleaned.replace(/([PC])\s+([PC])(?![a-zA-Z])/g, '$1$2');
      cleaned = cleaned.replace(/PC"PC[PC\s-\[\],•]*/g, '');
      cleaned = cleaned.replace(/РС"РС[•РС\-\[\],\s]*/g, '');
      cleaned = cleaned.replace(/\[PjPC-PC[•P\sB»\-\[\],]*/g, '');
      cleaned = cleaned.replace(/PjPC-PC[•P\sB»\-\[\],]*/g, '');
      cleaned = cleaned.replace(/PSCЂP[°PSPJPµPIP°CЏ\s]*/g, '');
      cleaned = cleaned.replace(/CŕP»CFCFC/g, '');
      cleaned = cleaned.replace(/PµPSP[°\s]*PsP[+CЂР°P+PSC,\s]*/g, '');
      cleaned = cleaned.replace(/PëCЃPEP°PJPµPSPSPsPiPs\s*C/g, '');
      cleaned = cleaned.replace(/,PµPECЃC,\s*Po/g, '');
      cleaned = cleaned.replace(/C,CЋСЂС‹,/g, '');
      cleaned = cleaned.replace(/РЎР\s*ВµР\s*В»Р\s*ВµРЎРѓ/g, 'Телескопический');
      // Удаляем искаженные последовательности после "Телескопический"
      cleaned = cleaned.replace(/Телескопический[РС"РС•РС\-\[\],\s]*/gi, 'Телескопический');
      cleaned = cleaned.replace(/Телескопический\[PjPC-PC[•P\sB»\-\[\],]*/gi, 'Телескопический');
      
      // Пробуем разные варианты декодирования
      const attempts = [
        () => {
          const buf = Buffer.from(cleaned, 'utf8');
          return iconv.decode(buf, 'win1251');
        },
        () => {
          const buf = Buffer.from(cleaned, 'latin1');
          return buf.toString('utf8');
        },
        () => {
          // Пробуем декодировать через CP1251
          return iconv.decode(Buffer.from(cleaned, 'utf8'), 'win1251');
        }
      ];
      
      for (const attempt of attempts) {
        try {
          const decoded = attempt();
          if (decoded && /[А-Яа-яЁё]/.test(decoded) && 
              !/Р[Р-Я]/.test(decoded) && !/Р\s+[Р-Я]/.test(decoded) && 
              !/PC"PC/.test(decoded) && !/P[SC]P/.test(decoded) &&
              !/PµPSP/.test(decoded) && !/CЋСЂС‹/.test(decoded)) {
            fixed = decoded;
            break;
          }
        } catch (e) {
          // Продолжаем попытки
        }
      }
      
      // Если все еще есть проблемные последовательности, заменяем их вручную или удаляем
      if (/РЎР/.test(fixed) || /PC"PC/.test(fixed) || /Р\s*ВµР/.test(fixed) || 
          /-],\s*\[PjPC/.test(fixed) || /P[SC]P/.test(fixed) || /PµPSP/.test(fixed) ||
          /CЋСЂС‹/.test(fixed) || /PSCЂP/.test(fixed) || /CŕP»/.test(fixed)) {
        // Заменяем известные искаженные последовательности для "Телескопический"
        fixed = fixed.replace(/РЎР\s*ВµР\s*В»Р\s*ВµРЎРѓ[PC"PC\s-\[\],•]*/gi, 'Телескопический');
        fixed = fixed.replace(/PC"PC[PC\s-\[\],•]*/gi, '');
        fixed = fixed.replace(/РС"РС[•РС\-\[\],\s]*/gi, '');
        fixed = fixed.replace(/\[PjPC-PC[•P\sB»\-\[\],]*/gi, '');
        fixed = fixed.replace(/PjPC-PC[•P\sB»\-\[\],]*/gi, '');
        fixed = fixed.replace(/Р\s*ВµР\s*В»Р\s*ВµРЎРѓ/gi, 'Телескопический');
        fixed = fixed.replace(/Р\s*ВµР\s*В»Р\s*ВµРЎРѓPC"PC-PC/gi, 'Телескопический');
        fixed = fixed.replace(/-],\s*\[PjPC-PC-Р\s*В»/gi, '');
        // Удаляем искаженные последовательности после "Телескопический"
        fixed = fixed.replace(/Телескопический[РС"РС•РС\-\[\],\s]*/gi, 'Телескопический');
        fixed = fixed.replace(/Телескопический\[PjPC-PC[•P\sB»\-\[\],]*/gi, 'Телескопический');
        // Удаляем сложные искаженные последовательности
        fixed = fixed.replace(/C,CЋСЂС‹,\s*PSCЂP[°PSPJPµPIP°CЏ\s]*СЂР°PjPEP°\s*Pë\s*CŕP»CFCFC/gi, '');
        fixed = fixed.replace(/€PµPSP[°\s]*PsP[+CЂР°P+PSC,\s]*PEP°\s*PëCЃPEP°PJPµPSPSPsPiPs\s*C/gi, '');
        fixed = fixed.replace(/,PµPECЃC,\s*Po/gi, '');
        // Общая замена для "Телескопический" в разных вариантах искажения
        fixed = fixed.replace(/Р[СЎ]\s*Р\s*[Вµ]\s*Р\s*[В»]\s*Р\s*[Вµ]\s*Р[ЎС]\s*Р[Сѓ][PC"PC\s-\[\],•]*/gi, 'Телескопический');
        // Удаляем остатки искаженных символов
        fixed = fixed.replace(/PC"PC-PC/gi, '');
        fixed = fixed.replace(/\[PjPC-PC-Р\s*В»/gi, '');
        fixed = fixed.replace(/P[SC]P[°µPSPJPIPCЏ\s]*/gi, '');
        fixed = fixed.replace(/PµPSP[°\s]*/gi, '');
        fixed = fixed.replace(/CЋСЂС‹/gi, '');
        fixed = fixed.replace(/PSCЂP[°PSPJPµPIP°CЏ\s]*/gi, '');
        fixed = fixed.replace(/CŕP»CFCFC/gi, '');
        fixed = fixed.replace(/PëCЃPEP°PJPµPSPSPsPiPs/gi, '');
        // Если после всех замен остались только искаженные символы без нормального текста, возвращаем пустую строку
        if (!/[А-Яа-яЁёA-Za-z0-9]/.test(fixed) && /[Р-ЯPSCµ€°]/.test(fixed)) {
          fixed = '';
        }
      }
    }
    
    // Финальная универсальная очистка - удаляем ВСЕ искаженные последовательности автоматически
    // Находим все последовательности, которые содержат смесь кириллицы (Р, С) и латиницы (P, C) с спецсимволами
    // и удаляем их, оставляя только нормальный текст
    
    // Удаляем последовательности после нормальных слов, которые содержат искаженные символы
    // НО сохраняем пробелы между нормальными словами - используем negative lookahead
    fixed = fixed.replace(/([А-Яа-яЁёA-Za-z0-9]+)([РС"РС•РС\-\[\],PjPC-PC[•PB»\-\[\],]+)(?![А-Яа-яЁёA-Za-z0-9])/g, '$1');
    
    // Удаляем все последовательности, которые содержат смесь Р/С и P/C с кавычками, дефисами, скобками
    fixed = fixed.replace(/[РС]"[РС][^А-Яа-яЁё\s]*/g, '');
    fixed = fixed.replace(/P[SCj]PC[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
    fixed = fixed.replace(/\[[^\]]*[РСPjPC][^\]]*\][\s,•\-]*/g, '');
    
    // Удаляем последовательности с повторяющимися РС, PC
    fixed = fixed.replace(/[РС]{2,}[^А-Яа-яЁё\s]*/g, '');
    fixed = fixed.replace(/P[SCj]{2,}P[SCj]*[^А-Яа-яЁёA-Za-z0-9\s]*/g, '');
    
    // Удаляем одиночные искаженные последовательности в любом месте
    fixed = fixed.replace(/[РС]"[РС]/g, '');
    fixed = fixed.replace(/PjPC-PC/g, '');
    fixed = fixed.replace(/PC"PC/g, '');
    
    // Удаляем последовательности, которые заканчиваются на спецсимволы и содержат искаженные символы
    // НЕ удаляем пробелы: иначе начнут "слипаться" нормальные слова.
    fixed = fixed.replace(/[РСPjPC][•\-\[\],]+/g, '');
    
    // Финальная проверка: если остались только искаженные символы без нормального текста, удаляем их
    const cleanedParts = fixed.split(/([А-Яа-яЁёA-Za-z0-9]+)/);
    fixed = cleanedParts.filter(part => {
      // Оставляем нормальные слова
      if (/[А-Яа-яЁёA-Za-z0-9]/.test(part)) return true;
      // Удаляем части, которые содержат только искаженные символы
      if (/[РСPjPC•"\-\[\],]/.test(part) && !/[А-Яа-яЁёA-Za-z0-9]/.test(part)) return false;
      // Оставляем пробелы и знаки препинания
      return true;
    }).join('');
    
    // Удаляем множественные пробелы, оставшиеся после очистки
    fixed = fixed.replace(/\s{2,}/g, ' ').trim();
    
    return fixed;
  } catch (error) {
    return text;
  }
}

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// ============ PUBLIC API ENDPOINTS ============

// Get all content
app.get('/api/content', (req, res) => {
  db.all('SELECT * FROM content', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Apply fixEncoding to text fields
    const fixedRows = rows.map(row => ({
      ...row,
      title: row.title ? fixEncoding(row.title) : row.title,
      subtitle: row.subtitle ? fixEncoding(row.subtitle) : row.subtitle,
      description: row.description ? fixEncoding(row.description) : row.description
    }));
    res.json(fixedRows);
  });
});

// Get content by section
app.get('/api/content/:section', (req, res) => {
  db.get('SELECT * FROM content WHERE section = ?', [req.params.section], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (row) {
      // Apply fixEncoding to text fields
      row.title = row.title ? fixEncoding(row.title) : row.title;
      row.subtitle = row.subtitle ? fixEncoding(row.subtitle) : row.subtitle;
      row.description = row.description ? fixEncoding(row.description) : row.description;
    }
    res.json(row || {});
  });
});

// Get all advantages
app.get('/api/advantages', (req, res) => {
  db.all('SELECT * FROM advantages WHERE active = 1 ORDER BY order_num', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Apply fixEncoding to text fields
    const fixedRows = rows.map(row => ({
      ...row,
      title: row.title ? fixEncoding(row.title) : row.title,
      description: row.description ? fixEncoding(row.description) : row.description
    }));
    res.json(fixedRows);
  });
});

// Get all reviews
app.get('/api/reviews', (req, res) => {
  db.all('SELECT * FROM reviews WHERE active = 1 ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('❌ Ошибка при получении отзывов:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log(`📝 API /api/reviews: найдено ${rows.length} активных отзывов`);
    // Apply fixEncoding to text fields
    const fixedRows = rows.map(row => ({
      ...row,
      client_name: row.client_name ? fixEncoding(row.client_name) : row.client_name,
      company: row.company ? fixEncoding(row.company) : row.company,
      // Поддерживаем оба поля: text и review_text
      text: row.text ? fixEncoding(row.text) : (row.review_text ? fixEncoding(row.review_text) : ''),
      review_text: row.review_text ? fixEncoding(row.review_text) : (row.text ? fixEncoding(row.text) : '')
    }));
    res.json(fixedRows);
  });
});

// Get homepage data
app.get('/api/homepage', (req, res) => {
  db.get('SELECT * FROM homepage ORDER BY id DESC LIMIT 1', [], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      // Return default values if no data exists
      res.json({
        title: 'Поднимем ваши задачи на нужную высоту',
        subtitle: 'Современный автопарк, опытные операторы и быстрый выезд на объект.',
        video_url: 'video.mp4'
      });
      return;
    }
    
    res.json({
      title: row.title || '',
      subtitle: row.subtitle || '',
      video_url: row.video_url || 'video.mp4'
    });
  });
});

// Get popular cards
app.get('/api/popular-cards', (req, res) => {
  // ВАЖНО: Сначала проверяем, есть ли вообще популярные карточки (даже неактивные)
  db.all('SELECT COUNT(*) as count FROM services WHERE is_popular = 1', [], (err, countRows) => {
    if (err) {
      console.error('❌ Ошибка при проверке популярных карточек:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    
    const totalPopular = countRows[0]?.count || 0;
    console.log(`📸 API /api/popular-cards: всего популярных карточек в базе: ${totalPopular}`);
    
    // Теперь получаем только активные
    db.all('SELECT * FROM services WHERE active = 1 AND is_popular = 1 ORDER BY popular_order', [], (err, rows) => {
      if (err) {
        console.error('❌ Ошибка при получении популярных карточек:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      
      console.log(`📸 API /api/popular-cards: найдено ${rows.length} активных популярных карточек`);
      
      if (rows.length === 0 && totalPopular > 0) {
        console.warn('⚠️  ВНИМАНИЕ: Есть популярные карточки, но они неактивны!');
        // Получаем неактивные для диагностики
        db.all('SELECT id, title, active, is_popular FROM services WHERE is_popular = 1', [], (err, allPopular) => {
          if (!err && allPopular.length > 0) {
            console.log('   Неактивные популярные карточки:');
            allPopular.forEach(row => {
              console.log(`      ID=${row.id}, title="${row.title}", active=${row.active}`);
            });
          }
        });
      }
      
      rows.forEach((row, idx) => {
        console.log(`   ${idx + 1}. ID=${row.id}, title="${row.title}", image_url="${row.image_url || '(НЕТ)'}", updated_at="${row.updated_at || '(НЕТ)'}"`);
      });
      
      // ВАЖНО: Логируем для диагностики проблем с обновлением изображений
      const service13m = rows.find(r => r.title && r.title.toLowerCase().includes('13'));
      if (service13m) {
        console.log(`🔍 ДИАГНОСТИКА вышки 13м: ID=${service13m.id}, image_url="${service13m.image_url || '(НЕТ)'}", updated_at="${service13m.updated_at || '(НЕТ)'}"`);
      }
      
      const fixedRows = rows.map(row => {
        let card_bullets = [];
        if (row.card_bullets) {
          try {
            card_bullets = JSON.parse(row.card_bullets);
          } catch (e) {
            // Если не JSON, пробуем разбить по переносам
            card_bullets = String(row.card_bullets).split(/[\n,]/).map(s => s.trim()).filter(Boolean);
          }
        }
        
        let images = [];
        if (row.images) {
          try {
            images = JSON.parse(row.images);
          } catch (e) {
            images = String(row.images).split(/[\n\r,]+/).map(url => url.trim()).filter(Boolean);
          }
        }
        if (Array.isArray(images) && images.length > 0) {
          images = images.map((item) => {
            if (typeof item === 'string') {
              const f = fixImageUrl(item);
              return f || item;
            }
            if (item && typeof item === 'object' && item.url) {
              const f = fixImageUrl(item.url);
              return { ...item, url: f || item.url };
            }
            return item;
          });
        }
        
        // ВАЖНО: Обрабатываем image_url через fixImageUrl для правильных путей
        let fixedImageUrl = null;
        if (row.image_url) {
          fixedImageUrl = fixImageUrl(row.image_url);
          console.log(`📸 Popular card ${row.id || row.title}: image_url=${row.image_url} -> fixed=${fixedImageUrl}`);
        }
        
        return {
          ...row,
          // ВАЖНО: Используем обработанный image_url (исправленный через fixImageUrl)
          image_url: fixedImageUrl || row.image_url || null,
          title: row.title != null ? row.title : '',
          description: fixEncoding(row.description),
          price: row.price ? fixEncoding(row.price) : row.price,
          card_bullets: card_bullets,
          images: images,
          // ВАЖНО: Включаем updated_at для cache busting изображений
          updated_at: row.updated_at || null
        };
      });
      
      res.json(fixedRows);
    });
  });
});

app.get('/api/services', (req, res) => {
  db.all('SELECT * FROM services WHERE active = 1 ORDER BY order_num', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Apply fixEncoding to text fields and parse images JSON
    const fixedRows = rows.map(row => {
      let images = [];
      if (row.images) {
        try {
          // Очищаем строку от возможных проблемных символов перед парсингом
          let imagesStr = String(row.images).trim();
          // Если строка не начинается с [ или {, возможно это просто список URL через запятую или перенос строки
          if (!imagesStr.startsWith('[') && !imagesStr.startsWith('{')) {
            // Пробуем разбить по переносу строки или запятой
            const urls = imagesStr.split(/[\n\r,]+/).map(url => url.trim()).filter(url => url.length > 0);
            if (urls.length > 0) {
              images = urls;
              console.log(`⚠️ Service ${row.id || row.title}: images field is not JSON, converted to array:`, urls.length, 'items');
            }
          } else {
            images = JSON.parse(imagesStr);
          }
        } catch (e) {
          console.error(`❌ Error parsing images JSON for service ${row.id || row.title}:`, e.message);
          console.error(`   Raw images value:`, row.images?.substring(0, 100));
          // Пробуем разбить по переносу строки или запятой как fallback
          try {
            const urls = String(row.images).split(/[\n\r,]+/).map(url => url.trim()).filter(url => url.length > 0);
            if (urls.length > 0) {
              images = urls;
              console.log(`   Converted to array:`, urls.length, 'items');
            }
          } catch (e2) {
            images = [];
          }
        }
      }
      let reach_diagrams = [];
      if (row.reach_diagrams) {
        try {
          const parsed = JSON.parse(row.reach_diagrams);
          if (Array.isArray(parsed) && parsed.length > 0) {
            reach_diagrams = parsed;
          }
        } catch (e) {
          console.error('Error parsing reach_diagrams JSON:', e);
          reach_diagrams = [];
        }
      }
      // Если массив пустой, но есть reach_diagram_url, используем его
      if (reach_diagrams.length === 0 && row.reach_diagram_url) {
        reach_diagrams = [{ url: row.reach_diagram_url, title: 'Схема вылета стрелы' }];
      }
      return {
        ...row,
        title: row.title != null ? row.title : '',
        description: fixEncoding(row.description),
        specifications: fixEncoding(row.specifications),
        price: row.price ? fixEncoding(row.price) : row.price,
        images: images,
        reach_diagrams: reach_diagrams,
        // Включаем все необходимые поля для калькулятора
        height_lift: row.height_lift ? fixEncoding(row.height_lift) : '',
        max_reach: row.max_reach ? fixEncoding(row.max_reach) : '',
        max_capacity: row.max_capacity ? fixEncoding(row.max_capacity) : '',
        lift_type: row.lift_type ? fixEncoding(row.lift_type) : '',
        transport_length: row.transport_length ? fixEncoding(row.transport_length) : '',
        transport_height: row.transport_height ? fixEncoding(row.transport_height) : '',
        width: row.width ? fixEncoding(row.width) : '',
        boom_rotation_angle: row.boom_rotation_angle ? fixEncoding(row.boom_rotation_angle) : '',
        basket_rotation_angle: row.basket_rotation_angle ? fixEncoding(row.basket_rotation_angle) : '',
        delivery_per_km: row.delivery_per_km || 85,
        custom_specs: (() => { try { return JSON.parse(row.custom_specs || '[]'); } catch(e) { return []; } })()
      };
    });
    res.json(fixedRows);
  });
});

// Get service by URL (поддержка путей с несколькими сегментами)
app.get('/api/services/url/*', (req, res) => {
  // Получаем весь путь после /api/services/url/
  // Используем req.url вместо req.path, так как req.path не включает query string
  let url = req.url.replace('/api/services/url', '');
  // Убираем начальный слэш, если есть
  if (url.startsWith('/')) {
    url = url.substring(1);
  }
  // Убираем query string, если есть
  if (url.includes('?')) {
    url = url.split('?')[0];
  }
  url = decodeURIComponent(url);
  
  console.log('🔍 API /api/services/url/* - Looking for service');
  console.log('   Extracted URL:', url);
  console.log('   Request URL:', req.url);
  console.log('   Request path:', req.path);
  console.log('   Request params:', req.params);
  console.log('   Request params[0]:', req.params[0]);
  
  // Пробуем найти с начальным слэшем и без
  const urlWithSlash = url.startsWith('/') ? url : '/' + url;
  const urlWithoutSlash = url.startsWith('/') ? url.substring(1) : url;
  
  // Также пробуем варианты без префикса /avtopark/ или /equipment/
  let urlWithoutPrefix = url;
  if (urlWithoutPrefix.includes('/avtopark/')) {
    urlWithoutPrefix = urlWithoutPrefix.replace('/avtopark/', '');
  } else if (urlWithoutPrefix.includes('avtopark/')) {
    urlWithoutPrefix = urlWithoutPrefix.replace('avtopark/', '');
  } else if (urlWithoutPrefix.includes('/equipment/')) {
    urlWithoutPrefix = urlWithoutPrefix.replace('/equipment/', '');
  } else if (urlWithoutPrefix.includes('equipment/')) {
    urlWithoutPrefix = urlWithoutPrefix.replace('equipment/', '');
  }
  const urlWithoutPrefixWithSlash = '/' + urlWithoutPrefix;
  
  // Список всех вариантов для поиска
  const searchUrls = [
    urlWithSlash,
    urlWithoutSlash,
    urlWithoutPrefix,
    urlWithoutPrefixWithSlash
  ].filter((u, index, self) => self.indexOf(u) === index); // Убираем дубликаты
  
  console.log('   Trying URLs:', searchUrls);
  
  // Также пробуем найти все возможные варианты
  db.all('SELECT id, title, url FROM services WHERE active = 1 LIMIT 20', (err, allRows) => {
    if (!err && allRows) {
      console.log('   Available URLs in database:');
      allRows.forEach(r => console.log('     -', r.url));
    }
  });
  
  // Пробуем найти по точному совпадению
  const placeholders = searchUrls.map(() => '?').join(',');
  db.get(`SELECT * FROM services WHERE url IN (${placeholders}) AND active = 1`, searchUrls, (err, row) => {
    if (err) {
      console.error('❌ Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      // Если не нашли по точному совпадению, пробуем найти по части URL (имя файла)
      const filename = url.split('/').pop() || url; // Берем последнюю часть пути
      console.warn('⚠️ Service not found for exact URL match');
      console.warn('   Tried:', searchUrls);
      console.warn('   Trying to find by filename:', filename);
      
      db.get('SELECT * FROM services WHERE (url LIKE ? OR url LIKE ? OR url LIKE ?) AND active = 1', 
        [`%${filename}`, `/${filename}`, filename], (err2, row2) => {
        if (err2) {
          console.error('❌ Database error on fallback search:', err2);
          res.status(500).json({ error: err2.message });
          return;
        }
        if (!row2) {
          console.warn('⚠️ Service not found even with fallback search');
          res.status(404).json({ error: 'Service not found' });
          return;
        }
        console.log('✅ Service found with fallback search:', {
          id: row2.id,
          title: row2.title,
          url: row2.url
        });
        processServiceRow(row2, res);
      });
      return;
    }
    
    console.log('✅ Service found:', {
      id: row.id,
      title: row.title,
      url: row.url,
      has_reach_diagrams: !!row.reach_diagrams,
      has_reach_diagram_url: !!row.reach_diagram_url
    });
    
    processServiceRow(row, res);
  });
});

// Функция для обработки найденной записи сервиса
function processServiceRow(row, res) {
  // Parse images JSON to array
  let images = [];
  if (row.images) {
    try {
      // Очищаем строку от возможных проблемных символов перед парсингом
      let imagesStr = String(row.images).trim();
      // Если строка не начинается с [ или {, возможно это просто список URL через запятую или перенос строки
      if (!imagesStr.startsWith('[') && !imagesStr.startsWith('{')) {
        // Пробуем разбить по переносу строки или запятой
        const urls = imagesStr.split(/[\n\r,]+/).map(url => url.trim()).filter(url => url.length > 0);
        if (urls.length > 0) {
          images = urls;
          console.log(`⚠️ Service ${row.id || row.title}: images field is not JSON, converted to array:`, urls.length, 'items');
        }
      } else {
        images = JSON.parse(imagesStr);
      }
    } catch (e) {
      console.error(`❌ Error parsing images JSON for service ${row.id || row.title || 'unknown'}:`, e.message);
      console.error(`   Raw images value (first 200 chars):`, String(row.images)?.substring(0, 200));
      // Пробуем разбить по переносу строки или запятой как fallback
      try {
        const imagesStr = String(row.images).trim();
        // Удаляем возможные проблемные символы в начале/конце
        const cleaned = imagesStr.replace(/^[^\[]*\[/, '[').replace(/\][^\]]*$/, ']');
        if (cleaned !== imagesStr) {
          console.log(`   Attempting to fix malformed JSON by cleaning...`);
          images = JSON.parse(cleaned);
        } else {
          const urls = imagesStr.split(/[\n\r,]+/).map(url => url.trim()).filter(url => url.length > 0);
          if (urls.length > 0) {
            images = urls;
            console.log(`   Converted to array:`, urls.length, 'items');
          } else {
            images = [];
          }
        }
      } catch (e2) {
        console.error(`   Fallback parsing also failed:`, e2.message);
        images = [];
      }
    }
  }
  
  // Parse reach_diagrams JSON to array
  let reach_diagrams = [];
  if (row.reach_diagrams) {
    try {
      const parsed = JSON.parse(row.reach_diagrams);
      // Проверяем, что это массив и он не пустой
      if (Array.isArray(parsed) && parsed.length > 0) {
        reach_diagrams = parsed;
        console.log('✅ Parsed reach_diagrams:', reach_diagrams.length, 'diagrams');
      } else {
        console.log('⚠️ Parsed reach_diagrams is empty or not an array');
      }
    } catch (e) {
      console.error('❌ Error parsing reach_diagrams JSON:', e);
      reach_diagrams = [];
    }
  } else {
    console.log('ℹ️ No reach_diagrams field in database');
  }
  
  // Если массив пустой, но есть reach_diagram_url, используем его
  if (reach_diagrams.length === 0 && row.reach_diagram_url) {
    reach_diagrams = [{ url: row.reach_diagram_url, title: 'Схема вылета стрелы' }];
    console.log('✅ Using reach_diagram_url as fallback:', row.reach_diagram_url);
  }
  
  console.log('📊 Final reach_diagrams to send:', reach_diagrams.length, 'diagrams');
  if (reach_diagrams.length > 0) {
    console.log('   Diagrams:', reach_diagrams.map(d => d.url || d));
  }
  
  // Apply fixEncoding to text fields; title — без fixEncoding, чтобы сохранялся дефис (Автовышка-платформа)
  const fixedRow = {
    ...row,
    title: row.title != null ? row.title : '',
    description: fixEncoding(row.description),
    specifications: fixEncoding(row.specifications),
    price: row.price ? fixEncoding(row.price) : row.price,
    images: images,
    reach_diagrams: reach_diagrams,
        height_lift: row.height_lift ? fixEncoding(row.height_lift) : '',
        max_reach: row.max_reach ? fixEncoding(row.max_reach) : '',
        max_capacity: row.max_capacity ? fixEncoding(row.max_capacity) : '',
        lift_type: row.lift_type ? fixEncoding(row.lift_type) : '',
        transport_length: row.transport_length ? fixEncoding(row.transport_length) : '',
        transport_height: row.transport_height ? fixEncoding(row.transport_height) : '',
        width: row.width ? fixEncoding(row.width) : '',
        boom_rotation_angle: row.boom_rotation_angle ? fixEncoding(row.boom_rotation_angle) : '',
        basket_rotation_angle: row.basket_rotation_angle ? fixEncoding(row.basket_rotation_angle) : '',
        delivery_per_km: row.delivery_per_km || 85,
        custom_specs: (() => { try { return JSON.parse(row.custom_specs || '[]'); } catch(e) { return []; } })(),
        price_type: row.price_type || 'shift',
        delivery_type: row.delivery_type || 'per_km'
  };
  res.json(fixedRow);
}

// Submit request
app.post('/api/requests', attachmentUpload.single('attachment'), (req, res) => {
  const { name, phone, email, message, equipment, price, privacy_agreed } = req.body;

  if (!name || !phone || !privacy_agreed) {
    return res.status(400).json({ error: 'Name, phone, and privacy agreement are required' });
  }

  const equipmentText = [equipment, price].filter(Boolean).join(' — ') || '';
  const attachmentPath = req.file ? `uploads/attachments/${req.file.filename}` : null;

  db.run(
    'INSERT INTO requests (name, phone, email, message, equipment, attachment) VALUES (?, ?, ?, ?, ?, ?)',
    [name, phone, email || '', message || '', equipmentText, attachmentPath],
    function(err) {
      if (err) {
        console.error('Request insert error:', err.message);
        res.status(500).json({ error: 'Ошибка при отправке заявки. Пожалуйста, позвоните нам.' });
        return;
      }
      
      // Send Telegram notification
      const notificationMessage = `<b>Новая заявка!</b>\n\n` +
                                  `<b>Имя:</b> ${name}\n` +
                                  `<b>Телефон:</b> ${phone}\n` +
                                  (email ? `<b>Email:</b> ${email}\n` : '') +
                                  (equipmentText ? `<b>Техника / цена:</b> ${equipmentText}\n` : '') +
                                  (message ? `<b>Сообщение:</b> ${message}\n` : '') +
                                  `<b>Время:</b> ${new Date().toLocaleString('ru-RU')}`;
      sendTelegramNotification(notificationMessage);

      res.json({ 
        success: true,
        message: 'Заявка успешно отправлена! Мы свяжемся с вами в ближайшее время.',
        id: this.lastID 
      });
    }
  );
});

// ============ ADMIN API ENDPOINTS ============

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('🔐 Login attempt:', { username, hasPassword: !!password });

  if (!username || !password) {
    console.log('❌ Missing credentials');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, admin) => {
    if (err) {
      console.error('❌ Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }

    if (!admin) {
      console.log('❌ Admin not found:', username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    try {
      const validPassword = await bcrypt.compare(password, admin.password_hash);
      if (!validPassword) {
        console.log('❌ Invalid password for:', username);
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
      console.log('✅ Login successful for:', username);
      res.json({ token, username: admin.username });
    } catch (compareError) {
      console.error('❌ Password compare error:', compareError);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Update content (Protected)
app.put('/api/admin/content/:section', authenticateToken, (req, res) => {
  const { title, subtitle, description, image_url } = req.body;
  const { section } = req.params;

  // Validate required fields
  if (!title || !subtitle || !description) {
    return res.status(400).json({ error: 'Все обязательные поля должны быть заполнены' });
  }

  // Validate section
  const validSections = ['hero', 'about', 'cta'];
  if (!validSections.includes(section)) {
    return res.status(400).json({ error: 'Недопустимая секция' });
  }

  db.run(
    'UPDATE content SET title = ?, subtitle = ?, description = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE section = ?',
    [title, subtitle, description, image_url || '', section],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, changes: this.changes });
    }
  );
});

// Advantage CRUD (Protected)
app.post('/api/admin/advantages', authenticateToken, (req, res) => {
  const { title, description, icon, order_num } = req.body;

  // Validate required fields
  if (!title || !description) {
    return res.status(400).json({ error: 'Заголовок и описание обязательны' });
  }

  db.run(
    'INSERT INTO advantages (title, description, icon, order_num) VALUES (?, ?, ?, ?)',
    [title, description, icon || '', order_num || 0],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.put('/api/admin/advantages/:id', authenticateToken, (req, res) => {
  const { title, description, icon, order_num, active } = req.body;

  db.run(
    'UPDATE advantages SET title = ?, description = ?, icon = ?, order_num = ?, active = ? WHERE id = ?',
    [title, description, icon, order_num, active !== undefined ? active : 1, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, changes: this.changes });
    }
  );
});

app.delete('/api/admin/advantages/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM advantages WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, changes: this.changes });
  });
});

// Review CRUD (Protected)
app.post('/api/admin/reviews', authenticateToken, (req, res) => {
  const { client_name, company, rating, text, date, image_url } = req.body;

  // Validate required fields
  if (!client_name || !text || !date) {
    return res.status(400).json({ error: 'Имя клиента, текст отзыва и дата обязательны' });
  }

  // Validate rating
  const ratingNum = parseInt(rating) || 5;
  if (ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'Оценка должна быть от 1 до 5' });
  }

  db.run(
    'INSERT INTO reviews (client_name, company, rating, text, date, image_url) VALUES (?, ?, ?, ?, ?, ?)',
    [client_name, company || '', ratingNum, text, date, image_url || ''],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.put('/api/admin/reviews/:id', authenticateToken, (req, res) => {
  const { client_name, company, rating, text, date, image_url, active } = req.body;

  // Поддерживаем оба поля: text и review_text для совместимости
  db.run(
    'UPDATE reviews SET client_name = ?, company = ?, rating = ?, text = ?, review_text = ?, date = ?, image_url = ?, active = ? WHERE id = ?',
    [client_name, company, rating, text, text, date, image_url, active !== undefined ? active : 1, req.params.id],
    function(err) {
      if (err) {
        console.error('❌ Ошибка при обновлении отзыва:', err.message);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log(`✅ Отзыв ID ${req.params.id} обновлен через админ-панель`);
      res.json({ success: true, changes: this.changes });
    }
  );
});

app.delete('/api/admin/reviews/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM reviews WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ success: true, changes: this.changes });
  });
});

// Get all services for admin (with fixEncoding to prevent encoding issues)
// Get all reviews for admin (including inactive)
app.get('/api/admin/reviews', authenticateToken, (req, res) => {
  db.all('SELECT * FROM reviews ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      console.error('❌ Ошибка при получении отзывов для админ-панели:', err.message);
      res.status(500).json({ error: err.message });
      return;
    }
    // Apply fixEncoding to text fields
    const fixedRows = rows.map(row => ({
      ...row,
      client_name: row.client_name ? fixEncoding(row.client_name) : row.client_name,
      company: row.company ? fixEncoding(row.company) : row.company,
      // Поддерживаем оба поля: text и review_text
      text: row.text ? fixEncoding(row.text) : (row.review_text ? fixEncoding(row.review_text) : ''),
      review_text: row.review_text ? fixEncoding(row.review_text) : (row.text ? fixEncoding(row.text) : '')
    }));
    console.log(`📝 API /api/admin/reviews: возвращено ${fixedRows.length} отзывов (включая неактивные)`);
    res.json(fixedRows);
  });
});

app.get('/api/admin/services', authenticateToken, (req, res) => {
  db.all('SELECT * FROM services ORDER BY order_num', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // Parse images JSON and apply fixEncoding to prevent encoding issues
    const fixedRows = rows.map(row => {
      let images = [];
      if (row.images) {
        try {
          images = JSON.parse(row.images);
        } catch (e) {
          console.error('Error parsing images JSON:', e);
          images = [];
        }
      }
      let reach_diagrams = [];
      if (row.reach_diagrams) {
        try {
          reach_diagrams = JSON.parse(row.reach_diagrams);
        } catch (e) {
          console.error('Error parsing reach_diagrams JSON:', e);
          reach_diagrams = [];
        }
      }
      return {
        ...row,
        title: row.title != null ? row.title : '',
        description: fixEncoding(row.description),
        specifications: fixEncoding(row.specifications),
        price: row.price ? fixEncoding(row.price) : row.price,
        images: images,
        reach_diagrams: reach_diagrams,
        height_lift: row.height_lift ? fixEncoding(row.height_lift) : '',
        max_reach: row.max_reach ? fixEncoding(row.max_reach) : '',
        max_capacity: row.max_capacity ? fixEncoding(row.max_capacity) : '',
        lift_type: row.lift_type ? fixEncoding(row.lift_type) : '',
        transport_length: row.transport_length ? fixEncoding(row.transport_length) : '',
        transport_height: row.transport_height ? fixEncoding(row.transport_height) : '',
        width: row.width ? fixEncoding(row.width) : '',
        boom_rotation_angle: row.boom_rotation_angle ? fixEncoding(row.boom_rotation_angle) : '',
        basket_rotation_angle: row.basket_rotation_angle ? fixEncoding(row.basket_rotation_angle) : '',
        delivery_per_km: row.delivery_per_km || 85,
        custom_specs: (() => { try { return JSON.parse(row.custom_specs || '[]'); } catch(e) { return []; } })(),
        price_type: row.price_type || 'shift',
        delivery_type: row.delivery_type || 'per_km'
      };
    });
    res.json(fixedRows);
  });
});

// Service CRUD (Protected)
app.post('/api/admin/services', authenticateToken, (req, res) => {
  console.log('📥 POST /api/admin/services - Creating new service');
  const { title, description, short_description, price, specifications, image_url, order_num, url, reach_diagram_url, reach_diagrams, images, 
          height_lift, max_reach, max_capacity, lift_type, transport_length, transport_height, width, boom_rotation_angle, basket_rotation_angle, delivery_per_km,
          is_popular, popular_order, card_bullets, custom_specs, price_type, delivery_type } = req.body;

  console.log('📋 Service data received:', {
    title,
    hasDescription: !!description,
    hasPrice: !!price,
    hasUrl: !!url,
    hasImage: !!image_url
  });

  // Validate required fields
  if (!title || !price) {
    console.error('❌ Validation failed: missing required fields');
    return res.status(400).json({ error: 'Название и цена обязательны' });
  }
  
  // Если price пустая строка, но есть данные о ценах, формируем цену
  // (это для обратной совместимости, если придет старый формат)

  // Convert images array to JSON string if it's an array
  let imagesJson = '';
  if (Array.isArray(images)) {
    imagesJson = JSON.stringify(images);
  } else if (typeof images === 'string') {
    imagesJson = images; // Already JSON string
  }

  // Convert reach_diagrams array to JSON string if it's an array
  let reachDiagramsJson = '';
  if (Array.isArray(reach_diagrams)) {
    reachDiagramsJson = JSON.stringify(reach_diagrams);
  } else if (typeof reach_diagrams === 'string') {
    reachDiagramsJson = reach_diagrams; // Already JSON string
  } else if (reach_diagram_url) {
    // Backward compatibility: if only reach_diagram_url is provided, create array with one item
    reachDiagramsJson = JSON.stringify([{ url: reach_diagram_url, title: 'Схема вылета стрелы' }]);
  }

  // Генерируем URL если его нет
  let finalUrl = url;
  if (!finalUrl || finalUrl.trim() === '') {
    finalUrl = generateUrlFromTitle(title);
    // Добавляем префикс /avtopark/ если его нет
    if (!finalUrl.startsWith('/avtopark/')) {
      finalUrl = '/avtopark/' + finalUrl;
    }
  }
  
  // Создаем объект услуги для генерации страницы
  let reachDiagramsArray = [];
  let imagesArray = [];
  
  try {
    if (reachDiagramsJson && reachDiagramsJson.trim()) {
      reachDiagramsArray = JSON.parse(reachDiagramsJson);
    }
  } catch (e) {
    console.warn('Error parsing reach_diagrams JSON:', e);
  }
  
  try {
    if (imagesJson && imagesJson.trim()) {
      imagesArray = JSON.parse(imagesJson);
    }
  } catch (e) {
    console.warn('Error parsing images JSON:', e);
  }
  
  // Fix image URLs - remove localhost and convert .png to .webp
  const fixedImageUrl = fixImageUrl(image_url || '');
  const fixedReachDiagramUrl = fixImageUrl(reach_diagram_url || '');
  const fixedImagesJson = fixImageUrlsArray(imagesJson);
  const fixedReachDiagramsJson = fixImageUrlsArray(reachDiagramsJson);
  
  const serviceData = {
    title,
    description,
    price,
    specifications,
    image_url: fixedImageUrl,
    url: finalUrl,
    reach_diagram_url: fixedReachDiagramUrl,
    reach_diagrams: reachDiagramsArray,
    images: imagesArray,
    height_lift: height_lift || '',
    max_reach: max_reach || '',
    max_capacity: max_capacity || '',
    lift_type: lift_type || '',
    transport_length: transport_length || '',
    transport_height: transport_height || '',
    width: width || '',
    boom_rotation_angle: boom_rotation_angle || '',
    basket_rotation_angle: basket_rotation_angle || '',
    delivery_per_km: delivery_per_km || 85,
    custom_specs: custom_specs || []
  };
  
  // ВСЕГДА создаем страницу техники с новым шаблоном
  console.log('🔄 Creating equipment page with new template...');
  const createdUrl = createEquipmentPage(serviceData);
  if (createdUrl) {
    console.log('✅ Equipment page created successfully with new template:', createdUrl);
    finalUrl = createdUrl; // Используем URL созданного файла
  } else {
    console.warn('⚠️ Page creation returned null, using original URL:', finalUrl);
  }
  
  // Convert card_bullets to JSON
  let cardBulletsJson = '';
  if (Array.isArray(card_bullets)) {
    cardBulletsJson = JSON.stringify(card_bullets);
  } else if (typeof card_bullets === 'string') {
    cardBulletsJson = card_bullets;
  }
  
  console.log('💾 Saving service to database with URL:', finalUrl);
  db.run(
    'INSERT INTO services (title, description, short_description, price, specifications, image_url, order_num, url, reach_diagram_url, reach_diagrams, images, height_lift, max_reach, max_capacity, lift_type, transport_length, transport_height, width, boom_rotation_angle, basket_rotation_angle, delivery_per_km, is_popular, popular_order, card_bullets, custom_specs, price_type, delivery_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [title, description, short_description || '', price, specifications || '', fixedImageUrl, order_num || 0, finalUrl, fixedReachDiagramUrl, fixedReachDiagramsJson, fixedImagesJson, height_lift || '', max_reach || '', max_capacity || '', lift_type || '', transport_length || '', transport_height || '', width || '', boom_rotation_angle || '', basket_rotation_angle || '', delivery_per_km || 85, is_popular || 0, popular_order || 0, cardBulletsJson, typeof custom_specs === 'string' ? custom_specs : JSON.stringify(custom_specs || []), price_type || 'shift', delivery_type || 'per_km'],
    function(err) {
      if (err) {
        console.error('❌ Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log('✅ Service saved to database with ID:', this.lastID);
      res.json({ success: true, id: this.lastID });
    }
  );
});

app.put('/api/admin/services/:id', authenticateToken, (req, res) => {
  // Быстрое обновление только active (архивация/восстановление)
  if (Object.keys(req.body).length === 1 && req.body.active !== undefined) {
    db.run('UPDATE services SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [req.body.active, req.params.id],
      function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, changes: this.changes });
      }
    );
    return;
  }

  const { title, description, short_description, price, specifications, image_url, order_num, active, url, reach_diagram_url, reach_diagrams, images,
          height_lift, max_reach, max_capacity, lift_type, transport_length, transport_height, width, boom_rotation_angle, basket_rotation_angle, delivery_per_km,
          is_popular, popular_order, card_bullets, custom_specs, price_type, delivery_type } = req.body;

  // Debug logging
  console.log('PUT /api/admin/services/:id - reach_diagrams received:', reach_diagrams);
  console.log('Type:', typeof reach_diagrams, Array.isArray(reach_diagrams));

  // Convert images array to JSON string if it's an array
  let imagesJson = '';
  if (Array.isArray(images)) {
    imagesJson = JSON.stringify(images);
  } else if (typeof images === 'string') {
    imagesJson = images; // Already JSON string
  }

  // Convert reach_diagrams array to JSON string if it's an array
  let reachDiagramsJson = '';
  if (Array.isArray(reach_diagrams)) {
    reachDiagramsJson = JSON.stringify(reach_diagrams);
    console.log('✅ Saving reach_diagrams as array:', reachDiagramsJson);
  } else if (typeof reach_diagrams === 'string' && reach_diagrams.trim()) {
    reachDiagramsJson = reach_diagrams; // Already JSON string
    console.log('✅ Saving reach_diagrams as string:', reachDiagramsJson);
  } else if (reach_diagram_url && !reachDiagramsJson) {
    // Backward compatibility: if only reach_diagram_url is provided, create array with one item
    reachDiagramsJson = JSON.stringify([{ url: reach_diagram_url, title: 'Схема вылета стрелы' }]);
    console.log('✅ Saving reach_diagrams from reach_diagram_url:', reachDiagramsJson);
  } else {
    console.log('⚠️ No reach_diagrams data to save');
  }

  // Генерируем URL если его нет
  let finalUrl = url;
  if (!finalUrl || finalUrl.trim() === '') {
    finalUrl = generateUrlFromTitle(title);
    // Добавляем префикс /avtopark/ если его нет
    if (!finalUrl.startsWith('/avtopark/')) {
      finalUrl = '/avtopark/' + finalUrl;
    }
  }
  
  // Создаем объект услуги для генерации страницы
  let reachDiagramsArray = [];
  let imagesArray = [];
  
  try {
    if (reachDiagramsJson && reachDiagramsJson.trim()) {
      reachDiagramsArray = JSON.parse(reachDiagramsJson);
    }
  } catch (e) {
    console.warn('Error parsing reach_diagrams JSON:', e);
  }
  
  try {
    if (imagesJson && imagesJson.trim()) {
      imagesArray = JSON.parse(imagesJson);
    }
  } catch (e) {
    console.warn('Error parsing images JSON:', e);
  }
  
  // Fix image URLs - remove localhost and convert .png to .webp
  const fixedImageUrl = fixImageUrl(image_url || '');
  const fixedReachDiagramUrl = fixImageUrl(reach_diagram_url || '');
  const fixedImagesJson = fixImageUrlsArray(imagesJson);
  const fixedReachDiagramsJson = fixImageUrlsArray(reachDiagramsJson);
  
  const serviceData = {
    title,
    description,
    price,
    specifications,
    image_url: fixedImageUrl,
    url: finalUrl,
    reach_diagram_url: fixedReachDiagramUrl,
    reach_diagrams: reachDiagramsArray,
    images: imagesArray,
    height_lift: height_lift || '',
    max_reach: max_reach || '',
    max_capacity: max_capacity || '',
    lift_type: lift_type || '',
    transport_length: transport_length || '',
    transport_height: transport_height || '',
    width: width || '',
    boom_rotation_angle: boom_rotation_angle || '',
    basket_rotation_angle: basket_rotation_angle || '',
    delivery_per_km: delivery_per_km || 85,
    custom_specs: custom_specs || [],
    price_type: price_type || 'shift',
    delivery_type: delivery_type || 'per_km'
  };

  // ВСЕГДА перегенерируем страницу техники с новым шаблоном при любом изменении
  console.log('🔄 Regenerating equipment page with new template...');
  const createdUrl = createEquipmentPage(serviceData);
  if (createdUrl) {
    finalUrl = createdUrl; // Используем URL созданного файла
    console.log('✅ Equipment page regenerated successfully:', createdUrl);
  } else {
    console.warn('⚠️ Failed to regenerate equipment page');
  }
  
  // Convert card_bullets to JSON
  let cardBulletsJson = '';
  if (Array.isArray(card_bullets)) {
    cardBulletsJson = JSON.stringify(card_bullets);
  } else if (typeof card_bullets === 'string') {
    cardBulletsJson = card_bullets;
  }
  
  // Логируем обновление image_url для диагностики
  console.log('🔄 Обновление услуги в базе данных:');
  console.log(`   ID: ${req.params.id}`);
  console.log(`   Title: ${title}`);
  console.log(`   image_url (до обработки): ${image_url || '(пусто)'}`);
  console.log(`   image_url (после обработки): ${fixedImageUrl || '(пусто)'}`);
  
  // Проверяем, что image_url не пустой перед сохранением
  if (!fixedImageUrl || fixedImageUrl.trim() === '') {
    console.warn('⚠️ ВНИМАНИЕ: image_url пустой! Изображение не будет сохранено.');
    console.warn('   Проверьте, что изображение было загружено и поле serviceImage заполнено.');
  } else {
    console.log('✅ image_url будет сохранен:', fixedImageUrl);
  }
  
  db.run(
    'UPDATE services SET title = ?, description = ?, short_description = ?, price = ?, specifications = ?, image_url = ?, order_num = ?, active = ?, url = ?, reach_diagram_url = ?, reach_diagrams = ?, images = ?, height_lift = ?, max_reach = ?, max_capacity = ?, lift_type = ?, transport_length = ?, transport_height = ?, width = ?, boom_rotation_angle = ?, basket_rotation_angle = ?, delivery_per_km = ?, is_popular = ?, popular_order = ?, card_bullets = ?, custom_specs = ?, price_type = ?, delivery_type = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, description, short_description || '', price, specifications, fixedImageUrl, order_num, active !== undefined ? active : 1, finalUrl, fixedReachDiagramUrl, fixedReachDiagramsJson, fixedImagesJson, height_lift || '', max_reach || '', max_capacity || '', lift_type || '', transport_length || '', transport_height || '', width || '', boom_rotation_angle || '', basket_rotation_angle || '', delivery_per_km || 85, is_popular || 0, popular_order || 0, cardBulletsJson, typeof custom_specs === 'string' ? custom_specs : JSON.stringify(custom_specs || []), price_type || 'shift', delivery_type || 'per_km', req.params.id],
    function(err) {
      if (err) {
        console.error('❌ Ошибка при обновлении услуги:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      console.log('✅ Service updated in database, page regenerated with new template');
      console.log(`   Изменено строк: ${this.changes}`);
      
      // Проверяем, что image_url действительно сохранен
      db.get('SELECT image_url FROM services WHERE id = ?', [req.params.id], (checkErr, row) => {
        if (!checkErr && row) {
          console.log(`   Проверка: image_url в базе = ${row.image_url}`);
        }
      });
      
      res.json({ success: true, changes: this.changes });
    }
  );
});

// Function to delete equipment page file
function deleteEquipmentPage(serviceUrl) {
  try {
    if (!serviceUrl || serviceUrl.trim() === '') {
      console.log('⚠️ No URL provided, skipping file deletion');
      return;
    }
    
    // Убираем начальный слэш и /avtopark/ или /equipment/ если есть
    let filename = serviceUrl.replace(/^\/+/, '').replace(/^(avtopark|equipment)\//, '');
    if (!filename.endsWith('.html')) {
      filename += '.html';
    }
    
    const equipmentDir = path.join(__dirname, 'public', 'equipment');
    const filePath = path.join(equipmentDir, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Deleted equipment page: ${filename}`);
    } else {
      console.log(`⚠️ Equipment page not found: ${filename}`);
    }
  } catch (error) {
    console.error(`❌ Error deleting equipment page:`, error.message);
  }
}

// Function to delete uploaded files
function deleteUploadedFiles(fileUrls) {
  if (!fileUrls) return;
  
  let filesToDelete = [];
  
  // Если это массив
  if (Array.isArray(fileUrls)) {
    filesToDelete = fileUrls.map(item => typeof item === 'string' ? item : (item.url || item));
  }
  // Если это строка
  else if (typeof fileUrls === 'string' && fileUrls.trim()) {
    // Пытаемся распарсить как JSON
    try {
      const parsed = JSON.parse(fileUrls);
      if (Array.isArray(parsed)) {
        filesToDelete = parsed.map(item => typeof item === 'string' ? item : (item.url || item));
      } else if (parsed && typeof parsed === 'object') {
        // Если это объект с url
        if (parsed.url) {
          filesToDelete.push(parsed.url);
        }
      }
    } catch (e) {
      // Не JSON, считаем это обычной строкой с URL файла
      filesToDelete.push(fileUrls);
    }
  }
  
  filesToDelete.forEach(fileUrl => {
    try {
      if (!fileUrl || typeof fileUrl !== 'string') return;
      
      // Извлекаем имя файла из URL
      // URL может быть вида: /uploads/filename.jpg или uploads/filename.jpg
      let filename = fileUrl.replace(/^\/+/, '').replace(/^uploads\//, '');
      
      if (filename) {
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`✅ Deleted uploaded file: ${filename}`);
        } else {
          console.log(`⚠️ File not found: ${filename}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error deleting file ${fileUrl}:`, error.message);
    }
  });
}

app.delete('/api/admin/services/:id', authenticateToken, (req, res) => {
  const serviceId = req.params.id;
  
  // Сначала получаем информацию об услуге перед удалением
  db.get('SELECT url, image_url, images, reach_diagrams, reach_diagram_url FROM services WHERE id = ?', [serviceId], (err, service) => {
    if (err) {
      console.error('❌ Error fetching service for deletion:', err);
      return res.status(500).json({ error: err.message });
    }
    
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    
    // Удаляем HTML-файл страницы техники
    if (service.url) {
      deleteEquipmentPage(service.url);
    }
    
    // Удаляем загруженные изображения
    if (service.image_url) {
      deleteUploadedFiles(service.image_url);
    }
    
    if (service.images) {
      deleteUploadedFiles(service.images);
    }
    
    // Удаляем схемы вылета стрелы
    if (service.reach_diagram_url) {
      deleteUploadedFiles(service.reach_diagram_url);
    }
    
    if (service.reach_diagrams) {
      deleteUploadedFiles(service.reach_diagrams);
    }
    
    // Теперь удаляем запись из базы данных
    db.run('DELETE FROM services WHERE id = ?', [serviceId], function(deleteErr) {
      if (deleteErr) {
        console.error('❌ Error deleting service from database:', deleteErr);
        return res.status(500).json({ error: deleteErr.message });
      }
      
      console.log(`✅ Service ${serviceId} deleted successfully`);
      res.json({ success: true, changes: this.changes });
    });
  });
});

// Get all requests (Protected)
app.get('/api/admin/requests', authenticateToken, (req, res) => {
  db.all('SELECT * FROM requests ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Update request status (Protected)
app.put('/api/admin/requests/:id', authenticateToken, (req, res) => {
  const { status } = req.body;

  db.run(
    'UPDATE requests SET status = ? WHERE id = ?',
    [status, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ success: true, changes: this.changes });
    }
  );
});

// Update homepage (Protected)
app.put('/api/admin/homepage', authenticateToken, (req, res) => {
  const { title, subtitle, video_url } = req.body;

  // Validate required fields
  if (!title || !subtitle || !video_url) {
    return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
  }

  // Check if homepage data exists
  db.get('SELECT * FROM homepage ORDER BY id DESC LIMIT 1', [], (err, existing) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (existing) {
      // Update existing record
      db.run(
        'UPDATE homepage SET title = ?, subtitle = ?, video_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [title, subtitle, video_url, existing.id],
        function(updateErr) {
          if (updateErr) {
            res.status(500).json({ error: updateErr.message });
            return;
          }
          res.json({ success: true, message: 'Данные главной страницы обновлены' });
        }
      );
    } else {
      // Insert new record
      db.run(
        'INSERT INTO homepage (title, subtitle, video_url) VALUES (?, ?, ?)',
        [title, subtitle, video_url],
        function(insertErr) {
          if (insertErr) {
            res.status(500).json({ error: insertErr.message });
            return;
          }
          res.json({ success: true, message: 'Данные главной страницы созданы' });
        }
      );
    }
  });
});

// Upload video (Protected)
const videoUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'public/');
    },
    filename: (req, file, cb) => {
      // Получаем serviceId и serviceTitle из query параметров
      const serviceId = req.query.serviceId || 'homepage';
      const serviceTitle = req.query.serviceTitle || '';
      
      const slug = serviceTitle ? slugifyAsciiFilename(serviceTitle, 50) : '';
      
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      
      // Формат: video-{id}-{slug}-{timestamp}.ext
      let filename;
      if (slug && serviceId !== 'homepage') {
        filename = `video-service-${serviceId}-${slug}-${timestamp}${ext}`;
      } else {
        filename = `video-${serviceId}-${timestamp}${ext}`;
      }
      
      cb(null, filename);
    }
  }),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /mp4|webm|ogg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('Разрешены только видеофайлы: MP4, WebM, OGG'));
    }
  }
});

app.post('/api/admin/upload-video', authenticateToken, videoUpload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не был загружен' });
  }

  const videoUrl = '/' + req.file.filename;
  res.json({ url: videoUrl, filename: req.file.filename });
});

// File upload endpoint (Protected) with automatic optimization
app.post('/api/admin/upload', authenticateToken, upload.single('image'), async (req, res) => {
  console.log('📤 Запрос на загрузку изображения получен');
  console.log('   Файл:', req.file ? req.file.originalname : 'НЕТ');
  console.log('   Размер:', req.file ? (req.file.size / 1024).toFixed(2) + ' KB' : 'НЕТ');
  
  if (!req.file) {
    console.error('❌ Ошибка: файл не загружен');
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  // Проверяем, что папка uploads существует и доступна для записи
  const uploadsDir = path.join(__dirname, 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('📁 Папка uploads не существует, создаем...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Папка uploads создана');
  }
  
  try {
    const uploadedPath = req.file.path;
    const filename = path.parse(req.file.filename).name;
    const ext = path.extname(req.file.originalname).toLowerCase();
    
    console.log('📁 Путь загруженного файла:', uploadedPath);
    console.log('📝 Имя файла:', filename);
    console.log('📎 Расширение:', ext);
    
    // Проверяем размер файла
    const stats = fs.statSync(uploadedPath);
    const sizeKB = stats.size / 1024;
    const sizeMB = sizeKB / 1024;
    
    // ВСЕГДА конвертируем в WebP для единообразия и оптимизации
    // Исключение: если файл уже WebP и маленький (< 500KB), оставляем как есть
    const isAlreadyWebp = ext === '.webp';
    const isSmallWebp = isAlreadyWebp && sizeKB < 500;
    
    if (isSmallWebp) {
      console.log(`Файл уже WebP и оптимален: ${req.file.originalname} (${sizeMB.toFixed(2)} MB)`);
      
      res.json({ 
        success: true,
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        optimized: false,
        size: sizeMB.toFixed(2) + ' MB'
      });
    } else {
      // Конвертируем все остальные форматы в WebP
      console.log(`Конвертация изображения в WebP: ${req.file.originalname} (${sizeMB.toFixed(2)} MB)`);
      
      const webpPath = path.join('uploads', `${filename}.webp`);
      const jpegPath = path.join('uploads', `${filename}.jpg`);
      
      try {
        // Создаем WebP версию (основной формат)
        await sharp(uploadedPath)
          .resize(1920, null, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .webp({ quality: 85 })
          .toFile(webpPath);
        
        // Создаем JPEG версию для совместимости (fallback)
        await sharp(uploadedPath)
          .resize(1920, null, {
            fit: 'inside',
            withoutEnlargement: true
          })
          .jpeg({ quality: 85 })
          .toFile(jpegPath);
        
        // НЕ удаляем оригинал - сохраняем его для резервной копии
        // Оригинал остается в папке uploads с исходным именем
        console.log(`   Оригинал сохранен: ${uploadedPath}`);
        
        console.log(`✅ Изображение успешно конвертировано: ${filename}.webp`);
        console.log(`   Оригинал сохранен: ${uploadedPath}`);
        console.log(`   WebP файл сохранен: ${webpPath}`);
        console.log(`   JPEG файл сохранен: ${jpegPath}`);
        
        // Проверяем, что файлы действительно существуют
        if (!fs.existsSync(webpPath)) {
          console.error(`❌ ОШИБКА: WebP файл не найден после конвертации: ${webpPath}`);
          throw new Error('WebP файл не был создан');
        } else {
          const webpStats = fs.statSync(webpPath);
          const originalStats = fs.statSync(uploadedPath);
          console.log(`   ✅ Оригинал размер: ${(originalStats.size / 1024).toFixed(2)} KB`);
          console.log(`   ✅ WebP размер: ${(webpStats.size / 1024).toFixed(2)} KB`);
          console.log(`   ✅ Экономия: ${((1 - webpStats.size / originalStats.size) * 100).toFixed(1)}%`);
        }
        
        // Проверяем, что файлы действительно существуют перед отправкой ответа
        const finalWebpPath = path.join(__dirname, 'uploads', `${filename}.webp`);
        if (!fs.existsSync(finalWebpPath)) {
          console.error(`❌ КРИТИЧЕСКАЯ ОШИБКА: WebP файл не найден: ${finalWebpPath}`);
          throw new Error('WebP файл не найден после конвертации');
        }
        
        console.log(`✅ Изображение успешно загружено и обработано: /uploads/${filename}.webp`);
        
        // Возвращаем WebP версию для использования на сайте
        res.json({ 
          success: true,
          filename: `${filename}.webp`,
          url: `/uploads/${filename}.webp`,
          originalFilename: req.file.filename, // Оригинальное имя файла
          originalUrl: `/uploads/${req.file.filename}`, // URL оригинального файла
          optimized: true,
          originalSize: sizeMB.toFixed(2) + ' MB'
        });
      } catch (optimizeError) {
        console.error('❌ Ошибка при конвертации изображения:', optimizeError);
        console.error('   Детали ошибки:', {
          message: optimizeError.message,
          stack: optimizeError.stack,
          file: req.file.originalname,
          path: uploadedPath
        });
        
        // Проверяем, существует ли оригинальный файл
        if (!fs.existsSync(uploadedPath)) {
          console.error('❌ КРИТИЧЕСКАЯ ОШИБКА: Оригинальный файл не найден после загрузки!');
          return res.status(500).json({ 
            error: 'Ошибка при обработке файла',
            details: 'Файл не был сохранен на сервере'
          });
        }
        
        // Если конвертация не удалась, возвращаем оригинал
        // Оригинал уже сохранен, так что просто возвращаем его URL
        res.json({ 
          success: true,
          filename: req.file.filename,
          url: `/uploads/${req.file.filename}`,
          optimized: false,
          error: 'Конвертация не удалась, используется оригинал',
          size: sizeMB.toFixed(2) + ' MB'
        });
      }
    }
  } catch (error) {
    console.error('❌ Ошибка при обработке изображения:', error);
    console.error('   Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      file: req.file ? req.file.originalname : 'НЕТ',
      uploadsDir: uploadsDir
    });
    
    // Если обработка не удалась, возвращаем оригинал (если он был загружен)
    if (req.file && fs.existsSync(req.file.path)) {
      console.log('   ✅ Оригинальный файл существует, возвращаем его');
      res.json({ 
        success: true,
        filename: req.file.filename,
        url: `/uploads/${req.file.filename}`,
        error: 'Ошибка обработки, используется оригинал',
        details: error.message
      });
    } else {
      console.error('   ❌ Файл не был загружен или не найден');
      res.status(500).json({ 
        error: 'Ошибка при загрузке файла',
        details: error.message || 'Неизвестная ошибка'
      });
    }
  }
});

// Создаем необходимые директории при запуске сервера
const uploadsDir = path.join(__dirname, 'uploads');
const publicEquipmentDir = path.join(__dirname, 'public', 'equipment');

// Создаем папку uploads, если её нет
if (!fs.existsSync(uploadsDir)) {
  console.log('📁 Создаем папку uploads...');
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Папка uploads создана');
} else {
  console.log('✅ Папка uploads существует');
  // Проверяем права доступа
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    console.log('✅ Папка uploads доступна для записи');
  } catch (err) {
    console.error('❌ ОШИБКА: Папка uploads не доступна для записи!');
    console.error('   Исправьте права доступа: chmod 755 uploads');
  }
}

// Создаем папку public/equipment, если её нет
if (!fs.existsSync(publicEquipmentDir)) {
  console.log('📁 Создаем папку public/equipment...');
  fs.mkdirSync(publicEquipmentDir, { recursive: true });
  console.log('✅ Папка public/equipment создана');
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
});







