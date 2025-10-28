// lib/playlist.ts

// 1. Definição da Interface (Contrato de Dados)
// A interface 'Track' define a estrutura exata (o "molde") que cada objeto de música deve seguir.
// Isso garante que o TypeScript valide se todos os objetos da 'playlist' possuem as propriedades
// esperadas (title, subtitle, audioSrc, coverSrc) e que elas são do tipo string.
export interface Track {
    title: string;      // O título da música.
    subtitle: string;   // O nome do artista ou artistas.
    audioSrc: string;   // O caminho (URL) para o arquivo de áudio (.mp3).
    coverSrc: string;   // O caminho (URL) para a imagem de capa (.png).
}

// 2. Definição da Playlist (O Array de Objetos)
// A constante 'playlist' é um array de objetos que segue o contrato definido pela interface 'Track'.
// 'export' permite que este array seja importado e usado em outros arquivos, como Player.tsx.
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
        subtitle: "MC H, MC R, DJ A, MC D, MC S e Djay W",
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
        title: "Seis cordas",
        subtitle: "Wesley Safadão",
        audioSrc: "/assets/audio/6cordas.mp3",
        coverSrc: "/assets/imagens/6cordas.png"
    }
];

// 3. Exportação Padrão
// Exporta o array 'playlist' como o valor principal do módulo, permitindo que ele seja 
export default playlist;