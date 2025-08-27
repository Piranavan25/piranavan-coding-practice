import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import DrawScreen from './canvas/drawScreen'

function App() {
  const [count, setCount] = useState(0)

  return <DrawScreen/>
}

export default App
