let scene, camera, renderer, loader;

function init() {
    const canvas = document.getElementById("canvas3d");

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 5000);
    camera.position.set(0, 1.5, 3);

    renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    loader = new THREE.GLTFLoader();

    const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    scene.add(light);

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Drag-and-drop logic
const dropZone = document.getElementById("dropZone");

dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "#fff";
});

dropZone.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "#666";
});

dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "#666";

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    loadModel(url);
});

function loadModel(fileUrl) {
    loader.load(
        fileUrl,
        (gltf) => {
            // Remove old models
            scene.traverse((obj) => {
                if (obj.isMesh) scene.remove(obj);
            });

            const model = gltf.scene;
            scene.add(model);
            console.log("Model loaded");
        },
        undefined,
        (err) => {
            console.error("Model failed to load:", err);
        }
    );
}

window.addEventListener("load", init);
