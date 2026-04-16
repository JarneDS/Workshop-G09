import * as THREE from 'three';
import { GLTFLoader } from 'https://esm.sh/three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://esm.sh/three/addons/controls/OrbitControls.js';
import gsap from "https://esm.sh/gsap";
import { Pane } from "https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js";

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
const gltf = await loader.loadAsync( "/assets/blockingAssemble.glb" );

/*const textureLoader = new THREE.TextureLoader();
const texture = await textureLoader.loadAsync( '/assets/baked.jpg' );
*/
class Viewer {
    constructor(options) {
        this.canvas = options.canvas;

        this.setRenderer(options);
    }

    updateCameraPosition() {
        const target = this.cameraTargets[this.indexCamera];

        this.camera.position.copy(
            target.getWorldPosition(new THREE.Vector3())
        );

        this.camera.quaternion.copy(
            target.getWorldQuaternion(new THREE.Quaternion())
        );
    }


    travelling() {

        this.indexCamera = 1;

        const cam1 = gltf.scene.getObjectByName("camera1");
        const cam2 = gltf.scene.getObjectByName("camera2");
        
        this.cameraTargets = [cam1, cam2];
        this.updateCameraPosition();
        this.render();
    }

    populate() {        
        this.scene.add(gltf.scene);

        /*const baked = this.scene.getObjectByName('baked');
        baked.material = new THREE.MeshBasicMaterial({
            map: texture
        });*/

        //baked.material.map.flipY = false;

        // this.camera.position.set( this.cube1.position.x, this.cube1.position.y, this.cube1.position.z );
        // this.camera.lookAt( 0,0, 0);

        // this.scene.add( this.cube1, this.cube2 );

        const light = new THREE.AmbientLight({color: 'white', intensity: 1});
        const directionalLight = new THREE.DirectionalLight( {color: 'white', intensity: 1} );
        directionalLight.position.x = 2;
        directionalLight.position.z = 2;
        directionalLight.lookAt( 0,0,0);

        this.scene.add( light, directionalLight );
/*
        const geometry = new THREE.CircleGeometry(0.5, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
        });
        this.circle = new THREE.Mesh(geometry, material);
        this.circle.name = "interactiveCircle";

        // position de base (à adapter)
        this.circle.position.set(3.43, 0.95 + 1.5, -2.48);

        this.scene.add(this.circle);
*/
        this.interactivePoints = [];

        function createPoint(name, x, y, z) {
            const geometry = new THREE.CircleGeometry(0.2, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const point = new THREE.Mesh(geometry, material);

            point.name = name;
            point.position.set(x, y, z);

            return point;
        }

        // Exemple : 3 points
        this.interactivePoints.push(
            createPoint("circle1", 3.43, 0.95 + 1.5, -2.48),
            //createPoint("circle2", 1.2, 1.5, -4.1),
            //createPoint("circle3", -2.5, 0.8, -3.3)
        );

        // Ajout à la scène
        this.interactivePoints.forEach(p => this.scene.add(p));


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

        this.populate();
        // Appele la fonction d'ajout d'éléments
        this.travelling();
        this.animate();
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

    animate() {
        requestAnimationFrame(() => this.animate());

        this.interactivePoints.forEach(point => {
            point.lookAt(this.camera.position);
            point.position.y = Math.sin(Date.now() * 0.002) * 0.1 + 1;
        });

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

function moveCamera() {
    const target = myViewer.cameraTargets[
        myViewer.indexCamera % myViewer.cameraTargets.length
    ];

    gsap.to(myViewer.camera.position, {
        duration: 1,
        x: target.getWorldPosition(new THREE.Vector3()).x,
        y: target.getWorldPosition(new THREE.Vector3()).y,
        z: target.getWorldPosition(new THREE.Vector3()).z,
        onUpdate: () => {
            myViewer.camera.quaternion.copy(
                target.getWorldQuaternion(new THREE.Quaternion())
            );
            myViewer.render();
        },
        onComplete: () => {
            onCameraChange();
        }
    });
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

settings.canvas.addEventListener("click", onClick3D);

/* https://threejs.org/docs/#Raycaster */
function onClick3D(event) {
    const rect = settings.canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, myViewer.camera);

    const intersects = raycaster.intersectObjects(myViewer.scene.children, true);

    if (intersects.length > 0) {
        const obj = intersects[0].object;

        if (myViewer.interactivePoints.includes(obj)) {
            console.log("Point interactif cliqué :", obj.name);
            if (obj.name === "circle1") ouvrirJukebox();
            //if (obj.name === "circle2") ouvrirPorte();
            //if (obj.name === "circle3") afficherInfo();
        }
    }
}

settings.canvas.addEventListener("mousemove", onHover3D);

function onHover3D(event) {
    const rect = settings.canvas.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, myViewer.camera);

    const intersects = raycaster.intersectObjects(myViewer.scene.children, true);

    const isHovering = intersects.some(i =>
        myViewer.interactivePoints.includes(i.object)
    );

    settings.canvas.style.cursor = isHovering ? "pointer" : "default";

}


function onCameraChange() {
    const lunettes = document.querySelector('.lunettes');

    if (myViewer.indexCamera === 1) {
        lunettes.style.display = "block";
    } else {
        lunettes.style.display = "none";
    }
}

function ouvrirJukebox() {
    const jukeboxInterface = document.querySelector('.jukebox');
    jukeboxInterface.style.display = 'block';
}

const jukebox = document.querySelector('.btnRetour');
const jukeboxInterface = document.querySelector('.jukebox');

jukebox.addEventListener('click', () => {
    jukeboxInterface.style.display = 'none';
})

const btnPrec = document.querySelector('.camera-precedent');
const btnSuiv = document.querySelector('.camera-suivant');

btnPrec.addEventListener('click', () => {
    myViewer.indexCamera--;

    if (myViewer.indexCamera < 0) {
        myViewer.indexCamera = myViewer.cameraTargets.length - 1;
    }

    moveCamera();
});

btnSuiv.addEventListener('click', () => {
    myViewer.indexCamera++;

    if (myViewer.indexCamera >= myViewer.cameraTargets.length) {
        myViewer.indexCamera = 0;
    }

    moveCamera();
});

document.querySelectorAll('.vinylHouseTxt').forEach(block => {

    const audio = block.querySelector('audio');
    const playBtn = block.querySelector('.boutonPlay');
    const pauseBtn = block.querySelector('.boutonPause');
    const house = block.querySelector('.house');
    const vinylWrapper = block.querySelector('.vinylHouse');
    const bgVinyl = block.querySelector('.bgPlaying');

    playBtn.addEventListener('click', () => {
        audio.play();
        house.classList.add('hidden');
        vinylWrapper.classList.add('playing');
        bgVinyl.classList.add('open');
    });

    pauseBtn.addEventListener('click', () => {
        audio.pause();
        house.classList.remove('hidden');
        vinylWrapper.classList.remove('playing');
        bgVinyl.classList.remove('open');
    });

});

const prenoms = document.querySelectorAll('.prenom');
let block_pres = document.querySelector('.presentations');

let activeBlock = null;

prenoms.forEach(prenom => {
    prenom.addEventListener('click', () => {
        const targetId = prenom.dataset.target;
        const block = document.getElementById(targetId);

        if (!block) return;

        if (activeBlock) {
            activeBlock.classList.remove('open');
            block_pres.classList.remove('open');
        }

        block.classList.add('open');
        activeBlock = block;
        block_pres.classList.add('open');
    });
});

const retourPresentations = document.querySelector('.presentations .btnRetour');

retourPresentations.addEventListener('click', () => {
    if (activeBlock) {
        activeBlock.classList.remove('open');
        activeBlock = null;
    }

    block_pres.classList.remove('open');
});


