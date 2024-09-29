import { ConfigProvider, theme } from 'antd'
import CLayout from './components/Layout'

function App(): JSX.Element {
  return (
    // <ConfigProvider theme={{ algorithm: undefined }}>
    <div>
      <CLayout></CLayout>
    </div>
    // </ConfigProvider>
  )
}

export default App
