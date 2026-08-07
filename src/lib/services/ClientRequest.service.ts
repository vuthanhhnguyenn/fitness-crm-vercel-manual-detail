import { getTokenExpiration } from '@/utils/auth.util';
import { handleLogout } from '@/utils/global.util';
import Cookies from 'universal-cookie';

import { Authentication as Auth } from '@/lib/api';
import { Client, ResolvedRequestOptions } from '@/lib/api/client';

import { CookieNames } from '@/types/global.enum';
import { ApiRequest } from '@/types/global.type';

import SyncRequestService from './SyncRequest.service';

export interface ClientRequestServiceProps {
  client: Client;
  syncRequestService?: SyncRequestService;
}

export interface GetClientRequest extends Client {
  handleRefreshToken: (
    response: Response,
    request: ApiRequest,
    options: ResolvedRequestOptions<'fields', boolean, string>,
  ) => Promise<Response>;
}

export default class ClientRequestService {
  client: Client;
  #syncRequestService?: SyncRequestService | null;

  constructor(props: ClientRequestServiceProps) {
    this.client = props.client;
    this.#syncRequestService = props.syncRequestService ?? null;
  }

  get #promise(): Promise<string | null> | null {
    return this.#syncRequestService?.promise ?? null;
  }

  set #promise(promise: Promise<string | null> | null) {
    if (this.#syncRequestService) {
      this.#syncRequestService.promise = promise;
    }
  }

  getClient(): GetClientRequest {
    (this.client as GetClientRequest).handleRefreshToken = this.#handleRefreshToken.bind(this);
    return this.client as GetClientRequest;
  }

  async #refetchRequest(token: string, request: ApiRequest, response: Response): Promise<Response> {
    try {
      request._clone.headers.set('Authorization', `Bearer ${token}`);
      const data = await fetch(request._clone);
      if (!data.ok) {
        return response;
      }

      return data;
    } catch {
      return response;
    }
  }

  async #handleRefreshToken(response: Response, request: ApiRequest): Promise<Response> {
    let resolve: (value: string | null) => void = () => {};
    let reject: (reason?: any) => void = () => {};
    try {
      if (this.#promise) {
        const token = await this.#promise;
        if (!token) {
          return response;
        }

        return this.#refetchRequest(token, request, response);
      }

      if (this.#syncRequestService === null) {
        this.#promise = new Promise(() => {});
        await handleLogout();
        return response;
      }

      this.#promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });
      const cookies = new Cookies();
      const sessionResponse = (await Auth.postAuthRefresh({
        headers: {
          Authorization: request.headers.get('Authorization') as string,
        },
        body: {
          refresh_token: cookies?.get(CookieNames.Session)?.refresh_token,
        } as any,
      })) as any;

      const accessToken = sessionResponse?.data?.accessToken;
      if (!accessToken) {
        await handleLogout();
        reject(response);
        throw response;
      }

      this.#promise = null;
      resolve(accessToken);
      const expiration = getTokenExpiration(sessionResponse?.data?.refresh_token as string);
      // Add 1 day (24h) to the expiration if available
      let cookieExpires = expiration;
      if (cookieExpires) {
        cookieExpires = new Date(cookieExpires.getTime() + 24 * 60 * 60 * 1000);
      }
      cookies.set(CookieNames.Session, sessionResponse?.data, {
        path: '/',
        ...(cookieExpires ? { expires: cookieExpires } : {}),
      });
      return await this.#refetchRequest(accessToken, request, response);
    } catch {
      if (this.#promise) {
        await handleLogout();
        reject(response);
        return response;
      }

      this.#promise = null;
      return response;
    }
  }
}
