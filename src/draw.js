import * as THREE from 'three'
import Stats from 'stats.js'

import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

import { GUI } from 'dat.gui';

let renderer, scene, camera, texture, planeMesh
let aspectRatio = 1
let dots = {
    group: null,
    count: 50000,
    cols: 0,
    rows: 0,
    meshes: [],
    size: 0.0075,
    spacing: 0.01,
    segments: 16,
    color: 0x000000,
    bgColor: 0xffffff,
    material: null,
    points: null,
    alphaAttrs: null,
    uniforms: {
        color: { value: new THREE.Color(0x00ff00) },
    }
}
let gui = null

function initGUI() {
    if (gui) return
    gui = new GUI({ autoPlace: false })
    gui.domElement.id = 'dat-gui'
    const dotsFolder = gui.addFolder('Config')
    dotsFolder.add(dots, 'size', 0.005, 0.015).onChange(resetDots)
    dotsFolder.add(dots, 'spacing', 0, 0.03).onChange(resetDots)
    dotsFolder.add(dots, 'segments', 3, 32).step(1).onChange(resetDots)
    dotsFolder.addColor(dots, 'color').onChange(function () { dots.material.color.set(dots.color); });
    dotsFolder.addColor(dots, 'bgColor').onChange(function () { scene.background.set(dots.bgColor); });

    dotsFolder.open()

    document.getElementById('dat-gui-container').appendChild(gui.domElement)
}


var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);
stats.dom.style.bottom = 0;
stats.dom.style.right = 0;
stats.dom.style.left = 'auto';
stats.dom.style.top = 'auto';


function loadSVG(url = '/borders.svg') {
    // instantiate a loader
    const loader = new SVGLoader();

    // load a SVG resource
    loader.load(
        // resource URL
        url,
        // called when the resource is loaded
        function (data) {

            const paths = data.paths;
            console.log('svg paths:', paths.length)
            const group = new THREE.Group();
            const groupLines = new THREE.Group();

            for (let i = 0; i < paths.length; i++) {

                const path = paths[i];

                const material = new THREE.MeshBasicMaterial({
                    color: 0xcdcdcd, //path.color,
                    side: THREE.DoubleSide,
                    depthWrite: true,
                    // wireframe: true
                });

                const shapes = SVGLoader.createShapes(path);

                for (let j = 0; j < shapes.length; j++) {

                    const shape = shapes[j];
                    const geometry = new THREE.ShapeGeometry(shape);
                    const mesh = new THREE.Mesh(geometry, material);

                    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 4 })
                    const line = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), mat)

                    group.add(mesh);
                    groupLines.add(line);

                }

            }
            // group.position.z = 1
            let scale = 1.0
            let offset = { x: 0, y: 0, z: 0 }
            try {
                var bbox = new THREE.Box3().setFromObject(group);
                let size = new THREE.Vector3();
                bbox.getSize(size);

                offset.x = size.x / 2
                offset.y = - size.y / 2


                scale = 2 / size.y
                console.log(size)
            } catch (e) {
                console.log(e)
            }
            // group.translate(offset.x, offset.y, offset.z)

            group.scale.set(scale, -scale, scale)
            group.translateX(-aspectRatio)
            group.translateY(1)
            group.translateZ(-4)
            groupLines.scale.set(scale, -scale, scale)
            groupLines.translateX(-aspectRatio)
            groupLines.translateY(1)
            groupLines.translateZ(-1)
            scene.add(group);
            scene.add(groupLines);

        },
        // called when loading is in progresses
        function (xhr) {

            console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {

            console.log('An error happened');

        }
    );
}

function resetCanvas(canvas, image, pixelRatio = 2.0) {
    renderer = new THREE.WebGLRenderer({ canvas, premultipliedAlpha: false, antialias: true });
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1000);

    scene.background = new THREE.Color(0xffffff);

    canvas.width = image.width;
    canvas.height = image.height;
    canvas.style.maxWidth = "100%";
    canvas.style.height = "auto";

    aspectRatio = canvas.clientWidth / canvas.clientHeight;

    texture = new THREE.Texture(image);
    // texture.format = THREE.RGBFormat;
    texture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(2 * aspectRatio, 2);
    geometry.computeBoundingBox();
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    planeMesh = mesh;
    mesh.translateZ(-3)

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    // const axesHelper = new THREE.AxesHelper(5);
    // scene.add(axesHelper);

    camera.left = -aspectRatio;
    camera.right = aspectRatio;
    camera.updateProjectionMatrix();

    const distance = 10; // Set the distance between the camera and the mesh
    const meshPosition = mesh.position.clone(); // Get the position of the mesh
    const cameraPosition = meshPosition.clone().add(new THREE.Vector3(0, 0, distance)); // Calculate the position of the camera
    camera.position.copy(cameraPosition); // Set the position of the camera
    camera.lookAt(meshPosition); // Set the point that the camera is looking at
    console.log(camera.position, meshPosition)

    // let dotPositions = addDots(aspectRatio)
    let dotPositions = resetDots()

    // resetPoints()

    renderer.clearColor = new THREE.Color(0xffffff)
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(pixelRatio);

    render()

    // sampleTexture()
}

function resetDots() {

    if (dots.group) {
        // dispose existing dots geometry
        dots.meshes.forEach(m => m.geometry.dispose())
        // remove dot meshes from group
        dots.meshes.forEach(m => dots.group.remove(m))
        dots.meshes = []
        dots.group.visible = false;
        scene.remove(dots.group)

        dots.group = null
    }
    dots.group = new THREE.Group();

    dots.cols = Math.ceil(2 * aspectRatio / (dots.size * 2 + dots.spacing))
    dots.rows = Math.ceil(2 / (dots.size * 2 + dots.spacing))

    const geometry = new THREE.CircleGeometry(dots.size, dots.segments);

    if (!dots.material) {
        dots.material = new THREE.MeshBasicMaterial({ color: dots.color });
    }


    let dotPositions = []
    for (let i = 0; i < dots.cols * dots.rows; i++) {
        const row = Math.floor(i / dots.cols);
        const col = i % dots.cols;

        const x = col * dots.size * 2 + col * dots.spacing - aspectRatio;
        const y = row * dots.size * 2 + row * dots.spacing - 1;

        const mesh = new THREE.Mesh(geometry, dots.material);
        dotPositions.push({ x, y })
        mesh.position.set(x, y, -2);
        dots.meshes.push(mesh);
        // mesh.lookAt(camera.position)
        dots.group.add(mesh);

    }

    scene.add(dots.group);
    dots.group.visible = true;

    sampleTexture()

    return dotPositions
}

function sampleTexture() {
    dots.group.visible = false;
    planeMesh.visible = true;
    const renderTarget = new THREE.WebGLRenderTarget(texture.image.width, texture.image.height);
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    const pixelData = new Uint8Array(texture.image.width * texture.image.height * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, texture.image.width, texture.image.height, pixelData);

    dots.group.visible = true;

    let blackCount = 0
    for (let i = 0; i < dots.cols * dots.rows; i++) {

        const row = Math.floor(i * 1.0 / dots.cols);
        const col = i % dots.cols;

        const mesh = dots.meshes[i];

        const planeWidth = 2 * aspectRatio;
        const planeHeight = 2;

        let px = col * 1.0 / dots.cols;
        let py = row * 1.0 / dots.rows;
        px = (mesh.position.x + planeWidth / 2) * 1.0 / planeWidth;
        py = (mesh.position.y + planeHeight / 2) * 1.0 / planeHeight;

        if (px >= 1 || py >= 1) {
            mesh.visible = false;
            continue;
        } else {
            // console.log(px, py)
        }

        const x = Math.floor(texture.image.width * px)
        const y = Math.floor(texture.image.height * py)

        const j = y * texture.image.width + x;
        const r = pixelData[j * 4 + 0];
        const g = pixelData[j * 4 + 1];
        const b = pixelData[j * 4 + 2];
        const a = pixelData[j * 4 + 3];

        if (r > 0.1 || g > 0.1 || b > 0.1) {
            mesh.visible = false;

        } else {
            blackCount++
        }
    }

    planeMesh.visible = false
    // console.log(blackCount, dots.count)
}

function samplePoint(pixelData, planeWidth, planeHeight, textureWidth, textureHeight, x, y) {

    let px = (x + planeWidth / 2) * 1.0 / planeWidth;
    let py = (y + planeHeight / 2) * 1.0 / planeHeight;

    if (px >= 1 || py >= 1) {
        return false
    }

    const sx = Math.floor(textureWidth * px)
    const sy = Math.floor(textureHeight * py)

    const j = sy * textureWidth + sx;
    const r = pixelData[j * 4 + 0];
    const g = pixelData[j * 4 + 1];
    const b = pixelData[j * 4 + 2];
    const a = pixelData[j * 4 + 3];

    if (r > 0.1 || g > 0.1 || b > 0.1) {
        return false
    }

    return true
}

function generatePointsGeometry() {

    dots.cols = Math.ceil(2 * aspectRatio / (dots.size * 2 + dots.spacing))
    dots.rows = Math.ceil(2 / (dots.size * 2 + dots.spacing))

    const geometry = new THREE.BufferGeometry()
    const numPoints = dots.cols * dots.rows

    const positions = new Float32Array(numPoints * 3)
    const colors = new Float32Array(numPoints * 3)
    dots.alphaAttrs = new Float32Array(numPoints * 1)

    for (let i = 0; i < numPoints; i++) {
        dots.alphaAttrs[i] = Math.random()
    }

    let color = new THREE.Color(dots.color)

    // get size of planMesh
    let size = planeMesh.geometry.boundingBox.getSize(new THREE.Vector3())
    console.log(size)

    // sample texture
    planeMesh.visible = true;
    const renderTarget = new THREE.WebGLRenderTarget(texture.image.width, texture.image.height);
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    const pixelData = new Uint8Array(texture.image.width * texture.image.height * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, texture.image.width, texture.image.height, pixelData);

    let k = 0;
    for (let i = 0; i < dots.cols; i++) {
        for (let j = 0; j < dots.rows; j++) {
            const u = i / dots.cols;
            const v = j / dots.rows;
            const x = i * dots.size * 2 + i * dots.spacing - aspectRatio;
            const y = j * dots.size * 2 + j * dots.spacing - 1;
            const z = -2;

            let on = samplePoint(pixelData, size.x, size.y, texture.image.width, texture.image.height, x, y)
            if (!on) continue

            positions[3 * k + 0] = x
            positions[3 * k + 1] = y
            positions[3 * k + 2] = z

            colors[3 * k + 0] = color.r
            colors[3 * k + 1] = color.g
            colors[3 * k + 2] = color.b

            k++
        }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('alpha', new THREE.BufferAttribute(dots.alphaAttrs, 1))
    geometry.computeBoundingBox()

    // planeMesh.visible = false
    planeMesh.material.opacity = 0.65

    return geometry
}

function resetPoints() {
    // remove old

    const geometry = generatePointsGeometry()
    const material = new THREE.PointsMaterial({ size: 2.0, vertexColors: true })


    var shaderMaterial = new THREE.ShaderMaterial({

        uniforms: dots.uniforms,
        vertexShader: `
            attribute float alpha;
            varying float vAlpha;

            void main() {
                vAlpha = alpha;
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_PointSize = 4.0;
                gl_Position = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying float vAlpha;

            void main() {

                gl_FragColor = vec4( color, vAlpha );

            }
        `,
        transparent: true

    });

    dots.points = new THREE.Points(geometry, shaderMaterial)
    scene.add(dots.points)
}

function render() {
    stats.begin();

    // let alphaAttrs = dots.points.geometry.attributes.alpha;
    // var count = alphaAttrs.count;

    // for (var i = 0; i < count; i++) {
    //     alphaAttrs.array[i] *= 0.95
    //     if (alphaAttrs.array[i] < 0.01) alphaAttrs.array[i] = 1.0

    //     // if (alphaAttrs.array[i] > 0.99) alphaAttrs.array[i] *= 0.95
    // }

    // alphaAttrs.needsUpdate = true;


    renderer.render(scene, camera)
    stats.end();
    requestAnimationFrame(render)
}

export { resetCanvas, loadSVG, initGUI }
