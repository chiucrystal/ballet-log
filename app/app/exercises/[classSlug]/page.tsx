import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getClassBySlug, slugify } from '@/lib/exercises-tree'
import { Breadcrumbs } from '@/components/breadcrumbs'

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classSlug: string }>
}) {
  const { classSlug } = await params
  const cls = getClassBySlug(classSlug)
  if (!cls) notFound()

  return (
    <div>
      <Breadcrumbs
        items={[
          { label: 'Syllabus', href: '/exercises' },
          { label: cls.category },
        ]}
      />
      <h1 className="font-mono text-[28px] leading-[1.2] mb-6">{cls.category}</h1>
      <div className="space-y-3">
        {cls.subgroups.map((sg) => (
          <Link
            key={sg.name}
            href={`/exercises/${classSlug}/${slugify(sg.name)}`}
            className="block rounded-sm border border-border px-4 py-3.5 hover:border-foreground/30 transition-colors"
          >
            <span className="font-heading text-base">{sg.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
