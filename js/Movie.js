export default class Pelicula {
    constructor({id, titulo, anio, nota, poster = null, duracion = null, generos = [] , descripcion = null}){
        this.id = id;
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.anio = anio;
        this.nota = nota;
        this.poster = poster;
        this.duracion = duracion;
        this.generos = generos;
    }

    get posterUrl() {
        if(!this.poster) return null;
        return `https://image.tmdb.org/t/p/w342${this.poster}`;
    }

    static desdeTMDB({id, title, release_date, vote_average, poster_path, runtime, genres, overview}) {
        const anio = release_date ? release_date.slice(0, 4) : "----";
        return new Pelicula({
            id, 
            titulo: title,
            descripcion: overview,
            anio: release_date?.slice(0,4) || "----", 
            nota: vote_average || 0, 
            poster: poster_path ?? null,
            duracion: runtime ?? null,
            generos: genres?.map(g => g.name)  ?? [],
    });
    }

    toCard(esFavorita = false) {
    const card = document.createElement("article");
    card.className = "card";
    card.dataset.id = this.id;

    // Contenedor del póster + título superpuesto
    const posterWrap = document.createElement("div");
    posterWrap.className = "poster-wrap";

    if (this.posterUrl) {
        const img = document.createElement("img");
        img.src = this.posterUrl;
        img.alt = `Poster de ${this.titulo}`;
        posterWrap.append(img);
    } else {
        const hueco = document.createElement("div");
        hueco.className = "sin-poster";
        hueco.textContent = "Peli";
        posterWrap.append(hueco);
    }

    const titulo = document.createElement("h3");
    titulo.className = "card-titulo";
    titulo.textContent = this.titulo;
    posterWrap.append(titulo);

    const info = document.createElement("p");
    info.textContent = `${this.anio} * ${this.nota.toFixed(1)}`;

    const fav = document.createElement("button");
    fav.className = "btn-fav";
    fav.textContent = esFavorita ? "*" : "+";
    fav.title = esFavorita ? "Quitar de favoritas" : "Añadir a favoritos";

    card.append(posterWrap, info, fav);
    return card;

}

}