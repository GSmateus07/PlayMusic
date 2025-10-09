// components/Player.tsx

// manipula eventos do navegador (como clique, mouseup) e acessa o DOM (audioRef).
'use client'; 

// 1. Importações de Bibliotecas e Dados
import { useState, useRef, useEffect, useCallback } from 'react'; // Hooks essenciais do React
import Image from 'next/image'; // Componente Next/Image para otimização de imagem
import playlist, { Track } from '../lib/playlist'; // Importa a playlist e a interface Track

// Definição de um tipo customizado (SeekHandler) para o evento de MouseUp/TouchEnd.
// Isso corrige o erro do TypeScript (visto anteriormente) porque MouseEvent e TouchEvent
// não são compatíveis com ChangeEvent, mas precisamos acessar o valor do input.
type SeekHandler = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => void;


const Player: React.FC = () => {
    // 1. GERENCIAMENTO DE ESTADO
    // Variáveis que o React monitora para redesenhar o componente
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0); // Índice da música atual na playlist
    const [isPlaying, setIsPlaying] = useState(false); // Indica se a música está tocando (true/false)
    const [currentTime, setCurrentTime] = useState(0); // Tempo de reprodução atual em segundos
    const [duration, setDuration] = useState(0); // Duração total da música
    const [volume, setVolume] = useState(1); // Volume atual (0.0 a 1.0)
    const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false); // Controla a visibilidade do slider de volume

    // 2. REFS para elementos DOM
    // useRef é usado para acessar diretamente elementos nativos do DOM (como <audio> e <input>)
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressSliderRef = useRef<HTMLInputElement | null>(null);
    const volumeSliderRef = useRef<HTMLInputElement | null>(null);

    // Obtém o objeto da faixa atual com base no índice
    const currentTrack: Track = playlist[currentTrackIndex];

    // 3. FUNÇÕES DE UTILIDADE
    // Formata o tempo (segundos) para o formato Minutos:Segundos
    const formatTime = (time: number): string => {
        if (isNaN(time) || time < 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    // Função que aplica o gradiente CSS para pintar o slider de verde (o progresso)
    const updateSliderColor = useCallback((slider: HTMLInputElement | null, value: number, max: number) => {
        if (!slider || max === 0) return;
        const percent = (value / max) * 100;
        // Usa linear-gradient para criar a barra verde preenchida dinamicamente
        slider.style.background = `linear-gradient(to right, #1ed760 0%, #1ed760 ${percent}%, #535353 ${percent}%, #535353 100%)`;
    }, []);

    // 4. LÓGICA DE CONTROLE
    
    // NOVO: Atualiza o estado de tempo APENAS VISUALMENTE durante o arrasto do slider (onChange)
    const handleSeek: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime); // Atualiza o tempo exibido no span e o valor do slider
        updateSliderColor(progressSliderRef.current, newTime, duration); // Atualiza a cor
    };

    // NOVO: Define o tempo nativo do áudio APENAS quando o arrasto termina (onMouseUp/onTouchEnd)
    const handleSeekFinished: SeekHandler = (e) => {
        const newTime = parseFloat(e.currentTarget.value);
        const audio = audioRef.current;
        if (!audio) return;
        
        audio.currentTime = newTime; // Define o tempo de reprodução real do elemento <audio>
    };

    // Função para alternar entre Play e Pause
    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            // Tratamento de Promise para lidar com o bloqueio de Autoplay do navegador
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true); // SUCESSO: Altera o estado para Play
                }).catch(error => {
                    console.error("Erro ao tentar reproduzir áudio (Bloqueio Autoplay):", error);
                    setIsPlaying(false); // FALHA: Mantém o estado como Pausado
                });
            }
        }
    };
    
    // Função para carregar uma nova faixa
    const loadTrack = useCallback((index: number, autoPlay: boolean = isPlaying) => {
        setCurrentTrackIndex(index);
        setCurrentTime(0);
        setDuration(0); 
        
        const audio = audioRef.current;
        if (!audio) return;

        audio.src = playlist[index].audioSrc; 
        audio.currentTime = 0; 
        audio.load(); // Força o elemento a carregar os novos metadados

        // Tenta tocar automaticamente se autoPlay for true
        if (autoPlay) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                }).catch(error => {
                    console.error("Erro ao tentar reproduzir áudio após load:", error);
                    setIsPlaying(false);
                });
            } else {
                 setIsPlaying(true);
            }
        } else {
            setIsPlaying(false);
        }
    }, [isPlaying]);

    const handleNext = () => {
        const nextIndex = (currentTrackIndex + 1) % playlist.length; // Loop de volta para a primeira
        loadTrack(nextIndex, true);
    };

    const handlePrev = () => {
        const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length; // Loop de volta para a última
        loadTrack(prevIndex, true);
    };

    const handleVolumeChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const newVolume = parseFloat(e.target.value);
        const audio = audioRef.current;
        if (!audio) return;
        
        audio.volume = newVolume;
        setVolume(newVolume);
        updateSliderColor(volumeSliderRef.current, newVolume, 1);
    };
    
    // 5. EFECTS (Lógica de Eventos de Áudio)

    // Este useEffect configura e remove os event listeners nativos do elemento <audio>
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = volume;

        // Lógica de atualização do tempo e da cor do slider
        const onTimeUpdate = () => {
            if (audio.currentTime !== currentTime && audio.duration) {
                setCurrentTime(audio.currentTime);
                updateSliderColor(progressSliderRef.current, audio.currentTime, audio.duration);
            }
        };

        // Lógica para capturar a duração total da música após o carregamento
        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            updateSliderColor(progressSliderRef.current, audio.currentTime, audio.duration);
        };

        // Lógica para ir para a próxima música quando a atual terminar
        const onEnded = () => {
            handleNext();
        };

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);


        // Adiciona os listeners
        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);
        
        // Função de limpeza: remove os listeners ao desmontar o componente ou trocar a faixa
        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, [currentTrackIndex, volume, currentTime, updateSliderColor]); 

    // useEffect para garantir que a cor inicial dos sliders seja aplicada
    useEffect(() => {
        if (progressSliderRef.current && volumeSliderRef.current) {
            updateSliderColor(volumeSliderRef.current, volume, 1);
            if (duration > 0) {
                 updateSliderColor(progressSliderRef.current, currentTime, duration);
            }
        }
    }, [currentTime, duration, volume, updateSliderColor]);

    // 6. LÓGICA DO ÍCONE DE VOLUME
    // Decide qual ícone de Font Awesome mostrar (Alto, Baixo, Mudo) baseado no estado 'volume'
    const getVolumeIcon = () => {
        if (volume > 0.5) {
            return <i className="fas fa-volume-up"></i>;
        } else if (volume > 0) {
            return <i className="fas fa-volume-down"></i>;
        } else {
            return <i className="fas fa-volume-mute"></i>;
        }
    };


    // 7. RENDERIZAÇÃO (JSX)
    return (
        <div className="player-card">
            <div className="header">
                {/* Componente Next/Image: Exibe a capa da música, com alt text para acessibilidade */}
                <Image
                    src={currentTrack.coverSrc}
                    alt={`Capa do Áudio: ${currentTrack.title}`} 
                    className="cover-image"
                    width={350} 
                    height={350}
                    priority // Carrega esta imagem o mais rápido possível
                />
            </div>
            
            <div className="info">
                <h2 className="title">{currentTrack.title}</h2>
                <p className="subtitle">{currentTrack.subtitle}</p>
            </div>

            <div className="progress-bar-container">
                {/* Tempo de reprodução atual */}
                <span className="current-time">{formatTime(currentTime)}</span>
                
                {/* SLIDER DE PROGRESSO */}
                <input
                    type="range"
                    id="progress-slider"
                    ref={progressSliderRef}
                    min="0"
                    max={duration || 100} 
                    value={currentTime}
                    step="0.01"
                    onChange={handleSeek} // Atualização visual (enquanto arrasta)
                    onMouseUp={handleSeekFinished} // Atualização de áudio (ao soltar o mouse)
                    onTouchEnd={handleSeekFinished} // Atualização de áudio (ao soltar o toque)
                    aria-label="Controle de Progresso da Música" // Acessibilidade
                />
                
                {/* Duração total da música */}
                <span className="total-time">{formatTime(duration)}</span>
            </div>

            <div className="controls">
                {/* Botão de Música Anterior */}
                <button className="control-button" onClick={handlePrev} aria-label="Música Anterior">
                    <i className="fas fa-backward"></i>
                </button>
                {/* Botão de Play/Pause */}
                <button className="control-button play-pause" onClick={togglePlayPause} aria-label={isPlaying ? "Pausar" : "Reproduzir"}>
                    {/* Renderização condicional do ícone (Play ou Pause) */}
                    {isPlaying ? (
                        <i className="fas fa-pause play-pause-icon"></i>
                    ) : (
                        <i className="fas fa-play play-pause-icon"></i>
                    )}
                </button>
                {/* Botão de Próxima Música */}
                <button className="control-button" onClick={handleNext} aria-label="Próxima Música">
                    <i className="fas fa-forward"></i>
                </button>
                
                {/* CONTROLE DE VOLUME */}
                <div className="volume-control">
                    {/* Botão para alternar a visibilidade do slider */}
                    <button
                        className="control-button volume-button"
                        onClick={() => setIsVolumeSliderVisible(!isVolumeSliderVisible)}
                        aria-label="Alternar Visibilidade do Controle de Volume"
                    >
                        {getVolumeIcon()}
                    </button>
                    {/* Slider de Volume (renderizado condicionalmente) */}
                    {isVolumeSliderVisible && (
                        <input
                            type="range"
                            className="volume-slider" 
                            ref={volumeSliderRef}
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            aria-label="Controle de Volume"
                        />
                    )}
                </div>
            </div>
            {/* Elemento nativo de áudio (o "motor" do player), invisível, controlado pelo React */}
            <audio id="audio" ref={audioRef} src={currentTrack.audioSrc}></audio>
        </div>
    );
};

export default Player;