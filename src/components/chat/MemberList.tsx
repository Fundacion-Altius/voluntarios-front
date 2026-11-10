'use client';

interface Member {
  user_id: string;
  role: string;
}

interface Props {
  members: Member[];
  onlineIds: Set<string>;
  title: string;
}

export function MemberList({ members, onlineIds, title }: Props) {
  return (
    <aside className="hidden w-48 shrink-0 border-l p-3 md:block">
      <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
      <ul className="space-y-2">
        {members.map((member) => (
          <li key={member.user_id} className="flex items-center gap-2 text-sm">
            <span className={`size-2 rounded-full ${onlineIds.has(member.user_id) ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
            <span className="truncate">{member.user_id.slice(0, 8)}</span>
            {member.role === 'admin' && <span className="text-[10px] text-muted-foreground">admin</span>}
          </li>
        ))}
      </ul>
    </aside>
  );
}
