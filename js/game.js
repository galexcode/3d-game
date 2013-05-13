  var mesh, scene, camera, renderer;
  var player;
  var input = new InputManager();
  var cameraOffset = new THREE.Vector3(0, 400, 250);

  $(document).ready(function() {
    init();
    gameLoop();
  });

  $(window).resize(onWindowResize);

  function init() {
    initCamera();
    onWindowResize();
    scene = new THREE.Scene();
    mesh = addSphere();
    mesh.position.x = 100;
    addFloor();
    addLight();

    var jsonLoader = new THREE.JSONLoader();
    jsonLoader.load("res/models/android.js", function(geometry, materials) {
      player = addModel(geometry, materials);
      player.position.y = 0;
      player.scale.set(10, 10, 10);
    });

    jsonLoader.load("res/models/fern/fern.js", function(geometry, materials) {
      var fern = addModel(geometry, materials);
      fern.scale.set(100, 100, 100);
    });

    jsonLoader.load("res/models/interior.js", function(geometry, materials) {
      var inside = addModel(geometry, materials);
      inside.position.y = 10;
      inside.scale.set(10, 10, 10);
    });



    document.body.appendChild(renderer.domElement);
  }

  function initCamera() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.copy(cameraOffset);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    camera.locked = true;
    renderer = new THREE.WebGLRenderer();
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setSize(window.innerWidth, window.innerHeight);
  }

  function gameLoop() {
    requestAnimationFrame(gameLoop);
    update();
    draw();
    input.update();
  }

  function update() {
    if (mesh) {
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.02;
    }
    if (player) {
      updatePlayer();
      updateCamera();
    }
    if (input.isKeyTriggered(VK_P)) {
      saveScene();
    }
  }

  function updatePlayer() {
    var speed = 10;
    var left = input.isKeyDown(VK_A);
    var right = input.isKeyDown(VK_D);
    var down = input.isKeyDown(VK_S);
    var up = input.isKeyDown(VK_W);
    var angle;
    if (right) {
      if (up) angle = 135;
      else if (down) angle = 45;
      else angle = 90;
    } else if (left) {
      if (up) angle = -135;
      else if (down) angle = -45;
      else angle = -90;
    } else if (down) {
      angle = 0;
    } else if (up) {
      angle = 180;
    }
    if (angle !== undefined) {
      var angleRad = THREE.Math.degToRad(angle);
      player.rotation.set(0, angleRad, 0);
      var dirAngle = angleRad - Math.PI / 2;
      var direction = new THREE.Vector3(Math.cos(dirAngle), 0, Math.sin(-dirAngle));
      var dist = direction.multiplyScalar(speed);
      player.position.add(dist);
    }
  }

  function updateCamera() {
    if (input.isKeyTriggered(VK_L)) {
      camera.locked = !camera.locked;
      console.log("Camera locked: " + camera.locked);
    }
    if (camera.locked) {
      camera.position.addVectors(cameraOffset, player.position);
      camera.lookAt(player.position);
    } else {
      var speed = 10;
      if (input.isKeyDown(VK_LEFT)) camera.position.x -= speed;
      if (input.isKeyDown(VK_RIGHT)) camera.position.x += speed;
      if (input.isKeyDown(VK_UP)) camera.position.z -= speed;
      if (input.isKeyDown(VK_DOWN)) camera.position.z += speed;
      if (input.isKeyDown(VK_ADD)) camera.position.y -= speed;
      if (input.isKeyDown(VK_SUB)) camera.position.y += speed;
    }
  }

  function saveScene() {
    var exporter = new THREE.ObjectExporter();
    var output = JSON.stringify(exporter.parse(scene), null, '\t');
    output = output.replace(/[\n\t]+([\d\.e\-\[\]]+)/g, '$1');
    var blob = new Blob([output], {
      type: 'text/plain'
    });
    var objectURL = URL.createObjectURL(blob);
    window.open(objectURL, '_blank');
    window.focus();
  }

  function draw() {
    if (scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function addCube() {
    var geometry = new THREE.CubeGeometry(200, 200, 200);
    var material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      wireframe: true
    });

    var cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    return mesh;
  }

  function addSphere() {
    // set up the sphere vars
    var radius = 50,
      segments = 16,
      rings = 16;

    // create the sphere's material
    var sphereMaterial = new THREE.MeshLambertMaterial({
      color: 0xff0000
    });

    var sphere = new THREE.Mesh(

    new THREE.SphereGeometry(
    radius,
    segments,
    rings),

    sphereMaterial);

    // add the sphere to the scene
    scene.add(sphere);
    return sphere;
  }

  function addLight() {
    // create a point light
    var pointLight = new THREE.PointLight(0xffffff);

    // set its position
    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 130;

    // add to the scene
    scene.add(pointLight);
    return pointLight;
  }

  function addFloor() {
    var floorTexture = new THREE.ImageUtils.loadTexture('res/images/grass.png');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(40, 40);
    // DoubleSide: render texture on both sides of mesh
    var floorMaterial = new THREE.MeshPhongMaterial({
      map: floorTexture,
      side: THREE.DoubleSide
    });
    var floorGeometry = new THREE.PlaneGeometry(5000, 5000, 1, 1);
    var floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = 0;
    floor.rotation.x = Math.PI / 2;
    scene.add(floor);
  }

  function addModel(geometry, materials) {
    var material = new THREE.MeshFaceMaterial(materials);
    var model = new THREE.Mesh(geometry, material);
    scene.add(model);
    return model;
  }