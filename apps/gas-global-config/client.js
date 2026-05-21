const CONFIG = {
  appId: "GANTI_DENGAN_APP_ID_SENDIRI",
  propertiesService: PropertiesService.getScriptProperties(),
  cacheService: CacheService.getScriptCache()
};

function setup() {
  const props = PropertiesService.getScriptProperties();
  const nowEpoch = Math.floor(Date.now() / 1000);
  props.setProperty('last_run', nowEpoch.toString());
  
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'processEmails') ScriptApp.deleteTrigger(trigger);
  }
  ScriptApp.newTrigger('processEmails').timeBased().everyMinutes(1).create();
  
  const client = EmailForwarderLib.init(CONFIG);
  client.deleteCachedPayload();
  
  Logger.log("Setup Berhasil untuk tenant: " + CONFIG.appId);
}

function processEmails() {
  const client = EmailForwarderLib.init(CONFIG);
  client.initCore();
}