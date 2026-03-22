import { createFileRoute } from '@tanstack/react-router'
import logo from '../logo.svg'

export const Route = createFileRoute('/')({
  component: App,
})

function App() {
  return (
    <div className="text-center">
      <header className="min-h-screen flex flex-col items-center justify-center text-white text-[calc(10px+2vmin)] p-10">
        <img src={logo} alt="logo" />
      </header>
    </div>
  )
}
