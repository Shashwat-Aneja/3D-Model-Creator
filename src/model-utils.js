(function attachModelUtils(root, factory) {
    const utilities = factory();
    if (typeof module === "object" && module.exports) {
        module.exports = utilities;
    } else {
        root.ModelUtils = utilities;
    }
})(typeof globalThis !== "undefined" ? globalThis : this, function createModelUtils() {
    const MAX_MODEL_BYTES = 100 * 1024 * 1024;

    function isSupportedModelFile(file) {
        if (!file || typeof file.name !== "string") return false;
        if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_MODEL_BYTES) {
            return false;
        }
        return /\.(glb|gltf)$/i.test(file.name);
    }

    function calculateCameraDistance(radius, fovDegrees, aspect, margin = 1.25) {
        if (
            !Number.isFinite(radius) || radius <= 0 ||
            !Number.isFinite(fovDegrees) || fovDegrees <= 0 || fovDegrees >= 180 ||
            !Number.isFinite(aspect) || aspect <= 0 ||
            !Number.isFinite(margin) || margin < 1
        ) {
            throw new RangeError("Camera framing requires a positive radius, valid field of view, aspect ratio, and margin.");
        }

        const verticalHalfAngle = (fovDegrees * Math.PI) / 360;
        const horizontalHalfAngle = Math.atan(Math.tan(verticalHalfAngle) * aspect);
        const limitingHalfAngle = Math.min(verticalHalfAngle, horizontalHalfAngle);
        return (radius / Math.sin(limitingHalfAngle)) * margin;
    }

    function disposeModel(model) {
        if (!model || typeof model.traverse !== "function") return;

        const geometries = new Set();
        const materials = new Set();
        const textures = new Set();

        model.traverse((object) => {
            if (object.geometry && typeof object.geometry.dispose === "function") {
                geometries.add(object.geometry);
            }

            if (object.skeleton && object.skeleton.boneTexture) {
                textures.add(object.skeleton.boneTexture);
            }

            const objectMaterials = Array.isArray(object.material)
                ? object.material
                : [object.material];

            for (const material of objectMaterials) {
                if (!material) continue;
                materials.add(material);

                for (const value of Object.values(material)) {
                    if (value && value.isTexture && typeof value.dispose === "function") {
                        textures.add(value);
                    }
                }
            }
        });

        textures.forEach((texture) => texture.dispose());
        materials.forEach((material) => material.dispose());
        geometries.forEach((geometry) => geometry.dispose());

        if (model.parent && typeof model.parent.remove === "function") {
            model.parent.remove(model);
        }
    }

    return {
        MAX_MODEL_BYTES,
        isSupportedModelFile,
        calculateCameraDistance,
        disposeModel,
    };
});
