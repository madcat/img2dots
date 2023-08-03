import * as THREE from 'three'
import Stats from 'stats.js'
import { GUI } from 'dat.gui'


import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

let camera, scene, renderer, stats, controls, gui, sphereGeometry, backSphereGeometry, sphere, backSphere, pointGeometry, initialAlphas;

let config = {

    radius: 5,
    numPoints: 20000,
    outlineTexture: '/img2dots/earth.png',
    bwTexture: '/img2dots/borders.png',
    beamTexture: '/img2dots/beam.jpg',
    dotTexture: '/img2dots/dot.png'
}

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
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(2.0)

    sphereGeometry = new THREE.SphereGeometry(config.radius + 0.01, 64, 64);
    sphereGeometry.computeBoundingBox()
    const textureLoader = new THREE.TextureLoader();

    let material = null
    textureLoader.load(config.outlineTexture, function (texture) {
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
                    gl_FragColor = vec4(0.3,0.5,0.9, color.r * 1.0 ); // Use the red channel as the alpha value
                }
            `,
            transparent: true, // Enable transparency
            side: THREE.FrontSide,
            // side: THREE.DoubleSide
            // cullFace: THREE.CullFaceNone,
            // blending: THREE.AdditiveBlending

            // alphaTest: 1
            //depthWrite: false
        });

        let basicMaterial = new THREE.MeshBasicMaterial({ map: texture, opacity: 0.3, transparent: true, side: THREE.DoubleSide, depthTest: false });

        // sphere = new THREE.Mesh(sphereGeometry, basicMaterial);
        sphere = new THREE.Mesh(sphereGeometry, material);
        sphere.renderForceSinglePass = false
        // sphere.flipSided = false
        // sphere.DoubleSided = true
        // sphere.renderOrder = 1;

        let innerSphereGeometry = new THREE.SphereGeometry(config.radius - 0.1, 32, 32);
        let innerSphereMaterial = new THREE.MeshBasicMaterial({ color: 0x000011, transparent: true });
        innerSphereMaterial.opacity = 0.8;
        let innerSphere = new THREE.Mesh(innerSphereGeometry, innerSphereMaterial);

        innerSphere.renderOrder = 1;
        sphere.renderOrder = 2;

        //scene.add(innerSphere);
        scene.add(sphere);


        textureLoader.load(config.bwTexture, function (texture) {
            sampleAndAddPoints(texture)
        });

    });

    backSphereGeometry = new THREE.SphereGeometry(config.radius + 0.01, 64, 64);
    backSphereGeometry.computeBoundingBox()
    const textureLoader1 = new THREE.TextureLoader();

    let material1 = null
    textureLoader1.load(config.outlineTexture, function (texture) {
        texture.needsUpdate = true;
        texture.anisotropy = 16

        material1 = new THREE.ShaderMaterial({
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
                    gl_FragColor = vec4(0.3,0.5,0.9, color.r * 0.5 ); // Use the red channel as the alpha value
                }
            `,
            transparent: true, // Enable transparency
            side: THREE.BackSide,
            // cullFace: THREE.CullFaceNone,
            // blending: THREE.AdditiveBlending

            // alphaTest: 1
            //depthWrite: false
        });

        // sphere = new THREE.Mesh(sphereGeometry, basicMaterial);
        backSphere = new THREE.Mesh(backSphereGeometry, material1);
        backSphere.renderForceSinglePass = false
        // sphere.flipSided = false
        // sphere.DoubleSided = true
        // sphere.renderOrder = 1;
        scene.add(backSphere);
    });



    // camera.position.z = 10;
    camera.position.y = 10;
    camera.lookAt(0, 0, 0);

    scene.background = new THREE.Color(0x000000);
    // scene.fog = new THREE.Fog(0x0000cc, 5, 20);

    controls = new OrbitControls(camera, renderer.domElement, sphere);
    controls.minDistance = 10;
    controls.enableDamping = true;
    controls.update();
}

function generateSpherePoints(numPoints, radius) {
    const points = [];
    const inc = Math.PI * (3 - Math.sqrt(5)); // Golden angle increment

    for (let i = 0; i < numPoints; i++) {
        const y = 1 - (i / (numPoints - 1)) * 2; // Map i to the range [-1, 1]
        const theta = i * inc; // Calculate the θ angle using the golden angle increment
        const phi = Math.acos(y); // Calculate the φ angle using the mapped value

        const x = radius * Math.sin(phi) * Math.cos(theta);
        const z = radius * Math.sin(phi) * Math.sin(theta);

        points.push(new THREE.Vector3(x, y * radius, z));
    }

    return points;
}

function sampleAndAddPoints(texture) {
    const points = generateSpherePoints(config.numPoints, config.radius + 0.01);

    let img = texture.image;
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(img, 0, 0, img.width, img.height);

    // Function to sample texture color based on UV position
    function sampleTextureColor(u, v) {
        // Convert UV coordinates to image pixel coordinates
        const uPixel = Math.floor(u * texture.image.width);
        const vPixel = Math.floor(v * texture.image.height);

        // Sample the texture color at the UV position
        const pixelData = context.getImageData(uPixel, vPixel, 1, 1).data;
        const texColor = new THREE.Color().fromArray(pixelData);
        return texColor;
    }

    let keptPoints = 0;
    for (var i = 0; i < points.length; i++) {

        let point = points[i]

        let theta = Math.acos(point.y / config.radius); // θ angle
        const phi = -Math.atan2(point.z, point.x); // φ angle

        // Handle special case when point is at the pole
        if (Number.isNaN(theta)) {
            theta = point.y > 0 ? 0 : Math.PI; // Set theta to 0 for top pole, π for bottom pole
        }

        // Calculate the UV coordinates for the point based on spherical coordinates
        const u = (phi + Math.PI) / (2 * Math.PI); // Map φ to the range [0, 1]
        const v = (theta / Math.PI); // Map θ to the range [0, 1]

        // Sample the texture color at the UV position
        const texColor = sampleTextureColor(u, v);

        // You can check for any specific color, e.g., black (rgb: 0, 0, 0)
        const blackThreshold = 0.1; // Adjust the threshold for color detection
        if (texColor.r < blackThreshold && texColor.g < blackThreshold && texColor.b < blackThreshold) {
            keptPoints++;
        } else {
            points[i] = null;
        }
    };

    let remainingPoints = points.filter(p => p)
    // console.log(keptPoints, points.length)

    let alphas = new Float32Array(remainingPoints.length * 1)
    const colors = new Float32Array(remainingPoints.length * 3)
    for (let i = 0; i < remainingPoints.length; i++) {
        alphas[i] = 0.5 + 0.5 * Math.random()
        colors[i * 3 + 0] = 0.0
        colors[i * 3 + 1] = 1.0
        colors[i * 3 + 2] = 0.0
    }

    initialAlphas = new Float32Array(remainingPoints.length * 1)
    initialAlphas.set(alphas)



    pointGeometry = new THREE.BufferGeometry().setFromPoints(remainingPoints);
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    pointGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1))
    pointGeometry.computeBoundingBox()

    // initialAlphas = alphas.slilce();
    const pointMaterial = new THREE.PointsMaterial({ color: 0x0000ff, size: 0.01 });
    const shaderMaterial = new THREE.ShaderMaterial({

        uniforms: {
            color: { value: new THREE.Color(0x0000ff) },
        },
        vertexShader: `
            attribute float alpha;
            varying float vAlpha;

            void main() {
                vAlpha = alpha;
                vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
                gl_PointSize = 5.0;
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
        transparent: true,
        side: THREE.DoubleSide,
        // depthTest: false,

    });
    //const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    const pointCloud = new THREE.Points(pointGeometry, shaderMaterial);
    pointCloud.renderForceSinglePass = false
    pointCloud.renderOrder = 3
    scene.add(pointCloud);

    let loc = addLocation(0, 0, config.radius + 0.01);
    loc.renderOrder = 3
    scene.add(loc);
}

function addLocation(theta, phi, radius) {
    // const radius = 10; // Radius of the sphere
    // const theta = Math.PI / 4; // Theta angle in radians
    // const phi = Math.PI / 6; // Phi angle in radians
    const scale = 0.2; // Scale factor for the square

    // Calculate the 3D position of the square's origin on the sphere
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    // Create the square geometry with sides of length 1
    const squareGeometry = new THREE.PlaneGeometry(1, 1);

    // Calculate the normal vector of the square's geometry
    const normal = new THREE.Vector3(x, y, z).normalize();

    // Optionally, you can create a mesh to visualize the square
    const squareTexture = new THREE.TextureLoader().load(config.dotTexture);
    const squareMaterial = new THREE.MeshBasicMaterial({ map: squareTexture, transparent: true });
    const squareMesh = new THREE.Mesh(squareGeometry, squareMaterial);
    // Set the position of the square's origin on the sphere
    squareMesh.lookAt(normal); // Orient the square's normal along the line from the sphere's origin to the square's origin
    squareMesh.position.set(x, y, z);
    squareMesh.scale.set(scale, scale, 1); // Scale the square

    const planeTexture = new THREE.TextureLoader().load(config.beamTexture);
    const planeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            alphaTexture: { value: planeTexture },
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
                gl_FragColor = vec4(1.0,1.0,1.0, color.r * 0.9 ); // Use the red channel as the alpha value
            }
        `,
        transparent: true, // Enable transparenc
        side: THREE.DoubleSide,
        depthTest: true,
    });


    const planeHeight = 8.0
    const planeGeometryX = new THREE.PlaneGeometry(1, planeHeight);
    const planeGeometryY = new THREE.PlaneGeometry(1, planeHeight);

    // const planeMaterial = new THREE.MeshBasicMaterial({ map: planeTexture, transparent: true, side: THREE.DoubleSide });
    const planeMeshX = new THREE.Mesh(planeGeometryX, planeMaterial);
    const planeMeshY = new THREE.Mesh(planeGeometryY, planeMaterial);

    planeGeometryX.translate(0, -planeHeight / 2, 0)
    planeMeshX.rotation.set(-Math.PI, 0, 0);
    planeMeshX.position.copy(squareMesh.position);
    planeMeshX.scale.set(scale, scale, 1);

    planeGeometryY.translate(0, -planeHeight / 2, 0)
    planeMeshY.rotation.set(-Math.PI, Math.PI / 2, 0);
    planeMeshY.position.copy(squareMesh.position);
    planeMeshY.scale.set(scale, scale, 1);

    const group = new THREE.Group();
    group.add(squareMesh);
    group.add(planeMeshX);
    group.add(planeMeshY);

    return group;
}

let clock = new THREE.Clock();
let time = 0;

function render() {
    requestAnimationFrame(render);

    stats.begin();
    //sphere.rotation.x += 0.01;
    //sphere.rotation.y += 0.01;

    // if (pointGeometry) {
    //     let alphaAttrs = pointGeometry.attributes.alpha;
    //     var count = alphaAttrs.count;

    //     for (var i = 0; i < count; i++) {
    //         alphaAttrs.array[i] *= 0.995
    //         if (alphaAttrs.array[i] < 0.01) alphaAttrs.array[i] = 1.0
    //     }

    //     alphaAttrs.needsUpdate = true;
    // // }
    if (pointGeometry && initialAlphas) {
        time += clock.getDelta();

        let currentAlphas = pointGeometry.attributes.alpha.array;
        for (let i = 0; i < currentAlphas.length; i++) {
            //currentAlphas[i] = initialAlphas[i] * (0.8 + 0.2 * Math.sin(time * 2.0 + i * 0.1));
            currentAlphas[i] = initialAlphas[i] + (1.0 - initialAlphas[i]) * Math.sin(time * 2.0 + i * 0.1);

        }
        pointGeometry.attributes.alpha.needsUpdate = true;
    }


    controls.update();
    renderer.render(scene, camera);
    stats.end();
}

initStats()
init()
render()
