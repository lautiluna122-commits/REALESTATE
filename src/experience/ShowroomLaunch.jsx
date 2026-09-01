import { useEffect, useState } from 'react';
import ShowroomV3 from './ShowroomV3';
import './showroom-launch.css';

export default function ShowroomLaunch() {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setEntered(true), 4200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className={`showroom-launch ${entered ? 'is-entered' : ''}`}>
      <ShowroomV3 />
      {!entered && (
        <div className="launch-cover" onClick={() => setEntered(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setEntered(true)}>
          <div className="launch-grain" />
          <div className="launch-mark"><span>OM</span></div>
          <div className="launch-location">PUNTA DEL ESTE · URUGUAY</div>
          <div className="launch-title">Ocean <i>Mansions</i></div>
          <div className="launch-rule" />
          <div className="launch-caption">DIGITAL REAL ESTATE SHOWROOM</div>
          <button>Entrar al showroom <b>↗</b></button>
          <div className="launch-progress"><span /></div>
        </div>
      )}
    </div>
  );
}
