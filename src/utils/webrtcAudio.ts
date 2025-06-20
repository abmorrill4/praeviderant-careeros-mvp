
export class WebRTCAudioManager {
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudio: HTMLAudioElement | null = null;
  private onDataChannelMessage?: (data: any) => void;
  private onConnectionStateChange?: (state: RTCPeerConnectionState) => void;

  constructor() {
    this.remoteAudio = new Audio();
    this.remoteAudio.autoplay = true;
  }

  async initialize(
    clientSecret: string,
    onMessage?: (data: any) => void,
    onStateChange?: (state: RTCPeerConnectionState) => void
  ) {
    this.onDataChannelMessage = onMessage;
    this.onConnectionStateChange = onStateChange;

    // Create peer connection
    this.peerConnection = new RTCPeerConnection();

    // Set up connection state monitoring
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('WebRTC connection state:', state);
      if (this.onConnectionStateChange && state) {
        this.onConnectionStateChange(state);
      }
    };

    // Handle remote audio stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.track.kind === 'audio' && this.remoteAudio) {
        this.remoteAudio.srcObject = event.streams[0];
      }
    };

    // Set up data channel for receiving messages
    this.peerConnection.ondatachannel = (event) => {
      const channel = event.channel;
      console.log('Received data channel:', channel.label);
      
      channel.onopen = () => console.log('Data channel opened');
      channel.onclose = () => console.log('Data channel closed');
      channel.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received data channel message:', data.type);
          if (this.onDataChannelMessage) {
            this.onDataChannelMessage(data);
          }
        } catch (error) {
          console.error('Error parsing data channel message:', error);
        }
      };
    };

    // Get user media
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Add local audio track
      this.localStream.getAudioTracks().forEach(track => {
        this.peerConnection?.addTrack(track, this.localStream!);
      });

      console.log('Local audio stream added');
    } catch (error) {
      console.error('Error getting user media:', error);
      throw error;
    }

    // Create data channel for sending messages
    this.dataChannel = this.peerConnection.createDataChannel('oai-events');
    
    this.dataChannel.onopen = () => {
      console.log('Data channel opened');
      // Send session configuration
      this.sendMessage({
        type: 'session.update',
        session: {
          modalities: ['text', 'audio'],
          instructions: 'You are a friendly, professional career interviewer. Ask thoughtful questions about the user\'s background, experience, and career goals. Keep questions conversational and ask one at a time. Be encouraging and show genuine interest in their responses.',
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
    };

    // Create offer
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);

    // Send offer to OpenAI
    const response = await fetch('https://api.openai.com/v1/realtime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clientSecret}`,
        'Content-Type': 'application/sdp',
      },
      body: offer.sdp,
    });

    if (!response.ok) {
      throw new Error(`Failed to send offer: ${response.status}`);
    }

    const answerSdp = await response.text();
    await this.peerConnection.setRemoteDescription({
      type: 'answer',
      sdp: answerSdp,
    });

    console.log('WebRTC connection established');
  }

  sendMessage(message: any) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(JSON.stringify(message));
      console.log('Sent message:', message.type);
    } else {
      console.warn('Data channel not ready, cannot send message');
    }
  }

  setMicrophoneEnabled(enabled: boolean) {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  setAudioOutputEnabled(enabled: boolean) {
    if (this.remoteAudio) {
      this.remoteAudio.muted = !enabled;
    }
  }

  getAudioLevel(): number {
    // This would require audio analysis - simplified for now
    return 0;
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

    console.log('WebRTC connection disconnected');
  }
}
