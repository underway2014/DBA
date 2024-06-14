import Versions from './components/Versions'
import electronLogo from './assets/electron.svg'
import { useEffect, useState } from 'react'
import axios from 'axios'

function App(): JSX.Element {
  const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  console.log('in app tsx')
  // useEffect(()=> {
    console.log('useEffect')
    
  // }, [])

  function getData() {
  //   fetch('http://localhost:3000'
  // )
  //   .then(response => response.json())
  //   .then(json => {
  //     console.log('fetch res: ', json)
  //   })

    axios.get(`http://localhost:3000/list`)
      .then(res => {
        console.log('client: ', res, res.data)
        const persons = res.data;
      })
  }

  return (
    <>
      <img alt="logo" className="logo" src={electronLogo} />
      <div className="creator">Powered by electron-vite</div>
      <div className="text">
        Build an Electron app with <span className="react">React</span>
        &nbsp;and <span className="ts">TypeScript</span>
      </div>
      <p className="tip">
        Please try pressing <code>F12</code> to open the devTool
      </p>
      <div className="actions">
        <div className="action">
          <a href="https://electron-vite.org/" target="_blank" rel="noreferrer">
            Documentation
          </a>
        </div>
        <div className="action">
          <a target="_blank" rel="noreferrer" onClick={getData}>
            Send IPC
          </a>
        </div>
      </div>
      <Versions></Versions>
    </>
  )
}

export default App
