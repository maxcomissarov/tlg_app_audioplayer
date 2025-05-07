const STREAM_URL = 'https://megapolisfm.md:8443/886';
const NOW_PLAYING_API = '/api/nowplaying';
const audio = document.getElementById('audioPlayer');
const button = document.getElementById('playButton');
const loading = document.getElementById('loadingIndicator');
const cover = document.getElementById('coverArt');
const trackInfo = document.getElementById('trackInfo');

let isPlaying = false;
let retryTimeout = null;
let nowPlayingInterval = null;

function updateNowPlaying() {
    fetch(NOW_PLAYING_API)
        .then(res => res.json())
        .then(data => {
            if (data && data.artist && data.track) {
                trackInfo.textContent = `${data.artist} - ${data.track}`;
                if (data.cover) {
                    cover.src = data.cover;
                    cover.style.display = 'block';
                } else {
                    cover.style.display = 'none';
                }

                if ('mediaSession' in navigator) {
                    const artwork = [
                        { src: data.cover, sizes: '512x512', type: 'image/png' },
                        { src: data.cover.replace('.png', '.jpg'), sizes: '512x512', type: 'image/jpeg' }
                    ];

                    navigator.mediaSession.metadata = new MediaMetadata({
                        title: data.track,
                        artist: data.artist,
                        artwork: artwork
                    });
                    navigator.mediaSession.setActionHandler('pause', () => stopPlayback());
                    navigator.mediaSession.setActionHandler('stop', () => stopPlayback());
                    navigator.mediaSession.setActionHandler('play', () => playStream());
                    navigator.mediaSession.setActionHandler('seekbackward', null);
                    navigator.mediaSession.setActionHandler('seekforward', null);
                    navigator.mediaSession.setActionHandler('previoustrack', null);
                    navigator.mediaSession.setActionHandler('nexttrack', null);
                }
            }
        });
}

function playStream() {
    if (!isPlaying) return;
    loading.style.display = 'block';
    const nocacheUrl = STREAM_URL + '?nocache=' + Date.now();
    audio.src = nocacheUrl;
    audio.play()
        .then(() => {
            button.classList.add('playing');
            loading.style.display = 'none';
            updateNowPlaying();
            nowPlayingInterval = setInterval(updateNowPlaying, 10000);
        })
        .catch((err) => {
            console.warn('Stream error. Retrying in 3s...', err);
            loading.textContent = 'Reconnecting...';
            retryTimeout = setTimeout(playStream, 3000);
        });
}

function stopPlayback() {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    button.classList.remove('playing');
    loading.style.display = 'none';
    loading.textContent = 'Buffering...';
    clearTimeout(retryTimeout);
    clearInterval(nowPlayingInterval);
    isPlaying = false;
}

button.addEventListener('click', () => {
    if (isPlaying) {
        stopPlayback();
    } else {
        isPlaying = true;
        playStream();
    }
});

audio.addEventListener('error', () => {
    if (isPlaying) {
        loading.textContent = 'Connection lost. Reconnecting...';
        retryTimeout = setTimeout(playStream, 3000);
    }
});

audio.addEventListener('stalled', () => {
    if (isPlaying) {
        loading.textContent = 'Stream stalled. Reconnecting...';
        retryTimeout = setTimeout(playStream, 3000);
    }
});

window.Telegram?.WebApp?.expand();