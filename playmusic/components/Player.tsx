// components/Player.tsx

'use client'; // ⚠️ Indica que este componente é client-side no Next.js (necessário para hooks como useState, useEffect).

// 1. Importações de Bibliotecas e Dados
import { useState, useRef, useEffect, useCallback } from 'react'; // Hooks do React
import Image from 'next/image'; // Componente otimizado de imagem do Next.js
import playlist, { Track } from '../lib/playlist'; // Importa a playlist e o tipo Track

// Tipo auxiliar para eventos de slider (corrige tipos no TypeScript)
type SeekHandler = (
  e:
    | React.MouseEvent<HTMLInputElement>
    | React.TouchEvent<HTMLInputElement>
    | React.ChangeEvent<HTMLInputElement>
) => void;

// Componente Player
const Player: React.FC = () => {
  // 1. GERENCIAMENTO DE ESTADO
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0); // Índice da música atual
  const [isPlaying, setIsPlaying] = useState(false); // Controle de play/pause
  const [currentTime, setCurrentTime] = useState(0); // Tempo atual do áudio
  const [duration, setDuration] = useState(0); // Duração total da música
  const [volume, setVolume] = useState(1); // Volume do áudio (0 a 1)
  const [isVolumeSliderVisible, setIsVolumeSliderVisible] = useState(false); // Mostrar/esconder slider de volume

  // 2. REFS
  const audioRef = useRef<HTMLAudioElement | null>(null); // Referência ao elemento <audio>
  const progressSliderRef = useRef<HTMLInputElement | null>(null); // Referência ao slider de progresso
  const volumeSliderRef = useRef<HTMLInputElement | null>(null); // Referência ao slider de volume

  const currentTrack: Track = playlist[currentTrackIndex]; // Música atual

  // 3. FUNÇÕES DE UTILIDADE
  const formatTime = (time: number): string => {
    // Formata segundos em mm:ss
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Atualiza a cor do slider de acordo com o valor atual (visual)
  const updateSliderColor = useCallback(
    (slider: HTMLInputElement | null, value: number, max: number) => {
      if (!slider || max === 0) return;
      const percent = (value / max) * 100;
      slider.style.background = `linear-gradient(to right, #1ed760 0%, #1ed760 ${percent}%, #535353 ${percent}%, #535353 100%)`;
    },
    []
  );

  // 4. LÓGICA DE CONTROLE

  // Atualiza o tempo do slider enquanto o usuário arrasta
  const handleSeek: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    updateSliderColor(progressSliderRef.current, newTime, duration);
  };

  // Quando o usuário solta o slider, aplica o novo tempo no áudio
  const handleSeekFinished: SeekHandler = (e) => {
    const newTime = parseFloat(e.currentTarget.value);
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = newTime;
  };

  // Alterna entre play e pause
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error('Erro ao tentar reproduzir áudio:', error);
            setIsPlaying(false);
          });
      }
    }
  };

  // Carrega uma música nova e previne AbortError
  const loadTrack = useCallback(
    (index: number, autoPlay: boolean = isPlaying) => {
      setCurrentTrackIndex(index);
      setCurrentTime(0);
      setDuration(0);

      const audio = audioRef.current;
      if (!audio) return;

      audio.src = playlist[index].audioSrc;
      audio.currentTime = 0;
      audio.load();

      if (autoPlay) {
        // Pequeno delay evita erro de interrupção de play
        setTimeout(() => {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch((error) => {
                if (error.name !== 'AbortError') {
                  console.error('Erro ao tentar reproduzir áudio após load:', error);
                }
                setIsPlaying(false);
              });
          }
        }, 150);
      } else {
        setIsPlaying(false);
      }
    },
    [isPlaying]
  );

  // Próxima música
  const handleNext = () => {
    const nextIndex = (currentTrackIndex + 1) % playlist.length;
    loadTrack(nextIndex, true);
  };

  // Música anterior
  const handlePrev = () => {
    const prevIndex = (currentTrackIndex - 1 + playlist.length) % playlist.length;
    loadTrack(prevIndex, true);
  };

  // Alteração de volume
  const handleVolumeChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = newVolume;
    setVolume(newVolume);
    updateSliderColor(volumeSliderRef.current, newVolume, 1);
  };

  // Define volume inicial em 50%
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = 0.5;
    }
    setVolume(0.5);
    if (volumeSliderRef.current) {
      updateSliderColor(volumeSliderRef.current, 0.5, 1);
    }
  }, [updateSliderColor]);

  // 5. EFEITOS DE ÁUDIO (eventos do <audio>)
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

    const onEnded = () => handleNext();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Cleanup
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [currentTrackIndex, volume, currentTime, updateSliderColor]);

  // Atualiza cor dos sliders quando volume ou progresso mudam
  useEffect(() => {
    if (progressSliderRef.current && volumeSliderRef.current) {
      updateSliderColor(volumeSliderRef.current, volume, 1);
      if (duration > 0) {
        updateSliderColor(progressSliderRef.current, currentTime, duration);
      }
    }
  }, [currentTime, duration, volume, updateSliderColor]);

  // Ícone dinâmico de volume
  const getVolumeIcon = () => {
    if (volume > 0.5) return <i className="fas fa-volume-up"></i>;
    if (volume > 0) return <i className="fas fa-volume-down"></i>;
    return <i className="fas fa-volume-mute"></i>;
  };

  // 7. RENDERIZAÇÃO (JSX)
  return (
    <div className="player-card">
      {/* Capa do álbum */}
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

      {/* Informações da música */}
      <div className="info">
        <h2 className="title">{currentTrack.title}</h2>
        <p className="subtitle">{currentTrack.subtitle}</p>
      </div>

      {/* Barra de progresso */}
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
          onChange={handleSeek}
          onMouseUp={handleSeekFinished}
          onTouchEnd={handleSeekFinished}
          aria-label="Controle de Progresso da Música"
        />
        <span className="total-time">{formatTime(duration)}</span>
      </div>

      {/* Controles de reprodução */}
      <div className="controls">
        <button className="control-button" onClick={handlePrev} aria-label="Música Anterior">
          <i className="fas fa-backward"></i>
        </button>
        <button
          className="control-button play-pause"
          onClick={togglePlayPause}
          aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
        >
          {isPlaying ? (
            <i className="fas fa-pause play-pause-icon"></i>
          ) : (
            <i className="fas fa-play play-pause-icon"></i>
          )}
        </button>
        <button className="control-button" onClick={handleNext} aria-label="Próxima Música">
          <i className="fas fa-forward"></i>
        </button>

        {/* Controle de volume */}
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

      {/* Elemento de áudio real */}
      <audio id="audio" ref={audioRef} src={currentTrack.audioSrc}></audio>
    </div>
  );
};

export default Player;
