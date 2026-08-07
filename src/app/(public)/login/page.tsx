'use client';

import { Suspense } from 'react';
import { useForm } from 'react-hook-form';

import { useSearchParams } from 'next/navigation';

import { getTokenExpiration } from '@/utils/auth.util';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Cookies from 'universal-cookie';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import { postAuthLoginMutation } from '@/lib/api/@tanstack/react-query.gen';
import { navigate } from '@/lib/routes/routes.util';

import { CookieNames } from '@/types/global.enum';

import { type LoginSchema, loginSchema } from './_schema/login.schema';

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onChange',
  });

  const mutation = useMutation({
    ...postAuthLoginMutation(),
    onSuccess: (data) => {
      // Save response to cookies
      const cookies = new Cookies();
      const token = data.token?.access_token;
      if (!token || !data.token) {
        toast.error('ログインに失敗しました: トークンが取得できませんでした');
        return;
      }
      const expiration = getTokenExpiration(token);
      // Add 1 day (24h) to the expiration if available
      let cookieExpires = expiration;
      if (cookieExpires) {
        cookieExpires = new Date(cookieExpires.getTime() + 24 * 60 * 60 * 1000);
      }
      cookies.set(CookieNames.Session, data.token, {
        path: '/',
        ...(cookieExpires ? { expires: cookieExpires } : {}),
      });

      // Show success toast
      toast.success('ログインに成功しました！');

      // Extract path only from redirect URL (remove query params)
      let destination = navigate('/');

      if (redirectUrl) {
        const url = new URL(redirectUrl, window.location.origin);
        destination = url.pathname;
      }

      // Redirect to the original page or home
      window.location.href = destination;
    },
    onError: (err: any) => {
      const msg = err?.message || 'ログインに失敗しました';
      toast.error(msg);
    },
  });

  async function onSubmit(data: LoginSchema) {
    mutation.mutate({
      body: {
        email: data.email,
        password: data.password,
      },
    });
  }

  return (
    <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">ログイン</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="text-sm">
                メールアドレス
              </label>
              <Input id="email" placeholder="example@domain.com" {...register('email')} />
              {errors.email && (
                <div className="text-destructive mt-1 text-sm">{String(errors.email.message)}</div>
              )}
            </div>

            <div>
              <label htmlFor="password" className="text-sm">
                パスワード
              </label>
              <Input
                id="password"
                type="password"
                placeholder="パスワード"
                {...register('password')}
              />
              {errors.password && (
                <div className="text-destructive mt-1 text-sm">
                  {String(errors.password.message)}
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? '送信中...' : 'ログイン'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-80px)] items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">ログイン</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-muted-foreground text-center">読み込み中...</div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
