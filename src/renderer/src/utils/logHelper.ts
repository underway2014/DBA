import { message } from 'antd';
import moment from 'moment';
import { LogType } from './constant';
import { act } from 'react';


export const addLog = ({logList, setLogList, text, action, type}) => {
      setLogList([...logList,{
        type,
        action,
        date: moment().format('YYYY-MM-DD HH:mm:ss'),
        text
      }])

      switch(type) {
        case LogType.ERROR: {
          message.error({
            type: 'error',
            content: `${action} fail`
          });
          break
        }
        case LogType.SUCCESS: {
          message.success({
            type: 'success',
            content: `${action} success`
          });
          break
        }
      }
}