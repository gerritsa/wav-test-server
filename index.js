import WaveSurfer from 'https://unpkg.com/wavesurfer.js@7/dist/wavesurfer.esm.js'
import RecordPlugin from 'https://unpkg.com/wavesurfer.js@7/dist/plugins/record.esm.js'

let wavesurfer, record
let scrollingWaveform = false

const createWaveSurfer = () => {
  // Create an instance of WaveSurfer
  if (wavesurfer) {
    wavesurfer.destroy()
  }
  wavesurfer = WaveSurfer.create({
    container: '#mic',
    waveColor: 'rgb(200, 0, 200)',
    progressColor: 'rgb(100, 0, 100)',
  })

  record
  // Initialize the Record plugin
  record = wavesurfer.registerPlugin(RecordPlugin.create({ scrollingWaveform, renderRecordedAudio: false }))
  // Render recorded audio
  record.on('record-end', (blob) => {
    const container = document.querySelector('#recordings')
    const recordedUrl = URL.createObjectURL(blob)

    // Create wavesurfer from the recorded audio
    const wavesurfer = WaveSurfer.create({
      container,
      waveColor: 'rgb(200, 100, 0)',
      progressColor: 'rgb(100, 50, 0)',
      url: recordedUrl,
    })

    // Play button
    const button = container.appendChild(document.createElement('button'))
    button.textContent = 'Play'
    button.onclick = () => wavesurfer.playPause()
    wavesurfer.on('pause', () => (button.textContent = 'Play'))
    wavesurfer.on('play', () => (button.textContent = 'Pause'))

    console.log(blob)
    const audioBuffer = ConvertBlobToAudioBuffer(blob).then(audioBuffer => { 
      console.log(audioBuffer)
      const channelBuffers = [];
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        channelBuffers.push(audioBuffer.getChannelData(channel));
      }  
      console.log(channelBuffers)
      const wavData = audioBufferToWav(audioBuffer.sampleRate, channelBuffers);
      let blob2 = new Blob([new DataView(wavData)], { type: 'audio/wav' });
      const container2 = document.querySelector('#recordings')
      const recordedUrl2 = URL.createObjectURL(blob2)
      const link2 = container2.appendChild(document.createElement('a'))
      Object.assign(link2, {
        href: recordedUrl2,
        download: 'recording.wav',
        textContent: 'Download recording',
      })
    })

    // Download link
    const link = container.appendChild(document.createElement('a'))
    Object.assign(link, {
      href: recordedUrl,
      download: 'recording.' + blob.type.split(';')[0].split('/')[1] || 'webm',
      textContent: 'Download recording',
    })
  })
  pauseButton.style.display = 'none'
  recButton.textContent = 'Record'

  record.on('record-progress', (time) => {
    updateProgress(time)
  })
}

const progress = document.querySelector('#progress')
const updateProgress = (time) => {
  // time will be in milliseconds, convert it to mm:ss format
  const formattedTime = [
    Math.floor((time % 3600000) / 60000), // minutes
    Math.floor((time % 60000) / 1000), // seconds
  ]
    .map((v) => (v < 10 ? '0' + v : v))
    .join(':')
  progress.textContent = formattedTime
}

const pauseButton = document.querySelector('#pause')
pauseButton.onclick = () => {
  if (record.isPaused()) {
    record.resumeRecording()
    pauseButton.textContent = 'Pause'
    return
  }

  record.pauseRecording()
  pauseButton.textContent = 'Resume'
}

const micSelect = document.querySelector('#mic-select')
{
  // Mic selection
  RecordPlugin.getAvailableAudioDevices().then((devices) => {
    devices.forEach((device) => {
      const option = document.createElement('option')
      option.value = device.deviceId
      option.text = device.label || device.deviceId
      micSelect.appendChild(option)
    })
  })
}
// Record button
const recButton = document.querySelector('#record')

recButton.onclick = () => {
  if (record.isRecording() || record.isPaused()) {
    record.stopRecording()
    recButton.textContent = 'Record'
    pauseButton.style.display = 'none'
    return
  }

  recButton.disabled = true

  // reset the wavesurfer instance

  // get selected device
  const deviceId = micSelect.value
  record.startRecording({ deviceId }).then(() => {
    recButton.textContent = 'Stop'
    recButton.disabled = false
    pauseButton.style.display = 'inline'
  })
}
document.querySelector('input[type="checkbox"]').onclick = (e) => {
  scrollingWaveform = e.target.checked
  createWaveSurfer()
}

createWaveSurfer()

async function ConvertBlobToAudioBuffer(blob) {
  var arrayBuffer = await blob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer); 
  return await audioBuffer;
}


const finishButton = document.querySelector('#finish')
finishButton.onclick = () => {
  var audioBuffer = wavesurfer.getDecodedData()
  console.log(audioBuffer);
  var wav = audioBufferToWav(audioBuffer, 3);
  console.log(wav);
  let blob = new Blob([new DataView(wav)], { type: 'audio/wav' });
  console.log(blob.arrayBuffer());
  const container = document.querySelector('#recordings')
  const recordedUrl = URL.createObjectURL(blob)
  const link = container.appendChild(document.createElement('a'))
  Object.assign(link, {
    href: recordedUrl,
    download: 'recording.wav',
    textContent: 'Download recording',
  })
}

function audioBufferToWav(sampleRate, channelBuffers) {
  const totalSamples = channelBuffers[0].length * channelBuffers.length;

  const buffer = new ArrayBuffer(44 + totalSamples * 2);
  const view = new DataView(buffer);

  const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  /* RIFF identifier */
  writeString(view, 0, "RIFF");
  /* RIFF chunk length */
  view.setUint32(4, 36 + totalSamples * 2, true);
  /* RIFF type */
  writeString(view, 8, "WAVE");
  /* format chunk identifier */
  writeString(view, 12, "fmt ");
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, 1, true);
  /* channel count */
  view.setUint16(22, channelBuffers.length, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * 4, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, channelBuffers.length * 2, true);
  /* bits per sample */
  view.setUint16(34, 16, true);
  /* data chunk identifier */
  writeString(view, 36, "data");
  /* data chunk length */
  view.setUint32(40, totalSamples * 2, true);

  // floatTo16BitPCM
  let offset = 44;
  for (let i = 0; i < channelBuffers[0].length; i++) {
    for (let channel = 0; channel < channelBuffers.length; channel++) {
      const s = Math.max(-1, Math.min(1, channelBuffers[channel][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }

  return buffer;
}


/*
<html>
  <h1 style="margin-top: 0">Press Record to start recording 🎙️</h1>

  <p>
    📖 <a href="https://wavesurfer.xyz/docs/classes/plugins_record.RecordPlugin">Record plugin docs</a>
  </p>

  <button id="record">Record</button>
  <button id="pause" style="display: none;">Pause</button>

  <select id="mic-select">
    <option value="" hidden>Select mic</option>
  </select>
  <label style="display:inline-block;"><input type="checkbox"  /> Scrolling waveform</label>
  <p id="progress">00:00</p>

  <div id="mic" style="border: 1px solid #ddd; border-radius: 4px; margin-top: 1rem"></div>

  <div id="recordings" style="margin: 1rem 0"></div>

  <style>
    button {
      min-width: 5rem;
      margin: 1rem 1rem 1rem 0;
    }
  </style>
</html>
*/
