const $ = (selector) => document.querySelector(selector);
const areas = {
  Académico: "área académica",
  Eventos: "Eventos",
  Deportes: "Deportes",
  Servicios: "Servicios",
};
const campusConfig = window.CAMPUS_CONFIG || {};
const apiUrl = campusConfig.apiUrl ||
  (["localhost", "127.0.0.1"].includes(location.hostname)
    ? "http://localhost:3000"
    : "");
let db,
  posts = [],
  filter = "Todos",
  installPrompt,
  toastTimer,
  draftTimer;
const storage = {
  get(key) {
    return new Promise((resolve, reject) => {
      const r = db.transaction("data").objectStore("data").get(key);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
  },
  set(key, value) {
    return new Promise((resolve, reject) => {
      const tx = db.transaction("data", "readwrite");
      tx.objectStore("data").put(value, key);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  },
};
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("#toast").hidden = true), 5500);
}
function make(tag, className, text) {
  const node = document.createElement(tag);
  node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function authorForCategory(category) {
  return `Representante de ${(areas[category] || "área académica").toLocaleLowerCase("es")}`;
}
function avatarPath(category) {
  const avatars = {
    Académico: "academico",
    Eventos: "eventos",
    Deportes: "deportes",
    Servicios: "cafeteria",
  };
  return new URL(
    `./img/avatars/${avatars[category] || "academico"}.jpg`,
    document.baseURI,
  ).href;
}
function render() {
  const query = $("#search").value.toLocaleLowerCase("es");
  const visible = posts.filter(
    (p) =>
      (filter === "Todos" ||
        (filter === "Guardados" ? p.saved : p.category === filter)) &&
      `${p.title} ${p.body} ${authorForCategory(p.category)}`
        .toLocaleLowerCase("es")
        .includes(query),
  );
  $("#feed-title").textContent = filter === "Todos" ? "En el campus" : filter;
  $("#count").textContent =
    `${visible.length} aviso${visible.length === 1 ? "" : "s"}`;
  $("#feed").replaceChildren();
  for (const p of visible) {
    const article = make("article", "post");
    article.id = `aviso-${p.id}`;
    const head = make("div", "post-head");
    const img = make("img", "avatar");
    img.src = avatarPath(p.category);
    img.alt = "";
    img.width = 40;
    img.height = 40;
    const by = make("div", "");
    by.append(make("p", "author", authorForCategory(p.category)));
    const time = make(
      "time",
      "",
      new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(p.created)),
    );
    time.dateTime = p.created;
    by.append(time);
    head.append(img, by, make("span", "tag", p.category));
    const footer = make("div", "post-footer");
    footer.append(make("span", "", "Disponible sin conexión"));
    const save = make("button", "save", p.saved ? "♥ Guardado" : "♡ Guardar");
    save.setAttribute("aria-pressed", String(!!p.saved));
    save.setAttribute(
      "aria-label",
      `${p.saved ? "Quitar de guardados" : "Guardar"}: ${p.title}`,
    );
    save.onclick = async () => {
      const previous = p.saved;
      p.saved = !p.saved;
      try {
        await storage.set("posts", posts);
        render();
      } catch {
        p.saved = previous;
        toast("No se pudo guardar el cambio.");
      }
    };
    footer.append(save);
    article.append(
      head,
      make("h3", "", p.title),
      make("p", "body", p.body),
      footer,
    );
    $("#feed").append(article);
  }
  if (!visible.length)
    $("#feed").append(
      make(
        "p",
        "empty",
        "No hay avisos aquí todavía. Comparte el primero o prueba otra búsqueda.",
      ),
    );
}
function connection() {
  const status = $("#connection");
  const label = navigator.onLine ? "Conectado" : "Sin conexión";
  status.setAttribute("aria-label", label);
  status.title = label;
  status.classList.toggle("offline", !navigator.onLine);
}
async function notification(post) {
  if (
    !("Notification" in window) ||
    Notification.permission !== "granted" ||
    !("serviceWorker" in navigator)
  )
    return;
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification(
      `${authorForCategory(post.category)} · ${post.title}`,
      {
        body: post.body,
        icon: new URL("./img/icons/icon-192.jpg", document.baseURI).href,
        tag: post.id,
        data: { url: new URL(`./#aviso-${post.id}`, location.href).href },
      },
    );
  } catch {
    toast("Aviso guardado. El navegador no pudo mostrar la notificación.");
  }
}
function draftData() {
  return {
    title: $("#post-title").value,
    body: $("#post-body").value,
    category: $("#category").value,
  };
}
let draftWrites = Promise.resolve();
function writeDraft(value) {
  draftWrites = draftWrites
    .catch(() => {})
    .then(() => storage.set("draft", value));
  return draftWrites;
}
async function saveDraft() {
  try {
    await writeDraft(draftData());
    $("#draft-status").textContent = "Borrador guardado en este dispositivo.";
  } catch {
    $("#draft-status").textContent = "No se pudo guardar el borrador.";
  }
}
$("#compose").onclick = () => $("#editor").showModal();
$("#close-editor").onclick = async () => {
  clearTimeout(draftTimer);
  await saveDraft();
  $("#editor").close();
};
$("#editor").addEventListener("cancel", () => {
  clearTimeout(draftTimer);
  void saveDraft();
});
$("#post-form").addEventListener("input", () => {
  clearTimeout(draftTimer);
  draftTimer = setTimeout(saveDraft, 250);
});
$("#discard").onclick = async () => {
  clearTimeout(draftTimer);
  try {
    await writeDraft(null);
    $("#post-form").reset();
    $("#draft-status").textContent = "Borrador descartado.";
  } catch {
    toast("No se pudo descartar el borrador.");
  }
};
$("#post-form").onsubmit = async (event) => {
  event.preventDefault();
  const title = $("#post-title").value.trim(),
    body = $("#post-body").value.trim();
  if (!title || !body) {
    toast("Escribe un título y un mensaje.");
    return;
  }
  const submit = $("#post-form button[type=submit]");
  submit.disabled = true;
  clearTimeout(draftTimer);
  const post = {
    id: crypto.randomUUID(),
    title,
    body,
    category: $("#category").value,
    created: new Date().toISOString(),
    saved: false,
  };
  try {
    await storage.set("posts", [post, ...posts]);
    posts.unshift(post);
    await writeDraft(null);
    $("#post-form").reset();
    $("#editor").close();
    filter = "Todos";
    document
      .querySelectorAll("[data-filter]")
      .forEach((b) =>
        b.classList.toggle("active", b.dataset.filter === filter),
      );
    $("#search").value = "";
    render();
    toast(
      navigator.onLine
        ? "Aviso publicado en este dispositivo."
        : "Aviso guardado sin conexión en este dispositivo.",
    );
    void notification(post);
    if (apiUrl && navigator.onLine) {
      try {
        const response = await fetch(`${apiUrl}/api/push`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${authorForCategory(post.category)} · ${title}`,
            body,
          }),
        });
        if (!response.ok) throw new Error("Push no enviado");
      } catch {
        toast("Aviso guardado; no se pudo enviar la notificación a otros dispositivos.");
      }
    }
  } catch {
    toast("No se pudo guardar el aviso. Tu texto sigue en el formulario.");
  } finally {
    submit.disabled = false;
  }
};
document.querySelectorAll("[data-filter]").forEach(
  (button) =>
    (button.onclick = () => {
      filter = button.dataset.filter;
      document
        .querySelectorAll("[data-filter]")
        .forEach((b) => b.classList.toggle("active", b === button));
      render();
    }),
);
$("#search").oninput = render;
$("#notifications").onclick = async () => {
  if (!("Notification" in window) || !("serviceWorker" in navigator))
    return toast(
      "Este navegador no admite estas notificaciones. Prueba Chrome o Edge.",
    );
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted")
      return toast(
        "Permiso no concedido. Puedes cambiarlo en los ajustes del sitio.",
      );
    const registration = await navigator.serviceWorker.ready;
    if (apiUrl && campusConfig.vapidPublicKey && navigator.onLine && "PushManager" in window) {
      try {
        const key = campusConfig.vapidPublicKey;
        const base64 = (key + "=".repeat((4 - (key.length % 4)) % 4))
          .replace(/-/g, "+")
          .replace(/_/g, "/");
        const subscription = await registration.pushManager.getSubscription() ||
          await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)),
          });
        const response = await fetch(`${apiUrl}/api/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subscription),
        });
        if (!response.ok) throw new Error("Suscripción rechazada");
      } catch {
        toast("Se activaron las notificaciones locales; no se pudo registrar este dispositivo para avisos remotos.");
      }
    }
    await registration.showNotification("¡Ya eres parte de CampusFeed!", {
      body: "Al publicar un aviso verás una notificación aquí.",
      icon: new URL("./img/icons/icon-192.jpg", document.baseURI).href,
      data: { url: new URL("./", location.href).href },
    });
    toast("Notificaciones activadas.");
  } catch {
    toast(
      "No se pudo completar la activación. Revisa el permiso del navegador y el service worker.",
    );
  }
};
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  $("#install").hidden = false;
});
$("#install").onclick = async () => {
  if (!installPrompt) return;
  await installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  $("#install").hidden = true;
};
window.addEventListener("appinstalled", () => {
  $("#install").hidden = true;
  toast("CampusFeed instalada.");
});
window.addEventListener("online", connection);
window.addEventListener("offline", connection);
connection();
async function init() {
  $("#compose").disabled = true;
  try {
    db = await new Promise((resolve, reject) => {
      const r = indexedDB.open("campusfeed", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("data");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    posts = await storage.get("posts");
    if (posts) {
      const cleaned = posts.map(({ profile, ...post }) => post);
      if (
        cleaned.some(
          (post, index) =>
            Object.keys(post).length !== Object.keys(posts[index]).length,
        )
      )
        await storage.set("posts", cleaned);
      posts = cleaned;
    }
    if (!posts) {
      const now = Date.now();
      posts = [
        {
          category: "Académico",
          title: "Un espacio para tu próxima gran idea",
          body: "La biblioteca tiene espacios de estudio para trabajar en equipo. Acércate al mostrador y consulta la disponibilidad.",
          saved: false,
        },
        {
          category: "Deportes",
          title: "Arma tu equipo. El campus te espera.",
          body: "¿Te gustaría participar en un torneo? Comparte aquí tu deporte favorito y encuentra compañeros para formar un equipo.",
          saved: false,
        },
        {
          category: "Servicios",
          title: "Una pausa también es parte del día",
          body: "Este muro es tu punto de encuentro para compartir novedades de la cafetería y otros servicios del campus.",
          saved: false,
        },
      ].map((p, i) => ({
        ...p,
        id: `bienvenida-${i}`,
        created: new Date(now - i * 3600000).toISOString(),
      }));
      await storage.set("posts", posts);
    }
    const draft = await storage.get("draft");
    if (draft) {
      $("#post-title").value = draft.title;
      $("#post-body").value = draft.body;
      $("#category").value = draft.category;
      $("#draft-status").textContent = "Recuperamos tu borrador guardado.";
    }
    render();
    $("#compose").disabled = false;
    if (location.hash)
      document.getElementById(location.hash.slice(1))?.scrollIntoView();
  } catch {
    toast(
      "No se pudo abrir el almacenamiento local. Permite los datos del sitio y recarga.",
    );
  }
}
if ("serviceWorker" in navigator)
  navigator.serviceWorker
    .register("./sw.js")
    .catch(() =>
      toast(
        "No se pudo activar el modo offline. Abre la app desde localhost o HTTPS.",
      ),
    );
void init();
