import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const AVATAR_COLOR_TOKENS = ['info', 'success', 'warning', 'destructive', 'primary'];

function pickColorToken(seed: string) {
  const hash = Array.from(seed).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLOR_TOKENS[hash % AVATAR_COLOR_TOKENS.length];
}

interface InstructorAvatarProps {
  id: string;
  name: string;
  photoUrl?: string | null;
}

export function InstructorAvatar({ id, name, photoUrl }: InstructorAvatarProps) {
  const token = pickColorToken(id || name);
  const initial = name.trim().charAt(0) || '?';

  return (
    <Avatar>
      {photoUrl && <AvatarImage src={photoUrl} alt={name} />}
      <AvatarFallback className={`bg-${token}/10 text-${token} font-medium`}>
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
