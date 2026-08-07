import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import type { GetCrmBlacklistByIdResponse } from '@/lib/api/types.gen';

import { MATCH_CONDITION_LABEL } from '../../_constants/blacklist.constants';

type MatchConditions = NonNullable<GetCrmBlacklistByIdResponse>['blacklist']['matchConditions'];

interface BlacklistMatchConditionsProps {
  matchConditions: MatchConditions;
}

export function BlacklistMatchConditions({ matchConditions }: BlacklistMatchConditionsProps) {
  const keys = Object.keys(matchConditions) as Array<keyof MatchConditions>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">照合条件</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3">
          {keys.map((key) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">{MATCH_CONDITION_LABEL[key]}</span>
              {matchConditions[key] ? (
                <Badge
                  variant="outline"
                  className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]"
                >
                  一致
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground text-[10px]">
                  不一致
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
