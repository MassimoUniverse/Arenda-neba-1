// Служебные поля техники (высота подъёма, вылет, грузоподъёмность…) — из списка характеристик.
//
// Характеристики хранятся в services.custom_specs как список «название — значение», а калькулятор
// на главной читает отдельные колонки (height_lift, max_reach, max_capacity). Раньше эти колонки
// заполняла админка в браузере, сравнивая названия буква в букву, и ошибалась:
//   • «Высота подъёма» через «ё» не распознавалась — у погрузчика высота оставалась пустой;
//   • из двух «грузоподъёмностей» бралась последняя — у автовышки 15 м это была лебёдка (450 кг),
//     а не люлька (200 кг);
//   • «Угол поворота корзины» попадал в «ширину».
// Теперь поля считает сервер при каждом сохранении (см. legacySpecFields в server.js).

const LEGACY_SPEC_FIELDS = [
  'height_lift', 'max_reach', 'max_capacity', 'lift_type', 'transport_length',
  'transport_height', 'width', 'boom_rotation_angle', 'basket_rotation_angle'
];

function isBasketLabel(label) {
  return label.includes('корзин') || label.includes('люльк') || label.includes('платформ');
}

function deriveLegacySpecFields(customSpecs) {
  const out = {};
  LEGACY_SPEC_FIELDS.forEach((field) => { out[field] = ''; });
  let capacityFromBasket = false;

  (Array.isArray(customSpecs) ? customSpecs : []).forEach((spec) => {
    if (!spec || !spec.label || spec.value == null) return;
    const value = String(spec.value).trim();
    if (!value) return;
    const label = String(spec.label).toLowerCase().replace(/ё/g, 'е');
    const put = (field) => { if (!out[field]) out[field] = value; }; // побеждает первое подходящее название

    if (label.includes('поворот') && label.includes('стрел')) {
      put('boom_rotation_angle');
    } else if (label.includes('поворот') && isBasketLabel(label)) {
      put('basket_rotation_angle');
    } else if (label.includes('транспорт') && label.includes('длин')) {
      put('transport_length');
    } else if (label.includes('транспорт') && label.includes('высот')) {
      put('transport_height');
    } else if (label.includes('высота подъема') || label.includes('рабочая высота')) {
      put('height_lift');
    } else if (label.includes('вылет')) {
      put('max_reach');
    } else if (label.includes('грузоподъемность')) {
      if (label.includes('лебед')) return; // лебёдка — не корзина
      // грузоподъёмность именно корзины/люльки важнее общей
      if (isBasketLabel(label) && !capacityFromBasket) {
        out.max_capacity = value;
        capacityFromBasket = true;
      } else {
        put('max_capacity');
      }
    } else if (label.startsWith('тип')) {
      put('lift_type');
    } else if (label.includes('ширин') && !isBasketLabel(label)) {
      put('width'); // ширина машины, не корзины
    }
  });

  return out;
}

module.exports = { LEGACY_SPEC_FIELDS, deriveLegacySpecFields };
