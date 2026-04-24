interface PageHeaderProps {
  heading: string
  description: string
}

export function PageHeader({ heading, description }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-text mb-2">{heading}</h1>
      <p className="text-text-muted">{description}</p>
    </div>
  )
}
