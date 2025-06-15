import Link from "next/link";


export function renderCaptionWithTags(caption: string) {
  const parts = caption.split(/(#\w[\wÀ-ỹ_]*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("#")) {
      const tag = part.slice(1); // remove #
      return (
        <Link key={index} href={`/tags/${tag}`}>
          <span className="text-blue-500 hover:underline mr-1">{part}</span>
        </Link>
      );
    } else {
      return <span key={index}>{part}</span>;
    }
  });
}
