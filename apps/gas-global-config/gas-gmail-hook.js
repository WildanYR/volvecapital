const APP_ID = "GANTI_DENGAN_APP_ID_VOLVECAPITAL"
const API_URL = "https://api.volve-capital.com"
const BATCH_SIZE = 15
const PROP_KEY_LAST_RUN = 'last_run'
const CACHE_KEY_SUBJECT = "email_subjects"
const CACHE_KEY_PAYLOAD = "webhook_payload"
const TTL_SUBJECT = 600
const TTL_PAYLOAD = 600
const MAX_GMAIL_LOOKBACK = 600
// == CACHE HELPER ==
function setCachedPayload(payload, cacheService) {
  const cache = cacheService || CacheService.getScriptCache()
  const CHUNK_SIZE = 95 * 1024
  const numChunks = Math.ceil(payload.length / CHUNK_SIZE)
  const cacheData = {}
  cacheData[`${CACHE_KEY_PAYLOAD}_meta`] = numChunks.toString()
  for (let i = 0; i < numChunks; i++) {
    const start = i * CHUNK_SIZE
    cacheData[`${CACHE_KEY_PAYLOAD}_${i}`] = payload.substring(start, start + CHUNK_SIZE)
  }
  cache.putAll(cacheData, 600)
}

function getCachedPayload(cacheService) {
  const cache = cacheService || CacheService.getScriptCache()
  const numChunkStr = cache.get(`${CACHE_KEY_PAYLOAD}_meta`)
  if (!numChunkStr) return null
  const numChunks = parseInt(numChunkStr, 10)
  const chunkKeys = new Array(numChunks)
  for (let i = 0; i < numChunks; i++) {
    chunkKeys[i] = `${CACHE_KEY_PAYLOAD}_${i}`
  }
  const chunksData = cache.getAll(chunkKeys)
  if (Object.keys(chunksData).length !== numChunks) return null;
  const payloadParts = new Array(numChunks);
  for (let i = 0; i < numChunks; i++) {
    payloadParts[i] = chunksData[chunkKeys[i]];
  }
  return payloadParts.join('');
}

function deleteCachedPayload(cacheService) {
  const cache = cacheService || CacheService.getScriptCache();
  const metaKey = `${CACHE_KEY_PAYLOAD}_meta`;
  const numChunkStr = cache.get(metaKey);
  if (!numChunkStr) return;
  const numChunks = parseInt(numChunkStr, 10);
  const keysToDelete = new Array(numChunks + 1);
  keysToDelete[0] = metaKey;
  for (let i = 0; i < numChunks; i++) {
    keysToDelete[i + 1] = `${CACHE_KEY_PAYLOAD}_${i}`;
  }
  cache.removeAll(keysToDelete);
}
// =========
function setup() {
  const props = PropertiesService.getScriptProperties()
  const nowEpoch = Math.floor(Date.now() / 1000)
  props.setProperty(PROP_KEY_LAST_RUN, nowEpoch.toString())
  const triggers = ScriptApp.getProjectTriggers()
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'processEmails') ScriptApp.deleteTrigger(trigger)
  }
  ScriptApp.newTrigger('processEmails').timeBased().everyMinutes(1).create()
  deleteCachedPayload()
  Logger.log(`Setup Berhasil, Script berjalan tiap menit.`)
}

function sendPayload(payloadString) {
  try {
    const res = UrlFetchApp.fetch(`${API_URL}/email-forward`, {
      method: 'post',
      contentType: 'application/json',
      payload: payloadString,
      muteHttpExceptions: true
    })
    const resCode = res.getResponseCode()
    return resCode >= 200 && resCode < 300
  } catch {
    return false
  }
}

function processEmails() {
  const props = PropertiesService.getScriptProperties();
  const cache = CacheService.getScriptCache();
  
  // Konfigurasi
  const BATCH_SIZE = 30; // Aman dan super cepat untuk diproses per 1 menit
  const MAX_WINDOW_SEC = 1800; // 30 Menit (Window opsional jika ada backlog)
  const BUFFER_SEC = 30; 
  const MAX_GMAIL_LOOKBACK = 600; // 10 Menit dari now() sesuai kebutuhan Anda
  
  let lastRunStr = props.getProperty(PROP_KEY_LAST_RUN);
  if (!lastRunStr) lastRunStr = (Math.floor(Date.now() / 1000) - 3600).toString();
  
  let lastRun = Number(lastRunStr);
  const nowEpoch = Math.floor(Date.now() / 1000);

  // ==========================================
  // 1. CEK CACHE (Menggunakan fungsi custom Anda)
  // ==========================================
  const cachedDataStr = getCachedPayload(cache);
  if (cachedDataStr) {
    try {
      const cachedObj = JSON.parse(cachedDataStr);
      const isPayloadSent = sendPayload(cachedObj.payloadString); // Kirim payload aslinya
      
      if (isPayloadSent) {
        props.setProperty(PROP_KEY_LAST_RUN, cachedObj.nextLastRun);
        // Pastikan Anda punya fungsi deleteCachedPayload yg menghapus meta & semua chunk-nya
        if (typeof deleteCachedPayload === 'function') deleteCachedPayload(cache);
        
        // PENTING: Update memory agar query step 3 pakai waktu baru
        lastRun = Number(cachedObj.nextLastRun); 
      } else {
        Logger.log('ERROR: gagal kirim cached payload');
        return; 
      }
    } catch(e) {
      if (typeof deleteCachedPayload === 'function') deleteCachedPayload(cache);
    }
  }

  // ==========================================
  // 2. FETCH SUBJECT
  // ==========================================
  let subjectStr = cache.get(CACHE_KEY_SUBJECT);
  if (!subjectStr) {
    try {
      const res = UrlFetchApp.fetch(`${API_URL}/email-forward/subject`, { muteHttpExceptions: true });
      if (res.getResponseCode() >= 200 && res.getResponseCode() < 300) {
        subjectStr = res.getContentText();
        cache.put(CACHE_KEY_SUBJECT, subjectStr, TTL_SUBJECT);
      } else return;
    } catch { return; }
  }

  let subjectQuery = '';
  try {
    const data = JSON.parse(subjectStr);
    if (!data.subjects || data.subjects.length === 0) return;
    subjectQuery = data.subjects.map(sj => sj.includes(" ") ? `"${sj}"` : sj).join(' OR ');
  } catch { return; }
  if (!subjectQuery) return;

  // ==========================================
  // 3. QUERY GMAIL 
  // ==========================================
  const lookbackLimit = nowEpoch - MAX_GMAIL_LOOKBACK;
  const effectiveStartTime = Math.max(lastRun, lookbackLimit); // Cerdas: ambil yg paling baru
  
  const windowEnd = Math.min(effectiveStartTime + MAX_WINDOW_SEC, nowEpoch);
  const searchQuery = `subject:(${subjectQuery}) after:${effectiveStartTime} before:${windowEnd + 1}`;
  
  const threads = GmailApp.search(searchQuery, 0, BATCH_SIZE);

  if (!threads.length) {
    const targetRun = windowEnd >= nowEpoch ? (nowEpoch - BUFFER_SEC) : windowEnd;
    props.setProperty(PROP_KEY_LAST_RUN, targetRun.toString());
    return;
  }

  threads.reverse(); // Proses terlama ke terbaru
  const emailPayloads = [];
  let maxTimestampProcessed = effectiveStartTime;

  // ==========================================
  // 4. EKSTRAKSI PESAN (TANPA TRUNCATE)
  // ==========================================
  for (const thread of threads) {
    const messages = thread.getMessages();
    for (const msg of messages) {
      const msgTimestamp = Math.floor(msg.getDate().getTime() / 1000);
      if (msgTimestamp <= effectiveStartTime) continue; 
      
      emailPayloads.push({
        from: msg.getTo(),
        original_sender: msg.getFrom(),
        date: msg.getDate().toISOString(),
        subject: msg.getSubject(),
        text: msg.getPlainBody() // <- Full body, tanpa dipotong!
      });

      if (msgTimestamp > maxTimestampProcessed) {
        maxTimestampProcessed = msgTimestamp;
      }
    }
  }

  // ==========================================
  // 5. KALKULASI WAKTU & SEND/CACHE
  // ==========================================
  let nextLastRun;
  if (threads.length === BATCH_SIZE) {
    nextLastRun = maxTimestampProcessed.toString();
  } else {
    nextLastRun = (windowEnd >= nowEpoch) ? (nowEpoch - BUFFER_SEC).toString() : windowEnd.toString();
  }

  if (!emailPayloads.length) {
    props.setProperty(PROP_KEY_LAST_RUN, nextLastRun);
    return;
  }

  const payloadString = JSON.stringify({ tenant: APP_ID, emails: emailPayloads });
  const isPayloadSent = sendPayload(payloadString);

  if (isPayloadSent) {
    props.setProperty(PROP_KEY_LAST_RUN, nextLastRun);
  } else {
    // Bungkus payload ASLI beserta target waktu untuk disimpan pakai fungsi chunk Anda
    const cacheWrapper = {
      payloadString: payloadString,
      nextLastRun: nextLastRun
    };
    
    // Simpan pakai fungsi Anda. (Ingat TTL di fungsi Anda saat ini diset 600 detik / 10 menit)
    setCachedPayload(JSON.stringify(cacheWrapper), cache);
  }
}