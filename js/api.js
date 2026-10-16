import { API_KEY } from "./config.js";
import Pelicula from "./Movie.js";

const BASE_URL = "https://api.themoviedb.org/3";

async function pedirTMDB(url, params = {}) {                                                
    const query = new URLSearchParams({ api_key: API_KEY, language: "es-ES", ...params });   
    const res = await fetch(`${BASE_URL}${url}?${query}`);                                  
    if (!res.ok) {
        throw new Error(`Error ${res.status}`);
    }
    return res.json();
}

export async function obtenerPopulares(pagina = 1) {
    const { results, total_pages } = await pedirTMDB("/movie/popular", {page: pagina});
    return {
        pelis: results.map(json => Pelicula.desdeTMDB(json)),
        totalPaginas: total_pages,
    }; 
}

export async function buscarPeliculas(texto, pagina = 1) {
    const { results, total_pages } = await pedirTMDB("/search/movie", { query: texto, page: pagina });
    return {
        pelis: results.map(json => Pelicula.desdeTMDB(json)),
        totalPaginas: total_pages,
    };
}

export async function obtenerDetalles(id) {
    const [detalle, creditos, videosData, proveedoresData] =
        await Promise.all([
            pedirTMDB(`/movie/${id}`),
            pedirTMDB(`/movie/${id}/credits`),
            pedirTMDB(`/movie/${id}/videos`),
            pedirTMDB(`/movie/${id}/watch/providers`)
        ]);

    const videos = videosData.results ?? [];

    const trailer =
        videos.find(v =>
            v.site === "YouTube" &&
            v.type === "Trailer" &&
            v.official
        ) ??
        videos.find(v =>
            v.site === "YouTube" &&
            v.type === "Trailer"
        );

    const espana = proveedoresData.results?.ES;

    return {
        peli: Pelicula.desdeTMDB(detalle),

        director:
            creditos.crew.find(p => p.job === "Director")?.name
            ?? "Desconocido",

        reparto: creditos.cast
            .slice(0, 5)
            .map(({ name, character }) => `${name} (${character})`),

        trailerKey: trailer?.key ?? null,

        streaming: {
            enlace: espana?.link ?? null,
            suscripcion: (espana?.flatrate ?? [])
                .map(p => p.provider_name),
            alquiler: (espana?.rent ?? [])
                .map(p => p.provider_name),
            compra: (espana?.buy ?? [])
                .map(p => p.provider_name)
        }
    };
}


/* Obtener películas de un género concreto */
export async function obtenerPorGenero(idGenero, pagina = 1) {
    const { results, total_pages } = await pedirTMDB(
        "/discover/movie",
        {
            with_genres: idGenero,
            sort_by: "popularity.desc",
            page: pagina
        }
    );

    return {
        pelis: results.map(json => Pelicula.desdeTMDB(json)),
        totalPaginas: total_pages
    };
}



