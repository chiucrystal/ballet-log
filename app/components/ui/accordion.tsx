'use client'

import { Accordion } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

function AccordionRoot({ className, ...props }: Accordion.Root.Props & { className?: string }) {
  return <Accordion.Root className={cn('w-full', className)} {...props} />
}

function AccordionItem({ className, ...props }: Accordion.Item.Props & { className?: string }) {
  return <Accordion.Item className={cn('border-b border-border', className)} {...props} />
}

function AccordionTrigger({
  className,
  children,
  ...props
}: Accordion.Trigger.Props & { className?: string }) {
  return (
    <Accordion.Header className="flex">
      <Accordion.Trigger
        className={cn(
          'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline [&[aria-expanded=true]>svg]:rotate-180',
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </Accordion.Trigger>
    </Accordion.Header>
  )
}

function AccordionContent({ className, children, ...props }: Accordion.Panel.Props & { className?: string }) {
  return (
    <Accordion.Panel className={cn('overflow-hidden text-sm', className)} {...props}>
      <div className="pb-4 pt-0">{children}</div>
    </Accordion.Panel>
  )
}

export { AccordionRoot, AccordionItem, AccordionTrigger, AccordionContent }
