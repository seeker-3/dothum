import {
  audioDestination,
  audioOut,
  audioToDrum,
  drumArrays,
  getCommonInterval,
  minInterval,
  PercussionInstruments,
  playBeat,
  primaryGainControl,
  sleepFor,
} from './helper'

export { drumArrays, PercussionInstruments }

const audioContext = new AudioContext()

// _________Functions to Access_________

// This event listener waits for a file to uploaded and then it determines the tempo of that audio file.
// It also converts the beats in that audio file into a patter than is pushed into drumArrays
export const inputAudioFile = async (
  file: File,
  instrumentLabel: PercussionInstruments
) => {
  const soundBuffer = await file.arrayBuffer()

  // pass buffer to the audioContext function decodeAudioData to get usable data
  const dataBuffer = await audioContext.decodeAudioData(soundBuffer)

  // get first channel. Channels represent different sources of audio. Like surround sound
  // That function return a vector of audio data
  const audioData = dataBuffer.getChannelData(0)

  audioToDrum(audioData, instrumentLabel)
}

// This function returns the BPM of the current drum machine recordings
export function getDrumBPM() {
  const intervals = []

  //These for loops iterate through the drum patterns recoding interval length
  //in between beats. The intervals are measured in increments of minInterval. The
  //variable count there to make sure intervals are only counted while the beat is playing.
  //The variable intCount is used to keep track of the number of minIntervals in between each beat.
  //It starts as 1 because if there is a beat at the next tile that would be an interval of 1
  let intCount = 1
  let count = 0
  for (let i = 0; i < drumArrays.length; i++) {
    for (let j = 1; j < drumArrays[0].beats.length; j++) {
      if (drumArrays[i].beats[j] === 1 && count === 1) {
        intervals.push(intCount)
        intCount = 0
      } else if (drumArrays[i].beats[j] === 1 && count === 0) {
        count = 1
        intCount = 0
      }
      intCount += count
    }
    count = 0
    intCount = 0
  }

  //it returns the tempo in BPM by dividing 60 by the seconds per beat.
  //The seconds per beat are found by multiplying most common interval by
  //minInterval in seconds. getCommonInterval finds the most common interval
  //(represented in # of minIntervals) in the audioData
  return 60 / ((minInterval / 1000) * getCommonInterval(intervals))
}

//adds a new drum line to the drumArrays that has no beats in it
export function addDrum(label: PercussionInstruments) {
  const beats = new Array(drumArrays[0]?.beats.length ?? 0).fill(0)
  drumArrays.push({ label, beats })
}

//removes a specific drum line from the drum machine
export function removeDrum(drumIndex: number) {
  drumArrays.splice(drumIndex, 1)
}

//adds 1 beat to the end of every drum line
export function addBeat() {
  for (let i = 0; i < drumArrays.length; i++) {
    drumArrays[i].beats.push(0)
  }
}

//removes 1 beat from the end of every drum line
export function removeBeat() {
  for (let i = 0; i < drumArrays.length; i++) {
    drumArrays[i].beats.pop()
  }
}

//shifts the pattern right
export function shiftRight(drumIndex: number) {
  drumArrays[drumIndex].beats.unshift(0)
  drumArrays[drumIndex].beats.pop()
}

//shifts the pattern left
export function shiftLeft(drumIndex: number) {
  drumArrays[drumIndex].beats.shift()
  drumArrays[drumIndex].beats.push(0)
}

//used to determine if the drum machine should be playing
let run = false

//This starts the drum machine loop playing until it is told
//otherwise
export async function playTrack(repeat = true) {
  run = true

  //This while loop tells each beat in the drum machine to play in order and
  //wait for the correct amount of time before playing the next
  while (run) {
    for (let i = 0; i < (drumArrays[0]?.beats.length || 1); i++) {
      if (!run) {
        break
      }
      await sleepFor(minInterval)
      playBeat(i)
    }
    if (!repeat) {
      break
    }
  }
}

export function pauseTrack() {
  run = false
}

//This function returns a blob containing the a .wav file of the drum machine
export async function getWAV() {
  const chunks = []

  //create a media recorder and set it to listen the final stop of the audio
  //before it goes out the speaker
  const mediaRecorder = new MediaRecorder(audioDestination.stream)
  primaryGainControl.disconnect(audioOut) //disconnect from the audioOut destination so it does play out loud
  primaryGainControl.connect(audioDestination)

  //await and record track
  mediaRecorder.start()
  await playTrack(false)
  mediaRecorder.stop()

  //when the data available event happens it adds the most recent blob piece to chunk
  mediaRecorder.ondataavailable = function (aud) {
    chunks.push(aud.data)
  }

  //This promise takes the chunks and puts them together as an audio .wav file in a new blob
  const trackCompletePromise = new Promise<Blob>(
    resolve =>
      (mediaRecorder.onstop = () =>
        resolve(new Blob(chunks, { type: 'audio/wav' })))
  )

  //reconnect the primaryGainControl to audioOut for future plays
  primaryGainControl.disconnect(audioDestination)
  primaryGainControl.connect(audioOut)

  return trackCompletePromise
}
