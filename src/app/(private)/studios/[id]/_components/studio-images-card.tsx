import Image from 'next/image';

import type { StudioImage } from '@/app/api/_schemas/studio-detail.schema';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface StudioImagesCardProps {
  images: StudioImage[];
}

export function StudioImagesCard({ images }: StudioImagesCardProps) {
  if (!images || images.length === 0) {
    return (
      <Card>
        <CardContent className="px-4">
          <h2 className="text-sm font-bold">スタジオ画像</h2>
          <p className="text-muted-foreground mt-2 text-center text-sm">画像はありません</p>
        </CardContent>
      </Card>
    );
  }

  const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <Card>
      <CardContent className="px-4">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-sm font-bold">スタジオ画像</h2>
          <Badge variant="secondary" className="text-[10px]">
            {sortedImages.length}枚
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {sortedImages.map((image) => (
            <div key={image.image_id} className="bg-muted aspect-[3/2] overflow-hidden rounded-lg">
              <Image
                src={image.url}
                alt={image.alt}
                width={600}
                height={400}
                className="size-full object-cover"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
