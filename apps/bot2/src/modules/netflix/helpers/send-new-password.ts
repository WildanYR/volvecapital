import { AuthCredentials } from "../../../core/auth.js";
import { LogContext, LogLevel, LogToDbOptions } from "../../../types/logger.type.js";
import { updateNetflixAccountStatus } from "../api.js";

interface ServerInfo {
  apiBaseUrl: string;
  authCredentials: AuthCredentials
  instanceId: string;
}

interface sendServerPayload {
  email: string;
  accountId: string;
  newPassword: string;
}

export async function sendNewPasswordToServer(serverInfo: ServerInfo, payload: sendServerPayload, log: (level: LogLevel, message: string, context?: LogContext, logToDbOptions?: LogToDbOptions) => void) {
  try {
    if (!payload.accountId) {
      throw new Error("Netflix reset payload missing accountId");
    }
    await updateNetflixAccountStatus(
      serverInfo.apiBaseUrl,
      serverInfo.authCredentials,
      payload.accountId,
      payload.newPassword,
    );
  } catch (error) {
    log(
      'error',
      `Berhasil reset password Netflix pada ${payload.email} tapi gagal update data app: ${error instanceof Error ? error.message : String(error)}`,
      {
        instanceId: serverInfo.instanceId,
      },
      {
        level: "NEED_ACTION",
        context: "ResetNetflixPassword",
        customMessage: `⚠️ Berhasil reset password netflix\ntapi gagal update data di app [${error instanceof Error ? error.message : String(error)}]\n\nSilahkan clear dan ubah password manual pada email tersebut.\nEmail: ${payload.email}\nPassword baru: ${payload.newPassword}`,
      },
    );
  }
}