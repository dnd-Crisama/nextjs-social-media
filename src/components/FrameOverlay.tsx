interface FrameData {
  id: string;
  name: string;
  imageUrl: string;
}

interface FrameOverlayProps {
  frame: FrameData | null;
  type: "avatar" | "banner";
}

export default function FrameOverlay({ frame, type }: FrameOverlayProps) {
  if (!frame) return null;

  if (type === "avatar") {
    return (
      <div className="absolute inset-0 pointer-events-none rounded-full overflow-hidden">
        <img
          src={frame.imageUrl}
          alt={frame.name}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // type === "banner"
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <img
        src={frame.imageUrl}
        alt={frame.name}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
