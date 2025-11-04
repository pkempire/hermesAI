import { lazy, memo, Suspense } from 'react'

// Lazy load template marketplace for better initial load performance
const TemplateMarketplace = lazy(() => import('./template-marketplace').then(module => ({ default: module.TemplateMarketplace })))

// Memoize the component for better performance
export const EmptyScreen = memo(function EmptyScreen({
  submitMessage,
  className,
  hideHeader = false
}: {
  submitMessage: (message: string) => void
  className?: string
  hideHeader?: boolean
}) {
  return (
    <div className={`mx-auto w-full max-w-7xl transition-all ${className}`}>
      <div className="space-y-6">
        {/* Template Marketplace with Suspense for lazy loading */}
        <Suspense fallback={
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        }>
          <TemplateMarketplace
            onSelectTemplate={(template) => {
              submitMessage(template.message)
            }}
          />
        </Suspense>
      </div>
    </div>
  )
})
