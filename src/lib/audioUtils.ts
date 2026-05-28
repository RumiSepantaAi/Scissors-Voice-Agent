export function pcmToBase64(f32Array: Float32Array): string {
    const i16Array = new Int16Array(f32Array.length);
    for (let i = 0; i < f32Array.length; i++) {
        const s = Math.max(-1, Math.min(1, f32Array[i]));
        i16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    const buffer = new Uint8Array(i16Array.buffer);
    
    let binary = '';
    for (let i = 0; i < buffer.byteLength; i++) {
        binary += String.fromCharCode(buffer[i]);
    }
    return btoa(binary);
}

export function base64ToPcm(base64: string): Float32Array {
    const binary = atob(base64);
    const i16Array = new Int16Array(binary.length / 2);
    for (let i = 0; i < i16Array.length; i++) {
        const index = i * 2;
        const low = binary.charCodeAt(index);
        const high = binary.charCodeAt(index + 1);
        i16Array[i] = low | (high << 8);
    }
    
    const f32Array = new Float32Array(i16Array.length);
    for (let i = 0; i < i16Array.length; i++) {
        f32Array[i] = i16Array[i] / (i16Array[i] < 0 ? 0x8000 : 0x7FFF);
    }
    return f32Array;
}
