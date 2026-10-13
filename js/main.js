import { buscarPeliculas, obtenerDetalles, obtenerPopulares } from "./api.js";

let pelis = [];
let pagina = 0;
let totalPaginas = 1;
let busqueda = "";
let favoritos = false; 

// DOM
const rejilla = document.querySelector("#rejilla");
const estado = document.querySelector("#estado");
const btnMas = document.querySelector("#mas");
const form = document.querySelector("#form-buscar");
const inputBuscar = document.querySelector("#buscar");
const panel = document.querySelector("#detalle");

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

// VISTAƒ
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

    // Póster de la película pulsada, dentro del modal
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
        estado.textContent = `${pelis.length} peliculas * media ${notaMedia}, * pagina ${pagina} de ${totalPaginas}`;
        const titulo = busqueda ? `"${busqueda}"` : "populares";
        estado.textContent = `${pelis.length} peliculas * ${titulo} * media ${notaMedia} * pagina ${pagina} de ${totalPaginas}`;

    } catch (error) {
        mostrarError(error.message);
    } finally {
        btnMas.disabled = false;
        btnMas.hidden = pagina >= totalPaginas;
    }
}

// EVENTOS 
btnMas.addEventListener("click", cargarPagina);
form.addEventListener("submit", (e) => {
    e.preventDefault();
    empezarDeCero(inputBuscar.value.trim());
}
);

async function abrir(card) {
    const datos = await obtenerDetalles(card.dataset.id); // tu función real
    pintarDetalle(datos);
    modal.showModal();
}

rejilla.addEventListener("click", (e) => {
    if (e.target.closest(".btn-fav")) return;   // el favorito va aparte
    const card = e.target.closest(".card");
    if (card) abrir(card);
});

modal.addEventListener("click", (e) => {
    // X, o clic en la zona oscura (fuera del contenido)
    if (e.target.closest(".cerrar") || e.target === modal) modal.close();
});

// ARRANQUE
panel.hidden = false;
cargarPagina();

function empezarDeCero(texto) {
    busqueda = texto;
    pelis = [];
    pagina = 0;
    totalPaginas = 1;
    cargarPagina();
}

function alternarFavoritos(id){
    if(esFavorita(id)){
        favoritos = favoritos.filter(f => f.id !== id);
    } else{
        const peli = pelis.find(p => p.id === id);
        if (peli) favoritos = [...favoritos, peli]; 
    }
    guardarFavoritos(favoritos);
    pintarRejilla();
}
