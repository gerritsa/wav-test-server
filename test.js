let regions = WaveSurfer.regions.create({
    regions: [
      
    ],
    dragSelection: false,
    slop: 10,
})

let wavesurfer = WaveSurfer.create({
container: '#waveform',
waveColor: '#46a6d8',
progressColor: '#FFF',
barWidth: 3,
barGap: 2,
height: 130,
cursorWidth: 1,
cursorColor: "white",
//pixelRatio: 1,
//scrollParent: true,
responsive: 1000,
normalize: true,
//minimap: true,
plugins: [
regions,
],
//  maxCanvasWidth: 100
});

wavesurfer.on("ready",() => {
wavesurfer.regions.clear();
wavesurfer.regions.add(  {
start: 0,
end: wavesurfer.getDuration() - (wavesurfer.getDuration() / 60),
color: 'hsla(200, 50%, 70%, 0.3)',
});
});


reload();

function trimLeft() {
// I had to fixed to two decimal if I don't do this not work, I don't know whyyy
const start = wavesurfer.regions.list[Object.keys(wavesurfer.regions.list)[0]].start.toFixed(2);
const end = wavesurfer.regions.list[Object.keys(wavesurfer.regions.list)[0]].end.toFixed(2);
const originalBuffer = wavesurfer.backend.buffer;
console.log(end, start,end , start,originalBuffer, (end - start) * (originalBuffer.sampleRate * 1))
var emptySegment = wavesurfer.backend.ac.createBuffer(
originalBuffer.numberOfChannels,
//segment duration
(end - start) * (originalBuffer.sampleRate * 1),
originalBuffer.sampleRate
);

for (var i = 0; i < originalBuffer.numberOfChannels; i++) {
var chanData = originalBuffer.getChannelData(i);
var segmentChanData = emptySegment.getChannelData(i);
for (var j = 0, len = chanData.length; j < end * originalBuffer.sampleRate; j++) {
segmentChanData[j] = chanData[j + (start * originalBuffer.sampleRate)];
}
}

wavesurfer.loadDecodedBuffer(emptySegment); // Here you go!
  // Not empty anymore, contains a copy of the segment!
console.log(end, start, end-start)
}

function deleteChunk() {
// I had to fixed to two decimal if I don't do this not work, I don't know whyyy
const start = wavesurfer.regions.list[Object.keys(wavesurfer.regions.list)[0]].start.toFixed(2);
const end = wavesurfer.regions.list[Object.keys(wavesurfer.regions.list)[0]].end.toFixed(2);
const originalBuffer = wavesurfer.backend.buffer;
console.log(end, start,end , start,originalBuffer, (end - start) * (originalBuffer.sampleRate * 1))
var emptySegment = wavesurfer.backend.ac.createBuffer(
originalBuffer.numberOfChannels,
(wavesurfer.getDuration() - (end - start)) * (originalBuffer.sampleRate * 1),
originalBuffer.sampleRate
);
console.log("total nueva wave",wavesurfer.getDuration(), end, start)

for (let i = 0; i < originalBuffer.numberOfChannels; i++) {
let chanData = originalBuffer.getChannelData(i);
let segmentChanData = emptySegment.getChannelData(i);
let offset = end * originalBuffer.sampleRate;
for (let j = 0; j < originalBuffer.length; j++) {
if (j < (start * originalBuffer.sampleRate)) {
//TODO: contemplate other cases when the region is at the end
segmentChanData[j] = chanData[j];
} else {
segmentChanData[j] = chanData[offset];
offset++;
}
}
}
//wavesurfer.drawer.clearWave();

//wavesurfer.empty();
// reload()
wavesurfer.loadDecodedBuffer(emptySegment); // Here you go!
  // Not empty anymore, contains a copy of the segment!
console.log(end, start, end-start)
//wavesurfer.drawBuffer();

}

function playRegion(){
wavesurfer.regions.list[Object.keys(wavesurfer.regions.list)[0]].play()
}

function reload(){

wavesurfer.load('https://ia902606.us.archive.org/35/items/shortpoetry_047_librivox/song_cjrg_teasdale_64kb.mp3');
setTimeout(()=>{

},1200)
//"https://cdn.filestackcontent.com/HB7k1wMDRMqdQdO1FtjX"
}



//FOR RECORD


var player = videojs("forRecord", {
controls: true,
width: 600,
height: 300,
plugins: {
wavesurfer: {
src: "live",
waveColor: "#fffa00",
progressColor: "#FAFCD2",
debug: true,
cursorWidth: 1,
msDisplayMax: 20,
hideScrollbar: true        
},
record: {
audio: true,
video: false,
maxLength: 20,
debug: true,
//audioEngine: "libvorbis.js",
//audioSampleRate: 32000
//audioEngine: "lamejs",
//audioWorkerURL: "lib/lamejs/worker-example/worker-realtime.js",
//audioSampleRate: 44100,
//audioBitRate: 128
}
}
}, function(){
// print version information at startup
var msg = 'Using video.js ' + videojs.VERSION +
' with videojs-record ' + videojs.getPluginVersion('record') +
', videojs-wavesurfer ' + videojs.getPluginVersion('wavesurfer') +
' and wavesurfer.js ' + WaveSurfer.VERSION;
videojs.log(msg);
});

// error handling
player.on('deviceError', function() {
console.log('device error:', player.deviceErrorCode);
});

// user clicked the record button and started recording
player.on('startRecord', function() {
$(".record-container").show();
console.log('started recording!');
});

// user completed recording and stream is available
player.on('finishRecord', function() {
$(".record-container").hide();
// the blob object contains the recorded data that
// can be downloaded by the user, stored on server etc.
console.log('finished recording: ', player.recordedData);

let fileReader = new FileReader();
fileReader.addEventListener('load', e =>
wavesurfer.loadArrayBuffer(e.target.result)
);
fileReader.readAsArrayBuffer(player.recordedData);

player.record().saveAs({'audio': 'my-audio-file-name.ogg'});
});

player.on('ready', function() {
player.record().getDevice();
});

function startRecording(event){
if (!player.record().isRecording() || (player.record().isRecording() && player.record().paused)) {
player.record().start();

} else {
player.record().stop();
}
}