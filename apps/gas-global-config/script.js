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
  const props = PropertiesService.getScriptProperties()
  const cache = CacheService.getScriptCache()

  let lastRunStr = props.getProperty(PROP_KEY_LAST_RUN)
  if (!lastRunStr) return
  
  let lastRun = Number(lastRunStr)
  const nowEpoch = Math.floor(Date.now() / 1000)

  // 1. Cek Cache Payload Terlebih Dahulu
  const cachedPayload = getCachedPayload(cache)
  if (cachedPayload) {
    const isPayloadSent = sendPayload(cachedPayload)
    if (isPayloadSent) {
      deleteCachedPayload(cache)
    } else {
      // Jika API masih gagal, hentikan eksekusi agar tidak numpuk payload baru
      return 
    }
  }

  // 2. Cek Cache Subject
  let subjectStr = cache.get(CACHE_KEY_SUBJECT)
  if (!subjectStr) {
    try {
      const res = UrlFetchApp.fetch(`${API_URL}/email-forward/subject`, { muteHttpExceptions: true })
      const resCode = res.getResponseCode()
  
      if (resCode >= 200 && resCode < 300) {
        subjectStr = res.getContentText()
        cache.put(CACHE_KEY_SUBJECT, subjectStr, TTL_SUBJECT)
      } else {
        return // Exit jika gagal dapat subject
      }
    } catch {
      return // Exit jika API timeout/error
    }
  }

  const subject = JSON.parse(subjectStr)
  if (!subject || subject.length === 0) return

  // 3. Query Gmail
  const lookbackLimit = nowEpoch - MAX_GMAIL_LOOKBACK
  const effectiveStartTime = Math.max(lastRun, lookbackLimit)

  const subjectQuery = subject.map(sj => sj.includes(" ") ? `"${sj}"` : sj).join(' OR ')
  const searchQuery = `subject:(${subjectQuery}) after:${effectiveStartTime}`

  // Pencarian dibatasi BATCH_SIZE (15) untuk mencegah execution timeout
  const threads = GmailApp.search(searchQuery, 0, BATCH_SIZE)
  if (!threads.length) {
    props.setProperty(PROP_KEY_LAST_RUN, nowEpoch.toString())
    return
  }

  const emailPayloads = []
  const nextRunTimestamp = nowEpoch - 1

  // 4. Ekstrak Pesan (Optimasi Array Push)
  for (const thread of threads) {
    const messages = thread.getMessages()
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      const msgTimestamp = Math.floor(msg.getDate().getTime() / 1000)

      if (msgTimestamp <= effectiveStartTime) break

      emailPayloads.push({
        from: msg.getTo(),
        original_sender: msg.getFrom(),
        date: msg.getDate().toISOString(),
        subject: msg.getSubject(),
        text: msg.getPlainBody()
      })
    }
  }

  if (!emailPayloads.length) {
    props.setProperty(PROP_KEY_LAST_RUN, nextRunTimestamp.toString())
    return
  }

  emailPayloads.reverse() 

  // 5. Kirim atau Cache
  const payloadString = JSON.stringify({ emails: emailPayloads })
  const isPayloadSent = sendPayload(payloadString)

  if (isPayloadSent) {
    props.setProperty(PROP_KEY_LAST_RUN, nextRunTimestamp.toString())
  } else {
    // Jika gagal kirim, cache data ini. last_run TIDAK diupdate, 
    // sehingga email baru di siklus menit depan tidak akan terlewat.
    setCachedPayload(payloadString, cache)
  }
}