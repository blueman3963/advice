import { useState } from 'react'

import Intro from './components/intro'
import Likes from './components/likes'
import Dislikes from './components/dislikes'
import Main from './components/main'

function App() {

  const [step, setStep] = useState(0)
  const [likes, setLikes] = useState([])
  const [dislikes, setDislikes] = useState([])

  const renderStep = () => {
    switch(step) {
      case 0:
        return <Intro setStep={setStep} />
      case 1:
        return <Likes setStep={setStep} setList={setLikes} />
      case 2:
        return <Dislikes setStep={setStep} setList={setDislikes} />
      case 3:
        return <Main setStep={setStep} likesList={likes} dislikesList={dislikes}/>
      default:
        return
    }
  }

  return (
    <>
      {
        renderStep()
      }
    </>
  )
}

export default App;
