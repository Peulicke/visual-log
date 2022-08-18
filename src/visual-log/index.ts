import { Vector3, WebGLRenderer, Scene, PerspectiveCamera, AxesHelper, ArrowHelper, Object3D, Box3 } from "three";

const state = { id: "", color: "red" };

type Vec3 = [number, number, number] | { x: number; y: number; z: number };

const is012 = (v: Vec3): v is [number, number, number] =>
    [0, 1, 2].every(i => Object.prototype.hasOwnProperty.call(v, i));

const toVector3 = (v: Vec3) => {
    if (is012(v)) return new Vector3().fromArray(v);
    return new Vector3(v.x, v.y, v.z);
};

type VLog = {
    renderer: WebGLRenderer;
    scene: Scene;
    camera: PerspectiveCamera;
    axesHelper: AxesHelper;
    objects: Object3D[];
};

const vLogs: { [id: string]: VLog } = {};

const createVLog = () => {
    const epsilon = 1e-10;
    const result: VLog = {
        renderer: new WebGLRenderer(),
        scene: new Scene(),
        camera: new PerspectiveCamera(75, 1, 0.1, 1000),
        axesHelper: new AxesHelper(epsilon),
        objects: []
    };
    result.scene.add(result.axesHelper);
    result.camera.position.set(epsilon, epsilon, epsilon);
    result.camera.lookAt(0, 0, 0);
    return result;
};

const aabbMaxSize = ({ min, max }: Box3) => Math.max(...[...min.toArray(), ...max.toArray()].map(v => Math.abs(v)));

const aabbToCamPos = (aabb: Box3) => new Vector3().fromArray([0, 1, 2].map(() => aabbMaxSize(aabb)));

const drawVLog = (id: string) => {
    const vLog = vLogs[id];
    const size = Math.max(window.outerWidth - window.innerWidth - 64, 128);
    vLog.renderer.setSize(size, size);
    const aabb = vLog.objects.reduce((res, obj) => res.expandByObject(obj), new Box3());
    vLog.scene.remove(vLog.axesHelper);
    vLog.axesHelper = new AxesHelper(aabbMaxSize(aabb));
    vLog.scene.add(vLog.axesHelper);
    vLog.camera.position.set(...aabbToCamPos(aabb).toArray());
    vLog.renderer.render(vLog.scene, vLog.camera);
    const gl = vLog.renderer.getContext();
    const pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    const url = vLog.renderer.domElement.toDataURL();
    const image = new Image();
    image.onload = () => console.log(`vlog: ${id}%c `, `padding: ${size / 2}px; background: url(${url}) no-repeat;`);
    image.src = url;
};

let shouldRedraw = false;

window.setInterval(() => {
    if (!shouldRedraw) return;
    shouldRedraw = false;
    Object.keys(vLogs).forEach(drawVLog);
}, 1000);

export const id = (s: string) => (state.id = s);

export const color = (s: string) => (state.color = s);

const addObj = (obj: Object3D) => {
    if (!vLogs[state.id]) vLogs[state.id] = createVLog();
    vLogs[state.id].objects.push(obj);
    vLogs[state.id].scene.add(obj);
    shouldRedraw = true;
};

const getDir = (from: Vector3, to: Vector3) => to.clone().sub(from).normalize();

const addArrow = (from: Vector3, to: Vector3) =>
    addObj(new ArrowHelper(getDir(from, to), from, from.distanceTo(to), state.color));

export const arrow = (from: Vec3, to: Vec3) => addArrow(toVector3(from), toVector3(to));

const addLineSegment = (from: Vector3, to: Vector3) =>
    addObj(new ArrowHelper(getDir(from, to), from, from.distanceTo(to), state.color, 0, 0));

export const lineSegment = (from: Vec3, to: Vec3) => addLineSegment(toVector3(from), toVector3(to));
