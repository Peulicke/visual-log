import { Vector3, WebGLRenderer, Scene, PerspectiveCamera, AxesHelper, ArrowHelper, Object3D } from "three";

type Type = "arrow" | "lineSegment";

type Vec3 = [number, number, number] | { x: number; y: number; z: number };

const is012 = (v: Vec3): v is [number, number, number] =>
    v.hasOwnProperty(0) && v.hasOwnProperty(1) && v.hasOwnProperty(2);

const toVector3 = (v: Vec3) => {
    if (is012(v)) return new Vector3().fromArray(v);
    return new Vector3(v.x, v.y, v.z);
};

type Obj = {
    type: Type;
    data: Vec3[];
    color: string;
};

const getObj = (obj: Obj) => {
    const from = toVector3(obj.data[0]);
    const to = toVector3(obj.data[1]);
    const dir = to.clone().sub(from).normalize();
    if (obj.type === "arrow") return new ArrowHelper(dir, from, from.distanceTo(to), obj.color);
    if (obj.type === "lineSegment") return new ArrowHelper(dir, from, from.distanceTo(to), obj.color, 0, 0);
    return new Object3D();
};

type VLog = {
    renderer: WebGLRenderer;
    scene: Scene;
    camera: PerspectiveCamera;
};

const vLogs: { [id: string]: VLog } = {};

const createVLog = () => {
    const result: VLog = {
        renderer: new WebGLRenderer(),
        scene: new Scene(),
        camera: new PerspectiveCamera(75, 1, 0.1, 1000)
    };
    result.scene.add(new AxesHelper(5));
    result.camera.position.set(5, 5, 5);
    result.camera.lookAt(0, 0, 0);
    return result;
};

const drawVLog = (id: string) => {
    const vLog = vLogs[id];
    const size = Math.max(window.outerWidth - window.innerWidth - 64, 128);
    vLog.renderer.setSize(size, size);
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

const log = (id: string, obj: Obj) => {
    const vLog = vLogs[id] || createVLog();
    vLogs[id] = vLog;
    vLog.scene.add(getObj(obj));
    shouldRedraw = true;
};

window.setInterval(() => {
    if (!shouldRedraw) return;
    shouldRedraw = false;
    Object.keys(vLogs).forEach(drawVLog);
}, 1000);

export default log;
