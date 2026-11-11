// Общие правила формы заявки: проверка телефона и незаметная защита от роботов.
// Один и тот же файл работает в браузере (window.LeadForm) и на сервере (require в server.js),
// поэтому сайт и сервер проверяют номер одинаково.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.LeadForm = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var PHONE_HINT = 'Проверьте номер телефона: после +7 должно быть 10 цифр, например +7 (999) 123-45-67.';

  // Номер из 10 цифр без кода страны («9991234567», «8121234567»)
  function checkNational(n) {
    if (!/^\d{10}$/.test(n)) return false;
    if (/^(\d)\1{9}$/.test(n)) return false;        // 0000000000, 9999999999
    if (n === '1234567890' || n === '0123456789') return false;
    // Коды в России начинаются на 3, 4, 8, 9; в Казахстане (тоже +7) — на 6 и 7
    if (!/^[346789]/.test(n)) return false;
    // «89…» и «79…» из 10 цифр — это номер с восьмёркой или семёркой, в котором не хватает цифры
    if (/^[78]9/.test(n)) return false;
    return true;
  }

  // Один номер. Возвращает { ok: true, phone: '+7 (999) 123-45-67' } или { ok: false }
  function normalizeOne(raw) {
    var text = String(raw == null ? '' : raw).trim();
    var ext = '';
    // добавочный: «доб. 12», «вн. 12», «ext 12» — проверяем номер без него и возвращаем на место
    var extMatch = text.match(/^(.*?)(?:доб|вн|ext)[.:№ ]*([0-9]{1,6})$/i);
    if (extMatch) { text = extMatch[1].trim(); ext = ' доб. ' + extMatch[2]; }
    var plus = text.charAt(0) === '+';
    var digits = text.replace(/[^0-9]/g, '');
    var national = null;

    if (digits.length === 11 && (digits.charAt(0) === '7' || digits.charAt(0) === '8')) {
      national = digits.slice(1);
    } else if (digits.length === 10 && !plus) {
      national = digits;
    } else if (plus && digits.length >= 10 && digits.length <= 15 && digits.charAt(0) !== '7' && digits.charAt(0) !== '0') {
      // Номер другой страны, записанный с плюсом — принимаем как есть
      if (/^([0-9])+$/.test(digits)) return { ok: false };
      return { ok: true, phone: '+' + digits + ext };
    }

    if (!national || !checkNational(national)) return { ok: false };
    return {
      ok: true,
      phone: '+7 (' + national.slice(0, 3) + ') ' + national.slice(3, 6) + '-' + national.slice(6, 8) + '-' + national.slice(8, 10) + ext
    };
  }

  // Возвращает { ok: true, phone: '+7 (999) 123-45-67' } или { ok: false, error: 'текст для посетителя' }.
  // Два номера через запятую, точку с запятой, косую черту или «или» принимаются, если верны оба.
  function normalizePhone(raw) {
    var text = String(raw == null ? '' : raw).trim();
    if (!text) return { ok: false, error: 'Укажите номер телефона.' };
    if (text.length > 60) return { ok: false, error: PHONE_HINT };
    var parts = text.split(/[,;/]| или /i).map(function (p) { return p.trim(); }).filter(Boolean);
    if (!parts.length || parts.length > 2) return { ok: false, error: PHONE_HINT };
    var phones = [];
    for (var i = 0; i < parts.length; i++) {
      var one = normalizeOne(parts[i]);
      if (!one.ok) return { ok: false, error: PHONE_HINT };
      phones.push(one.phone);
    }
    return { ok: true, phone: phones.join(', ') };
  }

  // ---- Только для браузера ----

  // Добавляет в форму невидимое поле-ловушку и запоминает время появления формы.
  // Человек ловушку не видит и не заполняет; робот, заполняющий все поля подряд, себя выдаёт.
  function protect(form) {
    if (!form || form.__leadProtected || typeof document === 'undefined') return;
    form.__leadProtected = true;
    form.__leadShownAt = Date.now();
    var wrap = document.createElement('div');
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position:absolute;left:-9999px;top:auto;width:1px;height:1px;overflow:hidden;';
    var input = document.createElement('input');
    input.type = 'text';
    input.name = 'hp_check';
    input.tabIndex = -1;
    input.autocomplete = 'off';
    input.value = '';
    wrap.appendChild(input);
    form.appendChild(wrap);
  }

  // Дописывает к отправляемым данным служебные поля защиты
  function appendMeta(formData, form) {
    if (!formData || !form) return;
    var trap = form.querySelector('input[name="hp_check"]');
    formData.set('hp_check', trap ? trap.value : '');
    if (form.__leadShownAt) formData.set('form_ms', String(Date.now() - form.__leadShownAt));
  }

  // Подсказка об ошибке прямо под полем: сообщение внизу формы на телефоне можно не заметить
  function clearFieldError(input) {
    if (!input) return;
    input.classList.remove('lead-input-invalid');
    input.removeAttribute('aria-invalid');
    var next = input.nextElementSibling;
    if (next && next.classList && next.classList.contains('lead-field-error')) next.remove();
  }

  function showFieldError(input, text) {
    if (!input || typeof document === 'undefined') return;
    clearFieldError(input);
    var hint = document.createElement('div');
    hint.className = 'lead-field-error';
    hint.setAttribute('role', 'alert');
    hint.textContent = text;
    input.insertAdjacentElement('afterend', hint);
    input.classList.add('lead-input-invalid');
    input.setAttribute('aria-invalid', 'true');
    if (!input.__leadErrorWatch) {
      input.__leadErrorWatch = true;
      input.addEventListener('input', function () { clearFieldError(input); });
    }
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
    if (hint.scrollIntoView) hint.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  // Проверяет поле телефона в форме перед отправкой. true — номер в порядке;
  // false — под полем показана подсказка, отправлять не нужно.
  function checkPhoneField(form) {
    var input = form && form.querySelector('input[name="phone"]');
    if (!input) return true;
    var result = normalizePhone(input.value);
    if (result.ok) { clearFieldError(input); return true; }
    showFieldError(input, result.error);
    return false;
  }

  return {
    normalizePhone: normalizePhone,
    protect: protect,
    appendMeta: appendMeta,
    checkPhoneField: checkPhoneField,
    showFieldError: showFieldError,
    clearFieldError: clearFieldError,
    PHONE_HINT: PHONE_HINT
  };
});
