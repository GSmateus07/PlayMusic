'use client';

// Importa Hooks essenciais do React para gerenciamento de estado, referências e performance
import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
// Importa a lista de músicas e o tipo de faixa (Track)
import playlist, { Track } from '../lib/playlist';

// Define um tipo unificado para handlers de eventos que podem ser acionados por mouse, toque ou mudança (como o slider)
type SeekHandler = (
  e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>
) => void;

// Componente principal do Player
const Player: React.FC = () => {
  // ----------------------------------------------------
  // 1. ESTADOS (useState): Gerenciam os dados dinâmicos do player
  // ----------------------------------------------------
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0); // Índice da música atual na playlist
  const [isPlaying, setIsPlaying] = useState(false);             // Se a música está tocando (true) ou pausada (false)
  const [currentTime, setCurrentTime] = useState(0);             // Posição atual da reprodução (em segundos)
  const [duration, setDuration] = useState(0);                   // Duração total da música (em segundos)
  const [volume, setVolume] = useState(0.5);                     // Nível de volume atual (de 0.0 a 1.0)
  const [lastVolume, setLastVolume] = useState(0.5);             // Armazena o volume antes de silenciar (para restaurar)
  const [isSeeking, setIsSeeking] = useState(false);             // Indica se o usuário está arrastando o slider de progresso

  // ----------------------------------------------------
  // 2. REFERÊNCIAS (useRef): Acesso direto a elementos do DOM (HTML)
  // ----------------------------------------------------
  const audioRef = useRef<HTMLAudioElement | null>(null);         // Referência ao elemento <audio> HTML
  const progressSliderRef = useRef<HTMLInputElement | null>(null); // Referência ao input range (slider de progresso)
  const volumeSliderRef = useRef<HTMLInputElement | null>(null);   // Referência ao input range (slider de volume)

  // ----------------------------------------------------
  // 3. VARIÁVEIS COMPUTADAS
  // ----------------------------------------------------
  const currentTrack: Track = playlist[currentTrackIndex]; // Obtém os dados completos da faixa atual

  // ----------------------------------------------------
  // 4. FUNÇÕES DE UTILIDADE E CONTROLE
  // ----------------------------------------------------

  /**
   * Converte um tempo em segundos para o formato "Minuto:Segundo" (ex: 3:05).
   * @param time O tempo em segundos.
   * @returns String formatada.
   */
  const formatTime = (time: number): string => {
    if (isNaN(time) || time < 0) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  /**
   * Atualiza visualmente a cor de preenchimento de um slider (progresso ou volume).
   * Usa `useCallback` para memorizar a função e evitar recriações desnecessárias.
   * @param slider O elemento input range (slider).
   * @param value O valor atual do slider.
   * @param max O valor máximo do slider.
   */
  const updateSliderColor = useCallback(
    (slider: HTMLInputElement | null, value: number, max: number) => {
      if (!slider || max === 0) return;
      const percent = (value / max) * 100;
      // Aplica um gradiente CSS para colorir a parte já percorrida
      slider.style.background = `linear-gradient(to right, #1ed760 0%, #1ed760 ${percent}%, #535353 ${percent}%, #535353 100%)`;
    },
    [] // Array de dependências vazio, pois a função não depende de nenhum estado/prop
  );

  /**
   * Lida com a mudança de valor no slider de progresso enquanto o usuário arrasta.
   */
  const handleSeek: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    updateSliderColor(progressSliderRef.current, newTime, duration);
  };

  /**
   * Registra o início do arrastar no slider de progresso.
   */
  const handleSeekStart = () => setIsSeeking(true);

  /**
   * Aplica o novo tempo de reprodução ao elemento <audio> após o usuário soltar o slider.
   */
  const handleSeekFinished: SeekHandler = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.currentTarget.value);
    audio.currentTime = newTime; // Define o novo tempo de reprodução
    setCurrentTime(newTime);
    setIsSeeking(false);
  };

  /**
   * Alterna o estado de reprodução (Play/Pause).
   */
  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      // Tenta dar play e lida com a Promise retornada (necessário para prevenir erros de autoplay)
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.error('Erro ao reproduzir áudio:', error);
            setIsPlaying(false);
          });
      }
    }
  };

  /**
   * Carrega uma nova faixa da playlist no player.
   * Usa `useCallback` para otimizar, pois é usada no useEffect e em outras handlers.
   * @param index O índice da nova faixa.
   * @param autoPlay Se deve começar a tocar automaticamente (padrão é o estado atual de isPlaying).
   */
  const loadTrack = useCallback(
    (index: number, autoPlay: boolean = isPlaying) => {
      // Atualiza o índice da faixa e reseta o tempo/duração
      setCurrentTrackIndex(index);
      setCurrentTime(0);
      setDuration(0);

      const audio = audioRef.current;
      if (!audio) return;

      // Define a nova fonte de áudio e recarrega o elemento
      audio.src = playlist[index].audioSrc;
      audio.currentTime = 0;
      audio.load();

      // Se autoPlay for verdadeiro, tenta dar play após um pequeno delay
      if (autoPlay) {
        setTimeout(() => {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => setIsPlaying(true))
              .catch((error) => {
                if (error.name !== 'AbortError') console.error('Erro ao reproduzir áudio após load:', error);
                setIsPlaying(false);
              });
          }
        }, 150);
      } else setIsPlaying(false);
    },
    [isPlaying] // Depende de isPlaying para decidir se deve tocar automaticamente
  );

  /**
   * Passa para a próxima música (circularmente).
   */
  const handleNext = () => loadTrack((currentTrackIndex + 1) % playlist.length, true);

  /**
   * Volta para a música anterior (circularmente).
   */
  const handlePrev = () => loadTrack((currentTrackIndex - 1 + playlist.length) % playlist.length, true);

  /**
   * Lida com a mudança de valor no slider de volume.
   */
  const handleVolumeChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const newVolume = parseFloat(e.target.value);
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = newVolume; // Aplica o volume ao elemento de áudio
    setVolume(newVolume);
    if (newVolume > 0) setLastVolume(newVolume); // Salva o volume anterior se não for zero
    updateSliderColor(volumeSliderRef.current, newVolume, 1);
  };

  /**
   * Alterna o estado de mudo (mute/unmute).
   */
  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (volume > 0) {
      // Silencia
      setLastVolume(volume);
      setVolume(0);
      audio.volume = 0;
    } else {
      // Restaura
      const restored = lastVolume || 0.5;
      setVolume(restored);
      audio.volume = restored;
    }
    updateSliderColor(volumeSliderRef.current, audio.volume, 1);
  };

  /**
   * Retorna o ícone de volume apropriado (mudo, baixo ou alto).
   */
  const getVolumeIcon = () => {
    if (volume === 0) return <i className="fas fa-volume-mute"></i>;
    if (volume > 0.5) return <i className="fas fa-volume-up"></i>;
    return <i className="fas fa-volume-down"></i>;
  };

  // ----------------------------------------------------
  // 5. EFEITOS (useEffect): Lidam com a sincronização e efeitos colaterais
  // ----------------------------------------------------

  /**
   * Efeito principal: Configura e limpa os event listeners do elemento <audio>.
   * Roda quando o componente é montado e sempre que as dependências mudam.
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;

    // Listener para atualizar o tempo atual e o slider enquanto a música toca
    const onTimeUpdate = () => {
      if (!isSeeking && audio.currentTime !== currentTime && audio.duration) {
        setCurrentTime(audio.currentTime);
        updateSliderColor(progressSliderRef.current, audio.currentTime, audio.duration);
      }
    };

    // Listener para obter a duração total da música quando os metadados são carregados
    const onLoadedMetadata = () => {
      setDuration(audio.duration);
      updateSliderColor(progressSliderRef.current, audio.currentTime, audio.duration);
    };

    // Listener para avançar para a próxima música quando a atual termina
    const onEnded = () => handleNext();
    // Listeners para sincronizar o estado isPlaying com o elemento de áudio
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    // Adiciona os listeners
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    // Função de limpeza: Remove os listeners quando o componente é desmontado ou o efeito é reexecutado
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [currentTrackIndex, volume, currentTime, isSeeking, updateSliderColor, handleNext]); // Dependências

  /**
   * Efeito secundário: Garante que a cor dos sliders (volume e progresso) seja atualizada.
   * Roda quando o tempo, duração ou volume mudam.
   */
  useEffect(() => {
    if (progressSliderRef.current && volumeSliderRef.current) {
      updateSliderColor(volumeSliderRef.current, volume, 1);
      if (duration > 0) updateSliderColor(progressSliderRef.current, currentTime, duration);
    }
  }, [currentTime, duration, volume, updateSliderColor]);

  // ----------------------------------------------------
  // 6. RENDERIZAÇÃO (JSX)
  // ----------------------------------------------------
  return (
    <div className="player-card">
      {/* Informações da Capa */}
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

      {/* Informações da Faixa */}
      <div className="info">
        <h2 className="title">{currentTrack.title}</h2>
        <p className="subtitle">{currentTrack.subtitle}</p>
      </div>

      {/* Barra de Progresso */}
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
          onChange={handleSeek} // Atualiza o estado de tempo ao arrastar
          onMouseDown={handleSeekStart} // Inicia o estado de seek
          onMouseUp={handleSeekFinished} // Finaliza o seek e aplica o tempo
          onTouchStart={handleSeekStart}
          onTouchEnd={handleSeekFinished}
          aria-label="Controle de Progresso da Música"
          title={`Tempo Atual: ${formatTime(currentTime)} de ${formatTime(duration)}`} // Tooltip com o tempo
        />
        <span className="total-time">{formatTime(duration)}</span>
      </div>

      {/* Controles Principais e de Volume (MODIFICADOS para ficarem lado a lado) */}
      <div className="controls-and-volume-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 20px' }}>
        
        {/* GRUPO DE CONTROLES: VOLTAR, PLAY/PAUSE, AVANÇAR */}
        <div className="main-controls" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Botão Anterior */}
            <button
              className="control-button"
              onClick={handlePrev}
              aria-label="Música anterior"
              title="Voltar" // Tooltip
            >
              <i className="fas fa-backward fa-2x"></i> {/* Ícone com tamanho 2x */}
            </button>

            {/* Botão Play/Pause */}
            <button
              className="control-button play-pause"
              onClick={togglePlayPause}
              aria-label={isPlaying ? 'Pausar' : 'Reproduzir'}
              title={isPlaying ? 'Pausar' : 'Reproduzir'} // Tooltip Condicional
            >
              {isPlaying ? (
                <i className="fas fa-pause fa-3x"></i> // Ícone Pause 3x
              ) : (
                <i className="fas fa-play fa-3x"></i> // Ícone Play 3x
              )}
            </button>

            {/* Botão Próxima */}
            <button
              className="control-button"
              onClick={handleNext}
              aria-label="Próxima música"
              title="Avançar" // Tooltip
            >
              <i className="fas fa-forward fa-2x"></i> {/* Ícone com tamanho 2x */}
            </button>
        </div>

        {/* CONTROLE DE VOLUME */}
        <div className="volume-control" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Botão MUDO */}
          <button
            className="control-button volume-button"
            onClick={toggleMute}
            aria-label="Ativar ou Desativar Som"
            title={volume === 0 ? 'Ativar Som' : 'Silenciar'} // Tooltip Condicional
          >
            {getVolumeIcon()}
          </button>
          {/* Slider de Volume */}
          <input
            type="range"
            className="volume-slider"
            ref={volumeSliderRef}
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange} // Atualiza o volume e a cor
            aria-label="Controle de Volume"
            title={`Volume: ${Math.round(volume * 100)}%`} // Tooltip com o volume atual
          />
        </div>
      </div>

      {/* Elemento de Áudio (oculto, responsável pela reprodução) */}
      <audio id="audio" ref={audioRef} src={currentTrack.audioSrc}></audio>
    </div>
  );
};

export default Player;