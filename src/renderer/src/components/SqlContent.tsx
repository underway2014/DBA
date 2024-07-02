import React, {forwardRef, useImperativeHandle, useRef, useState} from 'react';
import { Input } from 'antd';
import { TextAreaRef } from 'antd/es/input/TextArea';

const { TextArea } = Input;

const SqlContent: React.FC = (props, parentRef) => {
  const inputRef = useRef<TextAreaRef>(null);
  const [commentText,setCommentText] = useState("")

  useImperativeHandle(parentRef, () => {
    return {
      getTxt() {
        return commentText
      }
    }
  })

  return (
    <>
      <TextArea rows={4} onChange={e => setCommentText(e.target.value)} ref={inputRef}  />
      <br />
    </>
  );
}
  

export default forwardRef(SqlContent);