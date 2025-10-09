// lib/playlist.ts

export interface Track {
    title: string;
    subtitle: string;
    audioSrc: string;
    coverSrc: string;
}

// Estes caminhos utilizam a capitalização EXATA dos arquivos que você forneceu.
const playlist: Track[] = [
    {
        title: "Barulho do Foguete",
        subtitle: "Zé Neto e Cristiano",
        audioSrc: "/assets/audio/BarulhodoFoguete.mp3",
        coverSrc: "/assets/imagens/BarulhodoFoguete.png"
    },
    {
        title: "Oi Balde",
        subtitle: "Zé Neto e Cristiano",
        audioSrc: "/assets/audio/OiBalde.mp3",
        coverSrc: "/assets/imagens/OiBalde.png"
    },
    {
        title: "Ilusão",
        subtitle: "MC Hariel, MC Ryan, DJ Alok, MC Davi, MC Salvador da Rima e Djay W",
        audioSrc: "/assets/audio/Ilusao.mp3",
        coverSrc: "/assets/imagens/Ilusao.png"
    },
    {
        title: "Paraquedas",
        subtitle: "Wesley Safadão",
        audioSrc: "/assets/audio/Paraquedas.mp3",
        coverSrc: "/assets/imagens/Paraquedas.png"
    },
    {
        title: "Pisando na Lua",
        subtitle: "Hungria",
        audioSrc: "/assets/audio/PisandonaLua.mp3",
        coverSrc: "/assets/imagens/PisandonaLua.png"
    },
    {
        title: "Seis cordas / Baião de dois / Cavalo Lampião",
        subtitle: "Wesley Safadão",
        audioSrc: "/assets/audio/6cordas.mp3",
        coverSrc: "/assets/imagens/6cordas.png"
    }
];

export default playlist;