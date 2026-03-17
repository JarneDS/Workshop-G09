import * as THREE from 'three';
import { GLTFLoader } from 'https://esm.sh/three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://esm.sh/three/addons/controls/OrbitControls.js';
import gsap from "https://esm.sh/gsap";
import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js";

console.log(gsap);
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

const loader = new GLTFLoader();
const gltf = await loader.loadAsync( "/assets/portal.glb" );

const textureLoader = new THREE.TextureLoader();
const texture = await textureLoader.loadAsync( '/assets/baked.jpg' );

class Viewer {
    constructor(options) {
        this.canvas = options.canvas;

        this.setRenderer(options);
    }

    updateCameraPosition() {
        const newPosition = this.cameraPositions[ this.indexCamera ];
        this.camera.position.set( newPosition.x, newPosition.y, newPosition.z );
        this.camera.lookAt(0,0,0);
    }

    travelling() {

        this.indexCamera = 0;
        this.cameraPositions = [];

        const geometry = new THREE.BoxGeometry( .25,.25,.25);
        const material = new THREE.MeshBasicMaterial({
            color: 'crimson'
        });


        const cube1 = new THREE.Mesh( geometry, material );
        cube1.position.x = 3;
        cube1.position.z = 4;
        cube1.position.y = 3;
        cube1.visible = false;

        const cube2 = new THREE.Mesh( geometry, material );

        cube2.position.x = -3;
        cube2.position.z = 2;
        cube2.position.y = 1;
        cube2.visible = false;

        const cube3 = new THREE.Mesh( geometry, material );

        cube3.position.x = 3;
        cube3.position.z = -2;
        cube3.position.y = 2;
        cube3.visible = false;

        this.cameraPositions.push(cube1.position, cube2.position, cube3.position);
        
        this.scene.add( cube1, cube2, cube3 );
        this.updateCameraPosition();
        this.render();
    }

    populate() {        
        this.scene.add( gltf.scene );

        const baked = this.scene.getObjectByName('baked');
        baked.material = new THREE.MeshBasicMaterial({
            map: texture
        });

        baked.material.map.flipY = false;

        // this.camera.position.set( this.cube1.position.x, this.cube1.position.y, this.cube1.position.z );
        // this.camera.lookAt( 0,0, 0);

        // this.scene.add( this.cube1, this.cube2 );

        // const light = new THREE.AmbientLight({color: 'white', intensity: 1});
        // const directionalLight = new THREE.DirectionalLight( {color: 'white', intensity: 1} );
        // directionalLight.position.x = 2;
        // directionalLight.position.z = 2;
        // directionalLight.lookAt( 0,0,0);

        // this.scene.add( light, directionalLight );

        // Demander un rendu
        this.render();
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

        // OrbitControls
        // this.controls = new OrbitControls( this.camera, this.renderer.domElement );
        // this.controls.addEventListener( 'change', () => {
        //     this.render();
        // } );

        // Crée notre scene et y rajoute notre camera
        this.scene = new THREE.Scene();
        this.scene.add(this.camera);

        // Change une première fois la taille de notre canvas
        this.resize();

        // Appele la fonction d'ajout d'éléments
        this.travelling();
        this.populate();
    }

    resize() {
        // Mettre à jour nos settings
        settings.sizes.w = settings.wrapper.clientWidth;
        settings.sizes.h = settings.wrapper.clientHeight;

        // Limite la densité de pixel à 2, pour éviter
        // des problèmes de performances sur des écrans
        // à plus haute densité de pixel.
        settings.sizes.dpr = Math.min(window.devicePixelRatio, 2);

        settings.canvas.style.aspectRatio = `${settings.sizes.w}/${settings.sizes.h}`;

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
// myViewer.addGizmo(2);

// Ajouter un event resize et appeler la fonction qui
// gère les changements de tailles
window.addEventListener("resize", () => {
    myViewer.resize();
});

window.addEventListener("click", () => {
    myViewer.indexCamera++;
    const length = myViewer.cameraPositions.length;
    gsap.to( myViewer.camera.position, {
        duration: 1,
        x: myViewer.cameraPositions[ myViewer.indexCamera % length ].x,
        y: myViewer.cameraPositions[ myViewer.indexCamera % length ].y,
        z: myViewer.cameraPositions[ myViewer.indexCamera % length ].z,
        onUpdate: () => {
            myViewer.camera.lookAt(0,0,0);
            myViewer.render();
        }
    });
    // myViewer.camera.position.set( myViewer.cube2.position.x, myViewer.cube2.position.y, myViewer.cube2.position.z );
    // myViewer.camera.lookAt(0,0,0);
    // myViewer.render();
});
