export function ErrorDisplay({ errors }: { errors?: Array<any> }) {
  if (!errors?.length) {
    return null
  }

  return (
    <div className="text-sm text-red-400">
      {errors.map((error, i) => (
        <p key={`field-error-${i}`}>
          *
          {error.message}
        </p>
      ))}
    </div>
  )
}
