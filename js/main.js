import { buscarPeliculas, obtenerDetalles, obtenerPopulares } from "./api.js";

let pelis = [];
let pagina = 0;
let totalPaginas = 1;
let busqueda = "";

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
function pintarRejilla() {
    rejilla.innerHTML = "";
    if (pelis.length === 0) {
        rejilla.textContent = "Sin resultados";
        return;
    }
    pelis.forEach(peli => rejilla.append(peli.toCard(esFavorita(peli.id))));
}

function pintarDetalle({ peli, director, reparto }) {
    const { titulo, anio, nota, duracion, generos, descripcion, posterUrl } = peli;
    modal.innerHTML = "";

    const cerrarBtn = document.createElement("button");
    cerrarBtn.className = "cerrar";
    cerrarBtn.textContent = "X";

    const contenido = document.createElement("div");
    contenido.className = "modal-contenido";

    const posterBox = document.createElement("div");
    posterBox.className = "modal-poster";
    if (posterUrl) {
        const img = document.createElement("img");
        img.src = posterUrl;
        img.alt = `Poster de ${titulo}`;
        posterBox.append(img);
    }

    const info = document.createElement("div");
    info.className = "modal-info";

    const h2 = document.createElement("h2");
    h2.textContent = `${titulo} (${anio})`;

    const entrada = document.createElement("p");
    entrada.textContent = `Descripcion: ${descripcion}`;

    const datos = document.createElement("p");
    datos.textContent = `${nota.toFixed(1)} * ${duracion ?? "¿?"} min * ${generos.join(", ") || "---"}`;

    const dir = document.createElement("p");
    dir.textContent = `Director: ${director}`;

    const rep = document.createElement("p");
    rep.textContent = `Reparto: ${reparto.join(", ") || "---"}`;

    info.append(h2, entrada, datos, dir, rep);
    contenido.append(posterBox, info);
    modal.append(cerrarBtn, contenido);
}

// CARGA DE DATOS
async function cargarPagina() {
    btnMas.disabled = true;
    estado.textContent = "Cargando";
    estado.classList.remove("error");
    try {
        const siguiente = pagina + 1;
        const { pelis: nuevas, totalPaginas: total } = busqueda
            ? await buscarPeliculas(busqueda, siguiente)
            : await obtenerPopulares(siguiente);

        pelis = [...pelis, ...nuevas];
        pagina = siguiente;
        totalPaginas = total;

        pintarRejilla();
        const notaMedia = media(...pelis.map(p => p.nota)).toFixed(1);
        const etiqueta = busqueda ? `"${busqueda}"` : "populares";
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