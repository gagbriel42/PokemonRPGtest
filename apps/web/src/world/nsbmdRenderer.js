import * as THREE from 'three';

const OP_WORDS = {
  0x14: 1, 0x15: 0, 0x16: 1, 0x17: 1, 0x18: 1, 0x19: 0,
  0x1a: 16, 0x1b: 12, 0x1c: 16, 0x1d: 12, 0x1e: 9, 0x1f: 3,
  0x20: 1, 0x21: 1, 0x22: 1, 0x23: 2, 0x24: 1, 0x25: 1,
  0x26: 1, 0x27: 1, 0x28: 1, 0x29: 1, 0x2a: 1, 0x2b: 1,
  0x40: 1, 0x41: 0
};

const MATERIAL_COLORS = [
  0x7eaa67, 0x9bbf79, 0x6b995b, 0x8d8d82, 0x6c9fbd, 0xc8ad76,
  0x98634e, 0xb9b7a0, 0x66834e, 0x9d6b52, 0xd0c68e, 0x708d9d
];

function u16(d, o) { return d.getUint16(o, true); }
function s16(d, o) { return d.getInt16(o, true); }
function u32(d, o) { return d.getUint32(o, true); }
function fx12(v) { return v / 4096; }
function name16(d, o) {
  const bytes = new Uint8Array(d.buffer, d.byteOffset + o, Math.min(16, d.byteLength - o));
  let end = 0;
  while (end < bytes.length && bytes[end]) end++;
  return new TextDecoder().decode(bytes.subarray(0, end));
}

function nameList(d, o) {
  if (o < 0 || o + 8 > d.byteLength) return null;
  const count = d.getUint8(o + 1);
  const p = o + 4;
  if (p + 8 + count * 4 > d.byteLength) return null;
  const valuesStart = p + 8 + count * 4;
  const values = [];
  for (let i = 0; i < count; i++) values.push(u32(d, valuesStart + i * 4));
  const namesStart = valuesStart + count * 4;
  const names = [];
  for (let i = 0; i < count; i++) names.push(name16(d, namesStart + i * 16));
  return { count, values, names };
}

function findModel(d) {
  if (d.byteLength < 20) throw new Error('NSBMD trop court');
  let bmd = -1;
  for (let i = 0; i < Math.min(d.byteLength - 4, 0x100); i++) {
    if (d.getUint8(i) === 0x42 && d.getUint8(i + 1) === 0x4d && d.getUint8(i + 2) === 0x44 && d.getUint8(i + 3) === 0x30) { bmd = i; break; }
  }
  if (bmd < 0) throw new Error('BMD0 introuvable');
  const blockCount = u16(d, bmd + 14);
  let mdl = -1;
  for (let i = 0; i < blockCount; i++) {
    const off = bmd + u32(d, bmd + 16 + i * 4);
    if (off + 8 <= d.byteLength && name16(d, off) === 'MDL0') { mdl = off; break; }
  }
  if (mdl < 0) throw new Error('MDL0 introuvable');
  const dict = nameList(d, mdl + 8);
  if (!dict || !dict.values.length) throw new Error('Dictionnaire MDL0 invalide');
  const model = mdl + dict.values[0];
  const meshesRel = u32(d, model + 12);
  const meshes = nameList(d, model + meshesRel);
  if (!meshes) throw new Error('MeshList invalide');
  return { model, meshes };
}

function decodeVtx10(word) {
  const signed10 = v => { const x = v & 0x3ff; return (x & 0x200) ? x - 0x400 : x; };
  return [fx12(signed10(word) << 3), fx12(signed10(word >> 10) << 3), fx12(signed10(word >> 20) << 3)];
}

function decodeMesh(d, meshBase, meshIndex) {
  if (meshBase + 16 > d.byteLength) return null;
  const cmdsOff = u32(d, meshBase + 8);
  const cmdsLen = u32(d, meshBase + 12);
  const start = meshBase + cmdsOff;
  const end = Math.min(d.byteLength, start + cmdsLen);
  if (start < 0 || start >= end) return null;

  const positions = [];
  const faces = [];
  const colors = [];
  let primitive = -1;
  let pending = [];
  let currentColor = 0xffffff;
  let last = [0, 0, 0];

  const emit = v => {
    positions.push(v[0], v[1], v[2]);
    colors.push(currentColor);
    const index = positions.length / 3 - 1;
    if (primitive === 0) {
      pending.push(index);
      if (pending.length >= 3) faces.push(pending.slice(-3));
    } else if (primitive === 1) {
      pending.push(index);
      if (pending.length >= 4) {
        const n = pending.length;
        const a = pending[n - 4], b = pending[n - 3], c = pending[n - 2], e = pending[n - 1];
        faces.push([a, b, c], [a, c, e]);
      }
    }
    last = v;
  };

  let p = start;
  while (p + 4 <= end) {
    const commandWord = u32(d, p); p += 4;
    for (let slot = 0; slot < 4; slot++) {
      const op = (commandWord >>> (slot * 8)) & 0xff;
      if (!op) continue;
      if (op === 0x40) { primitive = u32(d, p) & 3; p += 4; pending = []; continue; }
      if (op === 0x41) { primitive = -1; pending = []; continue; }
      const words = OP_WORDS[op];
      if (words == null || p + words * 4 > end) { p = end; break; }
      if (op === 0x20) {
        const c = u32(d, p); const r = (c & 0x1f) * 255 / 31; const g = ((c >> 5) & 0x1f) * 255 / 31; const b = ((c >> 10) & 0x1f) * 255 / 31;
        currentColor = (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
      } else if (op === 0x23) {
        emit([fx12(s16(d, p)), fx12(s16(d, p + 2)), fx12(s16(d, p + 4))]);
      } else if (op === 0x24) {
        emit(decodeVtx10(u32(d, p)));
      } else if (op === 0x28) {
        const w = u32(d, p);
        const x = ((w & 0x3ff) << 22) >> 22;
        const y = (((w >> 10) & 0x3ff) << 22) >> 22;
        const z = (((w >> 20) & 0x3ff) << 22) >> 22;
        emit([last[0] + fx12(x << 3), last[1] + fx12(y << 3), last[2] + fx12(z << 3)]);
      } else if (op === 0x25) {
        const w = u32(d, p); emit([s16(new DataView(new Uint8Array([w & 255, (w >> 8) & 255]).buffer), 0) / 4096, s16(new DataView(new Uint8Array([(w >> 16) & 255, (w >> 24) & 255]).buffer), 0) / 4096, last[2]]);
      } else if (op === 0x26) {
        const w = u32(d, p); emit([s16(new DataView(new Uint8Array([w & 255, (w >> 8) & 255]).buffer), 0) / 4096, last[1], s16(new DataView(new Uint8Array([(w >> 16) & 255, (w >> 24) & 255]).buffer), 0) / 4096]);
      } else if (op === 0x27) {
        const w = u32(d, p); emit([last[0], s16(new DataView(new Uint8Array([w & 255, (w >> 8) & 255]).buffer), 0) / 4096, s16(new DataView(new Uint8Array([(w >> 16) & 255, (w >> 24) & 255]).buffer), 0) / 4096]);
      }
      p += words * 4;
    }
  }

  if (!faces.length || positions.length < 9) return null;
  const geometry = new THREE.BufferGeometry();
  const pos = [];
  const col = [];
  faces.forEach(f => f.forEach(i => { pos.push(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]); const c = colors[i]; col.push(((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255); }));
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geometry.computeVertexNormals();
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = `NSBMD mesh ${meshIndex}`;
  return mesh;
}

export async function loadNSBMD(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`NSBMD HTTP ${response.status}`);
  const bytes = await response.arrayBuffer();
  const d = new DataView(bytes);
  const { meshes } = findModel(d);
  const group = new THREE.Group();
  meshes.values.forEach((rel, i) => {
    const mesh = decodeMesh(d, meshes.values[i] + (meshes.values[i] ? 0 : 0), i);
    if (mesh) group.add(mesh);
  });
  if (!group.children.length) throw new Error('Aucune géométrie exploitable dans le NSBMD');
  group.rotation.x = -Math.PI / 2;
  group.scale.setScalar(1.0);
  return group;
}
