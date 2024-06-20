// import { useState } from 'react'
import CLayout from './components/Layout';

function App (): JSX.Element {
  // const [data, setData] = useState({ rows: [{ id: 1, name: 'test name' }] })
  // const ipcHandle = (): void => window.electron.ipcRenderer.send('ping')

  console.log('in app tsx')
  // useEffect(()=> {
  console.log('useEffect')

  // }, [])



  return (
    <div>
      <CLayout></CLayout>
    </div>
    /* <ul>
     {data.rows.map(item => (
       <li key={item.id}>
         <a href={item.name}>{item.name}</a>
       </li>
     ))}
   </ul> */

    /* <div className="actions">
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
    <Versions></Versions> */
  )
}

export default App
