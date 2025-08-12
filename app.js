const artistsDiv = document.getElementById('artists');
const songListBody = document.getElementById('song-list');
const artworkImg = document.getElementById('artwork');
const nowPlaying = document.getElementById('now-playing');
const playPauseBtn = document.getElementById('play-pause');

let songs = [];
let currentArtist = null;
let filteredSongs = [];
let currentSongIndex = -1;

const audio = new Audio();

async function loadSongs() {
  try {
    const res = await fetch('songs.json');
    songs = await res.json();
    showArtists();
  } catch (e) {
    alert('Failed to load songs.json');
    console.error(e);
  }
}

function showArtists() {
  const artistSet = new Set(songs.map(s => s.artist));
  artistsDiv.innerHTML = '<h2>Artists</h2>';
  artistSet.forEach(artist => {
    const btn = document.createElement('button');
    btn.textContent = artist;
    btn.onclick = () => selectArtist(artist, btn);
    artistsDiv.appendChild(btn);
  });
}

function selectArtist(artist, btn) {
  currentArtist = artist;
  filteredSongs = songs.filter(s => s.artist === artist);
  highlightArtistButton(btn);
  showSongs();
  clearPlayer();
}

function highlightArtistButton(selectedBtn) {
  const buttons = artistsDiv.querySelectorAll('button');
  buttons.forEach(b => b.classList.remove('active'));
  selectedBtn.classList.add('active');
}

function showSongs() {
  songListBody.innerHTML = '';
  filteredSongs.forEach((song, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${song.title}</td>
      <td><button data-index="${i}">▶️</button></td>
    `;
    tr.querySelector('button').addEventListener('click', () => playSong(i));
    songListBody.appendChild(tr);
  });
}

function playSong(index) {
  if (index < 0 || index >= filteredSongs.length) return;
  currentSongIndex = index;
  const song = filteredSongs[index];
  audio.src = song.url;
  audio.play();
  updatePlayerUI(song);
  highlightPlayingSong();
}

function updatePlayerUI(song) {
  artworkImg.src = song.artwork || '';
  nowPlaying.textContent = `${song.title} — ${song.artist}`;
  playPauseBtn.textContent = '⏸️';
}

function highlightPlayingSong() {
  const rows = songListBody.querySelectorAll('tr');
  rows.forEach((row, i) => {
    row.classList.toggle('playing', i === currentSongIndex);
  });
}

function clearPlayer() {
  audio.pause();
  audio.src = '';
  artworkImg.src = '';
  nowPlaying.textContent = 'Select a song to play';
  playPauseBtn.textContent = '▶️';
  currentSongIndex = -1;
  songListBody.innerHTML = '';
}

playPauseBtn.addEventListener('click', () => {
  if (!audio.src) return;
  if (audio.paused) {
    audio.play();
    playPauseBtn.textContent = '⏸️';
  } else {
    audio.pause();
    playPauseBtn.textContent = '▶️';
  }
});

audio.addEventListener('ended', () => {
  if (currentSongIndex + 1 < filteredSongs.length) {
    playSong(currentSongIndex + 1);
  } else {
    playPauseBtn.textContent = '▶️';
  }
});

window.onload = loadSongs;
