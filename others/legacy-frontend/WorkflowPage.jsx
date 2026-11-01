import { useLayoutEffect, useRef } from 'react';
import { Messages } from './Common';

/** Existing authorized Django workflow DOM remains intact during migration.
 * Moving its actual nodes preserves form values, CSRF fields, uploads and the
 * existing inline page listeners. Never parse or execute arbitrary HTML/scripts.
 * Native React pages can replace individual routes without changing their rules.
 */
export default function WorkflowPage({state, source}) {
  const host=useRef(null);
  useLayoutEffect(()=>{
    if(!source)return;
    source.id='main-content';source.tabIndex=-1;
    source.classList.add('workflow-content');
    host.current.appendChild(source);
    import('../../static/js/app.js');
    if(source.querySelector('[data-uploader],[data-sigpad],[data-wizard]'))import('../../static/js/field.js');
    return ()=>source.remove();
  },[source]);
  return <><Messages messages={state.messages}/><div ref={host} className="workflow-host"/></>;
}
