import * as THREE from "https://unpkg.com/three@latest/build/three.module.js";
import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js";
import { GLTFLoader } from "https://unpkg.com/three@latest/examples/jsm/loaders/GLTFLoader.js";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.2/index.js";

// SETTINGS
const settings = {
    wrapper: document.querySelector(".js-canvas-wrapper"),
    canvas: document.querySelector(".js-canvas-3d"),
    raf: window.requestAnimationFrame,
    sizes: {},
};

const threejsOptions = {
    canvas: settings.canvas,
};

//// VIEWER CLASS

class Viewer {
    constructor(options) {
        this.canvas = options.canvas;

        this.cameras = [];
        this.targets = [];
        this.currentStep = 0;
        this.tempTarget = new THREE.Vector3();

        this.setRenderer(options);
    }

    /*populate() {
        // Tout les éléments à ajouter dans la scene

        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({
            color: "slateblue",
        });
        const mesh = new THREE.Mesh(geometry, material);
        this.scene.add(mesh);

        // Demander un rendu
        this.render();
    }*/

    loadModel() {
        const loader = new GLTFLoader()

        loader.load( '../assets/2024_ford_f-150_raptor_r/scene.gltf', ( gltf ) => {
            this.gltf = gltf;
            this.scene.add( this.gltf.scene );
            this.steps = this.gltf.cameras.length;

            for (let i = 0; i < this.steps; i++) {
                const camera = gltf.cameras.find(x => x.name === "Camera"+i+"_Orientation");
                const target = this.scene.getObjectByName( "target" + i );
                this.targets.push(target);
                this.cameras.push(camera);
            };
        });

        this.scene.add(this.gltf.scene);
        this.render();
    }

    updateStep() {
        const camPos = this.cameras[this.currentStep].parent.position;
        const target = this.targets[this.currentStep].position;

        gsap.to(this.tempTarget, {
            x: target.x,
            y: target.y,
            z: target.z,
            duration: 3,
            ease: "Power3.easeInOut",
        });

        gsap.to(this.camera.position, {
            x: camPos.x,
            y: camPos.y,
            z: camPos.z,
            duration: 3,
            ease: "Power3.easeInOut",

            onUpdate: ()=>{
                this.camera.lookAt(this.tempTarget);
                this.controls.target = this.tempTarget;
            }
        });
    }

    nextStep() {
        this.currentStep = (this.currentStep + 1) % this.steps;
        this.updateStep();
    }

    removeGizmo() {
        this.scene.remove(this.gizmo);
        this.gizmo.dispose();
        this.gizmo = null;
        this.render();
    }

    addGizmo(size = 1) {
        this.gizmo = new THREE.AxesHelper(size);
        this.scene.add(this.gizmo);
        this.render();
    }

    render(scene = this.scene, camera = this.camera) {
        this.renderer.render(scene, camera);
    }

    setRenderer(options = {}) {
        this.renderer = new THREE.WebGLRenderer(options);

        // Crée notre caméra
        // PerspectiveCamera( fov, aspect-ratio, near, far )
        this.camera = new THREE.PerspectiveCamera(
            75,
            // On le calcule avec la taille du wrapper
            settings.sizes.w / settings.sizes.h,
            1,
            100
        );

        // Recule notre camera pour qu'on puisse voir le centre de la scene
        this.camera.position.z = 10;

        // Crée notre scene et y rajoute notre camera
        this.scene = new THREE.Scene();
        this.scene.add(this.camera);

        // Change une première fois la taille de notre canvas
        this.resize();

        // Appele la fonction d'ajout d'éléments
        //this.populate();
    }

    resize() {
        // Mettre à jour nos settings
        settings.sizes.w = settings.wrapper.clientWidth;
        settings.sizes.h = settings.wrapper.clientHeight;

        // Limite la densité de pixel à 2, pour éviter
        // des problèmes de performances sur des écrans
        // à plus haute densité de pixel.
        settings.sizes.dpr = Math.min(window.devicePixelRatio, 2);

        settings.canvas.style.aspetRatio = `${settings.sizes.w}/${settings.sizes.h}`;

        // Mettre à jour la camera
        this.camera.aspect = settings.sizes.w / settings.sizes.h;
        this.camera.updateProjectionMatrix();

        // Mettre à jour le moteur de rendu
        this.renderer.setSize(settings.sizes.w, settings.sizes.h);
        this.renderer.setPixelRatio(settings.sizes.dpr);

        this.render();
    }
}

const myViewer = new Viewer(threejsOptions);
myViewer.loadModel();
// myViewer.addGizmo(2);

// Ajouter un event resize et appeler la fonction qui
// gère les changements de tailles
window.addEventListener("resize", () => {
    myViewer.resize();
});
