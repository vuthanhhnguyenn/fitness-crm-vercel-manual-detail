'use client';

import { useCallback, useEffect, useMemo } from 'react';

import Cookies from 'universal-cookie';

import { ResolvedRequestOptions } from '@/lib/api/client';
import { client } from '@/lib/api/client.gen';
import ClientRequestService from '@/lib/services/ClientRequest.service';
import SyncRequestService from '@/lib/services/SyncRequest.service';

import { CookieNames } from '@/types/global.enum';
import { ApiRequest } from '@/types/global.type';

export default function useClientRequest() {
  const syncRequestService = useMemo(() => new SyncRequestService(), []);
  const clientRequest = useMemo(() => {
    const clientRequestService = new ClientRequestService({
      client,
      syncRequestService,
    });

    return clientRequestService.getClient();
  }, [syncRequestService]);

  const handleRequest = useCallback(async (request: Request) => {
    const authorization = request.headers.get('Authorization');
    const cookies = new Cookies();
    const token = cookies.get(CookieNames.Session);

    if (!authorization) {
      request.headers.set('Authorization', `Bearer ${token?.access_token}`);
    }

    const cloneRequest = request.clone();
    (request as ApiRequest)._clone = cloneRequest;
    return request;
  }, []);

  const handleResponse = useCallback(
    async (
      response: Response,
      request: Request,
      options: ResolvedRequestOptions<'fields', boolean, string>,
    ) => {
      const status = response.status;
      switch (status) {
        case 401:
          const isAuthRequest = request.url.includes('/api/v1/auth/login');
          if (isAuthRequest) {
            return response;
          }
          return await clientRequest.handleRefreshToken(response, request as ApiRequest, options);
        default:
          return response;
      }
    },
    [clientRequest],
  );

  const handleError = useCallback((error: unknown) => {
    return Promise.reject(error);
  }, []);

  const interceptorRequestId = useMemo(
    () => clientRequest.interceptors.request.use(handleRequest),
    [clientRequest, handleRequest],
  );

  const interceptorResponse = useMemo(
    () => clientRequest.interceptors.response.use(handleResponse),
    [clientRequest, handleResponse],
  );

  const interceptorError = useMemo(
    () => clientRequest.interceptors.error.use(handleError),
    [clientRequest, handleError],
  );

  useEffect(() => {
    return () => {
      clientRequest.interceptors.error.eject(interceptorError);
      clientRequest.interceptors.request.eject(interceptorRequestId);
      clientRequest.interceptors.response.eject(interceptorResponse);
    };
  }, [clientRequest, interceptorError, interceptorRequestId, interceptorResponse]);

  return null;
}
