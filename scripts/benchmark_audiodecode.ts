
import { performance } from 'perf_hooks';

// --- Mocks for Node Environment ---

class MockAudioBuffer {
  length: number;
  sampleRate: number;
  numberOfChannels: number;
  _data: Float32Array[];

  constructor(options: { length: number; numberOfChannels: number; sampleRate: number }) {
    this.length = options.length;
    this.numberOfChannels = options.numberOfChannels;
    this.sampleRate = options.sampleRate;
    this._data = Array.from({ length: options.numberOfChannels }, () => new Float32Array(options.length));
  }

  getChannelData(channel: number) {
    return this._data[channel];
  }

  get duration() {
    return this.length / this.sampleRate;
  }
}

class MockAudioContext {
  createBuffer(numberOfChannels: number, length: number, sampleRate: number) {
    return new MockAudioBuffer({ length, numberOfChannels, sampleRate });
  }
}

// --- Current Implementation (Baseline) ---

const manualDecodeAudioData = (
  data: Uint8Array,
  ctx: any,
  sampleRate: number,
  numChannels: number,
): MockAudioBuffer => {
  // Simulate the exact logic from AudioPlayer.tsx
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

// --- New Implementation (Optimization) ---

const createWavHeader = (dataLength: number, sampleRate: number, numChannels: number, bitDepth: number) => {
  const buffer = new ArrayBuffer(44);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // file length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  const blockAlign = numChannels * (bitDepth / 8);
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  return buffer;
};

const writeString = (view: DataView, offset: number, string: string) => {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
};

const wavWrapImplementation = (
  data: Uint8Array,
  sampleRate: number,
  numChannels: number,
): ArrayBuffer => {
  // This measures the JS overhead of creating the header and concatenating
  // Note: decodeAudioData happens natively off-thread, so main-thread blocking is just this preparation.

  const header = createWavHeader(data.length, sampleRate, numChannels, 16);
  const wavBuffer = new Uint8Array(header.byteLength + data.length);
  wavBuffer.set(new Uint8Array(header), 0);
  wavBuffer.set(data, header.byteLength);

  return wavBuffer.buffer;
};

// --- Benchmark Runner ---

const runBenchmark = () => {
  console.log("Starting Audio Decoding Benchmark...");

  const SAMPLE_RATE = 24000;
  const NUM_CHANNELS = 1;
  const DURATION_SEC = 60; // 60 seconds of audio
  const NUM_SAMPLES = SAMPLE_RATE * DURATION_SEC;
  const BYTES_PER_SAMPLE = 2; // 16-bit
  const TOTAL_BYTES = NUM_SAMPLES * BYTES_PER_SAMPLE * NUM_CHANNELS;

  console.log(`Payload: ${DURATION_SEC}s audio, ${TOTAL_BYTES} bytes (${(TOTAL_BYTES / 1024 / 1024).toFixed(2)} MB)`);

  // Generate random PCM data
  const pcmBuffer = new ArrayBuffer(TOTAL_BYTES);
  const pcmView = new DataView(pcmBuffer);
  for (let i = 0; i < NUM_SAMPLES; i++) {
    // Random Int16
    const val = Math.floor((Math.random() * 2 - 1) * 32767);
    pcmView.setInt16(i * 2, val, true);
  }
  const pcmData = new Uint8Array(pcmBuffer);

  const iterations = 50;
  const ctx = new MockAudioContext();

  // 1. Measure Baseline (Manual Decode)
  const manualTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    manualDecodeAudioData(pcmData, ctx, SAMPLE_RATE, NUM_CHANNELS);
    const end = performance.now();
    manualTimes.push(end - start);
  }

  // 2. Measure Optimization (WAV Header Wrap)
  const optTimes: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    wavWrapImplementation(pcmData, SAMPLE_RATE, NUM_CHANNELS);
    const end = performance.now();
    optTimes.push(end - start);
  }

  // Calc Stats
  const getStats = (times: number[]) => {
    times.sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);
    const mean = sum / times.length;
    const median = times[Math.floor(times.length / 2)];
    return { mean, median };
  };

  const manualStats = getStats(manualTimes);
  const optStats = getStats(optTimes);

  const percentImprovement = ((manualStats.mean - optStats.mean) / manualStats.mean) * 100;

  // Verify Correctness of WAV Header (Basic check)
  const wrapped = wavWrapImplementation(pcmData, SAMPLE_RATE, NUM_CHANNELS);
  const view = new DataView(wrapped);
  const magic = String.fromCharCode(view.getUint8(0), view.getUint8(1), view.getUint8(2), view.getUint8(3));
  const fileSize = view.getUint32(4, true);

  const isValidHeader = magic === 'RIFF' && fileSize === (36 + TOTAL_BYTES);

  // Human Readable Output
  console.log("\n--- Results ---");
  console.log(`Baseline (Manual JS Loop): Median ${manualStats.median.toFixed(3)}ms, Mean ${manualStats.mean.toFixed(3)}ms`);
  console.log(`Optimized (WAV Wrap JS):   Median ${optStats.median.toFixed(3)}ms, Mean ${optStats.mean.toFixed(3)}ms`);
  console.log(`Reduction in Main Thread Block: ${percentImprovement.toFixed(2)}%`);
  console.log(`Header Correctness Check: ${isValidHeader ? 'PASS' : 'FAIL'}`);
  console.log("\nNote: 'Optimized' measures main-thread preparation. Native decodeAudioData runs off-thread in browsers.");

  // JSON Output
  const jsonResult = {
    payloadBytes: TOTAL_BYTES,
    baseline: {
      medianMs: manualStats.median,
      meanMs: manualStats.mean,
      iterations
    },
    optimized: {
      medianMs: optStats.median,
      meanMs: optStats.mean,
      iterations,
      note: "Measures JS preparation only; native decode is off-thread."
    },
    percentImprovement,
    correctness: {
      validHeader: isValidHeader
    }
  };

  console.log("\n--- JSON ---");
  console.log(JSON.stringify(jsonResult, null, 2));
};

runBenchmark();
