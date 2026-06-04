import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// --- 설정 및 상수 ---
const G = 0.05; // 중력 상수 (시뮬레이션용으로 조정)
const timeStep = 0.5; // 시간 단위 (시뮬레이션 속도)

// 시각적 허용을 위한 압축 비율 (실제 비율이 아님)
const scaleSize = 1;
const scaleDist = 20;

// 천체 데이터 (시뮬레이션용 가상 질량, 크기, 거리, 속도)
const planetsData = [
    { name: "태양", radius: 5 * scaleSize, mass: 10000, color: 0xffff00, dist: 0, v: 0, isSun: true },
    { name: "수성", radius: 0.5 * scaleSize, mass: 1, color: 0xaaaaaa, dist: 1 * scaleDist, v: 22 },
    { name: "금성", radius: 1 * scaleSize, mass: 5, color: 0xffcc99, dist: 1.5 * scaleDist, v: 18 },
    { name: "지구", radius: 1.1 * scaleSize, mass: 6, color: 0x3333ff, dist: 2 * scaleDist, v: 15.8 },
    { name: "화성", radius: 0.6 * scaleSize, mass: 0.6, color: 0xff3300, dist: 2.5 * scaleDist, v: 14 },
    { name: "목성", radius: 3 * scaleSize, mass: 1500, color: 0xcc9966, dist: 4 * scaleDist, v: 11 },
    { name: "토성", radius: 2.5 * scaleSize, mass: 400, color: 0xe6e6cc, dist: 5.5 * scaleDist, v: 9.5 },
    { name: "천왕성", radius: 1.8 * scaleSize, mass: 80, color: 0x66ccff, dist: 7 * scaleDist, v: 8 },
    { name: "해왕성", radius: 1.7 * scaleSize, mass: 90, color: 0x3333cc, dist: 8.5 * scaleDist, v: 7.5 }
];

// --- Three.js 초기화 ---
const scene = new THREE.Scene();
// 별이 빛나는 우주 배경 효과
const bgTexture = new THREE.CubeTextureLoader().load([
    // 간단한 검은 우주 배경을 위해 색상만 지정할 수도 있지만, 별을 그리기 위해 파티클 사용 예정
]);

// 카메라 설정
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.set(85, 60, 200); // 전체가 보이도록 초기 우주선 위치 조정

// 렌더러 설정
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 조명 설정
const ambientLight = new THREE.AmbientLight(0x606060); // 기본 약한 빛
scene.add(ambientLight);

// 태양광 (PointLight)
const pointLight = new THREE.PointLight(0xffffff, 2, 500);
pointLight.position.set(0, 0, 0);
scene.add(pointLight);

// --- 천체 생성 ---
const bodies = [];
const sphereGeo = new THREE.SphereGeometry(1, 32, 32);

planetsData.forEach(data => {
    // 재질 생성 (태양은 빛나게, 행성은 빛을 반사하게)
    const material = data.isSun 
        ? new THREE.MeshBasicMaterial({ color: data.color }) 
        : new THREE.MeshStandardMaterial({ color: data.color, roughness: 0.6 });
    
    const mesh = new THREE.Mesh(sphereGeo, material);
    mesh.scale.set(data.radius, data.radius, data.radius);
    
    // 초기 위치 설정 (X축 기준)
    mesh.position.set(data.dist, 0, 0);
    scene.add(mesh);

    // 물리 속성 저장
    bodies.push({
        mesh: mesh,
        mass: data.mass,
        isSun: data.isSun || false,
        velocity: new THREE.Vector3(0, 0, data.v), // Z축 방향으로 초기 속도 부여
        position: new THREE.Vector3(data.dist, 0, 0)
    });
});

// 배경 별 입자 생성
const starGeo = new THREE.BufferGeometry();
const starCount = 2000;
const starPosArray = new Float32Array(starCount * 3);
for(let i=0; i<starCount*3; i++) {
    starPosArray[i] = (Math.random() - 0.5) * 1000;
}
starGeo.setAttribute('position', new THREE.BufferAttribute(starPosArray, 3));
const starMat = new THREE.PointsMaterial({color: 0xffffff, size: 0.5});
const stars = new THREE.Points(starGeo, starMat);
scene.add(stars);


// --- 조작 (우주선 관점) ---
const controls = new PointerLockControls(camera, document.body);

const instructions = document.getElementById('instructions');
const uiContainer = document.getElementById('ui-container');

instructions.addEventListener('click', function () {
    controls.lock();
});

controls.addEventListener('lock', function () {
    instructions.style.display = 'none';
});

controls.addEventListener('unlock', function () {
    instructions.style.display = 'block';
});

// 키보드 상태
const moveState = { forward: false, backward: false, left: false, right: false, up: false, down: false, speedBoost: false };

document.addEventListener('keydown', (e) => {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW': moveState.forward = true; break;
        case 'ArrowLeft':
        case 'KeyA': moveState.left = true; break;
        case 'ArrowDown':
        case 'KeyS': moveState.backward = true; break;
        case 'ArrowRight':
        case 'KeyD': moveState.right = true; break;
        case 'Space': moveState.up = true; break;
        case 'ShiftLeft':
        case 'ShiftRight': moveState.down = true; break;
    }
});

document.addEventListener('keyup', (e) => {
    switch (e.code) {
        case 'ArrowUp':
        case 'KeyW': moveState.forward = false; break;
        case 'ArrowLeft':
        case 'KeyA': moveState.left = false; break;
        case 'ArrowDown':
        case 'KeyS': moveState.backward = false; break;
        case 'ArrowRight':
        case 'KeyD': moveState.right = false; break;
        case 'Space': moveState.up = false; break;
        case 'ShiftLeft':
        case 'ShiftRight': moveState.down = false; break;
    }
});

document.addEventListener('mousedown', (e) => { if (e.button === 0) moveState.speedBoost = true; });
document.addEventListener('mouseup', (e) => { if (e.button === 0) moveState.speedBoost = false; });

// 마우스 휠 확대/축소 (Ctrl 키 조합)
document.addEventListener('wheel', (e) => {
    if (e.ctrlKey) {
        e.preventDefault();
        const zoomSpeed = 2;
        camera.fov += e.deltaY > 0 ? zoomSpeed : -zoomSpeed;
        camera.fov = Math.max(10, Math.min(120, camera.fov));
        camera.updateProjectionMatrix();
    }
}, { passive: false });

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// --- 물리 연산 함수 ---
function updatePhysics() {
    // 모든 천체 쌍에 대해 중력 계산
    for (let i = 0; i < bodies.length; i++) {
        if (bodies[i].isSun) continue; // 태양은 고정

        const bodyA = bodies[i];
        let totalForce = new THREE.Vector3(0, 0, 0);

        for (let j = 0; j < bodies.length; j++) {
            if (i === j) continue;
            
            const bodyB = bodies[j];
            // F = G * (m1 * m2) / r^2
            const distanceVec = new THREE.Vector3().subVectors(bodyB.position, bodyA.position);
            const rSquare = distanceVec.lengthSq();
            
            if (rSquare === 0) continue;

            const forceMag = (G * bodyA.mass * bodyB.mass) / rSquare;
            const forceDir = distanceVec.normalize();
            
            const force = forceDir.multiplyScalar(forceMag);
            totalForce.add(force);
        }

        // a = F / m
        const acceleration = totalForce.divideScalar(bodyA.mass);
        
        // v = v + a * dt
        bodyA.velocity.add(acceleration.multiplyScalar(timeStep));
    }

    // 위치 업데이트
    for (let i = 0; i < bodies.length; i++) {
        if (bodies[i].isSun) continue;
        
        // p = p + v * dt
        const moveVec = bodies[i].velocity.clone().multiplyScalar(timeStep);
        bodies[i].position.add(moveVec);
        
        // Mesh 위치 업데이트
        bodies[i].mesh.position.copy(bodies[i].position);
    }
}

// --- 애니메이션 루프 ---
let prevTime = performance.now();

function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();
    const delta = (time - prevTime) / 1000;

    // 물리 시뮬레이션 업데이트
    updatePhysics();

    // 우주선(카메라) 이동 처리
    if (controls.isLocked === true) {
        // 카메라의 바라보는 방향 계산
        direction.z = Number(moveState.forward) - Number(moveState.backward);
        direction.x = Number(moveState.right) - Number(moveState.left);
        direction.normalize(); // 대각선 이동 시 속도 증가 방지

        let speed = moveState.speedBoost ? 100.0 : 30.0;

        if (moveState.forward || moveState.backward) velocity.z -= direction.z * speed * delta;
        if (moveState.left || moveState.right) velocity.x -= direction.x * speed * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        // 상하 이동 (Y축 독립적 처리)
        if (moveState.up) camera.position.y += speed * delta;
        if (moveState.down) camera.position.y -= speed * delta;

        // 마찰력(감속) 적용
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;
    }

    renderer.render(scene, camera);
    prevTime = time;
}

// 창 크기 조절 대응
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
