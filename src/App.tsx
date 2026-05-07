import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Music, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Headphones, 
  Activity,
  Heart,
  MoreHorizontal,
  Youtube,
  AlertCircle
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  preview: string | null;
  dur_ms: number;
  source: 'spotify' | 'youtube';
}

export default function App() {
  const [query, setQuery] = useState('');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.addEventListener('timeupdate', () => {
        setProgress(audioRef.current?.currentTime || 0);
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
      });
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setTracks(data);
    } catch (err) {
      setError('Failed to search tracks. Please check API keys.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const playTrack = (track: Track) => {
    if (!track.preview) {
      setError('No preview available for this track.');
      return;
    }

    if (currentTrack?.id === track.id) {
      togglePlay();
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);
    
    if (audioRef.current) {
      audioRef.current.src = track.preview;
      audioRef.current.play();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-bg relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/10 blur-[120px] rounded-full" />
      
      <audio ref={audioRef} />
      
      {/* Header */}
      <header className="p-6 md:px-12 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-4xl font-display font-bold tracking-tight text-white flex items-center gap-2">
            SoundWave <Activity className="text-brand animate-pulse" />
          </h1>
          <p className="text-sm text-white/50 font-medium tracking-wide">SPOTIFY & YOUTUBE MUSIC</p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand/10 border border-brand/20 flex items-center justify-center">
            <Activity className="text-brand w-6 h-6" />
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="px-6 md:px-12 mb-8">
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative group">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs, artists, albums..."
            className="w-full bg-surface border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-all shadow-2xl glass-morphism"
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-brand transition-colors" />
          <button 
            type="submit"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-brand hover:bg-brand/80 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors"
          >
            {loading ? 'Searching...' : 'Find'}
          </button>
        </form>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-6 md:px-12 pb-32">
        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl mx-auto mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-sm"
            >
              <AlertCircle size={18} />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-xs underline">Dismiss</button>
            </motion.div>
          )}

          {tracks.length === 0 && !loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-brand/5 flex items-center justify-center mb-6">
                <Headphones className="text-brand/40 w-10 h-10" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Ready for your sound?</h2>
              <p className="text-white/40 max-w-xs">Enter a track name or artist to start exploring unified music results.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
              {tracks.map((track, i) => (
                <motion.div
                  key={track.id + i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => playTrack(track)}
                  className={cn(
                    "group relative p-4 rounded-2xl bg-card border border-white/5 hover:bg-card-hover transition-all cursor-pointer shadow-lg",
                    currentTrack?.id === track.id && "ring-2 ring-brand ring-offset-2 ring-offset-bg bg-card-hover"
                  )}
                >
                  <div className="flex gap-4">
                    <div className="relative w-16 h-16 flex-shrink-0 group">
                      <img 
                        src={track.cover || 'https://via.placeholder.com/64'} 
                        alt={track.title}
                        className="w-full h-full object-cover rounded-xl shadow-md"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                        {isPlaying && currentTrack?.id === track.id ? (
                          <Pause className="text-white fill-white" />
                        ) : (
                          <Play className="text-white fill-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="font-bold text-white truncate text-sm mb-1">{track.title}</h3>
                      <p className="text-xs text-white/50 truncate font-medium">{track.artist}</p>
                      
                      <div className="mt-3 flex items-center gap-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider",
                          track.source === 'spotify' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                        )}>
                          {track.source}
                        </span>
                        {currentTrack?.id === track.id && (
                          <div className="flex items-center gap-1">
                            <motion.div 
                              animate={{ height: [4, 12, 4] }} 
                              transition={{ repeat: Infinity, duration: 0.6 }}
                              className="w-0.5 bg-brand" 
                            />
                            <motion.div 
                              animate={{ height: [8, 4, 8] }} 
                              transition={{ repeat: Infinity, duration: 0.8 }}
                              className="w-0.5 bg-brand" 
                            />
                            <motion.div 
                              animate={{ height: [12, 4, 12] }} 
                              transition={{ repeat: Infinity, duration: 0.5 }}
                              className="w-0.5 bg-brand" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button className="absolute top-4 right-4 text-white/20 hover:text-white transition-colors">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Player Bar */}
      <AnimatePresence>
        {currentTrack && (
          <motion.footer
            id="player-bar"
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 md:p-6 glass-morphism z-50 rounded-t-3xl border-t border-white/10"
          >
            <div className="max-w-7xl mx-auto flex flex-col gap-3">
              {/* Progress Bar */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-white/40 w-10">{formatTime(progress)}</span>
                <div 
                  className="flex-1 h-1.5 bg-white/10 rounded-full cursor-pointer relative overflow-hidden"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    if (audioRef.current) {
                      audioRef.current.currentTime = percent * duration;
                    }
                  }}
                >
                  <motion.div 
                    className="absolute h-full bg-brand rounded-full"
                    style={{ width: `${(progress / duration) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] font-mono text-white/40 w-10">{formatTime(duration)}</span>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="relative group">
                    <img 
                      src={currentTrack.cover} 
                      alt={currentTrack.title} 
                      className="w-12 h-12 rounded-lg shadow-lg rotate-0 group-hover:rotate-6 transition-transform"
                    />
                    <div className="absolute -top-1 -right-1">
                      {currentTrack.source === 'youtube' ? (
                        <div className="bg-red-500 rounded-full p-0.5 border-2 border-surface"><Youtube size={10} /></div>
                      ) : (
                        <div className="bg-green-500 rounded-full p-0.5 border-2 border-surface"><Music size={10} /></div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold truncate">{currentTrack.title}</h4>
                    <p className="text-xs text-white/40 truncate">{currentTrack.artist}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <button className="text-white/40 hover:text-white transition-colors hidden sm:block">
                    <SkipBack size={24} />
                  </button>
                  <button 
                    onClick={togglePlay}
                    className="w-12 h-12 rounded-full bg-brand text-bg flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                  >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                  </button>
                  <button className="text-white/40 hover:text-white transition-colors hidden sm:block">
                    <SkipForward size={24} />
                  </button>
                </div>

                <div className="flex-1 flex justify-end gap-4 items-center">
                  <button className="text-white/40 hover:text-white transition-colors">
                    <Heart size={20} />
                  </button>
                  <button className="text-white/40 hover:text-white transition-colors hidden md:block">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
              </div>
            </div>
          </motion.footer>
        )}
      </AnimatePresence>
    </div>
  );
}
