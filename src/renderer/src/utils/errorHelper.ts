import { message } from 'antd';
import moment from 'moment';
import { LogType } from './constant';


export const addErrorLog = ({logList, setLogList, text, action}) => {
      setLogList([...logList,{
        type: LogType.ERROR,
        action,
        date: moment().format('YYYY-MM-DD HH:mm:ss'),
        text
      }])

      message.error({
        type: 'error',
        content: text
      });
}