import { buscarPeliculas, obtenerDetalles, obtenerPopulares, obtenerPorGenero } from "./api.js";

let pelis = [];
let pagina = 0;
let totalPaginas = 1;
let busqueda = "";
let generoSeleccionado = null;

// DOM
const rejilla = document.querySelector("#rejilla");
const estado = document.querySelector("#estado");
const btnMas = document.querySelector("#mas");
const form = document.querySelector("#form-buscar");
const inputBuscar = document.querySelector("#buscar");
const titulo = document.querySelector("#titulo");

// MODAL
const modal = document.createElement("dialog");
modal.className = "modal-detalle";
document.body.append(modal);

// UTILS
function media(...notas) {
    if (notas.length === 0) return 0;
    return notas.reduce((acc, n) => acc + n, 0) / notas.length;
}

function mostrarError(texto) {
    estado.textContent = `${texto}`;
    estado.classList.add("error");
}

function esFavorita(id) {
    return false;
}

// VISTA


function actualizarCortina() {
    const hayPosters = rejilla.querySelector(".card img") !== null;

    document.body.classList.toggle("generos-abiertos", hayPosters);

    actualizarOrbitaGeneros();
}

function pintarRejilla() {
    rejilla.innerHTML = "";

    if (pelis.length === 0) {
        rejilla.textContent = "Sin resultados";
        actualizarCortina();
        return;
    }

    pelis.forEach(peli => {
        rejilla.append(peli.toCard(esFavorita(peli.id)));
    });

    actualizarCortina();
}


function actualizarOrbitaGeneros() {
    const capa = document.querySelector("#generos-flotantes");
    if (!capa) return;

    const palabras = capa.querySelectorAll(".genero-flotante");

    palabras.forEach(palabra => {
        palabra.classList.remove("genero-debajo");
        palabra.style.removeProperty("--orbita-x");
        palabra.style.removeProperty("left");
        palabra.style.removeProperty("top");
        palabra.style.removeProperty("font-size");
    });
}





function pintarDetalle({ peli, director, reparto, trailerKey, streaming }) {
    const {
        titulo,
        anio,
        nota,
        duracion,
        generos,
        descripcion
    } = peli;

    modal.innerHTML = "";

    const cerrarBtn = document.createElement("button");
    cerrarBtn.className = "cerrar";
    cerrarBtn.textContent = "×";
    cerrarBtn.setAttribute("aria-label", "Cerrar ficha");

    const contenido = document.createElement("div");
    contenido.className = "modal-contenido";

    // TRÁILER
    const hero = document.createElement("div");
    hero.className = "modal-hero";


if (trailerKey) {
    const video = document.createElement("iframe");

    video.src =
        `https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailerKey)}` +
        `?autoplay=1&mute=1&loop=1&playlist=${encodeURIComponent(trailerKey)}` +
        `&controls=1&playsinline=1&rel=0`;

    video.title = `Tráiler de ${titulo}`;
    video.allow = "autoplay; encrypted-media; picture-in-picture";
    video.allowFullscreen = true;
    video.referrerPolicy = "strict-origin-when-cross-origin";

    hero.append(video);
} else {
    const poster = document.createElement("img");

    poster.src = peli.posterUrl;
    poster.alt = `Póster de ${titulo}`;
    poster.className = "modal-poster-grande";

    hero.append(poster);
}


    // DATOS SUPERPUESTOS AL VÍDEO
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";

    const h2 = document.createElement("h2");
    h2.textContent = titulo;

    const meta = document.createElement("p");
    meta.className = "modal-meta";
    meta.textContent =
        `${anio ?? "Año desconocido"} · ${director} · ` +
        `${nota?.toFixed(1) ?? "—"} ★ · ${duracion ?? "—"} min`;

    const generosBox = document.createElement("div");
    generosBox.className = "modal-generos";

    (generos ?? []).forEach(nombre => {
        const etiqueta = document.createElement("span");
        etiqueta.className = "modal-genero";
        etiqueta.textContent = nombre;
        generosBox.append(etiqueta);
    });

    overlay.append(h2, meta, generosBox);
    hero.append(overlay);

    // SINOPSIS
    const sinopsis = document.createElement("section");
    sinopsis.className = "modal-seccion";

    const tituloSinopsis = document.createElement("h3");
    tituloSinopsis.textContent = "Sinopsis";

    const textoSinopsis = document.createElement("p");
    textoSinopsis.textContent =
        descripcion || "No hay sinopsis disponible.";

    sinopsis.append(tituloSinopsis, textoSinopsis);

    // PLATAFORMAS
    const plataformas = document.createElement("section");
    plataformas.className = "modal-seccion";

    const tituloPlataformas = document.createElement("h3");
    tituloPlataformas.textContent = "Dónde verla";

    plataformas.append(tituloPlataformas);

    const grupos = [
        ["Suscripción", streaming?.suscripcion],
        ["Alquiler", streaming?.alquiler],
        ["Compra", streaming?.compra]
    ];

    let hayPlataformas = false;

    grupos.forEach(([nombre, lista]) => {
        if (!lista?.length) return;

        const fila = document.createElement("p");
        fila.className = "modal-plataformas";
        fila.textContent = `${nombre}: ${lista.join(", ")}`;
        plataformas.append(fila);
        hayPlataformas = true;
    });

    if (streaming?.enlace) {
        const enlace = document.createElement("a");
        enlace.className = "modal-enlace";
        enlace.href = streaming.enlace;
        enlace.target = "_blank";
        enlace.rel = "noopener noreferrer";
        enlace.textContent = "Consultar opciones de streaming ↗";
        plataformas.append(enlace);
    } else if (!hayPlataformas) {
        const aviso = document.createElement("p");
        aviso.textContent = "No hay información de streaming disponible.";
        plataformas.append(aviso);
    }

    contenido.append(hero, sinopsis, plataformas);
    modal.append(cerrarBtn, contenido);
}


// CARGA DE DATOS
async function cargarPagina() {
    btnMas.disabled = true;
    estado.textContent = "Cargando";
    estado.classList.remove("error");
    try {
        const siguiente = pagina + 1;
        
        const { pelis: nuevas, totalPaginas: total } = generoSeleccionado !== null
        ? await obtenerPorGenero(generoSeleccionado.id, siguiente)
        : busqueda
        ? await buscarPeliculas(busqueda, siguiente)
        : await obtenerPopulares(siguiente);

        pelis = [...pelis, ...nuevas];
        pagina = siguiente;
        totalPaginas = total;

        pintarRejilla();
        const notaMedia = media(...pelis.map(p => p.nota)).toFixed(1);
        const etiqueta = generoSeleccionado
        ? generoSeleccionado.nombre : busqueda ? `"${busqueda}"` : "populares";
        estado.textContent = `${pelis.length} peliculas * ${etiqueta} * media ${notaMedia} * pagina ${pagina} de ${totalPaginas}`;

    } catch (error) {
        mostrarError(error.message);
    } finally {
        btnMas.disabled = false;
        btnMas.hidden = pagina >= totalPaginas;
    }
}

function empezarDeCero(texto) {
    busqueda = texto;
    generoSeleccionado = null;
    pelis = [];
    pagina = 0;
    totalPaginas = 1;
    cargarPagina();
}

// ABRIR DETALLE (con registros para depurar)
async function abrir(card) {
    console.log("1. abrir() llamado, id:", card.dataset.id);
    try {
        const datos = await obtenerDetalles(card.dataset.id);
        console.log("2. datos recibidos:", datos);
        pintarDetalle(datos);
        console.log("3. modal pintado, hijos:", modal.children.length);
        modal.showModal();
        console.log("4. showModal ejecutado, abierto:", modal.open);
    } catch (error) {
        console.error("FALLO en abrir():", error);
        mostrarError(error.message);
    }
}

// EVENTOS
btnMas.addEventListener("click", cargarPagina);

form.addEventListener("submit", (e) => {
    e.preventDefault();
    empezarDeCero(inputBuscar.value.trim());
});

rejilla.addEventListener("click", (e) => {
    console.log("0. clic en rejilla sobre:", e.target);
    if (e.target.closest(".btn-fav")) return;
    const card = e.target.closest(".card");
    if (card) abrir(card);
});

modal.addEventListener("click", (e) => {
    // X, o clic en la zona oscura (fuera del contenido)
    if (e.target.closest(".cerrar") || e.target === modal) modal.close();
});


modal.addEventListener("close", () => {
    const video = modal.querySelector(".modal-hero iframe");

    if (video) {
        video.src = "about:blank";
    }
});


// TÍTULO: efecto meteorito al hacer scroll
const RECORRIDO = 700;
let esperandoFrame = false;

function actualizarMeteoro() {
    if (!titulo) return;
    const p = Math.min(window.scrollY / RECORRIDO, 1);
    const e = p * p;

    titulo.style.setProperty("--s", 1 + e * 6);            // se acerca (crece)
    titulo.style.setProperty("--x", `${e * 60}vw`);        // sale hacia la derecha
    titulo.style.setProperty("--y", `${e * -15}vh`);       // y un poco hacia arriba
    titulo.style.setProperty("--r", `${p * 300}deg`);      // gira mientras sale
    titulo.style.setProperty("--o", Math.max(0, 1 - Math.max(0, p - 0.5) * 2));
    esperandoFrame = false;
}

window.addEventListener("scroll", () => {
    if (esperandoFrame) return;
    esperandoFrame = true;
    requestAnimationFrame(actualizarMeteoro);
}, { passive: true });

// ARRANQUE
actualizarMeteoro();
cargarPagina();



/* ===================== GÉNEROS FLOTANTES ===================== */

const capaGeneros = document.querySelector("#generos-flotantes");

if (capaGeneros) {
    const generos = [
        { nombre: "CIENCIA FICCIÓN", id: 878 },
        { nombre: "DRAMA", id: 18 },
        { nombre: "COMEDIA", id: 35 },
        { nombre: "ACCIÓN", id: 28 },
        { nombre: "AVENTURA", id: 12 },
        { nombre: "TERROR", id: 27 },
        { nombre: "FANTASÍA", id: 14 },
        { nombre: "ROMANCE", id: 10749 },
        { nombre: "THRILLER", id: 53 },
        { nombre: "ANIMACIÓN", id: 16 },
        { nombre: "MISTERIO", id: 9648 },
        { nombre: "DOCUMENTAL", id: 99 },
        { nombre: "CRIMEN", id: 80 },
        { nombre: "FAMILIAR", id: 10751 },
        { nombre: "MUSICAL", id: 10402 },
        { nombre: "HISTORIA", id: 36 },
        { nombre: "BÉLICO", id: 10752 },
        { nombre: "WESTERN", id: 37 }
    ];

    generos.forEach((genero, indice) => {
        const palabra = document.createElement("a");

        palabra.className = "genero-flotante";
        palabra.textContent = genero.nombre;
        palabra.href = `?genero=${genero.id}`;
        palabra.setAttribute("aria-label", `Ver películas de ${genero.nombre}`);

        palabra.style.setProperty(
            "--posicion-x",
            `${(indice * 37 + 8) % 90}%`
        );

        palabra.style.setProperty(
            "--duracion",
            `${22 + (indice % 6) * 4}s`
        );

        palabra.style.setProperty(
            "--retraso",
            `${-(indice * 3)}s`
        );

        capaGeneros.appendChild(palabra);
    });

    capaGeneros.addEventListener("click", (evento) => {
        const enlace = evento.target.closest(".genero-flotante");

        if (!enlace) return;

        evento.preventDefault();

        const idGenero = Number(
            new URL(enlace.href).searchParams.get("genero")
        );

        const genero = generos.find(item => item.id === idGenero);

        if (!genero) return;

        generoSeleccionado = genero;
        busqueda = "";
        pelis = [];
        pagina = 0;
        totalPaginas = 1;

        cargarPagina();
    });
}
