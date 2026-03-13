"use client";

import EmojiPicker from "@/components/EmojiPicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import {
  Channel,
  ChannelHeader,
  ChannelHeaderProps,
  MessageInput,
  MessageList,
  Thread,
  TypingIndicator,
  Window,
  useMessageComposer,
} from "stream-chat-react";

// Wrapper bridges shared EmojiPicker → stream's textComposer API
function StreamEmojiPicker() {
  const { textComposer } = useMessageComposer();
  return (
    <EmojiPicker
      onEmojiSelect={(emoji) => textComposer.insertText({ text: emoji })}
      // Match stream's own emoji button style class so it sits in the toolbar correctly
      buttonClassName="str-chat__emoji-picker-button"
    />
  );
}

interface ChatChannelProps {
  open: boolean;
  openSidebar: () => void;
}

export default function ChatChannel({ open, openSidebar }: ChatChannelProps) {
  return (
    <div className={cn("w-full md:block", !open && "hidden")}>
      <Channel
        EmojiPicker={StreamEmojiPicker}
        TypingIndicator={TypingIndicator}
        reactionOptions={[
          { Component: () => <>👍</>, type: "like", name: "Like" },
          { Component: () => <>❤️</>, type: "love", name: "Love" },
          { Component: () => <>😂</>, type: "haha", name: "Haha" },
          { Component: () => <>😮</>, type: "wow",  name: "Wow"  },
          { Component: () => <>😢</>, type: "sad",  name: "Sad"  },
          { Component: () => <>🔥</>, type: "fire", name: "Fire" },
        ]}
      >
        <Window>
          <CustomChannelHeader openSidebar={openSidebar} />
          <MessageList />
          <MessageInput audioRecordingEnabled />
        </Window>
        <Thread />
      </Channel>
    </div>
  );
}

interface CustomChannelHeaderProps extends ChannelHeaderProps {
  openSidebar: () => void;
}

function CustomChannelHeader({ openSidebar, ...props }: CustomChannelHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-full p-2 md:hidden">
        <Button size="icon" variant="ghost" onClick={openSidebar}>
          <Menu className="size-5" />
        </Button>
      </div>
      <ChannelHeader {...props} />
    </div>
  );
}