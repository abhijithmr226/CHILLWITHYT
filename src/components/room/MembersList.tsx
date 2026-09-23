import React, { useState } from 'react';
import { RoomMember, Song } from '../../types';
import { Crown, Headphones, UserPlus, Check, Copy } from 'lucide-react';
import { resolveAvatar } from '../../utils/avatar';

interface MembersListProps {
  members: RoomMember[];
  currentSong?: Song | null;
  onInvite?: () => void;
}

export const MembersList: React.FC<MembersListProps> = ({ members, currentSong, onInvite }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onInvite?.();
  };

  return (
    <div className="flex flex-col h-full bg-[#212121] border-r border-[#272727] p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#272727]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">Members</h3>
            <span className="text-[11px] bg-[#272727] text-[#AAAAAA] px-2 py-0.5 rounded-full font-mono">
              {members.length}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] text-emerald-400 font-medium">Online</span>
          </div>
        </div>

        <button
          onClick={handleCopyInvite}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#272727] hover:bg-[#383838] border border-[#383838] text-xs font-medium text-white transition"
          title="Copy room link to invite friends"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <UserPlus className="w-3.5 h-3.5 text-[#FF0000]" />}
          <span>{copied ? 'Copied!' : 'Invite'}</span>
        </button>
      </div>

      {/* Members List */}
      <div className="flex-1 overflow-y-auto pt-3 space-y-2.5">
        {members.map((member) => (
          <div
            key={member.userId}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-[#272727] transition group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img
                  src={resolveAvatar(member.avatarUrl, member.username || member.userId)}
                  alt={member.displayName}
                  className="w-9 h-9 rounded-full object-cover ring-1 ring-[#272727]"
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#212121]" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white truncate group-hover:text-[#FF4D4D] transition">
                    {member.displayName}
                  </span>
                  {member.role === 'owner' && (
                    <span title="Host"><Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" /></span>
                  )}
                  {member.role === 'dj' && (
                    <span className="text-[9px] bg-[#FF0000]/20 text-[#FF4D4D] px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                      DJ
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-[#AAAAAA] truncate">
                  <Headphones className="w-3 h-3 text-[#FF0000] shrink-0" />
                  <span className="truncate">
                    {member.isListening && currentSong ? `Listening now` : 'Idle'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
