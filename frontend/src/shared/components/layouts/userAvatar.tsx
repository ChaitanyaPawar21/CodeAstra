interface UserAvatarProps {
  /** Width/height in pixels. */
  size?: number;
  className?: string;
}

/**
 * Neutral default profile picture (grey circle + white head-and-shoulders
 * silhouette, like Instagram's placeholder). Inline SVG: no network request,
 * no gendered artwork.
 */
export default function UserAvatar({ size = 32, className = '' }: UserAvatarProps) {
  return (
    <span
      role="img"
      aria-label="User avatar"
      className={`inline-block shrink-0 rounded-full border border-black overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden="true" className="block">
        <rect width="40" height="40" fill="#DBDBDB" />
        <circle cx="20" cy="15" r="7" fill="#FFFFFF" />
        <path d="M4 40a16 16 0 0 1 32 0z" fill="#FFFFFF" />
      </svg>
    </span>
  );
}