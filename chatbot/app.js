(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let motion = !reduced.matches;
  root.classList.add('js');
  root.dataset.motion = motion ? 'on' : 'off';

  const menu = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu() {
    menu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-label', 'Abrir menú');
    mobileNav.hidden = true;
  }
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    mobileNav.hidden = !open;
  });
  mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

  let scrollPending = false;
  function progress() {
    const available = root.scrollHeight - innerHeight;
    $('.reading-progress').style.transform = `scaleX(${available > 0 ? scrollY / available : 0})`;
    scrollPending = false;
  }
  addEventListener('scroll', () => {
    if (!scrollPending) { requestAnimationFrame(progress); scrollPending = true; }
  }, {passive:true});
  progress();

  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); reveal.unobserve(entry.target); }
    }), {threshold:.08});
    $$('.reveal').forEach(element => reveal.observe(element));
  } else $$('.reveal').forEach(element => element.classList.add('visible'));

  const hero = $('.hero');
  const heroVisual = $('.hero-visual');
  hero.addEventListener('pointermove', event => {
    if (!motion || event.pointerType === 'touch') return;
    const box = hero.getBoundingClientRect();
    heroVisual.style.setProperty('--px', `${((event.clientX - box.left) / box.width - .5) * 9}px`);
    heroVisual.style.setProperty('--py', `${((event.clientY - box.top) / box.height - .5) * 7}px`);
  });
  hero.addEventListener('pointerleave', () => {
    heroVisual.style.setProperty('--px', '0px');
    heroVisual.style.setProperty('--py', '0px');
  });

  const phoneConversation = $('#hero-conversation');
  let phoneManual = false;
  let phoneStamp = Date.now();
  function replayPhone() {
    phoneConversation.classList.remove('replaying');
    if (motion) {
      void phoneConversation.offsetWidth;
      phoneConversation.classList.add('replaying');
    }
    phoneStamp = Date.now();
  }
  $$('[data-phone-channel]').forEach(button => button.addEventListener('click', () => {
    phoneManual = true;
    $$('[data-phone-channel]').forEach(item => {
      item.classList.toggle('active', item === button);
      item.setAttribute('aria-pressed', String(item === button));
    });
    $('#hero-question').textContent = button.dataset.phoneChannel === 'instagram'
      ? 'Me gusta la camisa del post. ¿La tienen en M?'
      : '¿Tienen esta camisa en talla M?';
    replayPhone();
  }));
  $('#replay-phone').addEventListener('click', () => { phoneManual = true; replayPhone(); });
  replayPhone();

  const demos = {
    atencion: {
      channel:'whatsapp', channelName:'WhatsApp', end:'Tu información', icon:'chat',
      question:'Hola, ¿hacen envíos a Altamira?',
      answer:'Sí, coordinamos el envío. ¿Qué producto te interesa? El equipo confirma la tarifa.',
      title:'Respuestas útiles.\nMenos repetición.',
      copy:'Horarios, entregas y preguntas frecuentes, con la información que tu negocio aprueba.',
      points:['Con tu tono', 'Con un siguiente paso'],
      chatEnd:'Una respuesta con tus datos'
    },
    catalogo: {
      channel:'instagram', channelName:'Instagram', end:'Tu catálogo', icon:'bag',
      question:'¿Tienen esta camisa en negro, talla M?',
      answer:'Sí. Te comparto los detalles del catálogo.',
      title:'Tu catálogo.\nEn la conversación.',
      copy:'Productos, variantes y precios desde una fuente que tu negocio mantiene actualizada.',
      points:['Variantes y precios', 'Datos de tu catálogo'], product:true,
      chatEnd:'Tu equipo confirma las existencias'
    },
    pedidos: {
      channel:'whatsapp', channelName:'WhatsApp', end:'Tu equipo', icon:'order',
      question:'Quiero una M en negro. Paso a retirarla.',
      answer:'Perfecto. Dejo tu solicitud preparada para que el equipo confirme la reserva.',
      title:'Una solicitud.\nTodo lo necesario.',
      copy:'Producto, talla y entrega llegan juntos a tu equipo.',
      points:[], order:true,
      chatEnd:'Solicitud lista. Reserva por confirmar'
    },
    equipo: {
      channel:'facebook', channelName:'Messenger', end:'Tu equipo', icon:'team',
      question:'Necesito cambiar un producto.',
      answer:'Te paso con una persona del equipo para revisar tu cambio. Ya tiene el historial.',
      title:'Tu equipo entra.\nEl contexto sigue.',
      copy:'Ante una excepción, el asistente pausa y una persona continúa la conversación.',
      points:['Asistente en pausa', 'Historial disponible'],
      chatEnd:'Una persona continúa la conversación'
    }
  };
  const tabs = $$('[data-demo]');
  const panel = $('#demo-panel');
  const tourButton = $('#demo-tour');
  let demoKey = 'atencion';
  let tour = motion;
  let demoVisible = false;
  let heroVisible = true;
  let demoStamp = Date.now();

  function tourLabel() {
    const running = tour && motion;
    tourButton.setAttribute('aria-pressed', String(running));
    tourButton.querySelector('use').setAttribute('href', running ? '#i-pause' : '#i-play');
    tourButton.querySelector('span').textContent = running ? 'Pausar recorrido' : 'Ver recorrido';
    $$('.sample-messages,.demo-result').forEach(element => element.setAttribute('aria-live', running ? 'off' : 'polite'));
  }
  function renderDemo(key, manual = false) {
    const data = demos[key];
    demoKey = key;
    if (manual) tour = false;
    tabs.forEach(tab => {
      const selected = tab.dataset.demo === key;
      tab.classList.toggle('active', selected);
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby', `tab-${key}`);
    $('#demo-channel-icon').src = `assets/platforms/${data.channel}.svg`;
    $('#demo-channel-name').textContent = data.channelName;
    $('#demo-route-end').textContent = data.end;
    $('#demo-question').textContent = data.question;
    $('#demo-answer').textContent = data.answer;
    $('#demo-result-title').textContent = data.title;
    $('#demo-result-copy').textContent = data.copy;
    $('#result-icon-use').setAttribute('href', `#i-${data.icon}`);
    $('#demo-product').hidden = !data.product;
    $('#demo-order-detail').hidden = !data.order;
    $('.sample-chat-end').lastChild.textContent = ' ' + data.chatEnd;
    const points = $('#demo-result-points');
    points.replaceChildren();
    points.hidden = !data.points.length;
    for (const text of data.points) {
      const span = document.createElement('span');
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'icon');
      const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
      use.setAttribute('href', '#i-check');
      svg.append(use);
      span.append(svg, document.createTextNode(text));
      points.append(span);
    }
    panel.classList.remove('updating');
    if (motion) { void panel.offsetWidth; panel.classList.add('updating'); }
    demoStamp = Date.now();
    tourLabel();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => renderDemo(tab.dataset.demo, true));
    tab.addEventListener('keydown', event => {
      let next;
      if (['ArrowRight','ArrowDown'].includes(event.key)) next = (index + 1) % tabs.length;
      else if (['ArrowLeft','ArrowUp'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) { event.preventDefault(); tabs[next].focus(); renderDemo(tabs[next].dataset.demo, true); }
    });
  });
  tourButton.addEventListener('click', () => {
    const start = !(tour && motion);
    if (start && !motion) applyMotion(true);
    tour = start;
    demoStamp = Date.now();
    tourLabel();
  });
  if ('IntersectionObserver' in window) {
    const areaObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.target === hero) heroVisible = entry.isIntersecting;
        else { demoVisible = entry.isIntersecting; if (demoVisible) demoStamp = Date.now(); }
      }
    }, {threshold:.2});
    areaObserver.observe(hero);
    areaObserver.observe($('.studio'));
  }
  const motionButton = $('#motion-toggle');
  function applyMotion(enabled) {
    motion = enabled;
    root.dataset.motion = motion ? 'on' : 'off';
    const label = motion ? 'Pausar animaciones' : 'Activar animaciones';
    motionButton.setAttribute('aria-pressed', String(!motion));
    motionButton.setAttribute('aria-label', label);
    motionButton.title = label;
    motionButton.querySelector('use').setAttribute('href', motion ? '#i-pause' : '#i-play');
    if (!motion) phoneConversation.classList.remove('replaying');
    demoStamp = phoneStamp = Date.now();
    tourLabel();
  }
  motionButton.addEventListener('click', () => applyMotion(!motion));
  reduced.addEventListener('change', event => applyMotion(!event.matches));
  document.addEventListener('visibilitychange', () => { demoStamp = phoneStamp = Date.now(); });
  setInterval(() => {
    if (!motion || document.hidden) return;
    const now = Date.now();
    if (heroVisible && !phoneManual && now - phoneStamp > 14500) replayPhone();
    if (demoVisible && tour && now - demoStamp > 8000) {
      const next = (tabs.findIndex(tab => tab.dataset.demo === demoKey) + 1) % tabs.length;
      renderDemo(tabs[next].dataset.demo);
    }
  }, 500);
  renderDemo('atencion');
  applyMotion(motion);

  const dialog = $('#contact-dialog');
  let lastFocus;
  $$('[data-open-contact]').forEach(button => button.addEventListener('click', () => {
    lastFocus = document.activeElement;
    dialog.showModal();
  }));
  $('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => lastFocus?.focus());
  $('#lead-form').addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    $('#lead-summary').value = `Hola, Maben. Me interesa Maben Chat Bot para automatizar la atención de mi negocio.\n\nComercio: ${data.get('business').trim()}\nProductos: ${data.get('products').trim()}\nCanales: ${data.get('channel')}\nMensajes al día: ${data.get('volume')}\nCatálogo: ${data.get('catalog')}\n\nMe interesa conocer el alcance, la instalación y el acompañamiento.`;
    $('#send-whatsapp').href = 'https://wa.me/584143691704?text=' + encodeURIComponent($('#lead-summary').value);
    $('#lead-result').hidden = false;
    $('#copy-status').textContent = 'Resumen listo. Continúa por WhatsApp para compartirlo con Maben.';
    $('#lead-summary').focus();
  });
  $('#copy-summary').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('#lead-summary').value);
      $('#copy-status').textContent = 'Consulta copiada. Ya puedes compartirla.';
    } catch {
      $('#lead-summary').focus(); $('#lead-summary').select();
      $('#copy-status').textContent = 'Seleccionamos el texto. Usa Copiar en tu dispositivo.';
    }
  });
})();

/* Casos reales: los logos funcionan como pestañas */
(() => {
  const tabs = [...document.querySelectorAll('.case-logo')];
  if (!tabs.length) return;
  const panelOf = tab => document.getElementById(tab.getAttribute('aria-controls'));
  const select = (tab, focus) => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      panelOf(t).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => select(tab));
    tab.addEventListener('keydown', e => {
      const last = tabs.length - 1;
      const next = { ArrowRight: i === last ? 0 : i + 1, ArrowLeft: i === 0 ? last : i - 1, Home: 0, End: last }[e.key];
      if (next === undefined) return;
      e.preventDefault();
      select(tabs[next], true);
    });
  });
  /* Un enlace como maben.io/chatbot/#caso-llamago abre ese caso */
  const fromHash = () => {
    const tab = tabs.find(t => '#' + t.getAttribute('aria-controls') === location.hash);
    if (!tab) return;
    select(tab);
    document.getElementById('casos').scrollIntoView({ block: 'start' });
  };
  fromHash();
  window.addEventListener('hashchange', fromHash);
})();
