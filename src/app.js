let scene, camera, renderer, loader, canvas;
let currentModel = null;
let currentObjectUrl = null;
let loadGeneration = 0;

function init() {
    canvas = document.getElementById("canvas3d");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(60, 1, 1, 5000);
    camera.position.set(0, 1.5, 3);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    resizeRenderer();
    window.addEventListener("resize", resizeRenderer);

    loader = new THREE.GLTFLoader();

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(light);

    window.addEventListener("beforeunload", cleanupModelResources);
    animate();
}

function resizeRenderer() {
    if (!canvas || !camera || !renderer) return;

    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);

    if (currentModel) {
        frameModel(currentModel);
    }
}

function frameModel(model) {
    const bounds = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bounds.getSize(size);
    bounds.getCenter(center);

    const distance = ModelUtils.calculateCameraDistance(
        { width: size.x, height: size.y, depth: size.z },
        camera.fov,
        camera.aspect,
        1.25
    );
    const viewDirection = new THREE.Vector3(1, 0.65, 1).normalize();

    camera.position.copy(center).addScaledVector(viewDirection, distance);
    camera.near = Math.max(distance / 1000, 0.01);
    camera.far = Math.max(distance * 100, 1000);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

const dropZone = document.getElementById("dropZone");

dropZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropZone.style.borderColor = "#fff";
});

dropZone.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "#666";
});

dropZone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropZone.style.borderColor = "#666";

    const file = event.dataTransfer.files[0];
    if (!file) return;

    if (!ModelUtils.isSupportedModelFile(file)) {
        console.warn("Choose a non-empty .glb or .gltf file smaller than 100 MB.");
        return;
    }

    loadModel(file);
});

function loadModel(file) {
    const objectUrl = URL.createObjectURL(file);
    const generation = ++loadGeneration;

    loader.load(
        objectUrl,
        (gltf) => {
            if (generation !== loadGeneration) {
                ModelUtils.disposeModel(gltf.scene);
                URL.revokeObjectURL(objectUrl);
                return;
            }

            const previousModel = currentModel;
            const previousObjectUrl = currentObjectUrl;

            currentModel = gltf.scene;
            scene.add(currentModel);
            frameModel(currentModel);

            if (previousModel) ModelUtils.disposeModel(previousModel);
            if (previousObjectUrl) URL.revokeObjectURL(previousObjectUrl);

            currentObjectUrl = objectUrl;
            console.log("Model loaded");
        },
        undefined,
        (error) => {
            URL.revokeObjectURL(objectUrl);
            console.error("Model failed to load:", error);
        }
    );
}

function cleanupModelResources() {
    loadGeneration += 1;

    if (currentModel) {
        ModelUtils.disposeModel(currentModel);
        currentModel = null;
    }
    if (currentObjectUrl) {
        URL.revokeObjectURL(currentObjectUrl);
        currentObjectUrl = null;
    }
}

window.addEventListener("load", init);
