import React, { useState, useRef, useEffect } from 'react';

const YouTubePlayer = ({ videoUrl, title }) => {
  const [player, setPlayer] = useState(null);
  const [speed, setSpeed] = useState(1);
  const playerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  // Extract video ID from YouTube URL
  const getVideoId = (url) => {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
  };

  const videoId = getVideoId(videoUrl);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }

    return () => {
      if (player) {
        player.destroy();
      }
    };
  }, [videoId]);

  const initializePlayer = () => {
    if (!videoId || !playerRef.current) return;

    const newPlayer = new window.YT.Player(playerRef.current, {
      videoId: videoId,
      height: '390',
      width: '640',
      playerVars: {
        playsinline: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: (event) => {
          setPlayer(event.target);
          setIsReady(true);
          event.target.setPlaybackSpeed(speed);
        },
        onStateChange: (event) => {
          // Handle player state changes if needed
        }
      }
    });
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (player) {
      player.setPlaybackSpeed(newSpeed);
    }
  };

  if (!videoId) {
    return (
      <div className="p-4 border rounded-2xl border-red-200 bg-red-50">
        <p className="text-red-600 text-sm">Invalid YouTube URL provided</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      
      {/* Video Player */}
      <div className="relative bg-black rounded-xl overflow-hidden mb-4">
        <div ref={playerRef} className="w-full" />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="text-white">Loading video...</div>
          </div>
        )}
      </div>

      {/* Playback Speed Controls */}
      <div className="flex items-center gap-4 p-4 bg-slate-100 rounded-xl">
        <span className="text-sm font-bold text-slate-700">Playback Speed:</span>
        <div className="flex gap-2">
          {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`px-3 py-1 rounded-lg text-sm font-bold transition-all ${
                speed === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-700 hover:bg-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default YouTubePlayer;
