// Node 18+ script to generate playlists JSON from Google Drive folders
import fs from 'fs/promises';

const API_KEY = process.env.GDRIVE_API_KEY;
if (!API_KEY) {
  console.error("Missing GDRIVE_API_KEY env var. Abort.");
  process.exit(1);
}

const ROOTS = [
  { id: '1tgOfvE-l9iBiXtzii8Xkx44U6mOwaItK', name: 'Playboi Carti', out: 'carti.json' },
  { id: '1B3jfYcb7ikY-YiqUWNIFqU9GJd22MeVN', name: 'Ken Carson', out: 'ken.json' },
  { id: '1I0-pM0AbW2mSybBc6HVFuYMyFDQ2nasm', name: 'destroy lonely', out: 'lone.json' },
];

async function listFilesInFolder(folderId) {
  const results = [];
  let pageToken = null;
  do {
    const q = `'${folderId}' in parents and trashed=false`;
    const params = new URLSearchParams({
      q, key: API_KEY,
      fields: 'nextPageToken, files(id,name,mimeType,parents)',
      pageSize: '1000',
    });
    if (pageToken) params.set('pageToken', pageToken);
    const url = `https://www.googleapis.com/drive/v3/files?${params.toString()}`;
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Drive API error ${res.status}: ${txt}`);
    }
    const json = await res.json();
    if (json.files && json.files.length) results.push(...json.files);
    pageToken = json.nextPageToken || null;
  } while (pageToken);
  return results;
}

async function gatherAudioFilesFromRoot(rootId) {
  const queue = [{ id: rootId, path: [] }];
  const audioFiles = [];
  while (queue.length) {
    const cur = queue.shift();
    const items = await listFilesInFolder(cur.id);
    for (const it of items) {
      if (it.mimeType === 'application/vnd.google-apps.folder') {
        queue.push({ id: it.id, path: [...cur.path, it.name] });
      } else if (it.mimeType && it.mimeType.startsWith('audio/')) {
        const title = it.name;
        const url = `https://docs.google.com/uc?export=download&id=${it.id}`;
        audioFiles.push({
          title,
          url,
          path: cur.path.join('/'),
          mimeType: it.mimeType,
          id: it.id
        });
      }
    }
  }
  return audioFiles;
}

async function main(){
  console.log("Generating playlists...");
  for (const root of ROOTS) {
    try {
      console.log(`Scanning root "${root.name}" (${root.id}) ...`);
      const tracks = await gatherAudioFilesFromRoot(root.id);
      tracks.sort((a,b) => {
        if (a.path === b.path) return a.title.localeCompare(b.title);
        return a.path.localeCompare(b.path);
      });
      const out = root.out;
      await fs.writeFile(out, JSON.stringify(tracks, null, 2), 'utf8');
      console.log(`Wrote ${tracks.length} tracks to ${out}`);
    } catch (err) {
      console.error(`Error scanning ${root.name}:`, err);
    }
  }
  console.log("Done.");
}

main().catch(err => { console.error(err); process.exit(1); });
