import * as THREE from 'three'
import Stats from 'stats.js'
import { GUI } from 'dat.gui'


import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let camera, scene, renderer, stats, controls, gui

function initStats() {
    if (stats) return
    stats = new Stats();
    stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    document.body.appendChild(stats.dom);
    stats.dom.style.bottom = 0;
    stats.dom.style.right = 0;
    stats.dom.style.left = 'auto';
    stats.dom.style.top = 'auto';
}

function initGUI() {
    if (gui) return
    gui = new GUI({ autoPlace: false })
    gui.domElement.id = 'dat-gui'
    const folder = gui.addFolder('Config')
    folder.open()
    document.getElementById('dat-gui-container').appendChild(gui.domElement)
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const sphereGeometry = new THREE.SphereGeometry(5, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    let material
    textureLoader.load('/earth.png', function (texture) {
        texture.needsUpdate = true;
        texture.anisotropy = 16

        material = new THREE.ShaderMaterial({
            uniforms: {
                alphaTexture: { value: texture },
            },
            vertexShader: `
                varying vec2 vUv;
    
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                precision highp float;
                uniform sampler2D alphaTexture;
                varying vec2 vUv;
    
                void main() {
                    vec4 color = texture2D(alphaTexture, vUv);
                    gl_FragColor = vec4(1.0,0.0,0.0, color.r); // Use the red channel as the alpha value
                }
            `,
            transparent: true, // Enable transparency
        });

        const sphere = new THREE.Mesh(sphereGeometry, material);
        scene.add(sphere);
    });

    //texture.anisotropy = 16
    // const material = new THREE.MeshBasicMaterial({
    //     map: texture,
    //     transparent: true,
    //     opacity: 0.5,
    //     doubleSided: true
    // });



    //material.needsUpdate = true;



    // const light = new THREE.AmbientLight(0xffffff, 1)
    // light.position.set(0, 0, 10);
    // scene.add(light);

    camera.position.z = 10;

    scene.background = new THREE.Color(0xffffff);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.update();
}

function render() {
    requestAnimationFrame(render);
    //sphere.rotation.x += 0.01;
    //sphere.rotation.y += 0.01;
    controls.update();
    renderer.render(scene, camera);
}


init()
render()