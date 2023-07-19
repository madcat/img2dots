import * as THREE from 'three'
import Stats from 'stats.js'
let renderer, scene, camera, texture
let aspectRatio = 1
let dots = {
    group: null,
    count: 50000,
    cols: 0,
    rows: 0,
    meshes: []
}

var stats = new Stats();
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);
stats.dom.style.bottom = 0;
stats.dom.style.right = 0;
stats.dom.style.left = 'auto';
stats.dom.style.top = 'auto';

const DOT_COUNT = 50000;

function resetCanvas(canvas, image) {
    renderer = new THREE.WebGLRenderer({ canvas, premultipliedAlpha: false });
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1000);

    canvas.width = image.width / 2;
    canvas.height = image.height / 2;

    aspectRatio = canvas.clientWidth / canvas.clientHeight;

    texture = new THREE.Texture(image);
    // texture.format = THREE.RGBFormat;
    texture.needsUpdate = true;

    const geometry = new THREE.PlaneGeometry(2 * aspectRatio, 2);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    mesh.translateZ(-1)

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

    let dotPositions = addDots(aspectRatio)

    renderer.clearColor = new THREE.Color(0xffffff)
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(2.0);

    render()
}

function addDots(aspectRatio, dotCount = dots.count) {
    // plane dimension is 2 * aspectRatio x 2
    // by DOT_COUNT, calculate rows and cols of dots
    const dotSpacing = 0.01; // Set the spacing between the dots
    const dotSize = 0.01
    let dotRows = Math.ceil(Math.sqrt(DOT_COUNT / (1 + dotSpacing) / aspectRatio))
    let dotCols = Math.ceil(dotRows * aspectRatio)

    dots.rows = dotRows
    dots.cols = dotCols

    let dotPositions = []

    const geometry = new THREE.CircleGeometry(dotSize, 5);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    let group = new THREE.Group();
    for (let i = 0; i < dotCount; i++) {
        const row = Math.floor(i / dotCols);
        const col = i % dotCols;

        const x = col * dotSize + col * dotSpacing - aspectRatio;
        const y = row * dotSize + row * dotSpacing - 1;

        const mesh = new THREE.Mesh(geometry, material);
        dotPositions.push({ x, y })
        mesh.position.set(x, y, 0);
        dots.meshes.push(mesh);
        // mesh.lookAt(camera.position)
        group.add(mesh);

    }

    scene.add(group);
    dots.group = group;

    return dotPositions
}

// sample texture by the dot positions, return same size array of booleans indicate if the dot position on the texture has color other than white

function sampleTexture() {
    dots.group.visible = false;
    const renderTarget = new THREE.WebGLRenderTarget(texture.image.width, texture.image.height);
    renderer.setRenderTarget(renderTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    const pixelData = new Uint8Array(texture.image.width * texture.image.height * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, texture.image.width, texture.image.height, pixelData);

    dots.group.visible = true;

    console.log(pixelData.length / 4, pixelData.filter(p => p == 0).length / 4)


    // let i = 0
    // console.log(pixelData[i], pixelData[i + 1], pixelData[i + 2], pixelData[i + 3])
    // return


    let blackCount = 0
    for (let i = 0; i < dots.count; i++) {

        const row = Math.floor(i * 1.0 / dots.cols);
        const col = i % dots.cols;

        const mesh = dots.meshes[i];

        const planeWidth = 2 * aspectRatio;
        const planeHeight = 2;

        let px = col * 1.0 / dots.cols;
        let py = row * 1.0 / dots.rows;
        //px = (mesh.position.x + planeWidth / 2) * 1.0 / planeWidth;
        //py = (mesh.position.y + planeHeight / 2) * 1.0 / planeHeight;

        if (px > 1 || py > 1) {
            mesh.visible = false;
            continue;
        } else {
            console.log(px, py)
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
    console.log(blackCount, dots.count)
}

function render() {
    stats.begin();
    renderer.render(scene, camera)
    stats.end();
    requestAnimationFrame(render)
}

export { resetCanvas, sampleTexture }
