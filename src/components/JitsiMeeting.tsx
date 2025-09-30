// Add TypeScript declaration for JitsiMeetExternalAPI
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}
import React from 'react';

const JITSI_DOMAIN = 'meet.jit.si';

const JitsiMeeting = ({ roomName }) => {
  const jitsiContainerId = 'jitsi-container';

  React.useEffect(() => {
    // Load Jitsi Meet script
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      // Create Jitsi Meet API instance
      const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
        roomName,
        parentNode: document.getElementById(jitsiContainerId),
        width: '100%',
        height: 600,
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
        },
      });
      // Optionally, add event listeners here
    };
    document.body.appendChild(script);
    return () => {
      // Clean up Jitsi iframe
      const container = document.getElementById(jitsiContainerId);
      if (container) container.innerHTML = '';
    };
  }, [roomName]);

  return (
    <div>
      <div id={jitsiContainerId} style={{ width: '100%', height: 600, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.1)' }} />
    </div>
  );
};

export default JitsiMeeting;
