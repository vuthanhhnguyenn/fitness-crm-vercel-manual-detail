'use client';

import { useCallback } from 'react';

import { useRouter } from 'next/navigation';

import { BackLink } from '@/components/common/back-link';
import { PageHeader } from '@/components/common/page-header';

import { navigate } from '@/lib/routes/routes.util';

import { BannerForm } from '../_components/banner-form/banner-form';

export default function BannerCreatePage() {
  const router = useRouter();

  const navigateToList = useCallback(() => {
    router.push(navigate('/banners'));
  }, [router]);

  return (
    <>
      <PageHeader
        breadcrumb={<BackLink label="バナー管理に戻る" href={navigate('/banners')} />}
        title="バナー新規登録"
      />

      <BannerForm mode="create" onNavigateBack={navigateToList} />
    </>
  );
}
