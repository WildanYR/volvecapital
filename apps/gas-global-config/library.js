// == KODE DI SISI LIBRARY (EmailForwarderLib - Optimized) ==

class Forwarder {
  constructor(config) {
    this.APP_ID = config.appId;
    this.API_URL = "https://api.volve-capital.com";
    
    this.propsService = config.propertiesService;
    this.cacheService = config.cacheService;
    
    // Konfigurasi disimpan langsung di RAM Instance
    this.KEYS = {
      LAST_RUN: 'last_run',
      SUBJECT: 'email_subjects',
      PAYLOAD: 'webhook_payload'
    };
    
    this.TTL_SUBJECT = 3600; // Dinaikkan ke 30 menit agar jarang fetch API subjek
    this.TTL_PAYLOAD = 600;
    this.BATCH_SIZE = 30;
    this.MAX_WINDOW_SEC = 1800;
    this.BUFFER_SEC = 30;
    this.MAX_GMAIL_LOOKBACK = 600;
    this.CHUNK_SIZE = 95 * 1024;
    
    // In-memory cache untuk meminimalkan I/O Google Service
    this._cachedPayloadString = null;
    this._scriptProperties = null; 
  }

  // Mengambil seluruh properti script sekaligus dalam 1 network call internal
  getProperties() {
    if (!this._scriptProperties) {
      this._scriptProperties = this.propsService.getProperties(); // 1 kali panggil untuk semua data
    }
    return this._scriptProperties;
  }

  setCachedPayload(payload) {
    const numChunks = Math.ceil(payload.length / this.CHUNK_SIZE);
    const cacheData = {};
    const keyPayload = this.KEYS.PAYLOAD;
    
    cacheData[`${keyPayload}_meta`] = numChunks.toString();
    for (let i = 0; i < numChunks; i++) {
      cacheData[`${keyPayload}_${i}`] = payload.substring(i * this.CHUNK_SIZE, (i + 1) * this.CHUNK_SIZE);
    }
    this.cacheService.putAll(cacheData, this.TTL_PAYLOAD);
  }

  getCachedPayload() {
    if (this._cachedPayloadString) return this._cachedPayloadString;
    
    const keyPayload = this.KEYS.PAYLOAD;
    const numChunkStr = this.cacheService.get(`${keyPayload}_meta`);
    if (!numChunkStr) return null;
    
    const numChunks = parseInt(numChunkStr, 10);
    const chunkKeys = new Array(numChunks);
    for (let i = 0; i < numChunks; i++) {
      chunkKeys[i] = `${keyPayload}_${i}`;
    }
    
    const chunksData = this.cacheService.getAll(chunkKeys);
    if (Object.keys(chunksData).length !== numChunks) return null;
    
    const payloadParts = new Array(numChunks);
    for (let i = 0; i < numChunks; i++) {
      payloadParts[i] = chunksData[chunkKeys[i]];
    }
    
    this._cachedPayloadString = payloadParts.join('');
    return this._cachedPayloadString;
  }

  deleteCachedPayload() {
    const keyPayload = this.KEYS.PAYLOAD;
    const numChunkStr = this.cacheService.get(`${keyPayload}_meta`);
    if (!numChunkStr) return;
    
    const numChunks = parseInt(numChunkStr, 10);
    const keysToDelete = [`${keyPayload}_meta`];
    for (let i = 0; i < numChunks; i++) {
      keysToDelete.push(`${keyPayload}_${i}`);
    }
    this.cacheService.removeAll(keysToDelete);
    this._cachedPayloadString = null;
  }

  sendPayload(payloadString) {
    try {
      const res = UrlFetchApp.fetch(`${this.API_URL}/email-forward`, {
        method: 'post',
        contentType: 'application/json',
        payload: payloadString,
        muteHttpExceptions: true
      });
      return res.getResponseCode() >= 200 && res.getResponseCode() < 300;
    } catch {
      return false;
    }
  }

  initCore() {
    const localProps = this.getProperties();
    let lastRunStr = localProps[this.KEYS.LAST_RUN];
    const nowEpoch = Math.floor(Date.now() / 1000);
    
    if (!lastRunStr) lastRunStr = (nowEpoch - 3600).toString();
    let lastRun = Number(lastRunStr);

    // 1. CEK CACHE PAYLOAD
    const cachedDataStr = this.getCachedPayload();
    if (cachedDataStr) {
      try {
        const cachedObj = JSON.parse(cachedDataStr);
        if (this.sendPayload(cachedObj.payloadString)) {
          this.propsService.setProperty(this.KEYS.LAST_RUN, cachedObj.nextLastRun);
          this.deleteCachedPayload();
          lastRun = Number(cachedObj.nextLastRun); 
        } else {
          return; // Gagal kirim, stop dulu tunggu menit berikutnya
        }
      } catch {
        this.deleteCachedPayload();
      }
    }

    // 2. FETCH SUBJECT (Dioptimasi dengan fallback cache RAM)
    let subjectStr = this.cacheService.get(this.KEYS.SUBJECT);
    if (!subjectStr) {
      try {
        const res = UrlFetchApp.fetch(`${this.API_URL}/email-forward/subject?tenant=${this.APP_ID}`, { muteHttpExceptions: true });
        if (res.getResponseCode() >= 200 && res.getResponseCode() < 300) {
          subjectStr = res.getContentText();
          this.cacheService.put(this.KEYS.SUBJECT, subjectStr, this.TTL_SUBJECT);
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

    // 3. QUERY GMAIL
    const lookbackLimit = nowEpoch - this.MAX_GMAIL_LOOKBACK;
    const effectiveStartTime = Math.max(lastRun, lookbackLimit);
    const windowEnd = Math.min(effectiveStartTime + this.MAX_WINDOW_SEC, nowEpoch);
    
    const searchQuery = `subject:(${subjectQuery}) after:${effectiveStartTime} before:${windowEnd + 1}`;
    const threads = GmailApp.search(searchQuery, 0, this.BATCH_SIZE);

    if (!threads.length) {
      const targetRun = windowEnd >= nowEpoch ? (nowEpoch - this.BUFFER_SEC) : windowEnd;
      this.propsService.setProperty(this.KEYS.LAST_RUN, targetRun.toString());
      return;
    }

    threads.reverse(); 
    const emailPayloads = [];
    let maxTimestampProcessed = effectiveStartTime;

    // 4. EKSTRAKSI PESAN
    for (const thread of threads) {
      const messages = thread.getMessages();
      for (const msg of messages) {
        const msgTimestamp = Math.floor(msg.getDate().getTime() / 1000);
        if (msgTimestamp <= effectiveStartTime) continue; 
        
        // Membaca properti email diletakkan tepat setelah filter lolos
        emailPayloads.push({
          from: msg.getTo(),
          original_sender: msg.getFrom(),
          date: msg.getDate().toISOString(),
          subject: msg.getSubject(),
          text: msg.getPlainBody() 
        });

        if (msgTimestamp > maxTimestampProcessed) {
          maxTimestampProcessed = msgTimestamp;
        }
      }
    }

    // 5. KALKULASI WAKTU & SEND
    let nextLastRun = (threads.length === this.BATCH_SIZE) 
      ? maxTimestampProcessed.toString() 
      : ((windowEnd >= nowEpoch) ? (nowEpoch - this.BUFFER_SEC).toString() : windowEnd.toString());

    if (!emailPayloads.length) {
      this.propsService.setProperty(this.KEYS.LAST_RUN, nextLastRun);
      return;
    }

    const payloadString = JSON.stringify({ tenant: this.APP_ID, emails: emailPayloads });
    if (this.sendPayload(payloadString)) {
      this.propsService.setProperty(this.KEYS.LAST_RUN, nextLastRun);
    } else {
      this.setCachedPayload(JSON.stringify({ payloadString, nextLastRun }));
    }
  }
}

function init(config) {
  return new Forwarder(config);
}