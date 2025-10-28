"use client";
import { useState, useRef, useEffect } from "react";
import playlist from "../lib/playlist"; 

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeItemRef = useRef<HTMLLIElement>(null); 
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // ESTADO DO VOLUME
  const [volume, setVolume] = useState(0.5); 
  const [isMuted, setIsMuted] = useState(false);
  const [lastVolume, setLastVolume] = useState(0.5);

  const currentSong = playlist[currentIndex];

  // Funções de formatação de tempo
  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // Atualiza o tempo e o progresso
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const current = audioRef.current.currentTime;
      const dur = audioRef.current.duration || 0;
      setCurrentTime(current);
      setProgress(dur ? (current / dur) * 100 : 0);
    }
  };

  // Quando o áudio estiver pronto
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setIsLoading(false);
      audioRef.current.volume = volume;
      // IMPORTANTE: Inicia o play se o isPlaying já estiver true (caso de pular música)
      if (isPlaying) {
          audioRef.current.play().catch(e => console.error("Erro no autoplay após carregar metadata: ", e));
      }
    }
  };

  // Play/pause
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  // LÓGICA DE VOLUME (Omitida por brevidade, mas permanece inalterada)
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted || volume === 0) {
      const restoreVolume = lastVolume > 0 ? lastVolume : 0.5;
      setVolume(restoreVolume);
      audioRef.current.volume = restoreVolume;
      setIsMuted(false);
    } else {
      setLastVolume(volume);
      setVolume(0);
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return "fas fa-volume-mute";
    }
    if (volume < 0.5) {
      return "fas fa-volume-down";
    }
    return "fas fa-volume-up";
  };
  // FIM LÓGICA DE VOLUME

  // Avançar/retroceder 10 segundos
  const skipTime = (seconds: number) => {
    if (audioRef.current) {
      const newTime = Math.min(
        audioRef.current.duration,
        Math.max(0, audioRef.current.currentTime + seconds)
      );
      audioRef.current.currentTime = newTime;
    }
  };

  // Mudar posição pelo slider
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && duration) {
      const newTime = (parseFloat(e.target.value) / 100) * duration;
      audioRef.current.currentTime = newTime;
    }
  };

  // Trocar música (CHAVE: Define isPlaying como true)
  const changeSong = (index: number) => {
    setCurrentIndex(index);
    setProgress(0);
    setIsPlaying(true); // FORÇA O PLAY
    setIsLoading(true);
  };

  // Próxima música (CHAVE: Define isPlaying como true)
  const nextSong = () => {
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
    setProgress(0);
    setIsPlaying(true); // FORÇA O PLAY
    setIsLoading(true);
  };

  // Música anterior (CHAVE: Define isPlaying como true)
  const prevSong = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? playlist.length - 1 : prev - 1
    );
    setProgress(0);
    setIsPlaying(true); // FORÇA O PLAY
    setIsLoading(true);
  };

  const handleEnded = () => {
    nextSong();
  };

  // Efeito para carregar a música e garantir a rolagem
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      // O play real é agora feito no handleLoadedMetadata, 
      // mas se já estiver tocando, tentamos tocar aqui também por segurança.
      if (isPlaying) { 
          audioRef.current.play().catch(e => {
            // Em navegadores modernos, a primeira reprodução deve ser 
            // iniciada por uma interação do usuário (togglePlay).
            // Tentativas subsequentes (como pular música) são liberadas.
            // Aqui, apenas garantimos que o estado é isPlaying=true.
          });
      }
    }
    
    // LÓGICA DE ROLAGEM
    if (activeItemRef.current) {
        activeItemRef.current.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest', 
        });
    }

  }, [currentIndex]); 


  return (
    // ... (restante do JSX inalterado)
    <div className="main-player-container">
      
      {/* 🎧 BLOCO ESQUERDO: Player Principal (Capa, Info, Controles) */}
      <div className="player-column">
        
        {/* Capa e Info */}
        <div className="media-info-container-split">
          <img
            src={currentSong.coverSrc}
            alt="Capa"
            className="mini-cover-image" 
          />
          <div className="info-split">
            <h2 className="title truncate-text">{currentSong.title}</h2>
            <p className="subtitle truncate-text">{currentSong.subtitle}</p>
          </div>
        </div>
        
        {/* Barra de Progresso (abaixo da info) */}
        <div className="progress-bar-container">
          <span className="current-time">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            id="progress-slider"
            value={isNaN(progress) ? 0 : progress}
            onChange={handleSeek}
            title={`Progresso: ${Math.round(progress)}%`}
          />
          <span className="total-time">{formatTime(duration)}</span>
        </div>

        {/* Controles (Botões e Volume) */}
        <div className="controls-split">
          <div className="controls-left">
              <button onClick={prevSong} className="control-button" aria-label="Música Anterior" title="Música Anterior">
                <i className="fas fa-step-backward"></i>
              </button>
              <button onClick={() => skipTime(-10)} className="control-button" aria-label="Voltar 10 segundos" title="Voltar 10 segundos">
                <i className="fas fa-undo"></i>
              </button>
              <button onClick={togglePlay} className="control-button play-pause" aria-label={isPlaying ? "Pausar" : "Tocar"} title={isPlaying ? "Pausar" : "Tocar"}>
                {isPlaying ? (
                  <i className="fas fa-pause play-pause-icon"></i>
                ) : (
                  <i className="fas fa-play play-pause-icon ml-1"></i>
                )}
              </button>
              <button onClick={() => skipTime(10)} className="control-button" aria-label="Avançar 10 segundos" title="Avançar 10 segundos">
                <i className="fas fa-redo"></i>
              </button>
              <button onClick={nextSong} className="control-button" aria-label="Próxima Música" title="Próxima Música">
                <i className="fas fa-step-forward"></i>
              </button>
          </div>

          <div className="volume-control-split">
            <button onClick={toggleMute} className="control-button" aria-label="Mudo/Volume" title={isMuted || volume === 0 ? "Desmutar" : "Mudo"}>
                <i className={getVolumeIcon()}></i>
            </button>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
                title={`Volume: ${Math.round(volume * 100)}%`}
            />
          </div>
        </div>

        {isLoading && (
          <p className="subtitle" style={{marginTop: '10px'}}>Carregando...</p>
        )}
      </div> 

      {/* 🎶 BLOCO DIREITO: Playlist */}
      <div className="playlist-column">
          <h3 className="playlist-title-split">Próximas Músicas</h3>
          <ul className="playlist-split">
              {playlist.map((song, index) => (
                  <li
                      key={index}
                      onClick={() => changeSong(index)}
                      ref={index === currentIndex ? activeItemRef : null} 
                      className={`playlist-item-split ${index === currentIndex ? "active" : ""}`}
                  >
                      {/* Ícone de Volume/Número */}
                      {index === currentIndex ? (
                          <i className="fas fa-volume-up playlist-number-icon"></i> 
                      ) : (
                          <span className="playlist-number-icon">{index + 1}.</span> 
                      )}
                      <span className="playlist-text-wrapper">
                          {song.title}
                      </span>
                  </li>
              ))}
          </ul>
      </div>

      <audio
        ref={audioRef}
        src={currentSong.audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />
    </div>
  );
}