import { Skeleton } from '@/components/ui/skeleton'

export function ChatHistorySkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex h-12 flex-col gap-2 rounded-xl p-2 border border-gray-100">
          <Skeleton className="h-4 w-3/4 rounded-md bg-gray-100" />
          <Skeleton className="h-3 w-1/2 rounded-md bg-gray-50" />
        </div>
      ))}
    </div>
  )
}
