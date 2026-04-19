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

const interiorGLTF = await loader.loadAsync("/assets/G09_SM_scene_combined_int.glb");
const exteriorGLTF = await loader.loadAsync("/assets/G09_SM_scene_ext.glb");

const jukebox = document.querySelector('.btnRetour');
const jukeboxInterface = document.querySelector('.jukebox');

class G9_Story {
    constructor(options) {
        this.canvas = options.canvas;
        this.interior = options.interior;
        this.exterior = options.exterior;

        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.setRenderer(options);
        
        const btnPrec = document.querySelector('.camera-precedent');
        const btnSuiv = document.querySelector('.camera-suivant');

        btnPrec.addEventListener('click', () => {
            this.indexCamera--;

            if (this.indexCamera < 0) {
                this.indexCamera = this.cameraTargets.length - 1;
            }

            this.moveCamera();
        });

        btnSuiv.addEventListener('click', () => {
            this.indexCamera++;

            if (this.indexCamera >= this.cameraTargets.length) {
                this.indexCamera = 0;
            }

            this.moveCamera();
        });

        this.canvas.addEventListener("click", (e) => this.onClick3D(e));

        this.canvas.addEventListener("mousemove", (e) => this.onHover3D(e));

        jukebox.addEventListener('click', () => {
            jukeboxInterface.style.display = 'none';
        })

        this.initUI();
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

        const cam0 = this.exterior.getObjectByName("G9_SM_Camera_0");
        const cam1 = this.interior.getObjectByName("G9_SM_Camera_1");
        const cam2 = this.interior.getObjectByName("G9_SM_Camera_2");
        const cam3 = this.interior.getObjectByName("G9_SM_Camera_3");
        const cam4 = this.interior.getObjectByName("G9_SM_Camera_4");
        const cam5 = this.interior.getObjectByName("G9_SM_Camera_5");
        const cam6 = this.interior.getObjectByName("G9_SM_Camera_6");

        this.cameraTargets = [cam0, cam1, cam2, cam3, cam4, cam5, cam6];

        this.cameraTargets.forEach(cam => {
            if (cam) cam.visible = false;
        });

        this.updateCameraPosition();
        this.render();
    }

    populate() {        
        this.scene.add(this.interior);
        this.scene.add(this.exterior);

        const light = new THREE.AmbientLight({color: 'white', intensity: 1});
        const directionalLight = new THREE.DirectionalLight( {color: 'white', intensity: 1} );
        directionalLight.position.x = 2;
        directionalLight.position.z = 2;
        directionalLight.lookAt( 0,0,0);

        this.scene.add( light, directionalLight );

        this.interactivePoints = [];

        function createPoint(name, x, y, z) {
            const geometry = new THREE.CircleGeometry(0.2, 32);
            const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const point = new THREE.Mesh(geometry, material);

            point.name = name;
            point.position.set(x, y, z);

            return point;
        }

        this.interactivePoints.push(
            createPoint("circle1", -0.9, 0.5906563997268677 + 1.5, -3.4),
            //createPoint("circle2", 1.2, 1.5, -4.1),
            //createPoint("circle3", -2.5, 0.8, -3.3)
        );

        this.interactivePoints.forEach(p => this.scene.add(p));

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

        this.canvas.style.aspectRatio = `${settings.sizes.w}/${settings.sizes.h}`;

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

    moveCamera() {
        const target = this.cameraTargets[
            this.indexCamera % this.cameraTargets.length
        ];

        gsap.to(this.camera.position, {
            duration: 1,
            x: target.getWorldPosition(new THREE.Vector3()).x,
            y: target.getWorldPosition(new THREE.Vector3()).y,
            z: target.getWorldPosition(new THREE.Vector3()).z,
            onUpdate: () => {
                this.camera.quaternion.copy(
                    target.getWorldQuaternion(new THREE.Quaternion())
                );
                this.render();
            },
            onComplete: () => {
                this.onCameraChange();
            }
        });
    }

    /* https://threejs.org/docs/#Raycaster */
    onClick3D(event) {
        const rect = this.canvas.getBoundingClientRect();

        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        if (intersects.length > 0) {
            const obj = intersects[0].object;

            if (this.interactivePoints.includes(obj)) {
                if (obj.name === "circle1") this.ouvrirJukebox();
            }
        }
    }

    onHover3D(event) {
        const rect = this.canvas.getBoundingClientRect();

        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        const isHovering = intersects.some(i =>
            this.interactivePoints.includes(i.object)
        );

        this.canvas.style.cursor = isHovering ? "pointer" : "default";
    }


    onCameraChange() {
        /*const lunettes = document.querySelector('.lunettes');

        if (this.indexCamera === 1) {
            lunettes.style.display = "block";
        } else {
            lunettes.style.display = "none";
        }*/
    }

    ouvrirJukebox() {
        const jukeboxInterface = document.querySelector('.jukebox');
        jukeboxInterface.style.display = 'block';
    }

    initUI() {

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
                jukeboxInterface.style.display = 'none';
            });
        });

        const retourPresentations = document.querySelector('.presentations .btnRetour');

        retourPresentations.addEventListener('click', () => {
            if (activeBlock) {
                activeBlock.classList.remove('open');
                activeBlock = null;
            }

            block_pres.classList.remove('open');
            jukeboxInterface.style.display = 'block';
        });

        const savoirPlusBtn = document.querySelectorAll('.savoirPlus');
        let block_pres2 = document.querySelector('.presentations__details');

        let activeBlock2 = null;

        savoirPlusBtn.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId2 = btn.dataset.target;
                const block2 = document.getElementById(targetId2);

                if (!block2) return;

                if (activeBlock2) {
                    activeBlock2.classList.remove('open');
                    block_pres2.classList.remove('open');
                }

                block2.classList.add('open');
                activeBlock2 = block2;
                block_pres.classList.remove('open');
                block_pres2.classList.add('open');
            });
        });

        const retourPresentations2 = document.querySelector('.presentations__details .btnRetour');

        retourPresentations2.addEventListener('click', () => {
            if (activeBlock2) {
                activeBlock2.classList.remove('open');
                activeBlock2 = null;
            }

            block_pres2.classList.remove('open');
            block_pres.classList.add('open');
        });
    }
}

const app = new G9_Story({
    canvas: document.querySelector(".js-canvas-3d"),
    interior: interiorGLTF.scene,
    exterior: exteriorGLTF.scene
});

// myViewer.addGizmo(2);

// Ajouter un event resize et appeler la fonction qui
// gère les changements de tailles
window.addEventListener("resize", () => {
    app.resize();
});

