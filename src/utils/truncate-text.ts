type TruncateTextOptions = {
  maxLength: number;
  ellipsis?: string;
};

export default function TruncateText(text: string, options: TruncateTextOptions): string {
  const { maxLength, ellipsis = "..." } = options;

  if (text.length <= maxLength) {
    return text;
  }

  const truncateAt = maxLength - ellipsis.length;

  if (truncateAt <= 0) {
    return ellipsis.slice(0, maxLength);
  }

  return text.slice(0, truncateAt) + ellipsis;
}
