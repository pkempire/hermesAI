import { FC, memo } from 'react'
import ReactMarkdown, { Options } from 'react-markdown'

type MarkdownProps = Options & {
  className?: string
}

const Markdown: FC<MarkdownProps> = ({ className, ...props }) => {
  const rendered = <ReactMarkdown {...props} />

  return className ? <div className={className}>{rendered}</div> : rendered
}

export const MemoizedReactMarkdown: FC<MarkdownProps> = memo(
  Markdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
)
