import { API_BASE_URL } from '../configs/config.js';
import { AccountUser, FailedAccountUser } from '../types/account.type.js';
import { TransactionAccountPayload } from '../types/transaction-account.type.js';
import { FetchFailedError, TransactionExistNoAccountError } from '../utils/errors.js';
import { convertStringToMetadataObject } from '../utils/metadata-converter.js';
import { authHeaders } from './auth-headers.js';

export async function generateAccountTransaction(
  orderId: string,
  payload: TransactionAccountPayload,
) {
  const headers: any = authHeaders();
  const url = `${API_BASE_URL}/transaction`;
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ id: `BOT${orderId}`, ...payload }),
  });
  if (!res.ok) {
    const data = await res.json();
    if (data.message === 'TRANSACTION_EXIST_NO_ACCOUNT') {
      throw new TransactionExistNoAccountError(
        'Transaksi telah dibuat tapi tidak ada akun yang ditemukan',
      );
    }
    throw new FetchFailedError(data.message);
  }

  const { account_user } = await res.json();

  const data: (AccountUser | FailedAccountUser)[] = account_user.map((au: any) => {
    if (au.availability_status) {
      return au;
    }

    return {
      ...au,
      profile: {
        ...au.profile,
        metadata: au.profile.metadata
          ? convertStringToMetadataObject(au.profile.metadata)
          : undefined,
      },
    };
  });

  return data;
}
