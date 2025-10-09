// components/Player.tsx
'use client'; 

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import playlist, { Track } from '../lib/playlist';

// Definição de um tipo customizado para o evento de MouseUp/TouchEnd
// Isso permite que o TypeScript aceite eventos que não são ChangeEvent
type SeekHandler = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => void;


const Player: React.FC = () => {
    // 1. GERENCIAMENTO DE ESTADO
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false);

    // 2. REFS para elementos DOM
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const progressSliderRef = useRef<HTMLInputElement | null>(null);
    const volumeSliderRef = useRef<HTMLInputElement | null>(null);

    const currentTrack: Track = playlist[currentTrackIndex];

    // 3. FUNÇÕES DE UTILIDADE
    const formatTime = (time: number): string => {
        if (isNaN(time) || time < 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const updateSliderColor = useCallback((slider: HTMLInputElement | null, value: number, max: number) => {
        if (!slider || max === 0) return;
        const percent = (value / max) * 100;
        slider.style.background = `linear-gradient(to right, #1ed760 0%, #1ed760 ${percent}%, #535353 ${percent}%, #535353 100%)`;
    }, []);

    // 4. LÓGICA DE CONTROLE
    
    // CORRIGIDO: Tipagem ajustada para aceitar ChangeEvent (usado no JSX)
    const handleSeek: React.ChangeEventHandler<HTMLInputElement> = (e) => {
        const newTime = parseFloat(e.target.value);
        setCurrentTime(newTime);
        updateSliderColor(progressSliderRef.current, newTime, duration);
    };

    // CORRIGIDO: Tipagem ajustada para o tipo customizado (SeekHandler)
    const handleSeekFinished: SeekHandler = (e) => {
        const newTime = parseFloat(e.currentTarget.value); // Use currentTarget para ser seguro
        const audio = audioRef.current;
        if (!audio) return;
        
        audio.currentTime = newTime;
    };

    const togglePlayPause = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            const playPromise = audio.play();
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsPlaying(true);
                }).catch(error => {
                    console.error("Erro ao tentar reproduzir áudio (Bloqueio Autoplay):", error);
                    setIsPlaying(false);
                });
            }
        }
    };
    
    const loadTrack = useCallback((index: number, autoPlay: boolean = isPlaying) => {
        setCurrentTrackIndex(index);
        setCurrentTime(0);
        setDuration(0); 
        
        const audio = audioRef.current;
        if (!audio) return;

        audio.src = playlist[index].audioSrc; 
        audio.currentTime = 0; 
        audio.load(); 
        
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
        const nextIndex = (currentTrackIndex + 1) % playlist.length;
        loadTrack(nextIndex, true);
    };

    const handlePrev = () => {
        const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
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

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        audio.volume = volume;

        const onTimeUpdate = () => {
            if (audio.currentTime !== currentTime && audio.duration) {
                setCurrentTime(audio.currentTime);
                updateSliderColor(progressSliderRef.current, audio.currentTime, audio.duration);
            }
        };

        const onLoadedMetadata = () => {
            setDuration(audio.duration);
            updateSliderColor(progressSliderRef.current, audio.currentTime, audio.duration);
        };

        const onEnded = () => {
            handleNext();
        };

        const onPlay = () => setIsPlaying(true);
        const onPause = () => setIsPlaying(false);


        audio.addEventListener('timeupdate', onTimeUpdate);
        audio.addEventListener('loadedmetadata', onLoadedMetadata);
        audio.addEventListener('ended', onEnded);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPause);

        return () => {
            audio.removeEventListener('timeupdate', onTimeUpdate);
            audio.removeEventListener('loadedmetadata', onLoadedMetadata);
            audio.removeEventListener('ended', onEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPause);
        };
    }, [currentTrackIndex, volume, currentTime, updateSliderColor]); 

    useEffect(() => {
        if (progressSliderRef.current && volumeSliderRef.current) {
            updateSliderColor(volumeSliderRef.current, volume, 1);
            if (duration > 0) {
                 updateSliderColor(progressSliderRef.current, currentTime, duration);
            }
        }
    }, [currentTime, duration, volume, updateSliderColor]);

    // 6. LÓGICA DO ÍCONE DE VOLUME
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
                <Image
                    src={currentTrack.coverSrc}
                    alt={`Capa do Áudio: ${currentTrack.title}`} 
                    className="cover-image"
                    width={350} 
                    height={350}
                    priority
                />
            </div>
            
            <div className="info">
                <h2 className="title">{currentTrack.title}</h2>
                <p className="subtitle">{currentTrack.subtitle}</p>
            </div>

            <div className="progress-bar-container">
                <span className="current-time">{formatTime(currentTime)}</span>
                
                <input
                    type="range"
                    id="progress-slider"
                    ref={progressSliderRef}
                    min="0"
                    max={duration || 100} 
                    value={currentTime}
                    step="0.01"
                    // onChange agora lida com a atualização visual durante o arrasto
                    onChange={handleSeek}
                    // onMouseUp/onTouchEnd usam a nova tipagem e a nova lógica
                    onMouseUp={handleSeekFinished}
                    onTouchEnd={handleSeekFinished}
                    aria-label="Controle de Progresso da Música"
                />
                
                <span className="total-time">{formatTime(duration)}</span>
            </div>

            <div className="controls">
                <button className="control-button" onClick={handlePrev} aria-label="Música Anterior">
                    <i className="fas fa-backward"></i>
                </button>
                <button className="control-button play-pause" onClick={togglePlayPause} aria-label={isPlaying ? "Pausar" : "Reproduzir"}>
                    {isPlaying ? (
                        <i className="fas fa-pause play-pause-icon"></i>
                    ) : (
                        <i className="fas fa-play play-pause-icon"></i>
                    )}
                </button>
                <button className="control-button" onClick={handleNext} aria-label="Próxima Música">
                    <i className="fas fa-forward"></i>
                </button>
                <div className="volume-control">
                    <button
                        className="control-button volume-button"
                        onClick={() => setIsVolumeSliderVisible(!isVolumeSliderVisible)}
                        aria-label="Alternar Visibilidade do Controle de Volume"
                    >
                        {getVolumeIcon()}
                    </button>
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
            <audio id="audio" ref={audioRef} src={currentTrack.audioSrc}></audio>
        </div>
    );
};

export default Player;