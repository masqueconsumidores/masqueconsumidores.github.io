/* Más Que Consumidores — script único (v1) */
(function () {
  "use strict";

  // 1. Encabezado: borde y sombra tras 10 px de desplazamiento
  var cabecera = document.querySelector(".cabecera");
  function revisarScroll() {
    if (cabecera) cabecera.classList.toggle("con-sombra", window.scrollY > 10);
  }
  window.addEventListener("scroll", revisarScroll, { passive: true });
  revisarScroll();

  // 2. Menú hamburguesa (pantallas de menos de 980 px)
  var boton = document.querySelector(".menu-boton");
  var menu = document.getElementById("menu");
  if (boton && menu) {
    boton.addEventListener("click", function () {
      var abierto = menu.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
      boton.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        menu.classList.remove("abierto");
        boton.setAttribute("aria-expanded", "false");
        boton.setAttribute("aria-label", "Abrir menú");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("abierto")) {
        menu.classList.remove("abierto");
        boton.setAttribute("aria-expanded", "false");
        boton.focus();
      }
    });
  }

  // 3. Enlaces externos: ícono + texto oculto para lectores de pantalla
  var icono = '<svg class="externo-icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
  document.querySelectorAll('a[href^="http"]').forEach(function (a) {
    if (a.hostname === location.hostname) return;
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
    if (!a.hasAttribute("data-sin-icono")) a.insertAdjacentHTML("beforeend", icono);
    a.insertAdjacentHTML("beforeend", '<span class="sr-only"> (se abre en una pestaña nueva)</span>');
  });

  // 4. Pasos que se llenan de color al entrar en pantalla
  var pasos = document.querySelectorAll(".paso");
  if ("IntersectionObserver" in window && pasos.length) {
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("visible"); obs.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    pasos.forEach(function (p) { obs.observe(p); });
  } else {
    pasos.forEach(function (p) { p.classList.add("visible"); });
  }

  // 5. Horario de atención (hora de Lima): lunes a viernes, 9:00 a. m. a 4:00 p. m.
  function enHorario() {
    try {
      var partes = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/Lima", weekday: "short", hour: "numeric", hour12: false
      }).formatToParts(new Date());
      var dia = "", hora = 0;
      partes.forEach(function (p) {
        if (p.type === "weekday") dia = p.value;
        if (p.type === "hour") hora = parseInt(p.value, 10) % 24;
      });
      return ["Mon", "Tue", "Wed", "Thu", "Fri"].indexOf(dia) > -1 && hora >= 9 && hora < 16;
    } catch (e) { return null; }
  }
  var abierto = enHorario();
  document.querySelectorAll("[data-estado]").forEach(function (el) {
    if (abierto === null) return;
    el.textContent = abierto ? "Disponible ahora" : "Fuera de horario: déjanos tu mensaje";
    el.classList.toggle("activo", abierto);
  });

  // 6. "Consultar este tema": baja al formulario con el tema elegido
  var selectTema = document.getElementById("tema");
  document.querySelectorAll("[data-tema]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (selectTema) selectTema.value = b.getAttribute("data-tema");
    });
  });

  // 7. Formulario: validación en español y asunto según el tema
  var form = document.getElementById("form-consulta");
  if (form) {
    var asunto = form.querySelector('input[name="_subject"]');
    function marcar(campo, malo) {
      var caja = campo.closest(".campo") || campo.closest(".consentimiento");
      if (caja) caja.classList.toggle("con-error", malo);
      campo.setAttribute("aria-invalid", malo ? "true" : "false");
    }
    function valido(campo) {
      if (campo.type === "checkbox") return campo.checked;
      var v = campo.value.trim();
      if (!v) return false;
      if (campo.type === "email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      if (campo.type === "tel") return v.replace(/\D/g, "").length >= 7;
      return true;
    }
    var requeridos = form.querySelectorAll("[required]");
    requeridos.forEach(function (c) {
      c.addEventListener("blur", function () { if (c.value || c.type === "checkbox") marcar(c, !valido(c)); });
      c.addEventListener("input", function () { if (valido(c)) marcar(c, false); });
      c.addEventListener("change", function () { if (valido(c)) marcar(c, false); });
    });
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (e) {
      var primero = null;
      requeridos.forEach(function (c) {
        var ok = valido(c);
        marcar(c, !ok);
        if (!ok && !primero) primero = c;
      });
      if (primero) { e.preventDefault(); primero.focus(); return; }
      if (asunto && selectTema) {
        asunto.value = "Nueva consulta web — " + (selectTema.value || "Sin tema");
      }
      if (typeof window.gtag === "function") window.gtag("event", "envio_formulario", { tema: selectTema ? selectTema.value : "" });
    });
  }

  // 8. Analítica: clics en WhatsApp y en videos (solo si GA4 está activo)
  document.addEventListener("click", function (e) {
    if (typeof window.gtag !== "function") return;
    var a = e.target.closest("a");
    if (!a) return;
    if (a.href.indexOf("wa.me") > -1) window.gtag("event", "clic_whatsapp");
    if (a.closest(".video")) window.gtag("event", "clic_video", { video: a.getAttribute("data-video") || a.href });
  });

  // Año en el pie
  var anio = document.getElementById("anio");
  if (anio) anio.textContent = new Date().getFullYear();
})();
