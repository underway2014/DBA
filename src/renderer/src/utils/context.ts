import { ILogItem } from '@renderer/interface'
import { createContext } from 'react'

type ContextOpt = {
  setLogList: (a: ILogItem[]) => void
  logList: ILogItem[]
  isDark: boolean
}

const CustomContext = createContext<ContextOpt>({})

export default CustomContext
