
export class SimpleWebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private onMessage?: (data: any) => void;
  private onStateChange?: (state: RTCPeerConnectionState) => void;

  constructor() {
    this.remoteAudio = new Audio();
    this.remoteAudio.autoplay = true;
  }

  async connect(clientSecret: string, onMessage?: (data: any) => void, onStateChange?: (state: RTCPeerConnectionState) => void) {
    this.onMessage = onMessage;
    this.onStateChange = onStateChange;

    this.peerConnection = new RTCPeerConnection();

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (this.onStateChange && state) {
        this.onStateChange(state);
      }
    };

    this.peerConnection.ontrack = (event) => {
      if (event.track.kind === 'audio' && this.remoteAudio) {
        this.remoteAudio.srcObject = event.streams[0];
      }
    };

    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (this.onMessage) {
            this.onMessage(data);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    };

    // Get microphone
    this.localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.localStream.getAudioTracks().forEach(track => {
      this.peerConnection?.addTrack(track, this.localStream!);
    });

    this.dataChannel = this.peerConnection.createDataChannel('oai-events');
    
    this.dataChannel.onopen = () => {
      // Configure session and start interview immediately
      this.sendMessage({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: 'You are a friendly career interviewer. Start by greeting the user and asking them to introduce themselves and tell you about their background. Keep questions conversational and ask one at a time.',
          voice: 'alloy',
          input_audio_format: 'pcm16',
          output_audio_format: 'pcm16',
          input_audio_transcription: {
            model: 'whisper-1'
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 1000
          },
          temperature: 0.8,
          max_response_output_tokens: 4096
        }
      });

      // Start the interview immediately
      setTimeout(() => {
        this.sendMessage({
          type: 'conversation.item.create',
          item: {
            type: 'message',
            role: 'user',
            content: [{ type: 'input_text', text: 'Hello, I\'m ready to start the interview.' }]
          }
        });
        this.sendMessage({ type: 'response.create' });
      }, 1000);
    };

    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    const response = await fetch('https://api.openai.com/v1/realtime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clientSecret}`,
        'Content-Type': 'application/sdp',
      },
      body: offer.sdp,
    });

    if (!response.ok) {
      throw new Error(`Failed to connect: ${response.status}`);
    }

    const answerSdp = await response.text();
    await this.peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp,
    });
  }

  sendMessage(message: any) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
    }
  }

  toggleMic(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  toggleAudio(enabled: boolean) {
    if (this.remoteAudio) {
      this.remoteAudio.muted = !enabled;
    }
  }

  disconnect() {
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    if (this.remoteAudio) {
      this.remoteAudio.srcObject = null;
    }
  }
}
